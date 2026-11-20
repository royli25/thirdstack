import { describe, it, expect } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Store } from "../server/store";
import { createTask } from "./helpers";
describe("single-process workspace ownership", () => {
  it("blocks a second database owner instead of recovering another live server’s tasks", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apilayer-lock-"));
    const path = join(dir, "workspace.sqlite");
    const first = new Store(path);
    try {
      const task = await createTask(first);
      expect(() => new Store(path)).toThrow("already in use");
      expect((await first.get(task.id))?.status).toBe("running");
    } finally {
      await first.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("releases ownership on close and preserves state for restart recovery", async () => {
    const dir = mkdtempSync(join(tmpdir(), "apilayer-reopen-"));
    const path = join(dir, "workspace.sqlite");
    try {
      const first = new Store(path);
      const task = await createTask(first);
      await first.close();
      const second = new Store(path);
      await second.recover();
      expect((await second.get(task.id))?.status).toBe("partial");
      await second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
