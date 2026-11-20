import { z } from "zod";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Pool, PoolClient } from "pg";
import type { Store } from "./store.js";
import type { ProviderId } from "./types.js";
import { providerRegistry } from "./provider-adapters.js";

/** Seller-owned state: settings, listing versions and their audit trail. Keyed by provider. */
export class SellerError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const text = (min: number, max: number) => z.string().trim().min(min).max(max);
export const listingInput = z
  .object({
    description: text(40, 600),
    useWhen: text(20, 400),
    limitations: text(20, 600),
    note: z.string().trim().max(300).default(""),
  })
  .strict();
export const reviewInput = z
  .object({
    version: z.number().int().min(1),
    decision: z.enum(["approve", "reject"]),
    note: z.string().trim().max(600).default(""),
  })
  .strict();
export const settingsInput = z
  .object({
    revision: z.number().int().min(0),
    namedComparison: z.boolean(),
    alerts: z
      .object({
        shareDropPoints: z.number().min(1).max(50).default(5),
        failureRisePoints: z.number().min(1).max(50).default(3),
        volumeChangePercent: z.number().min(5).max(500).default(30),
      })
      .strict()
      .default({
        shareDropPoints: 5,
        failureRisePoints: 3,
        volumeChangePercent: 30,
      }),
  })
  .strict();
export type SellerSettings = Omit<z.infer<typeof settingsInput>, "revision"> & {
  revision: number;
  updatedAt: string | null;
};
export type Listing = {
  provider: ProviderId;
  version: number;
  status: "pending" | "live" | "rejected" | "superseded" | "withdrawn";
  description: string;
  useWhen: string;
  limitations: string;
  note: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
  activatedAt?: string;
  retiredAt?: string;
};
export const defaultSettings = (): SellerSettings => ({
  revision: 0,
  namedComparison: false,
  alerts: { shareDropPoints: 5, failureRisePoints: 3, volumeChangePercent: 30 },
  updatedAt: null,
});

