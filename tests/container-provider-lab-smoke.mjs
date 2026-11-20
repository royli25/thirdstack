// Packaged provider-company demo and persistence check. No live provider requests.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:3001/api";
const headers = {
  Authorization: `Bearer ${process.env.API_TOKEN}`,
  "Content-Type": "application/json",
};
const record = "/app/data/provider-lab-smoke.json";
const emptyOrganic = {
  offeredSessions: 0,
  selectedSessions: 0,
  calls: 0,
  successfulCalls: 0,
  referencedCalls: 0,
};
const request = async (path, body) => {
  const r = await fetch(base + path, {
    headers,
    ...(body === undefined
      ? {}
      : { method: "POST", body: JSON.stringify(body) }),
  });
  assert.ok(r.ok, `Provider lab HTTP ${r.status}`);
  return r.json();
};
if (process.argv[2] === "persist") {
  const saved = JSON.parse(await readFile(record, "utf8"));
  const lab = await request("/provider-lab");
  assert.equal(lab.runs.length, 0);
  assert.equal(
    lab.experiments.find((p) => p.id === saved.id)?.title,
    "Container provider test plan",
  );
  assert.deepEqual(
    (await request("/company-insights/exa?source=local")).organic,
    emptyOrganic,
  );
  console.log(
    "Packaged provider test plan survived restart; demo metrics did not enter live history.",
  );
} else {
  assert.equal((await fetch(base + "/provider-lab")).status, 401);
  const before = await request("/provider-lab");
  assert.equal(before.runs.length, 0);
  assert.ok(before.providers.every((p) => !p.configured));
  const demo = await request("/company-insights/exa?source=demo");
  assert.equal(demo.source, "demo");
  assert.equal(demo.organic.offeredSessions, 240);
  const local = await request("/company-insights/exa?source=local");
  assert.deepEqual(local.organic, emptyOrganic);
  assert.equal(local.usage, null);
  const denied = await fetch(base + "/provider-lab/runs", {
    method: "POST",
    headers,
    body: JSON.stringify({
      requestKey: "container-no-keys",
      providers: ["exa"],
    }),
  });
  assert.equal(denied.status, 409);
  const plan = await request("/provider-lab/experiments", {
    provider: "exa",
    title: "Container provider test plan",
    hypothesis:
      "A synthetic plan must persist without invoking any paid provider.",
    change: "Keep fixture data in this isolated container only.",
    successMeasure:
      "The same plan remains readable after restarting the packaged runtime.",
  });
  assert.equal(plan.status, "planned");
  assert.equal((await request("/provider-lab")).runs.length, 0);
  await writeFile(record, JSON.stringify({ id: plan.id }), { mode: 0o600 });
  console.log(
    "Packaged company demo isolation, honest zero usage, backend missing-key guard, and plan persistence: passed.",
  );
}
