import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
async function walk(path) {
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = `${path}/${entry.name}`;
    if (entry.isSymbolicLink())
      throw new Error("Release assets cannot be symbolic links.");
    if (entry.isDirectory()) files.push(...(await walk(child)));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}
const manifest = JSON.parse(await readFile("release-manifest.json", "utf8"));
if (
  manifest.version !== "octolab-release-v1" ||
  !manifest.files ||
  !Object.keys(manifest.files).some(
    (p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql"),
  )
)
  throw new Error("Missing release or migration manifest.");
const actual = [
  ...(
    await Promise.all(["build", "dist", "supabase/migrations"].map(walk))
  ).flat(),
  "package.json",
  "package-lock.json",
  "scripts/verify-release-artifact.mjs",
  "scripts/migrate-production.mjs",
  "scripts/environment-projects.mjs",
].sort();
if (
  JSON.stringify(actual) !== JSON.stringify(Object.keys(manifest.files).sort())
)
  throw new Error("Release asset inventory differs from its manifest.");
for (const path of actual) {
  if (
    (!/^(build|dist|supabase\/migrations)\//.test(path) &&
      ![
        "package.json",
        "package-lock.json",
        "scripts/verify-release-artifact.mjs",
        "scripts/migrate-production.mjs",
        "scripts/environment-projects.mjs",
      ].includes(path)) ||
    path.split("/").includes("..")
  )
    throw new Error("Invalid release asset path.");
  const expected = manifest.files[path],
    file = await stat(path);
  if (
    expected.bytes !== file.size ||
    expected.sha256 !==
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex")
  )
    throw new Error("A release asset is missing or changed.");
}
console.log(
  `Release assets verified: ${actual.length} files, ${actual.filter((p) => p.startsWith("supabase/migrations/") && p.endsWith(".sql")).length} migrations. Source: ${manifest.sourceRevision}.`,
);
