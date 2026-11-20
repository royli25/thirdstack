# Two Hands

A general-purpose tool router and observation layer for **Claude, Codex, and other MCP hosts**. People bring their own tasks and continue a free-flowing conversation with their AI. Two Hands supplies provider tools and records intent, tool choices, evidence, and outcomes; it does not prescribe a task category or a fixed research workflow. Its user dashboard provides tool discovery, routing controls, request activity, and usage. Operator evaluation and review remain separate.

The app uses the black [Two Hands logo](public/two-hands.svg) and the [standalone mark](public/two-hands-mark.svg) for its favicon and compact placements. Existing MCP registrations and technical identifiers remain `apilayer` for compatibility.

The interface uses Geist, light grayscale surfaces, white panels, neutral navigation, and charcoal actions. Blue is reserved for key actions and focus. The same theme applies to the dashboard, company pages, Settings, and administration.

The local MCP server works with Claude desktop and Codex CLI. Both have completed live research sessions through it. See [validation evidence](docs/OBSERVATION_VALIDATION.md) for the exact scope and limitations.

The [product direction](docs/PRODUCT_DIRECTION.md) connects this evidence to future model evaluation, refund review, and aggregate tool-company feedback, and identifies what still needs to be established for each.

The [product knowledge base](research/README.md) collects interesting products, articles, and ideas to revisit, with source notes, relevance to Two Hands, and prompts for the next discussion.

PostgreSQL accounts have separate **User dashboard**, **Tool company**, and **Administration** areas. Users connect agents and manage their usage; tool company owners register for review, manage analyst access, and see only approved aggregate insights; allowlisted administrators review companies and operate the service. See [role journeys and company access](docs/ROLE_JOURNEYS.md). The illustrative company demo and controlled [provider lab](docs/PROVIDER_LAB.md) remain operator tooling, separate from the company-owner portal.

Connect coding agents through browser sign-in, or integrate a product backend with an API key. See [the two connection paths and OAuth setup](docs/MCP_OAUTH.md).

## Run locally

