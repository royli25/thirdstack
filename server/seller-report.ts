import type { Observatory } from "./observation.js";
import type { ProviderId } from "./types.js";
import type { ObservedCall, ObservationEvent } from "./observation-types.js";
import { providerRegistry } from "./provider-adapters.js";
import { providerCatalog } from "./provider-catalog.js";
import {
  taskTypes,
  taskTypeLabels,
  reasonThemeLabels,
  type TaskType,
  type ReasonTheme,
} from "./seller-taxonomy.js";

/** Shares are withheld below this many tasks. Counts are always shown. */
export const SELLER_MIN_SAMPLE = 30;

type Count = { key: string; label: string; count: number };
type Operation = "search" | "extract";
type Offer = {
  operations?: { operation: Operation; content?: string }[];
  tools?: {
    tool: string;
    provider: string;
    listingVersion?: number;
    discoveryMatches?: {
      operationIndex: number;
      status: string;
    }[];
  }[];
};

/** Everything one session contributed. Reports are computed from this, never from the store directly. */
export type SellerSessionData = {
  session: import("./observation-types.js").ObservationSession;
  events: ObservationEvent[];
  calls: ObservedCall[];
};
export async function loadSellerData(
  obs: Observatory,
): Promise<SellerSessionData[]> {
  const sessions = (await obs.db.list()).filter((s) => s.commercialConsent);
  return await Promise.all(
    sessions.map(async (session) => ({
      session,
      events: await obs.db.events(session.id),
      calls: await obs.db.calls(session.id),
    })),
  );
}
export type SellerReportOptions = {
  days: number;
  /** Whether this seller asked for named comparison. */
  named: boolean;
  /** Whether a given other company has agreed to be named. Defaults to yes. */
  canName?: (provider: string) => boolean;
  minSample?: number;
  now?: Date;
  /** Explicit window; overrides days. End is exclusive. */
  from?: Date;
  to?: Date;
  taskType?: TaskType;
  host?: string;
  /** Only tasks whose eligible offer showed this listing version. */
  listingVersion?: number;
  /** Agent hosts treated as internal traffic and left out. */
  internalHosts?: string[];
};

const missedLabels: Record<string, string> = {
  "incompatible:complete_page":
    "Needed the complete page, which this tool cannot guarantee",
  "incompatible:page_text": "Needed page text, which this tool does not return",
  incompatible: "Request did not fit this tool",
  over_budget: "Estimate was over the task's remaining budget",
  disabled: "Turned off by the user or their key",
  unavailable: "Tool was not available",
  needs_parameters: "Request was incomplete",
};

const names: Record<string, string> = Object.fromEntries(
  providerCatalog.map((p) => [p.id, p.label]),
);

/**
 * What a tool company sees about agent choices. Aggregates only: never objectives,
 * queries, URLs, stated reasons, answers, model names or session IDs.
 *
 * A task is one recorded session. "Chosen" means the agent named the tool itself;
 * calls octolab routed are counted separately and never as a choice.
 */
