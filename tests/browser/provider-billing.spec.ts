import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3107",
  owner = "fixture-owner-token-0000000000001";
async function login(page: Page) {
  await page.goto(`${base}/#dashboard/usage`);
  await page
    .getByRole("button", { name: "Enter access token", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Access token", { exact: true })
    .fill(owner);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Connect", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Import records", exact: true }),
  ).toBeVisible();
}
test("provider readiness records a billing account without revealing credentials", async ({
  page,
}) => {
  await login(page);
  await page.goto(`${base}/#dashboard/connections`);
  const readiness = page.getByRole("region", {
    name: "Provider readiness",
    exact: true,
  });
  await expect(readiness).toContainText("1.0.0");
  await readiness
    .getByRole("row")
    .filter({ hasText: "Exa" })
    .getByRole("button", { name: "Record account" })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Billing account reference")
    .fill(`browser-${test.info().project.name}`);
  await dialog.getByRole("button", { name: "Save account reference" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(readiness).toContainText(`browser-${test.info().project.name}`);
  await expect(page.locator("body")).not.toContainText("TEST_ONLY_EXA_KEY");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("imports, reviews, corrects and exports a billing document while unmatched charges stay unknown", async ({
  page,
  request,
}) => {
  await login(page);
  const beforeCharges = (
    await (
      await request.get(`${base}/api/account/provider-billing`, {
        headers: { Authorization: `Bearer ${owner}` },
      })
    ).json()
  ).reconciledMicros;
  const documentRef = `browser-${crypto.randomUUID()}`;
  await page
    .getByRole("button", { name: "Import records", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Provider account", { exact: true })
    .fill(documentRef);
  await dialog.getByLabel("Document reference").fill(documentRef);
  await dialog.getByLabel("From", { exact: true }).fill("2026-11-01");
  await dialog.getByLabel("Through", { exact: true }).fill("2026-11-30");
  await dialog
    .getByLabel("Billing records", { exact: true })
    .fill("Record ID,Request ID,Amount,Credits\nline-1,not-recorded,0.007,1\n");
  await dialog.evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByRole("button", { name: "Import for review" }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: documentRef });
  await expect(row).toContainText("Needs review");
  await row.getByRole("button", { name: "View import" }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("unmatched");
  await dialog
    .getByLabel("Review note")
    .fill("Checked synthetic fixture invoice");
  await dialog.getByRole("button", { name: "Approve import" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("Approved");
  const afterCharges = await (
    await request.get(`${base}/api/account/provider-billing`, {
      headers: { Authorization: `Bearer ${owner}` },
    })
  ).json();
  expect(afterCharges.reconciledMicros).toBe(beforeCharges);
  expect(
    afterCharges.batches.find(
      (b: { sourceReference: string }) => b.sourceReference === documentRef,
    ).lines[0].reconciledMicros,
  ).toBeNull();
  await row.getByRole("button", { name: "Correct", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Billing records", { exact: true })
    .fill("Record ID,Request ID,Amount,Credits\nline-1,not-recorded,0.005,1\n");
  await dialog.getByRole("button", { name: "Import for review" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: documentRef }),
  ).toHaveCount(2);
  const pending = page
    .getByRole("row")
    .filter({ hasText: documentRef })
    .filter({ hasText: "Needs review" });
  await pending.getByRole("button", { name: "View import" }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Review note")
    .fill("Checked corrected fixture invoice");
  await dialog.getByRole("button", { name: "Approve import" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: documentRef })
      .filter({ hasText: "Replaced" }),
  ).toHaveCount(1);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export provider billing" }).click();
  expect((await download).suggestedFilename()).toBe("provider-billing.json");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({
    path: test.info().outputPath("provider-billing.png"),
    fullPage: true,
  });
});

test("matches an invoice to a recorded account and shows the reviewed amount separately from its estimate", async ({
  page,
  request,
}) => {
  const headers = { Authorization: `Bearer ${owner}` };
  const account = `matched-${crypto.randomUUID()}`;
  const setup = await (
    await request.get(`${base}/api/account/provider-adapters`, { headers })
  ).json();
  const exa = setup.adapters.find(
    (a: { tool: string }) => a.tool === "exa_search",
  );
  expect(
    (
      await request.post(
        `${base}/api/account/provider-adapters/exa_search/account`,
        {
          headers,
          data: {
            accountReference: account,
            credentialRevision: exa.credential.revision,
          },
        },
      )
    ).status(),
  ).toBe(200);
  const session = await (
    await request.post(`${base}/api/observations/agent-sessions`, {
      headers,
      data: {
        title: "Billing browser fixture",
        objective: "Match synthetic billing evidence",
        criteria: [{ text: "Fixture" }],
      },
    })
  ).json();
  const call = await (
    await request.post(`${base}/api/observations/${session.id}/call`, {
      headers,
      data: {
        tool: "exa_search",
        query: "Synthetic fixture",
        requestKey: crypto.randomUUID(),
        statedReason: "Isolated browser fixture",
      },
    })
  ).json();
  expect(call.status).toBe("succeeded");
  const now = new Date(),
    start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const batch = await (
    await request.post(`${base}/api/account/provider-billing/imports`, {
      headers,
      data: {
        requestKey: crypto.randomUUID(),
        provider: "exa",
        accountReference: account,
        sourceKind: "invoice",
        sourceReference: account,
        currency: "USD",
        windowStart: start.toISOString(),
        windowEnd: new Date(start.getTime() + 86400000).toISOString(),
        records: [
          {
            recordId: account,
            requestId: call.result.requestId,
            amountMicros: 12000,
          },
        ],
      },
    })
  ).json();
  expect(batch.id).toBeTruthy();
  await login(page);
  await page
    .getByRole("row")
    .filter({ hasText: account })
    .getByRole("button", { name: "View import" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("cell", {
      name: /Exact request and recorded provider account match/,
    }),
  ).toBeVisible();
  await expect(dialog).toContainText("0.012000 USD");
  await dialog
    .getByLabel("Review note")
    .fill("Checked synthetic account and invoice");
  await dialog.getByRole("button", { name: "Approve import" }).click();
  await expect(dialog).toHaveCount(0);
  const report = await (
    await request.get(`${base}/api/account/provider-billing`, { headers })
  ).json();
  expect(
    report.batches.find((b: { id: string }) => b.id === batch.id).lines[0],
  ).toMatchObject({
    estimatedMicros: 17000,
    reportedUsd: 0.015,
    reconciledMicros: 12000,
    varianceMicros: -5000,
  });
  await expect(page.locator(".billing-summary")).toContainText(
    `$${(report.reconciledMicros / 1e6).toFixed(3)}`,
  );
});
