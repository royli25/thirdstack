import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { createApp } from "../server/app";
import { config } from "../server/config";
const originalKeys = { ...config.keys };
let store: Store;
let obs: Observatory;
const search = vi.fn(async () => ({
  sources: [],
  httpStatus: 200,
  usage: { providerReportedUsd: 0.007, credits: 1, source: "fixture" },
}));
const scrape = vi.fn(async () => ({ text: "fixture", httpStatus: 200 }));
const create = async () =>
  await obs.createAgentSession({
    title: "Workspace fixture",
    objective: "Find supporting sources",
    criteria: [{ text: "Sources", weight: 1 }],
    constraints: "",
    model: "fixture-model",
    host: "fixture-client",
  });
const call = (key = "first") => ({
  tool: "exa_search",
  query: "fixture",
  requestKey: key,
  statedReason: "Find supporting sources",
});
beforeEach(() => {
  store = new Store(":memory:");
  Object.assign(config.keys, {
    exa: "fixture",
    tavily: "fixture",
    firecrawl: "fixture",
  });
  search.mockClear();
  scrape.mockClear();
  obs = new Observatory(store, { search, scrape });
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, originalKeys);
});
describe("workspace tool routing", () => {
  it("persists policy across instances, rejects stale writes, and validates tools", async () => {
    const policy = await obs.updateRoutingPolicy({
      revision: 0,
      disabledTools: ["exa_search"],
    });
    expect(await new Observatory(store).routingPolicy()).toEqual(policy);
    await expect(
      (async () =>
        await obs.updateRoutingPolicy({ revision: 0, disabledTools: [] }))(),
    ).rejects.toThrow(/changed elsewhere/);
    await expect(
      (async () =>
        await obs.updateRoutingPolicy({
          revision: 1,
          disabledTools: ["unknown"],
        }))(),
    ).rejects.toThrow();
    expect(
      (
        await store.db
          .prepare("SELECT COUNT(*) AS n FROM workspace_policy_events")
          .get()
      )?.n,
    ).toBe(1);
  });
  it("excludes paused tools from discovery and rejects calls before spending", async () => {
    const s = await create();
    await obs.updateRoutingPolicy({
      revision: 0,
      disabledTools: ["exa_search"],
    });
    const result = await obs.discover(s.id, {
      need: "fixture",
      operations: [{ operation: "search", query: "fixture" }],
    });
    expect(result.candidateTools).not.toContain("exa_search");
    expect(
      result.tools.find((t) => t.tool === "exa_search")?.discoveryMatches[0]
        .status,
    ).toBe("disabled");
    await expect(obs.execute(s.id, call())).rejects.toThrow(/paused/);
    expect(search).not.toHaveBeenCalled();
    expect((await obs.require(s.id)).spentMicros).toBe(0);
    expect((await obs.require(s.id)).reservedMicros).toBe(0);
    expect(await obs.db.calls(s.id)).toEqual([]);
  });
  it("replays old receipts after pausing, but rejects new calls until re-enabled", async () => {
    const s = await create();
    const first = await obs.execute(s.id, call());
    await obs.updateRoutingPolicy({
      revision: 0,
      disabledTools: ["exa_search"],
    });
    expect((await obs.execute(s.id, call())).id).toBe(first.id);
    await expect(obs.execute(s.id, call("next"))).rejects.toThrow(/paused/);
    await obs.updateRoutingPolicy({ revision: 1, disabledTools: [] });
    await obs.execute(s.id, call("next"));
    expect(search).toHaveBeenCalledTimes(2);
  });
  it("previews operation compatibility without sessions, provider calls, or events", async () => {
    const result = await obs.preview({
      need: "fixture",
      operations: [
        { operation: "search", query: "fixture", content: "page_text" },
      ],
    });
    expect(result.candidateTools).toEqual(["exa_search"]);
    expect(
      result.tools.find((t) => t.tool === "exa_search")?.requestEstimates[0]
        .estimatedMicros,
    ).toBeGreaterThan(0);
    expect(await obs.db.list()).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    expect(
      (
        await obs.preview({
          need: "fixture",
          operations: [
            { operation: "search", query: "fixture", content: "complete_page" },
          ],
        })
      ).candidateTools,
    ).toEqual([]);
  });
  it("returns actionable validation for unsupported extraction URLs", async () => {
    const result = await request(createApp(store, undefined, obs))
      .post("/api/account/preview")
      .set("Host", "localhost")
      .send({
        need: "preview",
        operations: [
          { operation: "extract", url: "http://www.wikipedia.org/" },
        ],
      });
    expect(result.status).toBe(400);
    expect(result.body.error).toMatch(/https/i);
    expect(search).not.toHaveBeenCalled();
  });
  it("unconfigured providers cannot be made eligible by enabling a tool", async () => {
    config.keys.exa = "";
    const result = await obs.preview({
      need: "fixture",
      operations: [{ operation: "search", query: "fixture" }],
    });
    expect(result.candidateTools).not.toContain("exa_search");
  });
});
describe("workspace API", () => {
  it("paginates activity and exports the full filtered snapshot", async () => {
    const s = await create();
    for (let i = 0; i < 23; i++)
      await obs.db.saveCall(
        {
          id: crypto.randomUUID(),
          sessionId: s.id,
          requestKey: `fixture-${i}`,
          tool: "exa_search",
          provider: "exa",
          arguments: { query: "pagination fixture" },
          statedReason: "Test pagination",
          status: "succeeded",
          startedAt: new Date(Date.now() - i * 1000).toISOString(),
          estimateMicros: 1000,
        },
        `fixture-${i}`,
      );
    const app = createApp(store, undefined, obs);
    const first = await request(app)
      .get("/api/account/activity?q=pagination")
      .set("Host", "localhost");
    const second = await request(app)
      .get("/api/account/activity?q=pagination&page=2")
      .set("Host", "localhost");
    expect(first.body.items).toHaveLength(20);
    expect(second.body.items).toHaveLength(3);
    expect(
      new Set(
        [...first.body.items, ...second.body.items].map(
          (i: { id: string }) => i.id,
        ),
      ).size,
    ).toBe(23);
    const exported = await request(app)
      .get("/api/account/activity?q=pagination&export=true")
      .set("Host", "localhost");
    expect(exported.body.items).toHaveLength(23);
    expect(exported.body.total).toBe(23);
  });
  it("returns scoped usage, separated reported units, and filtered paginated activity", async () => {
    const app = createApp(store, undefined, obs);
    const s = await create();
    const c = await obs.execute(s.id, call());
    const usage = await request(app)
      .get("/api/account/usage?days=7")
      .set("Host", "localhost");
    expect(usage.status).toBe(200);
    expect(usage.body.requests).toBe(1);
    expect(usage.body.series).toHaveLength(7);
    expect(usage.body.reportedUsd).toBe(0.007);
    expect(usage.body.usdReportingCalls).toBe(1);
    expect(usage.body.providers[0].reportedCredits).toBe(1);
    const log = await request(app)
      .get("/api/account/activity?provider=exa&status=succeeded&q=fixture")
      .set("Host", "localhost");
    expect(log.body.total).toBe(1);
    expect(log.body.items[0].id).toBe(c.id);
    expect(log.body.items[0].result).toBeUndefined();
    expect(
      (
        await request(app)
          .get("/api/account/activity?provider=tavily")
          .set("Host", "localhost")
      ).body.total,
    ).toBe(0);
    expect(
      (
        await request(app)
          .get("/api/account/usage?days=6")
          .set("Host", "localhost")
      ).status,
    ).toBe(400);
  });
  it("returns an honest empty state and does not include old calls", async () => {
    const s = await create();
    await obs.execute(s.id, call());
    await store.db
      .prepare(
        "UPDATE observation_calls SET body=json_set(body,'$.startedAt','2020-01-01T00:00:00.000Z')",
      )
      .run();
    const result = await request(createApp(store, undefined, obs))
      .get("/api/account/usage")
      .set("Host", "localhost");
    expect(result.body.requests).toBe(0);
    expect(result.body.reportedUsd).toBeNull();
    expect(result.body.averageLatencyMs).toBeNull();
  });
  it("protects workspace endpoints with existing auth and origin checks", async () => {
    const token = config.token;
    config.token = "fixture-token";
    try {
      const app = createApp(store, undefined, obs);
      expect((await request(app).get("/api/account/activity")).status).toBe(
        401,
      );
      expect(
        (
          await request(app)
            .post("/api/account/routing")
            .set("Authorization", "Bearer fixture-token")
            .set("Origin", "https://evil.example")
            .send({ revision: 0, disabledTools: [] })
        ).status,
      ).toBe(403);
      expect(
        (
          await request(app)
            .get("/api/account/connection")
            .set("Authorization", "Bearer fixture-token")
        ).body.providers.exa,
      ).toBe(true);
    } finally {
      config.token = token;
    }
  });
});
