import { providerToolNames } from "../server/provider-catalog.js";
import { afterEach, beforeEach, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { Server } from "node:http";
import request from "supertest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Store } from "../server/store";
import { Observatory } from "../server/observation";
import { createApp } from "../server/app";
import { config } from "../server/config";
let directory: string,
  store: Store,
  obs: Observatory,
  http: Server,
  client: Client,
  transport: StdioClientTransport,
  app: ReturnType<typeof createApp>,
  url: string;
let scrapeImpl: () => Promise<{
  httpStatus: number;
  pageStatus: number;
  text: string;
}>;
const original = { token: config.token, keys: { ...config.keys } };
function payload(result: any) {
  return JSON.parse(result.content[0].text);
}
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "apilayer-stdio-"));
  config.token = "stdio-test-token";
  Object.assign(config.keys, {
    exa: "fixture",
    tavily: "fixture",
    firecrawl: "fixture",
  });
  store = new Store(join(directory, "workspace.sqlite"));
  scrapeImpl = async () => ({
    httpStatus: 200,
    pageStatus: 200,
    text: "Synthetic public evidence",
  });
  obs = new Observatory(store, {
    search: async () => ({ httpStatus: 200, sources: [] }),
    scrape: () => scrapeImpl(),
  });
  app = createApp(store, undefined, obs);
  http = await new Promise<Server>((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  const address = http.address();
  if (!address || typeof address === "string")
    throw new Error("Missing test listener");
  url = `http://127.0.0.1:${address.port}/api`;
});
afterEach(async () => {
  await client?.close();
  await transport?.close();
  if (http.listening)
    await new Promise<void>((resolve, reject) =>
      http.close((e) => (e ? reject(e) : resolve())),
    );
  await store.close();
  await rm(directory, { recursive: true, force: true });
  config.token = original.token;
  Object.assign(config.keys, original.keys);
});
async function connect(base = url, token = "stdio-test-token", scopedKey = "") {
  transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve("server/mcp-stdio.ts")],
    cwd: process.cwd(),
    env: { APILAYER_URL: base, API_TOKEN: token, APILAYER_API_KEY: scopedKey },
    stderr: "pipe",
  });
  client = new Client({ name: "Codex intégration fixture", version: "test-1" });
  await client.connect(transport, { timeout: 5000 });
}
it("bridges stdio to authenticated HTTP and records the client alongside cached evidence", async () => {
  await connect();
  // Five core tools, route_call, two connector tools, and one tool per provider.
  expect((await client.listTools()).tools).toHaveLength(
    8 + providerToolNames.length,
  );
  const s = payload(
    await client.callTool({
      name: "record_intent",
      arguments: {
        title: "Process boundary test",
        objective: "Return a supported source summary.",
        criteria: [{ text: "Includes evidence", weight: 1 }],
        model: "Synthetic fixture",
        host: "Protocol test",
      },
    }),
  );
  expect(s.status).toBe("active");
  const call = payload(
    await client.callTool({
      name: "firecrawl_extract",
      arguments: {
        sessionId: s.id,
        url: "https://example.com",
        requestKey: "extract",
        statedReason: "Read the supplied page.",
      },
    }),
  );
  const cached = payload(
    await client.callTool({
      name: "get_evidence",
      arguments: { sessionId: s.id, callId: call.id },
    }),
  );
  expect(cached.cached).toBe(true);
  expect(cached.result.text).toBe("Synthetic public evidence");
  expect((await obs.db.get(s.id))?.spentMicros).toBe(1000);
  const submitted = payload(
    await client.callTool({
      name: "submit_outcome",
      arguments: {
        sessionId: s.id,
        requestKey: "output-1",
        text: "Synthetic output.",
        evidenceCallIds: [call.id],
      },
    }),
  );
  expect(submitted).toMatchObject({
    sessionId: s.id,
    outputVersion: 1,
    evaluationStatus: "Awaiting workspace review",
  });
  expect(submitted.objective).toBeUndefined();
  await client.callTool({
    name: "submit_outcome",
    arguments: {
      sessionId: s.id,
      requestKey: "output-2",
      text: "Revised synthetic output.",
      evidenceCallIds: [call.id],
    },
  });
  const replay = payload(
    await client.callTool({
      name: "submit_outcome",
      arguments: {
        sessionId: s.id,
        requestKey: "output-1",
        text: "Synthetic output.",
        evidenceCallIds: [call.id],
      },
    }),
  );
  expect(replay.outcomeId).toBe(submitted.outcomeId);
  expect(replay.outputVersion).toBe(1);
  const state = payload(
    await client.callTool({
      name: "get_session",
      arguments: { sessionId: s.id },
    }),
  );
  expect(state.outcomes).toHaveLength(1);
  expect(state.previousOutputs).toHaveLength(1);
  const events = (await obs.db.events(s.id)).filter(
    (e) => e.type === "client_observed",
  );
  expect(events).toHaveLength(1);
  expect(events[0].data.clientName).toBe("Codex intégration fixture");
  expect((await obs.db.detail(s.id))?.integrity).toBe(true);
  const connections = (
    await request(app)
      .get("/api/observations/connection")
      .set("Authorization", "Bearer stdio-test-token")
  ).body;
  expect(connections.clients).toHaveLength(1);
  expect(connections.liveStatus).toContain("not a live heartbeat");
});
it("returns an auth error through the protocol without leaking the server token", async () => {
  await connect(url, "incorrect-token");
  const result = await client.callTool({
    name: "get_session",
    arguments: { sessionId: "00000000-0000-4000-8000-000000000000" },
  });
  expect(result.isError).toBe(true);
  expect(JSON.stringify(result)).not.toContain("stdio-test-token");
  expect(await obs.db.list()).toHaveLength(0);
});
it("requires an explicit scoped key for an HTTPS bridge destination before sending requests", async () => {
  await expect(connect("https://example.com/api")).rejects.toThrow();
});
it("keeps independently observed Claude and Codex client connections", async () => {
  for (const clientName of ["Claude fixture", "Codex fixture"])
    await request(app)
      .post("/api/observations/connection")
      .set("Authorization", "Bearer stdio-test-token")
      .send({ clientName, clientVersion: "1" })
      .expect(200);
  const response = await request(app)
    .get("/api/observations/connection")
    .set("Authorization", "Bearer stdio-test-token");
  expect(response.body.clients.map((c: any) => c.clientName).sort()).toEqual([
    "Claude fixture",
    "Codex fixture",
  ]);
});
it("explains an unavailable HTTP service and preserves uncertainty about submitted work", async () => {
  await new Promise<void>((resolve, reject) =>
    http.close((e) => (e ? reject(e) : resolve())),
  );
  await connect();
  const result = await client.callTool({
    name: "get_session",
    arguments: { sessionId: "00000000-0000-4000-8000-000000000000" },
  });
  expect(result.isError).toBe(true);
  expect(JSON.stringify(result)).toContain("Keep npm start running");
  expect(JSON.stringify(result)).toContain("reuse the same request key");
  expect(JSON.stringify(result)).not.toContain("stdio-test-token");
});
it("deduplicates concurrent operations from two independent MCP hosts", async () => {
  await connect();
  const peerTransport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", resolve("server/mcp-stdio.ts")],
    env: { APILAYER_URL: url, API_TOKEN: "stdio-test-token" },
    stderr: "pipe",
  });
  const peer = new Client({
    name: "Claude concurrent fixture",
    version: "test-1",
  });
  let release!: () => void, started!: () => void;
  const gate = new Promise<void>((r) => (release = r)),
    entered = new Promise<void>((r) => (started = r));
  let executions = 0;
  scrapeImpl = async () => {
    executions++;
    started();
    await gate;
    return {
      httpStatus: 200,
      pageStatus: 200,
      text: "One synthetic execution shared across clients",
    };
  };
  try {
    await peer.connect(peerTransport, { timeout: 5000 });
    const s = payload(
      await client.callTool({
        name: "record_intent",
        arguments: {
          title: "Concurrent host fixture",
          objective: "Preserve one operation across two client retries.",
          criteria: [{ text: "No duplicate execution", weight: 1 }],
        },
      }),
    );
    expect(s.status).toBe("active");
    const args = {
      sessionId: s.id,
      url: "https://example.com",
      requestKey: "shared-operation",
      statedReason: "Read the same source once",
    };
    const pending = client.callTool({
      name: "firecrawl_extract",
      arguments: args,
    });
    await entered;
    const replay = payload(
      await peer.callTool({ name: "firecrawl_extract", arguments: args }),
    );
    expect(replay.status).toBe("running");
    expect(executions).toBe(1);
    release();
    const first = payload(await pending);
    expect(first.id).toBe(replay.id);
    expect(first.status).toBe("succeeded");
    const final = {
      sessionId: s.id,
      requestKey: "shared-output",
      text: "One synthetic delivered output.",
      evidenceCallIds: [first.id],
    };
    const outputs = await Promise.all([
      client.callTool({ name: "submit_outcome", arguments: final }),
      peer.callTool({ name: "submit_outcome", arguments: final }),
    ]);
    expect(payload(outputs[0]).outcomeId).toBe(payload(outputs[1]).outcomeId);
    expect(await obs.require(s.id)).toMatchObject({
      spentMicros: 1000,
      reservedMicros: 0,
    });
    expect((await obs.require(s.id)).outcomes).toHaveLength(1);
    expect(await obs.db.calls(s.id)).toHaveLength(1);
    expect(
      (await obs.db.events(s.id)).filter((e) => e.type === "client_observed"),
    ).toHaveLength(2);
    expect((await obs.db.detail(s.id))?.integrity).toBe(true);
  } finally {
    release();
    await peer.close();
    await peerTransport.close();
  }
});
it("uses a scoped bridge key ahead of the owner token and enforces its lifetime cap and revocation", async () => {
  config.token = "owner-stdio-fixture-token-00000001";
  const issued = await obs.db.apiKeys.create({
    name: "Scoped stdio fixture",
    requestKey: crypto.randomUUID(),
    scopes: [
      "tools:discover",
      "research:read",
      "research:write",
      "tools:execute",
    ],
    allowedTools: ["firecrawl_extract"],
    limitUsd: "0.001",
  });
  let invoked = 0;
  scrapeImpl = async () => {
    invoked++;
    return {
      httpStatus: 200,
      pageStatus: 200,
      text: "Scoped fixture evidence",
    };
  };
  await connect(url, "incorrect-owner-token", issued.secret!);
  const session = payload(
    await client.callTool({
      name: "record_intent",
      arguments: {
        title: "Scoped bridge",
        objective: "Read a synthetic fixture page",
        criteria: [{ text: "Supported evidence", weight: 1 }],
      },
    }),
  );
  expect(session.status).toBe("active");
  const args = {
    sessionId: session.id,
    url: "https://example.com",
    requestKey: "scoped-first",
    statedReason: "Read fixture page",
  };
  const first = payload(
    await client.callTool({ name: "firecrawl_extract", arguments: args }),
  );
  expect(first.status).toBe("succeeded");
  expect(first.apiKeyId).toBe(issued.key.id);
  const blocked = await client.callTool({
    name: "firecrawl_extract",
    arguments: { ...args, requestKey: "scoped-second" },
  });
  expect(blocked.isError).toBe(true);
  expect(invoked).toBe(1);
  await obs.db.apiKeys.revoke(issued.key.id, { revision: 0 });
  expect(
    (
      await client.callTool({
        name: "get_session",
        arguments: { sessionId: session.id },
      })
    ).isError,
  ).toBe(true);
  expect(await obs.db.apiKeys.get(issued.key.id)).toMatchObject({
    spentMicros: 1000,
    reservedMicros: 0,
  });
});
