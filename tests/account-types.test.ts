// Business and user account types: chosen once, locked in the database, and enforced
// on every personal and company route. Runs only against a disposable PostgreSQL
// database (OCTOLAB_TEST_POSTGRES_URL); never point it at the hosted Supabase project.
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import {
  Accounts,
  AccountError,
  type VerifiedIdentity,
} from "../server/accounts";
import { createApp } from "../server/app";
import { FundingService } from "../server/funding";
import { StripeFundingService } from "../server/stripe-funding";
import { FixtureStripeGateway, fixtureStripeSettings } from "./fixtures/stripe";

const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;

suite("business and user account types", () => {
  let store: Store, db: PostgresDatabase, app: ReturnType<typeof createApp>;
  // Every fixture starts without a type, like a fresh signup, except the admin,
  // who is on the allowlist and is exempt.
  const people = [
    "seller",
    "seller2",
    "buyer",
    "buyer2",
    "newcomer",
    "admin",
  ] as const;
  type Person = (typeof people)[number];
  const ids = Object.fromEntries(
    people.map((p) => [p, randomUUID()]),
  ) as Record<Person, string>;
  const emails = Object.fromEntries(
    people.map((p) => [p, `${p}-${ids[p].slice(0, 8)}@fixture.invalid`]),
  ) as Record<Person, string>;
  const identities = new Map<string, VerifiedIdentity>();
  const as = (who: Person) => ({ Authorization: "Bearer " + who });
  const choose = (who: Person, accountType: string) =>
    request(app)
      .post("/api/auth/account-type")
      .set(as(who))
      .send({ accountType });
  const workspacesOf = async (who: Person) =>
    (
      await db.pool.query(
        "SELECT count(*)::int AS n FROM octolab.workspace_memberships WHERE user_id=$1",
        [ids[who]],
      )
    ).rows[0].n;
  let company: string;

  beforeAll(async () => {
    store = new Store(":unused:", url!, randomUUID());
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    // Minimal stand-in for Supabase's auth schema, as in the other account tests.
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ; CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,not_after TIMESTAMPTZ);",
    );
    for (const who of people) {
      const identity: VerifiedIdentity = {
        userId: ids[who],
        email: emails[who],
        sessionId: randomUUID(),
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
    }
    const accounts = new Accounts(
      store,
      {
        url: "https://octolab-fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [ids.admin],
      },
      vi.fn(async (token: string) => {
        const identity = identities.get(token);
        if (!identity) throw new AccountError(401, "Invalid account session.");
        return identity;
      }),
    );
    const funding = new FundingService(store, {
      enabled: false,
      recipient: "",
      rpcUrl: "https://fixture.invalid",
    });
    const stripe = new StripeFundingService(
      funding,
      { ...fixtureStripeSettings },
      new FixtureStripeGateway(),
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
    if (store) await store.close();
  });

  it("lets each account choose its type once and never change it", async () => {
    const before = await request(app).get("/api/auth/me").set(as("seller"));
    expect(before.body.accountType).toBeNull();

    expect((await choose("seller", "admin")).status).toBe(400);
    const chosen = await choose("seller", "business");
    expect(chosen.status).toBe(200);
    expect(chosen.body).toEqual({ accountType: "business" });
    // Repeating the same choice is harmless (for example, a retried request).
    expect((await choose("seller", "business")).status).toBe(200);
    // Switching is refused by the API...
    const switched = await choose("seller", "user");
    expect(switched.status).toBe(409);
    expect(switched.body.code).toBe("account_type_locked");

    for (const [who, type] of [
      ["seller2", "business"],
      ["buyer", "user"],
      ["buyer2", "user"],
    ] as const)
      expect((await choose(who, type)).status).toBe(200);
    const after = await request(app).get("/api/auth/me").set(as("seller"));
    expect(after.body.accountType).toBe("business");
  });

  it("locks the type in the database itself, not only in the API", async () => {
    // Even the server's own connection cannot change or remove a type.
    for (const sql of [
      "UPDATE octolab.account_types SET account_type='user' WHERE user_id=$1",
      "DELETE FROM octolab.account_types WHERE user_id=$1",
    ])
      await expect(db.pool.query(sql, [ids.seller])).rejects.toThrow(
        /permanent/,
      );
    await expect(
      db.pool.query("TRUNCATE octolab.account_types"),
    ).rejects.toThrow(/permanent/);
    const row = await db.pool.query(
      "SELECT account_type FROM octolab.account_types WHERE user_id=$1",
      [ids.seller],
    );
    expect(row.rows[0].account_type).toBe("business");
    // Row-level security is on and forced, and no browser role or the restricted
    // runtime role has any grant on the table.
    const table = await db.pool.query(
      "SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='octolab.account_types'::regclass",
    );
    expect(table.rows[0]).toEqual({
      relrowsecurity: true,
      relforcerowsecurity: true,
    });
    const grants = await db.pool.query(
      "SELECT DISTINCT grantee FROM information_schema.role_table_grants WHERE table_schema='octolab' AND table_name='account_types' AND grantee IN ('anon','authenticated','octolab_runtime','PUBLIC')",
    );
    expect(grants.rows).toEqual([]);
  });

  it("asks accounts without a type to choose before opening either area", async () => {
    for (const path of ["/api/account/usage", "/api/account/funding"]) {
      const response = await request(app).get(path).set(as("newcomer"));
      expect(response.status).toBe(403);
      expect(response.body.code).toBe("account_type_required");
    }
    const register = await request(app)
      .post("/api/auth/companies")
      .set(as("newcomer"))
      .send({
        name: "Undecided fixture",
        website: "https://undecided.fixture.invalid",
        toolName: "Undecided tool",
        description: "Should not be created before a type is chosen.",
        requestKey: randomUUID(),
      });
    expect(register.status).toBe(403);
    expect(await workspacesOf("newcomer")).toBe(0);
  });

  it("keeps business accounts out of personal data, including payments", async () => {
    const company_ = await request(app)
      .post("/api/auth/companies")
      .set(as("seller"))
      .send({
        name: "Seller fixture company",
        website: "https://seller.fixture.invalid",
        toolName: "Seller tool",
        description: "A synthetic tool company for account-type tests.",
        requestKey: randomUUID(),
      });
    expect(company_.status).toBe(201);
    company = company_.body.id;
    expect(
      (await request(app).get(`/api/companies/${company}`).set(as("seller")))
        .status,
    ).toBe(200);

    for (const path of [
      "/api/account/usage",
      "/api/account/funding",
      // Per-call charges and statements are personal Credits data too.
      "/api/account/funding/activity",
      "/api/account/funding/statement?from=2026-11-01&to=2026-11-17",
      "/api/observations",
      "/api/account/api-keys",
    ]) {
      const response = await request(app).get(path).set(as("seller"));
      expect([path, response.status, response.body.code]).toEqual([
        path,
        403,
        "wrong_account_type",
      ]);
    }
    const deposit = await request(app)
      .post("/api/account/funding/stripe")
      .set(as("seller"))
      .send({ requestKey: randomUUID(), amount: "10.00" });
    expect(deposit.status).toBe(403);
    // No personal account (and so no payment data) was created for the business.
    expect(await workspacesOf("seller")).toBe(0);
  });

  it("keeps user accounts out of company areas", async () => {
    // The user dashboard and its payment data work as before.
    for (const path of ["/api/account/usage", "/api/account/funding"])
      expect((await request(app).get(path).set(as("buyer"))).status).toBe(200);
    expect(await workspacesOf("buyer")).toBe(1);

    const register = await request(app)
      .post("/api/auth/companies")
      .set(as("buyer"))
      .send({
        name: "Buyer company attempt",
        website: "https://buyer.fixture.invalid",
        toolName: "Buyer tool",
        description: "User accounts cannot register tool companies.",
        requestKey: randomUUID(),
      });
    expect(register.status).toBe(403);
    expect(register.body.code).toBe("wrong_account_type");
    for (const path of [
      `/api/companies/${company}`,
      `/api/companies/${company}/insights`,
      `/api/companies/${company}/members`,
      `/api/companies/${company}/connectors`,
      `/api/companies/${company}/seller/overview`,
    ]) {
      const response = await request(app).get(path).set(as("buyer"));
      expect([path, response.status]).toEqual([path, 403]);
    }
  });

  it("blocks reading another account's data within the same type", async () => {
    // Another business cannot see this company.
    expect(
      (await request(app).get(`/api/companies/${company}`).set(as("seller2")))
        .status,
    ).toBe(404);
    // One user's private activity is invisible to another user.
    const session = await request(app)
      .post("/api/observations/agent-sessions")
      .set(as("buyer"))
      .send({
        title: "Private buyer session",
        objective: "Keep this session private to the buyer",
        criteria: [{ text: "Stays private", weight: 1 }],
        model: "fixture",
        host: "fixture",
      });
    expect(session.status).toBe(201);
    expect(
      (
        await request(app)
          .get(`/api/observations/${session.body.id}`)
          .set(as("buyer"))
      ).status,
    ).toBe(200);
    const other = await request(app)
      .get(`/api/observations/${session.body.id}`)
      .set(as("buyer2"));
    expect(other.status).toBe(404);
    // Naming the other account's workspace in a header does not help either.
    const buyerWorkspace = (
      await db.pool.query(
        "SELECT workspace_id FROM octolab.workspace_memberships WHERE user_id=$1",
        [ids.buyer],
      )
    ).rows[0].workspace_id;
    expect(
      (
        await request(app)
          .get(`/api/observations/${session.body.id}`)
          .set({ ...as("buyer2"), "X-Octolab-Workspace": buyerWorkspace })
      ).status,
    ).toBe(404);
  });

  it("only adds business accounts as company analysts", async () => {
    const grant = (email: string) =>
      request(app)
        .post(`/api/companies/${company}/members`)
        .set(as("seller"))
        .send({ action: "grant", email, requestKey: randomUUID() });
    const toUser = await grant(emails.buyer);
    expect(toUser.status).toBe(400);
    expect(toUser.body.error).toMatch(/business account/);
    expect((await grant(emails.seller2)).status).toBe(200);
    expect(
      (await request(app).get(`/api/companies/${company}`).set(as("seller2")))
        .status,
    ).toBe(200);
  });

  it("exempts platform administrators so they can review both areas", async () => {
    const me = await request(app).get("/api/auth/me").set(as("admin"));
    expect(me.body).toMatchObject({ isAdmin: true, accountType: null });
    expect(
      (await request(app).get("/api/account/usage").set(as("admin"))).status,
    ).toBe(200);
    expect(
      (await request(app).get(`/api/companies/${company}`).set(as("admin")))
        .status,
    ).toBe(200);
  });

  it("backfills company members as business and other workspace owners as user", async () => {
    // Replay the migration's backfill statements against fresh sample accounts.
    const migration = await readFile(
      new URL(
        "../supabase/migrations/20261117130000_account_types.sql",
        import.meta.url,
      ),
      "utf8",
    );
    const backfill = migration.slice(
      migration.indexOf("INSERT INTO account_types"),
    );
    const both = randomUUID(),
      member = randomUUID(),
      personal = randomUUID(),
      workspace = randomUUID(),
      workspace2 = randomUUID(),
      sample = randomUUID();
    await db.pool.query(
      "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Backfill sample'),($2,'Backfill sample 2')",
      [workspace, workspace2],
    );
    await db.pool.query(
      "INSERT INTO octolab.workspace_memberships VALUES($1,$2,'owner'),($3,$4,'owner')",
      [workspace, both, workspace2, personal],
    );
    await db.pool.query(
      "INSERT INTO octolab.tool_companies(id,owner_user_id,request_key,name,website,tool_name,description) VALUES($1,$2,$3,'Backfill company','https://backfill.fixture.invalid','Backfill tool','Backfill sample company.')",
      [sample, both, randomUUID()],
    );
    await db.pool.query(
      "INSERT INTO octolab.company_memberships(company_id,user_id,role) VALUES($1,$2,'owner'),($1,$3,'analyst')",
      [sample, both, member],
    );
    const client = await db.pool.connect();
    try {
      await client.query("SET search_path TO octolab, pg_catalog");
      await client.query(backfill);
    } finally {
      await client.query("RESET search_path");
      client.release();
    }
    const rows = await db.pool.query(
      "SELECT user_id,account_type,source FROM octolab.account_types WHERE user_id = ANY($1)",
      [[both, member, personal]],
    );
    const byUser = Object.fromEntries(
      rows.rows.map((r) => [r.user_id, [r.account_type, r.source]]),
    );
    expect(byUser).toEqual({
      [both]: ["business", "backfill"],
      [member]: ["business", "backfill"],
      [personal]: ["user", "backfill"],
    });
    // Running the backfill again changes nothing and does not trip the lock.
    const again = await db.pool.connect();
    try {
      await again.query("SET search_path TO octolab, pg_catalog");
      await again.query(backfill);
    } finally {
      await again.query("RESET search_path");
      again.release();
    }
    // Chosen types are untouched by the backfill.
    expect(
      (
        await db.pool.query(
          "SELECT account_type,source FROM octolab.account_types WHERE user_id=$1",
          [ids.buyer],
        )
      ).rows[0],
    ).toEqual({ account_type: "user", source: "chosen" });
  });
});
