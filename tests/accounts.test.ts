import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
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
import { FundingService } from "../server/funding";
import { StripeFundingService } from "../server/stripe-funding";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";
import { setAccountType } from "./helpers";
const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
suite("authenticated account and tenant boundaries", () => {
  let store: Store,
    db: PostgresDatabase,
    accounts: Accounts,
    app: ReturnType<typeof createApp>,
    funding: FundingService,
    stripe: StripeFundingService,
    gateway: FixtureStripeGateway;
  // a and b are user accounts; ca and cb are business (tool company) accounts.
  const ids = {
    a: randomUUID(),
    b: randomUUID(),
    ca: randomUUID(),
    cb: randomUUID(),
    admin: randomUUID(),
    legacy: randomUUID(),
  };
  const identities = new Map<string, VerifiedIdentity>();
  const verifier = vi.fn(async (token: string) => {
    const value = identities.get(token);
    if (!value) throw new AccountError(401, "Invalid account session.");
    return value;
  });
  const original = { token: config.token, admin: config.adminToken };
  let aWorkspace: string, bWorkspace: string;
  const headers = (token: string, workspace?: string) => ({
    Authorization: "Bearer " + token,
    ...(workspace ? { "X-Octolab-Workspace": workspace } : {}),
  });
  const intent = {
    title: "Private account fixture",
    objective: "Keep each workspace's research isolated",
    criteria: [{ text: "Private receipt", weight: 1 }],
    model: "fixture",
    host: "fixture",
  };
  beforeAll(async () => {
    store = new Store(":unused:", url!, ids.legacy);
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ; CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,not_after TIMESTAMPTZ);",
    );
    for (const name of ["a", "b", "ca", "cb", "admin"] as const) {
      const identity = {
        userId: ids[name],
        email: name + "@fixture.invalid",
        sessionId: randomUUID(),
        expiresAt: Date.now() + 3600000,
      };
      identities.set("fixture-" + name, identity);
      await db.pool.query(
        "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
        [identity.userId, identity.email],
      );
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
        [identity.sessionId, identity.userId],
      );
      // The admin is exempt from account types and needs none.
      if (name !== "admin")
        await setAccountType(
          db.pool,
          identity.userId,
          name.startsWith("c") ? "business" : "user",
        );
    }
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Historical private workspace')",
      [ids.legacy],
    );
    await db.pool.query(
      "INSERT INTO octolab.workspace_memberships VALUES($1,$2,'owner')",
      [ids.legacy, ids.admin],
    );
    accounts = new Accounts(
      store,
      {
        url: "https://octolab-fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [ids.admin],
      },
      verifier,
    );
    config.token = "legacy-fixture-owner-token-000000000000";
    config.adminToken = "legacy-fixture-admin";
    funding = new FundingService(store, {
      enabled: false,
      recipient: "",
      rpcUrl: "https://fixture.invalid",
    });
    gateway = new FixtureStripeGateway();
    stripe = new StripeFundingService(
      funding,
      { ...fixtureStripeSettings },
      gateway,
    );
    app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      funding,
      stripe,
      accounts,
    );
  });
  afterAll(async () => {
    config.token = original.token;
    config.adminToken = original.admin;
    if (store) await store.close();
  });
  it("requires verified account access and never falls back to local/owner credentials", async () => {
    expect((await request(app).get("/healthz")).status).toBe(200);
    const publicConfig = await request(app).get("/api/auth/config");
    expect(publicConfig.headers["content-security-policy"]).toContain(
      "https://octolab-fixture.supabase.co",
    );
    expect(publicConfig.body).toEqual({
      enabled: true,
      url: "https://octolab-fixture.supabase.co",
      publishableKey: "sb_publishable_fixture",
    });
    for (const credential of ["", config.token, "unknown-session"]) {
      const response = await request(app)
        .get("/api/observations")
        .set(credential ? headers(credential) : {});
      expect(response.status).toBe(401);
    }
    const profile = await request(app)
      .get("/api/auth/me")
      .set(headers("fixture-a"));
    expect(profile.status).toBe(200);
    expect(profile.body.hasPersonalAccount).toBe(false);
    expect(profile.body).not.toHaveProperty("workspaces");
    expect(profile.body.isAdmin).toBe(false);
  });
  it("starts with separate personal accounts and retires explicit creation", async () => {
    for (const token of ["fixture-a", "fixture-b"]) {
      expect(
        (await request(app).get("/api/account/usage").set(headers(token)))
          .status,
      ).toBe(200);
    }
    aWorkspace = await accounts.personalAccountScope(
      identities.get("fixture-a")!,
    );
    bWorkspace = await accounts.personalAccountScope(
      identities.get("fixture-b")!,
    );
    expect(new Set([aWorkspace, bWorkspace, ids.legacy]).size).toBe(3);
    for (const path of ["/api/auth/setup", "/api/auth/workspaces"])
      expect(
        (await request(app).post(path).set(headers("fixture-a")).send({}))
          .status,
      ).toBe(404);
  });
  it("grants operator access after sign-in and keeps user preview scoped to real memberships", async () => {
    const personal = headers("fixture-admin", ids.legacy);
    for (const path of ["/api/account/usage", "/api/observations/catalog"]) {
      expect((await request(app).get(path).set(personal)).status).toBe(200);
      expect(
        (
          await request(app)
            .get(path)
            .set({ ...personal, "X-Octolab-Preview": "user" })
        ).status,
      ).toBe(200);
    }
    const profile = await request(app)
      .get("/api/auth/me")
      .set({
        ...personal,
        "X-Octolab-Preview": "user",
      });
    expect(profile.status).toBe(200);
    expect(profile.body.isAdmin).toBe(false);
    expect(profile.body.hasPersonalAccount).toBe(true);
    for (const path of [
      "/api/admin/account-allowances",
      "/api/provider-lab",
      "/api/auth/preview-targets",
    ]) {
      const response = await request(app).get(path).set(personal);
      expect([path, response.status]).toEqual([path, 200]);
      if (path !== "/api/auth/preview-targets") {
        const preview = await request(app)
          .get(path)
          .set({ ...personal, "X-Octolab-Preview": "user" });
        expect(preview.status).toBe(403);
      }
    }
    expect(
      (
        await request(app)
          .get("/api/auth/me")
          .set({
            ...personal,
            "X-Octolab-Preview": "company",
            "X-Octolab-Preview-Target": "provider:exa",
          })
      ).status,
    ).toBe(200);
  });
  it("sets up a private account once across concurrent tabs without granting spending or claiming historical data", async () => {
    const identity: VerifiedIdentity = {
      userId: randomUUID(),
      email: "new-account@fixture.invalid",
      sessionId: randomUUID(),
      expiresAt: Date.now() + 3600000,
    };
    identities.set("fixture-setup", identity);
    await db.pool.query(
      "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
      [identity.userId, identity.email],
    );
    await db.pool.query("INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)", [
      identity.sessionId,
      identity.userId,
    ]);
    const listing = await request(app)
      .get("/api/admin/account-allowances")
      .set(headers("fixture-admin"));
    expect(listing.body.items).toContainEqual(
      expect.objectContaining({
        accountId: identity.userId,
        name: identity.email,
      }),
    );
    expect(
      listing.body.items.some(
        (item: { accountId: string }) => item.accountId === ids.legacy,
      ),
    ).toBe(false);
    // A brand-new account must choose its type before any personal data loads.
    const untyped = await request(app)
      .get("/api/account/usage")
      .set(headers("fixture-setup"));
    expect(untyped.status).toBe(403);
    expect(untyped.body.code).toBe("account_type_required");
    expect(
      (
        await request(app)
          .post("/api/auth/account-type")
          .set(headers("fixture-setup"))
          .send({ accountType: "user" })
      ).status,
    ).toBe(200);
    const responses = await Promise.all(
      Array.from({ length: 4 }, () =>
        request(app).get("/api/account/usage").set(headers("fixture-setup")),
      ),
    );
    for (const response of responses) expect(response.status).toBe(200);
    const created = { id: await accounts.personalAccountScope(identity) };
    expect([ids.legacy, aWorkspace, bWorkspace]).not.toContain(created.id);
    const memberships = await db.pool.query(
      "SELECT workspace_id,role FROM octolab.workspace_memberships WHERE user_id=$1",
      [identity.userId],
    );
    expect(memberships.rows).toEqual([
      { workspace_id: created.id, role: "owner" },
    ]);
    const audit = await db.pool.query(
      "SELECT id FROM octolab.account_audit_events WHERE workspace_id=$1 AND actor_user_id=$2 AND type='personal_account_created'",
      [created.id, identity.userId],
    );
    expect(audit.rowCount).toBe(1);
    const balance = await store.scope.run(created.id, () =>
      funding.ledger.balance(),
    );
    expect(balance).toBe(0);
    const allowance = await store.scope.run(created.id, () =>
      store.allowance.status(),
    );
    expect(allowance).toMatchObject({
      state: "unconfigured",
      remainingMicros: 0,
      limitMicros: 0,
    });
  });
  it("derives personal data access from identity and ignores legacy selectors and memberships", async () => {
    const created = await request(app)
      .post("/api/observations/agent-sessions")
      .set(headers("fixture-a"))
      .send(intent);
    expect(created.status).toBe(201);
    const path = "/api/observations/" + created.body.id;
    expect(
      (await request(app).get(path).set(headers("fixture-a", bWorkspace)))
        .status,
    ).toBe(200);
    await db.pool.query(
      "INSERT INTO octolab.workspace_memberships VALUES($1,$2,'member')",
      [aWorkspace, ids.b],
    );
    expect(
      (await request(app).get(path).set(headers("fixture-b", aWorkspace)))
        .status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get("/api/observations")
          .set(headers("fixture-b", aWorkspace))
      ).body,
    ).toEqual([]);
  });
  it("normalizes Express case, trailing-slash and encoded-path variants before role checks", async () => {
    for (const path of [
      "/api/Provider-lab",
      "/API/PROVIDER-LAB/",
      "/api/Provider-Lab/runs",
    ]) {
      const result = path.toLowerCase().endsWith("runs")
        ? await request(app)
            .post(path)
            .set(headers("fixture-a", aWorkspace))
            .send({ requestKey: "case-policy", providers: ["exa"] })
        : await request(app).get(path).set(headers("fixture-a", aWorkspace));
      expect(result.status).toBe(403);
    }
    for (const path of [
      "/api/observations/",
      "/api/Observations",
      "/api/Tasks",
      "/api/observations/%30" + aWorkspace.slice(1) + "/evaluate",
    ])
      expect(
        (
          await request(app)
            .post(path)
            .set(headers("fixture-a", aWorkspace))
            .send({})
        ).status,
      ).toBe(403);
  });
  it("issues keys with account attribution and routes scoped MCP access to the key's workspace", async () => {
    const result = await request(app)
      .post("/api/account/api-keys")
      .set(headers("fixture-a", aWorkspace))
      .send({
        name: "Account key",
        requestKey: randomUUID(),
        scopes: ["research:read", "tools:discover"],
        limitUsd: "0.01",
      });
    expect(
      (
        await request(app)
          .post("/api/provider-lab/runs")
          .set(headers("fixture-a", aWorkspace))
          .send({ requestKey: "not-an-operator", providers: ["exa"] })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/observations")
          .set(headers("fixture-a", aWorkspace))
          .send({})
      ).status,
    ).toBe(403);
    expect(result.status).toBe(201);
    expect(result.body.key.workspaceId).toBe(aWorkspace);
    const secret = result.body.secret,
      key = result.body.key;
    const events = await request(app)
      .get("/api/account/api-keys/" + key.id)
      .set(headers("fixture-a", aWorkspace));
    expect(events.body.events[0]).toMatchObject({
      actor: "authenticated_account",
      actorId: ids.a,
    });
    const scoped = await request(app)
      .get("/api/observations")
      .set(headers(secret, bWorkspace));
    expect(scoped.status).toBe(200);
    expect(scoped.body).toHaveLength(1);
    expect(
      (
        await request(app)
          .post("/api/auth/workspaces")
          .set(headers(secret))
          .send({ name: "No owner", requestKey: randomUUID() })
      ).status,
    ).toBe(401);
    expect(
      (await request(app).get("/api/account/funding").set(headers(secret)))
        .status,
    ).toBe(403);
  });
  it("routes signed Stripe webhooks to the payment owner and attributes admin reviews", async () => {
    const payment = await store.scope.run(bWorkspace, () =>
      stripe.create({ requestKey: randomUUID(), amount: "10" }),
    );
    const paid = gateway.pay(payment.checkoutSessionId!);
    let event = gateway.signed("checkout.session.completed", paid);
    const response = await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", event.signature)
      .send(event.payload.toString());
    expect(response.status).toBe(200);
    expect(
      await store.scope.run(aWorkspace, () => funding.ledger.balance()),
    ).toBe(0);
    expect(
      await store.scope.run(bWorkspace, () => funding.ledger.balance()),
    ).toBe(10000000);
    const disputed = gateway.pay(payment.checkoutSessionId!, 0, true);
    event = gateway.signed("charge.dispute.created", {
      id: "dp_fixture",
      charge: disputed.payment_intent.latest_charge.id,
      payment_intent: disputed.payment_intent.id,
    });
    expect(
      (
        await request(app)
          .post("/api/webhooks/stripe")
          .set("Content-Type", "application/json")
          .set("stripe-signature", event.signature)
          .send(event.payload.toString())
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/admin/funding/disputes")
          .set(headers("fixture-b", bWorkspace))
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get("/api/admin/funding/disputes")
          .set(headers(config.adminToken, bWorkspace))
      ).status,
    ).toBe(401);
    const queue = await request(app)
      .get("/api/admin/funding/disputes")
      .set(headers("fixture-admin"));
    expect(queue.body.items).toContainEqual(
      expect.objectContaining({
        payment: expect.objectContaining({ id: payment.id }),
      }),
    );
    const detail = await request(app)
      .get("/api/admin/funding/disputes/" + payment.id)
      .set(headers("fixture-admin", bWorkspace));
    expect(detail.status).toBe(200);
    const review = await request(app)
      .post("/api/admin/funding/disputes/" + payment.id + "/review")
      .set(headers("fixture-admin", bWorkspace))
      .send({
        requestKey: randomUUID(),
        revision: detail.body.item.revision,
        evidenceFingerprint: detail.body.item.evidenceFingerprint,
        status: "reviewed",
        note: "Fixture evidence checked by authenticated admin.",
      });
    expect(review.status).toBe(200);
    expect(review.body.history[0].actor).toBe("account " + ids.admin);
    expect(review.body.item.holdRetained).toBe(true);
  });
  it("keeps company registration independent from user workspace and requires explicit admin ownership review", async () => {
    const body = {
      name: "Fixture tool company",
      website: "https://tools.fixture.invalid",
      toolName: "Fixture search",
      description: "A synthetic integration for isolated tests.",
      requestKey: randomUUID(),
    };
    const created = await request(app)
      .post("/api/auth/companies")
      .set(headers("fixture-ca"))
      .send(body);
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(created.body).toMatchObject({
      status: "pending",
      providerId: null,
      insightsEnabled: false,
    });
    expect(
      (
        await request(app)
          .post("/api/auth/companies")
          .set(headers("fixture-ca"))
          .send(body)
      ).body.id,
    ).toBe(id);
    expect(
      (
        await request(app)
          .post("/api/auth/companies")
          .set(headers("fixture-ca"))
          .send({ ...body, providerId: "exa", status: "approved" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/insights`)
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get("/api/admin/companies")
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(403);
    for (const path of [
      "/api/company-insights/exa?source=local&scope=workspace",
      "/api/Provider-Lab/",
      "/api/observations/aggregate",
    ])
      expect(
        (await request(app).get(path).set(headers("fixture-a", aWorkspace)))
          .status,
      ).toBe(403);
    const review = {
      revision: 0,
      status: "approved",
      providerId: "exa",
      insightsEnabled: false,
      feedback: "Fixture ownership verified by admin.",
    };
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-ca"))
          .send(review)
      ).status,
    ).toBe(403);
    const queue = await request(app)
      .get("/api/admin/companies")
      .set(headers("fixture-admin"));
    expect(queue.status).toBe(200);
    expect(queue.body.items.some((c: any) => c.id === id)).toBe(true);
    const approved = await request(app)
      .post(`/api/admin/companies/${id}/review`)
      .set(headers("fixture-admin"))
      .send(review);
    expect(approved.status).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/insights`)
          .set(headers("fixture-ca"))
      ).body,
    ).toMatchObject({ status: "awaiting_release", metrics: null });
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send(review)
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send({ ...review, revision: 1, insightsEnabled: true })
      ).status,
    ).toBe(200);
    const report = await request(app)
      .get(`/api/companies/${id}/insights`)
      .set(headers("fixture-ca", bWorkspace));
    expect(report.status).toBe(200);
    expect(report.body).toMatchObject({
      status: "available",
      minimumCohort: 0,
      metrics: expect.objectContaining({ calls: expect.any(Number) }),
    });
    expect(JSON.stringify(report.body)).not.toContain(
      "Private account fixture",
    );
    const history = await request(app)
      .get(`/api/admin/companies/${id}/history`)
      .set(headers("fixture-admin"));
    expect(history.body).toHaveLength(3);
    expect(history.body[0].actorId).toBe(ids.admin);
    expect(
      (
        await request(app)
          .get(`/api/admin/companies/${id}/history`)
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(403);
    const companyProfile = await request(app)
      .get("/api/auth/me")
      .set(headers("fixture-ca"));
    expect(companyProfile.body.companies[0].id).toBe(id);
    // Business accounts never get a personal account created for them.
    expect(companyProfile.body.accountType).toBe("business");
    expect(companyProfile.body.hasPersonalAccount).toBe(false);
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send({
            ...review,
            revision: 2,
            status: "suspended",
            insightsEnabled: false,
          })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/insights`)
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(403);
  });
  it("lets company owners revise rejected registrations without claiming provider access", async () => {
    const input = {
      name: "Second fixture company",
      website: "https://second.fixture.invalid",
      toolName: "Second tool",
      description: "Another isolated synthetic tool integration.",
      requestKey: randomUUID(),
    };
    const created = await request(app)
      .post("/api/auth/companies")
      .set(headers("fixture-cb"))
      .send(input);
    const id = created.body.id;
    const decision = {
      revision: 0,
      status: "rejected",
      providerId: null,
      insightsEnabled: false,
      feedback: "Please clarify the ownership evidence.",
    };
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send(decision)
      ).status,
    ).toBe(200);
    const { requestKey, ...details } = input;
    const changed = {
      ...details,
      description: "Updated synthetic ownership and integration details.",
      revision: 1,
    };
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/resubmit`)
          .set(headers("fixture-ca"))
          .send(changed)
      ).status,
    ).toBe(404);
    const resubmitted = await request(app)
      .post(`/api/companies/${id}/resubmit`)
      .set(headers("fixture-cb"))
      .send(changed);
    expect(resubmitted.status).toBe(200);
    expect(resubmitted.body).toMatchObject({
      status: "pending",
      revision: 2,
      providerId: null,
      insightsEnabled: false,
    });
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/resubmit`)
          .set(headers("fixture-cb"))
          .send(changed)
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .get("/api/admin/companies?status=pending")
          .set(headers("fixture-admin"))
      ).body.items.some((c: any) => c.id === id),
    ).toBe(true);
    expect(
      (
        await request(app)
          .get("/api/admin/companies?status=approved")
          .set(headers("fixture-admin"))
      ).body.items.some((c: any) => c.id === id),
    ).toBe(false);
  });
  it("grants read-only company team access with immediate audited revocation", async () => {
    const input = {
      name: "Team fixture",
      website: "https://team.fixture.invalid",
      toolName: "Team tool",
      description: "An isolated provider company for role tests.",
      requestKey: randomUUID(),
    };
    const registration = await request(app)
      .post("/api/auth/companies")
      .set(headers("fixture-ca"))
      .send(input);
    const id = registration.body.id;
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/members`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-ca"))
          .send({
            action: "grant",
            email: "ca@fixture.invalid",
            requestKey: randomUUID(),
          })
      ).status,
    ).toBe(409);
    const grant = {
      action: "grant",
      email: "cb@fixture.invalid",
      requestKey: randomUUID(),
    };
    const granted = await request(app)
      .post(`/api/companies/${id}/members`)
      .set(headers("fixture-ca"))
      .send(grant);
    expect(granted.status).toBe(200);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-ca"))
          .send({ ...grant, requestKey: randomUUID() })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-ca"))
          .send(grant)
      ).body.replayed,
    ).toBe(true);
    const memberProfile = await request(app)
      .get("/api/auth/me")
      .set(headers("fixture-cb"));
    expect(
      memberProfile.body.companies.find((c: any) => c.id === id)?.role,
    ).toBe("analyst");
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/members`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-cb"))
          .send({
            ...grant,
            email: "ca@fixture.invalid",
            requestKey: randomUUID(),
          })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-ca"))
          .send({ action: "revoke", userId: ids.ca, requestKey: randomUUID() })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send({
            revision: 0,
            status: "approved",
            providerId: "tavily",
            insightsEnabled: true,
            feedback: "Ownership verified for the isolated team.",
          })
      ).status,
    ).toBe(200);
    const report = await request(app)
      .get(`/api/companies/${id}/insights`)
      .set(headers("fixture-cb"));
    expect(report.status).toBe(200);
    expect(report.body.metrics).not.toBeNull();
    const audit = await request(app)
      .get(`/api/companies/${id}/access-history`)
      .set(headers("fixture-ca"));
    expect(
      audit.body.some(
        (e: any) => e.action === "report_accessed" && e.actorId === ids.cb,
      ),
    ).toBe(true);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(headers("fixture-ca"))
          .send({ action: "revoke", userId: ids.cb, requestKey: randomUUID() })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/insights`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(404);
    await request(app)
      .post(`/api/companies/${id}/members`)
      .set(headers("fixture-ca"))
      .send(grant);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}`)
          .set(headers("fixture-cb"))
      ).status,
    ).toBe(404);
  });
  it("reports first-workspace usage and excludes ineligible offers and calls before exposure", async () => {
    const registration = await request(app)
      .post("/api/auth/companies")
      .set(headers("fixture-cb"))
      .send({
        name: "Metric fixture company",
        website: "https://metrics.fixture.invalid",
        toolName: "Metric tool",
        description: "Isolated synthetic cohort measurement integration.",
        requestKey: randomUUID(),
      });
    const id = registration.body.id;
    expect(
      (
        await request(app)
          .post(`/api/admin/companies/${id}/review`)
          .set(headers("fixture-admin"))
          .send({
            revision: 0,
            status: "approved",
            providerId: "firecrawl",
            insightsEnabled: true,
            feedback: "Ownership and aggregate access approved for fixtures.",
          })
      ).status,
    ).toBe(200);
    const empty = await request(app)
      .get(`/api/companies/${id}/insights`)
      .set(headers("fixture-cb"));
    expect(empty.body).toMatchObject({
      status: "available",
      minimumCohort: 0,
      metrics: {
        offeredSessions: 0,
        selectedSessions: 0,
        calls: 0,
        successfulCalls: 0,
      },
    });
    const tenants = [] as {
      workspace: string;
      session: string;
      event: number;
      call: string;
    }[];
    for (let n = 0; n < 5; n++) {
      const workspace = randomUUID(),
        session = randomUUID(),
        call = randomUUID();
      await db.pool.query(
        "INSERT INTO octolab.workspaces(id,name) VALUES($1,$2)",
        [workspace, "Isolated aggregate fixture"],
      );
      await db.pool.query(
        "INSERT INTO octolab.observation_sessions(id,body,workspace_id) VALUES($1,$2,$3)",
        [
          session,
          JSON.stringify({
            commercialConsent: true,
            objective: "PRIVATE_INTENT_MUST_NOT_LEAVE",
            model: "PRIVATE_MODEL",
          }),
          workspace,
        ],
      );
      const event = await db.pool.query(
        "INSERT INTO octolab.observation_events(session_id,body,workspace_id) VALUES($1,$2,$3) RETURNING id",
        [
          session,
          JSON.stringify({
            type: "tools_offered",
            at: "2026-01-01T10:00:00.000Z",
            data: {
              tools: [
                {
                  provider: "firecrawl",
                  available: true,
                  discoveryMatches: [
                    { status: n === 4 ? "ineligible" : "eligible" },
                  ],
                },
              ],
            },
          }),
          workspace,
        ],
      );
      await db.pool.query(
        "INSERT INTO octolab.observation_calls(id,session_id,request_key,signature,body,workspace_id) VALUES($1,$2,$1,$3,$4,$5)",
        [
          call,
          session,
          "fixture",
          JSON.stringify({
            provider: "firecrawl",
            status: "succeeded",
            startedAt: "2026-01-01T10:01:00.000Z",
            result: { text: "PRIVATE_OUTPUT_MUST_NOT_LEAVE" },
          }),
          workspace,
        ],
      );
      tenants.push({ workspace, session, event: event.rows[0].id, call });
      if (n === 0) {
        for (const identityHeaders of [
          headers("fixture-cb"),
          {
            ...headers("fixture-admin"),
            "X-Octolab-Preview": "company",
            "X-Octolab-Preview-Target": `company:${id}`,
          },
        ]) {
          const first = await request(app)
            .get(`/api/companies/${id}/insights`)
            .set(identityHeaders);
          expect(first.status).toBe(200);
          expect(first.body).toMatchObject({
            status: "available",
            minimumCohort: 0,
            metrics: {
              offeredSessions: 1,
              selectedSessions: 1,
              calls: 1,
              successfulCalls: 1,
            },
          });
          expect(JSON.stringify(first.body)).not.toContain("PRIVATE_");
          expect(JSON.stringify(first.body)).not.toContain(workspace);
        }
      }
    }
    const get = () =>
      request(app)
        .get(`/api/companies/${id}/insights`)
        .set(headers("fixture-cb"));
    expect((await get()).body).toMatchObject({
      status: "available",
      minimumCohort: 0,
      metrics: {
        offeredSessions: 4,
        selectedSessions: 4,
        calls: 4,
        successfulCalls: 4,
      },
    });
    const last = tenants[4];
    await db.pool.query(
      "UPDATE octolab.observation_events SET body=jsonb_set(body::jsonb,'{data,tools,0,discoveryMatches,0,status}','\"eligible\"'::jsonb)::text WHERE workspace_id=$1 AND id=$2",
      [last.workspace, last.event],
    );
    await db.pool.query(
      "UPDATE octolab.observation_calls SET body=jsonb_set(body::jsonb,'{startedAt}','\"2026-01-01T09:00:00.000Z\"'::jsonb)::text WHERE workspace_id=$1 AND id=$2",
      [last.workspace, last.call],
    );
    expect((await get()).body.metrics).toMatchObject({
      offeredSessions: 5,
      selectedSessions: 4,
      calls: 4,
      successfulCalls: 4,
    });
    await db.pool.query(
      "UPDATE octolab.observation_calls SET body=jsonb_set(body::jsonb,'{startedAt}','\"2026-01-01T10:01:00.000Z\"'::jsonb)::text WHERE workspace_id=$1 AND id=$2",
      [last.workspace, last.call],
    );
    const report = await get();
    expect(report.status).toBe(200);
    expect(report.body).toMatchObject({
      status: "available",
      metrics: {
        offeredSessions: 5,
        selectedSessions: 5,
        calls: 5,
        successfulCalls: 5,
      },
    });
    expect(JSON.stringify(report.body)).not.toContain("PRIVATE_");
    expect(JSON.stringify(report.body)).not.toContain(last.workspace);
    expect(
      (
        await request(app)
          .get(`/api/companies/${id}/insights`)
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(404);
  });
  it("scopes admin company preview to one real owner experience and keeps the real actor in audit", async () => {
    const input = {
      name: "Preview pending fixture",
      website: "https://preview.fixture.invalid",
      toolName: "Preview tool",
      description: "Isolated selected company permission fixture.",
      requestKey: randomUUID(),
    };
    const created = await request(app)
      .post("/api/auth/companies")
      .set(headers("fixture-cb"))
      .send(input);
    expect(created.status).toBe(201);
    const id = created.body.id;
    const target = `company:${id}`;
    const preview = {
      ...headers("fixture-admin"),
      "X-Octolab-Preview": "company",
      "X-Octolab-Preview-Target": target,
    };
    const choices = await request(app)
      .get("/api/auth/preview-targets")
      .set(headers("fixture-admin"));
    expect(choices.status).toBe(200);
    expect(choices.body).toContainEqual(
      expect.objectContaining({ target, kind: "company", status: "pending" }),
    );
    expect(
      (await request(app).get("/api/auth/preview-targets").set(preview)).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .get("/api/auth/preview-targets")
          .set(headers("fixture-ca"))
      ).status,
    ).toBe(403);
    const profile = await request(app).get("/api/auth/me").set(preview);
    expect(profile.body).toMatchObject({
      user: { id: ids.admin },
      isAdmin: false,
      canPreview: true,
      hasPersonalAccount: false,
      companyPreview: { target, status: "pending" },
    });
    expect(profile.body.companies).toHaveLength(1);
    expect(profile.body.companies[0]).toMatchObject({
      id,
      role: "owner",
      status: "pending",
      insightsEnabled: false,
    });
    const otherId = choices.body.find(
      (item: any) => item.kind === "company" && item.id !== id,
    ).id;
    for (const path of [
      `/api/companies/${otherId}`,
      `/api/companies/${otherId}/members`,
      "/api/admin/companies",
      "/api/observations",
      "/api/account/api-keys",
      "/api/auth/preview-insights",
    ]) {
      expect((await request(app).get(path).set(preview)).status, path).toBe(
        403,
      );
    }
    expect(
      (await request(app).get(`/api/companies/${id}/insights`).set(preview))
        .status,
    ).toBe(403);
    expect(
      (await request(app).get(`/api/companies/${id}/members`).set(preview))
        .status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(`/api/companies/${id}/members`)
          .set(preview)
          .send({
            action: "grant",
            email: "ca@fixture.invalid",
            requestKey: randomUUID(),
          })
      ).status,
    ).toBe(200);
    const audit = await request(app)
      .get(`/api/companies/${id}/access-history`)
      .set(preview);
    expect(audit.body).toContainEqual(
      expect.objectContaining({
        actorId: ids.admin,
        action: "member_granted",
      }),
    );
    const { requestKey, ...details } = input;
    const revised = await request(app)
      .post(`/api/companies/${id}/resubmit`)
      .set(preview)
      .send({ ...details, revision: 0 });
    expect(revised.status).toBe(200);
    expect(revised.body).toMatchObject({
      status: "pending",
      revision: 1,
      insightsEnabled: false,
    });
    const history = await request(app)
      .get(`/api/admin/companies/${id}/history`)
      .set(headers("fixture-admin"));
    expect(history.body[0]).toMatchObject({
      actorId: ids.admin,
      data: { action: "resubmitted" },
    });
    expect(
      (
        await db.pool.query(
          "SELECT 1 FROM octolab.company_memberships WHERE company_id=$1 AND user_id=$2",
          [id, ids.admin],
        )
      ).rowCount,
    ).toBe(0);
    for (const token of ["fixture-ca", "oct_key_forged", "unknown-session"]) {
      expect(
        (
          await request(app)
            .get("/api/auth/me")
            .set({ ...preview, ...headers(token) })
        ).status,
      ).toBe(token === "fixture-ca" ? 403 : 401);
    }
    expect(
      (
        await request(app)
          .get("/api/auth/me")
          .set({ ...headers("fixture-admin"), "X-Octolab-Preview": "company" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .get("/api/auth/me")
          .set({
            ...preview,
            "X-Octolab-Preview-Target": "company:" + randomUUID(),
          })
      ).status,
    ).toBe(409);
    const normal = await request(app)
      .get("/api/auth/me")
      .set(headers("fixture-admin"));
    expect(normal.body.isAdmin).toBe(true);
    expect(normal.body.hasPersonalAccount).toBe(true);
    const deletedId = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.tool_companies(id,owner_user_id,request_key,name,website,tool_name,description) SELECT $1,owner_user_id,$2,name,website,tool_name,description FROM octolab.tool_companies WHERE id=$3",
      [deletedId, randomUUID(), id],
    );
    const deletedPreview = {
      ...preview,
      "X-Octolab-Preview-Target": `company:${deletedId}`,
    };
    expect(
      (await request(app).get("/api/auth/me").set(deletedPreview)).status,
    ).toBe(200);
    await db.pool.query("DELETE FROM octolab.tool_companies WHERE id=$1", [
      deletedId,
    ]);
    expect(
      (await request(app).get("/api/auth/me").set(deletedPreview)).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .get("/api/auth/preview-targets")
          .set(headers("fixture-admin"))
      ).status,
    ).toBe(200);
  });
  it("shows recorded unclaimed provider aggregates without inventing a registration or bypassing release", async () => {
    const company = (
      await db.pool.query(
        "SELECT id FROM octolab.tool_companies WHERE provider_id='firecrawl'",
      )
    ).rows[0];
    await db.pool.query(
      "UPDATE octolab.tool_companies SET provider_id=NULL,insights_enabled=false,status='pending' WHERE id=$1",
      [company.id],
    );
    const preview = {
      ...headers("fixture-admin"),
      "X-Octolab-Preview": "company",
      "X-Octolab-Preview-Target": "provider:firecrawl",
    };
    const targets = await request(app)
      .get("/api/auth/preview-targets")
      .set(headers("fixture-admin"));
    expect(targets.body).toContainEqual(
      expect.objectContaining({
        target: "provider:firecrawl",
        status: "unregistered",
        kind: "provider",
      }),
    );
    const profile = await request(app).get("/api/auth/me").set(preview);
    expect(profile.body).toMatchObject({
      isAdmin: false,
      hasPersonalAccount: false,
      companies: [],
      companyPreview: { target: "provider:firecrawl", kind: "provider" },
    });
    const report = await request(app)
      .get("/api/auth/preview-insights")
      .set(preview);
    expect(report.status).toBe(200);
    expect(report.body).toMatchObject({
      status: "available",
      metrics: {
        offeredSessions: 5,
        selectedSessions: 5,
        calls: 5,
        successfulCalls: 5,
      },
    });
    expect(JSON.stringify(report.body)).not.toContain("PRIVATE_");
    expect(
      (await request(app).get(`/api/companies/${company.id}`).set(preview))
        .status,
    ).toBe(403);
    expect(
      (await request(app).post("/api/auth/companies").set(preview).send({}))
        .status,
    ).toBe(403);
    await db.pool.query(
      "UPDATE octolab.tool_companies SET provider_id='firecrawl',insights_enabled=false,status='approved' WHERE id=$1",
      [company.id],
    );
    expect(
      (await request(app).get("/api/auth/preview-insights").set(preview))
        .status,
    ).toBe(409);
    const registered = {
      ...preview,
      "X-Octolab-Preview-Target": `company:${company.id}`,
    };
    expect(
      (
        await request(app)
          .get(`/api/companies/${company.id}/insights`)
          .set(registered)
      ).body,
    ).toMatchObject({ status: "awaiting_release", metrics: null });
    const audit = await request(app)
      .get(`/api/companies/${company.id}/access-history`)
      .set(registered);
    expect(audit.body).toContainEqual(
      expect.objectContaining({
        actorId: ids.admin,
        action: "report_accessed",
      }),
    );
    await db.pool.query(
      "UPDATE octolab.tool_companies SET insights_enabled=true WHERE id=$1",
      [company.id],
    );
    expect(
      (
        await request(app)
          .get(`/api/companies/${company.id}/insights`)
          .set(registered)
      ).body.metrics.calls,
    ).toBe(5);
  });
  it("rejects revoked or banned sessions even while identity verification is cached", async () => {
    await request(app).get("/api/auth/me").set(headers("fixture-a"));
    await db.pool.query("DELETE FROM auth.sessions WHERE id=$1", [
      identities.get("fixture-a")!.sessionId,
    ]);
    expect(
      (await request(app).get("/api/auth/me").set(headers("fixture-a"))).status,
    ).toBe(401);
    await db.pool.query(
      "UPDATE auth.users SET banned_until=now()+interval '1 hour' WHERE id=$1",
      [ids.b],
    );
    expect(
      (
        await request(app)
          .get("/api/observations")
          .set(headers("fixture-b", bWorkspace))
      ).status,
    ).toBe(401);
    await db.pool.query(
      "UPDATE auth.users SET banned_until=NULL,deleted_at=now() WHERE id=$1",
      [ids.b],
    );
    expect(
      (await request(app).get("/api/auth/me").set(headers("fixture-b"))).status,
    ).toBe(401);
  });
  it("rejects private keys and untrusted auth endpoints in public settings", () => {
    expect(
      () =>
        new Accounts(
          store,
          {
            url: "https://octolab-fixture.supabase.co",
            publishableKey: "sb_secret_fixture",
            adminUserIds: [],
          },
          verifier,
        ),
    ).toThrow(/publishable/);
    expect(
      () =>
        new Accounts(
          store,
          {
            url: "https://unrelated.invalid",
            publishableKey: "sb_publishable_fixture",
            adminUserIds: [],
          },
          verifier,
        ),
    ).toThrow(/project/);
  });
});
