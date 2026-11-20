/** Isolated crash-recovery fixture. It never contacts external providers. */
import { config } from "../../server/config.js";
import { Store } from "../../server/store.js";
import { createApp } from "../../server/app.js";
config.keys.exa = "TEST_ONLY_CRASH_EXA";
config.keys.tavily = "TEST_ONLY_CRASH_TAVILY";
config.keys.firecrawl = "";
config.timeoutMs = 120000;
config.token = "";
globalThis.fetch = async (input, init) => {
  if (
    !["https://api.exa.ai/search", "https://api.tavily.com/search"].includes(
      String(input),
    )
  )
    throw new Error("Unexpected fixture network endpoint");
  return new Promise<Response>((_resolve, reject) =>
    init?.signal?.addEventListener(
      "abort",
      () => reject(new DOMException("Fixture deadline", "TimeoutError")),
      { once: true },
    ),
  );
};
const store = new Store(config.dbPath);
await store.recover();
const server = createApp(store).listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (address && typeof address !== "string")
    process.send?.({ port: address.port });
});
