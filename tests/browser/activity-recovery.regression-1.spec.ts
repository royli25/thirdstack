import { expect, test } from "@playwright/test";

for (const route of ["dashboard/activity", "dashboard/requests"]) {
  test(`${route} distinguishes unavailable activity from empty history and retries`, async ({
    page,
  }) => {
    let unavailable = true;
    let requests = 0;
    await page.route("**/api/account/activity?*", async (request) => {
      requests++;
      if (unavailable) {
        await request.fulfill({
          status: 503,
          json: { error: "TEST FIXTURE: activity temporarily unavailable" },
        });
      } else {
        await request.fulfill({
          json: { items: [], total: 0, page: 1, pageSize: 20 },
        });
      }
    });
    await page.goto(`/#${route}`);
    await expect(
      page.getByRole("heading", { name: "Activity unavailable", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("alert")).toContainText(
      "activity temporarily unavailable",
    );
    await expect(
      page.getByRole("heading", { name: "No requests yet", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".ws-pagination")).toHaveCount(0);
    const failedRequests = requests;
    unavailable = false;
    await page
      .getByRole("button", { name: "Retry activity", exact: true })
      .click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "No requests yet", exact: true }),
    ).toBeVisible();
    expect(requests).toBeGreaterThan(failedRequests);
    if (route.endsWith("/requests"))
      await expect(page.locator(".ws-pagination")).toContainText("0 requests");
  });
}

test("unavailable usage remains unknown instead of announcing measured zero counts", async ({
  page,
}) => {
  let unavailable = true;
  await page.route("**/api/account/usage?*", async (request) => {
    if (unavailable) {
      await request.fulfill({
        status: 503,
        json: { error: "TEST FIXTURE: usage temporarily unavailable" },
      });
    } else {
      await request.fulfill({
        json: {
          days: 7,
          since: "2026-11-07T00:00:00.000Z",
          requests: 0,
          succeeded: 0,
          failed: 0,
          running: 0,
          interrupted: 0,
          estimatedMicros: 0,
          reportedUsd: null,
          usdReportingCalls: 0,
          averageLatencyMs: null,
          latencySamples: 0,
          series: [],
          providers: [],
        },
      });
    }
  });
  await page.goto("/#dashboard/activity");
  await expect(page.getByRole("alert")).toContainText(
    "usage temporarily unavailable",
  );
  const requests = page.getByRole("link", { name: /^Tool requests/ });
  const success = page.getByRole("link", { name: /^API success rate/ });
  const latency = page.getByRole("link", { name: /^Average latency/ });
  await expect(requests).toContainText("Request counts unavailable");
  await expect(success).toContainText("Completion counts unavailable");
  await expect(latency).toContainText("Latency samples unavailable");
  await expect(requests).not.toContainText("0 running");
  unavailable = false;
  await page
    .getByRole("button", { name: "Refresh account", exact: true })
    .click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(requests).toContainText("0 running · 0 failed");
  await expect(success).toContainText("No completed requests in this period");
  await expect(latency).toContainText("0 timed calls");
});

test("empty filtered activity clears filters in place and restores search focus", async ({
  page,
}) => {
  let requestQuery = "";
  await page.route("**/api/account/activity?*", async (request) => {
    requestQuery = new URL(request.request().url()).search;
    await request.fulfill({
      json: { items: [], total: 0, page: 1, pageSize: 20 },
    });
  });
  await page.goto("/#dashboard/requests");
  const search = page.getByRole("textbox", {
    name: "Search requests",
    exact: true,
  });
  await search.fill("missing evidence");
  await page
    .getByRole("combobox", { name: "Provider", exact: true })
    .selectOption("exa");
  await page
    .getByRole("combobox", { name: "Request status", exact: true })
    .selectOption("failed");
  await expect(
    page.getByRole("heading", { name: "No matching requests", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page).toHaveURL(/#dashboard\/requests$/);
  await expect(search).toHaveValue("");
  await expect(search).toBeFocused();
  await expect(
    page.getByRole("combobox", { name: "Provider", exact: true }),
  ).toHaveValue("all");
  await expect(
    page.getByRole("combobox", { name: "Request status", exact: true }),
  ).toHaveValue("all");
  await expect(
    page.getByRole("heading", { name: "No requests yet", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => {
      const query = new URLSearchParams(requestQuery);
      return [
        query.get("q"),
        query.get("provider"),
        query.get("status"),
        query.get("page"),
      ];
    })
    .toEqual(["", "all", "all", "1"]);
});