// A listing is read by agents when they choose a tool, so it must describe, not instruct.
const instructionPatterns: [RegExp, string][] = [
  [
    /\b(always|only|must|never)\s+(use|choose|pick|select|call|prefer)\b/i,
    "It tells the agent what to choose.",
  ],
  [
    /\b(ignore|disregard|forget)\b.{0,40}\b(instruction|tool|option|other|previous|above)/i,
    "It tells the agent to ignore something.",
  ],
  [
    /\b(do not|don't|avoid)\s+(use|choose|call|pick)\b/i,
    "It tells the agent what not to use.",
  ],
  [
    /\b(system prompt|you are an? |as an ai|you must)\b/i,
    "It addresses the agent directly.",
  ],
  [
    /\b(best|fastest|cheapest|most accurate|number one|#1)\b/i,
    "It makes a ranking claim that is not measured here.",
  ],
  [
    /https?:\/\//i,
    "Links belong in the documentation address, not the listing text.",
  ],
];
/** Problems that block a listing before a person reviews it. Empty means it can be submitted. */
export function lintListing(
  provider: ProviderId,
  listing: Pick<Listing, "description" | "useWhen" | "limitations">,
) {
  const problems: string[] = [];
  const body = `${listing.description}\n${listing.useWhen}\n${listing.limitations}`;
  for (const [pattern, message] of instructionPatterns)
    if (pattern.test(body)) problems.push(message);
  for (const other of new Set(providerRegistry.list().map((a) => a.provider)))
    if (other !== provider && new RegExp(`\\b${other}\\b`, "i").test(body))
      problems.push("It names another company. Describe your own tool only.");
  return [...new Set(problems)];
}

/** The few storage operations seller state needs, so local and hosted mode share one service. */
export interface SellerDb {
  getSetting(key: string): Promise<string | undefined>;
  putSetting(key: string, body: string): Promise<void>;
  /** Listing bodies for one provider, newest version first. */
  listingBodies(provider: string): Promise<string[]>;
  liveListingBodies(): Promise<string[]>;
  saveListing(provider: string, version: number, body: string): Promise<void>;
  addEvent(provider: string, body: string): Promise<void>;
  eventRows(
    provider: string,
    limit: number,
  ): Promise<{ id: number; body: string }[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
}
export class SqliteSellerDb implements SellerDb {
  constructor(private store: Store) {}
  private get db() {
    return this.store.db;
  }
  async getSetting(key: string) {
    const row = await this.db
      .prepare("SELECT body FROM seller_settings WHERE key=?")
      .get(key);
    return row ? (row.body as string) : undefined;
  }
  async putSetting(key: string, body: string) {
    await this.db
      .prepare(
        "INSERT INTO seller_settings VALUES (?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body",
      )
      .run(key, body);
  }
  async listingBodies(provider: string) {
    return (
      await this.db
        .prepare(
          "SELECT body FROM seller_listings WHERE provider=? ORDER BY version DESC",
        )
        .all(provider)
    ).map((r) => r.body as string);
  }
  async liveListingBodies() {
    return (
      await this.db
        .prepare(
          "SELECT body FROM seller_listings WHERE json_extract(body,'$.status')='live' ORDER BY version DESC",
        )
        .all()
    ).map((r) => r.body as string);
  }
  async saveListing(provider: string, version: number, body: string) {
    await this.db
      .prepare(
        "INSERT INTO seller_listings VALUES (?,?,?) ON CONFLICT(provider,version) DO UPDATE SET body=excluded.body",
      )
      .run(provider, version, body);
  }
  async addEvent(provider: string, body: string) {
    await this.db
      .prepare("INSERT INTO seller_events(provider,body) VALUES (?,?)")
      .run(provider, body);
  }
  async eventRows(provider: string, limit: number) {
    return (
      await this.db
        .prepare(
          "SELECT id,body FROM seller_events WHERE provider=? ORDER BY id DESC LIMIT ?",
        )
        .all(provider, limit)
    ).map((r) => ({ id: Number(r.id), body: r.body as string }));
  }
  async transaction<T>(fn: () => Promise<T>) {
    return await this.store.transaction(fn);
  }
}
/**
 * Hosted storage. Seller state is global, keyed by provider, and never scoped to a
 * customer workspace, so it uses the service connection directly.
 */
export class PostgresSellerDb implements SellerDb {
  private active = new AsyncLocalStorage<PoolClient>();
  constructor(private pool: Pool) {}
  private query(text: string, values: unknown[]) {
    return (this.active.getStore() ?? this.pool).query(text, values);
  }
  async getSetting(key: string) {
    const { rows } = await this.query(
      "SELECT body::text AS body FROM octolab.seller_settings WHERE key=$1",
      [key],
    );
    return rows[0]?.body as string | undefined;
  }
  async putSetting(key: string, body: string) {
    await this.query(
      "INSERT INTO octolab.seller_settings(key,body) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET body=excluded.body,updated_at=now()",
      [key, body],
    );
  }
  async listingBodies(provider: string) {
    const { rows } = await this.query(
      "SELECT body::text AS body FROM octolab.seller_listings WHERE provider=$1 ORDER BY version DESC",
      [provider],
    );
    return rows.map((r) => r.body as string);
  }
  async liveListingBodies() {
    const { rows } = await this.query(
      "SELECT body::text AS body FROM octolab.seller_listings WHERE body->>'status'='live' ORDER BY version DESC",
      [],
    );
    return rows.map((r) => r.body as string);
  }
  async saveListing(provider: string, version: number, body: string) {
    await this.query(
      "INSERT INTO octolab.seller_listings(provider,version,body) VALUES($1,$2,$3::jsonb) ON CONFLICT(provider,version) DO UPDATE SET body=excluded.body",
      [provider, version, body],
    );
  }
  async addEvent(provider: string, body: string) {
    await this.query(
      "INSERT INTO octolab.seller_events(provider,body) VALUES($1,$2::jsonb)",
      [provider, body],
    );
  }
  async eventRows(provider: string, limit: number) {
    const { rows } = await this.query(
      "SELECT id,body::text AS body FROM octolab.seller_events WHERE provider=$1 ORDER BY id DESC LIMIT $2",
      [provider, limit],
    );
    return rows.map((r) => ({ id: Number(r.id), body: r.body as string }));
  }
  async transaction<T>(fn: () => Promise<T>) {
    if (this.active.getStore()) return await fn();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      // One writer at a time keeps version numbers and revisions consistent.
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('octolab-seller-state',0))",
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

export class SellerStore {
  private db: SellerDb;
  constructor(source: Store | SellerDb) {
    this.db = "getSetting" in source ? source : new SqliteSellerDb(source);
  }
  private async log(
    provider: string,
    type: string,
    data: unknown,
    actor?: string,
  ) {
    await this.db.addEvent(
      provider,
      JSON.stringify({
        type,
        at: new Date().toISOString(),
        ...(actor ? { actor } : {}),
        data,
      }),
    );
  }
  async events(provider: ProviderId, limit = 100) {
    return (await this.db.eventRows(provider, limit)).map((r) => ({
      id: r.id,
      ...JSON.parse(r.body),
    })) as {
      id: number;
      type: string;
      at: string;
      actor?: string;
      data: Record<string, unknown>;
    }[];
  }
  async settings(provider: ProviderId): Promise<SellerSettings> {
    const body = await this.db.getSetting(`provider:${provider}`);
    return body ? JSON.parse(body) : defaultSettings();
  }
  async updateSettings(provider: ProviderId, raw: unknown, actor?: string) {
    const input = settingsInput.parse(raw);
    return await this.db.transaction(async () => {
      const previous = await this.settings(provider);
      if (previous.revision !== input.revision)
        throw new SellerError(
          409,
          "Settings changed elsewhere. Reload and try again.",
        );
      const next: SellerSettings = {
        ...input,
        revision: previous.revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await this.db.putSetting(`provider:${provider}`, JSON.stringify(next));
      await this.log(provider, "settings_updated", { previous, next }, actor);
      return next;
    });
  }
  /** Agent hosts whose sessions are internal traffic and never reach a seller report. */
  async internalHosts(): Promise<string[]> {
    const body = await this.db.getSetting("internal_hosts");
    return body ? JSON.parse(body) : [];
  }
  async setInternalHosts(raw: unknown) {
    const hosts = [...new Set(z.array(text(1, 100)).max(50).parse(raw))].sort();
    await this.db.putSetting("internal_hosts", JSON.stringify(hosts));
    return hosts;
  }
  async listings(provider: ProviderId): Promise<Listing[]> {
    return (await this.db.listingBodies(provider)).map((b) => JSON.parse(b));
  }
  private async save(listing: Listing) {
    await this.db.saveListing(
      listing.provider,
      listing.version,
      JSON.stringify(listing),
    );
  }
  async live(provider: ProviderId) {
    return (await this.listings(provider)).find((l) => l.status === "live");
  }
  /** Live listings for every provider, used wherever agents are shown a tool. */
  async liveAll() {
    const out: Partial<Record<ProviderId, Listing>> = {};
    for (const body of await this.db.liveListingBodies()) {
      const listing = JSON.parse(body) as Listing;
      if (!out[listing.provider]) out[listing.provider] = listing;
    }
    return out;
  }
  async submitListing(provider: ProviderId, raw: unknown, actor?: string) {
    const input = listingInput.parse(raw);
    const problems = lintListing(provider, input);
    if (problems.length)
      throw new SellerError(
        400,
        `This listing cannot be submitted. ${problems.join(" ")}`,
      );
    return await this.db.transaction(async () => {
      const all = await this.listings(provider);
      if (all.some((l) => l.status === "pending"))
        throw new SellerError(
          409,
          "A listing is already waiting for review. Withdraw it before submitting another.",
        );
      const listing: Listing = {
        provider,
        version: (all[0]?.version ?? 0) + 1,
        status: "pending",
        ...input,
        submittedAt: new Date().toISOString(),
      };
      await this.save(listing);
      await this.log(
        provider,
        "listing_submitted",
        { version: listing.version },
        actor,
      );
      return listing;
    });
  }
  async withdrawListing(provider: ProviderId, version: number, actor?: string) {
    return await this.db.transaction(async () => {
      const listing = (await this.listings(provider)).find(
        (l) => l.version === version,
      );
      if (!listing || listing.status !== "pending")
        throw new SellerError(409, "Only a pending listing can be withdrawn.");
      listing.status = "withdrawn";
      await this.save(listing);
      await this.log(provider, "listing_withdrawn", { version }, actor);
      return listing;
    });
  }
  /** A reviewer's decision. Approval makes the version live and retires the previous one. */
  async reviewListing(provider: ProviderId, raw: unknown, actor?: string) {
    const input = reviewInput.parse(raw);
    return await this.db.transaction(async () => {
      const all = await this.listings(provider);
      const listing = all.find((l) => l.version === input.version);
      if (!listing || listing.status !== "pending")
        throw new SellerError(409, "This listing is not waiting for review.");
      const at = new Date().toISOString();
      listing.reviewedAt = at;
      listing.reviewNote = input.note;
      if (input.decision === "reject") listing.status = "rejected";
      else {
        for (const previous of all.filter((l) => l.status === "live")) {
          previous.status = "superseded";
          previous.retiredAt = at;
          await this.save(previous);
        }
        listing.status = "live";
        listing.activatedAt = at;
      }
      await this.save(listing);
      await this.log(
        provider,
        input.decision === "approve" ? "listing_approved" : "listing_rejected",
        { version: listing.version, note: input.note },
        actor,
      );
      return listing;
    });
  }
}
