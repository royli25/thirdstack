/**
 * Remote MCP endpoint (Streamable HTTP) at `/mcp`.
 *
 * The tool surface is exactly `createObservationMcp`, the same factory the
 * stdio bridge uses, so tools and providers added to the registry appear here
 * without changes. Every tool operation is executed by the existing `/api`
 * routes through a private loopback listener, with the caller's credential
 * forwarded: authentication, key scopes, workspace isolation, spending policy
 * and receipts are the same code paths as every other client.
 *
 * Each `/mcp` request is also authenticated up front (initialize and
 * tools/list never reach `/api`), and a session is bound to the principal
 * that created it.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID, timingSafeEqual } from "node:crypto";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Readable } from "node:stream";
import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";
import { createObservationMcp } from "./mcp-server.js";
import {
  bridgeClientIdentity,
  createBridgeRequest,
  type BridgeClient,
} from "./mcp-bridge.js";
import { AccountError, type Accounts } from "./accounts.js";
import { ApiKeyError, type ApiKeyService } from "./api-keys.js";
import type { McpOAuth } from "./mcp-oauth.js";
import type { Store } from "./store.js";

export const MCP_PATH = "/mcp";

/** Who is calling; `id` binds sessions, `credential` is forwarded to `/api`. */
export interface McpPrincipal {
  readonly id: string;
  readonly credential: string;
}
export type McpAuthenticator = (req: Request) => Promise<McpPrincipal>;

export class McpAuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface McpHttpOptions {
  /** Close sessions idle for longer than this. */
  idleTimeoutMs?: number;
  /** Total concurrent sessions across all principals. */
  maxSessions?: number;
  /** Concurrent sessions per principal (one key or one account). */
  maxSessionsPerPrincipal?: number;
  /** Largest accepted JSON-RPC request body. */
  maxBodyBytes?: number;
}
const defaults: Required<McpHttpOptions> = {
  idleTimeoutMs: 30 * 60_000,
  maxSessions: 500,
  maxSessionsPerPrincipal: 16,
  // Matches the bridge's request bound with headroom for JSON-RPC framing.
  maxBodyBytes: 256 * 1024,
};

const loopbackHosts = ["127.0.0.1", "localhost", "[::1]", "::1"];
function bearer(req: Request) {
  const header = req.header("authorization");
  if (header === undefined) return "";
  const token = header.match(/^Bearer ([\x21-\x7e]{1,8192})$/)?.[1];
  if (!token) throw new McpAuthError(401, "Malformed Authorization header.");
  return token;
}
function sameSecret(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Mirrors the `/api` access rules for each storage mode. Keep in step with
 * `accountAccess` (PostgreSQL) and the local middleware in `app.ts` (SQLite).
 */
export function mcpAuthenticator(deps: {
  store: Store;
  apiKeys: ApiKeyService;
  accounts?: Accounts;
  oauth?: McpOAuth;
}): McpAuthenticator {
  const { store, apiKeys, accounts } = deps;
  const failure = (e: unknown): never => {
    if (e instanceof McpAuthError) throw e;
    if (e instanceof ApiKeyError || e instanceof AccountError)
      throw new McpAuthError(e.status, e.message);
    throw e;
  };
  return async (req) => {
    try {
      const credential = bearer(req);
      if (accounts) {
        if (!credential)
          throw new McpAuthError(401, "Sign in or supply a scoped API key.");
        if (credential.startsWith("oct_key_")) {
          const workspaceId = await accounts.keyAccountScope(credential);
          const key = await store.scope.run(workspaceId, () =>
            apiKeys.authenticate(credential),
          );
          return { id: `key:${key.id}`, credential };
        }
        let identity: Awaited<ReturnType<Accounts["identity"]>>;
        try {
          identity = await accounts.identity(req, true);
        } catch (error) {
          if (error instanceof AccountError && error.status === 401)
            throw new McpAuthError(
              401,
              "Invalid API key or agent session. Reconnect your agent or use a scoped key (oct_key_…) from API keys in your dashboard.",
            );
          throw error;
        }
        if (identity.oauthClientId) {
          if (!deps.oauth)
            throw new McpAuthError(401, "Agent sign-in is not enabled.");
          await deps.oauth.workspace(identity);
          return {
            id: `oauth:${identity.userId}:${identity.oauthClientId}`,
            credential,
          };
        }
        return { id: `account:${identity.userId}`, credential };
      }
      // Local SQLite mode: same host rule as `/api`.
      if (!config.token && !loopbackHosts.includes(req.hostname))
        throw new McpAuthError(
          403,
          "Unrecognized local host. Set API_TOKEN when using a public hostname.",
        );
      if (config.token && sameSecret(credential, config.token))
        return { id: "owner", credential };
      if (credential.startsWith("oct_key_")) {
        const key = await apiKeys.authenticate(credential);
        return { id: `key:${key.id}`, credential };
      }
      if (!config.token && !credential)
        return { id: "local-owner", credential: "" };
      throw new McpAuthError(
        401,
        config.token
          ? "Supply the server access token or a scoped API key."
          : "Invalid API key.",
      );
    } catch (e) {
      return failure(e);
    }
  };
}

/** Plain `node:http` to our own loopback listener: never routed via env proxies. */
function loopbackFetch(agent: http.Agent): typeof fetch {
  return ((input: string | URL | globalThis.Request, init: RequestInit = {}) =>
    new Promise<globalThis.Response>((resolve, reject) => {
      const url = new URL(String(input));
      const headers = new Headers(init.headers);
      const body = typeof init.body === "string" ? init.body : undefined;
      if (body !== undefined)
        headers.set("content-length", String(Buffer.byteLength(body)));
      const req = http.request(
        url,
        {
          agent,
          method: init.method ?? "GET",
          headers: Object.fromEntries(headers),
          signal: init.signal ?? undefined,
        },
        (res) => {
          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(res.headers))
            if (value !== undefined)
              responseHeaders.set(
                name,
                Array.isArray(value) ? value.join(", ") : value,
              );
          const status = res.statusCode ?? 502;
          const empty = [204, 205, 304].includes(status);
          if (empty) res.resume();
          resolve(
            new globalThis.Response(
              empty
                ? null
                : (Readable.toWeb(res) as ReadableStream<Uint8Array>),
              { status, headers: responseHeaders },
            ),
          );
        },
      );
      req.on("error", reject);
      req.end(body);
    })) as typeof fetch;
}

