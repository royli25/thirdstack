import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { productionProject } from "./environment-projects.mjs";

// Public deployment identity, not a credential. Development must never own this database.
export const productionProjectRefs = new Set([productionProject]);
export const developmentEnvFile = ".env.development.local";

const systemKeys = new Set([
  "PATH",
  "HOME",
  "USER",
  "LOGNAME",
  "SHELL",
  "TMPDIR",
  "TEMP",
  "TMP",
  "SystemRoot",
  "WINDIR",
  "COMSPEC",
  "PATHEXT",
  "TERM",
  "COLORTERM",
  "FORCE_COLOR",
  "NO_COLOR",
  "TZ",
  "LANG",
  "SSL_CERT_FILE",
  "SSL_CERT_DIR",
  "NODE_EXTRA_CA_CERTS",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
]);

function setupError(message) {
  return new Error(
    `${message} Configure ${developmentEnvFile} from .env.development.example with a separate development Supabase project. Production .env is never loaded.`,
  );
}

function postgresProject(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw setupError(
      "DATABASE_URL must be a development PostgreSQL connection string.",
    );
  }
  if (
    !["postgres:", "postgresql:"].includes(parsed.protocol) ||
    (parsed.port && parsed.port !== "5432") ||
    parsed.hash ||
    [...parsed.searchParams.keys()].some(
      (key) => !["sslmode", "sslrootcert"].includes(key),
    )
  ) {
    throw setupError(
      "Use a direct Supabase connection or session pooler on port 5432 for DATABASE_URL.",
    );
  }
  if (
    !parsed.username ||
    !parsed.password ||
    !["", "/postgres"].includes(parsed.pathname)
  ) {
    throw setupError(
      "DATABASE_URL must include the development database username and password and select the postgres database.",
    );
  }
  const direct = /^db\.([a-z0-9]{20})\.supabase\.co$/.exec(parsed.hostname);
  if (direct) return direct[1];
  if (/^[a-z0-9.-]+\.pooler\.supabase\.com$/.test(parsed.hostname)) {
    if (parsed.port !== "5432") {
      throw setupError(
        "The Supabase session pooler requires explicit port 5432.",
      );
    }
    let username;
    try {
      username = decodeURIComponent(parsed.username);
    } catch {
      throw setupError("DATABASE_URL has an invalid database username.");
    }
    return /\.([a-z0-9]{20})$/.exec(username)?.[1];
  }
  throw setupError(
    "DATABASE_URL must identify the separate hosted development Supabase project.",
  );
}

export async function developmentEnvironment(
  root,
  inherited = process.env,
  mode = "postgres",
) {
  const environment = Object.fromEntries(
    Object.entries(inherited).filter(
      ([key]) => systemKeys.has(key) || key.startsWith("LC_"),
    ),
  );
  Object.assign(environment, {
    NODE_ENV: "development",
    HOST: "127.0.0.1",
    PORT: "3009",
    PUBLIC_APP_URL: "http://127.0.0.1:5175",
    DB_PATH: resolve(root, "data/development.sqlite"),
    STRIPE_TEST_ENABLED: "false",
    DEPOSITS_TESTNET_ENABLED: "false",
    AGENT_SESSION_BUDGET_MICROS: "0",
    PROVIDER_TEST_BUDGET_MICROS: "0",
    PROVIDER_TEST_DAILY_BUDGET_MICROS: "0",
  });
  if (mode === "sqlite") {
    environment.STORAGE_BACKEND = "sqlite";
    return environment;
  }
  let settings;
  try {
    settings = parseEnv(
      await readFile(resolve(root, developmentEnvFile), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT")
      throw setupError(`Cannot read ${developmentEnvFile}.`);
    throw setupError(`Missing ${developmentEnvFile}.`);
  }
  // The template names application settings. Never accept executable Node options,
  // system overrides or VITE_ aliases from a dotenv file.
  const allowed = new Set([
    ...Object.keys(
      parseEnv(await readFile(resolve(root, ".env.example"), "utf8")),
    ),
    "DEVELOPMENT_SUPABASE_PROJECT_REF",
  ]);
  for (const [key, value] of Object.entries(settings)) {
    if (!allowed.has(key) || key.startsWith("VITE_")) {
      throw setupError(
        `Unsupported development setting ${/^[A-Z0-9_]+$/.test(key) ? key : "name"}.`,
      );
    }
    environment[key] = value;
  }
  const project = environment.DEVELOPMENT_SUPABASE_PROJECT_REF;
  if (!project || !/^[a-z0-9]{20}$/.test(project)) {
    throw setupError(
      "Set DEVELOPMENT_SUPABASE_PROJECT_REF to the development project's reference.",
    );
  }
  if (productionProjectRefs.has(project)) {
    throw setupError(
      "The production Supabase project is not allowed for development.",
    );
  }
  if (environment.STORAGE_BACKEND !== "postgres") {
    throw setupError(
      "Development requires STORAGE_BACKEND=postgres. Use npm run dev:sqlite for the isolated local preview.",
    );
  }
  if (postgresProject(environment.DATABASE_URL) !== project) {
    throw setupError(
      "DATABASE_URL does not match DEVELOPMENT_SUPABASE_PROJECT_REF.",
    );
  }
  if (environment.SUPABASE_URL !== `https://${project}.supabase.co`) {
    throw setupError(
      "SUPABASE_URL must match the development database project.",
    );
  }
  if (
    !/^sb_publishable_[A-Za-z0-9_-]+$/.test(
      environment.SUPABASE_PUBLISHABLE_KEY || "",
    )
  ) {
    throw setupError(
      "Set SUPABASE_PUBLISHABLE_KEY to the development project's public publishable key.",
    );
  }
  if (environment.HOST !== "127.0.0.1") {
    throw setupError("Development HOST must remain 127.0.0.1.");
  }
  const port = Number(environment.PORT);
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 5175) {
    throw setupError(
      "Development PORT must be an available backend port from 1024 to 65535, separate from 5175.",
    );
  }
  if (environment.PUBLIC_APP_URL !== "http://127.0.0.1:5175") {
    throw setupError(
      "Development PUBLIC_APP_URL must be http://127.0.0.1:5175.",
    );
  }
  if (
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(
      environment.LEGACY_WORKSPACE_ID || "",
    )
  ) {
    throw setupError(
      "Set LEGACY_WORKSPACE_ID to a fresh development-only UUID for the backend's fallback namespace. Do not copy the production workspace identity.",
    );
  }
  // SQLite is not used in this mode, but keep even a future fallback isolated.
  environment.DB_PATH = resolve(root, "data/development.sqlite");
  return environment;
}
