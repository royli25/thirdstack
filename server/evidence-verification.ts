import { providerForTool } from "./provider-catalog.js";
import { digest } from "./observation-store.js";
import type { SessionDetail } from "./observation-types.js";

/** Internal consistency only. A party able to rewrite every record can recompute every hash. */
export function verifyPrivateEvidence(value: unknown) {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(message);
  const envelope = value as {
    version?: string;
    session?: SessionDetail;
  } | null;
  if (envelope?.version !== "private-evidence-v1" || !envelope.session)
    return {
      valid: false,
      errors: ["Expected a private-evidence-v1 export with a session."],
      scope: "Internal record consistency; not independent attestation",
    };
  const s = envelope.session;
  try {
    if (!Array.isArray(s.events) || !s.events.length)
      throw new Error("Missing audit events.");
    const intent = {
      objective: s.objective,
      criteria: s.criteria,
      constraints: s.constraints,
      budgetMicros: s.budgetMicros,
    };
    if (digest(intent) !== s.intentHash)
      fail("Accepted intent does not match its fingerprint.");
    let previous = "genesis";
    const eventIds = new Set<number>();
    for (const event of s.events) {
      const { id, hash, ...payload } = event;
      if (eventIds.has(id)) fail("Duplicate audit event ID.");
      eventIds.add(id);
      if (
        payload.sessionId !== s.id ||
        payload.previousHash !== previous ||
        digest(payload) !== hash
      )
        fail(`Audit chain mismatch at event ${id}.`);
      previous = hash;
    }
    const intentEvents = s.events.filter((e) => e.type === "intent_recorded");
    const approvals = s.events.filter((e) => e.type === "intent_approved");
    const authorizations = s.events.filter(
      (e) => e.type === "intent_authorized",
    );
    const backendAuthorized = s.authorizationSource === "backend_policy";
    if (
      intentEvents.length !== 1 ||
      intentEvents[0].data.intentHash !== s.intentHash ||
      digest({
        objective: intentEvents[0].data.objective,
        criteria: intentEvents[0].data.criteria,
        constraints: intentEvents[0].data.constraints,
        budgetMicros: backendAuthorized
          ? authorizations[0]?.data.budgetMicros
          : intentEvents[0].data.budgetMicros,
      }) !== s.intentHash
    )
      fail("Recorded intent event does not match the accepted intent.");
    if (backendAuthorized) {
      const authorization = authorizations[0];
      if (
        !s.approvedAt ||
        approvals.length !== 0 ||
        authorizations.length !== 1 ||
        authorization?.provenance !== "observed" ||
        authorization?.data.authorizationSource !== "backend_policy" ||
        authorization?.data.policy !== "agent-session-budget-v1" ||
        authorization?.data.intentHash !== s.intentHash ||
        authorization?.data.budgetMicros !== s.budgetMicros
      )
        fail("Backend authorization state does not match its policy event.");
    } else if (
      authorizations.length !== 0 ||
      (s.authorizationSource !== undefined &&
        s.authorizationSource !== "workspace_operator") ||
      (s.approvedAt
        ? approvals.length !== 1 ||
          approvals[0].data.intentHash !== s.intentHash
        : approvals.length !== 0)
    )
      fail("Intent approval state does not match its events.");
    const outcomes = s.events.filter((e) => e.type === "outcome_submitted");
    if (outcomes.length !== s.outcomes.length)
      fail("Output version count does not match the audit history.");
    const outputIds = new Set<string>();
    for (const outcome of s.outcomes) {
      if (outputIds.has(outcome.id)) fail("Duplicate output ID.");
      outputIds.add(outcome.id);
      const e = outcomes.find((e) => e.data.outcomeId === outcome.id);
      if (
        !e ||
        e.data.text !== outcome.text ||
        e.data.intentHash !== s.intentHash ||
        digest(e.data.evidenceCallIds) !== digest(outcome.evidenceCallIds)
      )
        fail(`Output ${outcome.id} differs from its recorded submission.`);
    }
    const reviews = s.events.filter((e) => e.type === "outcome_evaluated");
    if (reviews.length !== s.evaluations.length)
      fail("Evaluation count does not match the audit history.");
    const evaluationIds = new Set<string>();
    for (const review of s.evaluations) {
      if (evaluationIds.has(review.id)) fail("Duplicate evaluation ID.");
      evaluationIds.add(review.id);
      const e = reviews.find((e) => e.data.id === review.id);
      if (!e) {
        fail(`Evaluation ${review.id} has no recorded event.`);
        continue;
      }
      const { reviewerIdentity: _identity, ...recorded } = e.data;
      if (
        digest(recorded) !== digest(review) ||
        !outputIds.has(review.outcomeId) ||
        review.intentHash !== s.intentHash
      )
        fail(`Evaluation ${review.id} differs from its recorded review.`);
    }
    const called = s.events.filter((e) => e.type === "tool_called");
    if (called.length !== s.calls.length)
      fail("Tool call count does not match the audit history.");
    const callIds = new Set<string>();
    let spentMicros = 0,
      reservedMicros = 0;
    for (const call of s.calls) {
      if (callIds.has(call.id)) fail("Duplicate tool call ID.");
      callIds.add(call.id);
      if (call.status === "running") reservedMicros += call.estimateMicros;
      else spentMicros += call.estimateMicros;
      if (providerForTool(call.tool) !== call.provider)
        fail(`Tool call ${call.id} has an inconsistent provider.`);
      const e = called.find((e) => e.data.callId === call.id);
      if (
        !e ||
        call.sessionId !== s.id ||
        e.data.tool !== call.tool ||
        e.data.estimateMicros !== call.estimateMicros ||
        digest(e.data.arguments) !== digest(call.arguments)
      )
        fail(`Tool call ${call.id} differs from its recorded request.`);
      const result = s.events.find(
        (e) => e.type === "tool_result" && e.data.callId === call.id,
      );
      if (call.status === "succeeded" || call.status === "failed") {
        if (
          !result ||
          result.data.status !== call.status ||
          digest(result.data.result) !== digest(call.result ?? null) ||
          result.data.httpStatus !== (call.httpStatus ?? null) ||
          result.data.latencyMs !== call.latencyMs ||
          result.data.error !== (call.error ?? null)
        )
          fail(`Tool call ${call.id} differs from its recorded result.`);
      } else if (call.status === "interrupted") {
        if (
          !s.events.some(
            (e) => e.type === "call_interrupted" && e.data.callId === call.id,
          )
        )
          fail(`Interrupted call ${call.id} has no interruption event.`);
      } else if (call.status !== "running" || result)
        fail(`Tool call ${call.id} has inconsistent execution state.`);
      const explanation = s.events.find(
        (e) => e.type === "selection_explanation" && e.data.callId === call.id,
      );
      if ((explanation?.data.text || "") !== call.statedReason)
        fail(`Tool call ${call.id} has an inconsistent stated explanation.`);
    }
    if (
      spentMicros !== s.spentMicros ||
      reservedMicros !== s.reservedMicros ||
      spentMicros + reservedMicros > s.budgetMicros
    )
      fail("Estimated budget ledger does not match the recorded calls.");
    for (const o of s.outcomes)
      if (o.evidenceCallIds.some((id) => !callIds.has(id)))
        fail(`Output ${o.id} references missing evidence.`);
    for (const e of s.evaluations)
      for (const c of e.criteria)
        if (c.evidenceCallIds.some((id) => !callIds.has(id)))
          fail(`Evaluation ${e.id} references missing evidence.`);
    const cases = s.events.filter((e) => e.type === "review_case_opened");
    if (cases.length !== s.cases.length)
      fail("Review case count does not match the audit history.");
    const caseIds = new Set<string>();
    for (const c of s.cases) {
      if (caseIds.has(c.id)) fail("Duplicate review case ID.");
      caseIds.add(c.id);
      const open = cases.find((e) => e.data.id === c.id);
      if (
        !open ||
        open.data.reason !== c.reason ||
        open.data.evaluationId !== c.evaluationId ||
        !evaluationIds.has(c.evaluationId)
      )
        fail(`Case ${c.id} differs from its recorded opening.`);
      const closed = s.events.filter(
        (e) => e.type === "review_case_closed" && e.data.caseId === c.id,
      );
      if (
        c.status === "open"
          ? closed.length !== 0
          : closed.length !== 1 ||
            closed[0].data.status !== c.status ||
            closed[0].data.resolution !== c.resolution
      )
        fail(`Case ${c.id} differs from its recorded resolution.`);
    }
    const consent =
      s.events
        .filter((e) =>
          ["sharing_consent_changed", "sharing_policy_applied"].includes(
            e.type,
          ),
        )
        .at(-1)?.data.commercialConsent ?? false;
    if (consent !== s.commercialConsent)
      fail("Sharing preference differs from its last recorded event.");
    const policyEvent = s.events
      .filter((e) => e.type === "sharing_policy_applied")
      .at(-1);
    if (policyEvent?.data.policy !== s.sharingPolicy)
      fail("Sharing policy differs from its recorded policy event.");
  } catch {
    fail("The export is incomplete or contains malformed records.");
  }
  return {
    valid: errors.length === 0,
    sessionId: s.id,
    checkedAt: new Date().toISOString(),
    errors,
    scope:
      "Intent fingerprint, audit chain, and linked record consistency; not independent attestation, source truth, or verified identity",
  };
}
