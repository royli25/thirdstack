import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { z } from "zod";
import { PostgresDatabase } from "./database.js";
import { ShadowWallet } from "./shadow-wallet.js";
import { Wallet, walletEnforcementEnabled } from "./wallet.js";
import { FundingError, type FundingService } from "./funding.js";
import { REFUND_TERMS } from "./refund-policy.js";
import type {
  StripeDeposit,
  StripeFundingStatus,
  StripeMode,
  TopUpBlock,
} from "./funding-types.js";
export type StripeSettings = {
  enabled: boolean;
  secretKey: string;
  webhookSecret: string;
  appUrl: string;
  /** Largest single top-up. Only the live rail sets it. */
  maximumCents?: number;
};
/** Sandbox rail. It only ever accepts test keys and test-mode objects. */
export function stripeSettings(): StripeSettings {
  return {
    enabled: process.env.STRIPE_TEST_ENABLED === "true",
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    appUrl: process.env.PUBLIC_APP_URL || "http://127.0.0.1:5173",
  };
}
/**
 * Real-money rail. It has its own flag, key and webhook secret, and is off
 * unless `STRIPE_LIVE_ENABLED` is exactly "true". It never reads the sandbox
 * variables, so a test key cannot be picked up by mistake.
 */
export function liveStripeSettings(): StripeSettings {
  const cap = Number(process.env.STRIPE_LIVE_MAX_TOPUP_USD || "100");
  return {
    enabled: process.env.STRIPE_LIVE_ENABLED === "true",
    secretKey: process.env.STRIPE_LIVE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_LIVE_WEBHOOK_SECRET || "",
    appUrl: process.env.PUBLIC_APP_URL || "",
    // An unreadable cap falls back to the minimum top-up, never to no cap.
    maximumCents:
      Number.isInteger(cap) && cap >= 5 && cap <= 1000 ? cap * 100 : 500,
  };
}
export type StripeRail = { settings: StripeSettings; gateway: StripeGateway };
/** The deposit's own mode. Receipts saved before live mode existed are sandbox. */
export const stripeModeOf = (value: { mode?: StripeMode }): StripeMode =>
  value.mode === "live" ? "live" : "test";
export function appOrigin(value: string) {
  try {
    const u = new URL(value);
    if (
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.pathname !== "/" ||
      (u.protocol !== "https:" &&
        !(
          u.protocol === "http:" &&
          ["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)
        ))
    )
      return null;
    return u.origin;
  } catch {
    return null;
  }
}
export interface StripeGateway {
  create(
    params: Stripe.Checkout.SessionCreateParams,
    key: string,
  ): Promise<unknown>;
  retrieve(id: string): Promise<unknown>;
  payment(id: string): Promise<unknown>;
  event(payload: Buffer, signature: string, secret: string): Stripe.Event;
  /** Disputes Stripe holds for one payment. */
  disputes(paymentIntentId: string): Promise<unknown[]>;
  /** Refunds Stripe holds for one payment. */
  refunds(paymentIntentId: string): Promise<unknown[]>;
  refund(
    params: { paymentIntentId: string; amountCents: number; requestId: string },
    key: string,
  ): Promise<unknown>;
}
export function stripeGateway(settings: StripeSettings): StripeGateway {
  const client = new Stripe(settings.secretKey || "sk_test_unconfigured", {
    timeout: 15000,
    maxNetworkRetries: 1,
  });
  return {
    create: (params, key) =>
      client.checkout.sessions.create(params, { idempotencyKey: key }),
    retrieve: (id) =>
      client.checkout.sessions.retrieve(id, {
        expand: ["payment_intent.latest_charge"],
      }),
    payment: (id) => client.paymentIntents.retrieve(id),
    event: (payload, signature, secret) =>
      client.webhooks.constructEvent(payload, signature, secret),
    disputes: async (payment_intent) =>
      (await client.disputes.list({ payment_intent, limit: 100 })).data,
    refunds: async (payment_intent) =>
      (await client.refunds.list({ payment_intent, limit: 100 })).data,
    refund: (params, key) =>
      client.refunds.create(
        {
          payment_intent: params.paymentIntentId,
          amount: params.amountCents,
          reason: "requested_by_customer",
          metadata: { octolab_refund_request_id: params.requestId },
        },
        { idempotencyKey: key },
      ),
  };
}
export const stripeDepositInput = z
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
      .pipe(
        z
          .number()
          .int()
          .min(500, "Minimum card deposit is $5.")
          .max(100000, "Maximum card deposit is $1,000."),
      ),
  })
  .strict();
const metadata = z.record(z.string(), z.string()).nullable();
/**
 * Stripe objects are accepted only in the mode of the rail that read them: a
 * live object fails the sandbox schemas and a test object fails the live ones.
 */
