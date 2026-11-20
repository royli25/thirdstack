import { providerToolNames } from "../server/provider-catalog.js";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Store } from "../server/store";
import { Observatory, sessionInput } from "../server/observation";
import { config } from "../server/config";
import { ProviderError } from "../server/providers";
let store: Store;
let obs: Observatory;
const keys = { ...config.keys };
const prices = { ...config.prices };
const search = vi.fn(async () => ({
  sources: [],
  httpStatus: 200,
  usage: { credits: 1, source: "Fixture" },
}));
const scrape = vi.fn(async () => ({
  text: "Example Domain",
  httpStatus: 200,
  pageStatus: 200,
}));
const input = () =>
  sessionInput.parse({
    title: "Fixture intent",
    objective: "Find evidence supporting the requested output",
    criteria: [
      { text: "Cites evidence", weight: 2 },
      { text: "Explains uncertainty", weight: 1 },
    ],
    budgetMicros: 25000,
    model: "test-model",
    host: "test-host",
  });
const create = async (approved = true) => {
  const s = await obs.create(input(), "operator_entered");
  return approved ? await obs.approve(s.id, s.intentHash) : s;
};
const call = (
  key = "call-1",
  tool: "exa_search" | "tavily_search" = "exa_search",
) => ({
  tool,
  query: "fixture research",
  requestKey: key,
  domains: [],
  statedReason: "Need supporting evidence",
});
beforeEach(() => {
  Object.assign(config.prices, { exa: 17000, tavily: 8000, firecrawl: 1000 });
  Object.assign(config.keys, {
    exa: "FIXTURE",
    tavily: "FIXTURE",
    firecrawl: "FIXTURE",
  });
  store = new Store(":memory:");
  search.mockClear();
  scrape.mockClear();
  obs = new Observatory(store, { search, scrape });
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, keys);
  Object.assign(config.prices, prices);
});
describe("accepted intent and explicit provider execution", () => {
  it("records a proposal with sharing enabled and refuses spending before approval", async () => {
    const s = await create(false);
    expect(s.commercialConsent).toBe(true);
    expect(s.approvedAt).toBeNull();
    await expect(obs.execute(s.id, call())).rejects.toThrow(/Approve/);
    expect(search).not.toHaveBeenCalled();
    expect(await obs.db.calls(s.id)).toHaveLength(0);
  });
  it("requires the exact intent hash and keeps approval idempotent", async () => {
    const s = await create(false);
    await expect(
      (async () => await obs.approve(s.id, "wrong"))(),
    ).rejects.toThrow(/version/);
    await obs.approve(s.id, s.intentHash);
    await obs.approve(s.id, s.intentHash);
    expect(
      (await obs.db.events(s.id)).filter((e) => e.type === "intent_approved"),
    ).toHaveLength(1);
  });
  it("rejects duplicate criteria instead of inflating the score", async () => {
    const i = input();
    i.criteria = [
      { text: "Evidence", weight: 1 },
      { text: "evidence", weight: 2 },
    ];
    await expect(
      (async () => await obs.create(i, "agent_reported"))(),
    ).rejects.toThrow(/distinct/);
  });
  it("executes the selected provider without consulting the old router", async () => {
    const s = await create();
    const c = await obs.execute(s.id, call());
    expect(search).toHaveBeenCalledWith("exa", "fixture research", [], c.id);
    expect(c.status).toBe("succeeded");
    expect((await obs.require(s.id)).spentMicros).toBe(17000);
    expect((await obs.require(s.id)).reservedMicros).toBe(0);
    expect(
      (await obs.db.events(s.id)).find(
        (e) => e.type === "selection_explanation",
      )?.provenance,
    ).toBe("agent_reported");
    expect(
      (await obs.db.events(s.id)).find((e) => e.type === "tool_called")
        ?.provenance,
    ).toBe("observed");
  });
  it("replays the same operation without a second provider call and rejects changed arguments", async () => {
    const s = await create();
    const first = await obs.execute(s.id, call());
    const replay = await obs.execute(s.id, call());
    expect(replay.id).toBe(first.id);
    expect(search).toHaveBeenCalledTimes(1);
    await expect(
      obs.execute(s.id, { ...call(), query: "different" }),
    ).rejects.toThrow(/different arguments/);
  });
  it("reserves concurrent budgets before either provider returns", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    search.mockImplementationOnce(async () => {
      await gate;
      return {
        sources: [],
        httpStatus: 200,
        usage: { credits: 1, source: "Fixture" },
      };
    });
    const s = await create();
    const pending = obs.execute(s.id, call());
    await vi.waitFor(() => expect(search).toHaveBeenCalled());
    expect((await obs.require(s.id)).reservedMicros).toBe(17000);
    await expect(obs.execute(s.id, call("second"))).rejects.toThrow(/budget/);
    const retry = await obs.execute(s.id, call());
    expect(retry.status).toBe("running");
    expect(search).toHaveBeenCalledTimes(1);
    release();
    await pending;
    expect((await obs.require(s.id)).reservedMicros).toBe(0);
  });
  it("allows exactly the accepted budget and rejects the next call", async () => {
    const s = await create();
    await obs.execute(s.id, call());
    await obs.execute(s.id, call("second", "tavily_search"));
    expect((await obs.require(s.id)).spentMicros).toBe(25000);
    await expect(
      obs.execute(s.id, call("third", "tavily_search")),
    ).rejects.toThrow(/budget/);
  });
  it("records failed calls and settles their estimate conservatively", async () => {
    search.mockRejectedValueOnce(new ProviderError("timeout", 200));
    const s = await create();
    const c = await obs.execute(s.id, call());
    expect(c).toMatchObject({
      status: "failed",
      httpStatus: 200,
      error: "Provider timeout",
    });
    expect((await obs.require(s.id)).spentMicros).toBe(17000);
    expect(obs.active.size).toBe(0);
  });
  it("never reflects unexpected exception bodies", async () => {
    search.mockRejectedValueOnce(new Error("SECRET_VENDOR_BODY"));
    const s = await create();
    const c = await obs.execute(s.id, call());
    expect(JSON.stringify(c)).not.toContain("SECRET_VENDOR_BODY");
    expect(c.error).toBe("Provider request failed.");
  });
  it("checks configured keys before attempting a call", async () => {
    config.keys.exa = "";
    const s = await create();
    await expect(obs.execute(s.id, call())).rejects.toThrow(/not configured/);
    expect(search).not.toHaveBeenCalled();
  });
  it.each([
    "http://example.com",
    "https://127.0.0.1",
    "https://user:password@example.com",
    "https://private.local",
    "https://example.com:8443",
  ])("blocks unsafe extraction URL %s", async (url) => {
    const s = await create();
    await expect(
      obs.execute(s.id, {
        tool: "firecrawl_extract",
        url,
        requestKey: "extract",
        domains: [],
        statedReason: "Retrieve the supplied source page.",
      }),
    ).rejects.toThrow(/public HTTPS/);
    expect(scrape).not.toHaveBeenCalled();
  });
  it("preserves a page 404 inside an API 200 response without claiming success of the intent", async () => {
    scrape.mockResolvedValueOnce({
      text: "Not found",
      httpStatus: 200,
      pageStatus: 404,
    });
    const s = await create();
    const c = await obs.execute(s.id, {
      tool: "firecrawl_extract",
      url: "https://example.com/missing",
      requestKey: "extract",
      domains: [],
      statedReason: "Retrieve the supplied source page.",
    });
    expect(c.result?.pageStatus).toBe(404);
    expect((await obs.require(s.id)).evaluations).toEqual([]);
  });
  it("records the offered catalog without fabricated selection or quality scores", async () => {
    const s = await create();
    const d = await obs.discover(s.id, "Search for sources");
    expect(d.tools).toHaveLength(providerToolNames.length);
    expect(
      d.tools.every((t) => t.averageLatencyMs === null && t.quality === null),
    ).toBe(true);
    expect(await obs.db.calls(s.id)).toHaveLength(0);
  });
});
describe("outcome versions, review coverage, and case evidence", () => {
  async function output(id: string, key = "output-1") {
    return await obs.outcome(id, {
      requestKey: key,
      text: "A final answer with limitations",
      evidenceCallIds: [],
    });
  }
  async function review(
    id: string,
    verdicts: ("pass" | "fail" | "unknown")[] = ["pass", "unknown"],
  ) {
    const s = await obs.require(id);
    return await obs.evaluate(id, {
      outcomeId: s.outcomes.at(-1)!.id,
      criteria: s.criteria.map((c, i) => ({
        criterionId: c.id,
        verdict: verdicts[i],
        note: "Compared the output with the accepted criterion.",
        evidenceCallIds: [],
      })),
    });
  }
  it("stores actual output as agent-reported, distinct from a review", async () => {
    const s = await create();
    await output(s.id);
    expect((await obs.require(s.id)).outcomes[0].source).toBe("agent_reported");
    expect((await obs.require(s.id)).evaluations).toHaveLength(0);
  });
  it("makes output retries idempotent and rejects changed content", async () => {
    const s = await create();
    await output(s.id);
    await output(s.id);
    expect((await obs.require(s.id)).outcomes).toHaveLength(1);
    await expect(
      (async () =>
        await obs.outcome(s.id, {
          requestKey: "output-1",
          text: "Changed",
          evidenceCallIds: [],
        }))(),
    ).rejects.toThrow(/different content/);
  });
  it("rejects evidence from a different or nonexistent session", async () => {
    const s = await create();
    await expect(
      (async () =>
        await obs.outcome(s.id, {
          requestKey: "out",
          text: "answer",
          evidenceCallIds: [crypto.randomUUID()],
        }))(),
    ).rejects.toThrow(/this session/);
  });
  it("shows partial review coverage separately from the known-criterion score", async () => {
    const s = await create();
    await output(s.id);
    const e = (await review(s.id)).evaluations.at(-1)!;
    expect(e.score).toBe(100);
    expect(e.coverage).toBe(67);
    expect(e.unknownWeight).toBe(1);
    expect((await obs.summary()).models[0].fullyReviewed).toBe(0);
  });
  it("does not turn an entirely unknown review into a zero accuracy score", async () => {
    const s = await create();
    await output(s.id);
    const e = (await review(s.id, ["unknown", "unknown"])).evaluations.at(-1)!;
    expect(e.score).toBeNull();
    expect(e.coverage).toBe(0);
  });
  it("rejects duplicated or missing criterion judgments", async () => {
    const s = await create();
    await output(s.id);
    const criteria = [0, 0].map((i) => ({
      criterionId: s.criteria[i].id,
      verdict: "pass" as const,
      note: "Evidence checked",
      evidenceCallIds: [],
    }));
    await expect(
      (async () =>
        await obs.evaluate(s.id, {
          outcomeId: (await obs.require(s.id)).outcomes[0].id,
          criteria,
        }))(),
    ).rejects.toThrow(/exactly once/);
  });
  it("requires reviewing the latest outcome and preserves past evaluations", async () => {
    const s = await create();
    await output(s.id);
    const old = (await review(s.id)).evaluations[0];
    await output(s.id, "output-2");
    await expect(
      (async () =>
        await obs.evaluate(s.id, {
          outcomeId: old.outcomeId,
          criteria: old.criteria,
        }))(),
    ).rejects.toThrow(/latest output/);
    expect((await obs.summary()).reviews).toBe(0);
    expect((await obs.require(s.id)).evaluations).toHaveLength(1);
  });
  it("opens and resolves a review case without implying an issued refund", async () => {
    const s = await create();
    await output(s.id);
    const e = (await review(s.id, ["fail", "pass"])).evaluations[0];
    const opened = await obs.openCase(
      s.id,
      e.id,
      "The output missed a required criterion.",
    );
    const c = opened.cases[0];
    expect((await obs.summary()).openCases).toBe(1);
    await obs.resolveCase(
      s.id,
      c.id,
      "resolved",
      "Documented a replacement output for the customer.",
    );
    expect((await obs.summary()).openCases).toBe(0);
    expect((await obs.db.events(s.id)).at(-1)?.data.paymentIssued).toBe(false);
    await expect(
      (async () =>
        await obs.resolveCase(
          s.id,
          c.id,
          "dismissed",
          "Cannot overwrite resolution",
        ))(),
    ).rejects.toThrow(/already/);
  });
  it("detects an altered audit payload", async () => {
    const s = await create();
    expect((await obs.db.detail(s.id))?.integrity).toBe(true);
    const e = (await store.db
      .prepare("SELECT id,body FROM observation_events LIMIT 1")
      .get())!;
    const body = JSON.parse(e.body as string);
    body.data.objective = "Tampered";
    await store.db
      .prepare("UPDATE observation_events SET body=? WHERE id=?")
      .run(JSON.stringify(body), e.id);
    expect((await obs.db.detail(s.id))?.integrity).toBe(false);
  });
  it("recovers uncertain in-flight work without retrying or releasing its estimate", async () => {
    const s = await create();
    const c = {
      id: crypto.randomUUID(),
      sessionId: s.id,
      requestKey: "interrupted",
      tool: "exa_search" as const,
      provider: "exa" as const,
      arguments: { query: "fixture" },
      statedReason: "Retrieve the supplied source page.",
      status: "running" as const,
      startedAt: new Date().toISOString(),
      estimateMicros: 17000,
    };
    s.reservedMicros = 17000;
    await obs.db.save(s);
    await obs.db.saveCall(c, "signature");
    await obs.db.recover();
    await obs.db.recover();
    expect(await obs.require(s.id)).toMatchObject({
      reservedMicros: 0,
      spentMicros: 17000,
    });
    expect((await obs.db.calls(s.id))[0].status).toBe("interrupted");
    expect(search).not.toHaveBeenCalled();
    expect((await obs.db.detail(s.id))?.integrity).toBe(true);
  });
  it("withholds model comparisons until five fully reviewed sessions", async () => {
    for (let i = 0; i < 5; i++) {
      const s = await create();
      await output(s.id);
      await review(s.id, ["pass", "fail"]);
      if (i < 4) expect((await obs.summary()).models[0].score).toBeNull();
    }
    expect((await obs.summary()).models[0]).toMatchObject({
      fullyReviewed: 5,
      score: 67,
    });
  });
  it("includes all sessions in aggregates without per-session opt-in and excludes raw intent", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const s = await create();
      ids.push(s.id);
      await obs.consent(s.id, true);
      await obs.execute(s.id, call(`share-${i}`));
    }
    const aggregate = await obs.commercialAggregate();
    expect(aggregate.available).toBe(true);
    expect(aggregate.providers).toHaveLength(1);
    expect(JSON.stringify(aggregate)).not.toContain("fixture research");
    await expect(
      (async () => await obs.consent(ids[0], false))(),
    ).rejects.toThrow(/account policy/);
    expect((await obs.commercialAggregate()).available).toBe(true);
  });
});
it("shares rate-limit admission with the earlier research engine", async () => {
  const { Engine } = await import("../server/engine");
  const engine = new Engine(store);
  const shared = new Observatory(store, { search, scrape }, engine.timestamps);
  const s = await shared.create(input(), "operator_entered");
  await shared.approve(s.id, s.intentHash);
  engine.timestamps.set("exa", Array(config.rpm).fill(Date.now()));
  await expect(shared.execute(s.id, call())).rejects.toThrow(
    "Provider request limit",
  );
  expect((await shared.require(s.id)).reservedMicros).toBe(0);
  expect(await shared.db.calls(s.id)).toHaveLength(0);
  engine.timestamps.set("exa", Array(config.rpm - 1).fill(Date.now()));
  await shared.execute(s.id, call());
  expect(engine.limited().has("exa")).toBe(true);
});
it("preserves assistant-review provenance independently of the delivered output", async () => {
  const s = await create();
  const out = await obs.outcome(s.id, {
    requestKey: "o",
    text: "Synthetic output",
    evidenceCallIds: [],
  });
  const reviewed = await obs.evaluate(s.id, {
    outcomeId: out.outcomes[0].id,
    reviewer: { kind: "assistant_reported", label: "Synthetic QA assistant" },
    criteria: s.criteria.map((c) => ({
      criterionId: c.id,
      verdict: "pass",
      note: "Synthetic review, not a human assessment",
      evidenceCallIds: [],
    })),
  });
  expect(reviewed.evaluations[0].reviewer).toEqual({
    kind: "assistant_reported",
    label: "Synthetic QA assistant",
  });
  expect((await obs.summary()).models[0].assistantReviewed).toBe(1);
  expect((await obs.db.events(s.id)).at(-1)?.data.reviewer).toEqual(
    reviewed.evaluations[0].reviewer,
  );
});
it("permits an explicit retrospective review without replacing the latest output's score", async () => {
  const s = await create();
  const original = (
    await obs.outcome(s.id, {
      requestKey: "first",
      text: "An earlier incomplete output",
      evidenceCallIds: [],
    })
  ).outcomes[0];
  const revised = (
    await obs.outcome(s.id, {
      requestKey: "second",
      text: "A revised output",
      evidenceCallIds: [],
    })
  ).outcomes[1];
  const criteria = s.criteria.map((c) => ({
    criterionId: c.id,
    verdict: "fail" as const,
    note: "The earlier output did not fulfill this criterion.",
    evidenceCallIds: [],
  }));
  await expect(
    (async () =>
      await obs.evaluate(s.id, { outcomeId: original.id, criteria }))(),
  ).rejects.toThrow("latest output");
  await obs.evaluate(s.id, {
    outcomeId: original.id,
    historical: true,
    criteria,
  });
  expect((await obs.summary()).reviews).toBe(0);
  expect((await obs.summary()).models[0].reviewed).toBe(0);
  await obs.evaluate(s.id, {
    outcomeId: revised.id,
    criteria: criteria.map((c) => ({ ...c, verdict: "pass" })),
  });
  expect((await obs.summary()).reviews).toBe(1);
  expect((await obs.db.get(s.id))?.evaluations[0].historical).toBe(true);
  await expect(
    (async () =>
      await obs.evaluate(s.id, {
        outcomeId: crypto.randomUUID(),
        historical: true,
        criteria,
      }))(),
  ).rejects.toThrow("Output version not found");
});
it("exports each recorded provider's usage without a session cohort threshold", async () => {
  for (let i = 0; i < 5; i++) {
    const s = await obs.create(input(), "operator_entered");
    await obs.approve(s.id, s.intentHash);
    await obs.consent(s.id, true);
    await obs.execute(s.id, {
      ...call(`split-${i}`),
      tool: i < 3 ? "exa_search" : "tavily_search",
    });
  }
  expect(await obs.commercialAggregate()).toMatchObject({
    available: true,
    consentedSessions: 5,
    minimumCohort: 0,
    providers: [
      expect.objectContaining({ provider: "exa", sessions: 3, calls: 3 }),
      expect.objectContaining({ provider: "tavily", sessions: 2, calls: 2 }),
    ],
  });
  expect((await obs.summary()).sharing.available).toBe(true);
});
it("exports a first completed call and leaves an unused provider out of the export", async () => {
  expect(await obs.commercialAggregate()).toMatchObject({
    available: false,
    minimumCohort: 0,
    providers: [],
  });
  const session = await create();
  await obs.execute(session.id, call("first-call"));
  expect(await obs.commercialAggregate()).toMatchObject({
    available: true,
    minimumCohort: 0,
    providers: [
      expect.objectContaining({
        provider: "exa",
        sessions: 1,
        calls: 1,
        successes: 1,
      }),
    ],
  });
  expect((await obs.summary()).models[0]).toMatchObject({
    minimumSamples: 5,
    score: null,
  });
});
describe("request cost decisions and budget enforcement", () => {
  it("quotes result counts and search depth without making provider calls", async () => {
    const s = await create();
    const d = await obs.discover(s.id, "Compare a focused search", [
      { tool: "exa_search", query: "fixture", maxResults: 20 },
      {
        tool: "tavily_search",
        query: "fixture",
        searchDepth: "advanced",
        maxResults: 5,
      },
    ]);
    expect(d.tools[0].requestEstimates[0].estimatedMicros).toBe(
      17000 + 10 * config.exaAdditionalResultMicros,
    );
    expect(d.tools[0].requestEstimates[0].withinBudget).toBe(false);
    expect(d.tools[1].requestEstimates[1].estimatedMicros).toBe(16000);
    expect(d.tools[1].requestEstimates[1].withinBudget).toBe(true);
    expect(search).not.toHaveBeenCalled();
    expect(scrape).not.toHaveBeenCalled();
    expect((await obs.require(s.id)).spentMicros).toBe(0);
    expect((await obs.db.events(s.id)).at(-1)?.data.tools).toEqual(d.tools);
  });
  it("reserves the quoted cost, passes options, and rejects changes on retry", async () => {
    const s = await create();
    const args = {
      ...call("advanced", "tavily_search"),
      maxResults: 5,
      searchDepth: "advanced" as const,
    };
    const c = await obs.execute(s.id, args);
    expect(c.estimateMicros).toBe(16000);
    expect(search).toHaveBeenCalledWith("tavily", args.query, [], c.id, {
      maxResults: 5,
      searchDepth: "advanced",
    });
    expect((await obs.require(s.id)).spentMicros).toBe(16000);
    await expect(
      obs.execute(s.id, { ...args, maxResults: 10 }),
    ).rejects.toThrow(/different arguments/);
    await expect(
      obs.execute(s.id, { ...args, requestKey: "another" }),
    ).rejects.toThrow(/exceed/);
    expect(search).toHaveBeenCalledTimes(1);
  });
  it("blocks larger Exa requests before execution and rejects incompatible options", async () => {
    const s = await create();
    await expect(
      obs.execute(s.id, { ...call(), maxResults: 20 }),
    ).rejects.toThrow(/exceed/);
    await expect(
      (async () =>
        await obs.discover(s.id, "invalid", [
          { tool: "exa_search", query: "fixture", searchDepth: "advanced" },
        ]))(),
    ).rejects.toThrow(/searchDepth is not supported/);
    await expect(
      (async () =>
        await obs.discover(s.id, "invalid", [
          {
            tool: "firecrawl_extract",
            url: "https://example.com",
            maxResults: 5,
          },
        ]))(),
    ).rejects.toThrow(/extraction/);
    await expect(
      (async () =>
        await obs.discover(s.id, "invalid", [
          { tool: "firecrawl_extract", url: "https://127.0.0.1" },
        ]))(),
    ).rejects.toThrow(/public HTTPS/);
    expect(search).not.toHaveBeenCalled();
  });
});
