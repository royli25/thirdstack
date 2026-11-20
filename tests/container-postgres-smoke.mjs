// Runs only in an isolated CI container/database. No external Auth or provider requests.
import assert from "node:assert/strict";
import pg from "pg";
const { Store } = await import(`${process.cwd()}/build/store.js`);
const { Observatory } = await import(`${process.cwd()}/build/observation.js`);
import { readFile } from "node:fs/promises";
const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
];
const mode = process.argv[2];
const connection = process.env.DATABASE_URL;
assert.ok(connection, "Explicit fixture connection required");
assert.ok(
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(connection).hostname),
  "Disposable loopback database required",
);
const pool = new pg.Pool({ connectionString: connection });
try {
  if (mode === "recovery-target") {
    await pool.query(
      "CREATE DATABASE octolab_container_restored TEMPLATE template0",
    );
  } else if (mode === "prepare-recovery") {
    // Source runtime is stopped. Preserve an admitted interrupted reservation in the archive.
    const store = new Store(":unused:", connection, ids[1]);
    try {
      await store.allowance.reserve(
        "container-interrupted-fixture",
        "observation",
        7000,
      );
      assert.equal((await store.allowance.status()).reservedMicros, 7000);
    } finally {
      await store.close();
    }
  } else if (mode === "bootstrap") {
    const manifest = JSON.parse(
      await readFile("release-manifest.json", "utf8"),
    );
    const expected = Object.keys(manifest.files).filter(
      (p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql"),
    ).length;
    assert.equal(
      (
        await pool.query(
          "SELECT COUNT(*)::integer AS n FROM octolab_migrations.versions",
        )
      ).rows[0].n,
      expected,
    );
    await pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Container fixture A'),($2,'Container fixture B')",
      ids,
    );
    const store = new Store(":unused:", connection, ids[0]);
    try {
      const obs = new Observatory(store);
      await obs.ready;
      for (const [index, id] of ids.entries())
        await store.scope.run(id, async () => {
          await store.allowance.change(
            id,
            "00000000-0000-4000-8000-000000000003",
            {
              requestKey: crypto.randomUUID(),
              revision: 0,
              limitMicros: 100000,
              paused: false,
              reason: "Isolated container fixture, no provider transport",
            },
          );
          await store.allowance.reserve(
            `container-call-${index}`,
            "observation",
            7000,
          );
          if (index === 0)
            await store.allowance.change(
              id,
              "00000000-0000-4000-8000-000000000003",
              {
                requestKey: crypto.randomUUID(),
                revision: 1,
                limitMicros: 100000,
                paused: true,
                reason: "Preserve paused access through recovery",
              },
            );
          await obs.createAgentSession({
            title: `Container PostgreSQL fixture ${index}`,
            objective:
              "Preserve isolated evidence across runtime restart and restore",
            criteria: [{ text: "Fixture only", weight: 1 }],
            constraints: "",
            model: "fixture",
            host: "container-ci",
          });
        });
    } finally {
      await store.close();
    }
  } else {
    const port = process.env.PORT || "3001",
      origin = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(`${origin}/healthz`)).status, 200);
    for (const path of [
      "/api/observations",
      "/api/account/usage",
      "/api/account/provider-billing",
    ])
      assert.equal((await fetch(origin + path)).status, 401);
    const auth = await (await fetch(`${origin}/api/auth/config`)).json();
    assert.equal(auth.enabled, true);
    const store = new Store(":unused:", connection, ids[0]);
    try {
      const obs = new Observatory(store);
      await obs.ready;
      for (const [index, id] of ids.entries())
        await store.scope.run(id, async () => {
          const expectedSpent =
            mode === "restored" && index === 1 ? 14000 : 7000;
          const current = await store.allowance.status();
          assert.deepEqual(current, {
            enforced: true,
            state: index === 0 ? "paused" : "available",
            limitMicros: 100000,
            spentMicros: expectedSpent,
            reservedMicros: 0,
            remainingMicros: 100000 - expectedSpent,
            revision: index === 0 ? 2 : 1,
            basis: "estimated_provider_spend_since_activation",
          });
          await store.allowance.recover();
          await store.allowance.recover();
          assert.deepEqual(await store.allowance.status(), current);
          const spend = await store.db
            .prepare("SELECT call_id,state FROM workspace_allowance_spend")
            .all();
          assert.equal(
            spend.length,
            mode === "restored" && index === 1 ? 2 : 1,
          );
          assert.equal(
            new Set(spend.map((row) => row.call_id)).size,
            spend.length,
          );
          assert.ok(spend.every((row) => row.state === "settled"));
          assert.deepEqual(
            (
              await store.db
                .prepare("SELECT workspace_id FROM workspace_allowances")
                .all()
            ).map((row) => row.workspace_id),
            [id],
          );
          await assert.rejects(
            store.db
              .prepare(
                "UPDATE workspace_allowances SET limit_micros=? WHERE workspace_id=?",
              )
              .run(1e9, id),
            /permission denied/,
          );
          await assert.rejects(
            store.db.prepare("SELECT * FROM workspace_allowance_events").all(),
            /permission denied/,
          );
          assert.equal(
            (
              await pool.query(
                "SELECT count(*)::int AS n FROM octolab.workspace_allowance_events WHERE workspace_id=$1",
                [id],
              )
            ).rows[0].n,
            index === 0 ? 2 : 1,
          );
          const sessions = await obs.db.list();
          assert.equal(sessions.length, 1);
          assert.equal(
            sessions[0].title,
            `Container PostgreSQL fixture ${index}`,
          );
          assert.equal((await obs.db.detail(sessions[0].id)).integrity, true);
        });
    } finally {
      await store.close();
    }
    console.log(
      "Packaged PostgreSQL runtime is healthy, denies unauthenticated access, preserves audits and isolated workspaces, and settles interrupted allowances once while preserving paused access.",
    );
  }
} finally {
  await pool.end();
}
