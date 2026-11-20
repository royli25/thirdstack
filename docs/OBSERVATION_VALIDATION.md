# Observation validation — November 1, 2026

Historical validation report. The November 3, 2026 workspace policy subsequently enabled aggregate sharing for all observation sessions while preserving these original records. See [current discovery and sharing behavior](TOOL_DISCOVERY.md).

This records local implementation validation, not a model benchmark or a claim of insurance coverage. Provider results below came from real public-source calls; automated fixtures ran in separate databases and processes.

## Automatic backend authorization update

The consumer MCP flow now starts research immediately. `record_intent` accepts no research-budget input and returns an active session without an approval flag or dashboard link. The backend supplies the estimated cap. A consumer's equipment budget stays in the task constraints. `intent_authorized` has observed provenance and is distinct from an operator's `intent_approved` event; existing manual proposals remain unchanged.

Code revision `6454012499bba733e5d76f9073e1d6cba9ca534d` passed [the full CI run](https://github.com/royli25/APILayer/actions/runs/41354118827): **145 unit/API/protocol tests across 20 files**, **71 browser checks passed with one intentionally skipped desktop instance of a mobile-only check**, formatting, and both packaged-runtime checks across a container restart. The automatic-session tests cover backend cap selection, rejected client overrides, a zero cap, rollback when authorization-event recording fails, two-client retry behavior, export provenance, and desktop/mobile presentation without an approval button.

The first durability attempt exposed an outdated verifier assumption that every authorized session must have a human-approval event. The fix verifies the backend policy event and its cap, and detects changes to authorization provenance. A separate initial CI attempt exposed a container smoke test that still expected full session details from `record_intent`; it now uses `get_session` for those internal details. The successful run above includes both corrections.

The corrected backend-mode durability run completed its full **20-minute window**, from 21:47:41 to 22:07:41 UTC: **100 cycles, 100 synthetic provider executions, 10 database reopenings, zero failures, and zero network requests**. Each cycle checked automatic authorization, concurrent retry receipts, output versions, review/case records, spending limits, and offline evidence verification. Every reopening also checked that the backend cap still prevented another execution. Injected adapters and a separate SQLite file kept this workload out of production provider and model statistics.

A real consumer research request was then completed through a fresh stdio MCP SDK connection: **5 Tavily searches and 6 Firecrawl extractions**, all successful, with **$0.046 in configured estimated cost** under the backend's $0.10 session cap. This was the primary Codex agent driving the SDK client, not a second autonomous host or an independent model test. The recorded host is `Codex via MCP SDK`; model identity is not reported. A delivered output was submitted with receipt IDs. No evaluation was invented, no purchase was made, and commercial sharing remains off. This estimate is separate from the earlier live runs below and is not a vendor invoice.

Some extraction receipts are explicitly truncated. Supplementary read-only storefront checks happened through the host's browser tool, outside APILayer, and are not presented as APILayer-observed calls. After restarting the local HTTP service, a fresh MCP connection recovered the completed session and an identical cached source receipt. Call count, estimated spending, output versions, and consent stayed unchanged. The private export passes offline verification. No fixture records entered the production workspace.

Local records for this update are in `.gstack/qa-reports/backend-policy-live-2026-11-01/` and `.gstack/qa-reports/backend-policy-2026-11-01-fixed/`, excluded from source control. The live private export is local operational evidence; research content and provider credentials are not included in this documentation.

## Earlier live external-agent sessions

| Host           | Task                                                          | Actual APILayer provider calls             | Configured estimate |
| -------------- | ------------------------------------------------------------- | ------------------------------------------ | ------------------- |
| Claude desktop | Explain Example Domain's purpose and operational-use guidance | 1 Firecrawl extraction                     | $0.001              |
| Codex CLI      | The same public-source verification                           | 1 Firecrawl extraction                     | $0.001              |
| Codex CLI      | Compare Exa/Tavily documentation for search content retrieval | 2 Tavily searches, 3 Firecrawl extractions | $0.019              |

Total new provider estimate: **$0.021**, separate from vendor-billed charges and host model usage. Each session had an accepted $0.026 estimated cap. No keys or private user documents were sent in these research prompts. Commercial sharing remains off for every session.

The dashboard retains these local records:

- Claude: `a52cd7d4-c0ce-47b1-ad74-ee430cddd040`
- Codex public source: `3ba6e2af-7415-458c-8795-bdbeb7473add`
- Codex documentation research: `4f5d4fc2-ccdd-46e9-9243-8104410f2804`

Claude selected direct extraction for a known URL and supplied a short selection explanation. Codex's documentation task chose Tavily, narrowed its search when the first results did not cover Exa, and extracted the official pages. These are observed calls and agent-reported explanations; private reasoning and outside-host activity are not captured.

The first Codex public-source attempt was blocked by its host approval policy before reaching a provider. It honestly submitted an incomplete answer. That version remains in history, with a retrospective assistant review and a resolved integration case. A later bounded invocation permitted the specific tool, returned the public page, and submitted a corrected answer. Global host approval settings were not weakened. The case records the setup correction; no refund or payment occurred.

Reviews of the captured source passages are labeled **Assistant review**. The completed answers meet their narrow integration rubrics; this is not independent human validation or a comparative accuracy claim. Model-level scores remain withheld: the sample is too small, and the Codex model identity is not reported. Claude's model label was entered from its desktop selector, not independently attested.

After the final connector update, Claude desktop was restarted and successfully used the new `get_evidence` tool to reread its saved Example Domain receipt. The provider call count, delivered output count, review count, and estimated spending stayed unchanged. A fresh Codex CLI session also successfully read the research session and cached Exa documentation receipt using only `get_session` and `get_evidence`, with no provider calls or new output versions. The actual Claude client-reported name was recorded as `local-agent-mode-apilayer`; this is connection provenance, not model attestation.

The Exa and Tavily documentation extractions hit the earlier 20,000-character capture limit. The stored answers were reviewed against passages actually present in those snapshots. New receipts explicitly record truncation and character counts; older receipts are not backfilled with invented completeness measurements.

## Automated coverage

The unit/API/protocol suite covers accepted-intent fingerprints, unapproved and over-budget calls, concurrent reservations, shared provider admission, exact retry receipts, missing keys, provider errors, public-URL checks, output versions, partial/unknown reviews, retrospective review, case lifecycle, model sample thresholds, consent withdrawal, export minimization, and deletion.

Additional process-level checks exercise the real MCP SDK over stdio to authenticated HTTP; an actual child-process kill after budget reservation; recovery without duplicate provider execution; history beyond 500 sessions; and retention preserving active work/open cases. The offline verifier detects modified outputs, captured source content, reviews, accepted intent, case resolutions, consent, and broken event chains.

Browser coverage runs at desktop and mobile sizes and includes the earlier research workflow. Checks cover approval, review and revision, historical output/case selection, direct saved-evidence reads, safe Markdown, partial extraction, authentication recovery, stale responses, keyboard navigation, responsive dialogs, and axe accessibility scans.

Before the automatic-authorization update, the completed unit/API/protocol run had **140 tests across 20 files passed**. This includes simultaneous retries from two independent MCP clients against one server, with exactly one execution and one budget charge. That browser run completed with **69 passed and one intentionally skipped desktop instance of a mobile-only drawer check**. It includes original-text fallback when the optional document renderer cannot load. The newer counts are recorded above.

The document renderer is loaded on demand. The initial JavaScript bundle decreased from approximately 607 kB to 444 kB (134 kB gzip); this is an asset-size measurement, not a measured page-load speed claim. A timing-sensitive response-body test was given a one-second fixture deadline so parallel CPU load does not cause it to expire before loopback headers arrive. Production provider deadlines were unchanged.

## Packaged runtime

A local Docker build completed and was run with `--network none`. The packaged app passed authentication, missing-key guards, legacy recordings, source provenance, exclusive database ownership, and the new stdio MCP lifecycle over loopback. After a real container restart, intent, output, unknown evaluation, resolved case, consent state, client history, and the local event chain remained intact. No provider keys were supplied to this container; external network access was disabled. The disposable validation container was removed after the checks. This packaged-runtime check preceded the final browser-only document-renderer split; the later production build and full browser suite passed separately.

The CI container job now runs the observation smoke test before and after restart alongside the existing research smoke test. Build context excludes local `.env`, data, `.mcp.json`, and QA records.

## Durability runs

Two isolated synthetic workloads ran during the implementation window. Both were stopped at the user's request to wrap up at approximately 21:21 UTC, before their originally planned durations finished:

- The core-workflow run started at 20:18:31 UTC and ran for approximately 63 minutes: **313 completed cycles, 313 synthetic executions, 31 database reopenings, zero failures**. It exercised idempotent concurrent requests, failures/missing pages, outcomes, evaluations, cases, consent changes, and repeated database reopenings.
- The later-implementation run started at 20:57:35 UTC and ran for approximately 24 minutes: **119 completed cycles, 119 synthetic executions, 11 database reopenings, zero failures**. It additionally covered output revisions, retrospective reviews, old-submission receipt replay, and offline export verification.

Both used injected adapters and synthetic model names in separate SQLite files. They made no provider network requests and never contributed to the real workspace's statistics. `stopped-result.json` preserves each run's last completed checkpoint and explicit early-stop status; neither is reported as a completed 75- or 50-minute run.

## Evidence and reproducibility

Local detailed logs, screenshots, pre-migration backup, exported integration records, and soak results are under `.gstack/qa-reports/observation-2026-11-01/`, excluded from source control. They are local operational evidence, not a public data feed.

Reproduce the checks with:

```bash
npm ci
npm run check
npm run test:e2e
npm run format:check
npm audit
SOAK_SECONDS=60 npm run test:soak
SOAK_SESSION_MODE=backend SOAK_SECONDS=1200 npm run test:soak
npm run verify:evidence -- /path/to/private-evidence.json
```

Build before browser testing because the fixture HTTP servers serve the built browser assets. Do not run build and browser tests concurrently when validating a final revision.

## Limits

- Local shared workspace; no multi-tenant access isolation or independently verified operator/model identity.
- Captures APILayer tool use and explicitly submitted outputs, not the complete host conversation or private chain of thought.
- Costs are configured estimates; no invoice reconciliation, coverage contract, claims adjudication, or payment rail.
- Event/export verification checks internal consistency, not external custody or proof against a party rewriting all records and hashes.
- Exa's new MCP path is covered with protocol fixtures; this implementation's live external-agent research selected Tavily and Firecrawl. Earlier live Exa research remains in the preserved legacy workspace.
- No commercial data was published or sold, and no deployment was performed.
