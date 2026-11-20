import { randomUUID } from "node:crypto";
import { z } from "zod";
import { registeredProviderSchema } from "./provider-adapters.js";
import { digest } from "./observation-store.js";
import { Observatory, ObservationError } from "./observation.js";
import type {
  BillingBatch,
  BillingReview,
  BillingBatchView,
  BillingOverview,
  BillingLine,
} from "./provider-billing-types.js";
import type { ObservedCall } from "./observation-types.js";
import type { LabRun } from "./provider-lab-types.js";

const reference = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(
    /^[a-zA-Z0-9._:-]+$/,
    "Use a short account or document reference without spaces.",
  );
const amount = z.number().int().min(-1_000_000_000_000).max(1_000_000_000_000);
const record = z
  .object({
    recordId: reference,
    requestId: z.string().trim().min(1).max(200).optional(),
    amountMicros: amount.optional(),
    credits: z.number().finite().nonnegative().max(1_000_000_000).optional(),
  })
  .strict()
  .refine(
    (r) => r.amountMicros !== undefined || r.credits !== undefined,
    "Each record needs an amount or credits.",
  );
export const billingImportInput = z
  .object({
    requestKey: reference,
    provider: registeredProviderSchema,
    accountReference: reference,
    sourceKind: z.enum(["invoice", "account_usage"]),
    sourceReference: reference,
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .default("USD"),
    windowStart: z.iso.datetime({ offset: true }),
    windowEnd: z.iso.datetime({ offset: true }),
    supersedesBatchId: z.uuid().optional(),
    creditRate: z
      .object({
        version: reference,
        microsPerCredit: z.number().int().min(0).max(1_000_000_000),
      })
      .strict()
      .optional(),
    records: z.array(record).min(1).max(1000),
  })
  .strict()
  .superRefine((r, ctx) => {
    if (Date.parse(r.windowStart) >= Date.parse(r.windowEnd))
      ctx.addIssue({
        code: "custom",
        message: "The billing period must end after it starts.",
      });
    if (
      r.records.some(
        (line) =>
          line.credits !== undefined &&
          r.creditRate &&
          !Number.isSafeInteger(
            Math.round(line.credits * r.creditRate.microsPerCredit),
          ),
      )
    )
      ctx.addIssue({
        code: "custom",
        message: "Converted credit amount is too large.",
      });
  });
const reviewInput = z
  .object({
    requestKey: reference,
    decision: z.enum(["approved", "rejected"]),
    note: z.string().trim().min(3).max(1000),
  })
  .strict();
type BillingReceipt = Pick<
  ObservedCall,
  | "id"
  | "sessionId"
  | "provider"
  | "providerAccountReference"
  | "startedAt"
  | "status"
  | "estimateMicros"
  | "result"
> & { source: "workspace_call" | "controlled_run" };
const prefix = "provider-billing:";
const finite = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
type Stored =
  | { kind: "batch"; value: BillingBatch }
  | { kind: "review"; value: BillingReview };

