import { test, expect, type Page, type Route } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Hosted company and admin connector screens, against a mocked account API.
const origin = "http://127.0.0.1:3102";
const authOrigin = "https://octolab-fixture.supabase.co";
const companyId = "00000000-0000-4000-8000-000000000081";
const userId = "00000000-0000-4000-8000-000000000082";
const connectorId = "00000000-0000-4000-8000-000000000083";
test.use({ baseURL: origin });

function tool(name: string, status: string) {
  return {
    name,
    exposedName: `weatherco__${name}`,
    description: `Fixture ${name.replace("_", " ")} tool.`,
    inputSchema: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
    schemaHash: (name === "get_forecast" ? "a" : "b").repeat(64),
    status,
    estimateMicros: 2000,
    firstSeenAt: "2026-11-14T00:00:00.000Z",
    changedAt: "2026-11-14T00:00:00.000Z",
  };
}

async function fixture(
  page: Page,
  options: { admin?: boolean; status?: string; role?: string } = {},
) {
  const state = {
    connectors: [] as any[],
    created: [] as any[],
    reviews: [] as any[],
  };
  const company = {
    id: companyId,
    name: "Weather fixture company",
    website: "https://weather.fixture.invalid",
    toolName: "Weather fixture",
    description: "A connector-only company for browser tests.",
    status: options.status ?? "approved",
    providerId: null,
    insightsEnabled: false,
    role: options.role ?? "owner",
    revision: 1,
    feedback: "Ownership verified.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const token =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({
      sub: userId,
      session_id: "00000000-0000-4000-8000-000000000084",
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
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        user: { id: userId, email: "owner@fixture.invalid" },
        accountType: options.admin ? null : "business",
        isAdmin: !!options.admin,
        canPreview: !!options.admin,
        workspaces: [],
        companies: options.admin ? [] : [company],
      },
    }),
  );
  await page.route(`**/api/companies/${companyId}`, (route) =>
    route.fulfill({ json: company }),
  );
  const connectorApi = async (route: Route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const body = request.postData() ? JSON.parse(request.postData()!) : null;
    if (/\/connectors$/.test(path)) {
      if (request.method() === "POST") {
        state.created.push(body);
        const connector = {
          id: connectorId,
          slug: body.slug,
          name: body.name,
          description: body.description,
          endpoint: body.endpoint,
          companyId,
          status: "pending",
          declaredPriceMicros: Math.round(body.declaredPriceUsd * 1e6),
          tools: [
            tool("get_forecast", "pending"),
            tool("hostile_reply", "pending"),
          ],
          snapshotVersion: 1,
          revision: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastRefreshedAt: new Date().toISOString(),
          lastRefreshError: null,
          hasCredential: !!body.token,
        };
        state.connectors = [connector];
        return route.fulfill({ status: 201, json: connector });
      }
      return route.fulfill({
        json: { connectors: state.connectors, tokenStorage: true },
      });
    }
    if (/\/review$/.test(path)) {
      state.reviews.push(body);
      const c = state.connectors[0];
      for (const d of body.tools) {
        const t = c.tools.find((x: any) => x.name === d.name);
        t.status = d.decision === "approve" ? "approved" : "rejected";
        if (d.estimateUsd !== undefined)
          t.estimateMicros = Math.round(d.estimateUsd * 1e6);
      }
      c.status = body.decision === "approve" ? "approved" : c.status;
      c.revision++;
      c.reviewNote = body.note;
      return route.fulfill({ json: c });
    }
    return route.fulfill({
      json: {
        connector: state.connectors[0],
        events: [
          {
            id: 1,
            type: "connector_registered",
            at: new Date().toISOString(),
            data: { tools: ["get_forecast", "hostile_reply"] },
          },
        ],
      },
    });
  };
  await page.route(`**/api/companies/${companyId}/connectors**`, connectorApi);
  await page.route("**/api/admin/connectors**", connectorApi);
  return state;
}

async function nav(page: Page, name: string) {
  const toggle = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
  return page.getByRole("navigation", { name }).filter({ visible: true });
}