function stripeSchemas(mode: StripeMode) {
  const livemode = z.literal(mode === "live");
  return {
    session: z.object({
      id: z.string().startsWith(`cs_${mode}_`),
      livemode,
      mode: z.literal("payment"),
      amount_total: z.number().int(),
      currency: z.string(),
      client_reference_id: z.string().nullable(),
      metadata,
      status: z.enum(["open", "complete", "expired"]),
      payment_status: z.enum(["paid", "unpaid", "no_payment_required"]),
      url: z.string().nullable().optional(),
      payment_intent: z.unknown().optional(),
    }),
    payment: z.object({
      id: z.string().startsWith("pi_"),
      livemode,
      status: z.literal("succeeded"),
      amount: z.number().int(),
      amount_received: z.number().int(),
      currency: z.literal("usd"),
      latest_charge: z.object({
        id: z.string().startsWith("ch_"),
        livemode,
        paid: z.literal(true),
        captured: z.literal(true),
        amount: z.number().int(),
        amount_captured: z.number().int(),
        currency: z.literal("usd"),
        amount_refunded: z.number().int().min(0),
        disputed: z.boolean(),
        receipt_url: z.string().nullable().optional(),
      }),
    }),
    paymentIdentity: z.object({ id: z.string(), livemode, metadata }),
    dispute: z.object({
      id: z.string().startsWith("d"),
      livemode,
      amount: z.number().int().min(0),
      currency: z.literal("usd"),
      status: z.string(),
      payment_intent: z.string(),
    }),
    refund: z.object({
      id: z.string().startsWith("re_"),
      amount: z.number().int().positive(),
      currency: z.literal("usd"),
      status: z.string().nullable(),
      payment_intent: z.string(),
      metadata,
    }),
  };
}
const SCHEMAS = { test: stripeSchemas("test"), live: stripeSchemas("live") };
type Schemas = ReturnType<typeof stripeSchemas>;
export type StripeRefund = z.infer<Schemas["refund"]>;
export type StripeDispute = z.infer<Schemas["dispute"]>;
/** Stripe gave up on this refund; the money did not reach the customer. */
export const refundFailed = (refund: { status: string | null }) =>
  refund.status === "failed" || refund.status === "canceled";
/** Customer-facing wording. Sandbox copy never appears on a real-money receipt. */
const COPY = {
  test: {
    product: "octolab test credits",
    description:
      "Sandbox funding only. Test credits do not pay for live provider calls.",
    ready: "Continue to Stripe to complete the test payment.",
    disputed:
      "This payment is disputed. Its test credits are held for operator review.",
    refunded:
      "Stripe reports a refund. The test-credit balance has been adjusted.",
    credited: "Stripe verified the test payment and added the credits once.",
    wrongMode: "Only Stripe test-mode events are accepted.",
    unconfigured:
      "Stripe test verification is not configured. No credits were added.",
  },
  live: {
    product: "Two Hands service credits",
    description: "Prepaid credits for tool calls made through Two Hands.",
    ready: "Continue to Stripe to complete the payment.",
    disputed:
      "This payment is disputed. Its credits are held and paid tools are paused while it is reviewed.",
    refunded: "Stripe reports a refund. Your credits have been adjusted.",
    credited: "Stripe verified the payment and added the credits once.",
    wrongMode: "Only Stripe live-mode events are accepted on this endpoint.",
    unconfigured:
      "Card payment verification is not configured. No credits were added.",
  },
} as const;
const LIVE_UNAVAILABLE =
  "Card top-ups are not available for this account right now.";
