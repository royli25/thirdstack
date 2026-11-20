/** Deterministic synthetic workload. No network calls, provider keys, or real model scores. */
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Store } from "../server/store.js";
import { Observatory, sessionInput } from "../server/observation.js";
import { config } from "../server/config.js";
import { ProviderError } from "../server/providers.js";
import { verifyPrivateEvidence } from "../server/evidence-verification.js";
const duration = Number(process.env.SOAK_SECONDS || 60);
assert(Number.isFinite(duration) && duration > 0 && duration <= 7200);
const sessionMode = process.env.SOAK_SESSION_MODE || "manual";
assert(["manual", "backend"].includes(sessionMode));
if (sessionMode === "backend") config.agentSessionBudgetMicros = 1000;
const dir = resolve(
  process.env.SOAK_REPORT_DIR || `.gstack/qa-reports/soak-${Date.now()}`,
);
await mkdir(dir, { recursive: true });
Object.assign(config.keys, {
  exa: "synthetic",
  tavily: "synthetic",
  firecrawl: "synthetic",
});
config.rpm = 10000;
let executions = 0,
  restarts = 0,
  cycles = 0;
const adapters = {
  search: async () => {
    executions++;
    return {
      httpStatus: 200,
      sources: [
        {
          id: "fixture",
          title: "Synthetic evidence",
          url: "https://example.com",
          snippet: "A deterministic fixture.",
          provider: "exa" as const,
          callId: "synthetic-call",
        },
      ],
    };
  },
  scrape: async (url: string) => {
    executions++;
    await new Promise((r) => setTimeout(r, 20));
    if (url.includes("failure")) throw new ProviderError("http", 503);
    return {
      httpStatus: 200,
      pageStatus: url.includes("missing") ? 404 : 200,
      text: "Synthetic evidence. Not a real provider response.",
    };
  },
};
const dbPath = join(dir, "synthetic.sqlite");
let store = new Store(dbPath),
  obs = new Observatory(store, adapters);
const started = Date.now(),
  deadline = started + duration * 1000;
