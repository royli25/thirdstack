import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AllowanceError } from "../server/account-allowance";
import {
  beginBackupSnapshot,
  databaseSnapshot,
} from "../server/backup-evidence";
import { config } from "../server/config";
import { PostgresDatabase } from "../server/database";
import { FundingService } from "../server/funding";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { observationRoutes } from "../server/observation-api";
import { ProviderError } from "../server/providers";
import { Store } from "../server/store";
import { StripeFundingService } from "../server/stripe-funding";
import {
  Wallet,
  WalletError,
  walletCredentialDigest,
  walletEnforcementEnabled,
} from "../server/wallet";
import { holdOutcome } from "../server/wallet-rules";
import { grantFixtureAllowance } from "./fixtures/allowance";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";

it("keeps wallet enforcement off unless explicitly enabled", () => {
  vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "");
  expect(walletEnforcementEnabled()).toBe(false);
  vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "1");
  expect(walletEnforcementEnabled()).toBe(false);
  vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
  expect(walletEnforcementEnabled()).toBe(true);
  vi.unstubAllEnvs();
});

it("touches no wallet table on a schema that predates the wallet migration", async () => {
  const queries: string[] = [];
  const store = {
    db: {
      dialect: "postgres",
      prepare(sql: string) {
        queries.push(sql);
        const row = { installed: false };
        return {
          get: async () => row,
          all: async () => [row],
          run: async () => ({ changes: 0 }),
        };
      },
    },
  } as unknown as Store;
  const fixture = {
    id: "call",
    tool: "tavily_search",
    arguments: {},
    providerAccountReference: "fixture",
    adapter: { version: "1.0.0" },
    status: "interrupted",
  } as unknown as Parameters<Wallet["close"]>[0];
  for (const flag of ["false", "true"]) {
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", flag);
    const wallet = new Wallet(store);
    expect(await wallet.admit(fixture, "fixture")).toBe(false);
    await wallet.close(fixture);
    await wallet.enrollDeposit("deposit");
    await wallet.reconcileDeposit(
      "deposit",
      "pi_fixture",
      5_000_000,
      false,
      true,
    );
    expect(await wallet.status()).toMatchObject({
      enforced: false,
      active: false,
      availableMicros: 0,
    });
  }
  vi.unstubAllEnvs();
  expect(queries.length).toBeGreaterThan(0);
  expect(queries.every((sql) => /to_regclass/.test(sql))).toBe(true);
  expect(queries.join(" ")).not.toMatch(/FROM wallet_|INTO wallet_/);
});

it("never passes a malformed reported quantity to storage", () => {
  const settle = (credits: unknown) =>
    holdOutcome({
      status: "succeeded",
      result: { usage: { credits }, requestId: "r".repeat(300) },
    } as unknown as Parameters<typeof holdOutcome>[0]);
  expect(settle(1)).toMatchObject({ outcome: "posted", reportedCredits: 1 });
  expect(settle(undefined)).toMatchObject({
    outcome: "posted",
    reportedCredits: null,
  });
  expect(settle(2)).toMatchObject({
    outcome: "cost_conflict",
    reportedCredits: 2,
  });
  for (const bad of [-1, NaN, Infinity, "1", null, {}])
    expect(settle(bad)).toMatchObject({
      outcome: "cost_conflict",
      reportedCredits: null,
    });
  expect(settle(1).providerRequestId).toHaveLength(200);
});

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const hosted = url ? describe : describe.skip;
const fixtureKey = "isolated-wallet-tavily";
const providerAccount = "fixture-tavily-account";
const intent = {
  title: "Wallet fixture",
  objective: "Test prepaid credits against a fake provider transport",
  criteria: [{ text: "Capture request", weight: 1 }],
};
const result = {
  sources: [],
  httpStatus: 200,
  requestId: "fixture-provider-receipt",
  usage: { source: "fixture", credits: 1 },
};
const call = (requestKey = randomUUID(), extra = {}) => ({
  tool: "tavily_search",
  query: "isolated fixture",
  statedReason: "Test prepaid admission",
  requestKey,
  ...extra,
});

