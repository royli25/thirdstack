/**
 * Seeds a separate database with simulated agent sessions so seller reports can be
 * exercised end to end. Everything runs through the real session, discovery, call
 * and outcome code; only the providers and the agents' choices are invented.
 *
 * No network calls and no provider keys. The database is marked as simulated and
 * every report built from it says so. Never point this at the working database.
 *
 *   node --import tsx scripts/simulate-seller-data.ts [sessions] [path] [--reset]
 */
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { Store } from "../server/store.js";
import { Observatory } from "../server/observation.js";
import { config } from "../server/config.js";
import { ProviderError } from "../server/providers.js";
import type { TaskType, ReasonTheme } from "../server/seller-taxonomy.js";
import type { ToolName } from "../server/observation-types.js";
import { SellerStore } from "../server/seller-store.js";

const args = process.argv.slice(2);
const reset = args.includes("--reset");
const [countArg, pathArg] = args.filter((a) => !a.startsWith("--"));
const total = Number(countArg ?? 800);
const path = resolve(pathArg ?? "./data/simulation.sqlite");
if (!Number.isInteger(total) || total < 1 || total > 5000)
  throw new Error("Choose between 1 and 5000 sessions.");
if (path === resolve(config.dbPath))
  throw new Error("Refusing to simulate into the working database.");
if (existsSync(path)) {
  if (!reset) throw new Error(`${path} exists. Pass --reset to replace it.`);
  for (const suffix of ["", "-wal", "-shm"])
    rmSync(path + suffix, { force: true });
}

// Deterministic, so a run can be reproduced.
const seed = 20261112;
let state = seed;
const random = () => {
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const chance = (p: number) => random() < p;
function pick<T>(options: [T, number][]): T {
  let roll = random() * options.reduce((n, [, w]) => n + w, 0);
  for (const [value, weight] of options) if ((roll -= weight) < 0) return value;
  return options.at(-1)![0];
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Sessions are spread over the last 60 days by shifting the clock the server code reads.
const RealDate = Date;
let clockOffset = 0;
globalThis.Date = class extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length) super(...(args as [number]));
    else super(RealDate.now() + clockOffset);
  }
  static now() {
    return RealDate.now() + clockOffset;
  }
} as DateConstructor;
const DAY = 86_400_000;
const SPAN = 60;
// The earlier 30 days carry fewer tasks than the latest 30, so period comparison has something to show.
const earlier = Math.round(total * 0.375);
const dayOf = (n: number) =>
  n < earlier
    ? Math.floor((n / earlier) * 30)
    : 30 + Math.floor(((n - earlier) / (total - earlier)) * 30);
const LISTING_DAY = 46;
const INCIDENT_DAY = 52;

Object.assign(config.keys, {
  exa: "simulation",
  tavily: "simulation",
  firecrawl: "simulation",
});
Object.assign(config.prices, { exa: 7000, tavily: 8000, firecrawl: 1000 });
config.rpm = 1_000_000;
const failRate = { exa: 0.03, tavily: 0.03, firecrawl: 0.08 };
const fail = (provider: keyof typeof failRate) => {
  if (!chance(failRate[provider])) return;
  throw chance(0.6)
    ? new ProviderError("timeout")
    : new ProviderError("http", 429);
};
const adapters = {
  search: async (
    provider: "exa" | "tavily",
    _query: string,
    _domains: string[],
    callId: string,
    options?: { maxResults?: number },
  ) => {
    await sleep(5 + random() * 25);
    fail(provider);
    const empty = provider === "exa" && chance(0.12);
    const estimate =
      0.007 + Math.max(0, (options?.maxResults ?? 10) - 10) * 0.001;
    return {
      sources: empty
        ? []
        : Array.from({ length: 3 }, (_, i) => ({
            id: `${callId}-${i}`,
            title: `Simulated source ${i + 1}`,
            url: `https://example.com/simulated/${callId}/${i}`,
            snippet: "Simulated evidence excerpt. ".repeat(5),
            provider,
            callId,
          })),
      httpStatus: 200,
      usage:
        provider === "exa"
          ? { providerReportedUsd: estimate * 0.72, source: "Simulation" }
          : { credits: 1, source: "Simulation" },
    };
  },
  scrape: async () => {
    await sleep(5 + random() * 25);
    fail("firecrawl");
    return { text: "Simulated page text.", httpStatus: 200, pageStatus: 200 };
  },
};

