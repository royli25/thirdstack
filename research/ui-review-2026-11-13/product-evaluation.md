# E2: Task usability evaluation

Evaluator role: task completion, visible state, recovery, and navigation. This is an agent-led heuristic and functional review, not a study with representative human participants. Scores are judgments supported by the recorded tasks, not measured satisfaction or conversion.

## Education before critique

I reviewed the following primary NN/g material before the scored assessment:

| Reading                                                                                   | What it changes in this evaluation                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [10 usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)     | Evaluate visible status, understandable controls, error prevention/recovery, recognition, and consistency together. A polished normal screen cannot compensate for a broken task.         |
| [Visibility of system status](https://www.nngroup.com/articles/visibility-system-status/) | Check whether pressing a control produces timely, intelligible feedback. Distinguish no data, loading, failed load, and successful empty results.                                         |
| [User control and freedom](https://www.nngroup.com/articles/user-control-and-freedom/)    | Test dismissal, return paths, browser navigation, and whether users can recover their previous working position without losing context.                                                   |
| [Usability testing 101](https://www.nngroup.com/articles/usability-testing-101/)          | Use realistic goals and observe the actual interface. Automated assertions here establish specific behavior; they do not stand in for representative users or prove a perfect experience. |

## Scope, environment, and evidence integrity

- Baseline: `eab562e`, isolated checkout `X402Intent-ui-review`.
- Frontend: `http://127.0.0.1:5176/`, backed by dedicated in-memory fixture server on port 3202.
- No production database, environment file, real provider request, or real payment was used.
- Baseline capture: 19 routes at desktop 1440×1000, mobile 390×844, and tablet 768×1024, for 57 route/viewport screenshots, with zero uncaught page errors. The initial overflow probe compared `scrollWidth` with `innerWidth`; on mobile that can miss an inflated layout viewport. These were predominantly empty states and did not establish populated-state containment. The later populated review found and reproduced the defect below using `documentElement.clientWidth` as the width boundary.
- Artifacts: `/Users/royli/.gstack/projects/x402intent/designs/ui-review-2026-11-13/`.
- Machine-readable visual inventory: `eval-before-states.json`.
- Task evidence: `eval-before-interactions.json`; failed test harness selectors and proxy setup failures are classified separately below.
- Screenshot filenames use `eval-before-{desktop|mobile|tablet}-{route}.png`.

## Rubric

| Dimension              | Weight | What earns full marks                                                                          |
| ---------------------- | -----: | ---------------------------------------------------------------------------------------------- |
| Find and start a task  |    25% | The appropriate next action is discoverable in the relevant context, with a clear destination. |
| Complete the task      |    25% | Controls, filtering, details, setup, and permitted mutations behave as indicated.              |
| Status and recovery    |    25% | Loading, no-results, errors, and confirmation are legible and provide an immediate next step.  |
| Navigation and control |    25% | Dismissal, focus restoration, switching pages, and browser history preserve orientation.       |

10/10 means no material defect found in the defined scenarios after repeat checks. It does not certify every possible state. A failed core task caps that dimension at 6; an environment limitation remains unscored until retested.

## Protected design and attribution

The coordinator confirmed that the following are intentional prototype-derived choices and are protected during this iteration:

- The empty `Discover more tools` panel. The live component is self-closing, so its blank body is not a loading failure. Git blame points to `82a1efe1`, the customer-prototype port. I recorded its usability tradeoff but do not propose changing its appearance or adding content without user direction.
- The recent removal of the catalog's `Configure routing` link. Its absence is not an invitation to reintroduce a button the user deliberately removed.
- The existing customer dashboard/catalog title treatment, sidebar density, and approved token palette. Differences on older functional screens may be candidates for alignment, but the protected baseline is the reference.

Git author identity alone does not prove which design choices came from the user. The attribution above uses the coordinator's provenance investigation; unknown choices remain unknown.

## Baseline route coverage

All routes below were captured at all three widths: `#home`, `#dashboard`, `#dashboard/tools`, `#dashboard/activity`, `#dashboard/usage`, `#dashboard/connections`, `#dashboard/routing`, `#dashboard/credits`, `#dashboard/keys`, `#settings`, `#sessions`, `#models`, `#tools`, `#cases`, `#lab`, `#disputes`, `#company/exa/overview`, `#company/exa/choices`, and `#company/exa/listing`.

The company routes in this no-auth fixture correctly expose a connection boundary rather than fabricated company activity. The API-key screen correctly exposes its local-mode availability boundary. Those boundaries are not counted as failed tasks.

## Findings with reproduction evidence

### E2-01: Desktop page navigation retains an unrelated scroll position

Severity: high. Classification: functional behavior, independent of protected visual styling. Status: open at baseline.

1. At 1440×1000, open `#dashboard/tools`.
2. Scroll to the bottom; observed `scrollY = 221`.
3. Click `Credits` in the fixed sidebar.
4. The new page retains `scrollY = 221`; its `Credits` heading is at viewport y = -191 and is not visible.

This makes a page switch look like a mid-page landing and conceals the new page's title/status. A user must scroll up to reorient. The same flow at 390×844 resets to `scrollY = 0`, so the behavior differs between desktop and mobile.

Evidence: `screenshots/eval-before-desktop-nav-from-scrolled-catalog.png` and `screenshots/eval-before-mobile-nav-from-scrolled-catalog.png`.

Root cause observed in source: `ObservationApp.tsx`'s `onRoute` updates the route and closes the menu without handling desktop page-scroll position. Proposed fix: reset on a new user-initiated page/section destination while considering browser Back restoration. Verify actual sidebar clicks, not just direct URL loads.

### E2-02: Older setup screens ask consumers to parse operator-level detail

Severity: medium. Classification: older AI-created functional UI candidate, pending provenance confirmation. Status: recommendation, no source change.

The `Connections` screen combines the primary agent setup steps with the complete provider connection list and billing-readiness table, producing a roughly 2800px desktop page with several equally weighted sections. The setup task's useful sequence exists, but completion status and server-operation details compete with it. The lower table includes internal billing account controls that are not necessary to connect an agent.

Evidence: `screenshots/eval-before-desktop-dashboard-connections.png` and mobile counterpart. Preserve the actual setup controls and distinguish this recommendation from a request to redesign the protected prototype surfaces.

### E2-03: Touch controls retain desktop dimensions

Severity: medium, delegated to E4 for standards review. Classification: measured geometry; protected design needs careful adaptation rather than a global restyle.

At 390px, drawer navigation rows are 34px high, Add test funds is 32px, provider pin buttons are 24×24px, and View tool controls are 26px high. The task is possible, but repeated small targets increase precision demands. E4 should distinguish WCAG minimum targets/spacing from larger comfort recommendations and avoid declaring every sub-44px control a standards failure.

Evidence: `eval-before-states.json` contains measured target sizes; `account-help-navigation` task records actual drawer geometry.

## Successful task evidence

These flows passed on both desktop and mobile:

| Goal                                       | Observed outcome                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Find extraction-capable tools              | Extraction filter produces four cards in the all-providers synthetic fixture.                                    |
| Inspect a provider with multiple endpoints | Parallel opens on extraction; selecting `parallel_search` updates `aria-pressed`. Both endpoint states captured. |
| Recover from a search with no results      | `No matching tools` appears; Clear filters restores ten provider cards and returns focus to search.              |
| Close details and continue comparing       | Escape closes the detail dialog and restores focus to its originating View tool button.                          |
| Prioritize a provider                      | Pinning Tavily moves it first after clearing search.                                                             |
| Recognize no provider match                | Search shows `No matching providers` rather than a silent blank list.                                            |
| Find account help                          | Account popover opens upward; Help opens its own dialog; Escape returns focus to the account trigger.            |
| Prevent invalid test funding               | Native form validation prevents a malformed wallet from advancing. No real transfer is attempted.                |

Additional captured states include mobile navigation drawer, account popover, help dialog, catalog no-results, provider no-results, endpoint details, and initial funding dialog.

## Test harness and environment caveats

The first interaction script incorrectly queried agent client controls as `role=tab`; the product uses a labeled button group. That is a test-selector failure, not a product defect, and a corrected button selector is used for the repeat run.

The Vite proxy's write requests hit the fixture backend's same-origin guard and returned `Cross-origin writes are not allowed`. Route preview and any other mutation affected by that setup must be repeated against the built frontend served by the same fixture origin on 3202. The coordinator is preparing that environment. Do not count the proxy rejection as a shipped product defect.

The initial error-state interception targeted `/api/workspace/usage`; the actual page request is `/api/account/usage`. The initial apparent error test was therefore invalid and is excluded from recovery scoring. The corrected interception is required for the follow-up pass.

## Initial score and repeat gate

Provisional task-usability score: **7.5/10**, with mutation completion and service-error recovery pending correct same-origin verification. The score is a strict expert judgment, not a survey result. The desktop navigation defect prevents a 10. Correct modal/filter control is strong; it does not erase the route-orientation problem.

Repeat evaluation must cover:

1. Desktop catalog-bottom → Credits through the visible sidebar, title visible after navigation.
2. Connection client switching and Copy confirmation using the actual button-group semantics.
3. Route preview and availability mutation on the same-origin fixture, then reload persistence.
4. A deliberately failed usage request followed by a visible successful retry.
5. A populated synthetic activity receipt and no-results filtering, with fixtures clearly labeled.
6. The original successful catalog/help/focus paths after all related source changes.

No product source was modified by E2 in the initial pass.

## Iteration: implemented navigation and browser orientation

### E2-01 resolution

Commit: `b20f963`, `fix: reveal destination after explicit app navigation`.

`ObservationApp.tsx` marks explicit same-document route-link clicks and the app's existing programmatic navigation calls. After the destination renders, it resets the page to the top. Unmarked browser Back/Forward events retain native restoration. It excludes home section anchors and the native skip target; the existing funding deep-link focus remains intact. No visual styling was changed.

The new regression file is `tests/browser/navigation-scroll.regression-1.spec.ts`. Its desktop test was run against the built baseline on port 3202 and failed because the Credits heading had viewport ratio 0. Against current source on port 5176, desktop and mobile passed. Tests cover destination heading visibility, top-of-page landing, exact 600px desktop Back restoration, Forward, the native home platform section, and Add test funds focus.

The exact original catalog-bottom → Credits flow now produces `scrollY = 0` and heading y = 30, compared with baseline y = -191. Before/after viewport screenshots: `eval-before-desktop-nav-from-scrolled-catalog.png` and `eval-after-desktop-nav-from-scrolled-catalog.png`.

### E2-04: browser tabs did not identify destinations

Commit: `ede21b5`, `fix: identify app destinations in browser titles`.

The browser title stayed at the generic home title while the user moved between app destinations. It now uses static route labels, for example `Credits · Two Hands`. It does not expose session names, account names, prompts, IDs, or retrieved content. The original home title is preserved.

New regression: `tests/browser/page-title.regression-1.spec.ts`, covering seven destinations, user navigation, browser Back/Forward, and the home section route. Combined scroll/title verification passed **6 of 6 tests** across desktop and mobile. `npx tsc --noEmit` passed after both changes. The coordinator owns the final integrated `npm run check` and broader browser suite.

## Populated-state task review

This follow-up used the **same isolated fixture origin on port 3202** for frontend and backend writes, eliminating the development-proxy origin mismatch. It created a clearly labeled synthetic session through the backend-authorized agent-session endpoint.

| Fixture fact                | Observed value                                                               |
| --------------------------- | ---------------------------------------------------------------------------- |
| Session                     | `49eacebe-a84a-4460-9f1c-562782ac3b7e`                                       |
| Title                       | `TEST FIXTURE ONLY — UI review populated state`                              |
| Authorization               | `backend_policy`                                                             |
| Backend session cap         | 100,000 microdollars ($0.100)                                                |
| Calls                       | Exactly three: `tavily_search`, `exa_search`, `firecrawl_extract`            |
| Synthetic request estimates | 8,000 + 17,000 + 1,000 = 26,000 microdollars ($0.026)                        |
| Results                     | Three successful intercepted synthetic provider responses                    |
| Output                      | Explicitly synthetic text with the three recorded evidence-call IDs          |
| Identity                    | Self-reported fixture identity, explicitly described as not a verified model |

This is not a live-provider check. The estimates are synthetic fixture prices, not invoices or paid-provider spending. No real provider, external checkout, real blockchain, production workspace, or production statistics were used.

The following eight task flows were exercised on both desktop and mobile, giving **16 functional task scenarios**:

| Task flow                          | Actual interactions and checks                                                                                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Populated overview                 | Three receipt rows and populated metrics; the fixture label is visible in each request title.                                                                                                                                                 |
| Activity, details, filters, export | Search matches the two synthetic search calls; inspect a receipt; switch Request/Response; confirm recorded stated reason and synthetic response; export CSV and inspect both call IDs; filter to Exa; recover to a no-results state.         |
| Long extraction receipt            | Open Firecrawl's actual saved receipt and its 1,996-character response panel.                                                                                                                                                                 |
| Session record                     | Navigate overview, trace, output, and record for the synthetic session.                                                                                                                                                                       |
| Usage                              | Inspect populated provider rows and separate estimates/reported credits; select 30 days and verify all 30 chart cells remain.                                                                                                                 |
| Routing                            | Empty preview is disabled; valid preview displays seven eligible search tools; pause Exa, reload, confirm persisted paused state, and restore it through the visible switch. A final policy comparison restores the original state if needed. |
| Synthetic card funding             | Enter 12.34 test USD, prepare checkout, inspect Awaiting payment, simulate a fixture-only signed webhook, check Credited, simulate a 2.34 partial refund, and inspect history/ledger. The external checkout link was never visited.           |
| Synthetic on-chain funding         | Create a 10 test-USDC request from the known fixture wallet; verify the known fixture transaction. Desktop credits once; mobile's repeat correctly reports that the transaction has already been credited. No real transfer or RPC was used.  |

Both card scenarios use synthetic fixture state, so the final test ledger contains two test-card receipts and refunds. The on-chain fixture has one credited transaction and a second uncredited request demonstrating duplicate-credit protection.

Evidence: `eval-fixture-populated-tasks.json`, two exported `eval-fixture-{desktop|mobile}-activity.csv` files, and 42 screenshots named `eval-fixture-*`.

### Corrected assertions, distinct from product defects

Four initial assertions in the 16-scenario run failed because the test harness made two incorrect assumptions in each viewport:

1. The overview intentionally displays the provider's name (`Tavily`), rather than the technical tool string `tavily_search`.
2. The long-receipt task reused a page with the preceding activity search and provider filters still active. Retaining those filters is expected; the corrective task uses a fresh page.

Both were rerun correctly without creating extra provider calls. All four corrected assertions passed. The original run remains intact; `eval-fixture-corrected-task-assertions.json` records the correction, actual response length, and measured mobile width. Neither issue is represented as a product bug or hidden as an unqualified initial pass.

## E2-05: populated mobile tables inflate the page and collapse modal backgrounds

Severity: high. Classification: implementation defect in shared table containment, not an authored visual choice. Discovered during the populated pass and assigned to E1 for the shared CSS repair.

A fresh browser context at a nominal 390px viewport on the funded Credits page produced:

| Measurement                   | Before opening a dialog | With the card dialog open |
| ----------------------------- | ----------------------: | ------------------------: |
| `documentElement.clientWidth` |                     390 |                       390 |
| `documentElement.scrollWidth` |                     694 |                       694 |
| `window.innerWidth`           |                     694 |                       694 |
| Body width                    |                     390 |                        86 |

The layout viewport inflates because of escaped table content. When the dialog locks scrolling, its scrollbar compensation interprets the extra 304px as a scrollbar and compresses the background from 390 to 86px. The modal itself remains roughly 362px wide, but the surrounding page becomes an extremely narrow column. This was reproduced **before any screenshot call**, so it is not a full-page screenshot artifact.

The populated Activity view also produced a 776px document width at a 390px client width. An empty-table route did not reveal it. Checking `scrollWidth <= innerWidth` is insufficient here, because both values inflate together on mobile.

Before evidence: `eval-fixture-mobile-card-fresh-viewport.png`, `eval-fixture-mobile-card-fresh-fullpage.png`, and `eval-fixture-mobile-extraction-long-response.png`. Use the viewport screenshot for a readable before/after dialog comparison; full-page screenshots are retained as diagnostic evidence.

E1 isolated the cause: the absolutely positioned screen-reader-only Inspect table header was positioned against the body and escaped the intended table scroll container. E1 owns the shared `user-dashboard.css` containment fix and its new populated-layout regression. Independent E2 verification and final score follow after that fix is available.

## Independent verification after the table repair

E1 committed `1f33fc0`, adding the containing block on the shared table scroll wrapper. E2 then independently exercised the actual populated fixture through current source on port 5176 at 390, 768, and 1440px.

At every width, the funded Credits document's client width, scroll width, window inner width, and body width now exactly match the viewport. Opening the card dialog keeps the mobile body at **390px**, compared with **86px** before the repair. Keyboard ArrowRight moves the card-history scroll region by 40px at mobile and tablet widths, confirming that overflowing columns remain reachable through the intended local scroll region. The long Firecrawl receipt also stays contained: at 390×844, its dialog spans x = 14 through x = 376, with its bottom at y = 827.

Independent evidence: `eval-final-populated-layout.json` and nine captures named:

- `eval-final-{mobile|tablet|desktop}-funded-credits-contained.png`
- `eval-final-{mobile|tablet|desktop}-card-dialog-contained.png`
- `eval-final-{mobile|tablet|desktop}-extraction-response-contained.png`

For the clearest mobile comparison, pair `eval-fixture-mobile-card-fresh-viewport.png` with `eval-final-mobile-card-dialog-contained.png`. These use the same funding action and show the width-collapse problem directly.

### Account usage service failure and recovery

E2 also independently checked a persistent synthetic 503 response from the real `/api/account/usage` request on both desktop and mobile. The test held the mocked failure until the error was visible, then permitted the next request and clicked the visible Refresh account control. The alert cleared and the three saved synthetic requests returned. Both scenarios passed, with no backend mutation or new provider call.

The failure was held explicitly because the development app's Strict Mode can issue more than one initial request; a one-request-only failure can be superseded before a persistent error state is established. That transient harness attempt was excluded from the result.

Evidence: `eval-final-usage-recovery.json` and `eval-final-{desktop|mobile}-usage-service-{error|recovered}.png`.

## Final E2 judgment

**Task usability: 9.0/10**, up from the initial provisional 7.5. This score applies to the defined local task scenarios, not the entire product or an empirical human-usability benchmark.

The confirmed desktop navigation defect is repaired, browser titles identify destinations, populated mobile tables stay within the viewport, native table scrolling remains usable, and modal, filter, export, routing persistence, synthetic funding, and recovery scenarios all complete as described. The final integrated build and wider browser suite are the coordinator's separate release checks.

I do **not** award 10/10. The remaining concrete medium usability issue is E2-02: the Connections page gives the server-managed provider list and readiness/billing table equal permanent visibility with the primary client-setup steps. A focused next iteration could place those existing details and controls inside one default-collapsed disclosure below setup and connection status. This would shorten the initial setup path without deleting controls or altering the protected customer design. It remains a recommendation until the coordinator confirms provenance and implements/reviews that change.

The intentional blank discovery panel, removed routing link, approved blue, and authored dashboard/catalog appearance are preserved. They are not disguised as implementation defects to justify unsolicited redesign. Real client installation, real authentication, real payment, live provider reliability, and representative-user behavior are outside this isolated fixture verification and are not claimed as validated.
