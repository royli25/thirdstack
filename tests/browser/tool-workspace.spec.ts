import { test, expect } from "@playwright/test";
import { captureJourney } from "./helpers/launch-screenshots";
import AxeBuilder from "./helpers/accessibility";
import { extractProviderIds, providerIds } from "../../server/provider-catalog";

const fixture = "http://127.0.0.1:3102";
test("sidebar pages have independent routes, browser history, and accessible layouts", async ({
  page,
}) => {
  for (const [route, heading] of [
    ["", "Home"],
    ["tools", "Tool catalog"],
    ["activity", "Activity"],
    ["usage", "Usage"],
    ["routing", "Configure routing"],
    ["connections", "Connections"],
  ]) {
    await page.goto(`/#dashboard${route ? `/${route}` : ""}`);
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Loading account data…")).toHaveCount(0);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/#dashboard/tools");
  await expect(
    page.getByRole("link", { name: "Configure routing", exact: true }),
  ).toHaveCount(0);
  await page.goto("/#dashboard/routing");
  await expect(page).toHaveURL(/#dashboard\/routing$/);
  await expect(
    page.getByRole("heading", { name: "Configure routing", exact: true }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "User navigation" });
  const catalog = navigation.getByRole("link", {
    name: "Tool catalog",
    exact: true,
  });
  if (test.info().project.name === "desktop") {
    await expect(catalog).toHaveClass("selected");
    await expect(catalog).toHaveAttribute("aria-current", "location");
  }
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Tool catalog", exact: true }),
  ).toBeVisible();
  await page.goto("/#dashboard/routing");
  await page.getByRole("link", { name: "Back to catalog" }).click();
  await expect(page).toHaveURL(/#dashboard\/tools$/);
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    navigation.getByRole("link", { name: "Routing", exact: true }),
  ).toHaveCount(0);
  await expect(catalog).toHaveAttribute("aria-current", "page");
});

test("catalog loading does not look like an empty search", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/observations/catalog", async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.goto("/#dashboard/tools");
    await expect(
      page.getByRole("status").filter({ hasText: "Loading tools" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "No matching tools" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Clear filters" }),
    ).toHaveCount(0);
    await captureJourney(page, "tool-catalog-loading");
  } finally {
    release();
  }
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
});

