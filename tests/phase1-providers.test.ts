import { afterEach, describe, expect, it, vi } from "vitest";
import { providerRegistry } from "../server/provider-adapters";
import { config } from "../server/config";
import { ProviderError } from "../server/providers";
import { providerEntry, providerForTool } from "../server/provider-catalog";

const original = { keys: { ...config.keys }, prices: { ...config.prices } };
afterEach(() => {
  Object.assign(config.keys, original.keys);
  Object.assign(config.prices, original.prices);
  vi.unstubAllGlobals();
});

type Call = [string, RequestInit | undefined];
function stub(response: () => Response) {
  const fetch = vi.fn(async (_input: unknown, _init?: RequestInit) =>
    response(),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });
const headersOf = (call: Call) => call[1]?.headers as Record<string, string>;
const bodyOf = (call: Call) =>
  call[1]?.body ? JSON.parse(String(call[1].body)) : undefined;

/** Three raw results: on-domain, off-domain, and an unusable URL. */
interface SearchCase {
  tool: string;
  endpoint: string;
  method: "GET" | "POST";
  auth: [string, string];
  response: (results: Record<string, unknown>[]) => unknown;
  raw: (i: number, url: string) => Record<string, unknown>;
  expectSnippet: string;
  /** Checks the provider-specific request fields for query "fixture query". */
  checkRequest: (call: Call) => void;
  requestId?: string;
  credits?: number;
}
const urls = [
  "https://docs.example.com/a",
  "https://other.test/b",
  "not a url",
];
const searchCases: SearchCase[] = [
  {
    tool: "brave_search",
    endpoint: "https://api.search.brave.com/res/v1/web/search",
    method: "GET",
    auth: ["X-Subscription-Token", "TEST_ONLY_BRAVE"],
    response: (results) => ({ type: "search", web: { results } }),
    raw: (i, url) => ({
      title: `<strong>Result</strong> ${i}`,
      url,
      description: "Main <strong>excerpt</strong> &amp; more",
      extra_snippets: ["Extra excerpt"],
      page_age: "2026-10-01T00:00:00",
    }),
    expectSnippet: "Main excerpt & more\n\nExtra excerpt",
    checkRequest: (call) => {
      const url = new URL(call[0]);
      expect(url.searchParams.get("q")).toBe("fixture query site:example.com");
      expect(url.searchParams.get("count")).toBe("5");
      expect(url.searchParams.get("extra_snippets")).toBe("true");
      expect(call[1]?.body).toBeUndefined();
    },
  },
  {
    tool: "parallel_search",
    endpoint: "https://api.parallel.ai/v1/search",
    method: "POST",
    auth: ["x-api-key", "TEST_ONLY_PARALLEL"],
    response: (results) => ({
      search_id: "search_123",
      session_id: "s",
      results,
    }),
    raw: (i, url) => ({
      title: `Result ${i}`,
      url,
      excerpts: ["First excerpt", "Second excerpt"],
      publish_date: "2026-10-01",
    }),
    expectSnippet: "First excerpt\n\nSecond excerpt",
    requestId: "search_123",
    checkRequest: (call) =>
      expect(bodyOf(call)).toEqual({
        objective: "fixture query",
        search_queries: ["fixture query"],
        mode: "basic",
        advanced_settings: {
          max_results: 5,
          excerpt_settings: { max_chars_per_result: 2500 },
          source_policy: { include_domains: ["example.com"] },
        },
      }),
  },
  {
    tool: "perplexity_search",
    endpoint: "https://api.perplexity.ai/search",
    method: "POST",
    auth: ["Authorization", "Bearer TEST_ONLY_PERPLEXITY"],
    response: (results) => ({ id: "pplx-1", results }),
    raw: (i, url) => ({
      title: `Result ${i}`,
      url,
      snippet: "Perplexity excerpt",
      date: "2026-10-01",
    }),
    expectSnippet: "Perplexity excerpt",
    requestId: "pplx-1",
    checkRequest: (call) =>
      expect(bodyOf(call)).toEqual({
        query: "fixture query",
        max_results: 5,
        max_tokens_per_page: 1024,
        search_domain_filter: ["example.com"],
      }),
  },
  {
    tool: "serper_search",
    endpoint: "https://google.serper.dev/search",
    method: "POST",
    auth: ["X-API-KEY", "TEST_ONLY_SERPER"],
    response: (organic) => ({
      searchParameters: { q: "fixture query" },
      organic,
      credits: 1,
    }),
    raw: (i, url) => ({
      title: `Result ${i}`,
      link: url,
      snippet: "Google snippet",
      date: "Oct 1, 2026",
      position: i + 1,
    }),
    expectSnippet: "Google snippet",
    credits: 1,
    checkRequest: (call) =>
      expect(bodyOf(call)).toEqual({
        q: "fixture query site:example.com",
        num: 5,
      }),
  },
  {
    tool: "linkup_search",
    endpoint: "https://api.linkup.so/v1/search",
    method: "POST",
    auth: ["Authorization", "Bearer TEST_ONLY_LINKUP"],
    response: (results) => ({
      results: [
        ...results,
        { type: "image", name: "Image", url: "https://docs.example.com/i" },
      ],
    }),
    raw: (i, url) => ({
      type: "text",
      name: `Result ${i}`,
      url,
      content: "Linkup source content",
      publishedAt: "2026-10-01",
    }),
    expectSnippet: "Linkup source content",
    checkRequest: (call) =>
      expect(bodyOf(call)).toEqual({
        q: "fixture query",
        depth: "standard",
        outputType: "searchResults",
        maxResults: 5,
        includeImages: false,
        includeDomains: ["example.com"],
      }),
  },
];

