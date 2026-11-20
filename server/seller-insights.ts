import type { ProviderId } from "./types.js";
import {
  analyzeSeller,
  sellerWindow,
  type SellerAnalysis,
  type SellerReportOptions,
  type SellerSessionData,
} from "./seller-report.js";
import type { Listing, SellerSettings } from "./seller-store.js";

/** Everything here is derived from an analysis. Nothing reads storage or invents a number. */
const points = (now: number | null, before: number | null) =>
  now === null || before === null
    ? null
    : Math.round((now - before) * 1000) / 10;
const percentChange = (now: number, before: number) =>
  before ? Math.round(((now - before) / before) * 1000) / 10 : null;
const share = (n: number, d: number, min: number) => (d >= min ? n / d : null);
const pct = (v: number | null) =>
  v === null ? "not enough data" : `${Math.round(v * 100)}%`;

export function failureRate(a: SellerAnalysis) {
  return share(a.calls.failed, a.calls.total, a.minSample);
}

/** The same analysis for this window and the equally long window before it. */
export function comparePeriods(
  data: SellerSessionData[],
  provider: ProviderId,
  options: SellerReportOptions,
) {
  const { from, to } = sellerWindow(options);
  const before = new Date(from.getTime() - (to.getTime() - from.getTime()));
  const current = analyzeSeller(data, provider, { ...options, from, to });
  const previous = analyzeSeller(data, provider, {
    ...options,
    from: before,
    to: from,
  });
  return {
    current,
    previous,
    change: {
      eligiblePercent: percentChange(
        current.funnel.eligible,
        previous.funnel.eligible,
      ),
      chosenSharePoints: points(
        current.funnel.chosenShare,
        previous.funnel.chosenShare,
      ),
      citedSharePoints: points(
        current.funnel.citedShare,
        previous.funnel.citedShare,
      ),
      failureRatePoints: points(failureRate(current), failureRate(previous)),
    },
  };
}

/** Daily or weekly series with empty periods filled in, so a chart never skips a gap. */
export function trend(a: SellerAnalysis, bucket: "day" | "week") {
  const byDay = new Map(a.daily.map((d) => [d.date, d]));
  const empty = { eligible: 0, chosen: 0, succeeded: 0, cited: 0, failed: 0 };
  const days: ({ date: string } & typeof empty)[] = [];
  const end = new Date(a.window.to);
  for (
    const day = new Date(`${a.window.from.slice(0, 10)}T00:00:00.000Z`);
    day < end;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const date = day.toISOString().slice(0, 10);
    days.push({ ...empty, ...byDay.get(date), date });
  }
  const rows =
    bucket === "day"
      ? days
      : days.reduce<typeof days>((weeks, d, i) => {
          if (i % 7 === 0) weeks.push({ ...empty, date: d.date });
          const w = weeks.at(-1)!;
          for (const k of Object.keys(empty) as (keyof typeof empty)[])
            w[k] += d[k];
          return weeks;
        }, []);
  return rows.map((r) => ({
    ...r,
    chosenShare: share(r.chosen, r.eligible, a.minSample),
  }));
}

