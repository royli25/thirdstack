import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3102";
test("admin dispute queue records reviews, retains holds, reopens changed evidence, and locks access", async ({
  page,
  request,
}) => {
  const payment = await (
    await request.post(`${base}/api/account/funding/stripe`, {
      data: { requestKey: crypto.randomUUID(), amount: "15" },
    })
  ).json();
  expect(
    (
      await request.post(`${base}/__fixture/stripe/${payment.id}`, {
        data: { disputed: true },
      })
    ).status(),
  ).toBe(200);
  await page.goto(`${base}/#disputes`);
  await expect(
    page.getByRole("heading", { name: "Payment disputes", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search disputed payments" })
    .fill(payment.id);
  const row = page.locator(".ws-table tbody tr");
  await expect(row).toHaveCount(1);
  await expect(row).toContainText("Needs review");
  await page
    .locator(".ws-table tbody tr")
    .filter({ hasText: payment.id.slice(0, 8) })
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(payment.id, { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Credit hold retained");
  await page.getByLabel("Review decision").selectOption("reviewed");
  await page
    .getByRole("textbox", { name: "Dispute review note" })
    .fill("Checked Stripe test evidence. Retain all credits on hold.");
  await page
    .getByRole("button", { name: "Save review · retain hold", exact: true })
    .click();
  await expect(page.locator(".ws-dispute-history")).toContainText("Revision 1");
  await expect(page.locator(".ws-dispute-history")).toContainText(
    "admin credential",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(row).toContainText("Reviewed · hold retained");
  expect(
    (
      await request.post(`${base}/__fixture/stripe/${payment.id}`, {
        data: { refundedCents: 100, disputed: true },
      })
    ).status(),
  ).toBe(200);
  await page
    .getByRole("button", { name: "Refresh queue", exact: true })
    .click();
  await expect(row).toContainText("Evidence changed");
  await expect(row).toContainText("Needs review");
  const receipt = await (
    await request.get(`${base}/api/account/funding/stripe/${payment.id}`)
  ).json();
  expect(receipt.netCreditUnits).toBe(0);
  expect(receipt.status).toBe("disputed");
  await page
    .getByRole("button", { name: "Lock admin access", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Dispute queue", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Admin access token")).toHaveValue("");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Admin access", exact: true }),
  ).toBeVisible();
});

test("admin review rejects a concurrent stale decision without replacing the draft note", async ({
  page,
  request,
}) => {
  const payment = await (
    await request.post(`${base}/api/account/funding/stripe`, {
      data: { requestKey: crypto.randomUUID(), amount: "6" },
    })
  ).json();
  await request.post(`${base}/__fixture/stripe/${payment.id}`, {
    data: { disputed: true },
  });
  await page.goto(`${base}/#disputes`);
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search disputed payments" })
    .fill(payment.id);
  await page
    .locator(".ws-table tbody tr")
    .filter({ hasText: payment.id.slice(0, 8) })
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(payment.id, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Dispute review note" })
    .fill("My pending review note must survive a conflict.");
  const headers = { Authorization: "Bearer fixture-admin-token" };
  const latest = await (
    await request.get(`${base}/api/admin/funding/disputes/${payment.id}`, {
      headers,
    })
  ).json();
  const other = await request.post(
    `${base}/api/admin/funding/disputes/${payment.id}/review`,
    {
      headers,
      data: {
        requestKey: crypto.randomUUID(),
        revision: latest.item.revision,
        evidenceFingerprint: latest.item.evidenceFingerprint,
        status: "in_review",
        note: "Another admin has started this review.",
      },
    },
  );
  expect(other.status()).toBe(200);
  await page
    .getByRole("button", { name: "Save review · retain hold", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Refresh this case");
  await expect(
    page.getByRole("textbox", { name: "Dispute review note" }),
  ).toHaveValue("My pending review note must survive a conflict.");
  await expect(
    page.getByRole("button", {
      name: "Save review · retain hold",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Refresh saved case", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Save review · retain hold",
      exact: true,
    }),
  ).toBeEnabled();
});

test("unconfigured admin access fails closed with no dispute data", async ({
  page,
}) => {
  await page.goto("/#disputes");
  await page
    .getByLabel("Admin access token")
    .fill("not-a-configured-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await expect(
    page.getByText(/Admin funding review is disabled/),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Dispute queue", exact: true }),
  ).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("rejected admin credentials clear open evidence and drafts", async ({
  page,
  request,
}) => {
  const payment = await (
    await request.post(`${base}/api/account/funding/stripe`, {
      data: { requestKey: crypto.randomUUID(), amount: "7" },
    })
  ).json();
  await request.post(`${base}/__fixture/stripe/${payment.id}`, {
    data: { disputed: true },
  });
  await page.goto(`${base}/#disputes`);
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search disputed payments" })
    .fill(payment.id);
  await page
    .locator(".ws-table tbody tr")
    .filter({ hasText: payment.id.slice(0, 8) })
    .getByRole("button", { name: "Review payment", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText(payment.id, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Dispute review note" })
    .fill("Sensitive draft should clear when credential is rejected.");
  await page.route("**/api/admin/funding/disputes/*/recheck", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Admin credential was revoked." }),
    }),
  );
  await page
    .getByRole("button", { name: "Verify Stripe status", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Dispute queue", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Admin access token")).toHaveValue("");
  await expect(page.getByText("Admin credential was revoked.")).toBeVisible();
});

test("an old unauthorized response cannot lock a newer admin session", async ({
  page,
}) => {
  await page.goto(`${base}/#disputes`);
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Disputed payments", exact: true }),
  ).toBeVisible();
  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const entered = new Promise<void>((r) => {
    started = r;
  });
  let held = false;
  await page.route("**/api/admin/funding/disputes?**", async (route) => {
    if (!held) {
      held = true;
      started();
      await gate;
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Old session rejected." }),
      });
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Refresh queue", exact: true })
    .click();
  await entered;
  await page
    .getByRole("button", { name: "Lock admin access", exact: true })
    .click();
  await page.getByLabel("Admin access token").fill("fixture-admin-token");
  await page
    .getByRole("button", { name: "Open dispute queue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Disputed payments", exact: true }),
  ).toBeVisible();
  const stale = page.waitForResponse(
    (r) =>
      r.url().includes("/api/admin/funding/disputes?") && r.status() === 401,
  );
  release();
  await stale;
  await expect(
    page.getByRole("heading", { name: "Disputed payments", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Old session rejected.")).toHaveCount(0);
});
