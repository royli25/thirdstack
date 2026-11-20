import { createHash } from "node:crypto";
import type { ObservedCall } from "./observation-types.js";
import { shadowWalletPrice } from "./shadow-wallet.js";
import type { Store } from "./store.js";
import { fixedCostTavilyCall, holdOutcome } from "./wallet-rules.js";

/** Stripe mode of a balance. Sandbox and real-money credits never share one. */
export type WalletMode = "test" | "live";
export interface WalletEntry {
  kind: string;
  micros: number;
  reference: string | null;
  createdAt: string;
}
/** What the customer sees for one paid call the wallet held, charged, released or refused. */
export interface WalletActivityItem {
  type: "call" | "refused";
  /** Call receipt ID. Absent for a refusal: a refused call is never created. */
  callId: string | null;
  /** Session of the call, when its research record still exists. */
  sessionId: string | null;
  tool: string;
  at: string;
  /**
   * `charged`: one debit of cost plus markup. `released`: the call failed or
   * could not be billed, so the hold was returned and nothing was charged.
   * `in_progress`: held, not finished. `refused`: stopped before dispatch.
   */
  outcome: "charged" | "released" | "in_progress" | "refused";
  /** Why a hold was released or a call refused. */
  reason:
    | "failed"
    | "interrupted"
    | "cost_conflict"
    | "insufficient_balance"
    | "dispute_hold"
    | "rate_unverified"
    | null;
  providerCostMicros: number | null;
  markupMicros: number | null;
  chargedMicros: number;
  /** The hold placed, or the amount a refused call needed. */
  heldMicros: number;
  /** Refusals in the same minute for the same tool and reason. 1 for a call. */
  count: number;
}
export interface WalletActivityPage {
  mode: WalletMode;
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
}
/** The charge on one call, for the Activity page. */
export interface WalletCharge {
  outcome: WalletActivityItem["outcome"];
  reason: WalletActivityItem["reason"];
  providerCostMicros: number;
  markupMicros: number;
  chargedMicros: number;
  heldMicros: number;
  mode: WalletMode;
}
export interface WalletStatementLine {
  at: string;
  kind: string;
  /** Call ID for a tool call, payment reference for a card posting, posting ID for an adjustment. */
  reference: string;
  tool: string | null;
  providerCostMicros: number | null;
  markupMicros: number | null;
  micros: number;
  balanceMicros: number;
}
export interface WalletStatement {
  mode: WalletMode;
  from: string;
  to: string;
  openingMicros: number;
  closingMicros: number;
  lines: WalletStatementLine[];
}
/**
 * Whether this account's paid calls would pass the wallet right now, and the
 * price of the one billable configuration. A snapshot: admission rechecks
 * under the account lock.
 */
export interface WalletQuote {
  /** False when the wallet does not gate this account; the rest is then null. */
  enforced: boolean;
  mode: WalletMode;
  paidCallsAllowed: boolean;
  reason: WalletDenial["reason"] | null;
  /** Credits one billable call reserves. Any paid call needs this much available. */
  requiredMicros: number | null;
  availableMicros: number | null;
  billable: {
    tool: "tavily_search";
    searchDepth: "basic";
    maxResults: 10;
    providerCostMicros: number;
    markupBps: number;
    customerPriceMicros: number;
    rateVersion: string;
    /** The price is not guaranteed after this time. */
    expiresAt: string;
  } | null;
}
const unenforcedQuote: WalletQuote = {
  enforced: false,
  mode: "test",
  paidCallsAllowed: true,
  reason: null,
  requiredMicros: null,
  availableMicros: null,
  billable: null,
};
/** Fewer billable calls left than this shows a low-balance notice. */
export const LOW_BALANCE_CALLS = 25;
/** A statement holds at most this many lines; a longer range is refused. */
export const STATEMENT_MAX_LINES = 10000;