/** Immutable imports and review events in existing workspace-scoped storage. No balance mutations. */
export class ProviderBilling {
  constructor(private obs: Observatory) {}
  private async entries(): Promise<Stored[]> {
    return (
      await this.obs.db.store.db
        .prepare(
          "SELECT body FROM workspace_settings WHERE key LIKE ? ORDER BY key",
        )
        .all(`${prefix}%`)
    ).map((r) => JSON.parse(r.body));
  }
  private async append(key: string, entry: Stored) {
    await this.obs.db.store.db
      .prepare("INSERT INTO workspace_settings VALUES (?,?)")
      .run(`${prefix}${key}`, JSON.stringify(entry));
  }
  async import(raw: unknown) {
    const input = billingImportInput.parse(raw);
    input.windowStart = new Date(input.windowStart).toISOString();
    input.windowEnd = new Date(input.windowEnd).toISOString();
    const inputHash = digest(input);
    const { requestKey: _requestKey, ...content } = input;
    const contentHash = digest({
      ...content,
      records: [...content.records].sort(
        (a, b) =>
          a.recordId.localeCompare(b.recordId) ||
          digest(a).localeCompare(digest(b)),
      ),
    });
    return this.obs.db.transaction(async () => {
      const batches = (await this.entries())
        .filter((e) => e.kind === "batch")
        .map((e) => e.value);
      const prior = batches.find((b) => b.requestKey === input.requestKey);
      if (prior) {
        if (prior.inputHash !== inputHash)
          throw new ObservationError(
            409,
            "This import request was already used with different records.",
          );
        return { id: prior.id, duplicate: true };
      }
      const same = batches.find((b) => b.contentHash === contentHash);
      if (same) return { id: same.id, duplicate: true };
      if (input.supersedesBatchId) {
        const old = batches.find((b) => b.id === input.supersedesBatchId);
        if (!old)
          throw new ObservationError(
            404,
            "The original import was not found in this account.",
          );
        if (
          old.provider !== input.provider ||
          old.accountReference !== input.accountReference ||
          old.sourceReference !== input.sourceReference ||
          old.sourceKind !== input.sourceKind ||
          old.windowStart !== input.windowStart ||
          old.windowEnd !== input.windowEnd ||
          old.currency !== input.currency
        )
          throw new ObservationError(
            400,
            "A correction must refer to the same provider account, document and billing period.",
          );
      } else if (
        batches.some(
          (b) =>
            b.provider === input.provider &&
            b.accountReference === input.accountReference &&
            b.sourceReference === input.sourceReference &&
            b.sourceKind === input.sourceKind,
        )
      ) {
        throw new ObservationError(
          409,
          "This document was already imported. Select its existing import when submitting a correction.",
        );
      }
      const batch: BillingBatch = {
        ...input,
        id: randomUUID(),
        version: "provider-billing-v1",
        inputHash,
        contentHash,
        importedAt: new Date().toISOString(),
      };
      await this.append(`batch:${batch.id}`, { kind: "batch", value: batch });
      return { id: batch.id, duplicate: false };
    });
  }
  async review(batchId: string, raw: unknown, actorId?: string) {
    const input = reviewInput.parse(raw),
      inputHash = digest({ batchId, ...input });
    return this.obs.db.transaction(async () => {
      const entries = await this.entries();
      const old = entries.find(
        (e) => e.kind === "review" && e.value.requestKey === input.requestKey,
      );
      if (old?.kind === "review") {
        if (old.value.inputHash !== inputHash)
          throw new ObservationError(
            409,
            "This review request was already used for a different decision.",
          );
        return old.value;
      }
      const entry = entries.find(
        (e) => e.kind === "batch" && e.value.id === batchId,
      );
      if (entry?.kind !== "batch")
        throw new ObservationError(404, "Import not found in this account.");
      // A decision is final for this version. Corrections append a new batch and decision.
      if (
        entries.some((e) => e.kind === "review" && e.value.batchId === batchId)
      )
        throw new ObservationError(
          409,
          "This import was already reviewed. Submit a correction to preserve its history.",
        );
      if (
        entry.value.supersedesBatchId &&
        entries.some(
          (e) =>
            e.kind === "batch" &&
            e.value.id !== batchId &&
            e.value.supersedesBatchId === entry.value.supersedesBatchId &&
            entries.some(
              (r) =>
                r.kind === "review" &&
                r.value.batchId === e.value.id &&
                r.value.decision === "approved",
            ),
        )
      )
        throw new ObservationError(
          409,
          "Another correction was already approved. Correct that version instead.",
        );
      const calls = await this.calls();
      const receipts: BillingReview["receipts"] = entry.value.records.flatMap(
        (line) => {
          const matches = calls.filter(
            (call) =>
              call.status !== "running" &&
              call.provider === entry.value.provider &&
              call.providerAccountReference === entry.value.accountReference &&
              line.requestId &&
              call.result?.requestId === line.requestId &&
              call.startedAt >= entry.value.windowStart &&
              call.startedAt < entry.value.windowEnd,
          );
          if (matches.length !== 1) return [];
          const call = matches[0],
            usage = call.result?.usage as Record<string, unknown> | undefined;
          return [
            {
              recordId: line.recordId,
              id: call.id,
              sessionId: call.sessionId,
              provider: call.provider,
              providerAccountReference: entry.value.accountReference,
              startedAt: call.startedAt,
              status: call.status as "succeeded" | "failed" | "interrupted",
              estimateMicros: call.estimateMicros,
              requestId: line.requestId!,
              reportedUsd: finite(usage?.providerReportedUsd),
              reportedCredits: finite(usage?.credits ?? call.result?.credits),
              source: call.source,
            },
          ];
        },
      );
      const review: BillingReview = {
        ...input,
        id: randomUUID(),
        batchId,
        inputHash,
        at: new Date().toISOString(),
        actor: "workspace_owner_access",
        ...(actorId ? { actorId: z.uuid().parse(actorId) } : {}),
        receipts,
        batchHash: entry.value.contentHash,
      };
      await this.append(`review:${review.id}`, {
        kind: "review",
        value: review,
      });
      return review;
    });
  }
  private async calls(): Promise<BillingReceipt[]> {
    const organic = (
      await Promise.all(
        (await this.obs.db.list()).map((s) => this.obs.db.calls(s.id)),
      )
    )
      .flat()
      .map((c) => ({ ...c, source: "workspace_call" as const }));
    const runs: LabRun[] = (
      await this.obs.db.store.db
        .prepare("SELECT body FROM provider_lab_runs ORDER BY rowid DESC")
        .all()
    ).map((r) => JSON.parse(r.body));
    const controlled: BillingReceipt[] = runs
      .filter((r) => r.source === "live_controlled")
      .flatMap((r) =>
        r.calls.flatMap((c) => {
          if (!c.startedAt || c.status === "pending" || c.status === "skipped")
            return [];
          return [
            {
              id: c.id,
              sessionId: r.id,
              provider: c.provider,
              providerAccountReference: c.providerAccountReference,
              startedAt: c.startedAt,
              status: c.status,
              estimateMicros: c.estimateMicros,
              result: c.result,
              source: "controlled_run" as const,
            },
          ];
        }),
      );
    return [...organic, ...controlled];
  }
  async overview(since = "1970-01-01T00:00:00.000Z"): Promise<BillingOverview> {
    const [entries, calls] = await Promise.all([this.entries(), this.calls()]);
    const batches = entries
      .filter((e) => e.kind === "batch")
      .map((e) => e.value);
    const reviews = entries
      .filter((e) => e.kind === "review")
      .map((e) => e.value);
    // Keep the exact reviewed billing evidence after source-history retention.
    const callIds = new Set(calls.map((c) => c.id));
    for (const review of reviews)
      for (const receipt of review.receipts ?? []) {
        if (callIds.has(receipt.id)) continue;
        callIds.add(receipt.id);
        calls.push({
          ...receipt,
          result: {
            requestId: receipt.requestId,
            usage: {
              providerReportedUsd: receipt.reportedUsd,
              credits: receipt.reportedCredits,
            },
          },
        });
      }
    const approved = new Set(
      reviews.filter((r) => r.decision === "approved").map((r) => r.batchId),
    );
    const superseded = new Set(
      batches
        .filter((b) => approved.has(b.id) && b.supersedesBatchId)
        .map((b) => b.supersedesBatchId),
    );
    const effective = batches.filter(
      (b) => approved.has(b.id) && !superseded.has(b.id),
    );
    const views: BillingBatchView[] = batches
      .map((batch) => {
        const {
          inputHash: _inputHash,
          records,
          requestKey: _requestKey,
          ...publicBatch
        } = batch;
        const localIds = new Map<string, number>(),
          localRequests = new Map<string, number>();
        for (const line of records) {
          localIds.set(line.recordId, (localIds.get(line.recordId) ?? 0) + 1);
          if (batch.sourceKind === "invoice" && line.requestId)
            localRequests.set(
              line.requestId,
              (localRequests.get(line.requestId) ?? 0) + 1,
            );
        }
        const isEffective = effective.includes(batch);
        const lines = records.map((line): BillingLine => {
          const candidates = line.requestId
            ? calls.filter(
                (c) =>
                  c.provider === batch.provider &&
                  c.result?.requestId === line.requestId &&
                  c.startedAt >= batch.windowStart &&
                  c.startedAt < batch.windowEnd &&
                  c.status !== "running",
              )
            : [];
          const own = candidates.filter(
            (c) => c.providerAccountReference === batch.accountReference,
          );
          const duplicate =
            (localIds.get(line.recordId) ?? 0) > 1 ||
            (line.requestId !== undefined &&
              (localRequests.get(line.requestId) ?? 0) > 1) ||
            effective.some(
              (other) =>
                other.id !== batch.id &&
                other.id !== batch.supersedesBatchId &&
                other.provider === batch.provider &&
                other.accountReference === batch.accountReference &&
                other.sourceKind === batch.sourceKind &&
                other.records.some(
                  (record) =>
                    record.recordId === line.recordId ||
                    (batch.sourceKind === "invoice" &&
                      line.requestId !== undefined &&
                      record.requestId === line.requestId),
                ),
            );
          const status = duplicate
            ? "duplicate"
            : own.length > 1
              ? "ambiguous"
              : own.length === 1
                ? "matched"
                : candidates.length
                  ? "account_mismatch"
                  : "unmatched";
          const call = status === "matched" ? own[0] : undefined;
          const usage = call?.result?.usage as
            Record<string, unknown> | undefined;
          const reconciled =
            isEffective &&
            status === "matched" &&
            batch.sourceKind === "invoice" &&
            batch.currency === "USD" &&
            line.amountMicros !== undefined
              ? line.amountMicros
              : null;
          return {
            ...line,
            callSource: call?.source ?? null,
            status,
            reason:
              status === "matched"
                ? "Exact request and recorded provider account match."
                : status === "duplicate"
                  ? "Repeated billing record or request; excluded from totals."
                  : status === "ambiguous"
                    ? "More than one receipt matches; review needed."
                    : status === "account_mismatch"
                      ? "The receipt has a different or unrecorded provider account."
                      : "No matching recorded request in this billing period.",
            callId: call?.id ?? null,
            sessionId: call?.sessionId ?? null,
            estimatedMicros: call?.estimateMicros ?? null,
            reportedUsd: finite(usage?.providerReportedUsd),
            reportedCredits: finite(usage?.credits ?? call?.result?.credits),
            convertedCreditMicros:
              line.credits !== undefined && batch.creditRate
                ? Math.round(line.credits * batch.creditRate.microsPerCredit)
                : null,
            reconciledMicros: reconciled,
            varianceMicros:
              reconciled !== null && call
                ? reconciled - call.estimateMicros
                : null,
          };
        });
        const batchReviews = reviews.filter((r) => r.batchId === batch.id);
        return {
          ...publicBatch,
          review: batchReviews.at(-1) ?? null,
          reviews: batchReviews,
          effective: isEffective,
          lines,
        };
      })
      .sort(
        (a, b) =>
          b.importedAt.localeCompare(a.importedAt) || b.id.localeCompare(a.id),
      );
    const periodCalls = calls.filter((c) => c.startedAt >= since);
    const periodIds = new Set(periodCalls.map((c) => c.id));
    const charged = views
      .flatMap((b) => b.lines)
      .filter(
        (line) =>
          line.reconciledMicros !== null &&
          line.callId &&
          periodIds.has(line.callId),
      );
    const total = charged.length
      ? charged.reduce((n, line) => n + line.reconciledMicros!, 0)
      : null;
    const estimates = charged.reduce((n, line) => n + line.estimatedMicros!, 0);
    if (
      (total !== null && !Number.isSafeInteger(total)) ||
      !Number.isSafeInteger(estimates) ||
      (total !== null && !Number.isSafeInteger(total - estimates))
    )
      throw new ObservationError(
        409,
        "The billing total exceeds the supported exact amount range. Narrow the reporting period.",
      );
    return {
      batches: views,
      reconciledMicros: total,
      matchedEstimatedMicros: estimates,
      varianceMicros: total === null ? null : total - estimates,
      reconciledCalls: charged.length,
      totalCalls: periodCalls.length,
      unreportedCalls: periodCalls.filter(
        (c) =>
          finite(
            (c.result?.usage as Record<string, unknown> | undefined)
              ?.providerReportedUsd,
          ) === null &&
          finite(
            (c.result?.usage as Record<string, unknown> | undefined)?.credits ??
              c.result?.credits,
          ) === null,
      ).length,
      unresolvedRecords: views
        .filter((b) => b.effective && b.sourceKind === "invoice")
        .flatMap((b) => b.lines)
        .filter(
          (line) => line.status !== "matched" || line.reconciledMicros === null,
        ).length,
      pendingBatches: views.filter((b) => !b.review).length,
      since,
      meaning:
        "Reviewed imported invoice amounts matched to exact request IDs and recorded provider accounts. Imported documents are operator-supplied, not independently verified provider invoices. Estimates, response-reported usage and credit conversions remain separate; reservations and deposit balances are unchanged.",
    };
  }
}