export async function sellerReport(
  obs: Observatory,
  provider: ProviderId,
  options: SellerReportOptions,
) {
  const simulation = await obs.db.store.db
    .prepare("SELECT body FROM workspace_settings WHERE key='simulation'")
    .get();
  return {
    ...analyzeSeller(await loadSellerData(obs), provider, options),
    simulated: simulation
      ? (JSON.parse(simulation.body as string) as { note: string })
      : null,
  };
}
export function sellerWindow(options: SellerReportOptions) {
  const now = options.now ?? new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - options.days + 1);
  start.setUTCHours(0, 0, 0, 0);
  // The end is exclusive, so step past "now" to keep a task recorded this instant.
  return {
    from: options.from ?? start,
    to: options.to ?? new Date(now.getTime() + 1),
  };
}
/** Pure analysis over loaded sessions. No I/O. */
export function analyzeSeller(
  data: SellerSessionData[],
  provider: ProviderId,
  options: SellerReportOptions,
) {
  const minSample = options.minSample ?? SELLER_MIN_SAMPLE;
  const window = sellerWindow(options);
  const from = window.from.toISOString(),
    to = window.to.toISOString();
  const adapters = providerRegistry.list();
  const operationOf = Object.fromEntries(
    adapters.map((a) => [a.tool, a.operation]),
  ) as Record<string, Operation>;
  const operation = adapters.find((a) => a.provider === provider)!.operation;
  const rate = (n: number, d: number) => (d >= minSample ? n / d : null);
  // Without the opt-in, other companies are grouped and unnamed.
  const other = (p: string, op: Operation) =>
    options.named && (options.canName?.(p) ?? true)
      ? { key: p, label: names[p] ?? p }
      : {
          key: `other_${op}`,
          label: op === "search" ? "Other search tools" : "Other page tools",
        };
  const bump = (
    map: Map<string, Count>,
    key: string,
    label: string,
    by = 1,
  ) => {
    const row = map.get(key) ?? { key, label, count: 0 };
    row.count += by;
    map.set(key, row);
  };
  const sorted = (map: Map<string, Count>) =>
    [...map.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label),
    );
  const theme = (c: ObservedCall) =>
    (c.reasonTheme ?? "unclassified") as ReasonTheme | "unclassified";

  const funnel = { eligible: 0, chosen: 0, succeeded: 0, cited: 0 };
  const byTask = new Map<
    TaskType,
    { eligible: number; you: number; none: number; rivals: Map<string, Count> }
  >();
  const reasonsFor = new Map<string, Count>();
  const reasonsAgainst = new Map<string, Count>();
  const lostTo = new Map<string, Count>();
  const missed = new Map<string, Count>();
  const failures = new Map<string, Count>();
  const afterFailure = new Map<string, Count>();
  const coUsage = new Map<string, Count>();
  const hosts = new Map<string, Count>();
  let calls = 0,
    succeededCalls = 0,
    emptyResults = 0,
    routedCalls = 0,
    estimateMicros = 0,
    usdCalls = 0,
    reportedUsd = 0,
    estimateMicrosForUsdCalls = 0;
  const latencies: number[] = [];

  const internal = new Set(options.internalHosts ?? []);
  const quality = {
    tasks: 0,
    excludedInternal: 0,
    withTaskType: 0,
    choices: 0,
    choicesWithTheme: 0,
    workspaces: new Set<string>(),
  };
  const daily = new Map<
    string,
    {
      eligible: number;
      chosen: number;
      succeeded: number;
      cited: number;
      failed: number;
    }
  >();
  const versions = new Map<number, { eligible: number; chosen: number }>();
  for (const { session, events, calls: sessionCalls } of data) {
    if (
      !session.commercialConsent ||
      session.createdAt < from ||
      session.createdAt >= to
    )
      continue;
    if (internal.has(session.host)) {
      quality.excludedInternal++;
      continue;
    }
    if (options.taskType && (session.taskType ?? "other") !== options.taskType)
      continue;
    if (options.host && session.host !== options.host) continue;
    const byId = new Map(sessionCalls.map((c) => [c.id, c]));
    const statuses = (e: ObservationEvent) => {
      const offer = e.data as Offer;
      const mine = offer.tools?.find((t) => t.provider === provider);
      return (mine?.discoveryMatches ?? [])
        .filter(
          (m) =>
            !offer.operations ||
            offer.operations[m.operationIndex]?.operation === operation,
        )
        .map((m) => ({
          status: m.status,
          content: offer.operations?.[m.operationIndex]?.content,
        }));
    };
    const offers = events.filter((e) => e.type === "tools_offered");
    const called = events.filter((e) => e.type === "tool_called");
    routedCalls += called.filter(
      (e) =>
        e.data.selectedBy === "server_route" &&
        byId.get(String(e.data.callId))?.provider === provider,
    ).length;
    // Agent choices only, in the order they happened.
    const chosenCalls = called
      .filter((e) => e.data.selectedBy !== "server_route")
      .map((e) => ({ at: e.id, call: byId.get(String(e.data.callId))! }))
      .filter((c) => c.call);
    const eligibleOffer = offers.find((e) =>
      statuses(e).some((m) => m.status === "eligible"),
    );
    // An agent can call a tool it already knows without asking for options first.
    // That is still a choice, so it counts as eligible and chosen.
    const direct =
      !eligibleOffer && chosenCalls.some((c) => c.call.provider === provider);
    if (!eligibleOffer && !direct) {
      const first = offers.flatMap(statuses)[0];
      if (first) {
        const key =
          first.status === "incompatible" &&
          ["complete_page", "page_text"].includes(first.content ?? "")
            ? `incompatible:${first.content}`
            : first.status;
        bump(missed, key, missedLabels[key] ?? key);
      }
      continue;
    }
    const shown = Number(
      (eligibleOffer?.data as Offer | undefined)?.tools?.find(
        (t) => t.provider === provider,
      )?.listingVersion ?? 0,
    );
    if (
      options.listingVersion !== undefined &&
      shown !== options.listingVersion
    )
      continue;
    const day = session.createdAt.slice(0, 10);
    const bucket = daily.get(day) ?? {
      eligible: 0,
      chosen: 0,
      succeeded: 0,
      cited: 0,
      failed: 0,
    };
    daily.set(day, bucket);
    const version = versions.get(shown) ?? { eligible: 0, chosen: 0 };
    versions.set(shown, version);
    bucket.eligible++;
    version.eligible++;
    quality.tasks++;
    quality.workspaces.add(session.apiKeyId ?? "local");
    if (session.taskType && session.taskType !== "other")
      quality.withTaskType++;
    const after = chosenCalls.filter((c) => c.at > (eligibleOffer?.id ?? -1));
    const mine = after.filter((c) => c.call.provider === provider);
    const rivals = after.filter(
      (c) =>
        c.call.provider !== provider && operationOf[c.call.tool] === operation,
    );
    const taskType = session.taskType ?? "other";
    const task = byTask.get(taskType) ?? {
      eligible: 0,
      you: 0,
      none: 0,
      rivals: new Map<string, Count>(),
    };
    byTask.set(taskType, task);
    funnel.eligible++;
    task.eligible++;
    if (!mine.length) {
      if (rivals.length) {
        const rival = other(rivals[0].call.provider, operation);
        bump(task.rivals, rival.key, rival.label);
        bump(lostTo, rival.key, rival.label);
        const t = theme(rivals[0].call);
        bump(reasonsAgainst, t, reasonThemeLabels[t]);
        quality.choices++;
        if (t !== "unclassified") quality.choicesWithTheme++;
      } else task.none++;
      continue;
    }
    funnel.chosen++;
    task.you++;
    bucket.chosen++;
    version.chosen++;
    quality.choices++;
    if (mine[0].call.reasonTheme) quality.choicesWithTheme++;
    const first = theme(mine[0].call);
    bump(reasonsFor, first, reasonThemeLabels[first]);
    bump(hosts, session.host, session.host);
    for (const p of new Set(
      after
        .filter((c) => c.call.provider !== provider)
        .map((c) => `${c.call.provider}|${operationOf[c.call.tool]}`),
    )) {
      const [p2, op] = p.split("|") as [string, Operation];
      const row = other(p2, op);
      bump(coUsage, row.key, row.label);
    }
    const cited = new Set(session.outcomes.flatMap((o) => o.evidenceCallIds));
    if (mine.some((c) => c.call.status === "succeeded")) {
      funnel.succeeded++;
      bucket.succeeded++;
    }
    if (mine.some((c) => cited.has(c.call.id))) {
      funnel.cited++;
      bucket.cited++;
    }
    bucket.failed += mine.filter((c) => c.call.status === "failed").length;
    for (const { at, call } of mine) {
      if (!["succeeded", "failed"].includes(call.status)) continue;
      calls++;
      estimateMicros += call.estimateMicros;
      if (typeof call.latencyMs === "number") latencies.push(call.latencyMs);
      const usage = call.result?.usage as
        { providerReportedUsd?: unknown } | undefined;
      if (
        typeof usage?.providerReportedUsd === "number" &&
        Number.isFinite(usage.providerReportedUsd)
      ) {
        usdCalls++;
        reportedUsd += usage.providerReportedUsd;
        estimateMicrosForUsdCalls += call.estimateMicros;
      }
      if (call.status === "succeeded") {
        succeededCalls++;
        if (
          operation === "search" &&
          Array.isArray(call.result?.sources) &&
          !(call.result.sources as unknown[]).length
        )
          emptyResults++;
        continue;
      }
      const kind =
        call.httpStatus === 429
          ? ["rate_limited", "Rate limited"]
          : /time/i.test(call.error ?? "")
            ? ["timeout", "Timed out"]
            : call.httpStatus
              ? ["http", "Provider returned an error"]
              : ["other", "Request failed"];
      bump(failures, kind[0], kind[1]);
      const next = after.find((c) => c.at > at)?.call;
      if (!next) bump(afterFailure, "stopped", "Stopped searching");
      else if (next.provider === provider)
        bump(afterFailure, "retried", "Tried this tool again");
      else {
        const row = other(next.provider, operationOf[next.tool]);
        bump(afterFailure, `switched_${row.key}`, `Switched to ${row.label}`);
      }
    }
  }
  latencies.sort((a, b) => a - b);
  return {
    provider,
    providerName: names[provider] ?? provider,
    operation,
    days: options.days,
    named: options.named,
    minSample,
    window: { from, to },
    filters: {
      taskType: options.taskType ?? null,
      host: options.host ?? null,
      listingVersion: options.listingVersion ?? null,
    },
    dataQuality: {
      tasks: quality.tasks,
      sufficient: quality.tasks >= minSample,
      excludedInternal: quality.excludedInternal,
      distinctKeys: quality.workspaces.size,
      taskTypeReported: rate(quality.withTaskType, quality.tasks),
      reasonThemeReported: rate(quality.choicesWithTheme, quality.choices),
    },
    daily: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, ...v })),
    listingVersions: [...versions.entries()]
      .sort(([a], [b]) => a - b)
      .map(([version, v]) => ({
        version,
        ...v,
        share: rate(v.chosen, v.eligible),
      })),
    funnel: {
      ...funnel,
      chosenShare: rate(funnel.chosen, funnel.eligible),
      succeededShare: rate(funnel.succeeded, funnel.chosen),
      citedShare: rate(funnel.cited, funnel.succeeded),
    },
    lostTo: sorted(lostTo),
    byTaskType: taskTypes
      .filter((t) => byTask.has(t))
      .map((t) => {
        const row = byTask.get(t)!;
        return {
          taskType: t,
          label: taskTypeLabels[t],
          eligible: row.eligible,
          you: row.you,
          rivals: sorted(row.rivals),
          none: row.none,
          share: rate(row.you, row.eligible),
        };
      })
      .sort((a, b) => b.eligible - a.eligible),
    reasonsFor: sorted(reasonsFor),
    reasonsAgainst: sorted(reasonsAgainst),
    missed: sorted(missed),
    calls: {
      total: calls,
      succeeded: succeededCalls,
      failed: calls - succeededCalls,
      emptyResults,
      medianLatencyMs: latencies.length
        ? latencies[Math.floor((latencies.length - 1) / 2)]
        : null,
      failures: sorted(failures),
      afterFailure: sorted(afterFailure),
      routedByOctolab: routedCalls,
    },
    cost: {
      averageEstimateMicros: calls ? Math.round(estimateMicros / calls) : null,
      usdCalls,
      averageReportedUsd: usdCalls ? reportedUsd / usdCalls : null,
      averageEstimateUsdForReportedCalls: usdCalls
        ? estimateMicrosForUsdCalls / usdCalls / 1e6
        : null,
      ruledOutOnBudget: missed.get("over_budget")?.count ?? 0,
      lostOnCost: reasonsAgainst.get("lower_cost")?.count ?? 0,
    },
    coUsage: sorted(coUsage).map((c) => ({
      ...c,
      share: rate(c.count, funnel.chosen),
    })),
    hosts: sorted(hosts).map((c) => ({
      ...c,
      share: rate(c.count, funnel.chosen),
    })),
    notes: [
      "Covers agents connected to octolab, not the whole market.",
      "Chosen counts only the agent's own choice. Calls octolab routed are excluded.",
      "Reasons and task types are what agents reported, not private reasoning.",
      `A share is shown only with at least ${minSample} tasks behind it.`,
      "Cited means the final answer referenced the call, not that the answer was right.",
    ],
  };
}
export type SellerAnalysis = ReturnType<typeof analyzeSeller>;
export type SellerReport = Awaited<ReturnType<typeof sellerReport>>;
