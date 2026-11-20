import { test, expect } from "@playwright/test";
import { captureJourney } from "./helpers/launch-screenshots";
import AxeBuilder from "./helpers/accessibility";

test("test funding remains disabled by default with clear setup instructions", async ({
  page,
}) => {
  await page.goto("/#dashboard/credits");
  await expect(
    page.getByRole("heading", { name: "Credits", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Loading deposit history…")).toHaveCount(0);
  await expect(
    page.getByText("Your test balance", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add test credits", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".ws-funding-method").first()).toContainText(
    "Unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Deposit with Stripe", exact: true }),
  ).toBeDisabled();
  await expect(page.locator(".ws-funding-notice")).toContainText(
    "No real-money deposits are accepted",
  );
  await expect(
    page.getByRole("link", { name: "Get test USDC", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Payments disabled", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/workspace owner can enable/)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Network details", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Credit ledger", exact: true }),
  ).toHaveCount(0);
  await captureJourney(page, "payments-disabled");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("fixture test deposit creates, verifies, and credits exactly once", async ({
  page,
  request,
}) => {
  const base = "http://127.0.0.1:3102";
  // Fresh requests may be created in both projects; the shared fixture chain transaction can credit only once.
  const uniqueHash = `0x${"33".repeat(32)}`;
  await page.goto(`${base}/#dashboard/credits`);
  await page
    .getByRole("button", { name: "Add test credits", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Sending wallet address" })
    .fill(`0x${"11".repeat(20)}`);
  await page
    .getByRole("button", { name: "Create deposit request", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Awaiting transfer");
  await page
    .getByRole("textbox", { name: "Deposit transaction hash", exact: true })
    .fill(uniqueHash);
  const before = await (
    await request.get(`${base}/api/account/funding`)
  ).json();
  await page
    .getByRole("button", { name: "Verify transaction", exact: true })
    .click();
  if (before.onchainDeposits === 0) {
    await expect(page.getByRole("dialog")).toContainText(
      "10.00 test USDC added",
    );
  } else {
    await expect(page.getByRole("dialog")).toContainText(
      "already been credited",
    );
  }
  const after = await (await request.get(`${base}/api/account/funding`)).json();
  expect(after.onchainBalanceUnits).toBe(10000000);
  expect(after.onchainDeposits).toBe(1);
  await expect(page.getByRole("dialog")).toHaveCSS("opacity", "1");
  await page.getByRole("dialog").evaluate(async (dialog) => {
    await Promise.all(
      dialog
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.locator(".ws-balance-card")).toContainText("test credits");
  await page.reload();
  await expect(page.locator(".ws-balance-card")).toContainText("test credits");
});

test("turning payments off preserves historical credits and receipts", async ({
  page,
  request,
}) => {
  const base = "http://127.0.0.1:3102";
  const before = await (
    await request.get(base + "/api/account/funding")
  ).json();
  if (!before.entries?.length) {
    const created = await request.post(base + "/api/account/funding/deposits", {
      data: {
        requestKey: crypto.randomUUID(),
        amount: "10",
        sender: `0x${"11".repeat(20)}`,
      },
    });
    expect(created.status()).toBe(201);
    const deposit = await created.json();
    const verified = await request.post(
      base + `/api/account/funding/deposits/${deposit.id}/verify`,
      {
        data: { transactionHash: `0x${"33".repeat(32)}` },
      },
    );
    expect(verified.status()).toBe(200);
  }
  await page.route("**/api/account/funding", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    await route.fulfill({
      response,
      json: {
        ...data,
        enabled: false,
        stripe: { ...data.stripe, enabled: false },
      },
    });
  });
  await page.goto(base + "/#dashboard/credits");
  await expect(
    page.getByRole("button", { name: "Add test credits", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "Deposit history", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ws-balance-card")).toContainText("test credits");
  await expect(
    page.getByRole("region", { name: "Credit ledger", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View deposit", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await captureJourney(page, "disabled-payments-historical-receipt");
});
