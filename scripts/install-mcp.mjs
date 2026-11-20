import { readFile, writeFile, mkdir, copyFile, chmod } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const entry = join(root, "build/mcp-stdio.js");
const target = process.argv[2] || "all";
if (target === "--help") {
  console.log(
    "npm run mcp:install -- [all|claude|codex|project]\nConfigures a local stdio MCP bridge. Run npm run build first. Existing settings are preserved and changed files are backed up. Does not change tool approval policies.",
  );
  process.exit(0);
}
if (!["all", "claude", "codex", "project"].includes(target))
  throw new Error(
    "Choose all, claude, codex, or project. Use --help for details.",
  );
await readFile(entry);
const server = {
  command: process.execPath,
  args: [`--env-file-if-exists=${join(root, ".env")}`, entry],
};
async function merge(file) {
  let data = {},
    original;
  try {
    original = await readFile(file, "utf8");
    data = JSON.parse(original);
  } catch (e) {
    if (e.code !== "ENOENT") throw e;
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(`Expected a JSON object in ${file}; left unchanged.`);
  if (
    data.mcpServers &&
    (typeof data.mcpServers !== "object" || Array.isArray(data.mcpServers))
  )
    throw new Error(`Invalid mcpServers in ${file}; left unchanged.`);
  const previous = data.mcpServers?.apilayer;
  if (previous && (typeof previous !== "object" || Array.isArray(previous)))
    throw new Error(`Invalid APILayer entry in ${file}; left unchanged.`);
  const merged = { ...previous, ...server };
  if (JSON.stringify(previous) === JSON.stringify(merged)) {
    console.log(`APILayer already configured in ${file}`);
    return;
  }
  data.mcpServers = { ...data.mcpServers, apilayer: merged };
  await mkdir(dirname(file), { recursive: true });
  if (original !== undefined) {
    const backup = `${file}.backup-${Date.now()}`;
    await copyFile(file, backup);
    await chmod(backup, 0o600);
  }
  await writeFile(file, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
  await chmod(file, 0o600);
  console.log(`Configured APILayer in ${file}`);
}
if (["all", "claude", "project"].includes(target))
  await merge(join(root, ".mcp.json"));
if (["all", "claude"].includes(target) && process.platform === "darwin")
  await merge(
    join(
      homedir(),
      "Library/Application Support/Claude/claude_desktop_config.json",
    ),
  );
if (["all", "codex"].includes(target)) {
  const probe = spawnSync("codex", ["--version"], { encoding: "utf8" });
  if (probe.error?.code === "ENOENT") {
    if (target === "codex")
      throw new Error(
        "Codex CLI is not on PATH. Install or open Codex, then rerun this command.",
      );
    console.log("Codex CLI not on PATH; skipped Codex configuration.");
  } else {
    if (probe.status !== 0)
      throw new Error(
        "Codex CLI did not start successfully; no Codex configuration was changed.",
      );
    const configured = spawnSync(
      "codex",
      ["mcp", "get", "apilayer", "--json"],
      { encoding: "utf8" },
    );
    let existing;
    try {
      existing = JSON.parse(configured.stdout);
    } catch {}
    const same =
      existing?.transport?.command === server.command &&
      JSON.stringify(existing?.transport?.args) === JSON.stringify(server.args);
    if (same) {
      console.log(
        "APILayer is already configured in Codex; existing tool approvals were preserved.",
      );
      if (existing.enabled === false)
        console.log(
          "The existing APILayer entry is disabled in Codex. Its disabled setting was preserved.",
        );
    } else {
      if (existing)
        throw new Error(
          "APILayer already has a different Codex registration. It was left unchanged to preserve its environment and tool approvals. Inspect codex mcp get apilayer before updating it.",
        );
      const file = join(
        process.env.CODEX_HOME || join(homedir(), ".codex"),
        "config.toml",
      );
      try {
        const backup = `${file}.backup-${Date.now()}`;
        await copyFile(file, backup);
        await chmod(backup, 0o600);
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      const result = spawnSync(
        "codex",
        ["mcp", "add", "apilayer", "--", server.command, ...server.args],
        { encoding: "utf8" },
      );
      if (result.status !== 0)
        throw new Error(
          "Codex MCP registration failed. Existing configuration was backed up; inspect codex mcp list for details.",
        );
      console.log(
        "Configured APILayer in Codex. Start a new Codex session to load it.",
      );
    }
  }
}
console.log(
  "Keep npm start running. Restart Claude desktop, or enable APILayer in Claude Code. Host tool approvals remain in place. No API key values were copied into client configuration.",
);
