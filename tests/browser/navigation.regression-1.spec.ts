import { test, expect } from "@playwright/test";

// Regression: ISSUE-002 — browser history and hash changes left the wrong screen visible.
// Found by /qa on 2026-11-01.
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-01.md
test("Back and Forward restore screens without creating extra history entries", async ({
  page,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  await expect(page).toHaveURL(/#inspector$/);
  await page.getByRole("button", { name: "Provider intelligence" }).click();
  await expect(page).toHaveURL(/#intelligence$/);
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "The execution behind the answer." }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Save intent" })).toBeVisible();
  await expect(page).toHaveURL(/#workspace$/);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "The execution behind the answer." }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "A view beyond the API call." }),
  ).toBeVisible();
});

test("history restores the selected task as well as its screen", async ({
  page,
}) => {
  await page.goto("/research/");
  await page
    .getByLabel("Search query", { exact: true })
    .fill("QA history first");
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(page.locator(".session-title")).toContainText(
    "QA history first",
  );
  const first = page.url();
  await page
    .getByRole("button", { name: "New research", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Search query", { exact: true })
    .fill("QA history second");
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(page.locator(".session-title")).toContainText(
    "QA history second",
  );
  const second = page.url();
  const firstId = new URL(first).hash.split("/").at(-1)!;
  const secondId = new URL(second).hash.split("/").at(-1)!;
  await page.getByRole("button", { name: /Routing inspector/ }).click();
  const sessions = page.getByRole("combobox", {
    name: "Inspect research session",
  });
  await sessions.selectOption(firstId);
  await expect(sessions).toHaveValue(firstId);
  await expect(page).toHaveURL(first.replace("#workspace", "#inspector"));
  await page.goBack();
  await expect(page).toHaveURL(second.replace("#workspace", "#inspector"));
  await expect(sessions).toHaveValue(secondId);
  await page.goBack();
  await expect(page).toHaveURL(second);
  await expect(page.locator(".session-title")).toContainText(
    "QA history second",
  );
  await page.goForward();
  await expect(sessions).toHaveValue(secondId);
  await page.goForward();
  await expect(sessions).toHaveValue(firstId);
  await page.getByRole("button", { name: "Research", exact: true }).click();
  await expect(page).toHaveURL(first);
  await expect(page.locator(".session-title")).toContainText(
    "QA history first",
  );
});

test("same-document hash links switch screens and can clear a selected task", async ({
  page,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(page.locator(".session-title")).toBeVisible();
  const taskId = new URL(page.url()).hash.split("/").at(-1)!;
  await page.goto(`/research/#inspector/${taskId}`);
  await expect(
    page.getByRole("heading", { name: "The execution behind the answer." }),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Inspect research session" }),
  ).toHaveValue(taskId);
  await page.goto("/research/#workspace");
  await expect(page.getByRole("button", { name: "Save intent" })).toBeVisible();
  await expect(page.locator(".session-title")).toHaveCount(0);
});

test("leaving a loading session prevents its late response from restoring it", async ({
  page,
}) => {
  await page.goto("/research/");
  await page
    .getByLabel("Search query", { exact: true })
    .fill("QA delayed navigation");
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(page.locator(".session-title")).toBeVisible();
  const taskId = new URL(page.url()).hash.split("/").at(-1)!;
  await page
    .getByRole("button", { name: "New research", exact: true })
    .first()
    .click();
  let release!: () => void;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const finished = new Promise<void>((resolve) => (finish = resolve));
  await page.route(`**/api/tasks/${taskId}`, async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
    finish();
  });
  await page.goto(`/research/#workspace/${taskId}`);
  await expect(
    page.getByRole("heading", { name: "Loading research session…" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New research", exact: true })
    .last()
    .click();
  await expect(page.getByRole("button", { name: "Save intent" })).toBeVisible();
  release();
  await finished;
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(page).toHaveURL(/#workspace$/);
  await expect(page.locator(".session-title")).toHaveCount(0);
});

test("an unavailable deep-linked task can be left through New research", async ({
  page,
}) => {
  await page.goto("/research/#workspace/00000000-0000-4000-8000-000000000000");
  await expect(
    page.getByRole("heading", { name: "Research session unavailable" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "New research", exact: true })
    .last()
    .click();
  await expect(page.getByRole("button", { name: "Save intent" })).toBeVisible();
  await expect(page).toHaveURL(/#workspace$/);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
