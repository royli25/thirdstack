# Scoped API keys

The user sidebar has **API keys** at `#dashboard/keys`. Create separate credentials for agents/applications, restrict permissions and tools, set expiry and a lifetime estimated-spend limit, inspect usage, edit policy, or permanently revoke a key.

Each key belongs to one persistent data partition, preserved by the [verified PostgreSQL import](POSTGRES_MIGRATION.md). In PostgreSQL [account mode](AUTH.md), the backend resolves the owning partition from the key hash and applies current scope, tool, expiry, revocation, and spending checks. SQLite uses one local partition.

## Owner protection is required

In PostgreSQL mode, sign in to your account before issuing keys. Customer setup automatically selects an existing authorized private scope or prepares one when needed. Platform administrators choose the intended customer account in their account menu; customer workspace management is deferred. Members cannot manage keys. `API_TOKEN` is ignored in account mode. In SQLite/local mode, configure a strong `API_TOKEN` of at least 24 characters, restart, and connect with that owner credential. In both modes, scoped keys cannot create/edit/revoke keys, change routing, use funding/admin/provider-lab APIs, evaluate outputs, or enter the legacy execution paths.

In SQLite/local mode, anonymous loopback development is available only before any key has been issued. If the owner token is removed or shortened after issuance, general `/api` requests fail closed with `503`, including requests that omit Authorization. Restore owner configuration before continuing. Revoking every key does not revert the workspace to anonymous access. Health checks, signed Stripe webhooks, and separately authenticated admin funding routes retain their existing authentication boundaries.

No scoped key was issued into the production development database during implementation. SQLite issuance stays disabled until owner-token access is configured; PostgreSQL issuance uses authenticated owner/platform-admin access. Test credentials exist only in isolated fixture databases/processes.

## Create and connect

1. Open API keys and create a named key, such as “Codex development”.
2. Choose Agent access, Read only, or custom permissions; select allowed tools.
3. Set a total estimated-spend limit from $0–$1,000, with up to six decimal places, and expiry after 7, 30, 90, or 365 days.
4. Copy the secret once. It is masked initially; reveal/copy controls are available. Closing/leaving the view clears it, and later reads show only the display prefix/suffix.
5. Provide the scoped key to the local MCP bridge using `APILAYER_API_KEY`, then restart the MCP client.

```dotenv
APILAYER_API_KEY=<scoped key>
```

`APILAYER_API_KEY` takes precedence over legacy `API_TOKEN` in the bridge. A rejected scoped key never falls back to the owner credential. Use account login for PostgreSQL administration and retain any SQLite owner credential separately; prefer a dedicated client environment containing the scoped key. Existing local installer registrations still load the project's environment file for backward compatibility, so protect that file and the machine running the bridge. The local stdio bridge can target loopback HTTP or explicitly configured HTTPS with a scoped key; it never forwards the owner token remotely. See [hosted bridge setup](MCP.md#hosted-stdio-bridge). This does not implement hosted HTTP MCP/OAuth.

Full secrets contain 32 random bytes and are stored only as SHA-256 digests. The plaintext value is returned only by the first successful creation response; no full secret is stored in key metadata, audit records, observation events, or browser storage. Creation has a UUID idempotency key: identical retries return the original metadata with `secret:null`; they cannot recover the plaintext. If the first response was lost, revoke the saved key and create a replacement. Changed details under the same creation UUID return `409`.

## Permissions

