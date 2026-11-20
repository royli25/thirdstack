import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { providerCatalog, providerIds } from "../../server/provider-catalog";

// This fixture server configures every catalog provider with synthetic keys
// and answers each provider endpoint with a response shaped like its real API.
test.use({ baseURL: "http://127.0.0.1:3108", reducedMotion: "reduce" });

const phase1 = [
  { tool: "brave_search", query: "fixture brave" },
  { tool: "parallel_search", query: "fixture parallel" },
  { tool: "perplexity_search", query: "fixture perplexity" },
  { tool: "serper_search", query: "fixture serper" },
  { tool: "linkup_search", query: "fixture linkup" },
  { tool: "parallel_extract", url: "https://example.com/parallel" },
  { tool: "browserbase_extract", url: "https://example.com/browserbase" },
];

test("each Phase 1 tool runs end to end through the observation API", async ({
  request,
}) => {
  const created = await request.post("/api/observations", {
    data: {
      title: "Phase 1 provider fixture",
      objective: "Call every Phase 1 tool once against synthetic responses.",
      criteria: [{ text: "Each tool returns evidence", weight: 1 }],
      constraints: "Synthetic fixture responses only",
      budgetMicros: 60000,
      model: "Fixture agent, not a model",
      host: "Automated test",
    },
  });
  expect(created.status()).toBe(201);
  const session = await created.json();
  await request.post(`/api/observations/${session.id}/approve`, {
    data: { intentHash: session.intentHash },
  });
  for (const call of phase1) {
    const response = await request.post(
      `/api/observations/${session.id}/call`,
      {
        data: {
          ...call,
          requestKey: crypto.randomUUID(),
          statedReason: `Exercise ${call.tool} against its fixture.`,
        },
      },
    );
    expect(response.status(), call.tool).toBe(200);
    const receipt = await response.json();
    const provider = providerCatalog.find((p) => p.tool === call.tool)!.id;
    expect(receipt.provider, call.tool).toBe(provider);
    expect(receipt.status, call.tool).toBe("succeeded");
    const evidence = JSON.stringify(receipt.result);
    expect(evidence, call.tool).toContain("TEST FIXTURE");
    if (call.query) expect(receipt.result.sources, call.tool).toHaveLength(3);
  }
});

test("the tool catalog lists every provider as ready when keys are configured", async ({
  page,
}) => {
  await page.goto("/#dashboard/tools");
  const cards = page.locator(".ws-tool-card");
  await expect(cards).toHaveCount(providerIds.length - 1);
  for (const { id, label, tool } of providerCatalog) {
    const grouped = tool === "parallel_search" || tool === "parallel_extract";
    const expectedName = grouped
      ? "Parallel"
      : id === "browserbase"
        ? "Browserbase"
        : id === "perplexity"
          ? "Perplexity"
          : label;
    const card = cards.filter({
      has: page.getByRole("heading", {
        name: expectedName,
        exact: true,
      }),
    });
    await expect(card).toBeVisible();
    await expect(card.getByText("Available", { exact: true })).toBeVisible();
    if (!grouped)
      await expect(card.getByText(tool, { exact: true })).toBeVisible();
  }
  const parallel = cards.filter({
    has: page.getByRole("heading", { name: "Parallel", exact: true }),
  });
  await parallel.getByRole("button", { name: "View tool" }).click();
  const dialog = page.getByRole("dialog");
  for (const endpoint of ["parallel_search", "parallel_extract"]) {
    await expect(
      dialog.getByRole("button", { name: endpoint, exact: true }),
    ).toBeVisible();
  }
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByText("Not configured")).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
