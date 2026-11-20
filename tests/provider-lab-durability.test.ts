import { it, expect } from "vitest";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Store } from "../server/store";
import { ProviderLab } from "../server/provider-lab";
it("recovers an actual killed lab process without repeating a provider request", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apilayer-lab-crash-"));
  const path = join(dir, "workspace.sqlite");
  const child = spawn(
    process.execPath,
    ["--import", "tsx", resolve("tests/fixtures/provider-lab-crash.ts")],
    {
      env: { ...process.env, CRASH_TEST_DB: path },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let store: Store | undefined;
  try {
    const id = await new Promise<string>((resolve, reject) => {
      let buffer = "";
      const timeout = setTimeout(
        () => reject(new Error("Fixture did not reserve a provider call")),
        5000,
      );
      child.stdout.on("data", (chunk) => {
        buffer += chunk;
        try {
          const data = JSON.parse(buffer.split("\n")[0]);
          if (data.ready) {
            clearTimeout(timeout);
            resolve(data.id);
          }
        } catch {}
      });
      child.once("error", (e) => {
        clearTimeout(timeout);
        reject(e);
      });
    });
    const exit = new Promise<void>((resolve) =>
      child.once("exit", () => resolve()),
    );
    child.kill("SIGKILL");
    await exit;
    store = new Store(path);
    let requests = 0;
    const lab = new ProviderLab(store, {
      search: async () => {
        requests++;
        return { httpStatus: 200, sources: [] };
      },
      scrape: async () => {
        requests++;
        return { httpStatus: 200, text: "Unexpected retry" };
      },
    });
    expect((await lab.get(id)).reservedMicros).toBe(1000);
    await lab.recover();
    await lab.recover();
    const replay = await lab.start({
      requestKey: "crash-fixture",
      providers: ["firecrawl"],
    });
    expect(replay).toMatchObject({
      id,
      status: "interrupted",
      reservedMicros: 0,
      spentMicros: 1000,
    });
    expect(replay.calls[0].status).toBe("interrupted");
    expect(replay.calls.slice(1).every((c) => c.status === "skipped")).toBe(
      true,
    );
    expect(requests).toBe(0);
    expect(await lab.summaries()).toHaveLength(1);
  } finally {
    child.kill("SIGKILL");
    await store?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
