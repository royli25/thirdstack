import type { ProviderId } from "./types.js";
export interface ProviderControl {
  enabled: boolean;
  requestsPerMinute: number;
  estimateMicros: number;
}
export interface ToolSettingsValues {
  providers: Record<ProviderId, ProviderControl>;
  timeoutMs: number;
  sessionBudgetMicros: number;
  testBudgetMicros: number;
  testDailyBudgetMicros: number;
  exaAdditionalResultMicros: number;
}
export interface ToolSettingsView {
  revision: number;
  updatedAt: string | null;
  values: ToolSettingsValues;
  rateCardVersion: string;
  credentials: Record<
    ProviderId,
    {
      configured: boolean;
      source: "environment" | "vault" | "missing";
      needsReplacement: boolean;
    }
  >;
  secretStore: { available: boolean; name: "Supabase Vault" };
  effective: "New calls immediately after save; current calls must finish first";
}
