import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { startPolling } from "../src/polling";
let doc: EventTarget & { hidden: boolean };
beforeEach(() => {
  vi.useFakeTimers();
  doc = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal("document", doc);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("waits for slow responses before scheduling another refresh", async () => {
  let release!: () => void;
  const task = vi.fn(
    () =>
      new Promise<void>((r) => {
        release = r;
      }),
  );
  const stop = startPolling(task, 5000);
  await vi.advanceTimersByTimeAsync(1);
  await vi.advanceTimersByTimeAsync(14000);
  expect(task).toHaveBeenCalledTimes(1);
  release();
  await vi.advanceTimersByTimeAsync(4999);
  expect(task).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(task).toHaveBeenCalledTimes(2);
  stop();
  release();
});
it("pauses hidden tabs, resumes on visibility, and cancels cleanly", async () => {
  const task = vi.fn(async () => {}),
    stop = startPolling(task, 5000);
  await vi.advanceTimersByTimeAsync(1);
  expect(task).toHaveBeenCalledTimes(1);
  doc.hidden = true;
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(15000);
  expect(task).toHaveBeenCalledTimes(1);
  doc.hidden = false;
  doc.dispatchEvent(new Event("visibilitychange"));
  await vi.advanceTimersByTimeAsync(0);
  expect(task).toHaveBeenCalledTimes(2);
  stop();
  await vi.advanceTimersByTimeAsync(20000);
  expect(task).toHaveBeenCalledTimes(2);
});

it("continues refreshing after a loader rejects so a temporary outage can recover", async () => {
  const task = vi
    .fn()
    .mockRejectedValueOnce(new Error("Temporary outage"))
    .mockResolvedValue(undefined);
  const stop = startPolling(task, 5000);
  await vi.advanceTimersByTimeAsync(0);
  expect(task).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(5000);
  expect(task).toHaveBeenCalledTimes(2);
  stop();
  await vi.advanceTimersByTimeAsync(10000);
  expect(task).toHaveBeenCalledTimes(2);
});
