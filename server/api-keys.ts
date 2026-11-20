import { createHash, randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { Store } from "./store.js";
import {
  API_KEY_SCOPES,
  API_KEY_TOOLS,
  type ApiKeyEvent,
  type ApiKeyScope,
  type ScopedApiKey,
} from "./api-key-types.js";
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export class ApiKeyError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const dollars = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,3})(?:\.\d{1,6})?$/,
    "Use a USD limit with up to six decimal places.",
  )
  .transform((value) => {
    const [a, b = ""] = value.split(".");
    return Number(a) * 1e6 + Number(b.padEnd(6, "0"));
  })
  .pipe(z.number().int().min(0).max(1e9));
const settings = z
  .object({
    name: z.string().trim().min(1).max(80),
    scopes: z
      .array(z.enum(API_KEY_SCOPES))
      .min(1)
      .max(API_KEY_SCOPES.length)
      .transform((v) => [...new Set(v)].sort()),
    allowedTools: z
      .array(z.enum(API_KEY_TOOLS))
      .min(1)
      .max(API_KEY_TOOLS.length)
      .default([...API_KEY_TOOLS])
      .transform((v) => [...new Set(v)].sort()),
    limitUsd: dollars,
  })
  .strict();
const createInput = settings.extend({
  requestKey: z.uuid(),
  expiresInDays: z
    .union([z.literal(7), z.literal(30), z.literal(90), z.literal(365)])
    .default(30),
});
const updateInput = settings.extend({
  revision: z.number().int().nonnegative(),
});
type KeyBody = Omit<
  ScopedApiKey,
  "spentMicros" | "reservedMicros" | "remainingMicros" | "status"
