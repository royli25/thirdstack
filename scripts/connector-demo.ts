/**
 * End-to-end connector demo against a running local Two Hands server.
 *
 *   1. npm run dev                      (with CONNECTOR_ALLOW_LOOPBACK=true and
 *                                        CONNECTOR_SECRET_KEY in .env)
 *   2. TEST_MCP_TOKEN=demo-company-token-123 npm run connector:test-server
 *   3. npm run connector:demo
 *
 * Registers the fixture company's MCP server as the operator, approves two of
 * its tools, then acts as an agent over the remote /mcp endpoint: records an
 * intent, lists connector tools, calls one, and submits an outcome citing it.
 * Local SQLite mode only (operator routes). No paid provider is called.
 */
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const server = process.env.TWO_HANDS_URL ?? "http://127.0.0.1:3001";
const endpoint = process.env.TEST_MCP_URL ?? "http://127.0.0.1:4100/mcp";
const token = process.env.TEST_MCP_TOKEN ?? "demo-company-token-123";
const owner = process.env.API_TOKEN;
const slug = process.env.DEMO_SLUG ?? `demo${Date.now().toString(36)}`;

async function api(method: string, path: string, body?: unknown) {
  const r = await fetch(`${server}/api${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(owner ? { Authorization: `Bearer ${owner}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${json.error}`);
  return json;
}
const step = (label: string, detail?: unknown) =>
  console.log(`\n▸ ${label}`, detail === undefined ? "" : detail);

const connector = await api("POST", "/connectors", {
  requestKey: randomUUID(),
  slug,
  name: "Fixture Weather Co",
  description: "Deterministic weather and currency tools for local testing.",
  endpoint,
  token,
  declaredPriceUsd: 0.002,
});
step(`Registered connector "${slug}" (${connector.status})`, {
  tools: connector.tools.map((t: any) => `${t.exposedName} [${t.status}]`),
  tokenReturned: "credential" in connector,
});

const pending = await api("GET", "/observations/connector-tools");
step("Agent-visible connector tools before review", pending.tools.length);

const reviewed = await api("POST", `/connectors/${connector.id}/review`, {
  revision: connector.revision,
  decision: "approve",
  note: "Demo review.",
  tools: ["get_forecast", "convert_currency"].map((name) => ({
    name,
    schemaHash: connector.tools.find((t: any) => t.name === name).schemaHash,
    decision: "approve",
    estimateUsd: 0.002,
  })),
});
step(`Reviewed: connector ${reviewed.status}`, {
  tools: reviewed.tools.map((t: any) => `${t.name} [${t.status}]`),
});

const client = new Client({ name: "connector-demo-agent", version: "1.0.0" });
await client.connect(
  new StreamableHTTPClientTransport(new URL(`${server}/mcp`), {
    requestInit: owner
      ? { headers: { Authorization: `Bearer ${owner}` } }
      : undefined,
  }),
);
const parse = (r: any) => {
  if (r.isError) throw new Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};
const session = parse(
  await client.callTool({
    name: "record_intent",
    arguments: {
      title: "Weekend in Lisbon",
      objective: "Decide whether this weekend suits a Lisbon trip.",
      criteria: [{ text: "Uses a real forecast", weight: 1 }],
      model: "Demo script, no model",
      host: "connector-demo",
    },
  }),
);
step(`Agent recorded intent (session ${session.id}, ${session.status})`);

const listed = parse(
  await client.callTool({ name: "list_connector_tools", arguments: {} }),
);
step(
  "Agent listed connector tools",
  listed.tools.map((t: any) => `${t.tool} ($${t.estimatedMicros / 1e6})`),
);

const forecast = parse(
  await client.callTool({
    name: "call_connector_tool",
    arguments: {
      sessionId: session.id,
      requestKey: "demo-forecast",
      tool: `${slug}__get_forecast`,
      arguments: { city: "Lisbon", days: 3 },
      statedReason: "The user's decision depends on the weekend forecast.",
    },
  }),
);
step(
  `Agent called ${forecast.tool}: ${forecast.status} in ${forecast.latencyMs} ms`,
  {
    text: forecast.result.text,
    untrusted: forecast.result.untrusted,
  },
);

const outcome = parse(
  await client.callTool({
    name: "submit_outcome",
    arguments: {
      sessionId: session.id,
      requestKey: "demo-outcome",
      text: "Yes: sunny for the next two days, cloudier on the third.",
      evidenceCallIds: [forecast.id],
    },
  }),
);
step(`Agent submitted outcome v${outcome.outputVersion}`);

const detail = await api("GET", `/observations/${session.id}`);
step("Recorded evidence", {
  spentUsd: detail.spentMicros / 1e6,
  integrity: detail.integrity,
  events: detail.events.map((e: any) => `${e.type} (${e.provenance})`),
});
await client.close();
console.log(
  `\nOpen http://127.0.0.1:5175/#sessions to inspect session ${session.id}.`,
);
