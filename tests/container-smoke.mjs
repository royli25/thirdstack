// Runs inside an isolated container with no provider keys. No external API requests.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
const base = "http://127.0.0.1:3001";
const headers = {
  Authorization: `Bearer ${process.env.API_TOKEN}`,
  "Content-Type": "application/json",
};
assert.equal((await fetch(base + "/healthz")).status, 200);
assert.equal((await fetch(base + "/api/tasks")).status, 401);
const manifest = await (await fetch(base + "/recordings/manifest.json")).json();
assert.ok(manifest.some((record) => record.id === "firecrawl-missing-page"));
const recording = await (
  await fetch(base + "/recordings/firecrawl-missing-page.json")
).json();
assert.equal(
  recording.events.find((event) => event.type === "provider_response")
    .pageStatus,
  404,
);
if (process.argv[2] === "persist") {
  const id = await readFile("/app/data/smoke-task-id", "utf8");
  const response = await fetch(base + `/api/tasks/${id}`, { headers });
  assert.equal(response.status, 200);
  const task = await response.json();
  assert.equal(task.status, "ready");
  assert.equal(task.events[0].type, "intent_created");
  assert.equal(task.sources[0].provider, "user");
  assert.equal(task.sources[0].callId, null);
  console.log("Container persistence after restart: passed.");
} else {
  const response = await fetch(base + "/api/tasks", {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt: "Container acceptance without external API operations",
      query: "container smoke",
      criteria: ["Runtime persistence works"],
      requiredCount: 1,
      budgetMicros: 10000,
      domains: [],
      mode: "route",
      preference: "balanced",
      consent: false,
    }),
  });
  assert.equal(response.status, 201);
  const task = await response.json();
  await writeFile("/app/data/smoke-task-id", task.id, { mode: 0o600 });
  const run = await fetch(base + `/api/tasks/${task.id}/run`, {
    method: "POST",
    headers,
    body: "{}",
  });
  assert.equal(run.status, 409);
  const sourceResponse = await fetch(base + `/api/tasks/${task.id}/sources`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: "https://example.com" }),
  });
  assert.equal(sourceResponse.status, 201);
  const source = await sourceResponse.json();
  const extraction = await fetch(base + `/api/tasks/${task.id}/fetch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ sourceId: source.id }),
  });
  assert.equal(extraction.status, 409);
  const maintenance = spawnSync(process.execPath, ["build/retention.js"], {
    encoding: "utf8",
  });
  assert.notEqual(maintenance.status, 0);
  assert.match(maintenance.stderr, /already in use/);
  console.log(
    "Container health, authentication, historical recordings, source provenance, maintenance ownership, and missing-key guards: passed.",
  );
}
