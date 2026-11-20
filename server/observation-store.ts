import { ShadowWallet } from "./shadow-wallet.js";
import { Wallet } from "./wallet.js";
import { ApiKeyService } from "./api-keys.js";
import { createHash, randomUUID } from "node:crypto";
import { SHARING_POLICY, sharingPolicyEvent } from "./sharing-policy.js";
import type { Store } from "./store.js";
import type {
  ObservationSession,
  ObservedCall,
  ObservationEvent,
  SessionDetail,
} from "./observation-types.js";
export function digest(value: unknown): string {
  function canonical(v: any): any {
    if (Array.isArray(v)) return v.map(canonical);
    if (v && typeof v === "object")
      return Object.fromEntries(
        Object.keys(v)
          .sort()
          .filter((k) => v[k] !== undefined)
          .map((k) => [k, canonical(v[k])]),
      );
    return v;
  }
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex");
}
export class ObservationStore {
  readonly apiKeys: ApiKeyService;
  readonly shadowWallet: ShadowWallet;
  readonly wallet: Wallet;
  constructor(public store: Store) {
    this.apiKeys = new ApiKeyService(store);
    this.shadowWallet = new ShadowWallet(store);
    this.wallet = new Wallet(store);
  }
  async applySharingPolicy() {
    await this.transaction(async () => {
      for (const session of await this.list()) {
        if (
          session.sharingPolicy === SHARING_POLICY &&
          session.commercialConsent
        )
          continue;
        const previous = session.commercialConsent;
        session.commercialConsent = true;
        session.sharingPolicy = SHARING_POLICY;
        // Preserve research activity timestamps; append, never rewrite audit history.
        await this.store.db
          .prepare("UPDATE observation_sessions SET body=? WHERE id=?")
          .run(JSON.stringify(session), session.id);
        await this.event(
          session.id,
          "sharing_policy_applied",
          "observed",
          sharingPolicyEvent(previous),
        );
      }
    });
  }
  async transaction<T>(fn: () => T) {
    return await this.store.transaction(fn);
  }
  async save(s: ObservationSession) {
    s.updatedAt = new Date().toISOString();
    await this.store.db
      .prepare(
        "INSERT INTO observation_sessions VALUES (?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(s.id, JSON.stringify(s));
  }
  async get(id: string): Promise<ObservationSession | undefined> {
    const row = await this.store.db
      .prepare("SELECT body FROM observation_sessions WHERE id=?")
      .get(id);
    return row ? JSON.parse(row.body as string) : undefined;
  }
  async list(): Promise<ObservationSession[]> {
    return (
      await this.store.db
        .prepare("SELECT body FROM observation_sessions ORDER BY rowid DESC")
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  /** Metrics never need captured pages, query arguments, or full answer text. */
  async metricCalls(): Promise<
    Omit<ObservedCall, "arguments" | "statedReason" | "result">[]
  > {
    const projection =
      this.store.db.dialect === "postgres"
        ? "(body::jsonb - ARRAY['result','arguments','statedReason'])::text"
        : "json_remove(body,'$.result','$.arguments','$.statedReason')";
    return (
      await this.store.db
        .prepare(`SELECT ${projection} AS body FROM observation_calls`)
        .all()
    ).map((r) => JSON.parse(r.body as string));
  }
  async reviewSessions() {
    const last =
      this.store.db.dialect === "postgres"
        ? "body::jsonb->'outcomes'->-1->>'id'"
        : "json_extract(body,'$.outcomes[#-1].id')";
    return (
      await this.store.db
        .prepare(
          `SELECT id,
      json_extract(body,'$.model') AS model,
      json_extract(body,'$.approvedAt') AS approved,
      json_extract(body,'$.spentMicros') AS spent,
      json_extract(body,'$.commercialConsent') AS consent,
      json_extract(body,'$.evaluations') AS evaluations,
      json_extract(body,'$.cases') AS cases, ${last} AS outcome
      FROM observation_sessions ORDER BY rowid DESC`,
        )
        .all()
    ).map((r) => ({
      id: String(r.id),
      model: String(r.model),
      approvedAt: r.approved,
      spentMicros: Number(r.spent),
      commercialConsent: r.consent === 1 || r.consent === "true",
      evaluations: JSON.parse(
        r.evaluations as string,
      ) as ObservationSession["evaluations"],
      cases: JSON.parse(r.cases as string) as ObservationSession["cases"],
      outcomeId: r.outcome as string | null,
    }));
  }
  async calls(id: string): Promise<ObservedCall[]> {
    return (
      await this.store.db
        .prepare(
          "SELECT body FROM observation_calls WHERE session_id=? ORDER BY rowid",
        )
        .all(id)
    ).map((r) => JSON.parse(r.body as string));
  }
  async receipt(
    sessionId: string,
    key: string,
  ): Promise<
    | {
        signature: string;
        call: ObservedCall;
      }
    | undefined
  > {
    const row = await this.store.db
      .prepare(
        "SELECT signature,body FROM observation_calls WHERE session_id=? AND request_key=?",
      )
      .get(sessionId, key);
    return row
      ? {
          signature: row.signature as string,
          call: JSON.parse(row.body as string),
        }
      : undefined;
  }
  async saveCall(c: ObservedCall, signature: string) {
    await this.store.db
      .prepare(
        "INSERT INTO observation_calls VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body",
      )
      .run(c.id, c.sessionId, c.requestKey, signature, JSON.stringify(c));
  }
  async events(id: string): Promise<ObservationEvent[]> {
    return (
      await this.store.db
        .prepare(
          "SELECT id,body FROM observation_events WHERE session_id=? ORDER BY id",
        )
        .all(id)
    ).map((r) => ({ ...JSON.parse(r.body as string), id: Number(r.id) }));
  }
  async event(
    sessionId: string,
    type: string,
    provenance: ObservationEvent["provenance"],
    data: Record<string, unknown>,
  ) {
    await this.store.db.atomic(async () => {
      const row = await this.store.db
        .prepare(
          "SELECT body FROM observation_events WHERE session_id=? ORDER BY id DESC LIMIT 1",
        )
        .get(sessionId);
      const previousHash = row
        ? JSON.parse(row.body as string).hash
        : "genesis";
      const payload = {
        ...(this.store.actorScope.getStore()
          ? { actor: this.store.actorScope.getStore() }
          : {}),
        sessionId,
        type,
        provenance,
        data,
        at: new Date().toISOString(),
        previousHash,
      };
      await this.store.db
        .prepare("INSERT INTO observation_events(session_id,body) VALUES (?,?)")
        .run(sessionId, JSON.stringify({ ...payload, hash: digest(payload) }));
    });
  }
  async detail(id: string): Promise<SessionDetail | undefined> {
    const s = await this.get(id);
    if (!s) return undefined;
    const events = await this.events(id);
    let previous = "genesis";
    const integrity = events.every(({ id: _id, hash, ...payload }) => {
      const valid =
        payload.previousHash === previous && digest(payload) === hash;
      previous = hash;
      return valid;
    });
    return { ...s, calls: await this.calls(id), events, integrity };
  }
  async recover() {
    await this.transaction(async () => {
      for (const s of await this.list()) {
        const interrupted = (await this.calls(s.id)).filter(
          (c) => c.status === "running",
        );
        for (const c of interrupted) {
          c.status = "interrupted";
          c.finishedAt = new Date().toISOString();
          c.error =
            "Server restarted before the result was recorded. The provider may have processed this call; it will not be retried automatically.";
          const receipt = (await this.receipt(s.id, c.requestKey))!;
          await this.saveCall(c, receipt.signature);
          await this.shadowWallet.close(c);
          await this.wallet.close(c);
          await this.apiKeys.settle(c.id);
          await this.store.allowance.settle(c.id);
          s.reservedMicros = Math.max(0, s.reservedMicros - c.estimateMicros);
          s.spentMicros += c.estimateMicros;
          await this.event(s.id, "call_interrupted", "observed", {
            callId: c.id,
            estimatedMicros: c.estimateMicros,
            settlement: "conservative_estimate",
            error: c.error,
          });
        }
        if (interrupted.length) await this.save(s);
      }
    });
  }
  async remove(id: string) {
    await this.store.db
      .prepare("DELETE FROM observation_sessions WHERE id=?")
      .run(id);
  }
  newId() {
    return randomUUID();
  }
}
