import { AsyncLocalStorage } from "node:async_hooks";
import { DatabaseSync } from "node:sqlite";
import pg, { type PoolClient } from "pg";
export type Row = Record<string, any>;
export interface Statement {
  get(...values: any[]): Promise<Row | undefined>;
  all(...values: any[]): Promise<Row[]>;
  run(...values: any[]): Promise<{ changes: number }>;
}
export interface Database {
  readonly dialect: "sqlite" | "postgres";
  prepare(sql: string): Statement;
  exec(sql: string): Promise<void>;
  read<T>(fn: () => T | Promise<T>): Promise<T>;
  transaction<T>(fn: () => T | Promise<T>): Promise<T>;
  atomic<T>(fn: () => T | Promise<T>): Promise<T>;
  close(): Promise<void>;
}
/** SQLite remains available for isolated fixtures and an explicit local rollback. */
export class SqliteDatabase implements Database {
  readonly dialect = "sqlite";
  private current = new AsyncLocalStorage<boolean>();
  private tail: Promise<unknown> = Promise.resolve();
  constructor(readonly native: DatabaseSync) {}
  private exclusive<T>(fn: () => T | Promise<T>): Promise<T> {
    if (this.current.getStore()) return Promise.resolve().then(fn);
    const work = this.tail.then(() => this.current.run(true, fn));
    this.tail = work.catch(() => {});
    return work;
  }
  prepare(sql: string): Statement {
    const statement = this.native.prepare(sql);
    return {
      get: (...args) => this.exclusive(() => statement.get(...args)),
      all: (...args) => this.exclusive(() => statement.all(...args)),
      run: (...args) =>
        this.exclusive(() => ({
          changes: Number(statement.run(...args).changes),
        })),
    };
  }
  async exec(sql: string) {
    await this.exclusive(() => this.native.exec(sql));
  }
  read<T>(fn: () => T | Promise<T>): Promise<T> {
    return this.exclusive(fn);
  }
  transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    if (this.current.getStore())
      throw new Error("Nested storage transactions are not supported.");
    return this.exclusive(async () => {
      this.native.exec("BEGIN IMMEDIATE");
      try {
        const result = await fn();
        this.native.exec("COMMIT");
        return result;
      } catch (error) {
        this.native.exec("ROLLBACK");
        throw error;
      }
    });
  }
  atomic<T>(fn: () => T | Promise<T>): Promise<T> {
    return this.current.getStore()
      ? Promise.resolve().then(fn)
      : this.transaction(fn);
  }
  async close() {
    await this.tail;
    this.native.close();
  }
}
export class PostgresDatabase implements Database {
  readonly dialect = "postgres";
  readonly pool: pg.Pool;
  private current = new AsyncLocalStorage<{
    client: PoolClient;
    workspaceId: string;
  }>();
  private roleCheck?: Promise<void>;
  constructor(
    url: string,
    private workspaceId: () => string,
  ) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(
        "Invalid DATABASE_URL. Use a private Postgres connection string.",
      );
    }
    if (!["postgres:", "postgresql:"].includes(parsed.protocol))
      throw new Error("DATABASE_URL must be a Postgres connection string.");
    if (
      parsed.hostname.endsWith("pooler.supabase.com") &&
      parsed.port !== "5432"
    )
      throw new Error(
        "Use the Supabase session pooler on port 5432. Transaction pooling cannot retain runtime ownership.",
      );
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    parsed.searchParams.delete("sslmode");
    this.pool = new pg.Pool({
      connectionString: parsed.toString(),
      max: 10,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: local ? false : { rejectUnauthorized: true },
    });
    // pg-pool removes its idle error listener while a client is checked out.
    // Keep a handler during transactions and other gaps between queries. The
    // failed client rejects further queries; runtime ownership has its own
    // additional handler that still stops the process if that connection dies.
    this.pool.on("connect", (client) => {
      client.on("error", () =>
        console.error("A checked-out database connection closed unexpectedly."),
      );
    });
    this.pool.on("error", () =>
      console.error("A database connection closed unexpectedly."),
    );
  }
  private async connection<T>(
    fn: (client: PoolClient) => Promise<T>,
    readOnly = false,
  ): Promise<T> {
    const existing = this.current.getStore();
    const id = this.workspaceId();
    if (existing) {
      if (existing.workspaceId !== id)
        throw new Error("Cannot change workspace inside a database operation.");
      return fn(existing.client);
    }
    const client = await this.pool.connect();
    try {
      this.roleCheck ??= client
        .query(
          "SELECT rolname,rolsuper,rolbypassrls,rolcanlogin,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname='octolab_runtime'",
        )
        .then(async (result) => {
          const role = result.rows[0];
          if (
            !role ||
            role.rolsuper ||
            role.rolbypassrls ||
            role.rolcanlogin ||
            role.rolcreaterole ||
            role.rolcreatedb
          )
            throw new Error(
              "Unsafe database runtime role. Review PostgreSQL migrations before serving requests.",
            );
          const inherited = await client.query(
            "SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='octolab_runtime') LIMIT 1",
          );
          if (inherited.rowCount)
            throw new Error(
              "The database runtime role must not inherit other roles.",
            );
        });
      await this.roleCheck;
      // Static setup plus a driver-escaped literal stays one wire round trip.
      // All settings remain transaction-local, including on pooled connections.
      await client.query(
        `${readOnly ? "BEGIN READ ONLY" : "BEGIN"}; SET LOCAL ROLE octolab_runtime; ` +
          `SET LOCAL search_path TO octolab, pg_catalog; ` +
          `SET LOCAL octolab.workspace_id TO ${pg.escapeLiteral(id)}`,
      );
      const value = await this.current.run({ client, workspaceId: id }, () =>
        fn(client),
      );
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  prepare(sql: string): Statement {
    let index = 0;
    // Application SQL is static; question marks occur only as parameter placeholders.
    let query = sql.replace(/\?/g, () => `$${++index}`);
    if (/^INSERT OR IGNORE /i.test(query))
      query =
        query.replace(/^INSERT OR IGNORE /i, "INSERT ") +
        " ON CONFLICT DO NOTHING";
    query = query.replace(
      /ON CONFLICT\((?!workspace_id)([^)]+)\)/gi,
      "ON CONFLICT(workspace_id,$1)",
    );
    query = query.replace(
      "json_extract(body,'$.disputed')=1",
      "json_extract(body,'$.disputed')='true'",
    );
    if (sql.includes("json_set(body,'$.lastUsedAt'"))
      query =
        "UPDATE workspace_api_keys SET body=(body::jsonb || jsonb_build_object('lastUsedAt',$1::text))::text WHERE id=$2";
    if (sql.includes("json_set(body,'$.name'"))
      query =
        "UPDATE workspace_api_keys SET body=(body::jsonb || jsonb_build_object('name',$1::text,'scopes',$2::jsonb,'allowedTools',$3::jsonb,'limitMicros',$4::bigint,'revision',$5::bigint))::text WHERE id=$6";
    if (sql.includes("json_set(body,'$.revokedAt'"))
      query =
        "UPDATE workspace_api_keys SET body=(body::jsonb || jsonb_build_object('revokedAt',$1::text,'revision',$2::bigint))::text WHERE id=$3";
    if (sql.includes("json_group_array"))
      query =
        "SELECT jsonb_set(body::jsonb,'{calls}',COALESCE((SELECT jsonb_agg(value - 'result') FROM jsonb_array_elements(body::jsonb->'calls')), '[]'::jsonb))::text AS body FROM provider_lab_runs ORDER BY rowid DESC";
    const execute = (values: any[]) =>
      this.connection((c) => c.query(query, values));
    return {
      get: async (...values) => (await execute(values)).rows[0],
      all: async (...values) => (await execute(values)).rows,
      run: async (...values) => ({
        changes: (await execute(values)).rowCount ?? 0,
      }),
    };
  }
  async exec(sql: string) {
    await this.connection((c) => c.query(sql).then(() => {}));
  }
  read<T>(fn: () => T | Promise<T>): Promise<T> {
    return this.connection(async () => fn(), true);
  }
  transaction<T>(fn: () => T | Promise<T>): Promise<T> {
    if (this.current.getStore())
      throw new Error("Nested storage transactions are not supported.");
    // The workspace lock preserves the existing receipt/financial invariants across processes.
    // Provider network calls happen outside these short transactions.
    return this.connection(async (c) => {
      await c.query(
        "SELECT pg_advisory_xact_lock(hashtextextended(current_setting('octolab.workspace_id'),0))",
      );
      return fn();
    });
  }
  atomic<T>(fn: () => T | Promise<T>): Promise<T> {
    return this.current.getStore()
      ? Promise.resolve().then(fn)
      : this.transaction(fn);
  }
  async close() {
    await this.pool.end();
  }
}
