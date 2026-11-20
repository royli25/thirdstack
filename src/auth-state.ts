export type AuthMode =
  "options" | "signin" | "signup" | "reset" | "recover" | "confirmed";
export type AuthStage =
  | "google-connecting"
  | "google-canceled"
  | "google-error"
  | "confirmation-required"
  | "confirmation-sent"
  | "reset-sent"
  | "password-updated"
  | "confirmation-expired"
  | "reset-expired"
  | "rate-limited"
  | "service-error";

export function readAuthCallback(url: URL): {
  stage?: AuthStage;
  flow: string | null;
} {
  const fragment = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get("error_code") || fragment.get("error_code");
  const error = url.searchParams.get("error") || fragment.get("error");
  const flow = url.searchParams.get("auth_flow");
  if (code === "otp_expired")
    return {
      flow,
      stage: flow === "recovery" ? "reset-expired" : "confirmation-expired",
    };
  if (error || code)
    return {
      flow,
      stage:
        flow === "google"
          ? error === "access_denied"
            ? "google-canceled"
            : "google-error"
          : "service-error",
    };
  return { flow };
}

export function authFailure(error: unknown) {
  const value = error as { code?: string; status?: number; message?: string };
  if (value.status === 429 || value.code?.startsWith("over_"))
    return "rate-limited";
  if (
    value.code === "email_not_confirmed" ||
    /email not confirmed/i.test(value.message || "")
  )
    return "confirmation-required";
  if (value.code === "weak_password") return "weak-password";
  if (
    value.code === "otp_expired" ||
    value.code === "flow_state_expired" ||
    value.code === "flow_state_not_found"
  )
    return "expired";
  if (
    value.code === "invalid_credentials" ||
    /invalid login credentials/i.test(value.message || "")
  )
    return "credentials";
  return "service-error";
}