describe.each(searchCases)("$tool adapter", (c) => {
  const provider = providerForTool(c.tool)!;
  const request = {
    query: "fixture query",
    domains: ["example.com"],
    maxResults: 5,
  };
  const key = c.auth[1].replace("Bearer ", "");

  it("is a registered search tool with its own credential", () => {
    expect(providerEntry(provider)?.operation).toBe("search");
    const adapter = providerRegistry.get(c.tool as never);
    expect(adapter.operation).toBe("search");
    expect(adapter.credential.reference).toBe(
      providerEntry(provider)!.credentialEnv,
    );
  });

  it("sends one authenticated request and keeps only usable on-domain results", async () => {
    config.keys[provider] = key;
    const fetch = stub(() =>
      json(c.response(urls.map((url, i) => c.raw(i, url)))),
    );
    const result = (await providerRegistry.execute(
      c.tool as never,
      request,
      "call-1",
    )) as any;
    expect(fetch).toHaveBeenCalledTimes(1);
    const call = fetch.mock.calls[0] as Call;
    expect(call[0].split("?")[0]).toBe(c.endpoint);
    expect(call[1]?.method).toBe(c.method);
    expect(call[1]?.redirect).toBe("error");
    expect(headersOf(call)[c.auth[0]]).toBe(c.auth[1]);
    c.checkRequest(call);
    // The off-domain and malformed results are dropped.
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toMatchObject({
      url: "https://docs.example.com/a",
      title: "Result 0",
      snippet: c.expectSnippet,
      provider,
      callId: "call-1",
    });
    expect(result.sources[0].publishedAt).toBeTruthy();
    if (c.requestId) expect(result.requestId).toBe(c.requestId);
    if (c.credits !== undefined) expect(result.usage?.credits).toBe(c.credits);
  });

  it("refuses to call without a key", async () => {
    const fetch = stub(() => json({}));
    config.keys[provider] = "";
    await expect(
      providerRegistry.execute(c.tool as never, request, "call"),
    ).rejects.toThrow(/credentials are missing/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed responses and never reflects vendor error bodies", async () => {
    config.keys[provider] = key;
    stub(() => json({ unexpected: true }));
    await expect(
      providerRegistry.execute(c.tool as never, request, "call"),
    ).rejects.toEqual(new ProviderError("invalid_response", 200));
    stub(() => new Response(`leaked ${key}`, { status: 429 }));
    const failure = providerRegistry.execute(c.tool as never, request, "call");
    await expect(failure).rejects.toEqual(new ProviderError("http", 429));
    await expect(failure).rejects.not.toThrow(/TEST_ONLY/);
  });

  it("quotes one request at the configured rate", () => {
    config.prices[provider] = 4321;
    const quote = providerRegistry.estimate(c.tool as never, request);
    expect(quote.estimatedMicros).toBe(4321);
    expect(quote.unit).toBe("request");
    expect(quote.pricingSource).toBe(providerEntry(provider)!.pricingSource);
  });
});

describe("empty search responses", () => {
  it.each([
    ["brave_search", { type: "search" }],
    ["serper_search", { searchParameters: { q: "x" } }],
  ])(
    "%s treats a response without a results section as no results",
    async (tool, body) => {
      const provider = providerForTool(tool)!;
      config.keys[provider] = "TEST_ONLY_KEY";
      stub(() => json(body));
      const result = (await providerRegistry.execute(
        tool as never,
        { query: "nothing" },
        "call",
      )) as any;
      expect(result.sources).toEqual([]);
    },
  );
});

describe("Parallel Extract adapter", () => {
  it("requests full content for one URL and reports truncation", async () => {
    config.keys.parallel_extract = "TEST_ONLY_PARALLEL";
    const content = "x".repeat(20001);
    const fetch = stub(() =>
      json({
        extract_id: "extract_1",
        results: [
          {
            url: "https://example.com/a",
            title: "Page",
            excerpts: [],
            full_content: content,
          },
        ],
        errors: [],
        session_id: "s",
      }),
    );
    const result = (await providerRegistry.execute(
      "parallel_extract",
      { url: "https://example.com/a" },
      "call",
    )) as any;
    const call = fetch.mock.calls[0] as Call;
    expect(call[0]).toBe("https://api.parallel.ai/v1/extract");
    expect(headersOf(call)["x-api-key"]).toBe("TEST_ONLY_PARALLEL");
    expect(bodyOf(call)).toEqual({
      urls: ["https://example.com/a"],
      advanced_settings: { full_content: { max_chars_per_result: 20001 } },
    });
    expect(result).toMatchObject({
      title: "Page",
      truncated: true,
      returnedCharacters: 20000,
      requestId: "extract_1",
    });
    expect(result.text).toHaveLength(20000);
  });

  it("records a page Parallel could not read instead of inventing content", async () => {
    config.keys.parallel_extract = "TEST_ONLY_PARALLEL";
    stub(() =>
      json({
        extract_id: "extract_2",
        results: [],
        errors: [
          {
            url: "https://example.com/missing",
            error_type: "fetch_error",
            http_status_code: 404,
            content: null,
          },
        ],
        session_id: "s",
      }),
    );
    const result = (await providerRegistry.execute(
      "parallel_extract",
      { url: "https://example.com/missing" },
      "call",
    )) as any;
    expect(result).toMatchObject({ text: "", pageStatus: 404 });
    stub(() => json({ results: [] }));
    await expect(
      providerRegistry.execute(
        "parallel_extract",
        { url: "https://example.com/a" },
        "call",
      ),
    ).rejects.toEqual(new ProviderError("invalid_response", 200));
  });

  it("shares the Parallel key but keeps its own receipts and settings", () => {
    expect(providerEntry("parallel_extract")!.credentialEnv).toBe(
      providerEntry("parallel")!.credentialEnv,
    );
    expect(providerForTool("parallel_extract")).toBe("parallel_extract");
  });
});

describe("Browserbase Fetch adapter", () => {
  it("fetches Markdown with redirects and reports the page status", async () => {
    config.keys.browserbase = "TEST_ONLY_BROWSERBASE";
    const fetch = stub(() =>
      json({
        id: "fetch_1",
        statusCode: 200,
        headers: {},
        content: "# Page",
        contentType: "text/markdown",
        encoding: "utf-8",
      }),
    );
    const result = (await providerRegistry.execute(
      "browserbase_extract",
      { url: "https://example.com/a" },
      "call",
    )) as any;
    const call = fetch.mock.calls[0] as Call;
    expect(call[0]).toBe("https://api.browserbase.com/v1/fetch");
    expect(headersOf(call)["X-BB-API-Key"]).toBe("TEST_ONLY_BROWSERBASE");
    expect(bodyOf(call)).toEqual({
      url: "https://example.com/a",
      format: "markdown",
      allowRedirects: true,
    });
    expect(result).toMatchObject({
      text: "# Page",
      pageStatus: 200,
      truncated: false,
      requestId: "fetch_1",
    });
  });

  it("refuses non-public URLs and missing keys before any request", async () => {
    const fetch = stub(() => json({ content: "never" }));
    config.keys.browserbase = "TEST_ONLY_BROWSERBASE";
    await expect(
      providerRegistry.execute(
        "browserbase_extract",
        { url: "http://169.254.169.254/latest" },
        "call",
      ),
    ).rejects.toThrow();
    config.keys.browserbase = "";
    await expect(
      providerRegistry.execute(
        "browserbase_extract",
        { url: "https://example.com" },
        "call",
      ),
    ).rejects.toThrow(/credentials are missing/);
    expect(fetch).not.toHaveBeenCalled();
  });
});
