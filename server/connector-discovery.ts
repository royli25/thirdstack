/**
 * Discovery for company connector tools.
 *
 * Built-in providers are matched on structured operations (search a query,
 * extract a URL). Connector tools have arbitrary input schemas, so they are
 * matched on the words of the agent's stated need against the tool's name,
 * title, description and input field names. Matching is deterministic and
 * explainable: every candidate carries the terms that matched. It is a lexical
 * shortlist for the agent to assess, not a semantic judgement of fit.
 */
import type { ApprovedConnectorTool } from "./connectors.js";
import type { ObservedCall } from "./observation-types.js";
import {
  deniedMessage,
  operatorAllows,
  type OperatorAllowance,
} from "./account-allowance.js";

export const CONNECTOR_MATCHING = "connector-lexical-v1" as const;
/** Most connector candidates returned for one discovery. */
export const CONNECTOR_OFFER_LIMIT = 10;

const stopwords = new Set(
  (
    "a an and are as at be by can could do does for from get give has have how i if in " +
    "into is it its me my need needs of on or our please should so some than that the " +
    "their them then there these this to tool tools use using want was we what when " +
    "where which while who why will with would you your about across after all also any " +
    "find show tell look check make let current"
  ).split(" "),
);

function stem(word: string) {
  if (word.length > 5 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && word.endsWith("es") && !word.endsWith("ses"))
    return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss"))
    return word.slice(0, -1);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  return word;
}

/** Lowercased, stemmed content words; splits snake_case and camelCase. */
export function terms(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || stopwords.has(raw) || /^\d+$/.test(raw)) continue;
    out.add(stem(raw));
  }
  return out;
}

function schemaFields(schema: Record<string, unknown>): string[] {
  const props = schema.properties;
  if (!props || typeof props !== "object") return [];
  return Object.entries(props as Record<string, any>).flatMap(([name, p]) => [
    name,
    typeof p?.description === "string" ? p.description : "",
  ]);
}

export type ConnectorOfferStatus =
  "eligible" | "disabled" | "unavailable" | "over_budget";

export interface ConnectorOffer {
  tool: string;
  connector: string;
  company: string;
  title: string | null;
  description: string;
  descriptionSource: "company_supplied";
  inputSchema: Record<string, unknown>;
  schemaHash: string;
  estimatedMicros: number;
  status: ConnectorOfferStatus;
  reason: string;
  relevance: {
    score: number;
    matchedTerms: string[];
    basis: typeof CONNECTOR_MATCHING;
  };
  reputation: {
    organic: {
      completedCalls: number;
      succeeded: number;
      failed: number;
      medianLatencyMs: number | null;
      successRate: number | null;
      minimumSamples: number;
      scope: string;
    };
  };
}

export interface ConnectorMatchInput {
  need: string;
  context?: { requirements?: string; evidenceGaps?: string[] } | null;
  /** Free text from structured operations, such as search queries. */
  operationText?: string[];
}

export interface ConnectorMatchOptions {
  remainingMicros: number;
  allowance: OperatorAllowance;
  /** False when the caller's API key may not reach third-party servers. */
  keyAllowsConnectors: boolean;
  /** Recorded calls across the account, used for organic reputation. */
  calls: ObservedCall[];
}

const MIN_SAMPLES = 5;

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Ranks approved connector tools against the stated need. Returns only tools
 * that share at least one content term with the need, best first.
 */
export function matchConnectorTools(
  input: ConnectorMatchInput,
  approved: ApprovedConnectorTool[],
  options: ConnectorMatchOptions,
): { offers: ConnectorOffer[]; considered: number; withheld: number } {
  const need = terms(
    [
      input.need,
      input.context?.requirements ?? "",
      ...(input.context?.evidenceGaps ?? []),
      ...(input.operationText ?? []),
    ].join(" "),
  );
  const scored = approved
    .map((entry) => {
      const { tool } = entry;
      // The company name is shared by every tool on a connector, so it cannot
      // tell one tool from another and is deliberately not matched.
      const strong = terms(`${tool.name} ${tool.title ?? ""}`);
      const weak = terms(
        `${tool.description} ${schemaFields(tool.inputSchema).join(" ")}`,
      );
      const matched = [...need].filter((t) => strong.has(t) || weak.has(t));
      const score = matched.reduce((n, t) => n + (strong.has(t) ? 2 : 1), 0);
      return { entry, matched, score };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.entry.tool.estimateMicros - b.entry.tool.estimateMicros ||
        a.entry.tool.exposedName.localeCompare(b.entry.tool.exposedName),
    );
  const offers = scored
    .slice(0, CONNECTOR_OFFER_LIMIT)
    .map(({ entry, matched, score }): ConnectorOffer => {
      const { tool } = entry;
      const samples = options.calls.filter(
        (c) =>
          c.connector?.slug === entry.slug &&
          c.connector.tool === tool.name &&
          (c.status === "succeeded" || c.status === "failed"),
      );
      const succeeded = samples.filter((c) => c.status === "succeeded").length;
      const enough = samples.length >= MIN_SAMPLES;
      const estimate = tool.estimateMicros;
      const [status, reason]: [ConnectorOfferStatus, string] =
        !options.keyAllowsConnectors
          ? [
              "disabled",
              "Not allowed by this API key. Company connector tools need a key that allows every tool.",
            ]
          : !operatorAllows(options.allowance, estimate)
            ? ["unavailable", deniedMessage(options.allowance)]
            : estimate > options.remainingMicros
              ? [
                  "over_budget",
                  "The approved per-call estimate exceeds the remaining session budget.",
                ]
              : [
                  "eligible",
                  "Approved company tool whose description shares terms with the stated need. Check its input schema before calling.",
                ];
      return {
        tool: tool.exposedName,
        connector: entry.slug,
        company: entry.connectorName,
        title: tool.title ?? null,
        description: tool.description,
        descriptionSource: "company_supplied" as const,
        inputSchema: tool.inputSchema,
        schemaHash: tool.schemaHash,
        estimatedMicros: estimate,
        status,
        reason,
        relevance: {
          score,
          matchedTerms: matched.sort(),
          basis: CONNECTOR_MATCHING,
        },
        reputation: {
          organic: {
            completedCalls: samples.length,
            succeeded,
            failed: samples.length - succeeded,
            medianLatencyMs: enough
              ? median(samples.map((c) => c.latencyMs ?? 0))
              : null,
            successRate: enough ? succeeded / samples.length : null,
            minimumSamples: MIN_SAMPLES,
            scope:
              "Completed calls to this tool across this account. Rates need at least five samples. A successful call does not mean a useful answer.",
          },
        },
      };
    });
  return {
    offers,
    considered: approved.length,
    withheld: Math.max(0, scored.length - offers.length),
  };
}
