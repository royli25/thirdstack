import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { captureJourney } from "./helpers/launch-screenshots";

const authOrigin = "https://login-states-fixture.supabase.co";
type Failure = { status: number; code: string; msg: string };
const accountUser = {
  id: "00000000-0000-4000-8000-000000000088",
  email: "sam@example.com",
  aud: "authenticated",
  role: "authenticated",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const testSession = () => ({
  access_token: `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: accountUser.id, session_id: "00000000-0000-4000-8000-000000000089", exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture-signature`,
  refresh_token: "fixture-refresh",
  token_type: "bearer",
  expires_in: 3600,
  user: accountUser,
});
async function fixture(page: Page) {
  const state = {
    failure: null as Failure | null,
    recoveries: 0,
    resends: 0,
    session: false,
    updates: 0,
  };
  await page.route(
    (url) => url.origin === "http://127.0.0.1:3101" && url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      headers["content-security-policy"] = headers[
        "content-security-policy"
      ].replace("connect-src 'self'", `connect-src 'self' ${authOrigin}`);
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
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/authorize")) {
      const target = new URL(
        new URL(route.request().url()).searchParams.get("redirect_to")!,
      );
      target.searchParams.set("error", "access_denied");
      return route.fulfill({
        status: 302,
        headers: { ...headers, location: target.href },
      });
    }
    if (state.failure)
      return route.fulfill({
        status: state.failure.status,
        json: { ...state.failure, error_code: state.failure.code },
        headers,
      });
    if (path.endsWith("/recover")) state.recoveries++;
    if (path.endsWith("/resend")) state.resends++;
    if (path.endsWith("/token") && state.session)
      return route.fulfill({ json: testSession(), headers });
    if (path.endsWith("/user")) {
      if (route.request().method() === "PUT") state.updates++;
      return route.fulfill({ json: accountUser, headers });
    }
    if (path.endsWith("/signup"))
      return route.fulfill({
        json: {
          user: {
            id: "00000000-0000-4000-8000-000000000088",
            email: "sam@example.com",
            identities: [],
          },
          session: null,
        },
        headers,
      });
    return route.fulfill({ json: {}, headers });
  });
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        user: accountUser,
        accountType: "user",
        hasPersonalAccount: true,
        isAdmin: false,
        companies: [],
      },
    }),
  );
  return state;
}

test("login options and email states match the design and validate without sending invalid credentials", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("heading", { name: "Continue to twohands", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await captureJourney(page, "login-options");
  const geometry = await page.locator(".auth-stack").boundingBox();
  if (test.info().project.name === "desktop") {
    expect(geometry!.width).toBe(392);
    expect(geometry!.x).toBeCloseTo(78.48, 0);
  }
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("Enter your password.")).toBeVisible();
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("private-fixture-password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await captureJourney(page, "login-email");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Back to sign-in options" }).click();
  await expect(
    page.getByRole("heading", { name: "Continue to twohands" }),
  ).toBeFocused();
});

test("incorrect credentials, confirmation and reset requests have distinct actionable states", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/#dashboard");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("private-fixture-password");
  state.failure = {
    status: 400,
    code: "invalid_credentials",
    msg: "Invalid login credentials",
  };
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "The email or password is incorrect.",
  );
  await captureJourney(page, "login-incorrect-credentials");
  state.failure = {
    status: 400,
    code: "email_not_confirmed",
    msg: "Email not confirmed",
  };
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Confirm your email" }),
  ).toBeVisible();
  state.failure = null;
  await page.getByRole("button", { name: "Resend confirmation email" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Confirmation email sent again.",
  );
  await expect(
    page.getByRole("button", { name: "Resend confirmation email" }),
  ).toBeDisabled();
  expect(state.resends).toBe(1);
  await page.getByRole("button", { name: "Use a different email" }).click();
  await page.getByRole("button", { name: "Forgot password?" }).click();
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "If an account exists for sam@example.com, you’ll receive a password reset link.",
    ),
  ).toBeVisible();
  expect(state.recoveries).toBe(1);
  await captureJourney(page, "login-reset-requested");
});

test("signup validates passwords and confirmation email resends are bounded", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/#dashboard");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page
    .getByLabel("Password", { exact: true })
    .fill("private-fixture-password");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your email" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resend confirmation email" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Confirmation email sent again.",
  );
  await expect(
    page.getByRole("button", { name: "Resend confirmation email" }),
  ).toBeDisabled();
  expect(state.resends).toBe(1);
  await captureJourney(page, "login-confirmation-resent");
});

