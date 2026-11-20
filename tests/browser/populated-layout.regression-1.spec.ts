import { expect, test, type Locator, type Page } from "@playwright/test";
import { BASE_SEPOLIA, type FundingSummary } from "../../server/funding-types";
import type { ActivityItem } from "../../server/account-data-types";

const recordedAt = "2026-11-13T12:00:00.000Z";
const activity: ActivityItem = {
  id: "layout-fixture-call",
  sessionId: "layout-fixture-session",
  requestKey: "layout-fixture-request",
  tool: "exa_search",
  provider: "exa",
  arguments: { query: "TEST FIXTURE: populated table containment" },
  statedReason: "TEST FIXTURE: layout regression only",
  status: "succeeded",
  startedAt: recordedAt,
  finishedAt: recordedAt,
  latencyMs: 125,
  estimateMicros: 17000,
  sessionTitle: "TEST FIXTURE: table containment",
  host: "layout-fixture",
  model: "layout-fixture-model",
  reportedUsd: null,
  reportedCredits: null,
};
const funding: FundingSummary = {
  enabled: true,
  unavailableReason: null,
  network: BASE_SEPOLIA,
  recipient: "0x2222222222222222222222222222222222222222",
  balanceUnits: 10000000,
  totalDeposits: 1,
  intents: [],
  testnet: true,
  spendableForProviders: false,
  stripe: {
    enabled: true,
    unavailableReason: null,
    mode: "test",
    minimumCents: 500,
    maximumCents: 100000,
  },
  stripeIntents: [
    {
      id: "layout-fixture-card-deposit",
      requestKey: "layout-fixture-card-request",
      amountCents: 1234,
      status: "partially_refunded",
      checkoutSessionId: "cs_test_layout_fixture",
      checkoutUrl: null,
      paymentIntentId: "pi_layout_fixture",
      chargeId: "ch_layout_fixture",
      refundedCents: 234,
      disputed: false,
      netCreditUnits: 10000000,
      createdAt: recordedAt,
      updatedAt: recordedAt,
      lastCheckedAt: recordedAt,
      message: "TEST FIXTURE: partial refund for layout verification only.",
    },
  ],
  entries: [],
};

async function expectContainedPage(page: Page) {
  const viewport = page.viewportSize()!;
  await expect
    .poll(() =>
      page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({ client: viewport.width, scroll: viewport.width });
}

async function scrollTableWithKeyboard(region: Locator) {
  await region.focus();
  const bounds = await region.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
  }));
  expect(bounds.scroll).toBeGreaterThan(bounds.client);
  await region.press("ArrowRight");
  await expect
    .poll(() => region.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);
}

for (const width of [375, 768]) {
  test(`populated activity stays inside its horizontal scroll region at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route("**/api/account/activity?*", (route) =>
      route.fulfill({
        json: { items: [activity], total: 1, page: 1, pageSize: 20 },
      }),
    );
    await page.goto("/#dashboard/requests");
    const region = page.getByRole("region", {
      name: "Scrollable request and usage table",
      exact: true,
    });
    await expect(region).toContainText(activity.arguments.query!);
    await expectContainedPage(page);
    await scrollTableWithKeyboard(region);
    await expectContainedPage(page);
  });

  test(`populated credit history does not expand the page or collapse its dialog backdrop at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.route("**/api/account/funding", (route) =>
      route.fulfill({ json: funding }),
    );
    await page.goto("/#dashboard/credits");
    const region = page.getByRole("region", {
      name: "Card deposit history",
      exact: true,
    });
    await expect(region).toContainText("Partially refunded");
    await expectContainedPage(page);
    await scrollTableWithKeyboard(region);
    await region.getByRole("button", { name: "View card deposit" }).click();
    await expect(
      page.getByRole("dialog", { name: "Card deposit details" }),
    ).toBeVisible();
    // A leaked table header used to inflate the layout viewport and make
    // modal scrollbar compensation remove hundreds of pixels from the body.
    await expect
      .poll(() =>
        page
          .locator("body")
          .evaluate((element) => element.getBoundingClientRect().width),
      )
      .toBeGreaterThan(width - 24);
    await expectContainedPage(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectContainedPage(page);
  });
}
