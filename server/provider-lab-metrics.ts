import {
  providerIds,
  providerOperation,
  toolForProvider,
} from "./provider-catalog.js";
import type { ProviderId, Source } from "./types.js";
import type {
  LabCase,
  LabCall,
  LabRun,
  ProviderMeasurement,
  ProviderUsage,
} from "./provider-lab-types.js";

export function providerUsage(calls: LabCall[]): ProviderUsage {
  const total: ProviderUsage = {
    usdCalls: 0,
    reportedUsd: 0,
    estimatedMicrosForUsdCalls: 0,
    creditCalls: 0,
    credits: 0,
  };
  for (const call of calls) {
    const usage = call.result?.usage as
      { providerReportedUsd?: unknown; credits?: unknown } | undefined;
    if (
      typeof usage?.providerReportedUsd === "number" &&
      Number.isFinite(usage.providerReportedUsd) &&
      usage.providerReportedUsd >= 0
    ) {
      total.usdCalls++;
      total.reportedUsd += usage.providerReportedUsd;
      total.estimatedMicrosForUsdCalls += call.estimateMicros;
    }
    const credits = usage?.credits ?? call.result?.credits;
    if (
      typeof credits === "number" &&
      Number.isFinite(credits) &&
      credits >= 0
    ) {
      total.creditCalls++;
      total.credits += credits;
    }
  }
  return total;
}

export function measure(
  test: LabCase,
  result: Record<string, any>,
): NonNullable<LabCall["measurements"]> {
  const sources: Source[] = Array.isArray(result.sources) ? result.sources : [];
  const canonical = (value: string) => {
    try {
      const u = new URL(value);
      return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  };
  const index = sources.findIndex(
    (s) => canonical(s.url) === canonical(test.referenceUrl),
  );
  const pageStatus = Number.isInteger(result.pageStatus)
    ? (result.pageStatus as number)
    : null;
  const text = typeof result.text === "string" ? result.text : "";
  return {
    resultCount: sources.length,
    capturedCharacters:
      test.kind === "search"
        ? sources.reduce((n, s) => n + s.snippet.length, 0)
        : text.length,
    referenceRank: index < 0 ? null : index + 1,
    referenceCheck:
      test.kind === "search"
        ? index >= 0 && index < 3
        : pageStatus === null
          ? null
          : pageStatus >= 200 &&
            pageStatus < 300 &&
            test.terms.every((t) =>
              text.toLowerCase().includes(t.toLowerCase()),
            ),
    pageStatus,
    truncated: result.truncated === true,
  };
}
export function labMeasurements(runs: LabRun[]): ProviderMeasurement[] {
  return (providerIds as ProviderId[]).map((provider) => {
    const calls = runs
      .flatMap((r) => r.calls)
      .filter(
        (c) =>
          c.provider === provider &&
          !["pending", "skipped", "running"].includes(c.status),
      );
    const latencies = calls
      .flatMap((c) => (c.latencyMs === undefined ? [] : [c.latencyMs]))
      .sort((a, b) => a - b);
    const mid = Math.floor(latencies.length / 2);
    const reviews = calls
      .map((c) => c.reviews.at(-1))
      .filter((r) => r && r.verdict !== "unknown");
    return {
      provider,
      attempted: calls.length,
      succeeded: calls.filter((c) => c.status === "succeeded").length,
      failed: calls.filter((c) => c.status === "failed").length,
      interrupted: calls.filter((c) => c.status === "interrupted").length,
      medianLatencyMs: latencies.length
        ? latencies.length % 2
          ? latencies[mid]
          : (latencies[mid - 1] + latencies[mid]) / 2
        : null,
      estimatedMicros: calls.reduce((n, c) => n + c.estimateMicros, 0),
      referencePassed: calls.filter(
        (c) => c.measurements?.referenceCheck === true,
      ).length,
      referenceKnown: calls.filter(
        (c) =>
          c.measurements?.referenceCheck !== null &&
          c.measurements?.referenceCheck !== undefined,
      ).length,
      reviewed: reviews.length,
      useful: reviews.filter((r) => r?.verdict === "useful").length,
      partial: reviews.filter((r) => r?.verdict === "partial").length,
      truncated: calls.filter((c) => c.measurements?.truncated).length,
    };
  });
}

/** Descriptive comparison only: repeated web retrieval does not establish causality. */
export function compareProviderRuns(
  before: LabRun,
  after: LabRun,
  provider: ProviderId,
) {
  const kind = providerOperation(provider) ?? "search";
  const cases = (run: LabRun) =>
    run.cases
      .filter((c) => c.kind === kind)
      .sort((a, b) => a.id.localeCompare(b.id));
  const previous = cases(before),
    next = cases(after);
  const warnings: string[] = [];
  if (before.source === "replay" || after.source === "replay")
    warnings.push(
      "Replay uses historical responses. It tests the checks only; execution, latency, cost, and provider improvement cannot be inferred.",
    );
  const sameCases =
    before.suiteVersion === after.suiteVersion &&
    JSON.stringify(previous) === JSON.stringify(next);
  const adapter = toolForProvider(provider);
  if (!sameCases)
    warnings.push(
      "The test cases or suite version changed. Treat this as an exploratory comparison.",
    );
  if (
    JSON.stringify(before.adapterSnapshot[adapter]) !==
    JSON.stringify(after.adapterSnapshot[adapter])
  )
    warnings.push(
      "Adapter settings changed; record which change the plan is testing.",
    );
  if (before.rateCardVersion !== after.rateCardVersion)
    warnings.push("Configured cost estimates changed between runs.");
  const complete = (run: LabRun) =>
    run.status === "completed" &&
    run.providers.includes(provider) &&
    run.calls
      .filter((c) => c.provider === provider)
      .every((c) => ["succeeded", "failed"].includes(c.status));
  if (!complete(before) || !complete(after))
    warnings.push(
      "One or both runs did not settle every planned provider call.",
    );
  const ids = [...new Set([...previous, ...next].map((c) => c.id))];
  return {
    sameCases,
    warnings,
    before: labMeasurements([before]).find((m) => m.provider === provider)!,
    after: labMeasurements([after]).find((m) => m.provider === provider)!,
    cases: ids.map((id) => ({
      id,
      title:
        next.find((c) => c.id === id)?.title ??
        previous.find((c) => c.id === id)!.title,
      before: before.calls.find(
        (c) => c.provider === provider && c.caseId === id,
      ),
      after: after.calls.find(
        (c) => c.provider === provider && c.caseId === id,
      ),
    })),
  };
}
