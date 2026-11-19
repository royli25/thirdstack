import { z } from "zod";
import { providerRegistry, registeredToolSchema } from "./provider-adapters.js";
import { adapterRequestFields } from "./provider-registry.js";

export const searchOptions = {
  maxResults: adapterRequestFields.maxResults,
  searchDepth: adapterRequestFields.searchDepth,
};
export const requestDomains = adapterRequestFields.domains;
export const costRequest = z
  .object({ tool: registeredToolSchema, ...adapterRequestFields })
  .strict()
  .superRefine(({ tool, ...request }, ctx) => {
    const parsed = providerRegistry.get(tool).input.safeParse(request);
    if (!parsed.success)
      for (const issue of parsed.error.issues)
        ctx.addIssue({
          code: "custom",
          path: issue.path,
          message: issue.message,
        });
  });
/** Validate and price the exact request using its allowlisted adapter version. */
export function estimateRequest(raw: z.input<typeof costRequest>) {
  const { tool, ...request } = costRequest.parse(raw);
  return providerRegistry.estimate(tool, request);
}
export type RequestEstimate = ReturnType<typeof estimateRequest>;
