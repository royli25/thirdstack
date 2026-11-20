import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { config } from "../server/config";
import { createObservationMcp } from "../server/mcp-server";
import {
  McpAuthError,
  mountMcpEndpoint,
  type McpEndpoint,
} from "../server/mcp-http";
import { API_KEY_SCOPES, API_KEY_TOOLS } from "../server/api-key-types";
import { providerToolNames } from "../server/provider-catalog";

const OWNER = "owner-fixture-token-0000000000001";
const original = {
  token: config.token,
  keys: { ...config.keys },
  prices: { ...config.prices },
  rpm: config.rpm,
};
const intent = {
  title: "Remote MCP fixture",
  objective: "Return a supported answer from a public page.",
  criteria: [{ text: "Includes a source", weight: 1 }],
  model: "Protocol fixture, no model",
  host: "Remote MCP test client",
};
const json = { "Content-Type": "application/json" };
const accept = { Accept: "application/json, text/event-stream" };
const initialize = (id = 1) => ({
  jsonrpc: "2.0",
  id,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "raw-http-fixture", version: "1.0.0" },
  },
});
const parse = (r: any) => JSON.parse(r.content[0].text);

let store: Store, obs: Observatory, app: ReturnType<typeof createApp>;
let server: Server, base: string;
const clients: Client[] = [];
const scrape = vi.fn(async () => ({
  httpStatus: 200,
  pageStatus: 200,
  text: "Fixture example page",
}));

async function listen(a: express.Express) {
  const s = a.listen(0, "127.0.0.1");
  await new Promise((r) => s.once("listening", r));
  return s;
}
async function connect(
  credential?: string,
  name = "remote-test-client",
): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
    requestInit: credential
      ? { headers: { Authorization: `Bearer ${credential}` } }
      : undefined,
  });
  const client = new Client({ name, version: "2.0.0" });
  await client.connect(transport);
  clients.push(client);
  return client;
}
async function issueKey(extra: Record<string, unknown> = {}) {
  const issued = await obs.db.apiKeys.create({
    name: "Remote MCP fixture",
    requestKey: randomUUID(),
    scopes: [...API_KEY_SCOPES],
    allowedTools: [...API_KEY_TOOLS],
    limitUsd: "0.05",
    expiresInDays: 30,
    ...extra,
  });
  if (!issued.secret) throw new Error("A new key must return its secret once.");
  return { ...issued, secret: issued.secret };
}
async function rawInit(headers: Record<string, string> = {}) {
  const r = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { ...json, ...accept, ...headers },
    body: JSON.stringify(initialize()),
  });
  return { status: r.status, sessionId: r.headers.get("mcp-session-id"), r };
}
const endpoint = () => app.locals.mcp as McpEndpoint;

beforeEach(async () => {
  config.token = "";
  Object.assign(config.keys, {
    exa: "TEST_KEY",
    tavily: "TEST_KEY",
    firecrawl: "TEST_KEY",
  });
  Object.assign(config.prices, { exa: 7000, tavily: 8000, firecrawl: 1000 });
  config.rpm = 1000;
  scrape.mockClear();
  store = new Store(":memory:");
  obs = new Observatory(store, {
    search: async () => ({ httpStatus: 200, sources: [] }),
    scrape,
  });
  app = createApp(store, undefined, obs);
  server = await listen(app);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  for (const c of clients.splice(0)) await c.close().catch(() => {});
  await endpoint().close();
  await new Promise((r) => {
    server.close(r);
    server.closeAllConnections();
  });
  await store.close();
  config.token = original.token;
  Object.assign(config.keys, original.keys);
  Object.assign(config.prices, original.prices);
  config.rpm = original.rpm;
});

