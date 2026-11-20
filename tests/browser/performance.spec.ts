import { test, expect } from "@playwright/test";
import { providerIds } from "../../server/provider-catalog";

test("Activity waits for its own usage data after the catalog has loaded", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  let entered!: () => void;
  const pending = new Promise<void>((resolve) => (entered = resolve));
  await page.route("**/api/account/usage?*", async (route) => {
    entered();
    await gate;
    await route.fulfill({ response: await route.fetch() });
  });
  const policy = page.waitForResponse((response) =>
    response.url().endsWith("/api/account/routing"),
  );
  await page.goto("/#dashboard/tools");
  await policy;
  await expect(page.locator(".ws-tool-card")).not.toHaveCount(0);
  if (test.info().project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Activity", exact: true }).click();
  await pending;
  await expect(
    page.getByText("Loading account data…", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ws-metrics")).toHaveCount(0);
  await expect(page.getByText("0 timed calls", { exact: true })).toHaveCount(0);
  release();
  await expect(page.locator(".ws-metrics")).toBeVisible();
});

test("slow successful catalog requests finish without overlapping or discarding results", async ({
  page,
}) => {
  let requests = 0;
  await page.route("**/api/observations/catalog", async (route) => {
    requests++;
    await new Promise((r) => setTimeout(r, 6500));
    await route.continue();
  });
  await page.goto("/#dashboard/tools");
  await expect(
    page.getByRole("status").filter({ hasText: "Loading tools" }),
  ).toBeVisible();
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
    { timeout: 12000 },
  );
  expect(requests).toBe(1);
  await expect(
    page.getByRole("status").filter({ hasText: "Loading tools" }),
  ).toHaveCount(0);
});

test("catalog does not load usage or activity, and the sidebar requests only a funding summary", async ({
  page,
}) => {
  const paths: string[] = [];
  page.on("request", (req) => {
    if (new URL(req.url()).pathname.startsWith("/api/"))
      paths.push(new URL(req.url()).pathname + new URL(req.url()).search);
  });
  await page.goto("/#dashboard/tools");
  await expect(page.locator(".ws-tool-card")).toHaveCount(
    providerIds.length - 1,
  );
  await expect
    .poll(() => paths.includes("/api/account/funding?summary=true"))
    .toBe(true);
  expect(
    paths.some(
      (p) =>
        p.startsWith("/api/account/usage") ||
        p.startsWith("/api/account/activity"),
    ),
  ).toBe(false);
  expect(paths).not.toContain("/api/observations/connection");
  expect(paths).not.toContain("/api/account/funding");
});