Requires Node.js 24.5+ and npm. Use a **separate development Supabase project** for PostgreSQL and Auth. The live website at [twohands.tech](https://twohands.tech) owns the production database; a second API server must not use it.

```bash
npm ci
cp .env.development.example .env.development.local
# Fill in the dedicated development project's database and public Auth settings.
npm run db:migrate:dev
npm run dev
```

Open **http://127.0.0.1:5175**. The development API defaults to port 3009; Vite's relative `/api` proxy follows the same configured `PORT` and preserves the browser origin. Port 5175 is fixed, so another preview causes startup to fail instead of opening a different port. `npm run demo:dashboard` serves the separate [design prototypes](prototypes/dashboard/README.md) on port 5174 by default; their guide includes the Orthogonal landing reference.

`npm run dev`, `npm run db:migrate:dev`, and `npm run preview:production` load only `.env.development.local`, validate that its database and Auth settings match the declared development project, and reject the known production project. They do not load `.env` or reuse inherited application credentials. Migrations are explicit and require the development API to be stopped. See [development setup](docs/DEVELOPMENT.md) for project creation, Auth redirects, and troubleshooting.

For a quick local SQLite preview, use `npm run dev:sqlite`. It uses isolated `data/development.sqlite` storage and has no Supabase account flows. Provider calls require separately configured development credentials and spending authority; missing keys leave providers unavailable.

To check the built app locally, stop `npm run dev` and run `npm run preview:production`. This builds and serves the frontend and API from the development backend origin (`http://127.0.0.1:3009` by default), using the same isolated development project with `NODE_ENV=production`. It has no hot reload and does not deploy the app. Configure that origin separately in the development project's Auth redirects.

`npm start` and the operator database commands retain their deployment environment behavior; they are not development shortcuts. Production uses host-managed secrets and the [deliberate release procedure](docs/RELEASE_CHECKLIST.md#production-release-on-render). Keep the existing `.env` private and out of development startup. The [rollout checkpoint](docs/SUPABASE_ROLLOUT.md) preserves earlier import and local-runtime history; its port 3008 notes describe an earlier checkpoint.

PostgreSQL mode uses [Supabase Auth accounts](docs/AUTH.md). New development accounts and history are separate from production. Follow the [PostgreSQL migration guide](docs/POSTGRES_MIGRATION.md) only when an explicit historical-data cutover is needed; a new development project starts empty. `API_TOKEN` and `ADMIN_API_TOKEN` apply only to SQLite/local mode.

## User dashboard

The user sidebar groups **Tool catalog**, **Routing**, **Activity**, **Usage**, **Credits**, **API keys**, and **Connections** under `#dashboard`. Tool switches are persisted on the server, affect discovery eligibility, and block new calls to paused tools. Existing receipts can still be read and replayed. A free route preview shows compatible tools and request estimates without starting a session or calling providers.

Activity supports date, provider, status, and text filters, pagination, receipt inspection, and matching CSV exports. Usage separates configured estimates from provider-reported USD or credits. Connection status reports historical requests, not a live heartbeat. PostgreSQL scopes these records to the signed-in account. SQLite uses local storage. See [interface decisions](research/2026-11-08-tool-routing-workspace.md).

**Stripe test payments and Base Sepolia test USDC deposits are disabled by default.** The Credits page offers both methods with one test-credit balance, separate receipts, and an append-only adjustment ledger. Stripe uses hosted Checkout, signed webhooks, server-retrieved payment proof, refund adjustments, and dispute holds. On-chain deposits require finalized matching USDC transfers. Test credits never fund paid provider calls. Real-money card top-ups into the prepaid wallet are a separate rail behind `STRIPE_LIVE_ENABLED`, off by default; see [Stripe live mode](docs/STRIPE_LIVE.md). Mainnet, wallet custody, and withdrawals are unsupported. See [Stripe setup](docs/STRIPE_DEPOSITS.md) and [on-chain setup](docs/TESTNET_DEPOSITS.md).

The **API keys** page creates one-time scoped credentials with tool restrictions, expiry, revocation, policy audit history, and cumulative estimated-spend limits reserved atomically with tool calls. PostgreSQL issuance requires a signed-in account. SQLite issuance requires a protected owner token and fails closed if it is later removed. Use a scoped API key in `APILAYER_API_KEY` with the MCP bridge. See [API key setup and boundaries](docs/API_KEYS.md).

In PostgreSQL mode, **Tool access** (`#tool-access`) lets a verified platform administrator set or pause an account’s lifetime estimated-provider allowance with a reason and revision check. No allowance means provider execution is denied, including for self-issued customer keys. Users see read-only access status; test deposits never grant spending authority. See [operator account allowances](docs/WORKSPACE_ALLOWANCES.md).

The operator sidebar also includes **Payment disputes** (`#disputes`): a separately authenticated queue with saved payment evidence, review notes, optimistic conflict checks, and audit history. Review decisions retain credit holds; in PostgreSQL mode an administrator can release a wallet hold once Stripe has closed the dispute and refund unused credits. In PostgreSQL mode, explicitly allowlist platform administrator UUIDs with `SUPABASE_ADMIN_USER_IDS`; SQLite uses a distinct `ADMIN_API_TOKEN`. Workspace ownership alone does not grant operator approval, evaluation, provider-lab, or dispute-review privileges; see [admin dispute review](docs/DISPUTE_REVIEW.md).

## Connect an agent

Keep the local server running. In another terminal:

```bash
npm run mcp:install
```

The installer merges the project’s `.mcp.json`, Claude desktop’s macOS configuration, and Codex’s MCP configuration when its CLI is on PATH. Existing files are backed up before changes; other servers are preserved. It stores absolute local paths, not API key values. Restart Claude desktop, enable the project server in Claude Code, or start a new Codex session. Host tool-approval settings are left in place.

You can target one client with `npm run mcp:install -- claude`, `-- codex`, or `-- project`. See [MCP setup and troubleshooting](docs/MCP.md), including custom ports and noninteractive tests.

Agents can also connect over the network, with nothing installed locally, to the remote MCP endpoint at `/mcp` (locally `http://127.0.0.1:3001/mcp`) using a scoped API key as a bearer token. It serves the same tools as the stdio bridge. See [the remote endpoint](docs/MCP.md#remote-endpoint-streamable-http).

1. Ask the external agent a normal question and tell it to use Two Hands through the connected `apilayer` tools.
2. The agent records intent internally. The backend starts the session automatically under its configured spending policy; the consumer does not approve sessions or choose a research budget.
3. The agent sends the immediate need and provider-neutral request parameters. Two Hands discovers relevant options with costs and evidence; the agent chooses explicitly, explains the choice, inspects results, and submits its final output.
4. Review the output against each criterion. Pass, fail, and unknown are separate; link supporting calls and explain judgments.
5. If needed, open a review case against a particular evaluation. Earlier outputs and retrospective reviews stay attached to their own versions.

Set `AGENT_SESSION_BUDGET_MICROS` on the backend to control the per-session research cap (default 100000 = $0.10; 0 blocks positive-estimate calls). This is separate from any shopping budget in a user's request. `record_intent` exposes no budget input or approval link. Backend authorization is recorded as an observed policy event, not human approval. The operator console remains the inspection and review surface. Its manual intent flow remains available for operator-created sessions. The `apilayer` MCP tool catalog contains no approval, evaluation, consent, payment, or refund tool.

## Company connectors

Tool companies can connect their own MCP servers instead of waiting for a built-in adapter. Two Hands reads the server's tools into a hashed snapshot; a reviewer approves each tool at an exact schema and price; agents then find them with `list_connector_tools` and call them with `call_connector_tool`. Calls get the same receipts, budgets, stated reasons and outcome links as built-in providers. A changed schema loses approval until reviewed again, and a connector can be suspended instantly. Endpoints must be public HTTPS, are checked at connect time against private addresses, and company tokens are stored encrypted. See [company connectors](docs/CONNECTORS.md), including `npm run connector:test-server` and `npm run connector:demo` for a local walkthrough.

## What gets recorded

| Record             | Meaning                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Accepted intent    | Fixed objective, weighted criteria, constraints, budget, and a fingerprint of that accepted version    |
| Tool options       | The catalog returned to the agent; it does not prove every option was considered                       |
| Tool selection     | The explicit provider the caller requested; no automatic provider routing or fallback in this workflow |
| Stated explanation | A required brief agent-supplied decision summary, separate from observed execution                     |
| Evidence           | Provider results, API/page status, timings, estimates, and extraction truncation metadata              |
| Output             | The agent’s actual submitted answer, with immutable versions and supporting call IDs                   |
| Evaluation         | Criterion judgments, evidence links, review source, score, coverage, and the exact output version      |
| Review case        | A documented shortfall and its resolution, linked to an evaluation                                     |

MCP exposes actions and supplied explanations, **not private internal reasoning or the entire host conversation**. Calls made outside Two Hands are not observed. Client and model names are reported identities, not independent attestations.

## Evaluation and commercial boundaries

- Intent match is the weighted pass fraction among assessed criteria. Coverage separately reports how much of the rubric was assessed. Unknown is not a failure or a fabricated neutral score.
- Model summaries use one latest, fully reviewed output per session and withhold aggregate scores until five eligible sessions. Unknown model identities stay unscored. These are local review summaries across the recorded tasks, not controlled general-accuracy benchmarks.
- Human-reported and assistant-reported reviews are labeled. Reviewer identity is not independently verified. An assistant’s evaluation is not converted into a human assessment.
- Review cases do not issue money, promise insurance coverage, determine eligibility, or create a payment entitlement.
- Commercial aggregate sharing is enabled for all existing and new observation sessions by account policy. Historical consent events are preserved; policy changes append audit events. Company usage and aggregate exports are available from the first eligible recorded activity, without a minimum account or session count. They omit raw intent, answers, queries, URLs, and explanations. Independent model-review minimum samples remain unchanged. Nothing is automatically sent or sold to vendors.
- Summary export omits research text and free-form model labels. Private evidence export intentionally contains the complete local record. Local hash-chain consistency is not third-party attestation or protection against an operator rewriting the database.

## Reliability and operations

Calls reserve integer USD micro-units transactionally against configured estimates. Exact request-key retries reuse receipts, including across restarts; uncertain interrupted calls are retained and conservatively settled without automatically repeating provider work. Output retries return the original output version’s receipt. The separate [provider billing interface](docs/PROVIDER_ADAPTERS_AND_BILLING.md) supports reviewed manual imports with exact request/account matching; it does not fetch invoices or change this estimated-spend ledger. Model-host subscription/token costs are not reconciled.

SQLite is single-user and local by default; set a long `API_TOKEN` before binding it beyond loopback. PostgreSQL requires configured Supabase Auth and live session/membership checks instead. Use HTTPS and trusted deployment access controls for remote use; hosted login, email delivery, and cutover still require validation in the target project. The MCP bridge defaults to loopback HTTP and also supports an explicitly configured HTTPS service using a scoped `APILAYER_API_KEY`; it never forwards the local owner token remotely. See [MCP setup](docs/MCP.md#hosted-stdio-bridge). Run one API server per database with either storage backend; PostgreSQL uses a session advisory ownership lock and requires a direct connection or session pooler. See [privacy and operations](docs/OPERATIONS.md).

Retention previews counts by default and requires `--apply` to delete. PostgreSQL cleanup requires an explicit storage partition, uses the API's backend selection and runtime lock, and preserves active or linked evidence. Follow the [backup and retention procedure](docs/OPERATIONS.md#retention) before running maintenance.

Earlier deterministic routing runs remain available at [Research tools](http://127.0.0.1:3001/research/#workspace). Their original data and workflows are preserved and explicitly distinguished from external-agent decisions. See [the earlier research workflow](docs/RESEARCH_WORKFLOW.md).

Preserved historical notes include the [observation plan](docs/OBSERVATION_PLAN.md), [November 3 accepted scope](docs/PENDING_IMPROVEMENTS.md), and [that implementation checkpoint](docs/IMPLEMENTATION_2026-11-03.md). Their dates and validation counts describe those earlier revisions.

See [loading and performance](docs/PERFORMANCE.md) for refresh behavior, compressed assets, and isolated database performance checks.

## Verify

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm run format:check
```

Tests use isolated fixtures and temporary databases. They cover protocol transport, authentication, approval boundaries, budgets, idempotency, real process interruption, retained evidence, output/review versions, cases, sharing policy, exports, mobile navigation, accessibility, and safe Markdown rendering.

Real PostgreSQL integration tests are separate and require disposable databases through `OCTOLAB_TEST_POSTGRES_URL`, `OCTOLAB_BILLING_TEST_POSTGRES_URL`, or `OCTOLAB_WORKBENCH_TEST_POSTGRES_URL`; see [migration validation](docs/POSTGRES_MIGRATION.md#validation), [billing validation](docs/PROVIDER_ADAPTERS_AND_BILLING.md#validation), and [workbench readiness](docs/PROVIDER_READINESS.md). Never point fixture tests at the production database.

During development, pass a test file to run a focused check:

```bash
npm test -- tests/discovery-policy.test.ts
npm run build
npm run test:e2e -- tests/browser/observation.spec.ts --project=desktop
```

Browser tests start the built server with `npm start`, so rebuild after source changes. They also start isolated fixture servers on ports 3102, 3106, 3107, and 3108, and Vite on port 3110; leave those ports and the application test port 3101 free. `tests/browser/dev-proxy.spec.ts` checks real browser writes through both the production server and the development proxy, including rejection of unrelated origins. These checks use the isolated in-memory test backend and make no provider calls. Focused checks supplement the full verification commands above.

A reproducible durability workload is available without any external provider calls:

```bash
SOAK_SECONDS=60 npm run test:soak
```

Live checks require a deliberately accepted budget and configured provider credentials. Never treat fixture results as provider or model performance. The earlier `npm run smoke:live` command makes paid search calls and requires its explicit budget setting; see [its documentation](docs/RESEARCH_WORKFLOW.md).

For the separate provider lab, the backend supplies the run and daily spending caps. The default fifteen-call suite is $0.080 at default estimates; custom versioned suites have their own configured estimates. Saved-result replay makes no new provider calls. Consumer sessions have no approval step. To exercise only synthetic lab workloads without network calls, run `SOAK_SECONDS=60 npm run test:soak:providers`.

## Verify an exported evidence record

Export private evidence from a session’s Record & controls tab, then run:

```bash
npm run verify:evidence -- /path/to/private-evidence.json
```

This offline check compares the intent fingerprint, audit chain, captured calls, output/review links, estimated ledger, case resolutions, and consent state. It makes no network requests and does not modify the file. A passing result establishes internal consistency, not source truth, independently verified identity, or external attestation. See [observation architecture](docs/OBSERVATION_ARCHITECTURE.md) for the trust boundaries.

## Request costs and reported usage

Before choosing a provider, call `discover_tools` with the immediate `need`, provider-neutral `operations`, and relevant `context`. The recorded intent and constraints are included automatically. Two Hands discovers compatible alternatives; the caller does not need to name every provider. Discovery makes no provider calls and consumes no provider budget.

```json
{
  "sessionId": "<active session ID>",
  "need": "Find the official specification",
  "context": {
    "requirements": "Prefer primary sources",
    "evidenceGaps": ["Need the original published specification"]
  },
  "operations": [
    {
      "operation": "search",
      "query": "example product specification",
      "maxResults": 10,
      "content": "any"
    }
  ]
}
```

This returns Exa and Tavily search alternatives, plus an explanation that Firecrawl requires a known URL. For extraction, use `operation: "extract"` with `url`. `content: "page_text"` excludes excerpt-only search adapters; `complete_page` currently produces no compatible candidate because the adapters cannot guarantee complete, untruncated content. Tavily `searchDepth` is not mapped to an invented Exa depth. Capabilities and output differences remain explicit.

Every new provider call requires a non-empty `statedReason`. The external agent still makes the final choice; the server does not automatically execute discovery candidates or switch providers. Reputation separates organic execution, evidence-linked answer reviews, and controlled samples; it does not invent a composite quality score. See [discovery contract](docs/TOOL_DISCOVERY.md).

Each tool's `requestEstimates` describes its proposed requests, cost breakdown, pricing source, rate-card version, and whether each request individually fits the remaining session budget. Candidates are alternatives, not a batch execution plan; their costs are not added together. Search result counts are 1–20 (default 10); Tavily depth is basic (default, 1 credit) or advanced (2 credits). Exa uses auto mode: its configured base covers up to 10 results, plus `EXA_ADDITIONAL_RESULT_USD` per requested result above 10. Execution recomputes and reserves the same request estimate under the current rates, preserving the options in the receipt. Re-estimate if the request changes. Calls without these options retain their previous defaults. Legacy `requests` remain accepted and now expand into compatible alternatives. Without concrete operations/requests, discovery returns labeled defaults and missing-input guidance; it cannot infer whole-task cost from prose.

Provider rules were checked on 2026-11-02 against [Exa pricing](https://exa.ai/pricing), [Tavily credits](https://docs.tavily.com/documentation/api-credits), and [Firecrawl billing](https://docs.firecrawl.dev/billing). USD conversion rates remain server-configured because account plans, discounts, and free credits are unknown. Firecrawl quotes one base Markdown scrape credit; document parsing can add credits, so its base quote is not an upper bound. Budget accounting is an estimated ledger, not an enforced provider invoice limit.

After execution, the trace, evidence view, and session provider-usage panel show Exa's reported USD cost and Tavily/Firecrawl's reported credits when present. Missing usage is labeled unreported, never zero. Provider subtotals show reporting coverage; credits are not silently converted to actual dollar charges. Historical events retain their original estimates and expose reported usage already present in saved results. No billing reconciliation or live provider calls are performed by this display.
