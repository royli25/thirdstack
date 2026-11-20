import { afterEach, beforeEach, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
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
import { join, resolve } from "node:path";
const run = promisify(execFile);
let directory: string;
const build = resolve("scripts/build-release-manifest.mjs"),
  verify = resolve("scripts/verify-release-artifact.mjs");
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "octolab-release-assets-"));
  for (const name of ["build", "dist", "supabase/migrations", "scripts"])
    await mkdir(join(directory, name), { recursive: true });
  for (const [name, data] of Object.entries({
    "build/index.js": "export {};",
    "dist/index.html": "<!doctype html>",
    "supabase/migrations/20260101000000_fixture.sql": "SELECT 1;",
    "package.json": '{"version":"0.0.0"}',
    "package-lock.json": "{}",
    "scripts/migrate-production.mjs": "export {};",
    "scripts/environment-projects.mjs": "export {};",
    ".env": "API_TOKEN=SECRET_DO_NOT_PACKAGE",
  }))
    await writeFile(join(directory, name), data);
  await copyFile(
    verify,
    join(directory, "scripts/verify-release-artifact.mjs"),
  );
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});
const generate = () =>
  run(process.execPath, [build], {
    cwd: directory,
    env: { ...process.env, SOURCE_REVISION: "a".repeat(40) },
  });
const check = () => run(process.execPath, [verify], { cwd: directory });
it("verifies packaged code, client, migration assets and runtime package metadata without including local credentials", async () => {
  await generate();
  expect((await check()).stdout).toContain("1 migrations");
  const text = await readFile(join(directory, "release-manifest.json"), "utf8"),
    manifest = JSON.parse(text);
  expect(manifest.sourceRevision).toBe("a".repeat(40));
  expect(manifest.files).toHaveProperty("package-lock.json");
  expect(manifest.files).toHaveProperty("build/index.js");
  expect(manifest.files).toHaveProperty("scripts/migrate-production.mjs");
  expect(text).not.toContain("SECRET_DO_NOT_PACKAGE");
  expect(text).not.toContain('".env"');
});
it("rejects missing migrations, modified runtime code and unrecorded executable assets", async () => {
  await generate();
  await rm(join(directory, "supabase/migrations/20260101000000_fixture.sql"));
  await expect(check()).rejects.toThrow();
  await writeFile(
    join(directory, "supabase/migrations/20260101000000_fixture.sql"),
    "SELECT 1;",
  );
  await writeFile(join(directory, "build/index.js"), "changed");
  await expect(check()).rejects.toThrow();
  await generate();
  await writeFile(join(directory, "build/unexpected.js"), "export {};");
  await expect(check()).rejects.toThrow();
});
it("refuses symbolic links in release asset directories", async () => {
  await symlink(join(directory, ".env"), join(directory, "build/leaked-env"));
  await expect(generate()).rejects.toThrow();
});
