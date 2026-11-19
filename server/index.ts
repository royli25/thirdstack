import { Accounts } from "./accounts.js";
import { config } from "./config.js";
import { PostgresDatabase } from "./database.js";
import { claimRuntime, verifyMigrations } from "./migration.js";
import { openConfiguredStore } from "./runtime-storage.js";
import { Engine } from "./engine.js";
import { createApp } from "./app.js";
import { Observatory } from "./observation.js";
if (
  !["127.0.0.1", "localhost", "::1"].includes(config.host) &&
  config.token.length < 24 &&
  config.storageBackend !== "postgres"
)
  throw new Error(
    "Set API_TOKEN to at least 24 characters before binding beyond loopback.",
  );
if (!["sqlite", "postgres"].includes(config.storageBackend))
  throw new Error("STORAGE_BACKEND must be sqlite or postgres.");
if (config.storageBackend === "postgres" && !config.databaseUrl)
  throw new Error("Set DATABASE_URL before choosing Postgres.");
const store = openConfiguredStore();
if (store.db instanceof PostgresDatabase) {
  try {
    await verifyMigrations(store.db);
  } catch (error) {
    await store.close();
    throw error;
  }
}
const releaseRuntime =
  store.db instanceof PostgresDatabase
    ? await claimRuntime(store.db)
    : undefined;

const engine = new Engine(store);
const observatory = new Observatory(store, undefined, engine.timestamps);
await observatory.ready;
const accounts =
  store.db instanceof PostgresDatabase ? new Accounts(store) : undefined;
const app = createApp(
  store,
  engine,
  observatory,
  undefined,
  undefined,
  undefined,
  accounts,
);
await app.locals.toolSettings.ready;
const workspaceIds =
  store.db instanceof PostgresDatabase
    ? (
        await store.db.pool.query(
          "SELECT id FROM octolab.workspaces ORDER BY id",
        )
      ).rows.map((r) => String(r.id))
    : [store.legacyWorkspaceId];
for (const id of workspaceIds)
  await store.scope.run(id, async () => {
    await app.locals.funding.ledger.importHistorical();
    await store.recover();
    await observatory.db.applySharingPolicy();
    await observatory.db.recover();
    await app.locals.providerLab.recover();
    await store.allowance.recover();
  });
const server = app.listen(config.port, config.host, () =>
  console.log(
    `APILayer listening at http://${config.host}:${config.port}; provider credentials stay on the server.`,
  ),
);
let shuttingDown = false;
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.locals.mcp.refuse();
    let httpClosed = false;
    server.close(() => {
      httpClosed = true;
    });
    for (const id of engine.active) await engine.cancel(id);
    for (const id of app.locals.providerLab.active)
      app.locals.providerLab.cancel(id);
    const deadline = setTimeout(
      () => process.exit(1),
      Math.max(config.timeoutMs, 60000) + 3000,
    );
    deadline.unref();
    const drain = setInterval(async () => {
      if (
        httpClosed &&
        engine.active.size === 0 &&
        observatory.active.size === 0 &&
        app.locals.providerLab.active.size === 0 &&
        app.locals.funding.active.size === 0 &&
        app.locals.stripeFunding.active.size === 0 &&
        app.locals.stripeFunding.creating.size === 0
      ) {
        clearInterval(drain);
        clearTimeout(deadline);
        await app.locals.mcp.close();
        await releaseRuntime?.();
        await store.close();
        process.exit(0);
      }
    }, 50);
  });
