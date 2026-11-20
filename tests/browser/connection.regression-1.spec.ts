import { test, expect, type Page } from "@playwright/test";

const testToken = "QA_ONLY_CONNECTION_TOKEN";
const authError = "Enter the server access token to connect.";
async function connect(page: Page, token: string) {
  await page
    .getByRole("button", { name: "Connections and settings", exact: true })
    .click();
  await page.getByLabel("Account access token").fill(token);
  await page
    .getByRole("button", { name: "Connect to Two Hands", exact: true })
    .click();
}

// Regression: ISSUE-003 — analytics remained unauthorized after a successful connection.
// Found by /qa on 2026-11-01.
// Report: .gstack/qa-reports/qa-report-localhost-2026-11-01.md
test("analytics recovers after connecting without leaving the screen", async ({
  page,
}) => {
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/config") {
      await route.continue();
      return;
    }
    if (route.request().headers().authorization === `Bearer ${testToken}`)
      await route.continue();
    else await route.fulfill({ status: 401, json: { error: authError } });
  });
  await page.goto("/research/#intelligence");
  await expect(
    page.getByText(authError, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("status", { name: "Loading provider analytics" }),
  ).toHaveCount(0);
  await connect(page, testToken);
  await expect(
    page.getByRole("heading", { name: "No usage yet" }),
  ).toBeVisible();
  await expect(page.getByText(authError, { exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/#intelligence$/);

  await connect(page, "QA_ONLY_WRONG_TOKEN");
  await expect(
    page.getByText(authError, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "No usage yet" })).toHaveCount(
    0,
  );
  await connect(page, testToken);
  await expect(
    page.getByRole("heading", { name: "No usage yet" }),
  ).toBeVisible();
});

test("a delayed unauthorized analytics response cannot replace the connected view", async ({
  page,
}) => {
  let release!: () => void;
  let finish!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  const finished = new Promise<void>((resolve) => (finish = resolve));
  let intercepted = false;
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/config") {
      await route.continue();
      return;
    }
    if (route.request().headers().authorization === `Bearer ${testToken}`) {
      await route.continue();
      return;
    }
    if (route.request().url().endsWith("/analytics")) {
      intercepted = true;
      await gate;
      await route.fulfill({ status: 401, json: { error: authError } });
      finish();
    } else await route.fulfill({ status: 401, json: { error: authError } });
  });
  await page.goto("/research/#intelligence");
  await expect.poll(() => intercepted).toBe(true);
  await connect(page, testToken);
  await expect(
    page.getByRole("heading", { name: "No usage yet" }),
  ).toBeVisible();
  release();
  await finished;
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
  await expect(
    page.getByRole("heading", { name: "No usage yet" }),
  ).toBeVisible();
  await expect(page.getByText(authError, { exact: true })).toHaveCount(0);
});
