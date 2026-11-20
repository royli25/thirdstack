import { expect, test } from "@playwright/test";

const call = {
  id: "fixture-focus-call",
  sessionId: "fixture-focus-session",
  tool: "exa_search",
  provider: "exa",
  status: "succeeded",
  arguments: { query: "TEST FIXTURE keyboard return focus" },
  estimateMicros: 17000,
  latencyMs: 120,
  startedAt: "2026-11-13T21:00:00.000Z",
  finishedAt: "2026-11-13T21:00:00.120Z",
  statedReason: "TEST FIXTURE focus restoration",
  result: { results: [] },
  sessionTitle: "TEST FIXTURE keyboard return focus",
  host: "fixture-client",
  model: "fixture-model",
};

for (const route of ["dashboard/activity", "dashboard/requests"]) {
  test(`${route} request details return keyboard focus to the exact invoking control`, async ({
    page,
  }) => {
    await page.route("**/api/account/activity?*", (request) =>
      request.fulfill({
        json: { items: [call], total: 1, page: 1, pageSize: 20 },
      }),
    );
    await page.route(
      "**/api/observations/fixture-focus-session/calls/fixture-focus-call",
      (request) => request.fulfill({ json: call }),
    );
    await page.goto(`/#${route}`);
    const trigger = page.getByRole("button", {
      name: "Inspect request fixture-focus-call",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", {
      name: "Request details",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement)),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

for (const route of ["dashboard/activity", "dashboard/requests"]) {
  test(`${route} retry completion keeps keyboard position in the request history`, async ({
    page,
  }) => {
    let unavailable = true;
    await page.route("**/api/account/activity?*", (request) =>
      unavailable
        ? request.fulfill({
            status: 503,
            json: { error: "TEST FIXTURE activity unavailable" },
          })
        : request.fulfill({
            json: { items: [], total: 0, page: 1, pageSize: 20 },
          }),
    );
    await page.goto(`/#${route}`);
    const retry = page.getByRole("button", {
      name: "Retry activity",
      exact: true,
    });
    await expect(retry).toBeVisible();
    await retry.focus();
    unavailable = false;
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", { name: "No requests yet", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: route === "dashboard/activity" ? "Usage" : "Requests",
        exact: true,
      }),
    ).toBeFocused();
  });
}

test("operator evidence picker restores the invoking criterion after Done", async ({
  page,
  request,
}) => {
  const fixture = "http://127.0.0.1:3102";
  const created = await request.post(
    `${fixture}/api/observations/agent-sessions`,
    {
      data: {
        title: "TEST FIXTURE evidence focus",
        objective: "Check keyboard context after selecting recorded evidence.",
        criteria: [{ text: "Names the source" }],
      },
    },
  );
  expect(created.status()).toBe(201);
  const session = await created.json();
  const executed = await request.post(
    `${fixture}/api/observations/${session.id}/call`,
    {
      data: {
        tool: "firecrawl_extract",
        url: "https://example.com",
        requestKey: "focus-fixture-call",
        statedReason: "TEST FIXTURE evidence focus only",
      },
    },
  );
  expect(executed.status()).toBe(200);
  const evidence = await executed.json();
  const outcome = await request.post(
    `${fixture}/api/observations/${session.id}/outcome`,
    {
      data: {
        requestKey: "focus-fixture-answer",
        text: "TEST FIXTURE Example Domain is the source.",
        evidenceCallIds: [evidence.id],
      },
    },
  );
  expect(outcome.status()).toBe(200);
  await page.goto(`${fixture}/#sessions/${session.id}/output`);
  const trigger = page.getByRole("button", {
    name: /evidence for Names the source$/,
  });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Choose supporting evidence",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("checkbox").check();
  const done = dialog.getByRole("button", { name: "Done", exact: true });
  await done.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeHidden();
  await expect(trigger).toContainText("1 linked call");
  await expect(trigger).toBeFocused();
});
