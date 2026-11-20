import { availability } from "./helpers";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { createApp } from "../server/app";
import { Engine } from "../server/engine";
import { Store } from "../server/store";
import { config } from "../server/config";
import { createTask, intent } from "./helpers";
let store: Store;
let engine: Engine;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  store = new Store(":memory:");
  engine = new Engine(store);
  app = createApp(store, engine);
});
afterEach(async () => {
  await store.close();
  vi.restoreAllMocks();
});
describe("workspace API", () => {
  it("validates task contracts and records explicit intent before paid execution", async () => {
    const bad = await request(app)
      .post("/api/tasks")
      .send({ ...intent, budgetMicros: -1 });
    expect(bad.status).toBe(400);
    const good = await request(app).post("/api/tasks").send(intent);
    expect(good.status).toBe(201);
    expect(good.body.status).toBe("ready");
    expect((await store.events(good.body.id))[0].type).toBe("intent_created");
  });
  it("blocks live execution when credentials are missing", async () => {
    vi.spyOn(engine, "available").mockReturnValue(availability(false));
    const t = await createTask(store);
    const r = await request(app).post(`/api/tasks/${t.id}/run`).send({});
    expect(r.status).toBe(409);
    expect(r.body.error).toContain("API_KEY");
    expect(await store.events(t.id)).toHaveLength(0);
  });
  it("rejects duplicate in-flight operations", async () => {
    const t = await createTask(store);
    engine.active.add(t.id);
    expect(
      (await request(app).post(`/api/tasks/${t.id}/run`).send({})).status,
    ).toBe(409);
  });
  it("requires JSON and rejects cross-origin writes", async () => {
    expect(
      (await request(app).post("/api/tasks").type("form").send("x=y")).status,
    ).toBe(415);
    expect(
      (
        await request(app)
          .post("/api/tasks")
          .set("Origin", "https://evil.example")
          .send(intent)
      ).status,
    ).toBe(403);
  });
  it("enforces workspace bearer auth without leaking token values", async () => {
    const old = config.token;
    config.token = "test-token";
    try {
      expect((await request(app).get("/api/tasks")).status).toBe(401);
      expect(
        (
          await request(app)
            .get("/api/tasks")
            .set("Authorization", "Bearer test-token")
        ).status,
      ).toBe(200);
    } finally {
      config.token = old;
    }
  });
  it("does not accept an organization with unknown criteria or without evidence notes", async () => {
    const t = await createTask(store);
    const sourceId = randomUUID();
    t.sources.push({
      id: sourceId,
      title: "Evidence",
      url: "https://example.com",
      snippet: "Evidence",
      provider: "exa",
      callId: "c1",
    });
    await store.save(t);
    const r = await request(app)
      .post(`/api/tasks/${t.id}/assessments`)
      .send({
        sourceId,
        organization: "Test",
        criteria: { Active: "pass", Funded: "unknown", Relevant: "pass" },
        disposition: "accepted",
        note: "Evidence noted",
      });
    expect(r.status).toBe(400);
  });
  it("exports an allowlisted summary without prompts, URLs, payloads or reviewer notes", async () => {
    const t = await createTask(store);
    await store.event(t.id, "provider_request", {
      provider: "exa",
      arguments: { query: "private company strategy" },
    });
    await store.event(t.id, "provider_response", {
      provider: "exa",
      httpStatus: 200,
      returnedRefs: ["https://sensitive.example"],
      secret: "key",
    });
    await store.event(t.id, "user_feedback", {
      note: "private reviewer note",
      organization: "secret org",
    });
    const r = await request(app).get(`/api/tasks/${t.id}/export`);
    expect(r.status).toBe(200);
    const json = JSON.stringify(r.body);
    for (const value of [
      "private company",
      "sensitive.example",
      "private reviewer",
      "secret org",
      t.intent.prompt,
    ])
      expect(json).not.toContain(value);
    expect(json).toContain("httpStatus");
  });
  it("returns usage without a cohort gate while excluding nonconsenting tasks", async () => {
    for (let i = 0; i < 10; i++) await createTask(store);
    expect((await request(app).get("/api/analytics")).body).toMatchObject({
      suppressed: false,
      cohortSize: 0,
      minCohort: 0,
    });
    for (let i = 0; i < 5; i++) await createTask(store, { consent: true });
    const r = await request(app).get("/api/analytics");
    expect(r.body.suppressed).toBe(false);
    expect(
      r.body.providers.every(
        (p: any) => !p.suppressed && p.calls === 0 && p.latencyMs === null,
      ),
    ).toBe(true);
    expect(JSON.stringify(r.body)).not.toContain(intent.query);
  });
  it("never reflects malformed request bodies as internal stack traces", async () => {
    const r = await request(app).post("/api/tasks").type("json").send("{");
    expect(r.status).toBe(400);
    expect(r.body).toEqual({ error: "Invalid JSON" });
  });
});
