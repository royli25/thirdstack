/** Explicitly invoked paid acceptance check. Never runs in CI or on server startup. */
import { randomUUID } from "node:crypto";
import { config } from "./config.js";
import { PostgresDatabase } from "./database.js";
import { claimRuntime } from "./migration.js";
import { Store } from "./store.js";
import { Engine } from "./engine.js";
import type { Task } from "./types.js";
if (!config.keys.exa || !config.keys.tavily)
  throw new Error(
    "Live validation requires both EXA_API_KEY and TAVILY_API_KEY. No requests were made.",
  );
const estimate = 10 * (config.prices.exa + config.prices.tavily);
const approvedCap = Number(process.env.LIVE_VALIDATION_BUDGET_USD ?? 0);
if (
  !Number.isFinite(approvedCap) ||
  approvedCap <= 0 ||
  approvedCap > 5 ||
  Math.floor(approvedCap * 1e6) < estimate
)
  throw new Error(
    `Set LIVE_VALIDATION_BUDGET_USD to an explicit cap of at least ${(estimate / 1e6).toFixed(3)} and at most 5 before invoking paid validation. No requests were made.`,
  );
if (config.storageBackend === "postgres" && !config.databaseUrl)
  throw new Error("Set DATABASE_URL before running Postgres validation.");
const store = new Store(
  config.dbPath,
  config.storageBackend === "postgres" ? config.databaseUrl : undefined,
  config.legacyWorkspaceId,
);
const release =
  store.db instanceof PostgresDatabase
    ? await claimRuntime(store.db)
    : undefined;
await store.recover();
const engine = new Engine(store);
const now = new Date().toISOString();
const task: Task = {
  id: randomUUID(),
  createdAt: now,
  updatedAt: now,
  status: "running",
  spentMicros: 0,
  reservedMicros: 0,
  sources: [],
  assessments: [],
  intent: {
    prompt:
      "Validate live search adapter execution and telemetry. This is an integration acceptance run, not verified company research.",
    query: "agent payments companies external funding",
    requiredCount: 1,
    budgetMicros: Math.floor(approvedCap * 1e6),
    criteria: [
      "Integration acceptance requires successful live responses from both providers",
    ],
    domains: [],
    mode: "compare",
    preference: "balanced",
    consent: false,
  },
};
await store.transaction(async () => {
  await store.save(task);
  await store.event(task.id, "intent_created", {
    ...task.intent,
    rubricVersion: "live-validation-v1",
    consentScope: "local integration validation only",
  });
});
const queries = [
  "agent payments startup funding announcement",
  "agentic payments infrastructure seed round",
  "AI agent payment tools companies",
  "agent commerce payment protocol startup",
  "agent payments current products",
];
console.log(
  `Live validation task ${task.id}: 10 planned requests per provider; rate-card estimate $${(estimate / 1e6).toFixed(3)}. Vendor charges are not guaranteed by this estimate.`,
);
try {
  for (let round = 0; round < 2; round++) {
    engine.active.add(task.id);
    await engine.execute(task.id, queries);
  }
  const responses = (await store.events(task.id)).filter(
    (e) => e.type === "provider_response",
  );
  const counts = Object.fromEntries(
    ["exa", "tavily"].map((p) => [
      p,
      {
        attempts: responses.filter((e) => e.data.provider === p).length,
        successes: responses.filter(
          (e) => e.data.provider === p && e.data.success,
        ).length,
      },
    ]),
  );
  console.log(
    JSON.stringify(
      {
        taskId: task.id,
        providers: counts,
        estimatedUsd: (await store.get(task.id))!.spentMicros / 1e6,
        billingReconciled: false,
      },
      null,
      2,
    ),
  );
  if (Object.values(counts).some((c) => c.successes < 10)) process.exitCode = 1;
} finally {
  await release?.();
  await store.close();
}
