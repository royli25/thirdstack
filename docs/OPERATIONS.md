# Privacy and operations

## Credentials and access

Except for explicitly enabled Firecrawl keyless extraction, provider keys are read from the private server environment or managed Supabase Vault. See [administrator tool settings](ADMIN_TOOL_SETTINGS.md) for audited edits and recovery. They never enter browser bundles, source control, stored events, or API responses. The Connections screen displays only whether a key is configured, not whether it has been verified.

By default the server binds to loopback. SQLite/local mode requires `API_TOKEN` with at least 24 characters before non-loopback binding; the browser keeps that owner token in memory only. PostgreSQL mode requires [Supabase Auth configuration](AUTH.md), verifies live sessions and account identity, and ignores `API_TOKEN`/`ADMIN_API_TOKEN`. Its browser SDK persists and refreshes account sessions; saved provider credentials cannot be retrieved by the browser; verified administrators can submit replacements through the write-only managed settings form. For remote use, place the service behind HTTPS and trusted deployment access controls. Same-origin JSON writes remain enforced.

PostgreSQL resolves personal data from the verified account. Operators on the `SUPABASE_ADMIN_USER_IDS` allowlist can manage account tool allowances, review company access, and handle payment disputes. Forced row-level security and partitioned constraints protect business queries.

[Scoped API keys](API_KEYS.md) restrict machine permissions, tools, expiry, and cumulative configured estimates. PostgreSQL key-policy audit events record the authenticated account UUID; SQLite records an owner-credential identifier. SQLite retains its shared local workspace and requires an owner `API_TOKEN` of at least 24 characters before key issuance. Removing or shortening it after issuance makes general `/api` requests return `503`; revoking all keys does not restore anonymous access.

PostgreSQL additionally requires an explicit [operator workspace allowance](WORKSPACE_ALLOWANCES.md) before provider admission. The admin **Tool access** page changes or pauses that lifetime estimate cap with an audit reason; customer keys, new sessions, and test deposits cannot grant it. Missing grants deny execution. Pausing preserves incurred and reserved estimates; already admitted calls settle conservatively.

