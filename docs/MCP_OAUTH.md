# Agent sign-in and product integrations

Two Hands has two connection paths to the same hosted `/mcp` service:

- **Use in my agent:** add the MCP URL, sign in with a Two Hands account in the browser, and explicitly allow the client. The client stores and refreshes OAuth tokens.
- **Build into my product:** issue a scoped API key and supply it from the product's backend using `Authorization: Bearer <key>`. Existing API-key and stdio registrations remain compatible.

Agent sign-in uses a user account. New accounts choose their type before authorizing an agent; business accounts use the company area and cannot create personal agent grants. Existing API keys retain their permissions.

The Connect agent dialog presents these separately. Its OAuth commands are shown only when this runtime advertises enabled OAuth; a server that has not been configured does not claim sign-in works.

## Development setup

Use the separate development Supabase project configured in `.env.development.local`. Stop its API, then run:

```bash
npm run db:migrate:dev
npm run oauth:setup:dev
npm run dev
```

The setup command validates the development project, checks its migration and token hook, and uses the operator's existing Supabase CLI credentials (or a privately supplied `SUPABASE_ACCESS_TOKEN`). It enables the managed OAuth server, dynamic public-client registration, `/oauth/consent`, and the token hook, then sets `MCP_OAUTH_ENABLED=true` in the ignored development file. It refuses production and refuses to overwrite another enabled token hook. Credentials are not printed or copied into the repository.

For local clients, use the canonical development URL returned by `/api/auth/config`, currently `http://127.0.0.1:5175/mcp`. The Vite server proxies `/mcp` and protected-resource discovery to the API. The managed Auth service redirects the browser to its configured Site URL plus `/oauth/consent?authorization_id=…`. Email/password login retains that request. Email or social-login callbacks preserve the authorization ID in their allowlisted callback URL; allow the exact callback path with query parameters in the development project's Auth URL configuration if those methods are used.

Codex:

```bash
codex mcp add apilayer --url http://127.0.0.1:5175/mcp
codex mcp login apilayer
```

If `apilayer` already names another server, choose a separate name for development and use that name for login. Do not replace an existing production registration while testing development.

Claude Code:

```bash
claude mcp add --transport http apilayer http://127.0.0.1:5175/mcp
```

Open `/mcp` in Claude Code, select the server, and choose Authenticate. For other clients, add the URL as a remote HTTP MCP server and use the client's Authenticate control. Actual prompts and reconnect behavior are client-specific.

## Protocol and access boundaries

`/.well-known/oauth-protected-resource/mcp` (also available at the root well-known path) publishes the canonical MCP resource, the configured Supabase Auth issuer, and identity scopes. Unauthenticated MCP requests advertise that metadata in their `WWW-Authenticate` challenge. URLs come from the configured canonical origin, never an untrusted Host header.

Supabase handles client registration, PKCE, authorization codes, code replay protection, and refresh-token rotation.

Supported identity/refresh scopes include `openid`, `email`, `profile`, and `offline_access`. Codex requests `openid email offline_access`; the last scope lets the client maintain its connection with refresh credentials and does not add application permissions.

Two Hands:

1. Authenticates the browser using its existing verified account session. Agent tokens cannot manage OAuth grants, account settings, API keys, company permissions, payments, or administrator features.
2. Reads the pending managed authorization to verify its expiry, user binding, S256 PKCE, supported identity scopes, exact resource, and HTTPS or loopback callback. Loading the consent page neither grants access nor issues a code.
3. Records an explicit grant to the user's personal account before returning an authorization code. Even a managed auto-approval from an earlier consent is not returned when the user presses Cancel.
4. Uses `octolab.two_hands_mcp_token_hook` to bind access tokens to the approved MCP audience and grant generation. `mcp_grant_sessions` binds refreshes to the session's original generation. Ordinary browser-token claims remain unchanged.
5. Verifies the live Auth session's user and OAuth client on every request. OAuth tokens must also match an active application grant, its generation, the canonical resource, and the current account owner membership. HTTP operations are limited to the existing machine-access allowlist. MCP tools continue through the same account-scoped routes, receipts, replay handling, and operator allowances.
6. Records revocation locally before asking Supabase to delete the client's sessions and refresh credentials. Local access stops immediately even during an Auth outage; the UI reports incomplete remote cleanup rather than claiming it succeeded. Re-approval rotates the grant generation, so old access tokens and previously bound refresh sessions cannot resume.