export type Finding = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  evidence: string;
  suggestion: string;
  measure: string;
};
/** Ranked, rule-based observations. Each one states its evidence and how to check a fix. */
export function findings(a: SellerAnalysis): Finding[] {
  const out: Finding[] = [];
  const losses = a.lostTo.reduce((n, r) => n + r.count, 0);
  const reason = (key: string) =>
    a.reasonsAgainst.find((r) => r.key === key)?.count ?? 0;
  const missed = (key: string) =>
    a.missed.find((r) => r.key === key)?.count ?? 0;
  const { cost, calls, funnel } = a;
  if (
    cost.averageReportedUsd !== null &&
    cost.averageEstimateUsdForReportedCalls !== null &&
    cost.usdCalls >= 5 &&
    cost.averageEstimateUsdForReportedCalls > cost.averageReportedUsd * 1.15
  ) {
    const over = Math.round(
      (cost.averageEstimateUsdForReportedCalls / cost.averageReportedUsd - 1) *
        100,
    );
    out.push({
      id: "estimate-overstated",
      severity:
        cost.lostOnCost + cost.ruledOutOnBudget >= 10 ? "high" : "medium",
      title: "Agents are shown a higher price than you report",
      evidence: `The estimate shown is ${over}% above the cost reported back over ${cost.usdCalls} calls. ${cost.lostOnCost} tasks were lost with lower cost as the reason and ${cost.ruledOutOnBudget} were ruled out on budget.`,
      suggestion:
        "Confirm your current per-call rate so the estimate agents see can be corrected.",
      measure: "Tasks lost on cost and ruled out on budget in the next period.",
    });
  } else if (losses >= 10 && reason("lower_cost") / losses >= 0.2)
    out.push({
      id: "lost-on-cost",
      severity: "medium",
      title: "Cost is a leading reason agents choose another tool",
      evidence: `${reason("lower_cost")} of ${losses} lost tasks gave lower cost as the reason.`,
      suggestion:
        "Check whether the price shown matches what you charge, and whether a cheaper request shape exists for simple lookups.",
      measure: "Share of losses that cite cost.",
    });
  const pageText =
    missed("incompatible:page_text") + missed("incompatible:complete_page");
  if (pageText >= 5)
    out.push({
      id: "content-gap",
      severity: pageText >= 20 ? "high" : "medium",
      title: "Requests needed more page content than this tool offers",
      evidence: `${pageText} requests were ruled out before the agent chose because they needed page text or a complete page.`,
      suggestion:
        "If the tool can return this, say so in the listing. If not, this is demand a product change could reach.",
      measure: "Requests ruled out for content in the next period.",
    });
  if (calls.succeeded >= 10 && calls.emptyResults / calls.succeeded >= 0.1)
    out.push({
      id: "empty-results",
      severity: "medium",
      title: "Successful calls are coming back empty",
      evidence: `${calls.emptyResults} of ${calls.succeeded} successful calls returned nothing.`,
      suggestion:
        "Look at which request shapes return nothing, and say in the listing when results can be empty.",
      measure: "Share of successful calls that return nothing.",
    });
  const switched = calls.afterFailure
    .filter((r) => r.key.startsWith("switched"))
    .reduce((n, r) => n + r.count, 0);
  if (calls.failed >= 3 && switched / calls.failed >= 0.4)
    out.push({
      id: "failure-switching",
      severity: "medium",
      title: "A failed call usually sends the agent to another tool",
      evidence: `After ${calls.failed} failed calls, agents switched tools ${switched} times. Most common failure: ${calls.failures[0]?.label.toLowerCase() ?? "unknown"}.`,
      suggestion:
        "Reduce the most common failure, and return an error that tells the agent whether a retry will work.",
      measure: "Failed calls, and how many are followed by a switch.",
    });
  const weakest = a.byTaskType
    .filter((t) => t.share !== null)
    .sort((x, y) => x.share! - y.share!)[0];
  if (
    weakest &&
    funnel.chosenShare !== null &&
    funnel.chosenShare - weakest.share! >= 0.15
  )
    out.push({
      id: `weak-task-${weakest.taskType}`,
      severity: "low",
      title: `You are chosen least for ${weakest.label.toLowerCase()}`,
      evidence: `Chosen in ${weakest.you} of ${weakest.eligible} eligible tasks (${pct(weakest.share)}), against ${pct(funnel.chosenShare)} overall.`,
      suggestion:
        "Decide whether this kind of task matters to you. If it does, check the reasons agents gave for it.",
      measure: `Share of ${weakest.label.toLowerCase()} tasks.`,
    });
  if (
    a.dataQuality.reasonThemeReported !== null &&
    a.dataQuality.reasonThemeReported < 0.6
  )
    out.push({
      id: "thin-reasons",
      severity: "low",
      title: "Many choices came without a reason theme",
      evidence: `Only ${pct(a.dataQuality.reasonThemeReported)} of choices carried a theme, so the reasons shown cover part of the picture.`,
      suggestion: "Read the reasons as a sample, not a full count.",
      measure: "Share of choices with a theme.",
    });
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((x, y) => rank[x.severity] - rank[y.severity]);
}

