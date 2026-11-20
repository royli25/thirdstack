import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Store } from "../server/store";
import { PostgresDatabase } from "../server/database";
import { applyMigrations } from "../server/migration";
import { Observatory } from "../server/observation";
import { readActivity, readUsage } from "../server/account-reads";
import { accountActivity, accountUsage } from "../server/account-data-api";
import { createApp } from "../server/app";
import { FundingLedger } from "../server/funding-ledger";
import type { ObservedCall } from "../server/observation-types";

for (const backend of ["sqlite", "postgres"] as const) {
  describe.skipIf(
    backend === "postgres" && !process.env.OCTOLAB_TEST_POSTGRES_URL,
  )(`${backend} bounded dashboard reads`, () => {
    let store: Store, obs: Observatory;
    const workspace = randomUUID();
    beforeAll(async () => {
      store = new Store(
        ":memory:",
        backend === "postgres"
          ? process.env.OCTOLAB_TEST_POSTGRES_URL
          : undefined,
        workspace,
      );
      if (store.db instanceof PostgresDatabase) {
        await applyMigrations(store.db);
        await store.db.pool.query(
          "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Isolated performance fixture')",
          [workspace],
        );
      }
      obs = new Observatory(store);
      await obs.ready;
      for (let n = 0; n < 3; n++) {
        const s = await obs.create(
          {
            title: `Performance fixture ${n}`,
            objective: "No live provider calls",
            criteria: [{ text: "fixture", weight: 1 }],
          },
          "operator_entered",
        );
        for (let i = 0; i < 12; i++) {
          const call: ObservedCall = {
            id: `${s.id}-${i}`,
            sessionId: s.id,
            requestKey: `c${i}`,
            tool: "exa_search",
            provider: "exa",
            arguments: { query: i === 0 ? "100%_literal" : "fixture" },
            statedReason: "Synthetic test fixture",
            status:
              i % 3 === 0 ? "running" : i % 3 === 1 ? "succeeded" : "failed",
            startedAt:
              i === 11 ? "2020-01-01T00:00:00.000Z" : new Date().toISOString(),
            latencyMs: i % 3 === 0 ? undefined : i * 10,
            estimateMicros: 7000,
            result: {
              text: "PRIVATE PAGE ".repeat(1000),
              usage: {
                providerReportedUsd: i % 2 === 0 ? 0.007 : null,
                credits: i % 4 === 0 ? "unreported" : i % 4 === 1 ? -1 : 2,
              },
            },
          };
          await obs.db.saveCall(call, "fixture");
        }
      }
    });
    afterAll(async () => {
      await store.close();
    });
    const since = new Date(Date.now() - 86400000).toISOString();
    it("filters and pages in SQL, retains literal search semantics, and never sends page results", async () => {
      const spy = vi.spyOn(obs.db, "calls");
      const first = await readActivity(obs, since, {
        provider: "all",
        status: "all",
        q: "",
        page: 1,
      });
      const second = await readActivity(obs, since, {
        provider: "all",
        status: "all",
        q: "",
        page: 2,
      });
      expect(first.total).toBe(33);
      expect(first.items).toHaveLength(20);
      expect(second.items).toHaveLength(13);
      expect(
        new Set([...first.items, ...second.items].map((x) => x.id)).size,
      ).toBe(33);
      expect(JSON.stringify(first)).not.toContain("PRIVATE PAGE");
      const literal = await readActivity(obs, since, {
        provider: "all",
        status: "running",
        q: "100%_",
        page: 1,
      });
      expect(literal.total).toBe(3);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
    it("SQL aggregates match the existing usage contract including missing units and running reservations", async () => {
      const items = await accountActivity(obs, since);
      const actual = await readUsage(obs, 7, since);
      const expected = accountUsage(items, 7, since);
      expect(actual.reportedUsd!).toBeCloseTo(expected.reportedUsd!, 12);
      expect({ ...actual, reportedUsd: null }).toEqual({
        ...expected,
        reportedUsd: null,
      });
    });
    it("catalog and summary do not query calls per session or read routing per tool", async () => {
      const calls = vi.spyOn(obs.db, "calls"),
        routing = vi.spyOn(obs, "routingPolicy");
      await obs.catalog();
      await obs.summary();
      expect(calls).not.toHaveBeenCalled();
      expect(routing).toHaveBeenCalledTimes(1);
      calls.mockRestore();
      routing.mockRestore();
    });
    it("funding summary GET does not run historical-import writes and excludes detailed histories", async () => {
      const spy = vi.spyOn(FundingLedger.prototype, "importHistorical");
      const result = await request(createApp(store, undefined, obs))
        .get("/api/account/funding?summary=true")
        .set("Host", "localhost");
      expect(result.status).toBe(200);
      expect(result.body.intents).toEqual([]);
      expect(result.body.entries).toBeUndefined();
      expect(result.body.stripeIntents).toBeUndefined();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
    if (backend === "postgres")
      it("read scopes enforce RLS, reject writes, reset pooled state, and cannot switch tenants", async () => {
        const other = randomUUID(),
          db = store.db as PostgresDatabase;
        await db.pool.query(
          "INSERT INTO octolab.workspaces(id,name) VALUES($1,'Other isolated fixture')",
          [other],
        );
        await db.read(async () => {
          expect((await obs.db.list()).length).toBe(3);
          await expect(
            store.scope.run(other, () => obs.db.list()),
          ).rejects.toThrow(/change workspace/);
        });
        expect(
          await store.scope.run(other, () => db.read(() => obs.db.list())),
        ).toEqual([]);
        await expect(
          db.read(() => db.prepare("DELETE FROM observation_sessions").run()),
        ).rejects.toThrow(/read-only/);
        await db.read(async () => {
          expect((await obs.db.list()).length).toBe(3);
        });
        const raw = await db.pool.query(
          "SELECT current_user AS role,current_setting('octolab.workspace_id',true) AS workspace",
        );
        const quoted = "fixture'; RESET ROLE; --\\tenant";
        const escaped = await store.scope.run(quoted, () =>
          db.read(() =>
            db
              .prepare(
                "SELECT current_user AS role,current_setting('octolab.workspace_id') AS workspace",
              )
              .get(),
          ),
        );
        expect(escaped).toMatchObject({
          role: "octolab_runtime",
          workspace: quoted,
        });
        expect(raw.rows[0].role).not.toBe("octolab_runtime");
        expect(raw.rows[0].workspace ?? "").toBe("");
      });
  });
}
