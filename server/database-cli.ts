import { PostgresDatabase } from "./database.js";
import {
  applyMigrations,
  importSqlite,
  readSqliteSnapshot,
  claimRuntime,
} from "./migration.js";
const command = process.argv[2];
if (command === "inspect") {
  const { workspaceId, counts, digest } = readSqliteSnapshot(
    process.env.DB_PATH || "./data/apilayer.sqlite",
  );
  console.log(JSON.stringify({ workspaceId, counts, digest }, null, 2));
} else {
  if (!process.env.DATABASE_URL)
    throw new Error("Set DATABASE_URL in the local environment.");
  const database = new PostgresDatabase(
    process.env.DATABASE_URL,
    () => process.env.LEGACY_WORKSPACE_ID || "",
  );
  try {
    if (command === "migrate") {
      const release = await claimRuntime(database);
      try {
        await applyMigrations(database);
      } finally {
        await release();
      }
      console.log("Postgres schema migrations verified.");
    } else if (command === "import" || command === "verify")
      console.log(
        JSON.stringify(
          await importSqlite(
            database,
            process.env.DB_PATH || "./data/apilayer.sqlite",
            process.env.LEGACY_OWNER_USER_ID || "",
            command === "verify",
          ),
          null,
          2,
        ),
      );
    else
      throw new Error("Use db:inspect, db:migrate, db:import, or db:verify.");
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "Database operation failed.",
    );
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}
