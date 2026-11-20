import { afterEach, beforeEach, expect, it } from "vitest";
import {
  mkdtemp,
  mkdir,
  copyFile,
  readFile,
  writeFile,
  readdir,
  stat,
  rm,
} from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const execute = promisify(execFile);
let directory: string, script: string, configPath: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "apilayer-installer-"));
  await mkdir(join(directory, "scripts"));
  await mkdir(join(directory, "build"));
  script = join(directory, "scripts/install-mcp.mjs");
  configPath = join(directory, ".mcp.json");
  await copyFile(resolve("scripts/install-mcp.mjs"), script);
  await writeFile(
    join(directory, "build/mcp-stdio.js"),
    "// Synthetic installer fixture\n",
  );
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});
it("preserves other servers and APILayer environment settings, protects backups, and is repeatable", async () => {
  const initial = {
    preferences: { keep: true },
    mcpServers: {
      other: { command: "other-tool", env: { TOKEN: "synthetic-secret" } },
      apilayer: {
        command: "old-node",
        args: ["old-path"],
        env: { APILAYER_URL: "http://127.0.0.1:3999/api" },
        disabledTools: ["synthetic-tool"],
      },
    },
  };
  await writeFile(configPath, JSON.stringify(initial), { mode: 0o644 });
  const first = await execute(process.execPath, [script, "project"]);
  expect(first.stdout).not.toContain("synthetic-secret");
  const parsed = JSON.parse(await readFile(configPath, "utf8"));
  expect(parsed.preferences).toEqual(initial.preferences);
  expect(parsed.mcpServers.other).toEqual(initial.mcpServers.other);
  expect(parsed.mcpServers.apilayer.env).toEqual(
    initial.mcpServers.apilayer.env,
  );
  expect(parsed.mcpServers.apilayer.disabledTools).toEqual(
    initial.mcpServers.apilayer.disabledTools,
  );
  expect(parsed.mcpServers.apilayer.command).toBe(process.execPath);
  const backups = (await readdir(directory)).filter((f) =>
    f.startsWith(".mcp.json.backup-"),
  );
  expect(backups).toHaveLength(1);
  expect((await stat(configPath)).mode & 0o777).toBe(0o600);
  expect((await stat(join(directory, backups[0]))).mode & 0o777).toBe(0o600);
  expect(
    JSON.parse(await readFile(join(directory, backups[0]), "utf8")),
  ).toEqual(initial);
  const second = await execute(process.execPath, [script, "project"]);
  expect(second.stdout).toContain("already configured");
  expect(
    (await readdir(directory)).filter((f) => f.startsWith(".mcp.json.backup-")),
  ).toHaveLength(1);
});
it("leaves malformed configuration untouched", async () => {
  for (const content of [
    "{invalid",
    "[]",
    '{"mcpServers":[]}',
    '{"mcpServers":{"apilayer":[]}}',
  ]) {
    await writeFile(configPath, content);
    await expect(
      execute(process.execPath, [script, "project"]),
    ).rejects.toThrow();
    expect(await readFile(configPath, "utf8")).toBe(content);
  }
  expect(
    (await readdir(directory)).filter((f) => f.includes("backup")),
  ).toHaveLength(0);
});
