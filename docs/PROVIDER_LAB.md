# Provider lab and tool company demo

This guide describes operator tools. In SQLite/local mode, [Tool company preview](http://127.0.0.1:3001/#company/exa) explores Exa, Tavily, and Firecrawl with demo or private local-lab data. PostgreSQL accounts instead enter the separate [company-owner portal](ROLE_JOURNEYS.md) at #company; registration does not grant access to this lab or its raw receipts. Every PostgreSQL provider-lab and legacy company-insights route requires an explicitly allowlisted platform administrator and an authorized customer workspace.

## Two sources, visibly separate

**Demo data** is an illustrative scenario, labeled throughout the dashboard. Its numbers are constants, not observed paid-provider results. Demo test plans stay in browser storage and do not enter the backend, provider history, or model statistics.

**Local lab** shows actual controlled test receipts and private organic workspace counts, including small samples. Commercial sharing is enabled for all observation sessions. Company aggregate usage is available from the first eligible session offering and using the selected provider, with no minimum workspace/session count; exports contain no objectives, queries, raw answers, notes, model names, or session IDs. The local preview does not publish anything to a vendor or create tenant isolation.

The source selector remembers its value within the browser tab, so inspecting a receipt and returning to the company view preserves context.

## A useful company workflow

1. Inspect the adoption and execution counts. Offering a tool does not establish that an agent considered it, and request success does not establish answer quality.
2. Open an improvement opportunity. Each one distinguishes recorded evidence, a possible explanation, a proposed change, and a way to check it. **Inspect evidence** opens the relevant provider and finding filters; those filters survive reload and never make another provider request.
3. Create a test plan. Define one hypothesis and a success measure before changing a tool description, provider integration, or test rubric.
4. Attach a completed baseline and follow-up for retrieval or integration comparisons. The dashboard displays per-case reference results, execution, review coverage, response time, and estimated cost, with warnings for changed cases, settings, or price assumptions.
5. Record a conclusion and uncertainty. The comparison is descriptive, not causal proof. Web content, cache state, query sensitivity, provider variability, and timing can all affect repeated retrieval.

An **external agent comparison** is a different test type. Forced-provider calls cannot measure agent preference, so this plan type cannot attach retrieval runs as its verification. Document matched external-agent tasks and their results in the plan. APILayer does not claim to run a model experiment automatically.

## Run controlled tests

Open [Provider lab](http://127.0.0.1:3001/#lab), select configured providers, and choose **Run live test**. This is an operator action. Consumers continue to ask normal questions through their external agent; they do not approve test spending or choose research budgets.

The built-in `public-reference-v1` suite runs five fixed cases per selected provider:

- Exa and Tavily receive identical queries, with alternating execution order across cases and runs. The adapter settings remain provider-specific and are recorded.
- Firecrawl receives five fixed public URLs for extraction. Extraction and search are different capabilities and are not ranked against one another.
- The complete suite uses fifteen provider calls. At the current defaults its planning estimate is $0.080; the initial November 1 baseline used the older Exa estimate and recorded $0.130. Historical estimates are never rewritten.
- `PROVIDER_TEST_BUDGET_MICROS` caps each run, default $0.15. `PROVIDER_TEST_DAILY_BUDGET_MICROS` caps controlled testing per UTC day, default $0.50. Run requests select a saved suite revision; they accept no budget override or inline cases.
- One controlled run executes at a time. It shares the process-wide per-provider rate limiter with organic research. A blocked call is skipped with a reason and is not charged to the estimate ledger. No background schedule or automatic retry is enabled.

The fixed `public-reference-v1` suite is deliberately small: three API documentation queries and two product specification queries, plus five extraction pages. It is a diagnostic sample, not a representative consumer benchmark or statistically meaningful general ranking. Broader claims require a predeclared, more representative dataset and independent review.

Operators can create or duplicate a suite containing 1–20 search/extraction cases, with immutable revisions and stale-edit checks. Extraction inputs and reference links require public HTTPS URLs; extraction cases need at least one text marker. A run pins its suite revision and snapshots the actual selected cases and estimate. Editing a suite does not rewrite previous runs.

To recheck saved evidence without spending, choose a completed live controlled run and replay against a compatible saved suite revision. Case IDs, operations, and inputs must match; references, labels, and text markers may change. Replay has zero new estimated spending, no provider request, no fresh timing or usage, and no copied usefulness reviews. It cannot measure agent preference or current provider performance. See [workbench readiness and limits](PROVIDER_READINESS.md).

## Interpret the measurements

| Measurement                     | What it means                                                                                             |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Recorded workspace calls        | Settled organic calls, including successes and failures; excludes controlled tests                        |
| Test calls                      | Settled attempts in a controlled sample, including failures/interruption                                  |
| Requests succeeded              | The adapter received a usable API response; the page or answer can still be inadequate                    |
| Reference check: search         | The predefined page appears among the first three results                                                 |
| Reference check: extraction     | A successful page status and the declared text markers appear in captured content                         |
| Evidence reviewed               | Latest known usefulness judgments; unknown and unreviewed calls are excluded                              |
| Useful / partial / not useful   | Explicitly attributed reported judgments, preserved as review history; not independently verified quality |
| Estimated cost                  | Configured backend planning units, not an invoice                                                         |
| Provider-reported USD / credits | Usage fields from actual receipts; USD and credit units remain separate                                   |

A useful alternate source can fail a narrow reference check. A matching page can omit the passage needed by the task. The first live sample demonstrated both: Tavily located Exa's official reference at rank five, while Exa found a snowboard's official page but its 2,500-character excerpt ended before the required weight and boot-size rows.

Discovery exposes a separately labeled `controlledTestSample` with its source, suite, date, counts, and limitations. These samples never increase organic `sampleCount`, populate a provider quality score, or manufacture model identity or an agent's selection explanation. Zero organic calls means unmeasured organic history, not poor quality.

## Receipts and recovery

The lab stores runs, plans, and custom suite revisions in `provider_lab_runs`, `provider_experiments`, and `provider_lab_suites` on the selected SQLite or PostgreSQL backend. Each run snapshots cases, suite version and hash, adapter settings, the rate card, backend authorization, and estimated budget. Requests reserve their estimate before network I/O. Short database transactions serialize admission, reservations, and saved run mutations; provider requests execute outside those transactions. Failures retain a conservative estimate because billing status may be uncertain.

Run creation is idempotent by `requestKey` and normalized provider selection. Exact replays return the original run; changed arguments with the same key are rejected. Stop requests allow the current call to settle and skip remaining calls. Graceful shutdown stops new work and drains the current request. After a process kill, startup marks the outstanding call interrupted, consumes its reserved estimate once, and never silently repeats it.

Usefulness reviews append versions and record the claimed author type. Review and plan mutations do not have request-key replay semantics; after an uncertain response, inspect the current record before retrying. Plans are editable operator records, not signed attestations.

Recurring dashboard reads omit captured page bodies. Full receipts are loaded only when needed. Maintenance retains running tests, recent reviews, unfinished plans, and runs linked from retained plans. Completed unlinked tests and expired reviewed plans follow the documented retention command. Backups and exports require their own retention policy.

## API

These endpoints enforce same-origin JSON writes and workspace access. In PostgreSQL account mode, every `/api/provider-lab` route requires a platform administrator from `SUPABASE_ADMIN_USER_IDS`; workspace ownership alone is insufficient. SQLite retains its workspace-token boundary. These are operator APIs, not additional MCP tools.

| Endpoint                                                 | Behavior                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET /api/provider-lab`                                  | Suite, backend policy, provider configuration, run summaries, measurements, and plans   |
| `POST /api/provider-lab/runs`                            | Start a test using `{ requestKey, providers, suiteId?, suiteRevision? }`                |
| `POST /api/provider-lab/suites`                          | Create a versioned suite with title, description, and cases                             |
| `POST /api/provider-lab/suites/:id`                      | Append a suite revision with `expectedRevision`; stale writes return `409`              |
| `POST /api/provider-lab/replays`                         | `{ requestKey, sourceRunId, suiteId, suiteRevision }` rechecks saved compatible results |
| `GET /api/provider-lab/runs/:id`                         | Read the full saved run and captured receipts                                           |
| `POST /api/provider-lab/runs/:id/stop`                   | Stop remaining work after the current request settles                                   |
| `POST /api/provider-lab/runs/:id/calls/:callId/review`   | Append `{ verdict, note, author }`                                                      |
| `POST /api/provider-lab/experiments`                     | Create a test plan                                                                      |
| `POST /api/provider-lab/experiments/:id`                 | Update a test plan                                                                      |
| `GET /api/company-insights/:provider?source=demo\|local` | Company preview for Exa, Tavily, or Firecrawl                                           |

## Reproduce durability checks

```bash
npm run check
npm run test:e2e
SOAK_SECONDS=60 npm run test:soak:providers
```

The soak uses an isolated synthetic SQLite database and injected adapters. It forbids network requests and exercises replay, cancellation, failures, revised reviews, repeated reopen/recovery, company views, and separation from organic statistics. Its output is not provider performance data. A separate process-kill test verifies recovery after a durable reservation. The packaged container test verifies authenticated endpoints, missing-key rejection, demo isolation, and plan persistence across restart without any provider credentials.

See [the validation report](PROVIDER_LAB_VALIDATION.md) for the real baseline, follow-up, pricing correction, attributed reviews, and limits of the measured results.

The overview labels organic request success separately from controlled reference checks and usefulness reviews. Controlled execution counts appear alongside them. A missing review is not a failed test.
