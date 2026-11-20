import { expect, test } from "@playwright/test";
import { captureJourney } from "./helpers/launch-screenshots";
import { providerIds } from "../../server/provider-catalog";

test("provider cards keep zero usage visible and support filtering and pinning", async ({
  page,
}) => {
  await page.route("**/api/account/usage?*", async (route) => {
    const response = await route.fetch();
    const usage = await response.json();
    await route.fulfill({
      response,
      json: {
        ...usage,
        requests: 0,
        providers: usage.providers.map((provider: { provider: string }) => ({
          ...provider,
          requests: 0,
          estimatedMicros: 0,
        })),
      },
    });
  });
  await page.goto("/#dashboard/activity");
  const providers = page.getByRole("list", { name: "Provider usage" });
  await expect(providers.getByRole("listitem")).toHaveCount(providerIds.length);
  const exa = providers
    .getByRole("listitem")
    .filter({ hasText: "Exa" })
    .first();
  await expect(exa.locator("dd")).toHaveText(["0", "$0.000", "0%"]);
  await captureJourney(page, "activity-embossed-empty-state");
  const search = page.getByRole("searchbox", { name: "Search providers" });
  await search.fill("Tavily");
  await expect(providers.getByRole("listitem")).toHaveCount(1);
  const pin = providers.getByRole("button", { name: "Pin Tavily" });
  await pin.click();
  await expect(pin).toHaveAttribute("aria-pressed", "true");
  await search.clear();
  await expect(providers.getByRole("listitem").first()).toContainText("Tavily");
  await search.fill("not a provider");
  await expect(
    page.getByRole("status").filter({ hasText: "No matching providers" }),
  ).toBeVisible();
});

test("Activity owns the overview while Home remains a separate page", async ({
  page,
}) => {
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ws-metrics")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Usage", exact: true }),
  ).toHaveCount(0);
  await captureJourney(page, "dashboard-reserved");
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  await page.getByRole("link", { name: "Activity", exact: true }).click();
  await expect(page).toHaveURL(/#dashboard\/activity$/);
  await expect(
    page.getByRole("heading", { name: "Activity", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ws-metric")).toHaveCount(4);
  await expect(
    page.getByRole("heading", { name: "No requests yet", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Provider usage" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Connect agent", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View requests", exact: true }).click();
  await expect(page).toHaveURL(/#dashboard\/requests$/);
  await expect(
    page.getByRole("heading", { name: "Request log", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Search requests" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Request log", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  const navigation = page.getByRole("navigation", { name: "User navigation" });
  await expect(
    navigation.getByRole("link", { name: "Activity", exact: true }),
  ).toHaveAttribute("aria-current", "location");
  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).not.toHaveClass("selected");
  if (test.info().project.name === "mobile")
    await page.keyboard.press("Escape");
  await page
    .getByRole("link", { name: "Back to activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Activity", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Request log", exact: true }),
  ).toBeVisible();
});
