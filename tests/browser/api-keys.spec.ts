import { test, expect, type Page } from "@playwright/test";
import { captureJourney } from "./helpers/launch-screenshots";
import AxeBuilder from "./helpers/accessibility";
const base = "http://127.0.0.1:3107";
const owner = "fixture-owner-token-0000000000001";
async function login(page: Page) {
  await page.goto(`${base}/#dashboard/keys`);
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
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("table", { name: "Your API keys", exact: true }),
  ).toBeVisible();
}
async function create(page: Page, name: string, limit = "0.008") {
  await page
    .getByRole("button", { name: "Create API key", exact: true })
    .click();
  await page.getByRole("textbox", { name: "API key name" }).fill(name);
  await page.getByRole("textbox", { name: "API key spend limit" }).fill(limit);
}
const auth = (secret: string) => ({ Authorization: `Bearer ${secret}` });
const intent = {
  title: "Scoped browser fixture",
  objective: "Find synthetic evidence",
  criteria: [{ text: "Sources", weight: 1 }],
};
test("create, use, limit, edit, and revoke a scoped key without revealing it again", async ({
  page,
  request,
}) => {
  await login(page);
  const name = `Codex ${test.info().project.name}`;
  await create(page, name);
  await page
    .getByRole("checkbox", { name: "exa_search", exact: true })
    .uncheck();
  await page
    .getByRole("checkbox", { name: "firecrawl_extract", exact: true })
    .uncheck();
  await page
    .getByRole("combobox", { name: "API key expiry" })
    .selectOption("7");
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  const field = page.getByLabel("New API key secret", { exact: true });
  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute("type", "password");
  await captureJourney(page, "local-key-secret-masked");
  const secret = await field.inputValue();
  await page
    .getByRole("button", { name: "Reveal API key", exact: true })
    .click();
  await expect(field).toHaveAttribute("type", "text");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(field).toHaveCount(0);
  const headers = auth(secret);
  const session = await (
    await request.post(`${base}/api/observations/agent-sessions`, {
      headers,
      data: intent,
    })
  ).json();
  const body = {
    tool: "tavily_search",
    query: "synthetic fixture",
    requestKey: "first",
    statedReason: "Find fixture evidence",
  };
  expect(
    (
      await request.post(`${base}/api/observations/${session.id}/call`, {
        headers,
        data: body,
      })
    ).status(),
  ).toBe(200);
  const other = await (
    await request.post(`${base}/api/observations/agent-sessions`, {
      headers,
      data: intent,
    })
  ).json();
  expect(
    (
      await request.post(`${base}/api/observations/${other.id}/call`, {
        headers,
        data: body,
      })
    ).status(),
  ).toBe(409);
  expect(
    (await request.get(`${base}/api/account/api-keys`, { headers })).status(),
  ).toBe(403);
  await page
    .getByRole("button", { name: `Manage ${name}`, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("At spend limit");
  await expect(field).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "API key spend limit" })
    .fill("0.016");
  await page
    .getByRole("button", { name: "Save key settings", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "API key settings updated",
  );
  expect(
    (
      await request.post(`${base}/api/observations/${other.id}/call`, {
        headers,
        data: body,
      })
    ).status(),
  ).toBe(200);
  await page.getByRole("button", { name: "Revoke key", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Already admitted provider calls",
  );
  await page
    .getByRole("button", { name: "Revoke this key", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("revoked");
  expect(
    (
      await request.get(`${base}/api/observations/catalog`, { headers })
    ).status(),
  ).toBe(401);
  await page.getByRole("textbox", { name: "Search API keys" }).fill(name);
  await page.getByRole("combobox", { name: "Key status" }).click();
  await page.getByRole("option", { name: "Revoked", exact: true }).click();
  const keys = page.getByRole("region", { name: "API keys", exact: true });
  await expect(keys.getByRole("columnheader")).toHaveText([
    "Name",
    "Spend",
    "Expires",
    "Last used",
    "Actions",
  ]);
  const view = keys.getByRole("button", { name: `View ${name}`, exact: true });
  await expect(view).toBeVisible();
  await view.click();
  await expect(page.getByRole("dialog")).toContainText("Revoked");
  await expect(
    page.getByRole("button", { name: "Save key settings" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("read-only preset permits discovery while denying writes, execution, and funding", async ({
  page,
  request,
}) => {
  await login(page);
  await create(page, `Read only ${test.info().project.name}`, "0");
  await page
    .getByRole("combobox", { name: "Permission preset" })
    .selectOption("read");
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  const secret = await page
    .getByLabel("New API key secret", { exact: true })
    .inputValue();
  const headers = auth(secret);
  expect(
    (
      await request.get(`${base}/api/observations/catalog`, { headers })
    ).status(),
  ).toBe(200);
  expect(
    (
      await request.post(`${base}/api/observations/agent-sessions`, {
        headers,
        data: intent,
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.get(`${base}/api/workspace/funding`, { headers })).status(),
  ).toBe(403);
  await page.getByRole("button", { name: "Done", exact: true }).click();
});

test("key issuance is disabled until the local owner credential is protected", async ({
  page,
}) => {
  await page.goto("/#dashboard/keys");
  await expect(
    page.getByRole("heading", { name: "API keys", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Loading API keys…")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Key creation is unavailable" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Protect this workspace with an owner access token/),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "View local setup" }).click();
  await expect(
    page.getByRole("dialog", { name: "Set up local API keys" }),
  ).toContainText("API_TOKEN");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View local setup" }),
  ).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("owner rejection clears the one-time secret and the key list", async ({
  page,
}) => {
  await page.clock.install();
  await login(page);
  await create(page, `Rejected owner ${test.info().project.name}`);
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  await expect(
    page.getByLabel("New API key secret", { exact: true }),
  ).toBeVisible();
  await page.route("**/api/account/api-keys", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({
        status: 401,
        json: { error: "Owner credential rejected." },
      });
    else await route.continue();
  });
  await page.clock.runFor(10100);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("New API key secret", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText(/Rejected owner (desktop|mobile)/)).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Owner credential rejected.", { exact: true }),
  ).toBeVisible();
});

test("late creation responses cannot restore a secret after owner access is rejected", async ({
  page,
}) => {
  await page.clock.install();
  await login(page);
  await create(page, `Late response ${test.info().project.name}`);
  let release!: () => void;
  let started!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const entered = new Promise<void>((r) => {
    started = r;
  });
  await page.route("**/api/account/api-keys", async (route) => {
    if (route.request().method() === "POST") {
      const response = await route.fetch();
      started();
      await gate;
      await route.fulfill({ response });
    } else
      await route.fulfill({
        status: 401,
        json: { error: "Owner access changed." },
      });
  });
  await page.getByRole("button", { name: "Create key", exact: true }).click();
  await entered;
  await page.clock.runFor(10100);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const finished = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/account/api-keys") &&
      r.request().method() === "POST",
  );
  release();
  await finished;
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByLabel("New API key secret", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create API key", exact: true }),
  ).toBeDisabled();
});
