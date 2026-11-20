import { test, expect, type Page } from "@playwright/test";
import { captureJourney } from "./helpers/launch-screenshots";
import AxeBuilder from "./helpers/accessibility";
import { providerIds } from "../../server/provider-catalog";
const authBrowserUrl =
  process.env.OCTOLAB_AUTH_BROWSER_URL || "http://127.0.0.1:3102";
test.use({ baseURL: authBrowserUrl });
const authOrigin = "https://octolab-fixture.supabase.co";
const userId = "00000000-0000-4000-8000-000000000011";
const first = "00000000-0000-4000-8000-000000000021";
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const jwt = (id = userId) =>
  encode({ alg: "HS256", typ: "JWT" }) +
  "." +
  encode({
    sub: id,
    session_id: "00000000-0000-4000-8000-000000000031",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }) +
  "." +
  Buffer.from("fixture-signature").toString("base64url");
const user = (id = userId) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "account@fixture.invalid",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: {},
});
async function mockAuth(
  page: Page,
  empty = false,
  role: "user" | "company" | "admin" = "user",
) {
  const state = {
    companies: [] as any[],
    actorId: userId,
    role,
    reviewed: null as any,
    members: [
      {
        id: userId,
        email: "account@fixture.invalid",
        role: "owner",
        createdAt: new Date().toISOString(),
      },
    ],
    hasPersonalAccount: !empty && role === "user",
    // Admins are exempt from account types; tests can set this to null to see the chooser.
    accountType: (role === "company"
      ? "business"
      : role === "user"
        ? "user"
        : null) as "business" | "user" | null,
    setupCalls: 0,
    revoked: false,
  };
  await page.route(
    (url) => url.origin === authBrowserUrl && url.pathname === "/",
    async (route) => {
      const response = await route.fetch(),
        headers = response.headers();
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
  await page.route(authOrigin + "/auth/v1/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    };
    if (req.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (url.pathname.endsWith("/logout")) {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (url.pathname.endsWith("/recover")) {
      await route.fulfill({ json: {}, headers });
      return;
    }
    if (url.pathname.endsWith("/signup")) {
      await route.fulfill({
        json: { user: user(state.actorId), session: null },
        headers,
      });
      return;
    }
    if (url.pathname.endsWith("/token")) {
      const body = req.postDataJSON();
      if (body.password === "incorrect") {
        await route.fulfill({
          status: 400,
          json: {
            code: "invalid_credentials",
            msg: "Invalid login credentials",
          },
          headers,
        });
        return;
      }
      await route.fulfill({
        json: {
          access_token: jwt(state.actorId),
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: "fixture-refresh-token",
          user: user(state.actorId),
        },
        headers,
      });
      return;
    }
    await route.fulfill({ json: user(state.actorId), headers });
  });
  const previewTargets = () => [
    ...state.companies.map((company) => ({
      target: `company:${company.id}`,
      kind: "company",
      id: company.id,
      name: company.name,
      status: company.status,
      providerId: company.providerId,
    })),
    ...["exa", "tavily", "firecrawl"]
      .filter(
        (id) => !state.companies.some((company) => company.providerId === id),
      )
      .map((id) => ({
        target: `provider:${id}`,
        kind: "provider",
        id,
        name: { exa: "Exa", tavily: "Tavily", firecrawl: "Firecrawl" }[id],
        status: "unregistered",
        providerId: id,
      })),
  ];
  await page.route("**/api/auth/preview-targets", (route) =>
    route.fulfill({ json: previewTargets() }),
  );
  await page.route("**/api/auth/preview-insights", (route) =>
    route.fulfill({
      json: {
        providerId: route
          .request()
          .headers()
          ["x-octolab-preview-target"]?.split(":")[1],
        minimumCohort: 0,
        status: "available",
        metrics: {
          offeredSessions: 0,
          selectedSessions: 0,
          calls: 0,
          successfulCalls: 0,
        },
      },
    }),
  );
  await page.route("**/api/auth/me", (route) => {
    const headers = route.request().headers();
    const target = previewTargets().find(
      (target) => target.target === headers["x-octolab-preview-target"],
    );
    return route.fulfill({
      status: state.revoked ? 401 : 200,
      json: state.revoked
        ? { error: "This session ended." }
        : {
            user: { id: state.actorId, email: "account@fixture.invalid" },
            accountType: state.accountType,
            hasPersonalAccount: !target && state.hasPersonalAccount,
            isAdmin: state.role === "admin" && !headers["x-octolab-preview"],
            canPreview: state.role === "admin",
            companyPreview: target,
            companies: target
              ? state.companies
                  .filter((company) => company.id === target.id)
                  .map((company) => ({ ...company, role: "owner" }))
              : state.companies,
          },
    });
  });
  await page.route(/\/api\/auth\/(?:setup|workspaces)$/, async (route) => {
    state.setupCalls++;
    await route.fulfill({ status: 404, json: { error: "Route not found." } });
  });
  await page.route("**/api/account/activity?**", async (route) => {
    if (state.revoked) {
      await route.fulfill({
        status: 401,
        json: { error: "This session ended." },
      });
      return;
    }
    const marker =
      state.actorId === userId ? "Private A receipt" : "Private B receipt";
    await route.fulfill({
      json: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000041",
            sessionId: "00000000-0000-4000-8000-000000000042",
            requestKey: "fixture",
            tool: "exa_search",
            provider: "exa",
            arguments: { query: marker },
            statedReason: "Fixture evidence",
            status: "succeeded",
            startedAt: new Date().toISOString(),
            estimateMicros: 7000,
            sessionTitle: marker,
            host: "fixture",
            model: "fixture",
            reportedUsd: null,
            reportedCredits: null,
            latencyMs: 5,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      },
    });
  });
  const company = {
    id: "00000000-0000-4000-8000-000000000051",
    name: "Fixture tools dashboard",
    website: "https://tools.fixture.invalid",
    toolName: "Fixture search",
    description: "Search integration for fixture evidence.",
    status: "pending",
    role: "owner",
    providerId: null,
    insightsEnabled: false,
    feedback: "",
    revision: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await page.route("**/api/auth/companies", async (route) => {
    const body = route.request().postDataJSON();
    const saved = { ...company, ...body };
    state.companies = [saved];
    await route.fulfill({ status: 201, json: saved });
  });
  await page.route("**/api/companies/*", async (route) => {
    const item = state.companies.find((c) =>
      route.request().url().endsWith(c.id),
    );
    await route.fulfill({
      status: item ? 200 : 404,
      json: item ?? { error: "Company not found." },
    });
  });
  await page.route("**/api/companies/*/insights", async (route) => {
    const item = state.companies.find((company) =>
      route.request().url().includes(company.id),
    );
    await route.fulfill({
      status: item?.status === "approved" ? 200 : 403,
      json:
        item?.status === "approved"
          ? {
              providerId: item.providerId,
              minimumCohort: 0,
              status: "available",
              metrics: {
                offeredSessions: 0,
                selectedSessions: 0,
                calls: 0,
                successfulCalls: 0,
              },
            }
          : {
              error:
                "Company approval is required before insights are available.",
            },
    });
  });
  await page.route("**/api/companies/*/resubmit", async (route) => {
    const body = route.request().postDataJSON();
    if (body.revision !== state.companies[0].revision) {
      await route.fulfill({
        status: 409,
        json: { error: "Stale registration." },
      });
      return;
    }
    state.companies[0] = {
      ...state.companies[0],
      ...body,
      status: "pending",
      revision: body.revision + 1,
    };
    await route.fulfill({ json: state.companies[0] });
  });
  await page.route("**/api/companies/*/members", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      if (body.action === "grant")
        state.members.push({
          id: "00000000-0000-4000-8000-000000000099",
          email: body.email,
          role: "analyst",
          createdAt: new Date().toISOString(),
        });
      else state.members = state.members.filter((m) => m.id !== body.userId);
      await route.fulfill({ json: { replayed: false } });
    } else await route.fulfill({ json: state.members });
  });
  await page.route("**/api/companies/*/access-history", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/admin/companies?**", (route) =>
    route.fulfill({
      status: state.role === "admin" ? 200 : 403,
      json:
        state.role === "admin"
          ? {
              items: [{ ...company, ownerEmail: "owner@fixture.invalid" }],
              nextCursor: null,
            }
          : { error: "Platform administrator access is required." },
    }),
  );
  await page.route("**/api/admin/companies/*/history", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/admin/companies/*/review", async (route) => {
    state.reviewed = route.request().postDataJSON();
    await route.fulfill({
      json: { ...company, ...state.reviewed, revision: 1 },
    });
  });
  return state;
}
async function login(
  page: Page,
  destination = "/#dashboard/activity",
  { waitForApp = true } = {},
) {
  await page.goto(destination);
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("account@fixture.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  // Signed-out visitors sign in at /login; wait until the app has moved on, so a
  // following page.goto() doesn't reload the page mid-sign-in.
  if (waitForApp) await page.waitForURL((url) => url.pathname !== "/login");
}
/** Activity hides the refresh control unless it has an error; Requests keeps it. */
async function refreshAccount(page: Page) {
  await page.getByRole("link", { name: "View requests", exact: true }).click();
  await page.getByRole("button", { name: "Refresh account" }).click();
}
async function openNav(page: Page) {
  if (test.info().project.name !== "mobile") return;
  const menu = page.getByRole("button", { name: /^Account menu/ }).last();
  if (await menu.isVisible()) return;
  const button = page.getByRole("button", { name: "Open navigation" });
  await expect(button).toBeVisible();
  await button.click();
  await expect(menu).toBeVisible();
}
async function openAccountMenu(page: Page) {
  const popover = page.getByRole("dialog", { name: "Account options" });
  if (!(await popover.isVisible())) {
    await openNav(page);
    await page
      .getByRole("button", { name: /^Account menu/ })
      .last()
      .click();
  }
}
async function openSettings(page: Page) {
  await openAccountMenu(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
}
test("email sign-in, persisted session, and sign-out clear the private workspace", async ({
  page,
}) => {
  await mockAuth(page);
  // Private receipt rows and manual refresh live in Request log.
  await login(page, "/#dashboard/requests");
  await expect(page.locator(".ws-activity-table")).toContainText(
    "Private A receipt",
  );
  await page.reload();
  await expect(page.locator(".ws-activity-table")).toContainText(
    "Private A receipt",
  );
  await openNav(page);
  await openAccountMenu(page);
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeVisible();
  await expect(page.getByText("Private A receipt")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("new accounts start automatically and expired access removes private content", async ({
  page,
}) => {
  const state = await mockAuth(page, true);
  // Private receipt rows and manual refresh live in Request log.
  await login(page, "/#dashboard/requests");
  await expect(page.getByLabel("Workspace name")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create workspace", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".ws-activity-table")).toContainText(
    "Private A receipt",
  );
  expect(state.setupCalls).toBe(0);
  await page.reload();
  await expect(page.locator(".ws-activity-table")).toContainText(
    "Private A receipt",
  );
  expect(state.setupCalls).toBe(0);
  state.revoked = true;
  await page.getByRole("button", { name: "Refresh account" }).click();
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeVisible();
  await expect(page.getByText("Private A receipt")).toHaveCount(0);
  await captureJourney(page, "expired-session");
});
test("direct sign-in starts a new customer account without workspace onboarding", async ({
  page,
}) => {
  const state = await mockAuth(page, true);
  await login(page, "/#signin");
  await expect(page).toHaveURL(/#dashboard/);
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  await openNav(page);
  await expect(
    page.getByRole("button", { name: /^Account menu/ }).last(),
  ).toBeAttached();
  await expect(page.getByLabel("Workspace name")).toHaveCount(0);
  await expect(page.getByLabel("Current workspace")).toHaveCount(0);
  expect(state.setupCalls).toBe(0);
});

test("the account menu provides settings and help without a customer picker", async ({
  page,
}) => {
  await mockAuth(page);
  await login(page);
  await openAccountMenu(page);
  await expect(page.getByLabel("Customer account")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Help and documentation", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/#dashboard/connections");
  await expect(
    page.getByText(
      "Two Hands manages provider availability. Use browser sign-in for coding agents or API keys for product integrations.",
    ),
  ).toBeVisible();
});

test("a delayed profile response cannot restore the previous account after sign-out", async ({
  page,
}) => {
  const state = await mockAuth(page, true);
  let release!: () => void,
    waiting = false,
    finished = false;
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/api/auth/me", async (route) => {
    if (state.actorId !== userId) return route.fallback();
    waiting = true;
    await gate;
    await route.fulfill({
      json: {
        user: { id: userId, email: "previous@fixture.invalid" },
        hasPersonalAccount: true,
        companies: [],
      },
    });
    finished = true;
  });
  // The profile response is held back on purpose, so the page stays on /login.
  await login(page, undefined, { waitForApp: false });
  await expect.poll(() => waiting).toBe(true);
  await page.evaluate(() =>
    window.dispatchEvent(new Event("octolab-session-invalid")),
  );
  await expect(
    page.getByRole("heading", { name: "Continue to twohands", exact: true }),
  ).toBeVisible();
  state.actorId = "00000000-0000-4000-8000-000000000099";
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("second@fixture.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".ws-overview-requests")).toContainText(
    "Private B receipt",
  );
  release();
  await expect.poll(() => finished).toBe(true);
  await refreshAccount(page);
  await expect(page.locator(".ws-activity-table")).toContainText(
    "Private B receipt",
  );
  await expect(page.getByText("Private A receipt")).toHaveCount(0);
});

test("confirmation, recovery, invalid credentials, and public landing stay usable", async ({
  page,
}) => {
  await mockAuth(page);
  await page.goto("/#home");
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toHaveCount(0);
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("account@fixture.invalid");
  await page.getByLabel("Password", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByText("The email or password is incorrect."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your email", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to sign in", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Forgot password?", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Send reset link", exact: true })
    .click();
  await expect(
    page.getByText(
      "If an account exists for account@fixture.invalid, you’ll receive a password reset link.",
    ),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("tool company registration never forces a customer workspace or exposes the operator lab", async ({
  page,
}) => {
  const state = await mockAuth(page, true, "company");
  await page.goto("/#company");
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("account@fixture.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bring your tool to Two Hands" }),
  ).toBeVisible();
  await expect(page.getByLabel("Workspace name")).toHaveCount(0);
  expect(state.setupCalls).toBe(0);
  await page.getByLabel("Company name", { exact: true }).fill("Fixture tools");
  await page
    .getByLabel("Company website")
    .fill("https://tools.fixture.invalid");
  await page.getByLabel("Tool name", { exact: true }).fill("Fixture search");
  await page
    .getByLabel("What does your tool do?")
    .fill("Search integration for fixture evidence.");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(
    page.getByRole("heading", { name: "Fixture tools dashboard" }),
  ).toBeVisible();
  await expect(page.getByText("Under review", { exact: true })).toBeVisible();
  await captureJourney(page, "company-pending");
  await openNav(page);
  await expect(
    page.getByRole("link", { name: "Provider lab", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "API keys", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "Live usage", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No usage available yet", exact: true }),
  ).toBeVisible();
  await openNav(page);
  await page.getByRole("link", { name: "Company team", exact: true }).click();
  await page
    .getByLabel("Analyst email", { exact: true })
    .fill("teammate@fixture.invalid");
  await page.getByRole("button", { name: "Add analyst", exact: true }).click();
  await expect(
    page.getByText("teammate@fixture.invalid", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove access", exact: true })
    .click();
  await expect(
    page.getByText("teammate@fixture.invalid", { exact: true }),
  ).toHaveCount(0);
  await openNav(page);
  await page.getByRole("link", { name: "Live usage", exact: true }).click();
  state.companies[0] = {
    ...state.companies[0],
    status: "approved",
    providerId: "exa",
    insightsEnabled: true,
  };
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No usage yet", exact: true }),
  ).toBeVisible();
  await captureJourney(page, "company-approved-no-usage");
  state.companies[0].status = "rejected";
  state.companies[0].revision = 1;
  await page.goto("/#company/" + state.companies[0].id + "/details");
  await page
    .getByRole("button", { name: "Update registration", exact: true })
    .click();
  await page
    .getByLabel("What does your tool do?")
    .fill("Updated ownership details for the reviewed tool.");
  await page
    .getByRole("button", { name: "Resubmit for review", exact: true })
    .click();
  await expect(page.getByText("Under review", { exact: true })).toBeVisible();
  state.companies[0].status = "suspended";
  await page.goto("/#company/" + state.companies[0].id + "/insights");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No usage available yet", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("admin company reviews work without creating a customer workspace", async ({
  page,
}) => {
  const state = await mockAuth(page, true, "admin");
  await login(page, "/#admin");
  await expect(
    page.getByRole("heading", { name: "Company reviews" }),
  ).toBeVisible();
  await expect(page.getByLabel("Workspace name")).toHaveCount(0);
  expect(state.setupCalls).toBe(0);
  await page.getByRole("button", { name: /Fixture tools/ }).click();
  await page.getByLabel("Verified provider integration").selectOption("exa");
  await page
    .getByLabel("Feedback to company")
    .fill("Ownership checked against the company website.");
  await page.getByRole("button", { name: "Save review", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Company review saved");
  await captureJourney(page, "admin-approval");
  expect(state.reviewed).toMatchObject({
    status: "approved",
    providerId: "exa",
    insightsEnabled: false,
    revision: 0,
  });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
test("account settings replace the sidebar area switcher and preserve user navigation", async ({
  page,
}) => {
  await mockAuth(page);
  await login(page);
  await openNav(page);
  await expect(
    page.getByRole("link", { name: "Administration", exact: true }),
  ).toHaveCount(0);
  await openSettings(page);
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Preview as")).toHaveCount(0);
  await expect(page.getByText("Your areas", { exact: true })).toHaveCount(0);
  await openNav(page);
  await page
    .getByRole("link", { name: "Back to dashboard", exact: true })
    .click();
  await expect(page).toHaveURL(/#dashboard/);
});

test("administrator previews standard roles from settings and can always return", async ({
  page,
}) => {
  await mockAuth(page, true, "admin");
  await login(page, "/#admin");
  await expect(
    page.getByRole("heading", { name: "Company reviews" }),
  ).toBeVisible();
  await openNav(page);
  await openSettings(page);
  await page.getByLabel("Preview as").selectOption("company");
  await page.getByLabel("Company to preview").selectOption("provider:exa");
  await page.getByRole("button", { name: "Open company preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Exa dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByText("Previewing company", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Provider preview", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No usage yet", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Your areas", { exact: true })).toHaveCount(0);
  await captureJourney(page, "role-preview-company");
  await page
    .getByRole("button", { name: "Return to admin", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Company reviews" }),
  ).toBeVisible();
  await openNav(page);
  await openSettings(page);
  await page.getByLabel("Preview as").selectOption("user");
  await expect(
    page.getByRole("heading", {
      name: "No personal activity to preview",
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Return to admin", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Company reviews" }),
  ).toBeVisible();
});

test("user preview has no floating bar and can return through account settings", async ({
  page,
}) => {
  const state = await mockAuth(page, false, "admin");
  state.hasPersonalAccount = true;
  await login(page, "/#admin");
  await openSettings(page);
  await page.getByLabel("Preview as").selectOption("user");
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".preview-notice")).toHaveCount(0);
  await openSettings(page);
  await expect(page.getByLabel("Preview as")).toHaveValue("user");
  await page.getByLabel("Preview as").selectOption("admin");
  await expect(
    page.getByRole("heading", { name: "Company reviews", exact: true }),
  ).toBeVisible();
});

test("admin switches selected companies, drops late reports, and retains return access", async ({
  page,
}) => {
  const state = await mockAuth(page, true, "admin");
  const makeCompany = (id: string, name: string, status = "approved") => ({
    id,
    name,
    website: "https://preview.fixture.invalid",
    toolName: name,
    description: "Isolated company preview fixture.",
    status,
    role: "owner",
    providerId: status === "approved" ? "exa" : null,
    insightsEnabled: true,
    revision: 0,
    feedback: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const a = makeCompany(
    "00000000-0000-4000-8000-000000000061",
    "Preview Alpha",
  );
  const b = makeCompany(
    "00000000-0000-4000-8000-000000000062",
    "Preview Beta",
    "pending",
  );
  state.companies = [a, b];
  let release = () => {},
    waiting = false,
    finished = false;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/companies/${a.id}/insights`, async (route) => {
    expect(route.request().headers()["x-octolab-preview-target"]).toBe(
      `company:${a.id}`,
    );
    waiting = true;
    await gate;
    await route.fulfill({
      json: {
        providerId: "exa",
        minimumCohort: 0,
        status: "available",
        metrics: {
          offeredSessions: 987654,
          selectedSessions: 987654,
          calls: 987654,
          successfulCalls: 987654,
        },
      },
    });
    finished = true;
  });
  await login(page);
  await openNav(page);
  await openSettings(page);
  await page.getByLabel("Preview as").selectOption("company");
  await page.getByLabel("Company to preview").selectOption(`company:${a.id}`);
  await captureJourney(page, "company-preview-picker");
  await page.getByRole("button", { name: "Open company preview" }).click();
  await expect(
    page.getByRole("heading", { name: `${a.name} dashboard`, exact: true }),
  ).toBeVisible();
  await expect.poll(() => waiting).toBe(true);
  await page
    .getByLabel("Preview company", { exact: true })
    .selectOption(`company:${b.id}`);
  await expect(
    page.getByRole("heading", { name: `${b.name} dashboard`, exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Preview company", { exact: true })).toHaveValue(
    `company:${b.id}`,
  );
  release();
  await expect.poll(() => finished).toBe(true);
  await expect(page.locator("body")).not.toContainText(/987[,\s]?654/);
  await expect(
    page.getByText("No usage available yet", { exact: true }).first(),
  ).toBeVisible();
  await page.goto(`/#company/${b.id}/overview`);
  await expect(
    page.getByText("Under review", { exact: true }).first(),
  ).toBeVisible();
  await captureJourney(page, "company-preview-pending");
  await expect(
    page.getByRole("link", { name: "Register another company" }),
  ).toHaveCount(0);
  await page.goto(`/#company/${a.id}/insights`);
  await expect(
    page.getByText("This page is outside the company you’re previewing."),
  ).toBeVisible();
  await page
    .getByLabel("Preview company", { exact: true })
    .selectOption("provider:tavily");
  await expect(
    page.getByRole("heading", { name: "Tavily dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No usage yet", exact: true }),
  ).toBeVisible();
  await captureJourney(page, "company-preview-provider");
  await expect(page.locator("body")).not.toContainText(/987[,\s]?654/);
  await page
    .getByRole("button", { name: "Return to admin", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Company reviews" }),
  ).toBeVisible();
  await expect(page.getByLabel("Preview company", { exact: true })).toHaveCount(
    0,
  );
});

test("signed-in account owner can create the first key and proceed to agent setup", async ({
  page,
}) => {
  await mockAuth(page);
  const secret = "oct_key_" + "launch_fixture_secret".padEnd(43, "x");
  let created: any = null;
  let sentHeaders: Record<string, string> = {};
  await page.route("**/api/account/api-keys", async (route) => {
    if (route.request().method() === "POST") {
      sentHeaders = route.request().headers();
      const body = route.request().postDataJSON();
      created = {
        id: "00000000-0000-4000-8000-000000000071",
        workspaceId: first,
        name: body.name,
        prefix: secret.slice(0, 15),
        scopes: body.scopes,
        allowedTools: body.allowedTools,
        limitMicros: 10000000,
        spentMicros: 0,
        reservedMicros: 0,
        remainingMicros: 10000000,
        revision: 0,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        revokedAt: null,
        lastUsedAt: null,
        status: "active",
      };
      await route.fulfill({ status: 201, json: { key: created, secret } });
    } else
      await route.fulfill({
        json: {
          keys: created ? [created] : [],
          enabled: true,
          unavailableReason: null,
        },
      });
  });
  await login(page);
  await page.goto("/#dashboard/keys");
  await expect(
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Create API key", exact: true })
    .click();
  await page.getByLabel("API key name", { exact: true }).fill("First agent");
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  await expect(
    page.getByLabel("New API key secret", { exact: true }),
  ).toHaveAttribute("type", "password");
  expect(sentHeaders.authorization).toMatch(/^Bearer /);
  expect(sentHeaders["x-octolab-workspace"]).toBeUndefined();
  await captureJourney(page, "first-api-key");
  await page
    .getByRole("button", { name: "Product integration setup", exact: true })
    .click();
  await expect(
    page.getByLabel("New API key secret", { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".ws-remote-configuration")).toContainText(
    new URL("/mcp", authBrowserUrl).href,
  );
  await expect(
    page.getByRole("tab", { name: "Build into my product", exact: true }),
  ).toHaveAttribute("data-state", "active");
  expect(page.url()).not.toContain(secret);
  await captureJourney(page, "owner-agent-setup");
  await page
    .getByRole("dialog", { name: "Connect agent", exact: true })
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Connect agent", exact: true }),
  ).toHaveCount(0);
  await captureJourney(page, "api-keys-column-header");
});

test("admin navigation persists across company reviews and account activity", async ({
  page,
}, testInfo) => {
  await mockAuth(page, false, "admin");
  await login(page);
  await page.goto("/#admin");
  await expect(
    page.getByRole("heading", { name: "Company reviews", exact: true }),
  ).toBeVisible();
  await openNav(page);
  const before = await page
    .getByRole("navigation")
    .first()
    .getByRole("link")
    .allTextContents();
  await page
    .getByRole("link", { name: "Account activity", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Sessions", exact: true }),
  ).toBeVisible();
  await openNav(page);
  const after = await page
    .getByRole("navigation")
    .last()
    .getByRole("link")
    .allTextContents();
  console.log(
    JSON.stringify({ route: new URL(page.url()).hash, before, after }),
  );
  await page.screenshot({
    path: testInfo.outputPath("admin-operations-navigation.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("link", { name: "Company reviews", exact: true }),
  ).toBeVisible();
});

test("admin opens account activity directly without a customer picker", async ({
  page,
}) => {
  await mockAuth(page, true, "admin");
  await login(page, "/#sessions");
  await expect(
    page.getByRole("heading", { name: "Sessions", exact: true }),
  ).toBeVisible();
  await openAccountMenu(page);
  await expect(page.getByLabel("Customer account")).toHaveCount(0);
});

test("admin destinations preserve navigation, active links, refresh, and browser history", async ({
  page,
}) => {
  await mockAuth(page, false, "admin");
  await login(page);
  await page.goto("/#admin");
  const destinations = [
    { label: "Account activity", hash: "#sessions", heading: "Sessions" },
    {
      label: "Payment disputes",
      hash: "#disputes",
      heading: "Payment disputes",
    },
    { label: "Provider lab", hash: "#lab", heading: "Provider lab" },
    { label: "Company reviews", hash: "#admin", heading: "Company reviews" },
  ];
  for (const destination of destinations) {
    await openNav(page);
    await page
      .getByRole("link", { name: destination.label, exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(destination.hash + "$"));
    await expect(
      page.getByRole("heading", { name: destination.heading, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: destination.heading, exact: true }),
    ).toBeVisible();
    await openNav(page);
    const nav = page
      .getByRole("navigation", { name: "Admin navigation" })
      .last();
    for (const item of destinations)
      await expect(
        nav.getByRole("link", { name: item.label, exact: true }),
      ).toBeVisible();
    await expect(nav.locator('[aria-current="page"]')).toHaveText(
      destination.label,
    );
    if (test.info().project.name === "mobile") {
      if (await page.getByRole("dialog").isVisible())
        await page.keyboard.press("Escape");
      else await page.getByRole("button", { name: "Close navigation" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }
  }
  await page.goBack();
  await expect(page).toHaveURL(/#lab$/);
  await expect(
    page.getByRole("heading", { name: "Provider lab", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/#admin$/);
  await expect(
    page.getByRole("heading", { name: "Company reviews", exact: true }),
  ).toBeVisible();
});

test("admin tool access requires an explicit audited save, preserves retry key, and pauses without resetting spend", async ({
  page,
}) => {
  await mockAuth(page, true, "admin");
  const allowance = {
    enforced: true,
    state: "unconfigured",
    limitMicros: 0,
    spentMicros: 0,
    reservedMicros: 0,
    remainingMicros: 0,
    revision: 0,
    basis: "estimated_provider_spend_since_activation",
  };
  let value = { ...allowance };
  const writes: any[] = [];
  await page.route("**/api/admin/account-allowances", (route) =>
    route.fulfill({
      json: {
        items: [
          {
            accountId: first,
            name: "beta@fixture.invalid",
            operatorAllowance: value,
          },
        ],
        nextCursor: null,
      },
    }),
  );
  await page.route("**/api/admin/account-allowances/*", async (route) => {
    const body = route.request().postDataJSON();
    writes.push(body);
    value = {
      ...value,
      limitMicros: body.limitMicros,
      spentMicros: 7000,
      remainingMicros: body.limitMicros - 7000,
      state: body.paused ? "paused" : "available",
      revision: body.revision + 1,
    };
    if (writes.length === 1) {
      await route.fulfill({
        status: 503,
        json: {
          error: "Fixture response interrupted. Retry the unchanged request.",
        },
      });
      return;
    }
    await route.fulfill({
      json: { operatorAllowance: value, replayed: writes.length === 2 },
    });
  });
  await login(page);
  await page.goto("/#tool-access");
  await expect(
    page.getByRole("heading", { name: "Tool access", exact: true }),
  ).toBeVisible();
  expect(writes).toHaveLength(0);
  await page.getByRole("button", { name: /beta@fixture.invalid/ }).click();
  await page
    .getByLabel("Estimated lifetime limit (USD)", { exact: true })
    .fill("0.014");
  await page.getByLabel("Reason for change").fill("Fixture beta authorization");
  await page
    .getByRole("button", { name: "Save tool access", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Fixture response interrupted",
  );
  await page
    .getByRole("button", { name: "Save tool access", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Saved request confirmed",
  );
  expect(writes).toHaveLength(2);
  expect(writes[0]).toEqual(writes[1]);
  expect(writes[0]).toMatchObject({
    revision: 0,
    limitMicros: 14000,
    paused: false,
    reason: "Fixture beta authorization",
  });
  await page
    .getByLabel("Estimated lifetime limit (USD)", { exact: true })
    .fill("0");
  await page.getByLabel("Reason for change").fill("Fixture invalid shrink");
  await page
    .getByRole("button", { name: "Save tool access", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "below spent and reserved",
  );
  expect(writes).toHaveLength(2);
  await page
    .getByLabel("Estimated lifetime limit (USD)", { exact: true })
    .fill("0.014");
  await page.getByLabel("Pause new provider calls").check();
  await page.getByLabel("Reason for change").fill("Fixture pause");
  await page
    .getByRole("button", { name: "Save tool access", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Tool access saved");
  expect(writes[2]).toMatchObject({
    revision: 1,
    limitMicros: 14000,
    paused: true,
  });
  await expect(page.locator("dl")).toContainText("$0.007");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("ordinary accounts see no activation notice and cannot open admin tool access", async ({
  page,
}) => {
  await mockAuth(page);
  await page.route("**/api/account/operator-allowance", (route) =>
    route.fulfill({
      json: {
        enforced: true,
        state: "unconfigured",
        limitMicros: 0,
        spentMicros: 0,
        reservedMicros: 0,
        remainingMicros: 0,
        revision: 0,
        basis: "estimated_provider_spend_since_activation",
      },
    }),
  );
  const allowance = page.waitForResponse("**/api/account/operator-allowance");
  await login(page);
  await allowance;
  await expect(page.locator(".tool-access-notice")).toHaveCount(0);
  await page.goto("/#tool-access");
  await expect(
    page.getByRole("heading", { name: "Administrator access required" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save tool access" }),
  ).toHaveCount(0);
});

const platformSettingsFixture = () => ({
  revision: 0,
  updatedAt: null,
  rateCardVersion: "isolated-settings-fixture",
  values: {
    providers: Object.fromEntries(
      providerIds.map((id) => [
        id,
        { enabled: true, requestsPerMinute: 20, estimateMicros: 7000 },
      ]),
    ),
    timeoutMs: 20000,
    sessionBudgetMicros: 100000,
    testBudgetMicros: 150000,
    testDailyBudgetMicros: 500000,
    exaAdditionalResultMicros: 1000,
  },
  credentials: Object.fromEntries(
    providerIds.map((id) => [
      id,
      { configured: true, source: "environment", needsReplacement: false },
    ]),
  ),
  secretStore: { available: true, name: "Supabase Vault" },
  effective:
    "New calls immediately after save; current calls must finish first",
});
test("admin edits platform settings and write-only credentials immediately after sign-in", async ({
  page,
}) => {
  await mockAuth(page, true, "admin");
  let current = platformSettingsFixture();
  const writes: any[] = [];
  await page.route("**/api/admin/tool-settings/history", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/admin/tool-settings", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      writes.push(body);
      current = {
        ...current,
        revision: current.revision + 1,
        values: body.values,
      };
      expect(route.request().headers().authorization).toMatch(/^Bearer /);
    }
    await route.fulfill({ json: current });
  });
  await login(page, "/#tool-settings");
  await expect(
    page.getByRole("heading", { name: "Tool settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("New API key")).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByLabel("Requests per minute").first().fill("7");
  await page.getByLabel("Enabled", { exact: true }).first().uncheck();
  await page.getByLabel("New API key").fill("fixture-only-provider-secret");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Settings saved");
  await expect(page.getByLabel("New API key")).toHaveValue("");
  expect(writes[0]).toMatchObject({
    revision: 0,
    values: { providers: { exa: { enabled: false, requestsPerMinute: 7 } } },
    credential: { provider: "exa", value: "fixture-only-provider-secret" },
  });
  await page.reload();
  await expect(page.getByLabel("Requests per minute").first()).toHaveValue("7");
  await openNav(page);
  await expect(
    page.getByRole("link", { name: "Tool settings", exact: true }),
  ).toBeVisible();
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Close navigation" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await captureJourney(page, "admin-platform-tool-settings");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const storage = await page.evaluate(() =>
    JSON.stringify({
      local: { ...localStorage },
      session: { ...sessionStorage },
    }),
  );
  expect(storage).not.toContain("fixture-only-provider-secret");
});
test("a previous settings response cannot overwrite the next signed-in admin's credential form", async ({
  page,
}) => {
  const state = await mockAuth(page, true, "admin");
  let release!: () => void,
    waiting = false;
  const gate = new Promise<void>((r) => (release = r));
  await page.route("**/api/admin/tool-settings/history", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.route("**/api/admin/tool-settings", async (route) => {
    if (route.request().method() === "POST") {
      waiting = true;
      await gate;
    }
    await route.fulfill({ json: platformSettingsFixture() });
  });
  await login(page, "/#tool-settings");
  await page.getByLabel("New API key").fill("fixture-previous-account-secret");
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect.poll(() => waiting).toBe(true);
  await openNav(page);
  await openAccountMenu(page);
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeVisible();
  state.actorId = "00000000-0000-4000-8000-000000000099";
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("second@fixture.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByLabel("New API key")).toHaveValue("");
  await page.getByLabel("New API key").fill("fixture-new-account-input");
  release();
  await expect(page.getByLabel("New API key")).toHaveValue(
    "fixture-new-account-input",
  );
  await expect(
    page.getByText("Settings saved. New calls use this revision."),
  ).toHaveCount(0);
});

/** Record POST /api/auth/account-type and apply it to the mocked profile. */
async function mockAccountTypeChoice(
  page: Page,
  state: Awaited<ReturnType<typeof mockAuth>>,
) {
  const sent: unknown[] = [];
  await page.route("**/api/auth/account-type", async (route) => {
    const body = route.request().postDataJSON();
    sent.push(body);
    state.accountType = body.accountType;
    await route.fulfill({ json: { accountType: body.accountType } });
  });
  return sent;
}

test("logged-out visitors go to /login, with Business preselected for the company area", async ({
  page,
}) => {
  await mockAuth(page);
  await page.goto("/#company");
  await expect(page).toHaveURL(/\/login#company$/);
  const picker = page.getByRole("group", {
    name: "New to Two Hands? Choose an account type",
  });
  await expect(picker.getByRole("radio", { name: /Business/ })).toBeChecked();
  await page.goto("/#dashboard");
  await expect(page).toHaveURL(/\/login#dashboard$/);
  await expect(picker.getByRole("radio", { name: /User/ })).toBeChecked();
  // The email sign-up form offers the same choice.
  await page
    .getByRole("button", { name: "Continue with email", exact: true })
    .click();
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(
    page
      .getByRole("group", { name: "Account type" })
      .getByRole("radio", { name: /Business/ }),
  ).toBeVisible();
});

test("a new account chooses its type once and lands in its own area", async ({
  page,
}) => {
  const state = await mockAuth(page);
  state.accountType = null;
  state.hasPersonalAccount = false;
  const sent = await mockAccountTypeChoice(page, state);
  await login(page, "/#dashboard", { waitForApp: false });
  await expect(
    page.getByRole("heading", { name: "How will you use Two Hands?" }),
  ).toBeVisible();
  // People click the card; the radio inside it is visually hidden.
  await page.locator(".account-type-option", { hasText: "Business" }).click();
  await page.getByRole("button", { name: "Continue as a business" }).click();
  await expect(page).toHaveURL(/:\d+\/#company$/);
  expect(sent).toEqual([{ accountType: "business" }]);
});

test("a type picked at sign-up is saved after sign-in without asking again", async ({
  page,
}) => {
  const state = await mockAuth(page);
  state.accountType = null;
  const sent = await mockAccountTypeChoice(page, state);
  await page.addInitScript(() =>
    localStorage.setItem("two-hands-account-type-choice", "user"),
  );
  await login(page, "/#dashboard", { waitForApp: false });
  await expect(page).toHaveURL(/:\d+\/#dashboard$/);
  expect(sent).toEqual([{ accountType: "user" }]);
  await expect(
    page.getByRole("heading", { name: "How will you use Two Hands?" }),
  ).toHaveCount(0);
});

test("user accounts cannot open the company area", async ({ page }) => {
  await mockAuth(page);
  await login(page);
  await page.goto("/#company");
  await expect(
    page.getByRole("heading", {
      name: "This area is for business accounts",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open your dashboard" }).click();
  await expect(page).toHaveURL(/#dashboard$/);
});

test("business accounts cannot open the user dashboard", async ({ page }) => {
  await mockAuth(page, false, "company");
  await login(page, "/#company");
  await expect(page).toHaveURL(/:\d+\/#company$/);
  await page.goto("/#dashboard/credits");
  await expect(
    page.getByRole("heading", { name: "This area is for user accounts" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open your company dashboard" }),
  ).toHaveAttribute("href", "#company");
});
