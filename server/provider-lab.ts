import { providerLease } from "./provider-settings-gate.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Store } from "./store.js";
import type { ProviderId } from "./types.js";
import { config, providerRpm, providerEstimate } from "./config.js";
import { search, scrape, ProviderError } from "./providers.js";
import { digest } from "./observation-store.js";
import { ObservationError } from "./observation.js";
import {
  providerRegistry,
  registeredProviderSchema,
  registeredProviderIds,
} from "./provider-adapters.js";
import { providerAccountForCall } from "./provider-accounts.js";
import { replayProviderRun } from "./provider-lab-replay.js";
import { ProviderLabSuites } from "./provider-lab-suites.js";
import {
  suiteCases,
  suiteVersion,
  suiteMethodology,
} from "./provider-lab-suite.js";
import type {
  LabRun,
  Experiment,
  ControlledSample,
} from "./provider-lab-types.js";
const provider = registeredProviderSchema;
export const labRunInput = z
  .object({
    requestKey: z.string().trim().min(1).max(120),
    providers: z
      .array(provider)
      .min(1)
      .max(registeredProviderSchema.options.length)
      .refine((v) => new Set(v).size === v.length, "Choose each provider once"),
    suiteId: z.string().min(1).max(120).optional(),
    suiteRevision: z.number().int().positive().optional(),
  })
  .strict();
export const labReviewInput = z
  .object({
    verdict: z.enum(["useful", "partial", "not_useful", "unknown"]),
    note: z.string().trim().min(10).max(3000),
    author: z
      .enum(["human_reported", "assistant_reported", "unspecified"])
      .default("unspecified"),
  })
  .strict();
export const experimentInput = z
  .object({
    provider,
    verification: z
      .enum(["retrieval", "agent_choice", "integration"])
      .default("retrieval"),
    title: z.string().trim().min(3).max(160),
    hypothesis: z.string().trim().min(10).max(3000),
    change: z.string().trim().min(10).max(3000),
    successMeasure: z.string().trim().min(10).max(3000),
    status: z.enum(["planned", "testing", "reviewed"]).default("planned"),
    baselineRunId: z.string().uuid().nullable().default(null),
    followupRunId: z.string().uuid().nullable().default(null),
    conclusion: z.string().trim().max(3000).default(""),
  })
  .strict();
