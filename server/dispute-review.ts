import { PostgresDatabase } from "./database.js";
import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { FundingError } from "./funding.js";
import type { StripeDeposit } from "./funding-types.js";
import type { StripeFundingService } from "./stripe-funding.js";
export type DisputeReviewStatus = "needs_review" | "in_review" | "reviewed";
export interface DisputeReviewCase {
  payment: StripeDeposit;
  revision: number;
  reviewStatus: DisputeReviewStatus;
  evidenceFingerprint: string;
  evidenceChanged: boolean;
  note: string;
  reviewedAt: string | null;
  actor: string | null;
  holdRetained: true;
}
export interface DisputeReviewEvent {
  id: string;
  createdAt: string;
  actor: string;
  status: DisputeReviewStatus;
  previousStatus: DisputeReviewStatus;
  revision: number;
  note: string;
  evidenceFingerprint: string;
  evidence: StripeDeposit;
}
export interface DisputeReviewDetail {
  item: DisputeReviewCase;
  history: DisputeReviewEvent[];
}
export interface DisputeReviewQueue {
  items: DisputeReviewCase[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<DisputeReviewStatus, number>;
}
export const reviewInput = z
  .object({
    requestKey: z.uuid(),
    revision: z.number().int().nonnegative(),
    evidenceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(["needs_review", "in_review", "reviewed"]),
    note: z
      .string()
      .trim()
      .min(10, "Add a review note of at least 10 characters.")
      .max(4000),
  })
  .strict();
const hash = (v: unknown) =>
  createHash("sha256").update(JSON.stringify(v)).digest("hex");
function fingerprint(p: StripeDeposit) {
  return hash({
    id: p.id,
    amountCents: p.amountCents,
    paymentIntentId: p.paymentIntentId,
    chargeId: p.chargeId,
    refundedCents: p.refundedCents,
    disputed: p.disputed,
    netCreditUnits: p.netCreditUnits,
    status: p.status,
  });
}
/** Operator workflow only. It cannot restore credits or change Stripe's dispute outcome. */
export class DisputeReviewService {
  constructor(
    public stripe: StripeFundingService,
    private now = () => new Date().toISOString(),
  ) {}
  async forPayment<T>(id: string, action: () => Promise<T>): Promise<T> {
    const store = this.stripe.funding.store;
    if (!(store.db instanceof PostgresDatabase)) return action();
    const matches = await store.db.pool.query<{ workspace_id: string }>(
      "SELECT workspace_id FROM octolab.stripe_deposits WHERE id=$1 LIMIT 2",
      [id],
    );
    if (matches.rows.length !== 1)
      throw new FundingError(
        matches.rows.length ? 409 : 404,
        "Payment could not be uniquely identified.",
      );
    return store.scope.run(matches.rows[0].workspace_id, action);
  }
  async get(id: string): Promise<DisputeReviewCase> {
    const payment = await this.stripe.get(id);
    if (!payment.disputed)
      throw new FundingError(404, "No dispute review exists for this payment.");
    const row = await this.stripe.funding.store.db
      .prepare("SELECT body FROM funding_dispute_reviews WHERE deposit_id=?")
      .get(id);
    const saved = row
      ? (JSON.parse(String(row.body)) as DisputeReviewCase)
      : undefined;
    const evidenceFingerprint = fingerprint(payment);
    const evidenceChanged =
      !!saved && saved.evidenceFingerprint !== evidenceFingerprint;
    return {
      payment,
      revision: saved?.revision ?? 0,
      reviewStatus: evidenceChanged
        ? "needs_review"
        : (saved?.reviewStatus ?? "needs_review"),
      evidenceFingerprint,
      evidenceChanged,
      note: saved?.note ?? "",
      reviewedAt: saved?.reviewedAt ?? null,
      actor: saved?.actor ?? null,
      holdRetained: true,
    };
  }
  async detail(id: string): Promise<DisputeReviewDetail> {
    const item = await this.get(id);
    const history = (
      await this.stripe.funding.store.db
        .prepare(
          "SELECT body FROM funding_dispute_review_events WHERE deposit_id=? ORDER BY rowid DESC LIMIT 100",
        )
        .all(id)
    ).map((r) => JSON.parse(String(r.body)) as DisputeReviewEvent);
    return { item, history };
  }
  async list(
    status = "all",
    query = "",
    page = 1,
  ): Promise<DisputeReviewQueue> {
    const store = this.stripe.funding.store;
    let cases: DisputeReviewCase[];
    if (store.db instanceof PostgresDatabase) {
      const rows = await store.db.pool.query<{
        id: string;
        workspace_id: string;
      }>(
        "SELECT id,workspace_id FROM octolab.stripe_deposits WHERE body::jsonb->'disputed'='true'::jsonb ORDER BY rowid DESC",
      );
      cases = [];
      for (const row of rows.rows)
        cases.push(
          await store.scope.run(row.workspace_id, () => this.get(row.id)),
        );
    } else {
      cases = await Promise.all(
        (
          await this.stripe.funding.store.db
            .prepare(
              "SELECT id FROM stripe_deposits WHERE json_extract(body,'$.disputed')=1 ORDER BY rowid DESC",
            )
            .all()
        ).map(async (r) => await this.get(String(r.id))),
      );
    }
    const counts = { needs_review: 0, in_review: 0, reviewed: 0 };
    for (const item of cases) counts[item.reviewStatus]++;
    const q = query.toLowerCase();
    const matching = cases.filter(
      (c) =>
        (status === "all" || c.reviewStatus === status) &&
        (!q ||
          `${c.payment.id} ${c.payment.paymentIntentId} ${c.payment.chargeId} ${c.note}`
            .toLowerCase()
            .includes(q)),
    );
    return {
      items: matching.slice((page - 1) * 25, page * 25),
      total: matching.length,
      page,
      pageSize: 25,
      counts,
    };
  }
  async review(
    id: string,
    raw: unknown,
    actor: string,
  ): Promise<DisputeReviewDetail> {
    const input = reviewInput.parse(raw);
    const inputHash = hash({ id, input, actor });
    return await this.stripe.funding.store.transaction(async () => {
      const previousRequest = await this.stripe.funding.store.db
        .prepare(
          "SELECT input_hash FROM funding_dispute_review_events WHERE request_key=?",
        )
        .get(input.requestKey);
      if (previousRequest) {
        if (previousRequest.input_hash !== inputHash)
          throw new FundingError(
            409,
            "This review request key was already used with different details.",
          );
        return await this.detail(id);
      }
      const current = await this.get(id);
      if (
        input.revision !== current.revision ||
        input.evidenceFingerprint !== current.evidenceFingerprint
      )
        throw new FundingError(
          409,
          "The review or payment evidence changed. Refresh this case before saving.",
        );
      const at = this.now();
      const updated: DisputeReviewCase = {
        ...current,
        revision: current.revision + 1,
        reviewStatus: input.status,
        note: input.note,
        reviewedAt: at,
        actor,
        evidenceChanged: false,
      };
      const event: DisputeReviewEvent = {
        id: randomUUID(),
        createdAt: at,
        actor,
        status: input.status,
        previousStatus: current.reviewStatus,
        revision: updated.revision,
        note: input.note,
        evidenceFingerprint: current.evidenceFingerprint,
        evidence: current.payment,
      };
      await this.stripe.funding.store.db
        .prepare(
          "INSERT INTO funding_dispute_reviews VALUES (?,?) ON CONFLICT(deposit_id) DO UPDATE SET body=excluded.body",
        )
        .run(id, JSON.stringify(updated));
      await this.stripe.funding.store.db
        .prepare("INSERT INTO funding_dispute_review_events VALUES (?,?,?,?,?)")
        .run(event.id, id, input.requestKey, inputHash, JSON.stringify(event));
      return await this.detail(id);
    });
  }
}