const heapStart = process.memoryUsage().heapUsed;
const results = {
  startedAt: new Date(started).toISOString(),
  finishedAt: null as string | null,
  durationSeconds: duration,
  cycles: 0,
  providerExecutions: 0,
  restarts: 0,
  failures: 0,
  synthetic: true,
  networkRequests: 0,
  sessionMode,
  heapStart,
  heapEnd: 0,
  peakCycleMs: 0,
};
try {
  do {
    const tick = Date.now();
    cycles++;
    const intent = sessionInput.parse({
      title: `Synthetic soak ${cycles}`,
      objective: "Validate deterministic receipt persistence.",
      criteria: [
        { text: "Preserves source evidence", weight: 2 },
        { text: "Reports limitations", weight: 1 },
      ],
      budgetMicros: 2000,
      model: "Synthetic fixture — excluded from live workspace",
      host: "Soak test",
    });
    const { budgetMicros: _budget, ...agentIntent } = intent;
    const s =
      sessionMode === "backend"
        ? await obs.createAgentSession(agentIntent)
        : await obs.create(intent, "operator_entered");
    if (sessionMode === "backend") {
      assert.equal(s.status, "active");
      assert.equal(s.authorizationSource, "backend_policy");
      assert.equal(s.budgetMicros, 1000);
      assert.equal(s.commercialConsent, true);
      assert.equal(
        (await obs.db.events(s.id)).some((e) => e.type === "intent_approved"),
        false,
      );
    } else {
      await assert.rejects(
        obs.execute(s.id, {
          tool: "firecrawl_extract",
          url: "https://example.com",
          requestKey: "blocked",
          domains: [],
          statedReason: "Synthetic extraction for durability verification.",
        }),
        /Approve/,
      );
      await obs.approve(s.id, s.intentHash);
    }
    await obs.discover(s.id, "Validate a known public URL");
    const input = {
      tool: "firecrawl_extract" as const,
      url: `https://example.com/${cycles % 7 === 0 ? "failure" : cycles % 5 === 0 ? "missing" : "fixture"}`,
      requestKey: "once",
      domains: [],
      statedReason: "Synthetic extraction choice",
    };
    const before = executions;
    const [first, duplicate] = await Promise.all([
      obs.execute(s.id, input),
      obs.execute(s.id, input),
    ]);
    assert.equal(first.id, duplicate.id);
    assert.equal(executions, before + 1);
    const replay = await obs.execute(s.id, input);
    assert.equal(replay.id, first.id);
    assert.equal(executions, before + 1);
    const finished = await obs.outcome(s.id, {
      requestKey: "final",
      text: "Synthetic final output for durability validation.",
      evidenceCallIds: [first.id],
    });
    await obs.outcome(s.id, {
      requestKey: "final",
      text: "Synthetic final output for durability validation.",
      evidenceCallIds: [first.id],
    });
    const reviewed = await obs.evaluate(s.id, {
      outcomeId: finished.outcomes[0].id,
      criteria: s.criteria.map((c, i) => ({
        criterionId: c.id,
        verdict: i === 1 && cycles % 3 === 0 ? "unknown" : "pass",
        note: "Synthetic fixture reviewed by the soak runner.",
        evidenceCallIds: [first.id],
      })),
    });
    assert.equal(reviewed.outcomes.length, 1);
    assert.equal(reviewed.spentMicros, 1000);
    assert.equal(reviewed.reservedMicros, 0);
    if (sessionMode === "backend") {
      await assert.rejects(
        obs.execute(s.id, { ...input, requestKey: "over-cap" }),
        /budget/,
      );
      assert.equal(executions, before + 1);
    }
    if (cycles % 4 === 0) {
      const withCase = await obs.openCase(
        s.id,
        reviewed.evaluations[0].id,
        "Synthetic review case for closure testing.",
      );
      await obs.resolveCase(
        s.id,
        withCase.cases[0].id,
        "resolved",
        "Synthetic resolution recorded without payment.",
      );
    }
    await obs.consent(s.id, true);
    assert.throws(
      async () => await obs.consent(s.id, false),
      /workspace policy/,
    );
    if (cycles % 2 === 0) {
      const revised = await obs.outcome(s.id, {
        requestKey: "revised",
        text: "Revised synthetic output for versioned review validation.",
        evidenceCallIds: [first.id],
      });
      await obs.evaluate(s.id, {
        outcomeId: finished.outcomes[0].id,
        historical: true,
        reviewer: { kind: "assistant_reported", label: "Synthetic soak" },
        criteria: s.criteria.map((c) => ({
          criterionId: c.id,
          verdict: "unknown",
          note: "Retrospective synthetic review remains uncertain.",
          evidenceCallIds: [first.id],
        })),
      });
      await obs.evaluate(s.id, {
        outcomeId: revised.outcomes.at(-1)!.id,
        reviewer: { kind: "assistant_reported", label: "Synthetic soak" },
        criteria: s.criteria.map((c) => ({
          criterionId: c.id,
          verdict: "pass",
          note: "Revised synthetic output checked by the test runner.",
          evidenceCallIds: [first.id],
        })),
      });
      const original = await obs.outcome(s.id, {
        requestKey: "final",
        text: "Synthetic final output for durability validation.",
        evidenceCallIds: [first.id],
      });
      assert.equal(original.submittedOutcomeId, finished.outcomes[0].id);
      assert.equal(original.outcomes.length, 2);
    }
    assert.equal(
      (await obs.commercialAggregate()).available,
      cycles >= config.minCohort,
    );
    assert.equal((await obs.db.detail(s.id))?.integrity, true);
    assert.equal(
      verifyPrivateEvidence({
        version: "private-evidence-v1",
        session: await obs.db.detail(s.id),
      }).valid,
      true,
    );
    if (cycles % 10 === 0) {
      await store.close();
      store = new Store(dbPath);
      obs = new Observatory(store, adapters);
      await obs.db.recover();
      restarts++;
      assert.equal((await obs.db.detail(s.id))?.integrity, true);
      assert.equal((await obs.db.get(s.id))?.spentMicros, 1000);
      if (sessionMode === "backend") {
        assert.equal(
          (await obs.db.get(s.id))?.authorizationSource,
          "backend_policy",
        );
        await assert.rejects(
          obs.execute(s.id, { ...input, requestKey: "over-cap-after-restart" }),
          /budget/,
        );
        assert.equal(executions, before + 1);
      }
    }
    results.peakCycleMs = Math.max(results.peakCycleMs, Date.now() - tick);
    Object.assign(results, {
      cycles,
      providerExecutions: executions,
      restarts,
      heapEnd: process.memoryUsage().heapUsed,
    });
    await writeFile(
      join(dir, "progress.json"),
      JSON.stringify(results, null, 2),
    );
    if (cycles % 10 === 0)
      console.log(
        JSON.stringify({
          cycles,
          restarts,
          elapsedSeconds: Math.round((Date.now() - started) / 1000),
          peakCycleMs: results.peakCycleMs,
        }),
      );
    if (Date.now() < deadline)
      await new Promise((r) =>
        setTimeout(r, Math.min(12000, deadline - Date.now())),
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
