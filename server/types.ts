export type ProviderId =
  import("./provider-identifiers.js").RegisteredProviderId;
export type Verdict = "pass" | "fail" | "unknown";
export interface Intent {
  prompt: string;
  query: string;
  queries?: string[];
  requiredCount: number;
  budgetMicros: number;
  criteria: string[];
  domains: string[];
  mode: "route" | "compare";
  preference: "balanced" | "cost" | "latency";
  consent: boolean;
}
export interface Source {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedAt?: string;
  provider: ProviderId | "user";
  callId: string | null;
  contentVersion?: number;
  extraction?: {
    provider: "firecrawl";
    callId: string;
    at: string;
    pageStatus?: number;
    authMode: "api-key" | "keyless";
  };
}
export interface Assessment {
  sourceId: string;
  organization: string;
  criteria: Record<string, Verdict>;
  disposition: "accepted" | "rejected" | "pending";
  note: string;
  evidence?: Record<string, string[]>;
  updatedAt?: string;
  evidenceVersions?: Record<string, number>;
}
export interface Task {
  id: string;
  intent: Intent;
  createdAt: string;
  updatedAt: string;
  status: "ready" | "running" | "complete" | "partial" | "failed";
  spentMicros: number;
  reservedMicros: number;
  sources: Source[];
  assessments: Assessment[];
  error?: string;
}
export interface TraceEvent {
  id: number;
  taskId: string;
  callId: string | null;
  type: string;
  at: string;
  data: Record<string, any>;
}
export interface Observation {
  provider: ProviderId;
  latencyMs: number;
  success: boolean;
  quality: number | null;
}
export interface Candidate {
  provider: ProviderId;
  eligible: boolean;
  reasons: string[];
  estimatedMicros: number;
  score: number;
  components: {
    cost: number;
    latency: number;
    reliability: number;
    quality: number;
  };
  insufficientData: string[];
}

export interface ServerHealth {
  ok: boolean;
  providers: Record<ProviderId, boolean>;
  estimates: Record<ProviderId, number>;
  rateCardVersion: string;
  policyVersion: string;
  minCohort: number;
  providerIssues?: Partial<Record<ProviderId, string>>;
  providerAuth?: Record<ProviderId, "api-key" | "keyless" | "unconfigured">;
}
export interface TaskSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: Task["status"];
  query: string;
  spentMicros: number;
  budgetMicros: number;
  sourceCount: number;
}
