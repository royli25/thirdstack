import { createHash } from "node:crypto";
import type { ObservedCall } from "./observation-types.js";
import type { Store } from "./store.js";
import {
  depositPosting,
  fixedCostTavilyCall,
  holdOutcome,
} from "./wallet-rules.js";

const markupBps = 1000;
const basisPoints = 10_000;

export function shadowWalletPrice(providerCostMicros: number) {
  if (
    !Number.isSafeInteger(providerCostMicros) ||
    providerCostMicros < 0 ||
    providerCostMicros > 10_000_000
  )
    throw new Error("Invalid shadow provider cost.");
  const markupMicros = Math.floor(
    (providerCostMicros * markupBps + basisPoints / 2) / basisPoints,
  );
  return {
    markupBps,
    markupMicros,
    totalMicros: providerCostMicros + markupMicros,
    maximumMicros: Math.ceil(
      (providerCostMicros * (basisPoints + markupBps)) / basisPoints,
    ),
  };
}

/** Private rate binding. A provider credential change requires re-verification. */
export function shadowWalletCredentialDigest(credential: string) {
  return createHash("sha256")
    .update("two-hands-shadow-tavily-v1\0")
    .update(credential)
    .digest("hex");
}

export class ShadowWallet {
  constructor(private readonly store: Store) {}

