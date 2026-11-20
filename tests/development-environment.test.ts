import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { developmentEnvironment } from "../scripts/development-env.mjs";

const run = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const helper = new URL("../scripts/development-env.mjs", import.meta.url).href;
const project = "abcdefghijklmnopqrst";
const production = "ofnpfrlklnhfusdpeant";
let directory: string;

function settings(overrides: Record<string, string> = {}) {
  return Object.entries({
    DEVELOPMENT_SUPABASE_PROJECT_REF: project,
    STORAGE_BACKEND: "postgres",
    DATABASE_URL: `postgresql://postgres.${project}:development-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=verify-full`,
    SUPABASE_URL: `https://${project}.supabase.co`,
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_development",
    LEGACY_WORKSPACE_ID: "f75b258f-1d70-450d-9554-129b658b4d3e",
    ...overrides,
  })
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "two-hands-development-"));
  await writeFile(
    join(directory, ".env.example"),
    await readFile(join(root, ".env.example"), "utf8"),
  );
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe("isolated development environment", () => {
  it("refuses missing settings even when the shell and shared dotenv contain working production settings", async () => {
    const poison = settings({
      DEVELOPMENT_SUPABASE_PROJECT_REF: production,
      DATABASE_URL: `postgresql://postgres.${production}:production-password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    });
    await writeFile(join(directory, ".env"), poison);
    await writeFile(join(directory, ".env.local"), poison);
    await expect(
      developmentEnvironment(directory, {
        DATABASE_URL:
          "postgresql://production-secret@production.invalid/postgres",
        SUPABASE_URL: `https://${production}.supabase.co`,
        STORAGE_BACKEND: "postgres",
      }),
    ).rejects.toThrow("Missing .env.development.local");
  });

  it("uses only the explicit file in a contaminated subprocess and excludes inherited provider, payment, Vite and Node options", async () => {
    await writeFile(join(directory, ".env.development.local"), settings());
    for (const file of [".env", ".env.local", ".env.development"]) {
      await writeFile(
        join(directory, file),
        "VITE_INHERITED_SECRET=dotenv-secret\nPORT=3008\nSTRIPE_SECRET_KEY=dotenv-secret\n",
      );
    }
    const script = `
      import { developmentEnvironment } from ${JSON.stringify(helper)};
      import { resolveConfig } from ${JSON.stringify(new URL("../node_modules/vite/dist/node/index.js", import.meta.url).href)};
      const env = await developmentEnvironment(${JSON.stringify(directory)}, process.env);
      process.env = env;
      const vite = await resolveConfig({ configFile: ${JSON.stringify(join(root, "vite.config.ts"))}, root: ${JSON.stringify(directory)} }, "serve");
      console.log(JSON.stringify({env, exposed: vite.env, envDir: vite.envDir, proxy: vite.server.proxy["/api"]}));
    `;
    const { stdout } = await run(
      process.execPath,
      ["--input-type=module", "-e", script],
      {
        cwd: directory,
        env: {
          ...process.env,
          DATABASE_URL: "production-secret",
          PORT: "3008",
          VITE_INHERITED_SECRET: "parent-secret",
          STRIPE_SECRET_KEY: "parent-secret",
          EXA_API_KEY: "parent-secret",
          UNKNOWN_FUTURE_PROVIDER_KEY: "parent-secret",
          NODE_OPTIONS: "--no-warnings",
          NODE_ENV: "production",
        },
      },
    );
    const output = JSON.parse(stdout.trim());
    expect(stdout).not.toContain("parent-secret");
    expect(stdout).not.toContain("dotenv-secret");
    expect(output.env).toMatchObject({
      NODE_ENV: "development",
      STORAGE_BACKEND: "postgres",
      PORT: "3009",
      DATABASE_URL: expect.stringContaining(`postgres.${project}`),
      STRIPE_TEST_ENABLED: "false",
      AGENT_SESSION_BUDGET_MICROS: "0",
    });
    expect(output.env.NODE_OPTIONS).toBeUndefined();
    expect(output.env.VITE_SUPABASE_URL).toBeUndefined();
    expect(output.envDir).toBe(false);
    expect(output.exposed.VITE_INHERITED_SECRET).toBeUndefined();
    expect(output.proxy).toMatchObject({
      target: "http://127.0.0.1:3009",
      changeOrigin: false,
    });
  }, 15000);

  it("accepts a direct development database with the matching separate Auth project", async () => {
    await writeFile(
      join(directory, ".env.development.local"),
      settings({
        DATABASE_URL: `postgresql://postgres:dev@db.${project}.supabase.co:5432/postgres`,
      }),
    );
    const env = await developmentEnvironment(directory, {
      PATH: "/usr/bin",
      HOME: "/tmp",
    });
    expect(env.DATABASE_URL).toContain(`db.${project}.supabase.co`);
    expect(env.HOME).toBe("/tmp");
  });

  it.each([
    [
      "missing fallback namespace",
      { LEGACY_WORKSPACE_ID: "" },
      "fresh development-only UUID",
    ],
    [
      "production identity",
      { DEVELOPMENT_SUPABASE_PROJECT_REF: production },
      "production Supabase project",
    ],
    [
      "missing database password",
      {
        DATABASE_URL: `postgresql://postgres@db.${project}.supabase.co:5432/postgres`,
      },
      "database username and password",
    ],
    [
      "different database name",
      {
        DATABASE_URL: `postgresql://postgres:secret-sentinel@db.${project}.supabase.co:5432/another`,
      },
      "select the postgres database",
    ],
    [
      "production database",
      {
        DATABASE_URL: `postgresql://postgres.${production}:secret-sentinel@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
      },
      "does not match",
    ],
    [
      "different Auth project",
      { SUPABASE_URL: `https://${production}.supabase.co` },
      "SUPABASE_URL must match",
    ],
    [
      "missing publishable key",
      { SUPABASE_PUBLISHABLE_KEY: "" },
      "SUPABASE_PUBLISHABLE_KEY",
    ],
    [
      "service role key",
      { SUPABASE_PUBLISHABLE_KEY: "sb_secret_secret-sentinel" },
      "SUPABASE_PUBLISHABLE_KEY",
    ],
    [
      "transaction pooler",
      {
        DATABASE_URL: `postgresql://postgres.${project}:secret-sentinel@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      },
      "port 5432",
    ],
    [
      "missing session pooler port",
      {
        DATABASE_URL: `postgresql://postgres.${project}:secret-sentinel@aws-0-us-east-1.pooler.supabase.com/postgres`,
      },
      "explicit port 5432",
    ],
    [
      "connection query override",
      {
        DATABASE_URL: `postgresql://postgres.${project}:secret-sentinel@aws-0-us-east-1.pooler.supabase.com:5432/postgres?host=production.invalid`,
      },
      "port 5432",
    ],
    [
      "Vite alias",
      { VITE_SUPABASE_URL: `https://${production}.supabase.co` },
      "Unsupported development setting",
    ],
    [
      "Node options",
      { NODE_OPTIONS: "--require=secret-sentinel" },
      "Unsupported development setting",
    ],
    ["public host", { HOST: "0.0.0.0" }, "HOST must remain"],
    [
      "production app origin",
      { PUBLIC_APP_URL: "https://twohands.tech" },
      "PUBLIC_APP_URL must be",
    ],
  ])(
    "rejects %s without exposing credentials",
    async (_name, overrides, message) => {
      await writeFile(
        join(directory, ".env.development.local"),
        settings(overrides),
      );
      const error = await developmentEnvironment(directory, {}).catch(
        (error: Error) => error,
      );
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(message);
      expect((error as Error).message).not.toContain("secret-sentinel");
    },
  );

  it("provides an explicit SQLite preview without reading any dotenv or inherited application secrets", async () => {
    await writeFile(join(directory, ".env.development.local"), settings());
    const env = await developmentEnvironment(
      directory,
      {
        DATABASE_URL: "production-secret",
        DB_PATH: "/production.sqlite",
        SUPABASE_URL: `https://${production}.supabase.co`,
        EXA_API_KEY: "production-secret",
        STRIPE_SECRET_KEY: "production-secret",
        PATH: "/usr/bin",
      },
      "sqlite",
    );
    expect(env).toMatchObject({
      STORAGE_BACKEND: "sqlite",
      DB_PATH: join(directory, "data/development.sqlite"),
      PORT: "3009",
    });
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.SUPABASE_URL).toBeUndefined();
    expect(env.EXA_API_KEY).toBeUndefined();
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
  });
});
