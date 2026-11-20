import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { captureJourney } from "./helpers/launch-screenshots";

const origin = "http://127.0.0.1:3102";
const authOrigin = "https://octolab-fixture.supabase.co";
const id = "00000000-0000-4000-8000-000000000071";
const userId = "00000000-0000-4000-8000-000000000072";
test.use({ baseURL: origin });
async function fixture(page: Page, unbound = false) {
  const state = { admin: false, available: true, calls: 23 };
  const company = {
    id,
    name: "Fixture company",
    website: "https://fixture.invalid",
    toolName: "Fixture tool",
    description: "A company-owned tool with a distinct description.",
    status: unbound ? "pending" : "approved",
    providerId: unbound ? null : "tavily",
    insightsEnabled: !unbound,
    role: "owner",
    revision: 0,
    feedback: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const target = {
    target: `company:${id}`,
    kind: "company",
    id,
    name: company.name,
    providerId: company.providerId,
    status: company.status,
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({
      sub: userId,
      session_id: "00000000-0000-4000-8000-000000000073",
      exp: expires,
    }) +
    ".fixture";
  await page.addInitScript(
    ({ token, expires, userId }) => {
      localStorage.setItem(
        "sb-octolab-fixture-auth-token",
        JSON.stringify({
          access_token: token,
          refresh_token: "fixture-refresh",
          expires_at: expires,
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: userId,
            aud: "authenticated",
            role: "authenticated",
            email: "owner@fixture.invalid",
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        }),
      );
    },
    { token, expires, userId },
  );
  await page.route(
    (url) => url.origin === origin && url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      headers["content-security-policy"] = headers[
        "content-security-policy"
      ].replace("connect-src 'self'", "connect-src 'self' " + authOrigin);
      await route.fulfill({ response, headers });
    },
  );
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        url: authOrigin,
        publishableKey: "sb_publishable_fixture",
      },
    }),
  );
  await page.route("**/api/auth/me", (route) => {
    const preview =
      route.request().headers()["x-octolab-preview"] === "company";
    return route.fulfill({
      json: {
        user: { id: userId, email: "owner@fixture.invalid" },
        accountType: state.admin ? null : "business",
        isAdmin: state.admin && !preview,
        canPreview: state.admin,
        workspaces: [],
        companies: [company],
        ...(preview ? { companyPreview: target } : {}),
      },
    });
  });
  await page.route("**/api/auth/preview-targets", (route) =>
    route.fulfill({ json: [target] }),
  );
  await page.route(`**/api/companies/${id}`, (route) =>
    route.fulfill({ json: company }),
  );
  await page.route(`**/api/companies/${id}/insights`, (route) =>
    route.fulfill({
      json: {
        providerId: "tavily",
        minimumCohort: 0,
        status: state.available ? "available" : "awaiting_release",
        metrics: state.available
          ? {
              offeredSessions: state.calls === 1 ? 1 : state.calls ? 17 : 0,
              selectedSessions: state.calls === 1 ? 1 : state.calls ? 12 : 0,
              calls: state.calls,
              successfulCalls: state.calls === 1 ? 1 : state.calls ? 21 : 0,
            }
          : null,
      },
    }),
  );
  await page.route(`**/api/companies/${id}/members`, (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route(`**/api/companies/${id}/access-history`, (route) =>
    route.fulfill({ json: [] }),
  );
  return state;
}
async function nav(page: Page) {
  const toggle = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
  return page
    .getByRole("navigation", { name: "Tool company navigation" })
    .filter({ visible: true });
}
test("company holder and selected admin preview share the dashboard, navigation, and real usage", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/#company/${id}/overview`);
  await expect(
    page.getByRole("heading", { name: "Fixture company dashboard" }),
  ).toBeVisible();
  await expect(page.locator(".company-metric-grid")).toContainText("23");
  const ownerNav = await nav(page);
  const holderLinks = await ownerNav.getByRole("link").allTextContents();
  expect(holderLinks).toEqual([
    "Overview",
    "Live usage",
    "Controlled tests",
    "Test plans",
    "Integration",
    "Connectors",
    "Company details",
    "Company team",
  ]);
  await ownerNav
    .getByRole("link", { name: "Controlled tests", exact: true })
    .click();
  await expect(
    page.getByText("No controlled tests yet", { exact: true }),
  ).toBeVisible();
  const ownerPlansNav = await nav(page);
  await ownerPlansNav
    .getByRole("link", { name: "Test plans", exact: true })
    .click();
  await expect(
    page.getByText("No test plans yet", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /run|schedule|create plan/i }),
  ).toHaveCount(0);
  state.admin = true;
  await page.goto("/#settings");
  await page.reload();
  await page.getByLabel("Preview as", { exact: true }).selectOption("company");
  await page
    .getByRole("button", { name: "Open company preview", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Fixture company dashboard" }),
  ).toBeVisible();
  await expect(page.locator(".company-metric-grid")).toContainText("23");
  const previewNav = await nav(page);
  expect(await previewNav.getByRole("link").allTextContents()).toEqual(
    holderLinks,
  );
  await previewNav.getByRole("link", { name: "Overview", exact: true }).click();
  await captureJourney(page, "shared-company-dashboard-data");
  state.calls = 0;
  await page.getByRole("button", { name: "Refresh company dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "No usage yet", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".company-metric > strong")).toHaveText([
    "—",
    "—",
    "0",
    "0",
  ]);
  state.available = false;
  await page.getByRole("button", { name: "Refresh company dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "No usage available yet", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".company-metric")).toHaveCount(4);
  await expect(page.locator(".company-metric > strong")).toHaveText([
    "—",
    "—",
    "—",
    "—",
  ]);
  await expect(
    page.getByText("No controlled tests yet", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No test plans yet", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/At least 5 independent|does not verify a company/),
  ).toHaveCount(0);
  await captureJourney(page, "shared-company-dashboard-empty");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("unbound company keeps its own identity, visible sections, and owner pages", async ({
  page,
}) => {
  await fixture(page, true);
  await page.goto(`/#company/${id}/overview`);
  await expect(
    page.getByRole("heading", { name: "Fixture company dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Under review", { exact: true })).toBeVisible();
  await expect(
    page.getByText("A company-owned tool with a distinct description.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".company-logo")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("exa_search");
  const links = await nav(page);
  await links
    .getByRole("link", { name: "Company details", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Update registration", exact: true }),
  ).toBeVisible();
  const teamNav = await nav(page);
  await teamNav
    .getByRole("link", { name: "Company team", exact: true })
    .click();
  await expect(page.getByLabel("Analyst email", { exact: true })).toBeVisible();
  const integrationNav = await nav(page);
  await integrationNav
    .getByRole("link", { name: "Integration", exact: true })
    .click();
  await expect(page.getByText("Fixture tool", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Provider documentation" }),
  ).toHaveCount(0);
});

test("the first recorded call is visible in company-holder and admin-preview dashboards", async ({
  page,
}) => {
  const state = await fixture(page);
  state.calls = 1;
  await page.goto(`/#company/${id}/overview`);
  await expect(page.locator(".company-metric > strong")).toHaveText([
    "100%",
    "100%",
    "1",
    "1",
  ]);
  await expect(
    page.getByText("1 of 1 sessions", { exact: true }),
  ).toBeVisible();
  state.admin = true;
  await page.goto("/#settings");
  await page.reload();
  await page.getByLabel("Preview as", { exact: true }).selectOption("company");
  await page
    .getByRole("button", { name: "Open company preview", exact: true })
    .click();
  await expect(page.locator(".company-metric > strong")).toHaveText([
    "100%",
    "100%",
    "1",
    "1",
  ]);
  await captureJourney(page, "company-first-call");
  const navigation = await nav(page);
  await navigation
    .getByRole("link", { name: "Live usage", exact: true })
    .click();
  await expect(page.locator(".company-call-summary > span").first()).toHaveText(
    "1 completed call",
  );
  await expect(page.getByText(/at least 5|minimum cohort/i)).toHaveCount(0);
});

test("leaving a registration edit opens the selected company page", async ({
  page,
}) => {
  await fixture(page, true);
  await page.goto(`/#company/${id}/details`);
  await page
    .getByRole("button", { name: "Update registration", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Update company details", exact: true }),
  ).toBeVisible();

  await page.goto(`/#company/${id}/team`);

  await expect(page.getByLabel("Analyst email", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Update company details", exact: true }),
  ).toHaveCount(0);
});
