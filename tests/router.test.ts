import { describe, it, expect } from "vitest";
import { candidates, coverage } from "../server/router";
import { availability, intent } from "./helpers";
import { config } from "../server/config";
const available = { ...availability(false), exa: true, tavily: true };
describe("deterministic routing", () => {
  it("uses neutral values and flags missing observations", () => {
    const r = candidates(intent, 100000, [], available);
    expect(r[0].provider).toBe(
      config.prices.exa < config.prices.tavily ? "exa" : "tavily",
    );
    expect(r[0].components.latency).toBe(0.5);
    expect(r[0].insufficientData).toEqual([
      "latency",
      "reliability",
      "quality",
    ]);
  });
  it("excludes credentials, rate limits and unaffordable candidates before scoring", () => {
    const r = candidates(
      intent,
      4000,
      [],
      { ...available, tavily: false },
      new Set(["exa"]),
    );
    expect(r.every((c) => !c.eligible)).toBe(true);
    expect(r[0].reasons.length).toBeGreaterThan(0);
  });
  it("uses observations only after sufficient samples", () => {
    const obs = Array.from({ length: 5 }, () => ({
      provider: "tavily" as const,
      latencyMs: 50,
      success: true,
      quality: 0.9,
    }));
    const r = candidates(
      { ...intent, preference: "latency" },
      100000,
      obs,
      available,
    );
    expect(r[0].provider).toBe("tavily");
    expect(r[0].insufficientData).toEqual([]);
  });
  it("separates evidence coverage from task-level verification", () => {
    expect(coverage([{ snippet: "a".repeat(100) }])).toMatchObject({
      pass: false,
      taskCriteria: "unknown",
    });
    expect(
      coverage(Array.from({ length: 3 }, () => ({ snippet: "a".repeat(100) }))),
    ).toMatchObject({ pass: true, taskCriteria: "unknown" });
  });
});
