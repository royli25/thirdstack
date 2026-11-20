import { createHash, randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import { z } from "zod";
import { PERSONAL_ACCOUNT_SCOPE } from "./personal-account.js";
import { Companies } from "./companies.js";
import { PostgresDatabase } from "./database.js";
import type { Store } from "./store.js";
import {
  accountTypes,
  type AccountProfile,
  type AccountType,
  type AuthPublicConfig,
} from "./account-types.js";
export class AccountError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export interface VerifiedIdentity {
  userId: string;
  email: string;
  sessionId: string;
  expiresAt: number;
  oauthClientId?: string;
  oauthAudience?: string;
  oauthGrantId?: string;
}
export type IdentityVerifier = (token: string) => Promise<VerifiedIdentity>;
export interface AccountSettings {
  url: string;
  publishableKey: string;
  adminUserIds: string[];
}
export function accountSettings(): AccountSettings {
  return {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    publishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "",
    adminUserIds: (process.env.SUPABASE_ADMIN_USER_IDS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
export function supabaseVerifier(settings: AccountSettings): IdentityVerifier {
  const client = createClient(settings.url, settings.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.timeout(8000),
          redirect: "error",
        }),
    },
  });
  return async (token) => {
    const { data, error } = await client.auth.getUser(token);
    if (error) {
      if (!error.status || error.status >= 500 || error.status === 429)
        throw new AccountError(
          503,
          "The sign-in service is temporarily unavailable. Try again shortly.",
        );
      throw new AccountError(401, "Invalid account session. Sign in again.");
    }
    if (
      !data.user ||
      data.user.is_anonymous ||
      !data.user.email ||
      !data.user.email_confirmed_at
    )
      throw new AccountError(401, "Sign in with a verified email account.");
    // The Auth service verified this JWT. Its claims are only used to bind the live session below.
    let claims: unknown;
    try {
      claims = JSON.parse(
        Buffer.from(token.split(".")[1], "base64url").toString(),
      );
    } catch {
      throw new AccountError(401, "Invalid account session.");
    }
    const value = z
      .object({
        sub: z.uuid(),
        session_id: z.uuid(),
        exp: z.number().int().positive(),
        client_id: z.uuid().optional(),
        two_hands_grant: z.uuid().optional(),
        aud: z.union([z.string(), z.array(z.string())]).optional(),
      })
      .safeParse(claims);
    if (
      !value.success ||
      value.data.sub !== data.user.id ||
      value.data.exp * 1000 <= Date.now()
    )
      throw new AccountError(401, "Account session expired. Sign in again.");
    return {
      userId: data.user.id,
      email: data.user.email,
      sessionId: value.data.session_id,
      expiresAt: value.data.exp * 1000,
      ...(value.data.client_id
        ? {
            oauthClientId: value.data.client_id,
            oauthGrantId: value.data.two_hands_grant,
            oauthAudience:
              typeof value.data.aud === "string" ? value.data.aud : undefined,
          }
        : {}),
    };
  };
}
export class Accounts {
  readonly previewScope = new AsyncLocalStorage<
    import("./company-types.js").AccountPreviewContext
  >();
  readonly companies = new Companies(this);
  readonly database: PostgresDatabase;
  private cache = new Map<
    string,
    { identity: VerifiedIdentity; until: number }
  >();
  private pending = new Map<string, Promise<VerifiedIdentity>>();
  private verify: IdentityVerifier;
  constructor(
    readonly store: Store,
    readonly settings = accountSettings(),
    verify?: IdentityVerifier,
  ) {
    if (!(store.db instanceof PostgresDatabase))
      throw new Error("Account authentication requires PostgreSQL storage.");
    this.database = store.db;
    let url: URL;
    try {
      url = new URL(settings.url);
    } catch {
      throw new Error(
        "Configure the Supabase project API URL and publishable key.",
      );
    }
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)
    )
      throw new Error(
        "Set SUPABASE_URL to the hosted project's HTTPS API origin.",
      );
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(settings.publishableKey))
      throw new Error(
        "Use a Supabase publishable key. Secret/service-role keys are not accepted.",
      );
    settings.adminUserIds.forEach((id) => z.uuid().parse(id));
    this.verify = verify ?? supabaseVerifier(settings);
  }
  publicConfig(): AuthPublicConfig {
    return {
      enabled: true,
      url: this.settings.url,
      publishableKey: this.settings.publishableKey,
    };
  }
  isAdmin(userId: string) {
    return (
      !this.previewScope.getStore() &&
      this.settings.adminUserIds.includes(userId)
    );
  }
  isPlatformAdmin(userId: string) {
    return this.settings.adminUserIds.includes(userId);
  }
  assertAdmin(identity: VerifiedIdentity, allowPreview = false) {
    if (
      !(allowPreview
        ? this.isPlatformAdmin(identity.userId)
        : this.isAdmin(identity.userId))
    )
      throw new AccountError(403, "Platform administrator access is required.");
  }
  assertCompanyTarget(id: string) {
    const target = this.previewScope.getStore()?.target;
    if (target && (target.kind !== "company" || target.id !== id))
      throw new AccountError(404, "Company is outside the selected preview.");
  }
  previewsCompany(identity: VerifiedIdentity, id: string) {
    const context = this.previewScope.getStore();
    this.assertCompanyTarget(id);
    return (
      context?.actorId === identity.userId &&
      context.target?.kind === "company" &&
      context.target.id === id
    );
  }
  async identity(req: Request, allowOAuth = false): Promise<VerifiedIdentity> {
    const token = req.header("authorization")?.match(/^Bearer ([^\s]+)$/)?.[1];
    if (!token || token.length > 8192 || token.startsWith("oct_key_"))
      throw new AccountError(401, "Sign in to access your account.");
    const key = createHash("sha256").update(token).digest("hex");
    const cached = this.cache.get(key);
    let identity: VerifiedIdentity;
    if (
      cached &&
      cached.until > Date.now() &&
      !this.isPlatformAdmin(cached.identity.userId)
    )
      identity = cached.identity;
    else {
      let work = this.pending.get(key);
      if (!work) {
        if (this.pending.size >= 20)
          throw new AccountError(
            503,
            "Account verification is busy. Try again shortly.",
          );
        work = this.verify(token);
        this.pending.set(key, work);
      }
      try {
        identity = await work;
        if (this.cache.size >= 1000)
          this.cache.delete(this.cache.keys().next().value!);
        this.cache.set(key, {
          identity,
          until: Math.min(identity.expiresAt, Date.now() + 15000),
        });
      } finally {
        if (this.pending.get(key) === work) this.pending.delete(key);
      }
    }
    if (identity.expiresAt <= Date.now())
      throw new AccountError(401, "Account session expired. Sign in again.");
    if (identity.oauthClientId && !allowOAuth)
      throw new AccountError(
        403,
        "Agent credentials cannot access account settings or administrator features.",
      );
    // Session revocation, deletion and bans take effect even while a verified identity is cached.
    const active = await this.database.pool.query(
      `SELECT 1 FROM auth.sessions s JOIN auth.users u ON u.id=s.user_id
      WHERE s.id=$1 AND s.user_id=$2 AND (s.not_after IS NULL OR s.not_after>now())
      AND COALESCE(to_jsonb(s)->>'oauth_client_id','')=$3
      AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=now())`,
      [identity.sessionId, identity.userId, identity.oauthClientId || ""],
    );
    if (!active.rowCount) {
      this.cache.delete(key);
      throw new AccountError(
        401,
        "This account session has ended. Sign in again.",
      );
    }
    return identity;
  }
  async profile(identity: VerifiedIdentity): Promise<AccountProfile> {
    const hasPersonalAccount =
      !this.previewScope.getStore()?.target &&
      !!(
        await this.database.pool.query(PERSONAL_ACCOUNT_SCOPE("$1"), [
          identity.userId,
        ])
      ).rowCount;
    return {
      user: { id: identity.userId, email: identity.email },
      accountType: await this.accountType(identity.userId),
      hasPersonalAccount,
      isAdmin: this.isAdmin(identity.userId),
      canPreview: this.settings.adminUserIds.includes(identity.userId),
      companyPreview: this.previewScope.getStore()?.target,
      companies: await this.companies.list(identity),
    };
  }
  // ---------------------------------------------------------------------------
  // Account types (business or user). Stored in octolab.account_types, where a
  // database trigger makes each row permanent. See the migration for details.
  // ---------------------------------------------------------------------------

  /** The stored type for this account, or null if it hasn't chosen one yet. */
  async accountType(userId: string): Promise<AccountType | null> {
    const result = await this.database.pool.query<{
      account_type: AccountType;
    }>("SELECT account_type FROM octolab.account_types WHERE user_id=$1", [
      userId,
    ]);
    return result.rows[0]?.account_type ?? null;
  }

  /**
   * Record the account's type the first time it is chosen. Choosing the same type
   * again is harmless; choosing a different one is refused. The database trigger
   * blocks changes too, so this is not the only safeguard.
   */
  async chooseAccountType(
    identity: VerifiedIdentity,
    input: unknown,
  ): Promise<{ accountType: AccountType }> {
    const { accountType } = z
      .object({ accountType: z.enum(accountTypes) })
      .parse(input);
    await this.database.pool.query(
      "INSERT INTO octolab.account_types(user_id,account_type,source) VALUES($1,$2,'chosen') ON CONFLICT(user_id) DO NOTHING",
      [identity.userId, accountType],
    );
    const stored = await this.accountType(identity.userId);
    if (stored !== accountType)
      throw new AccountError(
        409,
        `This account is already a ${stored} account. Account types can't be changed.`,
        "account_type_locked",
      );
    return { accountType: stored };
  }

  /**
   * Refuse the request unless the account has the required type. Platform
   * administrators (the SUPABASE_ADMIN_USER_IDS allowlist) are exempt so they can
   * review companies and preview both areas.
   */
  async assertAccountType(identity: VerifiedIdentity, required: AccountType) {
    if (this.isPlatformAdmin(identity.userId)) return;
    const actual = await this.accountType(identity.userId);
    if (!actual)
      throw new AccountError(
        403,
        "Choose whether this is a business or user account first.",
        "account_type_required",
      );
    if (actual !== required)
      throw new AccountError(
        403,
        required === "business"
          ? "This area is for business accounts. You're signed in with a user account."
          : "This area is for user accounts. You're signed in with a business account.",
        "wrong_account_type",
      );
  }

  async keyAccountScope(secret: string): Promise<string> {
    if (!/^oct_key_[A-Za-z0-9_-]{43}$/.test(secret))
      throw new AccountError(401, "Invalid API key.");
    const row = await this.database.pool.query(
      "SELECT workspace_id FROM octolab.workspace_api_keys WHERE secret_hash=$1",
      [createHash("sha256").update(secret).digest("hex")],
    );
    if (!row.rowCount) throw new AccountError(401, "Invalid API key.");
    return String(row.rows[0].workspace_id);
  }
  async paymentAccountScope(
    identity: import("./stripe-funding.js").WebhookIdentity,
  ) {
    const result = await this.database.pool.query(
      "SELECT workspace_id FROM octolab.stripe_deposits WHERE id=$1 OR session_id=$2 OR payment_intent_id=$3 OR charge_id=$4 UNION SELECT workspace_id FROM octolab.stripe_webhook_receipts WHERE id=$5",
      [
        identity.depositId,
        identity.sessionId,
        identity.paymentId,
        identity.chargeId,
        identity.eventId,
      ],
    );
    if (result.rows.length > 1)
      throw new AccountError(
        409,
        "Payment identifiers conflict across accounts. Event processing was stopped.",
      );
    return result.rows[0]?.workspace_id as string | undefined;
  }
  /** Resolve storage from verified identity. Existing owners retain their original data. */
  async personalAccountScope(
    identity: Pick<VerifiedIdentity, "userId">,
  ): Promise<string> {
    const existing = await this.database.pool.query<{ id: string }>(
      PERSONAL_ACCOUNT_SCOPE("$1"),
      [identity.userId],
    );
    if (existing.rows[0]) return existing.rows[0].id;
    if (this.previewScope.getStore())
      throw new AccountError(
        403,
        "This account has no personal activity to preview.",
      );

    const client = await this.database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        ["account:" + identity.userId],
      );
      const current = await client.query<{ id: string }>(
        PERSONAL_ACCOUNT_SCOPE("$1"),
        [identity.userId],
      );
      let id = current.rows[0]?.id;
      if (!id) {
        id = randomUUID();
        await client.query(
          "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Personal account')",
          [id],
        );
        await client.query(
          "INSERT INTO octolab.workspace_memberships VALUES($1,$2,'owner')",
          [id, identity.userId],
        );
        await client.query(
          "INSERT INTO octolab.account_audit_events(id,workspace_id,actor_user_id,type,data) VALUES($1,$2,$3,'personal_account_created','{}')",
          [randomUUID(), id, identity.userId],
        );
      }
      await client.query("COMMIT");
      return id;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
