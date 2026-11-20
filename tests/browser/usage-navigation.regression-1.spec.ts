import { test, expect } from "@playwright/test";

test("provider details leads from the dashboard to usage without a redundant self-link", async ({
  page,
}) => {
  await page.goto("/#dashboard/activity");
  const overview = page.locator(".ws-panel").filter({
    has: page.getByRole("heading", { name: "By provider", exact: true }),
  });
  await overview.getByRole("link", { name: "Details", exact: true }).click();
  await expect(page).toHaveURL(/#dashboard\/usage$/);
  const breakdown = page.locator(".ws-panel").filter({
    has: page.getByRole("heading", { name: "Usage by provider", exact: true }),
  });
  await expect(breakdown).toBeVisible();
  await expect(
    breakdown.getByRole("link", { name: "Details", exact: true }),
  ).toHaveCount(0);
});