/** A Stripe-hosted receipt link, or null. Anything else is dropped. */
function receiptUrl(value: string | null | undefined) {
  try {
    const url = new URL(value || "");
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      /(^|\.)stripe\.com$/.test(url.hostname)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}
const EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "charge.refunded",
  "charge.dispute.created",
  "charge.dispute.closed",
  "refund.failed",
]);
export interface WebhookIdentity {
  eventId: string;
  depositId: string;
  sessionId: string;
  paymentId: string;
  chargeId: string;
}
export class StripeFundingService {
  accountScopeForWebhook?: (
    identity: WebhookIdentity,
  ) => Promise<string | undefined>;
  readonly active = new Map<string, Promise<StripeDeposit>>();
  readonly creating = new Map<string, Promise<StripeDeposit>>();
  private readonly shadowWallet: ShadowWallet;
  readonly wallet: Wallet;
  private manualChecks = new Map<string, number>();
  /** Deposits whose next verification must read Stripe's individual refunds. */
  private readonly refundChecks = new Set<string>();
  /**
   * Set by the operator tooling. Called with Stripe's refunds for a payment
   * so that an operator refund request whose refund failed is closed.
   */
  refundsObserved?: (
    depositId: string,
    refunds: StripeRefund[],
  ) => Promise<void>;
  private readonly rails: Record<StripeMode, StripeRail>;
  /**
   * `settings` and `gateway` are the sandbox rail, as before live mode
   * existed. The live rail is separate and is built from its own environment
   * variables unless a test injects one.
   */
  constructor(
    public funding: FundingService,
    public settings = stripeSettings(),
    gateway = stripeGateway(settings),
    private now = () => Date.now(),
    live?: StripeRail,
  ) {
    this.shadowWallet = new ShadowWallet(funding.store);
    this.wallet = new Wallet(funding.store);
    const liveSettings = live?.settings ?? liveStripeSettings();
    this.rails = {
      test: { settings, gateway },
      live: live ?? {
        settings: liveSettings,
        gateway: stripeGateway(liveSettings),
      },
    };
  }
  rail(mode: StripeMode) {
    return this.rails[mode];
  }
  /** Why this rail cannot verify payments, or null. Each rail accepts only its own key type. */
  private misconfigured(mode: StripeMode) {
    const { settings } = this.rails[mode];
    if (mode === "test")
      return !/^sk_test_|^rk_test_/.test(settings.secretKey)
        ? "Configure a Stripe test secret key on the server. Live keys are not supported."
        : !settings.webhookSecret.startsWith("whsec_")
          ? "Configure the Stripe webhook signing secret on the server."
          : !appOrigin(settings.appUrl)
            ? "Configure a valid PUBLIC_APP_URL on the server."
            : null;
    return !(this.funding.store.db instanceof PostgresDatabase)
      ? "Card payments need the hosted account wallet."
      : !/^sk_live_|^rk_live_/.test(settings.secretKey)
        ? "Configure a Stripe live secret key on the server. Test keys are not accepted for live payments."
        : !settings.webhookSecret.startsWith("whsec_") ||
            settings.webhookSecret === this.rails.test.settings.webhookSecret
          ? "Configure the live Stripe webhook signing secret on the server. It must differ from the test secret."
          : !appOrigin(settings.appUrl)?.startsWith("https://")
            ? "Configure an HTTPS PUBLIC_APP_URL on the server."
            : null;
  }
  status(mode: StripeMode = "test"): StripeFundingStatus {
    const { settings } = this.rails[mode];
    const reason = !settings.enabled
      ? mode === "test"
        ? "Stripe test deposits are not enabled on this server."
        : "Card payments are not enabled on this server."
      : this.misconfigured(mode);
    return {
      enabled: !reason,
      unavailableReason: reason,
      mode,
      minimumCents: 500,
      maximumCents: settings.maximumCents ?? 100000,
    };
  }
  /**
   * What this account can do on Credits. The account's funding mode picks the
   * rail; the caller never does. A live account that cannot currently spend a
   * top-up is not offered one.
   */
  async accountStatus(): Promise<StripeFundingStatus> {
    const mode = await this.wallet.fundingMode();
    const status = this.status(mode);
    // A live customer is told only that top-ups are unavailable. The reason
    // can be server configuration, which is for operators (`status("live")`).
    if (mode === "live" && !(status.enabled && (await this.liveEligible())))
      return { ...status, enabled: false, unavailableReason: LIVE_UNAVAILABLE };
    // A top-up the account could not spend is not offered.
    const blocked = status.enabled ? await this.topUpBlock() : null;
    if (blocked)
      return {
        ...status,
        enabled: false,
        unavailableReason: blocked.message,
        blocked: blocked.code,
      };
    return status;
  }
  /**
   * Why a new top-up would buy credits this account cannot spend, or null.
   *
   * While wallet enforcement is on, credits pay for paid tools only when an
   * operator has enrolled the account and granted it tool access. Before
   * that, a top-up is refused instead of taking a payment for credits that
   * unlock nothing. With enforcement off, and on local storage, sandbox
   * top-ups are a test of the payment flow and stay open to everyone.
   *
   * The messages name no rate, limit or amount: those are Two Hands' settings.
   */
  async topUpBlock(): Promise<{ code: TopUpBlock; message: string } | null> {
    const { store } = this.funding;
    if (!walletEnforcementEnabled() || !(store.db instanceof PostgresDatabase))
      return null;
    const wallet = await this.wallet.status();
    if (!wallet.enrolled)
      return {
        code: "not_enrolled",
        message:
          "Top-ups open once Two Hands has turned on paid tools for this account. Until then credits could not be spent, so there is nothing to pay.",
      };
    if (!wallet.billingAvailable)
      return {
        code: "billing_unavailable",
        message:
          "Top-ups are paused while Two Hands re-checks this account's pricing. Your credits are kept and nothing is needed from you.",
      };
    const allowance = await store.allowance.status();
    if (allowance.enforced && allowance.state !== "available")
      return allowance.state === "unconfigured"
        ? {
            code: "tool_access_pending",
            message:
              "Top-ups open once Two Hands has turned on paid tools for this account. Until then credits could not be spent, so there is nothing to pay.",
          }
        : allowance.state === "paused"
          ? {
              code: "tool_access_paused",
              message:
                "Two Hands has paused paid tools for this account, so new credits could not be spent right now. Your existing credits are kept.",
            }
          : {
              code: "tool_access_used",
              message:
                "This account has used the paid tool usage Two Hands has approved for it. Top-ups reopen when Two Hands raises it. Your existing credits are kept.",
            };
    return null;
  }
  private liveEligible() {
    return this.wallet.liveTopUpEligible();
  }
  private ensureConfigured(mode: StripeMode) {
    if (this.misconfigured(mode))
      throw new FundingError(409, COPY[mode].unconfigured);
  }
  /**
   * On PostgreSQL the immutable `mode` column is the authority for a deposit's
   * mode; the copy inside the saved receipt is only a convenience for readers.
   */
  private receipt(row: Record<string, unknown>): StripeDeposit {
    const value = JSON.parse(row.body as string) as StripeDeposit;
    value.mode =
      row.mode === "live" || row.mode === "test"
        ? row.mode
        : stripeModeOf(value);
    return value;
  }
  private get columns() {
    return this.funding.store.db instanceof PostgresDatabase
      ? "body,mode"
      : "body";
  }
  async get(id: string): Promise<StripeDeposit> {
    const row = await this.funding.store.db
      .prepare(`SELECT ${this.columns} FROM stripe_deposits WHERE id=?`)
      .get(id);
    if (!row) throw new FundingError(404, "Card deposit not found.");
    return this.receipt(row);
  }
  async list(): Promise<StripeDeposit[]> {
    return (
      await this.funding.store.db
        .prepare(
          `SELECT ${this.columns} FROM stripe_deposits ORDER BY rowid DESC LIMIT 100`,
        )
        .all()
    ).map((row) => this.receipt(row));
  }
  private async save(value: StripeDeposit, event: string) {
    value.updatedAt = new Date(this.now()).toISOString();
    await this.funding.store.db
      .prepare(
        "UPDATE stripe_deposits SET session_id=?,payment_intent_id=?,charge_id=?,body=? WHERE id=?",
      )
      .run(
        value.checkoutSessionId,
        value.paymentIntentId,
        value.chargeId,
        JSON.stringify(value),
        value.id,
      );
    await this.funding.store.db
      .prepare(
        "INSERT INTO stripe_deposit_events(deposit_id,body) VALUES (?,?)",
      )
      .run(
        value.id,
        JSON.stringify({
          event,
          at: value.updatedAt,
          status: value.status,
          sessionId: value.checkoutSessionId,
          paymentIntentId: value.paymentIntentId,
          chargeId: value.chargeId,
          amountCents: value.amountCents,
          refundedCents: value.refundedCents,
          netCreditUnits: value.netCreditUnits,
        }),
      );
    return value;
  }
  async create(raw: unknown): Promise<StripeDeposit> {
    const input = stripeDepositInput.parse(raw);
    const value = await this.funding.store.transaction(async () => {
      const existing = await this.funding.store.db
        .prepare("SELECT id FROM stripe_deposits WHERE request_key=?")
        .get(input.requestKey);
      let value: StripeDeposit;
      if (existing) {
        value = await this.get(existing.id as string);
        if (value.amountCents !== input.amount)
          throw new FundingError(
            409,
            "This request key was already used with a different amount.",
          );
        if (value.checkoutSessionId) return value;
        if (this.now() - Date.parse(value.createdAt) > 23 * 3600000)
          throw new FundingError(
            409,
            "This checkout needs reconciliation before it can be retried. Its original request key will not be reused with new payment details.",
          );
      } else {
        // The account's funding mode decides the rail. A live account is never
        // sent to sandbox checkout, and a sandbox account never to live.
        const mode = await this.wallet.fundingMode();
        const status = this.status(mode);
        if (mode === "live") {
          if (!status.enabled || !(await this.liveEligible()))
            throw new FundingError(
              409,
              `${LIVE_UNAVAILABLE} No payment was started.`,
            );
          if (input.amount > status.maximumCents)
            throw new FundingError(
              400,
              `Maximum card top-up is $${status.maximumCents / 100}.`,
            );
        } else if (!status.enabled)
          throw new FundingError(409, status.unavailableReason!);
        // Checked on the server too: the page hiding the button is not a control.
        const blocked = await this.topUpBlock();
        if (blocked)
          throw new FundingError(
            409,
            `${blocked.message} No payment was started.`,
          );
        const at = new Date(this.now()).toISOString();
        value = {
          id: randomUUID(),
          mode,
          requestKey: input.requestKey,
          amountCents: input.amount,
          status: "creating",
          checkoutSessionId: null,
          checkoutUrl: null,
          paymentIntentId: null,
          chargeId: null,
          refundedCents: 0,
          disputed: false,
          netCreditUnits: 0,
          createdAt: at,
          updatedAt: at,
          lastCheckedAt: null,
          message: "Preparing Stripe Checkout.",
        };
        {
          if (
            Number(
              (await this.funding.store.db
                .prepare("SELECT COUNT(*) AS n FROM stripe_deposits")
                .get())!.n,
            ) >= 1000
          )
            throw new FundingError(
              409,
              "Your account has reached its card deposit limit.",
            );
          await this.funding.store.db
            .prepare(
              mode === "live"
                ? "INSERT INTO stripe_deposits(id,request_key,body,mode) VALUES (?,?,?,'live')"
                : "INSERT INTO stripe_deposits VALUES (?,?,NULL,NULL,NULL,?)",
            )
            .run(value.id, input.requestKey, JSON.stringify(value));
          await this.save(value, "checkout_requested");
          if (mode === "live") {
            // Real money has one ledger: the live wallet. It never reaches the
            // test-credit ledger or the shadow wallet.
            await this.wallet.enrollDeposit(value.id, "live");
          } else {
            await this.shadowWallet.enrollSandboxDeposit(value.id);
            await this.wallet.enrollDeposit(value.id);
          }
        }
      }
      const status = this.status(stripeModeOf(value));
      if (!status.enabled)
        throw new FundingError(
          409,
          stripeModeOf(value) === "live"
            ? `${LIVE_UNAVAILABLE} No payment was started.`
            : status.unavailableReason!,
        );
      return value;
    });
    if (value.checkoutSessionId) return value;
    const pending = this.creating.get(value.id);
    if (pending) return pending;
    const promise = this.createCheckout(value);
    this.creating.set(value.id, promise);
    try {
      return await promise;
    } finally {
      this.creating.delete(value.id);
    }
  }
  private async createCheckout(value: StripeDeposit): Promise<StripeDeposit> {
    const mode = stripeModeOf(value);
    const { settings, gateway } = this.rails[mode];
    try {
      const origin = appOrigin(settings.appUrl)!;
      const raw = await gateway.create(
        {
          mode: "payment",
          allowed_payment_method_types: ["card"],
          client_reference_id: value.id,
          metadata: { octolab_deposit_id: value.id },
          payment_intent_data: { metadata: { octolab_deposit_id: value.id } },
          success_url: `${origin}/?stripe_deposit=${value.id}#dashboard/credits`,
          cancel_url: `${origin}/?stripe_deposit=${value.id}&stripe_cancelled=1#dashboard/credits`,
          expires_at:
            Math.floor(Date.parse(value.createdAt) / 1000) + 24 * 3600,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: value.amountCents,
                product_data: {
                  name: COPY[mode].product,
                  description: COPY[mode].description,
                },
              },
            },
          ],
        },
        `octolab-deposit-${value.id}`,
      );
      const session = this.validSession(raw, value);
      if (!session.url) throw new Error("Missing checkout URL");
      const url = new URL(session.url);
      if (
        url.protocol !== "https:" ||
        url.hostname !== "checkout.stripe.com" ||
        url.username ||
        url.password
      )
        throw new Error("Invalid checkout URL");
      return await this.funding.store.transaction(async () => {
        const current = await this.get(value.id);
        if (
          current.checkoutSessionId &&
          current.checkoutSessionId !== session.id
        )
          throw new FundingError(409, "Conflicting Stripe checkout receipt.");
        if (current.status !== "creating" && current.status !== "failed")
          return current;
        current.checkoutSessionId = session.id;
        current.checkoutUrl = session.url!;
        current.status = "checkout_ready";
        current.message = COPY[mode].ready;
        return await this.save(current, "checkout_created");
      });
    } catch (error) {
      const current = await this.get(value.id);
      if (!current.checkoutSessionId)
        await this.funding.store.transaction(async () => {
          current.status = "failed";
          current.message =
            "Checkout could not be prepared. Retry the same deposit request to recover its original checkout.";
          await this.save(current, "checkout_create_failed");
        });
      if (error instanceof FundingError) throw error;
      throw new FundingError(
        502,
        "Stripe Checkout could not be prepared. Retry this request; no credits were added.",
      );
    }
  }
  private validSession(raw: unknown, value: StripeDeposit) {
    const session = SCHEMAS[stripeModeOf(value)].session.parse(raw);
    if (
      session.amount_total !== value.amountCents ||
      session.currency !== "usd" ||
      session.client_reference_id !== value.id ||
      session.metadata?.octolab_deposit_id !== value.id ||
      (value.checkoutSessionId && session.id !== value.checkoutSessionId)
    )
      throw new FundingError(
        502,
        "Stripe returned payment details that do not match this deposit. No credits were added.",
      );
    return session;
  }
  async reconcile(id: string, manual = false): Promise<StripeDeposit> {
    this.ensureConfigured(stripeModeOf(await this.get(id)));
    const existing = this.active.get(id);
    if (existing) return existing;
    if (manual) {
      const last = this.manualChecks.get(id);
      if (last !== undefined && this.now() - last < 10000)
        throw new FundingError(
          429,
          "Wait 10 seconds before checking this payment again.",
        );
      this.manualChecks.set(id, this.now());
    }
    const promise = this.reconcilePayment(id);
    this.active.set(id, promise);
    try {
      return await promise;
    } finally {
      this.active.delete(id);
    }
  }
  private async reconcilePayment(id: string): Promise<StripeDeposit> {
    const value = await this.get(id);
    if (!value.checkoutSessionId)
      throw new FundingError(
        409,
        "Retry this deposit request to recover its Stripe checkout first.",
      );
    const mode = stripeModeOf(value);
    const refundCheck = this.refundChecks.delete(id);
    try {
      const session = this.validSession(
        await this.rails[mode].gateway.retrieve(value.checkoutSessionId),
        value,
      );
      // Read Stripe's individual refunds and disputes, outside the
      // transaction, only when the totals alone cannot settle the payment.
      let refunds: StripeRefund[] | undefined;
      let disputes: StripeDispute[] | undefined;
      const seen = SCHEMAS[mode].payment.safeParse(session.payment_intent);
      if (
        seen.success &&
        session.payment_status === "paid" &&
        session.status === "complete"
      ) {
        const verified = { ...value, paymentIntentId: seen.data.id };
        if (
          refundCheck ||
          value.pendingRefundCents ||
          seen.data.latest_charge.amount_refunded < value.refundedCents
        ) {
          refunds = await this.refundsFor(verified);
          // An operator refund that failed at Stripe stops reserving credits.
          await this.refundsObserved?.(id, refunds);
        }
        if (value.disputeResolution?.disputeIds)
          disputes = await this.disputesFor(verified);
      }
      return await this.funding.store.transaction(async () => {
        const current = await this.get(id);
        current.lastCheckedAt = new Date(this.now()).toISOString();
        if (
          session.payment_status !== "paid" ||
          session.status !== "complete"
        ) {
          if (current.netCreditUnits || current.paymentIntentId)
            throw new FundingError(
              502,
              "Stripe returned an inconsistent payment state. The saved receipt was retained.",
            );
          current.status =
            session.status === "expired"
              ? "expired"
              : session.status === "complete"
                ? "processing"
                : "checkout_ready";
          current.message =
            current.status === "expired"
              ? "This checkout expired without a verified payment."
              : "Payment has not been confirmed by Stripe yet.";
          return await this.save(current, "payment_pending");
        }
        const payment = SCHEMAS[mode].payment.parse(session.payment_intent);
        const charge = payment.latest_charge;
        if (
          payment.amount !== current.amountCents ||
          payment.amount_received !== current.amountCents ||
          charge.amount !== current.amountCents ||
          charge.amount_captured !== current.amountCents ||
          charge.amount_refunded > current.amountCents ||
          (current.paymentIntentId && current.paymentIntentId !== payment.id) ||
          (current.chargeId && current.chargeId !== charge.id)
        )
          throw new FundingError(
            502,
            "Stripe payment amount or identity does not match this deposit. No credits were added.",
          );
        // First time this payment is seen as paid; earlier credits are never backfilled.
        const firstVerification =
          !current.paymentIntentId && !current.netCreditUnits;
        current.paymentIntentId = payment.id;
        current.chargeId = charge.id;
        // A refund total never drops because of an older read. It drops only
        // when Stripe's own list shows a failed or canceled refund and the
        // refunds still standing add up to the charge's refunded total.
        if (charge.amount_refunded < current.refundedCents) {
          const failed = (refunds ?? []).filter(refundFailed);
          const standing = (refunds ?? [])
            .filter((r) => !refundFailed(r))
            .reduce((sum, r) => sum + r.amount, 0);
          if (failed.length && standing === charge.amount_refunded) {
            current.refundedCents = charge.amount_refunded;
            current.failedRefundIds = [
              ...new Set([
                ...(current.failedRefundIds ?? []),
                ...failed.map((r) => r.id),
              ]),
            ];
          } else
            await this.wallet.alert(mode, "refund_total_unverified", id, {
              savedRefundedCents: current.refundedCents,
              stripeRefundedCents: charge.amount_refunded,
              standingRefundCents: refunds ? standing : null,
            });
        } else current.refundedCents = charge.amount_refunded;
        current.disputed ||= charge.disputed;
        // A dispute Stripe opened after the last release starts a new cycle:
        // the payment is held again until an operator releases it again.
        const known = current.disputeResolution?.disputeIds;
        if (known && disputes?.some((d) => !known.includes(d.id))) {
          current.disputeCycle = (current.disputeCycle ?? 1) + 1;
          delete current.disputeResolution;
        }
        const released = !!current.disputeResolution;
        current.receiptUrl =
          receiptUrl(charge.receipt_url) ?? current.receiptUrl ?? null;
        // An operator refund in flight is already out of the balance; count it
        // until Stripe's own total catches up, so a check or a replayed event
        // in between cannot hand the credits back.
        const reserved = Math.min(
          current.amountCents,
          Math.max(
            current.refundedCents,
            await this.wallet.pendingRefundedCents(id),
          ),
        );
        current.pendingRefundCents = reserved - current.refundedCents;
        // The test-credit ledger and the shadow wallet keep a dispute hold
        // for good. The wallet follows the release: what Stripe did not take
        // back (refunds and lost disputes) is the payment's credit again.
        const target = current.disputed
          ? 0
          : (current.amountCents - reserved) * 10000;
        const walletTarget = released
          ? Math.max(
              0,
              current.amountCents -
                reserved -
                (current.disputeResolution!.lostCents ?? 0),
            ) * 10000
          : target;
        const dispute = { cycle: current.disputeCycle ?? 1, released };
        if (mode === "live") {
          if (
            !(await this.wallet.reconcileDeposit(
              id,
              payment.id,
              walletTarget,
              current.disputed,
              false,
              "live",
              dispute,
            ))
          )
            throw new FundingError(
              500,
              "This payment is not attached to an account wallet. Nothing was credited; an operator must review it.",
            );
        } else {
          const old = await this.funding.ledger.net("stripe", id);
          await this.funding.ledger.settle(
            "stripe",
            id,
            target,
            payment.id,
            current.disputed
              ? "dispute_hold"
              : target < old
                ? "refund"
                : "deposit",
            current.lastCheckedAt!,
          );
          await this.shadowWallet.reconcileSandboxDeposit(
            id,
            payment.id,
            target,
            current.disputed,
          );
          await this.wallet.reconcileDeposit(
            id,
            payment.id,
            walletTarget,
            current.disputed,
            firstVerification,
            "test",
            dispute,
          );
        }
        current.netCreditUnits = walletTarget;
        current.checkoutUrl = null;
        current.status =
          current.disputed && !released
            ? "disputed"
            : current.refundedCents === current.amountCents
              ? "refunded"
              : current.refundedCents
                ? "partially_refunded"
                : "credited";
        current.message = current.disputeResolution
          ? current.disputeResolution.restoredMicros
            ? "The dispute on this payment was closed and its remaining credits were restored."
            : "The dispute on this payment was closed. Its credits were not restored."
          : current.disputed
            ? COPY[mode].disputed
            : current.pendingRefundCents
              ? "A refund to your card is in progress. Your credits have been adjusted."
              : current.refundedCents
                ? COPY[mode].refunded
                : COPY[mode].credited;
        return await this.save(current, "payment_reconciled");
      });
    } catch (error) {
      if (error instanceof FundingError) throw error;
      throw new FundingError(
        502,
        "Could not verify this Stripe payment. The saved balance was retained. Try again later.",
      );
    }
  }
  /**
   * `mode` comes from the endpoint the event was delivered to, never from the
   * payload. Each endpoint verifies with its own signing secret and then
   * refuses an event whose `livemode` does not match.
   */
  async webhook(payload: Buffer, signature: string, mode: StripeMode = "test") {
    this.ensureConfigured(mode);
    const { settings, gateway } = this.rails[mode];
    let event: Stripe.Event;
    try {
      event = gateway.event(payload, signature, settings.webhookSecret);
    } catch {
      throw new FundingError(400, "Invalid Stripe webhook signature.");
    }
    if (event.livemode !== (mode === "live") || !event.id.startsWith("evt_"))
      throw new FundingError(400, COPY[mode].wrongMode);
    if (this.accountScopeForWebhook) {
      if (!EVENTS.has(event.type)) return { received: true, ignored: true };
      const object = event.data.object as unknown as Record<string, unknown>;
      const identity: WebhookIdentity = {
        eventId: event.id,
        depositId: String(
          (object.metadata as Record<string, string> | undefined)
            ?.octolab_deposit_id || "",
        ),
        sessionId:
          typeof object.id === "string" && object.id.startsWith(`cs_${mode}_`)
            ? object.id
            : "",
        paymentId:
          typeof object.payment_intent === "string"
            ? object.payment_intent
            : "",
        chargeId:
          typeof object.charge === "string"
            ? object.charge
            : typeof object.id === "string" && object.id.startsWith("ch_")
              ? object.id
              : "",
      };
      let workspace = await this.accountScopeForWebhook(identity);
      if (
        !workspace &&
        /^(charge|refund)\./.test(event.type) &&
        /^pi_/.test(identity.paymentId)
      ) {
        const payment = SCHEMAS[mode].paymentIdentity.parse(
          await gateway.payment(identity.paymentId),
        );
        if (payment.id !== identity.paymentId)
          throw new FundingError(
            502,
            "Stripe returned a different payment identity.",
          );
        identity.depositId = payment.metadata?.octolab_deposit_id || "";
        workspace = await this.accountScopeForWebhook(identity);
      }
      if (!workspace) return this.unmatched(event, mode);
      return this.funding.store.scope.run(workspace, () =>
        this.webhookEvent(event, mode),
      );
    }
    return this.webhookEvent(event, mode);
  }
  /**
   * A signed payment event that belongs to no saved deposit. In live mode
   * that is real money this server cannot place, so it leaves a durable
   * operator alert before the event is acknowledged.
   */
  private async unmatched(event: Stripe.Event, mode: StripeMode) {
    if (mode === "live") {
      console.error(
        `Stripe live event ${event.id} (${event.type}) matched no account. An operator must review it.`,
      );
      const { db } = this.funding.store;
      if (db instanceof PostgresDatabase)
        await db.pool.query(
          `INSERT INTO octolab.wallet_operator_alerts(workspace_id,mode,kind,reference,detail)
           VALUES (NULL,'live','unmatched_live_event',$1,$2) ON CONFLICT DO NOTHING`,
          [event.id, JSON.stringify({ type: event.type })],
        );
    }
    return { received: true, ignored: true };
  }
  private async webhookEvent(event: Stripe.Event, mode: StripeMode) {
    const { gateway } = this.rails[mode];
    if (
      await this.funding.store.db
        .prepare("SELECT id FROM stripe_webhook_receipts WHERE id=?")
        .get(event.id)
    )
      return { received: true, replayed: true };
    if (!EVENTS.has(event.type)) return { received: true, ignored: true };
    const object = event.data.object as unknown as Record<string, unknown>;
    const meta = object.metadata as Record<string, string> | undefined;
    let id = meta?.octolab_deposit_id;
    let row = id
      ? await this.funding.store.db
          .prepare("SELECT id FROM stripe_deposits WHERE id=?")
          .get(id)
      : undefined;
    if (!row) {
      const sessionId =
        typeof object.id === "string" && object.id.startsWith(`cs_${mode}_`)
          ? object.id
          : "";
      const paymentId =
        typeof object.payment_intent === "string" ? object.payment_intent : "";
      const chargeId =
        typeof object.charge === "string"
          ? object.charge
          : typeof object.id === "string" && object.id.startsWith("ch_")
            ? object.id
            : "";
      row = await this.funding.store.db
        .prepare(
          "SELECT id FROM stripe_deposits WHERE session_id=? OR payment_intent_id=? OR charge_id=?",
        )
        .get(sessionId, paymentId, chargeId);
      // Charge/refund/dispute events can arrive before checkout completion.
      // Resolve our own PaymentIntent metadata, then still verify the saved
      // Checkout Session before changing any credits or acknowledging the event.
      if (
        !row &&
        /^(charge|refund)\./.test(event.type) &&
        /^pi_/.test(paymentId)
      ) {
        const payment = SCHEMAS[mode].paymentIdentity.parse(
          await gateway.payment(paymentId),
        );
        if (payment.id !== paymentId)
          throw new FundingError(
            502,
            "Stripe returned a different payment identity.",
          );
        const depositId = payment.metadata?.octolab_deposit_id;
        if (depositId)
          row = await this.funding.store.db
            .prepare("SELECT id FROM stripe_deposits WHERE id=?")
            .get(depositId);
      }
    }
    if (!row) return this.unmatched(event, mode);
    id = String(row.id);
    // A signed event may only ever touch a deposit created in its own mode.
    if (stripeModeOf(await this.get(id)) !== mode) {
      console.error(
        `Stripe ${mode}-mode event ${event.id} referenced a deposit of the other mode and was ignored.`,
      );
      return { received: true, ignored: true };
    }
    // The next verification reads the payment's refunds one by one, so the
    // failed refund's credits are restored (or an alert is left if not).
    if (event.type === "refund.failed") this.refundChecks.add(id);
    // Checkout can finish before the create response is saved. Recover only its own signed session identity.
    if (
      !(await this.get(id)).checkoutSessionId &&
      event.type.startsWith("checkout.session.")
    ) {
      const session = this.validSession(object, await this.get(id));
      await this.funding.store.transaction(async () => {
        const current = await this.get(id!);
        current.checkoutSessionId = session.id;
        await this.save(current, "checkout_recovered_from_webhook");
      });
    }
    // A read already in flight may predate this event (for example, a refund).
    // Wait for it, then initiate/join a read that starts after this event arrived.
    // Never acknowledge a new event solely on an older in-flight snapshot.
    const earlierRead = this.active.get(id);
    if (earlierRead) {
      try {
        await earlierRead;
      } catch {
        // This delivery still gets its own verification attempt below.
      }
    }
    await this.reconcile(id);
    await this.funding.store.transaction(
      async () =>
        await this.funding.store.db
          .prepare(
            "INSERT OR IGNORE INTO stripe_webhook_receipts VALUES (?,?,?,?)",
          )
          .run(event.id, event.type, id, new Date(this.now()).toISOString()),
    );
    return { received: true, replayed: false };
  }
  walletStatus() {
    return this.wallet.status();
  }
  walletActivity(options: Parameters<Wallet["activity"]>[0]) {
    return this.wallet.activity(options);
  }
  walletStatement(from: string, to: string) {
    return this.wallet.statement(from, to);
  }
  async summary() {
    return {
      stripe: await this.accountStatus(),
      stripeIntents: await this.list(),
      entries: await this.funding.ledger.entries(),
      wallet: await this.wallet.status(),
      walletEntries: await this.wallet.entries(),
      refundTerms: REFUND_TERMS,
    };
  }
  /** Stripe's disputes for one saved payment, validated in the payment's mode. */
  async disputesFor(value: StripeDeposit) {
    const mode = stripeModeOf(value);
    this.ensureConfigured(mode);
    return (await this.rails[mode].gateway.disputes(value.paymentIntentId!))
      .map((raw) => SCHEMAS[mode].dispute.parse(raw))
      .filter((d) => d.payment_intent === value.paymentIntentId);
  }
  /** Stripe's refunds for one saved payment. */
  async refundsFor(value: StripeDeposit) {
    const mode = stripeModeOf(value);
    this.ensureConfigured(mode);
    return (await this.rails[mode].gateway.refunds(value.paymentIntentId!))
      .map((raw) => SCHEMAS[mode].refund.parse(raw))
      .filter((r) => r.payment_intent === value.paymentIntentId);
  }
  /** Sends one operator refund to Stripe. The same request always uses the same idempotency key. */
  async refundAtStripe(
    value: StripeDeposit,
    requestId: string,
    amountCents: number,
  ) {
    const mode = stripeModeOf(value);
    this.ensureConfigured(mode);
    const refund = SCHEMAS[mode].refund.parse(
      await this.rails[mode].gateway.refund(
        { paymentIntentId: value.paymentIntentId!, amountCents, requestId },
        `octolab-refund-${requestId}`,
      ),
    );
    if (
      refund.payment_intent !== value.paymentIntentId ||
      refund.amount !== amountCents
    )
      throw new FundingError(
        502,
        "Stripe returned a refund that does not match this request.",
      );
    return refund;
  }
}
