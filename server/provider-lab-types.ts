import type { ProviderId } from "./types.js";

export interface LabCase {
  id: string;
  title: string;
  kind: "search" | "extract";
  input: string;
  referenceUrl: string;
  terms: string[];
}
export interface LabSuite {
  id: string;
  revision: number;
  title: string;
  description: string;
  cases: LabCase[];
  hash: string;
  createdAt: string;
  builtIn: boolean;
}
export interface EvidenceReview {
  verdict: "useful" | "partial" | "not_useful" | "unknown";
  note: string;
  author: "human_reported" | "assistant_reported" | "unspecified";
  at: string;
}
export interface LabCall {
  providerAccountReference?: string;
  id: string;
  sourceCallId?: string;
  adapter?: import("./observation-types.js").ObservedCall["adapter"];
  caseId: string;
  provider: ProviderId;
  status:
    "pending" | "running" | "succeeded" | "failed" | "skipped" | "interrupted";
  estimateMicros: number;
  startedAt?: string;
  finishedAt?: string;
  latencyMs?: number;
  error?: string;
  httpStatus?: number;
  result?: Record<string, unknown>;
  measurements?: {
    resultCount: number;
    capturedCharacters: number;
    referenceRank: number | null;
    referenceCheck: boolean | null;
    pageStatus: number | null;
    truncated: boolean;
  };
  reviews: EvidenceReview[];
}
export interface LabRun {
  id: string;
  revision?: number;
  requestKey: string;
  signature: string;
  title: string;
  source: "live_controlled" | "replay";
  sourceRunId?: string;
  suiteId?: string;
  suiteRevision?: number;
  suiteVersion: string;
  suiteHash: string;
  status: "running" | "completed" | "cancelled" | "interrupted";
  cancelRequested: boolean;
  providers: ProviderId[];
  createdAt: string;
  finishedAt?: string;
  authorizationSource: "backend_policy";
  budgetMicros: number;
  plannedMicros: number;
  spentMicros: number;
  reservedMicros: number;
  rateCardVersion: string;
  adapterSnapshot: Record<string, unknown>;
  cases: LabCase[];
  calls: LabCall[];
}
export interface Experiment {
  id: string;
  provider: ProviderId;
  verification: "retrieval" | "agent_choice" | "integration";
  title: string;
  hypothesis: string;
  change: string;
  successMeasure: string;
  status: "planned" | "testing" | "reviewed";
  baselineRunId: string | null;
  followupRunId: string | null;
  conclusion: string;
  createdAt: string;
  updatedAt: string;
}
export interface ProviderMeasurement {
  provider: ProviderId;
  attempted: number;
  succeeded: number;
  failed: number;
  interrupted: number;
  medianLatencyMs: number | null;
  estimatedMicros: number;
  referencePassed: number;
  referenceKnown: number;
  reviewed: number;
  useful: number;
  partial: number;
  truncated: number;
}
export interface ProviderUsage {
  usdCalls: number;
  reportedUsd: number;
  estimatedMicrosForUsdCalls: number;
  creditCalls: number;
  credits: number;
}
export interface ControlledSample {
  source: "backend_forced";
  runId: string;
  suiteVersion: string;
  completedAt: string;
  attempted: number;
  succeeded: number;
  referencePassed: number;
  referenceKnown: number;
  reviewed: number;
  useful: number;
  partial: number;
  limitations: string;
}
