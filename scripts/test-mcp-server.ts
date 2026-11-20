/**
 * Runs the fixture company MCP server for manual connector testing.
 *
 *   npm run connector:test-server            # http://127.0.0.1:4100/mcp, no token
 *   TEST_MCP_TOKEN=secret-token-123 npm run connector:test-server
 *
 * Start Two Hands with CONNECTOR_ALLOW_LOOPBACK=true so it may call this
 * plain-HTTP loopback address. Never enable that setting in production.
 */
import { startTestMcpServer } from "../tests/fixtures/test-mcp-server.js";

const port = Number(process.env.TEST_MCP_PORT ?? 4100);
const token = process.env.TEST_MCP_TOKEN || undefined;
const fixture = await startTestMcpServer({ port, token });
console.log(
  `Fixture company MCP server at ${fixture.url}${token ? " (Bearer token required)" : ""}`,
);
const stop = () => void fixture.close().then(() => process.exit(0));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
