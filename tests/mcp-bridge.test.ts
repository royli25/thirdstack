import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer, type Server } from "node:https";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  bridgeConfiguration,
  bridgeClientIdentity,
  createBridgeRequest,
} from "../server/mcp-bridge";

const key = `oct_key_${"A".repeat(43)}`,
  owner = "owner-token-never-forwarded-remotely";
const remote = () =>
  bridgeConfiguration({
    APILAYER_URL: "https://service.example/prefix/api/",
    APILAYER_API_KEY: key,
    API_TOKEN: owner,
  });
afterEach(() => vi.unstubAllGlobals());
describe("bridge destination and credential boundary", () => {
  it("preserves local defaults and accepts explicit HTTPS with a proxy prefix", () => {
    expect(bridgeConfiguration({ API_TOKEN: owner })).toEqual({
      baseUrl: "http://127.0.0.1:3001/api",
      https: false,
      credential: owner,
    });
    expect(remote()).toEqual({
      baseUrl: "https://service.example/prefix/api",
      https: true,
      credential: key,
    });
    expect(
      bridgeConfiguration({ APILAYER_URL: "http://[::1]:3001/api" }).baseUrl,
    ).toBe("http://[::1]:3001/api");
    expect(
      bridgeConfiguration({
        APILAYER_URL: "http://localhost:3999/api",
        API_TOKEN: owner,
        APILAYER_API_KEY: key,
      }).credential,
    ).toBe(key);
  });
  it("rejects malformed/credential-bearing destinations without repeating secrets", () => {
    for (const url of [
      "not-a-url",
      "http://service.example/api",
      "ftp://localhost/api",
      "https://user:SECRET@service.example/api",
      "https://service.example/api?token=SECRET",
      "https://service.example/api#SECRET",
      "https://service.example/api?",
      "https://service.example/api#",
      "https://service.example/not-api",
      "https://service.example/prefix%2fapi",
      "https://service.example\\@localhost/api",
      " https://service.example/api",
      "https://service.example/api\n",
    ]) {
      try {
        bridgeConfiguration({ APILAYER_URL: url, APILAYER_API_KEY: key });
        throw new Error("accepted an invalid URL");
      } catch (error) {
        expect((error as Error).message).toContain("APILAYER_URL must");
        expect((error as Error).message).not.toContain("SECRET");
      }
    }
  });
  it("requires an explicit scoped key for HTTPS and never accepts owner fallback", () => {
    for (const supplied of [undefined, "", owner, "oct_key_invalid"])
      expect(() =>
        bridgeConfiguration({
          APILAYER_URL: "https://service.example/api",
          API_TOKEN: owner,
          APILAYER_API_KEY: supplied,
        }),
      ).toThrow(/scoped APILAYER_API_KEY/);
  });
  it("pins requests to their origin, supplies only the scoped key and keeps client labels bounded", async () => {
    const fetched = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ ok: true }));
    const request = createBridgeRequest(
      remote(),
      () => bridgeClientIdentity("X".repeat(200), "Y".repeat(200)),
      { fetch: fetched },
    );
    await request("/observations/agent-sessions", {
      objective: "Fixture only",
    });
    const [url, options] = fetched.mock.calls[0];
    expect(url).toBe(
      "https://service.example/prefix/api/observations/agent-sessions",
    );
    expect(options).toMatchObject({
      redirect: "error",
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });
    expect(JSON.stringify(options)).not.toContain(owner);
    const labels = JSON.parse(
      Buffer.from(
        (options!.headers as Record<string, string>)["X-APILayer-MCP-Client"],
        "base64url",
      ).toString(),
    );
    expect(labels.clientName).toHaveLength(160);
    expect(labels.clientVersion).toHaveLength(100);
    for (const path of [
      "//evil.example/path",
      "https://evil.example/path",
      "/../admin",
      "/observations?secret=x",
      "/observations#secret",
      "/observations/%2e%2e/admin",
      "/observations\\admin",
    ])
      await expect(request(path)).rejects.toThrow(/path/);
    expect(fetched).toHaveBeenCalledTimes(1);
  });
  it("does not reflect remote error bodies or fall back to owner credentials after rejection", async () => {
    const fetched = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { error: `${key} ${owner} PRIVATE RAW RESPONSE` },
          { status: 401 },
        ),
      );
    await expect(
      createBridgeRequest(remote(), undefined, { fetch: fetched })(
        "/observations/connection",
      ),
    ).rejects.toThrow(/credential was rejected/);
    expect(fetched).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(fetched.mock.calls)).not.toContain(owner);
  });
  it("bounds declared and streamed responses and rejects malformed/non-JSON credential echoes", async () => {
    for (const response of [
      new Response("html", { headers: { "Content-Type": "text/html" } }),
      new Response("{bad", { headers: { "Content-Type": "application/json" } }),
      Response.json({ key }),
      new Response("{}", {
        headers: {
          "Content-Type": "application/json",
          "Content-Length": "100",
        },
      }),
      Response.json({ text: "x".repeat(100) }),
    ]) {
      const fetched = vi.fn<typeof fetch>().mockResolvedValue(response);
      await expect(
        createBridgeRequest(remote(), undefined, {
          fetch: fetched,
          maxResponseBytes: 50,
        })("/observations/connection"),
      ).rejects.toThrow();
    }
    const fetched = vi.fn<typeof fetch>();
    await expect(
      createBridgeRequest(remote(), undefined, { fetch: fetched })(
        "/observations/agent-sessions",
        { text: "x".repeat(200001) },
      ),
    ).rejects.toThrow(/size limit/);
    expect(fetched).not.toHaveBeenCalled();
  });
  it("uses a bounded deadline without retrying uncertain submissions", async () => {
    const fetched = vi.fn<typeof fetch>(
      async (_url, options) =>
        new Promise((_resolve, reject) => {
          options!.signal!.addEventListener(
            "abort",
            () => reject(new Error(key)),
            { once: true },
          );
        }),
    );
    const request = createBridgeRequest(remote(), undefined, {
      fetch: fetched,
      timeoutMs: 20,
    });
    await expect(request("/observations/agent-sessions", {})).rejects.toThrow(
      /reuse the same request key/,
    );
    expect(fetched).toHaveBeenCalledTimes(1);
  });
});

