import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { Accounts, type VerifiedIdentity } from "../server/accounts";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { Engine } from "../server/engine";
import { ProviderLab } from "../server/provider-lab";
import { createTask, setAccountType } from "./helpers";
import { grantFixtureAllowance } from "./fixtures/allowance";
const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
const intent = {
  title: "Allowance fixture",
  constraints: "",
  objective: "Verify platform authority without paid network calls",
  criteria: [{ text: "Isolated evidence", weight: 1 }],
  model: "fixture",
  host: "fixture",
};
const call = (requestKey = randomUUID()) => ({
  tool: "exa_search",
  query: "fixture",
  statedReason: "Verify allowance admission",
  requestKey,
});
suite("operator-owned hosted workspace allowances", () => {
  let store: Store,
    db: PostgresDatabase,
    obs: Observatory,
    app: ReturnType<typeof createApp>,
    accounts: Accounts,
    workspace: string,
    admin: VerifiedIdentity,
    owner: VerifiedIdentity;
  let search = vi.fn(async () => ({ sources: [], httpStatus: 200 }));
  const previous = { keys: { ...config.keys }, rpm: config.rpm };
  const headers = (token = "owner") => ({
    Authorization: "Bearer " + token,
    "X-Octolab-Workspace": workspace,
  });
  const grant = (extra = {}) => ({
    requestKey: randomUUID(),
    revision: 0,
    limitMicros: 14000,
    paused: false,
    reason: "Isolated fixture authorization",
    ...extra,
  });
  beforeEach(async () => {
    if (!["localhost", "127.0.0.1", "[::1]"].includes(new URL(url!).hostname))
      throw Error("Disposable loopback database required");
    store = new Store(":unused:", url!, randomUUID());
    db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ; CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,not_after TIMESTAMPTZ)",
    );
    const identity = (name: string) => ({
      userId: randomUUID(),
      sessionId: randomUUID(),
      email: name + "@fixture.invalid",
      expiresAt: Date.now() + 3600000,
    });
    admin = identity("admin");
    owner = identity("owner");
    for (const user of [admin, owner]) {
      await db.pool.query(
        "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
        [user.userId, user.email],
      );
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
        [user.sessionId, user.userId],
      );
    }
    // The workspace owner is a user account; the admin is exempt and needs no type.
    await setAccountType(db.pool, owner.userId, "user");
    accounts = new Accounts(
      store,
      {
        url: "https://fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [admin.userId],
      },
      async (token) => {
        if (token !== "admin" && token !== "owner")
          throw Error("Invalid fixture session");
        return token === "admin" ? admin : owner;
      },
    );
    config.keys.exa = "fixture";
    config.rpm = 1000;
    search = vi.fn(async () => ({ sources: [], httpStatus: 200 }));
    obs = new Observatory(store, {
      search,
      scrape: async () => ({ text: "fixture", httpStatus: 200 }),
    });
    app = createApp(
      store,
      undefined,
      obs,
      undefined,
      undefined,
      undefined,
      accounts,
    );
    workspace = await accounts.personalAccountScope(owner);
  });
  afterEach(async () => {
    Object.assign(config.keys, previous.keys);
    config.rpm = previous.rpm;
    if (store) await store.close();
  });
  async function issue() {
    const response = await request(app)
      .post("/api/account/api-keys")
      .set(headers())
      .send({
        name: "Self-issued fixture",
        requestKey: randomUUID(),
        scopes: [
          "research:write",
          "research:read",
          "tools:execute",
          "tools:discover",
          "usage:read",
        ],
        allowedTools: ["exa_search"],
        limitUsd: "1",
      });
    expect(response.status).toBe(201);
    return { Authorization: "Bearer " + response.body.secret };
  }
  async function session(auth: Record<string, string>) {
    const response = await request(app)
      .post("/api/observations/agent-sessions")
      .set(auth)
      .send(intent);
    expect(response.status).toBe(201);
    return response.body.id;
  }
  it("denies self-issued keys and fresh sessions before transport and gives honest discovery eligibility", async () => {
    for (let i = 0; i < 2; i++) {
      const key = await issue(),
        id = await session(key);
      const result = await request(app)
        .post(`/api/observations/${id}/call`)
        .set(key)
        .send(call());
      expect(result.status).toBe(403);
      expect(result.body).toMatchObject({
        code: "operator_allowance_exceeded",
        error: "Paid tool access is currently unavailable for this account.",
        operatorAllowance: { state: "unconfigured", remainingMicros: 0 },
      });
      const offer = await request(app)
        .post(`/api/observations/${id}/discover`)
        .set(key)
        .send({
          need: "Find fixture evidence",
          operations: [{ operation: "search", query: "fixture" }],
        });
      expect(offer.status).toBe(200);
      expect(offer.body.candidateTools).toEqual([]);
      expect(
        offer.body.tools.find((t: any) => t.tool === "exa_search")
          .requestEstimates[0],
      ).toMatchObject({ withinBudget: false, operatorAllowed: false });
      expect(offer.body.operatorAllowance.state).toBe("unconfigured");
      expect(
        offer.body.tools.find((t: any) => t.tool === "exa_search")
          .discoveryMatches[0],
      ).toMatchObject({
        status: "disabled",
        reason: result.body.error,
      });
      expect(
        (await request(app).get("/api/account/operator-allowance").set(key))
          .body.state,
      ).toBe("unconfigured");
    }
    const id = await session(headers());
    expect(
      (
        await request(app)
          .post(`/api/observations/${id}/call`)
          .set(headers())
          .send(call())
      ).status,
    ).toBe(403);
    expect(search).not.toHaveBeenCalled();
    expect(
      (
        await db.pool.query(
          "SELECT count(*)::int AS n FROM octolab.workspace_allowance_spend WHERE workspace_id=$1",
          [workspace],
        )
      ).rows[0].n,
    ).toBe(0);
  });
  it("only permits fresh platform admins to grant, keeps grants immutable to runtime, and preserves pause on replay", async () => {
    const input = grant();
    const endpoint = `/api/admin/account-allowances/${owner.userId}`;
    expect(
      (await request(app).post(endpoint).set(headers()).send(input)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post(endpoint)
          .set(await issue())
          .send(input)
      ).status,
    ).not.toBe(200);
    expect(
      (
        await request(app)
          .post(endpoint)
          .set({ ...headers("admin"), "X-Octolab-Preview": "user" })
          .send(input)
      ).status,
    ).toBe(403);
    expect(
      (await request(app).post(endpoint).set(headers("admin")).send(input)).body
        .operatorAllowance,
    ).toMatchObject({ revision: 1, remainingMicros: 14000 });
    expect(
      (
        await request(app)
          .post(endpoint)
          .set(headers("admin"))
          .send({ ...input, limitMicros: 15000 })
      ).status,
    ).toBe(409);
    expect(
      (await request(app).post(endpoint).set(headers("admin")).send(grant()))
        .status,
    ).toBe(409);
    const paused = grant({ revision: 1, paused: true });
    expect(
      (await request(app).post(endpoint).set(headers("admin")).send(paused))
        .body.operatorAllowance.state,
    ).toBe("paused");
    const replay = await request(app)
      .post(endpoint)
      .set(headers("admin"))
      .send(input);
    expect(replay.body).toMatchObject({
      replayed: true,
      operatorAllowance: { state: "paused", revision: 2 },
    });
    await store.scope.run(workspace, async () => {
      await expect(
        store.db
          .prepare(
            "UPDATE workspace_allowances SET limit_micros=? WHERE workspace_id=?",
          )
          .run(1e9, workspace),
      ).rejects.toThrow(/permission denied/);
    });
    const events = await db.pool.query(
      "SELECT count(*)::int AS n FROM octolab.workspace_allowance_events WHERE workspace_id=$1",
      [workspace],
    );
    expect(events.rows[0].n).toBe(2);
    await db.pool.query("UPDATE auth.users SET deleted_at=now() WHERE id=$1", [
      admin.userId,
    ]);
    expect(
      (
        await request(app)
          .get("/api/admin/account-allowances")
          .set(headers("admin"))
      ).status,
    ).toBe(401);
  });
  it("serializes independent connections, preserves in-flight settlement during pause, and never recharges replay", async () => {
    await request(app)
      .post(`/api/admin/account-allowances/${owner.userId}`)
      .set(headers("admin"))
      .send(grant({ limitMicros: 7000 }));
    const second = new Store(":unused:", url!, workspace);
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    search.mockImplementation(async () => {
      await gate;
      return { sources: [], httpStatus: 200 };
    });
    const other = new Observatory(second, {
      search,
      scrape: async () => ({ text: "", httpStatus: 200 }),
    });
    try {
      await store.scope.run(workspace, async () => {
        const s = await obs.createAgentSession(intent),
          t = await other.createAgentSession(intent),
          args = call();
        const pending = obs.execute(s.id, args);
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));
        await expect(other.execute(t.id, call())).rejects.toThrow(
          /remaining allowance/,
        );
        expect(await store.allowance.status()).toMatchObject({
          reservedMicros: 7000,
          spentMicros: 0,
        });
        const endpoint = `/api/admin/account-allowances/${owner.userId}`;
        expect(
          (
            await request(app)
              .post(endpoint)
              .set(headers("admin"))
              .send(grant({ revision: 1, limitMicros: 0 }))
          ).status,
        ).toBe(409);
        expect(
          (
            await request(app)
              .post(endpoint)
              .set(headers("admin"))
              .send(grant({ revision: 1, limitMicros: 7000, paused: true }))
          ).status,
        ).toBe(200);
        release();
        await pending;
        expect(await store.allowance.status()).toMatchObject({
          state: "paused",
          spentMicros: 7000,
          reservedMicros: 0,
        });
        expect(await obs.execute(s.id, args)).toMatchObject({ replayed: true });
        expect(search).toHaveBeenCalledTimes(1);
        expect((await store.allowance.status()).spentMicros).toBe(7000);
      });
    } finally {
      release?.();
      await second.close();
    }
  });
  it("rolls admission back atomically, conservatively settles restart reservations once, and isolates workspaces", async () => {
    await store.scope.run(workspace, async () => {
      await grantFixtureAllowance(store, 14000);
      await expect(
        store.db.transaction(async () => {
          await store.allowance.reserve(randomUUID(), "observation", 7000);
          throw Error("Receipt write failed");
        }),
      ).rejects.toThrow("Receipt write failed");
      expect(await store.allowance.status()).toMatchObject({
        spentMicros: 0,
        reservedMicros: 0,
      });
      await store.allowance.reserve(randomUUID(), "observation", 7000);
    });
    const reopened = new Store(":unused:", url!, workspace);
    try {
      await reopened.allowance.recover();
      await reopened.allowance.recover();
      expect(await reopened.allowance.status()).toMatchObject({
        spentMicros: 7000,
        reservedMicros: 0,
        remainingMicros: 7000,
      });
      const other = randomUUID();
      await db.pool.query(
        "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Neighbor fixture')",
        [other],
      );
      await reopened.scope.run(other, async () => {
        expect((await reopened.allowance.status()).state).toBe("unconfigured");
        await expect(
          reopened.allowance.reserve(randomUUID(), "task", 1),
        ).rejects.toThrow(/Paid tool access is currently unavailable/);
        expect(
          await reopened.db
            .prepare("SELECT * FROM workspace_allowance_spend")
            .all(),
        ).toEqual([]);
      });
    } finally {
      await reopened.close();
    }
  });
  it("gates legacy task and controlled-lab paths without network and conserves shared counters", async () => {
    await store.scope.run(workspace, async () => {
      const engine = new Engine(store),
        task = await createTask(store),
        lab = new ProviderLab(store, {
          search,
          scrape: async () => ({ text: "fixture", httpStatus: 200 }),
        });
      await expect(
        engine.reserve(task.id, "exa", randomUUID(), "search", {}),
      ).rejects.toThrow(/Paid tool access is currently unavailable/);
      await expect(
        lab.start({ requestKey: randomUUID(), providers: ["exa"] }),
      ).rejects.toThrow(/Paid tool access is currently unavailable/);
      expect(search).not.toHaveBeenCalled();
      await grantFixtureAllowance(store, 7000);
      const id = randomUUID();
      const estimate = await engine.reserve(task.id, "exa", id, "search", {});
      await engine.settle(task.id, id, "exa", estimate, {});
      await engine.settle(task.id, id, "exa", estimate, {});
      expect(await store.allowance.status()).toMatchObject({
        spentMicros: 7000,
        reservedMicros: 0,
        state: "exhausted",
      });
      await expect(
        lab.start({ requestKey: randomUUID(), providers: ["exa"] }),
      ).rejects.toThrow(/remaining allowance/);
    });
  });
  it("recovers interrupted observation receipts and key reservations in the same conservative settlement", async () => {
    await store.scope.run(workspace, async () => {
      await grantFixtureAllowance(store, 14000);
      const session = await obs.createAgentSession(intent),
        { key } = await obs.db.apiKeys.create({
          name: "Recovery fixture",
          requestKey: randomUUID(),
          scopes: ["tools:execute"],
          limitUsd: "1",
        });
      const id = randomUUID();
      await store.db.transaction(async () => {
        await store.allowance.reserve(id, "observation", 7000);
        await obs.db.apiKeys.reserve(key.id, id, "exa_search", 7000);
        session.reservedMicros = 7000;
        await obs.db.save(session);
        await obs.db.saveCall(
          {
            id,
            sessionId: session.id,
            requestKey: "interrupted-fixture",
            tool: "exa_search",
            provider: "exa",
            arguments: { query: "fixture" },
            statedReason: "Fixture recovery",
            status: "running",
            startedAt: new Date().toISOString(),
            estimateMicros: 7000,
            apiKeyId: key.id,
          },
          "fixture-signature",
        );
      });
      const reopened = new Store(":unused:", url!, workspace);
      try {
        const recovered = new Observatory(reopened);
        await recovered.ready;
        await recovered.db.recover();
        await reopened.allowance.recover();
        await recovered.db.recover();
        await reopened.allowance.recover();
        expect(await reopened.allowance.status()).toMatchObject({
          spentMicros: 7000,
          reservedMicros: 0,
        });
        expect(await recovered.db.apiKeys.get(key.id)).toMatchObject({
          spentMicros: 7000,
          reservedMicros: 0,
        });
        expect(await recovered.require(session.id)).toMatchObject({
          spentMicros: 7000,
          reservedMicros: 0,
        });
        expect((await recovered.db.calls(session.id))[0].status).toBe(
          "interrupted",
        );
        expect((await recovered.db.detail(session.id))?.integrity).toBe(true);
      } finally {
        await reopened.close();
      }
      expect(search).not.toHaveBeenCalled();
    });
  });
  it("charges a controlled call once and blocks remaining lab transports when paused mid-run", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    search.mockImplementation(async () => {
      await gate;
      return { sources: [], httpStatus: 200 };
    });
    await store.scope.run(workspace, async () => {
      await grantFixtureAllowance(store, 100000);
      const lab = new ProviderLab(store, {
        search,
        scrape: async () => ({ text: "", httpStatus: 200 }),
      });
      try {
        const run = await lab.start({
          requestKey: randomUUID(),
          providers: ["exa"],
        });
        await vi.waitFor(() => expect(search).toHaveBeenCalledTimes(1));
        await store.allowance.change(
          workspace,
          admin.userId,
          grant({ revision: 1, limitMicros: 100000, paused: true }),
        );
        release();
        await vi.waitFor(() => expect(lab.active.size).toBe(0));
        expect(await store.allowance.status()).toMatchObject({
          state: "paused",
          spentMicros: 7000,
          reservedMicros: 0,
        });
        expect(search).toHaveBeenCalledTimes(1);
        const finished = await lab.get(run.id);
        expect(finished.spentMicros).toBe(7000);
        expect(
          finished.calls.filter((c) => c.status === "succeeded"),
        ).toHaveLength(1);
        expect(
          finished.calls.filter((c) => c.status === "skipped"),
        ).toHaveLength(4);
        await lab.recover();
        await store.allowance.recover();
        expect((await store.allowance.status()).spentMicros).toBe(7000);
      } finally {
        release?.();
        await vi.waitFor(() => expect(lab.active.size).toBe(0));
      }
    });
  });
});