export interface WalletStatus {
  /** The balance that pays for this account's calls: real money when "live". */
  mode: WalletMode;
  /** True when this account's eligible paid calls are gated by its credits. */
  enforced: boolean;
  /** True once the account has any wallet activity, even while enforcement is paused. */
  active: boolean;
  postedMicros: number;
  heldMicros: number;
  availableMicros: number;
  chargedMicros: number;
  /** An unresolved payment dispute stops new paid admissions. */
  frozen: boolean;
  /** An operator has enrolled this account for credit billing. */
  enrolled?: boolean;
  /** False while the enrolled account's rate cannot be billed; billable calls are refused. */
  billingAvailable?: boolean;
  /** Credits one billable call reserves, when the account is enrolled. */
  callHoldMicros?: number | null;
  /** Billable calls the available credits cover, when that can be computed. */
  callsRemaining?: number | null;
  /** True when an enforced balance covers fewer than LOW_BALANCE_CALLS calls. */
  lowBalance?: boolean;
}
export interface WalletDenial {
  /**
   * `rate_unverified`: the account is enrolled but its verified rate has
   * expired or no longer matches the provider credential, so the call cannot
   * be billed and is refused until an operator re-verifies the rate.
   */
  reason: "insufficient_balance" | "dispute_hold" | "rate_unverified";
  requiredMicros: number;
  availableMicros: number;
  heldMicros: number;
}
/** USD with sub-cent precision, for refusal text. */
function usd(micros: number) {
  return `$${(micros / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}
/**
 * What the account owner can do about a refusal. The agent's consumer is
 * never asked to manage funding; this is for the person who owns the account.
 */
export interface OwnerAction {
  action:
    "add_credits" | "wait_for_payment_review" | "none" | "contact_support";
  message: string;
}
const ownerActions: Record<WalletDenial["reason"], OwnerAction> = {
  insufficient_balance: {
    action: "add_credits",
    message: "The account owner can add credits on the Two Hands Credits page.",
  },
  dispute_hold: {
    action: "wait_for_payment_review",
    message:
      "Paid tools resume when the review of the card payment is closed. The account owner can see the payment on the Two Hands Credits page.",
  },
  rate_unverified: {
    action: "none",
    message:
      "Nothing is needed from the account owner. Two Hands has been notified and credits are unaffected.",
  },
};
/** Refusal before dispatch. Nothing was reserved, charged or sent to a provider. */
export class WalletError extends Error {
  readonly code: "insufficient_credits" | "billing_unavailable";
  readonly status: number;
  readonly ownerAction: OwnerAction;
  constructor(
    public wallet: WalletDenial,
    /** Balance the call was checked against. Not part of the response. */
    readonly mode: WalletMode = "test",
    /** Rate that needs an operator, for the alert. Never sent to the caller. */
    readonly rateVersion?: string,
  ) {
    const action = ownerActions[wallet.reason];
    super(
      (wallet.reason === "rate_unverified"
        ? "This paid tool is temporarily unavailable for this account because it cannot be billed right now. Nothing was charged."
        : wallet.reason === "dispute_hold"
          ? "Paid tools are paused for this account while a card payment is under review. Nothing was charged."
          : `This account has ${usd(wallet.availableMicros)} of credits available and a paid tool call needs ${usd(wallet.requiredMicros)}. Nothing was charged.`) +
        ` ${action.message} Continue with ${wallet.reason === "rate_unverified" ? "other" : "free"} tools or the evidence already gathered.`,
    );
    const unbillable = wallet.reason === "rate_unverified";
    this.code = unbillable ? "billing_unavailable" : "insufficient_credits";
    this.status = unbillable ? 409 : 402;
    this.ownerAction = action;
  }
}

export function walletEnforcementEnabled() {
  return process.env.TWO_HANDS_WALLET_ENFORCEMENT === "true";
}

/** Private rate binding. A provider credential change requires re-verification. */
export function walletCredentialDigest(credential: string) {
  return createHash("sha256")
    .update("two-hands-wallet-tavily-v1\0")
    .update(credential)
    .digest("hex");
}

const scope = "current_setting('octolab.workspace_id')";
/** A rate row enrolls the account, whether or not the rate is still current. */
const enrollment = `SELECT rate_version, provider_account, credential_digest, provider_cost_micros,
         verified_at, expires_at, (verified_at<=now() AND expires_at>now()) AS current, funding_mode
  FROM wallet_rates WHERE workspace_id=${scope}`;
/** The account's funding mode; an account without a rate has only sandbox funding. */
const fundingMode = `COALESCE((SELECT funding_mode FROM wallet_rates WHERE workspace_id=${scope}),'test')`;
/**
 * One row per workspace for the balance of one mode (the single parameter),
 * whether or not that balance exists yet. A dispute freezes only its own mode,
 * and a payment freezes the account while it has more holds than releases.
 */
const balanceRow = `SELECT w.mode, COALESCE(b.posted_micros,0) AS posted,
         COALESCE(b.held_micros,0) AS held,
         COALESCE(b.charged_micros,0) AS charged,
         b.workspace_id IS NOT NULL AS active,
         EXISTS (
           SELECT 1 FROM wallet_journal d
           WHERE d.workspace_id=${scope} AND d.mode=w.mode
             AND d.kind IN ('dispute_hold','dispute_release')
           GROUP BY d.deposit_id
           HAVING count(*) FILTER (WHERE d.kind='dispute_hold')
                > count(*) FILTER (WHERE d.kind='dispute_release')) AS frozen
  FROM (SELECT ${scope} AS id, ?::text AS mode) w
  LEFT JOIN wallet_balances b ON b.workspace_id=w.id AND b.mode=w.mode`;
/** Customer wording for a hold's state or a refusal. */
function outcomeOf(
  state: string,
  refusalReason: string | null,
): Pick<WalletActivityItem, "outcome" | "reason"> {
  if (state === "refused")
    return {
      outcome: "refused",
      reason: refusalReason as WalletActivityItem["reason"],
    };
  if (state === "posted") return { outcome: "charged", reason: null };
  if (state === "pending") return { outcome: "in_progress", reason: null };
  return { outcome: "released", reason: state as WalletActivityItem["reason"] };
}
const inactive: WalletStatus = {
  mode: "test",
  enforced: false,
  active: false,
  postedMicros: 0,
  heldMicros: 0,
  availableMicros: 0,
  chargedMicros: 0,
  frozen: false,
};

/**
 * Prepaid service credits for one account. Every method runs inside the
 * caller's workspace transaction or read.
 */
export class Wallet {
  private installed = false;
  private refunds = false;
  private refusals = false;
  constructor(private readonly store: Store) {}

  /**
   * False on SQLite and on a PostgreSQL schema that predates the wallet
   * migration, where every method is a no-op. The startup migration check
   * already refuses to serve a release whose migrations are pending; this
   * keeps tooling and recovery paths that skip that check from failing on
   * missing tables.
   */
  private async ready() {
    if (this.installed) return true;
    if (this.store.db.dialect !== "postgres") return false;
    const row = await this.store.db
      .prepare(
        "SELECT to_regclass('octolab.wallet_journal') IS NOT NULL AS installed",
      )
      .get();
    return (this.installed = row?.installed === true);
  }

  /**
   * Gate for every paid call of an enrolled account, in the transaction that
   * creates its receipt.
   *
   * - The rated configuration is held at its maximum charge (returns true).
   * - The rated configuration with a lapsed or mismatched rate fails closed.
   * - Any other paid call is not held or charged (returns false), but is
   *   refused while the account could not cover the rated hold, so an empty
   *   wallet cannot be worked around with an unrated variant.
   *
   * Free calls and accounts without a rate are untouched.
   */
  async admit(call: ObservedCall, providerCredential = "") {
    const { db } = this.store;
    if (!walletEnforcementEnabled() || !(await this.ready())) return false;
    const rate = await db.prepare(enrollment).get();
    if (!rate) return false;
    const rated =
      call.tool === "tavily_search" &&
      (call.arguments.searchDepth ?? "basic") === "basic" &&
      (call.arguments.maxResults ?? 10) === 10;
    if (!rated && !(call.estimateMicros > 0)) return false;

    const base = Number(rate.provider_cost_micros);
    const { markupBps, markupMicros, maximumMicros } = shadowWalletPrice(base);
    // All keys and sessions of the account serialize here. The workspace
    // transaction already holds this lock; taking it again is free and keeps
    // the balance check correct for any future caller.
    await db
      .prepare(`SELECT pg_advisory_xact_lock(hashtextextended(${scope},0))`)
      .get();
    const mode: WalletMode = rate.funding_mode === "live" ? "live" : "test";
    const balance = (await db.prepare(balanceRow).get(mode))!;
    const heldMicros = Number(balance.held);
    const availableMicros = Number(balance.posted) - heldMicros;
    const deny = (reason: WalletDenial["reason"]) =>
      new WalletError(
        {
          reason,
          requiredMicros: maximumMicros,
          availableMicros: Math.max(0, availableMicros),
          heldMicros,
        },
        mode,
        String(rate.rate_version),
      );
    if (balance.frozen === true) throw deny("dispute_hold");
    if (availableMicros < maximumMicros) throw deny("insufficient_balance");
    if (!rated) return false;
    if (
      rate.current !== true ||
      !fixedCostTavilyCall(call, providerCredential) ||
      rate.provider_account !== call.providerAccountReference ||
      rate.credential_digest !== walletCredentialDigest(providerCredential)
    ) {
      // Operator alert: no customer data, only the rate that needs attention.
      console.error(
        `Wallet rate ${String(rate.rate_version)} is expired or no longer matches the provider credential. Billable calls are refused until it is re-verified.`,
      );
      throw deny("rate_unverified");
    }
    await db
      .prepare(
        `INSERT INTO wallet_holds
         (call_id,key_id,tool,search_depth,max_results,adapter_version,provider_account,
          rate_version,rate_verified_at,rate_expires_at,provider_cost_micros,markup_bps,markup_micros,maximum_micros,mode)
         VALUES (?,?,'tavily_search','basic',10,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        call.id,
        call.apiKeyId ?? null,
        call.adapter!.version,
        rate.provider_account,
        rate.rate_version,
        rate.verified_at,
        rate.expires_at,
        base,
        markupBps,
        markupMicros,
        maximumMicros,
        mode,
      );
    return true;
  }

  /**
   * Closes an open hold with the saved call outcome: one debit of the frozen
   * cost plus markup for a billable result, otherwise a release at zero charge.
   * Works after the flag or rate is turned off, and is a no-op without a hold.
   */
  async close(call: ObservedCall) {
    const { db } = this.store;
    if (!(await this.ready())) return;
    const hold = await db
      .prepare(
        `SELECT h.total_micros, h.mode FROM wallet_holds h
         WHERE h.workspace_id=${scope} AND h.call_id=? AND NOT EXISTS (
           SELECT 1 FROM wallet_hold_closures c
           WHERE c.workspace_id=h.workspace_id AND c.call_id=h.call_id
         )`,
      )
      .get(call.id);
    if (!hold) return;

    const { outcome, providerRequestId, reportedCredits } = holdOutcome(call);
    await db
      .prepare(
        "INSERT INTO wallet_hold_closures(call_id,outcome,provider_request_id,reported_credits) VALUES (?,?,?,?)",
      )
      .run(call.id, outcome, providerRequestId, reportedCredits);
    if (outcome === "posted")
      await db
        .prepare(
          "INSERT INTO wallet_journal(source_id,kind,wallet_micros,mode) VALUES (?,'usage',?,?)",
        )
        .run(call.id, -Number(hold.total_micros), hold.mode);
  }

  /**
   * The Stripe mode this account's top-ups are created in. Only an account an
   * operator has enrolled for live funding gets "live".
   */
  async fundingMode(): Promise<WalletMode> {
    if (!(await this.ready())) return "test";
    const row = await this.store.db
      .prepare(`SELECT ${fundingMode} AS mode`)
      .get();
    return row?.mode === "live" ? "live" : "test";
  }

  /**
   * A live top-up is offered only while the account could spend it: enrolled
   * for live funding, with a current verified rate, and enforcement on.
   */
  async liveTopUpEligible() {
    if (!walletEnforcementEnabled() || !(await this.ready())) return false;
    const rate = await this.store.db.prepare(enrollment).get();
    return rate?.funding_mode === "live" && rate.current === true;
  }

  /**
   * Enrolls a deposit in the wallet of its own mode.
   *
   * A sandbox deposit is enrolled while enforcement is on for an account
   * funded in sandbox mode. A live deposit is always enrolled: live checkout
   * creation is already gated, and money that has been taken must always be
   * recorded, whatever the flags say later.
   */
  async enrollDeposit(depositId: string, mode: WalletMode = "test") {
    if (!(await this.ready())) return;
    if (mode === "test" && !walletEnforcementEnabled()) return;
    await this.store.db
      .prepare(
        `INSERT INTO wallet_deposits(deposit_id,mode)
         SELECT ?,? WHERE EXISTS (${enrollment} AND funding_mode=?)
         ON CONFLICT (workspace_id,deposit_id) DO NOTHING`,
      )
      .run(depositId, mode, mode);
  }

  /**
   * Converges an enrolled deposit on its verified net amount. Replays post
   * nothing; refunds append negative adjustments.
   *
   * Disputes run in cycles. `dispute.cycle` is how many disputes Stripe has
   * opened on the payment so far. While the payment is disputed and not
   * released, one `dispute_hold` per cycle removes whatever the payment still
   * holds, and nothing else is posted. Once an operator has released the
   * current cycle (`dispute.released`), the payment converges on
   * `targetMicros` again like any other, so a refund Stripe reports later
   * still comes out of the restored credits.
   *
   * `firstVerification` is true only when this reconciliation is the first to
   * see the payment as paid. A sandbox checkout prepared before the account
   * was enrolled, but first paid while enforcement is on, is enrolled here.
   * Payments already credited before enrollment are never backfilled.
   *
   * Returns false when the deposit is not a wallet deposit. A live caller
   * treats that as an error, because live money has no other ledger.
   */
  async reconcileDeposit(
    depositId: string,
    reference: string,
    targetMicros: number,
    disputed: boolean,
    firstVerification = false,
    mode: WalletMode = "test",
    dispute: { cycle?: number; released?: boolean } = {},
  ) {
    const { db } = this.store;
    if (!(await this.ready())) return false;
    if (firstVerification) await this.enrollDeposit(depositId, mode);
    const state = await db
      .prepare(
        `SELECT EXISTS(SELECT 1 FROM wallet_deposits WHERE workspace_id=${scope} AND deposit_id=? AND mode=?) AS enrolled,
                COALESCE(sum(wallet_micros),0) AS current,
                count(*) FILTER (WHERE kind='dispute_hold') AS holds,
                COALESCE(max(revision),0)+1 AS next_revision
         FROM wallet_journal WHERE workspace_id=${scope} AND deposit_id=?`,
      )
      .get(depositId, mode, depositId);
    if (!state?.enrolled) return false;
    const current = Number(state.current);
    let kind: "deposit" | "refund" | "dispute_hold";
    let deltaMicros: number;
    if (disputed && !dispute.released) {
      // Already held for this dispute. This also covers a hold that was
      // released by hand before the release action existed.
      if (Number(state.holds) >= (dispute.cycle ?? 1)) return true;
      kind = "dispute_hold";
      deltaMicros = -current;
      targetMicros = 0;
    } else {
      deltaMicros = targetMicros - current;
      if (!deltaMicros) return true;
      kind = deltaMicros < 0 ? "refund" : "deposit";
    }
    await db
      .prepare(
        `INSERT INTO wallet_journal (source_id,revision,kind,reference,target_micros,wallet_micros,mode)
         VALUES (?,?,?,?,?,?,?)`,
      )
      .run(
        depositId,
        state.next_revision,
        kind,
        reference,
        targetMicros,
        deltaMicros,
        mode,
      );
    return true;
  }

  /**
   * Records a payment condition that needs an operator, once per kind and
   * reference while it is open. Durable, unlike a log line. Call inside the
   * account's transaction.
   */
  async alert(
    mode: WalletMode,
    kind: string,
    reference: string,
    detail: Record<string, unknown>,
  ) {
    console.error(
      `Wallet operator alert ${kind} for ${reference}: ${JSON.stringify(detail)}`,
    );
    await this.saveAlert(mode, kind, reference, detail);
  }
  private async saveAlert(
    mode: WalletMode,
    kind: string,
    reference: string,
    detail: Record<string, unknown>,
  ) {
    if (!(await this.ready()) || !(await this.phase3())) return;
    await this.store.db
      .prepare(
        "INSERT OR IGNORE INTO wallet_operator_alerts(mode,kind,reference,detail) VALUES (?,?,?,?)",
      )
      .run(mode, kind, reference, JSON.stringify(detail));
  }

  /** True once the live-mode migration (refund requests, alerts) is installed. */
  private async phase3() {
    if (this.refunds) return true;
    const row = await this.store.db
      .prepare(
        "SELECT to_regclass('octolab.wallet_refund_requests') IS NOT NULL AS installed",
      )
      .get();
    return (this.refunds = row?.installed === true);
  }

  /**
   * Stripe's cumulative refunded total that an operator refund in flight will
   * produce for this payment, or 0. Reconciliation keeps that amount out of
   * the balance before Stripe reports it.
   */
  async pendingRefundedCents(depositId: string) {
    if (!(await this.ready()) || !(await this.phase3())) return 0;
    const row = await this.store.db
      .prepare(
        `SELECT COALESCE(max(expected_refunded_cents),0) AS cents FROM wallet_refund_requests
         WHERE workspace_id=${scope} AND deposit_id=? AND status IN ('reserved','submitted')`,
      )
      .get(depositId);
    return Number(row?.cents ?? 0);
  }

  /** Latest postings of the balance that pays for this account's calls. */
  async entries(): Promise<WalletEntry[]> {
    if (!(await this.ready())) return [];
    return (
      await this.store.db
        .prepare(
          `SELECT kind, wallet_micros, reference, created_at FROM wallet_journal
           WHERE workspace_id=${scope} AND mode=${fundingMode}
           ORDER BY created_at DESC, revision DESC LIMIT 100`,
        )
        .all()
    ).map((row) => ({
      kind: String(row.kind),
      micros: Number(row.wallet_micros),
      // Usage rows have no reference; payment references are Stripe IDs the owner already sees.
      reference: row.reference === null ? null : String(row.reference),
      createdAt: new Date(row.created_at as string).toISOString(),
    }));
  }

  /** True once the customer-surface migration (refusal log) is installed. */
  private async phase4() {
    if (this.refusals) return true;
    const row = await this.store.db
      .prepare(
        "SELECT to_regclass('octolab.wallet_refusals') IS NOT NULL AS installed",
      )
      .get();
    return (this.refusals = row?.installed === true);
  }

  /**
   * Records that a paid call was refused, after the refused call's own
   * transaction rolled back. A refusal writes no receipt, so this is the only
   * trace the account owner can see. It never moves money, and it never
   * throws: a refusal that cannot be logged is still a refusal.
   */
  async refused(tool: string, error: WalletError) {
    try {
      if (!(await this.ready())) return;
      await this.store.transaction(async () => {
        if (await this.phase4())
          await this.store.db
            .prepare(
              `INSERT INTO wallet_refusals(mode,tool,reason,required_micros,available_micros)
               VALUES (?,?,?,?,?)
               ON CONFLICT (workspace_id,mode,tool,reason,minute) DO UPDATE
                 SET refusals=wallet_refusals.refusals+1, last_at=now(),
                     required_micros=EXCLUDED.required_micros,
                     available_micros=EXCLUDED.available_micros`,
            )
            .run(
              error.mode,
              tool.slice(0, 200),
              error.wallet.reason,
              error.wallet.requiredMicros,
              error.wallet.availableMicros,
            );
        // A lapsed rate needs an operator. The customer is told Two Hands
        // has been notified, so the notice must be durable.
        if (error.wallet.reason === "rate_unverified" && error.rateVersion)
          // `admit` already logged it; this makes it durable.
          await this.saveAlert(
            error.mode,
            "rate_unverified",
            `${error.rateVersion}@${this.store.workspaceId}`,
            { rateVersion: error.rateVersion },
          );
      });
    } catch (failure) {
      console.error(
        `Wallet refusal could not be recorded: ${failure instanceof Error ? failure.message : "unknown error"}`,
      );
    }
  }

  /**
   * Per-call wallet activity of the balance that pays for this account's
   * calls: every hold with its outcome, and refused calls. Newest first.
   */
  async activity(
    options: { since?: string; page?: number; pageSize?: number } = {},
  ): Promise<WalletActivityPage> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 25;
    const mode = await this.fundingMode();
    if (!(await this.ready()))
      return { mode, items: [], total: 0, page, pageSize };
    const since = options.since ?? "1970-01-01T00:00:00.000Z";
    const refusals = (await this.phase4())
      ? `UNION ALL
         SELECT 'refused', NULL, NULL, r.tool, r.last_at, r.reason, NULL, NULL, 0, r.required_micros, r.refusals
         FROM wallet_refusals r WHERE r.workspace_id=${scope} AND r.mode=${fundingMode}`
      : "";
    const from = `FROM (
         SELECT 'call' AS type, h.call_id, o.session_id, h.tool, h.created_at AS at,
                COALESCE(c.outcome,'pending') AS outcome, h.provider_cost_micros AS cost,
                h.markup_micros AS markup,
                CASE WHEN c.outcome='posted' THEN h.total_micros ELSE 0 END AS charged,
                h.maximum_micros AS held, 1 AS n
         FROM wallet_holds h
         LEFT JOIN wallet_hold_closures c ON c.workspace_id=h.workspace_id AND c.call_id=h.call_id
         LEFT JOIN observation_calls o ON o.workspace_id=h.workspace_id AND o.id=h.call_id
         WHERE h.workspace_id=${scope} AND h.mode=${fundingMode}
         ${refusals}
       ) a WHERE a.at >= ?::timestamptz`;
    const { db } = this.store;
    const total = Number(
      (await db.prepare(`SELECT count(*) AS n ${from}`).get(since))!.n,
    );
    const rows = await db
      .prepare(`SELECT a.* ${from} ORDER BY a.at DESC LIMIT ? OFFSET ?`)
      .all(since, pageSize, (page - 1) * pageSize);
    return {
      mode,
      total,
      page,
      pageSize,
      items: rows.map((row) => {
        const refused = row.type === "refused";
        const state = String(row.outcome);
        return {
          type: refused ? "refused" : "call",
          callId: row.call_id === null ? null : String(row.call_id),
          sessionId: row.session_id === null ? null : String(row.session_id),
          tool: String(row.tool),
          at: new Date(row.at as string).toISOString(),
          ...outcomeOf(refused ? "refused" : state, refused ? state : null),
          providerCostMicros: row.cost === null ? null : Number(row.cost),
          markupMicros: row.markup === null ? null : Number(row.markup),
          chargedMicros: Number(row.charged),
          heldMicros: Number(row.held),
          count: Number(row.n),
        };
      }),
    };
  }

  /** Wallet charges for a page of calls, keyed by call ID. One read per 500 calls. */
  async charges(callIds: string[]): Promise<Map<string, WalletCharge>> {
    const found = new Map<string, WalletCharge>();
    if (!callIds.length || !(await this.ready())) return found;
    for (let start = 0; start < callIds.length; start += 500) {
      const ids = callIds.slice(start, start + 500);
      const rows = await this.store.db
        .prepare(
          `SELECT h.call_id, h.mode, h.provider_cost_micros, h.markup_micros, h.total_micros,
                  h.maximum_micros, COALESCE(c.outcome,'pending') AS outcome
           FROM wallet_holds h
           LEFT JOIN wallet_hold_closures c ON c.workspace_id=h.workspace_id AND c.call_id=h.call_id
           WHERE h.workspace_id=${scope} AND h.call_id IN (${ids.map(() => "?").join(",")})`,
        )
        .all(...ids);
      for (const row of rows)
        found.set(String(row.call_id), {
          ...outcomeOf(String(row.outcome), null),
          providerCostMicros: Number(row.provider_cost_micros),
          markupMicros: Number(row.markup_micros),
          chargedMicros:
            row.outcome === "posted" ? Number(row.total_micros) : 0,
          heldMicros: Number(row.maximum_micros),
          mode: row.mode === "live" ? "live" : "test",
        });
    }
    return found;
  }

  /**
   * Dated statement of the balance that pays for this account's calls: the
   * opening balance, every posting in [from, to) oldest first with the running
   * balance, and the closing balance. Raw micros; no prompts, results or keys.
   * Returns null when the range holds more than STATEMENT_MAX_LINES postings.
   */
  async statement(from: string, to: string): Promise<WalletStatement | null> {
    const mode = await this.fundingMode();
    if (!(await this.ready()))
      return { mode, from, to, openingMicros: 0, closingMicros: 0, lines: [] };
    const { db } = this.store;
    const openingMicros = Number(
      (await db
        .prepare(
          `SELECT COALESCE(sum(wallet_micros),0) AS micros FROM wallet_journal
           WHERE workspace_id=${scope} AND mode=${fundingMode} AND created_at < ?::timestamptz`,
        )
        .get(from))!.micros,
    );
    const rows = await db
      .prepare(
        `SELECT j.kind, j.source_id, j.reference, j.wallet_micros, j.created_at,
                h.tool, h.provider_cost_micros, h.markup_micros
         FROM wallet_journal j
         LEFT JOIN wallet_holds h ON h.workspace_id=j.workspace_id AND h.call_id=j.call_id
         WHERE j.workspace_id=${scope} AND j.mode=${fundingMode}
           AND j.created_at >= ?::timestamptz AND j.created_at < ?::timestamptz
         ORDER BY j.created_at, j.source_id, j.revision LIMIT ?`,
      )
      .all(from, to, STATEMENT_MAX_LINES + 1);
    if (rows.length > STATEMENT_MAX_LINES) return null;
    let balanceMicros = openingMicros;
    const lines = rows.map((row) => {
      const micros = Number(row.wallet_micros);
      balanceMicros += micros;
      const kind = String(row.kind);
      return {
        at: new Date(row.created_at as string).toISOString(),
        kind,
        // An operator's free-text adjustment note stays internal; the posting ID is enough to trace it.
        reference:
          kind === "usage" || kind === "adjustment" || row.reference === null
            ? String(row.source_id)
            : String(row.reference),
        tool: row.tool === null ? null : String(row.tool),
        providerCostMicros:
          row.provider_cost_micros === null
            ? null
            : Number(row.provider_cost_micros),
        markupMicros:
          row.markup_micros === null ? null : Number(row.markup_micros),
        micros,
        balanceMicros,
      };
    });
    return {
      mode,
      from,
      to,
      openingMicros,
      closingMicros: balanceMicros,
      lines,
    };
  }

  /**
   * Whether a paid call would pass the wallet now, and the price of the
   * billable configuration, for discovery and route quotes. Mirrors `admit`
   * without the account lock, so it is advice, not admission.
   */
  async quote(): Promise<WalletQuote> {
    if (!walletEnforcementEnabled() || !(await this.ready()))
      return unenforcedQuote;
    const { db } = this.store;
    const rate = await db.prepare(enrollment).get();
    if (!rate) return unenforcedQuote;
    const mode: WalletMode = rate.funding_mode === "live" ? "live" : "test";
    const base = Number(rate.provider_cost_micros);
    const { markupBps, totalMicros, maximumMicros } = shadowWalletPrice(base);
    const balance = (await db.prepare(balanceRow).get(mode))!;
    const availableMicros = Number(balance.posted) - Number(balance.held);
    const reason: WalletQuote["reason"] =
      balance.frozen === true
        ? "dispute_hold"
        : availableMicros < maximumMicros
          ? "insufficient_balance"
          : rate.current !== true
            ? "rate_unverified"
            : null;
    return {
      enforced: true,
      mode,
      // A lapsed rate stops only the billable configuration, not every paid call.
      paidCallsAllowed: reason === null || reason === "rate_unverified",
      reason,
      requiredMicros: maximumMicros,
      availableMicros: Math.max(0, availableMicros),
      billable:
        rate.current === true
          ? {
              tool: "tavily_search",
              searchDepth: "basic",
              maxResults: 10,
              providerCostMicros: base,
              markupBps,
              customerPriceMicros: totalMicros,
              rateVersion: String(rate.rate_version),
              expiresAt: new Date(rate.expires_at as string).toISOString(),
            }
          : null,
    };
  }

  /** Two single-row reads; safe to poll. */
  async status(): Promise<WalletStatus> {
    if (!(await this.ready())) return inactive;
    const row = await this.store.db
      .prepare(
        `SELECT s.*, r.provider_cost_micros AS rate_cost, r.current AS rate_current
         FROM (${balanceRow.replace("?::text", fundingMode)}) s
         LEFT JOIN (${enrollment}) r ON true`,
      )
      .get();
    if (!row) return inactive;
    const postedMicros = Number(row.posted),
      heldMicros = Number(row.held);
    const enrolled = row.rate_cost !== null && row.rate_cost !== undefined;
    const enforced = walletEnforcementEnabled() && enrolled;
    const availableMicros = Math.max(0, postedMicros - heldMicros);
    const callHoldMicros = enrolled
      ? shadowWalletPrice(Number(row.rate_cost)).maximumMicros
      : null;
    const callsRemaining = callHoldMicros
      ? Math.floor(availableMicros / callHoldMicros)
      : null;
    return {
      mode: row.mode === "live" ? "live" : "test",
      enforced,
      active: row.active === true,
      postedMicros,
      heldMicros,
      availableMicros,
      chargedMicros: Number(row.charged),
      frozen: row.frozen === true,
      enrolled,
      billingAvailable: !enrolled || row.rate_current === true,
      callHoldMicros,
      callsRemaining,
      lowBalance:
        enforced &&
        callsRemaining !== null &&
        callsRemaining < LOW_BALANCE_CALLS,
    };
  }
}

