import { grantFixtureAllowance } from "./fixtures/allowance";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import {
  applyMigrations,
  importSqlite,
  claimRuntime,
} from "../server/migration";
import { Observatory } from "../server/observation";
import { ApiKeyService } from "../server/api-keys";
import { FundingService } from "../server/funding";
import { StripeFundingService } from "../server/stripe-funding";
import { DisputeReviewService } from "../server/dispute-review";
import { ProviderLab } from "../server/provider-lab";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";
import { config } from "../server/config";
const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
suite("isolated PostgreSQL storage", () => {
  let store: Store, database: PostgresDatabase, rootId: string;
  const created: string[] = [];
  const original = { keys: { ...config.keys }, rpm: config.rpm };
  beforeAll(async () => {
    rootId = randomUUID();
    store = new Store(":unused:", url!, rootId);
    database = store.db as PostgresDatabase;
    await applyMigrations(database);
    await applyMigrations(database);
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Postgres fixture')",
      [rootId],
    );
    created.push(rootId);
    await grantFixtureAllowance(store);
    config.keys.exa = "fixture";
    config.rpm = 1000;
  });
  afterAll(async () => {
    Object.assign(config.keys, original.keys);
    config.rpm = original.rpm;
    if (database) await store.close();
  });
  const sessionInput = {
    title: "Database fixture",
    objective: "Test persistence without live provider calls",
    criteria: [{ text: "Stored evidence", weight: 1 }],
    constraints: "",
    model: "fixture",
    host: "fixture",
  };
  it("runs real tool receipts, policy changes, key settings, and settlement", async () => {
    const obs = new Observatory(store, {
      search: async () => ({ sources: [], httpStatus: 200 }),
      scrape: async () => ({ text: "fixture", httpStatus: 200 }),
    });
    await obs.ready;
    const { key, secret } = await obs.db.apiKeys.create({
      requestKey: randomUUID(),
      name: "PG fixture",
      scopes: ["tools:execute", "tools:discover"],
      allowedTools: ["exa_search"],
      limitUsd: "0.02",
    });
    const session = await obs.createAgentSession(sessionInput, key.id);
    const result = await obs.execute(
      session.id,
      {
        requestKey: "pg-call",
        tool: "exa_search",
        query: "fixture",
        statedReason: "Find fixture evidence",
      },
      key.id,
    );
    expect(result.status).toBe("succeeded");
    expect(
      (
        await obs.execute(
          session.id,
          {
            requestKey: "pg-call",
            tool: "exa_search",
            query: "fixture",
            statedReason: "Find fixture evidence",
          },
          key.id,
        )
      ).id,
    ).toBe(result.id);
    expect((await obs.db.detail(session.id))?.integrity).toBe(true);
    expect((await obs.db.apiKeys.authenticate(secret!)).spentMicros).toBe(7000);
    await obs.db.apiKeys.update(key.id, {
      name: "Changed",
      scopes: key.scopes,
      allowedTools: key.allowedTools,
      limitUsd: "0.03",
      revision: 0,
    });
    await obs.db.apiKeys.revoke(key.id, { revision: 1 });
    expect((await obs.db.apiKeys.get(key.id)).status).toBe("revoked");
    await obs.updateRoutingPolicy({
      revision: 0,
      disabledTools: ["tavily_search"],
    });
    expect((await obs.routingPolicy()).disabledTools).toEqual([
      "tavily_search",
    ]);
    expect(await new ProviderLab(store).summaries()).toEqual([]);
  });
  it("scopes reads, writes, joins, same request keys and audit rows across tenants", async () => {
    const a = randomUUID(),
      b = randomUUID();
    created.push(a, b);
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'A'),($2,'B')",
      [a, b],
    );
    const inWorkspace = <T>(id: string, fn: () => Promise<T>) =>
      store.scope.run(id, fn);
    const keys = new ApiKeyService(store),
      requestKey = randomUUID();
    const settings = {
      requestKey,
      name: "Separate",
      scopes: ["tools:execute"],
      limitUsd: "0.01",
    };
    const first = await inWorkspace(a, () => keys.create(settings)),
      second = await inWorkspace(b, () => keys.create(settings));
    expect(first.key.workspaceId).toBe(a);
    expect(second.key.workspaceId).toBe(b);
    await expect(inWorkspace(b, () => keys.get(first.key.id))).rejects.toThrow(
      /not found/,
    );
    await expect(
      inWorkspace(b, () => keys.authenticate(first.secret!)),
    ).rejects.toThrow(/Invalid/);
    await inWorkspace(a, async () => {
      await expect(
        store.db
          .prepare("INSERT INTO workspace_api_keys VALUES (?,?,?,?,?,?,0,0)")
          .run(randomUUID(), b, "bad", randomUUID(), "bad", "{}"),
      ).rejects.toThrow(/row-level security/);
      expect(await keys.list()).toHaveLength(1);
    });
    const policy = await database.pool.query(
      "SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='octolab' AND NOT rowsecurity",
    );
    expect(policy.rows[0].n).toBe(0);
    const client = await database.pool.connect();
    try {
      await client.query("SET ROLE octolab_runtime");
      await expect(
        client.query("SELECT * FROM octolab.workspace_memberships"),
      ).rejects.toThrow(/permission denied/);
    } finally {
      await client.query("RESET ROLE");
      client.release();
    }
  });
  it("serializes concurrent reservations across independent connections", async () => {
    const tenant = randomUUID();
    created.push(tenant);
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Concurrent')",
      [tenant],
    );
    await store.scope.run(tenant, async () => {
      await grantFixtureAllowance(store);
      let release!: () => void;
      const gate = new Promise<void>((r) => {
        release = r;
      });
      const search = vi.fn(async () => {
        await gate;
        return { sources: [], httpStatus: 200 };
      });
      const obs = new Observatory(store, {
        search,
        scrape: async () => ({ text: "", httpStatus: 200 }),
      });
      await obs.ready;
      const { key } = await obs.db.apiKeys.create({
        requestKey: randomUUID(),
        name: "Cap",
        scopes: ["tools:execute"],
        limitUsd: "0.01",
      });
      const a = await obs.createAgentSession(sessionInput, key.id),
        b = await obs.createAgentSession(sessionInput, key.id);
      const pending = obs.execute(
        a.id,
        {
          tool: "exa_search",
          query: "fixture",
          statedReason: "Find fixture evidence",
          requestKey: "one",
        },
        key.id,
      );
      await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));
      await expect(
        obs.execute(
          b.id,
          {
            tool: "exa_search",
            query: "fixture",
            statedReason: "Find fixture evidence",
            requestKey: "two",
          },
          key.id,
        ),
      ).rejects.toThrow(/total estimated-spend/);
      expect((await obs.db.apiKeys.get(key.id)).reservedMicros).toBe(7000);
      release();
      await pending;
      expect((await obs.db.apiKeys.get(key.id)).spentMicros).toBe(7000);
    });
  });
  it("preserves financial ledgers and admin dispute review in PostgreSQL", async () => {
    const funding = new FundingService(store, {
      enabled: false,
      recipient: "",
      rpcUrl: "https://fixture.invalid",
    });
    const gateway = new FixtureStripeGateway(),
      stripe = new StripeFundingService(
        funding,
        { ...fixtureStripeSettings },
        gateway,
      );
    const requestKey = randomUUID();
    const [a, b] = await Promise.all([
      stripe.create({ requestKey, amount: "10" }),
      stripe.create({ requestKey, amount: "10" }),
    ]);
    expect(a.id).toBe(b.id);
    expect(gateway.creates).toHaveLength(1);
    gateway.pay(a.checkoutSessionId!);
    await stripe.reconcile(a.id);
    expect(await funding.ledger.balance()).toBe(10000000);
    expect((await funding.ledger.entries())[0].sourceId).toBe(a.id);
    gateway.pay(a.checkoutSessionId!, 250, true);
    await stripe.reconcile(a.id);
    const reviews = new DisputeReviewService(stripe),
      item = await reviews.get(a.id);
    await reviews.review(
      a.id,
      {
        requestKey: randomUUID(),
        revision: item.revision,
        evidenceFingerprint: item.evidenceFingerprint,
        status: "reviewed",
        note: "Fixture evidence checked; hold retained.",
      },
      "fixture admin",
    );
    expect((await reviews.detail(a.id)).item.holdRetained).toBe(true);
    expect(await funding.ledger.balance()).toBe(0);
  });
  it("imports and verifies a read-only SQLite snapshot, refuses overwrite and live-server import", async () => {
    const dir = await mkdtemp(join(tmpdir(), "octolab-import-"));
    const path = join(dir, "source.sqlite"),
      source = new Store(path);
    const owner = randomUUID();
    try {
      const obs = new Observatory(source);
      await obs.ready;
      const session = await obs.createAgentSession(sessionInput);
      const tenant = source.workspaceId;
      created.push(tenant);
      const { key } = await obs.db.apiKeys.create({
        requestKey: randomUUID(),
        name: "Historical",
        scopes: ["research:read"],
        limitUsd: "0.01",
      });
      const before = await obs.db.detail(session.id);
      await source.close();
      const result = await importSqlite(database, path, owner);
      expect(result.verified).toBe(true);
      expect((await importSqlite(database, path, owner, true)).replayed).toBe(
        true,
      );
      await store.scope.run(tenant, async () => {
        const migrated = new Observatory(store);
        await migrated.ready;
        expect(await migrated.db.detail(session.id)).toEqual(before);
        expect((await migrated.db.apiKeys.get(key.id)).name).toBe("Historical");
      });
      const release = await claimRuntime(database);
      await expect(importSqlite(database, path, owner)).rejects.toThrow(
        /Stop the Postgres/,
      );
      await release();
      await store.scope.run(tenant, () =>
        store.db
          .prepare("INSERT INTO observation_clients VALUES (?,?)")
          .run("later", "{}"),
      );
      await expect(importSqlite(database, path, owner, true)).rejects.toThrow(
        /verification failed/,
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

suite("Postgres receipt concurrency regressions", () => {
  let store: Store, database: PostgresDatabase;
  beforeAll(async () => {
    const id = randomUUID();
    store = new Store(":unused:", url!, id);
    database = store.db as PostgresDatabase;
    await applyMigrations(database);
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Concurrency regression fixture')",
      [id],
    );
    await grantFixtureAllowance(store);
  });
  afterAll(async () => {
    if (store) await store.close();
  });
  it("keeps simultaneous audit appends on one verifiable chain", async () => {
    const obs = new Observatory(store);
    await obs.ready;
    const session = await obs.createAgentSession({
      title: "Audit fixture",
      objective: "Verify atomic audit chain append",
      criteria: [{ text: "Integrity", weight: 1 }],
      constraints: "",
      model: "fixture",
      host: "fixture",
    });
    await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        obs.db.event(session.id, "fixture_append", "observed", { i }),
      ),
    );
    expect((await obs.db.detail(session.id))?.integrity).toBe(true);
  });
  it("returns the same provider receipt for simultaneous identical retries", async () => {
    const original = config.keys.exa;
    config.keys.exa = "fixture";
    try {
      const search = vi.fn(async () => ({ sources: [], httpStatus: 200 }));
      const obs = new Observatory(store, {
        search,
        scrape: async () => ({ text: "", httpStatus: 200 }),
      });
      await obs.ready;
      const session = await obs.createAgentSession({
        title: "Retry fixture",
        objective: "Verify exactly one provider attempt",
        criteria: [{ text: "One attempt", weight: 1 }],
        constraints: "",
        model: "fixture",
        host: "fixture",
      });
      const args = {
        tool: "exa_search",
        query: "fixture",
        requestKey: "simultaneous",
        statedReason: "Find fixture evidence",
      };
      const [a, b] = await Promise.all([
        obs.execute(session.id, args),
        obs.execute(session.id, args),
      ]);
      expect(a.id).toBe(b.id);
      expect(search).toHaveBeenCalledTimes(1);
      expect((await obs.require(session.id)).spentMicros).toBe(7000);
    } finally {
      config.keys.exa = original;
    }
  });
  it("reserves every external payment identity globally across workspaces", async () => {
    const a = randomUUID(),
      b = randomUUID();
    await database.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Payment A'),($2,'Payment B')",
      [a, b],
    );
    const first = randomUUID(),
      second = randomUUID(),
      hash =
        "0x" +
        (randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", ""));
    await store.scope.run(a, async () => {
      await store.db
        .prepare("INSERT INTO funding_intents VALUES (?,?,?)")
        .run(first, randomUUID(), "{}");
      await store.db
        .prepare("INSERT INTO funding_credits VALUES (?,?,?,?,?,?,?)")
        .run(
          randomUUID(),
          first,
          84532,
          hash,
          "0x0",
          100,
          new Date().toISOString(),
        );
    });
    await store.scope.run(b, async () => {
      await store.db
        .prepare("INSERT INTO funding_intents VALUES (?,?,?)")
        .run(second, randomUUID(), "{}");
      await expect(
        store.db
          .prepare("INSERT INTO funding_credits VALUES (?,?,?,?,?,?,?)")
          .run(
            randomUUID(),
            second,
            84532,
            hash,
            "0x0",
            100,
            new Date().toISOString(),
          ),
      ).rejects.toThrow(/unique constraint/);
      expect(
        await store.db.prepare("SELECT * FROM funding_credits").all(),
      ).toHaveLength(0);
    });
  });
});
