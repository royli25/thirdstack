import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config } from "../server/config";
import {
  beginBackupSnapshot,
  databaseSnapshot,
} from "../server/backup-evidence";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { ProviderError } from "../server/providers";
import {
  shadowWalletCredentialDigest,
  shadowWalletPrice,
} from "../server/shadow-wallet";
import { Store } from "../server/store";
import { FundingService } from "../server/funding";
import { StripeFundingService } from "../server/stripe-funding";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";
import { grantFixtureAllowance } from "./fixtures/allowance";

it("calculates fixed 10% markup in integer micros and rounds the hold up", () => {
  expect(shadowWalletPrice(7000)).toEqual({
    markupBps: 1000,
    markupMicros: 700,
    totalMicros: 7700,
    maximumMicros: 7700,
  });
  expect(shadowWalletPrice(4)).toMatchObject({
    markupMicros: 0,
    totalMicros: 4,
    maximumMicros: 5,
  });
  expect(shadowWalletPrice(5)).toMatchObject({
    markupMicros: 1,
    totalMicros: 6,
    maximumMicros: 6,
  });
  expect(shadowWalletPrice(0)).toMatchObject({
    totalMicros: 0,
    maximumMicros: 0,
  });
  for (const invalid of [-1, 0.1, NaN, Infinity, 10_000_001])
    expect(() => shadowWalletPrice(invalid)).toThrow();
});

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const hosted = url ? describe : describe.skip;
const fixtureKey = "isolated-shadow-wallet-tavily";
const providerAccount = "fixture-tavily-account";
const intent = {
  title: "Shadow wallet fixture",
  objective: "Test accounting against a fake provider transport",
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
  statedReason: "Test fixed-cost accounting",
  requestKey,
  ...extra,
});

