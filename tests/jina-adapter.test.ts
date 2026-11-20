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

function stubJina(response: () => Response) {
  const fetch = vi.fn(async (_input: unknown, _init?: RequestInit) =>
    response(),
  );
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
const ok = (data: Record<string, unknown>) =>
  new Response(JSON.stringify({ code: 200, status: 20000, data }), {
    headers: { "x-request-id": "jina-request-1" },
  });

describe("Jina Reader adapter", () => {
  it("is registered from the catalog as an extraction tool with its own credential", () => {
    expect(providerForTool("jina_extract")).toBe("jina");
    expect(providerEntry("jina")?.operation).toBe("extract");
    const adapter = providerRegistry.get("jina_extract");
    expect(adapter.operation).toBe("extract");
    expect(adapter.credential.reference).toBe("JINA_API_KEY");
    config.keys.jina = "";
    expect(providerRegistry.credentialStatus("jina_extract").state).toBe(
      "missing",
    );
  });

  it("sends one authenticated Markdown request and normalizes the page", async () => {
    config.keys.jina = "TEST_ONLY_JINA_KEY";
    const content = "# Page\n\n" + "x".repeat(25000);
    const fetch = stubJina(() =>
      ok({ title: "Example page", content, usage: { tokens: 6123 } }),
    );
    const result = await providerRegistry.execute(
      "jina_extract",
      { url: "https://example.com/article" },
      "call-1",
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetch.mock.calls[0];
    expect(endpoint).toBe("https://r.jina.ai/");
    expect(init?.method).toBe("POST");
    expect(init?.redirect).toBe("error");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer TEST_ONLY_JINA_KEY");
    expect(headers.Accept).toBe("application/json");
    expect(headers["X-Return-Format"]).toBe("markdown");
    expect(headers["X-Retain-Images"]).toBe("none");
    expect(JSON.parse(String(init?.body))).toEqual({
      url: "https://example.com/article",
    });
    expect(result).toMatchObject({
      httpStatus: 200,
      title: "Example page",
      truncated: true,
      originalCharacters: content.length,
      returnedCharacters: 20000,
      credits: 6123,
      requestId: "jina-request-1",
    });
    expect((result as { text: string }).text).toHaveLength(20000);
  });

  it("refuses to call Jina without a key, with search options, or for non-public URLs", async () => {
    const fetch = stubJina(() => ok({ content: "never" }));
    config.keys.jina = "";
    await expect(
      providerRegistry.execute(
        "jina_extract",
        { url: "https://example.com" },
        "call",
      ),
    ).rejects.toThrow(/credentials are missing/);
    config.keys.jina = "TEST_ONLY_JINA_KEY";
    await expect(
      providerRegistry.execute(
        "jina_extract",
        { url: "https://example.com", maxResults: 5 },
        "call",
      ),
    ).rejects.toThrow();
    await expect(
      providerRegistry.execute("jina_extract", { query: "search" }, "call"),
    ).rejects.toThrow();
    await expect(
      providerRegistry.execute(
        "jina_extract",
        { url: "http://127.0.0.1/admin" },
        "call",
      ),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed responses and never reflects vendor error bodies", async () => {
    config.keys.jina = "TEST_ONLY_JINA_KEY";
    stubJina(() => ok({ title: "No content field" }));
    await expect(
      providerRegistry.execute(
        "jina_extract",
        { url: "https://example.com" },
        "call",
      ),
    ).rejects.toEqual(new ProviderError("invalid_response", 200));
    stubJina(
      () => new Response("upstream leaked TEST_ONLY_JINA_KEY", { status: 402 }),
    );
    const failure = providerRegistry.execute(
      "jina_extract",
      { url: "https://example.com" },
      "call",
    );
    await expect(failure).rejects.toEqual(new ProviderError("http", 402));
    await expect(failure).rejects.not.toThrow(/TEST_ONLY/);
  });

  it("reports timeouts as sanitized provider errors", async () => {
    config.keys.jina = "TEST_ONLY_JINA_KEY";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("secret", "TimeoutError");
      }),
    );
    await expect(
      providerRegistry.execute(
        "jina_extract",
        { url: "https://example.com" },
        "call",
      ),
    ).rejects.toEqual(new ProviderError("timeout"));
  });

  it("quotes one page from the configured Jina rate in output tokens", () => {
    config.prices.jina = 500;
    const quote = providerRegistry.estimate("jina_extract", {
      url: "https://example.com",
    });
    expect(quote.estimatedMicros).toBe(500);
    expect(quote.unit).toBe("output tokens");
    expect(quote.pricingSource).toBe(providerEntry("jina")!.pricingSource);
    expect(quote.uncertainty).toMatch(/not yet confirmed/);
  });
});
