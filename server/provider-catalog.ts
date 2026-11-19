/**
 * Single source of truth for provider identity and display metadata.
 *
 * This file is pure data so both the server and the browser bundle can import
 * it. To add a provider: add an entry here, add its adapter definition and
 * transport in provider-adapters.ts / providers.ts, and its capability text in
 * provider-capability-data.ts. Everything else (enums, lists, labels, pricing
 * defaults, credential references) derives from this catalog.
 */
export type ProviderOperation = "search" | "extract";

export interface ProviderCatalogEntry {
  /** Stable provider identifier stored in receipts and the database. */
  id: string;
  /** Stable public MCP tool name. */
  tool: string;
  label: string;
  /** Single-character mark used where no logo is shown. */
  initial: string;
  /** Logo under /public, when the provider supplied one. */
  logo?: string;
  operation: ProviderOperation;
  /** Short description of what the tool returns, for tool lists. */
  summary: string;
  /** What a search result carries: full page text or short excerpts. */
  resultDetail?: "Page text" | "Excerpts";
  credentialEnv: string;
  /** Where an operator creates the provider API key. */
  keySetupUrl: string;
  accountReferenceEnv: string;
  /**
   * Unit the provider reports usage in on responses. Credit and token counts
   * are stored in the receipt's `credits` field and labelled with this unit.
   */
  usageUnit: "usd" | "credits" | "tokens";
  /** Environment variable overriding the per-request USD estimate. */
  priceEnv: string;
  defaultUsd: number;
  pricingSource: string;
}

export const providerCatalog = [
  {
    id: "exa",
    tool: "exa_search",
    label: "Exa",
    initial: "e",
    logo: "/providers/exa-icon.svg",
    operation: "search",
    summary: "Web search with page text",
    resultDetail: "Page text",
    credentialEnv: "EXA_API_KEY",
    keySetupUrl: "https://dashboard.exa.ai",
    accountReferenceEnv: "EXA_ACCOUNT_REFERENCE",
    usageUnit: "usd",
    priceEnv: "EXA_SEARCH_USD",
    // Auto search, <=10 results with page text: published $7/1k, checked 2026-11-01.
    defaultUsd: 0.007,
    pricingSource: "https://exa.ai/pricing",
  },
  {
    id: "tavily",
    tool: "tavily_search",
    label: "Tavily",
    initial: "t",
    logo: "/providers/tavily.svg",
    operation: "search",
    summary: "Web search with excerpts",
    resultDetail: "Excerpts",
    credentialEnv: "TAVILY_API_KEY",
    keySetupUrl: "https://app.tavily.com",
    accountReferenceEnv: "TAVILY_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "TAVILY_SEARCH_USD",
    defaultUsd: 0.008,
    pricingSource: "https://docs.tavily.com/documentation/api-credits",
  },
  {
    id: "firecrawl",
    tool: "firecrawl_extract",
    label: "Firecrawl",
    initial: "f",
    logo: "/providers/firecrawl.png",
    operation: "extract",
    summary: "Page extraction",
    credentialEnv: "FIRECRAWL_API_KEY",
    keySetupUrl: "https://www.firecrawl.dev/app/api-keys",
    accountReferenceEnv: "FIRECRAWL_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "FIRECRAWL_SCRAPE_USD",
    defaultUsd: 0.001,
    pricingSource: "https://docs.firecrawl.dev/billing",
  },
  {
    id: "jina",
    tool: "jina_extract",
    label: "Jina Reader",
    initial: "j",
    logo: "/providers/jina-mark.png",
    operation: "extract",
    summary: "Page extraction",
    credentialEnv: "JINA_API_KEY",
    keySetupUrl: "https://jina.ai/api-dashboard",
    accountReferenceEnv: "JINA_ACCOUNT_REFERENCE",
    usageUnit: "tokens",
    priceEnv: "JINA_READ_USD",
    // Billed per output token. ~5k tokens for a 20k-character page; unconfirmed
    // published rate, so this is a conservative per-page estimate.
    defaultUsd: 0.0005,
    pricingSource: "https://jina.ai/reader",
  },
  {
    id: "brave",
    tool: "brave_search",
    label: "Brave Search",
    initial: "b",
    logo: "/providers/brave-mark.png",
    operation: "search",
    summary: "Web search from an independent index",
    resultDetail: "Excerpts",
    credentialEnv: "BRAVE_API_KEY",
    keySetupUrl: "https://api-dashboard.search.brave.com",
    accountReferenceEnv: "BRAVE_ACCOUNT_REFERENCE",
    // Brave does not report usage on search responses.
    usageUnit: "credits",
    priceEnv: "BRAVE_SEARCH_USD",
    defaultUsd: 0.005,
    pricingSource: "https://brave.com/search/api/",
  },
  {
    id: "parallel",
    tool: "parallel_search",
    label: "Parallel Search",
    initial: "p",
    logo: "/providers/parallel-mark.svg",
    operation: "search",
    summary: "Web search with ranked excerpts for agents",
    resultDetail: "Excerpts",
    credentialEnv: "PARALLEL_API_KEY",
    keySetupUrl: "https://platform.parallel.ai",
    accountReferenceEnv: "PARALLEL_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "PARALLEL_SEARCH_USD",
    defaultUsd: 0.005,
    pricingSource: "https://parallel.ai/pricing",
  },
  {
    id: "perplexity",
    tool: "perplexity_search",
    label: "Perplexity Search",
    initial: "p",
    logo: "/providers/perplexity-mark.svg",
    operation: "search",
    summary: "Ranked web results with page excerpts",
    resultDetail: "Excerpts",
    credentialEnv: "PERPLEXITY_API_KEY",
    keySetupUrl: "https://www.perplexity.ai/account/api",
    accountReferenceEnv: "PERPLEXITY_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "PERPLEXITY_SEARCH_USD",
    defaultUsd: 0.005,
    pricingSource: "https://docs.perplexity.ai/getting-started/pricing",
  },
  {
    id: "serper",
    tool: "serper_search",
    label: "Serper",
    initial: "s",
    logo: "/providers/serper-mark.png",
    operation: "search",
    summary: "Google web results with short snippets",
    resultDetail: "Excerpts",
    credentialEnv: "SERPER_API_KEY",
    keySetupUrl: "https://serper.dev/api-key",
    accountReferenceEnv: "SERPER_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "SERPER_SEARCH_USD",
    defaultUsd: 0.001,
    pricingSource: "https://serper.dev",
  },
  {
    id: "linkup",
    tool: "linkup_search",
    label: "Linkup",
    initial: "l",
    logo: "/providers/linkup-mark.png",
    operation: "search",
    summary: "Web search with source-grounded content",
    resultDetail: "Page text",
    credentialEnv: "LINKUP_API_KEY",
    keySetupUrl: "https://app.linkup.so",
    accountReferenceEnv: "LINKUP_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "LINKUP_SEARCH_USD",
    defaultUsd: 0.006,
    pricingSource: "https://www.linkup.so/pricing",
  },
  {
    id: "parallel_extract",
    tool: "parallel_extract",
    label: "Parallel Extract",
    initial: "p",
    logo: "/providers/parallel-mark.svg",
    operation: "extract",
    summary: "Page extraction",
    // Shares the Parallel account and key with Parallel Search.
    credentialEnv: "PARALLEL_API_KEY",
    keySetupUrl: "https://platform.parallel.ai",
    accountReferenceEnv: "PARALLEL_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "PARALLEL_EXTRACT_USD",
    defaultUsd: 0.001,
    pricingSource: "https://parallel.ai/pricing",
  },
  {
    id: "browserbase",
    tool: "browserbase_extract",
    label: "Browserbase Fetch",
    initial: "b",
    logo: "/providers/browserbase-mark.svg",
    operation: "extract",
    summary: "Page extraction for hard-to-read pages",
    credentialEnv: "BROWSERBASE_API_KEY",
    keySetupUrl: "https://www.browserbase.com/settings",
    accountReferenceEnv: "BROWSERBASE_ACCOUNT_REFERENCE",
    usageUnit: "credits",
    priceEnv: "BROWSERBASE_FETCH_USD",
    // Markdown format: $4 per 1,000 pages.
    defaultUsd: 0.004,
    pricingSource: "https://www.browserbase.com/pricing",
  },
] as const satisfies readonly ProviderCatalogEntry[];

