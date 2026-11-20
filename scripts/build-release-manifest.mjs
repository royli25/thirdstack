import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
const roots = ["build", "dist", "supabase/migrations"];
async function walk(path) {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isSymbolicLink())
      throw new Error("Release assets cannot be symbolic links.");
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}
const files = {};
for (const path of [
  ...(await Promise.all(roots.map(walk))).flat(),
  "package.json",
  "package-lock.json",
  "scripts/verify-release-artifact.mjs",
  "scripts/migrate-production.mjs",
  "scripts/environment-projects.mjs",
].sort())
  files[path] = {
    sha256: createHash("sha256")
      .update(await readFile(path))
      .digest("hex"),
    bytes: (await stat(path)).size,
  };
const pkg = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
  "release-manifest.json",
  JSON.stringify(
    {
      version: "octolab-release-v1",
      packageVersion: pkg.version,
      sourceRevision: /^[a-f0-9]{7,40}$/.test(process.env.SOURCE_REVISION || "")
        ? process.env.SOURCE_REVISION
        : "unreported",
      createdAt: new Date().toISOString(),
      files,
    },
    null,
    2,
  ) + "\n",
);
