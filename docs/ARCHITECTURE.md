> This document covers the legacy research engine. See [observation architecture](OBSERVATION_ARCHITECTURE.md) for the primary external-agent workflow and its API.

# Architecture and routing

The browser talks only to this application's API. The server owns provider credentials, eligibility, routing, budget reservations, execution, and event persistence.

The diagram shows the default SQLite path. Both this engine and the observation workflow now use asynchronous storage operations through `server/database.ts`; PostgreSQL is available after the [explicit verified cutover](POSTGRES_MIGRATION.md).

```text
React workspace → Express API → explicit plan runner → deterministic router
                                  ↓                      ↓
                             SQLite events         Exa / Tavily
                                  ↑                      ↓
                             human review ← normalized evidence

Known source URL → same task ledger → Firecrawl extraction (optional)
```

## Routing policy: deterministic-v1

Only Exa and Tavily compete for `research.search`. Firecrawl implements `research.fetch_url`; it never competes against search providers.

A search candidate is excluded when its key is absent, its estimate exceeds the remaining task budget, or its process-local request limit is reached. A provider already attempted for this invocation is excluded from fallback. Every candidate and exclusion is recorded before selection.

Components are in the range 0–1, higher is better:

| Component   | Calculation                                                             | Cold start                        |
| ----------- | ----------------------------------------------------------------------- | --------------------------------- |
| Cost        | `1 - estimate / (2 * max(search provider estimates, 1))`                | Uses configured estimates         |
| Latency     | `1 / (1 + mean_ms / 1000)` from up to 30 most recent observations       | Neutral 0.5 until 5 observations  |
| Reliability | Successful executions / observed executions                             | Neutral 0.5 until 5 observations  |
| Quality     | Mean rubric pass fraction from fully reviewed sources, grouped per call | Neutral 0.5 until 5 audited calls |

| Profile  | Cost | Latency | Reliability | Quality |
| -------- | ---- | ------- | ----------- | ------- |
| Balanced | 0.35 | 0.20    | 0.25        | 0.20    |
| Cost     | 0.65 | 0.10    | 0.15        | 0.10    |
| Latency  | 0.15 | 0.55    | 0.20        | 0.10    |

The router selects the highest eligible weighted sum; provider ID is a stable tie-breaker. Unknown signals are flagged as insufficient data. No provider performance benchmarks are seeded. Human review is a local, imperfect signal, not a validated benchmark or causal comparison.

Automatic mode stops after the first provider returns sufficient _search evidence coverage_. A provider error, timeout, invalid response, or insufficient coverage can trigger the other provider, subject to budget and limits. Compare mode attempts both providers using the same normalized query. There are no hidden same-provider retries.

Plans contain up to five explicit queries. The runner issues them in sequence and can be stopped between calls. An in-flight request still settles because stopping locally does not establish that the vendor did not bill it.

## Three different outcomes

1. **API execution:** observed HTTP outcome and latency. A 200 response can contain an invalid payload or unusable evidence.
2. **Search coverage:** at least three distinct normalized source URLs, each with an excerpt of 80+ characters. This intentionally modest check says nothing about whether a company is active or funded. It is named and versioned `search-coverage-v2`.
3. **Task evidence:** human pass/fail/unknown assessments against the explicit rubric. Acceptance requires an organization name, all criteria passing, and an evidence note. Evidence may differ by criterion. Unresolved evidence is unknown, not failed. The shortlist counts distinct normalized organization names, not URLs.

Search execution marked complete never asserts that the company target is complete. The workspace reports both source counts and accepted organization counts.

## Ledger and durability

USD amounts use integer micro-units: $1 = 1,000,000. Before a request, an awaited database transaction reserves its configured estimate and records the provider request. The task's spent plus reserved estimates cannot exceed its approved budget. A second transaction settles the estimate and stores response metadata; normalized search sources are persisted with that settlement. PostgreSQL serializes these short transactions by workspace; provider network I/O occurs outside them. Legacy task writes reject changed snapshots rather than overwriting another operation's state.

All executed attempts retain their estimate, including HTTP errors, network failures, and timeouts. This deliberately overestimates some failures instead of incorrectly declaring them free. Provider-reported dollars or credits are captured separately when returned; they do not silently become invoice-reconciled charges. Credits are not interpreted as USD.

The rate-card version includes a digest of the configured provider prices, so configuration changes remain distinguishable in historical traces.

Known evidence URLs retain user-input provenance, separate from search provider returns. Firecrawl extraction stores its own call ID, access mode, and retrieved page status. Source versions protect against accepting stale reviews; content/page-state changes invalidate every dependent criterion.

The database enforces one reserve, settlement, request, and response event per call ID. Settlement is idempotent. On restart, unmatched reservations become conservative settled estimates with unknown billing and interrupted-call events. Task history is append-only during normal operation; retention deletes whole expired tasks and cascades their events.

This architecture supports one application process per database. SQLite retains one shared local workspace; PostgreSQL serves account-authorized workspaces. SQLite exclusive ownership or PostgreSQL's session advisory lock blocks another runtime or maintenance process before recovery overlaps live work. PostgreSQL lock-connection loss terminates the server. In-memory active-task and rate-limit state still has no distributed queue or horizontal worker leases. PostgreSQL uses a private schema with workspace-scoped keys and forced row-level security, with [Supabase Auth session checks, live membership, and explicit platform administrator roles](AUTH.md). Browser requests select an authorized workspace; scoped keys resolve their own workspace from the key hash. Current dashboard summaries still aggregate some history in application memory.

## Request retry safety

A request receipt binds an optional Idempotency-Key to the task, capability, and a hash of normalized arguments. Initial task state and receipt persistence commit together before scheduling execution. Duplicate requests replay a stored response or report that the operation is pending; they do not rerun provider calls. Completed extraction errors are replayed too, preserving the conservative estimate already settled. Pending receipts are marked interrupted on restart and require trace review before a new deliberate request.

A process-level fault test kills an isolated server while its fixture-backed provider request is in flight, then reopens the real SQLite/WAL database. It verifies one conservative settlement, release of database ownership, persistence across restart, and rejection of a retry under the interrupted key. No real vendor is contacted by that fault test.

## Actual vendor requests

Checked against vendor documentation on 1 November 2026:

- [Exa search specification](https://github.com/exa-labs/openapi-spec/blob/master/exa-openapi-spec.yaml): `POST https://api.exa.ai/search`, `x-api-key`, auto search, 10 results, text content capped at 2,500 characters per result, optional includeDomains.
- [Tavily search](https://docs.tavily.com/api-reference/endpoint/search): `POST https://api.tavily.com/search`, Bearer authorization, basic search, 10 results, no generated answer/raw content, opt-in usage metadata, optional include_domains.
- [Firecrawl scrape](https://docs.firecrawl.dev/api-reference/endpoint/scrape): `POST https://api.firecrawl.dev/v2/scrape`, Bearer authorization, Markdown extraction, only main content.

The application normalizes only HTTP(S) URLs without embedded credentials, enforces configured search domains again after receiving results, clips source text, bounds response payload size, and never reflects raw vendor error bodies. Extraction is restricted to already returned source IDs with public-looking HTTPS hostnames, no literal IPs, local suffixes, or custom ports. Firecrawl performs the remote retrieval; this server does not fetch arbitrary source pages itself.
