import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
test.use({ baseURL: "http://127.0.0.1:3102" });
test("HTTP 200 with insufficient evidence triggers a real engine fallback; review produces a linked shortlist", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/research/");
  await page
    .getByLabel("Search query", { exact: true })
    .fill("stale evidence fixture");
  await page.getByRole("button", { name: "Save intent" }).click();
  await page
    .getByRole("button", { name: "Run live search", exact: true })
    .click();
  await expect(
    page.getByText("Search complete", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".source-card")).toHaveCount(4);
  await expect(page.getByText("0 / 20", { exact: true }).first()).toBeVisible();
  const card = page.locator(".source-card").nth(1);
  await card.getByRole("button", { name: "Review evidence" }).click();
  await card.getByLabel("Organization name").fill("Fixture Aurora Payments");
  await card
    .getByLabel("Currently operating", { exact: true })
    .selectOption("pass");
  await card
    .getByLabel("External funding evidence", { exact: true })
    .selectOption("pass");
  await card
    .getByLabel("Agent payments relevance", { exact: true })
    .selectOption("pass");
  await card
    .getByLabel("Evidence note")
    .fill(
      "Test-only human review: funding source and activity source support the rubric.",
    );
  await card.getByRole("button", { name: "Accept organization" }).click();
  await expect(page.getByText("1 / 20", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".company-item")).toHaveCount(1);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/apilayer-companies/);
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/fixture-results-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  await expect(
    page.getByRole("button", { name: /fallback triggered/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /provider response.*tavily.*HTTP 200/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /provider candidates/ })
    .first()
    .click();
  await expect(page.getByText("RECORDED EVENT PAYLOAD").first()).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/fixture-routing-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("compare calls use both providers and extraction consumes the same task ledger", async ({
  page,
}) => {
  await page.goto("/research/");
  await page
    .getByRole("button", { name: /Compare providers.*Two live calls/ })
    .click();
  await page.getByRole("button", { name: "Save intent" }).click();
  await page
    .getByRole("button", { name: "Run live search", exact: true })
    .click();
  await expect(
    page.getByText("Search complete", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".source-card")).toHaveCount(6);
  await page.getByLabel("Filter evidence by provider").selectOption("exa");
  await expect(page.locator(".source-card")).toHaveCount(3);
  await page.getByLabel("Filter evidence by provider").selectOption("all");
  await page.getByLabel("Unique URLs only").check();
  await expect(page.locator(".source-card")).toHaveCount(3);
  await page.getByLabel("Unique URLs only").uncheck();

  const before = await page.locator(".stat-card").nth(1).innerText();
  await page
    .locator(".source-card")
    .first()
    .getByRole("button", { name: "Extract page" })
    .click();
  await expect(page.locator(".source-snippet").first()).toContainText(
    "TEST FIXTURE extraction",
  );
  await expect(page.locator(".stat-card").nth(1)).not.toHaveText(before);
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  await expect(
    page.getByRole("button", { name: /comparison requested/ }),
  ).toBeVisible();
});
test("one consented task exposes honest aggregate insights", async ({
  page,
  request,
}) => {
  for (let i = 0; i < 1; i++) {
    const created = await request.post("/api/tasks", {
      data: {
        prompt: "PRIVATE FIXTURE INTENT: agent payments funding research",
        query: `fixture comparison ${i}`,
        requiredCount: 2,
        budgetMicros: 50000,
        criteria: ["Fixture evidence"],
        domains: [],
        mode: "compare",
        preference: "balanced",
        consent: true,
      },
    });
    expect(created.ok()).toBe(true);
    const task = await created.json();
    expect(
      (await request.post(`/api/tasks/${task.id}/run`, { data: {} })).status(),
    ).toBe(202);
    await expect
      .poll(async () => {
        const r = await request.get(`/api/tasks/${task.id}`);
        return (await r.json()).status;
      })
      .not.toBe("running");
  }
  const data = await (await request.get("/api/analytics")).json();
  expect(data.suppressed).toBe(false);
  expect(JSON.stringify(data)).not.toContain("PRIVATE FIXTURE INTENT");
  expect(data.providers.find((p: any) => p.provider === "exa").suppressed).toBe(
    false,
  );
  await page.goto("/research/#intelligence");
  await expect(
    page.getByRole("columnheader", { name: "Eligible / first selected" }),
  ).toBeVisible();
  await expect(
    page.getByText("Coverage recovered after fallback"),
  ).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
});
