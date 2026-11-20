import { createHash, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import Stripe from "stripe";
import { z } from "zod";
import { PostgresDatabase } from "./database.js";
import { FundingError } from "./funding.js";
import type { StripeDeposit, StripeMode } from "./funding-types.js";
import {
  REFUND_POLICY_VERSION,
  refundableByPayment,
  unusedRefundsEnabled,
  type RefundablePayment,
} from "./refund-policy.js";
import {
  refundFailed,
  stripeModeOf,
  type StripeFundingService,
  type StripeRefund,
} from "./stripe-funding.js";

/**
 * Operator money actions on an account wallet: releasing a dispute freeze and
 * refunding unused credit to the card that paid for it.
 *
 * These are the only application paths that post `dispute_release` entries or
 * create refund requests. They run on the database owner connection, under
 * the same per-account lock as call admission, so the runtime role keeps no
 * permission to do either. Every action is verified against Stripe first and
 * leaves an immutable `wallet_operator_actions` record.
 */

export const releaseInput = z
  .object({
    requestKey: z.uuid(),
    note: z
      .string()
      .trim()
      .min(10, "Add a note of at least 10 characters.")
      .max(4000),
  })
  .strict();
export const refundInput = z
  .object({
    requestKey: z.uuid(),
    amount: z
      .string()
      .regex(
        /^(?:0|[1-9]\d{0,3})(?:\.\d{1,2})?$/,
        "Use a USD amount with up to two decimal places.",
      )
      .transform((s) => {
        const [whole, fraction = ""] = s.split(".");
        return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
      })
      .pipe(z.number().int().min(1, "Refund at least $0.01.")),
    note: z
      .string()
      .trim()
      .min(10, "Add a note of at least 10 characters.")
      .max(4000),
  })
  .strict();

export const alertInput = z
  .object({
    note: z
      .string()
      .trim()
      .min(10, "Add a note of at least 10 characters.")
      .max(4000),
  })
  .strict();
/** Largest single adjustment in either direction: $100. */
export const ADJUSTMENT_MAX_MICROS = 100_000_000;
export const adjustmentInput = z
  .object({
    requestKey: z.uuid(),
    accountId: z.uuid(),
    // Named by the operator every time. Nothing defaults to sandbox or live.
    mode: z.enum(["test", "live"]),
    amount: z
      .string()
      .regex(
        /^-?(?:0|[1-9]\d{0,2})(?:\.\d{1,6})?$/,
        "Use a USD amount with up to six decimal places, negative to remove credits.",
      )
      .transform((s) => {
        const negative = s.startsWith("-");
        const [whole, fraction = ""] = s.replace("-", "").split(".");
        const micros =
          Number(whole) * 1_000_000 + Number(fraction.padEnd(6, "0"));
        return negative ? -micros : micros;
      })
      .pipe(
        z
          .number()
          .int()
          .refine((n) => n !== 0, "Enter an amount other than zero.")
          .refine(
            (n) => Math.abs(n) <= ADJUSTMENT_MAX_MICROS,
            "One adjustment is limited to $100 in either direction.",
          ),
      ),
    note: z
      .string()
      .trim()
      .min(10, "Add a note of at least 10 characters.")
      .max(4000),
  })
  .strict();
export interface WalletAdjustment {
  id: string;
  accountId: string;
  account: string | null;
  mode: StripeMode;
  micros: number;
  actor: string;
  note: string;
  createdAt: string;
}
export interface AdjustmentResult {
  adjustment: WalletAdjustment;
  balance: {
    postedMicros: number;
    heldMicros: number;
    availableMicros: number;
  };
  replayed: boolean;
}
/** An account an operator can adjust: enrolled for credit billing. */
export interface AdjustableAccount {
  accountId: string;
  account: string;
  fundingMode: StripeMode;
  balances: {
    mode: StripeMode;
    postedMicros: number;
    heldMicros: number;
    availableMicros: number;
  }[];
}
export type OperatorAlert = Awaited<
  ReturnType<WalletOperations["alerts"]>
>[number];

export type RefundRequestStatus =
  "reserved" | "submitted" | "completed" | "failed";
export interface RefundRequest {
  id: string;
  depositId: string;
  amountCents: number;
  status: RefundRequestStatus;
  stripeRefundId: string | null;
  policyVersion: string;
  actor: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}
export interface RefundQuote {
  payment: StripeDeposit;
  mode: StripeMode;
  /** False until the owner approves a refund policy and enables refunds. */
  refundsEnabled: boolean;
  policyVersion: string;
  refundableCents: number;
  availableMicros: number;
  frozen: boolean;
  requests: RefundRequest[];
}
export interface DisputeRelease {
  payment: StripeDeposit;
  outcome: "won" | "lost";
  restoredMicros: number;
  replayed: boolean;
}

/**
 * Stripe's dispute statuses. A dispute is open while Stripe may still decide
 * it. Every other status is final: these three end with the payment standing
 * (a `prevented` dispute was settled by a refund, which the refunded total
 * already reflects), `lost` ends with the money taken back, and a final
 * status this code does not know is treated like `lost`, so nothing is
 * restored on an outcome that was not understood.
 */
const DISPUTE_OPEN = new Set([
  "needs_response",
  "under_review",
  "warning_needs_response",
  "warning_under_review",
]);
const DISPUTE_PAYMENT_STANDS = new Set(["won", "warning_closed", "prevented"]);
const uniqueViolation = (error: unknown) =>
  (error as { code?: string }).code === "23505";
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const requestRow = (r: Record<string, unknown>): RefundRequest => ({
  id: String(r.id),
  depositId: String(r.deposit_id),
  amountCents: Number(r.amount_cents),
  status: r.status as RefundRequestStatus,
  stripeRefundId:
    r.stripe_refund_id === null ? null : String(r.stripe_refund_id),
  policyVersion: String(r.policy_version),
  actor: String(r.actor),
  note: String(r.note),
  createdAt: new Date(r.created_at as string).toISOString(),
  updatedAt: new Date(r.updated_at as string).toISOString(),
});
const adjustmentRow = (r: Record<string, unknown>): WalletAdjustment => {
  const data = r.data as { micros: number; note: string };
  return {
    id: String(r.id),
    accountId: String(r.workspace_id),
    account: r.account === null ? null : String(r.account),
    mode: r.mode as StripeMode,
    micros: Number(data.micros),
    actor: String(r.actor),
    note: String(data.note),
    createdAt: new Date(r.created_at as string).toISOString(),
  };
};
/** The payment facts an operator action was decided on. A change means: look again. */
const evidence = (p: StripeDeposit) =>
  hash([
    p.amountCents,
    p.paymentIntentId,
    p.chargeId,
    p.refundedCents,
    p.disputed,
    p.netCreditUnits,
  ]);

export class WalletOperations {
  constructor(
    private stripe: StripeFundingService,
    private now = () => Date.now(),
  ) {
    stripe.refundsObserved = (depositId, refunds) =>
      this.closeFailedRequests(depositId, refunds);
  }

  /**
   * Closes operator refund requests whose refund Stripe reports as failed or
   * canceled. A closed request no longer reserves credits, so the payment's
   * next verification returns them to the balance.
   */
  private async closeFailedRequests(
    depositId: string,
    refunds: StripeRefund[],
  ) {
    const { db } = this.stripe.funding.store;
    if (!(db instanceof PostgresDatabase)) return;
    const failed = refunds
      .filter(refundFailed)
      .map((r) => r.metadata?.octolab_refund_request_id)
      .filter((id): id is string => /^[0-9a-f-]{36}$/i.test(id ?? ""));
    if (!failed.length) return;
    const workspaceId = await this.workspaceOf(depositId);
    await this.owner(workspaceId, async (client) => {
      const closed = await client.query(
        `UPDATE octolab.wallet_refund_requests SET status='failed', updated_at=now()
         WHERE workspace_id=$1 AND deposit_id=$2 AND id=ANY($3::uuid[])
           AND status IN ('reserved','submitted') RETURNING id,mode`,
        [workspaceId, depositId, failed],
      );
      for (const row of closed.rows)
        await this.record(client, {
          workspaceId,
          depositId,
          mode: row.mode,
          kind: "refund_resolution",
          actor: "system: Stripe reported the refund as failed",
          requestKey: randomUUID(),
          inputHash: hash({ requestId: row.id, status: "failed" }),
          data: { requestId: row.id, status: "failed" },
        });
    });
  }

  /** Open operator alerts across accounts, newest first. */
  async alerts() {
    return (
      await this.database().pool.query(
        `SELECT a.id,a.mode,a.kind,a.reference,a.detail,a.created_at,s.name AS account
         FROM octolab.wallet_operator_alerts a
         LEFT JOIN octolab.workspaces s ON s.id=a.workspace_id
         WHERE a.resolved_at IS NULL ORDER BY a.created_at DESC LIMIT 100`,
      )
    ).rows.map((r) => ({
      id: String(r.id),
      mode: r.mode as StripeMode,
      kind: String(r.kind),
      reference: String(r.reference),
      detail: r.detail as Record<string, unknown>,
      account: r.account === null ? null : String(r.account),
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }
  /** Marks an alert handled, with who handled it and why. It changes no balance. */
  async resolveAlert(id: string, raw: unknown, actor: string) {
    const { note } = alertInput.parse(raw);
    const changed = await this.database().pool.query(
      "UPDATE octolab.wallet_operator_alerts SET resolved_at=now(), resolved_by=$2, resolution_note=$3 WHERE id=$1 AND resolved_at IS NULL",
      [id, actor, note],
    );
    if (!changed.rowCount)
      throw new FundingError(404, "No open alert with this ID.");
    return { items: await this.alerts() };
  }
  /** Full configuration state of both rails. Operators only; customers get safe copy. */
  railStatus() {
    return {
      test: this.stripe.status("test"),
      live: this.stripe.status("live"),
      refundsEnabled: unusedRefundsEnabled(),
    };
  }

  private database() {
    const { db } = this.stripe.funding.store;
    if (!(db instanceof PostgresDatabase))
      // Not 503: the admin page treats that as "admin access is disabled".
      throw new FundingError(
        409,
        "Wallet operations need the hosted account wallet.",
      );
    return db;
  }
  private async workspaceOf(depositId: string) {
    const rows = await this.database().pool.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM octolab.stripe_deposits WHERE id=$1 LIMIT 2",
      [depositId],
    );
    if (rows.rows.length !== 1)
      throw new FundingError(
        rows.rows.length ? 409 : 404,
        "Payment could not be uniquely identified.",
      );
    return rows.rows[0].workspace_id;
  }
  /** Runs as the database owner under the account lock that admission takes. */
  private async owner<T>(
    workspaceId: string,
    fn: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.database().pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
        [workspaceId],
      );
      const value = await fn(client);
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }
  private inAccount<T>(workspaceId: string, action: () => Promise<T>) {
    return this.stripe.funding.store.scope.run(workspaceId, action);
  }
  /** The wallet deposit behind a payment, locked, or a refusal when the payment does not fund a wallet. */
  private async walletDeposit(
    client: PoolClient,
    workspaceId: string,
    depositId: string,
  ) {
    const row = (
      await client.query(
        `SELECT d.body, w.mode FROM octolab.stripe_deposits d
         JOIN octolab.wallet_deposits w ON w.workspace_id=d.workspace_id AND w.deposit_id=d.id
         WHERE d.workspace_id=$1 AND d.id=$2 FOR UPDATE OF d`,
        [workspaceId, depositId],
      )
    ).rows[0];
    if (!row)
      throw new FundingError(
        409,
        "This payment does not fund an account wallet. Nothing was changed.",
      );
    const payment = JSON.parse(row.body) as StripeDeposit;
    if (stripeModeOf(payment) !== row.mode)
      throw new FundingError(
        409,
        "This payment's mode does not match its wallet. Nothing was changed.",
      );
    return { payment, mode: row.mode as StripeMode };
  }
  private async saveDeposit(
    client: PoolClient,
    workspaceId: string,
    payment: StripeDeposit,
    event: string,
  ) {
    payment.updatedAt = new Date(this.now()).toISOString();
    await client.query(
      "UPDATE octolab.stripe_deposits SET body=$3 WHERE workspace_id=$1 AND id=$2",
      [workspaceId, payment.id, JSON.stringify(payment)],
    );
    await client.query(
      "INSERT INTO octolab.stripe_deposit_events(workspace_id,deposit_id,body) VALUES ($1,$2,$3)",
      [
        workspaceId,
        payment.id,
        JSON.stringify({
          event,
          at: payment.updatedAt,
          status: payment.status,
          sessionId: payment.checkoutSessionId,
          paymentIntentId: payment.paymentIntentId,
          chargeId: payment.chargeId,
          amountCents: payment.amountCents,
          refundedCents: payment.refundedCents,
          netCreditUnits: payment.netCreditUnits,
        }),
      ],
    );
  }
  private async journalState(
    client: PoolClient,
    workspaceId: string,
    depositId: string,
  ) {
    const row = (
      await client.query(
        `SELECT COALESCE(sum(wallet_micros),0) AS net,
                COALESCE(max(revision),0)+1 AS next_revision,
                count(*) FILTER (WHERE kind='dispute_hold') AS holds,
                count(*) FILTER (WHERE kind='dispute_release') AS releases
         FROM octolab.wallet_journal WHERE workspace_id=$1 AND deposit_id=$2`,
        [workspaceId, depositId],
      )
    ).rows[0];
    return {
      netMicros: Number(row.net),
      nextRevision: Number(row.next_revision),
      /** Held while the payment has more dispute holds than releases. */
      held: Number(row.holds) > Number(row.releases),
      everReleased: Number(row.releases) > 0,
    };
  }
  private async record(
    client: PoolClient,
    action: {
      workspaceId: string;
      /** Null only for an adjustment, which belongs to an account, not a payment. */
      depositId: string | null;
      mode: StripeMode;
      kind:
        | "dispute_release"
        | "refund_request"
        | "refund_resolution"
        | "adjustment";
      actor: string;
      requestKey: string;
      inputHash: string;
      data: unknown;
    },
  ) {
    await client.query(
      `INSERT INTO octolab.wallet_operator_actions
       (id,workspace_id,deposit_id,mode,kind,actor,request_key,input_hash,data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        randomUUID(),
        action.workspaceId,
        action.depositId,
        action.mode,
        action.kind,
        action.actor,
        action.requestKey,
        action.inputHash,
        JSON.stringify(action.data),
      ],
    );
  }

  /**
   * Posts one operator `adjustment` to an account's balance, replacing the
   * hand-written journal row.
   *
   * The operator names the account and the mode; nothing is inferred. It runs
   * as the database owner under the account lock, so the runtime role still
   * cannot post an adjustment. The account must be enrolled, the mode must be
   * one the account has a balance in (its funding mode, or an older balance
   * such as the sandbox credits of an account now funded live), and a removal
   * cannot take available credits below zero. The journal row and the
   * immutable `wallet_operator_actions` record commit together. A repeat with
   * the same request key returns the saved adjustment and posts nothing.
   *
   * Adjustment credit is spendable on tool calls and is never refunded to a
   * card (see `refundableByPayment`).
   */
  async adjust(raw: unknown, actor: string): Promise<AdjustmentResult> {
    const input = adjustmentInput.parse(raw);
    const inputHash = hash([
      input.accountId,
      input.mode,
      input.amount,
      input.note,
    ]);
    const balanceOf = async (client: PoolClient) => {
      const row = (
        await client.query(
          "SELECT posted_micros,held_micros FROM octolab.wallet_balances WHERE workspace_id=$1 AND mode=$2",
          [input.accountId, input.mode],
        )
      ).rows[0];
      const postedMicros = Number(row?.posted_micros ?? 0),
        heldMicros = Number(row?.held_micros ?? 0);
      return {
        exists: !!row,
        postedMicros,
        heldMicros,
        availableMicros: postedMicros - heldMicros,
      };
    };
    const saved = async (client: PoolClient, replayed: boolean) => {
      const row = (
        await client.query(
          `SELECT a.id,a.workspace_id,a.mode,a.actor,a.data,a.created_at,a.input_hash,s.name AS account
           FROM octolab.wallet_operator_actions a
           LEFT JOIN octolab.workspaces s ON s.id=a.workspace_id
           WHERE a.request_key=$1`,
          [input.requestKey],
        )
      ).rows[0];
      if (!row) return null;
      if (row.input_hash !== inputHash)
        throw new FundingError(
          409,
          "This request key was already used for a different operator action. Nothing was changed.",
        );
      const { exists: _exists, ...balance } = await balanceOf(client);
      return {
        adjustment: adjustmentRow(row),
        balance: {
          ...balance,
          availableMicros: Math.max(0, balance.availableMicros),
        },
        replayed,
      };
    };
    try {
      return await this.owner(input.accountId, async (client) => {
        const replay = await saved(client, true);
        if (replay) return replay;
        const account = (
          await client.query(
            `SELECT s.id, r.funding_mode FROM octolab.workspaces s
             LEFT JOIN octolab.wallet_rates r ON r.workspace_id=s.id WHERE s.id=$1`,
            [input.accountId],
          )
        ).rows[0];
        if (!account) throw new FundingError(404, "Account not found.");
        if (!account.funding_mode)
          throw new FundingError(
            409,
            "This account is not enrolled for credit billing, so it has no balance to adjust. Nothing was changed.",
          );
        const balance = await balanceOf(client);
        if (account.funding_mode !== input.mode && !balance.exists)
          throw new FundingError(
            409,
            `This account is funded in ${account.funding_mode === "live" ? "live" : "sandbox"} mode and has no ${input.mode === "live" ? "live" : "sandbox"} balance. Nothing was changed.`,
          );
        if (input.amount < 0 && balance.availableMicros + input.amount < 0)
          throw new FundingError(
            409,
            `A removal cannot take available credits below zero. Available now: $${(Math.max(0, balance.availableMicros) / 1e6).toFixed(6)}. Nothing was changed.`,
          );
        const id = randomUUID();
        await client.query(
          `INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,reference,wallet_micros,mode)
           VALUES ($1,$2,'adjustment',$3,$4,$5)`,
          [
            input.accountId,
            id,
            `operator adjustment ${id}`,
            input.amount,
            input.mode,
          ],
        );
        await client.query(
          `INSERT INTO octolab.wallet_operator_actions
           (id,workspace_id,deposit_id,mode,kind,actor,request_key,input_hash,data)
           VALUES ($1,$2,NULL,$3,'adjustment',$4,$5,$6,$7)`,
          [
            id,
            input.accountId,
            input.mode,
            actor,
            input.requestKey,
            inputHash,
            JSON.stringify({
              micros: input.amount,
              note: input.note,
              availableBeforeMicros: balance.availableMicros,
            }),
          ],
        );
        return (await saved(client, false))!;
      });
    } catch (error) {
      // A concurrent duplicate lost the race on the request key: return the saved one.
      if (!uniqueViolation(error)) throw error;
      const client = await this.database().pool.connect();
      try {
        const replay = await saved(client, true);
        if (!replay) throw error;
        return replay;
      } finally {
        client.release();
      }
    }
  }
  /** Enrolled accounts with their balances per mode, for the adjustment screen. */
  async adjustableAccounts(query = ""): Promise<AdjustableAccount[]> {
    const q = query
      .trim()
      .toLowerCase()
      .replace(/[%_\\]/g, "");
    return (
      await this.database().pool.query(
        `SELECT r.workspace_id, s.name, r.funding_mode,
                COALESCE(json_agg(json_build_object('mode',b.mode,'posted',b.posted_micros,'held',b.held_micros)
                         ORDER BY b.mode) FILTER (WHERE b.workspace_id IS NOT NULL),'[]') AS balances
         FROM octolab.wallet_rates r
         JOIN octolab.workspaces s ON s.id=r.workspace_id
         LEFT JOIN octolab.wallet_balances b ON b.workspace_id=r.workspace_id
         WHERE $1='' OR lower(s.name || ' ' || r.workspace_id) LIKE '%' || $1 || '%'
         GROUP BY r.workspace_id, s.name, r.funding_mode
         ORDER BY s.name, r.workspace_id LIMIT 50`,
        [q],
      )
    ).rows.map((row) => ({
      accountId: String(row.workspace_id),
      account: String(row.name),
      fundingMode: row.funding_mode as StripeMode,
      balances: (
        row.balances as { mode: StripeMode; posted: number; held: number }[]
      ).map((b) => ({
        mode: b.mode,
        postedMicros: Number(b.posted),
        heldMicros: Number(b.held),
        availableMicros: Math.max(0, Number(b.posted) - Number(b.held)),
      })),
    }));
  }
  /** Adjustments made with the admin action, newest first. */
  async adjustments(): Promise<WalletAdjustment[]> {
    return (
      await this.database().pool.query(
        `SELECT a.id,a.workspace_id,a.mode,a.actor,a.data,a.created_at,s.name AS account
         FROM octolab.wallet_operator_actions a
         LEFT JOIN octolab.workspaces s ON s.id=a.workspace_id
         WHERE a.kind='adjustment' ORDER BY a.created_at DESC LIMIT 50`,
      )
    ).rows.map(adjustmentRow);
  }

  /**
   * Lifts the freeze a dispute placed on an account, after Stripe has closed
   * every dispute on the payment. Stripe's outcome, not the operator, decides
   * the credits: a payment Stripe reinstated gets its remaining credits back,
   * and a lost dispute restores nothing (less any part not lost).
   */
  async releaseDispute(
    depositId: string,
    raw: unknown,
    actor: string,
  ): Promise<DisputeRelease> {
    const input = releaseInput.parse(raw);
    const inputHash = hash({ depositId, input, actor });
    const workspaceId = await this.workspaceOf(depositId);
    const replay = async (): Promise<DisputeRelease | undefined> => {
      const previous = await this.database().pool.query(
        "SELECT input_hash,data FROM octolab.wallet_operator_actions WHERE request_key=$1",
        [input.requestKey],
      );
      if (!previous.rows[0]) return undefined;
      if (previous.rows[0].input_hash !== inputHash)
        throw new FundingError(
          409,
          "This request key was already used with different details.",
        );
      return {
        payment: await this.inAccount(workspaceId, () =>
          this.stripe.get(depositId),
        ),
        outcome: previous.rows[0].data.outcome,
        restoredMicros: Number(previous.rows[0].data.restoredMicros),
        replayed: true,
      };
    };
    const saved = await replay();
    if (saved) return saved;
    // Read the payment and its disputes from Stripe before deciding anything.
    const verified = await this.inAccount(workspaceId, () =>
      this.stripe.reconcile(depositId),
    );
    if (!verified.disputed || !verified.paymentIntentId)
      throw new FundingError(409, "This payment has no dispute hold.");
    const disputes = await this.stripe.disputesFor(verified);
    if (!disputes.length)
      throw new FundingError(
        409,
        "Stripe reports no dispute for this payment. Nothing was released.",
      );
    if (disputes.some((d) => DISPUTE_OPEN.has(d.status)))
      throw new FundingError(
        409,
        "Stripe has not closed the dispute on this payment. Nothing was released.",
      );
    // Final statuses only from here. Whatever did not end with the payment
    // standing is not restored, including a final status we do not recognise.
    const notStanding = disputes.filter(
      (d) => !DISPUTE_PAYMENT_STANDS.has(d.status),
    );
    const lostCents = notStanding.reduce((sum, d) => sum + d.amount, 0);
    const unrecognised = notStanding
      .map((d) => d.status)
      .filter((status) => status !== "lost");
    const outcome: "won" | "lost" = notStanding.length ? "lost" : "won";
    const release = () =>
      this.owner(workspaceId, async (client) => {
        const { payment, mode } = await this.walletDeposit(
          client,
          workspaceId,
          depositId,
        );
        if (evidence(payment) !== evidence(verified))
          throw new FundingError(
            409,
            "The payment changed while it was being reviewed. Check it again.",
          );
        const journal = await this.journalState(client, workspaceId, depositId);
        if (!journal.held)
          throw new FundingError(
            409,
            journal.everReleased
              ? "The dispute hold on this payment was already released."
              : "This payment has no dispute hold.",
          );
        const refundedCents =
          payment.refundedCents + (payment.pendingRefundCents ?? 0);
        const restoredMicros =
          Math.max(0, payment.amountCents - refundedCents - lostCents) * 10000;
        // While held, the payment's postings net to zero, so the release posts
        // exactly what is restored.
        if (journal.netMicros !== 0)
          throw new FundingError(
            409,
            "This payment's wallet entries do not match its dispute hold. Nothing was released.",
          );
        await client.query(
          `INSERT INTO octolab.wallet_journal
         (workspace_id,source_id,revision,kind,reference,wallet_micros,mode)
         VALUES ($1,$2,$3,'dispute_release',$4,$5,$6)`,
          [
            workspaceId,
            depositId,
            journal.nextRevision,
            `operator-release:${input.requestKey}`,
            restoredMicros,
            mode,
          ],
        );
        payment.disputeResolution = {
          outcome,
          restoredMicros,
          releasedAt: new Date(this.now()).toISOString(),
          lostCents,
          disputeIds: disputes.map((d) => d.id),
        };
        payment.netCreditUnits = restoredMicros;
        payment.status =
          payment.refundedCents === payment.amountCents
            ? "refunded"
            : payment.refundedCents
              ? "partially_refunded"
              : "credited";
        payment.message = restoredMicros
          ? "The dispute on this payment was closed and its remaining credits were restored."
          : "The dispute on this payment was closed. Its credits were not restored.";
        await this.saveDeposit(
          client,
          workspaceId,
          payment,
          "dispute_released",
        );
        await this.record(client, {
          workspaceId,
          depositId,
          mode,
          kind: "dispute_release",
          actor,
          requestKey: input.requestKey,
          inputHash,
          data: {
            outcome,
            restoredMicros,
            lostCents,
            unrecognisedStatuses: unrecognised,
            note: input.note,
            disputes: disputes.map((d) => ({
              id: d.id,
              status: d.status,
              amountCents: d.amount,
            })),
          },
        });
        return { payment, outcome, restoredMicros, replayed: false };
      });
    try {
      return await release();
    } catch (error) {
      // A concurrent copy of this request may have committed first, which
      // makes this copy fail on changed evidence or a unique key. Answer it
      // as the replay it is.
      const committed = await replay();
      if (committed) return committed;
      throw error;
    }
  }

  /** What the refund policy allows for one payment, from saved state only. */
  private async refundState(
    client: Pick<PoolClient, "query">,
    workspaceId: string,
    depositId: string,
    mode: StripeMode,
  ) {
    const balance = (
      await client.query(
        `SELECT COALESCE(b.posted_micros,0) AS posted, COALESCE(b.held_micros,0) AS held,
                COALESCE(b.charged_micros,0) AS charged,
                COALESCE((SELECT sum(j.wallet_micros) FROM octolab.wallet_journal j
                          WHERE j.workspace_id=$1 AND j.mode=$2 AND j.deposit_id IS NOT NULL),0) AS card_net,
                COALESCE((SELECT sum(j.wallet_micros) FROM octolab.wallet_journal j
                          WHERE j.workspace_id=$1 AND j.mode=$2 AND j.kind='adjustment'),0) AS adjustments,
                EXISTS (
                  SELECT 1 FROM octolab.wallet_journal d
                  WHERE d.workspace_id=$1 AND d.mode=$2
                    AND d.kind IN ('dispute_hold','dispute_release')
                  GROUP BY d.deposit_id
                  HAVING count(*) FILTER (WHERE d.kind='dispute_hold')
                       > count(*) FILTER (WHERE d.kind='dispute_release')) AS frozen
         FROM (SELECT 1) one
         LEFT JOIN octolab.wallet_balances b ON b.workspace_id=$1 AND b.mode=$2`,
        [workspaceId, mode],
      )
    ).rows[0];
    const payments: RefundablePayment[] = (
      await client.query(
        `SELECT d.body,
                COALESCE((SELECT max(r.expected_refunded_cents) FROM octolab.wallet_refund_requests r
                          WHERE r.workspace_id=d.workspace_id AND r.deposit_id=d.id
                            AND r.status IN ('reserved','submitted')),0) AS pending
         FROM octolab.wallet_deposits w
         JOIN octolab.stripe_deposits d ON d.workspace_id=w.workspace_id AND d.id=w.deposit_id
         WHERE w.workspace_id=$1 AND w.mode=$2`,
        [workspaceId, mode],
      )
    ).rows.map((row) => {
      const p = JSON.parse(row.body) as StripeDeposit;
      return {
        id: p.id,
        createdAt: p.createdAt,
        disputed: p.disputed,
        // Only a verified, undisputed payment has anything to refund.
        remainingCents:
          p.paymentIntentId &&
          (p.status === "credited" || p.status === "partially_refunded")
            ? Math.max(
                0,
                p.amountCents - Math.max(p.refundedCents, Number(row.pending)),
              )
            : 0,
      };
    });
    const availableMicros = Number(balance.posted) - Number(balance.held);
    const frozen = balance.frozen === true;
    return {
      availableMicros,
      frozen,
      refundableCents:
        refundableByPayment({
          availableMicros,
          cardNetMicros: Number(balance.card_net),
          chargedMicros: Number(balance.charged),
          adjustmentMicros: Number(balance.adjustments),
          frozen,
          payments,
        }).get(depositId) ?? 0,
    };
  }
  private async requests(
    client: Pick<PoolClient, "query">,
    workspaceId: string,
    depositId: string,
  ) {
    return (
      await client.query(
        "SELECT * FROM octolab.wallet_refund_requests WHERE workspace_id=$1 AND deposit_id=$2 ORDER BY created_at DESC LIMIT 50",
        [workspaceId, depositId],
      )
    ).rows.map(requestRow);
  }
  /** Marks requests whose refund Stripe has since reported. Saved state only. */
  private async settleReported(workspaceId: string, depositId: string) {
    await this.database().pool.query(
      `UPDATE octolab.wallet_refund_requests r SET status='completed', updated_at=now()
       FROM octolab.stripe_deposits d
       WHERE r.workspace_id=$1 AND r.deposit_id=$2 AND r.status='submitted'
         AND d.workspace_id=r.workspace_id AND d.id=r.deposit_id
         AND (d.body::jsonb->>'refundedCents')::int >= r.expected_refunded_cents`,
      [workspaceId, depositId],
    );
  }

  async refundQuote(depositId: string): Promise<RefundQuote> {
    const workspaceId = await this.workspaceOf(depositId);
    await this.settleReported(workspaceId, depositId);
    const pool = this.database().pool;
    const payment = await this.inAccount(workspaceId, () =>
      this.stripe.get(depositId),
    );
    const mode = stripeModeOf(payment);
    const enrolled = await pool.query(
      "SELECT 1 FROM octolab.wallet_deposits WHERE workspace_id=$1 AND deposit_id=$2",
      [workspaceId, depositId],
    );
    const state = enrolled.rowCount
      ? await this.refundState(pool, workspaceId, depositId, mode)
      : { availableMicros: 0, frozen: false, refundableCents: 0 };
    return {
      payment,
      mode,
      refundsEnabled: unusedRefundsEnabled(),
      policyVersion: REFUND_POLICY_VERSION,
      ...state,
      availableMicros: Math.max(0, state.availableMicros),
      requests: await this.requests(pool, workspaceId, depositId),
    };
  }

  /**
   * Refunds unused credit from one payment to its card.
   *
   * The amount leaves the balance, in the same transaction that records the
   * request, before Stripe is asked for anything. If Stripe then refuses, the
   * request is marked failed and reconciliation returns the credits. If the
   * answer is lost, the amount stays reserved until `resolveRefund` finds out
   * what Stripe did.
   */
  async requestRefund(
    depositId: string,
    raw: unknown,
    actor: string,
  ): Promise<RefundQuote> {
    const input = refundInput.parse(raw);
    const inputHash = hash({ depositId, input, actor });
    const workspaceId = await this.workspaceOf(depositId);
    const pool = this.database().pool;
    const replay = async () => {
      const previous = await pool.query(
        "SELECT input_hash FROM octolab.wallet_refund_requests WHERE request_key=$1",
        [input.requestKey],
      );
      if (!previous.rows[0]) return undefined;
      if (previous.rows[0].input_hash !== inputHash)
        throw new FundingError(
          409,
          "This request key was already used with different details.",
        );
      return this.refundQuote(depositId);
    };
    const saved = await replay();
    if (saved) return saved;
    if (!unusedRefundsEnabled())
      throw new FundingError(
        409,
        "Refunds of unused credits are not enabled. No refund was started.",
      );
    const verified = await this.inAccount(workspaceId, () =>
      this.stripe.reconcile(depositId),
    );
    await this.settleReported(workspaceId, depositId);
    const requestId = randomUUID();
    const reserve = () =>
      this.owner(workspaceId, async (client) => {
        const { payment, mode } = await this.walletDeposit(
          client,
          workspaceId,
          depositId,
        );
        if (evidence(payment) !== evidence(verified))
          throw new FundingError(
            409,
            "The payment changed while it was being reviewed. Check it again.",
          );
        if (
          !payment.paymentIntentId ||
          payment.disputed ||
          (payment.status !== "credited" &&
            payment.status !== "partially_refunded")
        )
          throw new FundingError(
            409,
            "Only a verified, undisputed payment can be refunded. No refund was started.",
          );
        const active = await client.query(
          "SELECT 1 FROM octolab.wallet_refund_requests WHERE workspace_id=$1 AND deposit_id=$2 AND status IN ('reserved','submitted')",
          [workspaceId, depositId],
        );
        if (active.rowCount)
          throw new FundingError(
            409,
            "A refund for this payment is still in progress. Resolve it before starting another.",
          );
        const { refundableCents } = await this.refundState(
          client,
          workspaceId,
          depositId,
          mode,
        );
        if (input.amount > refundableCents)
          throw new FundingError(
            409,
            `At most $${(refundableCents / 100).toFixed(2)} of this payment is unused and refundable. No refund was started.`,
          );
        const expectedRefundedCents = payment.refundedCents + input.amount;
        const targetMicros =
          (payment.amountCents - expectedRefundedCents) * 10000;
        const journal = await this.journalState(client, workspaceId, depositId);
        const deltaMicros = targetMicros - journal.netMicros;
        if (deltaMicros >= 0 || deltaMicros !== -input.amount * 10000)
          throw new FundingError(
            409,
            "This payment's wallet entries do not match its verified amount. No refund was started.",
          );
        await client.query(
          `INSERT INTO octolab.wallet_refund_requests
         (id,workspace_id,deposit_id,mode,amount_cents,expected_refunded_cents,status,
          policy_version,actor,note,request_key,input_hash)
         VALUES ($1,$2,$3,$4,$5,$6,'reserved',$7,$8,$9,$10,$11)`,
          [
            requestId,
            workspaceId,
            depositId,
            mode,
            input.amount,
            expectedRefundedCents,
            REFUND_POLICY_VERSION,
            actor,
            input.note,
            input.requestKey,
            inputHash,
          ],
        );
        await client.query(
          `INSERT INTO octolab.wallet_journal
         (workspace_id,source_id,revision,kind,reference,target_micros,wallet_micros,mode)
         VALUES ($1,$2,$3,'refund',$4,$5,$6,$7)`,
          [
            workspaceId,
            depositId,
            journal.nextRevision,
            `refund-request:${requestId}`,
            targetMicros,
            deltaMicros,
            mode,
          ],
        );
        payment.netCreditUnits = targetMicros;
        payment.pendingRefundCents = input.amount;
        payment.message =
          "A refund to your card is in progress. Your credits have been adjusted.";
        await this.saveDeposit(client, workspaceId, payment, "refund_reserved");
        await this.record(client, {
          workspaceId,
          depositId,
          mode,
          kind: "refund_request",
          actor,
          requestKey: input.requestKey,
          inputHash,
          data: {
            requestId,
            amountCents: input.amount,
            policyVersion: REFUND_POLICY_VERSION,
            note: input.note,
          },
        });
      });
    try {
      await reserve();
    } catch (error) {
      // A concurrent copy of this request may have committed first, which
      // makes this copy fail on changed evidence or a unique key. Answer it
      // as the replay it is. Otherwise another refund for the payment won.
      const committed = await replay();
      if (committed) return committed;
      if (!uniqueViolation(error)) throw error;
      throw new FundingError(
        409,
        "A refund for this payment is still in progress. Resolve it before starting another.",
      );
    }
    await this.submit(workspaceId, verified, requestId, input.amount);
    return this.refundQuote(depositId);
  }

  /** Asks Stripe for the refund and records what it answered. */
  private async submit(
    workspaceId: string,
    payment: StripeDeposit,
    requestId: string,
    amountCents: number,
  ) {
    const pool = this.database().pool;
    let failed = false;
    try {
      const refund = await this.stripe.refundAtStripe(
        payment,
        requestId,
        amountCents,
      );
      failed = refund.status === "failed" || refund.status === "canceled";
      await pool.query(
        "UPDATE octolab.wallet_refund_requests SET status=$2, stripe_refund_id=$3, updated_at=now() WHERE id=$1 AND status IN ('reserved','submitted')",
        [requestId, failed ? "failed" : "submitted", refund.id],
      );
    } catch (error) {
      // Only an answer from Stripe that the request was refused is a failure.
      // Anything else (timeout, 5xx, a response we could not read) may still
      // have moved money, so the amount stays reserved.
      const refused =
        error instanceof Stripe.errors.StripeInvalidRequestError ||
        error instanceof Stripe.errors.StripeCardError;
      if (!refused)
        throw new FundingError(
          502,
          "Stripe did not confirm the refund. The amount stays reserved. Resolve this refund to find out what Stripe did.",
        );
      failed = true;
      await pool.query(
        "UPDATE octolab.wallet_refund_requests SET status='failed', updated_at=now() WHERE id=$1 AND status='reserved'",
        [requestId],
      );
    }
    // Converges the balance: a failed request no longer reserves anything, so
    // its credits return; a submitted one stays out until Stripe reports it.
    await this.inAccount(workspaceId, () => this.stripe.reconcile(payment.id));
    await this.settleReported(workspaceId, payment.id);
    if (failed)
      throw new FundingError(
        409,
        "Stripe refused this refund. The credits were returned to the balance.",
      );
  }

  /**
   * Settles a refund whose outcome is unknown, by asking Stripe which refunds
   * exist for the payment. Safe to repeat.
   */
  async resolveRefund(requestId: string, actor: string): Promise<RefundQuote> {
    const pool = this.database().pool;
    const row = (
      await pool.query(
        "SELECT * FROM octolab.wallet_refund_requests WHERE id=$1",
        [requestId],
      )
    ).rows[0];
    if (!row) throw new FundingError(404, "Refund request not found.");
    const workspaceId = String(row.workspace_id);
    const request = requestRow(row);
    if (request.status === "reserved" || request.status === "submitted") {
      const payment = await this.inAccount(workspaceId, () =>
        this.stripe.get(request.depositId),
      );
      const ours = (await this.stripe.refundsFor(payment)).find(
        (r) => r.metadata?.octolab_refund_request_id === requestId,
      );
      const ageMs = this.now() - Date.parse(request.createdAt);
      if (!ours && ageMs < 23 * 3600000) {
        // Stripe has no such refund yet and the idempotency key is still
        // valid, so sending the same request again cannot refund twice.
        await this.submit(workspaceId, payment, requestId, request.amountCents);
      } else {
        const status =
          !ours || ours.status === "failed" || ours.status === "canceled"
            ? "failed"
            : "submitted";
        await this.owner(workspaceId, async (client) => {
          const changed = await client.query(
            "UPDATE octolab.wallet_refund_requests SET status=$2, stripe_refund_id=COALESCE($3,stripe_refund_id), updated_at=now() WHERE id=$1 AND status IN ('reserved','submitted') AND status<>$2",
            [requestId, status, ours?.id ?? null],
          );
          if (changed.rowCount)
            await this.record(client, {
              workspaceId,
              depositId: request.depositId,
              mode: row.mode,
              kind: "refund_resolution",
              actor,
              requestKey: randomUUID(),
              inputHash: hash({ requestId, status }),
              data: { requestId, status, stripeRefundId: ours?.id ?? null },
            });
        });
        await this.inAccount(workspaceId, () =>
          this.stripe.reconcile(request.depositId),
        );
        await this.settleReported(workspaceId, request.depositId);
      }
    }
    return this.refundQuote(request.depositId);
  }

  /** Wallet payments across accounts, newest first, for the operator refund screen. */
  async payments(query = "") {
    const q = query.trim().toLowerCase();
    return (
      await this.database().pool.query(
        `SELECT d.body, w.mode, s.name AS account
         FROM octolab.wallet_deposits w
         JOIN octolab.stripe_deposits d ON d.workspace_id=w.workspace_id AND d.id=w.deposit_id
         JOIN octolab.workspaces s ON s.id=w.workspace_id
         WHERE $1='' OR lower(d.id || ' ' || COALESCE(d.payment_intent_id,'') || ' ' ||
                              COALESCE(d.charge_id,'') || ' ' || s.name) LIKE '%' || $1 || '%'
         ORDER BY d.rowid DESC LIMIT 50`,
        [q.replace(/[%_\\]/g, "")],
      )
    ).rows.map((row) => ({
      payment: JSON.parse(row.body) as StripeDeposit,
      mode: row.mode as StripeMode,
      account: String(row.account),
    }));
  }
}
