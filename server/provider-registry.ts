import { providerEnabled } from "./config.js";
import { createHmac, randomBytes } from "node:crypto";
import { z } from "zod";
import { ProviderError, search, scrape } from "./providers.js";
import { publicEvidenceUrl } from "./url-policy.js";

export const adapterRequestFields = {
  query: z.string().trim().min(1).max(500).optional(),
  url: z.string().url().max(2048).optional(),
  domains: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
    )
    .max(10)
    .default([]),
  maxResults: z.number().int().min(1).max(20).optional(),
  searchDepth: z.enum(["basic", "advanced"]).optional(),
};
export type AdapterRequest = z.infer<ReturnType<typeof requestSchema>>;
function requestSchema() {
  return z.object(adapterRequestFields).strict();
}
export interface AdapterCapabilities {
  description: string;
  useWhen: string;
  limitations: string;
  documentationUrl: string;
  adapter: Record<string, string | number | boolean>;
}
export interface AdapterQuote {
  estimatedMicros: number;
  breakdown: string;
  rates: { baseMicros: number; additionalResultMicros?: number };
  units: number | null;
  unit: string;
  rateCardVersion: string;
  pricingSource: string;
  pricingCheckedAt: string;
  basis: string;
  uncertainty: string;
}
export type ProviderTransports = {
  search: typeof search;
  scrape: typeof scrape;
};
export interface AdapterDefinition<
  Tool extends string = string,
  Provider extends string = string,
> {
  tool: Tool;
  provider: Provider;
  version: string;
  environment: "production" | "fixture";
  operation: "search" | "extract";
  pageText: boolean;
  searchDepth: boolean;
  capabilities: AdapterCapabilities;
  credential: {
    reference: string;
    resolve: () => string;
    revoked?: () => boolean;
    accountReference?: () => string | undefined;
  };
  input: z.ZodType<AdapterRequest, unknown>;
  result: z.ZodType<Record<string, unknown>, unknown>;
  estimate: (request: AdapterRequest) => AdapterQuote;
  mappingNotes: (request: AdapterRequest) => string[];
  execute: (
    request: AdapterRequest,
    context: { callId: string; transports: ProviderTransports },
  ) => Promise<unknown>;
}
const revisionKey = randomBytes(32);

/** Code-owned allowlist. Never accepts executable definitions from API callers. */
export class AdapterRegistry<
  Tool extends string = string,
  Provider extends string = string,
> {
  private readonly entries: ReadonlyMap<
    Tool,
    AdapterDefinition<Tool, Provider>
  >;
  constructor(
    definitions: readonly AdapterDefinition<Tool, Provider>[],
    environment: "production" | "fixture" = "production",
  ) {
    const entries = new Map<Tool, AdapterDefinition<Tool, Provider>>();
    for (const definition of definitions) {
      if (
        !/^[a-z][a-z0-9_]{1,79}$/.test(definition.tool) ||
        !/^[a-z][a-z0-9_-]{1,79}$/.test(definition.provider) ||
        !/^\d+\.\d+\.\d+$/.test(definition.version)
      )
        throw new Error("Invalid adapter identity or version.");
      if (entries.has(definition.tool))
        throw new Error("Duplicate adapter tool.");
      if (
        environment === "production" &&
        definition.environment !== "production"
      )
        throw new Error(
          "Fixture adapters cannot enter the production registry.",
        );
      entries.set(
        definition.tool,
        Object.freeze({
          ...definition,
          capabilities: Object.freeze({
            ...definition.capabilities,
            adapter: Object.freeze({ ...definition.capabilities.adapter }),
          }),
          credential: Object.freeze({ ...definition.credential }),
        }),
      );
    }
    this.entries = entries;
  }
  list() {
    return [...this.entries.values()];
  }
  get(tool: Tool) {
    const adapter = this.entries.get(tool);
    if (!adapter) throw new Error("Adapter is not allowlisted.");
    return adapter;
  }
  forProvider(provider: Provider) {
    const adapter = this.list().find((a) => a.provider === provider);
    if (!adapter) throw new Error("Provider is not allowlisted.");
    return adapter;
  }
  credentialStatus(tool: Tool) {
    const adapter = this.get(tool);
    const value = adapter.credential.resolve();
    const state = adapter.credential.revoked?.()
      ? "revoked"
      : !value
        ? "missing"
        : value.length > 4096 || /\s/.test(value)
          ? "invalid"
          : "configured";
    return {
      reference: adapter.credential.reference,
      state,
      configured: state === "configured",
      enabled: providerEnabled(adapter.provider),
      revision:
        state === "configured"
          ? createHmac("sha256", revisionKey)
              .update(value)
              .digest("hex")
              .slice(0, 16)
          : null,
      remotelyVerified: false as const,
    };
  }
  accountReference(tool: Tool) {
    const value = this.get(tool).credential.accountReference?.();
    return value && /^[a-zA-Z0-9._:-]{1,120}$/.test(value) ? value : undefined;
  }
  parse(tool: Tool, raw: unknown) {
    const request = this.get(tool).input.parse(raw);
    if (request.url) request.url = publicEvidenceUrl(request.url);
    return request;
  }
  estimate(tool: Tool, raw: unknown) {
    const adapter = this.get(tool);
    const request = this.parse(tool, raw);
    const quote = adapter.estimate(request);
    if (
      !Number.isSafeInteger(quote.estimatedMicros) ||
      quote.estimatedMicros < 0
    )
      throw new Error("Invalid adapter estimate.");
    return {
      tool,
      request: { tool, ...request },
      ...quote,
      adapterVersion: adapter.version,
    };
  }
  snapshot(tool: Tool) {
    const adapter = this.get(tool);
    return {
      tool,
      provider: adapter.provider,
      version: adapter.version,
      operation: adapter.operation,
      settings: { ...adapter.capabilities.adapter },
    };
  }
  async execute(
    tool: Tool,
    raw: unknown,
    callId: string,
    transports: ProviderTransports = { search, scrape },
  ) {
    const adapter = this.get(tool);
    const request = this.parse(tool, raw);
    if (!this.credentialStatus(tool).configured)
      throw new Error("Provider credentials are missing, invalid or revoked.");
    if (!providerEnabled(adapter.provider))
      throw new Error("Provider is disabled or unavailable.");
    const result = await adapter.execute(request, { callId, transports });
    const parsed = adapter.result.safeParse(result);
    if (!parsed.success) throw new ProviderError("invalid_response");
    return parsed.data;
  }
}

export function adapterInput(operation: "search" | "extract", depth = false) {
  return requestSchema().superRefine((r, ctx) => {
    if (
      operation === "extract"
        ? !r.url || r.query !== undefined
        : !r.query || r.url !== undefined
    )
      ctx.addIssue({
        code: "custom",
        message: "Search requires a query; extraction requires a URL.",
      });
    if (
      operation === "extract" &&
      (r.maxResults !== undefined ||
        r.searchDepth !== undefined ||
        r.domains.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Search options do not apply to extraction.",
      });
    if (!depth && r.searchDepth !== undefined)
      ctx.addIssue({
        code: "custom",
        message: "searchDepth is not supported by this tool.",
      });
  });
}
