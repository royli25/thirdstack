import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3102";

// The fixture server is SQLite, where the wallet is inactive. These tests
// drive the real pages and replace only the JSON a hosted account on credit
// billing would receive. tests/wallet-surface.test.ts covers the server logic
// against PostgreSQL.
const at = "2026-11-17T12:00:00.000Z";
const callId = "55555555-5555-4555-8555-555555555555";
const sandboxWallet = {
  mode: "test",
  enforced: true,
  active: true,
  postedMicros: 5982400,
  heldMicros: 0,
  availableMicros: 5982400,
  chargedMicros: 17600,
  frozen: false,
  enrolled: true,
  billingAvailable: true,
  callHoldMicros: 8800,
  callsRemaining: 679,
  lowBalance: false,
};
const sandboxStripe = {
  enabled: true,
  unavailableReason: null,
  mode: "test",
  minimumCents: 500,
  maximumCents: 100000,
};
/** A hosted sandbox account: 16 earlier test credits and a prepaid balance. */
async function account(
  page: Page,
  override: { wallet?: object | null; stripe?: object } = {},
) {
  await page.route(
    /\/api\/(account|workspace)\/funding(\?.*)?$/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const body = await (await route.fetch()).json();
      await route.fulfill({
        json: {
          ...body,
          balanceUnits: 16000000,
          entries: [
            {
              id: 1,
              source: "stripe",
              sourceId: "dep",
              deltaUnits: 16000000,
              kind: "deposit",
              reference: "pi_fixture",
              createdAt: at,
            },
          ],
          stripe: { ...sandboxStripe, ...override.stripe },
          wallet:
            override.wallet === null
              ? {
                  ...sandboxWallet,
                  enforced: false,
                  active: false,
                  enrolled: false,
                  availableMicros: 0,
                  postedMicros: 0,
                  chargedMicros: 0,
                  callHoldMicros: null,
                  callsRemaining: null,
                }
              : { ...sandboxWallet, ...override.wallet },
          walletEntries:
            override.wallet === null
              ? []
              : [
                  {
                    kind: "usage",
                    micros: -8800,
                    reference: null,
                    createdAt: at,
                  },
                  {
                    kind: "deposit",
                    micros: 6000000,
                    reference: "pi_fixture",
                    createdAt: at,
                  },
                ],
        },
      });
    },
  );
  await page.route("**/api/account/funding/activity?*", (route) =>
    route.fulfill({
      json: {
        mode: "test",
        total: 3,
        page: 1,
        pageSize: 25,
        items: [
          {
            type: "refused",
            callId: null,
            sessionId: null,
            tool: "exa_search",
            at,
            outcome: "refused",
            reason: "insufficient_balance",
            providerCostMicros: null,
            markupMicros: null,
            chargedMicros: 0,
            heldMicros: 8800,
            count: 3,
          },
          {
            type: "call",
            callId: "66666666-6666-4666-8666-666666666666",
            sessionId: null,
            tool: "tavily_search",
            at,
            outcome: "released",
            reason: "failed",
            providerCostMicros: 8000,
            markupMicros: 800,
            chargedMicros: 0,
            heldMicros: 8800,
            count: 1,
          },
          {
            type: "call",
            callId,
            sessionId: null,
            tool: "tavily_search",
            at,
            outcome: "charged",
            reason: null,
            providerCostMicros: 8000,
            markupMicros: 800,
            chargedMicros: 8800,
            heldMicros: 8800,
            count: 1,
          },
        ],
      },
    }),
  );
}

