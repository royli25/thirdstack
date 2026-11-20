import { describe, expect, it } from "vitest";
import { authFailure, readAuthCallback } from "../src/auth-state";

describe("authentication callback and error states", () => {
  it("distinguishes expired reset and confirmation links before the SDK consumes the callback", () => {
    expect(
      readAuthCallback(
        new URL(
          "https://example.com/?auth_flow=recovery#error=access_denied&error_code=otp_expired",
        ),
      ),
    ).toMatchObject({ stage: "reset-expired" });
    expect(
      readAuthCallback(
        new URL("https://example.com/?auth_flow=signup&error_code=otp_expired"),
      ),
    ).toMatchObject({ stage: "confirmation-expired" });
  });
  it("distinguishes a canceled Google flow from a provider failure", () => {
    expect(
      readAuthCallback(
        new URL("https://example.com/?auth_flow=google&error=access_denied"),
      ),
    ).toMatchObject({ stage: "google-canceled" });
    expect(
      readAuthCallback(
        new URL("https://example.com/?auth_flow=google&error=server_error"),
      ),
    ).toMatchObject({ stage: "google-error" });
    expect(readAuthCallback(new URL("https://example.com/#dashboard"))).toEqual(
      { flow: null },
    );
  });
  it("maps provider errors to actionable screens without treating a failure as signed in", () => {
    expect(authFailure({ code: "invalid_credentials", status: 400 })).toBe(
      "credentials",
    );
    expect(authFailure({ code: "email_not_confirmed" })).toBe(
      "confirmation-required",
    );
    expect(authFailure({ code: "weak_password" })).toBe("weak-password");
    expect(authFailure({ status: 429 })).toBe("rate-limited");
    expect(authFailure({ code: "flow_state_expired" })).toBe("expired");
    expect(authFailure(new TypeError("Failed to fetch"))).toBe("service-error");
  });
});
