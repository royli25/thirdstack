import { createHash } from "node:crypto";
import type { ProviderId } from "./types.js";
import { providerCatalog } from "./provider-catalog.js";
function integer(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  const n = raw === undefined ? fallback : Number(raw);
  if (!Number.isInteger(n) || n < min || n > max)
    throw new Error(`Invalid ${name}`);
  return n;
}
function price(name: string, fallback: number) {
  const n = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(n) || n < 0 || n > 10)
    throw new Error(`Invalid ${name}`);
  return Math.ceil(n * 1_000_000);
}
const prices = Object.fromEntries(
  providerCatalog.map((p) => [p.id, price(p.priceEnv, p.defaultUsd)]),
) as Record<ProviderId, number>;
const exaAdditionalResultMicros = price("EXA_ADDITIONAL_RESULT_USD", 0.001);
export const config = {
  disabledProviders: [] as ProviderId[],
  unavailableManagedCredentials: [] as ProviderId[],
  providerRpms: {} as Partial<Record<ProviderId, number>>,
  exaAdditionalResultMicros,
  port: integer("PORT", 3001, 1, 65535),
  host: process.env.HOST || "127.0.0.1",
  token: process.env.API_TOKEN || "",
  adminToken: process.env.ADMIN_API_TOKEN || "",
  databaseUrl: process.env.DATABASE_URL || "",
  storageBackend: process.env.STORAGE_BACKEND || "sqlite",
  legacyWorkspaceId: process.env.LEGACY_WORKSPACE_ID || "",
  dbPath: process.env.DB_PATH || "./data/apilayer.sqlite",
  keylessMaxRequests: integer("FIRECRAWL_KEYLESS_MAX_REQUESTS", 10, 1, 50),
  allowKeylessFirecrawl: process.env.FIRECRAWL_ALLOW_KEYLESS === "true",
  timeoutMs: integer("PROVIDER_TIMEOUT_MS", 20000, 100, 120000),
  rpm: integer("PROVIDER_RPM", 20, 1, 1000),
  connectors: {
    /** 32-byte key (base64 or hex) that encrypts company connector tokens. */
    secretKey: process.env.CONNECTOR_SECRET_KEY || "",
    timeoutMs: integer("CONNECTOR_TIMEOUT_MS", 20000, 100, 120000),
    rpm: integer("CONNECTOR_RPM", 30, 1, 1000),
    /** Plain HTTP to loopback endpoints, for local testing only. Ignored in production. */
    allowLoopback:
      process.env.CONNECTOR_ALLOW_LOOPBACK === "true" &&
      process.env.NODE_ENV !== "production",
  },
  agentSessionBudgetMicros: integer(
    "AGENT_SESSION_BUDGET_MICROS",
    100000,
    0,
    5_000_000,
  ),
  providerTestBudgetMicros: integer(
    "PROVIDER_TEST_BUDGET_MICROS",
    150000,
    0,
    5_000_000,
  ),
  providerTestDailyBudgetMicros: integer(
    "PROVIDER_TEST_DAILY_BUDGET_MICROS",
    500000,
    0,
    50_000_000,
  ),
  // Legacy configuration compatibility; no longer gates company/usage reports.
  minCohort: integer("ANALYTICS_MIN_TASKS", 5, 5, 10000),
  prices,
  keys: Object.fromEntries(
    providerCatalog.map((p) => [p.id, process.env[p.credentialEnv] || ""]),
  ) as Record<ProviderId, string>,
  rateCardVersion: `request-estimates-v2:${createHash("sha256").update(JSON.stringify({ prices, exaAdditionalResultMicros })).digest("hex").slice(0, 12)}`,
  policyVersion: "deterministic-v1",
};

export function providerEnabled(provider: string) {
  return (
    !config.disabledProviders.some((p) => p === provider) &&
    !config.unavailableManagedCredentials.some((p) => p === provider)
  );
}
export function providerRpm(provider: ProviderId) {
  return config.providerRpms[provider] ?? config.rpm;
}
export function refreshRateCardVersion() {
  config.rateCardVersion = `request-estimates-v2:${createHash("sha256")
    .update(
      JSON.stringify({
        prices: config.prices,
        exaAdditionalResultMicros: config.exaAdditionalResultMicros,
      }),
    )
    .digest("hex")
    .slice(0, 12)}`;
}

export function providerEstimate(provider: ProviderId) {
  return provider === "firecrawl" &&
    !config.keys.firecrawl &&
    config.allowKeylessFirecrawl
    ? 0
    : config.prices[provider];
}
export function providerAuthMode(provider: ProviderId) {
  return provider === "firecrawl" &&
    !config.keys.firecrawl &&
    config.allowKeylessFirecrawl
    ? "keyless"
    : "api-key";
}
