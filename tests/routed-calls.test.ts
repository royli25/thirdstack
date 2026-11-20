import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Store } from "../server/store";
import { Observatory, sessionInput } from "../server/observation";
import { config } from "../server/config";
import { ProviderError } from "../server/providers";
import { rankRoute, type RouteSignal } from "../server/route-policy";
import { providerToolNames } from "../server/provider-catalog";

let store: Store;
let obs: Observatory;
const keys = { ...config.keys };
const prices = { ...config.prices };
const ok = async () => ({
  sources: [],
  httpStatus: 200,
  usage: { credits: 1, source: "Fixture" },
});
const search = vi.fn(ok);
const scrape = vi.fn(async () => ({
  text: "Example Domain",
  httpStatus: 200,
  pageStatus: 200,
}));
const create = async () => {
  const s = await obs.create(
    sessionInput.parse({
      title: "Fixture intent",
      objective: "Find evidence supporting the requested output",
      criteria: [{ text: "Cites evidence", weight: 1 }],
      budgetMicros: 100000,
      model: "test-model",
      host: "test-host",
    }),
    "operator_entered",
  );
  return await obs.approve(s.id, s.intentHash);
};
const request = (
  requestKey = "route-1",
  extra: Record<string, unknown> = {},
) => ({
  requestKey,
  need: "Find sources for the fixture question",
  operation: { operation: "search", query: "fixture research" },
  ...extra,
});
const events = async (id: string, type: string) =>
  (await obs.db.events(id)).filter((e) => e.type === type);

beforeEach(() => {
  Object.assign(config.prices, { exa: 17000, tavily: 8000, firecrawl: 1000 });
  Object.assign(config.keys, {
    exa: "FIXTURE",
    tavily: "FIXTURE",
    firecrawl: "FIXTURE",
  });
  store = new Store(":memory:");
  search.mockReset().mockImplementation(ok);
  scrape.mockClear();
  obs = new Observatory(store, { search, scrape });
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, keys);
  Object.assign(config.prices, prices);
});

const signal = (over: Partial<RouteSignal>): RouteSignal => ({
  tool: "a",
  provider: "a",
  status: "eligible",
  reason: "",
  estimatedMicros: 1000,
  medianLatencyMs: null,
  successRate: null,
  sampleCount: 0,
  ...over,
});

describe("route policy", () => {
  it("marks unmeasured components instead of presenting them as measurements", () => {
    const r = rankRoute(
      [signal({ tool: "a" }), signal({ tool: "b", estimatedMicros: 2000 })],
      "balanced",
    );
    expect(r.ranking).toEqual(["a", "b"]);
    expect(r.candidates[0].unmeasured).toEqual(["latency", "reliability"]);
    expect(r.candidates[0].components).toEqual({
      cost: 1,
      latency: 0.5,
      reliability: 0.5,
    });
    expect(r.summary).toMatch(/unmeasured/i);
  });
  it("lets measured reliability outweigh price when reliability is the priority", () => {
    const tools = [
      signal({ tool: "cheap", successRate: 0.4, sampleCount: 10 }),
      signal({
        tool: "steady",
        estimatedMicros: 2000,
        successRate: 1,
        sampleCount: 10,
      }),
    ];
    expect(rankRoute(tools, "cost").ranking[0]).toBe("cheap");
    expect(rankRoute(tools, "reliability").ranking[0]).toBe("steady");
  });
  it("never ranks an ineligible tool", () => {
    const r = rankRoute(
      [signal({ tool: "a", status: "disabled", reason: "Paused." })],
      "balanced",
    );
    expect(r.ranking).toEqual([]);
    expect(r.candidates[0]).toMatchObject({ eligible: false, score: null });
    expect(r.summary).toMatch(/No eligible tool/);
  });
});

