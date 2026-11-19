import { providerIds } from "./provider-catalog.js";
/** Shared by live export and the read-only recording viewer. No Node-only imports. */
const scalarFields = [
  "invocationId",
  "provider",
  "policyVersion",
  "rateCardVersion",
  "estimateMicros",
  "chargeType",
  "authMode",
  "billingStatus",
  "httpStatus",
  "pageStatus",
  "evidenceUsable",
  "latencyMs",
  "resultCount",
  "success",
  "pass",
  "usable",
  "returned",
  "taskCriteria",
  "status",
  "evaluator",
] as const;
const reasonAllowlist = new Set([
  "API key not configured",
  "Exceeds remaining budget",
  "Provider rate limit reached",
  "Already attempted for this invocation",
]);
const signalNames = new Set(["cost", "latency", "reliability", "quality"]);
const providers = new Set<string>(providerIds);
export function sanitizedEventData(
  data: Record<string, unknown>,
  type: string,
) {
  const out: Record<string, unknown> = {};
  for (const key of scalarFields) {
    const value = data[key];
    if (
      value === null ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value)) ||
      (typeof value === "string" && value.length <= 150)
    )
      out[key] = value;
  }
  const usage = data.usage as Record<string, unknown> | undefined;
  if (usage && typeof usage === "object") {
    const values = Object.fromEntries(
      ["credits", "providerReportedUsd"]
        .filter(
          (k) =>
            typeof usage[k] === "number" &&
            Number.isFinite(usage[k]) &&
            (usage[k] as number) >= 0,
        )
        .map((k) => [k, usage[k]]),
    );
    if (Object.keys(values).length)
      out.usage = {
        ...values,
        source: "provider response; not a reconciled invoice",
      };
  }
  if (type === "provider_candidates" && Array.isArray(data.candidates))
    out.candidates = data.candidates
      .slice(0, 3)
      .filter((c) => c && providers.has(c.provider))
      .map((c) => ({
        provider: c.provider,
        eligible: c.eligible === true,
        reasons: Array.isArray(c.reasons)
          ? c.reasons.map((r: unknown) =>
              reasonAllowlist.has(String(r)) ? r : "Other eligibility reason",
            )
          : [],
        score:
          typeof c.score === "number" && Number.isFinite(c.score) ? c.score : 0,
        components: Object.fromEntries(
          Object.entries(c.components || {}).filter(
            ([k, v]) =>
              signalNames.has(k) && typeof v === "number" && Number.isFinite(v),
          ),
        ),
        insufficientData: Array.isArray(c.insufficientData)
          ? c.insufficientData.filter((s: string) => signalNames.has(s))
          : [],
      }));
  return out;
}
