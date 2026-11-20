# Tool discovery

Two Hands finds suitable tools; the external agent chooses and executes one explicitly. Discovery is a free catalog lookup, not a provider request or an internal research conversation.

## Inputs

`discover_tools` accepts `sessionId`, `need`, optional `context`, and `operations`. The backend adds the session's recorded objective, criteria, and constraints. Pass task-relevant context, not credentials or private reasoning.

| Field                    | Meaning                                                      |
| ------------------------ | ------------------------------------------------------------ |
| `need`                   | Immediate operation's purpose                                |
| `context.requirements`   | Relevant task requirements in prose                          |
| `context.evidenceGaps`   | Specific unresolved gaps, up to 20                           |
| `operations[].operation` | `search` or `extract`                                        |
| `query` / `url`          | Search query or known public HTTPS URL                       |
| `maxResults`             | Search results, 1–20; default 10                             |
| `domains`                | Optional search domain restrictions                          |
| `searchDepth`            | Tavily-specific `basic` or `advanced`; Exa remains auto mode |
| `content`                | `any`, `page_text`, or `complete_page`                       |

Operations are provider-neutral. Legacy `requests` naming tools remain accepted and expand into alternatives; do not send both forms. For this three-adapter catalog, matching is deterministic using operation and required content, without an additional LLM. Free-form intent/context is preserved for the external agent's decision; matching does not claim to enforce every prose requirement. Encode hard retrieval requirements in structured fields, and inspect returned capabilities for the remaining requirements.

Exa search can return partial source-page text. Tavily search returns excerpts. Firecrawl retrieves Markdown from a known URL and may truncate it. Therefore `page_text` excludes Tavily search, and `complete_page` has no guaranteed match with current adapters. Search and extraction are different operations; a missing URL is not invented. Missing arguments produce `needs_parameters` and default-price labels, not fabricated exact quotes.

## Output

Every offered tool includes its capabilities, limitations, credential availability, default estimate, and:

- `discoveryMatches`: one status/reason per requested operation: eligible, unavailable, over budget, incompatible, or needs parameters.
- `requestEstimates`: concrete mapped requests, per-call costs, mapping differences, source/rate-card metadata, and remaining-budget checks. These are separate alternatives, not a sum or authorization to run a batch.
- `reputation.organic`: observed completed calls, successes/failures, separately counted interruptions, latency sample count/median, and observation time. Rates require at least five completed samples. API success does not imply source usefulness.
- `reputation.outcomeEvidence`: latest reviews of latest outputs explicitly citing this tool's evidence. Counts retain pass/fail/unknown and reviewer provenance. They assess answers, not provider causation; multi-tool criteria are flagged. They are not task-specific accuracy predictions.
- `reputation.controlled`: the latest completed diagnostic sample, separate from organic choices, with reference-check and attributed usefulness-review counts.

`candidateTools` lists tools with at least one eligible operation; inspect each operation's status before calling. The server does not rank tools by popularity or invent missing reputation. The recorded offer includes normalized operations, intent/context, catalog version, rate versions inside quotes, and the candidate set. Credentials and private internal reasoning are never returned.

Discovery also returns `connectorTools`: approved company connector tools whose name, description or input fields share words with the stated need, with each tool's input schema, approved estimate, status, matched terms and organic reputation. A need alone is enough to find them; `candidateConnectorTools` lists the eligible ones. They are called explicitly with `call_connector_tool`. See [company connectors](CONNECTORS.md#discovery).

Discovery is a snapshot. Execution recomputes prices and enforces current keys, budget, rate limit, and call cap. This is estimated accounting, not invoice reconciliation. Provider-reported dollars and credits remain separately recorded.

## Required selection summaries

Every new provider tool call (each `*_search` and `*_extract` tool) requires a trimmed, non-empty `statedReason` of at most 2,000 characters. Explain the tool's fit and the unresolved need, briefly. The record is labeled agent-reported, not observed reasoning.

Historical explanations are not backfilled. The HTTP execution path can replay an identical historical receipt with an empty reason without new work; changed arguments still fail. MCP schemas require a reason, so use `get_evidence` to recover older receipts rather than resubmit their obsolete arguments.

## UI and sharing

Provider cards start collapsed, showing logo, tool name, availability, and estimated/default cost. Multiple quotes show a per-request range and count, never an unlabeled total. Expanded details include the mapped requests, limitations, and evidence scope. Historical events render using the data recorded at the time.

Commercial aggregate sharing applies to all existing and future observation sessions. The migration appends `sharing_policy_applied` and preserves earlier events and research timestamps. The compatibility `consent` endpoint accepts true without changes and rejects false. No export is published automatically, and raw research content remains excluded from commercial aggregates. Company usage and commercial aggregate counts are available from the first eligible recorded activity; private workspace counts remain a separate explicitly requested scope.
