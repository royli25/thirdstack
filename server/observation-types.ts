import type { ProviderId } from "./types.js";
export type ToolName = import("./provider-identifiers.js").RegisteredToolName;
export type ReviewVerdict = "pass" | "fail" | "unknown";
export interface Criterion {
  id: string;
  text: string;
  weight: number;
}
export interface Outcome {
  id: string;
  at: string;
  text: string;
  evidenceCallIds: string[];
  source: "agent_reported";
}
export interface ReviewAuthor {
  kind: "unspecified" | "human_reported" | "assistant_reported";
  label?: string;
}
export interface Evaluation {
  reviewer?: ReviewAuthor;
  historical?: true;
  id: string;
  at: string;
  outcomeId: string;
  intentHash: string;
  source: "workspace_review";
  criteria: {
    criterionId: string;
    verdict: ReviewVerdict;
    note: string;
    evidenceCallIds: string[];
  }[];
  score: number | null;
  coverage: number;
  passedWeight: number;
  failedWeight: number;
  unknownWeight: number;
}
export interface ReviewCase {
  id: string;
  at: string;
  evaluationId: string;
  reason: string;
  status: "open" | "resolved" | "dismissed";
  resolution?: string;
  updatedAt: string;
}
export interface ObservationSession {
  id: string;
  apiKeyId?: string;
  title: string;
  objective: string;
  criteria: Criterion[];
  constraints: string;
  /** Agent-reported category. Absent on sessions recorded before categories existed. */
  taskType?: import("./seller-taxonomy.js").TaskType;
  intentHash: string;
  budgetMicros: number;
  spentMicros: number;
  reservedMicros: number;
  model: string;
  modelSource: "agent_reported" | "operator_entered";
  host: string;
  status: "awaiting_approval" | "active" | "completed";
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  authorizationSource?: "backend_policy" | "workspace_operator";
  commercialConsent: boolean;
  sharingPolicy?: string;
  outcomes: Outcome[];
  evaluations: Evaluation[];
  cases: ReviewCase[];
}
export interface ObservedCall {
  providerAccountReference?: string;
  id: string;
  apiKeyId?: string;
  sessionId: string;
  requestKey: string;
  tool: ToolName;
  provider: ProviderId;
  arguments: {
    query?: string;
    url?: string;
    domains?: string[];
    maxResults?: number;
    searchDepth?: "basic" | "advanced";
    /** Arguments sent to a company connector tool, validated against its schema. */
    input?: Record<string, unknown>;
  };
  /** Present when the call went to a company-supplied MCP connector. */
  connector?: {
    id: string;
    slug: string;
    company: string;
    tool: string;
    schemaHash: string;
    snapshotVersion: number;
  };
  adapter?: {
    tool: string;
    provider: string;
    version: string;
    operation: "search" | "extract";
    settings: Record<string, string | number | boolean>;
  };
  costEstimate?: import("./request-cost.js").RequestEstimate;
  /** Present only when octolab chose the provider through a recorded route decision. */
  selectedBy?: "server_route";
  routeDecisionId?: string;
  statedReason: string;
  /** Agent-reported theme for the stated reason. */
  reasonTheme?: import("./seller-taxonomy.js").ReasonTheme;
  status: "running" | "succeeded" | "failed" | "interrupted";
  startedAt: string;
  finishedAt?: string;
  latencyMs?: number;
  estimateMicros: number;
  httpStatus?: number;
  error?: string;
  result?: Record<string, unknown>;
}
export interface ObservationEvent {
  actor?: { kind: "account" | "api_key"; id: string };
  id: number;
  sessionId: string;
  at: string;
  type: string;
  provenance: "observed" | "agent_reported" | "workspace_review";
  data: Record<string, unknown>;
  previousHash: string;
  hash: string;
}
export interface SessionDetail extends ObservationSession {
  calls: ObservedCall[];
  events: ObservationEvent[];
  integrity: boolean;
}

export type ObservationListItem = Omit<
  ObservationSession,
  "outcomes" | "evaluations"
> & {
  outcomes: Pick<Outcome, "id" | "at">[];
  evaluations: Pick<Evaluation, "id" | "outcomeId">[];
};
export function observationListItem(
  s: ObservationSession,
): ObservationListItem {
  return {
    ...s,
    outcomes: s.outcomes.map(({ id, at }) => ({ id, at })),
    evaluations: s.evaluations.map(({ id, outcomeId }) => ({ id, outcomeId })),
  };
}
