import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../server/app";
import { readActivity } from "../server/account-reads";
import { config } from "../server/config";
import { PostgresDatabase } from "../server/database";
import { FundingService } from "../server/funding";
import { bridgeConfiguration, createBridgeRequest } from "../server/mcp-bridge";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { observationRoutes } from "../server/observation-api";
import { ProviderError } from "../server/providers";
import { Store } from "../server/store";
import { StripeFundingService } from "../server/stripe-funding";
import {
  LOW_BALANCE_CALLS,
  Wallet,
  WalletError,
  walletCredentialDigest,
} from "../server/wallet";
import { WalletOperations } from "../server/wallet-operations";
import { microsToUsd, statementCsv } from "../server/wallet-statement";
import { grantFixtureAllowance } from "./fixtures/allowance";
import {
  FixtureStripeGateway,
  fixtureLiveStripeSettings,
  fixtureStripeSettings,
} from "./fixtures/stripe";

// Phase 4: what the account owner sees and can do about prepaid credits.
// Injected provider and Stripe fixtures only; never run against a hosted database.

describe("refusal wording", () => {
  const denial = (reason: "insufficient_balance" | "dispute_hold") =>
    new WalletError({
      reason,
      requiredMicros: 8800,
      availableMicros: 1200,
      heldMicros: 0,
    });
  it("says what happened, that nothing was charged, and what the account owner can do", () => {
    const short = denial("insufficient_balance");
    expect(short.message).toMatch(
      /\$0\.0012 of credits available and a paid tool call needs \$0\.0088/,
    );
    expect(short.message).toMatch(/Nothing was charged/);
    expect(short.message).toMatch(/account owner can add credits/);
    expect(short.message).toMatch(/Continue with free tools/);
    expect(short.ownerAction.action).toBe("add_credits");

    const frozen = denial("dispute_hold");
    expect(frozen.message).toMatch(/card payment is under review/);
    expect(frozen.ownerAction.action).toBe("wait_for_payment_review");

    const lapsed = new WalletError(
      {
        reason: "rate_unverified",
        requiredMicros: 8800,
        availableMicros: 5_000_000,
        heldMicros: 0,
      },
      "live",
      "private-rate-version-7",
    );
    expect(lapsed.code).toBe("billing_unavailable");
    expect(lapsed.ownerAction.action).toBe("none");
    expect(lapsed.message).toMatch(/Nothing is needed from the account owner/);
    // Operator configuration never reaches the caller.
    for (const error of [short, frozen, lapsed]) {
      expect(error.message.length).toBeLessThan(500);
      expect(
        JSON.stringify([error.message, error.wallet, error.ownerAction]),
      ).not.toMatch(
        /private-rate-version|rate_version|provider_account|digest/,
      );
    }
  });

  it("gives MCP hosts the owner guidance, and a fixed message from a remote server", async () => {
    const settings = bridgeConfiguration({
      APILAYER_URL: "http://127.0.0.1:3001/api",
    });
    const refusal = {
      error: "Paid tool access is currently unavailable for this account.",
      code: "operator_allowance_exceeded",
      ownerAction: {
        action: "contact_support",
        message:
          "Paid tools have not been turned on for this account yet. The account owner can ask Two Hands to turn them on.",
      },
    };
    const local = createBridgeRequest(settings, undefined, {
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json(refusal, { status: 403 })),
      exposeServerErrors: true,
    });
    await expect(local("/observations/x/call", {})).rejects.toThrow(
      /currently unavailable for this account\. Paid tools have not been turned on.*\[operator_allowance_exceeded\] HTTP 403/,
    );
    const remote = createBridgeRequest(settings, undefined, {
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          Response.json({ error: "PRIVATE REMOTE TEXT" }, { status: 402 }),
        ),
    });
    const failure = await remote("/observations/x/call", {}).catch((e) => e);
    expect(failure.message).toMatch(/prepaid credits do not cover/);
    expect(failure.message).toMatch(/account owner can add credits/);
    expect(failure.message).not.toContain("PRIVATE REMOTE TEXT");
  });
});