test("an account on credit billing sees one spendable balance, per-call charges and a statement", async ({
  page,
}) => {
  await account(page);
  let statementUrl = "";
  await page.route("**/api/account/funding/statement?*", (route) => {
    statementUrl = route.request().url();
    return route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="statement.csv"',
      },
      body: "recorded_at_utc,type\r\n2026-11-01T00:00:00.000Z,opening_balance\r\n",
    });
  });
  await page.goto(`${base}/#dashboard/credits`);
  const main = page.locator("main");

  // One balance, on the page and in the sidebar. The test-credit card is gone.
  await expect(main).toContainText("Available credits");
  await expect(main).toContainText("$5.9824");
  await expect(main.locator(".ws-balance-card")).toHaveCount(1);
  await expect(main).not.toContainText("Your test balance");
  await expect(main).not.toContainText("USDC on Base Sepolia");
  await expect(main).toContainText(
    "A paid call needs $0.0088 available. Your credits cover about 679 more.",
  );
  await expect(page.locator(".customer-navigation-balance")).toContainText(
    "$5.9824 sandbox",
  );
  await expect(page.locator(".customer-add-funds")).toContainText(
    "Add credits",
  );
  // Sandbox credits are never worded as real money.
  await expect(main).toContainText("Sandbox credits");
  await expect(main).toContainText("No real money is taken.");
  await expect(
    main.getByRole("button", { name: "Add sandbox credits", exact: true }),
  ).toBeEnabled();

  // Per-call charges: charged, not charged with a reason, and refused.
  const charges = page.getByRole("region", { name: "Tool call charges" });
  await expect(charges.getByRole("row")).toHaveCount(4);
  const charged = charges.getByRole("row").nth(3);
  await expect(charged).toContainText("tavily_search");
  await expect(charged).toContainText("Charged");
  await expect(charged).toContainText("$0.008");
  await expect(charged).toContainText("$0.0008");
  await expect(charged).toContainText("$0.0088");
  await expect(charges.getByRole("row").nth(2)).toContainText("Not charged");
  await expect(charges.getByRole("row").nth(2)).toContainText(
    "The call failed, so its hold was returned.",
  );
  const refused = charges.getByRole("row").nth(1);
  await expect(refused).toContainText("exa_search × 3");
  await expect(refused).toContainText("Refused");
  await expect(refused).toContainText("Credits did not cover the call.");
  await expect(refused).toContainText("Not run");
  await expect(main).toContainText(
    "Amounts are sandbox credits, not real money.",
  );
  await expect(
    page.getByRole("region", { name: "Credit activity" }),
  ).toContainText("Tool call");

  // Statement export for a date range.
  await page.getByLabel("Statement start date").fill("2026-11-01");
  await page.getByLabel("Statement end date").fill("2026-11-17");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download CSV" }).click();
  expect((await download).suggestedFilename()).toBe(
    "two-hands-sandbox-credits-2026-11-01-to-2026-11-17.csv",
  );
  expect(statementUrl).toContain("from=2026-11-01&to=2026-11-17");

  // The activity note names the section that is actually on a sandbox page.
  await expect(main).toContainText(
    "plus 10%. Each card top-up is listed under Card deposit history.",
  );

  // Earlier test credits are kept, out of the way, and never called spendable.
  const legacy = main.locator(".ws-legacy-credits");
  await expect(legacy).toContainText("16.00 test credits");
  await expect(legacy).toContainText("do not pay for tool calls");
  await expect(page.getByRole("region", { name: "Credit ledger" })).toHaveCount(
    0,
  );
  await legacy
    .getByRole("button", { name: "Show test credit history" })
    .click();
  await expect(
    page.getByRole("region", { name: "Credit ledger" }),
  ).toContainText("16.00");

  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a top-up the account could not spend is not offered, and the page says why", async ({
  page,
}) => {
  const reason =
    "Top-ups open once Two Hands has turned on paid tools for this account. Until then credits could not be spent, so there is nothing to pay.";
  await account(page, {
    wallet: null,
    stripe: {
      enabled: false,
      unavailableReason: reason,
      blocked: "not_enrolled",
    },
  });
  await page.goto(`${base}/#dashboard/credits`);
  const main = page.locator("main");
  const method = main.locator("#stripe-deposits");
  await expect(method).toContainText("Why you can’t add credits yet");
  await expect(method).toContainText(reason);
  await expect(
    method.getByRole("button", { name: "Deposit with Stripe", exact: true }),
  ).toBeDisabled();
  // An account that is not on credit billing keeps the test-credit view.
  await expect(main).toContainText("Your test balance");
  await expect(page.locator(".customer-navigation-balance")).toContainText(
    "16.00 test",
  );
  // The explanation names no rate, allowance or limit.
  await expect(method).not.toContainText(/rate|allowance|limit/i);
  await expect(page.locator("[data-wallet-notice]")).toHaveCount(0);
});

test("the dashboard warns about low, used-up and frozen credits with the next step", async ({
  page,
}) => {
  await account(page, {
    wallet: { availableMicros: 26400, callsRemaining: 3, lowBalance: true },
  });
  await page.goto(`${base}/#dashboard`);
  await expect(
    page.getByRole("heading", { name: "Home", level: 1, exact: true }),
  ).toBeVisible();
  const notice = page.locator("[data-wallet-notice]");
  await expect(notice).toHaveAttribute("data-wallet-notice", "low");
  await expect(notice).toContainText("about 3 paid calls left");
  await expect(
    notice.getByRole("link", { name: "Add credits" }),
  ).toHaveAttribute("href", "#dashboard/credits/add-funds");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.unrouteAll({ behavior: "wait" });
  await account(page, {
    wallet: { availableMicros: 1200, callsRemaining: 0, lowBalance: true },
  });
  await page.goto(`${base}/#dashboard/activity`);
  await page.reload();
  await expect(notice).toHaveAttribute("data-wallet-notice", "empty");
  await expect(notice).toContainText("paid calls are being refused");
  await expect(notice).toContainText("Free tools still work.");

  await page.unrouteAll({ behavior: "wait" });
  await account(page, { wallet: { frozen: true } });
  await page.reload();
  await expect(notice).toHaveAttribute("data-wallet-notice", "frozen");
  await expect(notice).toContainText(
    "Paid tools are paused while a card payment is under review.",
  );
  await expect(
    notice.getByRole("link", { name: "See the payment" }),
  ).toHaveAttribute("href", "#dashboard/credits");
});