describe("remote MCP tool surface", () => {
  it("serves exactly the same tools and schemas as the stdio server, so new providers appear automatically", async () => {
    const remote = await connect();
    const local = createObservationMcp(async () => ({}));
    const [a, b] = InMemoryTransport.createLinkedPair();
    const inMemory = new Client({ name: "parity", version: "1" });
    await local.connect(b);
    await inMemory.connect(a);
    const strip = (tools: any[]) =>
      tools
        .map(({ name, description, inputSchema, annotations }) => ({
          name,
          description,
          inputSchema,
          annotations,
        }))
        .sort((x, y) => x.name.localeCompare(y.name));
    const remoteTools = (await remote.listTools()).tools;
    expect(strip(remoteTools)).toEqual(
      strip((await inMemory.listTools()).tools),
    );
    for (const name of providerToolNames)
      expect(remoteTools.map((t) => t.name)).toContain(name);
    expect(remote.getInstructions()).toContain("Two Hands");
    await inMemory.close();
    await local.close();
  });

  it("runs intent, discovery, a provider call and an outcome end to end, attributed to the remote client", async () => {
    const client = await connect(undefined, "Claude remote fixture");
    const s = parse(
      await client.callTool({ name: "record_intent", arguments: intent }),
    );
    expect(s.status).toBe("active");
    const offered = parse(
      await client.callTool({
        name: "discover_tools",
        arguments: { sessionId: s.id, need: "Read a known page" },
      }),
    );
    expect(offered.tools).toHaveLength(providerToolNames.length);
    const c = parse(
      await client.callTool({
        name: "firecrawl_extract",
        arguments: {
          sessionId: s.id,
          url: "https://example.com",
          requestKey: "remote-extract-1",
          statedReason: "A known URL only needs extraction.",
        },
      }),
    );
    expect(c).toMatchObject({ tool: "firecrawl_extract", status: "succeeded" });
    expect(scrape).toHaveBeenCalledTimes(1);
    const outcome = parse(
      await client.callTool({
        name: "submit_outcome",
        arguments: {
          sessionId: s.id,
          requestKey: "remote-outcome-1",
          text: "The page is the Example Domain.",
          evidenceCallIds: [c.id],
        },
      }),
    );
    expect(outcome).toMatchObject({ sessionId: s.id, outputVersion: 1 });
    const detail = parse(
      await client.callTool({
        name: "get_session",
        arguments: { sessionId: s.id },
      }),
    );
    expect(detail.calls).toHaveLength(1);
    const observed = (await obs.db.events(s.id)).find(
      (e) => e.type === "client_observed",
    );
    expect(observed?.data).toMatchObject({
      clientName: "Claude remote fixture",
      clientVersion: "2.0.0",
      transport: "streamable-http",
    });
    const conn = await fetch(`${base}/api/observations/connection`).then((r) =>
      r.json(),
    );
    expect(
      conn.clients.find((x: any) => x.clientName === "Claude remote fixture"),
    ).toMatchObject({ transport: "streamable-http" });
  });

  it("replays a retried provider call by requestKey without a second provider request", async () => {
    const client = await connect();
    const s = parse(
      await client.callTool({ name: "record_intent", arguments: intent }),
    );
    const args = {
      sessionId: s.id,
      url: "https://example.com",
      requestKey: "same-key",
      statedReason: "A known URL only needs extraction.",
    };
    const first = parse(
      await client.callTool({ name: "firecrawl_extract", arguments: args }),
    );
    const second = parse(
      await client.callTool({ name: "firecrawl_extract", arguments: args }),
    );
    expect(second.id).toBe(first.id);
    expect(scrape).toHaveBeenCalledTimes(1);
  });

  it("returns the server's own error text to the agent instead of a generic failure", async () => {
    const client = await connect();
    const r: any = await client.callTool({
      name: "get_session",
      arguments: { sessionId: randomUUID() },
    });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/HTTP 404\.$/);
    expect(r.content[0].text).not.toMatch(/rejected the bridge operation/);
  });

  it("keeps the browser app, health and API routes working alongside /mcp", async () => {
    expect((await fetch(`${base}/healthz`)).status).toBe(200);
    expect((await fetch(`${base}/api/public/catalog`)).status).toBe(200);
    expect((await fetch(`${base}/api/does-not-exist`)).status).toBe(404);
  });
});

