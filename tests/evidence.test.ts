import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Engine } from "../server/engine";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { coverage } from "../server/router";
import { publicEvidenceUrl } from "../server/url-policy";
import { createTask } from "./helpers";
let store: Store;
let engine: Engine;
let app: ReturnType<typeof createApp>;
const original = {
  allow: config.allowKeylessFirecrawl,
  key: config.keys.firecrawl,
  max: config.keylessMaxRequests,
};
beforeEach(() => {
  store = new Store(":memory:");
  engine = new Engine(store);
  app = createApp(store, engine);
  config.keys.firecrawl = "";
  config.allowKeylessFirecrawl = false;
});
afterEach(async () => {
  await store.close();
  config.allowKeylessFirecrawl = original.allow;
  config.keys.firecrawl = original.key;
  config.keylessMaxRequests = original.max;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function source(taskId: string, url = "https://example.com/evidence") {
  const r = await request(app)
    .post(`/api/tasks/${taskId}/sources`)
    .send({ url });
  expect(r.status).toBe(201);
  return r.body;
}
describe("evidence provenance and keyless access", () => {
  it("stores a user supplied URL without pretending a provider returned it or calling a vendor", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const task = await createTask(store);
    task.status = "ready";
    await store.save(task);
    const s = await source(task.id);
    expect(s).toMatchObject({
      provider: "user",
      callId: null,
      snippet: "",
      contentVersion: 1,
    });
    expect(fetch).not.toHaveBeenCalled();
    expect((await store.events(task.id)).map((e) => e.type)).toEqual([
      "evidence_added",
    ]);
  });
  it("normalizes duplicate manual URLs and enforces the task domain policy", async () => {
    const t = await createTask(store, { domains: ["example.com"] });
    await source(t.id, "https://example.com/evidence#one");
    const duplicate = await request(app)
      .post(`/api/tasks/${t.id}/sources`)
      .send({ url: "https://example.com/evidence#two" });
    expect(duplicate.status).toBe(200);
    expect((await store.get(t.id))?.sources).toHaveLength(1);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/sources`)
          .send({ url: "https://outside.com" })
      ).status,
    ).toBe(400);
  });
  it("requires explicit opt-in before keyless extraction is available", async () => {
    const t = await createTask(store);
    const s = await source(t.id);
    const r = await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .send({ sourceId: s.id });
    expect(r.status).toBe(409);
    expect((await store.get(t.id))?.spentMicros).toBe(0);
  });
  it("omits Authorization for the documented keyless tier and records zero USD estimates plus provider credit usage", async () => {
    config.allowKeylessFirecrawl = true;
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            markdown: "Real format fixture text",
            metadata: { creditsUsed: 1 },
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    const s = await source(t.id);
    const r = await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .send({ sourceId: s.id });
    expect(r.status).toBe(200);
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
    expect(await store.get(t.id)).toMatchObject({
      spentMicros: 0,
      reservedMicros: 0,
    });
    const ledger = (await store.events(t.id)).find(
      (e) => e.type === "budget_settled",
    )!;
    expect(ledger.data).toMatchObject({
      authMode: "keyless",
      chargeType: "free-tier",
      billingStatus: "keyless-free-tier",
      estimateMicros: 0,
    });
    expect(
      (await store.events(t.id)).find((e) => e.type === "provider_response")
        ?.data.usage.credits,
    ).toBe(1);
  });
  it("stops after a keyless refusal rather than retrying the quota/auth boundary", async () => {
    config.allowKeylessFirecrawl = true;
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 429 }));
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    const s = await source(t.id);
    await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .send({ sourceId: s.id });
    expect(engine.keylessBlocked).toBe(true);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/fetch`)
          .send({ sourceId: s.id })
      ).status,
    ).toBe(409);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(engine.available().firecrawl).toBe(false);
  });
  it("applies a separate session cap to free keyless requests", async () => {
    config.allowKeylessFirecrawl = true;
    config.keylessMaxRequests = 1;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { markdown: "Example content" },
          }),
        ),
      ),
    );
    const t = await createTask(store);
    const s = await source(t.id);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/fetch`)
          .send({ sourceId: s.id })
      ).status,
    ).toBe(200);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/fetch`)
          .send({ sourceId: s.id })
      ).status,
    ).toBe(409);
    expect(engine.keylessAttempts).toBe(1);
  });
  it("does not allow duplicate URLs to manufacture evidence coverage", () => {
    expect(
      coverage(
        Array.from({ length: 3 }, () => ({
          url: "https://example.com",
          snippet: "x".repeat(100),
        })),
      ),
    ).toMatchObject({
      pass: false,
      usable: 1,
      evaluator: "search-coverage-v2",
    });
  });
  it("rejects local addresses, embedded credentials, non-HTTPS URLs, ports and disallowed hosts", () => {
    for (const value of [
      "https://127.0.0.1",
      "https://[::1]",
      "https://localhost",
      "https://x.local",
      "http://example.com",
      "https://a:b@example.com",
      "https://example.com:8443",
    ])
      expect(() => publicEvidenceUrl(value)).toThrow();
    expect(
      publicEvidenceUrl("https://example.com/a#section", ["example.com"]),
    ).toBe("https://example.com/a");
  });
  it("invalidates accepted reviews that refer to changed supporting evidence", async () => {
    config.allowKeylessFirecrawl = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { markdown: "Updated supporting evidence" },
          }),
        ),
      ),
    );
    const t = await createTask(store);
    const first = await source(t.id, "https://example.com/funding");
    const second = await source(t.id, "https://example.com/product");
    const fresh = (await store.get(t.id))!;
    fresh.assessments = [
      {
        sourceId: first.id,
        organization: "Example",
        criteria: { Active: "pass", Funded: "pass", Relevant: "pass" },
        disposition: "accepted",
        note: "Old source review",
        evidence: {
          Active: [second.id],
          Funded: [first.id],
          Relevant: [second.id],
        },
      },
    ];
    await store.save(fresh);
    await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .send({ sourceId: second.id });
    const after = (await store.get(t.id))!;
    expect(after.assessments[0]).toMatchObject({
      disposition: "pending",
      criteria: { Active: "unknown", Funded: "pass", Relevant: "unknown" },
    });
    expect(after.sources[1].contentVersion).toBe(2);
    expect(
      (await store.events(t.id)).some(
        (e) => e.type === "assessment_invalidated",
      ),
    ).toBe(true);
  });
  it("rejects stale evidence versions before accepting a company", async () => {
    const t = await createTask(store);
    const s = await source(t.id);
    const current = (await store.get(t.id))!;
    current.sources[0].contentVersion = 2;
    await store.save(current);
    const payload = {
      sourceId: s.id,
      organization: "Example",
      criteria: { Active: "pass", Funded: "pass", Relevant: "pass" },
      disposition: "accepted",
      note: "Evidence review",
      evidenceVersions: { [s.id]: 1 },
    };
    expect(
      (await request(app).post(`/api/tasks/${t.id}/assessments`).send(payload))
        .status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/assessments`)
          .send({ ...payload, evidenceVersions: { [s.id]: 2 } })
      ).status,
    ).toBe(200);
  });
});
