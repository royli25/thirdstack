import type {
  ExtractProviderId,
  SearchProviderId,
} from "./provider-catalog.js";
import { randomUUID } from "node:crypto";
import { config, providerAuthMode } from "./config.js";
import type { ProviderId, Source } from "./types.js";
export class ProviderError extends Error {
  constructor(
    public kind:
      "timeout" | "http" | "network" | "invalid_response" | "human_required",
    public httpStatus?: number,
  ) {
    super(
      kind === "human_required"
        ? "Keyless allowance unavailable. Sign in to Firecrawl and configure a server-side key to continue; no automatic retry was made."
        : kind === "http"
          ? `Provider returned HTTP ${httpStatus}`
          : `Provider ${kind.replace("_", " ")}`,
    );
  }
}
export function safeUrl(value: unknown): string | undefined {
  try {
    const u = new URL(String(value));
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
}
function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.slice(0, max) : "";
}
type SearchOptions = {
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
};
type SearchUsage = {
  providerReportedUsd?: number;
  credits?: number;
  source: string;
};
interface SearchSpec {
  request(
    query: string,
    domains: string[],
    maxResults: number,
    options?: SearchOptions,
  ): { endpoint: string; body?: unknown };
  /** The raw result list, or undefined when the response is malformed. */
  results(json: any): unknown[] | undefined;
  map(result: any): {
    title: unknown;
    url: unknown;
    snippet: unknown;
    publishedAt?: unknown;
  };
  usage?(json: any): SearchUsage | undefined;
  requestId?(json: any): unknown;
}
/** Adds Google/Brave-style site: operators; results are re-filtered below. */
function withSites(query: string, domains: string[]) {
  if (!domains.length) return query;
  const sites = domains.map((d) => `site:${d}`);
  return `${query} ${sites.length === 1 ? sites[0] : `(${sites.join(" OR ")})`}`;
}
function stripMarkup(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;|&#39;/g, "'")
        .replace(/&amp;/g, "&")
    : "";
}
const providerReportedCredits = (credits: unknown, note: string) =>
  nonnegativeNumber(credits) !== undefined
    ? { credits: credits as number, source: note }
    : undefined;
