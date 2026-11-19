import { isExtractProvider, providerIds } from "./provider-catalog.js";
import type { Store } from "./store.js";
import type { Candidate, TraceEvent } from "./types.js";
export async function analytics(store: Store) {
  const tasks = (await store.tasks()).filter((t) => t.intent.consent);
  const base = { cohortSize: tasks.length, minCohort: 0 };
  const histories = await Promise.all(
    tasks.map(async (t) => ({ task: t, events: await store.events(t.id) })),
  );
  const events = histories.flatMap((h) => h.events);
  const count = (
    items: {
      taskId: string;
    }[],
  ) => items.length;
  // First routing decision per normalized invocation: fallback rechecks are not new opportunities.
  const firstCandidates: TraceEvent[] = [];
  const firstSelections: TraceEvent[] = [];
  const seenCandidates = new Set<string>();
  const seenSelections = new Set<string>();
  for (const { task, events: history } of histories) {
    let invocation = "";
    for (const e of history) {
      if (e.type === "tool_invoked")
        invocation = e.data.invocationId || `${task.id}:${e.id}`;
      const key = e.data.invocationId || invocation;
      if (e.type === "provider_candidates" && !seenCandidates.has(key)) {
        seenCandidates.add(key);
        firstCandidates.push({ ...e, data: { ...e.data, invocationId: key } });
      }
      if (
        e.type === "route_selected" &&
        !isExtractProvider(e.data.provider) &&
        !seenSelections.has(key)
      ) {
        seenSelections.add(key);
        firstSelections.push({ ...e, data: { ...e.data, invocationId: key } });
      }
    }
  }
  const winners = new Map(
    firstSelections.map((e) => [e.data.invocationId, e.data.provider]),
  );
  const providers = providerIds.map((provider) => {
    const responses = events.filter(
      (e) => e.type === "provider_response" && e.data.provider === provider,
    );
    const candidateEvents = firstCandidates.filter((e) =>
      e.data.candidates.some((c: Candidate) => c.provider === provider),
    );
    const calls = new Set(responses.map((e) => e.callId));
    const checks = events.filter(
      (e) => e.type === "outcome_evaluated" && calls.has(e.callId),
    );
    const selected = isExtractProvider(provider)
      ? events.filter(
          (e) => e.type === "route_selected" && e.data.provider === provider,
        )
      : firstSelections.filter((e) => e.data.provider === provider);
    const eligible = candidateEvents.filter((e) =>
      e.data.candidates.some(
        (c: Candidate) => c.provider === provider && c.eligible,
      ),
    );
    const lossGroups = new Map<string, TraceEvent[]>();
    for (const event of candidateEvents) {
      const c = event.data.candidates.find(
        (c: Candidate) => c.provider === provider,
      ) as Candidate;
      const winner = winners.get(event.data.invocationId);
      const reasons = c.eligible
        ? winner && winner !== provider
          ? ["Lower weighted score on initial route"]
          : []
        : c.reasons;
      for (const reason of reasons)
        lossGroups.set(reason, [...(lossGroups.get(reason) || []), event]);
    }
    return {
      provider,
      suppressed: false as const,
      performanceSuppressed: false,
      eligible: isExtractProvider(provider) ? null : count(eligible),
      selected: count(selected),
      calls: responses.length,
      httpSuccesses: responses.filter(
        (e) => e.data.httpStatus >= 200 && e.data.httpStatus < 300,
      ).length,
      successes: responses.filter((e) => e.data.success).length,
      latencyMs: responses.length
        ? Math.round(
            responses.reduce((a, e) => a + e.data.latencyMs, 0) /
              responses.length,
          )
        : null,
      estimatedMicros: events
        .filter(
          (e) => e.type === "budget_settled" && e.data.provider === provider,
        )
        .reduce((a, e) => a + e.data.estimateMicros, 0),
      coveragePasses: checks.filter((e) => e.data.pass).length,
      coverageChecks: checks.length,
      lossReasons: [...lossGroups].map(
        ([reason, items]) => [reason, count(items)] as const,
      ),
    };
  });
  const failedCoverage = new Set(
    events
      .filter((e) => e.type === "outcome_evaluated" && e.data.pass === false)
      .map((e) => e.callId),
  );
  const passedCoverage = new Map(
    events
      .filter(
        (e) =>
          e.type === "outcome_evaluated" &&
          e.data.pass === true &&
          e.data.invocationId,
      )
      .map((e) => [e.data.invocationId, e.id]),
  );
  const insufficient200 = events.filter(
    (e) =>
      e.type === "provider_response" &&
      e.data.httpStatus === 200 &&
      failedCoverage.has(e.callId),
  );
  const fallbackEvents = events.filter((e) => e.type === "fallback_triggered");
  const recovered = fallbackEvents.filter(
    (e) =>
      e.data.invocationId &&
      (passedCoverage.get(e.data.invocationId) ?? 0) > e.id,
  );
  return {
    suppressed: false as const,
    ...base,
    providers,
    capabilities: {
      search: count(events.filter((e) => e.type === "tool_invoked")),
      extraction: count(
        events.filter(
          (e) =>
            e.type === "provider_request" &&
            e.data.capability === "research.fetch_url",
        ),
      ),
    },
    fallbacks: count(fallbackEvents),
    fallbackRecoveries: count(recovered),
    insufficient200: count(insufficient200),
    comparisons: count(events.filter((e) => e.type === "comparison_requested")),
    preferenceCounts: Object.fromEntries(
      ["balanced", "cost", "latency"].map((p) => [
        p,
        count(
          tasks
            .filter((t) => t.intent.preference === p)
            .map((t) => ({ taskId: t.id })),
        ),
      ]),
    ),
    note: "Initial-route opportunities are counted once per tool invocation; fallback checks do not inflate conversion. Coverage is not company verification or an independent answer-quality score. Costs are estimates. Counts include eligible opted-in tasks from the first recorded usage; a dash means no measurement or not applicable.",
  };
}
export type Analytics = Awaited<ReturnType<typeof analytics>>;