test("a company owner registers a connector from the company area", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/#company/${companyId}/overview`);
  await expect(
    page.getByRole("heading", { name: "Weather fixture company dashboard" }),
  ).toBeVisible();
  const links = await nav(page, "Tool company navigation");
  await links.getByRole("link", { name: "Connectors", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Connectors", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No connectors yet.")).toBeVisible();
  await page.getByRole("button", { name: "Register connector" }).click();
  await page.getByLabel("Display name").fill("Weather fixture");
  await page.getByLabel("Short name").fill("weatherco");
  await page
    .getByLabel("What your tools do")
    .fill("Deterministic weather tools for browser tests.");
  await page
    .getByLabel("MCP endpoint")
    .fill("https://mcp.weather.example.org/mcp");
  await page.getByLabel("Access token (optional)").fill("secret-token-123");
  await page.getByRole("button", { name: "Connect and read tools" }).click();
  await expect(
    page.getByText("Connector registered. Its tools are waiting for review."),
  ).toBeVisible();
  expect(state.created[0]).toMatchObject({
    slug: "weatherco",
    endpoint: "https://mcp.weather.example.org/mcp",
    token: "secret-token-123",
    declaredPriceUsd: 0.002,
  });
  await expect(page.getByText("weatherco__get_forecast")).toBeVisible();
  await expect(page.getByText("Needs review").first()).toBeVisible();
  // Companies never see review controls.
  await expect(page.getByRole("button", { name: "Save review" })).toHaveCount(
    0,
  );
  await expect(page.getByText("Stored, encrypted")).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include(".connectors-page")
    .analyze();
  expect(results.violations).toEqual([]);
});

test("connectors stay locked until the company is approved, and analysts cannot register", async ({
  page,
}) => {
  await fixture(page, { status: "pending" });
  await page.goto(`/#company/${companyId}/connectors`);
  await expect(
    page.getByText(
      "Connectors become available once our team approves your company registration.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Register connector" }),
  ).toHaveCount(0);
});

test("an analyst can read connectors but not register them", async ({
  page,
}) => {
  await fixture(page, { role: "analyst" });
  await page.goto(`/#company/${companyId}/connectors`);
  await expect(
    page.getByText("No connectors have been registered."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Register connector" }),
  ).toHaveCount(0);
});

test("a platform admin approves tools at a chosen price and rejects others", async ({
  page,
}) => {
  const state = await fixture(page, { admin: true });
  state.connectors = [
    {
      id: connectorId,
      slug: "weatherco",
      name: "Weather fixture",
      description: "Deterministic weather tools for browser tests.",
      endpoint: "https://mcp.weather.example.org/mcp",
      companyId,
      status: "pending",
      declaredPriceMicros: 2000,
      tools: [
        tool("get_forecast", "pending"),
        tool("hostile_reply", "pending"),
      ],
      snapshotVersion: 1,
      revision: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRefreshedAt: new Date().toISOString(),
      lastRefreshError: null,
      hasCredential: true,
    },
  ];
  await page.goto("/#connectors");
  await expect(
    page.getByRole("heading", { name: "Connector reviews", exact: true }),
  ).toBeVisible();
  const admin = await nav(page, "Admin navigation");
  await expect(
    admin.getByRole("link", { name: "Connector reviews", exact: true }),
  ).toBeVisible();
  // Admins review; they do not register on a company's behalf here.
  await expect(
    page.getByRole("button", { name: "Register connector" }),
  ).toHaveCount(0);
  const toggle = page.getByRole("button", {
    name: "Close navigation",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByLabel("Decision for get_forecast").selectOption("approve");
  await page.getByLabel("Price per call for get_forecast, USD").fill("0.004");
  await page.getByLabel("Decision for hostile_reply").selectOption("reject");
  await page.getByLabel("Note to the company").fill("Forecast approved.");
  await page.getByRole("button", { name: "Save review" }).click();
  await expect(
    page.getByText("Review saved. Approved tools are now available to agents."),
  ).toBeVisible();
  expect(state.reviews[0]).toMatchObject({
    revision: 1,
    decision: "approve",
    note: "Forecast approved.",
    tools: [
      {
        name: "get_forecast",
        schemaHash: "a".repeat(64),
        decision: "approve",
        estimateUsd: 0.004,
      },
      { name: "hostile_reply", schemaHash: "b".repeat(64), decision: "reject" },
    ],
  });
  await expect(page.getByText("Approved", { exact: true })).toBeVisible();
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
});
