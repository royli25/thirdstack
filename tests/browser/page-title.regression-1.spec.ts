import { expect, test } from "@playwright/test";

test("browser titles identify each app destination and follow history", async ({
  page,
}, testInfo) => {
  for (const [route, title] of [
    ["dashboard", "Home"],
    ["dashboard/tools", "Tool catalog"],
    ["dashboard/activity", "Activity"],
    ["dashboard/credits", "Credits"],
    ["settings", "Connections & settings"],
    ["sessions", "Sessions"],
    ["company/exa/overview", "Tool company"],
  ]) {
    await page.goto(`/#${route}`);
    await expect(page).toHaveTitle(`${title} · Two Hands`);
  }

  await page.goto("/#dashboard");
  if (testInfo.project.name === "mobile")
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page
    .getByRole("navigation", { name: "User navigation", exact: true })
    .getByRole("link", { name: "Tool catalog", exact: true })
    .click();
  await expect(page).toHaveTitle("Tool catalog · Two Hands");
  await page.goBack();
  await expect(page).toHaveTitle("Home · Two Hands");
  await page.goForward();
  await expect(page).toHaveTitle("Tool catalog · Two Hands");

  await page.goto("/#home/platform");
  await expect(page).toHaveTitle("Two Hands — Intent & outcomes");
});
