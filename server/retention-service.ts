import { createHash } from "node:crypto";
import type { Store } from "./store.js";
type Stored = { id: string; [key: string]: any };
export interface RetentionPlan {
  workspaceId: string;
  cutoff: string;
  tasks: string[];
  sessions: string[];
  runs: string[];
  plans: string[];
  digest: string;
}
async function readPlan(store: Store, cutoff: string): Promise<RetentionPlan> {
  if (!Number.isFinite(Date.parse(cutoff)))
    throw new Error("Invalid retention cutoff.");
  const bodies = async (table: string) =>
    (await store.db.prepare(`SELECT id,body FROM ${table}`).all()).map(
      (r) => JSON.parse(String(r.body)) as Stored,
    );
  // These table names are static application constants, never caller input.
  const tasks = await bodies("tasks"),
    sessions = await bodies("observation_sessions"),
    calls = await bodies("observation_calls"),
    runs = await bodies("provider_lab_runs"),
    plans = await bodies("provider_experiments");
  const expired = (value: unknown) =>
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) < Date.parse(cutoff);
  const taskIds = tasks
    .filter(
      (t) =>
        expired(t.updatedAt) &&
        t.status !== "running" &&
        !(t.reservedMicros > 0),
    )
    .map((t) => t.id)
    .sort();
  const activeSessions = new Set(
    calls.filter((c) => c.status === "running").map((c) => c.sessionId),
  );
  const sessionIds = sessions
    .filter(
      (s) =>
        expired(s.updatedAt) &&
        !(s.reservedMicros > 0) &&
        !activeSessions.has(s.id) &&
        !(s.cases ?? []).some((c: any) => c.status === "open"),
    )
    .map((s) => s.id)
    .sort();
  const planIds = plans
    .filter((p) => p.status === "reviewed" && expired(p.updatedAt))
    .map((p) => p.id)
    .sort();
  const deletedPlans = new Set(planIds);
  const protectedRuns = new Set(
    plans
      .filter((p) => !deletedPlans.has(p.id))
      .flatMap((p) => [p.baselineRunId, p.followupRunId])
      .filter(Boolean),
  );
  const candidates = new Set(
    runs
      .filter(
        (r) =>
          r.status !== "running" &&
          !(r.reservedMicros > 0) &&
          expired(
            [
              r.createdAt,
              r.finishedAt ?? r.createdAt,
              ...(r.calls ?? []).flatMap((c: any) =>
                (c.reviews ?? []).map((v: any) => v.at),
              ),
            ]
              .sort()
              .at(-1),
          ),
      )
      .map((r) => r.id),
  );
  // A retained replay must retain its source. Iterate so chains also remain intact.
  let changed = true;
  while (changed) {
    changed = false;
    for (const run of runs)
      if (!candidates.has(run.id) || protectedRuns.has(run.id)) {
        if (run.sourceRunId && !protectedRuns.has(run.sourceRunId)) {
          protectedRuns.add(run.sourceRunId);
          changed = true;
        }
      }
  }
  const runIds = [...candidates].filter((id) => !protectedRuns.has(id)).sort();
  const base = {
    workspaceId: store.workspaceId,
    cutoff,
    tasks: taskIds,
    sessions: sessionIds,
    runs: runIds,
    plans: planIds,
  };
  return {
    ...base,
    digest: createHash("sha256").update(JSON.stringify(base)).digest("hex"),
  };
}
export async function retentionPlan(store: Store, cutoff: string) {
  return store.db.atomic(() => readPlan(store, cutoff));
}
export async function applyRetention(
  store: Store,
  cutoff: string,
  expectedDigest?: string,
) {
  return store.db.transaction(async () => {
    const plan = await readPlan(store, cutoff);
    if (expectedDigest && expectedDigest !== plan.digest)
      throw new Error(
        "Retention plan changed. Run a fresh dry run before applying.",
      );
    for (const id of plan.tasks)
      await store.db.prepare("DELETE FROM tasks WHERE id=?").run(id);
    for (const id of plan.sessions)
      await store.db
        .prepare("DELETE FROM observation_sessions WHERE id=?")
        .run(id);
    for (const id of plan.plans)
      await store.db
        .prepare("DELETE FROM provider_experiments WHERE id=?")
        .run(id);
    for (const id of plan.runs)
      await store.db
        .prepare("DELETE FROM provider_lab_runs WHERE id=?")
        .run(id);
    return plan;
  });
}