const searchSpecs: Record<SearchProviderId, SearchSpec> = {
  exa: {
    request: (query, domains, maxResults) => ({
      endpoint: "https://api.exa.ai/search",
      body: {
        query,
        numResults: maxResults,
        type: "auto",
        contents: { text: { maxCharacters: 2500 } },
        ...(domains.length ? { includeDomains: domains } : {}),
      },
    }),
    results: (json) => (Array.isArray(json.results) ? json.results : undefined),
    map: (r) => ({
      title: r.title,
      url: r.url,
      snippet: r.text,
      publishedAt: r.publishedDate,
    }),
    usage: (json) =>
      nonnegativeNumber(json.costDollars?.total) !== undefined
        ? {
            providerReportedUsd: json.costDollars.total,
            source: "provider response; not a reconciled invoice",
          }
        : undefined,
  },
  tavily: {
    request: (query, domains, maxResults, options) => ({
      endpoint: "https://api.tavily.com/search",
      body: {
        query,
        max_results: maxResults,
        search_depth: options?.searchDepth ?? "basic",
        include_answer: false,
        include_raw_content: false,
        include_usage: true,
        ...(domains.length ? { include_domains: domains } : {}),
      },
    }),
    results: (json) => (Array.isArray(json.results) ? json.results : undefined),
    map: (r) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      publishedAt: r.publishedDate,
    }),
    usage: (json) =>
      providerReportedCredits(
        json.usage?.credits,
        "provider response; credits are not USD charges",
      ),
  },
  brave: {
    request: (query, domains, maxResults) => {
      const params = new URLSearchParams({
        q: withSites(query, domains),
        count: String(maxResults),
        extra_snippets: "true",
      });
      return {
        endpoint: `https://api.search.brave.com/res/v1/web/search?${params}`,
      };
    },
    // Brave omits the web section when nothing matched.
    results: (json) =>
      Array.isArray(json.web?.results)
        ? json.web.results
        : json.type === "search"
          ? []
          : undefined,
    map: (r) => ({
      title: stripMarkup(r.title),
      url: r.url,
      snippet: [
        r.description,
        ...(Array.isArray(r.extra_snippets) ? r.extra_snippets : []),
      ]
        .map(stripMarkup)
        .filter(Boolean)
        .join("\n\n"),
      publishedAt: r.page_age,
    }),
  },
  parallel: {
    request: (query, domains, maxResults) => ({
      endpoint: "https://api.parallel.ai/v1/search",
      body: {
        objective: query,
        search_queries: [query],
        mode: "basic",
        advanced_settings: {
          max_results: maxResults,
          excerpt_settings: { max_chars_per_result: 2500 },
          ...(domains.length
            ? { source_policy: { include_domains: domains } }
            : {}),
        },
      },
    }),
    results: (json) => (Array.isArray(json.results) ? json.results : undefined),
    map: (r) => ({
      title: r.title,
      url: r.url,
      snippet: Array.isArray(r.excerpts)
        ? r.excerpts.filter((e: unknown) => typeof e === "string").join("\n\n")
        : "",
      publishedAt: r.publish_date,
    }),
    requestId: (json) => json.search_id,
  },
  perplexity: {
    request: (query, domains, maxResults) => ({
      endpoint: "https://api.perplexity.ai/search",
      body: {
        query,
        max_results: maxResults,
        max_tokens_per_page: 1024,
        ...(domains.length ? { search_domain_filter: domains } : {}),
      },
    }),
    results: (json) => (Array.isArray(json.results) ? json.results : undefined),
    map: (r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      publishedAt: r.date ?? r.last_updated,
    }),
    requestId: (json) => json.id,
  },
  serper: {
    request: (query, domains, maxResults) => ({
      endpoint: "https://google.serper.dev/search",
      body: { q: withSites(query, domains), num: maxResults },
    }),
    // Serper omits organic results when Google returned none.
    results: (json) =>
      Array.isArray(json.organic)
        ? json.organic
        : json.searchParameters
          ? []
          : undefined,
    map: (r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
      publishedAt: r.date,
    }),
    usage: (json) =>
      providerReportedCredits(
        json.credits,
        "provider response; credits are not USD charges",
      ),
  },
  linkup: {
    request: (query, domains, maxResults) => ({
      endpoint: "https://api.linkup.so/v1/search",
      body: {
        q: query,
        depth: "standard",
        outputType: "searchResults",
        maxResults,
        includeImages: false,
        ...(domains.length ? { includeDomains: domains } : {}),
      },
    }),
    results: (json) =>
      Array.isArray(json.results)
        ? json.results.filter((r: any) => r?.type !== "image")
        : undefined,
    map: (r) => ({
      title: r.name,
      url: r.url,
      snippet: r.content,
      publishedAt: r.publishedAt,
    }),
  },
};
export async function search(
  provider: SearchProviderId,
  query: string,
  domains: string[],
  callId: string,
  options?: SearchOptions,
): Promise<{
  sources: Source[];
  httpStatus: number;
  requestId?: string;
  usage?: SearchUsage;
}> {
  const spec = searchSpecs[provider];
  const maxResults = options?.maxResults ?? 10;
  const { endpoint, body } = spec.request(query, domains, maxResults, options);
  const { response, json } = await request(endpoint, provider, body);
  const results = spec.results(json);
  if (!results) throw new ProviderError("invalid_response", response.status);
  const sources: Source[] = results.slice(0, maxResults).flatMap((raw: any) => {
    if (!raw || typeof raw !== "object") return [];
    const r = spec.map(raw);
    const url = safeUrl(r.url);
    if (!url) return [];
    // Enforce normalized domain policy even if the vendor ignores its filter.
    if (
      domains.length &&
      !domains.some(
        (d) =>
          new URL(url).hostname === d ||
          new URL(url).hostname.endsWith(`.${d}`),
      )
    )
      return [];
    return [
      {
        id: randomUUID(),
        title: clean(r.title, 500) || new URL(url).hostname,
        url,
        snippet: clean(r.snippet, 5000),
        ...(typeof r.publishedAt === "string" && r.publishedAt
          ? { publishedAt: r.publishedAt.slice(0, 40) }
          : {}),
        provider,
        callId,
      },
    ];
  });
  return {
    sources,
    usage: spec.usage?.(json),
    httpStatus: response.status,
    requestId:
      clean(
        spec.requestId?.(json) ??
          json.requestId ??
          json.request_id ??
          response.headers.get("x-request-id"),
        200,
      ) || undefined,
  };
}
export interface ExtractionResult {
  requestId?: string;
  text: string;
  truncated?: boolean;
  originalCharacters?: number;
  returnedCharacters?: number;
  httpStatus: number;
  /** Provider-reported usage, in the catalog's usage unit (credits or tokens). */
  credits?: number;
  pageStatus?: number;
  title?: string;
}
const captureCharacters = 20000;
function nonnegativeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : undefined;
}
/** Reads one page as Markdown. Firecrawl is the default for existing callers. */
export async function scrape(
  url: string,
  provider: ExtractProviderId = "firecrawl",
): Promise<ExtractionResult> {
  const readers: Record<
    ExtractProviderId,
    (url: string) => Promise<ExtractionResult>
  > = {
    firecrawl: firecrawlScrape,
    jina: jinaRead,
    parallel_extract: parallelExtract,
    browserbase: browserbaseFetch,
  };
  return readers[provider](url);
}
function capture(content: string, limit = captureCharacters) {
  return {
    text: content.slice(0, limit),
    truncated: content.length > limit,
    originalCharacters: content.length,
    returnedCharacters: Math.min(content.length, limit),
  };
}
function pageStatus(value: unknown) {
  return Number.isInteger(value) &&
    (value as number) >= 100 &&
    (value as number) <= 599
    ? (value as number)
    : undefined;
}
async function parallelExtract(url: string): Promise<ExtractionResult> {
  const { response, json } = await request(
    "https://api.parallel.ai/v1/extract",
    "parallel_extract",
    {
      urls: [url],
      // One character over the capture limit reveals truncation.
      advanced_settings: {
        full_content: { max_chars_per_result: captureCharacters + 1 },
      },
    },
  );
  if (!Array.isArray(json.results) || !Array.isArray(json.errors))
    throw new ProviderError("invalid_response", response.status);
  const requestId = clean(json.extract_id, 200) || undefined;
  const result = json.results.find((r: any) => r && typeof r === "object");
  if (!result) {
    // Parallel reached the API but could not read the page.
    const failure = json.errors.find((e: any) => e && typeof e === "object");
    if (!failure) throw new ProviderError("invalid_response", response.status);
    return {
      text: "",
      httpStatus: response.status,
      pageStatus: pageStatus(failure.http_status_code),
      requestId,
    };
  }
  const content =
    typeof result.full_content === "string"
      ? result.full_content
      : Array.isArray(result.excerpts)
        ? result.excerpts
            .filter((e: unknown) => typeof e === "string")
            .join("\n\n")
        : undefined;
  if (content === undefined)
    throw new ProviderError("invalid_response", response.status);
  return {
    ...capture(content),
    httpStatus: response.status,
    title: clean(result.title, 500) || undefined,
    requestId,
  };
}
async function browserbaseFetch(url: string): Promise<ExtractionResult> {
  const { response, json } = await request(
    "https://api.browserbase.com/v1/fetch",
    "browserbase",
    { url, format: "markdown", allowRedirects: true },
  );
  if (typeof json.content !== "string")
    throw new ProviderError("invalid_response", response.status);
  return {
    ...capture(json.content),
    httpStatus: response.status,
    pageStatus: pageStatus(json.statusCode),
    requestId: clean(json.id, 200) || undefined,
  };
}
async function jinaRead(url: string): Promise<ExtractionResult> {
  const { response, json } = await request(
    "https://r.jina.ai/",
    "jina",
    { url },
    {
      Accept: "application/json",
      "X-Return-Format": "markdown",
      "X-Retain-Images": "none",
      "X-Timeout": String(Math.max(1, Math.floor(config.timeoutMs / 1000))),
    },
  );
  const content = json.data?.content;
  if (typeof content !== "string")
    throw new ProviderError("invalid_response", response.status);
  return {
    text: content.slice(0, captureCharacters),
    requestId:
      clean(
        json.requestId ??
          json.request_id ??
          response.headers.get("x-request-id"),
        200,
      ) || undefined,
    truncated: content.length > captureCharacters,
    originalCharacters: content.length,
    returnedCharacters: Math.min(content.length, captureCharacters),
    httpStatus: response.status,
    title: clean(json.data?.title, 500) || undefined,
    credits: nonnegativeNumber(json.data?.usage?.tokens),
  };
}
async function firecrawlScrape(url: string): Promise<ExtractionResult> {
  const { response, json } = await request(
    "https://api.firecrawl.dev/v2/scrape",
    "firecrawl",
    { url, formats: ["markdown"], onlyMainContent: true },
  );
  if (json.success !== true || typeof json.data?.markdown !== "string")
    throw new ProviderError("invalid_response", response.status);
  return {
    text: json.data.markdown.slice(0, 20000),
    requestId:
      clean(
        json.requestId ??
          json.request_id ??
          response.headers.get("x-request-id"),
        200,
      ) || undefined,
    truncated: json.data.markdown.length > 20000,
    originalCharacters: json.data.markdown.length,
    returnedCharacters: Math.min(json.data.markdown.length, 20000),
    httpStatus: response.status,
    pageStatus:
      Number.isInteger(json.data?.metadata?.statusCode) &&
      json.data.metadata.statusCode >= 100 &&
      json.data.metadata.statusCode <= 599
        ? json.data.metadata.statusCode
        : undefined,
    title: clean(json.data?.metadata?.title, 500) || undefined,
    credits:
      typeof json.data?.metadata?.creditsUsed === "number" &&
      Number.isFinite(json.data.metadata.creditsUsed) &&
      json.data.metadata.creditsUsed >= 0
        ? json.data.metadata.creditsUsed
        : undefined,
  };
}
/** Providers that take the key in a named header; the rest use a Bearer token. */
const keyHeaders: Partial<Record<ProviderId, string>> = {
  exa: "x-api-key",
  brave: "X-Subscription-Token",
  parallel: "x-api-key",
  parallel_extract: "x-api-key",
  serper: "X-API-KEY",
  browserbase: "X-BB-API-Key",
};
function authHeaders(provider: ProviderId): Record<string, string> {
  if (providerAuthMode(provider) === "keyless") return {};
  const key = config.keys[provider];
  const header = keyHeaders[provider];
  return header ? { [header]: key } : { Authorization: `Bearer ${key}` };
}
/** POSTs JSON, or GETs when no body is given. */
async function request(
  endpoint: string,
  provider: ProviderId,
  body: unknown,
  extraHeaders: Record<string, string> = {},
) {
  let response: Response;
  const signal = AbortSignal.timeout(config.timeoutMs);
  const post = body !== undefined;
  try {
    response = await fetch(endpoint, {
      method: post ? "POST" : "GET",
      headers: {
        ...(post ? { "Content-Type": "application/json" } : {}),
        Accept: "application/json",
        ...extraHeaders,
        ...authHeaders(provider),
      },
      ...(post ? { body: JSON.stringify(body) } : {}),
      signal,
      redirect: "error",
    });
  } catch (e) {
    throw new ProviderError(
      e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name)
        ? "timeout"
        : "network",
    );
  }
  // Never reflect vendor error bodies: they may contain credentials or user input.
  if (!response.ok) {
    await response.body?.cancel();
    if (
      providerAuthMode(provider) === "keyless" &&
      [401, 403, 429].includes(response.status)
    )
      throw new ProviderError("human_required", response.status);
    throw new ProviderError("http", response.status);
  }
  try {
    const reader = response.body!.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2_000_000) {
        await reader.cancel();
        throw new Error("Response too large");
      }
      chunks.push(value);
    }
    const json = JSON.parse(Buffer.concat(chunks).toString());
    if (!json || typeof json !== "object") throw new Error("Invalid response");
    return { response, json };
  } catch {
    throw new ProviderError(
      signal.aborted ? "timeout" : "invalid_response",
      response.status,
    );
  }
}
