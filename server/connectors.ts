/**
 * Company-supplied MCP connectors.
 *
 * A tool company registers the address of its own MCP server. Two Hands reads
 * the server's tool list into a fixed, hashed snapshot. A platform reviewer
 * approves the connector and each tool at an exact schema version and price.
 * Agents can call only approved tools whose live schema still matches the
 * approved hash; any change returns that tool to review.
 *
 * Connector state is global (it is part of the catalog every workspace sees),
 * so like seller state it is not scoped to a customer workspace.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { config } from "./config.js";
import {
  callRemoteTool,
  ConnectorCallError,
  listRemoteTools,
  type RemoteResult,
  type RemoteTool,
} from "./connector-client.js";
import {
  ConnectorNetworkError,
  connectorEndpoint,
} from "./connector-network.js";
import { providerIds } from "./provider-catalog.js";
import type { Store } from "./store.js";

export class ConnectorError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export type ConnectorStatus = "pending" | "approved" | "rejected" | "suspended";
export type ConnectorToolStatus =
  "pending" | "approved" | "rejected" | "disabled" | "removed";

export interface ConnectorTool {
  name: string;
  /** The name agents use: `<slug>__<name>`. */
  exposedName: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  schemaHash: string;
  status: ConnectorToolStatus;
  /** Schema hash the reviewer approved; calls require it to match `schemaHash`. */
  approvedHash?: string;
  /** Reviewer-approved estimate per call, in micro-USD. */
  estimateMicros: number;
  firstSeenAt: string;
  changedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface StoredSecret {
  iv: string;
  tag: string;
  data: string;
}

export interface Connector {
  id: string;
  slug: string;
  name: string;
  description: string;
  endpoint: string;
  /** Owning tool company in hosted mode; null for a local operator connector. */
  companyId: string | null;
  status: ConnectorStatus;
  /** Price the company declared per call, a default for review. */
  declaredPriceMicros: number;
  tools: ConnectorTool[];
  snapshotVersion: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  lastRefreshedAt: string | null;
  lastRefreshError: string | null;
  reviewedAt?: string;
  reviewNote?: string;
  requestKey: string;
  credential?: StoredSecret;
}

/** What owners, reviewers and the API see. Never carries the credential. */
export type ConnectorView = Omit<Connector, "credential" | "requestKey"> & {
  hasCredential: boolean;
};

export interface ApprovedConnectorTool {
  connectorId: string;
  connectorName: string;
  slug: string;
  tool: ConnectorTool;
}

const slugPattern = /^[a-z][a-z0-9]{1,23}$/;
const reserved = new Set<string>([
  ...providerIds,
  "apilayer",
  "twohands",
  "octolab",
  "record",
  "discover",
  "route",
  "submit",
  "get",
  "list",
  "call",
]);