>;
export class ApiKeyService {
  get workspaceId() {
    return this.store.workspaceId;
  }
  constructor(
    public store: Store,
    private now = () => Date.now(),
  ) {}
  async hasIssuedKeys() {
    return !!(await this.store.db
      .prepare("SELECT 1 FROM workspace_api_keys LIMIT 1")
      .get());
  }
  async get(id: string): Promise<ScopedApiKey> {
    const row = await this.store.db
      .prepare(
        "SELECT body,spent_micros,reserved_micros FROM workspace_api_keys WHERE id=? AND workspace_id=?",
      )
      .get(id, this.workspaceId);
    if (!row) throw new ApiKeyError(404, "API key not found.");
    const body = JSON.parse(String(row.body)) as KeyBody;
    const spentMicros = Number(row.spent_micros),
      reservedMicros = Number(row.reserved_micros);
    return {
      ...body,
      spentMicros,
      reservedMicros,
      remainingMicros: Math.max(
        0,
        body.limitMicros - spentMicros - reservedMicros,
      ),
      status: body.revokedAt
        ? "revoked"
        : Date.parse(body.expiresAt) <= this.now()
          ? "expired"
          : spentMicros + reservedMicros >= body.limitMicros
            ? "at_limit"
            : "active",
    };
  }
  async list() {
    return await Promise.all(
      (
        await this.store.db
          .prepare(
            "SELECT id FROM workspace_api_keys WHERE workspace_id=? ORDER BY rowid DESC LIMIT 1000",
          )
          .all(this.workspaceId)
      ).map(async (r) => await this.get(String(r.id))),
    );
  }
  async active(id: string) {
    const value = await this.get(id);
    if (value.revokedAt || Date.parse(value.expiresAt) <= this.now())
      throw new ApiKeyError(401, "This API key is revoked or expired.");
    return value;
  }
  async authenticate(secret: string) {
    if (!/^oct_key_[A-Za-z0-9_-]{43}$/.test(secret))
      throw new ApiKeyError(401, "Invalid API key.");
    const row = await this.store.db
      .prepare(
        "SELECT id FROM workspace_api_keys WHERE secret_hash=? AND workspace_id=?",
      )
      .get(hash(secret), this.workspaceId);
    if (!row) throw new ApiKeyError(401, "Invalid API key.");
    const value = await this.active(String(row.id));
    await this.store.db
      .prepare(
        "UPDATE workspace_api_keys SET body=json_set(body,'$.lastUsedAt',?) WHERE id=?",
      )
      .run(new Date(this.now()).toISOString(), value.id);
    return await this.get(value.id);
  }
  private async audit(
    type: ApiKeyEvent["type"],
    previous: ScopedApiKey | null,
    current: ScopedApiKey,
  ) {
    const event: ApiKeyEvent = {
      id: randomUUID(),
      keyId: current.id,
      type,
      at: new Date(this.now()).toISOString(),
      actor:
        this.store.actorScope.getStore()?.kind === "account"
          ? "authenticated_account"
          : "workspace_owner_credential",
      ...(this.store.actorScope.getStore()?.kind === "account"
        ? { actorId: this.store.actorScope.getStore()!.id }
        : {}),
      previous,
      current,
    };
    await this.store.db
      .prepare("INSERT INTO api_key_events VALUES (?,?,?)")
      .run(event.id, current.id, JSON.stringify(event));
  }
  async events(id: string): Promise<ApiKeyEvent[]> {
    await this.get(id);
    return (
      await this.store.db
        .prepare(
          "SELECT body FROM api_key_events WHERE key_id=? ORDER BY rowid DESC LIMIT 100",
        )
        .all(id)
    ).map((r) => JSON.parse(String(r.body)));
  }
  async create(raw: unknown) {
    const input = createInput.parse(raw);
    const signature = hash(JSON.stringify(input));
    return await this.store.transaction(async () => {
      const old = await this.store.db
        .prepare(
          "SELECT id,input_hash FROM workspace_api_keys WHERE create_request_key=?",
        )
        .get(input.requestKey);
      if (old) {
        if (old.input_hash !== signature)
          throw new ApiKeyError(
            409,
            "This creation request was already used with different key settings.",
          );
        return {
          key: await this.get(String(old.id)),
          secret: null,
          replayed: true,
        };
      }
      const keys = await this.list();
      if (
        keys.length >= 1000 ||
        keys.filter((k) => !k.revokedAt && Date.parse(k.expiresAt) > this.now())
          .length >= 100
      )
        throw new ApiKeyError(
          409,
          "Your account has reached its API key limit. Revoke an unused key before creating another.",
        );
      const secret = `oct_key_${randomBytes(32).toString("base64url")}`;
      const at = new Date(this.now()).toISOString();
      const body: KeyBody = {
        id: randomUUID(),
        workspaceId: this.workspaceId,
        name: input.name,
        prefix: `${secret.slice(0, 12)}…${secret.slice(-4)}`,
        scopes: input.scopes,
        allowedTools: input.allowedTools,
        limitMicros: input.limitUsd,
        revision: 0,
        createdAt: at,
        expiresAt: new Date(
          this.now() + input.expiresInDays * 86400000,
        ).toISOString(),
        revokedAt: null,
        lastUsedAt: null,
      };
      await this.store.db
        .prepare("INSERT INTO workspace_api_keys VALUES (?,?,?,?,?,?,0,0)")
        .run(
          body.id,
          this.workspaceId,
          hash(secret),
          input.requestKey,
          signature,
          JSON.stringify(body),
        );
      const key = await this.get(body.id);
      await this.audit("created", null, key);
      return { key, secret, replayed: false };
    });
  }
  async update(id: string, raw: unknown) {
    const input = updateInput.parse(raw);
    return await this.store.transaction(async () => {
      const previous = await this.get(id);
      if (previous.status === "expired" || previous.status === "revoked")
        throw new ApiKeyError(
          409,
          "Expired or revoked keys cannot be edited. Create a replacement key.",
        );
      if (previous.revision !== input.revision)
        throw new ApiKeyError(
          409,
          "Key settings changed. Refresh before saving.",
        );
      if (input.limitUsd < previous.spentMicros + previous.reservedMicros)
        throw new ApiKeyError(
          409,
          "The limit cannot be lower than spent and reserved estimates.",
        );
      await this.store.db
        .prepare(
          "UPDATE workspace_api_keys SET body=json_set(body,'$.name',?,'$.scopes',json(?),'$.allowedTools',json(?),'$.limitMicros',?,'$.revision',?) WHERE id=?",
        )
        .run(
          input.name,
          JSON.stringify(input.scopes),
          JSON.stringify(input.allowedTools),
          input.limitUsd,
          previous.revision + 1,
          id,
        );
      const current = await this.get(id);
      await this.audit("updated", previous, current);
      return current;
    });
  }
  async revoke(id: string, raw: unknown) {
    const input = z
      .object({ revision: z.number().int().nonnegative() })
      .strict()
      .parse(raw);
    return await this.store.transaction(async () => {
      const previous = await this.get(id);
      if (previous.revokedAt) return previous;
      if (previous.revision !== input.revision)
        throw new ApiKeyError(
          409,
          "Key settings changed. Refresh before revoking.",
        );
      await this.store.db
        .prepare(
          "UPDATE workspace_api_keys SET body=json_set(body,'$.revokedAt',?,'$.revision',?) WHERE id=?",
        )
        .run(new Date(this.now()).toISOString(), previous.revision + 1, id);
      const current = await this.get(id);
      await this.audit("revoked", previous, current);
      return current;
    });
  }
  async toolAccess(id: string, tool: (typeof API_KEY_TOOLS)[number]) {
    const key = await this.active(id);
    if (
      !key.scopes.includes("tools:execute") ||
      !key.allowedTools.includes(tool)
    )
      throw new ApiKeyError(403, "This API key cannot execute this tool.");
    return key;
  }
  /**
   * Company connector tools are not in a key's tool list. A key may call them
   * only when it can execute and is unrestricted across every built-in tool;
   * a key limited to particular tools never reaches third-party servers.
   */
  async connectorAccess(id: string) {
    const key = await this.active(id);
    if (!keyAllowsConnectors(key))
      throw new ApiKeyError(
        403,
        "This API key cannot call company connector tools. Use a key that allows every tool.",
      );
    return key;
  }
  /** Called inside the same transaction that creates the provider call receipt. */
  async reserve(
    id: string,
    callId: string,
    tool: (typeof API_KEY_TOOLS)[number] | { connector: true },
    amount: number,
  ) {
    const key =
      typeof tool === "string"
        ? await this.toolAccess(id, tool)
        : await this.connectorAccess(id);
    if (!Number.isSafeInteger(amount) || amount < 0)
      throw new Error("Invalid key reservation");
    if (key.spentMicros + key.reservedMicros + amount > key.limitMicros)
      throw new ApiKeyError(
        409,
        "This call would exceed the API key's total estimated-spend limit.",
      );
    await this.store.db
      .prepare("INSERT INTO api_key_spend VALUES (?,?,?,'reserved',?,NULL)")
      .run(callId, id, amount, new Date(this.now()).toISOString());
    await this.store.db
      .prepare(
        "UPDATE workspace_api_keys SET reserved_micros=reserved_micros+? WHERE id=?",
      )
      .run(amount, id);
  }
  /** Called with provider settlement/recovery in the enclosing receipt transaction. */
  async settle(callId: string) {
    const row = await this.store.db
      .prepare(
        "SELECT key_id,amount_micros FROM api_key_spend WHERE call_id=? AND state='reserved'",
      )
      .get(callId);
    if (!row) return;
    await this.store.db
      .prepare(
        "UPDATE workspace_api_keys SET reserved_micros=reserved_micros-?,spent_micros=spent_micros+? WHERE id=?",
      )
      .run(row.amount_micros, row.amount_micros, row.key_id);
    await this.store.db
      .prepare(
        "UPDATE api_key_spend SET state='settled',settled_at=? WHERE call_id=?",
      )
      .run(new Date(this.now()).toISOString(), callId);
  }
}
/** Explicit allowlist: scoped credentials cannot access owner/admin/legacy billing paths. */
/** Whether a key may reach company connector tools; see connectorAccess. */
export function keyAllowsConnectors(
  key: Pick<ScopedApiKey, "scopes" | "allowedTools">,
) {
  return (
    key.scopes.includes("tools:execute") &&
    API_KEY_TOOLS.every((tool) => key.allowedTools.includes(tool))
  );
}
export function requiredApiKeyScope(
  method: string,
  path: string,
): ApiKeyScope | null {
  if (
    method === "GET" &&
    ["/api/observations/catalog", "/api/observations/connector-tools"].includes(
      path,
    )
  )
    return "tools:discover";
  if (method === "POST" && path === "/api/account/preview")
    return "tools:discover";
  if (
    method === "GET" &&
    ["/api/account/usage", "/api/account/operator-allowance"].includes(path)
  )
    return "usage:read";
  if (method === "GET" && path === "/api/account/activity")
    return "research:read";
  if (
    ["GET", "POST"].includes(method) &&
    path === "/api/observations/connection"
  )
    return method === "GET" ? "research:read" : "research:write";
  if (method === "POST" && path === "/api/observations/agent-sessions")
    return "research:write";
  const session = "[0-9a-fA-F-]{36}";
  if (
    method === "GET" &&
    (path === "/api/observations" ||
      path === "/api/observations/route-decisions" ||
      new RegExp(
        `^/api/observations/${session}(?:/calls/${session}|/export)?$`,
      ).test(path))
  )
    return "research:read";
  if (
    method === "POST" &&
    new RegExp(`^/api/observations/${session}/discover$`).test(path)
  )
    return "tools:discover";
  if (
    method === "POST" &&
    new RegExp(
      `^/api/observations/${session}/(?:call|route|connector-call)$`,
    ).test(path)
  )
    return "tools:execute";
  if (
    method === "POST" &&
    new RegExp(`^/api/observations/${session}/outcome$`).test(path)
  )
    return "research:write";
  return null;
}
