import { randomUUID } from "node:crypto";
import { PostgresDatabase } from "../../server/database";
import type { Store } from "../../server/store";
/** Disposable loopback PostgreSQL fixtures only; never creates a hosted grant. */
export async function grantFixtureAllowance(
  store: Store,
  limitMicros = 1_000_000,
) {
  if (!(store.db instanceof PostgresDatabase)) return;
  const url = new URL(String(store.db.pool.options.connectionString));
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new Error(
      "Fixture allowances require a disposable loopback database.",
    );
  const current = await store.allowance.status();
  return store.allowance.change(store.workspaceId, randomUUID(), {
    requestKey: randomUUID(),
    revision: current.revision,
    limitMicros,
    paused: false,
    reason: "Isolated fixture allowance; no real provider transports.",
  });
}
