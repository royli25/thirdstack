import { readFile } from "node:fs/promises";
import { verifyPrivateEvidence } from "../build/evidence-verification.js";
const path = process.argv[2];
if (!path || path === "--help") {
  console.log(
    "npm run verify:evidence -- /path/to/private-evidence.json\nChecks internal consistency without network requests. Run npm run build first. This is not external attestation.",
  );
  process.exit(path ? 0 : 2);
}
try {
  const result = verifyPrivateEvidence(
    JSON.parse(await readFile(path, "utf8")),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
} catch {
  console.error(
    "Could not read a valid JSON evidence file. The file was not modified.",
  );
  process.exitCode = 2;
}
