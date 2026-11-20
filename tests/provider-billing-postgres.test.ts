import { grantFixtureAllowance } from "./fixtures/allowance";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { ProviderBilling } from "../server/provider-billing";
import { config } from "../server/config";
import { assignProviderAccount } from "../server/provider-accounts";
import { providerRegistry } from "../server/provider-adapters";

const url = process.env.OCTOLAB_BILLING_TEST_POSTGRES_URL;
(url ? describe : describe.skip)("isolated PostgreSQL billing", () => {
  let store: Store,
    obs: Observatory,
    billing: ProviderBilling,
    a: string,
    b: string;
  const original = { key: config.keys.exa, rpm: config.rpm };
  beforeAll(async () => {
    a = randomUUID();
    b = randomUUID();
    config.keys.exa = "isolated-postgres-fixture";
    config.rpm = 1000;
    vi.stubEnv("EXA_ACCOUNT_REFERENCE", "");
    store = new Store(":unused:", url!, a);
    const db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Billing fixture A'),($2,'Billing fixture B')",
      [a, b],
    );
    await grantFixtureAllowance(store);
    obs = new Observatory(store, {
      search: async () => ({
        sources: [],
        httpStatus: 200,
        requestId: "pg-fixture-request",
      }),
      scrape: async () => ({ text: "fixture", httpStatus: 200 }),
    });
    await obs.ready;
    billing = new ProviderBilling(obs);
  });
  afterAll(async () => {
    if (store) await store.close();
    config.keys.exa = original.key;
    config.rpm = original.rpm;
    vi.unstubAllEnvs();
  });
  const input = (requestKey: string) => ({
    requestKey,
    provider: "exa",
    accountReference: "pg-fixture-account",
    sourceKind: "invoice",
    sourceReference: "pg-fixture-invoice",
    windowStart: "2020-01-01T00:00:00Z",
    windowEnd: "2030-01-01T00:00:00Z",
    records: [
      {
        recordId: "pg-fixture-line",
        requestId: "pg-fixture-request",
        amountMicros: 11000,
      },
    ],
  });
  it("persists imports, account binding and immutable reviews across a fresh service instance", async () => {
    await assignProviderAccount(store, "exa_search", {
      accountReference: "pg-fixture-account",
      credentialRevision:
        providerRegistry.credentialStatus("exa_search").revision,
    });
    const session = await obs.createAgentSession({
      title: "Billing PG fixture",
      objective: "Test isolated billing persistence",
      criteria: [{ text: "fixture", weight: 1 }],
      constraints: "",
      model: "fixture",
      host: "fixture",
    });
    await obs.execute(session.id, {
      tool: "exa_search",
      query: "fixture",
      requestKey: "pg-call",
      statedReason: "Fixture verification",
    });
    const batch = await billing.import(input("pg-import"));
    await billing.review(batch.id, {
      requestKey: "pg-review",
      decision: "approved",
      note: "Checked isolated fixture",
    });
    expect(
      (await new ProviderBilling(new Observatory(store)).overview())
        .reconciledMicros,
    ).toBe(11000);
  });
  it("cannot see or match another workspace's imports or receipt references", async () => {
    const originalBatch = (await billing.overview()).batches[0];
    await store.scope.run(b, async () => {
      expect((await billing.overview()).batches).toEqual([]);
      await expect(
        billing.review(originalBatch.id, {
          requestKey: "foreign-review",
          decision: "approved",
          note: "Foreign fixture",
        }),
      ).rejects.toThrow(/not found/);
      await expect(
        billing.import({
          ...input("foreign-correction"),
          supersedesBatchId: originalBatch.id,
        }),
      ).rejects.toThrow(/not found/);
      const own = await billing.import(input("pg-import"));
      await billing.review(own.id, {
        requestKey: "pg-review",
        decision: "approved",
        note: "Independent workspace fixture",
      });
      const report = await billing.overview();
      expect(report.reconciledMicros).toBeNull();
      expect(report.batches[0].lines[0].status).toBe("unmatched");
    });
    expect((await billing.overview()).reconciledMicros).toBe(11000);
  });
  it("serializes concurrent duplicate imports without adding charges twice", async () => {
    const [one, two] = await Promise.all([
      billing.import(input("pg-concurrent-one")),
      new ProviderBilling(obs).import(input("pg-concurrent-two")),
    ]);
    expect(one.id).toBe(two.id);
    expect((await billing.overview()).batches).toHaveLength(1);
  });
});
