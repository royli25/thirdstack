# Operator account allowances

The PostgreSQL runtime requires an explicit platform-operator allowance before executing provider calls. New and previously existing accounts have no allowance by default. Customer-issued API keys and backend session budgets remain additional limits; neither grants access to platform spending. Payment balances and test credits do not grant an allowance. With [wallet enforcement](WALLET_ENFORCEMENT.md) enabled, an enrolled account needs both available credits and an allowance for a billable call.

Migration `20261109032233_workspace_operator_allowances.sql` is applied to the hosted project and verified by the application checksum ledger. The canonical PostgreSQL runtime enforces the guard. No hosted allowances, reservations, or allowance audit events were created during activation: positive-estimate calls remain denied until a platform administrator deliberately grants access. Deposits remain disabled.

Open **Tool access** (`#tool-access`) from the persistent admin sidebar. Choose an account, enter the lifetime USD estimate limit, choose whether access is paused, and supply an audit reason. Saves use the current revision and an idempotency key; stale state requires refreshing. The page lists confirmed accounts by email. The customer dashboard shows a notice when an existing allowance is paused or exhausted. Accounts without an allowance receive an unavailable message if they try to use a paid tool.

## Authorization and accounting

The limit is a lifetime cap on **estimated provider spending since allowance activation**, in integer USD micro-units. Historical calls are not retroactively charged. Estimates are configured rate-card calculations, not final provider invoices or automatic answer-quality assessments.

Observations, legacy tasks, and controlled provider tests reserve their estimates in the same workspace transaction as the call receipt. Operator changes use the same advisory lock, so separate keys, sessions, and processes share one cap. Provider transport runs after commit. Settlement consumes the reserved estimate exactly once, including failed or interrupted calls whose actual billing is unknown. Replay returns saved receipts without another transport or charge. Startup recovery conservatively settles outstanding reservations; it never retries providers automatically.

Pausing blocks new admission and keeps spent/reserved balances. Reducing a limit below spent plus reserved estimates returns 409; pause to stop access without erasing incurred spending. Resuming requires an explicit operator update. There is no counter reset, refund, or payment-credit conversion in this feature.

`workspace_allowances` stores the limit, pause, revision, and counters. `workspace_allowance_spend` stores one durable reservation per workspace/call. `workspace_allowance_events` records immutable administrator changes, actor, request key, and previous/current settings. These records survive research retention. Runtime permissions allow reading limits and updating counters but cannot insert grants or change limits, pause, or revisions. Browser database roles have no access.

## HTTP contract

Authenticated accounts and scoped keys with `usage:read` can read `GET /api/account/operator-allowance`. It returns:

```json
{
  "enforced": true,
  "state": "unconfigured",
  "limitMicros": 0,
  "spentMicros": 0,
  "reservedMicros": 0,
  "remainingMicros": 0,
  "revision": 0,
  "basis": "estimated_provider_spend_since_activation"
}
```

Hosted states are `unconfigured`, `paused`, `exhausted`, and `available`. Explicit local SQLite compatibility returns `enforced:false`, `state:"local"`, and `remainingMicros:null`; it is not a hosted spending authorization.

Discovery, preview, and catalog responses include `operatorAllowance`. Candidate request quotes include `operatorAllowed`; `withinBudget` and eligibility account for operator, key, and session limits. These are snapshots; admission rechecks authority atomically. An admission denial returns 403 with `{error,code:"operator_allowance_exceeded",operatorAllowance,ownerAction}`. `ownerAction.message` says what the account owner can do and names no limit or amount. Consumers are not asked to approve sessions or pick platform budgets.

Only freshly verified platform administrators can use:

- `GET /api/admin/account-allowances?after=<account UUID>`: at most 50 `{accountId,name,operatorAllowance}` items and `nextCursor`.
- `POST /api/admin/account-allowances/:accountId`: strict JSON `{requestKey,revision,limitMicros,paused,reason}`. `requestKey` is a UUID, initial revision is zero, and the cap is 0–1,000,000,000 micro-units. A stale revision or changed request-key payload returns 409. A replay returns the current state with `replayed:true`, preserving any later pause.

Company/user previews and customer keys cannot administer allowances. No customer endpoint changes the platform limit.

## Validation and restore

`tests/workspace-allowance.test.ts` exercises no-grant self-issued keys, fresh sessions, quote eligibility, verified admin boundaries, runtime grant permissions, competing connections, pause with in-flight work, replay, transaction rollback, interrupted receipt/key settlement, neighboring workspaces, and legacy/lab paths. All transports are injected fixtures.

`grantFixtureAllowance(store, limitMicros)` in `tests/fixtures/allowance.ts` authorizes only disposable loopback PostgreSQL fixtures through the internal operator change service. It rejects hosted database connections and supplies no production seeding endpoint.

Before activation, a private application-schema PostgreSQL custom archive was saved under `data/backups/pre-allowance-postgres-2026-11-09T03-57-01.646Z/`. Its catalog was readable and its SHA-256 manifest recorded. This is backup verification, not a completed restore drill. Earlier verified SQLite/history backups remain preserved.

A restore must preserve all three allowance tables and their privileges, limits, pause/revision, audit rows, reservation states, and counters. Confirm `spentMicros + reservedMicros <= limitMicros`, one ledger row per workspace/call, tenant isolation, and once-only conservative recovery. Never use fixture grants or test calls against the hosted project. Browser fixtures explicitly select SQLite and clear `DATABASE_URL` even when the developer's ignored environment selects PostgreSQL.
