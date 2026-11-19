import { searchProviderIds } from "./provider-catalog.js";
import { config } from "./config.js";
import type { Candidate, Intent, Observation, ProviderId } from "./types.js";
export function candidates(
  intent: Intent,
  remaining: number,
  observations: Observation[],
  available: Record<ProviderId, boolean>,
  limited: Set<ProviderId> = new Set(),
): Candidate[] {
  const maxCost = Math.max(
    ...searchProviderIds.map((p) => config.prices[p]),
    1,
  );
  const weights =
    intent.preference === "cost"
      ? [0.65, 0.1, 0.15, 0.1]
      : intent.preference === "latency"
        ? [0.15, 0.55, 0.2, 0.1]
        : [0.35, 0.2, 0.25, 0.2];
  return searchProviderIds
    .map((provider) => {
      const obs = observations
        .filter((o) => o.provider === provider)
        .slice(0, 30);
      const audited = obs.filter((o) => o.quality !== null);
      const insufficientData = [
        ...(obs.length < 5 ? ["latency", "reliability"] : []),
        ...(audited.length < 5 ? ["quality"] : []),
      ];
      const components = {
        cost: 1 - config.prices[provider] / (maxCost * 2),
        latency:
          obs.length < 5
            ? 0.5
            : 1 /
              (1 +
                obs.reduce((a, o) => a + o.latencyMs, 0) / obs.length / 1000),
        reliability:
          obs.length < 5
            ? 0.5
            : obs.filter((o) => o.success).length / obs.length,
        quality:
          audited.length < 5
            ? 0.5
            : audited.reduce((a, o) => a + o.quality!, 0) / audited.length,
      };
      const reasons = [
        ...(!available[provider] ? ["API key not configured"] : []),
        ...(config.prices[provider] > remaining
          ? ["Exceeds remaining budget"]
          : []),
        ...(limited.has(provider) ? ["Provider rate limit reached"] : []),
      ];
      return {
        provider,
        eligible: !reasons.length,
        reasons,
        estimatedMicros: config.prices[provider],
        components,
        insufficientData,
        score: Object.values(components).reduce(
          (a, v, i) => a + v * weights[i],
          0,
        ),
      };
    })
    .sort(
      (a, b) =>
        Number(b.eligible) - Number(a.eligible) ||
        b.score - a.score ||
        a.provider.localeCompare(b.provider),
    );
}
export function coverage(sources: { snippet: string; url?: string }[]) {
  // This checks usable search evidence, never asserts activity, funding, or relevance.
  const usable = new Set(
    sources
      .filter((s) => s.snippet.trim().length >= 80)
      .map((s, i) => s.url || `unlinked-${i}`),
  ).size;
  return {
    pass: usable >= 3,
    usable,
    returned: sources.length,
    criteria: "At least 3 unique source URLs with 80+ characters of evidence",
    taskCriteria: "unknown",
    evaluator: "search-coverage-v2",
  };
}
