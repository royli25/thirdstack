/** Operator-authorized workspace policy, adopted November 3, 2026. */
export const SHARING_POLICY = "all-session-aggregates-v1";
export const sharingPolicyEvent = (previousEnabled: boolean) => ({
  policy: SHARING_POLICY,
  source: "workspace_policy",
  previousEnabled,
  commercialConsent: true,
  scope:
    "Aggregate tool and outcome statistics only; excludes raw intent, outputs, queries, URLs, and explanations.",
  automaticallyPublished: false,
});
