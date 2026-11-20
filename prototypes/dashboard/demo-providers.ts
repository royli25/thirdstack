import { capabilityData } from "../../server/provider-capability-data";
import { providerMarks } from "./provider-mark";

type DemoOperation = "search" | "extract";

const endpointCatalog = {
  exa_search: { operation: "search", estimatedUsd: 0.007, unit: "usd" },
  tavily_search: { operation: "search", estimatedUsd: 0.008, unit: "credits" },
  firecrawl_extract: {
    operation: "extract",
    estimatedUsd: 0.001,
    unit: "credits",
  },
  jina_extract: { operation: "extract", estimatedUsd: 0.0005, unit: "tokens" },
  brave_search: { operation: "search", estimatedUsd: 0.005, unit: "credits" },
  parallel_search: {
    operation: "search",
    estimatedUsd: 0.005,
    unit: "credits",
  },
  parallel_extract: {
    operation: "extract",
    estimatedUsd: 0.001,
    unit: "credits",
  },
  perplexity_search: {
    operation: "search",
    estimatedUsd: 0.005,
    unit: "credits",
  },
  serper_search: { operation: "search", estimatedUsd: 0.001, unit: "credits" },
  linkup_search: { operation: "search", estimatedUsd: 0.006, unit: "credits" },
  browserbase_extract: {
    operation: "extract",
    estimatedUsd: 0.004,
    unit: "credits",
  },
} as const;

export type DemoToolName = keyof typeof endpointCatalog;
export type DemoProviderId = keyof typeof providerMarks;

export type DemoEndpoint = {
  name: DemoToolName;
  operation: DemoOperation;
  estimatedUsd: number;
  unit: "usd" | "credits" | "tokens";
};

export type DemoProvider = {
  id: DemoProviderId;
  label: string;
  summary: string;
  category: DemoOperation | "search-and-extract";
  logo: string;
  endpoints: readonly DemoEndpoint[];
  readiness: "integrated" | "preview";
  description?: string;
  useWhen?: string;
  limitations?: string;
};

// Prototype snapshot of GitHub's main catalog and the Phase 1 provider PR.
// https://github.com/royli25/octolab/pull/18
// Prices are the repository's per-call estimates. No demo action calls a provider.
type DemoCapability = Pick<
  DemoProvider,
  "description" | "useWhen" | "limitations"
>;
type ProviderDefinition = Omit<DemoProvider, "logo" | "endpoints"> & {
  tools: readonly DemoToolName[];
};

const descriptions: Partial<Record<DemoProviderId, DemoCapability>> = {
  exa: capabilityData.exa_search,
  tavily: capabilityData.tavily_search,
  firecrawl: capabilityData.firecrawl_extract,
};

const providers: readonly ProviderDefinition[] = [
  {
    id: "exa",
    label: "Exa",
    summary: "Search the web and retrieve full page text.",
    category: "search",
    tools: ["exa_search"],
    readiness: "integrated",
  },
  {
    id: "tavily",
    label: "Tavily",
    summary: "Search the web and return relevant excerpts.",
    category: "search",
    tools: ["tavily_search"],
    readiness: "integrated",
  },
  {
    id: "firecrawl",
    label: "Firecrawl",
    summary: "Extract readable content from a web page.",
    category: "extract",
    tools: ["firecrawl_extract"],
    readiness: "integrated",
  },
  {
    id: "jina",
    label: "Jina Reader",
    summary: "Convert a web page into text for your agent.",
    category: "extract",
    tools: ["jina_extract"],
    readiness: "integrated",
  },
  {
    id: "brave",
    label: "Brave Search",
    summary: "Search Brave’s independent web index.",
    category: "search",
    tools: ["brave_search"],
    readiness: "preview",
  },
  {
    id: "parallel",
    label: "Parallel",
    summary: "Find ranked excerpts or extract the full content of a page.",
    category: "search-and-extract",
    tools: ["parallel_search", "parallel_extract"],
    readiness: "preview",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    summary: "Get ranked web results with page excerpts.",
    category: "search",
    tools: ["perplexity_search"],
    readiness: "preview",
  },
  {
    id: "serper",
    label: "Serper",
    summary: "Get Google web results with short snippets.",
    category: "search",
    tools: ["serper_search"],
    readiness: "preview",
  },
  {
    id: "linkup",
    label: "Linkup",
    summary: "Search the web and retrieve content from the original sources.",
    category: "search",
    tools: ["linkup_search"],
    readiness: "preview",
  },
  {
    id: "browserbase",
    label: "Browserbase",
    summary: "Read hard-to-access web pages as Markdown.",
    category: "extract",
    tools: ["browserbase_extract"],
    readiness: "preview",
  },
];

export const demoProviders: readonly DemoProvider[] = providers.map(
  ({ tools, ...provider }) => {
    const { description, useWhen, limitations } =
      descriptions[provider.id] ?? {};
    return {
      ...provider,
      description,
      useWhen,
      limitations,
      logo: providerMarks[provider.id],
      endpoints: tools.map((name) => ({ name, ...endpointCatalog[name] })),
    };
  },
);
