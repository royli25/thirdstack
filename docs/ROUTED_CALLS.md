# Routed calls

A routed call lets the external agent send a provider-neutral request and have octolab choose the provider. It is opt-in and sits beside the named provider tools; nothing is routed unless the agent calls `route_call`. Every decision is recorded before any provider work and returned to the agent.

This is the one place octolab chooses a provider. It does not change the explicit path: `exa_search`, `tavily_search` and `firecrawl_extract` still run exactly the tool the agent names.

## Request

`route_call` (MCP) or `POST /api/observations/:id/route`:

| Field           | Meaning                                                      |
| --------------- | ------------------------------------------------------------ |
| `requestKey`    | Unique key, up to 100 characters. Reuse it to retry safely   |
| `need`          | Required brief statement of what the request must establish  |
| `operation`     | The same provider-neutral operation `discover_tools` accepts |
| `priority`      | `balanced` (default), `cost`, `latency` or `reliability`     |
| `allowFallback` | Default true. On failure, try the next ranked tool once      |

## How the provider is chosen

1. **Eligibility** uses the same deterministic matching as discovery: operation, required content, credentials, workspace routing settings, API-key tool restrictions, operator allowance, remaining budget, and the provider's per-minute limit.
2. **Scoring** (`server/route-policy.ts`, policy `route-v1`) gives each eligible tool three components between 0 and 1:
   - `cost`: cheapest request estimate divided by this tool's estimate.
   - `latency`: fastest observed median divided by this tool's median.
   - `reliability`: observed success rate of completed organic calls.
3. Latency and reliability need at least five completed organic calls. Below that the component is listed under `unmeasured` and scored at a neutral 0.5. It is never presented as a measurement.
4. The weighted sum decides. Ties go to the lower estimate, then the tool name.

Answer quality is not a component. Octolab has no measure that attributes answer quality to a single provider, so the policy does not pretend to have one.

## What is recorded

| Event               | Provenance | Contents                                                                                                                                                                                                        |
| ------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `route_decided`     | observed   | Decision ID, policy version, priority and weights, every candidate with status, reason, estimate, components, unmeasured components, score and rank, the ranking, the chosen tool, and a plain-language summary |
| `route_unavailable` | observed   | The same candidate list when nothing was eligible. No provider is called                                                                                                                                        |
| `route_fallback`    | observed   | The failed attempt, its error, and the tool tried next                                                                                                                                                          |
| `tool_called`       | observed   | As for explicit calls, with `selectedBy: "server_route"`, the decision ID and the attempt number                                                                                                                |

Each attempt is an ordinary call with its own receipt, estimate, reservation and `tool_result`. Calls made this way carry `selectedBy` and `routeDecisionId`.

`GET /api/observations/route-decisions` lists decisions across the workspace, newest first, joined to their attempts, fallbacks and final status. It contains raw needs and queries and is a private workspace record, not a commercial export.

## Boundaries

- A routed call is octolab's choice. It is not counted as an agent selection in company insights, and the agent's `need` is not recorded as a `selection_explanation`.
- The decision is an observed server event. It says what octolab computed, not that the chosen provider was better.
- Retrying with the same key and arguments returns the recorded decision and receipts with no new provider work. The same key with different arguments is refused.
- A request with no eligible tool does not hold its key, so a later retry is decided afresh.
- Fallback is bounded to one extra attempt. A failed first attempt is still charged at its estimate, as any failed call is.
- With two search adapters and one extraction adapter, routing today chooses between Exa and Tavily for search. Extraction has a single candidate.
