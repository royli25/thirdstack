import { beforeEach, afterEach, describe, it, expect } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Engine } from "../server/engine";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { analytics } from "../server/analytics";
import { createTask } from "./helpers";
let store: Store;
let engine: Engine;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  store = new Store(":memory:");
  engine = new Engine(store);
  app = createApp(store, engine);
});
afterEach(async () => await store.close());
describe("consent withdrawal and deletion", () => {
  it("withdraws a task from aggregate reporting immediately and records its changed consent scope", async () => {
    const task = await createTask(store, { consent: true });
    for (let i = 0; i < 4; i++) await createTask(store, { consent: true });
    expect((await analytics(store)).suppressed).toBe(false);
    const result = await request(app)
      .post(`/api/tasks/${task.id}/privacy`)
      .send({ consent: false });
    expect(result.status).toBe(200);
    expect(await analytics(store)).toMatchObject({
      suppressed: false,
      cohortSize: 4,
    });
    expect((await store.events(task.id)).at(-1)?.data).toMatchObject({
      consent: false,
      scope: "local task storage only",
    });
  });
  it("allows immediate withdrawal during a running operation without cancelling billing reconciliation", async () => {
    const task = await createTask(store, { consent: true });
    engine.active.add(task.id);
    await engine.reserve(task.id, "exa", "reserved", "research.search", {});
    expect(
      (
        await request(app)
          .post(`/api/tasks/${task.id}/privacy`)
          .send({ consent: false })
      ).status,
    ).toBe(200);
    expect(await store.get(task.id)).toMatchObject({
      reservedMicros: config.prices.exa,
      intent: { consent: false },
    });
  });
  it("requires an exact confirmation and blocks deletion while a request is active or reserved", async () => {
    const task = await createTask(store);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${task.id}/delete`)
          .send({ confirmTaskId: "other" })
      ).status,
    ).toBe(400);
    engine.active.add(task.id);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${task.id}/delete`)
          .send({ confirmTaskId: task.id })
      ).status,
    ).toBe(409);
    engine.active.delete(task.id);
    await engine.reserve(task.id, "exa", "pending", "research.search", {});
    expect(
      (
        await request(app)
          .post(`/api/tasks/${task.id}/delete`)
          .send({ confirmTaskId: task.id })
      ).status,
    ).toBe(409);
    expect(await store.get(task.id)).toBeDefined();
  });
  it("deletes the selected task and all its events without deleting another session", async () => {
    const deleted = await createTask(store, { consent: true });
    const kept = await createTask(store);
    await store.event(deleted.id, "intent_created", {
      prompt: "private content",
    });
    await store.beginReceipt(
      deleted.id,
      "research.search",
      "delete-receipt",
      "hash",
    );
    await store.finishReceipt(
      deleted.id,
      "research.search",
      "delete-receipt",
      202,
      {
        taskId: deleted.id,
      },
    );
    await store.event(kept.id, "intent_created", { prompt: "other content" });
    expect(
      (
        await request(app)
          .post(`/api/tasks/${deleted.id}/delete`)
          .send({ confirmTaskId: deleted.id })
      ).status,
    ).toBe(200);
    expect(await store.get(deleted.id)).toBeUndefined();
    expect(
      await store.receipt(deleted.id, "research.search", "delete-receipt"),
    ).toBeUndefined();
    expect(await store.events(deleted.id)).toEqual([]);
    expect(await store.get(kept.id)).toBeDefined();
    expect(await store.events(kept.id)).toHaveLength(1);
    expect((await request(app).get(`/api/tasks/${deleted.id}`)).status).toBe(
      404,
    );
  });
});
