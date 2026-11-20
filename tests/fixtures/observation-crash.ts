import { randomUUID } from "node:crypto";
import { Store } from "../../server/store.js";
import { Observatory, sessionInput } from "../../server/observation.js";
import { config } from "../../server/config.js";
config.keys.firecrawl = "fixture";
const store = new Store(process.env.CRASH_TEST_DB!);
const obs = new Observatory(store, {
  search: async () => ({ httpStatus: 200, sources: [] }),
  scrape: async () => {
    process.stdout.write(
      JSON.stringify({ ready: true, sessionId: s.id }) + "\n",
    );
    await new Promise((r) => setTimeout(r, 60000));
    return { httpStatus: 200, text: "Never committed" };
  },
});
const s = await obs.create(
  sessionInput.parse({
    title: "Crash fixture",
    objective: "Validate recovery of an interrupted synthetic request.",
    criteria: [{ text: "Preserves the receipt" }],
    budgetMicros: 1000,
  }),
  "operator_entered",
);
await obs.approve(s.id, s.intentHash);
const key = await obs.db.apiKeys.create({
  name: "Crash scoped key",
  requestKey: randomUUID(),
  scopes: ["tools:execute"],
  allowedTools: ["firecrawl_extract"],
  limitUsd: "0.001",
});
await obs.execute(
  s.id,
  {
    tool: "firecrawl_extract",
    url: "https://example.com",
    requestKey: "crash-once",
    domains: [],
    statedReason: "Synthetic crash fixture",
  },
  key.key.id,
);
await store.close();