describe("routed calls", () => {
  it("records the decision with every candidate before running the chosen tool", async () => {
    const s = await create();
    const out = await obs.route(s.id, request());
    expect(out.decision.chosenTool).toBe("tavily_search");
    expect(out.decision.ranking).toEqual(["tavily_search", "exa_search"]);
    expect(out.call).toMatchObject({
      tool: "tavily_search",
      status: "succeeded",
      selectedBy: "server_route",
      routeDecisionId: out.decision.decisionId,
    });
    expect(search).toHaveBeenCalledTimes(1);
    const all = await obs.db.events(s.id);
    const decided = all.find((e) => e.type === "route_decided")!;
    const called = all.find((e) => e.type === "tool_called")!;
    expect(decided.id).toBeLessThan(called.id);
    expect(decided.provenance).toBe("observed");
    expect(called.data.selectedBy).toBe("server_route");
    const candidates = decided.data.candidates as {
      tool: string;
      status: string;
    }[];
    // Every registered tool is recorded, including the ones that cannot serve a search.
    expect(candidates.map((c) => c.tool).sort()).toEqual(
      [...providerToolNames].sort(),
    );
    expect(candidates.find((c) => c.tool === "firecrawl_extract")!.status).toBe(
      "incompatible",
    );
    // The agent's need is not recorded as a reason for choosing a tool.
    expect(await events(s.id, "selection_explanation")).toHaveLength(0);
  });
  it("respects hard requirements before price", async () => {
    const s = await create();
    const out = await obs.route(
      s.id,
      request("route-text", {
        operation: {
          operation: "search",
          query: "fixture research",
          content: "page_text",
        },
      }),
    );
    expect(out.decision.ranking).toEqual(["exa_search"]);
  });
  it("replays the same key without a new decision or new spend", async () => {
    const s = await create();
    const first = await obs.route(s.id, request());
    const again = await obs.route(s.id, request());
    expect(again.replayed).toBe(true);
    expect(again.call.id).toBe(first.call.id);
    expect(again.decision.decisionId).toBe(first.decision.decisionId);
    expect(search).toHaveBeenCalledTimes(1);
    expect(await events(s.id, "route_decided")).toHaveLength(1);
    await expect(
      obs.route(s.id, request("route-1", { priority: "cost" })),
    ).rejects.toThrow(/different arguments/);
  });
  it("falls back once to the next ranked tool and records why", async () => {
    const s = await create();
    search.mockImplementationOnce(async () => {
      throw new ProviderError("http", 503);
    });
    const out = await obs.route(s.id, request());
    expect(out.attempts.map((a) => [a.tool, a.status])).toEqual([
      ["tavily_search", "failed"],
      ["exa_search", "succeeded"],
    ]);
    expect(out.call.tool).toBe("exa_search");
    const [fallback] = await events(s.id, "route_fallback");
    expect(fallback.data).toMatchObject({
      fromTool: "tavily_search",
      toTool: "exa_search",
      httpStatus: 503,
    });
    expect(await obs.db.calls(s.id)).toHaveLength(2);
    // A replay must not write the fallback twice or call a provider again.
    await obs.route(s.id, request());
    expect(await events(s.id, "route_fallback")).toHaveLength(1);
    expect(search).toHaveBeenCalledTimes(2);
  });
  it("does not fall back when the caller forbids it", async () => {
    const s = await create();
    search.mockImplementationOnce(async () => {
      throw new ProviderError("http", 503);
    });
    const out = await obs.route(
      s.id,
      request("route-1", { allowFallback: false }),
    );
    expect(out.call.status).toBe("failed");
    expect(search).toHaveBeenCalledTimes(1);
    expect(await events(s.id, "route_fallback")).toHaveLength(0);
  });
  it("records an unavailable route and leaves the key free for a later retry", async () => {
    const s = await create();
    const policy = await obs.routingPolicy();
    await obs.updateRoutingPolicy({
      revision: policy.revision,
      disabledTools: ["exa_search", "tavily_search"],
    });
    await expect(obs.route(s.id, request())).rejects.toThrow(
      /No eligible tool/,
    );
    expect(search).not.toHaveBeenCalled();
    expect(await events(s.id, "route_unavailable")).toHaveLength(1);
    await obs.updateRoutingPolicy({
      revision: policy.revision + 1,
      disabledTools: [],
    });
    expect((await obs.route(s.id, request())).call.status).toBe("succeeded");
  });
  it("lists every decision with what it led to, without the request signature", async () => {
    const s = await create();
    await obs.route(s.id, request());
    const [row] = await obs.routeDecisions();
    expect(row).toMatchObject({
      sessionId: s.id,
      outcome: "decided",
      chosenTool: "tavily_search",
      finalStatus: "succeeded",
    });
    expect(row).not.toHaveProperty("signature");
    expect(row.attempts).toHaveLength(1);
  });
});