/**
 * Marks paid candidates the wallet would refuse, so discovery and routing do
 * not offer a call that admission is certain to deny. Free tools are never
 * touched. Like the operator allowance, this is a snapshot; admission decides.
 */
export function applyWalletQuote<
  T extends {
    requestEstimates: {
      operationIndex: number;
      estimatedMicros: number;
      withinBudget: boolean;
    }[];
    discoveryMatches: {
      operationIndex: number;
      status: string;
      reason: string;
    }[];
  },
>(tools: T[], quote: WalletQuote): T[] {
  const refused = (micros: number) =>
    quote.enforced && !quote.paidCallsAllowed && micros > 0;
  for (const tool of tools) {
    for (const estimate of tool.requestEstimates) {
      const allowed = !refused(estimate.estimatedMicros);
      Object.assign(estimate, { walletAllowed: allowed });
      if (!allowed) estimate.withinBudget = false;
    }
    for (const match of tool.discoveryMatches) {
      const estimate = tool.requestEstimates.find(
        (e) => e.operationIndex === match.operationIndex,
      );
      if (
        estimate &&
        refused(estimate.estimatedMicros) &&
        (match.status === "eligible" || match.status === "over_budget")
      ) {
        match.status = "disabled";
        match.reason = walletRefusalReason(quote);
      }
    }
  }
  return tools;
}
/** One sentence an agent can relay, with what the account owner can do. */
export function walletRefusalReason(quote: WalletQuote) {
  return quote.reason === "dispute_hold"
    ? "Paid tools are paused for this account while a card payment is under review."
    : "This account's credits do not cover a paid call. The account owner can add credits in Two Hands.";
}
