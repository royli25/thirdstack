import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import { retentionPlan, applyRetention } from "../server/retention-service";
import { openConfiguredStore } from "../server/runtime-storage";
const cutoff = "2020-01-01T00:00:00.000Z";
const old = "2000-01-01T00:00:00.000Z";
async function seed(store: Store) {
  const insert = async (table: string, value: Record<string, unknown>) => {
    if (table === "observation_calls")
      await store.db
        .prepare(
          "INSERT INTO observation_calls(id,session_id,request_key,signature,body) VALUES(?,?,?,?,?)",
        )
        .run(
          value.id,
          value.sessionId,
          value.id,
          "fixture",
          JSON.stringify(value),
        );
    else if (table === "provider_lab_runs")
      await store.db
        .prepare(
          "INSERT INTO provider_lab_runs(id,request_key,body) VALUES(?,?,?)",
        )
        .run(value.id, value.id, JSON.stringify(value));
    else
      await store.db
        .prepare(`INSERT INTO ${table}(id,body) VALUES(?,?)`)
        .run(value.id, JSON.stringify(value));
  };
  const sessions = [
    "expired",
    "active",
    "held",
    "reserved",
    "recent",
    "boundary",
  ].map((id) => ({
    id,
    status: "active",
    updatedAt:
      id === "recent"
        ? "2025-01-01T00:00:00Z"
        : id === "boundary"
          ? cutoff
          : old,
    reservedMicros: id === "reserved" ? 1 : 0,
    cases: id === "held" ? [{ status: "open" }] : [],
  }));
  for (const s of sessions) await insert("observation_sessions", s);
  await insert("observation_calls", {
    id: "active-call",
    sessionId: "active",
    status: "running",
  });
  await insert("tasks", {
    id: "expired-task",
    updatedAt: old,
    status: "complete",
    reservedMicros: 0,
  });
  await insert("tasks", {
    id: "reserved-task",
    updatedAt: old,
    status: "partial",
    reservedMicros: 10,
  });
  const run = (id: string, extra = {}) => ({
    id,
    status: "completed",
    createdAt: old,
    calls: [],
    ...extra,
  });
  await insert("provider_lab_runs", run("old-source"));
  await insert(
    "provider_lab_runs",
    run("recent-replay", {
      sourceRunId: "old-source",
      createdAt: "2025-01-01T00:00:00Z",
    }),
  );
  await insert("provider_lab_runs", run("linked-source"));
  await insert("provider_lab_runs", run("expired-run"));
  await insert("provider_experiments", {
    id: "unfinished",
    status: "planned",
    updatedAt: old,
    baselineRunId: "linked-source",
  });
}
async function scenario(store: Store) {
  await seed(store);
  const plan = await retentionPlan(store, cutoff);
  expect(plan).toMatchObject({
    tasks: ["expired-task"],
    sessions: ["expired"],
    runs: ["expired-run"],
    plans: [],
  });
  expect(await retentionPlan(store, cutoff)).toEqual(plan);
  expect(
    (
      await store.db
        .prepare("SELECT id FROM observation_sessions WHERE id=?")
        .get("expired")
    )?.id,
  ).toBe("expired");
  await expect(applyRetention(store, cutoff, "stale-plan")).rejects.toThrow(
    "plan changed",
  );
  expect(
    (
      await store.db
        .prepare("SELECT id FROM tasks WHERE id=?")
        .get("expired-task")
    )?.id,
  ).toBe("expired-task");
  const prepare = store.db.prepare.bind(store.db);
  const fault = vi.spyOn(store.db, "prepare").mockImplementation((sql) => {
    if (sql === "DELETE FROM observation_sessions WHERE id=?")
      throw new Error("Fixture maintenance interruption");
    return prepare(sql);
  });
  try {
    await expect(applyRetention(store, cutoff, plan.digest)).rejects.toThrow(
      "Fixture maintenance interruption",
    );
  } finally {
    fault.mockRestore();
  }
  expect(
    await store.db
      .prepare("SELECT id FROM tasks WHERE id=?")
      .get("expired-task"),
  ).toBeDefined();
  expect(
    await store.db
      .prepare("SELECT id FROM observation_sessions WHERE id=?")
      .get("boundary"),
  ).toBeDefined();
  await applyRetention(store, cutoff, plan.digest);
  expect(
    await store.db
      .prepare("SELECT id FROM observation_sessions WHERE id=?")
      .get("expired"),
  ).toBeUndefined();
  expect(
    await store.db
      .prepare("SELECT id FROM provider_lab_runs WHERE id=?")
      .get("old-source"),
  ).toBeDefined();
  expect(
    await store.db
      .prepare("SELECT id FROM provider_lab_runs WHERE id=?")
      .get("linked-source"),
  ).toBeDefined();
  expect((await retentionPlan(store, cutoff)).sessions).toEqual([]);
}
describe("retention planning", () => {
  it("defaults storage selection explicitly and rejects unsupported backends", () => {
    expect(() =>
      openConfiguredStore({
        storageBackend: "wrong",
        databaseUrl: "",
        dbPath: ":memory:",
        legacyWorkspaceId: "",
      }),
    ).toThrow("sqlite or postgres");
    expect(() =>
      openConfiguredStore({
        storageBackend: "postgres",
        databaseUrl: "",
        dbPath: ":memory:",
        legacyWorkspaceId: "",
      }),
    ).toThrow("DATABASE_URL");
  });
  it("previews and applies SQLite retention while preserving active evidence and replay relationships", async () => {
    const store = new Store(":memory:");
    try {
      await scenario(store);
    } finally {
      await store.close();
    }
  });
});
const pgUrl = process.env.OCTOLAB_TEST_POSTGRES_URL;
(pgUrl ? it : it.skip)(
  "retention uses PostgreSQL workspace RLS and never deletes a neighboring tenant",
  async () => {
    const first = randomUUID(),
      second = randomUUID();
    const store = new Store(":unused:", pgUrl!, first);
    const db = store.db as PostgresDatabase;
    try {
      await applyMigrations(db);
      await db.pool.query(
        "INSERT INTO octolab.workspaces(id,name) VALUES($1,$2),($3,$4)",
        [first, "Retention fixture A", second, "Retention fixture B"],
      );
      await store.scope.run(second, () => seed(store));
      await store.scope.run(first, () => scenario(store));
      const other = await store.scope.run(second, () =>
        retentionPlan(store, cutoff),
      );
      expect(other.sessions).toEqual(["expired"]);
      expect(other.tasks).toEqual(["expired-task"]);
    } finally {
      await store.close();
    }
  },
);
