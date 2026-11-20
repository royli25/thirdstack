# Pending improvements

Current policy update (November 8, 2026): company usage and aggregate exports now show the first eligible recorded usage without a five-workspace/session gate. Earlier threshold discussion below is historical; independent answer-review minimum samples remain separate.

Recorded November 3, 2026 from the product clarification conversation. The user authorized the implementation pass at 1:26 AM Pacific. All four agreed items are implemented; see [implementation and validation results](IMPLEMENTATION_2026-11-03.md). The notes below preserve the accepted scope and research. Existing unrelated working-tree changes were preserved.

## Agreed work

### 1. Require selection explanations — implemented

- Require a brief, non-empty, trimmed `statedReason` on every new provider call through MCP and the backend API.
- Ask why this tool fits the immediate need; retain agent-reported provenance. This is not private reasoning or verified causation.
- Reject missing, empty, and whitespace-only values before provider work or spending. Return an actionable validation error.
- Preserve historical calls with absent reasons as unreported; do not invent explanations. Consider idempotent replay compatibility for historical receipts when changing validation.
- Local investigation found 41 explanations across 83 calls; the other 42 stored empty strings. Both current schemas default to an empty string.

### 2. Compact, collapsible provider option cards — implemented

- Each of the three provider cards starts as one collapsed row: company logo, tool name, availability; estimated cost and disclosure control on the right.
- Expand for proposed queries/URLs, cost breakdowns, remaining-budget status, uncertainty, and historical usage.
- Distinguish request-specific quotes from default estimates. For multiple requests, label count and per-request prices/range without implying that alternatives are a purchased batch.
- Use existing provider brand assets where suitable and Untitled UI for interface icons. Use accessible shadcn controls, keyboard interaction, and responsive layout.
- Current size differences are data-dependent rendering, not actual collapse state: providers with quotes render every quote, while others render one default-price line.
- The user declined a broader trace regrouping redesign. Preserve the overall event trace.

### 3. Octolab discovers candidates; the external agent chooses — implemented

- External agent supplies recorded intent plus all relevant task context and concrete request parameters: immediate need, operation, query/URL, result count, content requirements, depth where applicable, constraints, and relevant prior evidence gaps. This means task-relevant context, not credentials or private chain of thought.
- Octolab processes the need and searches its tool catalog/database for suitable candidates. It should identify relevant alternatives even if the caller did not name every provider.
- Return available tools with capabilities, limitations, comparable request-specific costs, and evidence-backed reputation data. Explain unavailable, incompatible, or unquotable options where useful.
- The external agent makes the final provider selection and supplies its explanation. Octolab executes the explicit choice under backend authorization; no silent provider switching or second research planner.
- Reputation includes observed execution reliability, latency, relevant outcome evaluations, sample sizes, and provenance. Keep organic usage and controlled tests separate. Popularity is not quality; missing evidence remains unknown.
- Internal discovery may use deterministic capability matching, semantic retrieval, or an internal model as justified by catalog scale and measured usefulness. An extra LLM is not an agreed requirement. Pricing and execution validation remain deterministic.
- Keep the product general-purpose. Discovery should not force a preset shopping or company-research workflow.

### 4. Enable commercial sharing for all sessions — implemented

- User explicitly changed the policy: every session should have commercial sharing, including existing recorded sessions and newly created sessions. This supersedes the earlier project instruction that sharing starts off.
- During the authorized implementation pass, migrate existing sessions and make sharing automatic for new sessions. Remove the per-session opt-in requirement and update UI, documentation, tests, and project instructions consistently.
- Record the migration truthfully as an operator-directed policy change; do not rewrite earlier consent events or imply historical opt-in.
- This authorizes inclusion in commercial aggregates, not sending messages, publishing data externally, or broadening exports to raw conversation content, credentials, queries, or evidence.
- The minimum-cohort threshold is a separate rule. All-session sharing alone will not populate Exa's current company metrics because it has only two qualifying sessions and the threshold is five. Decide private visibility separately; do not silently claim this policy change resolves the threshold.

## Research and implementation notes

### Current implementation evidence

- `server/observation.ts`: `discover` quotes only caller-supplied requests; catalog contains all three providers. Existing catalog latency/success summaries require at least five calls and quality is unknown.
- `server/provider-capabilities.ts`: descriptions and selection guidance; useful starting point for catalog capability metadata.
- `server/request-cost.ts`: request validation and parameter-based cost estimates; reuse rather than duplicate formulas.
- `server/mcp-server.ts`: external-host ownership of conversation/planning and explicit provider tools.
- `src/ObservationApp.tsx`: tool-offer cards render request estimates inline, with no provider-level collapse control.
- The November 2 session ending at 2:30 PM had 18 sequential provider calls (11 Exa, 7 Firecrawl), 7 discovery events, and 48 trace events. One discovery quoted three Exa queries but no equivalent Tavily requests. Discovery coverage is currently determined by the caller.

