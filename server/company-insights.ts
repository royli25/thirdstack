import { isExtractProvider, toolForProvider } from "./provider-catalog.js";
import type { ProviderId } from "./types.js";
import type { Observatory } from "./observation.js";
import { toolCapabilities } from "./provider-capabilities.js";
import { labMeasurements, type ProviderLab } from "./provider-lab.js";
import type {
  ProviderMeasurement,
  ProviderUsage,
} from "./provider-lab-types.js";
import { providerUsage } from "./provider-lab-metrics.js";
import type { ObservedCall } from "./observation-types.js";
export interface Opportunity {
  id: string;
  title: string;
  category: "Coverage" | "Integration" | "Evaluation" | "Positioning";
  evidence: string;
  hypothesis: string;
  action: string;
  successMeasure: string;
  verification: "retrieval" | "agent_choice" | "integration";
}
export interface CompanyReport {
  provider: ProviderId;
  source: "demo" | "local";
  sourceLabel: string;
  period: string;
  organic: null | {
    offeredSessions: number;
    selectedSessions: number;
    calls: number;
    successfulCalls: number;
    referencedCalls: number;
  };
  organicUnavailableReason: string | null;
  privateActivity: null | {
    offeredSessions: number;
    selectedSessions: number;
    calls: number;
    successfulCalls: number;
    referencedCalls: number;
  };
  benchmarks: ProviderMeasurement[];
  benchmarkRunId: string | null;
  benchmarkLabel: string;
  usage: ProviderUsage | null;
  opportunities: Opportunity[];
  capabilities: (typeof toolCapabilities)[keyof typeof toolCapabilities];
}
/** Illustrative demo figures exist only for the original three providers. */
const demoOrganic: Partial<
  Record<ProviderId, NonNullable<CompanyReport["organic"]>>
