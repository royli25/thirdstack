import { test, expect } from "@playwright/test";
import AxeBuilder from "./helpers/accessibility";
import { providerToolNames } from "../../server/provider-catalog";
test.use({ baseURL: "http://127.0.0.1:3102", reducedMotion: "reduce" });
const proposal = {
  title: "QA observation fixture",
  objective: "Return a concise description of the example page with a source.",
  criteria: [
    { text: "Names the page", weight: 1 },
    { text: "Includes a source", weight: 1 },
  ],
  constraints: "Use the known page only",
  budgetMicros: 26000,
  model: "Fixture agent, not a model",
  host: "Automated test",
};
async function makeSession(request: any, approved = true) {
  const r = await request.post("/api/observations", { data: proposal });
  expect(r.status()).toBe(201);
  const s = await r.json();
  if (approved)
    await request.post(`/api/observations/${s.id}/approve`, {
      data: { intentHash: s.intentHash },
    });
  return s;
}
async function output(
  request: any,
  s: any,
  text = "The fixture page is Example Domain. Source: https://example.com",
) {
  const r = await request.post(`/api/observations/${s.id}/call`, {
    data: {
      tool: "firecrawl_extract",
      url: "https://example.com",
      requestKey: crypto.randomUUID(),
      statedReason: "Read the known source directly.",
    },
  });
  expect(r.status()).toBe(200);
  const c = await r.json();
  const out = await request.post(`/api/observations/${s.id}/outcome`, {
    data: { requestKey: crypto.randomUUID(), text, evidenceCallIds: [c.id] },
  });
  expect(out.status()).toBe(200);
  return c;
}
async function nav(page: any, name: string) {
  const toggle = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole("navigation", { name: /navigation/ })
    .getByRole("link", { name: new RegExp(`^${name}(?: \\d+)?$`) })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("backend-authorized sessions show evidence without a consumer approval step", async ({
  page,
  request,
}) => {
  const { budgetMicros: _budget, ...intent } = proposal;
  const response = await request.post("/api/observations/agent-sessions", {
    data: intent,
  });
  expect(response.status()).toBe(201);
  const s = await response.json();
  expect(s.authorizationSource).toBe("backend_policy");
  await output(request, s);
  await page.goto(`/#sessions/${s.id}`);
  await expect(
    page.getByRole("heading", { name: proposal.title, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept intent & budget" }),
  ).toHaveCount(0);
  await expect(page.getByText(/Backend authorized/)).toBeVisible();
  await page.goto(`/#sessions/${s.id}/trace`);
  await expect(
    page.getByText("Backend authorization", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Session authorized automatically under backend spending policy.",
    ),
  ).toBeVisible();
});

test("records and approves intent, receives an output, evaluates it, and opens a case", async ({
  page,
  request,
}) => {
  await page.goto("/#sessions");
  await page
    .getByRole("button", { name: "Record intent", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Session name", { exact: true })
    .fill("QA browser intent lifecycle");
  await page
    .getByLabel("What should the model deliver?", { exact: true })
    .fill(proposal.objective);
  await page
    .getByLabel("Success criteria", { exact: true })
    .fill("Names the page\nIncludes a source");
  await page.getByLabel("Tool budget (USD)", { exact: true }).fill("0.026");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Record intent", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "QA browser intent lifecycle" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Accept intent & budget" }),
  ).toBeVisible();
  const id = new URL(page.url()).hash.split("/").at(-1)!;
  const pending = await request.post(`/api/observations/${id}/call`, {
    data: {
      tool: "exa_search",
      query: "should not run",
      statedReason: "Check the accepted intent boundary.",
      requestKey: "blocked",
    },
  });
  expect(pending.status()).toBe(409);
  await page.getByRole("button", { name: "Accept intent & budget" }).click();
  await expect(
    page.getByRole("button", { name: "Accept intent & budget" }),
  ).toHaveCount(0);
  const s = await (await request.get(`/api/observations/${id}`)).json();
  const c = await output(request, s);
  await page.reload();
  await page
    .getByRole("tab", { name: "Output & evaluation", exact: true })
    .click();
  await expect(
    page.getByText(
      "The fixture page is Example Domain. Source: https://example.com",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Verdict for Names the page" })
    .click();
  await page.getByRole("option", { name: "Pass", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Review note for Names the page" })
    .fill("The output identifies the page by its title.");
  await page
    .getByRole("textbox", { name: "Review note for Includes a source" })
    .fill("I have not checked whether this source supports all claims.");
  await page
    .getByRole("button", { name: "Save evaluation", exact: true })
    .click();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await expect(page.getByText("50%", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Open review case", exact: true })
    .click();
  await page
    .getByLabel("What fell short?", { exact: true })
    .fill("The supporting citation still needs independent verification.");
  await page.getByRole("button", { name: "Open case", exact: true }).click();
  await expect(
    page.getByText(
      "The supporting citation still needs independent verification.",
      { exact: true },
    ),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Case resolution" })
    .fill("The missing verification will be provided in a revised output.");
  await page
    .getByRole("button", { name: "Record resolution", exact: true })
    .click();
  await expect(page.getByText("Resolved", { exact: true })).toBeVisible();
  const final = await (await request.get(`/api/observations/${id}`)).json();
  expect(final.intentHash).toBe(s.intentHash);
  expect(final.evaluations[0]).toMatchObject({ score: 100, coverage: 50 });
  expect(final.cases[0].status).toBe("resolved");
  expect(final.calls[0].id).toBe(c.id);
  expect(final.integrity).toBe(true);
  const a11y = await new AxeBuilder({ page }).analyze();
  expect(a11y.violations).toEqual([]);
});

test("shows actual tool choices separately from stated explanations and keeps raw evidence accessible", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  await request.post(`/api/observations/${s.id}/discover`, {
    data: { need: "Read a public page" },
  });
  await output(request, s);
  await page.goto(`/#sessions/${s.id}`);
  await page.getByRole("tab", { name: /Tool trace/ }).click();
  await expect(
    page.getByText("Agent’s stated reason", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tool options returned/ }).click();
  await expect(
    page.getByText(
      /does not establish answer quality or prove the agent considered every option/,
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tool result received/ }).click();
  await expect(page.getByText("API HTTP 200", { exact: true })).toBeVisible();
  await expect(page.getByText("Page HTTP 200", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Recorded data", exact: true })
    .last()
    .click();
  await expect(
    page.getByLabel("Tool result received record", { exact: true }),
  ).toContainText('"tool": "firecrawl_extract"');
  const a11y = await new AxeBuilder({ page }).analyze();
  expect(a11y.violations).toEqual([]);
});

test("model comparison withholds unsupported scores and navigation works on mobile", async ({
  page,
  request,
}) => {
  await makeSession(request);
  await page.goto("/#sessions");
  await nav(page, "Model evaluations");
  await expect(
    page.getByRole("heading", { name: "Model evaluations", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Not enough reviews", { exact: true }).first(),
  ).toBeVisible();
  await nav(page, "Tool activity");
  await expect(page.getByText("exa_search", { exact: true })).toBeVisible();
  await nav(page, "Review cases");
  await expect(
    page.getByRole("heading", { name: "Review cases", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Tool activity", exact: true }),
  ).toBeVisible();
  const a11y = await new AxeBuilder({ page }).analyze();
  expect(a11y.violations).toEqual([]);
});

test("new output versions require a fresh review and preserve the old evaluation", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  await output(request, s);
  let full = await (await request.get(`/api/observations/${s.id}`)).json();
  await request.post(`/api/observations/${s.id}/evaluate`, {
    data: {
      outcomeId: full.outcomes[0].id,
      criteria: full.criteria.map((c: any) => ({
        criterionId: c.id,
        verdict: "pass",
        note: "Fixture evidence reviewed.",
        evidenceCallIds: [],
      })),
    },
  });
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: {
      requestKey: "revised",
      text: "A revised answer that needs its own review.",
      evidenceCallIds: [],
    },
  });
  await page.goto(`/#sessions/${s.id}`);
  await expect(page.getByText("Needs review", { exact: true })).toBeVisible();
  await page
    .getByRole("tab", { name: "Output & evaluation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Save evaluation", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Version 1/ }).click();
  await expect(page.getByText("100%", { exact: true }).first()).toBeVisible();
  full = await (await request.get(`/api/observations/${s.id}`)).json();
  expect(full.outcomes).toHaveLength(2);
  expect(full.evaluations).toHaveLength(1);
});

test("sharing is enabled by account policy, summary export omits content, and deletion removes the record", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  await output(request, s, "PRIVATE_OUTPUT_FOR_EXPORT_TEST");
  await page.goto(`/#sessions/${s.id}`);
  await page
    .getByRole("tab", { name: "Record & controls", exact: true })
    .click();
  await expect(
    page.getByText("Included by account policy", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Include in commercial aggregates" }),
  ).toHaveCount(0);
  expect(
    (await (await request.get(`/api/observations/${s.id}`)).json())
      .commercialConsent,
  ).toBe(true);
  const exported = await (
    await request.get(`/api/observations/${s.id}/export`)
  ).json();
  expect(JSON.stringify(exported)).not.toContain(
    "PRIVATE_OUTPUT_FOR_EXPORT_TEST",
  );
  expect(exported.includesResearchContent).toBe(false);
  await page
    .getByRole("button", { name: "Delete session", exact: true })
    .click();
  await page.getByLabel(s.title, { exact: true }).fill(s.title);
  await page
    .getByRole("button", { name: "Delete permanently", exact: true })
    .click();
  await expect(page).toHaveURL(/#sessions$/);
  expect((await request.get(`/api/observations/${s.id}`)).status()).toBe(404);
});

test("connection page and create-intent dialog use the accessible light Geist theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/#settings");
  await expect(
    page.getByRole("heading", { name: "Connections & settings", exact: true }),
  ).toBeVisible();
  expect(
    await page.locator("body").evaluate((e) => getComputedStyle(e).fontFamily),
  ).toContain("Geist");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(248, 248, 248)",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/#sessions");
  await page
    .getByRole("button", { name: "Record intent", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("a stale session response cannot replace the next selected session", async ({
  page,
  request,
}) => {
  const a = await makeSession(request);
  const b = await makeSession(request);
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(`**/api/observations/${a.id}`, async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto(`/#sessions/${a.id}`);
  await expect(page.getByRole("status")).toContainText("Loading session");
  await page.goto(`/#sessions/${b.id}`);
  await expect(
    page.getByRole("heading", { name: proposal.title, exact: true }),
  ).toBeVisible();
  release();
  await expect(page).toHaveURL(new RegExp(b.id));
  await page
    .getByRole("tab", { name: "Record & controls", exact: true })
    .click();
  await expect(page.getByText(b.id, { exact: true })).toBeVisible();
});

test("workspace authentication clears old data and recovers without navigation", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const token = "OBSERVATION_TEST_TOKEN";
  await page.route("**/api/**", async (route) => {
    if (new URL(route.request().url()).pathname === "/api/auth/config") {
      await route.continue();
      return;
    }
    if (route.request().headers().authorization === `Bearer ${token}`)
      await route.continue();
    else
      await route.fulfill({
        status: 401,
        json: { error: "Enter the server access token to connect." },
      });
  });
  await page.goto(`/#sessions/${s.id}`);
  await page
    .getByRole("button", { name: "Enter access token", exact: true })
    .click();
  await page.getByLabel("Access token", { exact: true }).fill(token);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: proposal.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await nav(page, "Sessions");
  await page.goto("/#settings");
  await page
    .getByRole("button", { name: "Account access token", exact: true })
    .click();
  await page.getByLabel("Access token", { exact: true }).fill("incorrect");
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Enter the server access token",
  );
  await page.keyboard.press("Escape");
  await page.goto("/#sessions");
  await expect(
    page.getByRole("link", { name: new RegExp(proposal.title) }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Enter access token", exact: true })
    .click();
  await page.getByLabel("Access token", { exact: true }).fill(token);
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await expect(
    page.getByRole("link", { name: new RegExp(proposal.title) }).first(),
  ).toBeVisible();
});

test("mobile navigation supports Escape and restores focus", async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, "Mobile drawer only");
  await page.goto("/#sessions");
  const toggle = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await toggle.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(toggle).toBeFocused();
});

test("renders outcome Markdown without executing HTML, unsafe links, or remote images", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const text =
    "# Evidence summary\n\n**Supported** by [Example Domain](https://example.com).\n\n[Unsafe](javascript:alert(1))\n\n![Tracking image](https://tracking.invalid/beacon)\n\n<script>window.__outcomeExecuted=true</script>\n\n| Criterion | Result |\n| --- | --- |\n| Evidence | Available |";
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: { requestKey: "safe-markdown", text, evidenceCallIds: [] },
  });
  const external: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("tracking.invalid")) external.push(r.url());
  });
  await page.goto(`/#sessions/${s.id}`);
  await page
    .getByRole("tab", { name: "Output & evaluation", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evidence summary", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Example Domain", exact: true }),
  ).toHaveAttribute("rel", "noopener noreferrer");
  await expect(
    page.getByRole("link", { name: "Unsafe", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator(".rendered-output img,.rendered-output script"),
  ).toHaveCount(0);
  expect(external).toEqual([]);
  await expect(
    page.getByRole("cell", { name: "Available", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("keeps original output readable when the optional document renderer cannot load", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const text = "# Original answer\n\nThe accepted output remains readable.";
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: { requestKey: "document-fallback", text, evidenceCallIds: [] },
  });
  await page.route("**/assets/OutcomeContent-*.js", (route) => route.abort());
  await page.goto(`/#sessions/${s.id}/output`);
  await expect(page.getByRole("status")).toHaveText(
    "Formatted view is unavailable. Showing the original text.",
  );
  await expect(page.locator(".output-text")).toHaveText(text);
  await expect(
    page.getByRole("heading", { name: "Evaluate against intent", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Tool trace/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Tool decisions & execution",
      exact: true,
    }),
  ).toBeVisible();
});

test("reviews a prior output explicitly and links a case to that historical evaluation", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  for (const [requestKey, text] of [
    ["first", "An earlier incomplete answer."],
    ["second", "A revised answer awaiting its own review."],
  ])
    await request.post(`/api/observations/${s.id}/outcome`, {
      data: { requestKey, text, evidenceCallIds: [] },
    });
  await page.goto(`/#sessions/${s.id}`);
  await page
    .getByRole("tab", { name: "Output & evaluation", exact: true })
    .click();
  await page.getByRole("button", { name: /Version 1/ }).click();
  const historical = page.getByRole("region", {
    name: "Review output version 1",
    exact: true,
  });
  for (const criterion of ["Names the page", "Includes a source"]) {
    await historical
      .getByRole("combobox", { name: `Verdict for ${criterion}` })
      .click();
    await page.getByRole("option", { name: "Fail", exact: true }).click();
    await historical
      .getByRole("textbox", { name: `Review note for ${criterion}` })
      .fill("The original answer omitted this required information.");
  }
  await historical
    .getByRole("combobox", { name: "Review source", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Assistant review", exact: true })
    .click();
  await historical
    .getByRole("button", { name: "Save evaluation", exact: true })
    .click();
  await expect(page.getByText("Needs review", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Open review case", exact: true })
    .click();
  await page
    .getByLabel("What fell short?", { exact: true })
    .fill("The original answer failed the accepted criteria before revision.");
  await page.getByRole("button", { name: "Open case", exact: true }).click();
  const full = await (await request.get(`/api/observations/${s.id}`)).json();
  expect(full.evaluations[0]).toMatchObject({
    outcomeId: full.outcomes[0].id,
    historical: true,
    reviewer: { kind: "assistant_reported" },
    score: 0,
  });
  expect(full.cases[0].evaluationId).toBe(full.evaluations[0].id);
  expect(
    full.evaluations.some((e: any) => e.outcomeId === full.outcomes[1].id),
  ).toBe(false);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("opens saved evidence without another provider call and retains the active tab on reload", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const call = await output(request, s);
  await page.goto(`/#sessions/${s.id}/output`);
  await expect(
    page.getByRole("tab", { name: "Output & evaluation", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", {
      name: new RegExp(
        `View evidence from example.com · ${call.id.slice(0, 8)}`,
      ),
    })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Recorded evidence" }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Page HTTP 200", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("button", { name: "Full recorded receipt", exact: true })
    .click();
  await expect(
    dialog.getByLabel("Full evidence receipt", { exact: true }),
  ).toContainText(call.id);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Output & evaluation", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  const state = await (await request.get(`/api/observations/${s.id}`)).json();
  expect(state.calls).toHaveLength(1);
  expect(state.spentMicros).toBe(1000);
});

test("saved reviews are readable and can be revised without deleting earlier judgments", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  await output(request, s);
  let state = await (await request.get(`/api/observations/${s.id}`)).json();
  await request.post(`/api/observations/${s.id}/evaluate`, {
    data: {
      outcomeId: state.outcomes[0].id,
      reviewer: { kind: "human_reported" },
      criteria: s.criteria.map((c: any) => ({
        criterionId: c.id,
        verdict: "unknown",
        note: "This criterion still needs verification.",
        evidenceCallIds: [],
      })),
    },
  });
  await page.goto(`/#sessions/${s.id}/output`);
  await expect(
    page.getByRole("button", { name: "Revise evaluation", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Review note/ })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Revise evaluation", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Verdict for Names the page", exact: true })
    .click();
  await page.getByRole("option", { name: "Pass", exact: true }).click();
  await page
    .getByRole("textbox", {
      name: "Review note for Names the page",
      exact: true,
    })
    .fill("The title is now checked against the saved evidence.");
  await page
    .getByRole("button", { name: "Save revised evaluation", exact: true })
    .click();
  await expect(
    page.getByText("The title is now checked against the saved evidence.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox", { name: /Review note/ })).toHaveCount(
    0,
  );
  state = await (await request.get(`/api/observations/${s.id}`)).json();
  expect(state.evaluations).toHaveLength(2);
  expect(state.evaluations[0].score).toBeNull();
  expect(state.evaluations[1]).toMatchObject({ score: 100, coverage: 50 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("makes partial extraction limits visible while retaining all captured text", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const response = await request.post(`/api/observations/${s.id}/call`, {
    data: {
      tool: "firecrawl_extract",
      url: "https://example.com/long",
      requestKey: "long-page",
      statedReason: "Inspect the long source page.",
    },
  });
  expect(response.status()).toBe(200);
  const c = await response.json();
  expect(c.result.truncated).toBe(true);
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: {
      requestKey: "partial-output",
      text: "Only part of the page was captured.",
      evidenceCallIds: [c.id],
    },
  });
  await page.goto(`/#sessions/${s.id}/output`);
  await page
    .getByRole("button", {
      name: new RegExp(`View evidence from example.com · ${c.id.slice(0, 8)}`),
    })
    .click();
  await expect(page.getByText(/Partial extraction: 20,000 of/)).toBeVisible();
  const captured = page.getByRole("region", {
    name: "Captured source content",
    exact: true,
  });
  await expect(captured).toBeVisible();
  expect((await captured.textContent())!.length).toBeGreaterThan(19000);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("long code blocks and wide Markdown tables remain keyboard accessible", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const cells = Array.from({ length: 8 }, (_, i) => `Column ${i + 1}`);
  const text =
    "```text\n" +
    "very_long_literal_".repeat(100) +
    "\n```\n\n| " +
    cells.join(" | ") +
    " |\n| " +
    cells.map(() => "---").join(" | ") +
    " |\n| " +
    cells.map(() => "A long source detail").join(" | ") +
    " |";
  await request.post(`/api/observations/${s.id}/outcome`, {
    data: { requestKey: "wide-output", text, evidenceCallIds: [] },
  });
  await page.goto(`/#sessions/${s.id}/output`);
  const table = page.getByRole("region", {
    name: "Scrollable data table",
    exact: true,
  });
  await expect(table).toBeVisible();
  await expect(table).toHaveAttribute("tabindex", "0");
  await expect(page.locator(".rendered-output pre")).toHaveAttribute(
    "tabindex",
    "0",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("an older response cannot erase a newer output after leaving and reopening the same session", async ({
  page,
  request,
}) => {
  const a = await makeSession(request),
    b = await makeSession(request);
  let release!: () => void, finished!: () => void;
  let reads = 0;
  const gate = new Promise<void>((r) => (release = r)),
    returned = new Promise<void>((r) => (finished = r));
  await page.route(`**/api/observations/${a.id}`, async (route) => {
    if (++reads > 1) {
      await route.continue();
      return;
    }
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
    finished();
  });
  await page.goto(`/#sessions/${a.id}`);
  await expect(page.getByRole("status")).toContainText("Loading session");
  await page.goto(`/#sessions/${b.id}`);
  await expect(
    page.getByRole("heading", { name: proposal.title, exact: true }),
  ).toBeVisible();
  await request.post(`/api/observations/${a.id}/outcome`, {
    data: {
      requestKey: "newer-answer",
      text: "The newer output must remain visible.",
      evidenceCallIds: [],
    },
  });
  await page.goto(`/#sessions/${a.id}/output`);
  await expect(
    page.getByText("The newer output must remain visible.", { exact: true }),
  ).toBeVisible();
  release();
  await returned;
  await page.evaluate(async () => {
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  });
  await expect(
    page.getByText("The newer output must remain visible.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Waiting for the delivered output", { exact: true }),
  ).toHaveCount(0);
});

test("shows request-specific quotes and provider-reported cost in the trace", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  const offer = await request.post(`/api/observations/${s.id}/discover`, {
    data: {
      need: "Fixture cost comparison",
      requests: [
        {
          tool: "tavily_search",
          query: "fixture cost query",
          maxResults: 5,
          searchDepth: "advanced",
        },
      ],
    },
  });
  expect(offer.status()).toBe(200);
  const call = await request.post(`/api/observations/${s.id}/call`, {
    data: {
      tool: "exa_search",
      query: "fixture reported cost",
      statedReason: "Find the requested source text.",
      requestKey: crypto.randomUUID(),
    },
  });
  expect(call.status()).toBe(200);
  await page.goto(`/#sessions/${s.id}/trace`);
  await page.getByRole("button", { name: /Tool options returned/ }).click();
  await expect(
    page.getByText("$0.016 estimated for this request", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: /^tavily search/ }).click();
  await expect(
    page.getByText("$0.016 estimated for this request", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/advanced search, up to 5 results; 2 credits/),
  ).toBeVisible();
  await expect(
    page.getByText("Within remaining budget", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/succeeded.*\$0.015 provider-reported cost/),
  ).toBeVisible();
  await page.getByRole("button", { name: /Tool result received/ }).click();
  await expect(
    page.getByText(/\$0.015 provider-reported cost\. Provider-reported usage/),
  ).toBeVisible();
  await page.goto(`/#sessions/${s.id}`);
  await expect(
    page.getByText("exa: $0.015 · 1 of 1 completed calls reported usage", {
      exact: true,
    }),
  ).toBeVisible();
});

test("provider options start collapsed, show logos and prices, and expand independently by keyboard", async ({
  page,
  request,
}) => {
  const s = await makeSession(request);
  await request.post(`/api/observations/${s.id}/discover`, {
    data: {
      need: "Compare fixture searches",
      operations: [
        { operation: "search", query: "fixture one", maxResults: 5 },
        { operation: "search", query: "fixture two", maxResults: 12 },
        { operation: "search", query: "fixture three", maxResults: 8 },
      ],
    },
  });
  await page.goto(`/#sessions/${s.id}/trace`);
  await page.getByRole("button", { name: /Tool options returned/ }).click();
  const cards = page.locator(".provider-option");
  await expect(cards).toHaveCount(providerToolNames.length);
  for (const name of [
    "exa search",
    "tavily search",
    "firecrawl extract",
    "jina extract",
  ]) {
    await expect(
      page.getByRole("button", { name: new RegExp(`^${name}`) }),
    ).toHaveAttribute("aria-expanded", "false");
  }
  expect(
    await cards
      .locator("img")
      .evaluateAll((images) =>
        images.every(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  await expect(cards.nth(0).locator(".provider-option-price")).toContainText(
    "3 quotes",
  );
  await expect(cards.nth(2).locator(".provider-option-price")).toContainText(
    "default",
  );
  await expect(
    page.getByText("fixture one", { exact: true }),
  ).not.toBeVisible();
  const exa = page.getByRole("button", {
    name: /^exa search/,
  });
  await exa.focus();
  await page.keyboard.press("Enter");
  await expect(exa).toHaveAttribute("aria-expanded", "true");
  await expect(
    cards.nth(0).getByText("fixture one", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^tavily search/ }),
  ).toHaveAttribute("aria-expanded", "false");
  await page.keyboard.press("Enter");
  await expect(exa).toHaveAttribute("aria-expanded", "false");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
