/**
 * Deterministic provider choice for routed calls. Pure: no I/O, no provider requests.
 * Every input and every component of the score is returned so the decision can be
 * recorded and audited. Answer quality is deliberately not a component: octolab has
 * no measure that attributes answer quality to one provider.
 */
export const ROUTE_POLICY_VERSION = "route-v1";
export const ROUTE_MIN_SAMPLES = 5;
export const routePriorities = [
  "balanced",
  "cost",
  "latency",
  "reliability",
] as const;
export type RoutePriority = (typeof routePriorities)[number];
export type RouteComponent = "cost" | "latency" | "reliability";
export const routeWeights: Record<
  RoutePriority,
  Record<RouteComponent, number>
> = {
  balanced: { cost: 0.34, latency: 0.33, reliability: 0.33 },
  cost: { cost: 0.7, latency: 0.15, reliability: 0.15 },
  latency: { cost: 0.15, latency: 0.7, reliability: 0.15 },
  reliability: { cost: 0.15, latency: 0.15, reliability: 0.7 },
};
/** Used for a component with too few observations. Recorded as unmeasured, never as a measurement. */
export const UNMEASURED_PRIOR = 0.5;

export type RouteSignal = {
  tool: string;
  provider: string;
  status: string;
  reason: string;
  /** Request-specific estimate; null when the tool cannot serve the request. */
  estimatedMicros: number | null;
  /** Median of completed organic calls; null below the sample minimum. */
  medianLatencyMs: number | null;
  /** Share of completed organic calls that succeeded; null below the sample minimum. */
  successRate: number | null;
  sampleCount: number;
};
export type RouteCandidate = RouteSignal & {
  eligible: boolean;
  components: Record<RouteComponent, number> | null;
  unmeasured: RouteComponent[];
  score: number | null;
  rank: number | null;
};
export type RouteRanking = {
  policyVersion: string;
  priority: RoutePriority;
  weights: Record<RouteComponent, number>;
  candidates: RouteCandidate[];
  /** Eligible tools, best first. */
  ranking: string[];
  summary: string;
};

const round = (n: number) => Math.round(n * 10000) / 10000;
const usd = (micros: number) => `$${(micros / 1e6).toFixed(4)}`;

export function rankRoute(
  signals: RouteSignal[],
  priority: RoutePriority,
): RouteRanking {
  const weights = routeWeights[priority];
  const eligible = signals.filter(
    (s) => s.status === "eligible" && s.estimatedMicros !== null,
  );
  const cheapest = Math.min(...eligible.map((s) => s.estimatedMicros!));
  const fastest = Math.min(
    ...eligible.flatMap((s) =>
      s.medianLatencyMs !== null ? [s.medianLatencyMs] : [],
    ),
  );
  const scored = signals.map((s): RouteCandidate => {
    if (!eligible.includes(s))
      return {
        ...s,
        eligible: false,
        components: null,
        unmeasured: [],
        score: null,
        rank: null,
      };
    const unmeasured: RouteComponent[] = [
      ...(s.medianLatencyMs === null ? (["latency"] as const) : []),
      ...(s.successRate === null ? (["reliability"] as const) : []),
    ];
    const components = {
      // Relative to the cheapest and fastest eligible alternative for this request.
      cost: s.estimatedMicros ? round(cheapest / s.estimatedMicros) : 1,
      latency:
        s.medianLatencyMs === null
          ? UNMEASURED_PRIOR
          : s.medianLatencyMs
            ? round(fastest / s.medianLatencyMs)
            : 1,
      reliability: s.successRate === null ? UNMEASURED_PRIOR : s.successRate,
    };
    return {
      ...s,
      eligible: true,
      components,
      unmeasured,
      score: round(
        components.cost * weights.cost +
          components.latency * weights.latency +
          components.reliability * weights.reliability,
      ),
      rank: null,
    };
  });
  const order = scored
    .filter((c) => c.eligible)
    .sort(
      (a, b) =>
        b.score! - a.score! ||
        a.estimatedMicros! - b.estimatedMicros! ||
        a.tool.localeCompare(b.tool),
    );
  order.forEach((c, i) => (c.rank = i + 1));
  return {
    policyVersion: ROUTE_POLICY_VERSION,
    priority,
    weights,
    candidates: scored,
    ranking: order.map((c) => c.tool),
    summary: summarize(order, scored, priority),
  };
}

function summarize(
  order: RouteCandidate[],
  all: RouteCandidate[],
  priority: RoutePriority,
) {
  const [first, second] = order;
  if (!first)
    return `No eligible tool. ${all.map((c) => `${c.tool}: ${c.reason}`).join(" ")}`;
  const describe = (c: RouteCandidate) =>
    [
      `estimate ${usd(c.estimatedMicros!)}`,
      c.medianLatencyMs === null
        ? "latency unmeasured"
        : `median ${Math.round(c.medianLatencyMs)} ms`,
      c.successRate === null
        ? "reliability unmeasured"
        : `${Math.round(c.successRate * 100)}% success over ${c.sampleCount} calls`,
    ].join(", ");
  const excluded = all.filter((c) => !c.eligible);
  const tail = excluded.length
    ? ` Not eligible: ${excluded.map((c) => `${c.tool} (${c.status})`).join(", ")}.`
    : "";
  if (!second)
    return `Chose ${first.tool} as the only eligible tool (${describe(first)}).${tail}`;
  return `Chose ${first.tool} (score ${first.score}; ${describe(first)}) over ${second.tool} (score ${second.score}; ${describe(second)}) with ${priority} priority. Unmeasured components use a neutral ${UNMEASURED_PRIOR} and are not measurements.${tail}`;
}