| Scope            | Allowed behavior                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools:discover` | Read the catalog; run free route previews and session discovery. Allowed-tool restrictions are reflected in candidates.                                                     |
| `research:read`  | Read saved sessions, call evidence, activity, connection history, and session exports in the current workspace. This is workspace-wide reading, not per-key data isolation. |
| `research:write` | Record agent sessions, connection activity, and actual delivered outcomes. Does not grant operator evaluation/approval controls.                                            |
| `tools:execute`  | Explicitly execute allowed providers under the session policy and cumulative key limit.                                                                                     |
| `usage:read`     | Read workspace usage aggregates.                                                                                                                                            |

Agent access includes all five scopes. Read only includes discovery, research reads, and usage. Unknown routes/methods are denied by default, even to a key with every scope. Permissions and expiry are checked on each request. Execution also checks current key state and tool restrictions at provider admission; client-supplied key IDs, counters, or privilege fields are not accepted.

## Limits, retries, revocation, and recovery

The limit covers **configured provider-cost estimates**, represented in integer USD micro-units. It is not an enforced vendor invoice amount, a balance of prepaid production funds, or a currency conversion of provider-reported credits. Test deposits do not increase this limit.

Before a new provider request, one database transaction reserves its estimate against both the session cap and the authenticated key's spent-plus-reserved total, saves the call receipt, and records key attribution. A concurrent call sees that reservation. New sessions cannot reset the key's lifetime allowance. Tool discovery uses the lower remaining key/session budget; free preview uses the lower key/default-session budget.

Settlement moves the estimate from reserved to spent in the same transaction as the saved provider result. Failures and uncertain outcomes retain conservative estimates, matching existing backend policy. Replaying an existing call receipt adds no spending or provider request. Research retention does not erase cumulative key spending. A process restart conservatively settles interrupted reservations once; it never automatically repeats uncertain provider work.

A $0 cap still permits authorized free operations and rejects positive-estimate provider calls. Owner edits use optimistic revisions and cannot lower the cap below spent plus reserved estimates. Expiry is fixed when issued; replace expired credentials. Revocation blocks new authentication/admission immediately; already admitted calls can finish and settle. Revoked credentials cannot be restored. Key policy changes have a separate audit history: PostgreSQL records the authenticated account UUID; SQLite identifies the owner credential. Account attribution does not verify model/host identity or make a review independent. “Last used” means the last authenticated key request, including an operation subsequently denied by scope.

The UI clears credentials, dialogs, and key metadata on current owner-authorization rejection. Late successful responses from an invalidated view cannot restore a secret. In account mode, sign-out, rejected sessions, and workspace changes also clear protected state; backend membership checks remain authoritative.

## Owner management API

All management routes require a workspace owner or platform administrator account in PostgreSQL mode, or the configured owner credential in SQLite mode. Requests use existing JSON/origin protection.

| Method | Route                              | Behavior                                                                                         |
| ------ | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/api/account/api-keys`            | Configuration status, workspace UUID, public key metadata, supported scopes/tools.               |
| POST   | `/api/account/api-keys`            | `{requestKey,name,scopes,allowedTools,limitUsd,expiresInDays}`; returns `{key,secret,replayed}`. |
| GET    | `/api/account/api-keys/:id`        | Public metadata and latest 100 policy audit events.                                              |
| POST   | `/api/account/api-keys/:id`        | Full editable policy `{revision,name,scopes,allowedTools,limitUsd}`.                             |
| POST   | `/api/account/api-keys/:id/revoke` | `{revision}`; repeated revocation returns the saved revoked state.                               |

Scoped callers send `Authorization: Bearer <scoped key>` to permitted observation/usage endpoints. Management supports at most 1,000 saved keys and 100 unexpired/unrevoked credentials. Secret digests, key-spend receipts, and policy audit records remain outside provider/model statistics and commercial aggregate exports. Single-server database ownership and process-local rate limits still apply with either backend.

## Validation

Unit/API tests cover one-time secrets and hash-only storage, creation replay, scope/owner separation, anonymous-downgrade prevention, denied alternate execution paths, allowed tools, exact limits, attribution, concurrent reservations, new-session cap bypass attempts, expiry, revocation during an admitted call, edit conflicts, provider failure, and transaction rollback. A real child-process SIGKILL/restart test verifies conservative key settlement. A real MCP stdio/HTTP integration verifies scoped-key preference, spending limits, and revocation. Browser tests cover desktop/mobile creation, reveal/clearing, presets, use, cap editing, revocation, disabled setup, and owner-rejection/late-response cleanup. Provider results are synthetic fixtures; no live paid-provider checks were performed.