The [hosted rollout checkpoint](SUPABASE_ROLLOUT.md) preserves applied-schema, import, and historical validation evidence. The live app is now hosted at [twohands.tech](https://twohands.tech); the checkpoint distinguishes its current public health check from unverified deployment revision and account/email journeys.

Development uses only `.env.development.local` and a dedicated Supabase project through the [development launcher](DEVELOPMENT.md). Production secrets remain in the hosting environment. A local browser address or a different API port does not isolate a shared database.

## Local data

The default backend is SQLite at `data/apilayer.sqlite`; its directory is created with owner-only permissions. Normal operations append events and replace materialized session/task state. Observation events have a local SHA-256 chain; this checks internal chain consistency, not independent attestation or immutable external custody. WAL sidecars are part of SQLite's operational storage. Protect the directory and any backups as sensitive workspace data.

PostgreSQL is an explicit alternative through `STORAGE_BACKEND=postgres`, a private `DATABASE_URL`, and `LEGACY_WORKSPACE_ID`. Application tables remain in the private `octolab` schema, with no browser-role grants. Use a direct connection or Supabase session pooler on port 5432; transaction pooling cannot retain runtime ownership. Remote connections verify TLS certificates. Follow the [migration guide](POSTGRES_MIGRATION.md) before cutover: stop writers, inspect the read-only SQLite source, migrate the schema, bootstrap and confirm the intended Auth account, stop the runtime, assign its UUID explicitly, import, and verify counts and content digests. Signup before import never inherits history. Setting `DATABASE_URL` alone never switches storage. Preserve backups and historical consent/evidence; after new PostgreSQL writes, selecting the old SQLite file would lose those changes.

Internal storage includes prompts, criteria, normalized query arguments, source excerpts and URLs, evidence assessments, reviewer notes, routing/usage metadata, and estimates. Search providers receive the query and domain filters needed to perform the search; Firecrawl receives an explicitly selected source URL. Review the vendor's terms, data retention, and permitted use before processing sensitive requests.

Analytics consent defaults **off**. The task privacy control can withdraw it immediately or explicitly opt back in. The separate delete action removes a settled task and its event history from local storage; it is blocked while provider operations are active or reserved. Local task storage is necessary to use the workspace; the optional checkbox controls whether that task contributes to provider aggregates. The provider analytics API has an explicit field allowlist, excludes task content, and shows counts from the first opted-in task. Aggregation alone is not a guarantee of anonymity. Do not commercialize this feed without reviewing permissions, terms, licensing, and buyer requirements.

Sanitized trace exports omit prompts, queries, source URLs/content, organization names, reviewer notes, and request arguments. They retain task/call identifiers, timing, policy decisions, observed response metadata, and cost estimates. Company CSV exports intentionally contain the reviewed result and evidence links.

## Observation records and sharing

The MCP bridge exposes intent proposals, session reads, explicit provider tools, cached evidence, and output submission. Intent acceptance, evaluations, case handling, deletion, and the legacy sharing compatibility route are operator HTTP operations, absent from the MCP tool catalog. In PostgreSQL mode, manual creation/approval, evaluation, case mutations, provider lab, and dispute review require a platform administrator account. Actor attribution records account/key identity separately from agent-reported model/host fields. SQLite remains a shared local trust boundary; server/database credentials still grant privileged access.

Each delivered output remains available as a separate version. An evaluation references an exact output ID, accepted intent hash, criterion verdicts, supporting call IDs, and a reported review source. Reviewing a prior version requires an explicit retrospective flag. Cases reference one exact evaluation and record their resolution; no money moves and no coverage is issued.

Observation summary exports omit the objective, constraints, criteria text, model label, output text, source content, URLs, queries, stated explanations, and reviewer/case notes. Private exports intentionally contain them. Identifiers and timestamps remain in summary exports; these are minimized records, not a promise of anonymity.

Commercial aggregate sharing is enabled for all observation sessions under workspace policy. Existing sessions are migrated once with an appended policy event; new sessions record the policy at creation. Per-session opt-out is no longer supported. The aggregate endpoint includes the first recorded settled provider call without a minimum workspace/session count. It contains only fixed provider names and aggregate execution counts/latency. Nothing is automatically sent to vendors. Stated explanations are retained locally and are not part of this aggregate feed. A future licensed data product needs a separate, explicit export contract and permissions.

## Retention

The default age is **30 days**. Cleanup is operator-run, with no automatic schedule. The API and maintenance command share `openConfiguredStore`, so `STORAGE_BACKEND` selects the same backend for both. Stop the API and other maintenance processes, then preserve a consistent backup before applying deletion. SQLite refuses a second writer; PostgreSQL maintenance acquires the runtime ownership lock and refuses to overlap a running API.

Build the maintenance command first. Without `--apply`, it only previews the selected workspace's deletion counts, cutoff, and plan digest; it does not print candidate record IDs or delete records:

```bash
npm run build
# SQLite: DB_PATH must identify an existing source file.
STORAGE_BACKEND=sqlite DB_PATH=./data/apilayer.sqlite RETENTION_DAYS=30 npm run retention
# PostgreSQL: explicitly select a registered workspace; there is no legacy-workspace fallback.
STORAGE_BACKEND=postgres RETENTION_WORKSPACE_ID=<workspace-id> RETENTION_DAYS=30 npm run retention
```

PostgreSQL requires `DATABASE_URL` and an explicit `RETENTION_WORKSPACE_ID` that exists in the workspace registry. On SQLite, an optional `RETENTION_WORKSPACE_ID` must match the source's identity; a missing file or mismatched identity fails. A database URL alone does not change the selected backend.

After reviewing the preview and backup, pass `--apply`. To require the exact previewed plan, reuse its **same cutoff** with `RETENTION_CUTOFF` and supply its digest:

```bash
STORAGE_BACKEND=postgres RETENTION_WORKSPACE_ID=<workspace-id> \
  RETENTION_CUTOFF=<cutoff-from-preview> \
  npm run retention -- --apply --expect-digest=<digest-from-preview>
```

The digest covers the workspace, cutoff, and candidate IDs. A changed plan rejects before deletion. Without `RETENTION_CUTOFF`, each invocation computes a new cutoff from `RETENTION_DAYS`, so a later digest check would not describe the same plan. `--expect-digest` is optional; `--apply` is always required to delete. SQLite uses the same flags with its explicit `DB_PATH`.

Deletion runs in one workspace transaction. A failure rolls back the entire deletion set. It retains running or reserved research tasks, reserved observation sessions, running calls, open review cases, unfinished test plans, recent usefulness reviews, runs linked by retained plans, and source runs needed by retained replays, including replay ancestry. Timestamps exactly at the cutoff are retained. Expired eligible tasks and sessions are deleted with their evidence and event histories; expired reviewed plans and unprotected non-running runs are also eligible. Cumulative key spending and financial ledgers are not reset. Cleanup no longer runs `VACUUM` automatically.

PostgreSQL backups and restores must also preserve `workspace_allowances`, `workspace_allowance_spend`, and `workspace_allowance_events`, including privileges, limits, pause/revision, counters, reservations, and audit history. Research retention leaves these tables intact. They are PostgreSQL-only and are not part of the earlier 24-table SQLite history import. A readable custom-archive catalog and matching file hash verify backup readability/integrity; they do not establish a successful restore drill.

Restore deleted records from the preserved backup if necessary; restarting does not undo applied cleanup. Before the first PostgreSQL write, rollback can select the preserved SQLite source. After PostgreSQL writes, reconcile or export those changes before reverting storage, as described in the [migration rollback guide](POSTGRES_MIGRATION.md#rollback). This checkpoint did not apply retention to the original or hosted application data. Isolated checks cover dry runs, cutoff boundaries, stale plans, rollback after an interrupted deletion, protected evidence, and a neighboring PostgreSQL workspace.

MCP client connection metadata remains until its workspace is removed; it contains client name/version and timestamps, not conversation content. A paused task is not a backup. Apply a separate retention policy to exported files, screenshots, backups, and hosting volumes; filesystem snapshots and external backups are outside this command's deletion control. Scheduling retention across workspaces remains operational follow-up.

## Limits and pricing

| Variable                                    | Default                  | Meaning                                                                                                           |
| ------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `EXA_SEARCH_USD`                            | 0.007                    | Estimate for one search with text from up to 10 returned pages                                                    |
| `TAVILY_SEARCH_USD`                         | 0.008                    | Estimate for one basic search                                                                                     |
| `FIRECRAWL_SCRAPE_USD`                      | 0.001                    | Estimate for one extraction                                                                                       |
| `PROVIDER_TIMEOUT_MS`                       | 20000                    | HTTP request deadline                                                                                             |
| `PROVIDER_RPM`                              | 20                       | Process-local requests per provider per rolling minute                                                            |
| `AGENT_SESSION_BUDGET_MICROS`               | 100000                   | Backend cap per automatically authorized MCP session ($0.10); 0 blocks positive-estimate calls                    |
| `PROVIDER_TEST_BUDGET_MICROS`               | 150000                   | Backend cap per controlled provider run ($0.15)                                                                   |
| `PROVIDER_TEST_DAILY_BUDGET_MICROS`         | 500000                   | Controlled-test allowance per UTC start day ($0.50), separate from organic research                               |
| `ANALYTICS_MIN_TASKS`                       | 5                        | Legacy compatibility setting; no longer gates company/usage reporting (model-review sample rules remain separate) |
| `STORAGE_BACKEND`                           | `sqlite`                 | Explicit runtime backend: `sqlite` or `postgres`; a URL alone does not switch it                                  |
| `DB_PATH`                                   | `./data/apilayer.sqlite` | SQLite workspace or read-only migration source                                                                    |
| `DATABASE_URL`                              | unset                    | Private PostgreSQL connection string; keep server-side                                                            |
| `LEGACY_WORKSPACE_ID`                       | unset                    | Imported workspace UUID used by the PostgreSQL runtime; does not select retention targets                         |
| `RETENTION_DAYS`                            | 30                       | Positive age in days used to compute the cleanup cutoff                                                           |
| `RETENTION_WORKSPACE_ID`                    | unset                    | Explicit registered PostgreSQL workspace to maintain; optional identity check on SQLite                           |
| `RETENTION_CUTOFF`                          | unset                    | Fixed timestamp overriding the computed cutoff, needed to reuse a preview digest                                  |
| `LEGACY_OWNER_USER_ID`                      | unset                    | Intended owner's Supabase Auth UUID, required explicitly for import and verification                              |
| `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` | unset                    | Public hosted Auth origin and publishable key; `VITE_` aliases supported, no secret/service-role key              |
| `SUPABASE_ADMIN_USER_IDS`                   | unset                    | Explicit platform administrator UUID allowlist; empty grants none                                                 |
| `HOST` / `PORT`                             | `127.0.0.1` / `3001`     | HTTP listener                                                                                                     |

Prices are **configurable planning assumptions**, not verified current plan prices. Exa's default is $0.007 for Auto search with up to ten results and page text, checked against its published price card and five provider-reported responses on November 1, 2026. The prior $0.017 default double-counted an allowance for content. Historical receipts keep their original rate card and estimates. Vendor plans, search types, returned contents, credit packages, and discounts can change actual charges. Confirm the official price card and your account plan before use:

- https://exa.ai/pricing
- https://www.tavily.com/pricing
- https://www.firecrawl.dev/pricing

The ledger enforces the task cap against those configured estimates. Actual vendor charges can differ. Provider response usage is displayed separately when available and is not an invoice reconciliation. Set vendor-side caps and validate estimates before larger runs. Errors/timeouts conservatively retain estimates because their billing status is uncertain.

MCP sessions start automatically under backend policy. Consumers do not configure research spending or approve sessions; a shopping budget remains part of their product request. `AGENT_SESSION_BUDGET_MICROS` is read by the HTTP server, not accepted from the agent. Changing it affects new sessions after restart; existing sessions retain their recorded cap. Automatic authorization is an observed backend event, separate from human acceptance and commercial consent. The cap is per session, not an account-wide quota or tenant isolation mechanism. Existing manual operator sessions retain their explicit acceptance flow.

Each observation session and legacy research task has a maximum of 50 provider attempts across search and extraction. The rolling provider rate limit is shared across organic research and the provider lab within the process. Observation calls are explicitly selected by the external agent and are never automatically retried. Legacy research additionally limits each plan to five queries and two search attempts per query, with at most three legacy tasks active simultaneously. The legacy three-task limit does not apply to observation sessions; their admission uses accepted budgets, call counts, and shared provider rate limits. Run a single API server per database; process-local limits are not distributed rate limiting. SQLite exclusive ownership and PostgreSQL's session advisory lock prevent overlapping runtime recovery and maintenance. PostgreSQL import and verification also refuse an active runtime. Losing the advisory-lock connection terminates the API server. Stop the server before maintenance; connection pooling does not enable horizontal deployment.

## Optional keyless extraction

`FIRECRAWL_ALLOW_KEYLESS=true` explicitly opts into Firecrawl's documented free tier. The default remains false. Keyless requests send no Authorization header, use a zero-USD free-tier ledger entry, and preserve provider credit usage separately. They stop on HTTP 401/403/429 without automatic retry or paid upgrade. `FIRECRAWL_KEYLESS_MAX_REQUESTS` defaults to ten requests per server process (configurable 1–50), in addition to the task and rolling provider limits. This local cap does not reset the provider's daily per-IP quota; restarting is not a way to bypass provider refusal. Sign in and configure a legitimate key if the allowance is unavailable.

The observation MCP catalog currently requires a configured Firecrawl key; optional keyless extraction is supported only by the legacy research workflow.

The free tier can change. See [actual live validation](LIVE_VALIDATION.md) and the current [official keyless documentation](https://www.firecrawl.dev/blog/firecrawl-keyless-launch). Firecrawl remains a separate extraction capability; it is not silently substituted for the specified Exa/Tavily search comparison.

## HTTPS proxies

The start/development/CLI scripts enable Node's environment proxy support (`--use-env-proxy`, requiring Node 24.5+). This respects configured HTTP_PROXY/HTTPS_PROXY/NO_PROXY rather than attempting direct egress in managed environments. TLS verification remains enabled. If your proxy uses a private CA, provide NODE_EXTRA_CA_CERTS to the Node process. Docker builds support an optional BuildKit `proxy_ca` secret, mounted only during npm installation; runtime containers need the appropriate read-only CA mount separately. No session CA or proxy credential is embedded in the image.

## Shutdown, recovery, and health

SIGTERM/SIGINT stops accepting connections, asks active legacy plans and controlled provider tests to stop between calls, and waits for in-flight legacy, observation, and lab operations, on-chain verification, and Stripe creation/reconciliation to settle. If the process is killed before provider settlement, startup conservatively consumes outstanding estimates, records interrupted-call and settlement events, and marks affected tasks partial. Observation calls are marked interrupted and retain a conservative estimate; the same request key returns the recorded interruption rather than repeating the provider operation. Repeated recovery does not charge the same reservation twice. Funding recovery follows the separate [Stripe](STRIPE_DEPOSITS.md) and [on-chain](TESTNET_DEPOSITS.md) receipt rules.

`GET /healthz` tests the database connection and returns only `{ "ok": true }`. It does not verify vendor credentials or prove an external provider is healthy. `/api/health` requires account workspace access in PostgreSQL mode or the configured workspace token in SQLite mode and provides connection configuration, not vendor uptime.

Database clients retain an error handler while checked out of the pool. A dropped ordinary connection fails its request and rolls back uncommitted writes; later requests can obtain a fresh connection. The application does not automatically replay the interrupted operation. Losing the dedicated database ownership connection still stops the process to prevent overlapping runtimes. The isolated disconnect regression tests exercise both behaviors and never terminate a hosted database session.

## Deployment artifact

Use the [release and recovery checklist](RELEASE_CHECKLIST.md) for the packaged application/recovery images, compiled migration commands, exact-revision CI evidence, encrypted backup ownership/retention and tested fresh-destination restore procedure. The offline application archive excludes hosted Auth identities and object storage; those need their own recovery arrangements. No hosted backup, restore, data cutover or deployment is implied by a passing isolated drill.

The Dockerfile builds both the browser and server, installs runtime dependencies separately, and runs as the non-root `node` user. Use a persistent `/app/data` volume for SQLite. For PostgreSQL, complete the [verified cutover](POSTGRES_MIGRATION.md) and supply the backend selection, workspace ID, and private connection string through deployment configuration. SQLite refuses public binding without a long owner token; PostgreSQL starts only with valid public Auth configuration and enforces account access. Complete actual redirect/email/login validation before hosted rollout. Supply secrets through your hosting system and terminate TLS in front of the container.

Use the actual CI results for the selected image revision to establish which build/runtime/restart/restore checks passed. It still has to be configured and validated in the target deployment environment; a prepared artifact is not a deployed service. Buyer interviews, vendor terms review, and willingness-to-pay validation remain operational tasks.

Production is the Render service described in `render.yaml`, with one instance and manual deployment. Its attached disk prevents overlapping replacements; keep that setting while the API requires exclusive runtime ownership. Use the [production release procedure](RELEASE_CHECKLIST.md#production-release-on-render) for an explicit stop, migration, and start of the selected revision.

Build and test candidates against a separate development Supabase project. Fixture servers use isolated test ports and disposable database settings; do not point them at the live or development application database. The dedicated runtime-lock connection may show `idle` between requests. That is expected and is not evidence that the lock is stale. Never terminate a hosted database session merely to start a local server.