describe("statement file", () => {
  it("keeps exact micros, labels sandbox credits and cannot run as a formula", () => {
    expect(microsToUsd(-8800)).toBe("-0.008800");
    expect(microsToUsd(5_000_000)).toBe("5.000000");
    const csv = statementCsv({
      mode: "test",
      from: "2026-11-01T00:00:00.000Z",
      to: "2026-12-01T00:00:00.000Z",
      openingMicros: 0,
      closingMicros: 4_991_200,
      lines: [
        {
          at: "2026-11-17T10:00:00.000Z",
          kind: "deposit",
          reference: '=HYPERLINK("x"),pi_1',
          tool: null,
          providerCostMicros: null,
          markupMicros: null,
          micros: 5_000_000,
          balanceMicros: 5_000_000,
        },
        {
          at: "2026-11-17T10:05:00.000Z",
          kind: "usage",
          reference: "call-1",
          tool: "tavily_search",
          providerCostMicros: 8000,
          markupMicros: 800,
          micros: -8800,
          balanceMicros: 4_991_200,
        },
      ],
    });
    const rows = csv.trimEnd().split("\r\n");
    expect(rows).toHaveLength(5);
    expect(rows[1]).toMatch(/^2026-11-01T00:00:00.000Z,opening_balance,/);
    expect(rows[2]).toContain(`"'=HYPERLINK(""x""),pi_1"`);
    expect(rows[3]).toBe(
      "2026-11-17T10:05:00.000Z,usage,Tool call (provider cost plus 10%),call-1,tavily_search,8000,800,-8800,-0.008800,4991200,4.991200,sandbox credits (not real money)",
    );
    expect(rows[4]).toMatch(
      /closing_balance,Closing balance,.*,4991200,4\.991200,/,
    );
    expect(
      statementCsv({
        ...JSON.parse("{}"),
        mode: "live",
        from: "a",
        to: "b",
        openingMicros: 0,
        closingMicros: 0,
        lines: [],
      }),
    ).toContain("USD service credits");
  });
});

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const hosted = url ? describe : describe.skip;
const fixtureKey = "isolated-wallet-surface-tavily";
const providerAccount = "fixture-tavily-account";
const noChain = {
  enabled: false,
  recipient: "",
  rpcUrl: "https://fixture.invalid",
};
const intent = {
  title: "Wallet surface fixture",
  objective: "Test the customer payment surface against a fake provider",
  criteria: [{ text: "Capture request", weight: 1 }],
};
const result = {
  sources: [],
  httpStatus: 200,
  requestId: "fixture-provider-receipt",
  usage: { source: "fixture", credits: 1 },
};
const call = (extra = {}) => ({
  tool: "tavily_search",
  query: "isolated fixture",
  statedReason: "Test the payment surface",
  requestKey: randomUUID(),
  ...extra,
});

