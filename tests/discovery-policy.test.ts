import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { config } from "../server/config";
import { createApp } from "../server/app";
import { digest } from "../server/observation-store";
import { SHARING_POLICY } from "../server/sharing-policy";
import { verifyPrivateEvidence } from "../server/evidence-verification";
let store: Store, obs: Observatory;
const original = {
  keys: { ...config.keys },
  token: config.token,
  budget: config.agentSessionBudgetMicros,
};
const search = vi.fn(async () => ({ sources: [], httpStatus: 200 }));
const scrape = vi.fn(async () => ({
  text: "Fixture page",
  httpStatus: 200,
  pageStatus: 200,
}));
async function session() {
  return await obs.createAgentSession({
    title: "Discovery fixture",
    objective: "Find reliable public evidence for the requested answer.",
    criteria: [{ text: "Cites a source", weight: 1 }],
    constraints: "Use public sources only",
    model: "Fixture",
    host: "Unit tests",
  });
}
const searchCall = (requestKey = "search") => ({
  tool: "exa_search",
  query: "fixture",
  domains: [],
  requestKey,
  statedReason: "Search with page text for evidence.",
});
beforeEach(() => {
  Object.assign(config.keys, {
    exa: "fixture",
    tavily: "fixture",
    firecrawl: "fixture",
  });
  config.agentSessionBudgetMicros = 100000;
  config.token = "";
  store = new Store(":memory:");
  obs = new Observatory(store, { search, scrape });
  search.mockClear();
  scrape.mockClear();
});
afterEach(async () => {
  await store.close();
  Object.assign(config.keys, original.keys);
  config.token = original.token;
  config.agentSessionBudgetMicros = original.budget;
});
describe("server-owned candidate discovery", () => {
  it("finds both search alternatives from a provider-neutral request and preserves context without spending", async () => {
    const s = await session();
    const offered = await obs.discover(s.id, {
      need: "Locate a primary source",
      context: {
        requirements: "Prefer official documentation",
        evidenceGaps: ["Need the published specification"],
      },
      operations: [
        {
          operation: "search",
          query: "published specification",
          maxResults: 12,
          domains: ["example.com"],
        },
      ],
    });
    expect(offered.candidateTools).toEqual(["exa_search", "tavily_search"]);
    expect(offered.intentContext.constraints).toBe(s.constraints);
    expect(offered.context?.evidenceGaps).toEqual([
      "Need the published specification",
    ]);
    const exa = offered.tools[0].requestEstimates[0],
      tavily = offered.tools[1].requestEstimates[0];
    expect(exa.estimatedMicros).toBe(
      config.prices.exa + 2 * config.exaAdditionalResultMicros,
    );
    expect(tavily.estimatedMicros).toBe(config.prices.tavily);
    expect(exa.request).toMatchObject({
      maxResults: 12,
      domains: ["example.com"],
    });
    expect(tavily.request).toMatchObject({
      maxResults: 12,
      domains: ["example.com"],
      searchDepth: "basic",
    });
    expect(offered.tools[2].discoveryMatches[0].status).toBe("incompatible");
    expect((await obs.db.events(s.id)).at(-1)?.data.catalogVersion).toBe(
      offered.catalogVersion,
    );
    expect(await obs.db.calls(s.id)).toEqual([]);
    expect(search).not.toHaveBeenCalled();
    expect(scrape).not.toHaveBeenCalled();
    expect(await obs.require(s.id)).toMatchObject({
      spentMicros: 0,
      reservedMicros: 0,
    });
  });
  it("expands a legacy single-provider request and makes depth differences explicit", async () => {
    const offer = await obs.discover((await session()).id, "Need sources", [
      {
        tool: "tavily_search",
        query: "fixture",
        searchDepth: "advanced",
        maxResults: 5,
      },
    ]);
    expect(offer.candidateTools).toEqual(["exa_search", "tavily_search"]);
    expect(offer.tools[1].requestEstimates[0].estimatedMicros).toBe(
      config.prices.tavily * 2,
    );
    expect(
      offer.tools[0].requestEstimates[0].request.searchDepth,
    ).toBeUndefined();
    expect(offer.tools[0].requestEstimates[0].mappingNotes.join(" ")).toContain(
      "equal retrieval depth or quality is not claimed",
    );
  });
  it("matches URL extraction and rejects unsafe or mixed operations without recording an offer", async () => {
    const s = await session();
    const offer = await obs.discover(s.id, {
      need: "Read source",
      operations: [{ operation: "extract", url: "https://example.com" }],
    });
    expect(offer.candidateTools).toEqual(["firecrawl_extract"]);
    expect(offer.tools[2].requestEstimates[0].request.url).toBe(
      "https://example.com/",
    );
    const eventCount = (await obs.db.events(s.id)).length;
    await expect(
      (async () =>
        await obs.discover(s.id, {
          need: "Read source",
          operations: [{ operation: "extract", url: "https://127.0.0.1" }],
        }))(),
    ).rejects.toThrow();
    await expect(
      (async () =>
        await obs.discover(s.id, {
          need: "Read source",
          operations: [
            { operation: "extract", url: "https://example.com", maxResults: 5 },
          ],
        }))(),
    ).rejects.toThrow();
    await expect(
      (async () =>
        await obs.discover(s.id, {
          need: "Read source",
          operations: [{ operation: "search" }],
          requests: [{ tool: "exa_search", query: "fixture" }],
        }))(),
    ).rejects.toThrow(/not both/);
    expect(await obs.db.events(s.id)).toHaveLength(eventCount);
  });
  it("reports incomplete and unsupported requirements instead of fabricating quotes", async () => {
    const s = await session();
    const missing = await obs.discover(s.id, {
      need: "Find something",
      operations: [{ operation: "search" }],
    });
    expect(missing.tools[0].discoveryMatches[0].status).toBe(
      "needs_parameters",
    );
    expect(missing.tools.flatMap((t) => t.requestEstimates)).toHaveLength(0);
    const unsupported = await obs.discover(s.id, {
      need: "Complete page required",
      operations: [
        {
          operation: "extract",
          url: "https://example.com",
          content: "complete_page",
        },
      ],
    });
    expect(unsupported.candidateTools).toEqual([]);
    expect(unsupported.tools[2].discoveryMatches[0].reason).toContain(
      "cannot guarantee",
    );
    const partialText = await obs.discover(s.id, {
      need: "Source text",
      operations: [
        { operation: "search", query: "fixture", content: "page_text" },
      ],
    });
    expect(partialText.candidateTools).toEqual(["exa_search"]);
  });
  it("keeps relevant but unavailable and over-budget alternatives visible with explicit reasons", async () => {
    config.keys.exa = "";
    config.agentSessionBudgetMicros = 0;
    const offer = await obs.discover((await session()).id, {
      need: "Find source",
      operations: [{ operation: "search", query: "fixture" }],
    });
    expect(offer.candidateTools).toEqual([]);
    expect(offer.tools[0].discoveryMatches[0].status).toBe("unavailable");
    expect(offer.tools[1].discoveryMatches[0].status).toBe("over_budget");
    expect(offer.tools[1].requestEstimates[0].withinBudget).toBe(false);
  });
  it("returns the same provider-neutral contract through HTTP", async () => {
    const app = createApp(store, undefined, obs);
    const s = await session();
    const response = await request(app)
      .post(`/api/observations/${s.id}/discover`)
      .send({
        need: "Find source",
        operations: [{ operation: "search", query: "fixture" }],
      })
      .expect(200);
    expect(response.body.candidateTools).toEqual([
      "exa_search",
      "tavily_search",
    ]);
  });
});
describe("required decision summaries", () => {
  it.each([undefined, "", "  \n\t "])(
    "rejects a new call without a meaningful explanation: %s",
    async (statedReason) => {
      const s = await session();
      const app = createApp(store, undefined, obs);
      await request(app)
        .post(`/api/observations/${s.id}/call`)
        .send({ ...searchCall(), statedReason })
        .expect(400);
      expect(search).not.toHaveBeenCalled();
      expect(await obs.db.calls(s.id)).toHaveLength(0);
      expect(await obs.require(s.id)).toMatchObject({
        spentMicros: 0,
        reservedMicros: 0,
      });
    },
  );
  it("trims explanations and replays without duplicate spending", async () => {
    const s = await session();
    const args = { ...searchCall(), statedReason: "  Need source text.  " };
    const first = await obs.execute(s.id, args);
    expect(first.statedReason).toBe("Need source text.");
    expect((await obs.execute(s.id, args)).id).toBe(first.id);
    expect(search).toHaveBeenCalledTimes(1);
    expect(
      (await obs.db.events(s.id)).find(
        (e) => e.type === "selection_explanation",
      )?.provenance,
    ).toBe("agent_reported");
  });
  it("replays a historical blank-reason receipt but never allows it to create new work", async () => {
    const s = await session();
    const args = { ...searchCall(), statedReason: "" };
    // An isolated historical fixture, not a new provider call.
    const historical = {
      id: obs.db.newId(),
      sessionId: s.id,
      requestKey: args.requestKey,
      tool: "exa_search" as const,
      provider: "exa" as const,
      arguments: { query: args.query, domains: [] },
      statedReason: "",
      status: "succeeded" as const,
      startedAt: new Date().toISOString(),
      estimateMicros: 7000,
    };
    await obs.db.saveCall(historical, digest(args));
    const app = createApp(store, undefined, obs);
    const response = await request(app)
      .post(`/api/observations/${s.id}/call`)
      .send(args)
      .expect(200);
    expect(response.body).toMatchObject({
      replayed: true,
      id: historical.id,
      statedReason: "",
    });
    await request(app)
      .post(`/api/observations/${s.id}/call`)
      .send({ ...args, requestKey: "new" })
      .expect(400);
    expect(search).not.toHaveBeenCalled();
  });
});
it("migrates sharing once, preserves historical events and timestamps, and verifies the resulting audit chain", async () => {
  const s = await session();
  // Reconstruct a pre-policy record in an isolated database.
  await store.db
    .prepare(
      "DELETE FROM observation_events WHERE session_id=? AND json_extract(body,'$.type')='sharing_policy_applied'",
    )
    .run(s.id);
  const historic = (await obs.db.get(s.id))!;
  historic.commercialConsent = false;
  delete historic.sharingPolicy;
  await store.db
    .prepare("UPDATE observation_sessions SET body=? WHERE id=?")
    .run(JSON.stringify(historic), s.id);
  // Rechain the remaining fixture events after removing the synthetic policy event.
  let previousHash = "genesis";
  for (const e of await obs.db.events(s.id)) {
    const { id, hash: _hash, ...payload } = e;
    payload.previousHash = previousHash;
    const hash = digest(payload);
    previousHash = hash;
    await store.db
      .prepare("UPDATE observation_events SET body=? WHERE id=?")
      .run(JSON.stringify({ ...payload, hash }), id);
  }
  const before = await obs.db.events(s.id);
  const reopened = new Observatory(store, { search, scrape });
  const after = (await reopened.db.detail(s.id))!;
  expect(after.commercialConsent).toBe(true);
  expect(after.sharingPolicy).toBe(SHARING_POLICY);
  expect(after.updatedAt).toBe(historic.updatedAt);
  expect(after.events.slice(0, before.length)).toEqual(before);
  expect(after.events.at(-1)).toMatchObject({
    type: "sharing_policy_applied",
    provenance: "observed",
    data: {
      previousEnabled: false,
      commercialConsent: true,
      automaticallyPublished: false,
    },
  });
  expect(after.integrity).toBe(true);
  expect(
    verifyPrivateEvidence({
      version: "private-evidence-v1",
      exportedAt: new Date().toISOString(),
      containsPrivateContent: true,
      session: after,
    }).valid,
  ).toBe(true);
  await reopened.db.applySharingPolicy();
  expect(await reopened.db.events(s.id)).toHaveLength(before.length + 1);
});
it("keeps execution, linked answer reviews, and controlled samples separate", async () => {
  const s = await session();
  const call = await obs.execute(s.id, searchCall());
  const output = await obs.outcome(s.id, {
    requestKey: "answer",
    text: "Fixture answer",
    evidenceCallIds: [call.id],
  });
  await obs.evaluate(s.id, {
    outcomeId: output.outcomes[0].id,
    reviewer: { kind: "assistant_reported" },
    criteria: [
      {
        criterionId: s.criteria[0].id,
        verdict: "pass",
        note: "Fixture criterion supported",
        evidenceCallIds: [call.id],
      },
    ],
  });
  const exa = (await obs.catalog())[0];
  expect(exa.reputation.organic).toMatchObject({
    sampleCount: 1,
    succeeded: 1,
    successRate: null,
  });
  expect(exa.reputation.outcomeEvidence).toMatchObject({
    reviewedSessions: 1,
    linkedCriteria: { pass: 1, fail: 0, unknown: 0 },
    reviewSources: { assistant_reported: 1 },
  });
  expect(exa.reputation.controlled).toBeNull();
  expect(exa.quality).toBeNull();
  expect(
    (await obs.catalog())[1].reputation.outcomeEvidence.reviewedSessions,
  ).toBe(0);
});
