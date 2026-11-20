import { createServer, type RequestListener, type Server } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config } from "../server/config";
import { scrape, search } from "../server/providers";

const nativeFetch = globalThis.fetch;
const originalTimeout = config.timeoutMs;
const servers: Server[] = [];

async function upstream(reply: RequestListener) {
  const server = createServer(reply);
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("No fixture port");
  vi.stubGlobal("fetch", (_input: unknown, init: RequestInit) =>
    nativeFetch(`http://127.0.0.1:${address.port}`, init),
  );
  // Leave time for loopback headers under a parallel suite's CPU load; the
  // intentionally stalled body must be the thing that reaches this deadline.
  config.timeoutMs = 1000;
}

afterEach(async () => {
  vi.unstubAllGlobals();
  config.timeoutMs = originalTimeout;
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// Regression: ISSUE-004 — a body deadline after HTTP 200 was mislabeled invalid_response.
// Found by /qa on 2026-11-01.
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-01.md
describe("provider deadlines cover response bodies", () => {
  it.each(["exa", "tavily", "firecrawl"] as const)(
    "classifies a stalled %s body as a timeout while preserving the received HTTP status",
    async (provider) => {
      await upstream((_request, response) => {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.write('{"results":[');
      });
      const operation =
        provider === "firecrawl"
          ? scrape("https://example.com")
          : search(provider, "local timeout fixture", [], "fixture-call");
      await expect(operation).rejects.toMatchObject({
        kind: "timeout",
        httpStatus: 200,
        message: "Provider timeout",
      });
    },
  );

  it("keeps timeouts before response headers distinct from HTTP responses", async () => {
    await upstream(() => {});
    await expect(
      search("exa", "local timeout fixture", [], "fixture-call"),
    ).rejects.toMatchObject({
      kind: "timeout",
      httpStatus: undefined,
    });
  });

  it("continues to classify a completed malformed body as invalid_response", async () => {
    await upstream((_request, response) => {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end("not JSON; TEST_ONLY_PRIVATE_PROVIDER_ERROR");
    });
    await expect(
      search("exa", "local malformed fixture", [], "fixture-call"),
    ).rejects.toMatchObject({
      kind: "invalid_response",
      httpStatus: 200,
      message: "Provider invalid response",
    });
  });
});