describe("remote MCP access control", () => {
  beforeEach(() => {
    config.token = OWNER;
  });

  it("challenges a missing credential with 401 and WWW-Authenticate", async () => {
    const r = await rawInit();
    expect(r.status).toBe(401);
    expect(r.r.headers.get("www-authenticate")).toBe(
      'Bearer realm="two-hands-mcp"',
    );
    expect((await r.r.json()).error.message).toMatch(/access token/);
  });

  it("rejects a wrong credential as invalid_token and a malformed header as 401", async () => {
    const wrong = await rawInit({ Authorization: "Bearer not-the-token" });
    expect(wrong.status).toBe(401);
    expect(wrong.r.headers.get("www-authenticate")).toContain(
      'error="invalid_token"',
    );
    expect((await rawInit({ Authorization: "Basic abc" })).status).toBe(401);
    expect(
      (await rawInit({ Authorization: `Bearer ${"x".repeat(9000)}` })).status,
    ).toBe(401);
  });

  it("accepts the owner token and a scoped API key", async () => {
    expect((await (await connect(OWNER)).listTools()).tools.length).toBe(
      providerToolNames.length + 8,
    );
    const { secret } = await issueKey();
    const client = await connect(secret);
    const s = parse(
      await client.callTool({ name: "record_intent", arguments: intent }),
    );
    expect(s.status).toBe("active");
  });

  it("enforces key scopes on tool calls and surfaces the reason", async () => {
    const { secret } = await issueKey({ scopes: ["tools:discover"] });
    const client = await connect(secret);
    const r: any = await client.callTool({
      name: "record_intent",
      arguments: intent,
    });
    expect(r.isError).toBe(true);
    expect(r.content[0].text).toMatch(/does not permit this operation.*403/);
  });

  it("stops a revoked key on its next request, even mid-session", async () => {
    const { secret, key } = await issueKey();
    const client = await connect(secret);
    await obs.db.apiKeys.revoke(key.id, { revision: 0 });
    await expect(client.listTools()).rejects.toThrow();
    expect((await rawInit({ Authorization: `Bearer ${secret}` })).status).toBe(
      401,
    );
  });

  it("binds a session to its creator: another credential cannot use it", async () => {
    const { secret } = await issueKey();
    const { sessionId } = await rawInit({ Authorization: `Bearer ${secret}` });
    expect(sessionId).toBeTruthy();
    expect(endpoint().principalOf(sessionId!)).toMatch(/^key:/);
    const hijack = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        ...json,
        ...accept,
        Authorization: `Bearer ${OWNER}`,
        "mcp-session-id": sessionId!,
        "mcp-protocol-version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    expect(hijack.status).toBe(404);
  });
});