### Primary sources checked November 3, 2026

- [MCP tools specification, 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25/server/tools): tool listing, input/output schemas, and structured results support a discovery tool that returns candidates for the external agent to choose. Application-level discovery is distinct from protocol tool listing. Check installed SDK/host support before choosing protocol features; this reference is a versioned specification, not a claim about the latest version.
- [Exa pricing](https://exa.ai/pricing): Auto search lists $7 per thousand requests up to 10 results and $1 per thousand requests per additional result. Current base formula matches that public schedule; account billing can differ.
- [Tavily credits](https://docs.tavily.com/documentation/api-credits): basic search is one credit, advanced is two. Pay-as-you-go is $0.008 per credit; plan rates differ. Compare explicit service levels rather than silently presenting advanced Tavily as equivalent to every Exa request.
- [Firecrawl billing](https://docs.firecrawl.dev/billing): ordinary scraping uses one base credit; PDF parsing and special cases can add usage. A base quote is not a guaranteed upper bound. Search and extraction satisfy different operations.

### Recommended design questions to resolve autonomously

1. Define a provider-neutral discovery input and explicit mappings into each adapter's supported parameters. Do not silently discard incompatible requirements or imply equivalent output quality.
2. Support incomplete context with labeled defaults, missing-parameter fields, or ranges; exact quotes require concrete supported arguments. Recalculate at execution.
3. Record the candidate set, normalized requests, catalog/rate versions, evidence scope, and exclusions at discovery time. Link selection to the offer when practical without fabricating links for older calls.
4. Start with transparent evidence fields rather than an opaque reputation score. Avoid transferring whole-answer evaluation scores to every tool that participated; use attributable evidence and show uncertainty/sample coverage.
5. Bound catalog response size as it grows. Evaluate candidate relevance and omission rates before adding semantic retrieval or an internal model. Do not let usage popularity suppress unmeasured relevant tools.
6. Preserve backend spending policy and keep discovery free of provider execution. Keep estimated spend, reported USD, reported credits, and invoice reconciliation distinct.
7. Determine compatible migration behavior for older discovery callers and historical records. Update docs that currently describe optional explanations or caller-only candidate quoting.

### Validation for the later work pass

- Prove a provider-neutral search request returns relevant search alternatives with concrete estimates; a known-URL extraction request returns extraction candidates without treating search as equivalent.
- Test parameter mapping, unsupported requirements, missing credentials, insufficient budgets, no suitable candidate, absent reputation data, and separation of organic/controlled evidence.
- Test mandatory explanation validation before spending and retry/idempotency behavior.
- Browser checks: all provider rows initially collapsed; expansion works independently with keyboard and pointer; logos and price labels remain readable on narrow screens; historical offers still render.
- Run `npm run check` and browser tests appropriate to changed behavior. Keep fixtures isolated. Any live provider checks need a bounded backend-authorized or operator-accepted budget and a separate report.

## Related findings, not separately committed scope

The Tool company local preview currently applies commercial-consent and minimum-cohort gates to its organic metrics (`server/company-insights.ts`). At inspection, none of 10 sessions had commercial consent; Exa had 25 successful organic calls across two sessions, so organic metrics were hidden. The latest controlled Exa sample had 5/5 successful requests, 5/5 reference checks, and 0/5 usefulness reviews. The overview's Successful requests card reads organic data only, so it displays a dash even when controlled execution counts exist. The user subsequently authorized all-session commercial sharing (item 4). Proposed further follow-up: separate private operator visibility from company aggregate thresholds and label organic execution, controlled execution, reference checks, and usefulness reviews distinctly. Changes to minimum-cohort/export protections remain separate from enabling sharing.

Cost reconciliation, account-specific credit conversion, and variable-cost reservations were recommended during discussion. Decide which small changes are necessary for truthful discovery estimates; a broader billing project has not been authorized as a separate item.

The local sample reviewed during discussion had 25 Exa calls whose reported USD matched estimates, 22 basic Tavily calls reporting one credit each, and 34 successful Firecrawl calls reporting one credit each (two failed extraction calls lacked reported usage). This is limited local evidence, not invoice verification or coverage of all parameter combinations.
