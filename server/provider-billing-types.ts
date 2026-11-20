import type { ProviderId } from "./types.js";

export interface BillingRecord {
  recordId: string;
  requestId?: string;
  amountMicros?: number;
  credits?: number;
}
export interface BillingBatch {
  id: string;
  version: "provider-billing-v1";
  inputHash: string;
  contentHash: string;
  requestKey: string;
  provider: ProviderId;
  accountReference: string;
  sourceKind: "invoice" | "account_usage";
  sourceReference: string;
  currency: string;
  windowStart: string;
  windowEnd: string;
  importedAt: string;
  supersedesBatchId?: string;
  creditRate?: { version: string; microsPerCredit: number };
  records: BillingRecord[];
}
export interface BillingReview {
  actorId?: string;
  receipts: {
    recordId: string;
    id: string;
    sessionId: string;
    provider: ProviderId;
    providerAccountReference: string;
    startedAt: string;
    status: "succeeded" | "failed" | "interrupted";
    estimateMicros: number;
    requestId: string;
    reportedUsd: number | null;
    reportedCredits: number | null;
    source: "workspace_call" | "controlled_run";
  }[];
  id: string;
  batchId: string;
  requestKey: string;
  inputHash: string;
  decision: "approved" | "rejected";
  note: string;
  at: string;
  actor: "workspace_owner_access";
  batchHash: string;
}
export interface BillingLine extends BillingRecord {
  callSource: "workspace_call" | "controlled_run" | null;
  status:
    "matched" | "unmatched" | "ambiguous" | "duplicate" | "account_mismatch";
  reason: string;
  callId: string | null;
  sessionId: string | null;
  estimatedMicros: number | null;
  reportedUsd: number | null;
  reportedCredits: number | null;
  convertedCreditMicros: number | null;
  reconciledMicros: number | null;
  varianceMicros: number | null;
}
export interface BillingBatchView extends Omit<
  BillingBatch,
  "inputHash" | "records" | "requestKey"
> {
  review: BillingReview | null;
  reviews: BillingReview[];
  effective: boolean;
  lines: BillingLine[];
}
export interface BillingOverview {
  batches: BillingBatchView[];
  reconciledMicros: number | null;
  matchedEstimatedMicros: number;
  varianceMicros: number | null;
  reconciledCalls: number;
  totalCalls: number;
  unreportedCalls: number;
  unresolvedRecords: number;
  pendingBatches: number;
  since: string;
  meaning: string;
}