describe("remote MCP local-mode and protocol safety", () => {
  it("refuses a non-loopback Host when no API_TOKEN is set, so a tunnel cannot inherit owner access", async () => {
    const r = await new Promise<number>((resolve, reject) => {
      const req = require("node:http").request(
        `${base}/mcp`,
        {
          method: "POST",
          headers: { ...json, ...accept, Host: "public.example.com" },
        },
        (res: any) => {
          res.resume();
          resolve(res.statusCode);
        },
      );
      req.on("error", reject);
      req.end(JSON.stringify(initialize()));
    });
    expect(r).toBe(403);
  });

  it("rejects cross-origin requests (DNS rebinding) and allows same-origin", async () => {
    expect((await rawInit({ Origin: "https://evil.example" })).status).toBe(
      403,
    );
    expect((await rawInit({ Origin: "null" })).status).toBe(403);
    expect((await rawInit({ Origin: base })).status).toBe(200);
  });

  it("answers GET with 405, requires initialize first, and ends sessions on DELETE", async () => {
    const get = await fetch(`${base}/mcp`, { headers: accept });
    expect(get.status).toBe(405);
    expect(get.headers.get("allow")).toBe("POST, DELETE");
    const early = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...json, ...accept },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(early.status).toBe(400);
    const { sessionId } = await rawInit();
    expect(endpoint().size).toBe(1);
    const del = await fetch(`${base}/mcp`, {
      method: "DELETE",
      headers: {
        "mcp-session-id": sessionId!,
        "mcp-protocol-version": "2025-06-18",
      },
    });
    expect(del.status).toBe(200);
    expect(endpoint().size).toBe(0);
    const after = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: {
        ...json,
        ...accept,
        "mcp-session-id": sessionId!,
        "mcp-protocol-version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    expect(after.status).toBe(404);
  });

  it("returns JSON-RPC errors for malformed and oversized bodies", async () => {
    const bad = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...json, ...accept },
      body: "{not json",
    });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.code).toBe(-32700);
    const big = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...json, ...accept },
      body: JSON.stringify({ pad: "x".repeat(300 * 1024) }),
    });
    expect(big.status).toBe(413);
    expect((await big.json()).jsonrpc).toBe("2.0");
  });

  it("does not leak sessions when initialize is invalid", async () => {
    const r = await fetch(`${base}/mcp`, {
      method: "POST",
      headers: { ...json, Accept: "application/json" },
      body: JSON.stringify(initialize()),
    });
    expect(r.status).toBe(406);
    expect(endpoint().size).toBe(0);
  });

  it("refuses new requests once shutdown begins", async () => {
    endpoint().refuse();
    expect((await rawInit()).status).toBe(503);
  });
});

describe("remote MCP session limits", () => {
  async function isolated(options: Parameters<typeof mountMcpEndpoint>[2]) {
    const a = express();
    let who = "alice";
    const ep = mountMcpEndpoint(
      a,
      async (req) => {
        if (req.header("x-deny")) throw new McpAuthError(401, "denied");
        return { id: who, credential: "" };
      },
      options,
    );
    const s = await listen(a);
    const url = `http://127.0.0.1:${(s.address() as AddressInfo).port}/mcp`;
    const init = async () =>
      (
        await fetch(url, {
          method: "POST",
          headers: { ...json, ...accept },
          body: JSON.stringify(initialize()),
        })
      ).status;
    return {
      ep,
      init,
      as: (id: string) => (who = id),
      async close() {
        await ep.close();
        await new Promise((r) => {
          s.close(r);
          s.closeAllConnections();
        });
      },
    };
  }

  it("caps sessions per principal by reclaiming that principal's oldest", async () => {
    const t = await isolated({ maxSessionsPerPrincipal: 2 });
    for (let i = 0; i < 4; i++) expect(await t.init()).toBe(200);
    expect(t.ep.size).toBe(2);
    t.as("bob");
    expect(await t.init()).toBe(200);
    expect(t.ep.size).toBe(3);
    await t.close();
  });

  it("caps total sessions with 503 and Retry-After", async () => {
    const t = await isolated({ maxSessions: 2 });
    t.as("a");
    expect(await t.init()).toBe(200);
    t.as("b");
    expect(await t.init()).toBe(200);
    t.as("c");
    expect(await t.init()).toBe(503);
    await t.close();
  });

  it("closes idle sessions", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const t = await isolated({ idleTimeoutMs: 1000 });
      expect(await t.init()).toBe(200);
      expect(t.ep.size).toBe(1);
      vi.setSystemTime(Date.now() + 5000);
      t.as("someone-else");
      expect(await t.init()).toBe(200);
      expect(t.ep.size).toBe(1);
      await t.close();
    } finally {
      vi.useRealTimers();
    }
  });
});
