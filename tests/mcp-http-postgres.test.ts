import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import request from "supertest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
import { setAccountType } from "./helpers";

/** Remote MCP against real PostgreSQL account isolation. Runs in CI. */
const url = process.env.OCTOLAB_TEST_POSTGRES_URL;
const suite = url ? describe : describe.skip;
suite("remote MCP with PostgreSQL accounts", () => {
  let store: Store, app: ReturnType<typeof createApp>, server: Server;
  let base: string;
  const ids = { a: randomUUID(), b: randomUUID(), legacy: randomUUID() };
  const tokens = { a: `mcp-a-${ids.a}`, b: `mcp-b-${ids.b}` };
  const identities = new Map<string, VerifiedIdentity>();
  const original = config.token;
  const clients: Client[] = [];
  const intent = {
    title: "Remote account fixture",
    objective: "Keep remote MCP research inside the caller's account",
    criteria: [{ text: "Private receipt", weight: 1 }],
    model: "fixture",
    host: "fixture",
  };
  const connect = async (credential: string) => {
    const client = new Client({ name: "pg-remote-fixture", version: "1" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${credential}` } },
      }),
    );
    clients.push(client);
    return client;
  };
  beforeAll(async () => {
    store = new Store(":unused:", url!, ids.legacy);
    const db = store.db as PostgresDatabase;
    await applyMigrations(db);
    await db.pool.query(
      "CREATE SCHEMA IF NOT EXISTS auth; CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ); ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email TEXT; ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMPTZ; CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,not_after TIMESTAMPTZ);",
    );
    for (const name of ["a", "b"] as const) {
      const identity = {
        userId: ids[name],
        email: `mcp-${name}-${ids[name]}@fixture.invalid`,
        sessionId: randomUUID(),
        expiresAt: Date.now() + 3600000,
      };
      identities.set(tokens[name], identity);
      await db.pool.query(
        "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
        [identity.userId, identity.email],
      );
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
        [identity.sessionId, identity.userId],
      );
      await setAccountType(db.pool, identity.userId, "user");
    }
    const accounts = new Accounts(
      store,
      {
        url: "https://octolab-fixture.supabase.co",
        publishableKey: "sb_publishable_fixture",
        adminUserIds: [],
      },
      vi.fn(async (token: string) => {
        const value = identities.get(token);
        if (!value) throw new AccountError(401, "Invalid account session.");
        return value;
      }),
    );
    config.token = "legacy-fixture-owner-token-000000000000";
    app = createApp(
      store,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      accounts,
    );
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    for (const c of clients) await c.close().catch(() => {});
    await app?.locals.mcp.close();
    if (server)
      await new Promise((r) => {
        server.close(r);
        server.closeAllConnections();
      });
    config.token = original;
    if (store) await store.close();
  });

  it("refuses missing, owner and unknown credentials", async () => {
    for (const credential of ["", config.token, "unknown-session"]) {
      const r = await fetch(`${base}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-06-18",
            capabilities: {},
            clientInfo: { name: "x", version: "1" },
          },
        }),
      });
      expect(r.status).toBe(401);
      if (credential === "unknown-session")
        expect(JSON.stringify(await r.json())).toContain("Invalid API key");
    }
  });

  it("records an account's remote research only in that account", async () => {
    const a = await connect(tokens.a);
    const s = JSON.parse(
      ((await a.callTool({ name: "record_intent", arguments: intent })) as any)
        .content[0].text,
    );
    expect(s.status).toBe("active");
    const mine = await request(app)
      .get("/api/observations")
      .set({ Authorization: `Bearer ${tokens.a}` });
    expect(mine.body.map((o: any) => o.id)).toContain(s.id);
    const theirs = await request(app)
      .get("/api/observations")
      .set({ Authorization: `Bearer ${tokens.b}` });
    expect(theirs.body.map((o: any) => o.id)).not.toContain(s.id);
    const b = await connect(tokens.b);
    const peek: any = await b.callTool({
      name: "get_session",
      arguments: { sessionId: s.id },
    });
    expect(peek.isError).toBe(true);
  });

  it("routes a scoped key's remote research to the key's account", async () => {
    const issued = await request(app)
      .post("/api/account/api-keys")
      .set({ Authorization: `Bearer ${tokens.a}` })
      .send({
        name: "Remote MCP key",
        requestKey: randomUUID(),
        scopes: ["research:read", "research:write", "tools:discover"],
        limitUsd: "0.01",
      });
    expect(issued.status).toBe(201);
    const client = await connect(issued.body.secret);
    const s = JSON.parse(
      (
        (await client.callTool({
          name: "record_intent",
          arguments: intent,
        })) as any
      ).content[0].text,
    );
    const mine = await request(app)
      .get("/api/observations")
      .set({ Authorization: `Bearer ${tokens.a}` });
    expect(mine.body.map((o: any) => o.id)).toContain(s.id);
  });
});
