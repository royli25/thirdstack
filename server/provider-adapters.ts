import { z } from "zod";
import { config, providerEstimate } from "./config.js";
import { capabilityData } from "./provider-capability-data.js";
import {
  AdapterRegistry,
  adapterInput,
  type AdapterDefinition,
  type AdapterQuote,
  type AdapterRequest,
} from "./provider-registry.js";
import type { ToolName } from "./observation-types.js";
import type { ProviderId } from "./types.js";
import { providerTools } from "./provider-identifiers.js";
import {
  providerEntry,
  type ExtractProviderId,
  type SearchProviderId,
} from "./provider-catalog.js";

/** Credential lookup driven by the catalog's environment variable names. */
function catalogCredential(provider: ProviderId) {
  const entry = providerEntry(provider)!;
  return {
    reference: entry.credentialEnv,
    resolve: () => config.keys[provider],
    accountReference: () => process.env[entry.accountReferenceEnv],
  };
}

const nonnegative = z.number().finite().nonnegative();
const status = z.number().int().min(100).max(599);
const usage = z.object({
  providerReportedUsd: nonnegative.optional(),
  credits: nonnegative.optional(),
  source: z.string(),
});
const searchResult = (provider: ProviderId) =>
  z.object({
    sources: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        url: z.string().url(),
        snippet: z.string(),
        publishedAt: z.string().optional(),
        provider: z.literal(provider),
        callId: z.string().nullable(),
      }),
    ),
    httpStatus: status,
    requestId: z.string().optional(),
    usage: usage.optional(),
  });
const extractResult = z.object({
  text: z.string().max(20000),
  httpStatus: status,
  truncated: z.boolean().optional(),
  originalCharacters: nonnegative.optional(),
  returnedCharacters: nonnegative.optional(),
  credits: nonnegative.optional(),
  pageStatus: status.optional(),
  title: z.string().optional(),
  requestId: z.string().optional(),
});
const basis =
  "Request parameters × configured rates. Account discounts and free credits are unknown; this is not an invoice.";
type PricingDetail = Pick<
  AdapterQuote,
  "breakdown" | "units" | "unit" | "uncertainty"
> & {
  /** Multiplier applied to the configured base estimate. */
  multiplier: number;
  additionalMicros?: number;
  rates?: Partial<AdapterQuote["rates"]>;
  pricingCheckedAt: string;
};
/** Provider-specific pricing; every catalog provider must define one. */
const pricing: Record<
  ProviderId,
  (request: AdapterRequest, base: number) => PricingDetail
