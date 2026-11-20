# Administrator tool settings

In PostgreSQL account mode, **Administration → Tool settings** edits the global Exa, Tavily and Firecrawl controls. Each operator uses an individual confirmed Supabase Auth account explicitly listed in `SUPABASE_ADMIN_USER_IDS`. Allowlisting and account recovery remain deployment/Auth responsibilities; this page cannot grant administrators or edit arbitrary environment variables.

Sign in with a confirmed Supabase account whose UUID is listed in `SUPABASE_ADMIN_USER_IDS`. Every privileged backend request verifies the account afresh and checks that its session is live. Signing out, revoking the session or removing the UUID from the allowlist denies subsequent administrator requests. Role preview removes privileged access.

Provider keys are held only in the current form. Account or session changes and unmount invalidate pending form responses. Supabase persists browser login tokens through its SDK storage.

## What changes

- Enable/pause each existing allowlisted provider. Credential configuration and availability are distinct: a paused provider can retain a configured key.
- Set each provider's requests per minute, request timeout, base configured USD estimate and Exa additional-result estimate.
- Set the cap for new agent sessions, new controlled tests and the daily controlled-test estimate allowance. Previously authorized session budgets, incurred spend and existing receipts remain intact. Workspace [Tool access allowances](WORKSPACE_ALLOWANCES.md) and customer key/routing restrictions still apply.
- Add or replace a provider credential through Supabase Vault. Saved key values are never returned, including to administrators.

Lost commit acknowledgments trigger reconciliation from durable settings under the same admission gate. If synchronization is unavailable, provider admissions pause until an administrator reloads settings successfully.

A save is explicit and audited with the authenticated actor, revision, before/after settings and credential replacement provider. Audit records never contain key values. Invalid fields reject without a write. Conflicting revisions return `409`; reload and review before saving again. An unchanged request UUID can be retried idempotently; a changed payload with the same UUID rejects.

The application has one active runtime owner. While provider work is admitted, settings saves return `409`. While a save is in progress, new provider admissions return `409`. Once saved, new work sees the new limits, credentials and rate-card revision together. Historical call/adapter/rate-card snapshots and idempotent call receipts are unchanged. This is not a multi-runtime hot-configuration service.

## Managed secret prerequisites

Apply migration `20261109054711_platform_tool_settings.sql` through the normal isolated rollout, then use the private server's privileged direct/session-pooler database connection. It must have access to `vault.decrypted_secrets`, `vault.create_secret(text,text,text)` and `vault.update_secret(uuid,text,text,text)`. The workspace runtime role, `anon`, and `authenticated` must not have Vault schema/read access. Do not grant client/runtime roles access to repair a server connection.

The implementation uses Supabase Vault's existing encryption, not an application encryption key or plaintext credential table. Vault SQL receives key values as parameters. Keep database statement/parameter logging and hosting request-body capture disabled or redacted for credential writes. TLS protects browser-to-server submission and server-to-database connections. The server resolves keys into memory for provider calls and never sends them in read API responses or audit records.

If the extension, required operations or appropriate privileges are absent, the page reports that the managed store is unavailable and disables credential entry. Other settings can still be saved. Providers without a managed reference can continue using existing private deployment environment credentials. There is no plaintext storage fallback. Confirm target-project privileges before public launch.

## Backup and recovery

Application backups include both platform settings and audit tables, including opaque managed-secret UUID references. They exclude the Vault schema, its encryption keys, hosted Auth accounts/factors and object storage. A successful application restore does not establish recovery of those external systems.

After restoring into a fresh database, provision the supported managed Vault and restore/recreate trusted Auth accounts and the operator UUID allowlist through the hosting/Auth recovery process. Start Two Hands normally. Missing or unreadable referenced secrets leave the affected provider unavailable and show **Managed credential unavailable** in Tool settings. They do not prevent administrators reaching the repair form, do not fall back to environment keys, and cannot enable keyless Firecrawl. Replace each affected credential using a trusted verified administrator; Two Hands creates a fresh managed reference and audits the replacement. Historical credentials are not reconstructed from receipts or audit. If restoring the original Vault separately, restart Two Hands to resolve the recovered references. Keep that managed-store recovery plan alongside the application backup.

## API

All routes require an allowlisted platform administrator with a confirmed account and live session and reject customer accounts, scoped machine keys and role previews. Writes require same-origin JSON.

| Method | Route                              | Result                                                                                                                  |
| ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/tool-settings`         | Revision, values, configured/source/recovery status, managed-store availability and effective timing; no saved secrets. |
| GET    | `/api/admin/tool-settings/history` | Latest 100 setting changes with actor and differences.                                                                  |
| POST   | `/api/admin/tool-settings`         | `{requestKey, revision, values, credential?: {provider, value}}`; atomic save and safe current settings.                |

SQLite/local mode does not expose persistent hosted administrator settings. Existing technical MCP tool names and registration identifiers remain unchanged.
