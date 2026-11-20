import { expect, test } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
test.use({
  baseURL: process.env.OCTOLAB_WORKBENCH_BROWSER_URL ?? "http://127.0.0.1:3102",
});

test("a provider authors a suite, runs it live, revises checks in replay, and compares the saved evidence", async ({
  page,
  request,
}, testInfo) => {
  const title = `Reference diagnostic ${crypto.randomUUID().slice(0, 8)}`;
  await page.goto("/#lab");
  await page.getByRole("button", { name: "New suite", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("Suite title", { exact: true }).fill(title);
  await dialog
    .getByLabel("What are you testing?", { exact: true })
    .fill("Check the returned reference for an explicit diagnostic query.");
  await dialog
    .getByLabel("Case title", { exact: true })
    .fill("Find a documented source");
  await dialog
    .getByLabel("Search query", { exact: true })
    .fill("fixture provider documentation");
  await dialog
    .getByLabel("Reference page URL", { exact: true })
    .fill("https://example.com/fixture-1");
  await dialog.getByRole("button", { name: "Save suite", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Test suite", exact: true }),
  ).toContainText(title);
  await page
    .getByRole("button", { name: "Run live test", exact: true })
    .click();
  await expect(page).toHaveURL(/#lab\/[a-f0-9-]+$/);
  const sourceId = page.url().split("#lab/")[1];
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/provider-lab/runs/${sourceId}`)).json())
          .status,
    )
    .toBe("completed");
  const source = await (
    await request.get(`/api/provider-lab/runs/${sourceId}`)
  ).json();
  expect(source.calls).toHaveLength(2);
  expect(source.source).toBe("live_controlled");
  await expect(
    page.getByRole("button", { name: /Find a documented source Exa/ }),
  ).toContainText("Reference matched");
  await page.getByRole("button", { name: "Duplicate", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Suite title", { exact: true })
    .fill(`${title} revised`);
  await dialog
    .getByLabel("Reference page URL", { exact: true })
    .fill("https://example.com/a-different-reference");
  await dialog.getByRole("button", { name: "Save suite", exact: true }).click();
  await page.getByRole("combobox", { name: "Test mode", exact: true }).click();
  await page
    .getByRole("option", {
      name: "Replay saved responses · no spend",
      exact: true,
    })
    .click();
  await page
    .getByRole("combobox", { name: "Saved live run", exact: true })
    .click();
  await page
    .getByRole("option", { name: new RegExp(sourceId.slice(0, 8)) })
    .click();
  await page.getByRole("button", { name: "Run replay", exact: true }).click();
  await expect(page).not.toHaveURL(new RegExp(sourceId));
  await expect(
    page.getByText(
      "Historical responses · no new provider requests, timing, or usage.",
      { exact: false },
    ),
  ).toBeVisible();
  const replayId = page.url().split("#lab/")[1];
  const replay = await (
    await request.get(`/api/provider-lab/runs/${replayId}`)
  ).json();
  expect(replay.source).toBe("replay");
  expect(replay.spentMicros).toBe(0);
  expect(replay.calls).toHaveLength(2);
  expect(replay.calls[0].measurements.referenceCheck).toBe(false);
  await page
    .getByRole("combobox", { name: "Baseline run", exact: true })
    .click();
  await page
    .getByRole("option", { name: new RegExp(sourceId.slice(0, 8)) })
    .click();
  await page
    .getByText("Compare baseline and follow-up", { exact: true })
    .click();
  await expect(
    page.getByText(/Replay uses historical responses/),
  ).toBeVisible();
  const comparison = page.getByRole("region", {
    name: "Case comparison",
    exact: true,
  });
  await expect(comparison).toContainText("Reference matched");
  await expect(comparison).toContainText("Reference missed");
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export private run", exact: true })
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    `two-hands-private-run-${replayId}.json`,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: testInfo.outputPath("provider-workbench.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByText("Replay of saved responses", { exact: true }),
  ).toBeVisible();
});

test("live usage shows observed organic activity and co-usage without exposing research text", async ({
  page,
  request,
}, testInfo) => {
  const s = await (
    await request.post("/api/observations/agent-sessions", {
      data: {
        title: "Private browser fixture",
        objective: "PRIVATE research text must not appear in analytics",
        criteria: [{ text: "Find supporting evidence" }],
        host: "Workbench fixture host",
      },
    })
  ).json();
  for (const [tool, args] of [
    ["exa_search", { query: "PRIVATE source query" }],
    ["firecrawl_extract", { url: "https://example.com" }],
  ] as const) {
    const r = await request.post(`/api/observations/${s.id}/call`, {
      data: {
        tool,
        ...args,
        requestKey: crypto.randomUUID(),
        statedReason: "PRIVATE decision explanation",
      },
    });
    expect(r.ok()).toBe(true);
  }
  await page.goto("/#company/exa/activity");
  await page
    .getByRole("combobox", { name: "Data source", exact: true })
    .click();
  await page.getByRole("option", { name: "Local lab", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Request activity", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Reported hosts", exact: true }),
  ).toContainText("Workbench fixture host");
  await expect(
    page.getByRole("heading", { name: "Tools used together", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".activity-co-usage")).toContainText("Firecrawl");
  await expect(page.locator(".provider-activity")).not.toContainText("PRIVATE");
  await page
    .getByRole("combobox", { name: "Time window", exact: true })
    .click();
  await page.getByRole("option", { name: "Last 7 days", exact: true }).click();
  await page.getByText("Daily request table", { exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Daily request activity", exact: true })
      .locator("tbody tr"),
  ).toHaveCount(7);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: testInfo.outputPath("provider-live-usage.png"),
    fullPage: true,
  });
});
