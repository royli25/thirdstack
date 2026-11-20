import { test, expect } from "@playwright/test";

test("landing header gathers and reverses without overlapping its controls", async ({
  page,
}) => {
  await page.goto("/#home");
  const brand = page.locator(".th-header-brand");
  const actions = page.locator(".th-header-actions");
  const dock = page.locator(".th-header-dock");
  await expect(brand).toBeVisible();
  const expanded = (await brand.boundingBox())!;

  await page.evaluate(() => window.scrollTo(0, 226));
  await expect
    .poll(async () => (await brand.boundingBox())!.y)
    .toBeGreaterThan(expanded.y + 4);
  const midway = (await brand.boundingBox())!;
  expect(midway.y).toBeLessThan(expanded.y + 10);

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(dock).toHaveCSS("opacity", "1");
  const gatheredBrand = (await brand.boundingBox())!;
  const gatheredActions = (await actions.boundingBox())!;
  const gatheredDock = (await dock.boundingBox())!;
  expect(gatheredBrand.y).toBeCloseTo(expanded.y + 12, 1);
  expect(gatheredBrand.x + gatheredBrand.width).toBeLessThan(gatheredActions.x);
  expect(gatheredBrand.x).toBeGreaterThanOrEqual(gatheredDock.x);
  expect(gatheredActions.x + gatheredActions.width).toBeLessThanOrEqual(
    gatheredDock.x + gatheredDock.width + 1,
  );
  if (test.info().project.name === "desktop") {
    expect(midway.x).toBeGreaterThan(expanded.x);
    expect(gatheredBrand.x).toBeGreaterThan(midway.x);
  } else {
    expect(gatheredBrand.x).toBeCloseTo(expanded.x, 1);
  }

  await page.evaluate(() => window.scrollTo(0, 226));
  await expect
    .poll(async () => (await brand.boundingBox())!.y)
    .toBeLessThan(gatheredBrand.y - 2);
  expect((await brand.boundingBox())!.y).toBeGreaterThan(expanded.y + 4);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(dock).toHaveCSS("opacity", "0");
  const restored = (await brand.boundingBox())!;
  expect(restored.x).toBeCloseTo(expanded.x, 1);
  expect(restored.y).toBeCloseTo(expanded.y, 1);
});

test("reduced motion keeps the landing header still and usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#home");
  const brand = page.locator(".th-header-brand");
  await expect(brand).toBeVisible();
  const initial = await brand.boundingBox();
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect(page.locator(".th-header-dock")).toHaveCSS("opacity", "0");
  expect(await brand.boundingBox()).toEqual(initial);
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Open dashboard" }),
  ).toBeInViewport();
});
