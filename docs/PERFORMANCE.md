# Loading and performance

Dashboard refreshes wait for the previous request to finish. They pause while the document is hidden and resume when it becomes visible. Data is fetched for the active section: Activity and Usage load usage totals, Activity and Request log load request history, and tool/routing/connection sections load their relevant metadata. Home remains clear for its new design and does not load these dashboard datasets. The customer catalog refreshes once per minute; operator areas refresh every ten seconds, and live activity refreshes every fifteen seconds. These displays are observations, not a live agent heartbeat.

Concurrent identical GETs share an in-flight request within the current account/preview context. Completed responses are not cached by the API helper. Navigation and mutations invalidate pending read reuse so a reopened session or a refreshed receipt obtains current data. GETs have a thirty-second timeout; mutations retain their existing idempotency and retry behavior.

PostgreSQL uses transaction-local runtime role, search path and workspace settings. Setup commands travel in one round trip, using the PostgreSQL driver's literal escaping for the workspace value. Related read queries share one read-only transaction without acquiring a financial/write advisory lock. A read scope cannot switch workspaces; pooled connections reset role and tenant context when the transaction finishes. Writes continue using the existing transaction and reservation locks. Session verification and live revocation checks remain enabled.

Activity uses a date-filtered SQL join, literal search, SQL pagination and a separate count. Captured provider result bodies are omitted before transferring rows. Usage totals are grouped in SQL. Catalog metrics use projected call/review data rather than full page results and answer text, with one routing read and one approved-listing query. Review sample requirements and commercial-sharing eligibility are unchanged.

The sidebar requests `/api/account/funding?summary=true`. It receives current balances and deposit counts without ledger entries or deposit histories. Credits requests the full existing funding response. Historical on-chain credits are imported during startup; balance reads also recognize unimported historical credits without writing or double-counting them. Payment verification, refunds and disputes keep their existing settlement paths.

Large dashboard, company, admin, lab and payment views load as separate JavaScript chunks. `npm run build` creates gzip and Brotli variants of text assets before writing the release manifest. The Express server negotiates those variants with `Vary: Accept-Encoding` and the original content type. Fingerprinted assets use immutable caching; HTML is revalidated so a refresh can find the current build. Deploy the whole `dist/` directory, including `.br` and `.gz` files. Another hosting layer can serve the same files or provide its own compression.

## Verification

Run `npm run check` and `npm run verify:release`. Browser performance regressions are in `tests/browser/performance.spec.ts`; they cover a catalog response slower than the old refresh interval and requests made by the catalog page. The normal browser tests also cover late responses after leaving/reopening sessions, routing edits, activity filters, credits and saved receipts.

For database-specific validation, point `OCTOLAB_TEST_POSTGRES_URL` at a disposable fixture database and run `tests/performance-reads.test.ts` and `tests/postgres.test.ts`. These cover SQL read behavior, RLS, pooled-state reset, read-only enforcement and workspace escaping. Run account tests against a separate disposable database: some Stripe fixture identifiers repeat between suites. Never use the configured application database for fixture tests.

Measure the built server separately from Vite. Record database pool size, data volume, network conditions and authentication state when comparing timings. Service timings with a single diagnostic database connection are useful for query comparisons but are not user-facing HTTP latency estimates. No paid provider calls are needed to test these loading paths.
