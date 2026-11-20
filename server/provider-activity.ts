import { providerIds } from "./provider-catalog.js";
import type { Observatory } from "./observation.js";
import type { ProviderId } from "./types.js";

/** Owner-only workspace analytics, never a commercial aggregate export. */
export async function providerActivity(
  obs: Observatory,
  provider: ProviderId,
  days: number,
  now = new Date(),
) {
  const end = now.toISOString();
  const startDate = new Date(now);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);
  startDate.setUTCHours(0, 0, 0, 0);
  const start = startDate.toISOString();
  const sessions = await obs.db.list();
  const histories = await Promise.all(
    sessions.map(async (session) => ({
      session,
      calls: await obs.db.calls(session.id),
    })),
  );
  const inWindow = (at: string) => at >= start && at <= end;
  const relevant = histories.filter((h) =>
    h.calls.some((c) => c.provider === provider && inWindow(c.startedAt)),
  );
  const calls = relevant
    .flatMap((h) => h.calls)
    .filter((c) => c.provider === provider && inWindow(c.startedAt));
  const settled = calls.filter((c) => c.status !== "running");
  const latencies = settled
    .flatMap((c) => (c.latencyMs === undefined ? [] : [c.latencyMs]))
    .sort((a, b) => a - b);
  const referenced = new Set(
    relevant.flatMap((h) =>
      h.session.outcomes.flatMap((o) => o.evidenceCallIds),
    ),
  );
  const daily = Array.from({ length: days }, (_, i) => {
    const day = new Date(startDate);
    day.setUTCDate(day.getUTCDate() + i);
    const date = day.toISOString().slice(0, 10);
    const rows = calls.filter((c) => c.startedAt.startsWith(date));
    return {
      date,
      calls: rows.length,
      succeeded: rows.filter((c) => c.status === "succeeded").length,
      failed: rows.filter((c) => ["failed", "interrupted"].includes(c.status))
        .length,
      estimatedMicros: rows
        .filter((c) => c.status !== "running")
        .reduce((n, c) => n + c.estimateMicros, 0),
    };
  });
  const coUsage = (providerIds as ProviderId[])
    .filter((p) => p !== provider)
    .map((p) => ({
      provider: p,
      sessions: relevant.filter((h) =>
        h.calls.some((c) => c.provider === p && inWindow(c.startedAt)),
      ).length,
    }));
  const hosts = new Map<
    string,
    { host: string; sessions: number; calls: number; succeeded: number }
  >();
  for (const h of relevant) {
    const host = h.session.host.trim().slice(0, 120) || "Unreported";
    const group = hosts.get(host) ?? {
      host,
      sessions: 0,
      calls: 0,
      succeeded: 0,
    };
    const rows = h.calls.filter(
      (c) => c.provider === provider && inWindow(c.startedAt),
    );
    group.sessions++;
    group.calls += rows.length;
    group.succeeded += rows.filter((c) => c.status === "succeeded").length;
    hosts.set(host, group);
  }
  const errors = new Map<string, number>();
  for (const c of settled.filter((c) => c.status !== "succeeded")) {
    const label =
      c.status === "interrupted"
        ? "Interrupted · billing uncertain"
        : c.httpStatus
          ? `HTTP ${c.httpStatus}`
          : "Request failed · status unreported";
    errors.set(label, (errors.get(label) ?? 0) + 1);
  }
  const reportedUsd = settled.filter(
    (c) =>
      typeof (c.result?.usage as Record<string, unknown> | undefined)
        ?.providerReportedUsd === "number",
  );
  return {
    source: "workspace_observed" as const,
    scope: "private_workspace" as const,
    provider,
    days,
    start,
    end,
    generatedAt: end,
    lastObservedAt:
      calls
        .map((c) => c.startedAt)
        .sort()
        .at(-1) ?? null,
    sessions: relevant.length,
    calls: calls.length,
    settled: settled.length,
    succeeded: settled.filter((c) => c.status === "succeeded").length,
    failed: settled.filter((c) => c.status === "failed").length,
    interrupted: settled.filter((c) => c.status === "interrupted").length,
    running: calls.filter((c) => c.status === "running").length,
    referenced: settled.filter((c) => referenced.has(c.id)).length,
    medianLatencyMs: latencies.length
      ? (latencies[Math.floor((latencies.length - 1) / 2)] +
          latencies[Math.floor(latencies.length / 2)]) /
        2
      : null,
    p95LatencyMs: latencies.length
      ? latencies[Math.ceil(latencies.length * 0.95) - 1]
      : null,
    estimatedMicros: settled.reduce((n, c) => n + c.estimateMicros, 0),
    reportedUsd: reportedUsd.reduce(
      (n, c) =>
        n +
        Number(
          (c.result!.usage as Record<string, unknown>).providerReportedUsd,
        ),
      0,
    ),
    usdReportingCalls: reportedUsd.length,
    daily,
    coUsage,
    hosts: [...hosts.values()].sort((a, b) => b.calls - a.calls),
    errors: [...errors].map(([label, count]) => ({ label, count })),
    limitations:
      "Only calls through Two Hands are observed. Hosts are caller-reported, not verified identities. Co-usage means tools were called in the same recorded session, not a causal workflow or a customer relationship. Small private account samples are not commercial exports. Controlled runs and replays are excluded.",
  };
}
export type ProviderActivity = Awaited<ReturnType<typeof providerActivity>>;
