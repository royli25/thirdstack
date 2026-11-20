import { afterEach, expect, it, vi } from "vitest";
import { api, setAccountSession, setPreviewRole } from "../src/api";
afterEach(() => {
  setPreviewRole(null);
  setAccountSession("", "");
  vi.unstubAllGlobals();
});
it("deduplicates simultaneous reads but never caches completed reads or writes", async () => {
  const resolvers: Array<(value: Response) => void> = [];
  const fetch = vi.fn(() => new Promise<Response>((r) => resolvers.push(r)));
  vi.stubGlobal("fetch", fetch);
  setAccountSession("fixture-token", "fixture-user");
  const first = api("/account/usage"),
    second = api("/account/usage");
  expect(fetch).toHaveBeenCalledTimes(1);
  resolvers[0](new Response('{"requests":1}'));
  expect(await first).toEqual(await second);
  const next = api("/account/usage");
  expect(fetch).toHaveBeenCalledTimes(2);
  resolvers[1](new Response("{}"));
  await next;
  const a = api("/observations", { title: "a" }),
    b = api("/observations", { title: "b" });
  expect(fetch).toHaveBeenCalledTimes(4);
  resolvers[2](new Response('{"created":"a"}'));
  resolvers[3](new Response('{"created":"b"}'));
  expect(await a).toEqual({ created: "a" });
  expect(await b).toEqual({ created: "b" });
});
it("keeps pending reads separate across account and preview changes", async () => {
  const resolvers: Array<(value: Response) => void> = [];
  const fetch = vi.fn(() => new Promise<Response>((r) => resolvers.push(r)));
  vi.stubGlobal("fetch", fetch);
  setAccountSession("token-a", "a");
  const old = api("/account/usage");
  setAccountSession("token-b", "b");
  const current = api("/account/usage");
  resolvers[0](new Response('{"owner":"a"}'));
  await expect(old).rejects.toThrow(/Account changed/);
  resolvers[1](new Response('{"owner":"b"}'));
  expect(await current).toEqual({ owner: "b" });
  const normal = api("/account/routing");
  setPreviewRole("user");
  const preview = api("/account/routing");
  expect(fetch).toHaveBeenCalledTimes(4);
  resolvers[2](new Response("{}"));
  await expect(normal).rejects.toThrow(/Account changed/);
  resolvers[3](new Response("{}"));
  await preview;
});

it("lets a failed shared read be retried instead of reusing its rejection", async () => {
  const fetch = vi
    .fn()
    .mockRejectedValueOnce(new TypeError("Network unavailable"))
    .mockResolvedValueOnce(new Response('{"requests":2}'));
  vi.stubGlobal("fetch", fetch);
  setAccountSession("retry-token", "retry-user");
  const first = api("/account/usage"),
    concurrent = api("/account/usage");
  await expect(first).rejects.toThrow("Network unavailable");
  await expect(concurrent).rejects.toThrow("Network unavailable");
  expect(fetch).toHaveBeenCalledTimes(1);
  await expect(api("/account/usage")).resolves.toEqual({ requests: 2 });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it("does not reuse a pre-mutation read or let it evict a newer pending read", async () => {
  const resolvers: Array<(value: Response) => void> = [];
  const fetch = vi.fn(() => new Promise<Response>((r) => resolvers.push(r)));
  vi.stubGlobal("fetch", fetch);
  setAccountSession("mutation-token", "mutation-user");
  const old = api("/account/routing");
  const mutation = api("/account/routing", { disabledTools: [] });
  resolvers[1](new Response('{"saved":true}'));
  await mutation;
  const fresh = api("/account/routing");
  expect(fetch).toHaveBeenCalledTimes(3);
  resolvers[0](new Response('{"revision":0}'));
  await old;
  const concurrent = api("/account/routing");
  expect(fetch).toHaveBeenCalledTimes(3);
  resolvers[2](new Response('{"revision":1}'));
  await expect(fresh).resolves.toEqual({ revision: 1 });
  await expect(concurrent).resolves.toEqual({ revision: 1 });
});