export type Alert = {
  id: string;
  severity: "high" | "medium";
  message: string;
};
/** What changed against the previous period, judged by the seller's own thresholds. */
export function alerts(
  current: SellerAnalysis,
  previous: SellerAnalysis,
  thresholds: SellerSettings["alerts"],
): Alert[] {
  const out: Alert[] = [];
  const drop = points(current.funnel.chosenShare, previous.funnel.chosenShare);
  if (drop !== null && drop <= -thresholds.shareDropPoints)
    out.push({
      id: "share-drop",
      severity: "high",
      message: `Agents chose you in ${pct(current.funnel.chosenShare)} of eligible tasks, down ${Math.abs(drop)} points from ${pct(previous.funnel.chosenShare)}.`,
    });
  const fail = points(failureRate(current), failureRate(previous));
  if (fail !== null && fail >= thresholds.failureRisePoints)
    out.push({
      id: "failure-rise",
      severity: "high",
      message: `${pct(failureRate(current))} of calls failed, up ${fail} points from ${pct(failureRate(previous))}.`,
    });
  const volume = percentChange(
    current.funnel.eligible,
    previous.funnel.eligible,
  );
  if (
    volume !== null &&
    previous.funnel.eligible >= current.minSample &&
    Math.abs(volume) >= thresholds.volumeChangePercent
  )
    out.push({
      id: "volume-change",
      severity: "medium",
      message: `Eligible tasks ${volume > 0 ? "rose" : "fell"} ${Math.abs(volume)}%, from ${previous.funnel.eligible} to ${current.funnel.eligible}.`,
    });
  for (const task of current.byTaskType) {
    const before = previous.byTaskType.find(
      (t) => t.taskType === task.taskType,
    );
    const change = points(task.share, before?.share ?? null);
    if (change !== null && change <= -2 * thresholds.shareDropPoints)
      out.push({
        id: `task-drop-${task.taskType}`,
        severity: "medium",
        message: `${task.label}: chosen in ${pct(task.share)} of eligible tasks, down ${Math.abs(change)} points.`,
      });
  }
  const known = new Set(previous.missed.map((m) => m.key));
  for (const cause of current.missed)
    if (!known.has(cause.key) && cause.count >= 5)
      out.push({
        id: `new-missed-${cause.key}`,
        severity: "medium",
        message: `New this period: ${cause.count} requests ruled out. ${cause.label}.`,
      });
  return out;
}

/** How each listing version performed, for tasks that were shown that version. */
export function listingImpact(
  data: SellerSessionData[],
  provider: ProviderId,
  listings: Listing[],
  options: SellerReportOptions,
) {
  const all = analyzeSeller(data, provider, options);
  const rows = all.listingVersions.map(({ version }) => {
    const a = analyzeSeller(data, provider, {
      ...options,
      listingVersion: version,
    });
    const listing = listings.find((l) => l.version === version);
    return {
      version,
      label: version === 0 ? "Built-in text" : `Version ${version}`,
      activatedAt: listing?.activatedAt ?? null,
      retiredAt: listing?.retiredAt ?? null,
      note: listing?.note ?? "",
      eligible: a.funnel.eligible,
      chosen: a.funnel.chosen,
      chosenShare: a.funnel.chosenShare,
      citedShare: a.funnel.citedShare,
      failureRate: failureRate(a),
      topReasonsFor: a.reasonsFor.slice(0, 3),
      topReasonsAgainst: a.reasonsAgainst.slice(0, 3),
    };
  });
  return {
    minSample: all.minSample,
    versions: rows.map((row, i) => ({
      ...row,
      againstPrevious:
        i === 0
          ? null
          : {
              chosenSharePoints: points(
                row.chosenShare,
                rows[i - 1].chosenShare,
              ),
              citedSharePoints: points(row.citedShare, rows[i - 1].citedShare),
              failureRatePoints: points(
                row.failureRate,
                rows[i - 1].failureRate,
              ),
            },
    })),
    caution:
      "Versions ran at different times with different tasks, so a difference here is a signal to test, not proof the wording caused it.",
  };
}

