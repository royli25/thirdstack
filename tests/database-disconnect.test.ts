import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const url = process.env.OCTOLAB_DISCONNECT_TEST_POSTGRES_URL;
const run = promisify(execFile);
const script = `
import pg from "pg";
import { randomUUID } from "node:crypto";
import { PostgresDatabase } from "./server/database.ts";
import { claimRuntime } from "./server/migration.ts";
const url = process.env.OCTOLAB_DISCONNECT_TEST_POSTGRES_URL;
const target = new URL(url);
const dedicated = target.pathname.startsWith("/octolab_disconnect_") ||
  (process.env.CI === "true" && target.pathname === "/octolab_ci");
if (target.hostname !== "127.0.0.1" || !dedicated) {
  throw new Error("This disconnect drill requires a dedicated local fixture database.");
}
const db = new PostgresDatabase(url, () => "");
const control = new pg.Client({ connectionString: url });
await control.connect();
if (process.env.DISCONNECT_MODE === "runtime") {
  let owner;
  db.pool.once("acquire", client => { owner = client; });
  await claimRuntime(db);
  const pid = (await owner.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
  await control.query("SELECT pg_terminate_backend($1)", [pid]);
  await new Promise(resolve => setTimeout(resolve, 2000));
  throw new Error("Runtime ownership loss must stop the process.");
}
await control.query("CREATE TABLE IF NOT EXISTS public.disconnect_regression(id TEXT PRIMARY KEY)");
const id = randomUUID();
const client = await db.pool.connect();
await client.query("BEGIN");
await client.query("INSERT INTO public.disconnect_regression VALUES($1)", [id]);
const pid = (await client.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
const ended = new Promise(resolve => client.once("end", resolve));
await control.query("SELECT pg_terminate_backend($1)", [pid]);
await ended;
let rejected = false;
try { await client.query("COMMIT"); } catch { rejected = true; }
client.release();
const rows = (await control.query("SELECT count(*)::int AS count FROM public.disconnect_regression WHERE id=$1", [id])).rows[0].count;
const freshQuery = (await db.pool.query("SELECT 1 AS value")).rows[0].value;
await control.end();
await db.close();
console.log(JSON.stringify({ rejected, rows, freshQuery }));
`;

describe.skipIf(!url)("database disconnect recovery", () => {
  it("survives a checked-out connection reset, rolls back the write, and reconnects", async () => {
    const result = await run(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "--eval", script],
      { env: { ...process.env, DISCONNECT_MODE: "checkout" }, timeout: 10000 },
    );
    expect(JSON.parse(result.stdout.trim())).toEqual({
      rejected: true,
      rows: 0,
      freshQuery: 1,
    });
    expect(result.stderr).not.toContain("Unhandled 'error' event");
  });

  it("still stops safely when the database ownership connection is lost", async () => {
    const result = await run(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "--eval", script],
      { env: { ...process.env, DISCONNECT_MODE: "runtime" }, timeout: 10000 },
    ).then(
      () => ({ code: 0, stderr: "" }),
      (error: { code: number; stderr: string }) => error,
    );
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Database runtime ownership was lost");
    expect(result.stderr).not.toContain("Unhandled 'error' event");
  });
});
