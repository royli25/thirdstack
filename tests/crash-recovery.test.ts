import { describe, it, expect } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { Store } from "../server/store";
import { intent } from "./helpers";
async function start(path: string): Promise<{
  child: ChildProcess;
  port: number;
}> {
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "tests/fixtures/crash-server.ts"],
    {
      env: { ...process.env, DB_PATH: path },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Crash fixture did not start"));
    }, 10000);
    child.once("message", (message: any) => {
      clearTimeout(timer);
      resolve({ child, port: message.port });
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`Crash fixture exited before ready (${code})`));
    });
  });
}
async function kill(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const stopped = once(child, "exit");
  child.kill("SIGKILL");
  await stopped;
}
describe("real process interruption recovery", () => {
  it("settles an in-flight estimate once, releases SQLite ownership and refuses to repeat the interrupted request", async () => {
    const dir = await mkdtemp(join(tmpdir(), "apilayer-crash-"));
    const path = join(dir, "workspace.sqlite");
    let child: ChildProcess | undefined;
    try {
      let instance = await start(path);
      child = instance.child;
      const base = `http://127.0.0.1:${instance.port}/api`;
      const created = await fetch(base + "/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intent),
      });
      expect(created.status).toBe(201);
      const task = await created.json();
      const key = "crash-recovery-operation-001";
      const accepted = await fetch(base + `/tasks/${task.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: "{}",
      });
      expect(accepted.status).toBe(202);
      const inFlight = await (await fetch(base + `/tasks/${task.id}`)).json();
      expect(inFlight.reservedMicros).toBeGreaterThan(0);
      expect(
        inFlight.events.filter((e: any) => e.type === "provider_request"),
      ).toHaveLength(1);
      await kill(child);
      child = undefined;
      const store = new Store(path);
      await store.recover();
      await store.recover();
      const recovered = (await store.get(task.id))!;
      expect(recovered).toMatchObject({
        status: "partial",
        spentMicros: inFlight.reservedMicros,
        reservedMicros: 0,
      });
      expect(
        (await store.events(task.id)).filter(
          (e) => e.type === "budget_settled",
        ),
      ).toHaveLength(1);
      expect(
        (await store.events(task.id)).some(
          (e) => e.type === "provider_interrupted",
        ),
      ).toBe(true);
      expect(
        await store.receipt(task.id, "research.search", key),
      ).toMatchObject({
        state: "interrupted",
        status: 409,
      });
      await store.close();
      instance = await start(path);
      child = instance.child;
      const retry = await fetch(
        `http://127.0.0.1:${instance.port}/api/tasks/${task.id}/run`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": key,
          },
          body: "{}",
        },
      );
      expect(retry.status).toBe(409);
      const after = await (
        await fetch(`http://127.0.0.1:${instance.port}/api/tasks/${task.id}`)
      ).json();
      expect(
        after.events.filter((e: any) => e.type === "provider_request"),
      ).toHaveLength(1);
      expect(after.spentMicros).toBe(inFlight.reservedMicros);
    } finally {
      if (child) await kill(child);
      await rm(dir, { recursive: true, force: true });
    }
  }, 20000);
});
