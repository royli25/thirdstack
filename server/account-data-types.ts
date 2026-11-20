import type { ObservedCall, ToolName } from "./observation-types.js";

export interface RoutingPolicy {
  revision: number;
  disabledTools: ToolName[];
  updatedAt: string | null;
}
export interface ActivityItem extends Omit<ObservedCall, "result"> {
  sessionTitle: string;
  host: string;
  model: string;
  reportedUsd: number | null;
  reportedCredits: number | null;
  /** Prepaid-credit charge for this call. Absent when the wallet did not hold it. */
  charge?: import("./wallet.js").WalletCharge;
}
export interface AccountUsage {
  days: number;
  since: string;
  requests: number;
  succeeded: number;
  failed: number;
  running: number;
  interrupted: number;
  estimatedMicros: number;
  reportedUsd: number | null;
  usdReportingCalls: number;
  averageLatencyMs: number | null;
  latencySamples: number;
  series: { date: string; requests: number; estimatedMicros: number }[];
  providers: {
    provider: string;
    requests: number;
    estimatedMicros: number;
    reportedCredits: number | null;
    creditReportingCalls: number;
  }[];
}
export interface ActivityPage {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
}