test("catalog failures explain the problem and can be retried", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/api/observations/catalog", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({
        status: 503,
        json: { error: "Tools are temporarily unavailable." },
      });
    } else await route.continue();
  });
  await page.goto("/#dashboard/tools");
  await expect(page.getByRole("alert")).toContainText(
    "Tools are temporarily unavailable.",
  );
  await expect(
    page.getByRole("heading", { name: "No matching tools" }),
  ).toHaveCount(0);
  await captureJourney(page, "tool-catalog-load-error");
  await page.getByRole("button", { name: "Retry loading tools" }).click();
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("catalog refresh failures keep the existing tools visible", async ({
  page,
}) => {
  await page.clock.install();
  let requests = 0;
  await page.route("**/api/observations/catalog", async (route) => {
    if (++requests === 2)
      await route.fulfill({
        status: 503,
        json: { error: "The catalog could not be refreshed." },
      });
    else await route.continue();
  });
  await page.goto("/#dashboard/tools");
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
  await page.clock.fastForward(60001);
  await expect(page.getByRole("alert")).toContainText(
    "The catalog could not be refreshed.",
    { timeout: 10000 },
  );
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
  await page.getByRole("button", { name: "Retry loading tools" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
});

test("catalog search, capability filters, and tool details", async ({
  page,
}) => {
  await page.goto("/#dashboard/tools");
  const cards = page.locator(".ws-tool-card");
  await expect(cards).toHaveCount(providerIds.length - 1);
  for (const card of await cards.all()) {
    const provider = await card.getByRole("heading").innerText();
    await expect(
      card.getByRole("button", {
        name: `View tool: ${provider}`,
        exact: true,
      }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: /Extraction/ }).click();
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    extractProviderIds.length,
  );
  const firecrawl = page.locator(".ws-tool-card", { hasText: "Firecrawl" });
  const parallel = page.locator(".ws-tool-card").filter({
    has: page.getByRole("heading", { name: "Parallel", exact: true }),
  });
  await expect(firecrawl).toHaveCount(1);
  await expect(
    page.locator(".ws-tool-card", { hasText: "Jina Reader" }),
  ).toHaveCount(1);
  await firecrawl.getByRole("button", { name: "View tool" }).click();
  await expect(page.getByRole("dialog")).toContainText("What to expect");
  await expect(page.getByRole("dialog")).toContainText("firecrawl_extract");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const viewParallel = parallel.getByRole("button", { name: "View tool" });
  await expect(parallel).toContainText("2 endpoints");
  await viewParallel.click();
  const details = page.getByRole("dialog");
  await expect(
    details.getByRole("button", { name: "parallel_extract", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const searchEndpoint = details.getByRole("button", {
    name: "parallel_search",
    exact: true,
  });
  await searchEndpoint.click();
  await expect(searchEndpoint).toHaveAttribute("aria-pressed", "true");
  await details.getByRole("button", { name: "Close", exact: true }).click();
  await expect(viewParallel).toBeFocused();
  await page.getByRole("button", { name: /All tools/ }).click();
  const search = page.getByRole("textbox", { name: "Search tools" });
  await search.fill("tavily");
  await expect(page.locator(".ws-tool-card")).toHaveCount(1);
  await search.fill("no-such-tool");
  await expect(
    page.getByRole("heading", { name: "No matching tools" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(search).toBeFocused();
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
});

test("route preview is free, capability-aware, and respects server switches", async ({
  page,
  request,
}) => {
  const previous = await (
    await request.get(`${fixture}/api/account/routing`)
  ).json();
  await request.post(`${fixture}/api/account/routing`, {
    data: { revision: previous.revision, disabledTools: [] },
  });
  const before = await (
    await request.get(`${fixture}/api/observations`)
  ).json();
  try {
    await page.goto(`${fixture}/#dashboard/routing`);
    await page
      .getByRole("textbox", { name: "Preview search query" })
      .fill("test fixture evidence");
    await page
      .getByRole("button", { name: "Preview route", exact: true })
      .click();
    await expect(page.locator(".ws-preview-result")).toContainText(
      "2 eligible tools",
    );
    await page
      .getByRole("combobox", { name: "Required content" })
      .selectOption("page_text");
    await page
      .getByRole("button", { name: "Preview route", exact: true })
      .click();
    await expect(page.locator(".ws-preview-result")).toContainText(
      "1 eligible tool",
    );
    await page.getByRole("switch", { name: "Pause exa_search" }).click();
    await expect(
      page.getByRole("switch", { name: "Enable exa_search" }),
    ).not.toBeChecked();
    await expect(
      page.getByRole("switch", { name: "Enable exa_search" }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Preview route", exact: true })
      .click();
    await expect(page.locator(".ws-preview-result")).toContainText(
      "0 eligible tools",
    );
    await page.reload();
    await expect(
      page.getByRole("switch", { name: "Enable exa_search" }),
    ).not.toBeChecked();
    expect(
      (await (await request.get(`${fixture}/api/observations`)).json()).length,
    ).toBe(before.length);
  } finally {
    const current = await (
      await request.get(`${fixture}/api/account/routing`)
    ).json();
    await request.post(`${fixture}/api/account/routing`, {
      data: {
        revision: current.revision,
        disabledTools: previous.disabledTools,
      },
    });
  }
});

test("fixture requests flow into usage, filters, receipt inspection, and CSV", async ({
  page,
  request,
}) => {
  const session = await (
    await request.post(`${fixture}/api/observations/agent-sessions`, {
      data: {
        title: "Dashboard browser fixture",
        objective: "Verify the tool workspace",
        criteria: [{ text: "Recorded request", weight: 1 }],
        model: "browser-fixture",
        host: "Playwright fixture",
      },
    })
  ).json();
  const call = await (
    await request.post(`${fixture}/api/observations/${session.id}/call`, {
      data: {
        tool: "tavily_search",
        query: `workspace-e2e-${session.id}`,
        requestKey: "browser-call",
        statedReason: "Verify request traceability",
      },
    })
  ).json();
  expect(call.status).toBe("succeeded");
  await page.goto(`${fixture}/#dashboard/activity`);
  await expect(page.locator(".ws-overview-requests")).toContainText(
    "Dashboard browser fixture",
  );
  await page.getByRole("link", { name: "View requests", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search requests" })
    .fill(`workspace-e2e-${session.id}`);
  await expect(page.locator(".ws-activity-table tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: `Inspect request ${call.id}` })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Verify request traceability",
  );
  await page.getByRole("tab", { name: "Response", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("TEST FIXTURE");
  await captureJourney(page, "first-tool-call-receipt");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const file = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await file;
  expect(download.suggestedFilename()).toBe("two-hands-activity-7d.csv");
  const stream = await download.createReadStream();
  let csv = "";
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain(call.id);
  expect(csv).toContain("tavily_search");
  expect(csv.startsWith("id,sessionId")).toBe(true);
  await page
    .getByRole("combobox", { name: "Provider", exact: true })
    .selectOption("exa");
  await expect(
    page.getByRole("heading", { name: "No matching requests" }),
  ).toBeVisible();
  await page.goto(`${fixture}/#dashboard/usage`);
  await expect(
    page.getByRole("heading", { name: "Cost and reported usage" }),
  ).toBeVisible();
  await expect(page.locator(".ws-table")).toContainText("Tavily");
});

test("connect agent opens instructions in place and restores focus", async ({
  page,
}) => {
  for (const route of ["#dashboard/activity", "#dashboard/tools"]) {
    await page.goto("/" + route);
    const trigger = page.getByRole("button", {
      name: "Connect agent",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Connect agent",
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCSS("opacity", "1");
    await expect(page).toHaveURL(new RegExp(route + "$"));
    expect(
      (
        await new AxeBuilder({ page })
          .include(".connect-agent-dialog")
          .analyze()
      ).violations,
    ).toEqual([]);
    const bounds = await dialog.boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await dialog.getByRole("button", { name: "Close", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(
      dialog.getByRole("tab", { name: "Use in my agent", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(trigger).toBeFocused();
  }
});

test("connection instructions change with the chosen client", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedCommand: string }).copiedCommand = text;
        },
      },
    });
  });
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({
      json: {
        enabled: false,
        oauth: { resource: "http://127.0.0.1:3101/mcp" },
      },
    }),
  );
  await page.goto("/#dashboard/tools");
  await page
    .getByRole("button", { name: "Connect agent", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Connect agent",
    exact: true,
  });
  const endpoint = new URL("/mcp", page.url()).href;
  const setup = dialog.locator(".ws-remote-configuration");
  const codexConfiguration = `codex mcp add apilayer --url "${endpoint}"\ncodex mcp login apilayer`;
  await expect(setup.locator("code")).toHaveText(codexConfiguration);
  await expect(dialog).not.toContainText("<your API key>");
  await expect(dialog).not.toContainText("npm run");
  await expect(dialog.locator(".ws-setup-steps li")).toHaveCount(3);
  await setup.getByRole("button", { name: "Copy setup", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedCommand: string }).copiedCommand,
    ),
  ).toBe(codexConfiguration);
  await captureJourney(page, "agent-connection-settings");
  await dialog
    .getByRole("button", { name: "Claude Code", exact: true })
    .click();
  const claudeCommand = `claude mcp add --transport http apilayer "${endpoint}"`;
  await expect(setup.locator("code")).toHaveText(claudeCommand);
  await dialog
    .getByRole("button", { name: "Other MCP client", exact: true })
    .click();
  await expect(setup.locator("code")).toHaveText(endpoint);
  await setup.getByRole("button", { name: "Copy setup", exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedCommand: string }).copiedCommand,
    ),
  ).toBe(endpoint);
  await dialog
    .getByRole("tab", { name: "Build into my product", exact: true })
    .click();
  await expect(dialog).toContainText("Create an API key");
  await expect(setup.locator("code")).toContainText(
    '"Authorization": "Bearer <your API key>"',
  );
  await setup
    .getByRole("button", { name: "Copy configuration", exact: true })
    .click();
  const product = JSON.parse(
    await page.evaluate(
      () => (window as unknown as { copiedCommand: string }).copiedCommand,
    ),
  );
  expect(product).toEqual({
    url: endpoint,
    headers: { Authorization: "Bearer <your API key>" },
  });
  await expect(page).toHaveURL(/#dashboard\/tools$/);
});

test("empty request log opens agent setup without leaving the log", async ({
  page,
}) => {
  await page.goto("/#dashboard/requests");
  const trigger = page.getByRole("button", {
    name: "Connect your agent",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog", {
    name: "Connect agent",
    exact: true,
  });
  await expect(dialog).toBeVisible();
  await expect(page).toHaveURL(/#dashboard\/requests$/);
  await dialog
    .getByRole("tab", { name: "Build into my product", exact: true })
    .click();
  await dialog
    .getByRole("link", { name: "Manage API keys", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/#dashboard\/keys$/);
  await expect(
    page.getByRole("heading", { name: "API keys", exact: true }),
  ).toBeVisible();
});

test("help hands off to agent setup and returns focus to the account control", async ({
  page,
}) => {
  await page.goto("/#dashboard/tools");
  if (test.info().project.name === "mobile") {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  const account = page.getByRole("button", { name: /^Account menu:/ });
  await account.click();
  await page
    .getByRole("button", { name: "Help and documentation", exact: true })
    .click();
  const help = page.getByRole("dialog", {
    name: "Help and documentation",
    exact: true,
  });
  await help.getByRole("link", { name: /Connect an agent/ }).click();
  const setup = page.getByRole("dialog", {
    name: "Connect agent",
    exact: true,
  });
  await expect(help).toHaveCount(0);
  await expect(setup).toBeVisible();
  await expect(page).toHaveURL(/#dashboard\/tools$/);
  await page.keyboard.press("Escape");
  await expect(setup).toHaveCount(0);
  await expect(account).toBeFocused();
});

test("usage charts keep every day visible for longer periods", async ({
  page,
}) => {
  await page.goto("/#dashboard/usage");
  const period = page.getByRole("combobox", { name: "Date range" });
  await expect(period).toHaveText("Last 7 days");
  await period.focus();
  await period.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(period).toBeFocused();
  for (const days of [30, 90]) {
    await period.click();
    await page
      .getByRole("option", { name: `Last ${days} days`, exact: true })
      .click();
    await expect(period).toHaveText(`Last ${days} days`);
    await expect(page.locator(".ws-bars > div")).toHaveCount(days);
    const layout = await page.locator(".ws-bars").evaluate((bars) => {
      const box = bars.getBoundingClientRect();
      const cells = Array.from(bars.children).map((c) =>
        c.getBoundingClientRect(),
      );
      return {
        widths: cells.map((c) => c.width),
        right: cells.at(-1)!.right,
        boundary: box.right,
      };
    });
    expect(Math.min(...layout.widths)).toBeGreaterThan(0);
    expect(layout.right).toBeLessThanOrEqual(layout.boundary + 1);
  }
});

test("remote HTTP previews explain the secure endpoint requirement before agent setup", async ({
  page,
}) => {
  const origin = "http://preview.fixture.invalid";
  await page.route(origin + "/**", async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({
      url: "http://127.0.0.1:3101" + url.pathname + url.search,
    });
    await route.fulfill({ response });
  });
  await page.goto(origin + "/#dashboard/connections");
  await expect(page.getByRole("alert")).toContainText(
    "Open Two Hands over HTTPS",
  );
  await expect(
    page.getByRole("heading", { name: "Open Two Hands securely", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open HTTPS address", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://preview.fixture.invalid/#dashboard/connections",
  );
  await captureJourney(page, "remote-http-setup-warning");
});