interface Session {
  readonly transport: StreamableHTTPServerTransport;
  readonly principalId: string;
  lastSeen: number;
  client?: BridgeClient;
}

function rpcError(
  res: Response,
  status: number,
  message: string,
  headers: Record<string, string> = {},
) {
  res
    .status(status)
    .set(headers)
    .json({
      jsonrpc: "2.0",
      error: { code: status === 404 ? -32001 : -32000, message },
      id: null,
    });
}

/**
 * Mounts `/mcp`. Must be registered before the global JSON parser and the
 * browser fallback. Returns a handle for shutdown and tests.
 */
export function mountMcpEndpoint(
  app: Express,
  authenticate: McpAuthenticator,
  options: McpHttpOptions = {},
  resourceMetadata?: string,
) {
  const limits = { ...defaults, ...options };
  const sessions = new Map<string, Session>();
  const context = new AsyncLocalStorage<{ credential: string }>();
  const agent = new http.Agent({ keepAlive: true });
  const internalFetch = loopbackFetch(agent);
  let internal: Promise<{ server: http.Server; baseUrl: string }> | undefined;
  let closed = false;

  // A private loopback listener serving this same app; started on first use.
  const internalBase = () =>
    (internal ??= new Promise((resolve, reject) => {
      const server = http.createServer(app);
      server.on("error", reject);
      server.listen(0, "127.0.0.1", () => {
        server.unref();
        const { port } = server.address() as AddressInfo;
        resolve({ server, baseUrl: `http://127.0.0.1:${port}/api` });
      });
    }));

  const createSession = (principal: McpPrincipal) => {
    let session: Session;
    const request = async (path: string, body?: unknown) => {
      const current = context.getStore();
      if (!current)
        throw new Error("Two Hands could not attribute this MCP operation.");
      const { baseUrl } = await internalBase();
      return createBridgeRequest(
        { baseUrl, https: false, credential: current.credential },
        () => session.client,
        { fetch: internalFetch, exposeServerErrors: true },
      )(path, body);
    };
    const server = createObservationMcp(request);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true,
      onsessioninitialized: (id) => {
        sessions.set(id, session);
      },
    });
    session = { transport, principalId: principal.id, lastSeen: Date.now() };
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
      void server.close().catch(() => {});
    };
    server.server.oninitialized = () => {
      const version = server.server.getClientVersion();
      session.client = bridgeClientIdentity(
        version?.name,
        version?.version,
        "streamable-http",
      );
      void request("/observations/connection", session.client).catch(() => {});
    };
    return { server, transport, session };
  };

  const sweep = () => {
    const cutoff = Date.now() - limits.idleTimeoutMs;
    for (const s of [...sessions.values()])
      if (s.lastSeen < cutoff) void s.transport.close().catch(() => {});
  };
  // Started with the first session so apps that never serve MCP hold no timer.
  let sweeper: NodeJS.Timeout | undefined;
  const startSweeper = () => {
    if (sweeper) return;
    sweeper = setInterval(sweep, Math.min(60_000, limits.idleTimeoutMs));
    sweeper.unref();
  };

  const parseJson = express.json({
    limit: limits.maxBodyBytes,
    type: "application/json",
  });
  const guard = async (req: Request, res: Response, next: NextFunction) => {
    if (closed) return rpcError(res, 503, "Server is shutting down.");
    // Required by the MCP transport spec to defeat DNS rebinding.
    const origin = req.header("origin");
    if (origin) {
      let allowed = false;
      try {
        allowed = new URL(origin).host === req.headers.host;
      } catch {
        allowed = false;
      }
      if (!allowed)
        return rpcError(res, 403, "Cross-origin requests are not allowed.");
    }
    try {
      res.locals.mcpPrincipal = await authenticate(req);
    } catch (e) {
      if (!(e instanceof McpAuthError)) return next(e);
      const challenge: Record<string, string> =
        e.status === 401
          ? {
              "WWW-Authenticate": `Bearer realm="two-hands-mcp"${resourceMetadata ? `, resource_metadata="${resourceMetadata}"` : ""}${req.header("authorization") ? ', error="invalid_token"' : ""}`,
            }
          : {};
      return rpcError(res, e.status, e.message, challenge);
    }
    next();
  };

  const handle = async (req: Request, res: Response) => {
    const principal: McpPrincipal = res.locals.mcpPrincipal;
    const sessionId = req.header("mcp-session-id");
    const run = (transport: StreamableHTTPServerTransport) =>
      context.run({ credential: principal.credential }, () =>
        transport.handleRequest(req, res, req.body),
      );
    if (sessionId) {
      const session = sessions.get(sessionId);
      // Another principal's session is indistinguishable from a missing one.
      if (!session || session.principalId !== principal.id)
        return rpcError(
          res,
          404,
          "Session not found. Initialize a new session.",
        );
      session.lastSeen = Date.now();
      return run(session.transport);
    }
    if (req.method !== "POST" || !isInitializeRequest(req.body))
      return rpcError(
        res,
        400,
        "No session. Send an initialize request without an Mcp-Session-Id header.",
      );
    sweep();
    const owned = [...sessions.values()].filter(
      (s) => s.principalId === principal.id,
    );
    if (owned.length >= limits.maxSessionsPerPrincipal) {
      // Reclaim this principal's least recently used session, never another's.
      const oldest = owned.sort((a, b) => a.lastSeen - b.lastSeen)[0];
      await oldest.transport.close().catch(() => {});
    }
    if (sessions.size >= limits.maxSessions)
      return rpcError(
        res,
        503,
        "Too many open MCP sessions. Try again shortly.",
        {
          "Retry-After": "30",
        },
      );
    startSweeper();
    const { server, transport } = createSession(principal);
    await server.connect(transport);
    await run(transport);
    // An initialize that failed validation never registers a session.
    if (!transport.sessionId || !sessions.has(transport.sessionId))
      await transport.close().catch(() => {});
  };

  const methodNotAllowed = (_req: Request, res: Response) =>
    rpcError(
      res,
      405,
      "This endpoint offers no server-initiated stream. Use POST, or DELETE to end a session.",
      { Allow: "POST, DELETE" },
    );

  app.post(MCP_PATH, guard, parseJson, handle);
  app.delete(MCP_PATH, guard, handle);
  app.all(MCP_PATH, methodNotAllowed);
  // Body-parser failures on this route stay JSON-RPC shaped.
  app.use(
    MCP_PATH,
    (err: any, _req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) return next(err);
      if (err?.type === "entity.too.large")
        return rpcError(res, 413, "Request too large.");
      if (err instanceof SyntaxError || err?.type === "entity.parse.failed")
        return res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32700, message: "Parse error." },
          id: null,
        });
      return rpcError(res, 500, "Internal server error.");
    },
  );

  return {
    /** Open session count, for health and tests. */
    get size() {
      return sessions.size;
    },
    principalOf(sessionId: string) {
      return sessions.get(sessionId)?.principalId;
    },
    /** Graceful shutdown, step 1: refuse new requests; in-flight calls finish. */
    refuse() {
      closed = true;
    },
    /** Step 2, after draining: end all sessions and the loopback listener. */
    async close() {
      closed = true;
      clearInterval(sweeper);
      await Promise.all(
        [...sessions.values()].map((s) => s.transport.close().catch(() => {})),
      );
      agent.destroy();
      const started = await internal?.catch(() => undefined);
      if (started)
        await new Promise<void>((resolve) => {
          started.server.close(() => resolve());
          started.server.closeAllConnections();
        });
    },
  };
}
export type McpEndpoint = ReturnType<typeof mountMcpEndpoint>;