type Catalog = typeof providerCatalog;
export type CatalogProviderId = Catalog[number]["id"];
export type CatalogToolName = Catalog[number]["tool"];
export type SearchProviderId = Extract<
  Catalog[number],
  { operation: "search" }
>["id"];
export type ExtractProviderId = Extract<
  Catalog[number],
  { operation: "extract" }
>["id"];

export const providerIds = providerCatalog.map((p) => p.id) as [
  CatalogProviderId,
  ...CatalogProviderId[],
];
export const providerToolNames = providerCatalog.map((p) => p.tool) as [
  CatalogToolName,
  ...CatalogToolName[],
];
export const searchProviderIds = providerCatalog
  .filter((p) => p.operation === "search")
  .map((p) => p.id) as SearchProviderId[];
export const extractProviderIds = providerCatalog
  .filter((p) => p.operation === "extract")
  .map((p) => p.id) as ExtractProviderId[];

const byId = new Map<string, ProviderCatalogEntry>(
  providerCatalog.map((p) => [p.id, p]),
);
const byTool = new Map<string, ProviderCatalogEntry>(
  providerCatalog.map((p) => [p.tool, p]),
);
if (byId.size !== providerCatalog.length || byTool.size !== byId.size)
  throw new Error("Provider catalog identifiers must be unique.");

export function isProviderId(value: unknown): value is CatalogProviderId {
  return typeof value === "string" && byId.has(value);
}
export function isProviderToolName(value: unknown): value is CatalogToolName {
  return typeof value === "string" && byTool.has(value);
}
export function providerEntry(id: string) {
  return byId.get(id);
}
/** Display name; unknown identifiers are returned unchanged. */
export function providerLabel(id: string) {
  return byId.get(id)?.label ?? id;
}
export function providerOperation(id: string): ProviderOperation | undefined {
  return byId.get(id)?.operation;
}
export function isExtractProvider(id: string) {
  return byId.get(id)?.operation === "extract";
}
export function isSearchProvider(id: string) {
  return byId.get(id)?.operation === "search";
}
export function toolForProvider(id: CatalogProviderId): CatalogToolName {
  return byId.get(id)!.tool as CatalogToolName;
}
export function providerForTool(tool: string): CatalogProviderId | undefined {
  return byTool.get(tool)?.id as CatalogProviderId | undefined;
}
export function toolOperation(tool: string): ProviderOperation | undefined {
  return byTool.get(tool)?.operation;
}
