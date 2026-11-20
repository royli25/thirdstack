import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
test.use({ baseURL: "http://127.0.0.1:3106" });
test("known links work without search keys; changed evidence needs re-review; privacy can be withdrawn and local history deleted", async ({
  page,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(
    page.getByRole("button", { name: "Run live search", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Public HTTPS URL")
    .fill("https://example.com/evidence");
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await expect(page.locator(".source-card")).toHaveCount(1);
  await expect(page.getByText("Supplied by you")).toBeVisible();
  await page.getByRole("button", { name: "Extract page", exact: true }).click();
  await expect(page.locator(".extraction-provenance")).toContainText(
    "keyless free tier",
  );
  const card = page.locator(".source-card").first();
  await card.getByRole("button", { name: "Review evidence" }).click();
  await card.getByLabel("Organization name").fill("Test-only organization");
  for (const criterion of [
    "Currently operating",
    "External funding evidence",
    "Agent payments relevance",
  ])
    await card.getByLabel(criterion, { exact: true }).selectOption("pass");
  await card
    .getByLabel("Evidence note")
    .fill(
      "Test fixture only: review interactions, not a factual company claim.",
    );
  await card.getByRole("button", { name: "Accept organization" }).click();
  await expect(page.locator(".company-item")).toHaveCount(1);
  await card.getByRole("button", { name: "Extract page", exact: true }).click();
  await expect(page.locator(".company-item")).toHaveCount(0);
  await expect(card.locator(".badge")).toHaveText("pending");
  await card.getByRole("button", { name: "Edit review" }).click();
  await expect(
    card.getByLabel("Currently operating", { exact: true }),
  ).toHaveValue("unknown");
  const consent = page.getByRole("checkbox", {
    name: "Include in provider aggregates",
  });
  await consent.check();
  await expect(consent).toBeChecked();
  await consent.uncheck();
  await expect(consent).not.toBeChecked();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Delete task & local history" })
    .click();
  await page.getByRole("button", { name: "Keep task" }).click();
  await expect(page.locator(".source-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Delete task & local history" })
    .click();
  await page
    .getByRole("button", { name: "Delete local task", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Save intent" })).toBeVisible();
});
test("provider HTTP 200 does not hide an extracted page HTTP 404", async ({
  page,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Save intent" }).click();
  await page.getByLabel("Public HTTPS URL").fill("https://example.com/missing");
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await page.getByRole("button", { name: "Extract page", exact: true }).click();
  await expect(page.locator(".extraction-provenance")).toContainText(
    "page HTTP 404",
  );
  const card = page.locator(".source-card").first();
  await card.getByRole("button", { name: "Review evidence" }).click();
  await card.getByLabel("Organization name").fill("Not verified");
  for (const criterion of [
    "Currently operating",
    "External funding evidence",
    "Agent payments relevance",
  ])
    await card.getByLabel(criterion, { exact: true }).selectOption("pass");
  await card.getByLabel("Evidence note").fill("This fixture has a page error.");
  await expect(
    card.getByRole("button", { name: "Accept organization" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  await page
    .getByRole("button", { name: /provider response.*HTTP 200/ })
    .click();
  await expect(page.getByLabel("Recorded event JSON")).toContainText(
    '"pageStatus": 404',
  );
});
test("a delayed older task response cannot restore a company accepted before its evidence changed", async ({
  page,
  request,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Save intent" }).click();
  await page
    .getByLabel("Public HTTPS URL")
    .fill("https://example.com/stale-response-test");
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  const card = page.locator(".source-card").first();
  await card.getByRole("button", { name: "Extract page", exact: true }).click();
  await card.getByRole("button", { name: "Review evidence" }).click();
  await card
    .getByLabel("Organization name")
    .fill("Test-only stale response case");
  for (const criterion of [
    "Currently operating",
    "External funding evidence",
    "Agent payments relevance",
  ])
    await card.getByLabel(criterion, { exact: true }).selectOption("pass");
  await card
    .getByLabel("Evidence note")
    .fill("Test fixture assessment before the source changes.");
  await card.getByRole("button", { name: "Accept organization" }).click();
  await expect(page.locator(".company-item")).toHaveCount(1);
  const taskId = new URL(page.url()).hash.split("/").at(-1)!;
  const old = await (await request.get(`/api/tasks/${taskId}`)).json();
  let release!: () => void;
  let completed!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const finished = new Promise<void>((r) => (completed = r));
  let intercepted = false;
  await page.route(`**/api/tasks/${taskId}`, async (route) => {
    if (route.request().method() === "GET" && !intercepted) {
      intercepted = true;
      await gate;
      await route.fulfill({ json: old });
      completed();
    } else await route.continue();
  });
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  await page
    .getByRole("combobox", { name: "Inspect research session" })
    .selectOption(taskId);
  await expect.poll(() => intercepted).toBe(true);
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await card.getByRole("button", { name: "Extract page", exact: true }).click();
  await expect(page.locator(".company-item")).toHaveCount(0);
  release();
  await finished;
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(page.locator(".company-item")).toHaveCount(0);
  await expect(card.locator(".badge")).toHaveText("pending");
});