> = {
  exa: {
    offeredSessions: 240,
    selectedSessions: 54,
    calls: 86,
    successfulCalls: 83,
    referencedCalls: 57,
  },
  tavily: {
    offeredSessions: 240,
    selectedSessions: 168,
    calls: 306,
    successfulCalls: 297,
    referencedCalls: 189,
  },
  firecrawl: {
    offeredSessions: 180,
    selectedSessions: 119,
    calls: 248,
    successfulCalls: 228,
    referencedCalls: 172,
  },
};
const demoBenchmarks: ProviderMeasurement[] = [
  {
    provider: "exa",
    attempted: 30,
    succeeded: 29,
    failed: 1,
    interrupted: 0,
    medianLatencyMs: 1840,
    estimatedMicros: 210000,
    referencePassed: 24,
    referenceKnown: 29,
    reviewed: 12,
    useful: 9,
    partial: 2,
    truncated: 0,
  },
  {
    provider: "tavily",
    attempted: 30,
    succeeded: 30,
    failed: 0,
    interrupted: 0,
    medianLatencyMs: 1360,
    estimatedMicros: 240000,
    referencePassed: 22,
    referenceKnown: 30,
    reviewed: 12,
    useful: 8,
    partial: 3,
    truncated: 0,
  },
  {
    provider: "firecrawl",
    attempted: 30,
    succeeded: 27,
    failed: 3,
    interrupted: 0,
    medianLatencyMs: 2310,
    estimatedMicros: 30000,
    referencePassed: 23,
    referenceKnown: 27,
    reviewed: 12,
    useful: 9,
    partial: 2,
    truncated: 6,
  },
];
export async function companyReport(
  provider: ProviderId,
  source: "demo" | "local",
  obs: Observatory,
  lab: ProviderLab,
  workspacePreview = false,
): Promise<CompanyReport> {
  // Never return objectives, queries, notes, outputs, model names, or session IDs.
  const sessions =
    source === "local"
      ? (await obs.db.list()).filter((s) => s.commercialConsent)
      : [];
  const callsAfterOffer = new Map<string, ObservedCall[]>();
  const eligibility = await Promise.all(
    sessions.map(async (s) => {
      const events = await obs.db.events(s.id);
      const offered = events.find(
        (e) =>
          e.type === "tools_offered" &&
          Array.isArray(e.data.tools) &&
          (
            e.data.tools as {
              provider: string;
              available: boolean;
              discoveryMatches?: {
                status: string;
              }[];
            }[]
          ).some(
            (t) =>
              t.provider === provider &&
              t.available &&
              (!t.discoveryMatches?.length ||
                t.discoveryMatches.some((m) => m.status === "eligible")),
          ),
      );
      if (!offered) return false;
      const callIds = new Set(
        events
          // Selection means the agent chose. Calls octolab routed are not agent choices.
          .filter(
            (e) =>
              e.id > offered.id &&
              e.type === "tool_called" &&
              e.data.selectedBy !== "server_route",
          )
          .map((e) => e.data.callId),
      );
      callsAfterOffer.set(
        s.id,
        (await obs.db.calls(s.id)).filter(
          (c) => c.provider === provider && callIds.has(c.id),
        ),
      );
      return true;
    }),
  );
  const eligible = sessions.filter((_, i) => eligibility[i]);
  const selected = eligible.filter(
    (s) => callsAfterOffer.get(s.id)!.length > 0,
  );
  const calls = selected
    .flatMap((s) => callsAfterOffer.get(s.id)!)
    .filter(
      (c) =>
        c.provider === provider && ["succeeded", "failed"].includes(c.status),
    );
  const referenced = new Set(
    selected.flatMap((s) => s.outcomes.flatMap((o) => o.evidenceCallIds)),
  );
  const organic =
    source === "demo"
      ? (demoOrganic[provider] ?? null)
      : {
          offeredSessions: eligible.length,
          selectedSessions: selected.length,
          calls: calls.length,
          successfulCalls: calls.filter((c) => c.status === "succeeded").length,
          referencedCalls: calls.filter((c) => referenced.has(c.id)).length,
        };
  const workspaceCalls =
    source === "local" && workspacePreview
      ? (
          await Promise.all(
            (await obs.db.list()).flatMap(
              async (s) => await obs.db.calls(s.id),
            ),
          )
        )
          .flat()
          .filter(
            (c) =>
              c.provider === provider &&
              ["succeeded", "failed"].includes(c.status),
          )
      : [];
  const allReferenced = new Set(
    source === "local" && workspacePreview
      ? (await obs.db.list()).flatMap((s) =>
          s.outcomes.flatMap((o) => o.evidenceCallIds),
        )
      : [],
  );
  const privateActivity =
    source === "local" && workspacePreview
      ? {
          offeredSessions: eligible.length,
          selectedSessions: selected.length,
          calls: workspaceCalls.length,
          successfulCalls: workspaceCalls.filter(
            (c) => c.status === "succeeded",
          ).length,
          referencedCalls: workspaceCalls.filter((c) => allReferenced.has(c.id))
            .length,
        }
      : null;
  const latestSummary = (source === "local" ? await lab.summaries() : []).find(
    (r) =>
      r.source === "live_controlled" &&
      r.status === "completed" &&
      r.calls.some(
        (c) =>
          c.provider === provider && ["succeeded", "failed"].includes(c.status),
      ),
  );
  const latest =
    source === "local" && latestSummary
      ? await lab.get(latestSummary.id)
      : undefined;
  const benchmarks =
    source === "demo"
      ? demoBenchmarks
      : labMeasurements(latest ? [latest] : []);
  const metric =
    benchmarks.find((m) => m.provider === provider) ??
    labMeasurements([]).find((m) => m.provider === provider)!;
  const usage =
    source === "local" && latest
      ? providerUsage(latest.calls.filter((c) => c.provider === provider))
      : null;
  const opportunities: Opportunity[] = [];
  if (
    usage &&
    usage.usdCalls > 0 &&
    Math.abs(usage.estimatedMicrosForUsdCalls / 1e6 - usage.reportedUsd) >
      0.000001
  ) {
    opportunities.push({
      id: "cost-calibration",
      title: "Reconcile the catalog cost estimate",
      category: "Integration",
      evidence: `Across ${usage.usdCalls} calls with USD usage, the backend reserved $${(usage.estimatedMicrosForUsdCalls / 1e6).toFixed(3)} and the provider reported $${usage.reportedUsd.toFixed(3)}. Provider usage is not a reconciled invoice.`,
      hypothesis:
        "A stale estimate may distort cost-based tool choices even when the integration works.",
      action:
        "Compare the current published price and account plan with the adapter settings. Update the backend estimate if supported; preserve historical rate cards.",
      successMeasure:
        "Check the new catalog estimate against subsequent provider-reported usage. Separately test whether external-agent choices change.",
      verification: "integration",
    });
  }
  if (provider === "exa")
    opportunities.push({
      id: "explain-content",
      title: "Make the included page text easier to discover",
      category: "Positioning",
      evidence:
        source === "demo"
          ? "Illustrative scenario: Exa was chosen in 54 of 240 offered sessions. This does not identify why it was skipped."
          : "The adapter requests page text with search. Its former catalog description did not explain that difference. Selection impact has not been measured.",
      hypothesis:
        "Explicitly describing bundled page text may help agents choose Exa when it can avoid an additional extraction.",
      action:
        "Compare the previous and current tool description in matched external-agent tasks; keep provider settings and budgets fixed.",
      successMeasure:
        "Compare selection and total task cost, and independently review answer quality. Forced-provider tests cannot measure agent preference.",
      verification: "agent_choice",
    });
  if (metric.attempted === 0)
    opportunities.push({
      id: "baseline",
      title: "Build a measured baseline",
      category: "Coverage",
      evidence:
        "No completed controlled sample is available for this provider.",
      hypothesis:
        "A forced-provider run will reveal execution behavior and reference coverage without relying on organic selection.",
      action:
        "Run the public reference suite with the relevant providers, then inspect the returned evidence.",
      successMeasure:
        "Record the same test cases and settings for every comparison. Review usefulness before making quality claims.",
      verification: "retrieval",
    });
  if (metric.referenceKnown > metric.referencePassed)
    opportunities.push({
      id: "reference-gaps",
      title: isExtractProvider(provider)
        ? "Inspect pages that missed the reference check"
        : "Inspect missed reference pages",
      category: "Coverage",
      evidence: `${metric.referenceKnown - metric.referencePassed} of ${metric.referenceKnown} known checks missed the predefined reference.${source === "demo" ? " These are simulated results." : ""}`,
      hypothesis:
        "The missed reference may indicate a retrieval gap, an alternate useful source, or an overly narrow test.",
      action:
        "Inspect each receipt before assigning a cause. Adjust the tool or the test only after identifying which case applies.",
      successMeasure:
        "Repeat the same versioned cases after one documented change and compare reference matches alongside usefulness reviews.",
      verification: "retrieval",
    });
  if (metric.truncated > 0)
    opportunities.push({
      id: "capture-limit",
      title: "Check what the capture limit leaves out",
      category: "Integration",
      evidence: `${metric.truncated} receipts are marked truncated. Two Hands currently captures at most 20,000 extraction characters; this is a host integration limit, not proof of a provider defect.`,
      hypothesis:
        "Important specifications may fall after the captured section on long pages.",
      action:
        "Inspect affected receipts and test a larger or targeted capture in the integration. Preserve truncation metadata.",
      successMeasure:
        "Verify that the required passage is captured and review added latency and cost on the same URLs.",
      verification: "integration",
    });
  if (metric.reviewed < metric.attempted)
    opportunities.push({
      id: "review-evidence",
      title: "Turn execution data into evidence feedback",
      category: "Evaluation",
      evidence: `${metric.reviewed} of ${metric.attempted} settled test calls have a known usefulness verdict.${source === "demo" ? " These reviews are illustrative." : ""}`,
      hypothesis:
        "A small reviewed sample can distinguish transport success from evidence that helps the task.",
      action:
        "Review the captured results against each test question. Mark useful, partial, not useful, or unknown and explain the judgment.",
      successMeasure:
        "Track review coverage and preserve uncertainty. Do not generalize from this small diagnostic sample.",
      verification: "retrieval",
    });
  return {
    provider,
    source,
    sourceLabel:
      source === "demo" ? "Simulated demo data" : "Local lab preview",
    period:
      source === "demo"
        ? "Illustrative 30-day window"
        : "Local workspace history + latest completed test",
    organic,
    privateActivity,
    organicUnavailableReason: null,
    benchmarks,
    benchmarkRunId: source === "demo" ? null : (latest?.id ?? null),
    usage,
    benchmarkLabel:
      source === "demo"
        ? "Illustrative controlled sample · 30 calls per provider"
        : latest
          ? `${latest.suiteVersion} · ${latest.createdAt}`
          : "No completed test run",
    opportunities,
    capabilities: toolCapabilities[toolForProvider(provider)],
  };
}
