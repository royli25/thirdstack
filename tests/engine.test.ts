import { availability } from "./helpers";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { Store } from "../server/store";
import { Engine } from "../server/engine";
import { config } from "../server/config";
import { createTask, providerResults } from "./helpers";
let store: Store;
let engine: Engine;
const originalPrices = { ...config.prices };
beforeEach(() => {
  config.prices.exa = 5000;
  config.prices.tavily = 8000;
  store = new Store(":memory:");
  engine = new Engine(store);
  vi.spyOn(engine, "available").mockReturnValue({
    ...availability(false),
    exa: true,
    tavily: true,
    firecrawl: true,
    jina: true,
  });
});
afterEach(async () => {
  Object.assign(config.prices, originalPrices);
  await store.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function mockSearch(count = 3) {
  return vi.fn(
    async (input: string | URL | Request) =>
      new Response(
        JSON.stringify(
          providerResults(
            String(input).includes("exa") ? "exa" : "tavily",
            count,
          ),
        ),
        { status: 200 },
      ),
  );
}
describe("budgeted execution", () => {
  it("executes one successful route, records complete ledger, and never equates HTTP success with task success", async () => {
    const fetch = mockSearch();
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    await engine.execute(t.id, t.intent.query);
    const final = (await store.get(t.id))!;
    expect(final.spentMicros).toBe(config.prices.exa);
    expect(final.reservedMicros).toBe(0);
    expect(final.sources).toHaveLength(3);
    expect(fetch).toHaveBeenCalledTimes(1);
    const events = await store.events(t.id);
    expect(
      events.find((e) => e.type === "provider_response")?.data.httpStatus,
    ).toBe(200);
    expect(
      events.find((e) => e.type === "outcome_evaluated")?.data.taskCriteria,
    ).toBe("unknown");
    expect(events.filter((e) => e.type === "budget_settled")).toHaveLength(1);
  });
  it("falls back after a 200 response with insufficient evidence and charges both estimates", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(providerResults("exa", 1))),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(providerResults("tavily", 3))),
      );
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    await engine.execute(t.id, t.intent.query);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect((await store.get(t.id))?.spentMicros).toBe(
      config.prices.exa + config.prices.tavily,
    );
    expect(
      (await store.events(t.id)).find((e) => e.type === "fallback_triggered"),
    ).toBeDefined();
  });
  it("does not call an unaffordable fallback", async () => {
    const fetch = mockSearch(0);
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store, { budgetMicros: config.prices.exa });
    await engine.execute(t.id, t.intent.query);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((await store.get(t.id))?.spentMicros).toBeLessThanOrEqual(
      t.intent.budgetMicros,
    );
    expect(
      (await store.events(t.id)).some((e) => e.type === "route_blocked"),
    ).toBe(true);
  });
  it("makes controlled compare calls with the same normalized query", async () => {
    const fetch = mockSearch();
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store, { mode: "compare" });
    await engine.execute(t.id, t.intent.query);
    expect(fetch).toHaveBeenCalledTimes(2);
    const bodies = fetch.mock.calls.map((c) => JSON.parse((c as any)[1].body));
    expect(bodies[0].query).toBe(bodies[1].query);
    expect((await store.get(t.id))?.status).toBe("complete");
  });
  it("retains timeout estimates, falls back, and does not leak raw errors", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(
        new DOMException("secret-key-in-error", "TimeoutError"),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(providerResults("tavily"))),
      );
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    await engine.execute(t.id, t.intent.query);
    expect((await store.get(t.id))?.spentMicros).toBe(
      config.prices.exa + config.prices.tavily,
    );
    const events = await store.events(t.id);
    expect(
      events.filter((e) => e.type === "provider_response")[0].data.error,
    ).toBe("Provider timeout");
    expect(JSON.stringify(events)).not.toContain("secret-key-in-error");
  });
  it("enforces domain restrictions and rejects malformed successful payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ results: null })))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(providerResults("tavily"))),
        ),
    );
    const t = await createTask(store, { domains: ["allowed.com"] });
    await engine.execute(t.id, t.intent.query);
    expect((await store.get(t.id))?.sources).toHaveLength(0);
    expect(
      (await store.events(t.id)).filter(
        (e) => e.type === "provider_response",
      )[0].data.error,
    ).toContain("invalid response");
  });
  it("recovers interrupted reservations conservatively across restart", async () => {
    const t = await createTask(store);
    await engine.reserve(t.id, "exa", "call-1", "research.search", {});
    await store.recover();
    expect(await store.get(t.id)).toMatchObject({
      status: "partial",
      spentMicros: config.prices.exa,
      reservedMicros: 0,
    });
    expect((await store.events(t.id)).at(-1)?.data.billing).toBe("unknown");
  });
  it("rejects extraction of IP and local URLs before reserving a paid call", async () => {
    const t = await createTask(store);
    t.sources = [
      {
        id: "s1",
        title: "Local",
        url: "https://127.0.0.1/admin",
        snippet: "",
        provider: "exa",
        callId: "c1",
      },
    ];
    await store.save(t);
    await expect(engine.fetchUrl(t, "s1")).rejects.toThrow("public HTTPS");
    expect((await store.get(t.id))?.spentMicros).toBe(0);
    expect(await store.events(t.id)).toHaveLength(0);
  });
});
describe("controlled plans and audited quality", () => {
  it("executes normalized queries in order, using the shared budget", async () => {
    const fetch = mockSearch();
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    await engine.execute(t.id, [
      "discovery query",
      "funding evidence query",
      "activity query",
    ]);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(
      fetch.mock.calls.map((c) => JSON.parse((c as any)[1].body).query),
    ).toEqual(["discovery query", "funding evidence query", "activity query"]);
    expect((await store.get(t.id))?.spentMicros).toBe(config.prices.exa * 3);
  });
  it("cannot exceed a shared plan budget even when multiple queries need fallback", async () => {
    const fetch = mockSearch(0);
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store, { budgetMicros: config.prices.exa });
    await engine.execute(t.id, ["discovery query", "second query"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((await store.get(t.id))?.spentMicros).toBe(config.prices.exa);
    expect((await store.get(t.id))?.status).toBe("partial");
  });
  it("derives quality only from complete human rubric reviews with evidence notes", async () => {
    vi.stubGlobal("fetch", mockSearch());
    const t = await createTask(store);
    await engine.execute(t.id, t.intent.query);
    const final = (await store.get(t.id))!;
    expect((await store.observations())[0].quality).toBeNull();
    final.assessments = [
      {
        sourceId: final.sources[0].id,
        organization: "Example",
        criteria: { Active: "pass", Funded: "fail", Relevant: "pass" },
        disposition: "rejected",
        note: "No funding evidence",
      },
    ];
    await store.save(final);
    expect((await store.observations())[0].quality).toBeCloseTo(2 / 3);
    final.assessments[0].criteria.Funded = "unknown";
    await store.save(final);
    expect((await store.observations())[0].quality).toBeNull();
  });
});
describe("interruption and ledger invariants", () => {
  it("stops a plan between calls without discarding the in-flight estimate", async () => {
    const t = await createTask(store);
    engine.active.add(t.id);
    const fetch = vi.fn(async () => {
      await engine.cancel(t.id);
      return new Response(JSON.stringify(providerResults("exa")));
    });
    vi.stubGlobal("fetch", fetch);
    await engine.execute(t.id, ["first query", "second query"]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await store.get(t.id)).toMatchObject({
      status: "partial",
      spentMicros: config.prices.exa,
      reservedMicros: 0,
    });
    expect(engine.active.has(t.id)).toBe(false);
  });
  it("settles a call at most once even if delivery code repeats settlement", async () => {
    const t = await createTask(store);
    const estimate = await engine.reserve(
      t.id,
      "exa",
      "unique-call",
      "research.search",
      {},
    );
    const response = {
      success: true,
      httpStatus: 200,
      latencyMs: 10,
      resultCount: 0,
    };
    await engine.settle(t.id, "unique-call", "exa", estimate, response);
    await engine.settle(t.id, "unique-call", "exa", estimate, response);
    expect((await store.get(t.id))?.spentMicros).toBe(estimate);
    expect((await store.get(t.id))?.reservedMicros).toBe(0);
    expect(
      (await store.events(t.id)).filter((e) => e.type === "budget_settled"),
    ).toHaveLength(1);
  });
  it("recovery is idempotent and records an interrupted ledger entry per call", async () => {
    const t = await createTask(store);
    await engine.reserve(t.id, "exa", "pending-call", "research.search", {});
    await store.recover();
    await store.recover();
    expect((await store.get(t.id))?.spentMicros).toBe(config.prices.exa);
    expect(
      (await store.events(t.id)).filter((e) => e.type === "budget_settled"),
    ).toHaveLength(1);
    expect(
      (await store.events(t.id)).find((e) => e.type === "provider_interrupted")
        ?.callId,
    ).toBe("pending-call");
  });
  it("reports a partially completed plan when later queries have no remaining budget", async () => {
    vi.stubGlobal("fetch", mockSearch());
    const t = await createTask(store, { budgetMicros: config.prices.exa });
    await engine.execute(t.id, ["first query", "second query"]);
    expect((await store.get(t.id))?.status).toBe("partial");
  });
});
describe("reservation integrity and limits", () => {
  it("rejects an orphan or mismatched settlement without changing the ledger balance", async () => {
    const t = await createTask(store);
    await expect(
      (async () =>
        await engine.settle(t.id, "missing", "exa", 5000, { success: true }))(),
    ).rejects.toThrow("reservation");
    const estimate = await engine.reserve(
      t.id,
      "exa",
      "real-call",
      "research.search",
      {},
    );
    await expect(
      (async () =>
        await engine.settle(t.id, "real-call", "tavily", estimate, {
          success: true,
        }))(),
    ).rejects.toThrow("reservation");
    expect(await store.get(t.id)).toMatchObject({
      spentMicros: 0,
      reservedMicros: estimate,
    });
  });
  it("rolls back duplicate call reservations atomically", async () => {
    const t = await createTask(store);
    await engine.reserve(t.id, "exa", "same-call", "research.search", {});
    await expect(
      (async () =>
        await engine.reserve(
          t.id,
          "exa",
          "same-call",
          "research.search",
          {},
        ))(),
    ).rejects.toThrow();
    expect((await store.get(t.id))?.reservedMicros).toBe(config.prices.exa);
    expect(
      (await store.events(t.id)).filter((e) => e.type === "provider_request"),
    ).toHaveLength(1);
  });
  it("enforces the provider attempt cap independently of remaining budget", async () => {
    const t = await createTask(store, { budgetMicros: 1000000 });
    for (let i = 0; i < 50; i++) {
      engine.timestamps.clear();
      const estimate = await engine.reserve(
        t.id,
        "exa",
        `call-${i}`,
        "research.search",
        {},
      );
      await engine.settle(t.id, `call-${i}`, "exa", estimate, {
        success: true,
        httpStatus: 200,
        latencyMs: 1,
        resultCount: 0,
      });
    }
    await expect(
      (async () =>
        await engine.reserve(t.id, "exa", "call-51", "research.search", {}))(),
    ).rejects.toThrow("50 provider attempts");
    expect((await store.get(t.id))?.spentMicros).toBe(config.prices.exa * 50);
  });
  it("enforces the rolling provider limit before creating a ledger entry", async () => {
    const t = await createTask(store);
    engine.timestamps.set(
      "exa",
      Array.from({ length: config.rpm }, () => Date.now()),
    );
    await expect(
      (async () =>
        await engine.reserve(t.id, "exa", "limited", "research.search", {}))(),
    ).rejects.toThrow("rate limit");
    expect(await store.get(t.id)).toMatchObject({
      spentMicros: 0,
      reservedMicros: 0,
    });
    expect(await store.events(t.id)).toHaveLength(0);
  });
});
