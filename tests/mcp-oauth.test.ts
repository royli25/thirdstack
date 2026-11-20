import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import {
  Accounts,
  AccountError,
  type VerifiedIdentity,
} from "../server/accounts";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import { createApp } from "../server/app";
import { mcpOAuthSettings } from "../server/mcp-oauth";

const database = process.env.OCTOLAB_TEST_POSTGRES_URL;
describe("OAuth configuration guards", () => {
  it("does not advertise a sign-in server unless deliberately enabled", () => {
    vi.stubEnv("MCP_OAUTH_ENABLED", "false");
    expect(mcpOAuthSettings({} as Accounts)).toBeUndefined();
    vi.unstubAllEnvs();
  });
  it("requires a canonical secure origin", () => {
    vi.stubEnv("MCP_OAUTH_ENABLED", "true");
    for (const origin of [
      "http://remote.example",
      "https://user:password@example.com",
      "https://example.com/path",
      "https://example.com/?q=1",
    ]) {
      vi.stubEnv("PUBLIC_APP_URL", origin);
      expect(() =>
        mcpOAuthSettings({
          settings: { url: "https://oauth-fixture.supabase.co" },
        } as Accounts),
      ).toThrow();
    }
    vi.unstubAllEnvs();
  });
});

(database ? describe : describe.skip)(
  "OAuth grants and MCP boundaries with disposable PostgreSQL",
  () => {
    let store: Store,
      db: PostgresDatabase,
      accounts: Accounts,
      app: ReturnType<typeof createApp>;
    const user = randomUUID(),
      other = randomUUID(),
      business = randomUUID(),
      clientId = randomUUID();
    const resource = "https://oauth-fixture.example/mcp";
    const identities = new Map<string, VerifiedIdentity>();
    const auth = (token = "browser") => ({ Authorization: `Bearer ${token}` });
    let remoteCalls = 0,
      autoApprove = false,
      remoteDown = false;
    const callback = "http://127.0.0.1:55441/callback";
    const hookedSession = randomUUID();
    const remote = vi.fn(async (input: any, init?: RequestInit) => {
      remoteCalls++;
      if (remoteDown) throw new Error("fixture sign-in service unavailable");
      const url = new URL(String(input));
      expect(url.origin).toBe("https://oauth-fixture.supabase.co");
      expect(init?.redirect).toBe("error");
      if (init?.method === "DELETE") return new Response(null, { status: 204 });
      const id = url.pathname.split("/")[5];
      const row = (
        await db.pool.query(
          "SELECT * FROM auth.oauth_authorizations WHERE authorization_id=$1",
          [id],
        )
      ).rows[0];
      if (!row) return new Response("{}", { status: 404 });
      await db.pool.query(
        "UPDATE auth.oauth_authorizations SET user_id=$2 WHERE authorization_id=$1 AND user_id IS NULL",
        [id, user],
      );
      const state = new URL(callback);
      state.searchParams.set("state", row.state);
      if (init?.method === "POST") {
        const allow = JSON.parse(String(init.body)).action === "approve";
        await db.pool.query(
          "UPDATE auth.oauth_authorizations SET status=$2 WHERE authorization_id=$1",
          [id, allow ? "approved" : "denied"],
        );
        state.searchParams.set(
          allow ? "code" : "error",
          allow ? "fixture-code" : "access_denied",
        );
        return Response.json({ redirect_url: state.href });
      }
      if (autoApprove) {
        await db.pool.query(
          "UPDATE auth.oauth_authorizations SET status='approved' WHERE authorization_id=$1",
          [id],
        );
        state.searchParams.set("code", "autoapproved-fixture-code");
        return Response.json({ redirect_url: state.href });
      }
      return Response.json({ authorization_id: id });
    });
    async function pending(changes: Record<string, unknown> = {}) {
      const id = "fixture_" + randomUUID().replaceAll("-", "");
      await db.pool.query(
        `INSERT INTO auth.oauth_authorizations(authorization_id,client_id,redirect_uri,resource,state,scope,code_challenge_method,code_challenge,expires_at,status)
      VALUES($1,$2,$3,$4,'fixture-state','openid email','s256',$5,now()+interval '10 minutes','pending')`,
        [id, clientId, callback, resource, "a".repeat(43)],
      );
      for (const [field, value] of Object.entries(changes)) {
        if (
          ![
            "resource",
            "user_id",
            "scope",
            "code_challenge_method",
            "code_challenge",
            "redirect_uri",
            "expires_at",
          ].includes(field)
        )
          throw new Error("bad fixture field");
        await db.pool.query(
          `UPDATE auth.oauth_authorizations SET ${field}=$2 WHERE authorization_id=$1`,
          [id, value],
        );
      }
      return id;
    }
    async function agentToken() {
      const grant = (
        await db.pool.query(
          "SELECT generation FROM octolab.mcp_grants WHERE user_id=$1 AND client_id=$2",
          [user, clientId],
        )
      ).rows[0];
      const session = randomUUID(),
        token = "agent-" + randomUUID();
      await db.pool.query(
        "INSERT INTO auth.sessions(id,user_id,oauth_client_id) VALUES($1,$2,$3)",
        [session, user, clientId],
      );
      identities.set(token, {
        userId: user,
        email: "oauth@fixture.invalid",
        sessionId: session,
        expiresAt: Date.now() + 3600000,
        oauthClientId: clientId,
        oauthGrantId: grant.generation,
        oauthAudience: resource,
      });
      return token;
    }
    beforeAll(async () => {
      vi.stubEnv("MCP_OAUTH_ENABLED", "true");
      vi.stubEnv("PUBLIC_APP_URL", "https://oauth-fixture.example");
      store = new Store(":unused:", database!, randomUUID());
      db = store.db as PostgresDatabase;
      await applyMigrations(db);
      await db.pool.query(`CREATE SCHEMA IF NOT EXISTS auth;
      CREATE TABLE IF NOT EXISTS auth.users(id UUID PRIMARY KEY,deleted_at TIMESTAMPTZ,banned_until TIMESTAMPTZ,email TEXT,email_confirmed_at TIMESTAMPTZ);
      CREATE TABLE IF NOT EXISTS auth.sessions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES auth.users(id),not_after TIMESTAMPTZ);
      ALTER TABLE auth.sessions ADD COLUMN IF NOT EXISTS oauth_client_id UUID;
      CREATE TABLE IF NOT EXISTS auth.oauth_clients(id UUID PRIMARY KEY,client_name TEXT,deleted_at TIMESTAMPTZ);
      CREATE TABLE IF NOT EXISTS auth.oauth_authorizations(authorization_id TEXT PRIMARY KEY,client_id UUID,redirect_uri TEXT,resource TEXT,state TEXT,scope TEXT,user_id UUID,code_challenge_method TEXT,code_challenge TEXT,expires_at TIMESTAMPTZ,status TEXT);`);
      for (const [token, id] of [
        ["browser", user],
        ["other-browser", other],
        ["business-browser", business],
      ]) {
        const identity = {
          userId: id,
          email: `${token}@fixture.invalid`,
          sessionId: randomUUID(),
          expiresAt: Date.now() + 3600000,
        };
        identities.set(token, identity);
        await db.pool.query(
          "INSERT INTO auth.users(id,email,email_confirmed_at) VALUES($1,$2,now())",
          [id, identity.email],
        );
        await db.pool.query(
          "INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)",
          [identity.sessionId, id],
        );
      }
      await db.pool.query(
        "INSERT INTO auth.oauth_clients(id,client_name) VALUES($1,'Fixture coding client')",
        [clientId],
      );
      accounts = new Accounts(
        store,
        {
          url: "https://oauth-fixture.supabase.co",
          publishableKey: "sb_publishable_fixture",
          adminUserIds: [user],
        },
        async (token) => {
          const identity = identities.get(token);
          if (!identity) throw new AccountError(401, "Invalid session.");
          return identity;
        },
      );
      await accounts.chooseAccountType(identities.get("other-browser")!, {
        accountType: "user",
      });
      await accounts.chooseAccountType(identities.get("business-browser")!, {
        accountType: "business",
      });
      app = createApp(
        store,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        accounts,
      );
      // Swap only the managed Auth transport; all application auth, storage,
      // HTTP routes, migration, grant, and account boundaries remain real.
      (app.locals.oauth as any).remote = remote;
    });
    afterAll(async () => {
      await app?.locals.mcp.close();
      await store?.close();
      vi.unstubAllEnvs();
    });
    it("publishes canonical discovery and a resource_metadata challenge", async () => {
      const metadata = await request(app)
        .get("/.well-known/oauth-protected-resource/mcp")
        .set("Host", "untrusted.example");
      expect(metadata.body).toMatchObject({
        resource,
        authorization_servers: ["https://oauth-fixture.supabase.co/auth/v1"],
      });
      const response = await request(app).post("/mcp").send({});
      expect(response.status).toBe(401);
      expect(response.headers["www-authenticate"]).toContain(
        'resource_metadata="https://oauth-fixture.example/.well-known/oauth-protected-resource/mcp"',
      );
    });
    it("requires browser authentication and prevents foreign-origin approval", async () => {
      const id = await pending();
      expect(
        (await request(app).get(`/api/agent-auth/requests/${id}`)).status,
      ).toBe(401);
      expect(
        (
          await request(app)
            .post(`/api/agent-auth/requests/${id}`)
            .set(auth())
            .set("Origin", "https://foreign.example")
            .send({ allow: true })
        ).status,
      ).toBe(403);
      expect(
        (
          await db.pool.query(
            "SELECT * FROM octolab.mcp_grants WHERE user_id=$1",
            [user],
          )
        ).rowCount,
      ).toBe(0);
    });
    it("rejects wrong resources, unsafe callbacks, missing PKCE, unsupported scopes, expired and other-user requests", async () => {
      for (const changes of [
        { resource: "https://other.example/mcp" },
        { redirect_uri: "http://remote.example/callback" },
        { code_challenge_method: "plain" },
        { code_challenge: null },
        { scope: "admin" },
        { expires_at: new Date(0) },
        { user_id: other },
      ]) {
        const id = await pending(changes);
        const before = remoteCalls;
        expect(
          (await request(app).get(`/api/agent-auth/requests/${id}`).set(auth()))
            .status,
        ).toBeGreaterThanOrEqual(400);
        expect(remoteCalls).toBe(before);
      }
    });
    it("loads a consent request without issuing a code or granting access", async () => {
      const id = await pending(),
        before = remoteCalls;
      const details = await request(app)
        .get(`/api/agent-auth/requests/${id}`)
        .set(auth());
      expect(details.status).toBe(200);
      expect(details.body).toMatchObject({
        clientName: "Fixture coding client",
        redirectUri: callback,
        resource,
      });
      expect(remoteCalls).toBe(before);
      expect(
        (
          await db.pool.query(
            "SELECT * FROM octolab.mcp_grants WHERE user_id=$1",
            [user],
          )
        ).rowCount,
      ).toBe(0);
    });
    it("accepts Codex's identity and refresh permissions without granting extra application access", async () => {
      const id = await pending({ scope: "openid email offline_access" });
      const response = await request(app)
        .get(`/api/agent-auth/requests/${id}`)
        .set(auth());
      expect(response.status).toBe(200);
      expect(response.body.scopes).toEqual([
        "openid",
        "email",
        "offline_access",
      ]);
      expect(
        (
          await db.pool.query(
            "SELECT * FROM octolab.mcp_grants WHERE user_id=$1",
            [user],
          )
        ).rowCount,
      ).toBe(0);
    });
    it("denies without granting access and preserves OAuth state", async () => {
      const id = await pending();
      const result = await request(app)
        .post(`/api/agent-auth/requests/${id}`)
        .set(auth())
        .send({ allow: false });
      expect(result.status).toBe(200);
      expect(new URL(result.body.redirectUrl).searchParams.get("error")).toBe(
        "access_denied",
      );
      expect(new URL(result.body.redirectUrl).searchParams.get("state")).toBe(
        "fixture-state",
      );
      expect(
        (
          await db.pool.query(
            "SELECT * FROM octolab.mcp_grants WHERE user_id=$1",
            [user],
          )
        ).rowCount,
      ).toBe(0);
    });
    it("does not deliver an auto-approved success code when the user cancels", async () => {
      autoApprove = true;
      const id = await pending();
      const result = await request(app)
        .post(`/api/agent-auth/requests/${id}`)
        .set(auth())
        .send({ allow: false });
      expect(result.status).toBe(200);
      expect(new URL(result.body.redirectUrl).searchParams.has("code")).toBe(
        false,
      );
      autoApprove = false;
    });
    it("records approval, issues a resource-bound grant, and restricts even an admin user's agent", async () => {
      const id = await pending();
      const result = await request(app)
        .post(`/api/agent-auth/requests/${id}`)
        .set(auth())
        .send({ allow: true });
      expect(result.status).toBe(200);
      expect(new URL(result.body.redirectUrl).searchParams.get("code")).toBe(
        "fixture-code",
      );
      const hook = (
        await db.pool.query(
          "SELECT octolab.two_hands_mcp_token_hook($1::jsonb) AS body",
          [
            JSON.stringify({
              user_id: user,
              claims: {
                client_id: clientId,
                session_id: hookedSession,
                aud: "authenticated",
              },
            }),
          ],
        )
      ).rows[0].body;
      expect(hook.claims.aud).toBe(resource);
      expect(hook.claims.two_hands_grant).toBeTruthy();
      const token = await agentToken();
      expect(
        (await request(app).get("/api/observations/catalog").set(auth(token)))
          .status,
      ).toBe(200);
      for (const path of [
        "/api/auth/me",
        "/api/account/api-keys",
        "/api/admin/companies",
        "/api/agent-auth/connections",
        "/api/provider-lab/suites",
      ]) {
        expect(
          (await request(app).get(path).set(auth(token))).status,
          path,
        ).toBe(403);
      }
      expect(
        (
          await request(app)
            .post("/api/account/api-keys")
            .set(auth(token))
            .send({})
        ).status,
      ).toBe(403);
    });
    it("keeps agent-created records inside the approved account and refuses wrong-audience tokens", async () => {
      const token = await agentToken();
      const saved = await request(app)
        .post("/api/observations/agent-sessions")
        .set(auth(token))
        .send({
          title: "OAuth fixture only",
          objective: "Verify OAuth account isolation without provider calls",
          criteria: [{ text: "Private fixture", weight: 1 }],
          host: "fixture",
          model: "fixture",
        });
      expect(saved.status, JSON.stringify(saved.body)).toBe(201);
      expect(
        (
          await request(app)
            .get(`/api/observations/${saved.body.id}`)
            .set(auth("other-browser"))
        ).status,
      ).toBe(404);
      const wrong = "wrong-aud-" + randomUUID();
      identities.set(wrong, {
        ...identities.get(token)!,
        oauthAudience: "https://other.example/mcp",
      });
      expect(
        (await request(app).get("/api/observations/catalog").set(auth(wrong)))
          .status,
      ).toBe(401);
    });
    it("does not expose or revoke another account's connections", async () => {
      expect(
        (
          await request(app)
            .get("/api/agent-auth/connections")
            .set(auth("other-browser"))
        ).body.connections,
      ).toEqual([]);
      expect(
        (
          await request(app)
            .post(`/api/agent-auth/connections/${clientId}/revoke`)
            .set(auth("other-browser"))
            .send({})
        ).status,
      ).toBe(404);
    });
    it("revocation blocks existing tokens and refresh even during an Auth outage; reconnect cannot resurrect old tokens", async () => {
      const token = await agentToken();
      remoteDown = true;
      const revoked = await request(app)
        .post(`/api/agent-auth/connections/${clientId}/revoke`)
        .set(auth())
        .send({});
      expect(revoked.body).toEqual({ revoked: true, authRevoked: false });
      expect(
        (await request(app).get("/api/observations/catalog").set(auth(token)))
          .status,
      ).toBe(401);
      await expect(
        db.pool.query("SELECT octolab.two_hands_mcp_token_hook($1::jsonb)", [
          JSON.stringify({
            user_id: user,
            claims: { client_id: clientId, session_id: hookedSession },
          }),
        ]),
      ).rejects.toThrow(/disconnected/);
      remoteDown = false;
      const id = await pending();
      expect(
        (
          await request(app)
            .post(`/api/agent-auth/requests/${id}`)
            .set(auth())
            .send({ allow: true })
        ).status,
      ).toBe(200);
      await expect(
        db.pool.query("SELECT octolab.two_hands_mcp_token_hook($1::jsonb)", [
          JSON.stringify({
            user_id: user,
            authentication_method: "token_refresh",
            claims: { client_id: clientId, session_id: hookedSession },
          }),
        ]),
      ).rejects.toThrow(/disconnected/);
      expect(
        (await request(app).get("/api/observations/catalog").set(auth(token)))
          .status,
      ).toBe(401);
      expect(
        (
          await request(app)
            .get("/api/observations/catalog")
            .set(auth(await agentToken()))
        ).status,
      ).toBe(200);
    });
    it("refuses a business account's agent grant without creating personal storage", async () => {
      const id = await pending();
      const response = await request(app)
        .post(`/api/agent-auth/requests/${id}`)
        .set(auth("business-browser"))
        .send({ allow: true });
      expect(response.status).toBe(403);
      expect(response.body.error).toContain("business account");
      const result = await db.pool.query(
        "SELECT 1 FROM octolab.workspace_memberships WHERE user_id=$1",
        [business],
      );
      expect(result.rowCount).toBe(0);
    });
    it("does not change ordinary browser token claims", async () => {
      const input = {
        user_id: user,
        claims: { aud: "authenticated", role: "authenticated" },
      };
      expect(
        (
          await db.pool.query(
            "SELECT octolab.two_hands_mcp_token_hook($1::jsonb) AS body",
            [JSON.stringify(input)],
          )
        ).rows[0].body.claims,
      ).toEqual(input.claims);
    });
    it("keeps grant records and the token hook inaccessible to the workspace runtime", async () => {
      for (const table of [
        "mcp_grants",
        "mcp_grant_sessions",
        "mcp_grant_events",
      ]) {
        const result = await db.pool.query(
          "SELECT has_table_privilege('octolab_runtime',$1,'SELECT') AS readable",
          [`octolab.${table}`],
        );
        expect(result.rows[0].readable).toBe(false);
      }
      const result = await db.pool.query(
        "SELECT has_function_privilege('octolab_runtime','octolab.two_hands_mcp_token_hook(jsonb)','EXECUTE') AS callable",
      );
      expect(result.rows[0].callable).toBe(false);
    });
  },
);
