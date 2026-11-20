import AxeBuilder from "./helpers/accessibility";
import { test, expect } from "@playwright/test";
test("saves explicit intent, persists it, inspects trace, and shows empty analytics without hiding sections", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/research/");
  await expect(
    page.getByRole("heading", { name: "Research, with a clear trail." }),
  ).toBeVisible();
  await expect(page.locator(".legacy-root")).toHaveCSS(
    "background-color",
    "rgb(248, 248, 248)",
  );
  await expect(page.locator(".legacy-root .sidebar")).toHaveCSS(
    "background-color",
    "rgb(243, 243, 243)",
  );
  await expect(page.getByRole("button", { name: "Save intent" })).toHaveCSS(
    "color",
    "rgb(255, 255, 255)",
  );
  await expect(page.getByText("0 providers configured")).toBeVisible();
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/workspace-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save intent" }).click();
  await expect(page.getByText("Your evidence trail starts here")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run live search", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("20", { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("Your evidence trail starts here")).toBeVisible();
  await page
    .getByRole("button", { name: "Routing inspector", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "The execution behind the answer." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /intent created/ }).click();
  await expect(page.getByText("RECORDED EVENT PAYLOAD")).toBeVisible();
  await page.screenshot({
    path: `test-results/inspector-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Provider intelligence" }).click();
  await expect(
    page.getByRole("heading", { name: "No usage yet" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/intelligence-${testInfo.project.name}.png`,
    fullPage: true,
  });
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflows).toBe(false);
  expect(errors).toEqual([]);
});
test("displays server-only key setup and memory-only access token", async ({
  page,
}) => {
  await page.goto("/research/");
  await page.getByRole("button", { name: "Manage connections" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("EXA_API_KEY", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Account access token")).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Close settings" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("settings dialog supports keyboard closing and restores focus", async ({
  page,
}) => {
  await page.goto("/research/");
  const opener = page.getByRole("button", { name: "Manage connections" });
  await opener.click();
  await expect(
    page.getByRole("button", { name: "Close settings" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Connect to Two Hands" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(opener).toBeFocused();
});
test("historical live recording replays without keys, paid calls, task creation or analytics contributions", async ({
  page,
  request,
}) => {
  const before = await (await request.get("/api/tasks")).json();
  const paidRequests: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && /\/api\/tasks/.test(r.url()))
      paidRequests.push(r.url());
  });
  await page.goto("/research/#inspector");
  await page
    .getByRole("combobox", { name: "Inspect research session" })
    .selectOption("recording:firecrawl-missing-page");
  await expect(
    page.getByText("Historical live recording · read only"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /provider response.*HTTP 200/ })
    .click();
  await expect(page.getByLabel("Recorded event JSON")).toContainText(
    '"pageStatus": 404',
  );
  await page.getByRole("button", { name: "Replay trace", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause replay" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show full trace" }).click();
  await expect(
    page.getByRole("button", {
      name: /extraction received.*unusable evidence/,
    }),
  ).toBeVisible();
  expect(paidRequests).toEqual([]);
  const after = await (await request.get("/api/tasks")).json();
  expect(after.length).toBe(before.length);
  expect((await (await request.get("/api/analytics")).json()).cohortSize).toBe(
    0,
  );
});