hosted("hosted shadow wallet", () => {
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
  async function fund(micros = 7700) {
    await db.pool.query(
      "INSERT INTO octolab.shadow_wallet_journal (workspace_id,source_id,kind,wallet_micros) VALUES ($1,$2,'seed',$3)",
      [workspace, randomUUID(), micros],
    );
  }
  async function debitRows() {
    return await db
      .prepare(
        "SELECT source_id,wallet_micros,clearing_micros FROM shadow_wallet_journal WHERE kind='usage' ORDER BY created_at",
      )
      .all();
  }
  async function holds() {
    return await db
      .prepare("SELECT * FROM shadow_wallet_holds ORDER BY created_at")
      .all();
  }
  async function closures() {
    return await db
      .prepare(
        "SELECT call_id,outcome,provider_request_id FROM shadow_wallet_closures ORDER BY created_at",
      )
      .all();
  }
  async function session(id = keyId) {
    return (await asKey(() => obs.createAgentSession(intent, id), id)).id;
  }
  function run(sessionId: string, input: ReturnType<typeof call>, id = keyId) {
    return asKey(() => obs.execute(sessionId, input, id), id);
  }

  beforeEach(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw new Error("Disposable loopback database required.");
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "true");
    vi.stubEnv("TAVILY_ACCOUNT_REFERENCE", providerAccount);
    config.keys.tavily = fixtureKey;
    workspace = randomUUID();
    store = new Store(":unused:", url!, workspace);
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated shadow wallet fixture')",
      [workspace],
    );
    await db.pool.query(
      `INSERT INTO octolab.shadow_wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at)
       VALUES ($1,'fixture-v1',$2,$3,7000,now()-interval '1 hour',now()+interval '1 hour')`,
      [workspace, providerAccount, shadowWalletCredentialDigest(fixtureKey)],
    );
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

  it("freezes a verified rate and atomically posts once for a replayable, zero-result call", async () => {
    await fund();
    search.mockImplementationOnce(async () => {
      await db.pool.query(
        "UPDATE octolab.shadow_wallet_rates SET rate_version='fixture-v2',provider_cost_micros=11000 WHERE workspace_id=$1",
        [workspace],
      );
      return result;
    });
    const id = await session();
    const input = call();
    const receipt = await run(id, input);
    expect(receipt.status).toBe("succeeded");
    expect(await run(id, input)).toMatchObject({
      id: receipt.id,
      replayed: true,
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(await holds()).toMatchObject([
      {
        call_id: receipt.id,
        key_id: keyId,
        rate_version: "fixture-v1",
        maximum_micros: "7700",
        admitted: true,
      },
    ]);
    expect(await closures()).toMatchObject([
      {
        call_id: receipt.id,
        outcome: "posted",
        provider_request_id: result.requestId,
      },
    ]);
    expect(await debitRows()).toEqual([
      {
        source_id: receipt.id,
        wallet_micros: "-7700",
        clearing_micros: "7700",
      },
    ]);
    await obs.db.remove(id);
    expect(await debitRows()).toHaveLength(1);
  });

  it("rejects altered usage amounts and detects missing postings in backup evidence", async () => {
    await fund();
    const id = await session();
    const receipt = await run(id, call());
    await expect(
      db
        .prepare("DELETE FROM shadow_wallet_journal WHERE source_id=?")
        .run(receipt.id),
    ).rejects.toThrow(/permission denied/);
    await expect(
      db.pool.query(
        "UPDATE octolab.shadow_wallet_journal SET wallet_micros=-1 WHERE workspace_id=$1 AND source_id=$2",
        [workspace, receipt.id],
      ),
    ).rejects.toThrow(/foreign key/);
    const backup = async () => {
      const client = await db.pool.connect();
      try {
        await beginBackupSnapshot(client);
        return (await databaseSnapshot(client)).shadowWalletValid;
      } finally {
        await client.query("ROLLBACK");
        client.release();
      }
    };
    expect(await backup()).toBe(true);
    await db.pool.query(
      "DELETE FROM octolab.shadow_wallet_journal WHERE workspace_id=$1 AND source_id=$2",
      [workspace, receipt.id],
    );
    try {
      expect(await backup()).toBe(false);
    } finally {
      await db.pool.query(
        "INSERT INTO octolab.shadow_wallet_journal (workspace_id,source_id,kind,wallet_micros) VALUES ($1,$2,'usage',-7700)",
        [workspace, receipt.id],
      );
    }
  });

  it("serializes two keys across the shared shadow balance without denying current execution", async () => {
    await fund();
    const secondKey = await issueKey();
    const ids = await Promise.all([session(), session(secondKey)]);
    const receipts = await Promise.all([
      run(ids[0], call()),
      run(ids[1], call(), secondKey),
    ]);
    expect(receipts.map((r) => r.status)).toEqual(["succeeded", "succeeded"]);
    expect((await holds()).map((h) => h.admitted).sort()).toEqual([
      false,
      true,
    ]);
    expect(await debitRows()).toHaveLength(1);
  });

  it("releases failed calls, detects a conflicting reported quantity and permits the next correct call", async () => {
    await fund();
    search.mockRejectedValueOnce(new ProviderError("http", 503));
    search.mockResolvedValueOnce({
      ...result,
      usage: { ...result.usage, credits: 2 },
    });
    const id = await session();
    expect((await run(id, call())).status).toBe("failed");
    expect((await run(id, call())).status).toBe("succeeded");
    expect(await debitRows()).toHaveLength(0);
    expect((await run(id, call())).status).toBe("succeeded");
    expect((await closures()).map((r) => r.outcome)).toEqual([
      "failed",
      "cost_conflict",
      "posted",
    ]);
    expect(await debitRows()).toHaveLength(1);
  });

  it("covers server-routed calls through the same receipt and charge path", async () => {
    await fund();
    const id = await session();
    const input = {
      requestKey: randomUUID(),
      need: "Search for supporting sources with excerpts",
      operation: {
        operation: "search" as const,
        query: "fixture",
        maxResults: 10,
      },
    };
    const first = await asKey(() => obs.route(id, input, keyId));
    expect(first.call).toMatchObject({
      status: "succeeded",
      tool: "tavily_search",
      selectedBy: "server_route",
    });
    expect(await asKey(() => obs.route(id, input, keyId))).toMatchObject({
      replayed: true,
    });
    expect(search).toHaveBeenCalledTimes(1);
    expect(await debitRows()).toHaveLength(1);
  });

  it("mirrors signed sandbox funding once, then posts call usage and verified reversals", async () => {
    vi.stubEnv("TWO_HANDS_SHADOW_STRIPE_SANDBOX", "false");
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
    const old = await stripe.create({ requestKey: randomUUID(), amount: "5" });
    vi.stubEnv("TWO_HANDS_SHADOW_STRIPE_SANDBOX", "true");
    const payment = await stripe.create({
      requestKey: randomUUID(),
      amount: "5",
    });
    const entries = () =>
      db
        .prepare(
          "SELECT deposit_id,kind,wallet_micros,target_micros FROM shadow_wallet_sandbox_entries ORDER BY revision",
        )
        .all();
    const oldEvent = gateway.signed(
      "checkout.session.completed",
      gateway.pay(old.checkoutSessionId!),
    );
    await stripe.webhook(oldEvent.payload, oldEvent.signature);
    expect(await entries()).toEqual([]);
    const paid = gateway.pay(payment.checkoutSessionId!);
    const signed = gateway.signed("checkout.session.completed", paid);
    await expect(stripe.webhook(signed.payload, "invalid")).rejects.toThrow(
      /signature/,
    );
    expect(await entries()).toEqual([]);
    const live = gateway.signed("checkout.session.completed", paid, undefined, {
      livemode: true,
    });
    await expect(stripe.webhook(live.payload, live.signature)).rejects.toThrow(
      /test-mode/,
    );
    await stripe.webhook(signed.payload, signed.signature);
    await stripe.webhook(signed.payload, signed.signature);
    expect(await entries()).toEqual([
      {
        deposit_id: payment.id,
        kind: "deposit",
        wallet_micros: "5000000",
        target_micros: "5000000",
      },
    ]);
    const id = await session();
    const receipt = await run(id, call());
    expect(receipt.status).toBe("succeeded");
    expect(await debitRows()).toHaveLength(1);
    vi.stubEnv("TWO_HANDS_SHADOW_STRIPE_SANDBOX", "false");
    const partial = gateway.pay(payment.checkoutSessionId!, 100);
    const refund = gateway.signed(
      "charge.refunded",
      partial.payment_intent.latest_charge,
    );
    await stripe.webhook(refund.payload, refund.signature);
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
    expect(await funding.ledger.balance()).toBe(5_000_000);
    expect((await run(id, call())).status).toBe("succeeded");
    expect((await holds()).map((row) => row.admitted)).toEqual([true, false]);
    expect(await debitRows()).toHaveLength(1);
    // A conservative dispute freeze applies even if other simulated funds are available.
    await fund();
    expect((await run(id, call())).status).toBe("succeeded");
    expect((await holds()).map((row) => row.admitted)).toEqual([
      true,
      false,
      false,
    ]);
    expect(await debitRows()).toHaveLength(1);
    const client = await db.pool.connect();
    try {
      await beginBackupSnapshot(client);
      expect((await databaseSnapshot(client)).shadowWalletValid).toBe(true);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });

  it("releases interrupted calls on recovery even when the feature was turned off", async () => {
    await fund();
    const id = await session();
    let finish!: (value: typeof result) => void;
    let dispatched!: () => void;
    const didDispatch = new Promise<void>((resolve) => {
      dispatched = resolve;
    });
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
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "false");
    await obs.db.recover();
    await obs.db.recover();
    expect(await run(id, input)).toMatchObject({
      status: "interrupted",
      replayed: true,
    });
    expect(await closures()).toMatchObject([{ outcome: "interrupted" }]);
    expect(await debitRows()).toHaveLength(0);
    // Recovery runs with sole runtime ownership in production. Releasing the
    // test transport models a late result and ensures it cannot post a debit.
    finish(result);
    expect(await inFlight).toMatchObject({
      status: "interrupted",
      replayed: true,
    });
    expect(await run(id, input)).toMatchObject({
      status: "interrupted",
      replayed: true,
    });
    expect(await debitRows()).toHaveLength(0);
  });

  it("leaves disabled, advanced, changed-credential, and other account calls outside shadow accounting", async () => {
    await fund();
    const id = await session();
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "false");
    await run(id, call());
    vi.stubEnv("TWO_HANDS_SHADOW_WALLET", "true");
    await run(id, call(randomUUID(), { searchDepth: "advanced" }));
    config.keys.tavily = "rotated-fixture-secret";
    await run(id, call());
    expect(await holds()).toHaveLength(0);
    config.keys.tavily = fixtureKey;
    await run(id, call());
    const neighbor = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Neighbor shadow fixture')",
      [neighbor],
    );
    await store.scope.run(neighbor, async () => {
      expect(await holds()).toHaveLength(0);
      expect(await debitRows()).toHaveLength(0);
      await expect(
        db
          .prepare(
            "INSERT INTO shadow_wallet_journal(source_id,kind,wallet_micros) VALUES (?,'seed',100)",
          )
          .run(randomUUID()),
      ).rejects.toThrow(/row-level security/);
    });
  });
});