Grant and event tables are private, forced-RLS application tables with no browser or workspace-runtime grants. The hook lives in the application schema so existing application backups include it. Consent grants account-level tool/research access; it does not grant administrator privileges or create a provider spending allowance. Provider keys remain server-side.

The requesting application supplies its client name. The consent page shows its client ID and callback for inspection and does not treat that name as verified model identity.

## Production release

Follow the existing [Render release procedure](RELEASE_CHECKLIST.md#production-release-on-render), including backup, stopping the old API, applying the selected release's migrations, and starting the matching code. The development configuration command never configures production.

In the **production Supabase project**:

1. Confirm Auth Site URL is `https://twohands.tech`.
2. Enable OAuth server and configure authorization path `/oauth/consent`.
3. Enable dynamic registration for compatible MCP clients, or pre-register the intended clients and supply their client configuration. Registration alone grants no user/account access.
4. Configure the custom access token hook as `pg-functions://postgres/octolab/two_hands_mcp_token_hook`. Compose with any pre-existing hook; do not silently replace it. This hook must be installed and enabled before enabling MCP OAuth in the runtime.
5. Set Render `MCP_OAUTH_ENABLED=true` with `PUBLIC_APP_URL=https://twohands.tech` and restart the selected release. Keep one API instance and the existing ownership lock.
6. Check discovery, missing-token challenges, actual client login/Allow/Cancel, token refresh, and disconnect. Existing API keys should still work. A discovery or health response is not proof of a completed authorization or paid provider access.

Account-to-agent consent is a one-time connection decision. Ordinary research sessions remain automatically authorized by backend policy; consumers do not approve research budgets or individual Two Hands sessions.

## Validation

`npm run check` runs normal isolated tests. `tests/mcp-oauth.test.ts` additionally uses `OCTOLAB_TEST_POSTGRES_URL` for disposable PostgreSQL tests covering migrations, consent, account isolation, permissions, resource binding, hook claims, revocation, and re-approval. Never point these fixtures at development or production application databases.

`tests/browser/mcp-oauth.spec.ts` covers sign-in continuation, consent, Cancel, expiry, and disconnect with isolated synthetic Auth responses. `tool-workspace.spec.ts` covers separate agent/product onboarding and copied settings. Browser fixtures do not establish managed Auth email delivery or interoperability with a real installed client.

For a managed infrastructure check, `npm run smoke:oauth:dev` creates a temporary user and public OAuth client in the dedicated development project, exercises the SDK authorization-code/PKCE flow, token refresh, tools/list, and revocation, then removes the temporary account and deactivates the client. It requires the operator's Supabase CLI credentials, never targets production, never calls a provider, and does not store or print passwords or tokens. The script removes only its own empty test account and refuses cleanup if it contains research or other members. The immutable account-type history row remains after deletion and is reported separately.

### Verified development checkpoint — 2026-11-17

- All 16 application migrations are installed in the development project. Managed OAuth, dynamic client registration, the consent path, and the grant-bound token hook are enabled there.
- The live SDK check passed all eleven checks, including actual managed refresh and rejection of both access and refresh tokens after revocation. No provider calls were made. No temporary Auth users or active temporary clients remained afterward.
- `npm run check` passed 501 tests with 88 conditional skips. Fresh disposable PostgreSQL checks passed all 33 account/MCP/OAuth tests. The selected desktop/mobile regression suite passed all 98 cases.
- This is development verification. Production was not migrated, configured, or deployed. Installed Codex/Claude UI flows and email delivery remain separate client/environment checks; the live protocol check used the MCP SDK.

References: [MCP authorization](https://modelcontextprotocol.io/specification/latest/basic/authorization), [Supabase OAuth MCP setup](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication), [Supabase consent UI](https://supabase.com/docs/guides/auth/oauth-server/getting-started), [Codex MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Claude Code MCP](https://code.claude.com/docs/en/mcp).
