# Test and improvement plan — second pass

Started 1 November 2026, 12:22 UTC. Scope: one additional hour of implementation and validation. Human-required account controls are stopping points, not challenges to bypass.

| Priority | Work                                                       | Exit evidence                                                                                               | Human dependency                                                            |
| -------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P0       | Verify official free-tier/key access paths                 | Linked current primary sources and one bounded request where explicitly permitted                           | Exa/Tavily account sign-in and API keys                                     |
| P0       | Exercise live Firecrawl extraction through the application | Real request, normalized result, trace, and correct ledger semantics; no hidden live fixture                | None when explicitly opting into supported keyless tier; stop if refused    |
| P0       | Check ledger/routing invariants                            | Duplicate run, task/request limits, cancellation, failure/restart, and settlement checks                    | None                                                                        |
| P1       | Improve evidence correctness                               | Duplicate URLs cannot inflate coverage; changing extracted evidence cannot silently retain stale acceptance | Human substantive verification remains required                             |
| P1       | Improve practical setup                                    | Capability-specific readiness, exact account/key handoff links, and actionable blocked states               | Sign-in, CAPTCHA, email verification, or payment selection when encountered |
| P1       | Verify privacy and cleanup                                 | Consent withdrawal and deletion remove local aggregate contributions; sanitized export remains content-free | Operator controls external backups                                          |
| P2       | Live search acceptance                                     | Ten successful REST calls each to Exa and Tavily under an explicit cap                                      | Real server-side keys; no borrowed/shared/publicly leaked keys              |
| P2       | Browser, production, CI regression                         | Desktop/mobile workflows, accessibility checks, clean build, container runtime and CI                       | None                                                                        |

## Budget and stopping rules

- Prefer documented free allowances. Never create fake identities, rotate IPs, retry CAPTCHA, use leaked keys, or silently upgrade to a paid plan.
- Keep live tests small and sequential. Provider refusal or account verification becomes a recorded handoff; no retry loop against a blocked signup or quota.
- Treat promotional/free credits as provider-specific, subject to the account's actual terms. User-mentioned ChatGPT credits do not establish provider billing authorization or credentials.
- Keep Exa and Tavily as the specified search competitors. A successful optional extraction does not satisfy their live acceptance criteria.
- Test fixture results stay labeled and outside the production entry point. Record actual observations separately.

## Initial observations

- Runtime reports no provisioned provider secrets or outbound identity bindings. No connected browser-control tool is available in this session.
- Firecrawl's official keyless documentation permits ordinary REST calls without Authorization, within a daily per-IP cap. One bounded scrape of https://example.com returned HTTP 200, success true, and 959 characters of Markdown. This proves current availability for that single call; it is not a guarantee of future quota or account access.
- Exa and Tavily's standard dashboard flows require account sign-in. No account has been created, no identity asserted, and no payment plan selected.

## Provider setup research

| Provider          | Official source                                         | Observed setup / allowance                                                                                                     | Next step                                                                                                                             |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Exa               | https://exa.ai/pricing                                  | Free monthly credits plus onboarding bonus; no payment method advertised. Dashboard redirects to auth.exa.ai.                  | Account owner signs in at https://dashboard.exa.ai and places a key in EXA_API_KEY. Verify current account allowance before requests. |
| Tavily            | https://docs.tavily.com/documentation/api-credits       | 1,000 free credits/month, no card advertised; basic search uses one credit.                                                    | Account owner signs in at https://app.tavily.com and places a key in TAVILY_API_KEY.                                                  |
| Firecrawl         | https://www.firecrawl.dev/blog/firecrawl-keyless-launch | Keyless REST access is documented as free, daily-capped per IP; current page differs from older cached monthly-limit copy.     | Explicitly enable keyless mode for limited extraction. Stop if signup/quota is required.                                              |
| Firecrawl account | https://www.firecrawl.dev/agent-onboarding/SKILL.md     | Default CLI/browser auth requires human sign-in. WorkOS identity registration requires an actual supported identity assertion. | Do not fabricate assertions or install unrelated integrations; account auth remains optional for this bounded keyless test.           |

## Execution notes

- Live Firecrawl extraction through the application succeeded, with a free-tier ledger entry and recorded provider usage.
- A separate live missing-page check produced API HTTP 200 and page HTTP 404. The app records unusable evidence and accepts no company. See [live validation](LIVE_VALIDATION.md).
- Official Exa keyless MCP also returned three real search results. Its text-only response is documented separately; no fragile text parser was added to the production REST adapter.
- Coverage now counts distinct source URLs. Content changes invalidate dependent reviews, and acceptance requires current evidence versions.
- Consent can be withdrawn immediately; local task/history deletion requires an explicit in-product confirmation and is blocked while requests are active or reserved.
- SQLite exclusive ownership now prevents a second server or maintenance process from recovering a live process's tasks.
- Browser testing caught and fixed delayed checkbox feedback in the consent control.

- Request receipts now protect repeated /run and /fetch operations when clients reuse an Idempotency-Key. Failure responses are replayed; uncertain interrupted operations stop for review instead of automatically repeating a vendor request.
- A real subprocess crash test validates SQLite/WAL recovery and interrupted-request receipts without contacting any vendor.
- A delayed-response browser test proves that an older task snapshot cannot restore a company after a newer source change invalidated its acceptance.

## Second-pass verification checkpoint

76 unit/integration tests pass, including a real subprocess kill/restart test. The desktop/mobile suite has 36 passing scenarios, including historical replay without any provider operation, evidence invalidation, consent withdrawal/deletion, a page-404/API-200 distinction, and protection against delayed older task responses. Follow-up authenticated acceptance is now complete: ten Exa REST successes, ten Tavily successes, and one keyed Firecrawl extraction. See LIVE_VALIDATION.md.

- The packaged non-root runtime also serves historical recordings, preserves user-input source provenance across restart, rejects unconfigured search/extraction, and blocks a concurrent retention process from acquiring its live database. These checks make no external API request.
