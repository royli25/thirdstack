import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AdapterRegistry,
  adapterInput,
  type AdapterDefinition,
} from "../server/provider-registry";
import { providerRegistry } from "../server/provider-adapters";
import { config } from "../server/config";
import { matchTools } from "../server/tool-discovery";
import { ProviderError } from "../server/providers";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";

const original = { keys: { ...config.keys }, prices: { ...config.prices } };
afterEach(() => {
  Object.assign(config.keys, original.keys);
  Object.assign(config.prices, original.prices);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function fixture() {
  let key = "fixture-secret",
    revoked = false;
  const definition: AdapterDefinition<"fixture_search", "fixture"> = {
    tool: "fixture_search",
    provider: "fixture",
    version: "1.2.3",
    environment: "fixture",
    operation: "search",
    pageText: true,
    searchDepth: false,
    capabilities: {
      description: "Fixture only",
      useWhen: "Tests",
      limitations: "No production use",
      documentationUrl: "https://example.com",
      adapter: { mode: "fixture" },
    },
    credential: {
      reference: "FIXTURE_KEY",
      resolve: () => key,
      revoked: () => revoked,
    },
    input: adapterInput("search"),
    result: z.object({
      httpStatus: z.literal(200),
      sources: z.array(z.object({ text: z.string() })),
    }),
    estimate: () => ({
      estimatedMicros: 1234,
      rates: { baseMicros: 1234 },
      units: 1,
      unit: "fixture",
      breakdown: "fixture",
      rateCardVersion: "fixture-rate-1",
      pricingSource: "https://example.com",
      pricingCheckedAt: "2026-11-08",
      basis: "fixture only",
      uncertainty: "fixture",
    }),
    mappingNotes: () => ["Fixture mapping"],
    execute: vi.fn(async () => ({
      httpStatus: 200,
      sources: [{ text: "fixture evidence" }],
      secret: "must be stripped",
    })),
  };
  return {
    definition,
    registry: new AdapterRegistry([definition], "fixture"),
    key: (value: string) => {
      key = value;
    },
    revoke: () => {
      revoked = true;
    },
  };
}
describe("versioned adapter onboarding", () => {
  it("adds an isolated adapter through one definition, then discovers, prices and normalizes it without provider-specific routing branches", async () => {
    const { registry } = fixture();
    const offered = matchTools(
      {
        need: "fixture evidence",
        operations: [{ operation: "search", query: "fixture" }],
      },
      { fixture_search: true },
      2000,
      registry,
    );
    expect(offered.tools[0].discoveryMatches[0].status).toBe("eligible");
    const quote = offered.tools[0].requestEstimates[0];
    expect(quote).toMatchObject({
      adapterVersion: "1.2.3",
      estimatedMicros: 1234,
    });
    expect(
      await registry.execute("fixture_search", { query: "fixture" }, "call"),
    ).toEqual({ httpStatus: 200, sources: [{ text: "fixture evidence" }] });
    expect(
      providerRegistry
        .list()
        .some((a) => (a.tool as string).startsWith("fixture")),
    ).toBe(false);
  });
  it("rejects fixture production registration, duplicates, invalid versions and unallowlisted tools", () => {
    const { definition, registry } = fixture();
    expect(() => new AdapterRegistry([definition])).toThrow(/Fixture/);
    expect(
      () => new AdapterRegistry([definition, definition], "fixture"),
    ).toThrow(/Duplicate/);
    expect(
      () =>
        new AdapterRegistry([{ ...definition, version: "latest" }], "fixture"),
    ).toThrow(/version/);
    expect(() => registry.get("unknown" as "fixture_search")).toThrow(
      /allowlisted/,
    );
  });
  it("validates unsupported input before executing and excludes missing, malformed or revoked credentials", async () => {
    const f = fixture();
    await expect(
      f.registry.execute(
        "fixture_search",
        { query: "fixture", searchDepth: "advanced" },
        "call",
      ),
    ).rejects.toThrow();
    expect(f.definition.execute).not.toHaveBeenCalled();
    const first = f.registry.credentialStatus("fixture_search");
    expect(JSON.stringify(first)).not.toContain("fixture-secret");
    f.key("rotated-secret");
    expect(f.registry.credentialStatus("fixture_search").revision).not.toBe(
      first.revision,
    );
    f.key("");
    await expect(
      f.registry.execute("fixture_search", { query: "fixture" }, "call"),
    ).rejects.toThrow(/credentials/);
    f.key("invalid whitespace");
    expect(f.registry.credentialStatus("fixture_search").state).toBe("invalid");
    f.key("rotated");
    f.revoke();
    expect(f.registry.credentialStatus("fixture_search").state).toBe("revoked");
    expect(f.definition.execute).not.toHaveBeenCalled();
  });
  it("rejects malformed responses and retains sanitized timeout failures", async () => {
    const f = fixture();
    const invalid = new AdapterRegistry(
      [{ ...f.definition, execute: async () => ({ unexpected: "secret" }) }],
      "fixture",
    );
    await expect(
      invalid.execute("fixture_search", { query: "fixture" }, "call"),
    ).rejects.toThrow("Provider invalid response");
    config.keys.exa = "fixture";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("secret", "TimeoutError");
      }),
    );
    await expect(
      providerRegistry.execute("exa_search", { query: "fixture" }, "call"),
    ).rejects.toEqual(new ProviderError("timeout"));
  });
  it("pins adapter provenance, reserves the exact quote, and replays receipts after credential removal without another call", async () => {
    config.keys.exa = "fixture";
    config.prices.exa = 7000;
    vi.stubEnv("EXA_ACCOUNT_REFERENCE", "fixture-account");
    const store = new Store(":memory:");
    try {
      const search = vi.fn(async () => ({
        httpStatus: 200,
        sources: [],
        requestId: "provider-request",
      }));
      const obs = new Observatory(store, {
        search,
        scrape: async () => ({ text: "fixture", httpStatus: 200 }),
      });
      const session = await obs.createAgentSession({
        title: "Fixture",
        objective: "Validate isolated registry",
        criteria: [{ text: "Fixture evidence", weight: 1 }],
        constraints: "",
        model: "fixture",
        host: "fixture",
      });
      const input = {
        tool: "exa_search",
        query: "fixture",
        maxResults: 12,
        requestKey: "registry-call",
        statedReason: "Fixture verification",
      };
      const result = await obs.execute(session.id, input);
      expect(result).toMatchObject({
        status: "succeeded",
        adapter: { tool: "exa_search", version: "1.0.0" },
        providerAccountReference: "fixture-account",
      });
      expect((await obs.require(session.id)).spentMicros).toBe(
        7000 + 2 * config.exaAdditionalResultMicros,
      );
      config.keys.exa = "";
      expect(await obs.execute(session.id, input)).toMatchObject({
        id: result.id,
        replayed: true,
        adapter: result.adapter,
      });
      expect(search).toHaveBeenCalledTimes(1);
      expect((await obs.db.detail(session.id))?.integrity).toBe(true);
    } finally {
      await store.close();
    }
  });
});
