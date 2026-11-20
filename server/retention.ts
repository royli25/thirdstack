import { existsSync } from "node:fs";
import { config } from "./config.js";
import { PostgresDatabase } from "./database.js";
import { claimRuntime } from "./migration.js";
import { openConfiguredStore } from "./runtime-storage.js";
import { retentionPlan, applyRetention } from "./retention-service.js";
const days = Number(process.env.RETENTION_DAYS ?? 30);
if (!Number.isInteger(days) || days < 1)
  throw new Error("RETENTION_DAYS must be a positive integer.");
const args = process.argv.slice(2);
if (
  args.some((arg) => arg !== "--apply" && !arg.startsWith("--expect-digest="))
)
  throw new Error(
    "Use retention [--apply] [--expect-digest=SHA256]. Without --apply this is a dry run.",
  );
const workspace = process.env.RETENTION_WORKSPACE_ID || "";
if (config.storageBackend === "postgres" && !workspace)
  throw new Error(
    "Set RETENTION_WORKSPACE_ID explicitly. Maintenance never selects another workspace automatically.",
  );
if (config.storageBackend === "sqlite" && !existsSync(config.dbPath))
  throw new Error("SQLite source does not exist. Check DB_PATH.");
const store = openConfiguredStore(
  config,
  workspace || config.legacyWorkspaceId,
);
let release: (() => Promise<void>) | undefined;
try {
  if (store.db instanceof PostgresDatabase) {
    release = await claimRuntime(store.db);
    if (
      !(
        await store.db.pool.query(
          "SELECT 1 FROM octolab.workspaces WHERE id=$1",
          [workspace],
        )
      ).rowCount
    )
      throw new Error("Retention workspace does not exist.");
  } else if (workspace && workspace !== store.workspaceId)
    throw new Error("Retention workspace does not match the SQLite source.");
  const cutoff =
    process.env.RETENTION_CUTOFF ||
    new Date(Date.now() - days * 86400000).toISOString();
  const apply = args.includes("--apply");
  const plan = apply
    ? await applyRetention(
        store,
        cutoff,
        args.find((arg) => arg.startsWith("--expect-digest="))?.split("=")[1],
      )
    : await retentionPlan(store, cutoff);
  console.log(
    JSON.stringify(
      {
        mode: apply ? "applied" : "dry_run",
        backend: store.db.dialect,
        workspaceId: plan.workspaceId,
        cutoff: plan.cutoff,
        digest: plan.digest,
        counts: {
          tasks: plan.tasks.length,
          sessions: plan.sessions.length,
          runs: plan.runs.length,
          plans: plan.plans.length,
        },
      },
      null,
      2,
    ),
  );
  if (apply)
    console.log(
      `Deleted ${plan.tasks.length} research tasks, ${plan.sessions.length} observation sessions, ${plan.runs.length} provider runs, and ${plan.plans.length} reviewed plans.`,
    );
} finally {
  await release?.();
  await store.close();
}
