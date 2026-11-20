# Company connectors

A tool company can connect its own MCP server to Two Hands. Agents using Two Hands can then call that company's tools, and every call is recorded with the same evidence as a built-in provider call: stated reason, arguments, result, timing, estimate, and a link to the outcome.

Two Hands does not write an adapter per company. It reads the company's tool list, a reviewer approves each tool at an exact schema version, and Two Hands forwards approved calls.

## Lifecycle

1. **Register.** The company supplies a short name (`slug`), display name, description, its MCP endpoint, an optional bearer token, and a declared price per call. Two Hands connects immediately, reads the tool list, and stores it as a hashed snapshot. The connector and every tool start as `pending`.
2. **Review.** A reviewer approves the connector and individual tools. Each tool decision names the `schemaHash` the reviewer saw and the approved price. A stale hash or revision returns `409`. A connector cannot be approved without at least one approved tool.
3. **Use.** Agents see approved tools through `list_connector_tools` and call them with `call_connector_tool`. Exposed names are `<slug>__<tool>`.
4. **Change.** `refresh` re-reads the tool list. A tool whose name, description or input schema changed returns to `pending` and cannot be called until approved again. Removed tools are marked `removed`. Changing the endpoint or token sends an approved connector back to `pending`.
5. **Stop.** `suspend` blocks every tool on the connector immediately. `reinstate` restores it.

| Status      | Connector                         | Tool                                             |
| ----------- | --------------------------------- | ------------------------------------------------ |
| `pending`   | Registered or changed; not usable | New or changed schema; not usable                |
| `approved`  | Usable                            | Usable while its live hash equals `approvedHash` |
| `rejected`  | Not usable                        | Not usable                                       |
| `suspended` | Kill switch; nothing usable       | —                                                |
| `disabled`  | —                                 | Turned off by the reviewer; survives refreshes   |
| `removed`   | —                                 | No longer offered by the company's server        |

## Agent tools

| MCP tool               | HTTP                                        | Meaning                                                                           |
| ---------------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| `list_connector_tools` | `GET /api/observations/connector-tools`     | Approved tools with company, input JSON Schema and per-call estimate. Free        |
| `call_connector_tool`  | `POST /api/observations/:id/connector-call` | `{requestKey, tool, arguments, statedReason, reasonTheme?}` in the active session |

A call is checked in this order, and nothing reaches the company's server unless every check passes: the tool is approved at its current hash, the arguments validate against the approved JSON Schema, the session is authorized, under 50 calls and within budget, the connector's per-minute limit (`CONNECTOR_RPM`) allows it, the operator allowance (hosted) and the API key's limit can reserve the estimate. Reusing a `requestKey` with the same arguments returns the recorded call without a second remote request; different arguments return `409`.

Results carry `source: "company_connector"`, `untrusted: true`, the returned text (capped at 60,000 characters, with `truncated`), `isError`, counts of non-text content that was not passed on, and small `structuredContent` when present. A connector tool error is recorded as a failed call. Failed calls are charged their estimate, as built-in provider calls are.

Calls are recorded with `provider: "connector:<slug>"` and a `connector` block (`id`, `slug`, `company`, `tool`, `schemaHash`, `snapshotVersion`). Events are the usual `selection_explanation` (agent-reported), `tool_called` and `tool_result` (observed).

## Discovery

`discover_tools` returns connector tools alongside built-in providers, so agents find them in the normal flow instead of having to know to call `list_connector_tools`.

- **Matching (`connector-lexical-v1`).** The words of the stated `need`, `context.requirements`, `context.evidenceGaps` and any search queries are compared with each approved tool's name and title (counted twice) and its description and input field names (counted once). Words are lowercased, split on punctuation, `snake_case` and `camelCase`, stripped of filler words and simple plurals. The company name is not matched, because it is shared by every tool on a connector. Only tools with at least one shared word are offered, best first, then cheapest; at most 10 per discovery, with the number withheld reported. There is no LLM and no hidden scoring: every offer carries `relevance.matchedTerms`. It is a shortlist for the agent to assess, not a judgement of fit.
- **A need alone is enough.** Built-in search and extraction still need `operations` to be priced; connector tools do not.
- **Each offer** (`connectorTools[]`) has the exposed tool name, company, company-supplied description, input schema, schema hash, approved estimate, status and reason, relevance, and organic reputation from recorded calls (completed, succeeded, failed; median latency and success rate only from five samples).
- **Status.** `eligible`; `disabled` when the API key may not reach connector tools; `unavailable` when the hosted operator allowance does not cover the estimate; `over_budget` when the estimate exceeds the remaining session budget. `candidateConnectorTools` lists the eligible ones.
- **Recorded.** The offers are saved in the session's `tools_offered` event with `connectorMatching` (basis, approved tool count, withheld count). This is the exposure record that later lets a company see when agents were offered its tool and whether they chose it. The session trace shows the offers under the built-in options.

