import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { providerIds } from "../../server/provider-catalog";
test.use({ baseURL: "http://127.0.0.1:3102" });

test("company demo switches providers and turns a finding into a persistent demo plan", async ({
  page,
  request,
}) => {
  const before = await (await request.get("/api/provider-lab")).json();
  await page.goto("/#company/exa");
  await expect(
    page.getByRole("heading", { name: "Exa insights", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/All metrics below are simulated/)).toBeVisible();
  await page
    .getByRole("button", {
      name: /Make the included page text easier to discover/,
    })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "How to check it" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create test plan", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Test title")).toHaveValue(
    "Make the included page text easier to discover",
  );
  await expect(
    dialog.getByText(/Forced-provider retrieval tests do not measure/),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Save demo plan", exact: true })
    .click();
  await expect(page).toHaveURL(/company\/exa\/plans/);
  await expect(
    page.getByRole("heading", {
      name: "Make the included page text easier to discover",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "Make the included page text easier to discover",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Tool company", exact: true })
    .click();
  await page.getByRole("option", { name: "Firecrawl", exact: true }).click();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Firecrawl insights", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: /Check what the capture limit leaves out/,
    }),
  ).toBeVisible();
  const after = await (await request.get("/api/provider-lab")).json();
  expect(after.runs.length).toBe(before.runs.length);
  expect(after.experiments.length).toBe(before.experiments.length);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("local company activity is visible separately from controlled tests and export eligibility", async ({
  page,
}) => {
  await page.goto("/#company/tavily");
  await page
    .getByRole("combobox", { name: "Data source", exact: true })
    .click();
  await page.getByRole("option", { name: "Local lab", exact: true }).click();
  await expect(
    page.getByText("Your local provider evidence", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Organic requests succeeded", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Controlled execution:/)).toBeVisible();
  await expect(
    page.getByText("54 of 240 eligible sessions", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("listbox", { includeHidden: true })).toHaveCount(
    0,
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("a company finding opens only its matching receipts and preserves the filters on reload", async ({
  page,
  request,
}) => {
  const started = await request.post("/api/provider-lab/runs", {
    data: { requestKey: crypto.randomUUID(), providers: ["exa", "tavily"] },
  });
  expect(started.status()).toBe(202);
  const run = await started.json();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/provider-lab/runs/${run.id}`)).json())
          .status,
    )
    .toBe("completed");
  const before = await (await request.get("/api/provider-lab")).json();
  await page.goto("/#company/exa");
  await page
    .getByRole("combobox", { name: "Data source", exact: true })
    .click();
  await page.getByRole("option", { name: "Local lab", exact: true }).click();
  await page
    .getByRole("button", { name: /Inspect missed reference pages/ })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Inspect evidence", exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`#lab/${run.id}/exa/missed$`));
  await expect(
    page.getByRole("combobox", { name: "Provider", exact: true }),
  ).toHaveText("Exa");
  await expect(
    page.getByText("5 of 10 receipts", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".lab-receipt-row")).toHaveCount(5);
  await expect(
    page.locator(".lab-receipt-row").filter({ hasText: "Tavily" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Show receipts", exact: true }),
  ).toHaveText("Missed references");
  await page
    .getByRole("combobox", { name: "Show receipts", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Request errors", exact: true })
    .click();
  await expect(
    page.getByText("No receipts match these filters.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Provider lab", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const after = await (await request.get("/api/provider-lab")).json();
  expect(after.runs.length).toBe(before.runs.length);
  expect(after.dailyCommittedMicros).toBe(before.dailyCommittedMicros);
});
test("a controlled run captures receipts, reviews evidence, and leaves organic counts unchanged", async ({
  page,
  request,
}) => {
  const before = await (await request.get("/api/observations/catalog")).json();
  await page.goto("/#lab");
  await page
    .getByRole("button", { name: "Run live test", exact: true })
    .click();
  await expect(page).toHaveURL(/#lab\/[a-f0-9-]+$/);
  await expect(page.getByText("completed", { exact: true })).toBeVisible({
    timeout: 20000,
  });
  const id = page.url().split("#lab/")[1];
  const response = await request.get(`/api/provider-lab/runs/${id}`);
  const run = await response.json();
  // 5 cases each for Exa and Tavily search, Firecrawl and Jina extraction.
  expect(run.calls).toHaveLength(20);
  expect(run.spentMicros).toBe(132500);
  expect(run.reservedMicros).toBe(0);
  await page
    .getByRole("button", { name: /Find search API documentation Exa/ })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("region", { name: "Captured test evidence" }),
  ).toContainText("TEST FIXTURE");
  await dialog.getByRole("combobox", { name: "Verdict", exact: true }).click();
  await page.getByRole("option", { name: "Partial", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "What supports this judgment?", exact: true })
    .fill(
      "The fixture returned readable excerpts but did not contain the predefined reference.",
    );
  await dialog
    .getByRole("button", { name: "Save evidence review", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toHaveText("Evidence review saved.");
  await dialog.getByRole("combobox", { name: "Verdict", exact: true }).click();
  await page.getByRole("option", { name: "Unknown", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "What supports this judgment?", exact: true })
    .fill(
      "Revised fixture judgment: the available evidence is insufficient to decide usefulness.",
    );
  await dialog
    .getByRole("button", { name: "Save evidence review", exact: true })
    .click();
  const history = dialog.getByRole("region", {
    name: "Evidence review history",
    exact: true,
  });
  await expect(
    history.getByText("Version 2 · unknown", { exact: true }),
  ).toBeVisible();
  await expect(
    history.getByText("Version 1 · partial", { exact: true }),
  ).toBeVisible();
  await expect(history).toContainText(
    "The fixture returned readable excerpts but did not contain the predefined reference.",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  const after = await (await request.get("/api/observations/catalog")).json();
  expect(after.map((p: any) => p.sampleCount)).toEqual(
    before.map((p: any) => p.sampleCount),
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Review: unknown/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("cancelled work distinguishes skipped requests from evidence that can be reviewed", async ({
  page,
  request,
}) => {
  const started = await request.post("/api/provider-lab/runs", {
    data: {
      requestKey: crypto.randomUUID(),
      providers: ["exa", "tavily", "firecrawl"],
    },
  });
  const run = await started.json();
  expect(started.status()).toBe(202);
  expect(
    (
      await request.post(`/api/provider-lab/runs/${run.id}/stop`, { data: {} })
    ).ok(),
  ).toBe(true);
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/provider-lab/runs/${run.id}`)).json())
          .status,
    )
    .toBe("cancelled");
  await page.goto(`/#lab/${run.id}`);
  await page
    .locator(".lab-receipt-row")
    .filter({ hasText: "skipped" })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Not requested · $0.000 used", { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText(/This request was skipped/)).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Save evidence review", exact: true }),
  ).toHaveCount(0);
  await expect(dialog).toHaveCSS("opacity", "1");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("a local improvement plan is saved with its baseline and can be revised", async ({
  page,
  request,
}) => {
  const started = await request.post("/api/provider-lab/runs", {
    data: { requestKey: crypto.randomUUID(), providers: ["exa"] },
  });
  expect(started.status()).toBe(202);
  const run = await started.json();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/provider-lab/runs/${run.id}`)).json())
          .status,
    )
    .toBe("completed");
  await page.goto("/#company/exa");
  await page
    .getByRole("combobox", { name: "Data source", exact: true })
    .click();
  await page.getByRole("option", { name: "Local lab", exact: true }).click();
  await page.getByRole("tab", { name: /^Test plans/ }).click();
  await page
    .getByRole("button", { name: "New test plan", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  const title = `Review references ${crypto.randomUUID().slice(0, 8)}`;
  await dialog.getByLabel("Test title", { exact: true }).fill(title);
  await dialog
    .getByLabel("Hypothesis", { exact: true })
    .fill(
      "Some alternate sources may be useful despite missing the exact expected URL.",
    );
  await dialog
    .getByLabel("Proposed change", { exact: true })
    .fill(
      "Review the returned sources before changing the adapter configuration.",
    );
  await dialog
    .getByLabel("Success measure", { exact: true })
    .fill(
      "Compare reference coverage and attributed usefulness judgments on the fixed suite.",
    );
  await dialog
    .getByRole("button", { name: "Save test plan", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  const data = await (await request.get("/api/provider-lab")).json();
  const plan = data.experiments.find((p: any) => p.title === title);
  expect(plan.baselineRunId).toBe(run.id);
  expect(plan.status).toBe("planned");
  expect(data.runs.find((r: any) => r.id === run.id).calls).toHaveLength(5);
});
test("company switching rejects stale responses from the previous provider", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(
    "**/api/company-insights/exa?source=demo&scope=account",
    async (route) => {
      const response = await route.fetch();
      await gate;
      await route.fulfill({ response });
    },
  );
  await page.goto("/#company/exa");
  await expect(page.getByRole("status")).toContainText(
    "Loading provider insights",
  );
  await page
    .getByRole("combobox", { name: "Tool company", exact: true })
    .click();
  await page.getByRole("option", { name: "Tavily", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Tavily insights", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("168 of 240 eligible sessions", { exact: true }),
  ).toBeVisible();
  release();
  await expect(
    page.getByText("54 of 240 eligible sessions", { exact: true }),
  ).toHaveCount(0);
});
test("review evidence uses a searchable picker instead of repeated full call lists", async ({
  page,
  request,
}) => {
  const created = await request.post("/api/observations/agent-sessions", {
    data: {
      title: "Evidence picker fixture",
      objective: "Verify the compact review evidence picker.",
      criteria: [{ text: "Names the source" }, { text: "Supports the answer" }],
    },
  });
  const s = await created.json();
  const call = await (
    await request.post(`/api/observations/${s.id}/call`, {
      data: {
        tool: "firecrawl_extract",
        url: "https://example.com",
        requestKey: "picker",
        statedReason: "Read the source needed for review.",
      },
    })
  ).json();
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: {
      requestKey: "answer",
      text: "Example Domain is the source.",
      evidenceCallIds: [call.id],
    },
  });
  await page.goto(`/#sessions/${s.id}/output`);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page
    .getByRole("button", {
      name: "Link supporting evidence for Names the source",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Search recorded calls", exact: true })
    .fill("example.com");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "1 linked call · Edit evidence for Names the source",
      exact: true,
    }),
  ).toContainText("1 linked call");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("unconfigured providers are unselected and cannot start a paid test", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:3101/#lab");
  const options = page.getByRole("checkbox");
  await expect(options).toHaveCount(providerIds.length);
  for (const option of await options.all()) {
    await expect(option).not.toBeChecked();
    await expect(option).toBeDisabled();
  }
  await expect(
    page.getByRole("button", { name: "Run live test", exact: true }),
  ).toBeDisabled();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("a company can inspect a matched baseline comparison without treating it as causal improvement", async ({
  page,
  request,
}) => {
  const ids: string[] = [];
  for (let i = 0; i < 2; i++) {
    const r = await request.post("/api/provider-lab/runs", {
      data: { requestKey: crypto.randomUUID(), providers: ["tavily"] },
    });
    expect(r.status()).toBe(202);
    const run = await r.json();
    ids.push(run.id);
    await expect
      .poll(
        async () =>
          (await (await request.get(`/api/provider-lab/runs/${run.id}`)).json())
            .status,
      )
      .toBe("completed");
  }
  const title = `Matched comparison ${crypto.randomUUID().slice(0, 8)}`;
  const saved = await request.post("/api/provider-lab/experiments", {
    data: {
      provider: "tavily",
      title,
      hypothesis: "A repeated fixture should preserve a comparable case list.",
      change:
        "Repeat the same fixture without making a provider configuration change.",
      successMeasure:
        "Inspect the two fixed samples and retain uncertainty about causality.",
      baselineRunId: ids[0],
      followupRunId: ids[1],
    },
  });
  expect(saved.status()).toBe(201);
  await page.goto("/#company/tavily/plans");
  await page
    .getByRole("combobox", { name: "Data source", exact: true })
    .click();
  await page.getByRole("option", { name: "Local lab", exact: true }).click();
  const panel = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await panel
    .getByText("Compare baseline and follow-up", { exact: true })
    .click();
  await expect(
    panel.getByText(/The provider received the same versioned test cases/),
  ).toBeVisible();
  await expect(
    panel.getByRole("region", { name: "Case comparison", exact: true }),
  ).toContainText("Find a snowboard sizing source");
  await expect(panel.getByText(/Results are descriptive/)).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Data source", exact: true }),
  ).toHaveText("Local lab");
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("a delayed run poll cannot erase a saved evidence review", async ({
  page,
  request,
}) => {
  const started = await request.post("/api/provider-lab/runs", {
    data: { requestKey: crypto.randomUUID(), providers: ["exa"] },
  });
  const run = await started.json();
  await expect
    .poll(
      async () =>
        (await (await request.get(`/api/provider-lab/runs/${run.id}`)).json())
          .status,
    )
    .toBe("completed");
  let count = 0,
    held = false,
    release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(`**/api/provider-lab/runs/${run.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    count++;
    if (count === 1)
      await route.fulfill({ response, json: { ...body, status: "running" } });
    else if (count === 2) {
      held = true;
      await gate;
      await route.fulfill({ response, json: body });
    } else await route.fulfill({ response });
  });
  await page.goto(`/#lab/${run.id}`);
  await expect.poll(() => held).toBe(true);
  await page
    .getByRole("button", { name: /Find search API documentation Exa/ })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Verdict", exact: true }).click();
  await page.getByRole("option", { name: "Partial", exact: true }).click();
  await dialog
    .getByRole("textbox", { name: "What supports this judgment?", exact: true })
    .fill(
      "This newer fixture review must survive a delayed older run response.",
    );
  await dialog
    .getByRole("button", { name: "Save evidence review", exact: true })
    .click();
  await expect(dialog.getByRole("status")).toHaveText("Evidence review saved.");
  await page.keyboard.press("Escape");
  release();
  await expect.poll(() => count).toBeGreaterThan(2);
  await expect(
    page.getByRole("button", { name: /Review: partial/ }),
  ).toBeVisible();
});
test("company and lab recover immediately after workspace authentication", async ({
  page,
  request,
}) => {
  const token = "SYNTHETIC_PROVIDER_AUTH_TOKEN";
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/config") {
      await route.continue();
      return;
    }
    if (route.request().headers().authorization === `Bearer ${token}`)
      await route.continue();
    else
      await route.fulfill({
        status: 401,
        json: { error: "Enter the server access token to connect." },
      });
  });
  await page.goto("/#company/exa");
  await expect(
    page.getByText("54 of 240 eligible sessions", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Enter access token", exact: true })
    .click();
  await page.getByLabel("Access token", { exact: true }).fill(token);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByText("54 of 240 eligible sessions", { exact: true }),
  ).toBeVisible();
  const run = await (
    await request.post("/api/provider-lab/runs", {
      data: { requestKey: crypto.randomUUID(), providers: ["firecrawl"] },
    })
  ).json();
  await page.goto(`/#lab/${run.id}`);
  await expect(page.getByText("completed", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Read a simple public page Firecrawl/ }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
