import { execFile } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, expect, it } from "vitest";

const run = promisify(execFile);
const project = "ofnpfrlklnhfusdpeant";
const password = "fixture-password-do-not-print";
const database = `postgresql://postgres.${project}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require`;
let directory: string;
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "twohands-production-migration-"));
  await mkdir(join(directory, "scripts"));
  await mkdir(join(directory, "build"));
  for (const file of ["migrate-production.mjs", "environment-projects.mjs"])
    await copyFile(resolve("scripts", file), join(directory, "scripts", file));
  await writeFile(join(directory, "package.json"), '{"type":"module"}');
  // This is a fake compiled CLI: the tests never import the database adapter.
  await writeFile(
    join(directory, "build/database-cli.js"),
    `import {writeFileSync} from "node:fs";
writeFileSync("child.json", JSON.stringify({args:process.argv.slice(2),env:process.env}));`,
  );
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});
async function invoke(overrides: Record<string, string | undefined> = {}) {
  return run(
    process.execPath,
    [join(directory, "scripts/migrate-production.mjs")],
    {
      cwd: directory,
      env: {
        PATH: process.env.PATH,
        PRODUCTION_MIGRATION_CONFIRM: "twohands.tech",
        PUBLIC_APP_URL: "https://twohands.tech",
        STORAGE_BACKEND: "postgres",
        DATABASE_URL: database,
        SUPABASE_URL: `https://${project}.supabase.co`,
        ...overrides,
      },
    },
  ).then(
    (result) => ({ code: 0, ...result }),
    (error: { code: number; stdout: string; stderr: string }) => error,
  );
}
async function expectRejected(overrides: Record<string, string | undefined>) {
  const result = await invoke(overrides);
  expect(result.code).toBe(1);
  expect(result.stderr).not.toContain(password);
  expect(result.stderr).not.toContain(database);
  await expect(readFile(join(directory, "child.json"))).rejects.toThrow();
}

it("requires an explicit production target and never loads a local dotenv file", async () => {
  await writeFile(
    join(directory, ".env"),
    `PRODUCTION_MIGRATION_CONFIRM=twohands.tech\nPUBLIC_APP_URL=https://twohands.tech\nSTORAGE_BACKEND=postgres\nDATABASE_URL=${database}\nSUPABASE_URL=https://${project}.supabase.co\n`,
  );
  await expectRejected({ PRODUCTION_MIGRATION_CONFIRM: undefined });
  await expectRejected({ PUBLIC_APP_URL: "http://127.0.0.1:5175" });
  await expectRejected({ STORAGE_BACKEND: "sqlite" });
  await expectRejected({ DATABASE_URL: undefined });
});

it("rejects a different database/Auth project and connection query overrides before starting the CLI", async () => {
  await expectRejected({ SUPABASE_URL: "https://development.supabase.co" });
  await expectRejected({
    DATABASE_URL: database.replace(project, "development"),
  });
  await expectRejected({ DATABASE_URL: `${database}&host=127.0.0.1` });
  await expectRejected({ DATABASE_URL: `${database}&user=another-user` });
  await expectRejected({
    DATABASE_URL: `${database}&password=another-password`,
  });
  await expectRejected({ DATABASE_URL: `${database}#fragment` });
  await expectRejected({
    DATABASE_URL: database.replace("/postgres?", "/another?"),
  });
  await expectRejected({ DATABASE_URL: database.replace("postgres.", "%GG.") });
});

it("runs only compiled migrate with explicit database/TLS settings and excludes unrelated secrets", async () => {
  const result = await invoke({
    EXA_API_KEY: "fixture-provider-secret",
    VITE_SUPABASE_URL: "https://wrong.supabase.co",
    NODE_OPTIONS: "--no-warnings",
  });
  expect(result.code).toBe(0);
  expect(result.stdout).toContain(
    "Production Postgres schema migrations verified.",
  );
  const child = JSON.parse(
    await readFile(join(directory, "child.json"), "utf8"),
  );
  expect(child.args).toEqual(["migrate"]);
  expect(child.env.DATABASE_URL).toBe(database);
  expect(child.env).not.toHaveProperty("EXA_API_KEY");
  expect(child.env).not.toHaveProperty("VITE_SUPABASE_URL");
  expect(child.env).not.toHaveProperty("NODE_OPTIONS");
});

it("supports the production direct connection while requiring its project and database user", async () => {
  const direct = `postgresql://postgres:${password}@db.${project}.supabase.co:5432/postgres`;
  expect((await invoke({ DATABASE_URL: direct })).code).toBe(0);
  await rm(join(directory, "child.json"));
  await expectRejected({
    DATABASE_URL: direct.replace("//postgres:", "//other:"),
  });
});

it("preserves existing runtime-lock refusal and does not bypass or retry the migration", async () => {
  const refusal =
    "Another octolab server or import owns this database. Stop it before starting recovery.";
  await writeFile(
    join(directory, "build/database-cli.js"),
    `console.error(${JSON.stringify(refusal)}); process.exit(1);`,
  );
  const result = await invoke();
  expect(result.code).toBe(1);
  expect(result.stderr.trim()).toBe(refusal);
});

it("redacts compiled-command errors and rejects a missing build", async () => {
  await writeFile(
    join(directory, "build/database-cli.js"),
    `console.error(${JSON.stringify(database)}); process.exit(1);`,
  );
  const result = await invoke();
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("Production migration failed.");
  expect(result.stderr).not.toContain(password);
  await rm(join(directory, "build/database-cli.js"));
  expect((await invoke()).stderr).toContain(
    "Build this release before migrating production.",
  );
});
