# Flovia review and octolab provider workbench

Reviewed November 8, 2026. Reference repository: [flovia/poc](https://github.com/flovia/poc), `main` at `1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090`. This is a source-code assessment, not verification of Flovia's deployed service or production data.

## What Flovia implements

Flovia is primarily an intelligence layer around machine payments. It collects discovery and on-chain signals, projects them into provider/customer read models, and displays adoption, co-usage, payment routes, customer activity, and discovery coverage. It is not a reference implementation of a general-purpose provider evaluation runner.

- **Contracts, sources, intelligence:** shared schemas and normalization live in `packages/contracts`, external capture clients in `packages/sources`, and derived customer/market logic in `packages/intelligence`. CLI ingestion is separate from dashboard rendering. See the [root architecture](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/README.md).
- **Actual analytics data path:** the BFF can use fixture data, generated JSON, PostgreSQL snapshots, or PostgreSQL live read models. Configuration selects the source. The live path queries stored provider/customer rows and builds render-ready payloads; it does not imply that every frontend screen is receiving streamed customer telemetry. See [source selection](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/apps/bff/src/data/analytics-source.ts) and [live query adapter](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/apps/bff/src/data/postgres-live/source.ts).
- **Capture and ingestion:** CLI pipelines capture payment/discovery records and produce analytics read models. This is a real ingestion implementation, although I did not execute paid APIs or verify deployed ingestion. See [capture pipeline](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/apps/cli/scripts/analytics/capture-full.ts).
- **SDK-connected views:** the frontend data dispatcher loads SDK fixtures for the connected mode. That mode is not evidence of a production request-telemetry SDK. See [frontend dispatcher](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/apps/frontend/lib/data-source.ts).
- **Growth intelligence:** its adoption/source cohorts, repeat cohorts, endpoint flows, and action bridge are useful product ideas. The screen explicitly displays a demo badge. See [growth screen](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/apps/frontend/components/api-growth/ApiGrowthIntelligenceScreen.tsx).
- **Discovery coverage:** contracts distinguish registry presence, schemas, networks, verification metadata, and published rolling usage fields. Discovery data is not substituted for demand. See [discovery contract](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/packages/contracts/src/aeo.ts).
- **Tests and simulations:** the inspected tree contains implementation tests, fixture generators, and payment showcases. I found no general provider-facing scenario editor, synthetic-model test runner, or durable evaluation scheduling service. Proposed pricing and packaging experiments in [product direction](https://github.com/flovia/poc/blob/1c1e6f1b3a1fa691b4cc1f7fe8daf1b570cdb090/docs/product-direction.md) should not be described as shipped capabilities.

The April frontend capability and gap documents are useful historical context, but newer source files contain additional data-source modes. This assessment prioritizes the current implementation over those older descriptions.

## What to adapt

Use the provider perspective and the path from measurement to action: see adoption, inspect execution and co-usage, form a hypothesis, fix the scenario/rubric, run a comparison, and retain evidence. Keep provenance visible at every step.

Octolab observes explicit tool requests through its own MCP router. That gives it request inputs, execution results, stated explanations, submitted outputs, and attributed reviews that payment records alone cannot establish. It should use those observed signals instead of inventing wallet identities, SDK telemetry, customer retention, or inferred agent reasoning.

## Implemented in this change

- An organic **Live usage** tab under each provider: 7/30/90-day UTC windows, request trend, settled success, median/p95 timing, estimate ledger, USD reporting coverage, caller-reported hosts, same-session tool co-usage, failures, and output evidence references. Polling shows saved observations, not a provider heartbeat. No raw objective, query, answer, URL, or explanation is returned by the activity endpoint.
- Persistent **custom suites** with 1–20 explicit search/extraction cases, immutable revisions, stable case IDs, public HTTPS input validation, and optimistic revision checks. The built-in diagnostic remains available and cannot be edited in place.
- **Live execution** pins the chosen suite revision and reuses the existing bounded provider runner, receipts, cancellation, budget accounting, and recovery. Concurrent run creation is serialized through the storage transaction.
- **Replay simulation** reruns mechanical reference checks on previously captured live responses, without network calls or spending. Replay requires matching IDs, operations, and input strings. References/text markers may change. It does not simulate a model or a new provider response. Timing, provider usage, and reviews are not copied into new measurements.
- **Comparisons** are available directly on run details as well as saved improvement plans. Replay comparisons explain their limits. A **private run export** contains the selected run and its captured evidence.
- Controlled provider samples and company benchmark summaries exclude replay runs. Replay sources are retained while linked by a retained replay. Fixtures remain confined to test processes.

## Remaining product work

This is a useful integrated operator workbench, not a complete self-service SaaS for arbitrary tool companies. See `docs/PROVIDER_READINESS.md` for release boundaries and verification evidence. In particular, real external-model experiments, recurring background execution, generic provider onboarding, provider-owned access controls, and deployment/operational validation are distinct workstreams. A replay must never be sold as evidence that an agent preferred a tool or that a provider improved.
