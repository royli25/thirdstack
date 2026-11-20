import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { FundingService } from "../server/funding";
import {
  StripeFundingService,
  appOrigin,
  stripeDepositInput,
} from "../server/stripe-funding";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";
import { FundingLedger } from "../server/funding-ledger";
let store: Store;
let funding: FundingService;
let stripe: StripeFundingService;
let gateway: FixtureStripeGateway;
let now: number;
const input = (amount = "10") => ({ requestKey: randomUUID(), amount });
beforeEach(() => {
  store = new Store(":memory:");
  funding = new FundingService(store, {
    enabled: false,
    recipient: "",
    rpcUrl: "https://fixture.invalid",
  });
  gateway = new FixtureStripeGateway();
  now = Date.now();
  stripe = new StripeFundingService(
    funding,
    { ...fixtureStripeSettings },
    gateway,
    () => now,
  );
});
afterEach(async () => await store.close());
const ledgerCount = async () => (await funding.ledger.entries()).length;
const eventCount = async () =>
  Number(
    (await store.db
      .prepare("SELECT COUNT(*) AS n FROM stripe_webhook_receipts")
      .get())!.n,
  );
describe("Stripe sandbox funding integrity", () => {
  it("parses cents exactly and rejects malformed or out-of-range amounts", () => {
    expect(stripeDepositInput.parse(input("5.01")).amount).toBe(501);
    for (const amount of [
      "4.99",
      "1000.01",
      "1e2",
      "01",
      "10.001",
      "NaN",
      "-10",
      "1000000",
    ])
      expect(() => stripeDepositInput.parse(input(amount))).toThrow();
    expect(() =>
      stripeDepositInput.parse({
        ...input(),
        success_url: "https://evil.example",
      }),
    ).toThrow();
  });
  it("is disabled by default and refuses live keys and unsafe return origins", async () => {
    for (const override of [
      { enabled: false },
      { secretKey: "sk_live_forbidden" },
      { webhookSecret: "" },
      { appUrl: "http://remote.example" },
      { appUrl: "https://user:password@example.com" },
    ]) {
      Object.assign(stripe.settings, fixtureStripeSettings, override);
      expect(stripe.status().enabled).toBe(false);
      await expect(stripe.create(input())).rejects.toThrow();
    }
    expect(gateway.creates).toHaveLength(0);
    expect(appOrigin("https://app.example")).toBe("https://app.example");
    expect(
      appOrigin("https://app.example/?redirect=https://evil.example"),
    ).toBeNull();
  });
  it("creates immutable checkout once with pinned USD/card parameters and server-owned returns", async () => {
    const body = input("10.01");
    const [first, retry] = await Promise.all([
      stripe.create(body),
      stripe.create(body),
    ]);
    expect(first.id).toBe(retry.id);
    expect(gateway.creates).toHaveLength(1);
    const { params, key } = gateway.creates[0];
    expect(key).toBe(`octolab-deposit-${first.id}`);
    expect(params.allowed_payment_method_types).toEqual(["card"]);
    expect(params.line_items![0].price_data).toMatchObject({
      currency: "usd",
      unit_amount: 1001,
    });
    expect(params.success_url).toBe(
      `http://127.0.0.1:3102/?stripe_deposit=${first.id}#dashboard/credits`,
    );
    expect(params.payment_intent_data?.metadata).toEqual({
      octolab_deposit_id: first.id,
    });
    await expect(stripe.create({ ...body, amount: "11" })).rejects.toThrow(
      /different amount/,
    );
    expect(await funding.ledger.balance()).toBe(0);
  });
  it("recovers a lost create response with the original Stripe idempotency key", async () => {
    const create = gateway.create.bind(gateway);
    let dropped = false;
    vi.spyOn(gateway, "create").mockImplementation(async (params, key) => {
      const result = await create(params, key);
      if (!dropped) {
        dropped = true;
        throw new Error("Lost response");
      }
      return result;
    });
    const body = input();
    await expect(stripe.create(body)).rejects.toThrow(/could not be prepared/);
    const result = await stripe.create(body);
    expect(result.status).toBe("checkout_ready");
    expect(gateway.sessions.size).toBe(1);
    expect(gateway.creates[0]).toEqual(gateway.creates[1]);
  });
  it("keeps retry expiry valid and refuses unsafe recovery beyond the idempotency window", async () => {
    const create = gateway.create.bind(gateway);
    const spy = vi
      .spyOn(gateway, "create")
      .mockRejectedValueOnce(new Error("Never reached Stripe"));
    const body = input();
    await expect(stripe.create(body)).rejects.toThrow();
    now += 22 * 3600000;
    spy.mockImplementation(create);
    await stripe.create(body);
    const params = gateway.creates[0].params;
    expect(params.expires_at! - Math.floor(now / 1000)).toBe(2 * 3600);
    const other = input();
    spy.mockRejectedValueOnce(new Error("Lost response"));
    await expect(stripe.create(other)).rejects.toThrow();
    now += 23 * 3600000 + 1;
    await expect(stripe.create(other)).rejects.toThrow(/reconciliation/);
  });
  it("rejects changed payment identity, mode, currency and amounts without ledger mutation", async () => {
    const intent = await stripe.create(input());
    const good = gateway.pay(intent.checkoutSessionId!);
    for (const mutate of [
      (s: any) => {
        s.livemode = true;
      },
      (s: any) => {
        s.currency = "eur";
      },
      (s: any) => {
        s.amount_total++;
      },
      (s: any) => {
        s.metadata.octolab_deposit_id = randomUUID();
      },
      (s: any) => {
        s.client_reference_id = randomUUID();
      },
      (s: any) => {
        s.payment_intent.amount_received--;
      },
      (s: any) => {
        s.payment_intent.latest_charge.amount_captured--;
      },
      (s: any) => {
        s.payment_intent.latest_charge.amount_refunded = 1001;
      },
      (s: any) => {
        s.payment_intent.latest_charge.livemode = true;
      },
      (s: any) => {
        s.payment_intent = "pi_not_expanded";
      },
    ]) {
      const changed = structuredClone(good);
      mutate(changed);
      gateway.sessions.set(intent.checkoutSessionId!, changed);
      await expect(stripe.reconcile(intent.id)).rejects.toThrow();
      expect(await funding.ledger.balance()).toBe(0);
    }
  });
  it("never credits an unpaid redirect or an expired checkout", async () => {
    const intent = await stripe.create(input());
    expect((await stripe.reconcile(intent.id)).status).toBe("checkout_ready");
    Object.assign(gateway.sessions.get(intent.checkoutSessionId!), {
      status: "expired",
      url: null,
    });
    expect((await stripe.reconcile(intent.id)).status).toBe("expired");
    expect(await funding.ledger.balance()).toBe(0);
  });
  it("credits a verified payment once under concurrent retries and across restarts", async () => {
    const intent = await stripe.create(input("12.34"));
    gateway.pay(intent.checkoutSessionId!);
    const results = await Promise.all([
      stripe.reconcile(intent.id),
      stripe.reconcile(intent.id),
    ]);
    expect(results[0].status).toBe("credited");
    expect(await funding.ledger.balance()).toBe(12340000);
    expect(await ledgerCount()).toBe(1);
    stripe = new StripeFundingService(
      funding,
      { ...fixtureStripeSettings },
      gateway,
    );
    await stripe.reconcile(intent.id);
    expect(await ledgerCount()).toBe(1);
    expect((await funding.summary()).spendableForProviders).toBe(false);
  });
  it("deduplicates signed webhooks and refuses invalid, stale and live signatures/events", async () => {
    const intent = await stripe.create(input());
    const paid = gateway.pay(intent.checkoutSessionId!);
    const event = gateway.signed("checkout.session.completed", paid);
    await expect(stripe.webhook(event.payload, "t=1,v1=bad")).rejects.toThrow(
      /signature/,
    );
    await expect(
      stripe.webhook(
        Buffer.from(event.payload.toString() + " "),
        event.signature,
      ),
    ).rejects.toThrow(/signature/);
    const live = gateway.signed("checkout.session.completed", paid, undefined, {
      livemode: true,
    });
    await expect(stripe.webhook(live.payload, live.signature)).rejects.toThrow(
      /test-mode/,
    );
    expect(await stripe.webhook(event.payload, event.signature)).toMatchObject({
      replayed: false,
    });
    expect(await stripe.webhook(event.payload, event.signature)).toMatchObject({
      replayed: true,
    });
    expect(await ledgerCount()).toBe(1);
    expect(await eventCount()).toBe(1);
  });
  it("does not acknowledge failed verification so Stripe can retry delivery", async () => {
    const intent = await stripe.create(input());
    const paid = gateway.pay(intent.checkoutSessionId!);
    const event = gateway.signed("checkout.session.completed", paid);
    const retrieve = vi
      .spyOn(gateway, "retrieve")
      .mockRejectedValueOnce(new Error("Temporary outage"));
    await expect(
      stripe.webhook(event.payload, event.signature),
    ).rejects.toThrow();
    expect(await eventCount()).toBe(0);
    expect(await ledgerCount()).toBe(0);
    await stripe.webhook(event.payload, event.signature);
    expect(await eventCount()).toBe(1);
    expect(await funding.ledger.balance()).toBe(10000000);
    retrieve.mockRestore();
  });
  it("reconciles refunds monotonically and holds disputed credits without accidental restoration", async () => {
    const intent = await stripe.create(input());
    gateway.pay(intent.checkoutSessionId!);
    await stripe.reconcile(intent.id);
    gateway.pay(intent.checkoutSessionId!, 250);
    expect((await stripe.reconcile(intent.id)).status).toBe(
      "partially_refunded",
    );
    expect(await funding.ledger.balance()).toBe(7500000);
    gateway.pay(intent.checkoutSessionId!, 0);
    await stripe.reconcile(intent.id); // Stale snapshot must not restore a refund.
    expect(await funding.ledger.balance()).toBe(7500000);
    gateway.pay(intent.checkoutSessionId!, 250, true);
    expect((await stripe.reconcile(intent.id)).status).toBe("disputed");
    expect(await funding.ledger.balance()).toBe(0);
    gateway.pay(intent.checkoutSessionId!, 250, false);
    await stripe.reconcile(intent.id);
    expect(await funding.ledger.balance()).toBe(0);
    expect(
      (await funding.ledger.entries())
        .map((e) => e.deltaUnits)
        .sort((a, b) => a - b),
    ).toEqual([-7500000, -2500000, 10000000]);
  });
  it("verifies refund webhooks after any older in-flight snapshot before acknowledging", async () => {
    const intent = await stripe.create(input());
    const paid = gateway.pay(intent.checkoutSessionId!);
    await stripe.reconcile(intent.id);
    const retrieve = gateway.retrieve.bind(gateway);
    let release!: () => void;
    let readStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      readStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    vi.spyOn(gateway, "retrieve").mockImplementationOnce(async (id) => {
      const stale = await retrieve(id);
      readStarted();
      await gate;
      return stale;
    });
    const older = stripe.reconcile(intent.id);
    await started;
    gateway.pay(intent.checkoutSessionId!, 1000);
    const event = gateway.signed("charge.refunded", {
      id: paid.payment_intent.latest_charge.id,
      payment_intent: paid.payment_intent.id,
    });
    const delivery = stripe.webhook(event.payload, event.signature);
    release();
    await older;
    await delivery;
    expect((await stripe.get(intent.id)).status).toBe("refunded");
    expect(await funding.ledger.balance()).toBe(0);
    expect(await eventCount()).toBe(1);
    expect(await stripe.webhook(event.payload, event.signature)).toMatchObject({
      replayed: true,
    });
    expect(await ledgerCount()).toBe(2);
  });
  it("finds a disputed payment by verified PaymentIntent metadata before checkout completion arrives", async () => {
    const intent = await stripe.create(input());
    const paid = gateway.pay(intent.checkoutSessionId!, 0, true);
    const event = gateway.signed("charge.dispute.created", {
      id: "dp_fixture_early",
      charge: paid.payment_intent.latest_charge.id,
      payment_intent: paid.payment_intent.id,
    });
    expect(await stripe.webhook(event.payload, event.signature)).toMatchObject({
      received: true,
      replayed: false,
    });
    expect((await stripe.get(intent.id)).disputed).toBe(true);
    expect((await stripe.get(intent.id)).netCreditUnits).toBe(0);
    expect(await eventCount()).toBe(1);
  });
  it("records full refunds and processes charge events using the saved payment identity", async () => {
    const intent = await stripe.create(input());
    const paid = gateway.pay(intent.checkoutSessionId!);
    await stripe.reconcile(intent.id);
    gateway.pay(intent.checkoutSessionId!, 1000);
    const event = gateway.signed("charge.refunded", {
      id: paid.payment_intent.latest_charge.id,
      payment_intent: paid.payment_intent.id,
    });
    await stripe.webhook(event.payload, event.signature);
    expect((await stripe.get(intent.id)).status).toBe("refunded");
    expect(await funding.ledger.balance()).toBe(0);
  });
  it("recovers checkout completion racing the create response without duplicate credits", async () => {
    const create = gateway.create.bind(gateway);
    vi.spyOn(gateway, "create").mockImplementation(async (params, key) => {
      const session = (await create(params, key)) as any;
      const paid = gateway.pay(session.id);
      const event = gateway.signed("checkout.session.completed", paid);
      await stripe.webhook(event.payload, event.signature);
      return session;
    });
    const intent = await stripe.create(input());
    expect(intent.status).toBe("credited");
    expect(intent.checkoutUrl).toBeNull();
    expect(await ledgerCount()).toBe(1);
  });
  it("retains both ledger and receipt if settlement fails atomically", async () => {
    const intent = await stripe.create(input());
    gateway.pay(intent.checkoutSessionId!);
    await store.db.exec(
      "CREATE TRIGGER fail_test_receipt BEFORE UPDATE ON stripe_deposits WHEN NEW.payment_intent_id IS NOT NULL BEGIN SELECT RAISE(ABORT,'fixture failure'); END;",
    );
    await expect(stripe.reconcile(intent.id)).rejects.toThrow();
    expect(await funding.ledger.balance()).toBe(0);
    expect((await stripe.get(intent.id)).paymentIntentId).toBeNull();
    await store.db.exec("DROP TRIGGER fail_test_receipt");
    await stripe.reconcile(intent.id);
    expect(await funding.ledger.balance()).toBe(10000000);
  });
  it("imports historical on-chain credits once and preserves them when a Stripe payment is refunded", async () => {
    const id = randomUUID();
    // Migration fixture: legacy receipts predate the shared ledger. Existing intent foreign key remains valid.
    const f = new FundingService(store, {
      enabled: true,
      recipient: `0x${"22".repeat(20)}`,
      rpcUrl: "https://fixture.invalid",
    });
    const onchain = await f.create({
      requestKey: id,
      amount: "5",
      sender: `0x${"11".repeat(20)}`,
    });
    await store.db
      .prepare("INSERT INTO funding_credits VALUES (?,?,?,?,?,?,?)")
      .run(
        randomUUID(),
        onchain.id,
        84532,
        `0x${"33".repeat(32)}`,
        "0x0",
        5000000,
        new Date().toISOString(),
      );
    new FundingLedger(store);
    new FundingLedger(store);
    expect(await funding.ledger.balance()).toBe(5000000);
    const card = await stripe.create(input());
    gateway.pay(card.checkoutSessionId!);
    await stripe.reconcile(card.id);
    expect(await funding.ledger.balance()).toBe(15000000);
    gateway.pay(card.checkoutSessionId!, 1000);
    await stripe.reconcile(card.id);
    expect(await funding.ledger.balance()).toBe(5000000);
  });
  it("allows reconciliation after creation is disabled and limits manual polling", async () => {
    const intent = await stripe.create(input());
    stripe.settings.enabled = false;
    gateway.pay(intent.checkoutSessionId!);
    expect((await stripe.reconcile(intent.id, true)).status).toBe("credited");
    await expect(stripe.reconcile(intent.id, true)).rejects.toThrow(
      /10 seconds/,
    );
    await stripe.reconcile(intent.id); // Webhooks bypass UI polling cooldown.
    now += 10001;
    await stripe.reconcile(intent.id, true);
    expect(await ledgerCount()).toBe(1);
    await expect(stripe.create(input())).rejects.toThrow(/not enabled/);
  });
  it("requires workspace auth for creation while accepting only signed raw webhooks on the exact exemption", async () => {
    const old = config.token;
    config.token = "fixture-token";
    try {
      const app = createApp(
        store,
        undefined,
        undefined,
        undefined,
        funding,
        stripe,
      );
      expect(
        (await request(app).post("/api/account/funding/stripe").send(input()))
          .status,
      ).toBe(401);
      expect(
        (await request(app).post("/api/webhooks/stripe/other").send({})).status,
      ).toBe(401);
      expect(
        (await request(app).post("/api/webhooks/stripe").send({})).status,
      ).toBe(400);
      expect(
        (
          await request(app)
            .post("/api/account/funding/stripe")
            .set("Authorization", "Bearer fixture-token")
            .set("Origin", "https://evil.example")
            .send(input())
        ).status,
      ).toBe(403);
      const intent = (
        await request(app)
          .post("/api/account/funding/stripe")
          .set("Authorization", "Bearer fixture-token")
          .send(input())
      ).body;
      const event = gateway.signed(
        "checkout.session.completed",
        gateway.pay(intent.checkoutSessionId),
      );
      const response = await request(app)
        .post("/api/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("stripe-signature", event.signature)
        .send(event.payload.toString());
      expect(response.status).toBe(200);
      expect(await funding.ledger.balance()).toBe(10000000);
      expect(JSON.stringify(response.body)).not.toContain("sk_test_");
    } finally {
      config.token = old;
    }
  });
});
