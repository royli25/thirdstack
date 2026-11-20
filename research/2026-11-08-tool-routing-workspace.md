# Tool routing workspace

Built November 8, 2026. OpenRouter is the visual reference, following the user's direction. This research extends the earlier work without replacing it.

## Reference and interpretation

OpenRouter's signed-in Activity and Logs pages were inspected in the browser. Its useful structure is a persistent sidebar, concise metric cards, time filters, provider breakdowns, and a request log that leads to an individual receipt. Its public [Activity documentation](https://openrouter.ai/docs/guides/features/activity) describes drilldowns and filtered exports. Its [provider routing documentation](https://openrouter.ai/docs/guides/routing/provider-selection) separates provider preferences from request activity.

Monid's public [CLI overview](https://docs.monid.ai/cli/overview.html) separates discovery, endpoint inspection, execution, and receipt retrieval. That distinction is relevant to tools; its visual design is not used. Initial dashboard access required sign-in; no Monid account was created or modified.

For octolab, the comparable unit is a tool call rather than a model generation. Capability, adapter limits, request-specific estimates, configuration, and returned evidence matter more than token counts. Provider execution success must remain separate from answer quality. OpenRouter's routing features are not evidence that octolab implements equivalent automatic routing or failover.

## Implemented information architecture

| Sidebar area | Page         | User job                                                                                 | Backend                                                      |
| ------------ | ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Dashboard    | My dashboard | Check volume, estimated cost, latency, and recent calls                                  | Workspace usage and activity                                 |
| Tool routing | Tool catalog | Search by capability, compare defaults, inspect adapter limits and provider docs         | Existing observation catalog                                 |
| Tool routing | Routing      | Enable/pause tools and preview compatible alternatives                                   | Persistent policy, discovery matching, execution enforcement |
| Workspace    | Activity     | Filter requests, inspect inputs/results and agent-reported reasons, export matching rows | Paginated workspace activity and saved call receipts         |
| Workspace    | Usage        | Inspect daily volume, provider share, estimates, and reporting coverage                  | Date-scoped usage aggregates                                 |
| Integration  | Connections  | Set up Claude, Codex, or another MCP client and inspect last-seen activity               | Existing client observations and configuration booleans      |

Each page has a distinct hash route under `#dashboard`. Mobile navigation exposes the same groups. Operator session reviews and the provider lab retain their separate routes.

## Behavior and integrity

- Replaced browser-local cosmetic tool switches with SQLite-backed policy shared by clients. Revision checks prevent stale edits from overwriting newer settings; policy changes append an audit record.
- Paused tools cannot be eligible discovery candidates or start new paid calls. In-flight calls finish normally. Replaying an existing receipt remains possible and never repeats provider spending.
- Preview uses the same capability matcher and request estimates as discovery, against the backend-managed default session limit. It creates no session, observation event, reservation, or provider request.
- Activity contains observed workspace calls, excluding controlled lab fixtures by storage separation. Test data remains in dedicated in-memory test processes.
- Usage periods use UTC calendar-day boundaries; individual request times use the viewer's local timezone. Estimated cost excludes running reservations. Reported USD and provider credits remain separate, with coverage counts.
- CSV exports apply the current query, provider, status, and period in one server snapshot. Results are capped at 10,000 rows with an explicit error, and spreadsheet formula prefixes are escaped.
- Client last-seen activity is historical evidence, not a live connection heartbeat.
- Provider keys remain server-side. All workspace endpoints inherit existing token checks and cross-origin write protection.

## Deliberate limits

This remains one local workspace, not a multi-tenant account system. Do not label its totals as private per-user billing. Credit purchases, invoices, scoped API-key issuance, automatic fallback, and provider-priority optimization need backend capabilities before they become user controls. The current agent selects providers explicitly; this implementation enforces eligibility rather than inventing an automatic optimizer.

Workspace analytics currently read saved sessions and calls. Larger hosted deployments should add indexed reporting queries and authenticated workspace isolation before scaling this interface to multiple customers.

## Validation

`npm run check` builds both frontend/backend and runs the backend suite. Workspace tests cover durable policy, stale revisions, pause enforcement, receipt replay, free previews, capability constraints, date filtering, reported-unit separation, API auth, and origin checks. Browser tests cover desktop/mobile sidebar navigation, accessibility, capability filtering, tool details, saved toggles, previews, call receipts, CSV exports, and connection instructions. Provider traffic in browser tests is intercepted by the fixture server. No paid live provider checks were initiated for this work.

## Subsequent Trello task

The next To Do card, “Open on-chain deposit methods,” was implemented for USDC on Base Sepolia after the user selected that network. It adds a seventh sidebar destination, Credits. The user explicitly requested keeping deposits disabled for later activation. The server was checked and returned `enabled: false`, no receiving address, and zero test credits. See [testnet deposit setup and boundaries](../docs/TESTNET_DEPOSITS.md).

Final validation passed: 217 tests in `npm run check` and 20 targeted desktop/mobile browser tests, including accessibility and simulated deposit verification. The interface task and deposit implementation were moved into Trello Review with detailed handoff notes. Three production follow-ups were appended to To Do with `(ChatGPT)` in their titles: account/workspace isolation, scoped API keys and spend limits, and deployment/backup/restore checks. No existing research was removed, no mainnet funds were enabled, and no wallet transfer was made.
