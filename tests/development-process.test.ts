import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, it } from "vitest";
import {
  assertPortAvailable,
  waitForDevelopmentApi,
} from "../scripts/development-process.mjs";

const servers: Server[] = [];
const directories: string[] = [];
async function server(ready: () => boolean = () => true) {
  const instance = createServer((_request, response) => {
    response.writeHead(ready() ? 200 : 503, {
      "Content-Type": "application/json",
    });
    response.end(JSON.stringify({ ok: ready() }));
  });
  servers.push(instance);
  instance.listen(0, "127.0.0.1");
  await once(instance, "listening");
  return (instance.address() as { port: number }).port;
}
afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (instance) =>
          new Promise<void>((resolve) => instance.close(() => resolve())),
      ),
  );
  await Promise.all(
    directories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

it("refuses an occupied API port before checking another runtime's health", async () => {
  const port = await server();
  await expect(assertPortAvailable(port)).rejects.toThrow("already in use");
});

it("waits until startup health succeeds", async () => {
  let ready = false;
  const port = await server(() => ready);
  const gate = waitForDevelopmentApi(
    port,
    new Promise<number>(() => {}),
    undefined,
    1000,
  );
  setTimeout(() => {
    ready = true;
  }, 30);
  await expect(gate).resolves.toBeUndefined();
});

it("fails with migration guidance when an API watcher remains alive without a healthy API", async () => {
  const port = await server(() => false);
  const watcher = spawn(
    process.execPath,
    ["-e", "setInterval(() => {}, 1000)"],
    { stdio: "ignore" },
  );
  const exited = new Promise<number>((resolve) =>
    watcher.once("exit", (code) => resolve(code ?? 1)),
  );
  try {
    await expect(
      waitForDevelopmentApi(port, exited, undefined, 60),
    ).rejects.toThrow("npm run db:migrate:dev");
    expect(watcher.exitCode).toBeNull();
  } finally {
    watcher.kill("SIGTERM");
    await exited;
  }
});

it("rejects immediate API exit and startup interruption", async () => {
  const port = await server(() => false);
  await expect(waitForDevelopmentApi(port, Promise.resolve(1))).rejects.toThrow(
    "exited before becoming ready",
  );
  const controller = new AbortController();
  controller.abort();
  await expect(
    waitForDevelopmentApi(
      port,
      new Promise<number>(() => {}),
      controller.signal,
    ),
  ).rejects.toThrow("interrupted");
});

it.each([
  ["SIGINT", 130],
  ["SIGTERM", 143],
] as const)(
  "reports interrupted migrations as %s rather than success",
  async (signal, expected) => {
    const root = fileURLToPath(new URL("../", import.meta.url));
    const directory = await mkdtemp(join(tmpdir(), "two-hands-launcher-"));
    directories.push(directory);
    await Promise.all([
      mkdir(join(directory, "scripts")),
      mkdir(join(directory, "server")),
    ]);
    await Promise.all([
      ...[
        "development.mjs",
        "development-env.mjs",
        "development-process.mjs",
        "environment-projects.mjs",
      ].map((file) =>
        copyFile(join(root, "scripts", file), join(directory, "scripts", file)),
      ),
      copyFile(join(root, ".env.example"), join(directory, ".env.example")),
      symlink(
        join(root, "node_modules"),
        join(directory, "node_modules"),
        "dir",
      ),
      writeFile(join(directory, "package.json"), '{"type":"module"}'),
      writeFile(
        join(directory, "server/database-cli.ts"),
        'console.log("migration-started"); setInterval(() => {}, 1000);',
      ),
    ]);
    const template = await readFile(
      join(root, ".env.development.example"),
      "utf8",
    );
    await writeFile(
      join(directory, ".env.development.local"),
      template
        .replace(
          "DEVELOPMENT_SUPABASE_PROJECT_REF=",
          "DEVELOPMENT_SUPABASE_PROJECT_REF=abcdefghijklmnopqrst",
        )
        .replace(
          "DATABASE_URL=",
          "DATABASE_URL=postgresql://postgres.abcdefghijklmnopqrst:fixture@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
        )
        .replace(
          "SUPABASE_URL=",
          "SUPABASE_URL=https://abcdefghijklmnopqrst.supabase.co",
        )
        .replace(
          "SUPABASE_PUBLISHABLE_KEY=",
          "SUPABASE_PUBLISHABLE_KEY=sb_publishable_fixture",
        )
        .replace(
          "LEGACY_WORKSPACE_ID=",
          "LEGACY_WORKSPACE_ID=f75b258f-1d70-450d-9554-129b658b4d3e",
        ),
    );
    const child = spawn(
      process.execPath,
      [join(directory, "scripts/development.mjs"), "migrate"],
      { cwd: directory, stdio: ["ignore", "pipe", "pipe"] },
    );
    const closed = new Promise<number | null>((resolve) =>
      child.once("close", (code) => resolve(code)),
    );
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Fixture migration did not start")),
          5000,
        );
        child.stdout.on("data", (chunk) => {
          if (chunk.toString().includes("migration-started")) {
            clearTimeout(timeout);
            resolve();
          }
        });
        child.once("exit", () => {
          clearTimeout(timeout);
          reject(new Error("Fixture exited early"));
        });
      });
      child.kill(signal);
      expect(await closed).toBe(expected);
    } finally {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGTERM");
      await closed;
    }
  },
  10000,
);
