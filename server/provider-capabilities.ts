import { providerRegistry } from "./provider-adapters.js";

export const toolCapabilities = Object.fromEntries(
  providerRegistry.list().map((a) => [
    a.tool,
    {
      ...a.capabilities,
      adapter: { ...a.capabilities.adapter, version: a.version },
    },
  ]),
) as unknown as Record<
  import("./observation-types.js").ToolName,
  import("./provider-registry.js").AdapterCapabilities
>;

export const providerSelectionGuidance =
  "Before choosing a provider, call discover_tools with provider-neutral operations: operation, exact query or URL, result count, required content, and relevant options. Include task-relevant requirements and evidence gaps; recorded intent is included automatically. Two Hands matches suitable tools and returns comparable request estimates, mapping differences, availability, and evidence-backed reputation. Compare requestEstimates and withinBudget, not generic defaults; re-discover when the request changes. searchDepth configures Tavily only; Exa uses auto mode and equal retrieval depth or quality is not implied. Choose the tool yourself and provide a brief statedReason on every call. Historical usage counts reflect prior selection, not quality; zero calls means unmeasured, not poor. Organic execution, linked outcome reviews, and controlled samples are separate evidence sources. Do not force provider exploration during a consumer task. Controlled comparisons belong in the backend lab. For a simple recommendation, start with one focused search, inspect evidence, and extract only pages needed to resolve material gaps. Add a call only for a specific unresolved need and stop when the answer is supported. Decision summaries are agent-reported, never private reasoning.";
