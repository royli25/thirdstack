import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import {
  Accounts,
  AccountError,
  type VerifiedIdentity,
} from "../server/accounts";
import { applyMigrations } from "../server/migration";
import {
  ToolSettings,
  SupabaseVault,
  type ManagedSecretStore,
} from "../server/tool-settings";
import { createApp } from "../server/app";
import { config, providerRpm, providerEnabled } from "../server/config";
import { providerWork, settingsWrite } from "../server/provider-settings-gate";
import { providerRegistry } from "../server/provider-adapters";
import { Observatory } from "../server/observation";
import { setAccountType } from "./helpers";

const url = process.env.OCTOLAB_ADMIN_SETTINGS_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
suite("platform tool settings security and persistence", () => {
  let store: Store,
    db: PostgresDatabase,
    accounts: Accounts,
    service: ToolSettings,
    app: ReturnType<typeof createApp>,
    workspace: string;
  const originals = structuredClone(config);
  const identities = new Map<string, VerifiedIdentity>();
  const verifier = vi.fn(async (token: string) => {
    const identity = identities.get(token);
    if (!identity) throw new AccountError(401, "Invalid fixture session.");
    return { ...identity };
  });
  const secretValues = new Map<string, string>();
  let vaultAvailable = true;
  const secrets: ManagedSecretStore = {
    available: async () => vaultAvailable,
    replace: vi.fn(async (_client, _provider, value, prior) => {
      const id = prior ?? randomUUID();
      secretValues.set(id, value);
      return id;
    }),
    resolve: async (_client, id) => {
      if (!secretValues.has(id)) throw Error("Missing fixture secret");
      return secretValues.get(id)!;
    },
  };
  const headers = (who = "admin") => ({ Authorization: "Bearer " + who });
  beforeAll(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw Error("Disposable loopback database required");
    store = new Store(":unused:", url!, randomUUID());
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,email TEXT,email_confirmed_at TIMESTAMPTZ,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ);CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID,not_after TIMESTAMPTZ)",
    );
    for (const who of ["admin", "owner", "company"]) {
      const identity: VerifiedIdentity = {
        userId: randomUUID(),
        sessionId: randomUUID(),
        email: who + "@fixture.invalid",
        expiresAt: Date.now() + 3600000,
      };
      identities.set(who, identity);
      await db.pool.query(
        "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
        [identity.userId, identity.email],
      );
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
        [identity.sessionId, identity.userId],
      );
      if (who !== "admin")
        await setAccountType(
          db.pool,
          identity.userId,
          who === "company" ? "business" : "user",
        );
    }
    accounts = new Accounts(
      store,
      {
        url: "https://fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [identities.get("admin")!.userId],
      },
      verifier,
    );
    workspace = await accounts.personalAccountScope(identities.get("owner")!);
  });
  beforeEach(async () => {
    Object.assign(config, structuredClone(originals));
    vaultAvailable = true;
    secretValues.clear();
    vi.mocked(secrets.replace).mockClear();
    verifier.mockClear();
    await db.pool.query(
      "TRUNCATE octolab.platform_tool_settings,octolab.platform_tool_setting_events",
    );
    service = new ToolSettings(db, secrets);
    await service.ready;
    app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      accounts,
      service,
    );
  });
  afterAll(async () => {
    Object.assign(config, originals);
    if (store) {
      // Other suites share this disposable database. Do not leave global settings
      // or managed-secret references for their new application runtimes to load.
      await db.pool.query(
        "TRUNCATE octolab.platform_tool_settings,octolab.platform_tool_setting_events",
      );
      await store.close();
    }
  });
  const input = async (extra: Record<string, unknown> = {}) => ({
    requestKey: randomUUID(),
    revision: (await service.view()).revision,
    values: (await service.view()).values,
    ...extra,
  });
  it("allows signed-in administrators while denying customer, company, machine-key, unknown and preview access", async () => {
    for (const who of [
      "owner",
      "company",
      "oct_key_" + "x".repeat(43),
      "unknown",
    ]) {
      for (const path of [
        "/api/admin/tool-settings",
        "/api/admin/tool-settings/history",
      ]) {
        expect(
          (await request(app).get(path).set(headers(who))).status,
        ).toBeGreaterThanOrEqual(400);
      }
      expect(
        (
          await request(app)
            .post("/api/admin/tool-settings")
            .set(headers(who))
            .send(await input())
        ).status,
      ).toBeGreaterThanOrEqual(400);
    }
    const profile = await accounts.profile(identities.get("admin")!);
    expect(profile.isAdmin).toBe(true);
    expect(profile.hasPersonalAccount).toBe(false);
    for (const path of [
      "/api/admin/tool-settings",
      "/api/admin/account-allowances",
      "/api/admin/companies",
      "/api/observations",
      "/api/auth/preview-targets",
    ]) {
      const response = await request(app)
        .get(path)
        .set({ ...headers(), "X-Octolab-Workspace": workspace });
      expect(response.status).toBe(200);
    }
    expect(
      (
        await request(app)
          .get("/api/admin/tool-settings")
          .set({ ...headers(), "X-Octolab-Preview": "user" })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/admin/tool-settings")
          .set({ ...headers(), Origin: "https://foreign.invalid" })
          .send(await input())
      ).status,
    ).toBe(403);
  });
  it("verifies the live session afresh on every admin request", async () => {
    expect(
      (await request(app).get("/api/admin/tool-settings").set(headers()))
        .status,
    ).toBe(200);
    expect(
      (await request(app).get("/api/admin/tool-settings").set(headers()))
        .status,
    ).toBe(200);
    const identity = identities.get("admin")!;
    await db.pool.query("DELETE FROM auth.sessions WHERE id=$1", [
      identity.sessionId,
    ]);
    expect(
      (await request(app).get("/api/admin/tool-settings").set(headers()))
        .status,
    ).toBe(401);
    await db.pool.query("INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)", [
      identity.sessionId,
      identity.userId,
    ]);
    expect(verifier).toHaveBeenCalledTimes(3);
  });
  it("persists per-provider settings, rejects stale/invalid edits and audits the real actor", async () => {
    const body = await input();
    body.values.providers.exa = {
      enabled: false,
      requestsPerMinute: 7,
      estimateMicros: 19000,
    };
    body.values.providers.tavily.requestsPerMinute = 12;
    body.values.timeoutMs = 15000;
    const changed = await request(app)
      .post("/api/admin/tool-settings")
      .set(headers())
      .send(body);
    expect(changed.status).toBe(200);
    expect(changed.body.revision).toBe(1);
    expect(providerRpm("exa")).toBe(7);
    expect(providerRpm("tavily")).toBe(12);
    expect(config.timeoutMs).toBe(15000);
    config.keys.exa = "fixture-configured-paused";
    expect(providerRegistry.credentialStatus("exa_search")).toMatchObject({
      configured: true,
      state: "configured",
      enabled: false,
    });
    await expect(
      providerRegistry.execute(
        "exa_search",
        { query: "fixture" },
        randomUUID(),
        {
          search: vi.fn(async () => {
            throw Error("Fixture network forbidden");
          }),
          scrape: vi.fn(async () => {
            throw Error("Fixture network forbidden");
          }),
        },
      ),
    ).rejects.toThrow(/disabled/);
    const restarted = new ToolSettings(db, secrets);
    await restarted.ready;
    expect((await restarted.view()).values).toEqual(body.values);
    expect(
      (
        await request(app)
          .post("/api/admin/tool-settings")
          .set(headers())
          .send({ ...body, requestKey: randomUUID() })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post("/api/admin/tool-settings")
          .set(headers())
          .send({
            ...(await input()),
            values: { ...body.values, timeoutMs: 0 },
          })
      ).status,
    ).toBe(400);
    const history = await service.history();
    expect(history).toHaveLength(1);
    expect(history[0].actorId).toBe(identities.get("admin")!.userId);
    expect(history[0].data.before.providers.exa.enabled).toBe(true);
    expect(history[0].data.after.providers.exa.enabled).toBe(false);
    const catalog = await request(app).get("/api/public/catalog");
    expect(catalog.body.find((x: any) => x.provider === "exa").available).toBe(
      false,
    );
  });
  it("stores credentials only through the managed store and never returns them", async () => {
    const secret = "fixture-only-private-provider-key-987654321";
    const body = await input({
      credential: { provider: "exa", value: secret },
    });
    const response = await request(app)
      .post("/api/admin/tool-settings")
      .set(headers())
      .send(body);
    expect(response.status).toBe(200);
    expect(response.body.credentials.exa).toEqual({
      configured: true,
      source: "vault",
      needsReplacement: false,
    });
    expect(JSON.stringify(response.body)).not.toContain(secret);
    expect(config.keys.exa).toBe(secret);
    const rows = await db.pool.query(
      "SELECT values,secret_refs FROM octolab.platform_tool_settings",
    );
    const events = await service.history();
    expect(JSON.stringify([rows.rows, events])).not.toContain(secret);
    expect(events[0].data.credentialReplaced).toBe("exa");
    const repeated = await request(app)
      .post("/api/admin/tool-settings")
      .set(headers())
      .send(body);
    expect(repeated.status).toBe(200);
    expect(repeated.body.replayed).toBe(true);
    expect(secrets.replace).toHaveBeenCalledTimes(1);
    expect(
      (
        await request(app)
          .post("/api/admin/tool-settings")
          .set(headers())
          .send({
            ...body,
            credential: { provider: "exa", value: secret + "changed" },
          })
      ).status,
    ).toBe(409);
    config.keys.exa = "";
    const restarted = new ToolSettings(db, secrets);
    await restarted.ready;
    expect(config.keys.exa).toBe(secret);
    expect((await restarted.view()).credentials.exa.source).toBe("vault");
  });
  it("does not fall back to plaintext storage when Vault is unavailable", async () => {
    vaultAvailable = false;
    const secret = "fixture-only-no-managed-secret-store";
    expect((await service.view()).secretStore.available).toBe(false);
    const response = await request(app)
      .post("/api/admin/tool-settings")
      .set(headers())
      .send(await input({ credential: { provider: "exa", value: secret } }));
    expect(response.status).toBe(503);
    expect(JSON.stringify(response.body)).not.toContain(secret);
    expect(secrets.replace).not.toHaveBeenCalled();
    expect((await service.view()).revision).toBe(0);
    expect(
      (
        await request(app)
          .post("/api/admin/tool-settings")
          .set(headers())
          .send(await input())
      ).status,
    ).toBe(200);
  });
  it("starts safely after restoring missing managed refs and repairs without environment fallback", async () => {
    await service.change(
      identities.get("admin")!.userId,
      await input({
        credential: {
          provider: "firecrawl",
          value: "fixture-vault-before-backup",
        },
      }),
    );
    const prior = (
      await db.pool.query(
        "SELECT secret_refs FROM octolab.platform_tool_settings",
      )
    ).rows[0].secret_refs.firecrawl;
    secretValues.clear();
    config.keys.firecrawl = "fixture-environment-fallback-must-not-run";
    service = new ToolSettings(db, secrets);
    await service.ready;
    expect(config.keys.firecrawl).toBe("");
    expect(providerEnabled("firecrawl")).toBe(false);
    expect((await service.view()).credentials.firecrawl).toMatchObject({
      configured: false,
      source: "vault",
      needsReplacement: true,
    });
    await service.change(
      identities.get("admin")!.userId,
      await input({
        credential: {
          provider: "firecrawl",
          value: "fixture-restored-managed-credential",
        },
      }),
    );
    expect(providerEnabled("firecrawl")).toBe(true);
    expect(config.keys.firecrawl).toBe("fixture-restored-managed-credential");
    expect(
      (
        await db.pool.query(
          "SELECT secret_refs FROM octolab.platform_tool_settings",
        )
      ).rows[0].secret_refs.firecrawl,
    ).not.toBe(prior);
    expect((await service.view()).credentials.firecrawl.needsReplacement).toBe(
      false,
    );
  });
  it("loads settings saved before a provider existed and keeps that provider's defaults", async () => {
    await service.change(identities.get("admin")!.userId, await input());
    // Simulate a row written by a release whose catalog had no Jina entry.
    await db.pool.query(
      "UPDATE octolab.platform_tool_settings SET values = values #- '{providers,jina}'",
    );
    service = new ToolSettings(db, secrets);
    await service.ready;
    const view = await service.view();
    expect(view.values.providers.jina).toMatchObject({
      enabled: true,
      estimateMicros: expect.any(Number),
    });
    expect(view.credentials.jina).toBeDefined();
  });
  it("protects private tables from customer roles and the workspace runtime role", async () => {
    await db.pool.query(
      "DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$",
    );
    for (const table of [
      "platform_tool_settings",
      "platform_tool_setting_events",
    ]) {
      const row = (
        await db.pool.query(
          "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid=$1::regclass",
          ["octolab." + table],
        )
      ).rows[0];
      expect(row).toMatchObject({
        relrowsecurity: true,
        relforcerowsecurity: true,
      });
      for (const role of ["anon", "authenticated", "octolab_runtime"]) {
        for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
          expect(
            (
              await db.pool.query(
                "SELECT has_table_privilege($1,$2,$3) AS allowed",
                [role, "octolab." + table, privilege],
              )
            ).rows[0].allowed,
          ).toBe(false);
        }
      }
    }
  });
  it("preserves admitted call estimates and retries while applying new settings to later calls", async () => {
    config.keys.exa = "fixture-active-key";
    let release!: () => void;
    const wait = new Promise<void>((r) => (release = r));
    const search = vi.fn(async () => {
      await wait;
      return { sources: [], httpStatus: 200 };
    });
    const obs = new Observatory(store, {
      search,
      scrape: async () => ({ text: "fixture", httpStatus: 200 }),
    });
    await store.scope.run(workspace, async () => {
      await store.allowance.change(workspace, identities.get("admin")!.userId, {
        requestKey: randomUUID(),
        revision: 0,
        limitMicros: 100000,
        paused: false,
        reason: "Isolated fixture",
      });
      const session = await obs.createAgentSession({
        title: "Settings fixture",
        objective: "Check preserved estimates",
        criteria: [{ text: "Evidence", weight: 1 }],
        constraints: "",
        model: "fixture",
        host: "fixture",
      });
      const call = {
        tool: "exa_search",
        query: "fixture",
        requestKey: randomUUID(),
        statedReason: "Fixture evidence",
      };
      const pending = obs.execute(session.id, call);
      await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));
      const edit = await input();
      edit.values.providers.exa.estimateMicros = 11000;
      await expect(
        service.change(identities.get("admin")!.userId, edit),
      ).rejects.toMatchObject({ status: 409 });
      release();
      const completed = await pending;
      const prior = completed.estimateMicros;
      await service.change(identities.get("admin")!.userId, edit);
      expect((await obs.execute(session.id, call)).estimateMicros).toBe(prior);
      expect(search).toHaveBeenCalledTimes(1);
      expect(
        (await obs.execute(session.id, { ...call, requestKey: randomUUID() }))
          .estimateMicros,
      ).toBe(11000);
    });
  });
  it("prevents new provider admissions while a settings transaction is active", async () => {
    let release!: () => void;
    const wait = new Promise<void>((r) => (release = r));
    let began = false;
    const saving = settingsWrite(async () => {
      began = true;
      await wait;
    });
    await vi.waitFor(() => expect(began).toBe(true));
    const network = vi.fn(async () => 42);
    await expect(providerWork(network)).rejects.toMatchObject({ status: 409 });
    expect(network).not.toHaveBeenCalled();
    release();
    await saving;
    expect(await providerWork(network)).toBe(42);
  });
  it("checks real Vault relation, function and customer-role grants before allowing writes", async () => {
    const client = await db.pool.connect();
    try {
      await client.query(
        "CREATE SCHEMA IF NOT EXISTS vault; CREATE TABLE IF NOT EXISTS vault.decrypted_secrets(id UUID PRIMARY KEY,decrypted_secret TEXT); CREATE OR REPLACE FUNCTION vault.create_secret(text,text,text) RETURNS uuid LANGUAGE SQL AS 'SELECT NULL::uuid'; CREATE OR REPLACE FUNCTION vault.update_secret(uuid,text,text,text) RETURNS void LANGUAGE SQL AS 'SELECT'; REVOKE ALL ON SCHEMA vault FROM PUBLIC,anon,authenticated,octolab_runtime; REVOKE ALL ON TABLE vault.decrypted_secrets FROM PUBLIC,anon,authenticated,octolab_runtime; REVOKE ALL ON ALL FUNCTIONS IN SCHEMA vault FROM PUBLIC,anon,authenticated,octolab_runtime",
      );
      const vault = new SupabaseVault();
      expect(await vault.available(client)).toBe(true);
      await client.query(
        "GRANT USAGE ON SCHEMA vault TO authenticated; GRANT SELECT ON vault.decrypted_secrets TO authenticated",
      );
      expect(await vault.available(client)).toBe(false);
      await client.query(
        "REVOKE ALL ON SCHEMA vault FROM authenticated; REVOKE ALL ON vault.decrypted_secrets FROM authenticated",
      );
      expect(await vault.available(client)).toBe(true);
    } finally {
      client.release();
    }
  });
  it("reconciles a committed write after losing its COMMIT acknowledgment, including idempotent replay", async () => {
    const body = await input({
      credential: {
        provider: "exa",
        value: "fixture-commit-acknowledgment-secret",
      },
    });
    body.values.providers.exa.estimateMicros = 23000;
    const client = await db.pool.connect();
    const query = client.query.bind(client);
    let lost = false;
    const wrapped = new Proxy(client, {
      get(target, prop) {
        if (prop === "query")
          return async (sql: string, params?: unknown[]) => {
            const result = await query(sql, params);
            if (sql === "COMMIT" && !lost) {
              lost = true;
              throw Error("Fixture committed but acknowledgment lost");
            }
            return result;
          };
        const value = Reflect.get(target, prop);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    vi.spyOn(db.pool, "connect").mockResolvedValueOnce(wrapped as never);
    await expect(
      service.change(identities.get("admin")!.userId, body),
    ).rejects.toThrow(/acknowledgment lost/);
    expect(config.prices.exa).toBe(23000);
    expect(config.keys.exa).toBe("fixture-commit-acknowledgment-secret");
    expect((await service.view()).revision).toBe(1);
    expect(
      (await service.change(identities.get("admin")!.userId, body)).replayed,
    ).toBe(true);
    expect(await service.history()).toHaveLength(1);
    vi.restoreAllMocks();
  });
});

it("uses only parameterized Supabase Vault SQL and never stores a key in application metadata", async () => {
  const query = vi.fn(async (sql: string) => ({
    rows: sql.startsWith("SELECT vault.create_secret")
      ? [{ id: "00000000-0000-4000-8000-000000000001" }]
      : sql.includes("decrypted_secret FROM")
        ? [{ decrypted_secret: "fixture-only-vault-secret" }]
        : sql.includes("to_regprocedure")
          ? [
              {
                create_fn: "vault.create_secret(text,text,text)",
                update_fn: "vault.update_secret(uuid,text,text,text)",
              },
            ]
          : sql.includes("to_regclass")
            ? [{ relation: "vault.decrypted_secrets" }]
            : [{ available: true }],
  }));
  const client = { query } as never;
  const vault = new SupabaseVault();
  expect(await vault.available(client)).toBe(true);
  const id = await vault.replace(client, "exa", "fixture-only-vault-secret");
  expect(await vault.resolve(client, id)).toBe("fixture-only-vault-secret");
  await vault.replace(client, "exa", "fixture-replacement", id);
  expect(
    query.mock.calls.every(
      ([sql]) => !sql.includes("fixture-only-vault-secret"),
    ),
  ).toBe(true);
});
