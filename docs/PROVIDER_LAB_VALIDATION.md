# Provider lab validation — November 1, 2026

Historical validation report. The November 3, 2026 workspace policy subsequently enabled aggregate sharing for all observation sessions while preserving these original records. See [current discovery and sharing behavior](TOOL_DISCOVERY.md).

This report distinguishes real provider requests, attributed evidence reviews, and synthetic application checks. It does not claim independent model evaluation, general provider superiority, reconciled billing, or a measured change in agent preference.

## Real controlled requests

Two backend-authorized runs used `public-reference-v1`, with a $0.15 per-run estimated cap and a $0.50 daily allowance. Each run made five Exa searches, five Tavily searches, and five Firecrawl extractions. Search providers received the same queries; extraction tested a different capability. No retries were requested.

| Run       | UTC time                      | Saved ID                               | Estimated usage |
| --------- | ----------------------------- | -------------------------------------- | --------------- |
| Baseline  | November 1, 22:54:17–22:54:39 | `4d3d1709-225b-4615-aff6-a93c0776eb93` | $0.130          |
| Follow-up | November 1, 23:05:06–23:05:10 | `1df0c949-ff17-4bb5-94ab-89fb12dd86c7` | $0.080          |

Across both runs, **30 provider calls** settled successfully at the API level, with no outstanding reservations. The total backend estimate was **$0.210**. Exa reported $0.070 in USD usage; Tavily reported 10 credits, and Firecrawl reported 10 credits. Credits are not converted into claimed charges, and reported usage is not an invoice.

| Provider  | Baseline reference checks | Follow-up reference checks | Baseline median | Follow-up median |
| --------- | ------------------------- | -------------------------- | --------------- | ---------------- |
| Exa       | 5 / 5                     | 5 / 5                      | 1,495 ms        | 74 ms            |
| Tavily    | 4 / 5                     | 4 / 5                      | 1,875 ms        | 342 ms           |
| Firecrawl | 5 / 5                     | 5 / 5                      | 456 ms          | 434 ms           |

These are five-case diagnostic samples. The follow-up reused the same inputs soon after the baseline; caching, network conditions, web changes, and provider variation may affect results. The faster follow-up does not establish an improvement caused by the configuration change. Search reference checks require the declared URL in the first three results; extraction checks require a successful page status and declared text markers. Neither measures answer accuracy.

## Findings that led to a concrete change

The prior Exa planning estimate was $0.017 per call. Its responses reported $0.007 for the adapter's Auto search with ten results and included page text. [Exa's published pricing](https://exa.ai/pricing), checked November 1, 2026, supported the $0.007 estimate. The default and local configuration were corrected; historical receipts and rate cards were preserved.

The follow-up's five Exa calls each reported $0.007, matching the new $0.035 aggregate estimate. The baseline estimated $0.085 for those five calls while reporting $0.035. This fixes APILayer's cost presentation. It does not reduce the provider's actual price, establish invoice reconciliation, or demonstrate that an external agent will choose Exa more often.

The saved integration plan `edc632b7-67dd-44e0-b155-daed0b9d518a` links both runs and records those limits. Open the company dashboard, select **Exa → Local lab → Test plans**, and expand **Compare baseline and follow-up**.

## Evidence review, separately attributed

Eight baseline receipts have `assistant_reported` usefulness reviews: three Exa, three Tavily, and two Firecrawl. Reviewer identity is not independently verified. The follow-up has no copied reviews; it remains visibly unreviewed.

The captured evidence shows why execution and reference matching are insufficient:

- Tavily returned Exa's official reference at rank five, failing the top-three check without completely missing the reference.
- Exa found official snowboard pages, but the captured 2,500-character excerpt could end before weight and boot-size rows.
- Firecrawl passed the declared markers while marking three documentation captures truncated at the host's 20,000-character limit.
- The Rome sizing table was useful evidence, but stock labels did not reliably establish selectable inventory.

These observations support targeted inspection of ranking, capture length, and evidence usefulness. They do not justify a general provider leaderboard.

## Application checks

All application tests use injected adapters and isolated databases. Synthetic sessions, calls, reviews, and plans never enter the real workspace or provider/model statistics.

Coverage includes forced selection, matching query inputs, backend run/day caps, missing credentials, idempotent creation, cancellation, shared rate limits, review history, stale-response protection, authentication recovery, first-usage reporting, sharing scope, chronological offering/selection, descriptive comparisons, and retention of linked evidence. A separate child-process test kills execution after a durable reservation and verifies conservative settlement without repeating the request.

The packaged container runs with network access disabled and no provider keys. Its checks cover authenticated lab endpoints, blocked unconfigured tests, demo isolation, and saved-plan persistence across container restart. Live requests above are reported separately from these fixtures.

`npm run check` passed 164 tests across 22 files. The full desktop/mobile browser pass completed 93 checks with one intentional desktop skip of a mobile-only scenario; subsequent receipt-history and skipped-request checks passed on both viewports. Settings and mobile navigation checks also passed after moving the legacy workflow out of the main navigation. A fresh stdio MCP connection verified the eight-tool catalog, automatic session instructions, no consumer budget input, and provider-specific descriptions without invoking a provider.

The isolated endurance run began at 23:03 UTC and was stopped early at the user's request to wrap up around 23:30 UTC. Its last recorded progress contained at least 107 completed cycles, 1,479 simulated provider executions, and 10 database reopens, with zero assertion failures and zero network requests. This was a partial run, not the planned full-hour completion. The process-kill recovery test and packaged restart checks passed separately. No production session or metric was created by these synthetic checks.

## Product limits

The company experience is an operator-accessible local demo, not a deployed multi-tenant vendor portal. Demo data is labeled and stays separate from measured data. Organic company aggregates remain withheld unless enough sessions explicitly opt into commercial sharing; raw consumer tasks and outputs are not returned by the company-insights endpoint.

Forced-provider tests generate integration evidence without waiting for organic selection. They cannot measure whether an agent prefers a provider. The next agent-choice experiment requires matched external-agent tasks, controlled descriptions and budgets, and independent outcome review. No such preference result is claimed here.