clockOffset = -SPAN * DAY;
const store = new Store(path);
const obs = new Observatory(store, adapters as never);
await obs.ready;
const sellers = new SellerStore(store);
obs.listings = async () => await sellers.liveAll();
await sellers.setInternalHosts(["octolab QA"]);
for (const provider of ["exa", "tavily"] as const)
  await sellers.updateSettings(provider, {
    revision: 0,
    namedComparison: true,
  });
let listingLive = false;
const tools = { exa: "exa_search", tavily: "tavily_search" } as const;
const exaPreference: Record<TaskType, number> = {
  current_events: 0.12,
  company_or_market: 0.46,
  technical: 0.4,
  product_or_shopping: 0.3,
  academic_or_longform: 0.7,
  people: 0.4,
  other: 0.35,
};
const tally = { sessions: 0, calls: 0, failed: 0, routed: 0, noSearch: 0 };

for (let n = 0; n < total; n++) {
  const day = dayOf(n);
  clockOffset = -(SPAN - day) * DAY + ((n % 40) / 40) * DAY * 0.9;
  failRate.exa = day >= INCIDENT_DAY ? 0.11 : 0.03;
  if (!listingLive && day >= LISTING_DAY) {
    // The seller rewrites its listing to say what a result contains; a reviewer approves it.
    const draft = await sellers.submitListing("exa", {
      description:
        "Search the web and get up to 2,500 characters of page text with each result, so many questions need no second request. Up to 20 results, 10 by default.",
      useWhen:
        "Use when the answer is likely to be in the page text itself, or when a query describes a concept instead of exact keywords.",
      limitations:
        "Page text is partial and can be missing. Results above 10 cost more. Coverage of very recent pages is not guaranteed.",
      note: "Say plainly that results include page text.",
    });
    await sellers.reviewListing("exa", {
      version: draft.version,
      decision: "approve",
      note: "Describes the tool without instructing the agent.",
    });
    listingLive = true;
  }
  const taskType = pick<TaskType>([
    ["current_events", 25],
    ["company_or_market", 23],
    ["technical", 21],
    ["product_or_shopping", 17],
    ["academic_or_longform", 14],
  ]);
  const host = pick([
    ["octolab QA", 3],
    ["Claude Code", 48],
    ["Codex", 35],
    ["Claude desktop", 12],
    ["Cursor", 5],
  ]);
  const maxResults = chance(0.35) ? 20 : 10;
  const tight = maxResults === 20 && chance(0.18);
  config.agentSessionBudgetMicros = tight ? 12000 : 100000;
  const session = await obs.createAgentSession({
    title: `Simulated task ${n + 1}`,
    objective: "Simulated research task. No real user request.",
    criteria: [{ text: "Cites supporting evidence", weight: 1 }],
    taskType,
    model: "simulated",
    host,
  });
  tally.sessions++;
  const content = chance(0.06)
    ? "complete_page"
    : chance(taskType === "academic_or_longform" ? 0.45 : 0.12)
      ? "page_text"
      : "any";
  const query = `simulated query ${n + 1}`;
  const offer = await obs.discover(session.id, {
    need: "Simulated need",
    operations: [{ operation: "search", query, maxResults, content }],
  });
  const eligible = (["exa", "tavily"] as const).filter((p) =>
    offer.tools
      .find((t) => t.tool === tools[p])!
      .discoveryMatches.some((m) => m.status === "eligible"),
  );
  if (!eligible.length || chance(0.04)) {
    tally.noSearch++;
    continue;
  }
  const exaPricier = maxResults > 10;
  const reasonFor = (p: "exa" | "tavily"): ReasonTheme | undefined =>
    p === "exa"
      ? pick<ReasonTheme | undefined>([
          ["needs_page_text", content === "page_text" ? 90 : 38],
          ["semantic_match", 25],
          ["domain_restricted", 15],
          ["follow_up", 10],
          [undefined, 8],
        ])
      : pick<ReasonTheme | undefined>([
          ["lower_cost", eligible.length === 1 ? 60 : exaPricier ? 50 : 8],
          ["recency", taskType === "current_events" ? 50 : 8],
          ["excerpts_sufficient", 30],
          ["reliability", 4],
          [undefined, 6],
        ]);
  const run = async (
    tool: ToolName,
    key: string,
    reasonTheme?: ReasonTheme,
    url?: string,
  ) => {
    tally.calls++;
    const call = await obs.execute(session.id, {
      tool,
      requestKey: key,
      statedReason: "Simulated selection reason.",
      ...(reasonTheme ? { reasonTheme } : {}),
      ...(url ? { url } : { query, maxResults, domains: [] }),
    });
    if (call.status === "failed") tally.failed++;
    return call;
  };
  const evidence: string[] = [];
  if (eligible.length === 2 && chance(0.08)) {
    // Octolab chooses. These must not count as an agent choice.
    tally.routed++;
    const routed = await obs.route(session.id, {
      requestKey: "routed",
      need: "Simulated need.",
      operation: { operation: "search", query, maxResults, content },
    });
    if (routed.call.status === "succeeded") evidence.push(routed.call.id);
  } else {
    let provider: "exa" | "tavily" =
      eligible.length === 1
        ? eligible[0]
        : chance(
              exaPreference[taskType] *
                (exaPricier ? 0.6 : 1) *
                (listingLive ? 1.3 : 1),
            )
          ? "exa"
          : "tavily";
    let call = await run(tools[provider], "search-1", reasonFor(provider));
    if (call.status === "failed") {
      const next = pick([
        ["switch", eligible.length === 2 ? 65 : 0],
        ["retry", 20],
        ["stop", 15],
      ]);
      if (next !== "stop") {
        if (next === "switch") provider = provider === "exa" ? "tavily" : "exa";
        call = await run(
          tools[provider],
          "search-2",
          next === "switch" ? "reliability" : "follow_up",
        );
      }
    }
    if (call.status === "succeeded") {
      evidence.push(call.id);
      if (provider === "exa" && eligible.includes("tavily") && chance(0.2)) {
        const second = await run(tools.tavily, "search-3", "recency");
        if (second.status === "succeeded") evidence.push(second.id);
      }
    }
  }
  if (evidence.length && chance(0.58)) {
    const page = await run(
      "firecrawl_extract",
      "extract-1",
      "known_url",
      `https://example.com/simulated/page-${n + 1}`,
    );
    if (page.status === "succeeded") evidence.push(page.id);
  }
  if (chance(0.92))
    await obs.outcome(session.id, {
      requestKey: "outcome-1",
      text: "Simulated answer. No real research was performed.",
      evidenceCallIds: evidence.filter(() => chance(0.7)),
    });
}

const note =
  "Simulated data. Providers, agents and their choices were generated by scripts/simulate-seller-data.ts; no real task, user or provider call is behind any number here. Timings are not realistic.";
await store.db
  .prepare(
    "INSERT INTO workspace_settings VALUES ('simulation',?) ON CONFLICT(key) DO UPDATE SET body=excluded.body",
  )
  .run(
    JSON.stringify({
      note,
      seed,
      createdAt: new Date().toISOString(),
      ...tally,
    }),
  );
clockOffset = 0;
await store.close();
console.log(JSON.stringify({ path, seed, ...tally }, null, 2));
