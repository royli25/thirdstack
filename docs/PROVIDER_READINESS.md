# Provider service readiness

Assessment date: November 8, 2026. This report covers the provider workbench changes and the inspected local code. It does not certify a deployed service or independently verify historical paid-provider results.

## Release decision

**Verified for a local/operator-controlled pilot. Not yet ready to onboard arbitrary tool companies as a production self-service service.** The provider workflow is functional; deployment, provider identity/access, generic integration onboarding, and model-based experiments require separate verification or implementation.

The canonical integration includes PostgreSQL/Supabase accounts, separate role portals, and a workspace-scoped suite migration. Eight hosted schema migrations and the historical SQLite import have been checksum/content verified; see [the rollout checkpoint](SUPABASE_ROLLOUT.md). Passing local adapter tests does not establish deployed login/email delivery or public-launch readiness.

## What is integrated

| Capability                       | Working path                                                                                                                                            | Practical limit                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Observe organic tool use         | External MCP host → Two Hands provider calls → saved observations → provider Live usage                                                                 | Only requests through Two Hands are visible. Host/model labels are reported, not independently verified.               |
| Provider activity                | 7/30/90-day filters, daily requests, errors, median/p95, estimated cost, USD usage coverage, reported hosts, same-session co-usage, evidence references | Private operator workspace view; PostgreSQL requires platform-admin access. Same-session co-usage is not causation.    |
| Define diagnostics               | Create/duplicate/edit suites, 1–20 search/extraction cases, immutable revisions, public HTTPS validation, stale-edit protection                         | Only the existing Exa, Tavily, and Firecrawl adapters are executable.                                                  |
| Execute live tests               | Pinned suite revision → backend budget checks → serialized run creation → adapter calls → durable receipts → attributed reviews                         | Uses configured provider credentials and estimated spending policy. Estimates are not provider invoice reconciliation. |
| Simulate checks without spending | Completed live run → matching case inputs → revised checks → replay receipts                                                                            | Historical evidence only. No synthetic model agent, new provider execution, fresh timing, or fresh provider usage.     |
| Compare results                  | Direct run baseline/follow-up comparison and existing saved improvement plans                                                                           | Descriptive measurements. Changing references changes the check, not provider performance.                             |
| Keep evidence                    | Saved case/rate/adapter snapshots, private JSON export, versioned usefulness reviews, source links                                                      | Private export includes captured results. It is not an automatically publishable vendor aggregate.                     |
| Keep sources separate            | Demo plans in browser storage; replay excluded from fresh benchmarks; controlled calls excluded from organic/model statistics                           | Company aggregate counts include the first eligible recorded usage; raw customer content stays excluded.               |
| Recover and control work         | Existing stop/drain/restart behavior; source retention for linked replays; idempotent run creation                                                      | Server must be running; no recurring scheduler, multi-worker queue, or automatic retry service is supplied.            |

## What a company cannot use yet

1. **Self-service onboarding for arbitrary tools.** Catalog/adapters are still the three built-in integrations. There is no provider-owned OpenAPI/MCP connector onboarding and credential lifecycle in this workbench.
2. **Raw operator-workbench access for providers.** This workbench remains an operator preview of workspace evidence. The separate [company portal](ROLE_JOURNEYS.md) implements reviewed registration, company-owner/analyst membership, separate insight release, audited team/report access, and aggregate counts from the first eligible recorded usage. It exposes no raw customer research or lab receipts. Hosted account journeys and actual ownership verification still require operational validation.
3. **Actual agent simulations.** There is no configured external-model runner to test descriptions, selection preference, multi-turn tool use, or final-answer quality. Replay is deliberately limited to evaluating saved responses. Matched external-agent studies remain manual plans.
4. **Continuous evaluation operations.** Scheduled suites, a durable multi-worker queue, webhooks/alerts, CI credentials/results gates, and deployment version attribution need implementation and operational checks.
5. **Representative quality claims.** Mechanical reference checks and small diagnostic sets do not measure broad answer quality. Build representative datasets, attributed/independent review, sampling policy, and uncertainty reporting before publishing comparative claims.
6. **Production release validation.** Deploy and verify tenant boundaries, secret storage, migrations and rollback, backups/restore, retention, resource limits, error monitoring, and load/concurrency behavior. The independent database migration is not declared production-ready by this report.
7. **Commercial delivery and billing.** Aggregate publishing is not automatic. Existing test-payment functionality is not a production provider billing or settlement product.

## Verification

Completed verification on November 8, 2026:

- `npm run check`: build passed; 268 tests passed, 6 conditional PostgreSQL checks skipped in the default run.
- Provider browser suite: all 28 checks passed across desktop and mobile, including accessibility and horizontal overflow assertions.
- Disposable PostgreSQL workbench suite: all 6 checks passed, including forced row-level security and cross-workspace suite/replay isolation.
- Formatting on changed provider files and `git diff --check` passed.

[Screenshot: live usage, desktop](screenshots/provider-live-usage-fixture-desktop.png) · [Screenshot: test workbench, desktop](screenshots/provider-workbench-fixture-desktop.png) · [Screenshot: live usage, mobile](screenshots/provider-live-usage-fixture-mobile.png). Screenshots show isolated fixture data, not paid-provider measurements.

Automated checks use isolated adapters, databases, and fixture HTTP servers; they are not paid-provider performance measurements. No new paid-provider calls are required or claimed by this change.

The relevant repeatable commands are:

```sh
npm run check
npm run test:e2e -- tests/browser/provider-lab.spec.ts tests/browser/provider-workbench.spec.ts
```

The new backend workbench tests cover immutable revisions, stale edits, historical replay provenance, no additional adapter usage/spending, benchmark isolation, changed-input rejection, compatibility checks, concurrent idempotent run creation, and observed activity privacy/windowing. Browser coverage exercises suite authoring, live fixture execution, replay, comparison, private download, live usage filters, accessibility, and mobile overflow.

## Where to try it

- `/#lab`: choose a suite, create one, run live calls or replay a saved live run, inspect receipts, and compare a baseline.
- `/#company/exa/activity`: select **Local lab** to see observed workspace activity. Change the provider to inspect another integration.
- `/#company/exa/plans`: preserve hypotheses, baseline/follow-up links, and conclusions.

Research notes and pinned Flovia source links: `research/2026-11-08-flovia-provider-workbench.md`.

Additional storage verification can run the same workbench tests against a disposable PostgreSQL instance:

```sh
OCTOLAB_WORKBENCH_TEST_POSTGRES_URL=postgres://user@127.0.0.1:port/disposable_db npm test -- tests/provider-workbench.test.ts
```

Use a disposable database: the tests apply the repository migrations and create isolated fixture workspaces. PostgreSQL-specific coverage verifies that another workspace cannot read suite revisions or replay sources, and that row-level security is both enabled and forced. Simultaneous review writes preserve both versions. This is local PostgreSQL verification, not a claim about a hosted Supabase project's configuration.