export { measure, labMeasurements } from "./provider-lab-metrics.js";
import { measure, labMeasurements } from "./provider-lab-metrics.js";
export class ProviderLab {
  active = new Set<string>();
  suites: ProviderLabSuites;
  constructor(
    private store: Store,
    private adapters = { search, scrape },
    private timestamps = new Map<ProviderId, number[]>(),
  ) {
    this.suites = new ProviderLabSuites(store);
  }
  async list(): Promise<LabRun[]> {
    return (
      await this.store.db
        .prepare("SELECT body FROM provider_lab_runs ORDER BY rowid DESC")
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  async summaries(): Promise<LabRun[]> {
    // Keep large captured pages out of recurring dashboard reads.
    return (
      await this.store.db
        .prepare(
          `SELECT json_set(body,'$.calls',json((
      SELECT json_group_array(json_remove(value,'$.result'))
      FROM json_each(provider_lab_runs.body,'$.calls')
    ))) AS body FROM provider_lab_runs ORDER BY rowid DESC`,
        )
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  async controlledSamples(): Promise<
    Partial<Record<ProviderId, ControlledSample>>
  > {
    const runs = await this.summaries();
    return Object.fromEntries(
      registeredProviderIds.flatMap((provider) => {
        const run = runs.find(
          (r) =>
            r.source === "live_controlled" &&
            r.status === "completed" &&
            r.calls.some(
              (c) =>
                c.provider === provider &&
                ["succeeded", "failed"].includes(c.status),
            ),
        );
        if (!run) return [];
        const m = labMeasurements([run]).find((m) => m.provider === provider)!;
        return [
          [
            provider,
            {
              source: "backend_forced",
              runId: run.id,
              suiteVersion: run.suiteVersion,
              completedAt: run.finishedAt!,
              attempted: m.attempted,
              succeeded: m.succeeded,
              referencePassed: m.referencePassed,
              referenceKnown: m.referenceKnown,
              reviewed: m.reviewed,
              useful: m.useful,
              partial: m.partial,
              limitations:
                "Versioned diagnostic cases, forced by the backend. Reference checks are not factual accuracy. Usefulness verdicts are attributed reports, not independent verification. Small sample; no general quality ranking or organic preference is established.",
            },
          ],
        ];
      }),
    );
  }
  async get(id: string): Promise<LabRun> {
    const row = await this.store.db
      .prepare("SELECT body FROM provider_lab_runs WHERE id=?")
      .get(id);
    if (!row) throw new ObservationError(404, "Test run not found.");
    return JSON.parse(row.body as string);
  }
  private async save(run: LabRun) {
    run.revision = (run.revision ?? 0) + 1;
    await this.store.db
      .prepare(
        "INSERT INTO provider_lab_runs VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(run.id, run.requestKey, JSON.stringify(run));
  }
  async recover() {
    await this.store.db.atomic(async () => {
      for (const run of (await this.list()).filter(
        (r) => r.status === "running",
      )) {
        for (const c of run.calls) {
          if (c.status === "running") {
            c.status = "interrupted";
            c.error =
              "Server stopped before a receipt was saved. The reserved estimate is consumed conservatively; no automatic retry.";
            c.finishedAt = new Date().toISOString();
            await this.store.allowance.settle(c.id);
            run.spentMicros += c.estimateMicros;
          } else if (c.status === "pending") c.status = "skipped";
        }
        run.reservedMicros = 0;
        run.status = "interrupted";
        run.finishedAt = new Date().toISOString();
        await this.save(run);
      }
    });
  }
  async overview() {
    const runs = await this.summaries();
    const dailyCommittedMicros = this.committedToday(runs);
    return {
      operatorAllowance: await this.store.allowance.status(),
      suiteVersion,
      methodology: suiteMethodology,
      cases: suiteCases,
      suites: await this.suites.list(),
      backendBudgetMicros: config.providerTestBudgetMicros,
      dailyBudgetMicros: config.providerTestDailyBudgetMicros,
      dailyCommittedMicros,
      dailyRemainingMicros: Math.max(
        0,
        config.providerTestDailyBudgetMicros - dailyCommittedMicros,
      ),
      providers: registeredProviderIds.map((id) => ({
        id,
        enabled: providerRegistry.credentialStatus(
          providerRegistry.forProvider(id).tool,
        ).enabled,
        configured: providerRegistry.credentialStatus(
          providerRegistry.forProvider(id).tool,
        ).configured,
        adapterVersion: providerRegistry.forProvider(id).version,
        estimateMicros: providerEstimate(id),
        plannedCalls: 5,
      })),
      runs,
      measurements: labMeasurements(
        runs.filter((r) => r.source === "live_controlled"),
      ),
      experiments: await this.experiments(),
    };
  }
  private committedToday(runs: LabRun[]) {
    const today = new Date().toISOString().slice(0, 10);
    return runs
      .filter((r) => r.createdAt.startsWith(today))
      .reduce(
        (n, r) =>
          n + (r.status === "running" ? r.plannedMicros : r.spentMicros),
        0,
      );
  }
  async start(raw: unknown) {
    const release = providerLease();
    let handedOff = false;
    try {
      return await this.startCurrent(raw, release, () => {
        handedOff = true;
      });
    } catch (error) {
      if (!handedOff) release();
      throw error;
    }
  }
  private async startCurrent(
    raw: unknown,
    release: () => void,
    handOff: () => void,
  ) {
    const admitted = await this.store.transaction(async () => {
      const input = labRunInput.parse(raw);
      const providers = [...input.providers].sort() as ProviderId[];
      const suite = await this.suites.get(input.suiteId, input.suiteRevision);
      const version = suite.builtIn
        ? suiteVersion
        : `${suite.id}@${suite.revision}`;
      const signature = digest({ providers, suiteVersion: version });
      const existing = await this.store.db
        .prepare("SELECT body FROM provider_lab_runs WHERE request_key=?")
        .get(input.requestKey);
      if (existing) {
        const run = JSON.parse(existing.body as string) as LabRun;
        if (run.signature !== signature)
          throw new ObservationError(
            409,
            "This request key belongs to a different test plan.",
          );
        return { run, created: false };
      }
      const priorRuns = await this.summaries();
      if (this.active.size || priorRuns.some((r) => r.status === "running"))
        throw new ObservationError(
          409,
          "A controlled test is already running. Wait for it to finish or stop it.",
        );
      if (
        providers.some(
          (p) =>
            !providerRegistry.credentialStatus(
              providerRegistry.forProvider(p).tool,
            ).enabled ||
            !providerRegistry.credentialStatus(
              providerRegistry.forProvider(p).tool,
            ).configured,
        )
      )
        throw new ObservationError(
          409,
          "Configure every selected provider on the backend before running a live test.",
        );
      const cases = suite.cases.filter((c) =>
        providers.some(
          (p) => providerRegistry.forProvider(p).operation === c.kind,
        ),
      );
      if (
        providers.some(
          (p) =>
            !cases.some(
              (c) => providerRegistry.forProvider(p).operation === c.kind,
            ),
        )
      )
        throw new ObservationError(
          400,
          "Each selected provider needs at least one compatible case in the suite.",
        );
      const offset = priorRuns.length % 2;
      const calls = cases.flatMap((c, i) => {
        const order = providers.filter(
          (p) => providerRegistry.forProvider(p).operation === c.kind,
        );
        if ((i + offset) % 2) order.reverse();
        return order.map((p) => ({
          id: randomUUID(),
          caseId: c.id,
          provider: p,
          status: "pending" as const,
          adapter: providerRegistry.snapshot(
            providerRegistry.forProvider(p).tool,
          ),
          estimateMicros: providerRegistry.estimate(
            providerRegistry.forProvider(p).tool,
            c.kind === "search" ? { query: c.input } : { url: c.input },
          ).estimatedMicros,
          reviews: [],
        }));
      });
      const plannedMicros = calls.reduce((n, c) => n + c.estimateMicros, 0);
      await this.store.allowance.assert(plannedMicros);
      if (plannedMicros > config.providerTestBudgetMicros)
        throw new ObservationError(
          409,
          "The test plan exceeds the backend test budget. Choose fewer providers or have the operator adjust backend policy.",
        );
      const daily = this.committedToday(priorRuns);
      if (daily + plannedMicros > config.providerTestDailyBudgetMicros)
        throw new ObservationError(
          409,
          "The backend daily test allowance is exhausted. No provider calls were started.",
        );
      const run: LabRun = {
        id: randomUUID(),
        requestKey: input.requestKey,
        signature,
        title: suite.title,
        source: "live_controlled",
        suiteId: suite.id,
        suiteRevision: suite.revision,
        suiteVersion: version,
        suiteHash: digest(cases),
        status: "running",
        cancelRequested: false,
        providers,
        createdAt: new Date().toISOString(),
        authorizationSource: "backend_policy",
        budgetMicros: config.providerTestBudgetMicros,
        plannedMicros,
        spentMicros: 0,
        reservedMicros: 0,
        rateCardVersion: config.rateCardVersion,
        adapterSnapshot: Object.fromEntries(
          providerRegistry
            .list()
            .map((a) => [
              a.tool,
              { ...a.capabilities.adapter, version: a.version },
            ]),
        ),
        cases,
        calls,
      };
      await this.save(run);
      return { run, created: true };
    });
    const { run, created } = admitted;
    if (!created) {
      release();
      return run;
    }
    this.active.add(run.id);
    handOff();
    void this.execute(run.id)
      .catch(async () => {
        try {
          await this.store.db.atomic(async () => {
            const failed = await this.get(run.id);
            failed.status = "interrupted";
            failed.finishedAt = new Date().toISOString();
            for (const c of failed.calls) {
              if (c.status === "running") {
                c.status = "interrupted";
                c.finishedAt = new Date().toISOString();
                c.error =
                  "Execution stopped before settlement could be saved. No automatic retry.";
                await this.store.allowance.settle(c.id);
                failed.spentMicros += c.estimateMicros;
              } else if (c.status === "pending") c.status = "skipped";
            }
            failed.reservedMicros = 0;
            await this.save(failed);
          });
        } catch {
          // Preserve the durable reservation for startup recovery if storage is unavailable.
          console.error(
            "Provider lab could not persist settlement; the saved reservation requires startup recovery.",
          );
        }
      })
      .finally(() => {
        this.active.delete(run.id);
        release();
      });
    return await this.get(run.id);
  }
  private async execute(id: string) {
    for (const planned of (await this.get(id)).calls) {
      const admission = await this.store.db.atomic(async () => {
        const run = await this.get(id);
        if (run.cancelRequested) return { cancelled: true } as const;
        const call = run.calls.find((c) => c.id === planned.id)!;
        if (call.status !== "pending") return { skipped: true } as const;
        const now = Date.now();
        this.timestamps.set(
          call.provider,
          (this.timestamps.get(call.provider) || []).filter(
            (t) => now - t < 60000,
          ),
        );
        if (
          this.timestamps.get(call.provider)!.length >=
          providerRpm(call.provider)
        ) {
          call.status = "skipped";
          call.error = "Shared provider rate limit reached. Not retried.";
          await this.save(run);
          return { skipped: true } as const;
        }
        if (
          run.spentMicros + run.reservedMicros + call.estimateMicros >
          run.budgetMicros
        )
          throw new Error("Test ledger would exceed its cap");
        await this.store.allowance.reserve(
          call.id,
          "provider_lab",
          call.estimateMicros,
        );
        call.status = "running";
        call.providerAccountReference = await providerAccountForCall(
          this.store,
          providerRegistry.forProvider(call.provider).tool,
        );
        call.startedAt = new Date().toISOString();
        run.reservedMicros += call.estimateMicros;
        await this.save(run);
        this.timestamps.get(call.provider)!.push(now);
        return {
          call: { ...call },
          test: run.cases.find((c) => c.id === call.caseId)!,
          now,
        };
      });
      if ("cancelled" in admission) break;
      if ("skipped" in admission) continue;
      const { call, test, now } = admission;
      let result: Record<string, unknown> | undefined,
        error: string | undefined,
        httpStatus: number | undefined;
      try {
        result = await providerRegistry.execute(
          providerRegistry.forProvider(call.provider).tool,
          test.kind === "search" ? { query: test.input } : { url: test.input },
          call.id,
          this.adapters,
        );
        httpStatus = result.httpStatus as number;
      } catch (e) {
        error =
          e instanceof ProviderError ? e.message : "Provider request failed.";
        httpStatus = e instanceof ProviderError ? e.httpStatus : undefined;
      }
      await this.store.db.atomic(async () => {
        const run = await this.get(id),
          settled = run.calls.find((c) => c.id === call.id)!;
        if (settled.status !== "running") return;
        Object.assign(settled, {
          status: error ? "failed" : "succeeded",
          finishedAt: new Date().toISOString(),
          latencyMs: Date.now() - now,
          error,
          httpStatus,
          ...(result ? { result, measurements: measure(test, result) } : {}),
        });
        await this.store.allowance.settle(call.id);
        run.reservedMicros -= call.estimateMicros;
        run.spentMicros += call.estimateMicros;
        await this.save(run);
      });
    }
    await this.store.db.atomic(async () => {
      const run = await this.get(id);
      for (const c of run.calls)
        if (c.status === "pending") c.status = "skipped";
      run.status = run.cancelRequested ? "cancelled" : "completed";
      run.finishedAt = new Date().toISOString();
      await this.save(run);
    });
  }
  async cancel(id: string) {
    return this.store.db.atomic(async () => {
      const run = await this.get(id);
      if (run.status === "running") {
        run.cancelRequested = true;
        await this.save(run);
      }
      return run;
    });
  }
  async replay(raw: unknown) {
    return this.store.db.atomic(() =>
      replayProviderRun(this, raw, (run) => this.save(run)),
    );
  }
  async review(id: string, callId: string, raw: unknown) {
    return this.store.db.atomic(async () => {
      const input = labReviewInput.parse(raw);
      const run = await this.get(id);
      const call = run.calls.find((c) => c.id === callId);
      if (!call) throw new ObservationError(404, "Test receipt not found.");
      if (["pending", "running", "skipped"].includes(call.status))
        throw new ObservationError(
          409,
          "This call has no settled receipt to review.",
        );
      call.reviews.push({ ...input, at: new Date().toISOString() });
      await this.save(run);
      return run;
    });
  }
  async experiments(): Promise<Experiment[]> {
    return (
      await this.store.db
        .prepare("SELECT body FROM provider_experiments ORDER BY rowid DESC")
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  async pruneOlderThan(cutoff: string) {
    return await this.store.transaction(async () => {
      const plans = await this.store.db
        .prepare(
          "DELETE FROM provider_experiments WHERE json_extract(body,'$.status')='reviewed' AND json_extract(body,'$.updatedAt') < ?",
        )
        .run(cutoff);
      const linked = new Set(
        (await this.experiments())
          .flatMap((p) => [p.baselineRunId, p.followupRunId])
          .filter(Boolean),
      );
      // Keep the original receipts for as long as a replay refers to them.
      for (const run of await this.summaries())
        if (run.sourceRunId) linked.add(run.sourceRunId);
      let runs = 0;
      for (const run of await this.summaries()) {
        const updated = [
          run.createdAt,
          run.finishedAt ?? run.createdAt,
          ...run.calls.flatMap((c) => c.reviews.map((r) => r.at)),
        ]
          .sort()
          .at(-1)!;
        if (
          run.status !== "running" &&
          !linked.has(run.id) &&
          updated < cutoff
        ) {
          await this.store.db
            .prepare("DELETE FROM provider_lab_runs WHERE id=?")
            .run(run.id);
          runs++;
        }
      }
      return { runs, plans: Number(plans.changes) };
    });
  }
  async saveExperiment(raw: unknown, id?: string) {
    const input = experimentInput.parse(raw);
    const old = id
      ? (await this.experiments()).find((e) => e.id === id)
      : undefined;
    if (id && !old) throw new ObservationError(404, "Test plan not found.");
    if (
      input.verification === "agent_choice" &&
      (input.baselineRunId || input.followupRunId)
    )
      throw new ObservationError(
        400,
        "Forced-provider runs cannot verify agent choice. Record external-agent evidence in the plan instead.",
      );
    if (input.followupRunId && input.followupRunId === input.baselineRunId)
      throw new ObservationError(
        400,
        "Choose two different runs for a comparison.",
      );
    for (const rid of [input.baselineRunId, input.followupRunId])
      if (rid) {
        const run = await this.get(rid);
        if (
          run.status !== "completed" ||
          !run.providers.includes(input.provider)
        )
          throw new ObservationError(
            400,
            "Choose a completed run that includes this provider.",
          );
      }
    if (input.status === "reviewed" && input.conclusion.length < 10)
      throw new ObservationError(
        400,
        "Record what the comparison supports, including uncertainty.",
      );
    const at = new Date().toISOString();
    const experiment: Experiment = {
      ...input,
      id: old?.id || randomUUID(),
      createdAt: old?.createdAt || at,
      updatedAt: at,
    };
    await this.store.db
      .prepare(
        "INSERT INTO provider_experiments VALUES(?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(experiment.id, JSON.stringify(experiment));
    return experiment;
  }
}
