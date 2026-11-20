import type { ObservedCall } from "./observation-types.js";

/**
 * Rules shared by the shadow wallet and the enforced wallet, so simulated and
 * enforced accounting cannot drift apart.
 */

/** The one fixed-cost configuration with a verifiable rate: Tavily basic search, 10 results. */
export function fixedCostTavilyCall(
  call: ObservedCall,
  providerCredential: string,
) {
  return (
    call.tool === "tavily_search" &&
    (call.arguments.searchDepth ?? "basic") === "basic" &&
    (call.arguments.maxResults ?? 10) === 10 &&
    !!call.providerAccountReference &&
    !!providerCredential &&
    call.adapter?.version === "1.0.0"
  );
}

export type HoldOutcome = "posted" | "failed" | "interrupted" | "cost_conflict";

/**
 * Classifies a finished call. Only a succeeded call whose reported quantity
 * does not contradict the frozen one-credit rate is billable. A malformed
 * reported quantity is a conflict and is stored as null, so a bad provider
 * value can never fail settlement.
 */
export function holdOutcome(call: ObservedCall): {
  outcome: HoldOutcome;
  providerRequestId: string | null;
  reportedCredits: number | null;
} {
  const reported = (call.result?.usage as { credits?: unknown } | undefined)
    ?.credits;
  const providerRequestId = call.result?.requestId;
  return {
    outcome:
      call.status === "interrupted"
        ? "interrupted"
        : call.status !== "succeeded"
          ? "failed"
          : reported !== undefined && reported !== 1
            ? "cost_conflict"
            : "posted",
    providerRequestId:
      typeof providerRequestId === "string" && providerRequestId.length
        ? providerRequestId.slice(0, 200)
        : null,
    reportedCredits:
      typeof reported === "number" && Number.isFinite(reported) && reported >= 0
        ? reported
        : null,
  };
}

/**
 * The single entry that converges a deposit on its verified net amount, or
 * null when nothing changed. A dispute always posts its (once-only) hold.
 */
export function depositPosting(
  currentMicros: number,
  targetMicros: number,
  disputed: boolean,
): { kind: "deposit" | "refund" | "dispute_hold"; deltaMicros: number } | null {
  const deltaMicros = targetMicros - currentMicros;
  if (!deltaMicros && !disputed) return null;
  return {
    kind: disputed ? "dispute_hold" : deltaMicros < 0 ? "refund" : "deposit",
    deltaMicros,
  };
}
