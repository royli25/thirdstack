import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createObservationMcp } from "./mcp-server.js";
import {
  bridgeConfiguration,
  bridgeClientIdentity,
  createBridgeRequest,
} from "./mcp-bridge.js";
let client: { clientName: string; clientVersion: string } | undefined;
const request = createBridgeRequest(bridgeConfiguration(), () => client);
const server = createObservationMcp(request);
server.server.oninitialized = () => {
  const version = server.server.getClientVersion();
  client = bridgeClientIdentity(version?.name, version?.version);
  void request("/observations/connection", client).catch(() => {});
};
await server.connect(new StdioServerTransport());
