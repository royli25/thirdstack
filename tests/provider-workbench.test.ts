import type { SearchProviderId } from "../server/provider-catalog";
import { grantFixtureAllowance } from "./fixtures/allowance";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { ProviderLab } from "../server/provider-lab";
import { config } from "../server/config";
import { Observatory } from "../server/observation";
import { providerActivity } from "../server/provider-activity";
import { companyReport } from "../server/company-insights";
import { createApp } from "../server/app";
import type { LabRun } from "../server/provider-lab-types";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";

let store: Store, lab: ProviderLab, obs: Observatory;
const previous = {
  keys: { ...config.keys },
  cap: config.providerTestBudgetMicros,
  daily: config.providerTestDailyBudgetMicros,
  rpm: config.rpm,
  token: config.token,
};
const search = vi.fn(
  async (
    _provider: SearchProviderId,
    _query: string,
    _domains: string[],
    id: string,
  ) => ({
    httpStatus: 200,
    sources: [
      {
        id,
        title: "Fixture only",
        url: "https://example.com/reference",
        snippet: "FIXTURE ONLY",
        provider: _provider,
        callId: id,
      },
    ],
    usage: { providerReportedUsd: 0.005, source: "fixture" },
  }),
);
const scrape = vi.fn(async (_url: string) => ({
  httpStatus: 200,
  pageStatus: 200,
  text: "FIXTURE marker",
  credits: 1,
}));
const definition = () => ({
  title: "Custom diagnostic",
  description: "Check the declared source on a fixed query.",
  cases: [
    {
      id: "case-one",
      title: "Find a reference",
      kind: "search" as const,
      input: "PRIVATE fixture query",
      referenceUrl: "https://example.com/reference",
      terms: [],
    },
  ],
});
beforeEach(async () => {
  Object.assign(config.keys, {
    exa: "FIXTURE",
    tavily: "FIXTURE",
    firecrawl: "FIXTURE",
  });
  config.providerTestBudgetMicros = 150000;
  config.providerTestDailyBudgetMicros = 500000;
  config.rpm = 1000;
  config.token = "";
  const postgres = process.env.OCTOLAB_WORKBENCH_TEST_POSTGRES_URL;
  store = new Store(
    ":memory:",
    postgres,
    postgres ? crypto.randomUUID() : undefined,
  );
  if (store.db instanceof PostgresDatabase) {
    await applyMigrations(store.db);
    await store.db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Isolated provider workbench fixture')",
      [store.workspaceId],
    );
    await grantFixtureAllowance(store);
  }
  lab = new ProviderLab(store, { search, scrape });
  obs = new Observatory(store, { search, scrape });
  await obs.ready;
  search.mockClear();
  scrape.mockClear();
});
afterEach(async () => {
  await vi.waitFor(() => expect(lab.active.size).toBe(0));
  await store.close();
  Object.assign(config.keys, previous.keys);
  config.providerTestBudgetMicros = previous.cap;
  config.providerTestDailyBudgetMicros = previous.daily;
  config.rpm = previous.rpm;
  config.token = previous.token;
});
async function finish(run: LabRun) {
  await vi.waitFor(async () =>
    expect((await lab.get(run.id)).status).toBe("completed"),
  );
  await vi.waitFor(() => expect(lab.active.size).toBe(0));
  return lab.get(run.id);
}

