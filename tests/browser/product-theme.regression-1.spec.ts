import { test, expect } from "@playwright/test";

test("product surfaces keep the shared light theme when the system prefers dark", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  for (const route of [
    "home",
    "dashboard",
    "settings",
    "company/exa",
    "models",
    "lab",
    "cases",
    "disputes",
  ]) {
    await page.goto(`/#${route}`);
    await expect(page.locator("h1").first()).toBeVisible();
    const theme = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      const channels = (color: string) =>
        color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number);
      return {
        scheme: style.colorScheme,
        background: channels(style.backgroundColor),
        foreground: channels(style.color),
      };
    });
    expect(theme.scheme, route).toBe("light");
    expect(Math.min(...theme.background), route).toBeGreaterThan(230);
    expect(Math.max(...theme.foreground), route).toBeLessThan(80);
    expect(
      await page.locator('img[alt^="Two Hands"]').count(),
      route,
    ).toBeGreaterThan(0);
  }
});
