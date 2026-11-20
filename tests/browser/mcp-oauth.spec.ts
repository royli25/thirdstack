import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { captureJourney } from "./helpers/launch-screenshots";
const authOrigin = "https://oauth-browser-fixture.supabase.co";
const userId = "00000000-0000-4000-8000-000000000095";
const clientId = "00000000-0000-4000-8000-000000000096";
const requestId = "fixture_authorization_request";
async function fixture(page: Page, signedIn = true) {
  const state = { decisions: [] as boolean[], revoked: false, failure: false };
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const user = {
    id: userId,
    email: "user@fixture.invalid",
    aud: "authenticated",
    role: "authenticated",
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const session = {
    access_token: `${encode({ alg: "HS256" })}.${encode({ sub: userId, session_id: clientId, exp: expires })}.fixture`,
    refresh_token: "fixture-refresh",
    expires_at: expires,
    expires_in: 3600,
    token_type: "bearer",
    user,
  };
  await page.addInitScript(
    ({ signedIn, session }) => {
      if (signedIn)
        localStorage.setItem(
          "sb-oauth-browser-fixture-auth-token",
          JSON.stringify(session),
        );
    },
    { signedIn, session },
  );
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({
      json: {
        enabled: true,
        url: authOrigin,
        publishableKey: "sb_publishable_fixture",
        oauth: { resource: "http://127.0.0.1:3101/mcp" },
      },
    }),
  );
  await page.route(authOrigin + "/auth/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (path.endsWith("settings"))
      return route.fulfill({
        json: { external: { email: true, google: false } },
        headers,
      });
    return route.fulfill({
      json: path.endsWith("/token") ? session : user,
      headers,
    });
  });
  // Permit only this synthetic Auth origin in the fixture response's CSP.
  await page.route(
    (url) =>
      url.origin === "http://127.0.0.1:3101" &&
      ["/", "/oauth/consent"].includes(url.pathname),
    async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      headers["content-security-policy"] = headers[
        "content-security-policy"
      ].replace("connect-src 'self'", `connect-src 'self' ${authOrigin}`);
      await route.fulfill({ response, headers });
    },
  );
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        user: { id: userId, email: user.email },
        accountType: "user",
        hasPersonalAccount: true,
        isAdmin: false,
        companies: [],
      },
    }),
  );
  await page.route("**/api/agent-auth/requests/*", (route) => {
    if (state.failure)
      return route.fulfill({
        status: 404,
        json: {
          error:
            "This connection request expired. Start again from your agent.",
        },
      });
    if (route.request().method() === "POST") {
      const allow = route.request().postDataJSON().allow;
      state.decisions.push(allow);
      return route.fulfill({
        json: {
          redirectUrl: `http://127.0.0.1:3101/fixture-oauth-callback?${allow ? "code=fixture-code" : "error=access_denied"}&state=fixture-state`,
        },
      });
    }
    return route.fulfill({
      json: {
        authorizationId: requestId,
        clientId,
        clientName: "Fixture coding agent",
        redirectUri: "http://127.0.0.1:3101/fixture-oauth-callback",
        resource: "http://127.0.0.1:3101/mcp",
        scopes: ["openid", "email"],
      },
    });
  });
  await page.route("**/fixture-oauth-callback?*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<main><h1>Fixture agent callback received</h1></main>",
    }),
  );
  await page.route("**/api/agent-auth/connections", (route) =>
    route.fulfill({
      json: {
        connections: [
          {
            clientId,
            clientName: "Fixture coding agent",
            grantedAt: "2026-11-16T12:00:00Z",
            revokedAt: state.revoked ? "2026-11-17T00:00:00Z" : null,
          },
        ],
      },
    }),
  );
  await page.route("**/api/agent-auth/connections/*/revoke", (route) => {
    state.revoked = true;
    return route.fulfill({ json: { revoked: true, authRevoked: true } });
  });
  return state;
}
test("consent clearly describes access and only authorizes after Allow", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto(`/oauth/consent?authorization_id=${requestId}`);
  await expect(
    page.getByRole("heading", {
      name: "Connect Fixture coding agent to Two Hands",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Signed in as user@fixture.invalid"),
  ).toBeVisible();
  await expect(page.getByText(/Calls may incur usage costs/)).toBeVisible();
  expect(state.decisions).toEqual([]);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await captureJourney(page, "mcp-oauth-consent");
  await page
    .getByRole("button", { name: "Allow connection", exact: true })
    .click();
  await expect(page).toHaveURL(
    /fixture-oauth-callback\?code=fixture-code&state=fixture-state$/,
  );
  expect(state.decisions).toEqual([true]);
});
test("Cancel returns access_denied without approving", async ({ page }) => {
  const state = await fixture(page);
  await page.goto(`/oauth/consent?authorization_id=${requestId}`);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(/error=access_denied&state=fixture-state$/);
  expect(state.decisions).toEqual([false]);
});
test("expired consent requests cannot be approved", async ({ page }) => {
  const state = await fixture(page);
  state.failure = true;
  await page.goto(`/oauth/consent?authorization_id=${requestId}`);
  await expect(page.getByRole("alert")).toContainText("expired");
  await expect(
    page.getByRole("button", { name: "Allow connection" }),
  ).toHaveCount(0);
  expect(state.decisions).toEqual([]);
});
test("agent sign-in preserves the pending authorization through login", async ({
  page,
}) => {
  const state = await fixture(page, false);
  await page.goto(`/oauth/consent?authorization_id=${requestId}`);
  await page
    .getByRole("button", { name: /Continue with email|Sign in with email/i })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("user@fixture.invalid");
  await page
    .getByLabel("Password", { exact: true })
    .fill("fixture-password-only");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Connect Fixture coding agent to Two Hands",
    }),
  ).toBeVisible();
  expect(state.decisions).toEqual([]);
});
test("connected agents can be disconnected without exposing API keys", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/#dashboard/connections");
  const connections = page.getByRole("region", { name: "Connected agents" });
  await expect(
    connections.getByText("Fixture coding agent", { exact: true }),
  ).toBeVisible();
  await connections
    .getByRole("button", { name: "Disconnect", exact: true })
    .click();
  await expect(connections.getByRole("status")).toHaveText(
    "Agent disconnected.",
  );
  expect(state.revoked).toBe(true);
});