describe("real HTTPS stdio forwarding with isolated TLS fixtures", () => {
  let directory: string,
    certificate: string,
    https: Server,
    peer: Server,
    base: string,
    peerBase: string;
  let client: Client | undefined, transport: StdioClientTransport | undefined;
  let mode: "ok" | "same_redirect" | "cross_redirect" | "rejected" = "ok";
  const requests: { path: string; authorization: string; body: string }[] = [];
  let redirectHits = 0;
  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "octolab-bridge-tls-"));
    certificate = join(directory, "certificate.pem");
    const privateKey = join(directory, "key.pem");
    await promisify(execFile)("openssl", [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      privateKey,
      "-out",
      certificate,
      "-subj",
      "/CN=localhost",
      "-addext",
      "subjectAltName=DNS:localhost,IP:127.0.0.1",
      "-addext",
      "basicConstraints=critical,CA:true",
      "-days",
      "1",
    ]);
    const tls = {
      key: await readFile(privateKey),
      cert: await readFile(certificate),
    };
    peer = createServer(tls, (_req, res) => {
      redirectHits++;
      res
        .writeHead(200, { "Content-Type": "application/json" })
        .end('{"ok":true}');
    });
    await new Promise<void>((done) => peer.listen(0, "127.0.0.1", done));
    const peerAddress = peer.address();
    if (!peerAddress || typeof peerAddress === "string")
      throw new Error("Missing TLS fixture port");
    peerBase = `https://127.0.0.1:${peerAddress.port}`;
    https = createServer(tls, async (req, res) => {
      let body = "";
      for await (const chunk of req) body += chunk;
      requests.push({
        path: req.url || "",
        authorization: String(req.headers.authorization || ""),
        body,
      });
      if (req.url === "/redirected") redirectHits++;
      if (mode === "same_redirect" || mode === "cross_redirect") {
        res
          .writeHead(307, {
            Location:
              mode === "same_redirect"
                ? `${base.replace("/prefix/api", "")}/redirected`
                : `${peerBase}/redirected`,
          })
          .end();
        return;
      }
      res.setHeader("Content-Type", "application/json");
      if (mode === "rejected") {
        res.writeHead(401).end(JSON.stringify({ error: `${key} ${owner}` }));
        return;
      }
      if (req.headers.authorization !== `Bearer ${key}`) {
        res.writeHead(403).end("{}");
        return;
      }
      res.end(
        JSON.stringify(
          req.url?.endsWith("/agent-sessions")
            ? {
                id: "00000000-0000-4000-8000-000000000001",
                status: "active",
                intentHash: "fixture",
                modelSource: "agent_reported",
              }
            : { ok: true },
        ),
      );
    });
    await new Promise<void>((done) => https.listen(0, "127.0.0.1", done));
    const address = https.address();
    if (!address || typeof address === "string")
      throw new Error("Missing TLS fixture port");
    base = `https://127.0.0.1:${address.port}/prefix/api`;
  });
  afterEach(async () => {
    await client?.close();
    await transport?.close();
    client = undefined;
    transport = undefined;
    mode = "ok";
    requests.length = 0;
    redirectHits = 0;
  });
  afterAll(async () => {
    https.closeAllConnections();
    peer.closeAllConnections();
    await Promise.all([
      new Promise<void>((done) => https.close(() => done())),
      new Promise<void>((done) => peer.close(() => done())),
    ]);
    await rm(directory, { recursive: true, force: true });
  });
  async function connect(trustFixture = true) {
    transport = new StdioClientTransport({
      command: process.execPath,
      args: ["--import", "tsx", resolve("server/mcp-stdio.ts")],
      cwd: process.cwd(),
      env: {
        APILAYER_URL: base,
        APILAYER_API_KEY: key,
        API_TOKEN: owner,
        ...(trustFixture ? { NODE_EXTRA_CA_CERTS: certificate } : {}),
      },
      stderr: "pipe",
    });
    client = new Client({ name: "HTTPS fixture", version: "1" });
    await client.connect(transport, { timeout: 5000 });
  }
  const intent = {
    title: "TLS fixture",
    objective: "Verify isolated HTTPS forwarding",
    criteria: [{ text: "Fixture only" }],
  };
  it("forwards an actual stdio tool call over trusted HTTPS to the configured prefix with only its scoped key", async () => {
    await connect();
    const result = await client!.callTool({
      name: "record_intent",
      arguments: intent,
    });
    expect(result.isError).not.toBe(true);
    expect(
      requests.find((r) => r.path === "/prefix/api/observations/agent-sessions")
        ?.authorization,
    ).toBe(`Bearer ${key}`);
    expect(JSON.stringify(requests)).not.toContain(owner);
    expect(JSON.stringify(result)).not.toContain(key);
  });
  it("refuses both same-origin and cross-origin redirects without forwarding credentials to their destinations", async () => {
    await connect();
    for (const redirect of ["same_redirect", "cross_redirect"] as const) {
      mode = redirect;
      const result = await client!.callTool({
        name: "record_intent",
        arguments: intent,
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result)).not.toContain(key);
    }
    expect(redirectHits).toBe(0);
    expect(JSON.stringify(requests)).not.toContain(owner);
  });
  it("keeps TLS certificate verification enabled", async () => {
    await connect(false);
    const result = await client!.callTool({
      name: "record_intent",
      arguments: intent,
    });
    expect(result.isError).toBe(true);
    expect(requests).toHaveLength(0);
  });
  it("never retries a rejected HTTPS key using the owner credential", async () => {
    await connect();
    mode = "rejected";
    const result = await client!.callTool({
      name: "record_intent",
      arguments: intent,
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(new RegExp(`${key}|${owner}`));
    expect(requests.every((r) => r.authorization === `Bearer ${key}`)).toBe(
      true,
    );
    expect(
      requests.filter((r) => r.path.endsWith("/agent-sessions")),
    ).toHaveLength(1);
  });
});
