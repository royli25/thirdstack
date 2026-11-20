import { afterEach, it, expect, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { supabaseVerifier } from "../server/accounts";
afterEach(() => vi.unstubAllGlobals());
const settings = {
  url: "https://octolab-fixture.supabase.co",
  publishableKey: "sb_publishable_fixture",
  adminUserIds: [],
};
const encode = (value: unknown) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");
const token = (
  user: string,
  session: string,
  exp = Math.floor(Date.now() / 1000) + 3600,
) =>
  encode({ alg: "HS256", typ: "JWT" }) +
  "." +
  encode({ sub: user, session_id: session, exp, aal: "aal1" }) +
  ".fixture-signature";
const user = (id: string) => ({
  id,
  aud: "authenticated",
  role: "authenticated",
  email: "fixture@fixture.invalid",
  email_confirmed_at: new Date().toISOString(),
  is_anonymous: false,
  created_at: new Date().toISOString(),
  app_metadata: { provider: "email" },
  user_metadata: { role: "admin" },
});
it("uses the Auth server's verified user and binds the session claims to that user", async () => {
  const id = randomUUID(),
    session = randomUUID(),
    jwt = token(id, session);
  const remote = vi.fn(
    async (_input: RequestInfo | URL) =>
      new Response(JSON.stringify(user(id)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", remote);
  expect(await supabaseVerifier(settings)(jwt)).toMatchObject({
    userId: id,
    sessionId: session,
    email: "fixture@fixture.invalid",
  });
  expect(String(remote.mock.calls[0]?.[0])).toBe(
    settings.url + "/auth/v1/user",
  );
});
it("rejects unconfirmed, anonymous, mismatched and expired identities", async () => {
  const id = randomUUID(),
    session = randomUUID();
  for (const details of [
    { ...user(id), email_confirmed_at: null },
    { ...user(id), is_anonymous: true },
    user(randomUUID()),
  ]) {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(details), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    await expect(
      supabaseVerifier(settings)(token(id, session)),
    ).rejects.toThrow(/verified|Invalid|expired/);
  }
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(user(id)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
  await expect(
    supabaseVerifier(settings)(token(id, session, 1)),
  ).rejects.toThrow(/expired/);
});
it("treats a temporary Auth outage as unavailable rather than an invalid login", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ msg: "Temporary service failure" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
  await expect(
    supabaseVerifier(settings)(token(randomUUID(), randomUUID())),
  ).rejects.toMatchObject({ status: 503 });
});
