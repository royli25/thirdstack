import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3102";

// The fixture server is SQLite and sandbox only. These tests drive the real
// pages and replace only the JSON a hosted live account would receive, so
// they cover what the customer and the operator see, not the server logic
// (tests/stripe-live.test.ts covers that against PostgreSQL).
const refundTerms =
  "Refund terms are being finalized. Until they are published, contact Two Hands support about unused credits. Any refund is returned to the card that paid for them.";
const at = "2026-11-17T12:00:00.000Z";
const livePayment = {
  id: "11111111-1111-4111-8111-111111111111",
  mode: "live",
  requestKey: "22222222-2222-4222-8222-222222222222",
  amountCents: 500,
  status: "partially_refunded",
  checkoutSessionId: "cs_live_fixture",
  checkoutUrl: null,
  paymentIntentId: "pi_fixture",
  chargeId: "ch_fixture",
  refundedCents: 100,
  disputed: false,
  netCreditUnits: 4000000,
  createdAt: at,
  updatedAt: at,
  lastCheckedAt: at,
  message: "Stripe reports a refund. Your credits have been adjusted.",
  receiptUrl: "https://pay.stripe.com/receipts/fixture",
  pendingRefundCents: 0,
};
async function liveAccount(page: Page, stripe: object = {}) {
  await page.route(
    /\/api\/(account|workspace)\/funding(\?.*)?$/,
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      const body = await (await route.fetch()).json();
      await route.fulfill({
        json: {
          ...body,
          stripe: {
            enabled: true,
            unavailableReason: null,
            mode: "live",
            minimumCents: 500,
            maximumCents: 10000,
            ...stripe,
          },
          wallet: {
            mode: "live",
            enforced: true,
            active: true,
            postedMicros: 3991200,
            heldMicros: 0,
            availableMicros: 3991200,
            chargedMicros: 8800,
            frozen: false,
          },
          stripeIntents: [livePayment],
          walletEntries: [
            {
              kind: "refund",
              micros: -1000000,
              reference: "pi_fixture",
              createdAt: at,
            },
            { kind: "usage", micros: -8800, reference: null, createdAt: at },
            {
              kind: "deposit",
              micros: 5000000,
              reference: "pi_fixture",
              createdAt: at,
            },
          ],
          refundTerms,
        },
      });
    },
  );
}

test("a live account sees real-money credits, receipts and refund terms with no sandbox wording", async ({
  page,
}) => {
  await liveAccount(page);
  await page.goto(`${base}/#dashboard/credits`);
  const main = page.locator("main");
  await expect(
    main.getByRole("button", { name: "Add credits", exact: true }),
  ).toBeVisible();
  await expect(main).toContainText("Available credits");
  await expect(main).toContainText("$3.9912");
  await expect(main).toContainText("Charged for tool calls: $0.0088");
  await expect(main).toContainText("Top-ups are real card payments");
  await expect(main.getByText(refundTerms)).toHaveCount(1);
  await expect(main).not.toContainText(
    /sandbox|test credits|test USD|Sepolia/i,
  );
  await expect(page.locator(".customer-navigation-balance")).toContainText(
    "$3.9912",
  );
  const activity = page.getByRole("region", { name: "Credit activity" });
  await expect(activity).toContainText("−$1.00");
  await expect(activity).toContainText("Refund to card");
  await expect(activity).toContainText("−$0.0088");
  await expect(activity).toContainText("Tool call");
  await expect(activity).toContainText("+$5.00");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page
    .getByRole("region", { name: "Card deposit history" })
    .getByRole("button", { name: "View payment" })
    .click();
  const receipt = page.getByRole("dialog");
  await expect(receipt).toContainText("Card payment details");
  await expect(receipt).toContainText("$5.00 USD");
  await expect(
    receipt.getByRole("link", { name: "View Stripe receipt" }),
  ).toHaveAttribute("href", "https://pay.stripe.com/receipts/fixture");
  await expect(receipt).not.toContainText(/sandbox|test mode|test USD/i);
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await main.getByRole("button", { name: "Add credits", exact: true }).click();
  const checkout = page.getByRole("dialog");
  await expect(checkout).toContainText("Amount in USD");
  await expect(checkout).toContainText("$5–$100");
  await expect(checkout).toContainText("This is a real card payment.");
  await expect(checkout).toContainText(refundTerms);
});

test("a paused live account is told top-ups are unavailable without server configuration detail", async ({
  page,
}) => {
  await liveAccount(page, {
    enabled: false,
    unavailableReason:
      "Configure a Stripe live secret key on the server. Test keys are not accepted for live payments.",
  });
  await page.goto(`${base}/#dashboard/credits`);
  const main = page.locator("main");
  await expect(main).toContainText("Top-ups paused");
  await expect(main).toContainText(
    "Card top-ups are not available for this account right now.",
  );
  await expect(
    main.getByRole("button", { name: "Add credits", exact: true }),
  ).toBeDisabled();
  await expect(main).toContainText("$3.9912");
  await expect(main).not.toContainText(/Configure|secret key|server/i);
});

