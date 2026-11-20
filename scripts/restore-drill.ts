import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { runRestoreDrill } from "../tests/fixtures/restore-drill.js";
const url = process.env.OCTOLAB_RESTORE_DRILL_URL;
if (!url)
  throw new Error(
    "Set OCTOLAB_RESTORE_DRILL_URL to an explicit disposable loopback PostgreSQL maintenance database. No DATABASE_URL fallback is used.",
  );
const directory = resolve(
  process.env.RESTORE_DRILL_OUTPUT || "test-results/restore-drill",
);
await mkdir(directory, { recursive: true, mode: 0o700 });
try {
  const report = await runRestoreDrill(url, directory);
  await writeFile(
    join(directory, "restore-report.json"),
    JSON.stringify(report, null, 2) + "\n",
    { mode: 0o600 },
  );
  console.log(JSON.stringify(report, null, 2));
} catch {
  console.error(
    "Disposable restore drill failed. No successful recovery is claimed; private connection details were omitted.",
  );
  process.exitCode = 1;
}
