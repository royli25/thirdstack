import { describe, it, expect } from "vitest";
import { chooseTaskSnapshot } from "../src/task-state";
import type { TaskDetail } from "../src/api";
function snapshot(event: number, time: string, id = "task") {
  return {
    id,
    updatedAt: time,
    events: [{ id: event }],
    organizations: event === 1 ? [{ name: "Old acceptance" }] : [],
  } as TaskDetail;
}
describe("out-of-order workspace responses", () => {
  it("does not restore an old accepted result over a newer invalidation", () => {
    const current = snapshot(2, "2026-11-01T12:01:00Z");
    const stale = snapshot(1, "2026-11-01T12:00:00Z");
    expect(chooseTaskSnapshot(current, stale)).toBe(current);
    expect(chooseTaskSnapshot(stale, current)).toBe(current);
  });
  it("uses task update time when no additional event was written and still permits explicit session changes", () => {
    const current = snapshot(2, "2026-11-01T12:01:00Z");
    const stale = snapshot(2, "2026-11-01T12:00:00Z");
    expect(chooseTaskSnapshot(current, stale)).toBe(current);
    const other = snapshot(1, "2026-11-01T11:00:00Z", "other");
    expect(chooseTaskSnapshot(current, other)).toBe(other);
  });
});
