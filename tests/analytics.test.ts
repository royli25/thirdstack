import { providerIds } from "../server/provider-catalog.js";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { Store } from "../server/store";
import { analytics } from "../server/analytics";
import { createTask } from "./helpers";
let store: Store;
beforeEach(() => {
  store = new Store(":memory:");
});
afterEach(async () => await store.close());
async function trace(consent = true) {
  const task = await createTask(store, { consent });
  const invocationId = task.id + "-invocation";
  const candidates = [
    { provider: "exa", eligible: true, reasons: [] },
    { provider: "tavily", eligible: true, reasons: [] },
  ];
  await store.event(task.id, "tool_invoked", {
    invocationId,
    query: "PRIVATE QUERY",
  });
  await store.event(task.id, "provider_candidates", {
    invocationId,
    candidates,
  });
  await store.event(
    task.id,
    "route_selected",
    { invocationId, provider: "tavily" },
    "first-" + task.id,
  );
  await store.event(
    task.id,
    "provider_response",
    {
      invocationId,
      provider: "tavily",
      success: true,
      httpStatus: 200,
      latencyMs: 120,
      resultCount: 1,
    },
    "first-" + task.id,
  );
  await store.event(
    task.id,
    "outcome_evaluated",
    { invocationId, pass: false },
    "first-" + task.id,
  );
  await store.event(task.id, "fallback_triggered", { invocationId });
  await store.event(task.id, "provider_candidates", {
    invocationId,
    candidates: [
      { ...candidates[0] },
      {
        ...candidates[1],
        eligible: false,
        reasons: ["Already attempted for this invocation"],
      },
    ],
  });
  await store.event(
    task.id,
    "route_selected",
    { invocationId, provider: "exa" },
    "second-" + task.id,
  );
  await store.event(
    task.id,
    "provider_response",
    {
      invocationId,
      provider: "exa",
      success: true,
      httpStatus: 200,
      latencyMs: 200,
      resultCount: 3,
    },
    "second-" + task.id,
  );
  await store.event(
    task.id,
    "outcome_evaluated",
    { invocationId, pass: true },
    "second-" + task.id,
  );
  return task;
}
describe("privacy-preserving cross-provider aggregates", () => {
  it("counts an initial routing opportunity once, excluding fallback rechecks", async () => {
    for (let i = 0; i < 5; i++) await trace();
    const data = await analytics(store);
    expect(data.suppressed).toBe(false);
    if (data.suppressed) return;
    const exa = data.providers.find((p) => p.provider === "exa")!;
    const tavily = data.providers.find((p) => p.provider === "tavily")!;
    expect(exa).toMatchObject({ eligible: 5, selected: 0, calls: 5 });
    expect(tavily).toMatchObject({ eligible: 5, selected: 5, calls: 5 });
    expect(data.fallbackRecoveries).toBe(5);
    expect(data.insufficient200).toBe(5);
    expect(JSON.stringify(data)).not.toContain("PRIVATE QUERY");
  });
  it("reports a single contributing task without hiding small provider or metric counts", async () => {
    await trace();
    const data = await analytics(store);
    expect(data).toMatchObject({
      suppressed: false,
      cohortSize: 1,
      minCohort: 0,
    });
    expect(data.capabilities.search).toBe(1);
    expect(data.fallbacks).toBe(1);
    expect(data.providers.find((p) => p.provider === "tavily")).toMatchObject({
      calls: 1,
      selected: 1,
      httpSuccesses: 1,
      latencyMs: 120,
    });
    expect(
      data.providers.find((p) => p.provider === "firecrawl"),
    ).toMatchObject({
      calls: 0,
      latencyMs: null,
    });
    expect(data.providers.every((p) => !p.suppressed)).toBe(true);
  });
  it("excludes nonconsenting traces and never counts their recovered outcomes", async () => {
    for (let i = 0; i < 5; i++) await trace(false);
    expect(await analytics(store)).toMatchObject({
      suppressed: false,
      cohortSize: 0,
    });
    expect(
      (await analytics(store)).providers.every(
        (p) => p.calls === 0 && p.latencyMs === null,
      ),
    ).toBe(true);
  });
  it("returns honest zero counts and unknown latency before any usage", async () => {
    const data = await analytics(store);
    expect(data).toMatchObject({
      suppressed: false,
      cohortSize: 0,
      minCohort: 0,
    });
    expect(data.providers).toHaveLength(providerIds.length);
    for (const provider of data.providers)
      expect(provider).toMatchObject({
        calls: 0,
        selected: 0,
        latencyMs: null,
        estimatedMicros: 0,
      });
    expect(JSON.stringify(data)).not.toContain("NaN");
  });
});
