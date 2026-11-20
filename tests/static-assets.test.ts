import express from "express";
import { once } from "node:events";
import { writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, expect, it } from "vitest";
import { staticAssets } from "../server/static-assets";
const app = express();
staticAssets(app);
app.get("/{*path}", (_req, res) => res.type("html").send("SPA fallback"));
const server = app.listen(0, "127.0.0.1");
let base: string;
beforeAll(async () => {
  if (!server.listening) await once(server, "listening");
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(async () => {
  server.close();
  await once(server, "close");
});
it("serves the same JavaScript with gzip/Brotli, correct MIME, Vary, and immutable caching", async () => {
  const html = await fetch(base);
  expect(html.headers.get("cache-control")).toBe("no-cache");
  const path = (await html.text()).match(/src="([^\"]+\.js)"/)![1];
  const plain = await fetch(base + path, {
      headers: { "Accept-Encoding": "identity" },
    }),
    body = await plain.text();
  for (const encoding of ["br", "gzip"]) {
    const r = await fetch(base + path, {
      headers: { "Accept-Encoding": encoding },
    });
    expect(r.status).toBe(200);
    expect(r.headers.get("content-encoding")).toBe(encoding);
    expect(r.headers.get("content-type")).toContain("javascript");
    expect(r.headers.get("vary")).toContain("Accept-Encoding");
    expect(r.headers.get("cache-control")).toContain("immutable");
    expect(Number(r.headers.get("content-length"))).toBeLessThan(
      Buffer.byteLength(body) * 0.5,
    );
    expect(await r.text()).toBe(body);
  }
  const missing = await fetch(base + "/assets/missing.js", {
    headers: { "Accept-Encoding": "br" },
  });
  expect(missing.status).toBe(404);
  expect(missing.headers.get("content-encoding")).toBeNull();
  expect(await missing.text()).not.toContain("SPA fallback");
});

it("serves compressed HEAD requests without a response body", async () => {
  const html = await fetch(base);
  const path = (await html.text()).match(/src="([^\"]+\.js)"/)![1];
  const response = await fetch(base + path, {
    method: "HEAD",
    headers: { "Accept-Encoding": "br" },
  });
  expect(response.status).toBe(200);
  expect(response.headers.get("content-encoding")).toBe("br");
  expect(Number(response.headers.get("content-length"))).toBeGreaterThan(0);
  expect(await response.text()).toBe("");
});

it("falls back to the original asset when no compressed sibling exists", async () => {
  const name = `identity-${randomUUID()}.js`;
  const file = `dist/assets/${name}`;
  const body = "console.log('identity fallback');";
  await writeFile(file, body);
  try {
    const response = await fetch(`${base}/assets/${name}`, {
      headers: { "Accept-Encoding": "br, gzip" },
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-encoding")).toBeNull();
    expect(response.headers.get("content-type")).toContain("javascript");
    expect(await response.text()).toBe(body);
  } finally {
    await unlink(file);
  }
});
it("serves the public legal pages at /privacy and /terms", async () => {
  for (const [path, title] of [
    ["/privacy", "Privacy Policy"],
    ["/terms", "Terms of Service"],
  ]) {
    const r = await fetch(base + path);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(r.headers.get("cache-control")).toBe("no-cache");
    expect(await r.text()).toContain(`<h1>${title}</h1>`);
  }
});
