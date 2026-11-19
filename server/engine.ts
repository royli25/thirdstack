import type { SearchProviderId } from "./provider-catalog.js";
import { providerWork } from "./provider-settings-gate.js";
import { randomUUID } from "node:crypto";
import { publicEvidenceUrl } from "./url-policy.js";
import {
  config,
  providerEnabled,
  providerRpm,
  providerEstimate,
  providerAuthMode,
} from "./config.js";
import { candidates, coverage } from "./router.js";
import { ProviderError, search, scrape } from "./providers.js";
import type { Store } from "./store.js";
import type { ProviderId, Source, Task } from "./types.js";
export class Engine {
  active = new Set<string>();
  keylessBlocked = false;
  keylessAttempts = 0;
  providerIssues() {
    return this.keylessBlocked
      ? {
          firecrawl:
            "Keyless allowance refused; sign in and configure a key before continuing",
        }
      : this.keylessAttempts >= config.keylessMaxRequests
        ? {
            firecrawl:
              "Keyless session safety cap reached; review the allowance or configure a key",
          }
        : {};
  }
  cancelled = new Set<string>();
  async cancel(taskId: string) {
    if (!this.active.has(taskId)) return false;
    this.cancelled.add(taskId);
    await this.store.event(taskId, "cancellation_requested", {
      reason: "User requested stop; in-flight vendor calls must still settle",
    });
    return true;
  }
  timestamps = new Map<ProviderId, number[]>();
  constructor(public store: Store) {}
  available() {
    return Object.fromEntries(
      Object.entries(config.keys).map(([k, v]) => [
        k,
        providerEnabled(k as ProviderId) &&
          (Boolean(v) ||
            (k === "firecrawl" &&
              config.allowKeylessFirecrawl &&
              !this.keylessBlocked &&
              this.keylessAttempts < config.keylessMaxRequests)),
      ]),
    ) as Record<ProviderId, boolean>;
  }
  limited() {
    const now = Date.now();
    const set = new Set<ProviderId>();
    for (const [id, times] of this.timestamps) {
      const recent = times.filter((t) => now - t < 60000);
      this.timestamps.set(id, recent);
      if (recent.length >= providerRpm(id)) set.add(id);
    }
    return set;
  }
  async reserve(
    taskId: string,
    provider: ProviderId,
    callId: string,
    capability: string,
    args: object,
  ) {
    return await this.store.transaction(async () => {
      const task = (await this.store.get(taskId))!;
      if (
        (await this.store.events(taskId)).filter(
          (e) => e.type === "provider_request",
        ).length >= 50
      )
        throw new Error("Task safety cap of 50 provider attempts reached");
      if (
        providerAuthMode(provider) === "keyless" &&
        (this.keylessBlocked ||
          this.keylessAttempts >= config.keylessMaxRequests)
      )
        throw new Error(
          "Keyless access needs manual review or a configured key",
        );
      const estimate = providerEstimate(provider);
      if (
        task.spentMicros + task.reservedMicros + estimate >
        task.intent.budgetMicros
      )
        throw new Error("Remaining budget is insufficient");
      if (this.limited().has(provider))
        throw new Error("Provider rate limit reached");
      await this.store.allowance.reserve(callId, "task", estimate);
      task.reservedMicros += estimate;
      await this.store.save(task);
      await this.store.event(
        taskId,
        "budget_reserved",
        {
          provider,
          estimateMicros: estimate,
          chargeType:
            providerAuthMode(provider) === "keyless" ? "free-tier" : "estimate",
          authMode: providerAuthMode(provider),
          rateCardVersion: config.rateCardVersion,
        },
        callId,
      );
      await this.store.event(
        taskId,
        "provider_request",
        { provider, capability, arguments: args, credentialsRedacted: true },
        callId,
      );
      if (providerAuthMode(provider) === "keyless") this.keylessAttempts++;
      this.timestamps.set(provider, [
        ...(this.timestamps.get(provider) || []),
        Date.now(),
      ]);
      return estimate;
    });
  }
  async settle(
    taskId: string,
    callId: string,
    provider: ProviderId,
    estimate: number,
    response: object,
    sources?: Source[],
  ) {
    await this.store.transaction(async () => {
      if (
        (await this.store.events(taskId)).some(
          (e) => e.type === "budget_settled" && e.callId === callId,
        )
      )
        return;
      const reservation = (await this.store.events(taskId)).find(
        (e) => e.type === "budget_reserved" && e.callId === callId,
      );
      if (
        !reservation ||
        reservation.data.provider !== provider ||
        reservation.data.estimateMicros !== estimate
      )
        throw new Error("Unknown or mismatched budget reservation");
      const task = (await this.store.get(taskId))!;
      if (task.reservedMicros < estimate)
        throw new Error("Budget reservation balance is inconsistent");
      await this.store.allowance.settle(callId);
      if (sources) task.sources.push(...sources);
      task.reservedMicros -= estimate;
      task.spentMicros += estimate;
      await this.store.save(task);
      await this.store.event(
        taskId,
        "provider_response",
        { provider, ...response, quality: null },
        callId,
      );
      await this.store.event(
        taskId,
        "budget_settled",
        {
          provider,
          estimateMicros: estimate,
          chargeType:
            providerAuthMode(provider) === "keyless" ? "free-tier" : "estimate",
          authMode: providerAuthMode(provider),
          billingStatus:
            providerAuthMode(provider) === "keyless"
              ? "keyless-free-tier"
              : "unverified",
          rateCardVersion: config.rateCardVersion,
        },
        callId,
      );
    });
  }
  async execute(taskId: string, queryOrPlan: string | string[]) {
    return providerWork(() => this.executeCurrent(taskId, queryOrPlan));
  }
  private async executeCurrent(taskId: string, queryOrPlan: string | string[]) {
    let anySuccess = false;
    let anyCoverage = false;
    let completedQueries = 0;
    try {
      const queries = Array.isArray(queryOrPlan) ? queryOrPlan : [queryOrPlan];
      await this.store.event(taskId, "plan_started", {
        queryCount: queries.length,
        planner: "explicit-user-plan-v1",
        maxPaidAttempts: queries.length * 2,
      });
      for (const [queryIndex, query] of queries.entries()) {
        if (this.cancelled.has(taskId)) break;
        const initial = (await this.store.get(taskId))!;
        if (
          (await this.store.events(taskId)).filter(
            (e) => e.type === "provider_request",
          ).length >= 50
        ) {
          await this.store.event(taskId, "route_blocked", {
            reason: "Task safety cap of 50 provider attempts reached",
          });
          break;
        }
        const invocationId = randomUUID();
        await this.store.event(taskId, "tool_invoked", {
          invocationId,
          queryIndex,
          capability: "research.search",
          arguments: { query, domains: initial.intent.domains },
          mode: initial.intent.mode,
        });
        let querySuccesses = 0;
        let queryCoverage = false;
        const attempted = new Set<ProviderId>();
        for (let i = 0; i < 2; i++) {
          if (this.cancelled.has(taskId)) break;
          if (
            (await this.store.events(taskId)).filter(
              (e) => e.type === "provider_request",
            ).length >= 50
          ) {
            await this.store.event(taskId, "route_blocked", {
              reason: "Task safety cap of 50 provider attempts reached",
            });
            break;
          }
          const task = (await this.store.get(taskId))!;
          const all = candidates(
            task.intent,
            task.intent.budgetMicros - task.spentMicros - task.reservedMicros,
            await this.store.observations(),
            this.available(),
            this.limited(),
          );
          for (const c of all)
            if (attempted.has(c.provider)) {
              c.eligible = false;
              c.reasons.push("Already attempted for this invocation");
            }
          await this.store.event(taskId, "provider_candidates", {
            invocationId,
            candidates: all,
            policyVersion: config.policyVersion,
          });
          const selected = all.find((c) => c.eligible);
          if (!selected) {
            await this.store.event(taskId, "route_blocked", {
              reason:
                "No eligible provider; inspect credentials, budget, or rate limits.",
            });
            break;
          }
          attempted.add(selected.provider);
          const callId = randomUUID();
          await this.store.event(
            taskId,
            "route_selected",
            {
              invocationId,
              provider: selected.provider,
              score: selected.score,
              components: selected.components,
              insufficientData: selected.insufficientData,
              reason:
                "Highest eligible weighted score; stable provider ID breaks ties",
              policyVersion: config.policyVersion,
            },
            callId,
          );
          const estimate = await this.reserve(
            taskId,
            selected.provider,
            callId,
            "research.search",
            { query, domains: task.intent.domains },
          );
          const start = Date.now();
          let passed = false;
          try {
            const result = await search(
              selected.provider as SearchProviderId,
              query,
              task.intent.domains,
              callId,
            );
            const check = coverage(result.sources);
            passed = check.pass;
            anyCoverage ||= passed;
            anySuccess = true;
            querySuccesses++;
            queryCoverage ||= passed;
            await this.settle(
              taskId,
              callId,
              selected.provider,
              estimate,
              {
                invocationId,
                success: true,
                httpStatus: result.httpStatus,
                latencyMs: Date.now() - start,
                resultCount: result.sources.length,
                returnedRefs: result.sources.map((s) => s.url),
                requestId: result.requestId,
                usage: result.usage,
              },
              result.sources,
            );
            await this.store.event(
              taskId,
              "outcome_evaluated",
              { ...check, invocationId },
              callId,
            );
          } catch (e) {
            const err =
              e instanceof ProviderError ? e : new ProviderError("network");
            await this.settle(taskId, callId, selected.provider, estimate, {
              invocationId,
              success: false,
              httpStatus: err.httpStatus ?? null,
              error: err.message,
              latencyMs: Date.now() - start,
              resultCount: 0,
            });
            await this.store.event(
              taskId,
              "outcome_evaluated",
              {
                invocationId,
                pass: false,
                taskCriteria: "unknown",
                reason: "Provider execution failed",
              },
              callId,
            );
          }
          if (task.intent.mode === "route" && passed) break;
          if (i === 0)
            await this.store.event(
              taskId,
              task.intent.mode === "compare"
                ? "comparison_requested"
                : "fallback_triggered",
              {
                reason:
                  task.intent.mode === "compare"
                    ? "User opted into two paid calls"
                    : "Provider error or insufficient evidence coverage",
                invocationId,
                budgetCheckedOnNextRoute: true,
              },
            );
        }
        if (
          queryCoverage &&
          (initial.intent.mode !== "compare" || querySuccesses === 2)
        )
          completedQueries++;
      }
      await this.store.db.atomic(async () => {
        const final = (await this.store.get(taskId))!;
        final.status = this.cancelled.has(taskId)
          ? "partial"
          : anySuccess
            ? !anyCoverage || completedQueries < queries.length
              ? "partial"
              : "complete"
            : "failed";
        final.updatedAt = new Date().toISOString();
        await this.store.save(final);
        await this.store.event(taskId, "run_finished", {
          status: final.status,
          taskCriteria: "unknown",
          note: "Review sources against the intent rubric. API completion does not mean task completion.",
        });
      });
    } catch {
      await this.store.db.atomic(async () => {
        const task = (await this.store.get(taskId))!;
        task.status = "partial";
        task.error = "Run interrupted. Inspect the trace before retrying.";
        await this.store.save(task);
        await this.store.event(taskId, "run_error", { reason: task.error });
      });
    } finally {
      this.active.delete(taskId);
      this.cancelled.delete(taskId);
    }
  }
  async fetchUrl(task: Task, sourceId: string) {
    return providerWork(() => this.fetchCurrent(task, sourceId));
  }
  private async fetchCurrent(task: Task, sourceId: string) {
    const source = task.sources.find((s) => s.id === sourceId);
    if (!source) throw new Error("Unknown source");
    publicEvidenceUrl(source.url, task.intent.domains);
    if (!this.available().firecrawl)
      throw new Error(
        "Configure Firecrawl or explicitly enable its documented keyless tier",
      );
    const callId = randomUUID();
    await this.store.event(
      task.id,
      "route_selected",
      {
        provider: "firecrawl",
        capability: "research.fetch_url",
        reason:
          "Configured extraction adapter; separate capability from search",
        policyVersion: config.policyVersion,
      },
      callId,
    );
    const estimate = await this.reserve(
      task.id,
      "firecrawl",
      callId,
      "research.fetch_url",
      { url: source.url },
    );
    const start = Date.now();
    try {
      const result = await scrape(source.url);
      await this.settle(task.id, callId, "firecrawl", estimate, {
        success: true,
        httpStatus: result.httpStatus,
        latencyMs: Date.now() - start,
        resultCount: 1,
        returnedRefs: [source.url],
        authMode: providerAuthMode("firecrawl"),
        pageStatus: result.pageStatus,
        usage: {
          credits: result.credits,
          source: "provider response; credits are not USD charges",
        },
      });
      await this.store.db.atomic(async () => {
        const fresh = (await this.store.get(task.id))!;
        const s = fresh.sources.find((s) => s.id === sourceId)!;
        const changed =
          s.snippet !== result.text ||
          s.extraction?.pageStatus !== result.pageStatus;
        s.snippet = result.text;
        s.extraction = {
          provider: "firecrawl",
          callId,
          at: new Date().toISOString(),
          pageStatus: result.pageStatus,
          authMode: providerAuthMode("firecrawl"),
        };
        if (s.provider === "user" && result.title) s.title = result.title;
        if (changed) {
          s.contentVersion = (s.contentVersion ?? 1) + 1;
          for (const assessment of fresh.assessments) {
            const affected = fresh.intent.criteria.filter((c) =>
              (assessment.evidence?.[c] || [assessment.sourceId]).includes(
                sourceId,
              ),
            );
            if (!affected.length) continue;
            for (const c of affected) assessment.criteria[c] = "unknown";
            assessment.disposition = "pending";
            assessment.updatedAt = new Date().toISOString();
            await this.store.event(
              task.id,
              "assessment_invalidated",
              {
                sourceId: assessment.sourceId,
                changedSourceId: sourceId,
                criteria: affected,
                reason:
                  "Referenced evidence content changed; human re-review required",
              },
              callId,
            );
          }
        }
        await this.store.save(fresh);
        await this.store.event(
          task.id,
          "extraction_received",
          {
            sourceId,
            characters: result.text.length,
            taskCriteria: "unknown",
            pageStatus: result.pageStatus,
            evidenceUsable:
              result.text.trim().length > 0 &&
              !(result.pageStatus && result.pageStatus >= 400),
          },
          callId,
        );
      });
    } catch (e) {
      const err = e instanceof ProviderError ? e : new ProviderError("network");
      if (err.kind === "human_required") this.keylessBlocked = true;
      await this.settle(task.id, callId, "firecrawl", estimate, {
        success: false,
        httpStatus: err.httpStatus ?? null,
        latencyMs: Date.now() - start,
        error: err.message,
        resultCount: 0,
      });
      throw err;
    }
  }
}
