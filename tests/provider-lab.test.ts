import type { SearchProviderId } from "../server/provider-catalog";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { config } from "../server/config";
import { ProviderLab, measure, labMeasurements } from "../server/provider-lab";
import { suiteCases } from "../server/provider-lab-suite";
import { Observatory } from "../server/observation";
import { ProviderError } from "../server/providers";
import { createApp } from "../server/app";
import { companyReport } from "../server/company-insights";
import type { LabRun } from "../server/provider-lab-types";
import {
  compareProviderRuns,
  providerUsage,
} from "../server/provider-lab-metrics";
let store: Store, lab: ProviderLab, obs: Observatory;
const previous = {
  keys: { ...config.keys },
  cap: config.providerTestBudgetMicros,
  daily: config.providerTestDailyBudgetMicros,
  rpm: config.rpm,
  token: config.token,
  prices: { ...config.prices },
};
const search = vi.fn(
  async (
    provider: SearchProviderId,
    query: string,
    _domains: string[],
    id: string,
  ) => ({
    httpStatus: 200,
    sources: [
      {
        id,
        title: "Fixture reference",
        url:
          suiteCases.find((c) => c.input === query)?.referenceUrl ??
          "https://example.com",
        snippet: "FIXTURE CONTENT ONLY",
        provider,
        callId: id,
      },
    ],
  }),
);
const scrape = vi.fn(async (url: string) => ({
  httpStatus: 200,
  pageStatus: 200,
  text:
    suiteCases
      .find(
        (c) =>
          c.kind === "extract" && new URL(c.input).href === new URL(url).href,
      )
      ?.terms.join(" ") ?? "Fixture page",
}));
beforeEach(() => {
  Object.assign(config.prices, { exa: 17000, tavily: 8000, firecrawl: 1000 });
  Object.assign(config.keys, {
    exa: "TEST",
    tavily: "TEST",
    firecrawl: "TEST",
  });
  config.providerTestBudgetMicros = 150000;
  config.providerTestDailyBudgetMicros = 500000;
  config.rpm = 1000;
  config.token = "";
  store = new Store(":memory:");
  search.mockClear();
  scrape.mockClear();
  lab = new ProviderLab(store, { search, scrape });
  obs = new Observatory(store, { search, scrape });
});
afterEach(async () => {
  await vi.waitFor(() => expect(lab.active.size).toBe(0));
  await store.close();
  Object.assign(config.keys, previous.keys);
  config.providerTestBudgetMicros = previous.cap;
  config.providerTestDailyBudgetMicros = previous.daily;
  config.rpm = previous.rpm;
  config.token = previous.token;
  Object.assign(config.prices, previous.prices);
});
async function finish(run: LabRun) {
  await vi.waitFor(async () =>
    expect((await lab.get(run.id)).status).not.toBe("running"),
  );
  await vi.waitFor(() => expect(lab.active.size).toBe(0));
  return await lab.get(run.id);
}
it("forces matched queries through both search providers and keeps organic data unchanged", async () => {
  const run = await finish(
    await lab.start({
      requestKey: "paired",
      providers: ["exa", "tavily", "firecrawl"],
    }),
  );
  expect(run.calls).toHaveLength(15);
  expect(run.spentMicros).toBe(130000);
  expect(run.reservedMicros).toBe(0);
  expect(run.source).toBe("live_controlled");
  expect(run.authorizationSource).toBe("backend_policy");
  for (const test of suiteCases.filter((c) => c.kind === "search")) {
    expect(
      search.mock.calls
        .filter((c) => c[1] === test.input)
        .map((c) => c[0])
        .sort(),
    ).toEqual(["exa", "tavily"]);
  }
  expect(search.mock.calls.slice(0, 4).map((c) => c[0])).toEqual([
    "exa",
    "tavily",
    "tavily",
    "exa",
  ]);
  expect(scrape).toHaveBeenCalledTimes(5);
  expect(await obs.db.list()).toHaveLength(0);
  expect((await obs.catalog()).every((c) => c.sampleCount === 0)).toBe(true);
  expect((await obs.summary()).models).toHaveLength(0);
  const app = createApp(store, undefined, obs, lab);
  const catalog = await request(app).get("/api/observations/catalog");
  expect(catalog.body.find((t: any) => t.provider === "exa")).toMatchObject({
    sampleCount: 0,
    quality: null,
    controlledTestSample: {
      source: "backend_forced",
      attempted: 5,
      referenceKnown: 5,
      reviewed: 0,
    },
  });
  expect(
    catalog.body.find((t: any) => t.provider === "exa").controlledTestSample
      .limitations,
  ).toContain("no general quality ranking");
  expect(
    labMeasurements([run])
      .filter((m) => ["exa", "tavily", "firecrawl"].includes(m.provider))
      .map((m) => [m.attempted, m.referencePassed, m.reviewed]),
  ).toEqual([
    [5, 5, 0],
    [5, 5, 0],
    [5, 5, 0],
  ]);
});
it("replays one request key, rejects changed plans, and prevents concurrent independent runs", async () => {
  let release!: () => void;
  search.mockImplementationOnce(async () => {
    await new Promise<void>((r) => (release = r));
    return { httpStatus: 200, sources: [] };
  });
  const run = await lab.start({
    requestKey: "same",
    providers: ["exa", "tavily"],
  });
  expect(
    (await lab.start({ requestKey: "same", providers: ["tavily", "exa"] })).id,
  ).toBe(run.id);
  await expect(
    (async () => await lab.start({ requestKey: "same", providers: ["exa"] }))(),
  ).rejects.toThrow(/different test plan/);
  await expect(
    (async () =>
      await lab.start({ requestKey: "other", providers: ["exa"] }))(),
  ).rejects.toThrow(/already running/);
  release();
  await finish(run);
  expect(
    (await lab.start({ requestKey: "same", providers: ["exa", "tavily"] })).id,
  ).toBe(run.id);
  expect(search).toHaveBeenCalledTimes(10);
});
it("enforces the backend cap and daily allowance before starting provider work", async () => {
  config.providerTestBudgetMicros = 100000;
  await expect(
    (async () =>
      await lab.start({
        requestKey: "too-much",
        providers: ["exa", "tavily", "firecrawl"],
      }))(),
  ).rejects.toThrow(/backend test budget/);
  expect(search).not.toHaveBeenCalled();
  expect(await lab.list()).toHaveLength(0);
  config.providerTestBudgetMicros = 150000;
  config.providerTestDailyBudgetMicros = 130000;
  await finish(
    await lab.start({
      requestKey: "within",
      providers: ["exa", "tavily", "firecrawl"],
    }),
  );
  await expect(
    (async () =>
      await lab.start({ requestKey: "over-day", providers: ["firecrawl"] }))(),
  ).rejects.toThrow(/daily test allowance/);
  expect(scrape).toHaveBeenCalledTimes(5);
  expect(await lab.overview()).toMatchObject({
    dailyCommittedMicros: 130000,
    dailyRemainingMicros: 0,
  });
});
it("rejects consumer-style budget overrides, duplicate providers, and missing configuration", async () => {
  await expect(
    (async () =>
      await lab.start({
        requestKey: "override",
        providers: ["exa"],
        budgetMicros: 999999,
      }))(),
  ).rejects.toThrow();
  await expect(
    (async () =>
      await lab.start({
        requestKey: "duplicate",
        providers: ["exa", "exa"],
      }))(),
  ).rejects.toThrow();
  config.keys.exa = "";
  await expect(
    (async () =>
      await lab.start({ requestKey: "missing", providers: ["exa"] }))(),
  ).rejects.toThrow(/Configure/);
  expect(search).not.toHaveBeenCalled();
});
it("stops after the current call and never silently retries a provider error", async () => {
  let release!: () => void;
  search.mockImplementationOnce(async () => {
    await new Promise<void>((r) => (release = r));
    throw new ProviderError("http", 503);
  });
  const run = await lab.start({ requestKey: "stop", providers: ["exa"] });
  await lab.cancel(run.id);
  release();
  const done = await finish(run);
  expect(done.status).toBe("cancelled");
  expect(done.calls[0].status).toBe("failed");
  expect(done.calls.slice(1).every((c) => c.status === "skipped")).toBe(true);
  expect(done.spentMicros).toBe(17000);
  expect(search).toHaveBeenCalledTimes(1);
});
it("uses shared provider admission instead of bypassing the organic rate limiter", async () => {
  config.rpm = 1;
  const shared = new Map([["exa" as const, [Date.now()]]]);
  lab = new ProviderLab(store, { search, scrape }, shared);
  const done = await finish(
    await lab.start({ requestKey: "rate", providers: ["exa"] }),
  );
  expect(done.calls.every((c) => c.status === "skipped")).toBe(true);
  expect(done.spentMicros).toBe(0);
  expect(search).not.toHaveBeenCalled();
});
it("recovers an interrupted reservation conservatively without repeating the request", async () => {
  const done = await finish(
    await lab.start({ requestKey: "recover", providers: ["firecrawl"] }),
  );
  done.status = "running";
  done.finishedAt = undefined;
  done.calls[0].status = "running";
  done.calls[0].result = undefined;
  done.calls[0].measurements = undefined;
  done.calls.slice(1).forEach((c) => (c.status = "pending"));
  done.spentMicros = 0;
  done.reservedMicros = 1000;
  await store.db
    .prepare("UPDATE provider_lab_runs SET body=? WHERE id=?")
    .run(JSON.stringify(done), done.id);
  scrape.mockClear();
  const restarted = new ProviderLab(store, { search, scrape });
  await restarted.recover();
  const recovered = await restarted.get(done.id);
  expect(recovered.status).toBe("interrupted");
  expect(recovered.spentMicros).toBe(1000);
  expect(recovered.reservedMicros).toBe(0);
  expect(recovered.calls[0].status).toBe("interrupted");
  expect(recovered.calls.slice(1).every((c) => c.status === "skipped")).toBe(
    true,
  );
  expect(
    (await restarted.start({ requestKey: "recover", providers: ["firecrawl"] }))
      .id,
  ).toBe(done.id);
  expect(scrape).not.toHaveBeenCalled();
});
it("separates request success, reference checks, partial capture, and attributed reviews", async () => {
  scrape.mockImplementationOnce(async () => ({
    httpStatus: 200,
    pageStatus: 404,
    text: "Example domain",
    truncated: true,
  }));
  const run = await finish(
    await lab.start({ requestKey: "review", providers: ["firecrawl"] }),
  );
  expect(run.calls[0]).toMatchObject({
    status: "succeeded",
    measurements: { pageStatus: 404, referenceCheck: false, truncated: true },
  });
  await lab.review(run.id, run.calls[0].id, {
    verdict: "not_useful",
    note: "The receipt contains a missing page, not usable evidence.",
    author: "assistant_reported",
  });
  await lab.review(run.id, run.calls[0].id, {
    verdict: "unknown",
    note: "Further source verification is still needed.",
    author: "human_reported",
  });
  const updated = await lab.get(run.id);
  expect(updated.calls[0].reviews).toHaveLength(2);
  expect(
    labMeasurements([updated]).find((m) => m.provider === "firecrawl")
      ?.reviewed,
  ).toBe(0);
  await expect(
    (async () =>
      await lab.review(run.id, "missing", {
        verdict: "useful",
        note: "Enough detail for the fixture.",
      }))(),
  ).rejects.toThrow(/not found/);
});
it("does not mistake a hostname, missing status, or a low-ranked page for the reference check", () => {
  const test = suiteCases[0];
  const source = (url: string) => ({
    id: "x",
    title: "x",
    url,
    snippet: "x",
    provider: "exa",
    callId: "x",
  });
  expect(
    measure(test, { sources: [source("https://exa.ai/docs/unrelated")] })
      .referenceCheck,
  ).toBe(false);
  expect(
    measure(test, {
      sources: [
        source("https://other.com"),
        source("https://other.com/2"),
        source("https://other.com/3"),
        source(test.referenceUrl),
      ],
    }),
  ).toMatchObject({ referenceRank: 4, referenceCheck: false });
  expect(
    measure(suiteCases[5], { text: "Example domain" }).referenceCheck,
  ).toBeNull();
});
it("persists actionable plans and rejects nonexistent or duplicate comparison runs", async () => {
  const first = await finish(
    await lab.start({ requestKey: "first", providers: ["tavily"] }),
  );
  const second = await finish(
    await lab.start({ requestKey: "second", providers: ["tavily"] }),
  );
  const input = {
    provider: "tavily",
    verification: "retrieval",
    title: "Review alternate references",
    hypothesis: "Some returned alternatives may still answer the question.",
    change: "Inspect missing-reference receipts before changing the query.",
    successMeasure: "Compare fixed reference coverage and usefulness review.",
    baselineRunId: first.id,
    followupRunId: second.id,
  };
  const plan = await lab.saveExperiment(input);
  expect(await lab.experiments()).toHaveLength(1);
  expect(plan.status).toBe("planned");
  await expect(
    (async () =>
      await lab.saveExperiment({ ...input, followupRunId: first.id }))(),
  ).rejects.toThrow(/different runs/);
  await expect(
    (async () => await lab.saveExperiment({ ...input, status: "reviewed" }))(),
  ).rejects.toThrow(/Record what/);
  await expect(
    (async () =>
      await lab.saveExperiment({ ...input, verification: "agent_choice" }))(),
  ).rejects.toThrow(/cannot verify agent choice/);
  const revised = await lab.saveExperiment(
    {
      ...input,
      status: "reviewed",
      conclusion:
        "The fixture comparison does not demonstrate a provider improvement.",
    },
    plan.id,
  );
  expect(revised.id).toBe(plan.id);
  expect(await lab.experiments()).toHaveLength(1);
});
it("keeps dashboard summaries small without losing receipts or review history", async () => {
  const run = await finish(
    await lab.start({ requestKey: "summary", providers: ["exa"] }),
  );
  await lab.review(run.id, run.calls[0].id, {
    verdict: "partial",
    note: "The fixture is only a synthetic reference match.",
    author: "assistant_reported",
  });
  const summary = (await lab.summaries())[0];
  expect(summary.calls[0].result).toBeUndefined();
  expect(summary.calls[0].reviews).toHaveLength(1);
  expect(summary.calls[0].measurements?.referenceCheck).toBe(true);
  expect((await lab.get(run.id)).calls[0].result).toBeDefined();
  expect((await lab.overview()).measurements[0]).toMatchObject({
    reviewed: 1,
    partial: 1,
    useful: 0,
  });
});
it("compares provider-specific cases across runs and exposes incompatible settings", async () => {
  const before = await finish(
    await lab.start({ requestKey: "before", providers: ["exa"] }),
  );
  const after = await finish(
    await lab.start({
      requestKey: "after",
      providers: ["exa", "tavily", "firecrawl"],
    }),
  );
  expect(compareProviderRuns(before, after, "exa")).toMatchObject({
    sameCases: true,
    warnings: [],
    cases: expect.any(Array),
  });
  after.adapterSnapshot.exa_search = { type: "auto", numResults: 5 };
  after.rateCardVersion = "changed-fixture-rate";
  after.cases[0].input = "Changed fixture query";
  after.calls.find((c) => c.provider === "exa")!.status = "skipped";
  const changed = compareProviderRuns(before, after, "exa");
  expect(changed.sameCases).toBe(false);
  expect(changed.warnings).toHaveLength(4);
  expect(changed.before.attempted).toBe(5);
  expect(changed.after.attempted).toBe(4);
});
it("preserves provider USD and credit units without inventing an invoice", async () => {
  const run = await finish(
    await lab.start({ requestKey: "usage", providers: ["exa"] }),
  );
  run.calls[0].result!.usage = { providerReportedUsd: 0.007 };
  run.calls[1].result!.usage = { credits: 1 };
  run.calls[2].result!.usage = { providerReportedUsd: -2, credits: NaN };
  run.calls[3].result!.credits = 0;
  expect(providerUsage(run.calls)).toEqual({
    usdCalls: 1,
    reportedUsd: 0.007,
    estimatedMicrosForUsdCalls: 17000,
    creditCalls: 2,
    credits: 1,
  });
  await store.db
    .prepare("UPDATE provider_lab_runs SET body=? WHERE id=?")
    .run(JSON.stringify(run), run.id);
  const report = await companyReport("exa", "local", obs, lab);
  expect(
    report.opportunities.find((o) => o.id === "cost-calibration")?.evidence,
  ).toContain("$0.017");
  expect(report.usage?.reportedUsd).toBe(0.007);
  expect((await companyReport("exa", "demo", obs, lab)).usage).toBeNull();
});
it("retains active, reviewed-recently, and linked lab evidence during retention", async () => {
  const template = await finish(
    await lab.start({ requestKey: "retention", providers: ["firecrawl"] }),
  );
  const clone = (kind: string) => {
    const run = structuredClone(template);
    run.id = crypto.randomUUID();
    run.requestKey = kind;
    run.createdAt = run.finishedAt = "2000-01-01T00:00:00.000Z";
    return run;
  };
  const expired = clone("expired"),
    active = clone("active"),
    recentReview = clone("recent-review"),
    linked = clone("linked"),
    reviewedPlan = clone("reviewed-plan");
  active.status = "running";
  recentReview.calls[0].reviews.push({
    verdict: "unknown",
    note: "Retain a recent fixture review",
    author: "unspecified",
    at: new Date().toISOString(),
  });
  for (const run of [expired, active, recentReview, linked, reviewedPlan])
    await store.db
      .prepare("INSERT INTO provider_lab_runs VALUES(?,?,?)")
      .run(run.id, run.requestKey, JSON.stringify(run));
  const plan = {
    provider: "firecrawl",
    title: "Retain linked evidence",
    hypothesis: "The fixture checks retention of active plans.",
    change: "Keep this baseline until the test plan is complete.",
    successMeasure: "The evidence should remain available after retention.",
    baselineRunId: linked.id,
  };
  await lab.saveExperiment(plan);
  const oldPlan = await lab.saveExperiment({
    ...plan,
    baselineRunId: reviewedPlan.id,
    status: "reviewed",
    conclusion: "This old synthetic plan is complete and may expire.",
  });
  await store.db
    .prepare(
      "UPDATE provider_experiments SET body=json_set(body,'$.updatedAt',?) WHERE id=?",
    )
    .run("2000-01-01T00:00:00.000Z", oldPlan.id);
  expect(await lab.pruneOlderThan("2001-01-01T00:00:00.000Z")).toEqual({
    runs: 2,
    plans: 1,
  });
  await expect((async () => await lab.get(expired.id))()).rejects.toThrow(
    /not found/,
  );
  await expect((async () => await lab.get(reviewedPlan.id))()).rejects.toThrow(
    /not found/,
  );
  for (const run of [template, active, recentReview, linked])
    expect(await lab.get(run.id)).toBeDefined();
});
it("keeps demo metrics out of storage and exposes the first eligible organic call", async () => {
  const session = await obs.createAgentSession({
    title: "PRIVATE title",
    objective: "PRIVATE objective",
    criteria: [{ text: "PRIVATE criterion", weight: 1 }],
    constraints: "PRIVATE constraints",
    model: "PRIVATE model",
    host: "PRIVATE host",
  });
  await obs.discover(session.id, "PRIVATE need");
  await obs.execute(session.id, {
    tool: "tavily_search",
    query: "PRIVATE query",
    domains: [],
    requestKey: "organic",
    statedReason: "PRIVATE explanation",
  });
  expect(
    (await companyReport("tavily", "local", obs, lab)).organic,
  ).toMatchObject({
    offeredSessions: 1,
    selectedSessions: 1,
    calls: 1,
    successfulCalls: 1,
  });
  const demo = await companyReport("exa", "demo", obs, lab);
  expect(demo.organic?.selectedSessions).toBe(54);
  expect(await lab.list()).toHaveLength(0);
  expect(await obs.db.list()).toHaveLength(1);
  expect(
    JSON.stringify(await companyReport("tavily", "local", obs, lab)),
  ).not.toContain("PRIVATE");
  expect(
    (await obs.catalog()).find((t) => t.provider === "tavily")?.sampleCount,
  ).toBe(1);
});
it("keeps all-session sharing enabled and updates exports after deletion without hiding remaining usage", async () => {
  const ids: string[] = [];
  for (let i = 0; i < 5; i++) {
    const s = await obs.createAgentSession({
      title: "PRIVATE title",
      objective: "PRIVATE objective",
      criteria: [{ text: "PRIVATE criterion", weight: 1 }],
      constraints: "PRIVATE",
      model: "PRIVATE",
      host: "PRIVATE",
    });
    ids.push(s.id);
    await obs.discover(s.id, "PRIVATE");
    await obs.execute(s.id, {
      tool: "tavily_search",
      query: "PRIVATE query",
      domains: [],
      requestKey: "organic",
      statedReason: "PRIVATE",
    });
    await obs.consent(s.id, true);
  }
  expect(
    (await companyReport("tavily", "local", obs, lab)).organic,
  ).toMatchObject({
    offeredSessions: 5,
    selectedSessions: 5,
    calls: 5,
  });
  expect(
    JSON.stringify(await companyReport("tavily", "local", obs, lab)),
  ).not.toContain("PRIVATE");
  await expect(
    (async () => await obs.consent(ids[0], false))(),
  ).rejects.toThrow(/account policy/);
  await obs.db.remove(ids[0]);
  expect(
    (await companyReport("tavily", "local", obs, lab)).organic,
  ).toMatchObject({ offeredSessions: 4, selectedSessions: 4, calls: 4 });
});
it("does not credit selections that happened before the tool was offered", async () => {
  const sessions = [];
  for (let i = 0; i < 5; i++) {
    const s = await obs.createAgentSession({
      title: "Chronology fixture",
      objective: "Check offered-before-selected event order.",
      constraints: "",
      model: "Synthetic fixture",
      host: "Unit test",
      criteria: [{ text: "Preserves chronological attribution", weight: 1 }],
    });
    const args = {
      tool: "tavily_search" as const,
      query: "Fixture chronology",
      domains: [],
      statedReason: "Find evidence for the current task.",
      requestKey: "before-offer",
    };
    await obs.execute(s.id, args);
    await obs.discover(s.id, "Offer after the first choice");
    await obs.consent(s.id, true);
    sessions.push({ s, args });
  }
  expect(
    (await companyReport("tavily", "local", obs, lab)).organic,
  ).toMatchObject({ offeredSessions: 5, selectedSessions: 0, calls: 0 });
  for (const { s, args } of sessions)
    await obs.execute(s.id, { ...args, requestKey: "after-offer" });
  expect(
    (await companyReport("tavily", "local", obs, lab)).organic,
  ).toMatchObject({
    offeredSessions: 5,
    selectedSessions: 5,
    calls: 5,
  });
  expect(
    (await obs.catalog()).find((t) => t.provider === "tavily")?.sampleCount,
  ).toBe(10);
});
it("protects lab and company endpoints with workspace authentication and validates inputs", async () => {
  config.token = "fixture-access-token";
  const app = createApp(store, undefined, obs, lab);
  expect((await request(app).get("/api/provider-lab")).status).toBe(401);
  expect((await request(app).get("/api/company-insights/exa")).status).toBe(
    401,
  );
  const auth = { Authorization: "Bearer fixture-access-token" };
  expect(
    (await request(app).get("/api/company-insights/unknown").set(auth)).status,
  ).toBe(400);
  expect(
    (
      await request(app)
        .post("/api/provider-lab/runs")
        .set(auth)
        .send({ requestKey: "invalid", providers: ["other"] })
    ).status,
  ).toBe(400);
  const response = await request(app)
    .post("/api/provider-lab/runs")
    .set(auth)
    .send({ requestKey: "api", providers: ["tavily"] });
  expect(response.status).toBe(202);
  await finish(response.body);
  expect(
    (await request(app).get("/api/provider-lab").set(auth)).body.runs,
  ).toHaveLength(1);
});
it("shows first-call company counts while keeping private activity explicitly scoped", async () => {
  const s = await obs.createAgentSession({
    title: "PRIVATE title",
    objective: "PRIVATE objective",
    criteria: [{ text: "PRIVATE criterion", weight: 1 }],
    model: "Fixture",
    host: "Unit test",
    constraints: "",
  });
  await obs.discover(s.id, "Find public evidence");
  await obs.execute(s.id, {
    tool: "exa_search",
    query: "PRIVATE query",
    requestKey: "local-only",
    domains: [],
    statedReason: "PRIVATE explanation",
  });
  const aggregate = await companyReport("exa", "local", obs, lab);
  expect(aggregate.organic).toMatchObject({
    offeredSessions: 1,
    selectedSessions: 1,
    calls: 1,
  });
  expect(aggregate.privateActivity).toBeNull();
  const local = await companyReport("exa", "local", obs, lab, true);
  expect(local.privateActivity).toMatchObject({
    calls: 1,
    successfulCalls: 1,
    selectedSessions: 1,
    offeredSessions: 1,
  });
  expect(local.organic).toMatchObject({
    offeredSessions: 1,
    selectedSessions: 1,
    calls: 1,
  });
  expect(JSON.stringify(local)).not.toContain("PRIVATE");
});
it("does not count incompatible tools as offered candidates in new discovery events", async () => {
  const s = await obs.createAgentSession({
    title: "Candidate scope fixture",
    objective: "Find pages",
    criteria: [{ text: "Finds sources", weight: 1 }],
    model: "Fixture",
    host: "Unit test",
    constraints: "",
  });
  await obs.discover(s.id, {
    need: "Search",
    operations: [{ operation: "search", query: "fixture" }],
  });
  expect(
    (await companyReport("exa", "local", obs, lab, true)).privateActivity
      ?.offeredSessions,
  ).toBe(1);
  expect(
    (await companyReport("firecrawl", "local", obs, lab, true)).privateActivity
      ?.offeredSessions,
  ).toBe(0);
});

