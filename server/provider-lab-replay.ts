import { providerOperation } from "./provider-catalog.js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { digest } from "./observation-store.js";
import { ObservationError } from "./observation.js";
import { measure } from "./provider-lab-metrics.js";
import type { ProviderLab } from "./provider-lab.js";
import type { LabRun } from "./provider-lab-types.js";

export async function replayProviderRun(
  lab: ProviderLab,
  raw: unknown,
  save: (run: LabRun) => Promise<void>,
) {
  const input = z
    .object({
      requestKey: z.string().trim().min(1).max(120),
      sourceRunId: z.string().uuid(),
      suiteId: z.string().min(1).max(120),
      suiteRevision: z.number().int().positive(),
    })
    .strict()
    .parse(raw);
  const signature = digest({
    mode: "replay",
    sourceRunId: input.sourceRunId,
    suiteId: input.suiteId,
    suiteRevision: input.suiteRevision,
  });
  const existing = (await lab.summaries()).find(
    (r) => r.requestKey === input.requestKey,
  );
  if (existing) {
    if (existing.signature !== signature)
      throw new ObservationError(
        409,
        "This request key belongs to a different test plan.",
      );
    return lab.get(existing.id);
  }
  const source = await lab.get(input.sourceRunId);
  if (source.source !== "live_controlled" || source.status !== "completed")
    throw new ObservationError(
      409,
      "Choose a completed live controlled run to replay.",
    );
  const suite = await lab.suites.get(input.suiteId, input.suiteRevision);
  const cases = suite.cases.filter((c) =>
    source.providers.some((p) => c.kind === (providerOperation(p) ?? "search")),
  );
  if (
    !cases.length ||
    cases.some(
      (c) =>
        !source.cases.some(
          (old) =>
            old.id === c.id && old.kind === c.kind && old.input === c.input,
        ),
    )
  )
    throw new ObservationError(
      409,
      "Replay requires matching case IDs, operations, and inputs. Change only references, text markers, or case labels; run changed inputs live.",
    );
  const calls = source.calls
    .filter((c) => cases.some((t) => t.id === c.caseId))
    .map((c) => {
      const result = c.result ? structuredClone(c.result) : undefined;
      // This run incurs no usage. The original provider usage remains on its source receipt.
      if (result) {
        delete result.usage;
        delete result.credits;
      }
      return {
        id: randomUUID(),
        sourceCallId: c.id,
        caseId: c.caseId,
        provider: c.provider,
        status: c.status,
        estimateMicros: 0,
        httpStatus: c.httpStatus,
        error: c.error,
        result,
        measurements: result
          ? measure(
              cases.find((t) => t.id === c.caseId)!,
              result,
            )
          : undefined,
        reviews: [],
      };
    });
  const at = new Date().toISOString();
  const run: LabRun = {
    id: randomUUID(),
    requestKey: input.requestKey,
    signature,
    title: `${suite.title} · replay`,
    source: "replay",
    sourceRunId: source.id,
    suiteId: suite.id,
    suiteRevision: suite.revision,
    suiteVersion: suite.builtIn ? suite.id : `${suite.id}@${suite.revision}`,
    suiteHash: digest(cases),
    status: "completed",
    cancelRequested: false,
    providers: source.providers.filter((p) =>
      calls.some((c) => c.provider === p),
    ),
    createdAt: at,
    finishedAt: at,
    authorizationSource: "backend_policy",
    budgetMicros: 0,
    plannedMicros: 0,
    spentMicros: 0,
    reservedMicros: 0,
    rateCardVersion: source.rateCardVersion,
    adapterSnapshot: source.adapterSnapshot,
    cases,
    calls,
  };
  await save(run);
  return run;
}
