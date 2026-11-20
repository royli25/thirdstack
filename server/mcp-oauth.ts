import type { Express, Request, Response } from "express";
import express from "express";
import { z } from "zod";
import { Accounts, AccountError, type VerifiedIdentity } from "./accounts.js";
import { sameOriginWrite } from "./account-api.js";

export function mcpOAuthSettings(accounts?: Accounts) {
  if (!accounts || process.env.MCP_OAUTH_ENABLED !== "true") return undefined;
  const origin = new URL(process.env.PUBLIC_APP_URL || "");
  if (
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    !(
      origin.protocol === "https:" ||
      (origin.protocol === "http:" &&
        ["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname))
    )
  )
    throw new Error(
      "MCP OAuth requires a canonical HTTPS PUBLIC_APP_URL (loopback HTTP is allowed for development).",
    );
  return {
    resource: new URL("/mcp", origin).href,
    metadata: new URL("/.well-known/oauth-protected-resource/mcp", origin).href,
    issuer: new URL("/auth/v1", accounts.settings.url).href,
  };
}

const requestId = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);
// offline_access lets interactive MCP clients request refresh credentials;
// it does not grant additional Two Hands tool or account permissions.
const scopes = new Set(["openid", "email", "profile", "offline_access"]);
type Authorization = {
  authorization_id: string;
  client_id: string;
  client_name: string;
  redirect_uri: string;
  resource: string | null;
  state: string | null;
  scope: string;
  user_id: string | null;
  code_challenge_method: string | null;
  code_challenge: string | null;
};

export class McpOAuth {
  readonly settings;
  constructor(
    readonly accounts: Accounts,
    private remote: typeof fetch = fetch,
  ) {
    this.settings = mcpOAuthSettings(accounts);
  }
  private requireEnabled() {
    if (!this.settings)
      throw new AccountError(
        503,
        "Agent sign-in is not enabled on this server.",
      );
    return this.settings;
  }
  private async authorization(id: string, identity: VerifiedIdentity) {
    const settings = this.requireEnabled();
    const result = await this.accounts.database.pool.query<Authorization>(
      `SELECT a.authorization_id,a.client_id,c.client_name,a.redirect_uri,a.resource,a.state,a.scope,a.user_id,a.code_challenge_method,a.code_challenge
       FROM auth.oauth_authorizations a JOIN auth.oauth_clients c ON c.id=a.client_id
       WHERE a.authorization_id=$1 AND a.status='pending' AND a.expires_at>now() AND c.deleted_at IS NULL`,
      [requestId.parse(id)],
    );
    const row = result.rows[0];
    if (
      row &&
      (row.code_challenge_method?.toUpperCase() !== "S256" ||
        !/^[A-Za-z0-9_-]{43}$/.test(row.code_challenge || ""))
    )
      throw new AccountError(
        400,
        "The agent must use PKCE with S256 to connect.",
      );
    if (!row || (row.user_id && row.user_id !== identity.userId))
      throw new AccountError(
        404,
        "This connection request expired or is no longer available. Start again from your agent.",
      );
    if (row.resource !== settings.resource)
      throw new AccountError(
        400,
        "The agent requested a different MCP server. Start again using this server’s connection command.",
      );
    if (
      row.scope
        .split(/\s+/)
        .filter(Boolean)
        .some((s) => !scopes.has(s))
    )
      throw new AccountError(
        400,
        "The agent requested unsupported permissions.",
      );
    const redirect = new URL(row.redirect_uri);
    if (
      redirect.username ||
      redirect.password ||
      redirect.hash ||
      !(
        redirect.protocol === "https:" ||
        (redirect.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(redirect.hostname))
      )
    )
      throw new AccountError(
        400,
        "The agent’s callback address is not supported.",
      );
    return row;
  }
  async details(id: string, identity: VerifiedIdentity) {
    const row = await this.authorization(id, identity);
    return {
      authorizationId: row.authorization_id,
      clientId: row.client_id,
      clientName: row.client_name || "MCP client",
      redirectUri: row.redirect_uri,
      resource: row.resource,
      scopes: row.scope.split(/\s+/).filter(Boolean),
    };
  }
  private async authRequest(path: string, token: string, body?: unknown) {
    const response = await this.remote(
      new URL(`/auth/v1/${path}`, this.accounts.settings.url),
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          apikey: this.accounts.settings.publishableKey,
          Authorization: `Bearer ${token}`,
          Origin: new URL(this.requireEnabled().resource).origin,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!response.ok)
      throw new AccountError(
        response.status >= 500 ? 503 : 400,
        "The sign-in service could not complete this connection. Start again from your agent.",
      );
    return response.status === 204 ? {} : await response.json();
  }
  async decide(
    id: string,
    identity: VerifiedIdentity,
    token: string,
    allow: boolean,
  ) {
    const row = await this.authorization(id, identity);
    // Auth binds the request to this verified browser session and can return a
    // code immediately when this user previously approved this OAuth client.
    // Never deliver that code until Two Hands has recorded an explicit grant.
    const details = await this.authRequest(
      `oauth/authorizations/${encodeURIComponent(id)}`,
      token,
    );
    if (!allow) {
      if (!details.redirect_url) {
        const denied = await this.authRequest(
          `oauth/authorizations/${encodeURIComponent(id)}/consent`,
          token,
          { action: "deny" },
        );
        return {
          redirectUrl: this.safeRedirect(denied.redirect_url, row.redirect_uri),
        };
      }
      const redirect = new URL(row.redirect_uri);
      redirect.searchParams.set("error", "access_denied");
      if (row.state !== null) redirect.searchParams.set("state", row.state);
      return { redirectUrl: redirect.href };
    }
    await this.accounts.assertAccountType(identity, "user");
    const workspace = await this.accounts.personalAccountScope(identity);
    const client = await this.accounts.database.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO octolab.mcp_grants(user_id,client_id,workspace_id,client_name,resource)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(user_id,client_id) DO UPDATE SET
        workspace_id=excluded.workspace_id,client_name=excluded.client_name,resource=excluded.resource,generation=gen_random_uuid(),granted_at=now(),revoked_at=NULL`,
        [
          identity.userId,
          row.client_id,
          workspace,
          (row.client_name || "MCP client").slice(0, 200),
          this.requireEnabled().resource,
        ],
      );
      await client.query(
        "INSERT INTO octolab.mcp_grant_events(user_id,client_id,action) VALUES($1,$2,'authorized')",
        [identity.userId, row.client_id],
      );
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
    const approved = details.redirect_url
      ? details
      : await this.authRequest(
          `oauth/authorizations/${encodeURIComponent(id)}/consent`,
          token,
          { action: "approve" },
        );
    return {
      redirectUrl: this.safeRedirect(approved.redirect_url, row.redirect_uri),
    };
  }
  private safeRedirect(value: unknown, target: string) {
    if (typeof value !== "string")
      throw new AccountError(
        502,
        "The sign-in service did not return an agent callback.",
      );
    const url = new URL(value),
      expected = new URL(target);
    if (
      url.origin !== expected.origin ||
      url.pathname !== expected.pathname ||
      url.hash
    )
      throw new AccountError(
        502,
        "The sign-in service returned an unexpected callback.",
      );
    return url.href;
  }
  async list(identity: VerifiedIdentity) {
    this.requireEnabled();
    return (
      await this.accounts.database.pool.query(
        `SELECT client_id AS "clientId",client_name AS "clientName",granted_at AS "grantedAt",revoked_at AS "revokedAt"
      FROM octolab.mcp_grants WHERE user_id=$1 ORDER BY granted_at DESC`,
        [identity.userId],
      )
    ).rows;
  }
  async revoke(identity: VerifiedIdentity, clientId: string, token: string) {
    this.requireEnabled();
    z.uuid().parse(clientId);
    const db = this.accounts.database.pool;
    const result = await db.query(
      `UPDATE octolab.mcp_grants SET revoked_at=COALESCE(revoked_at,now()) WHERE user_id=$1 AND client_id=$2 RETURNING client_id`,
      [identity.userId, clientId],
    );
    if (!result.rowCount)
      throw new AccountError(404, "This agent connection was not found.");
    await db.query(
      "INSERT INTO octolab.mcp_grant_events(user_id,client_id,action) VALUES($1,$2,'revoked')",
      [identity.userId, clientId],
    );
    // Local access and refresh (via the token hook) are already blocked even if
    // the managed Auth service is temporarily unavailable.
    const response = await this.remote(
      new URL(
        `/auth/v1/user/oauth/grants?client_id=${encodeURIComponent(clientId)}`,
        this.accounts.settings.url,
      ),
      {
        method: "DELETE",
        headers: {
          apikey: this.accounts.settings.publishableKey,
          Authorization: `Bearer ${token}`,
        },
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    ).catch(() => undefined);
    return { revoked: true, authRevoked: !!response?.ok };
  }
  async workspace(identity: VerifiedIdentity) {
    const settings = this.requireEnabled();
    await this.accounts.assertAccountType(identity, "user");
    if (
      !identity.oauthClientId ||
      !identity.oauthGrantId ||
      identity.oauthAudience !== settings.resource
    )
      throw new AccountError(
        401,
        "This token was not issued for this MCP server.",
      );
    const result = await this.accounts.database.pool.query(
      `SELECT g.workspace_id FROM octolab.mcp_grants g
      JOIN octolab.workspace_memberships m ON m.workspace_id=g.workspace_id AND m.user_id=g.user_id AND m.role='owner'
      WHERE g.user_id=$1 AND g.client_id=$2 AND g.resource=$3 AND g.generation=$4 AND g.revoked_at IS NULL`,
      [
        identity.userId,
        identity.oauthClientId,
        settings.resource,
        identity.oauthGrantId,
      ],
    );
    if (!result.rowCount)
      throw new AccountError(
        401,
        "This agent connection was disconnected. Sign in again from your agent.",
      );
    return String(result.rows[0].workspace_id);
  }
}

export function mcpOAuthRoutes(app: Express, oauth?: McpOAuth) {
  if (!oauth?.settings) return;
  const settings = oauth.settings;
  for (const path of [
    "/.well-known/oauth-protected-resource/mcp",
    "/.well-known/oauth-protected-resource",
  ])
    app.get(path, (_req, res) =>
      res.set("Access-Control-Allow-Origin", "*").json({
        resource: settings.resource,
        authorization_servers: [settings.issuer],
        scopes_supported: [...scopes],
        bearer_methods_supported: ["header"],
        resource_name: "Two Hands",
      }),
    );
  const router = express.Router();
  router.use(express.json({ limit: "4kb" }));
  const handle =
    (
      fn: (
        req: Request,
        res: Response,
        identity: VerifiedIdentity,
        token: string,
      ) => Promise<unknown>,
    ) =>
    async (req: Request, res: Response) => {
      try {
        if (!sameOriginWrite(req, res)) return;
        if (req.header("X-Octolab-Preview"))
          throw new AccountError(
            403,
            "Return to your own account to manage agent access.",
          );
        const identity = await oauth.accounts.identity(req);
        await fn(req, res, identity, req.header("authorization")!.slice(7));
      } catch (e) {
        res
          .status(
            e instanceof AccountError
              ? e.status
              : e instanceof z.ZodError
                ? 400
                : 503,
          )
          .json({
            error:
              e instanceof AccountError
                ? e.message
                : "Agent authorization is temporarily unavailable.",
          });
      }
    };
  router.get(
    "/requests/:id",
    handle(async (req, res, identity) =>
      res.json(await oauth.details(String(req.params.id), identity)),
    ),
  );
  router.post(
    "/requests/:id",
    handle(async (req, res, identity, token) => {
      const { allow } = z
        .object({ allow: z.boolean() })
        .strict()
        .parse(req.body);
      res.json(
        await oauth.decide(String(req.params.id), identity, token, allow),
      );
    }),
  );
  router.get(
    "/connections",
    handle(async (_req, res, identity) =>
      res.json({ connections: await oauth.list(identity) }),
    ),
  );
  router.post(
    "/connections/:id/revoke",
    handle(async (req, res, identity, token) =>
      res.json(await oauth.revoke(identity, String(req.params.id), token)),
    ),
  );
  app.use("/api/agent-auth", router);
}
