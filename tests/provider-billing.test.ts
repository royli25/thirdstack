import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { ProviderBilling } from "../server/provider-billing";
import { createApp } from "../server/app";
import { config } from "../server/config";
import {
  assignProviderAccount,
  providerAccountForCall,
} from "../server/provider-accounts";
import { providerRegistry } from "../server/provider-adapters";
import { billingCsv, usdMicros } from "../src/billing-import";
import express from "express";
import { providerManagementRoutes } from "../server/provider-management-api";
import { ProviderLab } from "../server/provider-lab";

let store: Store, obs: Observatory, billing: ProviderBilling;
const original = {
  keys: { ...config.keys },
  token: config.token,
  prices: { ...config.prices },
  rpm: config.rpm,
};
const search = vi.fn(async () => ({
  sources: [],
  httpStatus: 200,
  requestId: "request-1",
  usage: { providerReportedUsd: 0.006, credits: 2, source: "fixture only" },
}));
const scrape = async () => ({ text: "fixture", httpStatus: 200 });
beforeEach(async () => {
  Object.assign(config.keys, {
    exa: "isolated-fixture-key",
    tavily: "fixture",
    firecrawl: "fixture",
  });
  config.prices.exa = 7000;
  config.token = "fixture-owner-token-at-least-24-chars";
  config.rpm = 1000;
  vi.stubEnv("EXA_ACCOUNT_REFERENCE", "account-A");
  store = new Store(":memory:");
  obs = new Observatory(store, { search, scrape });
  billing = new ProviderBilling(obs);
  await obs.ready;
  search.mockClear();
  search.mockResolvedValue({
    sources: [],
    httpStatus: 200,
    requestId: "request-1",
    usage: { providerReportedUsd: 0.006, credits: 2, source: "fixture only" },
  });
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, original.keys);
  Object.assign(config.prices, original.prices);
  config.token = original.token;
  config.rpm = original.rpm;
  vi.unstubAllEnvs();
});
async function call() {
  const session = await obs.createAgentSession({
    title: "PRIVATE session",
    objective: "PRIVATE objective",
    criteria: [{ text: "fixture", weight: 1 }],
    constraints: "",
    model: "fixture",
    host: "fixture",
  });
  return obs.execute(session.id, {
    tool: "exa_search",
    requestKey: crypto.randomUUID(),
    query: "PRIVATE query contents",
    statedReason: "PRIVATE explanation",
  });
}
function input(extra: Record<string, unknown> = {}) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return {
    requestKey: crypto.randomUUID(),
    provider: "exa",
    accountReference: "account-A",
    sourceKind: "invoice",
    sourceReference: `invoice-${crypto.randomUUID()}`,
    currency: "USD",
    windowStart: start.toISOString(),
    windowEnd: new Date(start.getTime() + 86400000).toISOString(),
    records: [
      { recordId: "line-1", requestId: "request-1", amountMicros: 9000 },
    ],
    ...extra,
  };
}
async function approve(id: string) {
  return billing.review(id, {
    requestKey: crypto.randomUUID(),
    decision: "approved",
    note: "Checked fixture document",
  });
}
describe("provider billing reconciliation", () => {
  it("matches original controlled-run receipts while excluding their replays from billing coverage", async () => {
    const lab = new ProviderLab(store, { search, scrape });
    const suite = await lab.suites.save(
      {
        title: "Billing fixture suite",
        description: "One isolated reference",
        cases: [
          {
            id: "one",
            title: "Fixture search",
            kind: "search",
            input: "fixture",
            referenceUrl: "https://example.com",
            terms: [],
          },
        ],
      },
      crypto.randomUUID(),
    );
    const started = await lab.start({
      requestKey: crypto.randomUUID(),
      providers: ["exa"],
      suiteId: suite.id,
      suiteRevision: suite.revision,
    });
    await vi.waitFor(() => expect(lab.active.size).toBe(0));
    const batch = await billing.import(input());
    await approve(batch.id);
    expect((await billing.overview()).batches[0].lines[0]).toMatchObject({
      callSource: "controlled_run",
      reconciledMicros: 9000,
    });
    await lab.replay({
      requestKey: crypto.randomUUID(),
      sourceRunId: started.id,
      suiteId: suite.id,
      suiteRevision: suite.revision,
    });
    expect(await billing.overview()).toMatchObject({
      reconciledCalls: 1,
      totalCalls: 1,
      reconciledMicros: 9000,
    });
    expect(await obs.db.list()).toEqual([]);
  });
  it("retains reviewed match evidence when original request history is removed", async () => {
    const receipt = await call();
    const batch = await billing.import(input());
    await approve(batch.id);
    await store.db
      .prepare("DELETE FROM observation_sessions WHERE id=?")
      .run(receipt.sessionId);
    const report = await billing.overview();
    expect(report.reconciledMicros).toBe(9000);
    expect(report.batches[0].reviews[0].receipts[0]).toMatchObject({
      id: receipt.id,
      requestId: "request-1",
      estimateMicros: 7000,
    });
    expect(JSON.stringify(report.batches[0].reviews[0].receipts)).not.toContain(
      "PRIVATE",
    );
  });
  it("allows signed-in account management and denies machine keys", async () => {
    config.token = "";
    let machineKey = true;
    const app = express();
    app.use(express.json());
    app.use((_req, res, next) => {
      res.locals.account = { userId: "00000000-0000-4000-8000-000000000001" };
      if (machineKey) res.locals.apiKeyId = "fixture-key";
      next();
    });
    providerManagementRoutes(app, obs);
    expect(
      (await request(app).get("/api/account/provider-billing")).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/account/provider-billing/imports")
          .send(input())
      ).status,
    ).toBe(403);
    machineKey = false;
    const imported = await request(app)
      .post("/api/account/provider-billing/imports")
      .send(input());
    expect(imported.status).toBe(201);
    const reviewed = await request(app)
      .post(`/api/account/provider-billing/imports/${imported.body.id}/review`)
      .send({
        requestKey: crypto.randomUUID(),
        decision: "approved",
        note: "Verified owner review",
      });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.actorId).toBe("00000000-0000-4000-8000-000000000001");
  });
  it("keeps estimated, reported and approved invoice costs distinct without changing reservations or test balances", async () => {
    const receipt = await call();
    const before = await obs.require(receipt.sessionId);
    const batch = await billing.import(input());
    expect((await billing.overview()).reconciledMicros).toBeNull();
    await approve(batch.id);
    const report = await billing.overview();
    expect(report).toMatchObject({
      reconciledMicros: 9000,
      matchedEstimatedMicros: 7000,
      varianceMicros: 2000,
      reconciledCalls: 1,
      totalCalls: 1,
    });
    expect(report.batches[0].lines[0]).toMatchObject({
      status: "matched",
      estimatedMicros: 7000,
      reportedUsd: 0.006,
      reportedCredits: 2,
      amountMicros: 9000,
      reconciledMicros: 9000,
    });
    expect(await obs.require(receipt.sessionId)).toEqual(before);
    expect(
      (await store.db.prepare("SELECT COUNT(*) AS n FROM funding_ledger").get())
        ?.n,
    ).toBe(0);
    expect(
      (await new ProviderBilling(new Observatory(store)).overview())
        .reconciledMicros,
    ).toBe(9000);
  });
  it("withholds distinct invoice rows that point to the same request in one batch", async () => {
    await call();
    const batch = await billing.import(
      input({
        records: [
          { recordId: "charge-A", requestId: "request-1", amountMicros: 9000 },
          { recordId: "charge-B", requestId: "request-1", amountMicros: 9000 },
        ],
      }),
    );
    await approve(batch.id);
    const report = await billing.overview();
    expect(report.reconciledCalls).toBe(0);
    expect(report.reconciledMicros).toBeNull();
    expect(report.batches[0].lines.map((line) => line.status)).toEqual([
      "duplicate",
      "duplicate",
    ]);
    expect(
      report.batches[0].lines.every((line) => line.reconciledMicros === null),
    ).toBe(true);
  });
  it("deduplicates retry keys and identical documents, rejecting changed retry payloads", async () => {
    await call();
    const raw = input();
    const first = await billing.import(raw);
    expect(await billing.import(raw)).toEqual({
      id: first.id,
      duplicate: true,
    });
    expect(
      await billing.import({ ...raw, requestKey: crypto.randomUUID() }),
    ).toEqual({ id: first.id, duplicate: true });
    await expect(
      billing.import({
        ...raw,
        records: [{ recordId: "changed", amountMicros: 10 }],
      }),
    ).rejects.toThrow(/different records/);
    expect((await billing.overview()).batches).toHaveLength(1);
    const review = {
      requestKey: crypto.randomUUID(),
      decision: "approved",
      note: "Checked fixture",
    };
    const saved = await billing.review(first.id, review);
    expect(await billing.review(first.id, review)).toEqual(saved);
    await expect(
      billing.review(first.id, { ...review, decision: "rejected" }),
    ).rejects.toThrow(/different decision/);
  });
  it("appends correction and review history and retains the prior charge until its replacement is approved", async () => {
    await call();
    const raw = input();
    const first = await billing.import(raw);
    await approve(first.id);
    const corrected = await billing.import({
      ...raw,
      requestKey: crypto.randomUUID(),
      supersedesBatchId: first.id,
      records: [
        { recordId: "line-1", requestId: "request-1", amountMicros: 5000 },
      ],
    });
    expect((await billing.overview()).reconciledMicros).toBe(9000);
    await approve(corrected.id);
    const report = await billing.overview();
    expect(report.reconciledMicros).toBe(5000);
    expect(report.batches).toHaveLength(2);
    expect(report.batches.find((b) => b.id === first.id)).toMatchObject({
      effective: false,
      review: { decision: "approved" },
    });
    await expect(approve(first.id)).rejects.toThrow(/already reviewed/);
    await expect(
      billing.import({
        ...raw,
        requestKey: crypto.randomUUID(),
        supersedesBatchId: first.id,
        accountReference: "foreign-account",
      }),
    ).rejects.toThrow(/same provider account/);
  });
  it("retains unmatched, account-mismatched and ambiguous records without inventing charges", async () => {
    await call();
    await call();
    const ambiguous = await billing.import(input());
    await approve(ambiguous.id);
    expect((await billing.overview()).batches[0].lines[0].status).toBe(
      "ambiguous",
    );
    const foreign = await billing.import(
      input({ accountReference: "account-B" }),
    );
    await approve(foreign.id);
    const unknown = await billing.import(
      input({
        records: [
          {
            recordId: "unknown",
            requestId: "not-recorded",
            amountMicros: 1200,
          },
        ],
      }),
    );
    await approve(unknown.id);
    const report = await billing.overview();
    expect(report.reconciledMicros).toBeNull();
    expect(new Set(report.batches.map((b) => b.lines[0].status))).toEqual(
      new Set(["ambiguous", "account_mismatch", "unmatched"]),
    );
  });
  it("does not double-count overlapping invoice documents or repeated lines", async () => {
    await call();
    const one = await billing.import(input()),
      two = await billing.import(input());
    await approve(one.id);
    await approve(two.id);
    const report = await billing.overview();
    expect(report.reconciledMicros).toBeNull();
    expect(report.unresolvedRecords).toBe(2);
    expect(report.batches.every((b) => b.lines[0].status === "duplicate")).toBe(
      true,
    );
    const repeated = await billing.import(
      input({
        records: [
          { recordId: "same", amountMicros: 1 },
          { recordId: "same", amountMicros: 2 },
        ],
      }),
    );
    expect(
      (await billing.overview()).batches
        .find((b) => b.id === repeated.id)
        ?.lines.every((l) => l.status === "duplicate"),
    ).toBe(true);
  });
  it("keeps usage amounts, explicit versioned credit conversions and non-USD charges out of reconciled USD totals", async () => {
    await call();
    const usage = await billing.import(
      input({
        sourceKind: "account_usage",
        creditRate: { version: "plan-v2", microsPerCredit: 6000 },
        records: [{ recordId: "credits", requestId: "request-1", credits: 2 }],
      }),
    );
    await approve(usage.id);
    const foreign = await billing.import(input({ currency: "EUR" }));
    await approve(foreign.id);
    const report = await billing.overview();
    expect(report.reconciledMicros).toBeNull();
    expect(
      report.batches.find((b) => b.id === usage.id)?.lines[0],
    ).toMatchObject({ convertedCreditMicros: 12000, reconciledMicros: null });
    const unknown = await billing.import(
      input({
        sourceKind: "account_usage",
        records: [{ recordId: "credits-unknown", credits: 0 }],
      }),
    );
    expect(
      (await billing.overview()).batches.find((b) => b.id === unknown.id)
        ?.lines[0].convertedCreditMicros,
    ).toBeNull();
  });
  it("supports negative invoice adjustments while validating periods, amounts and unknown fields", async () => {
    await call();
    const adjustment = await billing.import(
      input({
        records: [
          { recordId: "refund", requestId: "request-1", amountMicros: -1000 },
        ],
      }),
    );
    await approve(adjustment.id);
    expect((await billing.overview()).reconciledMicros).toBe(-1000);
    await expect(
      billing.import(
        input({ records: [{ recordId: "bad", amountMicros: NaN }] }),
      ),
    ).rejects.toThrow();
    await expect(
      billing.import(input({ records: [{ recordId: "bad" }] })),
    ).rejects.toThrow();
    await expect(
      billing.import(input({ rawProviderOutput: "PRIVATE" })),
    ).rejects.toThrow();
    await expect(
      billing.import(input({ windowEnd: "1970-01-01T00:00:00Z" })),
    ).rejects.toThrow(/period/);
  });
  it("does not expose another workspace's imports or accept a foreign correction", async () => {
    await call();
    const batch = await billing.import(input());
    const other = new Store(":memory:");
    try {
      const second = new ProviderBilling(new Observatory(other));
      expect((await second.overview()).batches).toEqual([]);
      await expect(
        second.review(batch.id, {
          requestKey: crypto.randomUUID(),
          decision: "approved",
          note: "Foreign fixture",
        }),
      ).rejects.toThrow(/not found/);
      await expect(
        second.import(input({ supersedesBatchId: batch.id })),
      ).rejects.toThrow(/not found/);
    } finally {
      await other.close();
    }
  });
  it("protects billing routes from scoped keys and exports only an explicit financial allowlist", async () => {
    await call();
    const batch = await billing.import(input());
    await approve(batch.id);
    const app = createApp(store, undefined, obs);
    const { secret } = await obs.db.apiKeys.create({
      requestKey: crypto.randomUUID(),
      name: "fixture read key",
      scopes: ["usage:read"],
      allowedTools: ["exa_search"],
      limitUsd: "1",
      expiresInDays: 7,
    });
    for (const path of [
      "provider-billing",
      "provider-billing/export",
      "provider-adapters",
    ])
      expect(
        (
          await request(app)
            .get(`/api/account/${path}`)
            .set("Authorization", `Bearer ${secret}`)
        ).status,
      ).toBe(403);
    const response = await request(app)
      .get("/api/account/provider-billing/export")
      .set("Authorization", `Bearer ${config.token}`);
    expect(response.status).toBe(200);
    expect(response.body.batches[0].lines[0].reconciledMicros).toBe(9000);
    expect(JSON.stringify(response.body)).not.toMatch(
      /PRIVATE|fixture-key|credentialFingerprint|statedReason|inputHash|review.*note/,
    );
    expect(
      (await request(app).get("/api/account/provider-billing")).status,
    ).toBe(401);
  });
  it("binds a billing reference to the current key and requires a new reference after rotation", async () => {
    vi.stubEnv("EXA_ACCOUNT_REFERENCE", "");
    const revision = providerRegistry.credentialStatus("exa_search").revision!;
    await assignProviderAccount(store, "exa_search", {
      accountReference: "recorded-account",
      credentialRevision: revision,
    });
    expect(await providerAccountForCall(store, "exa_search")).toBe(
      "recorded-account",
    );
    expect((await call()).providerAccountReference).toBe("recorded-account");
    config.keys.exa = "rotated-fixture-key";
    expect(await providerAccountForCall(store, "exa_search")).toBeUndefined();
    await expect(
      assignProviderAccount(store, "exa_search", {
        accountReference: "new-account",
        credentialRevision: revision,
      }),
    ).rejects.toThrow(/connection changed/);
    const exported = JSON.stringify(
      (
        await request(createApp(store, undefined, obs))
          .get("/api/account/provider-adapters")
          .set("Authorization", `Bearer ${config.token}`)
      ).body,
    );
    expect(exported).not.toMatch(/rotated-fixture-key|credentialFingerprint/);
  });
});
describe("billing CSV imports", () => {
  it("reads exact amounts, quoted commas/newlines, missing fields and zero values", () => {
    expect(usdMicros("-0.000001")).toBe(-1);
    expect(
      billingCsv(
        'Record ID,Request ID,Amount,Credits\nline-1,"request,one",0.007,2\nline-2,,0,0\n',
      ),
    ).toEqual([
      {
        recordId: "line-1",
        requestId: "request,one",
        amountMicros: 7000,
        credits: 2,
      },
      { recordId: "line-2", amountMicros: 0, credits: 0 },
    ]);
    expect(
      billingCsv(
        'Record ID,Request ID,Amount,Credits\nline-1,"request\nline",1,\n',
      )[0].requestId,
    ).toBe("request\nline");
  });
  it("rejects invalid headers, incomplete quotes, non-finite values and oversized imports", () => {
    for (const text of [
      "wrong,headers",
      'Record ID,Request ID,Amount,Credits\na,"open',
      "Record ID,Request ID,Amount,Credits\na,r,Infinity,",
      "x".repeat(20001),
    ])
      expect(() => billingCsv(text)).toThrow();
    expect(() => usdMicros("0.0000001")).toThrow();
  });
});