/** A short plain-language summary of the period, for an email or a message. */
export function digest(
  compared: ReturnType<typeof comparePeriods>,
  found: Finding[],
  raised: Alert[],
) {
  const { current, change } = compared;
  const signed = (v: number | null, unit: string) =>
    v === null
      ? ""
      : ` (${v > 0 ? "+" : ""}${v}${unit} on the previous period)`;
  const lines = [
    `${current.providerName}: last ${current.days} days`,
    `Eligible tasks: ${current.funnel.eligible}${signed(change.eligiblePercent, "%")}`,
    `Chosen by agents: ${current.funnel.chosen}, ${pct(current.funnel.chosenShare)} of eligible${signed(change.chosenSharePoints, " pts")}`,
    `Cited in answers: ${current.funnel.cited}, ${pct(current.funnel.citedShare)} of successful${signed(change.citedSharePoints, " pts")}`,
    `Failed calls: ${current.calls.failed} of ${current.calls.total}`,
    ...(raised.length
      ? ["", "Changes worth a look:", ...raised.map((a) => `- ${a.message}`)]
      : ["", "Nothing crossed your alert thresholds."]),
    ...(found.length
      ? [
          "",
          "Where to look next:",
          ...found.slice(0, 3).map((f) => `- ${f.title}. ${f.evidence}`),
        ]
      : []),
    ...(current.dataQuality.sufficient
      ? []
      : [
          "",
          `Only ${current.dataQuality.tasks} tasks this period, below the ${current.minSample} needed to show shares.`,
        ]),
  ];
  return {
    period: current.window,
    headline: lines[2],
    alerts: raised,
    findings: found.slice(0, 3),
    text: lines.join("\n"),
  };
}

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Neutralise spreadsheet formulas as well as quoting.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};
const csv = (header: string[], rows: unknown[][]) =>
  [header, ...rows].map((r) => r.map(cell).join(",")).join("\n") + "\n";
export const exportSections = [
  "tasks",
  "reasons",
  "missed",
  "trend",
  "failures",
] as const;
export function exportCsv(
  a: SellerAnalysis,
  section: (typeof exportSections)[number],
) {
  if (section === "tasks")
    return csv(
      [
        "task_type",
        "eligible",
        "chose_you",
        "chose_another",
        "neither",
        "share",
      ],
      a.byTaskType.map((t) => [
        t.label,
        t.eligible,
        t.you,
        t.rivals.reduce((n, r) => n + r.count, 0),
        t.none,
        t.share === null ? "" : t.share.toFixed(4),
      ]),
    );
  if (section === "reasons")
    return csv(
      ["direction", "reason", "tasks"],
      [
        ...a.reasonsFor.map((r) => ["chose_you", r.label, r.count]),
        ...a.reasonsAgainst.map((r) => ["chose_another", r.label, r.count]),
      ],
    );
  if (section === "missed")
    return csv(
      ["cause", "requests"],
      a.missed.map((m) => [m.label, m.count]),
    );
  if (section === "failures")
    return csv(
      ["kind", "label", "count"],
      [
        ...a.calls.failures.map((f) => ["failure", f.label, f.count]),
        ...a.calls.afterFailure.map((f) => ["then", f.label, f.count]),
      ],
    );
  return csv(
    ["date", "eligible", "chosen", "succeeded", "cited", "failed_calls"],
    trend(a, "day").map((d) => [
      d.date,
      d.eligible,
      d.chosen,
      d.succeeded,
      d.cited,
      d.failed,
    ]),
  );
}
