import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import type { PoolClient } from "pg";
import { PostgresDatabase } from "./database.js";
import { SQLITE_SCHEMA } from "./sqlite-schema.js";
export const STORAGE_TABLES = [
  ...SQLITE_SCHEMA.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\(/g),
]
  .map((m) => m[1])
  // Seller state is keyed by provider, not by workspace. Hosted mode keeps it in its
  // own tables, so it is never part of a workspace import. Company connectors are
  // likewise global catalog state; hosted companies register them again.
  .filter(
    (t) =>
      t !== "api_key_workspace" &&
      !t.startsWith("seller_") &&
      !t.startsWith("connector"),
  );
export const RUNTIME_LOCK = "octolab-runtime-v1";
/** Refuse to serve a release whose database migrations have not been installed. */
export async function verifyMigrations(database: PostgresDatabase) {
  const dir = new URL("../supabase/migrations/", import.meta.url);
  const files = (await readdir(dir))
    .filter((file) => /^\d+_[a-z_]+\.sql$/.test(file))
    .sort();
  let rows: { name: string; digest: string }[];
  try {
    rows = (
      await database.pool.query<{ name: string; digest: string }>(
        "SELECT name,digest FROM octolab_migrations.versions",
      )
    ).rows;
  } catch (error) {
    if ((error as { code?: string }).code !== "42P01") throw error;
    throw new Error(
      "Postgres schema migrations are not installed. Stop the server and run npm run db:migrate before restarting.",
      { cause: error },
    );
  }
  const applied = new Map(rows.map((row) => [row.name, row.digest]));
  const pending: string[] = [];
  for (const file of files) {
    const previous = applied.get(file);
    if (!previous) {
      pending.push(file);
      continue;
    }
    const digest = createHash("sha256")
      .update(await readFile(new URL(file, dir), "utf8"))
      .digest("hex");
    if (previous !== digest)
      throw new Error(
        "An applied migration was changed. Restore it and add a new migration.",
      );
  }
  if (pending.length)
    throw new Error(
      `Postgres schema is behind this release (${pending.join(", ")}). Stop the server and run npm run db:migrate before restarting.`,
    );
}
export async function applyMigrations(database: PostgresDatabase) {
  const client = await database.pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('octolab-schema-v1',0))",
    );
    await client.query(
      "CREATE SCHEMA IF NOT EXISTS octolab_migrations; REVOKE ALL ON SCHEMA octolab_migrations FROM PUBLIC; CREATE TABLE IF NOT EXISTS octolab_migrations.versions(name TEXT PRIMARY KEY,digest TEXT NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT now()); ALTER TABLE octolab_migrations.versions ENABLE ROW LEVEL SECURITY;",
    );
    const dir = new URL("../supabase/migrations/", import.meta.url);
    for (const file of (await readdir(dir))
      .filter((f) => /^\d+_[a-z_]+\.sql$/.test(f))
      .sort()) {
      const sql = await readFile(new URL(file, dir), "utf8"),
        digest = createHash("sha256").update(sql).digest("hex");
      const previous = await client.query(
        "SELECT digest FROM octolab_migrations.versions WHERE name=$1",
        [file],
      );
      if (previous.rowCount) {
        if (previous.rows[0].digest !== digest)
          throw new Error(
            "An applied migration was changed. Restore it and add a new migration.",
          );
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO octolab_migrations.versions(name,digest) VALUES($1,$2)",
        [file, digest],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
export async function claimRuntime(
  database: PostgresDatabase,
  onLost = () => {
    console.error(
      "Database runtime ownership was lost; stopping before recovery can overlap another server.",
    );
    process.exit(1);
  },
) {
  const client = await database.pool.connect();
  const result = await client.query(
    "SELECT pg_try_advisory_lock(hashtextextended($1,0)) AS acquired",
    [RUNTIME_LOCK],
  );
  if (!result.rows[0].acquired) {
    client.release();
    throw new Error(
      "Another octolab server or import owns this database. Stop it before starting recovery.",
    );
  }
  client.on("error", onLost);
  client.on("end", onLost);
  return async () => {
    client.off("error", onLost);
    client.off("end", onLost);
    await client.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
      RUNTIME_LOCK,
    ]);
    client.release();
  };
}
type SnapshotTable = {
  name: string;
  columns: string[];
  rows: Record<string, any>[];
};
export function readSqliteSnapshot(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec("BEGIN");
    const workspace = db
      .prepare("SELECT workspace_id FROM api_key_workspace WHERE id=1")
      .get();
    if (!workspace)
      throw new Error(
        "Source has no workspace identity. Start the existing SQLite version once before exporting.",
      );
    const tables: SnapshotTable[] = [];
    for (const name of STORAGE_TABLES) {
      if (
        !db
          .prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?")
          .get(name)
      )
        continue;
      const columns = db
        .prepare(`PRAGMA table_info(${name})`)
        .all()
        .map((r) => String(r.name));
      const rows = db
        .prepare(
          `SELECT rowid AS _migration_order,* FROM ${name} ORDER BY rowid`,
        )
        .all();
      tables.push({ name, columns, rows });
    }
    const digest = createHash("sha256")
      .update(JSON.stringify(tables))
      .digest("hex");
    return {
      workspaceId: String(workspace.workspace_id),
      digest,
      tables,
      counts: Object.fromEntries(tables.map((t) => [t.name, t.rows.length])),
    };
  } catch (error) {
    if (error instanceof Error && /locked|busy/.test(error.message))
      throw new Error(
        "Stop the SQLite server before importing. Its exclusive lock protects active payments and provider calls.",
      );
    throw error;
  } finally {
    db.close();
  }
}
function rowDigest(rows: Record<string, any>[], columns: string[]) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        rows.map((r) =>
          columns.map((c) => (r[c] === null ? null : String(r[c]))),
        ),
      ),
    )
    .digest("hex");
}
export async function importSqlite(
  database: PostgresDatabase,
  path: string,
  ownerUserId: string,
  verifyOnly = false,
) {
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(ownerUserId))
    throw new Error(
      "Provide the intended legacy owner's Supabase user UUID explicitly.",
    );
  const snapshot = readSqliteSnapshot(path);
  const client = await database.pool.connect();
  try {
    await client.query("BEGIN");
    const lock = await client.query(
      "SELECT pg_try_advisory_xact_lock(hashtextextended($1,0)) AS acquired",
      [RUNTIME_LOCK],
    );
    if (!lock.rows[0].acquired)
      throw new Error(
        "Stop the Postgres server before importing or verifying the cutover snapshot.",
      );
    const old = await client.query(
      "SELECT source_digest FROM octolab.migration_imports WHERE workspace_id=$1",
      [snapshot.workspaceId],
    );
    if (old.rowCount && old.rows[0].source_digest !== snapshot.digest)
      throw new Error(
        "This workspace was imported from a different snapshot. Refusing to overwrite data.",
      );
    const alreadyImported = !!old.rowCount;
    if (!alreadyImported && verifyOnly)
      throw new Error("No completed import exists for this workspace.");
    if (!alreadyImported) {
      for (const name of STORAGE_TABLES) {
        const existing = await client.query(
          `SELECT 1 FROM octolab.${name} WHERE workspace_id=$1 LIMIT 1`,
          [snapshot.workspaceId],
        );
        if (existing.rowCount)
          throw new Error(
            "Destination workspace is not empty. No data was overwritten.",
          );
      }
      await client.query(
        "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Imported account') ON CONFLICT DO NOTHING",
        [snapshot.workspaceId],
      );
      const members = await client.query(
        "SELECT user_id FROM octolab.workspace_memberships WHERE workspace_id=$1",
        [snapshot.workspaceId],
      );
      if (members.rows.some((r) => r.user_id !== ownerUserId))
        throw new Error(
          "Destination already belongs to another account. No ownership was changed.",
        );
      await client.query(
        "INSERT INTO octolab.workspace_memberships VALUES($1,$2,'owner') ON CONFLICT DO NOTHING",
        [snapshot.workspaceId, ownerUserId],
      );
      for (const table of snapshot.tables) {
        const columns = [...table.columns];
        if (!columns.includes("workspace_id")) columns.push("workspace_id");
        columns.push("rowid");
        for (const row of table.rows) {
          const values = columns.map((c) =>
            c === "workspace_id"
              ? snapshot.workspaceId
              : c === "rowid"
                ? row._migration_order
                : row[c],
          );
          await client.query(
            `INSERT INTO octolab.${table.name}(${columns.join(",")}) VALUES(${values.map((_, i) => "$" + (i + 1)).join(",")})`,
            values,
          );
        }
        // Explicit IDs and insertion order are preserved. Advance shared identity sequences safely.
        await advanceSequences(client, table.name);
      }
      await client.query(
        "INSERT INTO octolab.migration_imports(workspace_id,source_digest,counts) VALUES($1,$2,$3)",
        [
          snapshot.workspaceId,
          snapshot.digest,
          JSON.stringify(snapshot.counts),
        ],
      );
    }
    for (const name of STORAGE_TABLES) {
      const table = snapshot.tables.find((t) => t.name === name);
      const count = await client.query(
        `SELECT count(*)::integer AS n FROM octolab.${name} WHERE workspace_id=$1`,
        [snapshot.workspaceId],
      );
      if (count.rows[0].n !== (table?.rows.length ?? 0))
        throw new Error(
          `Import verification failed for ${name}: row count mismatch.`,
        );
      if (table) {
        const rows = await client.query(
          `SELECT ${table.columns.join(",")} FROM octolab.${name} WHERE workspace_id=$1 ORDER BY rowid`,
          [snapshot.workspaceId],
        );
        if (
          rowDigest(rows.rows, table.columns) !==
          rowDigest(table.rows, table.columns)
        )
          throw new Error(
            `Import verification failed for ${name}: content mismatch.`,
          );
      }
    }
    await client.query("COMMIT");
    return {
      workspaceId: snapshot.workspaceId,
      counts: snapshot.counts,
      digest: snapshot.digest,
      verified: true,
      replayed: alreadyImported,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
async function advanceSequences(client: PoolClient, table: string) {
  const columns = await client.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema='octolab' AND table_name=$1 AND is_identity='YES'",
    [table],
  );
  for (const { column_name: column } of columns.rows) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence($1,$2),GREATEST(COALESCE(MAX(${column}),0),1),COALESCE(MAX(${column}),0)>0) FROM octolab.${table}`,
      [`octolab.${table}`, column],
    );
  }
}
