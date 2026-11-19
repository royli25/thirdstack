import type { ToolName } from "./observation-types.js";
import type { AdapterCapabilities } from "./provider-registry.js";

/** Adapter-specific claims, shared by discovery, MCP and diagnostic snapshots. */
export const capabilityData: Record<ToolName, AdapterCapabilities> = {
  exa_search: {
    description:
      "Search with Exa auto mode and request up to 2,500 characters of page text per result. Up to 20 results (10 by default); optional domain restriction.",
    useWhen:
      "Use when source text returned with search may answer the question or reduce follow-up page extractions. Compare the returned evidence with the task's needs.",
    limitations:
      "Page text is partial and can be absent. No guarantee of live inventory, complete coverage, or answer accuracy. This adapter does not expose Exa's other search modes.",
    documentationUrl: "https://exa.ai/docs/reference/search",
    adapter: { type: "auto", numResults: 10, textMaxCharacters: 2500 },
  },
  tavily_search: {
    description:
      "Search with Tavily basic mode by default, or advanced mode, for up to 20 ranked results and content excerpts. Optional domain restriction; generated answers and raw page content are disabled.",
    useWhen:
      "Use for finding candidate pages and focused factual lookups when excerpts are sufficient. Retrieve a specific page when the excerpt does not support the needed claim.",
    limitations:
      "Excerpts are not full pages. Per-call estimates do not establish end-to-end task cost or quality. Raw content is not exposed by this adapter.",
    documentationUrl:
      "https://docs.tavily.com/documentation/api-reference/endpoint/search",
    adapter: {
      searchDepth: "basic",
      maxResults: 10,
      includeAnswer: false,
      includeRawContent: false,
    },
  },
  firecrawl_extract: {
    description:
      "Retrieve the main content of one public HTTPS page as Markdown with Firecrawl. Captures up to 20,000 characters and reports truncation and page status when available.",
    useWhen:
      "Use when a known page needs closer inspection, such as a specification, price, or source passage not present in search excerpts.",
    limitations:
      "This is page extraction, not web search. Dynamic options and stock can be incomplete; API success can contain an error page. A truncated receipt is not the full page.",
    documentationUrl:
      "https://docs.firecrawl.dev/api-reference/endpoint/scrape",
    adapter: {
      formats: "markdown",
      onlyMainContent: true,
      captureCharacters: 20000,
    },
  },
  jina_extract: {
    description:
      "Retrieve one public HTTPS page as Markdown with Jina Reader, rendered in a browser. Images are removed. Captures up to 20,000 characters and reports truncation and output tokens.",
    useWhen:
      "Use when a known page needs closer inspection, or as an alternative reader when another extraction returned little or no main content.",
    limitations:
      "This is page extraction, not web search. Content may include navigation or boilerplate. API success can contain an error page. A truncated receipt is not the full page.",
    documentationUrl: "https://jina.ai/reader",
    adapter: {
      returnFormat: "markdown",
      retainImages: "none",
      captureCharacters: 20000,
    },
  },
  brave_search: {
    description:
      "Search Brave's independent web index for up to 20 ranked results (10 by default) with short descriptions and extra excerpts. Optional domain restriction.",
    useWhen:
      "Use for broad discovery from an index that is not Google or Bing, or to cross-check results from another search tool.",
    limitations:
      "Excerpts are short and not full pages. Domain restriction uses site: operators. No guarantee of coverage, freshness or answer accuracy.",
    documentationUrl:
      "https://api-dashboard.search.brave.com/app/documentation/web-search/get-started",
    adapter: { count: 10, extraSnippets: true, stripMarkup: true },
  },
  parallel_search: {
    description:
      "Search with Parallel in basic mode for up to 20 results (10 by default) with excerpts selected for the query, up to 2,500 characters per result. Optional domain restriction.",
    useWhen:
      "Use when the excerpts themselves should answer the question, reducing follow-up page extractions.",
    limitations:
      "Excerpts are selected passages, not full pages. Basic mode trades some quality for latency. No guarantee of coverage or answer accuracy.",
    documentationUrl: "https://docs.parallel.ai/api-reference/search/search",
    adapter: { mode: "basic", maxResults: 10, maxCharsPerResult: 2500 },
  },
  perplexity_search: {
    description:
      "Search with Perplexity's Search API for up to 20 ranked results (10 by default) with page excerpts and publication dates. Returns results, not a written answer. Optional domain restriction.",
    useWhen:
      "Use for current events and recently updated pages where publication and update dates matter.",
    limitations:
      "Excerpts are capped per page and are not full pages. No generated answer is returned. No guarantee of coverage or answer accuracy.",
    documentationUrl: "https://docs.perplexity.ai/api-reference/search-post",
    adapter: { searchType: "web", maxResults: 10, maxTokensPerPage: 1024 },
  },
  serper_search: {
    description:
      "Search Google through Serper for up to 20 organic results (10 by default) with Google's short snippets. Optional domain restriction.",
    useWhen:
      "Use as a Google baseline, to find official pages Google ranks highly, or when cost matters most.",
    limitations:
      "Snippets are one or two sentences. Ads, maps and other result types are excluded. Domain restriction uses site: operators.",
    documentationUrl: "https://serper.dev",
    adapter: { endpoint: "search", num: 10 },
  },
  linkup_search: {
    description:
      "Search with Linkup in standard depth for up to 20 results (10 by default) with source content for each result. Optional domain restriction.",
    useWhen:
      "Use when grounded source content is needed for a factual question spanning several sources.",
    limitations:
      "Standard depth is a single agentic pass; it is slower than plain search. Generated answers are disabled. No guarantee of coverage or answer accuracy.",
    documentationUrl:
      "https://docs.linkup.so/pages/documentation/api-reference/endpoint/post-search",
    adapter: {
      depth: "standard",
      outputType: "searchResults",
      includeImages: false,
    },
  },
  parallel_extract: {
    description:
      "Retrieve the full content of one public HTTPS page as Markdown with Parallel Extract. Captures up to 20,000 characters and reports truncation.",
    useWhen:
      "Use when a known page needs closer inspection, or as an alternative reader to Firecrawl or Jina Reader.",
    limitations:
      "This is page extraction, not web search. Content may come from Parallel's cache rather than a live fetch. A truncated receipt is not the full page.",
    documentationUrl: "https://docs.parallel.ai/api-reference/extract/extract",
    adapter: { fullContent: true, maxCharsPerResult: 20001 },
  },
  browserbase_extract: {
    description:
      "Retrieve one public HTTPS page as Markdown with Browserbase Fetch, following redirects. Captures up to 20,000 characters and reports the page status.",
    useWhen:
      "Use when another reader returned an empty, blocked or incomplete page, or the page redirects before showing content.",
    limitations:
      "This is page extraction, not web search. Fetch does not run a full browser session, so content rendered late by JavaScript can be missing. A truncated receipt is not the full page.",
    documentationUrl: "https://docs.browserbase.com/reference/api/fetch-a-page",
    adapter: {
      format: "markdown",
      allowRedirects: true,
      captureCharacters: 20000,
    },
  },
};
