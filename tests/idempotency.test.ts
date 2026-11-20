import { availability } from "./helpers";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { Store } from "../server/store";
import { Engine } from "../server/engine";
import { createApp } from "../server/app";
import { config } from "../server/config";
import { createTask, providerResults } from "./helpers";
let store: Store;
let engine: Engine;
let app: ReturnType<typeof createApp>;
beforeEach(() => {
  store = new Store(":memory:");
  engine = new Engine(store);
  app = createApp(store, engine);
  vi.spyOn(engine, "available").mockReturnValue({
    ...availability(false),
    exa: true,
    tavily: true,
    firecrawl: true,
    jina: true,
  });
});
afterEach(async () => {
  await store.close();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const key = "operation-test-key-0001";
async function wait() {
  await vi.waitFor(() => expect(engine.active.size).toBe(0));
}
describe("paid-operation request receipts", () => {
  it("replays a completed search acceptance instead of invoking another provider", async () => {
    const fetch = vi.fn(
      async (input: unknown) =>
        new Response(
          JSON.stringify(
            providerResults(String(input).includes("exa") ? "exa" : "tavily"),
          ),
        ),
    );
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    const first = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({});
    expect(first.status).toBe(202);
    await wait();
    const replay = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({});
    expect(replay.status).toBe(202);
    expect(replay.body.replayed).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("returns an in-progress receipt for a duplicate rather than scheduling a second call", async () => {
    let release!: (r: Response) => void;
    let calledProvider: "exa" | "tavily" = "tavily";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (input: unknown) =>
          new Promise<Response>((r) => {
            calledProvider = String(input).includes("exa") ? "exa" : "tavily";
            release = r;
          }),
      ),
    );
    const t = await createTask(store);
    expect(
      (
        await request(app)
          .post(`/api/tasks/${t.id}/run`)
          .set("Idempotency-Key", key)
          .send({})
      ).status,
    ).toBe(202);
    const retry = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({});
    expect(retry.body).toMatchObject({ replayed: true, pending: true });
    release(new Response(JSON.stringify(providerResults(calledProvider))));
    await wait();
    expect(
      (await store.events(t.id)).filter((e) => e.type === "provider_request"),
    ).toHaveLength(1);
  });
  it("rejects reuse of a key with different normalized search arguments", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () => new Response(JSON.stringify(providerResults("tavily"))),
      ),
    );
    const t = await createTask(store);
    await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({ query: "first query" });
    await wait();
    const changed = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({ query: "different query" });
    expect(changed.status).toBe(409);
    expect(changed.body.error).toContain("different arguments");
  });
  it("returns the original extraction result without another vendor charge", async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            data: { markdown: "Extraction evidence" },
          }),
        ),
    );
    vi.stubGlobal("fetch", fetch);
    const t = await createTask(store);
    const source = await request(app)
      .post(`/api/tasks/${t.id}/sources`)
      .send({ url: "https://example.com" });
    const first = await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .set("Idempotency-Key", key)
      .send({ sourceId: source.body.id });
    expect(first.status).toBe(200);
    const again = await request(app)
      .post(`/api/tasks/${t.id}/fetch`)
      .set("Idempotency-Key", key)
      .send({ sourceId: source.body.id });
    expect(again.body).toMatchObject({ ok: true, replayed: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((await store.get(t.id))?.spentMicros).toBe(config.prices.firecrawl);
  });
  it("replays a failed extraction without a second charge or vendor request", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 500 }));
    vi.stubGlobal("fetch", fetch);
    const task = await createTask(store);
    const source = await request(app)
      .post(`/api/tasks/${task.id}/sources`)
      .send({ url: "https://example.com" });
    const path = `/api/tasks/${task.id}/fetch`;
    expect(
      (
        await request(app)
          .post(path)
          .set("Idempotency-Key", key)
          .send({ sourceId: source.body.id })
      ).status,
    ).toBe(400);
    const retry = await request(app)
      .post(path)
      .set("Idempotency-Key", key)
      .send({ sourceId: source.body.id });
    expect(retry.status).toBe(400);
    expect(retry.body.replayed).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect((await store.get(task.id))?.spentMicros).toBe(
      config.prices.firecrawl,
    );
  });
  it("does not resume an interrupted receipt after recovery", async () => {
    const t = await createTask(store);
    await store.beginReceipt(t.id, "research.search", key, "args-hash");
    await store.recover();
    expect(await store.receipt(t.id, "research.search", key)).toMatchObject({
      state: "interrupted",
      status: 409,
    });
    expect(engine.active.size).toBe(0);
  });
  it("rolls back a receipt and leaves no active job when persisting the operation fails", async () => {
    const t = await createTask(store);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    vi.spyOn(store, "save").mockImplementationOnce(() => {
      throw new Error("Fixture write failure");
    });
    const r = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", key)
      .send({});
    expect(r.status).toBe(500);
    expect(await store.receipt(t.id, "research.search", key)).toBeUndefined();
    expect(engine.active.size).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("validates identifier format before beginning any provider operation", async () => {
    const t = await createTask(store);
    const r = await request(app)
      .post(`/api/tasks/${t.id}/run`)
      .set("Idempotency-Key", "short")
      .send({});
    expect(r.status).toBe(400);
    expect(await store.events(t.id)).toHaveLength(0);
  });
});
