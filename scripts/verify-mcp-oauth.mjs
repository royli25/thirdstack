// Live managed-Auth verification with an ephemeral development-only account.
// No provider tool is called. Tokens and passwords remain in this process.
import { execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { developmentEnvironment } from "./development-env.mjs";
import { productionProject } from "./environment-projects.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  auth,
  UnauthorizedError,
  refreshAuthorization,
} from "@modelcontextprotocol/sdk/client/auth.js";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const env = await developmentEnvironment(
  fileURLToPath(new URL("../", import.meta.url)),
);
if (
  env.DEVELOPMENT_SUPABASE_PROJECT_REF === productionProject ||
  env.MCP_OAUTH_ENABLED !== "true"
)
  throw new Error("Enable OAuth in the dedicated development project first.");
const resource = new URL("/mcp", env.PUBLIC_APP_URL);
let managementToken = process.env.SUPABASE_ACCESS_TOKEN;
if (!managementToken && process.platform === "darwin") {
  managementToken = execFileSync(
    "security",
    ["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
  ).trim();
  if (managementToken.startsWith("go-keyring-base64:"))
    managementToken = Buffer.from(
      managementToken.slice(18),
      "base64",
    ).toString();
}
if (!managementToken?.startsWith("sbp_"))
  throw new Error(
    "Use the existing Supabase CLI sign-in or privately provide SUPABASE_ACCESS_TOKEN.",
  );
const keysResponse = await fetch(
  `https://api.supabase.com/v1/projects/${env.DEVELOPMENT_SUPABASE_PROJECT_REF}/api-keys`,
  {
    headers: { Authorization: `Bearer ${managementToken}` },
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  },
);
if (!keysResponse.ok)
  throw new Error(
    `Development verification credentials unavailable (${keysResponse.status}).`,
  );
const key = (await keysResponse.json()).find(
  (k) => k.name === "service_role",
)?.api_key;
if (!key)
  throw new Error("The development Auth admin credential was not available.");
const admin = createClient(env.SUPABASE_URL, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
const browser = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
const client = new Client({
  name: "development-oauth-verification",
  version: "1",
});
const address = new URL(env.DATABASE_URL);
address.searchParams.delete("sslmode");
const db = new pg.Client({
  connectionString: address.href,
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 10000,
});
let userId, clientInfo, tokens, verifier, authorizationUrl, transport;
const state = randomBytes(24).toString("base64url");
const provider = {
  redirectUrl: "http://127.0.0.1:55442/callback",
  clientMetadata: {
    client_name: "Two Hands development verification",
    redirect_uris: ["http://127.0.0.1:55442/callback"],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    scope: "openid email offline_access",
  },
  state: () => state,
  clientInformation: () => clientInfo,
  saveClientInformation: (value) => {
    clientInfo = value;
  },
  tokens: () => tokens,
  saveTokens: (value) => {
    tokens = value;
  },
  saveCodeVerifier: (value) => {
    verifier = value;
  },
  codeVerifier: () => verifier,
  redirectToAuthorization: (url) => {
    authorizationUrl = url;
  },
};
const report = { kind: "live-development-oauth", providerCalls: 0, checks: [] };
function check(condition, name) {
  if (!condition) throw new Error(`OAuth verification failed: ${name}`);
  report.checks.push(name);
}
try {
  await db.connect();
  const password = randomBytes(36).toString("base64url"),
    email = `oauth-check-${randomUUID()}@example.invalid`;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (created.error)
    throw new Error(
      "Could not create the temporary development verification account.",
    );
  userId = created.data.user.id;
  const login = await browser.auth.signInWithPassword({ email, password });
  if (login.error)
    throw new Error("Could not sign in the temporary development account.");
  const browserToken = login.data.session.access_token;
  const accountRequest = async (path, body) => {
    const response = await fetch(
      new URL(`/api/agent-auth/${path}`, env.PUBLIC_APP_URL),
      {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Authorization: `Bearer ${browserToken}`,
          Origin: env.PUBLIC_APP_URL,
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    const value = await response.json();
    if (!response.ok)
      throw new Error(
        `Development consent failed (${response.status}): ${value.error || "request failed"}`,
      );
    return value;
  };
  const typed = await fetch(
    new URL("/api/auth/account-type", env.PUBLIC_APP_URL),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${signed.data.session.access_token}`,
        "Content-Type": "application/json",
        Origin: env.PUBLIC_APP_URL,
      },
      body: JSON.stringify({ accountType: "user" }),
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!typed.ok)
    throw new Error("Could not choose the temporary user account type.");
  // Account-type history is immutable, including after Auth account deletion.
  report.retainedAccountTypeRecord = true;
  transport = new StreamableHTTPClientTransport(resource, {
    authProvider: provider,
  });
  try {
    await client.connect(transport);
  } catch (e) {
    if (!(e instanceof UnauthorizedError)) throw e;
  }
  check(
    !!authorizationUrl,
    "SDK discovers OAuth and registers a public client",
  );
  const redirect = await fetch(authorizationUrl, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  const consentUrl = new URL(
    redirect.headers.get("location") || "https://invalid.example",
  );
  check(
    consentUrl.origin === env.PUBLIC_APP_URL &&
      consentUrl.pathname === "/oauth/consent",
    "Managed Auth redirects to the development consent page",
  );
  const id = consentUrl.searchParams.get("authorization_id");
  const details = await accountRequest(`requests/${id}`);
  check(
    details.clientId === clientInfo.client_id &&
      details.resource === resource.href,
    "Consent binds the registered client and exact resource",
  );
  const decision = await accountRequest(`requests/${id}`, { allow: true });
  const callback = new URL(decision.redirectUrl);
  check(
    callback.searchParams.get("state") === state &&
      !!callback.searchParams.get("code"),
    "Approval returns a state-bound authorization code",
  );
  await transport.finishAuth(callback.searchParams.get("code"));
  const claims = JSON.parse(
    Buffer.from(tokens.access_token.split(".")[1], "base64url").toString(),
  );
  check(
    claims.aud === resource.href && !!claims.two_hands_grant,
    "Token hook binds the MCP audience and grant",
  );
  transport = new StreamableHTTPClientTransport(resource, {
    authProvider: provider,
  });
  await client.connect(transport);
  check(
    (await client.listTools()).tools.length > 0,
    "OAuth-authenticated MCP initialization and tools/list succeed",
  );
  check(
    (await auth(provider, { serverUrl: resource })) === "AUTHORIZED",
    "Managed refresh-token exchange succeeds",
  );
  check(
    (await client.listTools()).tools.length > 0,
    "Refreshed tokens retain MCP access",
  );
  const revoked = await accountRequest(
    `connections/${clientInfo.client_id}/revoke`,
    {},
  );
  check(
    revoked.revoked && revoked.authRevoked,
    "Disconnect revokes the local grant and managed Auth sessions",
  );
  const denied = await fetch(resource, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "revocation-check", version: "1" },
      },
    }),
  });
  check(
    denied.status === 401,
    "Previously issued access token is rejected after disconnect",
  );
  let refreshDenied = false;
  try {
    await refreshAuthorization(tokens.issuer, {
      clientInformation: clientInfo,
      refreshToken: tokens.refresh_token,
      resource,
    });
  } catch {
    refreshDenied = true;
  }
  check(
    refreshDenied,
    "Previously issued refresh token is rejected after disconnect",
  );
} finally {
  await client.close().catch(() => {});
  if (userId) {
    const workspaces = (
      await db.query(
        "SELECT workspace_id FROM octolab.workspace_memberships WHERE user_id=$1",
        [userId],
      )
    ).rows.map((r) => r.workspace_id);
    await db.query("BEGIN");
    try {
      for (const table of [
        "mcp_grant_sessions",
        "mcp_grant_events",
        "mcp_grants",
      ])
        await db.query(`DELETE FROM octolab.${table} WHERE user_id=$1`, [
          userId,
        ]);
      for (const workspace of workspaces) {
        const owners = await db.query(
          "SELECT user_id FROM octolab.workspace_memberships WHERE workspace_id=$1",
          [workspace],
        );
        if (owners.rows.some((r) => r.user_id !== userId))
          throw new Error("Refusing to clean up a shared development account.");
        const counts = await db.query(
          "SELECT count(*) FROM octolab.observation_sessions WHERE workspace_id=$1",
          [workspace],
        );
        if (Number(counts.rows[0].count) !== 0)
          throw new Error(
            "Refusing to remove an account with research activity.",
          );
        for (const table of [
          "observation_clients",
          "workspace_settings",
          "workspace_policy_events",
          "account_audit_events",
          "workspace_memberships",
        ])
          await db.query(`DELETE FROM octolab.${table} WHERE workspace_id=$1`, [
            workspace,
          ]);
        await db.query("DELETE FROM octolab.workspaces WHERE id=$1", [
          workspace,
        ]);
      }
      await db.query("COMMIT");
    } catch (e) {
      await db.query("ROLLBACK");
      throw e;
    }
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error)
      throw new Error("Temporary Auth account cleanup failed.");
    report.cleanedTemporaryAccount = true;
  }
  if (clientInfo?.client_id) {
    const deleted = await admin.auth.admin.oauth.deleteClient(
      clientInfo.client_id,
    );
    if (deleted.error)
      throw new Error("Temporary OAuth client cleanup failed.");
  }
  await db.end();
  await browser.auth.signOut({ scope: "local" }).catch(() => {});
  tokens = undefined;
}
console.log(JSON.stringify(report, null, 2));
