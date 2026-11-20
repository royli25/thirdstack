// Configure only the explicitly isolated development project. Production setup
// is a separate release operation; this command cannot target production.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import {
  developmentEnvironment,
  developmentEnvFile,
} from "./development-env.mjs";
import { productionProject } from "./environment-projects.mjs";
import pg from "pg";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = await developmentEnvironment(root);
if (
  !env.DEVELOPMENT_SUPABASE_PROJECT_REF ||
  env.DEVELOPMENT_SUPABASE_PROJECT_REF === productionProject
)
  throw new Error("A separate development project is required.");
let token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token && process.platform === "darwin") {
  try {
    token = execFileSync(
      "security",
      ["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
    if (token.startsWith("go-keyring-base64:"))
      token = Buffer.from(
        token.slice("go-keyring-base64:".length),
        "base64",
      ).toString();
  } catch {}
}
if (!token?.startsWith("sbp_"))
  throw new Error(
    "Sign in with supabase login or supply SUPABASE_ACCESS_TOKEN privately.",
  );
const hook = "pg-functions://postgres/octolab/two_hands_mcp_token_hook";
const address = new URL(env.DATABASE_URL);
address.searchParams.delete("sslmode");
const connection = new pg.Client({
  connectionString: address.href,
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 10000,
});
try {
  await connection.connect();
  const result = await connection.query(
    "SELECT to_regclass('octolab.mcp_grant_sessions') IS NOT NULL AND to_regprocedure('octolab.two_hands_mcp_token_hook(jsonb)') IS NOT NULL AS installed",
  );
  if (!result.rows[0]?.installed)
    throw new Error(
      "Stop the development API and run npm run db:migrate:dev before configuring OAuth.",
    );
} finally {
  await connection.end();
}
const endpoint = `https://api.supabase.com/v1/projects/${env.DEVELOPMENT_SUPABASE_PROJECT_REF}/config/auth`;
const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};
const current = await fetch(endpoint, {
  headers,
  redirect: "error",
  signal: AbortSignal.timeout(15000),
});
if (!current.ok)
  throw new Error(
    `Could not inspect development Auth configuration (${current.status}).`,
  );
const settings = await current.json();
if (
  settings.hook_custom_access_token_enabled &&
  settings.hook_custom_access_token_uri !== hook
)
  throw new Error(
    "A different token hook is configured. Compose it with the MCP hook before proceeding.",
  );
if (settings.site_url !== env.PUBLIC_APP_URL)
  throw new Error("The development Auth Site URL must match PUBLIC_APP_URL.");
const response = await fetch(endpoint, {
  method: "PATCH",
  headers,
  redirect: "error",
  signal: AbortSignal.timeout(15000),
  body: JSON.stringify({
    oauth_server_enabled: true,
    oauth_server_allow_dynamic_registration: true,
    oauth_server_authorization_path: "/oauth/consent",
    hook_custom_access_token_enabled: true,
    hook_custom_access_token_uri: hook,
  }),
});
if (!response.ok)
  throw new Error(`Development OAuth setup failed (${response.status}).`);
const confirmed = await response.json();
if (
  !confirmed.oauth_server_enabled ||
  !confirmed.hook_custom_access_token_enabled ||
  confirmed.hook_custom_access_token_uri !== hook
)
  throw new Error("The OAuth configuration was not confirmed.");
const file = new URL(`../${developmentEnvFile}`, import.meta.url);
let content = await readFile(file, "utf8");
content = /^MCP_OAUTH_ENABLED=.*$/m.test(content)
  ? content.replace(/^MCP_OAUTH_ENABLED=.*$/m, "MCP_OAUTH_ENABLED=true")
  : content.trimEnd() + "\nMCP_OAUTH_ENABLED=true\n";
await writeFile(file, content, { mode: 0o600 });
console.log(
  "Development OAuth enabled with a dedicated token hook and /oauth/consent. Restart npm run dev. Production was not changed.",
);