it("persists immutable suite revisions, rejects stale edits, and pins each live run", async () => {
  const first = await lab.suites.save(definition(), crypto.randomUUID());
  const run = await finish(
    await lab.start({
      requestKey: "v1",
      providers: ["exa", "tavily"],
      suiteId: first.id,
      suiteRevision: 1,
    }),
  );
  expect(run.calls).toHaveLength(2);
  expect(run.suiteHash).toBe(first.hash);
  expect(run.calls.every((c) => c.measurements?.referenceCheck)).toBe(true);
  const changed = definition();
  changed.cases[0].referenceUrl = "https://example.com/different";
  const second = await lab.suites.save(
    { ...changed, expectedRevision: 1 },
    first.id,
  );
  expect(second.revision).toBe(2);
  expect((await lab.suites.get(first.id, 1)).cases[0].referenceUrl).toContain(
    "/reference",
  );
  expect((await lab.get(run.id)).cases[0].referenceUrl).toContain("/reference");
  await expect(
    lab.suites.save({ ...changed, expectedRevision: 1 }, first.id),
  ).rejects.toThrow(/changed/);
  const reopened = new ProviderLab(store, { search, scrape });
  expect(
    (await reopened.suites.list()).find((s) => s.id === first.id)?.revision,
  ).toBe(2);
});
it("replays historical responses without network, spend, timing, inherited reviews, or fresh-test statistics", async () => {
  const suite = await lab.suites.save(definition(), crypto.randomUUID());
  const source = await finish(
    await lab.start({
      requestKey: "source",
      providers: ["exa"],
      suiteId: suite.id,
      suiteRevision: 1,
    }),
  );
  await lab.review(source.id, source.calls[0].id, {
    verdict: "useful",
    note: "Fixture supports the declared source.",
  });
  const changed = definition();
  changed.cases[0].referenceUrl = "https://example.com/different";
  const revision = await lab.suites.save(
    { ...changed, expectedRevision: 1 },
    suite.id,
  );
  const before = await lab.overview();
  search.mockClear();
  scrape.mockClear();
  const input = {
    requestKey: "replay",
    sourceRunId: source.id,
    suiteId: revision.id,
    suiteRevision: revision.revision,
  };
  const replay = await lab.replay(input);
  expect(replay.source).toBe("replay");
  expect(replay.spentMicros).toBe(0);
  expect(replay.calls[0]).toMatchObject({
    sourceCallId: source.calls[0].id,
    estimateMicros: 0,
    reviews: [],
    measurements: { referenceCheck: false },
  });
  expect(replay.calls[0].latencyMs).toBeUndefined();
  expect(replay.calls[0].result?.usage).toBeUndefined();
  expect(search).not.toHaveBeenCalled();
  expect(scrape).not.toHaveBeenCalled();
  expect((await lab.replay(input)).id).toBe(replay.id);
  expect((await lab.overview()).dailyCommittedMicros).toBe(
    before.dailyCommittedMicros,
  );
  expect((await lab.overview()).measurements).toEqual(before.measurements);
  expect((await lab.controlledSamples()).exa?.runId).toBe(source.id);
  expect((await companyReport("exa", "local", obs, lab)).benchmarkRunId).toBe(
    source.id,
  );
  expect((await obs.catalog()).every((t) => t.sampleCount === 0)).toBe(true);
  const edited = definition();
  edited.cases[0].input = "A changed query";
  const third = await lab.suites.save(
    { ...edited, expectedRevision: 2 },
    suite.id,
  );
  await expect(
    lab.replay({
      ...input,
      requestKey: "changed",
      suiteRevision: third.revision,
    }),
  ).rejects.toThrow(/matching case IDs/);
});
it("validates cases, provider compatibility, spending, and duplicate run creation before network work", async () => {
  const invalid = definition();
  invalid.cases[0].referenceUrl = "https://127.0.0.1/private";
  await expect(lab.suites.save(invalid, crypto.randomUUID())).rejects.toThrow();
  const suite = await lab.suites.save(definition(), crypto.randomUUID());
  await expect(
    lab.start({
      requestKey: "wrong-op",
      providers: ["firecrawl"],
      suiteId: suite.id,
      suiteRevision: 1,
    }),
  ).rejects.toThrow(/compatible case/);
  const input = {
    requestKey: "concurrent-key",
    providers: ["exa"],
    suiteId: suite.id,
    suiteRevision: 1,
  };
  const runs = await Promise.all([lab.start(input), lab.start(input)]);
  expect(runs[0].id).toBe(runs[1].id);
  await finish(runs[0]);
  expect(search).toHaveBeenCalledTimes(1);
  config.providerTestBudgetMicros = 0;
  await expect(lab.start({ ...input, requestKey: "cap" })).rejects.toThrow(
    /backend test budget/,
  );
  expect(search).toHaveBeenCalledTimes(1);
});
it("aggregates only windowed organic calls, reports co-usage honestly, and omits private research text", async () => {
  const s = await obs.createAgentSession({
    title: "PRIVATE title",
    objective: "PRIVATE objective",
    criteria: [{ text: "Find the source", weight: 1 }],
    constraints: "",
    model: "fixture-unverified",
    host: "Fixture host",
  });
  const a = await obs.execute(s.id, {
    tool: "exa_search",
    query: "PRIVATE query",
    requestKey: "a",
    statedReason: "PRIVATE choice explanation",
  });
  await obs.execute(s.id, {
    tool: "tavily_search",
    query: "PRIVATE query",
    requestKey: "b",
    statedReason: "PRIVATE choice explanation",
  });
  await obs.outcome(s.id, {
    requestKey: "output",
    text: "PRIVATE final answer",
    evidenceCallIds: [a.id],
  });
  const suite = await lab.suites.save(definition(), crypto.randomUUID());
  await finish(
    await lab.start({
      requestKey: "controlled",
      providers: ["exa"],
      suiteId: suite.id,
      suiteRevision: 1,
    }),
  );
  const activity = await providerActivity(obs, "exa", 7);
  expect(activity).toMatchObject({
    scope: "private_workspace",
    calls: 1,
    sessions: 1,
    referenced: 1,
    succeeded: 1,
  });
  expect(activity.daily).toHaveLength(7);
  expect(activity.coUsage.find((p) => p.provider === "tavily")?.sessions).toBe(
    1,
  );
  expect(activity.hosts[0]).toMatchObject({ host: "Fixture host", calls: 1 });
  expect(JSON.stringify(activity)).not.toContain("PRIVATE");
  const app = createApp(store, undefined, obs, lab);
  expect(
    (await request(app).get("/api/provider-activity/exa?days=8")).status,
  ).toBe(400);
  expect(
    (await request(app).get("/api/provider-activity/exa?days=7")).body.calls,
  ).toBe(1);
  config.token = "owner-token-that-is-long-enough";
  expect((await request(app).get("/api/provider-activity/exa")).status).toBe(
    401,
  );
  expect(
    (
      await request(app)
        .post("/api/provider-lab/suites")
        .set("Origin", "https://untrusted.example")
        .set("Authorization", `Bearer ${config.token}`)
        .send(definition())
    ).status,
  ).toBe(403);
});
it("preserves simultaneous review versions instead of losing the earlier write", async () => {
  const suite = await lab.suites.save(definition(), crypto.randomUUID());
  const run = await finish(
    await lab.start({
      requestKey: "reviews",
      providers: ["exa"],
      suiteId: suite.id,
      suiteRevision: 1,
    }),
  );
  await Promise.all([
    lab.review(run.id, run.calls[0].id, {
      verdict: "partial",
      note: "First independent fixture review.",
    }),
    lab.review(run.id, run.calls[0].id, {
      verdict: "useful",
      note: "Second independent fixture review.",
    }),
  ]);
  expect(
    (await lab.get(run.id)).calls[0].reviews.map((r) => r.verdict).sort(),
  ).toEqual(["partial", "useful"]);
});
it.skipIf(!process.env.OCTOLAB_WORKBENCH_TEST_POSTGRES_URL)(
  "isolates suite revisions and replay sources across PostgreSQL workspaces",
  async () => {
    const suite = await lab.suites.save(definition(), crypto.randomUUID());
    const run = await finish(
      await lab.start({
        requestKey: "tenant-a",
        providers: ["exa"],
        suiteId: suite.id,
        suiteRevision: 1,
      }),
    );
    const database = store.db as PostgresDatabase;
    const otherId = crypto.randomUUID();
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Other isolated fixture')",
      [otherId],
    );
    await store.scope.run(otherId, async () => {
      expect((await lab.suites.list()).some((s) => s.id === suite.id)).toBe(
        false,
      );
      await expect(lab.suites.get(suite.id)).rejects.toThrow(/not found/);
      await expect(lab.get(run.id)).rejects.toThrow(/not found/);
      await expect(
        lab.replay({
          requestKey: "foreign-source",
          sourceRunId: run.id,
          suiteId: suite.id,
          suiteRevision: 1,
        }),
      ).rejects.toThrow(/not found/);
      expect((await providerActivity(obs, "exa", 7)).calls).toBe(0);
      const local = await lab.suites.save(
        { ...definition(), title: "Other workspace suite" },
        suite.id,
      );
      expect(local.revision).toBe(1);
    });
    expect((await lab.suites.get(suite.id)).title).toBe("Custom diagnostic");
    const policies = await database.pool.query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='octolab.provider_lab_suites'::regclass",
    );
    expect(policies.rows[0]).toMatchObject({
      relrowsecurity: true,
      relforcerowsecurity: true,
    });
  },
);
