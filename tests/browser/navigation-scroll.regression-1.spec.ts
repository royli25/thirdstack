import { expect, test } from "@playwright/test";

test("sidebar navigation reveals the new page heading and preserves browser history", async ({
  page,
}, testInfo) => {
  await page.goto("/#dashboard/connections");
  await expect(
    page.getByRole("heading", { name: "Connections", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Connect your agent", exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(300);
  const previousScroll = await page.evaluate(() => window.scrollY);
  if (testInfo.project.name === "mobile")
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "User navigation", exact: true })
    .getByRole("link", { name: "Credits", exact: false })
    .click();
  await expect(page).toHaveURL(/#dashboard\/credits$/);
  await expect(
    page.getByRole("heading", { name: "Credits", exact: true }),
  ).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL(/#dashboard\/connections$/);
  if (testInfo.project.name === "desktop")
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBe(previousScroll);
  await page.goForward();
  await expect(page).toHaveURL(/#dashboard\/credits$/);
  await expect(
    page.getByRole("heading", { name: "Credits", exact: true }),
  ).toBeInViewport();
});

test("home section anchors and the funding destination keep their own scroll behavior", async ({
  page,
}, testInfo) => {
  await page.goto("/#home");
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/#home\/platform$/);
  await expect(page.locator("#platform")).toBeInViewport();
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(0);

  await page.goto("/#dashboard/connections");
  if (testInfo.project.name === "mobile")
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "User navigation", exact: true })
    .getByRole("link", { name: "Add test funds", exact: true })
    .click();
  await expect(page).toHaveURL(/#dashboard\/credits\/add-funds$/);
  await expect(
    page.getByRole("group", { name: "Test funding options", exact: true }),
  ).toBeFocused();
});
