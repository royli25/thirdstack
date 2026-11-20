# Validation and handoff

## Implemented from the PRD

| Area                 | Implementation                                                                                                 | Live acceptance status                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| M1 Integration       | Real Exa/Tavily adapters, optional Firecrawl, normalized evidence, env-only keys, classified errors            | Completed: ten successful REST calls each to Exa and Tavily; one keyed Firecrawl extraction |
| M2 Router            | Eligibility, score components, explicit plan, estimate ledger, fallback/comparison, limits, full event history | Inspect selections and actual usage under real account plans                                |
| M3 Intent/evaluation | Editable rubric, criterion-specific links, explicit unknowns, human review, accepted shortlist                 | Review a live research task and demonstrate a real evidence gap                             |
| M4 Intelligence      | Three product screens, consent-scoped allowlisted counts, aggregate metrics, sanitized export, company CSV     | Consented live cohort; buyer interviews and usefulness assessment                           |

## Automated verification

Local verification: **76 unit/integration tests and 36 desktop/mobile browser scenarios passed**. `npm audit` reported zero vulnerabilities. The local Docker build, authentication, and restart-persistence checks also passed. These local follow-up commits have not been pushed or run through GitHub CI.

- Strict TypeScript for client, server, and tests; browser and standalone Node production builds.
- Regression coverage for Back/Forward, same-document task links, missing and delayed sessions, authentication recovery, and deadlines while provider response bodies stream.
- Unit/integration tests for normalized provider contracts, unknown signals, observed routing, budget reservations, fallback, compare mode, multi-query plans, errors/timeouts, domain enforcement, restart recovery, API validation/auth, content-free export, analytics gating, reviewed quality, and CSV escaping.
- Playwright desktop and mobile flows for saving intent, reload persistence, inspector payloads, privacy gating, connection setup, fallback after an insufficient HTTP 200, both-provider comparison, evidence review/shortlist delivery, extraction, and CSV download.
- Automated WCAG A/AA checks on the initial workspace and the fixture-backed evidence workflow, alongside overflow and browser-error checks. These are scoped automated checks, not a complete accessibility certification.
- The non-root Docker image builds from a clean dependency install. Runtime checks pass for health, bearer authentication, task persistence, rejection of unconfigured paid operations, and persistence after restart.
- CI runs builds, tests, formatting, browser scenarios, and the container/restart check without provider secrets.

The fixture browser server intercepts only the three fixed provider URLs in its own isolated test process. Every generated source is explicitly marked **TEST FIXTURE**. Production never imports that server or exposes a mock-provider toggle. These tests verify contracts and behavior, not actual vendor availability, billing, or relative quality.

## Not claimed as complete

The account owner supplied server-side keys, and the required Exa/Tavily REST acceptance calls (ten successful responses each) plus one authenticated Firecrawl extraction passed; see [live evidence](LIVE_VALIDATION.md). Comparative provider performance, invoice reconciliation, and a verified live company list remain outstanding. `npm run smoke:live` remains the explicit budget-gated acceptance runner for other environments.

This version uses explicit user queries plus human evidence assessment. It does not autonomously discover private intent, infer funding from ungrounded snippets, or assert task completion based on an HTTP response. Search coverage is intentionally separate from substantive rubric verification.

No deployment, buyer interviews, vendor redistribution permissions, revenue, willingness-to-pay, multi-tenant security, or financial risk product has been established. Those are rollout dependencies rather than UI states to simulate.

## Live acceptance procedure

1. Verify vendor accounts, terms, prices, rate limits, and spending caps.
2. Configure both search keys. Configure Firecrawl only if extraction is desired.
3. Build and start; confirm the Connections screen shows configuration without revealing key values.
4. For the PRD's integration count, explicitly run the paid `smoke:live` command with a sufficient budget. Inspect the saved task in the workspace.
5. Run the default task in automatic and compare modes. Inspect scores, requests, response statuses, fallback conditions, estimates, and usage metadata.
6. If no useful quality difference appears live, report that honestly. The automated fixture scenario is a test, not historical/live performance evidence.
7. Review evidence links against every criterion; record unknowns and missing proof. Accept only grounded organizations, then export the shortlist.
8. Verify zero-usage responses and first-task/provider counts. Confirm nonconsenting tasks and raw content remain excluded.
9. Interview five potential API-provider buyers and record which observed metrics are useful, unhelpful, or potentially worth paying for. Do not infer commercial demand from the dashboard itself.

## PRD acceptance evidence matrix

| PRD criterion                                                                        | Evidence now available                                                                                                   | Remaining dependency                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Every executed operation has task/call identity, timestamps, status and ledger entry | Engine/API tests; real Firecrawl success and missing-page traces; transactional reservations and repeat-request receipts | Continue this instrumentation on authenticated search accounts                                                 |
| Two comparable search providers are genuinely called                                 | Exa and Tavily REST contract tests plus ten authenticated successful calls to each provider                              | Completed for this local account setup; ongoing vendor availability and invoice reconciliation remain separate |
| Explain provider selection and show actual fallback or comparison                    | Deterministic candidate snapshots and replay; fixture-backed fallback/comparison tests                                   | Controlled live comparison completed; an observed live fallback remains scenario-dependent                     |
| Distinguish API success from task usefulness                                         | Real Firecrawl API HTTP 200 with page HTTP 404, unusable evidence and no accepted company; replayable without keys       | Review substantive company funding/activity/relevance evidence on a live research task                         |
| Three cross-provider insights traceable to permitted events                          | Consent-scoped conversion, demand, and coverage/fallback counts; tests verify no double counting or content exposure     | A real consented cross-provider cohort; no production demand or quality benchmark is claimed yet               |
| Buyer validation                                                                     | Interview procedure and metrics hypothesis are documented                                                                | Five actual buyer interviews; no outreach or purchasing claim was fabricated                                   |

The application is ready for a local demonstration of routing instrumentation, evidence lifecycle controls, and a genuine recorded outcome failure. This matrix keeps account-dependent search validation and commercial validation explicit rather than marking them complete because the UI or fixture suite works.
