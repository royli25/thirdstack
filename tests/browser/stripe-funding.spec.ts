import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3102";

test("Stripe fixture checkout, signed webhook credits, refunds, and shared ledger", async ({
  page,
  request,
}) => {
  const before = await (
    await request.get(`${base}/api/account/funding`)
  ).json();
  await page.goto(`${base}/#dashboard/credits`);
  await page
    .getByRole("button", { name: "Deposit with Stripe", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Card deposit amount" })
    .fill("12.34");
  const created = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/account/funding/stripe") &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Prepare checkout", exact: true })
    .click();
  const intent = await (await created).json();
  await expect(page.getByRole("dialog")).toContainText("Awaiting payment");
  await expect(
    page.getByRole("link", { name: "Continue to Stripe" }),
  ).toHaveAttribute("href", /^https:\/\/checkout\.stripe\.com\//);
  expect(
    (await (await request.get(`${base}/api/account/funding`)).json())
      .balanceUnits,
  ).toBe(before.balanceUnits);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const paid = await request.post(`${base}/__fixture/stripe/${intent.id}`, {
    data: {},
  });
  expect(paid.status()).toBe(200);
  await page
    .getByRole("button", { name: "Check payment status", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Credited");
  await expect(
    page.getByRole("link", { name: "Continue to Stripe" }),
  ).toHaveCount(0);
  const after = await (await request.get(`${base}/api/account/funding`)).json();
  expect(after.balanceUnits).toBe(before.balanceUnits + 12340000);
  expect(
    after.entries.filter((e: any) => e.sourceId === intent.id),
  ).toHaveLength(1);
  const refund = await request.post(`${base}/__fixture/stripe/${intent.id}`, {
    data: { refundedCents: 234 },
  });
  expect(refund.status()).toBe(200);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page
    .getByRole("button", { name: "Refresh deposits", exact: true })
    .click();
  const history = page.getByRole("region", {
    name: "Card deposit history",
    exact: true,
  });
  await expect(history).toContainText("Partially refunded");
  const ledger = page.getByRole("region", {
    name: "Credit ledger",
    exact: true,
  });
  await expect(ledger).toContainText("Refund");
  const refunded = await (
    await request.get(`${base}/api/account/funding`)
  ).json();
  expect(refunded.balanceUnits).toBe(before.balanceUnits + 10000000);
  expect(refunded.spendableForProviders).toBe(false);
  await page.reload();
  await expect(history).toContainText("Partially refunded");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("Stripe return links open saved receipts without crediting unpaid checkouts", async ({
  page,
  request,
}) => {
  const intent = await (
    await request.post(`${base}/api/account/funding/stripe`, {
      data: { requestKey: crypto.randomUUID(), amount: "5" },
    })
  ).json();
  const before = await (
    await request.get(`${base}/api/account/funding`)
  ).json();
  await page.goto(
    `${base}/?stripe_deposit=${intent.id}&stripe_cancelled=1#dashboard/credits`,
  );
  await expect(page.getByRole("dialog")).toContainText("Awaiting payment");
  await expect(page.getByRole("dialog")).toContainText(
    "does not confirm a payment",
  );
  await page
    .getByRole("button", { name: "Check payment status", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Payment has not been confirmed",
  );
  expect(
    (await (await request.get(`${base}/api/account/funding`)).json())
      .balanceUnits,
  ).toBe(before.balanceUnits);
  expect(page.url()).not.toContain("stripe_deposit=");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