export const createConnectorInput = z
  .object({
    requestKey: z.string().uuid(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(
        slugPattern,
        "Use 2-24 lowercase letters or digits, starting with a letter.",
      ),
    name: z.string().trim().min(2).max(80),
    description: z.string().trim().min(20).max(1500),
    endpoint: z.string().trim().max(2048),
    token: z
      .string()
      .min(8)
      .max(4096)
      .regex(/^[\x21-\x7e]+$/, "Tokens must be printable without spaces.")
      .optional(),
    declaredPriceUsd: z.number().min(0).max(5),
  })
  .strict();

export const updateConnectorInput = z
  .object({
    revision: z.number().int().min(1),
    endpoint: z.string().trim().max(2048).optional(),
    token: z
      .string()
      .min(8)
      .max(4096)
      .regex(/^[\x21-\x7e]+$/)
      .nullable()
      .optional(),
    description: z.string().trim().min(20).max(1500).optional(),
    declaredPriceUsd: z.number().min(0).max(5).optional(),
  })
  .strict();

export const reviewConnectorInput = z
  .object({
    revision: z.number().int().min(1),
    decision: z.enum(["approve", "reject", "suspend", "reinstate"]),
    note: z.string().trim().max(600).default(""),
    tools: z
      .array(
        z
          .object({
            name: z.string().min(1).max(48),
            schemaHash: z.string().regex(/^[0-9a-f]{64}$/),
            decision: z.enum(["approve", "reject", "disable"]),
            estimateUsd: z.number().min(0).max(5).optional(),
          })
          .strict(),
      )
      .max(50)
      .default([]),
  })
  .strict();

/** Storage both modes share. Bodies are JSON strings. */
export interface ConnectorDb {
  all(): Promise<string[]>;
  get(id: string): Promise<string | undefined>;
  bySlug(slug: string): Promise<string | undefined>;
  byRequestKey(key: string): Promise<string | undefined>;
  save(
    id: string,
    slug: string,
    requestKey: string,
    body: string,
  ): Promise<void>;
  addEvent(connectorId: string, body: string): Promise<void>;
  events(
    connectorId: string,
    limit: number,
  ): Promise<{ id: number; body: string }[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}

export class SqliteConnectorDb implements ConnectorDb {
  constructor(private store: Store) {}
  private get db() {
    return this.store.db;
  }
  async all() {
    return (
      await this.db.prepare("SELECT body FROM connectors ORDER BY rowid").all()
    ).map((r) => r.body as string);
  }
  async get(id: string) {
    return (
      await this.db.prepare("SELECT body FROM connectors WHERE id=?").get(id)
    )?.body as string | undefined;
  }
  async bySlug(slug: string) {
    return (
      await this.db
        .prepare("SELECT body FROM connectors WHERE slug=?")
        .get(slug)
    )?.body as string | undefined;
  }
  async byRequestKey(key: string) {
    return (
      await this.db
        .prepare("SELECT body FROM connectors WHERE request_key=?")
        .get(key)
    )?.body as string | undefined;
  }
  async save(id: string, slug: string, requestKey: string, body: string) {
    await this.db
      .prepare(
        "INSERT INTO connectors(id,slug,request_key,body) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(id, slug, requestKey, body);
  }
  async addEvent(connectorId: string, body: string) {
    await this.db
      .prepare("INSERT INTO connector_events(connector_id,body) VALUES (?,?)")
      .run(connectorId, body);
  }
  async events(connectorId: string, limit: number) {
    return (
      await this.db
        .prepare(
          "SELECT id,body FROM connector_events WHERE connector_id=? ORDER BY id DESC LIMIT ?",
        )
        .all(connectorId, limit)
    ).map((r) => ({ id: Number(r.id), body: r.body as string }));
  }
  async transaction<T>(fn: () => Promise<T>) {
    return await this.store.transaction(fn);
  }
}

/** Hosted storage on the service connection; no workspace role can read it. */
export class PostgresConnectorDb implements ConnectorDb {
  private active = new AsyncLocalStorage<PoolClient>();
  constructor(private pool: Pool) {}
  private query(text: string, values: unknown[]) {
    return (this.active.getStore() ?? this.pool).query(text, values);
  }
  private async one(text: string, values: unknown[]) {
    return (await this.query(text, values)).rows[0]?.body as string | undefined;
  }
  async all() {
    return (
      await this.query(
        "SELECT body::text AS body FROM octolab.connectors ORDER BY created_at,id",
        [],
      )
    ).rows.map((r) => r.body as string);
  }
  get(id: string) {
    return this.one(
      "SELECT body::text AS body FROM octolab.connectors WHERE id=$1",
      [id],
    );
  }
  bySlug(slug: string) {
    return this.one(
      "SELECT body::text AS body FROM octolab.connectors WHERE slug=$1",
      [slug],
    );
  }
  byRequestKey(key: string) {
    return this.one(
      "SELECT body::text AS body FROM octolab.connectors WHERE request_key=$1",
      [key],
    );
  }
  async save(id: string, slug: string, requestKey: string, body: string) {
    await this.query(
      "INSERT INTO octolab.connectors(id,slug,request_key,body) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(id) DO UPDATE SET body=excluded.body,updated_at=now()",
      [id, slug, requestKey, body],
    );
  }
  async addEvent(connectorId: string, body: string) {
    await this.query(
      "INSERT INTO octolab.connector_events(connector_id,body) VALUES($1,$2::jsonb)",
      [connectorId, body],
    );
  }
  async events(connectorId: string, limit: number) {
    const { rows } = await this.query(
      "SELECT id,body::text AS body FROM octolab.connector_events WHERE connector_id=$1 ORDER BY id DESC LIMIT $2",
      [connectorId, limit],
    );
    return rows.map((r) => ({ id: Number(r.id), body: r.body as string }));
  }
  async transaction<T>(fn: () => Promise<T>) {
    if (this.active.getStore()) return await fn();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('octolab-connector-state',0))",
      );
      const result = await this.active.run(client, fn);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
}

/** AES-256-GCM with the connector id as associated data. */
export class ConnectorSecrets {
  private key?: Buffer;
  constructor(raw = config.connectors.secretKey) {
    if (!raw) return;
    const key = /^[0-9a-f]{64}$/i.test(raw)
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");
    if (key.length !== 32)
      throw new Error(
        "CONNECTOR_SECRET_KEY must be 32 bytes, as 64 hex characters or base64.",
      );
    this.key = key;
  }
  get available() {
    return !!this.key;
  }
  seal(connectorId: string, value: string): StoredSecret {
    if (!this.key)
      throw new ConnectorError(
        503,
        "Connector token storage is not configured on this server. Set CONNECTOR_SECRET_KEY, or register an endpoint that needs no token.",
      );
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    cipher.setAAD(Buffer.from(connectorId));
    const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    return {
      iv: iv.toString("base64"),
      tag: cipher.getAuthTag().toString("base64"),
      data: data.toString("base64"),
    };
  }
  open(connectorId: string, secret: StoredSecret): string {
    if (!this.key)
      throw new ConnectorError(
        503,
        "Connector token storage is not configured on this server.",
      );
    const decipher = createDecipheriv(
      "aes-256-gcm",
      this.key,
      Buffer.from(secret.iv, "base64"),
    );
    decipher.setAAD(Buffer.from(connectorId));
    decipher.setAuthTag(Buffer.from(secret.tag, "base64"));
    return Buffer.concat([
      decipher.update(Buffer.from(secret.data, "base64")),
      decipher.final(),
    ]).toString("utf8");
  }
}

export interface ConnectorTransport {
  list: typeof listRemoteTools;
  call: typeof callRemoteTool;
}

const micros = (usd: number) => Math.round(usd * 1_000_000);

export function view(c: Connector): ConnectorView {
  const { credential, requestKey: _key, ...rest } = c;
  return { ...rest, hasCredential: !!credential };
}

/** True when a reviewer approved exactly the schema the connector now offers. */
export function callable(c: Connector, t: ConnectorTool) {
  return (
    c.status === "approved" &&
    t.status === "approved" &&
    t.approvedHash === t.schemaHash
  );
}

export class ConnectorStore {
  private db: ConnectorDb;
  readonly secrets: ConnectorSecrets;
  constructor(
    source: Store | ConnectorDb,
    private transport: ConnectorTransport = {
      list: listRemoteTools,
      call: callRemoteTool,
    },
    secrets?: ConnectorSecrets,
  ) {
    this.db = "bySlug" in source ? source : new SqliteConnectorDb(source);
    this.secrets = secrets ?? new ConnectorSecrets();
  }
  private network() {
    return {
      timeoutMs: config.connectors.timeoutMs,
      allowLoopback: config.connectors.allowLoopback,
    };
  }
  private async log(id: string, type: string, data: unknown, actor?: string) {
    await this.db.addEvent(
      id,
      JSON.stringify({
        type,
        at: new Date().toISOString(),
        ...(actor ? { actor } : {}),
        data,
      }),
    );
  }
  private async write(c: Connector) {
    c.updatedAt = new Date().toISOString();
    await this.db.save(c.id, c.slug, c.requestKey, JSON.stringify(c));
  }
  private parse(body: string | undefined) {
    return body ? (JSON.parse(body) as Connector) : undefined;
  }
  async all(): Promise<Connector[]> {
    return (await this.db.all()).map((b) => JSON.parse(b));
  }
  async list(filter: { companyId?: string | null } = {}) {
    return (await this.all())
      .filter(
        (c) =>
          filter.companyId === undefined || c.companyId === filter.companyId,
      )
      .map(view);
  }
  async require(id: string) {
    if (!z.string().uuid().safeParse(id).success)
      throw new ConnectorError(404, "Connector not found.");
    const c = this.parse(await this.db.get(id));
    if (!c) throw new ConnectorError(404, "Connector not found.");
    return c;
  }
  async events(id: string, limit = 100) {
    await this.require(id);
    return (await this.db.events(id, limit)).map((r) => ({
      id: r.id,
      ...JSON.parse(r.body),
    }));
  }
  private endpoint(value: string) {
    try {
      return connectorEndpoint(value, this.network());
    } catch (e) {
      throw new ConnectorError(
        400,
        e instanceof ConnectorNetworkError ? e.message : "Invalid endpoint.",
      );
    }
  }
  private token(c: Connector) {
    return c.credential ? this.secrets.open(c.id, c.credential) : undefined;
  }
  /** Reads the remote tool list; never throws for remote failures. */
  private async fetchTools(
    endpoint: string,
    token: string | undefined,
  ): Promise<{ tools: RemoteTool[] } | { error: string }> {
    try {
      return {
        tools: await this.transport.list({ endpoint, token }, this.network()),
      };
    } catch (e) {
      return {
        error:
          e instanceof ConnectorCallError
            ? e.message
            : "The connector tool list could not be read.",
      };
    }
  }
  /** Merges a fresh tool list into the snapshot. Changed tools return to review. */
  private merge(c: Connector, remote: RemoteTool[]) {
    const now = new Date().toISOString();
    const changes = {
      added: [] as string[],
      changed: [] as string[],
      removed: [] as string[],
    };
    const next: ConnectorTool[] = [];
    for (const r of remote) {
      const old = c.tools.find((t) => t.name === r.name);
      const base = {
        name: r.name,
        exposedName: `${c.slug}__${r.name}`,
        ...(r.title ? { title: r.title } : {}),
        description: r.description,
        inputSchema: r.inputSchema,
        ...(r.annotations ? { annotations: r.annotations } : {}),
        schemaHash: r.schemaHash,
      };
      if (!old) {
        changes.added.push(r.name);
        next.push({
          ...base,
          status: "pending",
          estimateMicros: c.declaredPriceMicros,
          firstSeenAt: now,
          changedAt: now,
        });
      } else if (old.schemaHash !== r.schemaHash || old.status === "removed") {
        changes.changed.push(r.name);
        next.push({
          ...old,
          ...base,
          // A changed or returning tool is never callable until reviewed again.
          status: old.status === "disabled" ? "disabled" : "pending",
          changedAt: now,
        });
      } else next.push({ ...old, ...base });
    }
    for (const old of c.tools)
      if (!remote.some((r) => r.name === old.name)) {
        if (old.status !== "removed") changes.removed.push(old.name);
        next.push({
          ...old,
          status: "removed",
          changedAt: old.status === "removed" ? old.changedAt : now,
        });
      }
    c.tools = next;
    if (
      changes.added.length ||
      changes.changed.length ||
      changes.removed.length
    )
      c.snapshotVersion++;
    c.lastRefreshedAt = now;
    return changes;
  }

  async create(
    raw: unknown,
    owner: { companyId: string | null; actor?: string },
  ): Promise<ConnectorView> {
    const input = createConnectorInput.parse(raw);
    const replay = this.parse(await this.db.byRequestKey(input.requestKey));
    if (replay) {
      if (replay.companyId !== owner.companyId || replay.slug !== input.slug)
        throw new ConnectorError(
          409,
          "This request key was already used for a different connector.",
        );
      return view(replay);
    }
    if (reserved.has(input.slug))
      throw new ConnectorError(409, "This connector name is reserved.");
    const endpoint = this.endpoint(input.endpoint);
    if (input.token && !this.secrets.available)
      this.secrets.seal("probe", "probe"); // throws the configuration error
    const fetched = await this.fetchTools(endpoint, input.token);
    if ("error" in fetched)
      throw new ConnectorError(
        422,
        `Two Hands could not read this connector's tools: ${fetched.error}`,
      );
    if (!fetched.tools.length)
      throw new ConnectorError(422, "This connector offers no tools.");
    return await this.db.transaction(async () => {
      const again = this.parse(await this.db.byRequestKey(input.requestKey));
      if (again) return view(again);
      if (await this.db.bySlug(input.slug))
        throw new ConnectorError(
          409,
          "Another connector already uses this name. Choose a different one.",
        );
      const now = new Date().toISOString();
      const c: Connector = {
        id: randomUUID(),
        slug: input.slug,
        name: input.name,
        description: input.description,
        endpoint,
        companyId: owner.companyId,
        status: "pending",
        declaredPriceMicros: micros(input.declaredPriceUsd),
        tools: [],
        snapshotVersion: 0,
        revision: 1,
        createdAt: now,
        updatedAt: now,
        lastRefreshedAt: null,
        lastRefreshError: null,
        requestKey: input.requestKey,
      };
      if (input.token) c.credential = this.secrets.seal(c.id, input.token);
      const changes = this.merge(c, fetched.tools);
      await this.write(c);
      await this.log(
        c.id,
        "connector_registered",
        {
          slug: c.slug,
          endpoint: c.endpoint,
          companyId: c.companyId,
          hasCredential: !!c.credential,
          tools: changes.added,
        },
        owner.actor,
      );
      return view(c);
    });
  }

  /** Owner changes. Any endpoint or token change sends the connector back to review. */
  async update(id: string, raw: unknown, actor?: string) {
    const input = updateConnectorInput.parse(raw);
    const endpoint =
      input.endpoint !== undefined ? this.endpoint(input.endpoint) : undefined;
    return await this.db.transaction(async () => {
      const c = await this.require(id);
      if (c.revision !== input.revision)
        throw new ConnectorError(
          409,
          "This connector changed elsewhere. Reload and try again.",
        );
      const changed: string[] = [];
      if (endpoint !== undefined && endpoint !== c.endpoint) {
        c.endpoint = endpoint;
        changed.push("endpoint");
      }
      if (input.token !== undefined) {
        if (input.token === null) delete c.credential;
        else c.credential = this.secrets.seal(c.id, input.token);
        changed.push("token");
      }
      if (input.description !== undefined) {
        c.description = input.description;
        changed.push("description");
      }
      if (input.declaredPriceUsd !== undefined) {
        c.declaredPriceMicros = micros(input.declaredPriceUsd);
        changed.push("declaredPrice");
      }
      if (!changed.length) return view(c);
      // A new address or credential is a different server until reviewed.
      if (
        (changed.includes("endpoint") || changed.includes("token")) &&
        c.status === "approved"
      )
        c.status = "pending";
      c.revision++;
      await this.write(c);
      await this.log(c.id, "connector_updated", { changed }, actor);
      return view(c);
    });
  }

  /** Re-reads the remote tool list. Changed schemas lose approval. */
  async refresh(id: string, actor?: string) {
    const current = await this.require(id);
    const fetched = await this.fetchTools(
      current.endpoint,
      this.token(current),
    );
    return await this.db.transaction(async () => {
      const c = await this.require(id);
      if (c.endpoint !== current.endpoint)
        throw new ConnectorError(
          409,
          "The endpoint changed during refresh. Try again.",
        );
      if ("error" in fetched) {
        c.lastRefreshError = fetched.error;
        c.lastRefreshedAt = new Date().toISOString();
        await this.write(c);
        await this.log(
          c.id,
          "tools_refresh_failed",
          { error: fetched.error },
          actor,
        );
        throw new ConnectorError(
          502,
          `Two Hands could not read this connector's tools: ${fetched.error}`,
        );
      }
      const changes = this.merge(c, fetched.tools);
      c.lastRefreshError = null;
      if (
        changes.added.length ||
        changes.changed.length ||
        changes.removed.length
      )
        c.revision++;
      await this.write(c);
      await this.log(c.id, "tools_refreshed", changes, actor);
      return { connector: view(c), changes };
    });
  }

  /** A platform reviewer's decision on the connector and its tools. */
  async review(id: string, raw: unknown, actor?: string) {
    const input = reviewConnectorInput.parse(raw);
    return await this.db.transaction(async () => {
      const c = await this.require(id);
      if (c.revision !== input.revision)
        throw new ConnectorError(
          409,
          "This connector changed since you opened it. Reload and review again.",
        );
      const now = new Date().toISOString();
      const decisions: Record<string, string> = {};
      for (const d of input.tools) {
        const t = c.tools.find((x) => x.name === d.name);
        if (!t || t.status === "removed")
          throw new ConnectorError(
            409,
            `Tool "${d.name}" is not offered by this connector.`,
          );
        if (t.schemaHash !== d.schemaHash)
          throw new ConnectorError(
            409,
            `Tool "${d.name}" changed since you opened it. Reload and review again.`,
          );
        if (d.decision === "approve") {
          t.status = "approved";
          t.approvedHash = t.schemaHash;
          if (d.estimateUsd !== undefined)
            t.estimateMicros = micros(d.estimateUsd);
        } else if (d.decision === "reject") {
          t.status = "rejected";
          delete t.approvedHash;
        } else t.status = "disabled";
        t.reviewedAt = now;
        t.reviewNote = input.note;
        decisions[t.name] = d.decision;
      }
      const from = c.status;
      if (input.decision === "approve") {
        if (!c.tools.some((t) => callable({ ...c, status: "approved" }, t)))
          throw new ConnectorError(
            409,
            "Approve at least one tool before approving the connector.",
          );
        c.status = "approved";
      } else if (input.decision === "reject") c.status = "rejected";
      else if (input.decision === "suspend") c.status = "suspended";
      else {
        if (c.status !== "suspended")
          throw new ConnectorError(
            409,
            "Only a suspended connector can be reinstated.",
          );
        c.status = "approved";
      }
      c.reviewedAt = now;
      c.reviewNote = input.note;
      c.revision++;
      await this.write(c);
      await this.log(
        c.id,
        "connector_reviewed",
        {
          decision: input.decision,
          from,
          to: c.status,
          tools: decisions,
          note: input.note,
        },
        actor,
      );
      return view(c);
    });
  }

  /** Every tool an agent may call now, across approved connectors. */
  async approvedTools(): Promise<ApprovedConnectorTool[]> {
    return (await this.all()).flatMap((c) =>
      c.tools
        .filter((t) => callable(c, t))
        .map((tool) => ({
          connectorId: c.id,
          connectorName: c.name,
          slug: c.slug,
          tool,
        })),
    );
  }
  /** Resolves an exposed name to a callable tool, or explains why not. */
  async resolve(exposedName: string) {
    const [slug, name] = exposedName.split("__");
    const c = slug && name ? this.parse(await this.db.bySlug(slug)) : undefined;
    const t = c?.tools.find((x) => x.name === name);
    if (!c || !t || t.status === "removed")
      throw new ConnectorError(
        404,
        "No connector tool has this name. Call list_connector_tools for the current list.",
      );
    if (!callable(c, t))
      throw new ConnectorError(
        409,
        c.status === "suspended"
          ? "This connector is suspended. Choose another tool."
          : "This connector tool is not approved for use. Choose another tool.",
      );
    return { connector: c, tool: t };
  }
  /** Executes one approved remote tool call. Network policy applies on every request. */
  async execute(
    c: Connector,
    t: ConnectorTool,
    args: Record<string, unknown>,
  ): Promise<RemoteResult> {
    return await this.transport.call(
      { endpoint: c.endpoint, token: this.token(c) },
      t.name,
      args,
      this.network(),
    );
  }
}