test("Activity shows what a call was charged and its cost breakdown", async ({
  page,
}) => {
  await account(page);
  await page.route(/\/api\/account\/activity\?/, async (route) => {
    await route.fulfill({
      json: {
        total: 1,
        page: 1,
        pageSize: 20,
        items: [
          {
            id: callId,
            sessionId: "77777777-7777-4777-8777-777777777777",
            requestKey: "fixture",
            tool: "tavily_search",
            provider: "tavily",
            arguments: { query: "isolated fixture" },
            statedReason: "Fixture",
            status: "succeeded",
            startedAt: at,
            finishedAt: at,
            latencyMs: 420,
            estimateMicros: 8000,
            sessionTitle: "Fixture session",
            host: "fixture-host",
            model: "fixture-model",
            reportedUsd: null,
            reportedCredits: 1,
            charge: {
              outcome: "charged",
              reason: null,
              providerCostMicros: 8000,
              markupMicros: 800,
              chargedMicros: 8800,
              heldMicros: 8800,
              mode: "test",
            },
          },
        ],
      },
    });
  });
  await page.goto(`${base}/#dashboard/requests`);
  const table = page.getByRole("region", {
    name: "Scrollable request and usage table",
  });
  await expect(
    table.getByRole("columnheader", { name: "Charged" }),
  ).toBeVisible();
  await expect(table.getByRole("row").nth(1)).toContainText("$0.0088");
  await table
    .getByRole("button", { name: `Inspect request ${callId}` })
    .click();
  const charge = page.getByRole("dialog").locator("[data-call-charge]");
  await expect(charge).toContainText("Charged");
  await expect(charge).toContainText("$0.008");
  await expect(charge).toContainText("Two Hands markup (10%)");
  await expect(charge).toContainText("$0.0008");
  await expect(charge).toContainText("Sandbox credits, not real money");
});

test("an operator records a balance adjustment after choosing the account and the mode", async ({
  page,
}) => {
  const pilot = "88888888-8888-4888-8888-888888888888";
  let posted: Record<string, unknown> | undefined;
  const item = {
    id: "99999999-9999-4999-8999-999999999999",
    accountId: pilot,
    account: "Pilot account",
    mode: "test",
    micros: -8800,
    actor: "admin credential fixture",
    note: "Reversed a duplicate charge, ticket 12.",
    createdAt: at,
  };
  let items: object[] = [];
  await page.route("**/api/admin/funding/adjustments*", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: {
          accounts: [
            {
              accountId: pilot,
              account: "Pilot account",
              fundingMode: "test",
              balances: [
                {
                  mode: "test",
                  postedMicros: 5982400,
                  heldMicros: 0,
                  availableMicros: 5982400,
                },
              ],
            },
          ],
          items,
        },
      });
    posted = route.request().postDataJSON();
    items = [item];
    await route.fulfill({
      json: {
        adjustment: item,
        balance: {
          postedMicros: 5973600,
          heldMicros: 0,
          availableMicros: 5973600,
        },
        replayed: false,
      },
    });
  });
  await page.goto(`${base}/#disputes`);
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  const form = page.getByRole("form", { name: "Balance adjustment" });
  const submit = form.getByRole("button", { name: "Record adjustment" });
  await expect(submit).toBeDisabled();
  await form.getByLabel("Account to adjust").click();
  await page.getByRole("option", { name: /Pilot account/ }).click();
  await form.getByLabel("Adjustment amount").fill("-0.0088");
  await form
    .getByLabel("Adjustment reason")
    .fill("Reversed a duplicate charge, ticket 12.");
  // No mode is preselected: the operator must choose it.
  await expect(submit).toBeDisabled();
  await form.getByLabel("Balance to adjust").click();
  await page.getByRole("option", { name: "Live credits (real money)" }).click();
  await expect(form.locator("[data-adjustment-summary]")).toContainText(
    "It has no live balance yet. This is not the balance that pays for its calls. Live credits are real customer money.",
  );
  await form.getByLabel("Balance to adjust").click();
  await page.getByRole("option", { name: "Sandbox credits" }).click();
  await expect(form.locator("[data-adjustment-summary]")).toContainText(
    "Its sandbox balance has $5.9824 available.",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await submit.click();
  await expect(form.getByRole("status")).toContainText(
    "Recorded: −$0.0088 sandbox credits. Available now: $5.9736.",
  );
  expect(posted).toMatchObject({
    accountId: pilot,
    mode: "test",
    amount: "-0.0088",
    note: "Reversed a duplicate charge, ticket 12.",
  });
  expect(String(posted?.requestKey)).toMatch(/^[0-9a-f-]{36}$/);
  const recent = page.getByRole("region", { name: "Recent adjustments" });
  await expect(recent).toContainText("−$0.0088");
  await expect(recent).toContainText("Pilot account");
  await expect(recent).toContainText("Reversed a duplicate charge, ticket 12.");
});
