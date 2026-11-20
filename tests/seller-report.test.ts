import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { config } from "../server/config";
import { ProviderError } from "../server/providers";
import { sellerReport } from "../server/seller-report";
import type { TaskType, ReasonTheme } from "../server/seller-taxonomy";

let store: Store;
let obs: Observatory;
const keys = { ...config.keys };
const prices = { ...config.prices };
const budget = config.agentSessionBudgetMicros;
const ok = async () => ({
  sources: [],
  httpStatus: 200,
});
const search = vi.fn(ok);
const scrape = vi.fn(async () => ({ text: "page", httpStatus: 200 }));

beforeEach(() => {
  Object.assign(config.prices, { exa: 17000, tavily: 8000, firecrawl: 1000 });
  Object.assign(config.keys, { exa: "F", tavily: "F", firecrawl: "F" });
  config.agentSessionBudgetMicros = 100000;
  store = new Store(":memory:");
  search.mockReset().mockImplementation(ok);
  obs = new Observatory(store, { search, scrape } as never);
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, keys);
  Object.assign(config.prices, prices);
  config.agentSessionBudgetMicros = budget;
});

async function task(
  taskType: TaskType,
  choice: "exa" | "tavily" | "none" | "routed",
  options: { content?: string; theme?: ReasonTheme; cite?: boolean } = {},
) {
  const s = await obs.createAgentSession({
    title: "Private title",
    objective: "PRIVATE-OBJECTIVE",
    criteria: [{ text: "Cites evidence", weight: 1 }],
    taskType,
    host: "Test host",
  });
  const operation = {
    operation: "search" as const,
    query: "PRIVATE-QUERY",
    content: (options.content ?? "any") as "any",
  };
  await obs.discover(s.id, { need: "PRIVATE-NEED", operations: [operation] });
  if (choice === "none") return s;
  if (choice === "routed") {
    await obs.route(s.id, { requestKey: "r", need: "need", operation });
    return s;
  }
  const call = await obs.execute(s.id, {
    tool: `${choice}_search`,
    query: "PRIVATE-QUERY",
    requestKey: "c1",
    domains: [],
    statedReason: "PRIVATE-REASON",
    ...(options.theme ? { reasonTheme: options.theme } : {}),
  });
  if (options.cite)
    await obs.outcome(s.id, {
      requestKey: "o1",
      text: "PRIVATE-ANSWER",
      evidenceCallIds: [call.id],
    });
  return s;
}
const report = (provider: "exa" | "tavily", named = true, minSample = 1) =>
  sellerReport(obs, provider, { days: 30, named, minSample });

describe("seller report", () => {
  it("counts eligible, chosen, succeeded and cited tasks and who was chosen instead", async () => {
    await task("technical", "exa", { theme: "needs_page_text", cite: true });
    await task("technical", "exa", { theme: "semantic_match" });
    await task("current_events", "tavily", { theme: "recency" });
    await task("current_events", "tavily", { theme: "lower_cost" });
    await task("current_events", "none");
    const r = await report("exa");
    expect(r.funnel).toMatchObject({
      eligible: 5,
      chosen: 2,
      succeeded: 2,
      cited: 1,
      chosenShare: 0.4,
    });
    expect(r.lostTo).toEqual([{ key: "tavily", label: "Tavily", count: 2 }]);
    const news = r.byTaskType.find((t) => t.taskType === "current_events")!;
    expect(news).toMatchObject({ eligible: 3, you: 0, none: 1, share: 0 });
    expect(news.rivals[0]).toMatchObject({ key: "tavily", count: 2 });
    expect(r.reasonsFor.map((x) => x.key).sort()).toEqual([
      "needs_page_text",
      "semantic_match",
    ]);
    expect(r.reasonsAgainst.map((x) => x.key).sort()).toEqual([
      "lower_cost",
      "recency",
    ]);
    expect(r.cost.lostOnCost).toBe(1);
    expect(r.hosts).toEqual([
      { key: "Test host", label: "Test host", count: 2, share: 1 },
    ]);
  });
  it("withholds shares below the sample minimum but keeps counts", async () => {
    await task("technical", "exa");
    const r = await report("exa", true, 30);
    expect(r.funnel.chosen).toBe(1);
    expect(r.funnel.chosenShare).toBeNull();
    expect(r.byTaskType[0].share).toBeNull();
  });
  it("hides other companies' names unless named comparison is on", async () => {
    await task("technical", "tavily");
    const r = await report("exa", false);
    expect(r.lostTo).toEqual([
      { key: "other_search", label: "Other search tools", count: 1 },
    ]);
    expect(JSON.stringify(r)).not.toMatch(/tavily/i);
  });
  it("reports demand the tool could not serve separately from eligible tasks", async () => {
    await task("academic_or_longform", "exa", { content: "page_text" });
    await task("technical", "none", { content: "complete_page" });
    const r = await report("tavily");
    expect(r.funnel.eligible).toBe(0);
    expect(r.missed.map((m) => [m.key, m.count]).sort()).toEqual([
      ["incompatible:complete_page", 1],
      ["incompatible:page_text", 1],
    ]);
  });
  it("never counts a call octolab routed as an agent choice", async () => {
    await task("technical", "routed");
    const r = await report("tavily");
    expect(r.funnel).toMatchObject({ eligible: 1, chosen: 0 });
    expect(r.calls.routedByOctolab).toBe(1);
    expect(r.byTaskType[0].none).toBe(1);
  });
  it("classifies failures and what the agent did next", async () => {
    search.mockImplementationOnce(async () => {
      throw new ProviderError("http", 429);
    });
    const s = await task("technical", "exa");
    await obs.execute(s.id, {
      tool: "tavily_search",
      query: "q",
      requestKey: "c2",
      domains: [],
      statedReason: "switch",
      reasonTheme: "reliability",
    });
    const r = await report("exa");
    expect(r.calls).toMatchObject({ total: 1, failed: 1 });
    expect(r.calls.failures[0].key).toBe("rate_limited");
    expect(r.calls.afterFailure[0].key).toBe("switched_tavily");
    expect(r.coUsage[0]).toMatchObject({ key: "tavily", count: 1 });
  });
  it("contains no raw objectives, queries, reasons, answers, titles or session IDs", async () => {
    const s = await task("technical", "exa", { cite: true });
    const body = JSON.stringify(await report("exa"));
    expect(body).not.toMatch(/PRIVATE/);
    expect(body).not.toContain(s.id);
  });
  it("says so when the database is simulated", async () => {
    expect((await report("exa")).simulated).toBeNull();
    await store.db
      .prepare("INSERT INTO workspace_settings VALUES ('simulation',?)")
      .run(JSON.stringify({ note: "Simulated data." }));
    expect((await report("exa")).simulated?.note).toBe("Simulated data.");
  });
});
