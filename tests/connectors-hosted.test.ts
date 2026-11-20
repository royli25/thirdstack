import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import {
  Accounts,
  AccountError,
  type VerifiedIdentity,
} from "../server/accounts";
import { createApp } from "../server/app";
import { config } from "../server/config";
import {
  startTestMcpServer,
  type TestMcpServer,
} from "./fixtures/test-mcp-server";
import { setAccountType } from "./helpers";

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
const TOKEN = "hosted-fixture-token-91c2";

// Hosted connectors: owned by an approved company, reviewed only by platform admins.
suite("hosted company connectors", () => {
  let store: Store, db: PostgresDatabase, app: ReturnType<typeof createApp>;
  let fixture: TestMcpServer, company: string;
  const original = { ...config.connectors };
  const ids = {
    owner: randomUUID(),
    analyst: randomUUID(),
    stranger: randomUUID(),
    admin: randomUUID(),
    customer: randomUUID(),
    legacy: randomUUID(),
  };
  const identities = new Map<string, VerifiedIdentity>();
  const emails = {} as Record<string, string>;
  const as = (name: keyof typeof ids) => ({ Authorization: "Bearer " + name });
  const slug = `hw${randomUUID().replace(/-/g, "").slice(0, 10)}`;
  const base = () => `/api/companies/${company}/connectors`;
  const registration = () => ({
    requestKey: randomUUID(),
    slug,
    name: "Hosted Weather Co",
    description: "Deterministic weather tools for hosted connector tests.",
    endpoint: fixture.url,
    token: TOKEN,
    declaredPriceUsd: 0.002,
  });

  beforeAll(async () => {
    Object.assign(config.connectors, {
      secretKey: "cd".repeat(32),
      allowLoopback: true,
      timeoutMs: 5000,
      rpm: 1000,
    });
    fixture = await startTestMcpServer({ token: TOKEN });
    store = new Store(":unused:", url!, ids.legacy);
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ; CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,not_after TIMESTAMPTZ);",
    );
    for (const name of [
      "owner",
      "analyst",
      "stranger",
      "admin",
      "customer",
    ] as const) {
      const identity: VerifiedIdentity = {
        userId: ids[name],
        email: `${name}-${ids[name].slice(0, 8)}@fixture.invalid`,
        sessionId: randomUUID(),
        expiresAt: Date.now() + 3600000,
      };
      emails[name] = identity.email;
      identities.set(name, identity);
      await db.pool.query(
        "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
        [identity.userId, identity.email],
      );
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
        [identity.sessionId, identity.userId],
      ); // Company people are business accounts; the customer is a user; admins need no type.
      if (name !== "admin")
        await setAccountType(
          db.pool,
          identity.userId,
          name === "customer" ? "user" : "business",
        );
    }
    const accounts = new Accounts(
      store,
      {
        url: "https://octolab-fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [ids.admin],
      },
      vi.fn(async (token: string) => {
        const value = identities.get(token);
        if (!value) throw new AccountError(401, "Invalid account session.");
        return value;
      }),
    );
    app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      accounts,
    );
    const created = await request(app)
      .post("/api/auth/companies")
      .set(as("owner"))
      .send({
        name: "Hosted weather company",
        website: "https://weather.fixture.invalid",
        toolName: "Hosted weather",
        description: "A synthetic company that only supplies an MCP connector.",
        requestKey: randomUUID(),
      });
    expect(created.status).toBe(201);
    company = created.body.id;
  });
  afterAll(async () => {
    await app?.locals.mcp?.close();
    await fixture?.close();
    if (store) await store.close();
    Object.assign(config.connectors, original);
  });

  it("requires company approval, which no longer needs a built-in provider", async () => {
    expect((await request(app).post(base()).send(registration())).status).toBe(
      401,
    );
    expect(
      (await request(app).post(base()).set(as("owner")).send(registration()))
        .status,
    ).toBe(403);
    const insightsWithoutProvider = await request(app)
      .post(`/api/admin/companies/${company}/review`)
      .set(as("admin"))
      .send({
        revision: 0,
        status: "approved",
        providerId: null,
        insightsEnabled: true,
        feedback: "Connector-only company.",
      });
    expect(insightsWithoutProvider.status).toBe(400);
    const approved = await request(app)
      .post(`/api/admin/companies/${company}/review`)
      .set(as("admin"))
      .send({
        revision: 0,
        status: "approved",
        providerId: null,
        insightsEnabled: false,
        feedback: "Ownership verified; connector-only company.",
      });
    expect(approved.status).toBe(200);
    expect(approved.body).toMatchObject({
      status: "approved",
      providerId: null,
    });
    // Insights still need a provider binding.
    expect(
      (
        await request(app)
          .get(`/api/companies/${company}/insights`)
          .set(as("owner"))
      ).status,
    ).toBeGreaterThanOrEqual(400);
  });

  it("lets the owner register, analysts read, strangers see nothing, and only admins review", async () => {
    const created = await request(app)
      .post(base())
      .set(as("owner"))
      .send(registration());
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      companyId: company,
      status: "pending",
      hasCredential: true,
    });
    expect(JSON.stringify(created.body)).not.toContain(TOKEN);
    const id = created.body.id;
    const stored = await db.pool.query(
      "SELECT body::text AS body FROM octolab.connectors WHERE id=$1",
      [id],
    );
    expect(stored.rows[0].body).not.toContain(TOKEN);

    const grant = await request(app)
      .post(`/api/companies/${company}/members`)
      .set(as("owner"))
      .send({
        action: "grant",
        email: emails.analyst,
        requestKey: randomUUID(),
      });
    expect(grant.status).toBeLessThan(300);
    expect(
      (await request(app).get(base()).set(as("analyst"))).body.connectors,
    ).toHaveLength(1);
    expect(
      (
        await request(app)
          .post(`${base()}/${id}/refresh`)
          .set(as("analyst"))
          .send({})
      ).status,
    ).toBe(403);
    expect((await request(app).get(base()).set(as("stranger"))).status).toBe(
      404,
    );
    expect(
      (
        await request(app)
          .get(`/api/admin/connectors/${id}`)
          .set(as("stranger"))
      ).status,
    ).toBe(403);

    const detail = (
      await request(app).get(`/api/admin/connectors/${id}`).set(as("admin"))
    ).body.connector;
    const decision = {
      revision: detail.revision,
      decision: "approve",
      note: "Reviewed in hosted test.",
      tools: [
        {
          name: "get_forecast",
          schemaHash: detail.tools.find((t: any) => t.name === "get_forecast")
            .schemaHash,
          decision: "approve",
          estimateUsd: 0.002,
        },
      ],
    };
    expect(
      (
        await request(app)
          .post(`${base()}/${id}/review`)
          .set(as("owner"))
          .send(decision)
      ).status,
    ).toBe(403);
    const reviewed = await request(app)
      .post(`/api/admin/connectors/${id}/review`)
      .set(as("admin"))
      .send(decision);
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.status).toBe("approved");
    const history = (
      await request(app).get(`${base()}/${id}`).set(as("owner"))
    ).body.events.map((e: any) => e.type);
    expect(history).toEqual(["connector_reviewed", "connector_registered"]);
  });

  it("lets a customer account call the approved tool within its operator allowance", async () => {
    const customer = as("customer");
    const tools = await request(app)
      .get("/api/observations/connector-tools")
      .set(customer);
    expect(tools.status).toBe(200);
    expect(tools.body.tools.map((t: any) => t.tool)).toContain(
      `${slug}__get_forecast`,
    );
    const session = await request(app)
      .post("/api/observations/agent-sessions")
      .set(customer)
      .send({
        title: "Hosted connector fixture",
        objective: "Check the forecast.",
        criteria: [{ text: "Uses a forecast", weight: 1 }],
        model: "fixture",
        host: "fixture",
      });
    expect(session.status).toBe(201);
    const callBody = (requestKey: string) => ({
      requestKey,
      tool: `${slug}__get_forecast`,
      arguments: { city: "Denver", days: 1 },
      statedReason: "The customer asked for tomorrow's weather.",
    });
    // No allowance configured: provider execution is denied.
    const denied = await request(app)
      .post(`/api/observations/${session.body.id}/connector-call`)
      .set(customer)
      .send(callBody("hosted-denied"));
    expect(denied.status).toBeGreaterThanOrEqual(400);
    expect(fixture.calls).toHaveLength(0);
    const allowance = await request(app)
      .post(`/api/admin/account-allowances/${ids.customer}`)
      .set(as("admin"))
      .send({
        requestKey: randomUUID(),
        revision: 0,
        limitMicros: 50_000,
        paused: false,
        reason: "Hosted connector fixture.",
      });
    expect(allowance.status).toBe(200);
    const ok = await request(app)
      .post(`/api/observations/${session.body.id}/connector-call`)
      .set(customer)
      .send(callBody("hosted-ok"));
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({
      status: "succeeded",
      provider: `connector:${slug}`,
      result: { text: "Day 1: Clear, 12°C", untrusted: true },
    });
    // The call is private to the customer's account.
    const theirs = await request(app)
      .get(`/api/observations/${session.body.id}`)
      .set(as("owner"));
    // The owner is a business account, so personal routes refuse it outright.
    expect(theirs.status).toBe(403);
  });
});
