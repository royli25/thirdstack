import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";

test("public site, user dashboard, and operator console are separate surfaces", async ({
  page,
}) => {
  await page.goto("/#home");
  await expect(
    page.getByRole("heading", {
      name: "One connection for your agent’s tools.",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Tool catalog" }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await page.getByRole("button", { name: "Exa", exact: true }).click();
  await expect(page.getByRole("dialog").getByText("exa_search")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/#home/platform");
  await expect(page.locator("#platform")).toBeInViewport();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "User navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Model evaluations" }),
  ).toHaveCount(0);
  if (test.info().project.name === "mobile")
    await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/#sessions");
  await expect(
    page.getByRole("heading", { name: "Sessions", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Operator navigation" }),
  ).toBeVisible();
});

test("dashboard switching lives in settings", async ({ page }) => {
  await page.goto("/#settings");
  await expect(
    page.getByRole("heading", { name: "Connections & settings", exact: true }),
  ).toBeVisible();
  const panel = page.getByRole("navigation", {
    name: "Product views",
    exact: true,
  });
  await expect(panel).toBeVisible();
  await page.getByRole("link", { name: /Home/ }).first().click();
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("routing tool toggles persist on the server", async ({ page }) => {
  await page.goto("/#dashboard");
  await page.goto("/#dashboard/routing");
  const toggle = page.getByRole("switch", { name: /exa_search/ });
  await expect(toggle).toBeVisible({ timeout: 10000 });
  const before = await toggle.getAttribute("aria-checked");
  await toggle.click();
  await expect(toggle).toHaveAttribute(
    "aria-checked",
    before === "true" ? "false" : "true",
  );
  await page.reload();
  await expect(
    page.getByRole("switch", { name: /exa_search/ }),
  ).toHaveAttribute("aria-checked", before === "true" ? "false" : "true");
  await page.getByRole("switch", { name: /exa_search/ }).click();
  await expect(
    page.getByRole("switch", { name: /exa_search/ }),
  ).toHaveAttribute("aria-checked", before!);
});
