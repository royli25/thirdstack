import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../server/app";
import {
  beginBackupSnapshot,
  databaseSnapshot,
} from "../server/backup-evidence";
import { config } from "../server/config";
import { PostgresDatabase } from "../server/database";
import { FundingService } from "../server/funding";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import {
  REFUND_POLICY_VERSION,
  refundableByPayment,
  unusedRefundsEnabled,
} from "../server/refund-policy";
import { Store } from "../server/store";
import {
  StripeFundingService,
  liveStripeSettings,
} from "../server/stripe-funding";
import { Wallet, walletCredentialDigest } from "../server/wallet";
import { WalletOperations } from "../server/wallet-operations";
import { grantFixtureAllowance } from "./fixtures/allowance";
import {
  FixtureStripeGateway,
  fixtureLiveStripeSettings,
  fixtureStripeSettings,
} from "./fixtures/stripe";

const noChain = {
  enabled: false,
  recipient: "",
  rpcUrl: "https://fixture.invalid",
};

describe("live mode configuration", () => {
  afterEach(() => vi.unstubAllEnvs());
  const service = (live: Partial<typeof fixtureLiveStripeSettings> = {}) => {
    const store = new Store(":memory:");
    return {
      store,
      stripe: new StripeFundingService(
        new FundingService(store, noChain),
        { ...fixtureStripeSettings },
        new FixtureStripeGateway(),
        undefined,
        {
          settings: { ...fixtureLiveStripeSettings, ...live },
          gateway: new FixtureStripeGateway("live"),
        },
      ),
    };
  };

  it("is off unless STRIPE_LIVE_ENABLED is exactly true and never reads the sandbox variables", () => {
    vi.stubEnv("STRIPE_TEST_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fixture_only");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_fixture_only");
    for (const value of ["", "1", "TRUE", "yes"]) {
      vi.stubEnv("STRIPE_LIVE_ENABLED", value);
      expect(liveStripeSettings().enabled).toBe(false);
    }
    vi.stubEnv("STRIPE_LIVE_ENABLED", "true");
    expect(liveStripeSettings()).toMatchObject({
      enabled: true,
      secretKey: "",
      webhookSecret: "",
      maximumCents: 10000,
    });
    vi.stubEnv("STRIPE_LIVE_MAX_TOPUP_USD", "25");
    expect(liveStripeSettings().maximumCents).toBe(2500);
    // An unreadable cap falls back to the minimum, never to no cap.
    for (const bad of ["0", "abc", "1001", "12.5"]) {
      vi.stubEnv("STRIPE_LIVE_MAX_TOPUP_USD", bad);
      expect(liveStripeSettings().maximumCents).toBe(500);
    }
  });

  it("refuses the live rail on SQLite, with a test key, a shared webhook secret or a non-HTTPS origin", async () => {
    const sqlite = service();
    expect(sqlite.stripe.status("live")).toMatchObject({
      enabled: false,
      mode: "live",
      unavailableReason: expect.stringMatching(/hosted account wallet/),
    });
    // The sandbox rail is unaffected and still refuses live keys.
    expect(sqlite.stripe.status()).toMatchObject({
      enabled: true,
      mode: "test",
    });
    sqlite.stripe.settings.secretKey = "sk_live_fixture_only";
    expect(sqlite.stripe.status().unavailableReason).toMatch(/test secret key/);
    const event = new FixtureStripeGateway("live").signed(
      "charge.refunded",
      {},
    );
    await expect(
      sqlite.stripe.webhook(event.payload, event.signature, "live"),
    ).rejects.toThrow(/not configured/);
    await sqlite.store.close();

    // The remaining checks do not depend on the storage backend's contents.
    const off = service({ enabled: false });
    expect(off.stripe.status("live").unavailableReason).toMatch(/not enabled/);
    await off.store.close();
  });
});

it("attributes unused credit to the newest payments first and refunds nothing while frozen", () => {
  const payments = [
    {
      id: "old",
      createdAt: "2026-01-01T00:00:00.000Z",
      remainingCents: 500,
      disputed: false,
    },
    {
      id: "new",
      createdAt: "2026-02-01T00:00:00.000Z",
      remainingCents: 500,
      disputed: false,
    },
    {
      id: "disputed",
      createdAt: "2026-03-01T00:00:00.000Z",
      remainingCents: 500,
      disputed: true,
    },
  ];
  // $7.4999 available: $5 from the newest payment, $2.49 from the older one.
  const map = refundableByPayment({
    availableMicros: 7_499_900,
    frozen: false,
    payments,
  });
  expect(Object.fromEntries(map)).toEqual({ disputed: 0, new: 500, old: 249 });
  expect([
    ...refundableByPayment({
      availableMicros: 7_499_900,
      frozen: true,
      payments,
    }).values(),
  ]).toEqual([0, 0, 0]);
  expect([
    ...refundableByPayment({
      availableMicros: -5,
      frozen: false,
      payments,
    }).values(),
  ]).toEqual([0, 0, 0]);
  vi.stubEnv("TWO_HANDS_UNUSED_REFUNDS", "1");
  expect(unusedRefundsEnabled()).toBe(false);
  vi.unstubAllEnvs();
  expect(unusedRefundsEnabled()).toBe(false);
});

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const hosted = url ? describe : describe.skip;
const fixtureKey = "isolated-live-wallet-tavily";
const providerAccount = "fixture-tavily-account";
const intent = {
  title: "Live wallet fixture",
  objective: "Test live prepaid credits against a fake provider transport",
  criteria: [{ text: "Capture request", weight: 1 }],
};
const result = {
  sources: [],
  httpStatus: 200,
  requestId: "fixture-provider-receipt",
  usage: { source: "fixture", credits: 1 },
};

