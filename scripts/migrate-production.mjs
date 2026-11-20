import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { productionHost, productionProject } from "./environment-projects.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const entry = fileURLToPath(
  new URL("../build/database-cli.js", import.meta.url),
);
const lockRefusal =
  "Another octolab server or import owns this database. Stop it before starting recovery.";

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Production settings must be injected deliberately by the operator/host.
// This entry point never reads a local dotenv file or changes runtime ownership.
if (
  process.env.PRODUCTION_MIGRATION_CONFIRM !== productionHost ||
  process.env.PUBLIC_APP_URL !== `https://${productionHost}` ||
  process.env.STORAGE_BACKEND !== "postgres"
)
  fail(
    "Production migration requires PRODUCTION_MIGRATION_CONFIRM=twohands.tech, PUBLIC_APP_URL=https://twohands.tech and STORAGE_BACKEND=postgres in the explicitly supplied environment.",
  );

let database, auth, databaseUser;
try {
  database = new URL(process.env.DATABASE_URL);
  databaseUser = decodeURIComponent(database.username);
  auth = new URL(process.env.SUPABASE_URL);
} catch {
  fail("Supply valid production DATABASE_URL and SUPABASE_URL settings.");
}
const directHost = `db.${productionProject}.supabase.co`;
const databaseMatches =
  (database.hostname === directHost &&
    databaseUser === "postgres" &&
    ["", "5432"].includes(database.port)) ||
  (database.hostname.endsWith(".pooler.supabase.com") &&
    database.port === "5432" &&
    databaseUser === `postgres.${productionProject}`);
if (
  !["postgres:", "postgresql:"].includes(database.protocol) ||
  !database.password ||
  database.hash !== "" ||
  !["", "/postgres"].includes(database.pathname) ||
  !databaseMatches ||
  [...database.searchParams.keys()].some(
    (key) => !["sslmode", "sslrootcert"].includes(key),
  ) ||
  auth.href !== `https://${productionProject}.supabase.co/`
)
  fail(
    "Production migration requires the production Supabase database and matching Auth project. No connection was attempted.",
  );
if (!existsSync(entry)) fail("Build this release before migrating production.");

// Only database and transport settings reach the compiled migration command.
// In particular, inherited NODE_OPTIONS, provider keys and VITE_ settings do not.
const childEnv = Object.fromEntries(
  [
    "PATH",
    "HOME",
    "TMPDIR",
    "TMP",
    "TEMP",
    "LANG",
    "LC_ALL",
    "TZ",
    "NODE_EXTRA_CA_CERTS",
    "SSL_CERT_FILE",
    "SSL_CERT_DIR",
    "DATABASE_URL",
  ]
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]]),
);
const result = spawnSync(process.execPath, [entry, "migrate"], {
  cwd: root,
  env: childEnv,
  encoding: "utf8",
});
if (result.error || result.status !== 0) {
  // Database error messages can contain connection details. Keep operator errors
  // content-free, while preserving the actionable ownership refusal verbatim.
  fail(
    result.stderr?.includes(lockRefusal)
      ? lockRefusal
      : "Production migration failed. The application migration command did not complete successfully; verify the release, credentials and migration history before retrying.",
  );
}
console.log("Production Postgres schema migrations verified.");