it("preserves cancellation and review during concurrent provider settlement", async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const defaultSearch = search.getMockImplementation()!;
  search
    .mockImplementationOnce(defaultSearch)
    .mockImplementationOnce(async () => {
      await gate;
      return { httpStatus: 200, sources: [] };
    });
  const run = await lab.start({
    requestKey: "concurrent-cancel-review",
    providers: ["exa"],
  });
  try {
    await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(2));
    const settled = (await lab.get(run.id)).calls.find(
      (c) => c.status === "succeeded",
    )!;
    await Promise.all([
      lab.cancel(run.id),
      lab.review(run.id, settled.id, {
        verdict: "useful",
        note: "Fixture receipt reviewed while the next call is running.",
        author: "human_reported",
      }),
    ]);
    release();
    const result = await finish(run);
    expect(result.cancelRequested).toBe(true);
    expect(result.status).toBe("cancelled");
    expect(result.calls.find((c) => c.id === settled.id)!.reviews).toHaveLength(
      1,
    );
    expect(search).toHaveBeenCalledTimes(2);
    expect(result.reservedMicros).toBe(0);
  } finally {
    release();
  }
});

it("retains settings exclusion when the response read fails after background admission", async () => {
  const { settingsWrite } = await import("../server/provider-settings-gate");
  let release!: () => void,
    started = false;
  const gate = new Promise<void>((r) => (release = r));
  const execute = vi
    .spyOn(
      lab as unknown as { execute: (id: string) => Promise<void> },
      "execute",
    )
    .mockImplementation(async () => {
      started = true;
      await gate;
    });
  vi.spyOn(lab, "get").mockRejectedValueOnce(
    new Error("Fixture response read failure"),
  );
  await expect(
    lab.start({ requestKey: "failed-response-read", providers: ["exa"] }),
  ).rejects.toThrow("Fixture response read failure");
  expect(started).toBe(true);
  await expect(settingsWrite(async () => 42)).rejects.toMatchObject({
    status: 409,
  });
  release();
  await vi.waitFor(() => expect(execute.mock.results[0]?.type).toBe("return"));
  await vi.waitFor(async () =>
    expect(await settingsWrite(async () => 42)).toBe(42),
  );
});
