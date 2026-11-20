import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { createApp } from "../server/app";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { config } from "../server/config";
import type { McpEndpoint } from "../server/mcp-http";
import { API_KEY_SCOPES, API_KEY_TOOLS } from "../server/api-key-types";
import {
  connectorEndpoint,
  isPublicAddress,
  publicLookup,
} from "../server/connector-network";
import { ConnectorSecrets } from "../server/connectors";
import {
  startTestMcpServer,
  type TestMcpServer,
} from "./fixtures/test-mcp-server";

const SECRET = "ab".repeat(32);
const TOKEN = "fixture-company-token-7f3a";
const original = {
  token: config.token,
  connectors: { ...config.connectors },
};
const intent = {
  title: "Connector fixture",
  objective: "Plan a weekend using the forecast.",
  criteria: [{ text: "Uses a forecast", weight: 1 }],
  model: "Protocol fixture, no model",
  host: "Connector test client",
};

let store: Store, obs: Observatory, app: ReturnType<typeof createApp>;
let server: Server, base: string, fixture: TestMcpServer;
const clients: Client[] = [];

async function api(
  method: string,
  path: string,
  body?: unknown,
  credential?: string,
) {
  const r = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(credential ? { Authorization: `Bearer ${credential}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  return { status: r.status, body: text ? JSON.parse(text) : null, text };
}
const register = (extra: Record<string, unknown> = {}) =>
  api("POST", "/connectors", {
    requestKey: randomUUID(),
    slug: "weatherco",
    name: "Fixture Weather Co",
    description: "Deterministic weather and currency tools for testing.",
    endpoint: fixture.url,
    token: TOKEN,
    declaredPriceUsd: 0.002,
    ...extra,
  });
async function approve(
  id: string,
  names: string[],
  options: { estimateUsd?: number; decision?: string } = {},
) {
  const { body: detail } = await api("GET", `/connectors/${id}`);
  const c = detail.connector;
  return await api("POST", `/connectors/${id}/review`, {
    revision: c.revision,
    decision: options.decision ?? "approve",
    note: "Checked in test.",
    tools: names.map((name) => ({
      name,
      schemaHash: c.tools.find((t: any) => t.name === name).schemaHash,
      decision: "approve",
      ...(options.estimateUsd !== undefined
        ? { estimateUsd: options.estimateUsd }
        : {}),
    })),
  });
}
async function session(credential?: string) {
  const r = await api(
    "POST",
    "/observations/agent-sessions",
    intent,
    credential,
  );
  expect(r.status).toBe(201);
  return r.body.id as string;
}
const call = (
  sessionId: string,
  tool: string,
  args: Record<string, unknown>,
  requestKey: string = randomUUID(),
  credential?: string,
) =>
  api(
    "POST",
    `/observations/${sessionId}/connector-call`,
    {
      requestKey,
      tool,
      arguments: args,
      statedReason: "The user asked about the weather this weekend.",
    },
    credential,
  );
async function issueKey(extra: Record<string, unknown> = {}) {
  const issued = await obs.db.apiKeys.create({
    name: "Connector fixture",
    requestKey: randomUUID(),
    scopes: [...API_KEY_SCOPES],
    allowedTools: [...API_KEY_TOOLS],
    limitUsd: "0.05",
    expiresInDays: 30,
    ...extra,
  });
  return issued.secret!;
}
async function mcp(credential?: string) {
  const transport = new StreamableHTTPClientTransport(new URL(`${base}/mcp`), {
    requestInit: credential
      ? { headers: { Authorization: `Bearer ${credential}` } }
      : undefined,
  });
  const client = new Client({ name: "connector-agent", version: "1.0.0" });
  await client.connect(transport);
  clients.push(client);
  return client;
}
const parse = (r: any) => JSON.parse(r.content[0].text);

beforeEach(async () => {
  config.token = "";
  Object.assign(config.connectors, {
    secretKey: SECRET,
    allowLoopback: true,
    timeoutMs: 5000,
    rpm: 1000,
  });
  fixture = await startTestMcpServer({ token: TOKEN });
  store = new Store(":memory:");
  obs = new Observatory(store, {
    search: async () => ({ httpStatus: 200, sources: [] }),
    scrape: async () => ({ httpStatus: 200, pageStatus: 200, text: "" }),
  });
  app = createApp(store, undefined, obs);
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterEach(async () => {
  for (const c of clients.splice(0)) await c.close().catch(() => {});
  await (app.locals.mcp as McpEndpoint).close();
  await new Promise((r) => {
    server.close(r);
    server.closeAllConnections();
  });
  await fixture.close();
  await store.close();
  config.token = original.token;
  Object.assign(config.connectors, original.connectors);
});

describe("connector network policy", () => {
  it("accepts only globally routable addresses", () => {
    for (const ok of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])
      expect(isPublicAddress(ok), ok).toBe(true);
    for (const bad of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "224.0.0.1",
      "::1",
      "::",
      "fc00::1",
      "fe80::1",
      "::ffff:127.0.0.1",
      "::ffff:10.0.0.1",
      "not-an-ip",
    ])
      expect(isPublicAddress(bad), bad).toBe(false);
  });

  it("requires a public HTTPS hostname unless loopback testing is enabled", () => {
    expect(connectorEndpoint("https://mcp.weather.example.org/mcp")).toBe(
      "https://mcp.weather.example.org/mcp",
    );
    for (const bad of [
      "http://mcp.weather.example.org/mcp",
      "https://127.0.0.1/mcp",
      "https://[::1]/mcp",
      "https://localhost/mcp",
      "https://intranet/mcp",
      "https://mcp.corp/mcp",
      "https://mcp.weather.example.org:8443/mcp",
      "https://user:pass@mcp.weather.example.org/mcp",
      "ftp://mcp.weather.example.org/",
      "not a url",
    ])
      expect(() => connectorEndpoint(bad), bad).toThrow();
    expect(() => connectorEndpoint("http://127.0.0.1:4100/mcp")).toThrow();
    expect(
      connectorEndpoint("http://127.0.0.1:4100/mcp", { allowLoopback: true }),
    ).toBe("http://127.0.0.1:4100/mcp");
    // Loopback permission never extends to other private hosts.
    expect(() =>
      connectorEndpoint("http://10.0.0.5/mcp", { allowLoopback: true }),
    ).toThrow();
  });

  it("refuses a hostname that resolves to a private address at connect time", async () => {
    const error = await new Promise<Error | null>((resolve) =>
      publicLookup("localhost", {}, (e) => resolve(e)),
    );
    expect(error?.message).toMatch(/non-public address/);
  });

  it("encrypts tokens bound to the connector id", () => {
    const secrets = new ConnectorSecrets(SECRET);
    const sealed = secrets.seal("connector-a", TOKEN);
    expect(JSON.stringify(sealed)).not.toContain(TOKEN);
    expect(secrets.open("connector-a", sealed)).toBe(TOKEN);
    expect(() => secrets.open("connector-b", sealed)).toThrow();
    expect(() => new ConnectorSecrets("too-short")).toThrow(/32 bytes/);
  });
});

describe("registering and reviewing a connector", () => {
  it("reads the tool list into a pending snapshot and never exposes the token", async () => {
    const r = await register();
    expect(r.status).toBe(201);
    expect(r.body).toMatchObject({
      slug: "weatherco",
      status: "pending",
      hasCredential: true,
      snapshotVersion: 1,
    });
    expect(r.body.credential).toBeUndefined();
    expect(r.body.tools.map((t: any) => t.exposedName)).toContain(
      "weatherco__get_forecast",
    );
    expect(r.body.tools.every((t: any) => t.status === "pending")).toBe(true);
    expect(r.body.tools[0].estimateMicros).toBe(2000);
    const detail = await api("GET", `/connectors/${r.body.id}`);
    const list = await api("GET", "/connectors");
    const raw = await store.db
      .prepare("SELECT body FROM connectors WHERE id=?")
      .get(r.body.id);
    for (const text of [detail.text, list.text, String(raw?.body)])
      expect(text).not.toContain(TOKEN);
    expect(JSON.parse(String(raw?.body)).credential.data).toBeTruthy();
    expect(detail.body.events[0]).toMatchObject({
      type: "connector_registered",
      actor: "local_operator",
    });
  });

  it("replays a repeated request key and rejects conflicts and bad endpoints", async () => {
    const key = randomUUID();
    const first = await register({ requestKey: key });
    const again = await register({ requestKey: key });
    expect(again.status).toBe(201);
    expect(again.body.id).toBe(first.body.id);
    expect((await register()).status).toBe(409); // same slug
    expect((await register({ slug: "exa" })).status).toBe(409); // reserved
    expect((await register({ slug: "Bad Slug" })).status).toBe(400);
    const wrongToken = await register({
      slug: "weathertwo",
      token: "not-the-right-token",
    });
    expect(wrongToken.status).toBe(422);
    expect(wrongToken.body.error).toMatch(/rejected Two Hands' credentials/);
    const unreachable = await register({
      slug: "weatherthree",
      endpoint: "http://127.0.0.1:1/mcp",
    });
    expect(unreachable.status).toBe(422);
    const publicIp = await register({
      slug: "weatherfour",
      endpoint: "https://10.0.0.8/mcp",
    });
    expect(publicIp.status).toBe(400);
    expect(publicIp.body.error).toMatch(/public HTTPS/);
  });

  it("refuses to store a token when no encryption key is configured", async () => {
    await new Promise((r) => {
      server.close(r);
      server.closeAllConnections();
    });
    await (app.locals.mcp as McpEndpoint).close();
    config.connectors.secretKey = "";
    obs.connectors = undefined;
    app = createApp(store, undefined, obs);
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const r = await register();
    expect(r.status).toBe(503);
    expect(r.body.error).toMatch(/CONNECTOR_SECRET_KEY/);
    expect((await api("GET", "/connectors")).body.tokenStorage).toBe(false);
  });

  it("requires the reviewer to approve the exact schema and current revision", async () => {
    const { body: c } = await register();
    const forecast = c.tools.find((t: any) => t.name === "get_forecast");
    const stale = await api("POST", `/connectors/${c.id}/review`, {
      revision: c.revision,
      decision: "approve",
      tools: [
        {
          name: "get_forecast",
          schemaHash: "0".repeat(64),
          decision: "approve",
        },
      ],
    });
    expect(stale.status).toBe(409);
    const noTools = await api("POST", `/connectors/${c.id}/review`, {
      revision: c.revision,
      decision: "approve",
    });
    expect(noTools.status).toBe(409);
    expect(noTools.body.error).toMatch(/at least one tool/);
    const oldRevision = await api("POST", `/connectors/${c.id}/review`, {
      revision: c.revision + 5,
      decision: "approve",
      tools: [
        {
          name: "get_forecast",
          schemaHash: forecast.schemaHash,
          decision: "approve",
        },
      ],
    });
    expect(oldRevision.status).toBe(409);
    const ok = await approve(c.id, ["get_forecast"], { estimateUsd: 0.003 });
    expect(ok.status).toBe(200);
    expect(ok.body.status).toBe("approved");
    const approved = ok.body.tools.find((t: any) => t.name === "get_forecast");
    expect(approved).toMatchObject({
      status: "approved",
      approvedHash: forecast.schemaHash,
      estimateMicros: 3000,
    });
  });
});

describe("agents calling an approved connector tool", () => {
  it("runs the whole flow over the remote MCP endpoint with evidence recorded", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast", "convert_currency"]);
    const client = await mcp();
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["list_connector_tools", "call_connector_tool"]),
    );
    const s = parse(
      await client.callTool({ name: "record_intent", arguments: intent }),
    );
    const listed = parse(
      await client.callTool({ name: "list_connector_tools", arguments: {} }),
    );
    expect(listed.tools.map((t: any) => t.tool).sort()).toEqual([
      "weatherco__convert_currency",
      "weatherco__get_forecast",
    ]);
    expect(listed.tools[0]).toMatchObject({
      company: "Fixture Weather Co",
      descriptionSource: "company_supplied",
      estimatedMicros: 2000,
    });
    const result = parse(
      await client.callTool({
        name: "call_connector_tool",
        arguments: {
          sessionId: s.id,
          requestKey: "forecast-1",
          tool: "weatherco__get_forecast",
          arguments: { city: "Lisbon", days: 2 },
          statedReason: "The user is deciding on a Lisbon weekend.",
          reasonTheme: "other",
        },
      }),
    );
    expect(result).toMatchObject({
      status: "succeeded",
      tool: "weatherco__get_forecast",
      provider: "connector:weatherco",
      estimateMicros: 2000,
      connector: { slug: "weatherco", tool: "get_forecast" },
      result: {
        source: "company_connector",
        untrusted: true,
        text: "Day 1: Sunny, 24°C\nDay 2: Sunny, 25°C",
        isError: false,
      },
    });
    expect(fixture.calls).toEqual([
      { tool: "get_forecast", arguments: { city: "Lisbon", days: 2 } },
    ]);
    const outcome = parse(
      await client.callTool({
        name: "submit_outcome",
        arguments: {
          sessionId: s.id,
          requestKey: "outcome-1",
          text: "Lisbon will be sunny both days.",
          evidenceCallIds: [result.id],
        },
      }),
    );
    expect(outcome.outputVersion).toBe(1);
    const detail = (await api("GET", `/observations/${s.id}`)).body;
    expect(detail.spentMicros).toBe(2000);
    expect(detail.reservedMicros).toBe(0);
    expect(detail.integrity).toBe(true);
    const types = detail.events.map((e: any) => e.type);
    expect(types).toEqual(
      expect.arrayContaining([
        "selection_explanation",
        "tool_called",
        "tool_result",
        "outcome_submitted",
      ]),
    );
    const explanation = detail.events.find(
      (e: any) => e.type === "selection_explanation",
    );
    expect(explanation).toMatchObject({
      provenance: "agent_reported",
      data: {
        tool: "weatherco__get_forecast",
        text: "The user is deciding on a Lisbon weekend.",
      },
    });
    // Evidence can be read back without a new remote call.
    const evidence = parse(
      await client.callTool({
        name: "get_evidence",
        arguments: { sessionId: s.id, callId: result.id },
      }),
    );
    expect(evidence.result.text).toContain("Sunny");
    expect(fixture.calls).toHaveLength(1);
  });

  it("keeps tools hidden and uncallable until approved", async () => {
    const { body: c } = await register();
    expect(
      (await api("GET", "/observations/connector-tools")).body.tools,
    ).toEqual([]);
    const s = await session();
    const r = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
    });
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/not approved/);
    await approve(c.id, ["convert_currency"]);
    const other = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
    });
    expect(other.status).toBe(409);
    expect((await call(s, "nobody__get_forecast", {})).status).toBe(404);
    expect(fixture.calls).toEqual([]);
  });

  it("validates arguments against the approved schema before any remote call or spend", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast"]);
    const s = await session();
    for (const args of [
      { city: "Lisbon" },
      { city: "Lisbon", days: 9 },
      { city: "Lisbon", days: "two" },
    ]) {
      const r = await call(s, "weatherco__get_forecast", args);
      expect(r.status, JSON.stringify(args)).toBe(400);
      expect(r.body.error).toMatch(/input schema/);
    }
    expect(fixture.calls).toEqual([]);
    expect((await api("GET", `/observations/${s}`)).body.spentMicros).toBe(0);
  });

  it("replays a repeated request key without a second remote call", async () => {
    const { body: c } = await register();
    await approve(c.id, ["convert_currency"]);
    const s = await session();
    const args = { amount: 100, from: "USD", to: "EUR" };
    const first = await call(s, "weatherco__convert_currency", args, "fx-1");
    const second = await call(s, "weatherco__convert_currency", args, "fx-1");
    expect(first.body.result.text).toBe("100 USD = 92.00 EUR");
    expect(first.body.result.structuredContent).toEqual({
      value: 92,
      currency: "EUR",
    });
    expect(second.body).toMatchObject({ id: first.body.id, replayed: true });
    expect(fixture.calls).toHaveLength(1);
    const changed = await call(
      s,
      "weatherco__convert_currency",
      { ...args, amount: 5 },
      "fx-1",
    );
    expect(changed.status).toBe(409);
  });

  it("records tool errors, timeouts, truncation and hostile output distinctly", async () => {
    const { body: c } = await register();
    await approve(c.id, [
      "always_fails",
      "slow_reply",
      "large_reply",
      "hostile_reply",
    ]);
    const s = await session();
    const failed = await call(s, "weatherco__always_fails", {});
    expect(failed.body).toMatchObject({
      status: "failed",
      error: "The connector reported a tool error.",
      result: { isError: true, text: "Upstream quota exceeded." },
    });
    config.connectors.timeoutMs = 300;
    const slow = await call(s, "weatherco__slow_reply", { ms: 2000 });
    expect(slow.body).toMatchObject({
      status: "failed",
      error: "The connector did not respond in time.",
    });
    config.connectors.timeoutMs = 5000;
    const large = await call(s, "weatherco__large_reply", { chars: 100_000 });
    expect(large.body.status).toBe("succeeded");
    expect(large.body.result.truncated).toBe(true);
    expect(large.body.result.text).toHaveLength(60_000);
    const tooLarge = await call(s, "weatherco__large_reply", {
      chars: 1_500_000,
    });
    expect(tooLarge.body).toMatchObject({
      status: "failed",
      error: "The connector response exceeded the size limit.",
    });
    const hostile = await call(s, "weatherco__hostile_reply", {});
    expect(hostile.body.result).toMatchObject({
      untrusted: true,
      omittedContent: { image: 1 },
    });
    expect(hostile.body.result.meaning).toMatch(/not instructions/);
    // Failed calls are charged their estimate, as provider calls are.
    const detail = (await api("GET", `/observations/${s}`)).body;
    expect(detail.spentMicros).toBe(5 * 2000);
    expect(detail.reservedMicros).toBe(0);
  });

  it("sends a changed schema back to review and drops removed tools", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast", "convert_currency"]);
    const s = await session();
    fixture.setVariant("v2");
    const refreshed = await api("POST", `/connectors/${c.id}/refresh`, {});
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.changes.changed).toEqual(["get_forecast"]);
    const blocked = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
      units: "metric",
    });
    expect(blocked.status).toBe(409);
    expect(
      (
        await call(s, "weatherco__convert_currency", {
          amount: 1,
          from: "GBP",
          to: "USD",
        })
      ).body.status,
    ).toBe("succeeded");
    await approve(c.id, ["get_forecast"]);
    const now = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
      units: "metric",
    });
    expect(now.body.status).toBe("succeeded");
    fixture.only(["get_forecast"]);
    const pruned = await api("POST", `/connectors/${c.id}/refresh`, {});
    expect(pruned.body.changes.removed).toEqual(
      expect.arrayContaining(["convert_currency", "always_fails"]),
    );
    const listed = (await api("GET", "/observations/connector-tools")).body;
    expect(listed.tools.map((t: any) => t.tool)).toEqual([
      "weatherco__get_forecast",
    ]);
    expect(
      (
        await call(s, "weatherco__convert_currency", {
          amount: 1,
          from: "GBP",
          to: "USD",
        })
      ).status,
    ).toBe(404);
  });

  it("suspends instantly, and an endpoint change needs a new review", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast"]);
    const s = await session();
    const detail = (await api("GET", `/connectors/${c.id}`)).body.connector;
    const suspended = await api("POST", `/connectors/${c.id}/review`, {
      revision: detail.revision,
      decision: "suspend",
      note: "Investigating reports.",
    });
    expect(suspended.body.status).toBe("suspended");
    const r = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
    });
    expect(r.status).toBe(409);
    expect(r.body.error).toMatch(/suspended/);
    expect(
      (await api("GET", "/observations/connector-tools")).body.tools,
    ).toEqual([]);
    const reinstated = await api("POST", `/connectors/${c.id}/review`, {
      revision: suspended.body.revision,
      decision: "reinstate",
    });
    expect(reinstated.body.status).toBe("approved");
    expect(
      (await call(s, "weatherco__get_forecast", { city: "Oslo", days: 1 })).body
        .status,
    ).toBe("succeeded");
    const moved = await api("PATCH", `/connectors/${c.id}`, {
      revision: reinstated.body.revision,
      endpoint: fixture.url.replace("/mcp", "/mcp/"),
    });
    expect(moved.body.status).toBe("pending");
    // The dashboard uses the POST alias; a stale revision is refused.
    const described = await api("POST", `/connectors/${c.id}/update`, {
      revision: moved.body.revision,
      description: "Updated weather and currency tools for testing.",
    });
    expect(described.body).toMatchObject({
      description: "Updated weather and currency tools for testing.",
      revision: moved.body.revision + 1,
    });
    expect(
      (
        await api("POST", `/connectors/${c.id}/update`, {
          revision: moved.body.revision,
          description: "A stale edit that should be refused by revision.",
        })
      ).status,
    ).toBe(409);
    expect(
      (await call(s, "weatherco__get_forecast", { city: "Oslo", days: 2 }))
        .status,
    ).toBe(409);
  });

  it("applies the session budget and the per-connector rate limit", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast"], { estimateUsd: 0.5 });
    const s = await session();
    const over = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 1,
    });
    expect(over.status).toBe(409);
    expect(over.body.error).toMatch(/budget/);
    await approve(c.id, ["get_forecast"], { estimateUsd: 0.001 });
    config.connectors.rpm = 1;
    expect(
      (await call(s, "weatherco__get_forecast", { city: "Oslo", days: 1 })).body
        .status,
    ).toBe("succeeded");
    const limited = await call(s, "weatherco__get_forecast", {
      city: "Oslo",
      days: 2,
    });
    expect(limited.status).toBe(429);
    expect(fixture.calls).toHaveLength(1);
  });
});

describe("API keys and connectors", () => {
  it("lets an unrestricted key call connector tools within its limit", async () => {
    config.token = "owner-fixture-token-0000000000001";
    const { body: c } = await register().then(async () => {
      // Management now requires the owner token.
      return await api(
        "GET",
        "/connectors",
        undefined,
        "owner-fixture-token-0000000000001",
      ).then((r) => ({ body: r.body.connectors[0] }));
    });
    expect(c).toBeUndefined(); // registration without the owner token was refused
    const created = await api(
      "POST",
      "/connectors",
      {
        requestKey: randomUUID(),
        slug: "weatherco",
        name: "Fixture Weather Co",
        description: "Deterministic weather and currency tools for testing.",
        endpoint: fixture.url,
        token: TOKEN,
        declaredPriceUsd: 0.002,
      },
      config.token,
    );
    expect(created.status).toBe(201);
    const detail = (
      await api(
        "GET",
        `/connectors/${created.body.id}`,
        undefined,
        config.token,
      )
    ).body.connector;
    await api(
      "POST",
      `/connectors/${created.body.id}/review`,
      {
        revision: detail.revision,
        decision: "approve",
        tools: [
          {
            name: "get_forecast",
            schemaHash: detail.tools.find((t: any) => t.name === "get_forecast")
              .schemaHash,
            decision: "approve",
          },
        ],
      },
      config.token,
    );
    const key = await issueKey();
    // Keys cannot manage connectors.
    expect((await api("GET", "/connectors", undefined, key)).status).toBe(403);
    const listed = await api(
      "GET",
      "/observations/connector-tools",
      undefined,
      key,
    );
    expect(listed.status).toBe(200);
    expect(listed.body.tools).toHaveLength(1);
    const s = await session(key);
    const ok = await call(
      s,
      "weatherco__get_forecast",
      { city: "Denver", days: 1 },
      undefined,
      key,
    );
    expect(ok.body).toMatchObject({ status: "succeeded" });
    expect(ok.body.apiKeyId).toBeTruthy();
    const restricted = await issueKey({ allowedTools: ["exa_search"] });
    const s2 = await session(restricted);
    const denied = await call(
      s2,
      "weatherco__get_forecast",
      { city: "Denver", days: 1 },
      undefined,
      restricted,
    );
    expect(denied.status).toBe(403);
    expect(denied.body.error).toMatch(/every tool/);
    expect(fixture.calls).toHaveLength(1);
  });
});

describe("discovering connector tools", () => {
  const discover = (
    sessionId: string,
    body: Record<string, unknown>,
    credential?: string,
  ) => api("POST", `/observations/${sessionId}/discover`, body, credential);

  it("matches approved tools to the stated need and records the offer", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast", "convert_currency"]);
    const s = await session();
    const r = await discover(s, {
      need: "What is the weather forecast for Lisbon this weekend?",
    });
    expect(r.status).toBe(200);
    expect(r.body.connectorTools.map((t: any) => t.tool)).toEqual([
      "weatherco__get_forecast",
    ]);
    const offer = r.body.connectorTools[0];
    expect(offer).toMatchObject({
      status: "eligible",
      company: "Fixture Weather Co",
      descriptionSource: "company_supplied",
      estimatedMicros: 2000,
      relevance: { basis: "connector-lexical-v1" },
    });
    expect(offer.relevance.matchedTerms).toEqual(
      expect.arrayContaining(["forecast", "weather"]),
    );
    expect(offer.inputSchema.properties).toHaveProperty("city");
    expect(r.body.candidateConnectorTools).toEqual(["weatherco__get_forecast"]);
    // Built-in search and extraction still need operations to be priced.
    expect(r.body.missingInputs[0]).toMatch(/search and extraction/);
    const events = (await api("GET", `/observations/${s}`)).body.events;
    const offered = events.find((e: any) => e.type === "tools_offered");
    expect(offered.data.connectorTools[0].tool).toBe("weatherco__get_forecast");
    expect(offered.data.connectorMatching.approvedTools).toBe(2);
    const currency = await discover(s, {
      need: "Convert 120 euros into US dollars",
      context: { requirements: "Use a currency conversion rate." },
    });
    expect(currency.body.connectorTools[0].tool).toBe(
      "weatherco__convert_currency",
    );
    expect(fixture.calls).toEqual([]);
  });

  it("never offers unapproved, suspended or unrelated tools", async () => {
    const { body: c } = await register();
    const s = await session();
    expect(
      (await discover(s, { need: "weather forecast" })).body.connectorTools,
    ).toEqual([]);
    const approved = await approve(c.id, ["get_forecast"]);
    expect(
      (await discover(s, { need: "Summarize the history of jazz" })).body
        .connectorTools,
    ).toEqual([]);
    await api("POST", `/connectors/${c.id}/review`, {
      revision: approved.body.revision,
      decision: "suspend",
    });
    expect(
      (await discover(s, { need: "weather forecast" })).body.connectorTools,
    ).toEqual([]);
  });

  it("marks offers over budget or blocked by the API key, and reports call history", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast"], { estimateUsd: 0.5 });
    const s = await session();
    const expensive = (await discover(s, { need: "weather forecast" })).body;
    expect(expensive.connectorTools[0].status).toBe("over_budget");
    expect(expensive.candidateConnectorTools).toEqual([]);
    await approve(c.id, ["get_forecast"], { estimateUsd: 0.001 });
    for (const city of ["Oslo", "Lisbon"])
      await call(s, "weatherco__get_forecast", { city, days: 1 });
    await call(s, "weatherco__get_forecast", { city: "Atlantis", days: 1 });
    const offer = (await discover(s, { need: "weather forecast" })).body
      .connectorTools[0];
    expect(offer.status).toBe("eligible");
    expect(offer.reputation.organic).toMatchObject({
      completedCalls: 3,
      succeeded: 2,
      failed: 1,
      successRate: null, // fewer than five samples
      minimumSamples: 5,
    });
    // Local mode requires an owner token before scoped keys are accepted.
    config.token = "owner-fixture-token-0000000000001";
    const restricted = await issueKey({ allowedTools: ["exa_search"] });
    const s2 = await session(restricted);
    const blocked = (
      await discover(s2, { need: "weather forecast" }, restricted)
    ).body;
    expect(blocked.connectorTools[0].status).toBe("disabled");
    expect(blocked.connectorTools[0].reason).toMatch(/API key/);
  });

  it("is returned by discover_tools over MCP, and route_call leaves connectors alone", async () => {
    const { body: c } = await register();
    await approve(c.id, ["get_forecast"]);
    const client = await mcp();
    const tools = (await client.listTools()).tools;
    expect(tools.find((t) => t.name === "discover_tools")?.description).toMatch(
      /connectorTools/,
    );
    expect(tools.find((t) => t.name === "route_call")?.description).toMatch(
      /never chooses a company connector tool/,
    );
    const s = parse(
      await client.callTool({ name: "record_intent", arguments: intent }),
    );
    const offered = parse(
      await client.callTool({
        name: "discover_tools",
        arguments: { sessionId: s.id, need: "daily forecast for Denver" },
      }),
    );
    expect(offered.connectorTools[0].tool).toBe("weatherco__get_forecast");
  });
});
