import type { LabCase } from "./provider-lab-types.js";
export const suiteVersion = "public-reference-v1";
export const suiteCases: LabCase[] = [
  {
    id: "search-exa",
    title: "Find search API documentation",
    kind: "search",
    input:
      "Exa search API contents text maxCharacters numResults auto search documentation",
    referenceUrl: "https://exa.ai/docs/reference/search",
    terms: [],
  },
  {
    id: "search-tavily",
    title: "Find search response controls",
    kind: "search",
    input:
      "Tavily search API include_raw_content include_usage search_depth basic documentation",
    referenceUrl:
      "https://docs.tavily.com/documentation/api-reference/endpoint/search",
    terms: [],
  },
  {
    id: "search-firecrawl",
    title: "Find page extraction documentation",
    kind: "search",
    input:
      "Firecrawl scrape API markdown onlyMainContent metadata statusCode documentation",
    referenceUrl: "https://docs.firecrawl.dev/api-reference/endpoint/scrape",
    terms: [],
  },
  {
    id: "search-rome",
    title: "Find a snowboard sizing source",
    kind: "search",
    input:
      "Rome Warden 2026 2027 snowboard 151 recommended rider weight boot size official size chart",
    referenceUrl:
      "https://romesnowboards.com/products/rome-warden-2627-mens-snowboard",
    terms: [],
  },
  {
    id: "search-capita",
    title: "Find a product specification source",
    kind: "search",
    input:
      "CAPiTA Outerspace Living 2027 snowboard 152 suggested weight boot size official",
    referenceUrl:
      "https://capitasnowboarding.com/products/capita-outerspace-living-mens-snowboard-2027",
    terms: [],
  },
  {
    id: "extract-example",
    title: "Read a simple public page",
    kind: "extract",
    input: "https://example.com",
    referenceUrl: "https://example.com",
    terms: ["example", "domain"],
  },
  {
    id: "extract-exa",
    title: "Read search API documentation",
    kind: "extract",
    input: "https://exa.ai/docs/reference/search",
    referenceUrl: "https://exa.ai/docs/reference/search",
    terms: ["query", "contents"],
  },
  {
    id: "extract-tavily",
    title: "Read search response controls",
    kind: "extract",
    input:
      "https://docs.tavily.com/documentation/api-reference/endpoint/search",
    referenceUrl:
      "https://docs.tavily.com/documentation/api-reference/endpoint/search",
    terms: ["search_depth", "include_raw_content"],
  },
  {
    id: "extract-firecrawl",
    title: "Read extraction documentation",
    kind: "extract",
    input: "https://docs.firecrawl.dev/api-reference/endpoint/scrape",
    referenceUrl: "https://docs.firecrawl.dev/api-reference/endpoint/scrape",
    terms: ["markdown", "url"],
  },
  {
    id: "extract-rome",
    title: "Read a product sizing chart",
    kind: "extract",
    input:
      "https://romesnowboards.com/products/rome-warden-2627-mens-snowboard",
    referenceUrl:
      "https://romesnowboards.com/products/rome-warden-2627-mens-snowboard",
    terms: ["151", "weight", "boot"],
  },
];
export const suiteMethodology =
  "Exa and Tavily receive the same five queries without domain restrictions. Execution order alternates by case and run. The search reference check asks whether the predefined page appears in the first three returned results. Firecrawl receives five fixed public URLs; its reference check requires a successful page status and the specified text markers in the captured text. These mechanical checks do not measure factual accuracy, end-to-end task success, or a general provider ranking. A missing reference can have a useful alternative; a matching reference can contain inadequate evidence. Five examples per provider are a diagnostic sample, not statistical proof. Provider settings differ and are recorded with every run.";