`route_call` does not choose connector tools. Routing picks among tools that can stand in for each other, and connector tools generally cannot: each has its own input schema and purpose. Routing among connector tools will make sense once reviewers assign interchangeable capabilities and two companies offer the same one.

## Security

- **Network.** Endpoints must be public HTTPS hostnames on the default port, without embedded credentials. Every resolved address is checked inside the socket's own DNS lookup, so a hostname cannot pass the check and then connect to a private, loopback, link-local, metadata or reserved address. Redirects are refused. Each request has a time limit (`CONNECTOR_TIMEOUT_MS`) and a 1 MB response cap. Environment proxies are not used.
- **Tokens.** Company tokens are encrypted with AES-256-GCM under `CONNECTOR_SECRET_KEY`, bound to the connector ID, and never returned by any API or written to events. Without the key, only endpoints that need no token can be registered.
- **Content.** Tool lists are limited to 50 tools, names to 48 safe characters, and schemas to 32 KB that must compile. Agent instructions and every result label connector output as untrusted third-party material.
- **Isolation.** Each operation opens and closes its own MCP session; nothing is shared between customers or calls.
- **API keys.** Connector tools are not in a key's tool list. A key may call them only when it has `tools:execute` and allows every built-in tool. A key restricted to particular tools never reaches a third-party server. Keys cannot manage connectors.

## Who manages connectors

| Mode                | Register and maintain                                                                     | Review                                                              |
| ------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Local (SQLite)      | The operator, at `/api/connectors`                                                        | The operator, at `/api/connectors/:id/review`                       |
| Hosted (PostgreSQL) | An approved company's owner, at `/api/companies/:companyId/connectors`; analysts can read | Platform administrators only, at `/api/admin/connectors/:id/review` |

Routes: `GET` list, `POST` register, `GET /:id` detail with history, `PATCH /:id` (endpoint, token, description, declared price; requires `revision`), `POST /:id/refresh`, `POST /:id/review` (`{revision, decision: approve|reject|suspend|reinstate, note, tools: [{name, schemaHash, decision: approve|reject|disable, estimateUsd?}]}`).

A company can now be approved without owning a built-in provider, so a connector-only company can be onboarded. Aggregate insights still require a built-in provider binding. Connector state is global catalog state, like seller listings: it is not part of a SQLite-to-PostgreSQL workspace import, and hosted companies register their connectors again.

## Try it locally

```bash
# .env (dev only)
CONNECTOR_SECRET_KEY=<64 hex characters>
CONNECTOR_ALLOW_LOOPBACK=true

npm run dev
TEST_MCP_TOKEN=demo-company-token-123 npm run connector:test-server   # http://127.0.0.1:4100/mcp
npm run connector:demo
```

The demo registers the fixture company's server, approves two tools, then acts as an agent over the remote `/mcp` endpoint: it records an intent, lists connector tools, calls one, and submits an outcome citing the call. Open the printed session in the operator console to inspect the trace.

`CONNECTOR_ALLOW_LOOPBACK=true` permits plain HTTP to `127.0.0.1`/`localhost` only, and is ignored when `NODE_ENV=production`. It never allows other private addresses.

The fixture server (`tests/fixtures/test-mcp-server.ts`) offers a normal forecast tool, a currency tool with an enum schema and structured output, and tools that fail, stall, return too much text, or return text that tries to instruct the agent. It can change a schema or drop tools to exercise re-review.

## Dashboard

| Where                                                        | Who                                         | What                                                                                                                  |
| ------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Operator console, **Connectors** (`#connectors`, local mode) | The local operator                          | Register, edit, refresh, review, suspend                                                                              |
| Company area, **Connectors** (`#company/<id>/connectors`)    | Approved company owners; analysts read only | Register, edit endpoint/token/description/price, refresh, see review status and history                               |
| Admin area, **Connector reviews** (`#connectors`, hosted)    | Platform administrators                     | Approve, reject or turn off each tool at a chosen price; approve, request changes, suspend or reinstate the connector |
| User dashboard, **Tool catalog**                             | Customers                                   | A _Company connector tools_ section listing approved tools and their prices                                           |

Every tool decision defaults to _No change_, so approving is always explicit. The review sends the schema hash shown on screen; if the company changed the tool since, the server refuses and the reviewer reloads. Before company approval the company screen explains that connectors are not available yet. The admin company review accepts _None: the company supplies its own connector_ in place of a built-in provider, and then keeps aggregate insights off.

## Not yet included

- Session and activity views show connector calls with the raw `connector:<slug>` label rather than the company name.
- Seller reports and insights for connector tools. The exposure data they need is now recorded at discovery.
- Workspace routing switches for individual connector tools, and routing among interchangeable connector tools.
- Provider-reported usage and billing reconciliation for connectors; the reviewed per-call estimate is what is charged.
- OAuth to company servers; only a static bearer token is supported.