test("an operator releases a dispute hold, refunds unused credits and resolves an alert", async ({
  page,
  request,
}) => {
  const payment = await (
    await request.post(`${base}/api/account/funding/stripe`, {
      data: { requestKey: crypto.randomUUID(), amount: "15" },
    })
  ).json();
  await request.post(`${base}/__fixture/stripe/${payment.id}`, {
    data: { disputed: true },
  });
  const alert = {
    id: "33333333-3333-4333-8333-333333333333",
    mode: "live",
    kind: "unmatched_live_event",
    reference: "evt_fixture_unmatched",
    detail: { type: "charge.refunded" },
    account: null,
    createdAt: at,
  };
  let alerts = [alert];
  const posted: Record<string, unknown> = {};
  const quote = (requests: object[], refundableCents: number) => ({
    payment: livePayment,
    mode: "live",
    refundsEnabled: true,
    policyVersion: "placeholder-card-funded-unused-v1",
    refundableCents,
    availableMicros: 3991200,
    frozen: false,
    requests,
  });
  await page.route("**/api/admin/funding/status", (route) =>
    route.fulfill({
      json: {
        test: { enabled: true, unavailableReason: null },
        live: {
          enabled: false,
          unavailableReason: "Card payments are not enabled on this server.",
        },
        refundsEnabled: true,
      },
    }),
  );
  await page.route("**/api/admin/funding/alerts", (route) =>
    route.fulfill({ json: { items: alerts } }),
  );
  await page.route("**/api/admin/funding/alerts/*/resolve", async (route) => {
    posted.alert = route.request().postDataJSON();
    alerts = [];
    await route.fulfill({ json: { items: [] } });
  });
  await page.route("**/api/admin/funding/payments?*", (route) =>
    route.fulfill({
      json: {
        items: [
          { payment: livePayment, mode: "live", account: "Pilot account" },
        ],
      },
    }),
  );
  await page.route(
    `**/api/admin/funding/refunds/${livePayment.id}`,
    async (route) => {
      if (route.request().method() === "GET")
        return route.fulfill({ json: quote([], 399) });
      posted.refund = route.request().postDataJSON();
      await route.fulfill({
        json: quote(
          [
            {
              id: "44444444-4444-4444-8444-444444444444",
              depositId: livePayment.id,
              amountCents: 150,
              status: "completed",
              stripeRefundId: "re_fixture",
              policyVersion: "placeholder-card-funded-unused-v1",
              actor: "account fixture-admin",
              note: "Customer asked for unused credit back.",
              createdAt: at,
              updatedAt: at,
            },
          ],
          249,
        ),
      });
    },
  );
  await page.route(
    `**/api/admin/funding/disputes/${payment.id}/release`,
    async (route) => {
      posted.release = route.request().postDataJSON();
      const detail = await (
        await request.get(`${base}/api/admin/funding/disputes/${payment.id}`, {
          headers: { Authorization: "Bearer fixture-admin-token" },
        })
      ).json();
      detail.item.payment.disputeResolution = {
        outcome: "won",
        restoredMicros: 15000000,
        releasedAt: at,
      };
      detail.item.payment.message =
        "The dispute on this payment was closed and its remaining credits were restored.";
      await route.fulfill({
        json: {
          outcome: "won",
          restoredMicros: 15000000,
          replayed: false,
          detail,
        },
      });
    },
  );

  await page.goto(`${base}/#disputes`);
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();

  // Rail status and a durable alert, resolved with a note.
  await expect(page.locator("main")).toContainText(
    "Live card payments: off · Card payments are not enabled on this server.",
  );
  const alertList = page.getByRole("list", { name: "Payment alerts" });
  await expect(alertList).toContainText("Live Stripe event matched no account");
  await expect(alertList).toContainText("evt_fixture_unmatched");
  const resolve = alertList.getByRole("button", { name: "Mark resolved" });
  await expect(resolve).toBeDisabled();
  await page
    .getByLabel("Resolution note for evt_fixture_unmatched")
    .fill("Checked in Stripe: event belongs to another product.");
  await resolve.click();
  await expect(page.locator("main")).toContainText("No open payment alerts");
  expect(posted.alert).toEqual({
    note: "Checked in Stripe: event belongs to another product.",
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  // Refund unused credits.
  const payments = page.getByRole("region", { name: "Wallet payments" });
  await expect(payments).toContainText("Pilot account");
  await expect(payments).toContainText("Live");
  await payments.getByRole("button", { name: "Review refund" }).click();
  const refund = page.getByRole("dialog");
  await expect(refund).toContainText("Refund unused credits");
  await expect(refund).toContainText("$3.99");
  await refund.getByLabel("Refund amount").fill("1.50");
  await refund
    .getByLabel("Refund reason")
    .fill("Customer asked for unused credit back.");
  await refund.getByRole("button", { name: "Refund to card" }).click();
  await expect(refund).toContainText("$1.50 · Refunded");
  await expect(refund).toContainText("$2.49");
  expect(posted.refund).toMatchObject({
    amount: "1.50",
    note: "Customer asked for unused credit back.",
    requestKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
  });
  await page.getByRole("button", { name: "Close", exact: true }).click();

  // Release the dispute hold.
  await page
    .getByRole("textbox", { name: "Search disputed payments" })
    .fill(payment.id);
  await page
    .getByRole("region", { name: "Dispute queue" })
    .locator("tbody tr")
    .filter({ hasText: payment.id.slice(0, 8) })
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  const review = page.getByRole("dialog");
  await expect(review).toContainText("Credit hold retained");
  const release = review.getByRole("button", { name: "Release dispute hold" });
  await expect(release).toBeDisabled();
  await review
    .getByRole("textbox", { name: "Dispute review note" })
    .fill("Stripe shows the dispute as won.");
  await release.click();
  await expect(review).toContainText("Dispute hold released");
  await expect(review).toContainText("remaining credits were restored");
  await expect(release).toHaveCount(0);
  expect(posted.release).toMatchObject({
    note: "Stripe shows the dispute as won.",
    requestKey: expect.stringMatching(/^[0-9a-f-]{36}$/),
  });
});
