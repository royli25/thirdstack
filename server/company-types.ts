import type { ProviderId } from "./types.js";
export interface CompanyPreviewTarget {
  target: string;
  kind: "company" | "provider";
  id: string;
  name: string;
  providerId: ProviderId | null;
  status: ToolCompany["status"] | "unregistered";
}
export interface AccountPreviewContext {
  role: "user" | "company";
  actorId: string;
  target?: CompanyPreviewTarget;
}
export interface ToolCompany {
  role?: "owner" | "analyst" | "platform_admin";
  id: string;
  name: string;
  website: string;
  toolName: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  providerId: ProviderId | null;
  insightsEnabled: boolean;
  feedback: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export interface CompanyInsights {
  providerId: ProviderId;
  /** Compatibility field: company usage no longer requires a minimum cohort. */
  minimumCohort: number;
  status: "available" | "awaiting_release" | "insufficient_data";
  metrics: null | {
    offeredSessions: number;
    selectedSessions: number;
    calls: number;
    successfulCalls: number;
  };
}
export interface CompanyReviewItem extends ToolCompany {
  ownerEmail: string;
}