hosted("hosted wallet enforcement", () => {
  let store: Store;
  let db: PostgresDatabase;
  let obs: Observatory;
  let search: ReturnType<typeof vi.fn<() => Promise<typeof result>>>;
  let workspace: string;
  let keyId: string;
  const original = { ...config.keys };

  function asKey<T>(action: () => Promise<T>, id = keyId) {
    return store.actorScope.run({ kind: "api_key", id }, action);
  }
  async function issueKey() {
    return (
      await obs.db.apiKeys.create({
        name: "Fixture key",
        requestKey: randomUUID(),
        scopes: ["tools:discover", "tools:execute", "research:write"],
        allowedTools: ["tavily_search"],
        limitUsd: "1",
      })
    ).key.id;
  }
  /** Operator-side fixture credit; the runtime role cannot post adjustments. */
  async function fund(micros = 7700, target = workspace) {
    await db.pool.query(
      "INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,reference,wallet_micros,mode) VALUES ($1,$2,'adjustment','isolated fixture credit',$3,'test')",
      [target, randomUUID(), micros],
    );
  }
  async function setRate(costMicros: number) {
    await db.pool.query(
      `INSERT INTO octolab.wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at)
       VALUES ($1,$2,$3,$4,$5,now()-interval '1 hour',now()+interval '1 hour')
       ON CONFLICT (workspace_id) DO UPDATE
         SET rate_version=EXCLUDED.rate_version, provider_cost_micros=EXCLUDED.provider_cost_micros`,
      [
        workspace,
        `fixture-${costMicros}`,
        providerAccount,
        walletCredentialDigest(fixtureKey),
        costMicros,
      ],
    );
  }
  const debits = () =>
    db
      .prepare(
        "SELECT source_id,wallet_micros,clearing_micros FROM wallet_journal WHERE kind='usage' ORDER BY created_at",
      )
      .all();
  const holds = () =>
    db
      .prepare(
        "SELECT call_id,key_id,rate_version,maximum_micros,total_micros FROM wallet_holds ORDER BY created_at",
      )
      .all();
  const outcomes = async () =>
    (
      await db
        .prepare("SELECT outcome FROM wallet_hold_closures ORDER BY created_at")
        .all()
    ).map((row) => row.outcome);
  const status = () => store.db.read(() => new Wallet(store).status());
  async function session(id = keyId) {
    return (await asKey(() => obs.createAgentSession(intent, id), id)).id;
  }
  function run(sessionId: string, input: ReturnType<typeof call>, id = keyId) {
    return asKey(() => obs.execute(sessionId, input, id), id);
  }
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

  beforeEach(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw new Error("Disposable loopback database required.");
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "false");
    vi.stubEnv("TAVILY_ACCOUNT_REFERENCE", providerAccount);
    config.keys.tavily = fixtureKey;
    workspace = randomUUID();
    store = new Store(":unused:", url!, workspace);
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated wallet fixture')",
      [workspace],
    );
    await setRate(7000);
    await grantFixtureAllowance(store);
    search = vi.fn(async () => result);
    obs = new Observatory(store, {
      search,
      scrape: async () => {
        throw new Error("Unexpected extract transport");
      },
    });
    await obs.ready;
    keyId = await issueKey();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    Object.assign(config.keys, original);
    if (store) await store.close();
  });

  it("leaves admission unchanged while the flag is off", async () => {
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    const id = await session();
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await holds()).toEqual([]);
    expect(await status()).toMatchObject({
      enforced: false,
      active: false,
      postedMicros: 0,
    });
  });

  it("denies before dispatch with a structured response and reserves nothing", async () => {
    await fund(7699);
    const id = await session();
    const before = await store.allowance.status();
    const denied = await run(id, call()).catch((error) => error);
    expect(denied).toBeInstanceOf(WalletError);
    expect(denied).toMatchObject({
      code: "insufficient_credits",
      status: 402,
      wallet: {
        reason: "insufficient_balance",
        requiredMicros: 7700,
        availableMicros: 7699,
        heldMicros: 0,
      },
    });
    expect(search).not.toHaveBeenCalled();
    expect(await holds()).toEqual([]);
    expect(await obs.db.calls(id)).toEqual([]);
    expect(await store.allowance.status()).toMatchObject({
      reservedMicros: before.reservedMicros,
      spentMicros: before.spentMicros,
    });

    const app = express();
    app.use(express.json());
    app.use((_req, res, next) =>
      store.actorScope.run({ kind: "api_key", id: keyId }, () => {
        res.locals.apiKeyId = keyId;
        next();
      }),
    );
    observationRoutes(app, obs);
    const response = await request(app)
      .post(`/api/observations/${id}/call`)
      .send(call());
    expect(response.status).toBe(402);
    expect(response.body).toMatchObject({
      code: "insufficient_credits",
      wallet: { requiredMicros: 7700, availableMicros: 7699 },
    });
    expect(response.body.error).toMatch(
      /\$0\.0077 of credits available and a paid tool call needs \$0\.0077/,
    );
    expect(response.body.ownerAction).toEqual({
      action: "add_credits",
      message: expect.stringMatching(/account owner can add credits/),
    });
    expect(search).not.toHaveBeenCalled();
  });

  it("holds the maximum, debits the frozen cost plus 10% once, and replays after a lost response", async () => {
    await fund(20_000_000);
    let during: Awaited<ReturnType<typeof status>> | undefined;
    search.mockImplementationOnce(async () => {
      during = await status();
      // A rate change after admission affects new calls only.
      await setRate(11000);
      return result;
    });
    const id = await session();
    const input = call();
    const receipt = await run(id, input);
    expect(receipt.status).toBe("succeeded");
    expect(during).toMatchObject({
      enforced: true,
      heldMicros: 7700,
      availableMicros: 20_000_000 - 7700,
      chargedMicros: 0,
    });
    // The first response was lost: the same request key returns the saved call.
    for (let i = 0; i < 2; i++)
      expect(await run(id, input)).toMatchObject({
        id: receipt.id,
        status: "succeeded",
        replayed: true,
      });
    await expect(
      run(id, { ...input, query: "changed payload" }),
    ).rejects.toThrow(/different arguments/);
    expect(search).toHaveBeenCalledTimes(1);
    expect(await holds()).toMatchObject([
      {
        call_id: receipt.id,
        key_id: keyId,
        rate_version: "fixture-7000",
        maximum_micros: "7700",
        total_micros: "7700",
      },
    ]);
    expect(await debits()).toEqual([
      {
        source_id: receipt.id,
        wallet_micros: "-7700",
        clearing_micros: "7700",
      },
    ]);
    expect(await status()).toMatchObject({
      postedMicros: 19_992_300,
      heldMicros: 0,
      availableMicros: 19_992_300,
      chargedMicros: 7700,
    });
    expect((await run(id, call())).status).toBe("succeeded");
    expect((await debits()).map((row) => row.wallet_micros)).toEqual([
      "-7700",
      "-12100",
    ]);
    // Financial evidence outlives research retention.
    await obs.db.remove(id);
    expect(await debits()).toHaveLength(2);
    expect(await walletValid()).toBe(true);
  });

  it("serializes concurrent holds from two keys against one balance", async () => {
    await fund(7700);
    const secondKey = await issueKey();
    const ids = await Promise.all([session(), session(secondKey)]);
    const settled = await Promise.allSettled([
      run(ids[0], call()),
      run(ids[1], call(), secondKey),
    ]);
    const admitted = settled.filter((r) => r.status === "fulfilled");
    const refused = settled.filter((r) => r.status === "rejected");
    expect(admitted).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(refused[0].reason).toBeInstanceOf(WalletError);
    expect(search).toHaveBeenCalledTimes(1);
    expect(await debits()).toHaveLength(1);
    expect(await status()).toMatchObject({
      postedMicros: 0,
      heldMicros: 0,
      availableMicros: 0,
    });
  });

  it("counts an in-flight hold from another key against available credits", async () => {
    await fund(7700);
    const secondKey = await issueKey();
    const ids = [await session(), await session(secondKey)];
    let finish!: (value: typeof result) => void;
    let dispatched!: () => void;
    const didDispatch = new Promise<void>((resolve) => (dispatched = resolve));
    search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
          dispatched();
        }),
    );
    const inFlight = run(ids[0], call());
    await didDispatch;
    await expect(run(ids[1], call(), secondKey)).rejects.toMatchObject({
      code: "insufficient_credits",
      wallet: { availableMicros: 0, heldMicros: 7700 },
    });
    finish({ ...result, usage: { ...result.usage, credits: 2 } });
    // A contradictory reported quantity releases the hold at zero charge.
    expect((await inFlight).status).toBe("succeeded");
    expect(await outcomes()).toEqual(["cost_conflict"]);
    expect(await debits()).toEqual([]);
    expect((await run(ids[1], call(), secondKey)).status).toBe("succeeded");
    expect(await debits()).toHaveLength(1);
  });

  it("releases the hold and charges zero when the provider call fails", async () => {
    await fund(7700);
    search.mockRejectedValueOnce(new ProviderError("http", 503));
    const id = await session();
    const failed = call();
    expect((await run(id, failed)).status).toBe("failed");
    expect(await run(id, failed)).toMatchObject({
      status: "failed",
      replayed: true,
    });
    expect(await outcomes()).toEqual(["failed"]);
    expect(await debits()).toEqual([]);
    expect(await status()).toMatchObject({
      heldMicros: 0,
      availableMicros: 7700,
      chargedMicros: 0,
    });
    // The released credits cover the next call.
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await outcomes()).toEqual(["failed", "posted"]);
    expect(await status()).toMatchObject({ availableMicros: 0 });
  });

  it("releases interrupted calls on recovery and blocks a late debit", async () => {
    await fund(7700);
    const id = await session();
    let finish!: (value: typeof result) => void;
    let dispatched!: () => void;
    const didDispatch = new Promise<void>((resolve) => (dispatched = resolve));
    search.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
          dispatched();
        }),
    );
    const input = call();
    const inFlight = run(id, input);
    await didDispatch;
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    await obs.db.recover();
    await obs.db.recover();
    expect(await outcomes()).toEqual(["interrupted"]);
    finish(result);
    expect(await inFlight).toMatchObject({
      status: "interrupted",
      replayed: true,
    });
    expect(await debits()).toEqual([]);
    expect(await status()).toMatchObject({
      heldMicros: 0,
      availableMicros: 7700,
    });
    expect(await walletValid()).toBe(true);
  });

  it("handles zero-cost and sub-cent rates in integer micros", async () => {
    const id = await session();
    await setRate(0);
    // A verified cost of zero needs no credits and posts a zero charge.
    const free = await run(id, call());
    expect(free.status).toBe("succeeded");
    expect(await debits()).toMatchObject([
      { source_id: free.id, wallet_micros: "0" },
    ]);

    // 4 micros: markup rounds to 0, the hold rounds up to 5.
    await setRate(4);
    await fund(4);
    await expect(run(id, call())).rejects.toMatchObject({
      wallet: { requiredMicros: 5, availableMicros: 4 },
    });
    await fund(1);
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await status()).toMatchObject({
      postedMicros: 1,
      heldMicros: 0,
      chargedMicros: 4,
    });

    // 5 micros: the half-micro markup rounds up, charge and hold are both 6.
    await setRate(5);
    await fund(5);
    expect((await run(id, call())).status).toBe("succeeded");
    expect((await debits()).map((row) => row.wallet_micros)).toEqual([
      "0",
      "-4",
      "-6",
    ]);
    expect(await status()).toMatchObject({
      postedMicros: 0,
      chargedMicros: 10,
    });
    expect(
      (await holds()).map((row) => [row.total_micros, row.maximum_micros]),
    ).toEqual([
      ["0", "0"],
      ["4", "5"],
      ["6", "6"],
    ]);
  });

  it("feeds verified sandbox deposits once and lets refunds and disputes reduce available credits", async () => {
    const gateway = new FixtureStripeGateway();
    const funding = new FundingService(store, {
      enabled: false,
      recipient: "",
      rpcUrl: "https://fixture.invalid",
    });
    const stripe = new StripeFundingService(
      funding,
      fixtureStripeSettings,
      gateway,
    );
    // A payment verified before enforcement is never backfilled, even when
    // its events are replayed or it is checked again later.
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    const old = await stripe.create({ requestKey: randomUUID(), amount: "5" });
    const oldPaid = gateway.signed(
      "checkout.session.completed",
      gateway.pay(old.checkoutSessionId!),
    );
    await stripe.webhook(oldPaid.payload, oldPaid.signature);
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
    await stripe.reconcile(old.id);
    const payment = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    const entries = () =>
      db
        .prepare(
          "SELECT source_id,kind,wallet_micros,target_micros FROM wallet_journal WHERE deposit_id IS NOT NULL ORDER BY revision",
        )
        .all();
    const oldEvent = gateway.signed(
      "checkout.session.completed",
      gateway.pay(old.checkoutSessionId!),
    );
    await stripe.webhook(oldEvent.payload, oldEvent.signature);
    expect(await entries()).toEqual([]);
    expect(await funding.ledger.balance()).toBe(5_000_000);
    const id = await session();
    await expect(run(id, call())).rejects.toBeInstanceOf(WalletError);

    const paid = gateway.pay(payment.checkoutSessionId!);
    const signed = gateway.signed("checkout.session.completed", paid);
    await expect(stripe.webhook(signed.payload, "invalid")).rejects.toThrow(
      /signature/,
    );
    const live = gateway.signed("checkout.session.completed", paid, undefined, {
      livemode: true,
    });
    await expect(stripe.webhook(live.payload, live.signature)).rejects.toThrow(
      /test-mode/,
    );
    expect(await entries()).toEqual([]);
    await stripe.webhook(signed.payload, signed.signature);
    await stripe.webhook(signed.payload, signed.signature);
    await stripe.reconcile(payment.id);
    expect(await entries()).toEqual([
      {
        source_id: payment.id,
        kind: "deposit",
        wallet_micros: "5000000",
        target_micros: "5000000",
      },
    ]);
    expect((await stripe.summary()).wallet).toMatchObject({
      enforced: true,
      availableMicros: 5_000_000,
      frozen: false,
    });
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await status()).toMatchObject({ availableMicros: 4_992_300 });

    const partial = gateway.pay(payment.checkoutSessionId!, 100);
    const refund = gateway.signed(
      "charge.refunded",
      partial.payment_intent.latest_charge,
    );
    await stripe.webhook(refund.payload, refund.signature);
    await stripe.webhook(refund.payload, refund.signature);
    expect(await status()).toMatchObject({
      postedMicros: 3_992_300,
      availableMicros: 3_992_300,
      frozen: false,
    });
    expect((await run(id, call())).status).toBe("succeeded");

    const disputed = gateway.pay(payment.checkoutSessionId!, 100, true);
    const dispute = gateway.signed(
      "charge.dispute.created",
      disputed.payment_intent.latest_charge,
    );
    await stripe.webhook(dispute.payload, dispute.signature);
    expect(await entries()).toMatchObject([
      { kind: "deposit", wallet_micros: "5000000", target_micros: "5000000" },
      { kind: "refund", wallet_micros: "-1000000", target_micros: "4000000" },
      { kind: "dispute_hold", wallet_micros: "-4000000", target_micros: "0" },
    ]);
    // The reversal exceeds unused credits: the shortfall stays on the ledger.
    expect(await status()).toMatchObject({
      postedMicros: -15_400,
      availableMicros: 0,
      chargedMicros: 15_400,
      frozen: true,
    });
    await expect(run(id, call())).rejects.toMatchObject({
      code: "insufficient_credits",
      wallet: { reason: "dispute_hold" },
    });
    // An unresolved dispute freezes paid admission even with other credits.
    await fund(1_000_000);
    await expect(run(id, call())).rejects.toMatchObject({
      wallet: { reason: "dispute_hold" },
    });
    expect(search).toHaveBeenCalledTimes(2);
    expect(await debits()).toHaveLength(2);
    expect(await walletValid()).toBe(true);
    // An operator release posting lifts the freeze.
    await db.pool.query(
      "INSERT INTO octolab.wallet_journal (workspace_id,source_id,revision,kind,reference,wallet_micros,mode) VALUES ($1,$2,4,'dispute_release','fixture review',0,'test')",
      [workspace, payment.id],
    );
    // A hold released by hand is not posted again by a later verification.
    await stripe.reconcile(payment.id);
    expect((await entries()).map((entry) => entry.kind)).toEqual([
      "deposit",
      "refund",
      "dispute_hold",
      "dispute_release",
    ]);
    expect(await status()).toMatchObject({ frozen: false });
    expect(await walletValid()).toBe(true);
    expect((await run(id, call())).status).toBe("succeeded");
  });

  it("funds and freezes from a checkout prepared before enrollment but first paid under enforcement", async () => {
    const gateway = new FixtureStripeGateway();
    const stripe = new StripeFundingService(
      new FundingService(store, {
        enabled: false,
        recipient: "",
        rpcUrl: "https://fixture.invalid",
      }),
      fixtureStripeSettings,
      gateway,
    );
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    const prepared = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "true");
    const paid = gateway.signed(
      "checkout.session.completed",
      gateway.pay(prepared.checkoutSessionId!),
    );
    await stripe.webhook(paid.payload, paid.signature);
    await stripe.webhook(paid.payload, paid.signature);
    expect(await status()).toMatchObject({
      postedMicros: 5_000_000,
      frozen: false,
    });
    const disputed = gateway.pay(prepared.checkoutSessionId!, 0, true);
    const dispute = gateway.signed(
      "charge.dispute.created",
      disputed.payment_intent.latest_charge,
    );
    await stripe.webhook(dispute.payload, dispute.signature);
    expect(await status()).toMatchObject({ postedMicros: 0, frozen: true });
    await expect(run(await session(), call())).rejects.toMatchObject({
      wallet: { reason: "dispute_hold" },
    });
  });

  it("releases at zero charge when the provider reports a malformed credit quantity", async () => {
    await fund(20_000_000);
    const id = await session();
    for (const credits of [-1, Number.NaN, Number.POSITIVE_INFINITY, "1"]) {
      search.mockResolvedValueOnce({
        ...result,
        usage: { ...result.usage, credits: credits as number },
      });
      // The adapter rejects most malformed usage; whatever reaches settlement
      // must close the hold instead of failing the transaction.
      expect(["succeeded", "failed"]).toContain((await run(id, call())).status);
    }
    for (const outcome of await outcomes())
      expect(["failed", "cost_conflict"]).toContain(outcome);
    expect(await outcomes()).toHaveLength(4);
    expect(await debits()).toEqual([]);
    expect(await status()).toMatchObject({
      heldMicros: 0,
      availableMicros: 20_000_000,
    });
  });

  it("keeps the balance visible while enforcement is paused", async () => {
    expect(await status()).toMatchObject({ enforced: true, active: false });
    await fund(20_000_000);
    await run(await session(), call());
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    expect(await status()).toMatchObject({
      enforced: false,
      active: true,
      availableMicros: 19_992_300,
      chargedMicros: 7700,
    });
  });

  it("keeps the operator allowance as a separate required control", async () => {
    await fund(20_000_000);
    const id = await session();
    const current = await store.allowance.status();
    await store.allowance.change(store.workspaceId, randomUUID(), {
      requestKey: randomUUID(),
      revision: current.revision,
      limitMicros: current.limitMicros,
      paused: true,
      reason: "Isolated fixture pause.",
    });
    await expect(run(id, call())).rejects.toBeInstanceOf(AllowanceError);
    expect(search).not.toHaveBeenCalled();
    expect(await holds()).toEqual([]);
    expect(await status()).toMatchObject({
      heldMicros: 0,
      availableMicros: 20_000_000,
    });
  });

  it("refuses unrated paid calls while credits are short and never charges them", async () => {
    const id = await session();
    const advanced = () => call(randomUUID(), { searchDepth: "advanced" });
    const nine = () => call(randomUUID(), { maxResults: 9 });
    for (const variant of [advanced, nine])
      await expect(run(id, variant())).rejects.toMatchObject({
        code: "insufficient_credits",
        status: 402,
        wallet: { reason: "insufficient_balance", requiredMicros: 7700 },
      });
    expect(search).not.toHaveBeenCalled();
    expect(await obs.db.calls(id)).toEqual([]);

    await fund(7700);
    for (const variant of [advanced, nine])
      expect((await run(id, variant())).status).toBe("succeeded");
    expect(await holds()).toEqual([]);
    expect(await debits()).toEqual([]);
    expect(await status()).toMatchObject({
      availableMicros: 7700,
      chargedMicros: 0,
    });

    // An account that is not enrolled is untouched by the wallet.
    await db.pool.query(
      "DELETE FROM octolab.wallet_rates WHERE workspace_id=$1",
      [workspace],
    );
    const neighborless = await session();
    expect((await run(neighborless, call())).status).toBe("succeeded");
    expect(await holds()).toEqual([]);
  });

  it("fails closed when the verified rate has lapsed or the credential rotated", async () => {
    await fund(20_000_000);
    const alert = vi.spyOn(console, "error").mockImplementation(() => {});
    const id = await session();
    const unbillable = {
      code: "billing_unavailable",
      status: 409,
      wallet: { reason: "rate_unverified" },
    };
    config.keys.tavily = "rotated-fixture-secret";
    await expect(run(id, call())).rejects.toMatchObject(unbillable);
    config.keys.tavily = fixtureKey;
    await db.pool.query(
      "UPDATE octolab.wallet_rates SET verified_at=now()-interval '2 hours', expires_at=now()-interval '1 hour' WHERE workspace_id=$1",
      [workspace],
    );
    await expect(run(id, call())).rejects.toMatchObject(unbillable);
    expect(await status()).toMatchObject({ enforced: true });
    expect(search).not.toHaveBeenCalled();
    expect(await holds()).toEqual([]);
    expect(await obs.db.calls(id)).toEqual([]);
    expect(alert).toHaveBeenCalledTimes(2);
    expect(alert.mock.calls[0][0]).toMatch(/re-verified/);
    expect(alert.mock.calls[0][0]).not.toContain(fixtureKey);
    alert.mockRestore();
    // Unrated paid calls still run, uncharged, while the rate is lapsed.
    expect(
      (await run(id, call(randomUUID(), { searchDepth: "advanced" }))).status,
    ).toBe("succeeded");
    await setRate(7000);
    await db.pool.query(
      "UPDATE octolab.wallet_rates SET verified_at=now()-interval '1 hour', expires_at=now()+interval '1 hour' WHERE workspace_id=$1",
      [workspace],
    );
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await debits()).toHaveLength(1);
  });

  it("isolates neighbouring accounts and restricts runtime postings", async () => {
    const neighbor = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Neighbor wallet fixture')",
      [neighbor],
    );
    // A funded neighbour cannot pay for this account's calls.
    await fund(20_000_000, neighbor);
    const id = await session();
    await expect(run(id, call())).rejects.toBeInstanceOf(WalletError);
    await fund(7700);
    const receipt = await run(id, call());
    expect(receipt.status).toBe("succeeded");

    await store.scope.run(neighbor, async () => {
      expect(await holds()).toEqual([]);
      expect(await debits()).toEqual([]);
      expect(await status()).toMatchObject({
        enforced: false,
        postedMicros: 20_000_000,
        heldMicros: 0,
        chargedMicros: 0,
      });
      await expect(
        db
          .prepare(
            "INSERT INTO wallet_journal(workspace_id,source_id,kind,wallet_micros,mode) VALUES (?,?,'usage',-7700,'test')",
          )
          .run(workspace, receipt.id),
      ).rejects.toThrow(/row-level security/);
      await expect(
        db
          .prepare(
            "UPDATE wallet_balances SET posted_micros=posted_micros+1 WHERE workspace_id=?",
          )
          .run(workspace),
      ).rejects.toThrow(/permission denied/);
    });
    expect(await status()).toMatchObject({
      postedMicros: 0,
      chargedMicros: 7700,
    });

    // The runtime role cannot mint credit, rewrite history or set rates, and
    // can only read the projection that admission trusts.
    await expect(
      db
        .prepare(
          "UPDATE wallet_balances SET posted_micros=posted_micros+1000000",
        )
        .run(),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db
        .prepare(
          "INSERT INTO wallet_balances(workspace_id,posted_micros) VALUES (?,1000000)",
        )
        .run(randomUUID()),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db
        .prepare(
          "INSERT INTO wallet_journal(source_id,kind,reference,wallet_micros,mode) VALUES (?,'adjustment','runtime',100,'test')",
        )
        .run(randomUUID()),
    ).rejects.toThrow(/row-level security/);
    await expect(
      db
        .prepare("DELETE FROM wallet_journal WHERE source_id=?")
        .run(receipt.id),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db
        .prepare("UPDATE wallet_journal SET wallet_micros=0 WHERE source_id=?")
        .run(receipt.id),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.prepare("UPDATE wallet_rates SET provider_cost_micros=0").run(),
    ).rejects.toThrow(/permission denied/);
    // A second debit for the same call or an altered amount cannot be stored.
    await expect(
      db.pool.query(
        "INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,wallet_micros,mode) VALUES ($1,$2,'usage',-7700,'test')",
        [workspace, receipt.id],
      ),
    ).rejects.toThrow(/duplicate key/);
    await expect(
      db.pool.query(
        "UPDATE octolab.wallet_journal SET wallet_micros=-1 WHERE workspace_id=$1 AND source_id=$2",
        [workspace, receipt.id],
      ),
    ).rejects.toThrow(/foreign key/);
  });

  it("detects projection drift and rebuilds balances from the journal", async () => {
    await fund(20_000_000);
    const id = await session();
    await run(id, call());
    expect(await walletValid()).toBe(true);
    await db.pool.query(
      "UPDATE octolab.wallet_balances SET posted_micros=posted_micros+5, held_micros=3 WHERE workspace_id=$1",
      [workspace],
    );
    expect(await walletValid()).toBe(false);
    await db.pool.query("SELECT octolab.wallet_rebuild_balances()");
    expect(await walletValid()).toBe(true);
    expect(await status()).toMatchObject({
      postedMicros: 19_992_300,
      heldMicros: 0,
    });
  });
});