  /** Runs inside the same workspace transaction that creates the call receipt. */
  async recordAdmission(call: ObservedCall, providerCredential: string) {
    const { db, actorScope } = this.store;
    const actor = actorScope.getStore();
    if (
      process.env.TWO_HANDS_SHADOW_WALLET !== "true" ||
      db.dialect !== "postgres" ||
      actor?.kind !== "api_key" ||
      actor.id !== call.apiKeyId ||
      !fixedCostTavilyCall(call, providerCredential)
    )
      return false;

    const rate = await db
      .prepare(
        `SELECT rate_version, provider_account, provider_cost_micros, verified_at, expires_at
       FROM shadow_wallet_rates
       WHERE workspace_id=current_setting('octolab.workspace_id')
           AND provider_account=? AND credential_digest=?
         AND verified_at<=now() AND expires_at>now()`,
      )
      .get(
        call.providerAccountReference!,
        shadowWalletCredentialDigest(providerCredential),
      );
    if (!rate) return false;

    const base = Number(rate.provider_cost_micros);
    const { markupBps, markupMicros, maximumMicros } = shadowWalletPrice(base);
    const balance = await db
      .prepare(
        `SELECT (SELECT COALESCE(sum(wallet_micros),0) FROM shadow_wallet_journal
                 WHERE workspace_id=current_setting('octolab.workspace_id'))
           + (SELECT COALESCE(sum(wallet_micros),0) FROM shadow_wallet_sandbox_entries
                 WHERE workspace_id=current_setting('octolab.workspace_id'))
           - (SELECT COALESCE(sum(h.maximum_micros),0) FROM shadow_wallet_holds h
              WHERE h.workspace_id=current_setting('octolab.workspace_id')
                AND h.admitted AND NOT EXISTS (
                SELECT 1 FROM shadow_wallet_closures c WHERE c.workspace_id=h.workspace_id AND c.call_id=h.call_id
              )) >= ?
           AND NOT EXISTS (
             SELECT 1 FROM shadow_wallet_sandbox_entries e
             WHERE e.workspace_id=current_setting('octolab.workspace_id') AND e.kind='dispute_hold'
           ) AS admitted`,
      )
      .get(maximumMicros);

    const admitted = balance?.admitted === true;
    // A shadow refusal records what would have happened without changing existing admission.
    await db
      .prepare(
        `INSERT INTO shadow_wallet_holds
       (call_id,key_id,tool,search_depth,max_results,adapter_version,provider_account,
        rate_version,rate_verified_at,rate_expires_at,provider_cost_micros,markup_bps,markup_micros,maximum_micros,admitted)
       VALUES (?,?,'tavily_search','basic',10,?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        call.id,
        call.apiKeyId ?? null,
        call.adapter!.version,
        rate.provider_account,
        rate.rate_version,
        rate.verified_at,
        rate.expires_at,
        base,
        markupBps,
        markupMicros,
        maximumMicros,
        admitted,
      );
    return admitted;
  }

  /** Enroll new checkout intents in the sandbox mirror inside their creation transaction. */
  async enrollSandboxDeposit(depositId: string) {
    const { db } = this.store;
    if (
      process.env.TWO_HANDS_SHADOW_WALLET !== "true" ||
      process.env.TWO_HANDS_SHADOW_STRIPE_SANDBOX !== "true" ||
      db.dialect !== "postgres"
    )
      return;
    await db
      .prepare(
        `
      INSERT INTO shadow_wallet_sandbox_deposits(deposit_id)
      SELECT ? WHERE EXISTS (
        SELECT 1 FROM shadow_wallet_rates
        WHERE workspace_id=current_setting('octolab.workspace_id')
          AND verified_at<=now() AND expires_at>now()
      )
    `,
      )
      .run(depositId);
  }

  /** Mirrors a confirmed test-mode reconciliation without changing real balances. */
  async reconcileSandboxDeposit(
    depositId: string,
    paymentIntentId: string,
    targetMicros: number,
    disputed: boolean,
  ) {
    const { db } = this.store;
    if (db.dialect !== "postgres") return;
    const enrollment = await db
      .prepare(
        `
      SELECT EXISTS(SELECT 1 FROM shadow_wallet_sandbox_deposits WHERE deposit_id=?) AS enrolled,
             COALESCE(sum(wallet_micros),0) AS current,
             COALESCE(max(revision),0)+1 AS next_revision
      FROM shadow_wallet_sandbox_entries WHERE deposit_id=?
    `,
      )
      .get(depositId, depositId);
    if (!enrollment?.enrolled) return;
    const posting = depositPosting(
      Number(enrollment.current),
      targetMicros,
      disputed,
    );
    if (!posting) return;
    await db
      .prepare(
        `
      INSERT INTO shadow_wallet_sandbox_entries
       (deposit_id,revision,payment_intent_id,kind,target_micros,wallet_micros)
      VALUES (?,?,?,?,?,?)
      ON CONFLICT (workspace_id,deposit_id,dispute_marker) DO NOTHING
    `,
      )
      .run(
        depositId,
        enrollment.next_revision,
        paymentIntentId,
        posting.kind,
        targetMicros,
        posting.deltaMicros,
      );
  }

  /** Closes a committed hold even after the pilot flag or rate is turned off. */
  async close(call: ObservedCall) {
    const { db } = this.store;
    if (db.dialect !== "postgres") return;
    const hold = await db
      .prepare(
        `SELECT h.admitted, h.total_micros
       FROM shadow_wallet_holds h WHERE h.workspace_id=current_setting('octolab.workspace_id')
           AND h.call_id=? AND NOT EXISTS (
         SELECT 1 FROM shadow_wallet_closures c WHERE c.workspace_id=h.workspace_id AND c.call_id=h.call_id
       )`,
      )
      .get(call.id);
    if (!hold?.admitted) return;

    const { outcome, providerRequestId, reportedCredits } = holdOutcome(call);
    await db
      .prepare(
        "INSERT INTO shadow_wallet_closures(call_id,outcome,provider_request_id,reported_credits) VALUES (?,?,?,?)",
      )
      .run(call.id, outcome, providerRequestId, reportedCredits);
    if (outcome === "posted")
      await db
        .prepare(
          "INSERT INTO shadow_wallet_journal(source_id,kind,wallet_micros) VALUES (?,'usage',?)",
        )
        .run(call.id, -Number(hold.total_micros));
  }
}
