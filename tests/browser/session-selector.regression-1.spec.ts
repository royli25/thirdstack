import { test, expect } from "@playwright/test";

// Regression: ISSUE-005 — a newly linked task displayed an unrelated session label.
// Found by /qa on 2026-11-01.
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-01.md
test("a task created by another client appears in the selector when its link opens", async ({
  page,
  request,
}) => {
  await page.goto("/research/#inspector");
  await expect(
    page.getByRole("heading", { name: "The execution behind the answer." }),
  ).toBeVisible();
  const response = await request.post("/api/tasks", {
    data: {
      prompt:
        "QA ONLY: a different client creates a research session while this tab is open.",
      query: "QA externally created research session",
      requiredCount: 1,
      budgetMicros: 10000,
      criteria: ["Fixture criterion"],
      domains: [],
      mode: "route",
      preference: "balanced",
      consent: false,
    },
  });
  expect(response.status()).toBe(201);
  const task = await response.json();
  await page.goto(`/research/#inspector/${task.id}`);
  const sessions = page.getByRole("combobox", {
    name: "Inspect research session",
  });
  await expect(sessions).toHaveValue(task.id);
  await expect(sessions.locator("option:checked")).toContainText(
    "QA externally created research session",
  );
  await expect(
    page.getByRole("button", { name: /intent created/i }),
  ).toBeVisible();
  await expect(
    page.getByText("Historical live recording · read only"),
  ).toHaveCount(0);
});
