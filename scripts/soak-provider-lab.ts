/** Synthetic durability workload: no network requests, credentials, or production database. */
import type { SearchProviderId } from "../server/provider-catalog";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Store } from "../server/store.js";
import { ProviderLab } from "../server/provider-lab.js";
import { Observatory } from "../server/observation.js";
import { ProviderError } from "../server/providers.js";
import { companyReport } from "../server/company-insights.js";
import { config } from "../server/config.js";
import { suiteCases } from "../server/provider-lab-suite.js";
const seconds = Number(process.env.SOAK_SECONDS || 60);
assert(Number.isInteger(seconds) && seconds > 0 && seconds <= 7200);
const dir = resolve(
  process.env.SOAK_REPORT_DIR ||
    `.gstack/qa-reports/provider-lab-soak-${Date.now()}`,
);
await mkdir(dir, { recursive: true });
globalThis.fetch = async () => {
  throw new Error("Network forbidden in synthetic provider-lab soak");
};
Object.assign(config.keys, {
  exa: "FIXTURE",
  tavily: "FIXTURE",
  firecrawl: "FIXTURE",
});
config.providerTestBudgetMicros = 150000;
config.providerTestDailyBudgetMicros = 100000000;
config.rpm = 100000;
let calls = 0,
  cycle = 0,
  restarts = 0,
  peakReadMs = 0;
const adapters = {
  search: async (
    provider: SearchProviderId,
    query: string,
    _domains: string[],
    id: string,
  ) => {
    calls++;
    await new Promise((r) => setTimeout(r, 5));
    if (cycle % 7 === 0 && provider === "tavily")
      throw new ProviderError("http", 503);
    return {
      httpStatus: 200,
      sources: [
        {
          id,
          provider,
          callId: id,
          url: suiteCases.find((c) => c.input === query)!.referenceUrl,
          title: "Synthetic reference",
          snippet: "Synthetic provider content. ".repeat(80),
        },
      ],
    };
  },
  scrape: async (url: string) => {
    calls++;
    await new Promise((r) => setTimeout(r, 5));
    return {
      httpStatus: 200,
      pageStatus: cycle % 9 === 0 ? 404 : 200,
      text: `Synthetic content. ${suiteCases.find((c) => c.input === url)?.terms.join(" ")}`,
    };
  },
};
const path = join(dir, "synthetic.sqlite");
let store = new Store(path),
  lab = new ProviderLab(store, adapters),
  obs = new Observatory(store, adapters);
const connect = () => {
  obs.controlledSamples = async () => await lab.controlledSamples();
};
connect();
const started = Date.now(),
  deadline = started + seconds * 1000;
const results = {
  synthetic: true,
  networkRequests: 0,
  startedAt: new Date(started).toISOString(),
  finishedAt: null as string | null,
  durationSeconds: seconds,
  cycles: 0,
  providerExecutions: 0,
  restarts: 0,
  failures: 0,
  peakReadMs: 0,
  heapStart: process.memoryUsage().heapUsed,
  heapEnd: 0,
};
try {
  do {
    cycle++;
    const input = {
      requestKey: `soak-${cycle}`,
      providers: ["exa", "tavily", "firecrawl"],
    };
    const before = calls;
    const run = await lab.start(input);
    assert.equal((await lab.start(input)).id, run.id);
    if (cycle % 11 === 0) await lab.cancel(run.id);
    while (lab.active.size) await new Promise((r) => setTimeout(r, 5));
    const settled = await lab.get(run.id);
    assert.equal(settled.reservedMicros, 0);
    assert(settled.spentMicros <= settled.budgetMicros);
    assert.equal(calls - before, cycle % 11 === 0 ? 1 : 15);
    assert.equal((await lab.start(input)).id, run.id);
    assert.equal(calls - before, cycle % 11 === 0 ? 1 : 15);
    const first = settled.calls.find((c) =>
      ["succeeded", "failed"].includes(c.status),
    )!;
    await lab.review(run.id, first.id, {
      verdict: "partial",
      note: "Synthetic fixture review, not measured provider quality.",
      author: "assistant_reported",
    });
    if (cycle % 3 === 0)
      await lab.review(run.id, first.id, {
        verdict: "unknown",
        note: "Revised synthetic judgment preserves uncertainty.",
        author: "assistant_reported",
      });
    const tick = Date.now();
    const overview = await lab.overview();
    assert.equal(overview.runs.length, cycle);
    assert(
      overview.runs.every((r) => r.calls.every((c) => c.result === undefined)),
    );
    assert.equal((await obs.db.list()).length, 0);
    assert(
      (await obs.catalog()).every(
        (c) => c.sampleCount === 0 && c.quality === null,
      ),
    );
    for (const provider of ["exa", "tavily", "firecrawl"] as const) {
      const company = await companyReport(provider, "local", obs, lab);
      assert.equal(company.organic, null);
    }
    assert.equal((await companyReport("exa", "demo", obs, lab)).source, "demo");
    peakReadMs = Math.max(peakReadMs, Date.now() - tick);
    if (cycle % 10 === 0) {
      await store.close();
      store = new Store(path);
      lab = new ProviderLab(store, adapters);
      obs = new Observatory(store, adapters);
      connect();
      await lab.recover();
      await lab.recover();
      restarts++;
      assert.equal((await lab.start(input)).id, run.id);
      assert.equal((await lab.get(run.id)).spentMicros, settled.spentMicros);
      assert.equal(
        (await lab.get(run.id)).calls[0].reviews.length,
        cycle % 3 === 0 ? 2 : 1,
      );
      assert.equal(calls - before, cycle % 11 === 0 ? 1 : 15);
    }
    Object.assign(results, {
      cycles: cycle,
      providerExecutions: calls,
      restarts,
      peakReadMs,
      heapEnd: process.memoryUsage().heapUsed,
    });
    await writeFile(
      join(dir, "progress.json"),
      JSON.stringify(results, null, 2),
    );
    if (cycle % 10 === 0)
      console.log(
        JSON.stringify({
          cycles: cycle,
          restarts,
          elapsedSeconds: Math.round((Date.now() - started) / 1000),
          peakReadMs,
        }),
      );
    if (Date.now() < deadline)
      await new Promise((r) =>
        setTimeout(r, Math.min(15000, deadline - Date.now())),
      );
  } while (Date.now() < deadline);
  results.finishedAt = new Date().toISOString();
  await writeFile(join(dir, "result.json"), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} catch (error) {
  results.failures++;
  await writeFile(
    join(dir, "failure.json"),
    JSON.stringify({ ...results, error: String(error) }, null, 2),
  );
  throw error;
} finally {
  await store.close();
}
