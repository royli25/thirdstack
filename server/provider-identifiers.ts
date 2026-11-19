import {
  providerCatalog,
  providerToolNames,
  type CatalogProviderId,
  type CatalogToolName,
} from "./provider-catalog.js";

/** Stable public identifiers, derived from provider-catalog.ts. */
export const providerTools = Object.fromEntries(
  providerCatalog.map((p) => [p.tool, p.id]),
) as { [E in (typeof providerCatalog)[number] as E["tool"]]: E["id"] };
export type RegisteredToolName = CatalogToolName;
export type RegisteredProviderId = CatalogProviderId;
export const toolIdentifiers = providerToolNames;