test("expired confirmation/reset links and canceled Google sign-in preserve a path back", async ({
  page,
}) => {
  await fixture(page);
  await page.goto(
    "/?auth_callback=1&auth_flow=signup&error_code=otp_expired#signin",
  );
  await expect(
    page.getByRole("heading", { name: "Confirmation link expired" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send a new confirmation link" }),
  ).toBeVisible();
  await page.goto(
    "/?auth_callback=1&auth_flow=recovery&error_code=otp_expired#signin",
  );
  await expect(
    page.getByRole("heading", { name: "Reset link expired" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Request a new reset link" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset your password" }),
  ).toBeVisible();
  await page.goto("/#dashboard");
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(
    page.getByRole("heading", { name: "Google sign-in canceled" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in with email" }),
  ).toBeVisible();
});

test("rate limits and service errors remain recoverable without hiding account forms", async ({
  page,
}) => {
  const state = await fixture(page);
  await page.goto("/#dashboard");
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("private-fixture-password");
  state.failure = {
    status: 429,
    code: "over_request_rate_limit",
    msg: "Rate limited",
  };
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Too many attempts" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeDisabled();
  await page.getByRole("button", { name: "Back to sign-in options" }).click();
  state.failure = {
    status: 400,
    code: "unexpected_failure",
    msg: "Unavailable",
  };
  await page.getByRole("button", { name: "Continue with email" }).click();
  await page
    .getByLabel("Password", { exact: true })
    .fill("private-fixture-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Sign-in is temporarily unavailable" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in with email" }),
  ).toBeVisible();
});

test("a verified recovery callback updates the password and returns to email sign-in", async ({
  page,
}) => {
  const state = await fixture(page);
  state.session = true;
  await page.addInitScript(() =>
    localStorage.setItem(
      "sb-login-states-fixture-auth-token-code-verifier",
      JSON.stringify("fixture-verifier/recovery"),
    ),
  );
  await page.goto(
    "/?code=fixture-recovery-code&auth_callback=1&auth_flow=recovery#dashboard",
  );
  await expect(
    page.getByRole("heading", { name: "Choose a new password" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.getByLabel("New password", { exact: true }),
  ).toHaveAttribute("aria-invalid", "true");
  await page
    .getByLabel("New password", { exact: true })
    .fill("private-new-fixture-password");
  await page.getByRole("button", { name: "Update password" }).click();
  await expect(
    page.getByRole("heading", { name: "Password updated" }),
  ).toBeVisible();
  expect(state.updates).toBe(1);
  await captureJourney(page, "login-password-updated");
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in with email" }),
  ).toBeVisible();
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("");
});

test("Google errors and unavailable configuration expose the designed retry screens", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/?auth_flow=google&error=server_error#signin");
  await expect(
    page.getByRole("heading", { name: "Couldn’t connect to Google" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try Google again" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in with email" }),
  ).toBeVisible();
  await page.route("**/api/auth/config", (route) =>
    route.fulfill({ status: 503, json: { error: "Fixture unavailable" } }),
  );
  await page.goto("/#signin");
  await expect(
    page.getByRole("heading", { name: "Sign-in is temporarily unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Browse tools first" }),
  ).toBeVisible();
  await captureJourney(page, "login-service-unavailable");
});

test("a verified confirmation callback shows the confirmed state before opening the account", async ({
  page,
}) => {
  const state = await fixture(page);
  state.session = true;
  await page.addInitScript(() =>
    localStorage.setItem(
      "sb-login-states-fixture-auth-token-code-verifier",
      JSON.stringify("fixture-verifier"),
    ),
  );
  await page.goto(
    "/?code=fixture-confirmation-code&auth_callback=1&auth_flow=signup#dashboard",
  );
  await expect(
    page.getByRole("heading", { name: "Email confirmed", exact: true }),
  ).toBeVisible();
  await captureJourney(page, "login-email-confirmed");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Home", exact: true }),
  ).toBeVisible();
});

test("a disabled Google provider hides the Google option and offers email", async ({
  page,
}) => {
  await fixture(page);
  await page.route(authOrigin + "/auth/v1/settings", (route) =>
    route.fulfill({
      json: { external: { google: false } },
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
      },
    }),
  );
  await page.goto("/#dashboard");
  await expect(
    page.getByRole("button", { name: "Continue with email" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toHaveCount(0);
  // Signed-out visitors are sent to /login, keeping the page they asked for.
  await expect(page).toHaveURL(/127\.0\.0\.1:3101\/login#dashboard$/);
  await page.getByRole("button", { name: "Continue with email" }).click();
  await expect(
    page.getByRole("heading", { name: "Sign in with email" }),
  ).toBeVisible();
});