hosted("customer payment surface", () => {
  let store: Store;
  let db: PostgresDatabase;
  let obs: Observatory;
  let search: ReturnType<typeof vi.fn<() => Promise<typeof result>>>;
  let workspace: string;
  let keyId: string;
  let stripe: StripeFundingService;
  let funding: FundingService;
  let ops: WalletOperations;
  const original = { ...config.keys };
  const originalAdmin = { token: config.token, adminToken: config.adminToken };
  const actor = "account fixture-admin";

  const asKey = <T>(action: () => Promise<T>) =>
    store.actorScope.run({ kind: "api_key", id: keyId }, action);
  const session = async () =>
    (await asKey(() => obs.createAgentSession(intent, keyId))).id;
  const run = (id: string, input: ReturnType<typeof call>) =>
    asKey(() => obs.execute(id, input, keyId));
  const wallet = () => new Wallet(store);
  const read = <T>(action: () => Promise<T>) => store.db.read(action);
  /** Operator-side fixture credit; the runtime role cannot post adjustments. */
  async function fund(micros: number, mode = "test") {
    await db.pool.query(
      "INSERT INTO octolab.wallet_journal (workspace_id,source_id,kind,reference,wallet_micros,mode) VALUES ($1,$2,'adjustment','isolated fixture credit',$3,$4)",
      [workspace, randomUUID(), micros, mode],
    );
  }
  async function setRate(costMicros = 8000, mode = "test") {
    await db.pool.query(
      `INSERT INTO octolab.wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at,funding_mode)
       VALUES ($1,'private-rate-version-7',$2,$3,$4,now()-interval '1 hour',now()+interval '1 hour',$5)
       ON CONFLICT (workspace_id) DO UPDATE
         SET provider_cost_micros=EXCLUDED.provider_cost_micros, funding_mode=EXCLUDED.funding_mode`,
      [
        workspace,
        providerAccount,
        walletCredentialDigest(fixtureKey),
        costMicros,
        mode,
      ],
    );
  }
  const unenroll = () =>
    db.pool.query("DELETE FROM octolab.wallet_rates WHERE workspace_id=$1", [
      workspace,
    ]);
  const adjustment = (extra = {}) => ({
    requestKey: randomUUID(),
    accountId: workspace,
    mode: "test",
    amount: "5.00",
    note: "Fixture correction for ticket 1",
    ...extra,
  });

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
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated surface fixture')",
      [workspace],
    );
    await setRate();
    await grantFixtureAllowance(store);
    search = vi.fn(async () => result);
    obs = new Observatory(store, {
      search,
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
    funding = new FundingService(store, noChain);
    stripe = new StripeFundingService(
      funding,
      { ...fixtureStripeSettings },
      new FixtureStripeGateway(),
      undefined,
      {
        settings: { ...fixtureLiveStripeSettings },
        gateway: new FixtureStripeGateway("live"),
      },
    );
    ops = new WalletOperations(stripe);
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    Object.assign(config.keys, original);
    Object.assign(config, originalAdmin);
    if (store) await store.close();
  });

  it("lists every paid call with cost, markup and charge, and why a call cost nothing", async () => {
    await fund(1_000_000);
    const id = await session();
    const charged = await run(id, call());
    search.mockRejectedValueOnce(new ProviderError("http", 503));
    const failed = await run(id, call());
    expect(failed.status).toBe("failed");

    const page = await read(() => wallet().activity());
    expect(page).toMatchObject({ mode: "test", total: 2, page: 1 });
    expect(page.items).toEqual([
      {
        type: "call",
        callId: failed.id,
        sessionId: id,
        tool: "tavily_search",
        at: expect.any(String),
        outcome: "released",
        reason: "failed",
        providerCostMicros: 8000,
        markupMicros: 800,
        chargedMicros: 0,
        heldMicros: 8800,
        count: 1,
      },
      {
        type: "call",
        callId: charged.id,
        sessionId: id,
        tool: "tavily_search",
        at: expect.any(String),
        outcome: "charged",
        reason: null,
        providerCostMicros: 8000,
        markupMicros: 800,
        chargedMicros: 8800,
        heldMicros: 8800,
        count: 1,
      },
    ]);
    // The charge equals the debit in the journal: the view adds nothing of its own.
    const debit = await db.pool.query(
      "SELECT wallet_micros FROM octolab.wallet_journal WHERE workspace_id=$1 AND kind='usage'",
      [workspace],
    );
    expect(debit.rows.map((r) => Number(r.wallet_micros))).toEqual([-8800]);

    // Activity carries the same charge on each call, and finds a call by its ID.
    const activity = await readActivity(obs, "1970-01-01T00:00:00.000Z", {
      provider: "all",
      status: "all",
      q: charged.id,
      page: 1,
    });
    expect(activity.items).toHaveLength(1);
    expect(activity.items[0].charge).toEqual({
      outcome: "charged",
      reason: null,
      providerCostMicros: 8000,
      markupMicros: 800,
      chargedMicros: 8800,
      heldMicros: 8800,
      mode: "test",
    });
    expect(JSON.stringify(page)).not.toMatch(/isolated fixture|private-rate/);
  });

  it("records a refused call once per minute for the owner, with nothing reserved or stored about the request", async () => {
    await fund(8799);
    const id = await session();
    for (let attempt = 0; attempt < 3; attempt++)
      await expect(run(id, call())).rejects.toBeInstanceOf(WalletError);
    expect(search).not.toHaveBeenCalled();
    expect(await obs.db.calls(id)).toEqual([]);

    const rows = await db.pool.query(
      "SELECT * FROM octolab.wallet_refusals WHERE workspace_id=$1",
      [workspace],
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({
      mode: "test",
      tool: "tavily_search",
      reason: "insufficient_balance",
      refusals: 3,
    });
    expect(Object.keys(rows.rows[0]).sort()).toEqual(
      [
        "available_micros",
        "last_at",
        "minute",
        "mode",
        "reason",
        "refusals",
        "required_micros",
        "tool",
        "workspace_id",
      ].sort(),
    );
    const page = await read(() => wallet().activity());
    expect(page.items).toEqual([
      expect.objectContaining({
        type: "refused",
        callId: null,
        outcome: "refused",
        reason: "insufficient_balance",
        chargedMicros: 0,
        heldMicros: 8800,
        count: 3,
      }),
    ]);
    // A refusal moved no money and held nothing.
    expect(await read(() => wallet().status())).toMatchObject({
      postedMicros: 8799,
      heldMicros: 0,
      chargedMicros: 0,
      callsRemaining: 0,
      lowBalance: true,
    });
  });

  it("leaves a durable operator alert when a lapsed rate refuses a billable call", async () => {
    await fund(1_000_000);
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    config.keys.tavily = "rotated-fixture-secret";
    const id = await session();
    const refused = await run(id, call()).catch((e) => e);
    await run(id, call()).catch(() => {});
    log.mockRestore();
    expect(refused).toMatchObject({
      code: "billing_unavailable",
      ownerAction: { action: "none" },
    });
    const alerts = (await ops.alerts()).filter((a) =>
      a.reference.endsWith(workspace),
    );
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      kind: "rate_unverified",
      mode: "test",
      detail: { rateVersion: "private-rate-version-7" },
    });
    expect(JSON.stringify(alerts)).not.toContain("rotated-fixture-secret");
    expect((await read(() => wallet().activity())).items[0]).toMatchObject({
      outcome: "refused",
      reason: "rate_unverified",
      count: 2,
    });
  });

  it("returns owner guidance on the HTTP refusals without operator settings", async () => {
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) =>
      store.actorScope.run({ kind: "api_key", id: keyId }, () => {
        res.locals.apiKeyId = keyId;
        next();
      }),
    );
    observationRoutes(app, obs);
    const id = await session();
    const short = await request(app)
      .post(`/api/observations/${id}/call`)
      .send(call());
    expect(short.status).toBe(402);
    expect(short.body).toMatchObject({
      code: "insufficient_credits",
      wallet: { reason: "insufficient_balance", requiredMicros: 8800 },
      ownerAction: { action: "add_credits" },
    });
    expect(Object.keys(short.body).sort()).toEqual(
      ["code", "error", "ownerAction", "wallet"].sort(),
    );

    await fund(1_000_000);
    const current = await store.allowance.status();
    await store.allowance.change(workspace, randomUUID(), {
      requestKey: randomUUID(),
      revision: current.revision,
      limitMicros: current.limitMicros,
      paused: true,
      reason: "Fixture pause for the refusal wording test.",
    });
    const paused = await request(app)
      .post(`/api/observations/${id}/call`)
      .send(call());
    expect(paused.status).toBe(403);
    expect(paused.body).toMatchObject({
      code: "operator_allowance_exceeded",
      ownerAction: {
        action: "contact_support",
        message: expect.stringMatching(/paused paid tools for this account/),
      },
    });
    expect(paused.body.ownerAction.message).not.toMatch(/\$|\d/);
  });

  it("tells discovery and routing when credits would refuse a paid call", async () => {
    const id = await session();
    const empty = await asKey(() =>
      obs.discover(
        id,
        {
          need: "Find a source",
          operations: [{ operation: "search", query: "q" }],
        },
        undefined,
        keyId,
      ),
    );
    expect(empty.wallet).toMatchObject({
      enforced: true,
      mode: "test",
      paidCallsAllowed: false,
      reason: "insufficient_balance",
      requiredMicros: 8800,
      availableMicros: 0,
      billable: {
        tool: "tavily_search",
        providerCostMicros: 8000,
        markupBps: 1000,
        customerPriceMicros: 8800,
      },
    });
    const tavily = empty.tools.find((t) => t.tool === "tavily_search")!;
    expect(tavily.discoveryMatches[0]).toMatchObject({
      status: "disabled",
      reason: expect.stringMatching(/account owner can add credits/),
    });
    expect(tavily.requestEstimates[0]).toMatchObject({
      walletAllowed: false,
      withinBudget: false,
    });
    expect(empty.candidateTools).not.toContain("tavily_search");
    const catalog = await asKey(() => obs.catalog(keyId));
    expect(catalog.find((t) => t.tool === "tavily_search")).toMatchObject({
      walletAllowed: false,
    });
    // The recorded offer keeps no balance figure.
    const events = await db.pool.query(
      "SELECT body FROM octolab.observation_events WHERE workspace_id=$1",
      [workspace],
    );
    expect(JSON.stringify(events.rows)).not.toContain("availableMicros");

    await fund(1_000_000);
    const funded = await asKey(() =>
      obs.preview(
        {
          need: "Find a source",
          operations: [{ operation: "search", query: "q" }],
        },
        keyId,
      ),
    );
    expect(funded.wallet).toMatchObject({
      paidCallsAllowed: true,
      reason: null,
    });
    expect(funded.candidateTools).toContain("tavily_search");

    // An account that is not on credit billing sees no wallet gate at all.
    await unenroll();
    expect(await read(() => wallet().quote())).toEqual({
      enforced: false,
      mode: "test",
      paidCallsAllowed: true,
      reason: null,
      requiredMicros: null,
      availableMicros: null,
      billable: null,
    });
  });

  it("reports the balance the owner needs: calls left and a low-balance flag", async () => {
    await fund(8800 * LOW_BALANCE_CALLS);
    expect(await read(() => wallet().status())).toMatchObject({
      enforced: true,
      enrolled: true,
      billingAvailable: true,
      callHoldMicros: 8800,
      callsRemaining: LOW_BALANCE_CALLS,
      lowBalance: false,
    });
    await fund(-1);
    expect(await read(() => wallet().status())).toMatchObject({
      callsRemaining: LOW_BALANCE_CALLS - 1,
      lowBalance: true,
    });
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    expect(await read(() => wallet().status())).toMatchObject({
      enforced: false,
      lowBalance: false,
    });
  });

  it("does not offer or accept a top-up the account could not spend", async () => {
    const input = () => ({ requestKey: randomUUID(), amount: "5" });
    const deposits = async () =>
      Number(
        (
          await db.pool.query(
            "SELECT count(*) AS n FROM octolab.stripe_deposits WHERE workspace_id=$1",
            [workspace],
          )
        ).rows[0].n,
      );
    // Enrolled with tool access: open.
    expect(await read(() => stripe.accountStatus())).toMatchObject({
      enabled: true,
      mode: "test",
    });

    // Not enrolled for credit billing.
    await unenroll();
    const notEnrolled = await read(() => stripe.accountStatus());
    expect(notEnrolled).toMatchObject({
      enabled: false,
      blocked: "not_enrolled",
    });
    expect(notEnrolled.unavailableReason).toMatch(/nothing to pay/);
    await expect(stripe.create(input())).rejects.toThrow(
      /No payment was started/,
    );
    expect(await deposits()).toBe(0);

    // Enrolled, tool access paused.
    await setRate();
    const current = await store.allowance.status();
    await store.allowance.change(workspace, randomUUID(), {
      requestKey: randomUUID(),
      revision: current.revision,
      limitMicros: current.limitMicros,
      paused: true,
      reason: "Fixture pause for the top-up gate test.",
    });
    expect(await read(() => stripe.accountStatus())).toMatchObject({
      enabled: false,
      blocked: "tool_access_paused",
    });
    await expect(stripe.create(input())).rejects.toThrow(/paused paid tools/);

    // Enrolled, rate lapsed.
    await db.pool.query(
      "UPDATE octolab.wallet_rates SET verified_at=now()-interval '2 hours', expires_at=now()-interval '1 hour' WHERE workspace_id=$1",
      [workspace],
    );
    expect(await read(() => stripe.accountStatus())).toMatchObject({
      enabled: false,
      blocked: "billing_unavailable",
    });
    expect(await deposits()).toBe(0);
    // No message names a rate, a limit or an amount.
    expect(JSON.stringify(notEnrolled)).not.toMatch(
      /rate|allowance|limit|private/i,
    );

    // With enforcement off, sandbox top-ups are a payment-flow test open to everyone.
    vi.stubEnv("TWO_HANDS_WALLET_ENFORCEMENT", "false");
    await unenroll();
    expect(await read(() => stripe.accountStatus())).toMatchObject({
      enabled: true,
    });
    expect(await stripe.topUpBlock()).toBeNull();
  });

  it("withholds top-ups from an account that has no tool access yet", async () => {
    const fresh = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated surface fixture without access')",
      [fresh],
    );
    await db.pool.query(
      `INSERT INTO octolab.wallet_rates
       (workspace_id,rate_version,provider_account,credential_digest,provider_cost_micros,verified_at,expires_at)
       VALUES ($1,'fixture',$2,$3,8000,now()-interval '1 hour',now()+interval '1 hour')`,
      [fresh, providerAccount, walletCredentialDigest(fixtureKey)],
    );
    const status = await store.scope.run(fresh, () =>
      read(() => stripe.accountStatus()),
    );
    expect(status).toMatchObject({
      enabled: false,
      blocked: "tool_access_pending",
    });
    await expect(
      store.scope.run(fresh, () =>
        stripe.create({ requestKey: randomUUID(), amount: "5" }),
      ),
    ).rejects.toThrow(/No payment was started/);
  });

  it("serves the statement and activity read-only, with opening and closing balances that add up", async () => {
    await fund(1_000_000);
    const id = await session();
    const charged = await run(id, call());
    const app = express();
    app.use(express.json());
    const { fundingRoutes } = await import("../server/funding-api");
    fundingRoutes(app, funding, stripe);
    const today = new Date().toISOString().slice(0, 10);

    const json = await request(app).get(
      `/api/account/funding/statement?from=${today}&to=${today}&format=json`,
    );
    expect(json.status).toBe(200);
    expect(json.body).toMatchObject({
      mode: "test",
      openingMicros: 0,
      closingMicros: 991_200,
    });
    expect(json.body.lines).toHaveLength(2);
    expect(json.body.lines[1]).toMatchObject({
      kind: "usage",
      reference: charged.id,
      tool: "tavily_search",
      providerCostMicros: 8000,
      markupMicros: 800,
      micros: -8800,
      balanceMicros: 991_200,
    });
    // An operator's free-text adjustment note is not exported.
    expect(json.body.lines[0]).toMatchObject({ kind: "adjustment" });
    expect(JSON.stringify(json.body)).not.toContain("isolated fixture credit");

    const csv = await request(app).get(
      `/api/account/funding/statement?from=${today}&to=${today}`,
    );
    expect(csv.status).toBe(200);
    expect(csv.headers["content-type"]).toMatch(/text\/csv/);
    expect(csv.headers["content-disposition"]).toContain(
      `two-hands-sandbox-credits-${today}-to-${today}.csv`,
    );
    const rows = csv.text.trimEnd().split("\r\n");
    expect(rows).toHaveLength(5);
    expect(rows.at(-1)).toMatch(/closing_balance,.*,991200,0\.991200,/);
    expect(csv.text).not.toMatch(/isolated fixture|private-rate/);

    // A later range opens with the earlier postings and has no lines.
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    const later = await request(app).get(
      `/api/account/funding/statement?from=${tomorrow}&to=${tomorrow}&format=json`,
    );
    expect(later.body).toMatchObject({
      openingMicros: 991_200,
      closingMicros: 991_200,
      lines: [],
    });
    for (const query of [
      "from=2026-11-18&to=2026-11-17",
      "from=2025-01-01&to=2026-11-17",
      "from=yesterday&to=today",
      `from=${today}`,
    ])
      expect(
        (await request(app).get(`/api/account/funding/statement?${query}`))
          .status,
      ).toBe(400);

    const activity = await request(app).get(
      "/api/account/funding/activity?days=7",
    );
    expect(activity.status).toBe(200);
    expect(activity.body.items).toHaveLength(1);
    expect(activity.body.items[0]).toMatchObject({
      callId: charged.id,
      outcome: "charged",
      chargedMicros: 8800,
    });
    expect(
      (await request(app).get("/api/account/funding/activity?days=14")).status,
    ).toBe(400);

    // The Credits summary now carries the gate and the owner-facing balance facts.
    const summary = await request(app).get("/api/account/funding");
    expect(summary.body.stripe).toMatchObject({ enabled: true });
    expect(summary.body.wallet).toMatchObject({
      enrolled: true,
      callsRemaining: Math.floor(991_200 / 8800),
    });

    // The runtime role reads wallet tables and cannot change a balance or the audit record.
    await expect(
      store.transaction(() =>
        db
          .prepare(
            "INSERT INTO wallet_journal(source_id,kind,reference,wallet_micros,mode) VALUES (?,'adjustment','runtime attempt',1000000,'test')",
          )
          .run(randomUUID()),
      ),
    ).rejects.toThrow();
    await expect(
      store.transaction(() =>
        db.prepare("UPDATE wallet_balances SET posted_micros=1").run(),
      ),
    ).rejects.toThrow();
    await expect(
      read(() => db.prepare("SELECT 1 FROM wallet_operator_actions").all()),
    ).rejects.toThrow();
    await expect(
      store.transaction(() =>
        db
          .prepare("UPDATE wallet_refusals SET tool='changed', mode='live'")
          .run(),
      ),
    ).rejects.toThrow();
  });

  it("keeps another account's calls, refusals and statement out of view", async () => {
    await fund(1_000_000);
    const id = await session();
    await run(id, call());
    const neighbour = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES ($1,'Isolated neighbour fixture')",
      [neighbour],
    );
    const seen = await store.scope.run(neighbour, () =>
      read(async () => ({
        activity: await wallet().activity(),
        statement: await wallet().statement(
          "1970-01-01T00:00:00.000Z",
          "2100-01-01T00:00:00.000Z",
        ),
      })),
    );
    expect(seen.activity.items).toEqual([]);
    expect(seen.statement).toMatchObject({ closingMicros: 0, lines: [] });
  });

  it("posts an operator adjustment in the named mode with an audit record, once", async () => {
    const input = adjustment();
    const first = await ops.adjust(input, actor);
    expect(first).toMatchObject({
      replayed: false,
      adjustment: {
        accountId: workspace,
        mode: "test",
        micros: 5_000_000,
        actor,
        note: "Fixture correction for ticket 1",
      },
      balance: { postedMicros: 5_000_000, availableMicros: 5_000_000 },
    });
    // A repeat, and a concurrent duplicate, post nothing more.
    const [again, concurrent] = await Promise.all([
      ops.adjust(input, actor),
      ops.adjust(input, actor),
    ]);
    expect(again).toMatchObject({ replayed: true });
    expect(concurrent.adjustment.id).toBe(first.adjustment.id);
    const journal = await db.pool.query(
      "SELECT source_id,kind,mode,wallet_micros,reference FROM octolab.wallet_journal WHERE workspace_id=$1",
      [workspace],
    );
    expect(journal.rows).toEqual([
      {
        source_id: first.adjustment.id,
        kind: "adjustment",
        mode: "test",
        wallet_micros: "5000000",
        reference: `operator adjustment ${first.adjustment.id}`,
      },
    ]);
    const actions = await db.pool.query(
      "SELECT id,kind,mode,actor,deposit_id,data FROM octolab.wallet_operator_actions WHERE workspace_id=$1",
      [workspace],
    );
    expect(actions.rows).toEqual([
      {
        id: first.adjustment.id,
        kind: "adjustment",
        mode: "test",
        actor,
        deposit_id: null,
        data: {
          micros: 5_000_000,
          note: "Fixture correction for ticket 1",
          availableBeforeMicros: 0,
        },
      },
    ]);
    // The same key with different content is refused.
    await expect(
      ops.adjust({ ...input, amount: "6.00" }, actor),
    ).rejects.toThrow(/already used/);

    // The credit is spendable, and a removal is a negative posting.
    const id = await session();
    expect((await run(id, call())).status).toBe("succeeded");
    const removed = await ops.adjust(adjustment({ amount: "-0.5" }), actor);
    expect(removed.balance.availableMicros).toBe(5_000_000 - 8800 - 500_000);
    expect(
      (await ops.adjustments()).filter((a) => a.accountId === workspace),
    ).toHaveLength(2);
    expect(
      (await ops.adjustableAccounts(workspace)).find(
        (a) => a.accountId === workspace,
      ),
    ).toMatchObject({
      fundingMode: "test",
      balances: [{ mode: "test", availableMicros: 4_491_200 }],
    });
    // Adjustment credit is not card money: the statement shows it, and it stays traceable.
    const statement = await read(() =>
      wallet().statement(
        "1970-01-01T00:00:00.000Z",
        "2100-01-01T00:00:00.000Z",
      ),
    );
    expect(statement!.lines.map((l) => l.kind)).toEqual([
      "adjustment",
      "usage",
      "adjustment",
    ]);
    expect(statement!.lines[0].reference).toBe(first.adjustment.id);
  });

  it("refuses an adjustment that names no mode, the wrong balance, an unenrolled account, or would go below zero", async () => {
    const { mode: _mode, ...modeless } = adjustment();
    await expect(ops.adjust(modeless, actor)).rejects.toThrow();
    for (const bad of [
      { amount: "0" },
      { amount: "100.01" },
      { amount: "-100.000001" },
      { amount: "1e3" },
      { amount: "5.0000001" },
      { note: "short" },
      { mode: "sandbox" },
      { accountId: "not-an-account" },
      { extra: true },
    ])
      await expect(ops.adjust(adjustment(bad), actor)).rejects.toThrow();
    // A sandbox account has no live balance.
    await expect(
      ops.adjust(adjustment({ mode: "live" }), actor),
    ).rejects.toThrow(/funded in sandbox mode and has no live balance/);
    await expect(
      ops.adjust(adjustment({ amount: "-0.01" }), actor),
    ).rejects.toThrow(/below zero/);
    await expect(
      ops.adjust(adjustment({ accountId: randomUUID() }), actor),
    ).rejects.toThrow(/Account not found/);
    await unenroll();
    await expect(ops.adjust(adjustment(), actor)).rejects.toThrow(
      /not enrolled for credit billing/,
    );
    const journal = await db.pool.query(
      "SELECT count(*) AS n FROM octolab.wallet_journal WHERE workspace_id=$1",
      [workspace],
    );
    expect(Number(journal.rows[0].n)).toBe(0);
    const actions = await db.pool.query(
      "SELECT count(*) AS n FROM octolab.wallet_operator_actions WHERE workspace_id=$1",
      [workspace],
    );
    expect(Number(actions.rows[0].n)).toBe(0);
  });

  it("adjusts a live balance separately from the sandbox balance of the same account", async () => {
    await fund(2_000_000, "test");
    await setRate(8000, "live");
    const live = await ops.adjust(
      adjustment({ mode: "live", amount: "1.25" }),
      actor,
    );
    expect(live.balance.availableMicros).toBe(1_250_000);
    // The older sandbox balance can still be corrected, and stays separate.
    const sandbox = await ops.adjust(
      adjustment({ mode: "test", amount: "-2" }),
      actor,
    );
    expect(sandbox.balance.availableMicros).toBe(0);
    const balances = await db.pool.query(
      "SELECT mode,posted_micros FROM octolab.wallet_balances WHERE workspace_id=$1 ORDER BY mode",
      [workspace],
    );
    expect(balances.rows).toEqual([
      { mode: "live", posted_micros: "1250000" },
      { mode: "test", posted_micros: "0" },
    ]);
    expect(await read(() => wallet().status())).toMatchObject({
      mode: "live",
      availableMicros: 1_250_000,
    });
  });

  it("exposes adjustments only to an administrator over HTTP", async () => {
    config.token = "";
    config.adminToken = "admin-fixture-operator-token-0001";
    const app = createApp(store, undefined, obs, undefined, funding, stripe);
    const admin = (path: string, body?: object) =>
      (body
        ? request(app).post(`/api/admin/funding${path}`).send(body)
        : request(app).get(`/api/admin/funding${path}`)
      ).set("Authorization", "Bearer admin-fixture-operator-token-0001");
    expect(
      (
        await request(app)
          .post("/api/admin/funding/adjustments")
          .send(adjustment())
      ).status,
    ).toBe(401);
    const listed = await admin(`/adjustments?q=${workspace}`);
    expect(listed.status).toBe(200);
    expect(listed.body.accounts).toMatchObject([
      { accountId: workspace, fundingMode: "test" },
    ]);
    const posted = await admin("/adjustments", adjustment({ amount: "0.5" }));
    expect(posted.status).toBe(200);
    expect(posted.body).toMatchObject({
      replayed: false,
      adjustment: { micros: 500_000, mode: "test" },
      balance: { availableMicros: 500_000 },
    });
    expect(posted.body.adjustment.actor).toMatch(/^admin credential /);
    expect(
      (await admin("/adjustments", adjustment({ mode: "live" }))).status,
    ).toBe(409);
    expect(
      (await admin("/adjustments", { ...adjustment(), mode: undefined }))
        .status,
    ).toBe(400);
  });
});