> = {
  exa: (request) => {
    const maxResults = request.maxResults ?? 10;
    const extra = Math.max(0, maxResults - 10);
    return {
      multiplier: 1,
      additionalMicros: extra * config.exaAdditionalResultMicros,
      rates: { additionalResultMicros: config.exaAdditionalResultMicros },
      breakdown: `Auto search, up to ${maxResults} results with page text; base includes 10 results${extra ? ` + ${extra} additional results` : ""}`,
      units: null,
      unit: "request plus additional results",
      uncertainty: "Account-specific billing may differ.",
      pricingCheckedAt: "2026-11-02",
    };
  },
  tavily: (request) => {
    const depth = request.searchDepth ?? "basic";
    const units = depth === "advanced" ? 2 : 1;
    return {
      multiplier: units,
      breakdown: `${depth} search, up to ${request.maxResults ?? 10} results; ${units} credit${units === 1 ? "" : "s"}`,
      units,
      unit: "credits",
      uncertainty: "Account-specific billing may differ.",
      pricingCheckedAt: "2026-11-02",
    };
  },
  firecrawl: () => ({
    multiplier: 1,
    breakdown:
      "One page as Markdown; 1 base scrape credit. PDF parsing can add credits; page count is unknown before retrieval.",
    units: 1,
    unit: "credits",
    uncertainty: "Base page estimate; document parsing can increase usage.",
    pricingCheckedAt: "2026-11-02",
  }),
  jina: () => ({
    multiplier: 1,
    breakdown:
      "One page as Markdown; billed by output tokens, which are unknown before retrieval. Estimate assumes a page near the 20,000-character capture limit.",
    units: null,
    unit: "output tokens",
    uncertainty:
      "Per-token rate not yet confirmed from Jina's pricing page; long pages and PDFs cost more.",
    pricingCheckedAt: "2026-11-12",
  }),
  brave: perRequest(
    (r) =>
      `Web search, up to ${r.maxResults ?? 10} results with extra snippets`,
    "Published rate from third-party trackers, about $5 per 1,000 requests; confirm on Brave's pricing page.",
  ),
  parallel: perRequest(
    (r) =>
      `Basic-mode search, up to ${r.maxResults ?? 10} results with excerpts`,
    "Published as $5 per 1,000 requests for basic mode; confirm on Parallel's pricing page.",
  ),
  perplexity: perRequest(
    (r) => `Web search, up to ${r.maxResults ?? 10} results with page excerpts`,
    "Perplexity lists $5 per 1,000 Search API requests; successful requests with no results are still billed.",
  ),
  serper: perRequest(
    (r) => `Google search, up to ${r.maxResults ?? 10} organic results`,
    "Prepaid credits cost about $0.30 to $1 per 1,000 depending on pack size; larger result counts may use more credits.",
  ),
  linkup: perRequest(
    (r) => `Standard-depth search, up to ${r.maxResults ?? 10} results`,
    "Linkup lists standard search at about €5 per 1,000 requests; currency conversion is approximate.",
  ),
  parallel_extract: perRequest(
    () => "One page, full content as Markdown",
    "Published as $1 per 1,000 URLs; confirm on Parallel's pricing page.",
  ),
  browserbase: perRequest(
    () => "One page fetched as Markdown",
    "Browserbase lists $4 per 1,000 Markdown fetches on top of plan fees; free plan quotas may apply first.",
  ),
};
/** A flat per-request price with no request-dependent units. */
function perRequest(
  breakdown: (request: AdapterRequest) => string,
  uncertainty: string,
): (request: AdapterRequest) => PricingDetail {
  return (request) => ({
    multiplier: 1,
    breakdown: breakdown(request),
    units: 1,
    unit: "request",
    uncertainty,
    pricingCheckedAt: "2026-11-12",
  });
}
function quote(provider: ProviderId, request: AdapterRequest): AdapterQuote {
  const base = providerEstimate(provider);
  const detail = pricing[provider](request, base);
  return {
    estimatedMicros: base * detail.multiplier + (detail.additionalMicros ?? 0),
    breakdown: detail.breakdown,
    rates: { baseMicros: base, ...detail.rates },
    units: detail.units,
    unit: detail.unit,
    rateCardVersion: config.rateCardVersion,
    pricingSource: providerEntry(provider)!.pricingSource,
    pricingCheckedAt: detail.pricingCheckedAt,
    basis,
    uncertainty: detail.uncertainty,
  };
}
/** Only these reviewed server-side definitions are executable in production. */
const definitions: AdapterDefinition<ToolName, ProviderId>[] = [
  {
    tool: "exa_search",
    provider: "exa",
    version: "1.0.0",
    environment: "production",
    operation: "search",
    pageText: true,
    searchDepth: false,
    capabilities: capabilityData.exa_search,
    credential: catalogCredential("exa"),
    input: adapterInput("search"),
    result: searchResult("exa"),
    estimate: (r) => quote("exa", r),
    mappingNotes: (r) => [
      "Exa auto mode returns up to 2,500 characters of source text per result; text may be absent.",
      ...(r.searchDepth
        ? [
            "searchDepth configures Tavily only. Exa uses auto mode; equal retrieval depth or quality is not claimed.",
          ]
        : []),
    ],
    execute: (r, c) =>
      c.transports.search(
        "exa",
        r.query!,
        r.domains,
        c.callId,
        ...(r.maxResults !== undefined ? [{ maxResults: r.maxResults }] : []),
      ),
  },
  {
    tool: "tavily_search",
    provider: "tavily",
    version: "1.0.0",
    environment: "production",
    operation: "search",
    pageText: false,
    searchDepth: true,
    capabilities: capabilityData.tavily_search,
    credential: catalogCredential("tavily"),
    input: adapterInput("search", true),
    result: searchResult("tavily"),
    estimate: (r) => quote("tavily", r),
    mappingNotes: (r) => [
      `Tavily ${r.searchDepth ?? "basic"} mode returns excerpts; generated answers and raw content are disabled.`,
    ],
    execute: (r, c) =>
      c.transports.search(
        "tavily",
        r.query!,
        r.domains,
        c.callId,
        ...(r.maxResults !== undefined || r.searchDepth !== undefined
          ? [{ maxResults: r.maxResults, searchDepth: r.searchDepth }]
          : []),
      ),
  },
  {
    tool: "firecrawl_extract",
    provider: "firecrawl",
    version: "1.0.0",
    environment: "production",
    operation: "extract",
    pageText: true,
    searchDepth: false,
    capabilities: capabilityData.firecrawl_extract,
    credential: catalogCredential("firecrawl"),
    input: adapterInput("extract"),
    result: extractResult,
    estimate: (r) => quote("firecrawl", r),
    mappingNotes: () => [
      "Markdown extraction, up to 20,000 captured characters; full-page completeness is not guaranteed.",
    ],
    execute: (r, c) => c.transports.scrape(r.url!),
  },
  {
    tool: "jina_extract",
    provider: "jina",
    version: "1.0.0",
    environment: "production",
    operation: "extract",
    pageText: true,
    searchDepth: false,
    capabilities: capabilityData.jina_extract,
    credential: catalogCredential("jina"),
    input: adapterInput("extract"),
    result: extractResult,
    estimate: (r) => quote("jina", r),
    mappingNotes: () => [
      "Jina Reader Markdown with images removed, up to 20,000 captured characters; full-page completeness is not guaranteed.",
      "Reported usage is Jina output tokens, stored as provider-reported units.",
    ],
    execute: (r, c) => c.transports.scrape(r.url!, "jina"),
  },
  searchAdapter("brave_search", "brave", false, [
    "Brave descriptions and extra snippets with highlight markup removed; domain restriction is sent as site: operators and re-checked.",
  ]),
  searchAdapter("parallel_search", "parallel", true, [
    "Parallel basic mode with query-selected excerpts, up to 2,500 characters per result; the query is sent as both objective and search query.",
  ]),
  searchAdapter("perplexity_search", "perplexity", false, [
    "Perplexity web search results with excerpts capped at 1,024 tokens per page; no generated answer.",
  ]),
  searchAdapter("serper_search", "serper", false, [
    "Google organic results through Serper; knowledge panels, ads and related questions are dropped; domain restriction is sent as site: operators and re-checked.",
  ]),
  searchAdapter("linkup_search", "linkup", true, [
    "Linkup standard depth, search results only (no sourced answer); image results are dropped.",
  ]),
  extractAdapter("parallel_extract", "parallel_extract", [
    "Parallel full content as Markdown, up to 20,000 captured characters; content may come from Parallel's cache.",
  ]),
  extractAdapter("browserbase_extract", "browserbase", [
    "Browserbase Fetch Markdown with redirects followed, up to 20,000 captured characters; no full browser session.",
  ]),
];
function searchAdapter(
  tool: ToolName,
  provider: SearchProviderId,
  pageText: boolean,
  notes: string[],
): AdapterDefinition<ToolName, ProviderId> {
  return {
    tool,
    provider,
    version: "1.0.0",
    environment: "production",
    operation: "search",
    pageText,
    searchDepth: false,
    capabilities: capabilityData[tool],
    credential: catalogCredential(provider),
    input: adapterInput("search"),
    result: searchResult(provider),
    estimate: (r) => quote(provider, r),
    mappingNotes: () => notes,
    execute: (r, c) =>
      c.transports.search(
        provider,
        r.query!,
        r.domains,
        c.callId,
        ...(r.maxResults !== undefined ? [{ maxResults: r.maxResults }] : []),
      ),
  };
}
function extractAdapter(
  tool: ToolName,
  provider: ExtractProviderId,
  notes: string[],
): AdapterDefinition<ToolName, ProviderId> {
  return {
    tool,
    provider,
    version: "1.0.0",
    environment: "production",
    operation: "extract",
    pageText: true,
    searchDepth: false,
    capabilities: capabilityData[tool],
    credential: catalogCredential(provider),
    input: adapterInput("extract"),
    result: extractResult,
    estimate: (r) => quote(provider, r),
    mappingNotes: () => notes,
    execute: (r, c) => c.transports.scrape(r.url!, provider),
  };
}
export const providerRegistry = new AdapterRegistry(definitions);
if (
  Object.entries(providerTools).some(
    ([tool, provider]) =>
      !definitions.some((a) => a.tool === tool && a.provider === provider),
  )
)
  throw new Error("A registered identifier is missing its adapter definition.");
export const registeredToolNames = definitions.map((a) => a.tool) as [
  ToolName,
  ...ToolName[],
];
export const registeredProviderIds = definitions.map((a) => a.provider) as [
  ProviderId,
  ...ProviderId[],
];
export const registeredToolSchema = z.enum(registeredToolNames);
export const registeredProviderSchema = z.enum(registeredProviderIds);
