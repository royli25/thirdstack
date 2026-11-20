import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request } from "express";
import { AsyncLocalStorage } from "node:async_hooks";
import { McpAuthError, mcpAuthenticator } from "../server/mcp-http";
import { AccountError } from "../server/accounts";
import { ApiKeyError } from "../server/api-keys";
import { config } from "../server/config";

/**
 * Account-mode (PostgreSQL/Supabase) authentication rules for /mcp, checked
 * with stand-ins so they run without a database. The real database path is
 * covered by mcp-http-postgres.test.ts in CI.
 */
const KEY = "oct_key_" + "A".repeat(43);
const original = config.token;
afterEach(() => {
  config.token = original;
});
function req(authorization?: string, hostname = "octolab.example") {
  return {
    hostname,
    header: (name: string) =>
      name.toLowerCase() === "authorization" ? authorization : undefined,
  } as unknown as Request;
}
function accountMode() {
  const scope = new AsyncLocalStorage<string>();
  const seenScope: (string | undefined)[] = [];
  const accounts = {
    keyAccountScope: vi.fn(async (secret: string) => {
      if (secret !== KEY) throw new AccountError(401, "Invalid API key.");
      return "workspace-1";
    }),
    identity: vi.fn(async (r: Request) => {
      if (r.header("authorization") !== "Bearer user-jwt")
        throw new AccountError(401, "Sign in to access your account.");
      return { userId: "user-1" };
    }),
  };
  const apiKeys = {
    authenticate: vi.fn(async () => {
      seenScope.push(scope.getStore());
      return { id: "key-1" };
    }),
  };
  const authenticate = mcpAuthenticator({
    store: { scope } as any,
    apiKeys: apiKeys as any,
    accounts: accounts as any,
  });
  return { authenticate, accounts, apiKeys, seenScope };
}

describe("account-mode /mcp authentication", () => {
  it("authenticates a scoped key inside the key's own workspace scope", async () => {
    const t = accountMode();
    expect(await t.authenticate(req(`Bearer ${KEY}`))).toEqual({
      id: "key:key-1",
      credential: KEY,
    });
    expect(t.seenScope).toEqual(["workspace-1"]);
    expect(t.accounts.identity).not.toHaveBeenCalled();
  });

  it("authenticates a signed-in account session by user, so token refresh keeps the session", async () => {
    const t = accountMode();
    expect(await t.authenticate(req("Bearer user-jwt"))).toEqual({
      id: "account:user-1",
      credential: "user-jwt",
    });
  });

  it("never falls back to local or owner access", async () => {
    config.token = "owner-fixture-token-0000000000001";
    const t = accountMode();
    for (const header of [undefined, `Bearer ${config.token}`, "Bearer nope"])
      await expect(
        t.authenticate(req(header, "127.0.0.1")),
      ).rejects.toMatchObject({ status: 401 });
  });

  it("maps account and key errors to their HTTP status", async () => {
    const t = accountMode();
    t.apiKeys.authenticate.mockRejectedValueOnce(
      new ApiKeyError(403, "This API key has expired."),
    );
    await expect(t.authenticate(req(`Bearer ${KEY}`))).rejects.toEqual(
      new McpAuthError(403, "This API key has expired."),
    );
    t.accounts.identity.mockRejectedValueOnce(
      new AccountError(503, "Account verification is busy."),
    );
    await expect(t.authenticate(req("Bearer user-jwt"))).rejects.toMatchObject({
      status: 503,
    });
  });

  it("passes unexpected failures through as server errors, not auth failures", async () => {
    const t = accountMode();
    t.accounts.identity.mockRejectedValueOnce(new Error("database down"));
    const error = await t.authenticate(req("Bearer user-jwt")).catch((e) => e);
    expect(error).not.toBeInstanceOf(McpAuthError);
  });
});