// Each case walks a whole payment lifecycle against PostgreSQL, including a
// full backup-evidence snapshot, so it gets more room than a unit test.
hosted("Stripe live mode into the prepaid wallet", { timeout: 30_000 }, () => {
  let store: Store;
  let db: PostgresDatabase;
  let obs: Observatory;
  let workspace: string;
  let keyId: string;
  let test: FixtureStripeGateway;
  let live: FixtureStripeGateway;
  let stripe: StripeFundingService;
  let funding: FundingService;
  let ops: WalletOperations;
  let clock: number;
  const original = { ...config.keys };
  const originalAdmin = { token: config.token, adminToken: config.adminToken };

  async function setRate(mode: "test" | "live", expired = false) {
    await db.pool.query(
      `INSERT INTO octolab.wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at,funding_mode)
       VALUES ($1,'fixture-7000',$2,$3,7000,now()-interval '2 hours',now()+$4::interval,$5)
       ON CONFLICT (workspace_id) DO UPDATE
         SET expires_at=EXCLUDED.expires_at, funding_mode=EXCLUDED.funding_mode`,
      [
        workspace,
        providerAccount,
        walletCredentialDigest(fixtureKey),
        expired ? "-1 hour" : "1 hour",
        mode,
      ],
    );
  }
  const status = () => store.db.read(() => new Wallet(store).status());
  const balances = async () =>
    Object.fromEntries(
      (
        await db.pool.query(
          "SELECT mode,posted_micros FROM octolab.wallet_balances WHERE workspace_id=$1",
          [workspace],
        )
      ).rows.map((r) => [r.mode, Number(r.posted_micros)]),
    );
  const journal = async (depositId: string) =>
    (
      await db.pool.query(
        "SELECT kind,mode,wallet_micros::int AS micros FROM octolab.wallet_journal WHERE workspace_id=$1 AND deposit_id=$2 ORDER BY revision",
        [workspace, depositId],
      )
    ).rows;
  const count = async (table: string) =>
    Number(
      (
        await db.pool.query(
          `SELECT count(*) AS n FROM octolab.${table} WHERE workspace_id=$1`,
          [workspace],
        )
      ).rows[0].n,
    );
  async function walletValid() {
    const client = await db.pool.connect();
    try {
      await beginBackupSnapshot(client);
      return (await databaseSnapshot(client)).walletValid;
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  }
  function asKey<T>(action: () => Promise<T>) {
    return store.actorScope.run({ kind: "api_key", id: keyId }, action);
  }
  async function paidCall() {
    const session = (await asKey(() => obs.createAgentSession(intent, keyId)))
      .id;
    return asKey(() =>
      obs.execute(
        session,
        {
          tool: "tavily_search",
          query: "isolated fixture",
          statedReason: "Test live prepaid admission",
          requestKey: randomUUID(),
        },
        keyId,
      ),
    );
  }
  const deliver = (
    gateway: FixtureStripeGateway,
    type: string,
    object: unknown,
    id?: string,
  ) => {
    const event = gateway.signed(type, object, id);
    return stripe.webhook(event.payload, event.signature, gateway.mode);
  };
  /** A verified live top-up. */
  async function topUp(amount = "5") {
    const payment = await stripe.create({ requestKey: randomUUID(), amount });
    await deliver(
      live,
      "checkout.session.completed",
      live.pay(payment.checkoutSessionId!),
    );
    return stripe.get(payment.id);
  }
  const charge = (
    gateway: FixtureStripeGateway,
    sessionId: string,
    refundedCents = 0,
    disputed = false,
  ) =>
    gateway.pay(sessionId, refundedCents, disputed).payment_intent
      .latest_charge;

  beforeEach(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw new Error("Disposable loopback database required.");
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "false");
    vi.stubEnv("TWO_HANDS_UNUSED_REFUNDS", "true");
    vi.stubEnv("TAVILY_ACCOUNT_REFERENCE", providerAccount);
    config.keys.tavily = fixtureKey;
    workspace = randomUUID();
    store = new Store(":unused:", url!, workspace);
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated live wallet fixture')",
      [workspace],
    );
    await setRate("live");
    await grantFixtureAllowance(store);
    obs = new Observatory(store, {
      search: vi.fn(async () => result),
      scrape: async () => {
        throw new Error("Unexpected extract transport");
      },
    });
    await obs.ready;
    keyId = (
      await obs.db.apiKeys.create({
        name: "Fixture key",
        requestKey: randomUUID(),
        scopes: ["tools:discover", "tools:execute", "research:write"],
        allowedTools: ["tavily_search"],
        limitUsd: "1",
      })
    ).key.id;
    test = new FixtureStripeGateway();
    live = new FixtureStripeGateway("live");
    funding = new FundingService(store, noChain);
    clock = Date.now();
    stripe = new StripeFundingService(
      funding,
      { ...fixtureStripeSettings },
      test,
      () => clock,
      { settings: { ...fixtureLiveStripeSettings }, gateway: live },
    );
    ops = new WalletOperations(stripe, () => clock);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    Object.assign(config.keys, original);
    Object.assign(config, originalAdmin);
    if (store) await store.close();
  });

  it("lets the account's funding mode pick the rail and never falls back to the other one", async () => {
    expect(stripe.status("live")).toMatchObject({
      enabled: true,
      mode: "live",
      minimumCents: 500,
      maximumCents: 10000,
    });
    const real = await stripe.create({ requestKey: randomUUID(), amount: "5" });
    expect(real).toMatchObject({ mode: "live", status: "checkout_ready" });
    expect(real.checkoutSessionId).toMatch(/^cs_live_/);
    expect(live.creates).toHaveLength(1);
    expect(test.creates).toHaveLength(0);
    // Real-money wording only: nothing on the Checkout page says sandbox or test.
    const item =
      live.creates[0].params.line_items![0].price_data!.product_data!;
    expect(item.name).toBe("Two Hands service credits");
    expect(JSON.stringify(live.creates[0].params)).not.toMatch(/sandbox|test/i);
    expect(
      (
        await db.pool.query(
          "SELECT mode FROM octolab.stripe_deposits WHERE id=$1",
          [real.id],
        )
      ).rows[0].mode,
    ).toBe("live");

    // Over the pilot cap, enforcement paused, or a lapsed rate: no checkout.
    await expect(
      stripe.create({ requestKey: randomUUID(), amount: "100.01" }),
    ).rejects.toMatchObject({ status: 400 });
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    await expect(
      stripe.create({ requestKey: randomUUID(), amount: "5" }),
    ).rejects.toThrow(/not available for this account/);
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
    await setRate("live", true);
    await expect(
      stripe.create({ requestKey: randomUUID(), amount: "5" }),
    ).rejects.toThrow(/not available for this account/);
    expect((await stripe.accountStatus()).enabled).toBe(false);
    await setRate("live");

    // Live switched off: a live account is refused, not sent to sandbox checkout.
    stripe.rail("live").settings.enabled = false;
    await expect(
      stripe.create({ requestKey: randomUUID(), amount: "5" }),
    ).rejects.toThrow(/not available for this account/);
    expect(test.creates).toHaveLength(0);
    stripe.rail("live").settings.enabled = true;

    // A sandbox account only ever gets sandbox checkout, even with live on.
    await setRate("test");
    const sandbox = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    expect(sandbox.mode).toBe("test");
    expect(sandbox.checkoutSessionId).toMatch(/^cs_test_/);
    expect(live.creates).toHaveLength(1);
  });

  it("credits a live payment to the live wallet only, once, and keeps sandbox money apart", async () => {
    // Sandbox history first, as on the pilot account.
    await setRate("test");
    const sandbox = await stripe.create({
      requestKey: randomUUID(),
      amount: "7",
    });
    await deliver(
      test,
      "checkout.session.completed",
      test.pay(sandbox.checkoutSessionId!),
    );
    expect(await balances()).toEqual({ test: 7_000_000 });
    const legacy = await funding.ledger.balance();
    expect(legacy).toBe(7_000_000);

    await setRate("live");
    // The switch starts the live balance at zero: sandbox credit is not spendable.
    expect(await status()).toMatchObject({ mode: "live", availableMicros: 0 });
    await expect(paidCall()).rejects.toMatchObject({
      code: "insufficient_credits",
    });

    const payment = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    const paid = live.pay(payment.checkoutSessionId!);
    const event = live.signed("checkout.session.completed", paid);
    // Signature is checked against the live secret, on the live endpoint only.
    await expect(
      stripe.webhook(event.payload, "invalid", "live"),
    ).rejects.toThrow(/signature/);
    await expect(
      stripe.webhook(event.payload, event.signature, "test"),
    ).rejects.toThrow(/signature/);
    // A live event carrying the sandbox signature is refused by both endpoints.
    const forged = new FixtureStripeGateway(
      "live",
      fixtureStripeSettings.webhookSecret,
    ).signed("checkout.session.completed", paid);
    await expect(
      stripe.webhook(forged.payload, forged.signature, "live"),
    ).rejects.toThrow(/signature/);
    await expect(
      stripe.webhook(forged.payload, forged.signature, "test"),
    ).rejects.toThrow(/test-mode/);
    // A test-mode event signed with the live secret is refused by the live endpoint.
    const downgraded = new FixtureStripeGateway(
      "test",
      fixtureLiveStripeSettings.webhookSecret,
    ).signed("checkout.session.completed", paid);
    await expect(
      stripe.webhook(downgraded.payload, downgraded.signature, "live"),
    ).rejects.toThrow(/live-mode/);
    expect(await balances()).toEqual({ test: 7_000_000 });

    expect(
      await stripe.webhook(event.payload, event.signature, "live"),
    ).toEqual({ received: true, replayed: false });
    expect(
      await stripe.webhook(event.payload, event.signature, "live"),
    ).toEqual({ received: true, replayed: true });
    await stripe.reconcile(payment.id);
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 5_000_000 },
    ]);
    expect(await balances()).toEqual({ test: 7_000_000, live: 5_000_000 });
    // Real money never reaches the test-credit ledger or the shadow wallet.
    expect(await funding.ledger.balance()).toBe(legacy);
    expect(await funding.ledger.net("stripe", payment.id)).toBe(0);
    expect(await count("shadow_wallet_sandbox_deposits")).toBe(0);
    const saved = await stripe.get(payment.id);
    expect(saved).toMatchObject({
      mode: "live",
      status: "credited",
      netCreditUnits: 5_000_000,
      message: expect.not.stringMatching(/test|sandbox/i),
    });
    expect(saved.receiptUrl).toMatch(/^https:\/\/pay\.stripe\.com\//);

    // A call is paid from the live balance and recorded in live mode.
    expect((await paidCall()).status).toBe("succeeded");
    expect(await balances()).toEqual({ test: 7_000_000, live: 4_992_300 });
    expect(
      (
        await db.pool.query(
          "SELECT mode FROM octolab.wallet_journal WHERE workspace_id=$1 AND kind='usage'",
          [workspace],
        )
      ).rows,
    ).toEqual([{ mode: "live" }]);

    // The customer summary describes real money and carries refund terms.
    const summary = await store.db.read(() => stripe.summary());
    expect(summary.stripe).toMatchObject({ enabled: true, mode: "live" });
    expect(summary.wallet).toMatchObject({
      mode: "live",
      enforced: true,
      availableMicros: 4_992_300,
    });
    expect(summary.walletEntries.map((e) => [e.kind, e.micros])).toEqual([
      ["usage", -7700],
      ["deposit", 5_000_000],
    ]);
    expect(summary.refundTerms).toMatch(/being finalized/);
    expect(await walletValid()).toBe(true);
  });

  it("never lets an event of one mode move a deposit of the other", async () => {
    await setRate("test");
    const sandbox = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    await setRate("live");
    const real = await topUp();
    // A signed live object that names the sandbox deposit in its metadata.
    const stray = live.signed("checkout.session.completed", {
      ...live.pay(real.checkoutSessionId!),
      id: "cs_live_fixture_stray",
      metadata: { octolab_deposit_id: sandbox.id },
    });
    expect(
      await stripe.webhook(stray.payload, stray.signature, "live"),
    ).toEqual({ received: true, ignored: true });
    // And the reverse: a signed sandbox object naming the live deposit.
    const reverse = test.signed("charge.refunded", {
      ...charge(test, sandbox.checkoutSessionId!, 500),
      metadata: { octolab_deposit_id: real.id },
    });
    expect(
      await stripe.webhook(reverse.payload, reverse.signature, "test"),
    ).toEqual({ received: true, ignored: true });
    expect(await stripe.get(real.id)).toMatchObject({
      status: "credited",
      refundedCents: 0,
    });
    expect(await balances()).toEqual({ live: 5_000_000 });

    // The database refuses mixed rows whichever role writes them.
    await expect(
      db.pool.query(
        "UPDATE octolab.stripe_deposits SET mode='test' WHERE id=$1",
        [real.id],
      ),
    ).rejects.toThrow(/cannot change/);
    await expect(
      db.pool.query(
        "UPDATE octolab.wallet_deposits SET mode='live' WHERE workspace_id=$1 AND deposit_id=$2",
        [workspace, sandbox.id],
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.pool.query(
        "INSERT INTO octolab.wallet_journal(workspace_id,source_id,revision,kind,reference,target_micros,wallet_micros,mode) VALUES ($1,$2,9,'deposit','pi_fixture',1,1,'test')",
        [workspace, real.id],
      ),
    ).rejects.toThrow(/foreign key/);
    await expect(
      db.pool.query(
        "UPDATE octolab.stripe_deposits SET session_id='cs_test_wrong' WHERE id=$1",
        [real.id],
      ),
    ).rejects.toThrow(/stripe_deposits_mode_session/);
  });

  it("reconciles async success and failure, expiry, refunds and disputes for live payments", async () => {
    // Async failure and expiry credit nothing.
    const failed = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    await deliver(
      live,
      "checkout.session.async_payment_failed",
      await live.retrieve(failed.checkoutSessionId!),
    );
    expect((await stripe.get(failed.id)).status).toBe("checkout_ready");
    live.sessions.get(failed.checkoutSessionId!).status = "expired";
    await deliver(
      live,
      "checkout.session.expired",
      await live.retrieve(failed.checkoutSessionId!),
    );
    expect((await stripe.get(failed.id)).status).toBe("expired");
    expect(await balances()).toEqual({});

    // Async success credits once.
    const payment = await stripe.create({
      requestKey: randomUUID(),
      amount: "20",
    });
    await deliver(
      live,
      "checkout.session.async_payment_succeeded",
      live.pay(payment.checkoutSessionId!),
    );
    expect(await balances()).toEqual({ live: 20_000_000 });

    // Partial then full refund, each replayed.
    const partial = live.signed(
      "charge.refunded",
      charge(live, payment.checkoutSessionId!, 500),
    );
    await stripe.webhook(partial.payload, partial.signature, "live");
    await stripe.webhook(partial.payload, partial.signature, "live");
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "partially_refunded",
      refundedCents: 500,
    });
    expect(await balances()).toEqual({ live: 15_000_000 });
    await deliver(
      live,
      "charge.refunded",
      charge(live, payment.checkoutSessionId!, 2000),
    );
    expect((await stripe.get(payment.id)).status).toBe("refunded");
    expect(await balances()).toEqual({ live: 0 });

    // A dispute removes that payment's credits and freezes only the live balance.
    const second = await topUp("10");
    const third = await topUp("5");
    await deliver(
      live,
      "charge.dispute.created",
      charge(live, second.checkoutSessionId!, 0, true),
    );
    expect(await journal(second.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 10_000_000 },
      { kind: "dispute_hold", mode: "live", micros: -10_000_000 },
    ]);
    expect(await status()).toMatchObject({
      mode: "live",
      availableMicros: 5_000_000,
      frozen: true,
    });
    await expect(paidCall()).rejects.toMatchObject({
      wallet: { reason: "dispute_hold" },
    });
    // Closing the dispute at Stripe does not lift the freeze by itself.
    await deliver(
      live,
      "charge.dispute.closed",
      charge(live, second.checkoutSessionId!, 0, true),
    );
    expect((await status()).frozen).toBe(true);
    expect((await stripe.get(third.id)).status).toBe("credited");
    expect(await funding.ledger.balance()).toBe(0);
    expect(await walletValid()).toBe(true);
  });

  it("keeps a sandbox dispute from freezing the live balance", async () => {
    await setRate("test");
    const sandbox = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    await deliver(
      test,
      "checkout.session.completed",
      test.pay(sandbox.checkoutSessionId!),
    );
    await deliver(
      test,
      "charge.dispute.created",
      charge(test, sandbox.checkoutSessionId!, 0, true),
    );
    expect(await status()).toMatchObject({ mode: "test", frozen: true });
    await setRate("live");
    await topUp();
    expect(await status()).toMatchObject({ mode: "live", frozen: false });
    expect((await paidCall()).status).toBe("succeeded");
  });

  it("releases a dispute freeze only after Stripe closes the dispute, restoring credits by its outcome", async () => {
    const won = await topUp("10");
    const lost = await topUp("10");
    for (const p of [won, lost])
      await deliver(
        live,
        "charge.dispute.created",
        charge(live, p.checkoutSessionId!, 0, true),
      );
    expect(await status()).toMatchObject({ postedMicros: 0, frozen: true });
    const note = "Checked the dispute outcome in the Stripe dashboard.";
    const release = (id: string, requestKey = randomUUID()) =>
      ops.releaseDispute(id, { requestKey, note }, "account fixture-admin");

    // Still open at Stripe, or no dispute there at all: nothing is released.
    await expect(release(won.id)).rejects.toThrow(/no dispute/);
    live.disputeStatus.set(won.paymentIntentId!, { status: "under_review" });
    await expect(release(won.id)).rejects.toThrow(/has not closed/);
    expect((await status()).frozen).toBe(true);

    live.disputeStatus.set(won.paymentIntentId!, { status: "won" });
    const key = randomUUID();
    expect(await release(won.id, key)).toMatchObject({
      outcome: "won",
      restoredMicros: 10_000_000,
      replayed: false,
    });
    // The other payment's dispute still freezes the account.
    expect(await status()).toMatchObject({
      postedMicros: 10_000_000,
      frozen: true,
    });
    // Same request again changes nothing; a new request is refused.
    expect(await release(won.id, key)).toMatchObject({
      restoredMicros: 10_000_000,
      replayed: true,
    });
    await expect(
      ops.releaseDispute(
        won.id,
        { requestKey: key, note: note + " Changed." },
        "account fixture-admin",
      ),
    ).rejects.toThrow(/different details/);
    await expect(release(won.id)).rejects.toThrow(/already released/);
    expect(await journal(won.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 10_000_000 },
      { kind: "dispute_hold", mode: "live", micros: -10_000_000 },
      { kind: "dispute_release", mode: "live", micros: 10_000_000 },
    ]);

    // A lost dispute lifts the freeze and restores nothing.
    live.disputeStatus.set(lost.paymentIntentId!, { status: "lost" });
    expect(await release(lost.id)).toMatchObject({
      outcome: "lost",
      restoredMicros: 0,
    });
    expect(await status()).toMatchObject({
      postedMicros: 10_000_000,
      availableMicros: 10_000_000,
      frozen: false,
    });
    expect((await paidCall()).status).toBe("succeeded");

    // Later checks and replayed events keep the release and post nothing more.
    await stripe.reconcile(won.id);
    await deliver(
      live,
      "charge.dispute.closed",
      charge(live, won.checkoutSessionId!, 0, true),
    );
    expect(await journal(won.id)).toHaveLength(3);
    expect(await stripe.get(won.id)).toMatchObject({
      status: "credited",
      disputeResolution: { outcome: "won", restoredMicros: 10_000_000 },
      message: expect.stringMatching(/restored/),
    });
    const actions = await db.pool.query(
      "SELECT kind,actor,data FROM octolab.wallet_operator_actions WHERE workspace_id=$1 ORDER BY created_at",
      [workspace],
    );
    expect(actions.rows).toMatchObject([
      {
        kind: "dispute_release",
        actor: "account fixture-admin",
        data: { outcome: "won", note },
      },
      { kind: "dispute_release", data: { outcome: "lost" } },
    ]);
    expect(await walletValid()).toBe(true);

    // The runtime role still cannot release a hold or read operator records.
    await expect(
      store.db
        .prepare(
          "INSERT INTO wallet_journal(source_id,revision,kind,wallet_micros,mode) VALUES (?,9,'dispute_release',0,'live')",
        )
        .run(randomUUID()),
    ).rejects.toThrow();
    await expect(
      store.db.prepare("SELECT 1 FROM wallet_operator_actions").all(),
    ).rejects.toThrow(/permission denied/);
    await expect(
      store.db
        .prepare(
          "UPDATE wallet_refund_requests SET status='failed' WHERE status='reserved'",
        )
        .run(),
    ).rejects.toThrow(/permission denied/);
  });

  it("restores only the part of a payment that was not refunded or lost", async () => {
    const payment = await topUp("10");
    await deliver(
      live,
      "charge.refunded",
      charge(live, payment.checkoutSessionId!, 300),
    );
    await deliver(
      live,
      "charge.dispute.created",
      charge(live, payment.checkoutSessionId!, 300, true),
    );
    live.disputeStatus.set(payment.paymentIntentId!, {
      status: "lost",
      amount: 200,
    });
    expect(
      await ops.releaseDispute(
        payment.id,
        { requestKey: randomUUID(), note: "Partial dispute lost at Stripe." },
        "account fixture-admin",
      ),
    ).toMatchObject({ outcome: "lost", restoredMicros: 5_000_000 });
    expect(await status()).toMatchObject({
      postedMicros: 5_000_000,
      frozen: false,
    });
  });

  it("refunds unused credit by reserving it before Stripe is called", async () => {
    const payment = await topUp("5");
    expect((await paidCall()).status).toBe("succeeded");
    const refund = (amount: string, requestKey = randomUUID()) =>
      ops.requestRefund(
        payment.id,
        { requestKey, amount, note: "Customer asked for unused credit back." },
        "account fixture-admin",
      );

    // Off until the owner approves a policy; the quote is still available.
    vi.stubEnv("TWO_HANDS_UNUSED_REFUNDS", "false");
    await expect(refund("1")).rejects.toThrow(/not enabled/);
    expect(await ops.refundQuote(payment.id)).toMatchObject({
      mode: "live",
      refundsEnabled: false,
      policyVersion: REFUND_POLICY_VERSION,
      refundableCents: 499,
      availableMicros: 4_992_300,
      requests: [],
    });
    expect(live.refundCalls).toHaveLength(0);
    vi.stubEnv("TWO_HANDS_UNUSED_REFUNDS", "true");

    await expect(refund("4.995")).rejects.toThrow();
    await expect(refund("5")).rejects.toThrow(/At most \$4\.99/);
    expect(live.refundCalls).toHaveLength(0);

    // The balance is already reduced when Stripe receives the request.
    const submitted = vi.spyOn(live, "refund");
    let reservedAtCall: unknown;
    submitted.mockImplementationOnce(async (params, key) => {
      reservedAtCall = await balances();
      submitted.mockRestore();
      return live.refund(params, key);
    });
    const key = randomUUID();
    const quote = await refund("2", key);
    expect(reservedAtCall).toEqual({ live: 2_992_300 });
    expect(live.refundCalls).toMatchObject([
      { paymentIntentId: payment.paymentIntentId, amountCents: 200 },
    ]);
    expect(quote.requests).toMatchObject([
      {
        amountCents: 200,
        status: "completed",
        actor: "account fixture-admin",
        policyVersion: REFUND_POLICY_VERSION,
      },
    ]);
    expect(quote.refundableCents).toBe(299);
    // Stripe's own refund event and a replayed request do not debit again.
    await deliver(
      live,
      "charge.refunded",
      await live
        .retrieve(payment.checkoutSessionId!)
        .then((s: any) => s.payment_intent.latest_charge),
    );
    await refund("2", key);
    expect(live.refundCalls).toHaveLength(1);
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 5_000_000 },
      { kind: "refund", mode: "live", micros: -2_000_000 },
    ]);
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "partially_refunded",
      refundedCents: 200,
      pendingRefundCents: 0,
      netCreditUnits: 3_000_000,
    });
    expect(await balances()).toEqual({ live: 2_992_300 });
    expect(await walletValid()).toBe(true);
  });

  it("returns the credits when Stripe refuses a refund", async () => {
    const payment = await topUp("5");
    live.refundBehavior = "refuse";
    await expect(
      ops.requestRefund(
        payment.id,
        {
          requestKey: randomUUID(),
          amount: "2",
          note: "Customer asked for unused credit back.",
        },
        "account fixture-admin",
      ),
    ).rejects.toThrow(/refused this refund/);
    expect(await balances()).toEqual({ live: 5_000_000 });
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 5_000_000 },
      { kind: "refund", mode: "live", micros: -2_000_000 },
      { kind: "deposit", mode: "live", micros: 2_000_000 },
    ]);
    expect((await ops.refundQuote(payment.id)).requests).toMatchObject([
      { status: "failed" },
    ]);
    expect(await walletValid()).toBe(true);
  });

  it("keeps the amount reserved while a refund's outcome is unknown, then resolves it from Stripe", async () => {
    const payment = await topUp("5");
    const input = () => ({
      requestKey: randomUUID(),
      amount: "2",
      note: "Customer asked for unused credit back.",
    });
    // Stripe refunded, but its answer never arrived.
    live.refundBehavior = "lost";
    await expect(
      ops.requestRefund(payment.id, input(), "account fixture-admin"),
    ).rejects.toThrow(/stays reserved/);
    const [request] = (await ops.refundQuote(payment.id)).requests;
    expect(request.status).toBe("reserved");
    // A second refund cannot start while this one is unresolved.
    live.refundBehavior = "succeed";
    await expect(
      ops.requestRefund(payment.id, input(), "account fixture-admin"),
    ).rejects.toThrow(/still in progress/);
    expect(live.refundCalls).toHaveLength(1);
    expect(await balances()).toEqual({ live: 3_000_000 });
    const resolved = await ops.resolveRefund(
      request.id,
      "account fixture-admin",
    );
    expect(resolved.requests).toMatchObject([
      { status: "completed", stripeRefundId: expect.stringMatching(/^re_/) },
    ]);
    expect(await balances()).toEqual({ live: 3_000_000 });
    expect((await stripe.get(payment.id)).refundedCents).toBe(200);

    // Stripe accepted a refund that has not been paid out yet: reserved until it is.
    live.refundBehavior = "pending";
    const pending = await ops.requestRefund(
      payment.id,
      { ...input(), amount: "1" },
      "account fixture-admin",
    );
    expect(pending.requests[0].status).toBe("submitted");
    expect(await stripe.get(payment.id)).toMatchObject({
      refundedCents: 200,
      pendingRefundCents: 100,
      netCreditUnits: 2_000_000,
    });
    // A manual check or replayed event in between must not hand the credits back.
    await stripe.reconcile(payment.id);
    expect(await balances()).toEqual({ live: 2_000_000 });

    // The request never reached Stripe and the retry window has passed: release it.
    const failedAtStripe = [...live.issued.values()].at(-1);
    failedAtStripe.status = "failed";
    clock += 24 * 3600000;
    const released = await ops.resolveRefund(
      pending.requests[0].id,
      "account fixture-admin",
    );
    expect(released.requests[0].status).toBe("failed");
    expect(await balances()).toEqual({ live: 3_000_000 });
    expect(await walletValid()).toBe(true);
  });

  it("retries an unanswered refund with the same idempotency key", async () => {
    const payment = await topUp("5");
    const gateway = vi
      .spyOn(live, "refund")
      .mockRejectedValueOnce(new Error("Fixture network failure"));
    await expect(
      ops.requestRefund(
        payment.id,
        {
          requestKey: randomUUID(),
          amount: "2",
          note: "Customer asked for unused credit back.",
        },
        "account fixture-admin",
      ),
    ).rejects.toThrow(/stays reserved/);
    gateway.mockRestore();
    const [request] = (await ops.refundQuote(payment.id)).requests;
    const resolved = await ops.resolveRefund(
      request.id,
      "account fixture-admin",
    );
    expect(resolved.requests[0].status).toBe("completed");
    expect(live.refundCalls).toMatchObject([
      { key: `octolab-refund-${request.id}`, amountCents: 200 },
    ]);
    expect(await balances()).toEqual({ live: 3_000_000 });
  });

  it("refuses refunds of disputed, frozen or non-wallet payments", async () => {
    const payment = await topUp("5");
    const other = await topUp("5");
    await deliver(
      live,
      "charge.dispute.created",
      charge(live, other.checkoutSessionId!, 0, true),
    );
    const refund = (id: string) =>
      ops.requestRefund(
        id,
        {
          requestKey: randomUUID(),
          amount: "1",
          note: "Customer asked for unused credit back.",
        },
        "account fixture-admin",
      );
    await expect(refund(other.id)).rejects.toThrow(/undisputed/);
    // The account is frozen by the other payment's dispute.
    await expect(refund(payment.id)).rejects.toThrow(/At most \$0\.00/);
    expect(live.refundCalls).toHaveLength(0);
    await expect(refund(randomUUID())).rejects.toMatchObject({ status: 404 });
  });

  it("keeps reconciling a released payment against Stripe's refunds", async () => {
    const payment = await topUp("10");
    await deliver(
      live,
      "charge.dispute.created",
      charge(live, payment.checkoutSessionId!, 0, true),
    );
    live.disputeStatus.set(payment.paymentIntentId!, { status: "won" });
    await ops.releaseDispute(
      payment.id,
      { requestKey: randomUUID(), note: "Stripe shows the dispute as won." },
      "account fixture-admin",
    );
    expect(await balances()).toEqual({ live: 10_000_000 });
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "credited",
      disputed: true,
      netCreditUnits: 10_000_000,
    });

    // Stripe refunds $3 to the card after the release. The charge still says
    // "disputed", as Stripe charges do for good; the credits must follow.
    const refunded = live.signed(
      "charge.refunded",
      charge(live, payment.checkoutSessionId!, 300, true),
    );
    await stripe.webhook(refunded.payload, refunded.signature, "live");
    await stripe.webhook(refunded.payload, refunded.signature, "live");
    await stripe.reconcile(payment.id);
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 10_000_000 },
      { kind: "dispute_hold", mode: "live", micros: -10_000_000 },
      { kind: "dispute_release", mode: "live", micros: 10_000_000 },
      { kind: "refund", mode: "live", micros: -3_000_000 },
    ]);
    expect(await status()).toMatchObject({
      postedMicros: 7_000_000,
      frozen: false,
    });
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "partially_refunded",
      refundedCents: 300,
      netCreditUnits: 7_000_000,
    });
    // A full refund takes the rest.
    await deliver(
      live,
      "charge.refunded",
      charge(live, payment.checkoutSessionId!, 1000, true),
    );
    expect(await balances()).toEqual({ live: 0 });
    expect(await walletValid()).toBe(true);
  });

  it("holds a payment again when Stripe opens another dispute after a release", async () => {
    const payment = await topUp("10");
    const other = await topUp("5");
    const disputed = () =>
      deliver(
        live,
        "charge.dispute.created",
        charge(live, payment.checkoutSessionId!, 0, true),
      );
    const release = () =>
      ops.releaseDispute(
        payment.id,
        { requestKey: randomUUID(), note: "Checked the outcome at Stripe." },
        "account fixture-admin",
      );
    await disputed();
    live.disputeStatus.set(payment.paymentIntentId!, { status: "won" });
    await release();
    expect(await status()).toMatchObject({
      postedMicros: 15_000_000,
      frozen: false,
    });
    // The same dispute's events arriving again change nothing.
    await disputed();
    await stripe.reconcile(payment.id);
    expect(await journal(payment.id)).toHaveLength(3);

    // A second dispute: the restored credits come out and the account freezes.
    live.laterDisputes.set(payment.paymentIntentId!, [
      { id: "dp_fixture_second", status: "needs_response" },
    ]);
    await disputed();
    await disputed();
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 10_000_000 },
      { kind: "dispute_hold", mode: "live", micros: -10_000_000 },
      { kind: "dispute_release", mode: "live", micros: 10_000_000 },
      { kind: "dispute_hold", mode: "live", micros: -10_000_000 },
    ]);
    expect(await status()).toMatchObject({
      postedMicros: 5_000_000,
      frozen: true,
    });
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "disputed",
      disputeCycle: 2,
      netCreditUnits: 0,
    });
    expect((await stripe.get(payment.id)).disputeResolution).toBeUndefined();
    await expect(paidCall()).rejects.toMatchObject({
      wallet: { reason: "dispute_hold" },
    });
    await expect(release()).rejects.toThrow(/has not closed/);

    // Lost this time: released with nothing restored, and the account thaws.
    live.laterDisputes.set(payment.paymentIntentId!, [
      { id: "dp_fixture_second", status: "lost" },
    ]);
    expect(await release()).toMatchObject({
      outcome: "lost",
      restoredMicros: 0,
    });
    expect(await status()).toMatchObject({
      postedMicros: 5_000_000,
      frozen: false,
    });
    await stripe.reconcile(payment.id);
    expect(await journal(payment.id)).toHaveLength(5);
    expect((await stripe.get(other.id)).status).toBe("credited");
    expect(await walletValid()).toBe(true);
  });

  it("releases on every final dispute status and restores nothing for one it does not recognise", async () => {
    const prevented = await topUp("5");
    const unknown = await topUp("5");
    for (const p of [prevented, unknown])
      await deliver(
        live,
        "charge.dispute.created",
        charge(live, p.checkoutSessionId!, 0, true),
      );
    const release = (id: string) =>
      ops.releaseDispute(
        id,
        { requestKey: randomUUID(), note: "Checked the outcome at Stripe." },
        "account fixture-admin",
      );
    for (const open of [
      "needs_response",
      "under_review",
      "warning_needs_response",
      "warning_under_review",
    ]) {
      live.disputeStatus.set(prevented.paymentIntentId!, { status: open });
      await expect(release(prevented.id)).rejects.toThrow(/has not closed/);
    }
    live.disputeStatus.set(prevented.paymentIntentId!, { status: "prevented" });
    expect(await release(prevented.id)).toMatchObject({
      outcome: "won",
      restoredMicros: 5_000_000,
    });
    // A final status this code has never seen is not stuck and not restored.
    live.disputeStatus.set(unknown.paymentIntentId!, {
      status: "some_future_final_status",
    });
    expect(await release(unknown.id)).toMatchObject({
      outcome: "lost",
      restoredMicros: 0,
    });
    expect((await status()).frozen).toBe(false);
    const audit = await db.pool.query(
      "SELECT data FROM octolab.wallet_operator_actions WHERE workspace_id=$1 AND deposit_id=$2",
      [workspace, unknown.id],
    );
    expect(audit.rows[0].data.unrecognisedStatuses).toEqual([
      "some_future_final_status",
    ]);
  });

  it("restores the credits of a refund that Stripe later reports as failed", async () => {
    const payment = await topUp("5");
    const session = payment.checkoutSessionId!;
    const kept = live.dashboardRefund(session, 100);
    const failing = live.dashboardRefund(session, 150);
    await deliver(live, "charge.refunded", live.chargeOf(session));
    expect(await stripe.get(payment.id)).toMatchObject({ refundedCents: 250 });
    expect(await balances()).toEqual({ live: 2_500_000 });

    // The $1.50 refund fails. Stripe takes it out of the charge's total.
    live.failRefund(failing);
    const event = live.signed("refund.failed", {
      ...failing,
      status: "failed",
    });
    expect(
      await stripe.webhook(event.payload, event.signature, "live"),
    ).toEqual({ received: true, replayed: false });
    await stripe.webhook(event.payload, event.signature, "live");
    await stripe.reconcile(payment.id);
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "partially_refunded",
      refundedCents: 100,
      netCreditUnits: 4_000_000,
      failedRefundIds: [failing.id],
    });
    expect(await journal(payment.id)).toEqual([
      { kind: "deposit", mode: "live", micros: 5_000_000 },
      { kind: "refund", mode: "live", micros: -2_500_000 },
      { kind: "deposit", mode: "live", micros: 1_500_000 },
    ]);
    expect(await count("wallet_operator_alerts")).toBe(0);
    expect(kept.status).toBe("succeeded");
    expect(await walletValid()).toBe(true);
  });

  it("keeps the saved refund total and leaves an alert when a lower total cannot be verified", async () => {
    const payment = await topUp("5");
    const session = payment.checkoutSessionId!;
    live.dashboardRefund(session, 200);
    await deliver(live, "charge.refunded", live.chargeOf(session));
    expect(await balances()).toEqual({ live: 3_000_000 });
    // Stripe's total drops, but no refund in its list has failed.
    live.sessions.get(session).payment_intent.latest_charge.amount_refunded =
      50;
    await stripe.reconcile(payment.id);
    clock += 11_000;
    await stripe.reconcile(payment.id);
    expect(await stripe.get(payment.id)).toMatchObject({ refundedCents: 200 });
    expect(await balances()).toEqual({ live: 3_000_000 });
    const alerts = (await ops.alerts()).filter(
      (a) => a.reference === payment.id,
    );
    expect(alerts).toMatchObject([
      {
        mode: "live",
        kind: "refund_total_unverified",
        detail: { savedRefundedCents: 200, stripeRefundedCents: 50 },
      },
    ]);
    // Resolving is an audited acknowledgement; it changes no balance.
    await expect(
      ops.resolveAlert(
        alerts[0].id,
        { note: "short" },
        "account fixture-admin",
      ),
    ).rejects.toThrow();
    await ops.resolveAlert(
      alerts[0].id,
      { note: "Confirmed with Stripe support; total is correct." },
      "account fixture-admin",
    );
    expect(
      (await ops.alerts()).filter((a) => a.reference === payment.id),
    ).toEqual([]);
    expect(await balances()).toEqual({ live: 3_000_000 });
    // The runtime role can raise an alert for its own account only, and read none.
    await expect(
      store.db.prepare("SELECT 1 FROM wallet_operator_alerts").all(),
    ).rejects.toThrow(/permission denied/);
    await expect(
      store.db
        .prepare(
          "INSERT INTO wallet_operator_alerts(workspace_id,mode,kind,reference,detail) VALUES (?,'live','fixture','x','{}')",
        )
        .run(randomUUID()),
    ).rejects.toThrow();
  });

  it("returns reserved credits when an operator refund fails at Stripe after it was accepted", async () => {
    const payment = await topUp("5");
    live.refundBehavior = "pending";
    const quote = await ops.requestRefund(
      payment.id,
      {
        requestKey: randomUUID(),
        amount: "2",
        note: "Customer asked for unused credit back.",
      },
      "account fixture-admin",
    );
    expect(quote.requests[0].status).toBe("submitted");
    expect(await balances()).toEqual({ live: 3_000_000 });
    // Stripe gives up on the refund. No operator action is needed.
    const refund = live.failRefund([...live.issued.values()].at(-1));
    await deliver(live, "refund.failed", refund);
    expect(await balances()).toEqual({ live: 5_000_000 });
    expect((await ops.refundQuote(payment.id)).requests).toMatchObject([
      { status: "failed" },
    ]);
    expect(await stripe.get(payment.id)).toMatchObject({
      status: "credited",
      pendingRefundCents: 0,
      netCreditUnits: 5_000_000,
    });
    const actions = await db.pool.query(
      "SELECT kind,actor FROM octolab.wallet_operator_actions WHERE workspace_id=$1 ORDER BY created_at",
      [workspace],
    );
    expect(actions.rows).toMatchObject([
      { kind: "refund_request", actor: "account fixture-admin" },
      { kind: "refund_resolution", actor: expect.stringMatching(/^system/) },
    ]);
    expect(await walletValid()).toBe(true);
  });

  it("never refunds credit that did not come from a card and refuses an adjustment without a mode", async () => {
    await expect(
      db.pool.query(
        "INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,reference,wallet_micros) VALUES ($1,$2,'adjustment','forgot the mode',1000000)",
        [workspace, randomUUID()],
      ),
    ).rejects.toThrow(/null value in column "mode"/);
    const adjust = (micros: number) =>
      db.pool.query(
        "INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,reference,wallet_micros,mode) VALUES ($1,$2,'adjustment','fixture goodwill credit',$3,'live')",
        [workspace, randomUUID(), micros],
      );
    await adjust(10_000_000);
    const payment = await topUp("5");
    expect((await paidCall()).status).toBe("succeeded");
    // $14.9923 available, but only the card's $5 less usage can go to a card.
    expect(await ops.refundQuote(payment.id)).toMatchObject({
      availableMicros: 14_992_300,
      refundableCents: 499,
    });
    await expect(
      ops.requestRefund(
        payment.id,
        {
          requestKey: randomUUID(),
          amount: "5",
          note: "Customer asked for unused credit back.",
        },
        "account fixture-admin",
      ),
    ).rejects.toThrow(/At most \$4\.99/);
    // A negative adjustment reduces what can be refunded.
    await adjust(-12_000_000);
    expect((await ops.refundQuote(payment.id)).refundableCents).toBe(299);
  });

  it("answers a concurrent duplicate operator request as a replay", async () => {
    const payment = await topUp("5");
    const refund = {
      requestKey: randomUUID(),
      amount: "1",
      note: "Customer asked for unused credit back.",
    };
    const refunds = await Promise.all([
      ops.requestRefund(payment.id, refund, "account fixture-admin"),
      ops.requestRefund(payment.id, refund, "account fixture-admin"),
    ]);
    expect(refunds.map((r) => r.requests.length)).toEqual([1, 1]);
    expect(live.refundCalls).toHaveLength(1);
    expect(await balances()).toEqual({ live: 4_000_000 });

    await deliver(live, "charge.dispute.created", {
      ...live.chargeOf(payment.checkoutSessionId!),
      disputed: true,
    });
    live.sessions.get(
      payment.checkoutSessionId!,
    ).payment_intent.latest_charge.disputed = true;
    live.disputeStatus.set(payment.paymentIntentId!, { status: "won" });
    const release = {
      requestKey: randomUUID(),
      note: "Stripe shows the dispute as won.",
    };
    const releases = await Promise.all([
      ops.releaseDispute(payment.id, release, "account fixture-admin"),
      ops.releaseDispute(payment.id, release, "account fixture-admin"),
    ]);
    expect(releases.map((r) => r.restoredMicros)).toEqual([
      4_000_000, 4_000_000,
    ]);
    expect(releases.map((r) => r.replayed).sort()).toEqual([false, true]);
    expect(await balances()).toEqual({ live: 4_000_000 });
  });

  it("records a live event that matches no account and tells customers nothing about configuration", async () => {
    const stray = live.signed("charge.refunded", {
      id: "ch_fixture_unknown",
      payment_intent: null,
      metadata: {},
    });
    expect(
      await stripe.webhook(stray.payload, stray.signature, "live"),
    ).toEqual({ received: true, ignored: true });
    await stripe.webhook(stray.payload, stray.signature, "live");
    expect(
      (await ops.alerts()).filter((a) => a.reference === stray.id),
    ).toMatchObject([
      {
        mode: "live",
        kind: "unmatched_live_event",
        account: null,
        detail: { type: "charge.refunded" },
      },
    ]);
    // The same stray event in sandbox is only ignored.
    const sandbox = test.signed("charge.refunded", {
      id: "ch_fixture_unknown_test",
      payment_intent: null,
      metadata: {},
    });
    await stripe.webhook(sandbox.payload, sandbox.signature, "test");
    expect(
      (await ops.alerts()).filter((a) => a.reference === sandbox.id),
    ).toEqual([]);

    // A misconfigured live rail: operators get the reason, customers do not.
    stripe.rail("live").settings.secretKey = "sk_test_fixture_only";
    expect(ops.railStatus().live.unavailableReason).toMatch(
      /Configure a Stripe live secret key/,
    );
    const customer = await store.db.read(() => stripe.accountStatus());
    expect(customer).toMatchObject({
      enabled: false,
      mode: "live",
      unavailableReason:
        "Card top-ups are not available for this account right now.",
    });
    await expect(
      stripe.create({ requestKey: randomUUID(), amount: "5" }),
    ).rejects.toThrow(/^Card top-ups are not available/);
  });

  it("serves the live webhook and the operator actions over HTTP", async () => {
    config.token = "workspace-fixture-owner-token-0001";
    config.adminToken = "admin-fixture-operator-token-0001";
    const app = createApp(store, undefined, obs, undefined, funding, stripe);
    const admin = (path: string, body?: object) =>
      (body
        ? request(app).post(`/api/admin/funding${path}`).send(body)
        : request(app).get(`/api/admin/funding${path}`)
      ).set("Authorization", "Bearer admin-fixture-operator-token-0001");
    const payment = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    const event = live.signed(
      "checkout.session.completed",
      live.pay(payment.checkoutSessionId!),
    );
    const post = (path: string) =>
      request(app)
        .post(path)
        .set("Content-Type", "application/json")
        .set("stripe-signature", event.signature)
        .send(event.payload.toString());
    // The sandbox endpoint cannot verify a live event; the live endpoint can.
    expect((await post("/api/webhooks/stripe")).status).toBe(400);
    expect(await balances()).toEqual({});
    expect((await post("/api/webhooks/stripe/live")).body).toEqual({
      received: true,
      replayed: false,
    });
    expect(await balances()).toEqual({ live: 5_000_000 });

    const funded = await request(app)
      .get("/api/account/funding")
      .set("Authorization", "Bearer workspace-fixture-owner-token-0001");
    expect(funded.body).toMatchObject({
      stripe: { enabled: true, mode: "live" },
      wallet: { mode: "live", availableMicros: 5_000_000 },
      refundTerms: expect.stringMatching(/being finalized/),
    });
    expect(JSON.stringify(funded.body)).not.toMatch(/sk_live|whsec_/);

    // Operator routes need the admin credential, not the workspace one.
    expect(
      (
        await request(app)
          .get(`/api/admin/funding/refunds/${payment.id}`)
          .set("Authorization", "Bearer workspace-fixture-owner-token-0001")
      ).status,
    ).toBe(401);
    expect((await admin(`/payments?q=${payment.id}`)).body.items).toMatchObject(
      [{ mode: "live", payment: { id: payment.id } }],
    );
    expect((await admin(`/refunds/${payment.id}`)).body).toMatchObject({
      refundableCents: 500,
      refundsEnabled: true,
    });
    const refunded = await admin(`/refunds/${payment.id}`, {
      requestKey: randomUUID(),
      amount: "1.50",
      note: "Customer asked for unused credit back.",
    });
    expect(refunded.body).toMatchObject({
      refundableCents: 350,
      requests: [{ status: "completed", amountCents: 150 }],
    });
    expect(
      (
        await admin(
          `/refund-requests/${refunded.body.requests[0].id}/resolve`,
          {},
        )
      ).status,
    ).toBe(200);
    expect(await balances()).toEqual({ live: 3_500_000 });

    const disputed = live.signed(
      "charge.dispute.created",
      charge(live, payment.checkoutSessionId!, 150, true),
    );
    await stripe.webhook(disputed.payload, disputed.signature, "live");
    const refusal = await admin(`/disputes/${payment.id}/release`, {
      requestKey: randomUUID(),
      note: "Stripe shows the dispute as closed.",
    });
    expect(refusal.status).toBe(409);
    live.disputeStatus.set((await stripe.get(payment.id)).paymentIntentId!, {
      status: "won",
    });
    const released = await admin(`/disputes/${payment.id}/release`, {
      requestKey: randomUUID(),
      note: "Stripe shows the dispute as closed.",
    });
    expect(released.body).toMatchObject({
      outcome: "won",
      restoredMicros: 3_500_000,
      detail: { item: { payment: { disputeResolution: { outcome: "won" } } } },
    });
    expect((await status()).frozen).toBe(false);
  });
});
