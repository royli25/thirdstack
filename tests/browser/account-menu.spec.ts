import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";

test("account menu opens upward, restores focus, and keeps settings reachable locally", async ({
  page,
}) => {
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  } else {
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeHidden();
  }
  const trigger = page.getByRole("button", {
    name: /^Account menu:/,
  });
  await trigger.click();
  const menu = page.getByRole("dialog", { name: "Account options" });
  await expect(menu).toBeVisible();
  const menuBox = await menu.boundingBox();
  const triggerBox = await trigger.boundingBox();
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(triggerBox!.y);
  await expect(
    menu.getByRole("link", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(
    menu.getByRole("link", { name: "Usage", exact: true }),
  ).toHaveAttribute("href", "#dashboard/usage");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page).toHaveURL(/#settings$/);
  await expect(
    page.getByRole("heading", { name: "Connections & settings", exact: true }),
  ).toBeVisible();
});

test("customer navigation groups keys and test funding without hiding existing pages", async ({
  page,
}) => {
  await page.goto("/#dashboard/keys");
  await expect(
    page.getByRole("heading", { name: "API keys", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  const nav = page.getByRole("navigation", { name: "User navigation" });
  await expect(nav.getByRole("link", { name: "API keys" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link")).toHaveText([
    "Home",
    "Tool catalog",
    "Activity",
    "API keys",
    /Credits.*0\.00 test credits/,
    "Add test funds",
  ]);
  await nav.getByRole("link", { name: "Add test funds" }).click();
  await expect(page).toHaveURL(/#dashboard\/credits\/add-funds$/);
  await expect(
    page.getByRole("group", { name: "Test funding options" }),
  ).toBeFocused();
});

test("help opens inside the app and returns keyboard focus to the account control", async ({
  page,
}) => {
  await page.goto("/#dashboard/tools");
  await expect(
    page.getByRole("heading", { name: "Tool catalog", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  const trigger = page.getByRole("button", {
    name: /^Account menu:/,
  });
  await trigger.click();
  await page
    .getByRole("button", { name: "Help and documentation", exact: true })
    .click();
  const help = page.getByRole("dialog", {
    name: "Help and documentation",
    exact: true,
  });
  await expect(help).toBeVisible();
  await expect(help).toHaveCSS("opacity", "1");
  await expect(
    page.getByRole("dialog", { name: "Account options" }),
  ).toBeHidden();
  await expect(
    help.getByRole("link", { name: /Connect an agent/ }),
  ).toHaveAttribute("href", "#dashboard/connections");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(help).toBeHidden();
  await expect(trigger).toBeFocused();
});
