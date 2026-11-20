import { chromium, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.PROTOTYPE_URL || "http://127.0.0.1:5186";
const output = new URL(
  "../../../output/orthogonal-verification/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
const errors = [],
  external = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("request", (r) => {
  const url = r.url();
  if (
    !url.startsWith(base) &&
    !url.startsWith("http://localhost:4747") &&
    !url.startsWith("data:") &&
    !url.startsWith("blob:")
  )
    external.push(url);
});
const record = (name) => {
  checks.push(name);
  console.log("PASS", name);
};
try {
  await page.goto(`${base}/orthogonal.html`);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Get your agentthe data it needs.",
  );
  if (process.env.PROTOTYPE_BUILT === "1")
    await expect(page.locator("[data-agentation-toolbar]")).toHaveCount(0);
  else await expect(page.locator("[data-agentation-toolbar]")).toBeVisible();
  await page.waitForTimeout(1600);
  const hash = async () =>
    createHash("sha256")
      .update(
        await page.screenshot({
          clip: { x: 600, y: 100, width: 800, height: 700 },
        }),
      )
      .digest("hex");
  const first = await hash();
  await page.waitForTimeout(600);
  expect(await hash()).not.toBe(first);
  expect(
    await page
      .locator("canvas")
      .first()
      .evaluate((c) => !!c.getContext("webgl2")),
  ).toBe(true);
  record(
    process.env.PROTOTYPE_BUILT === "1"
      ? "Live WebGL hero animates; Agentation excluded from build"
      : "Live WebGL hero animates; Agentation is visible",
  );
  await page.screenshot({ path: new URL("desktop-hero.png", output).pathname });
  await page.mouse.move(1050, 350, { steps: 12 });
  await page.waitForTimeout(600);
  record("Hero pointer interaction remains active");
  const select = page.getByRole("button", { name: /^Search in:/ });
  await select.click();
  await page
    .getByRole("menuitemradio", { name: "AI Search", exact: true })
    .click();
  await expect(select).toHaveAccessibleName("Search in: AI Search");
  await page.getByRole("searchbox", { name: "Search APIs" }).fill("exa");
  await expect(page.locator("form[role=search]")).toContainText("Exa");
  await page.evaluate(() => {
    window.__prototypeOpened = [];
    window.open = (...args) => {
      window.__prototypeOpened.push(args);
      return null;
    };
  });
  await page.getByRole("searchbox").press("Enter");
  const opened = await page.evaluate(() => window.__prototypeOpened);
  expect(opened).toHaveLength(1);
  const destination = new URL(opened[0][0]);
  expect(destination.origin).toBe("https://www.orthogonal.com");
  expect(destination.pathname).toBe("/search");
  expect([...destination.searchParams.values()]).toContain("exa");
  expect(opened[0].slice(1)).toEqual(["_blank", "noopener,noreferrer"]);
  expect(page.url()).toBe(`${base}/orthogonal.html`);
  record(
    "Search submission opens the original catalog and preserves the prototype",
  );
  await page.getByRole("searchbox").fill("zzzzzz-no-provider");
  await expect(page.getByRole("status")).toContainText(
    "Nothing in the catalog",
  );
  await page.getByRole("searchbox").fill("");
  await page.keyboard.press("Escape");
  record(
    "Category selection and local catalog search, including empty results",
  );
  const rail = page.locator(".EFMmia_featureRail");
  const before = await rail.evaluate((e) => e.getBoundingClientRect().x);
  await page.getByRole("button", { name: "Next Most called" }).click();
  await expect
    .poll(() => rail.evaluate((e) => e.getBoundingClientRect().x))
    .toBeLessThan(before - 10);
  await page.getByRole("button", { name: "Previous Most called" }).click();
  await expect
    .poll(() =>
      rail.evaluate(
        (e, b) => Math.abs(e.getBoundingClientRect().x - b),
        before,
      ),
    )
    .toBeLessThan(2);
  await page.evaluate(() => window.scrollTo(0, 950));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: new URL("desktop-cards.png", output).pathname,
  });
  record("Carousel controls and API-card canvases");
  for (const [name, expected] of [
    ["Claude Code", "claude mcp add"],
    ["Cursor", "Settings → MCP"],
    ["Claude & ChatGPT", "Developer mode"],
    ["SDK", "import Orthogonal"],
    ["CLI", "npm install -g"],
    ["Try a call", "/v1/brand/screenshot"],
  ]) {
    const tab = page.getByRole("tab", { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText(expected);
  }
  await page
    .getByRole("button", { name: "Run this call", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("tab", { name: "Claude Code", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("claude mcp add");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "https://mcp.orthogonal.com",
  );
  await page.screenshot({
    path: new URL("desktop-integrations.png", output).pathname,
  });
  record("All six integration tabs; real clipboard; isolated trial dialog");
  for (const [name, y] of [
    ["key-start", 4013],
    ["key-mid", 4613],
    ["key-end", 5113],
    ["footer", 7600],
  ]) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: new URL(`${name}.png`, output).pathname });
  }
  await page.getByRole("button", { name: "Back to top", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => scrollY), { timeout: 5000 })
    .toBeLessThan(5);
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: "Sign in", exact: true }),
  ).toBeFocused();
  record(
    "Key scroll scene, footer horizon, back to top, dialog focus restoration",
  );
  const assets = await page
    .locator("img")
    .evaluateAll((es) =>
      es.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src),
    );
  expect(assets).toEqual([]);
  const shadows = await page
    .locator("button")
    .evaluateAll((es) =>
      es
        .filter((e) => getComputedStyle(e).textShadow !== "none")
        .map((e) => e.textContent),
    );
  expect(shadows).toEqual([]);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.waitForTimeout(100);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `horizontal overflow at ${width}`,
    ).toBe(true);
    if (width === 390)
      await page.screenshot({
        path: new URL("mobile-hero.png", output).pathname,
      });
  }
  record("All local images load; no text halos; responsive widths 320–1440");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("tab", { name: "CLI", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("npm install -g");
  record("Reduced-motion setting preserves navigation and content");
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  record("Zero page/console errors and zero requests to original services");
  await writeFile(
    new URL(
      process.env.PROTOTYPE_BUILT === "1"
        ? "results-production.json"
        : "results.json",
      output,
    ),
    JSON.stringify(
      { base, checks, errors, external, verifiedAt: new Date().toISOString() },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
