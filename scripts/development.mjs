import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { developmentEnvironment } from "./development-env.mjs";
import {
  assertPortAvailable,
  signalExitCode,
  waitForDevelopmentApi,
} from "./development-process.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const action = process.argv[2] || "serve";
if (!["serve", "sqlite", "migrate", "preview"].includes(action)) {
  console.error("Choose serve, sqlite, migrate or preview.");
  process.exit(1);
}
let environment;
try {
  environment = await developmentEnvironment(
    root,
    process.env,
    action === "sqlite" ? "sqlite" : "postgres",
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
if (action === "preview") {
  environment.NODE_ENV = "production";
  environment.PUBLIC_APP_URL = `http://127.0.0.1:${environment.PORT}`;
}
console.log(
  `[Two Hands] ${action === "sqlite" ? "isolated SQLite preview" : "development Supabase project"}; API http://127.0.0.1:${environment.PORT}; production configuration excluded.`,
);

const children = new Set();
let stopping = false;
let interruptionCode;
const interrupted = new AbortController();
function stop(signal = "SIGTERM") {
  stopping = true;
  for (const child of children) child.kill(signal);
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    interruptionCode = signalExitCode(signal);
    interrupted.abort();
    stop(signal);
  });
}
function run(args) {
  return new Promise((resolveRun) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: environment,
      stdio: "inherit",
    });
    children.add(child);
    child.once("error", () => {
      children.delete(child);
      console.error("Could not start the development command.");
      resolveRun(1);
    });
    child.once("exit", (code, signal) => {
      children.delete(child);
      resolveRun(code ?? signalExitCode(signal));
    });
  });
}
if (action === "migrate") {
  process.exitCode = await run([
    "--use-env-proxy",
    "--import",
    "tsx",
    "server/database-cli.ts",
    "migrate",
  ]);
} else if (action === "preview") {
  // Use npm only to invoke the existing build pipeline; neither command loads .env.
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    console.error("Run the preview with npm run preview:production.");
    process.exitCode = 1;
  } else {
    const built = await run([npmCli, "run", "build"]);
    process.exitCode =
      built ||
      (stopping ? 0 : await run(["--use-env-proxy", "build/index.js"]));
  }
} else {
  try {
    await assertPortAvailable(Number(environment.PORT));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  const api = run([
    "--use-env-proxy",
    "--import",
    "tsx",
    "--watch",
    "server/index.ts",
  ]);
  try {
    await waitForDevelopmentApi(
      Number(environment.PORT),
      api,
      interrupted.signal,
    );
    if (!stopping) {
      const web = run([
        resolve(root, "node_modules/vite/bin/vite.js"),
        "--host",
        "127.0.0.1",
      ]);
      const code = await Promise.race([api, web]);
      stop();
      await Promise.all([api, web]);
      process.exitCode = code;
    }
  } catch (error) {
    console.error(error.message);
    stop();
    await api;
    process.exitCode = 1;
  }
}
if (interruptionCode !== undefined) process.exitCode = interruptionCode;
