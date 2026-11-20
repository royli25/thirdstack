> This document covers the legacy research engine. See [observation architecture](OBSERVATION_ARCHITECTURE.md) for the primary external-agent workflow and its API.

# API contract

Base URL: `http://127.0.0.1:3001`. Requests that mutate state require `Content-Type: application/json`. In PostgreSQL mode these routes require a verified account session; legacy task mutations additionally require platform administrator access. Send `Authorization: Bearer <access token>`; see [account API and roles](AUTH.md). SQLite retains `Authorization: Bearer <local access token>` when `API_TOKEN` is configured. Both modes enforce same-origin writes. The separate `POST /api/webhooks/stripe` endpoint authenticates raw JSON with a Stripe signature instead; see [Stripe test deposits](STRIPE_DEPOSITS.md). `/healthz` returns minimal unauthenticated liveness.

## Create explicit intent

`POST /api/tasks`

```json
{
  "prompt": "Find funded companies building agent payment products, with current activity and evidence links.",
  "query": "agent payments companies funding",
  "queries": [
    "agent payments companies funding",
    "agent payments startup product launch"
  ],
  "requiredCount": 20,
  "budgetMicros": 100000,
  "criteria": [
    "Currently operating",
    "External funding evidence",
    "Agent payments relevance"
  ],
  "domains": [],
  "mode": "route",
  "preference": "balanced",
  "consent": false
}
```

Returns `201` with a saved task ID and ready status. No paid operation occurs. `queries` is optional; otherwise `query` is the plan. Plans allow 1–5 queries, budget $0.001–$5, target 1–100, unique criteria 1–8, allowed domain hostnames 0–10. Task storage is limited to 500 local sessions.

## Execute research.search

`POST /api/tasks/:id/run` with `{}` executes the saved plan. `{ "query": "more specific follow-up" }` executes one follow-up query with the same task rubric, domain policy, mode, and remaining budget.

Returns `202` once accepted. Poll `GET /api/tasks/:id` for task state and append-only events. Repeated simultaneous operations for the same task return `409`. Missing keys, exhausted budget, and task safety caps also return actionable `409` errors. The global concurrency limit returns `429`.

`POST /api/tasks/:id/cancel` with `{}` requests stopping between calls. It does not refund or abort an in-flight vendor request. Returns whether a request to stop was registered.

## Add a known evidence URL

`POST /api/tasks/:id/sources` with `{ "url": "https://example.com/evidence" }` adds a user-supplied source without making a provider request. Only public-looking HTTPS hostnames without credentials or custom ports are accepted; the task's domain policy also applies. Repeated URLs are deduplicated. At most 20 user-supplied URLs may be added per task.

The source keeps `provider: "user"` and `callId: null` to describe its original provenance. A separate `extraction` field records Firecrawl’s call ID, access mode, time, and page status. It is not represented as a provider search result. Extraction provenance is recorded separately.

## Execute research.fetch_url

`POST /api/tasks/:id/fetch`

```json
{ "sourceId": "<UUID of a returned source>" }
```

Requires configured Firecrawl credentials, or explicit `FIRECRAWL_ALLOW_KEYLESS=true` for its documented free tier. Keyless calls omit Authorization, settle zero USD as free-tier usage, stop on access/quota refusal, and have a default session safety cap of ten requests. Keyed calls require enough remaining estimated budget. The URL is resolved from the stored source, not accepted as arbitrary caller input. Extraction updates the stored excerpt and records a separate paid capability. It does not automatically verify funding or current activity. Provider API status and retrieved page status are recorded separately. A known page HTTP error cannot be used to accept a company. Changed content or page status increments the source version and invalidates dependent assessments.

## Retry receipts for provider operations

The `/run` and `/fetch` endpoints accept an optional `Idempotency-Key` header: an opaque 8–128 character identifier using letters, digits, dot, underscore, colon, or hyphen. The browser supplies a UUID for each deliberately initiated operation. API clients retrying after a lost response must reuse the **same key and arguments**.

- Reusing a completed operation's key returns its original acceptance/result with `replayed: true` and makes no additional provider request.
- Reusing a key while it is pending returns `202`, `pending: true`, and the task ID; poll the task instead of starting another job.
- Reusing the key with different arguments returns `409`.
- After a server interruption, a pending receipt returns `409` with a trace-review instruction. It never automatically repeats an uncertain vendor call.
- Keys are scoped to the task and normalized operation. Receipts persist across normal restarts and are removed with task deletion or retention.

Task state and initial receipt persistence are transactional. A write failure cannot leave a scheduled in-memory operation with only a half-written receipt. There are no automatic POST retries in the browser; a new deliberate click represents a new operation and uses a new key.

## Review evidence

`POST /api/tasks/:id/assessments`

```json
{
  "sourceId": "<source UUID>",
  "organization": "Organization name",
  "criteria": {
    "Currently operating": "pass",
    "External funding evidence": "unknown",
    "Agent payments relevance": "pass"
  },
  "evidence": {
    "Currently operating": ["<product source UUID>"],
    "External funding evidence": ["<funding source UUID>"],
    "Agent payments relevance": ["<product source UUID>"]
  },
  "disposition": "pending",
  "note": "Current product page supports activity and relevance; the funding claim still needs proof."
}
```

The criteria must exactly match the saved rubric. Every evidence ID must belong to the task. If evidence mappings are omitted, the reviewed source is used by default. Allowed verdicts: pass/fail/unknown. Allowed dispositions: pending/accepted/rejected. Acceptance additionally requires an organization, every criterion passing, and a note. Accepted assessments must also supply `evidenceVersions`, a map of every referenced source ID to its current `contentVersion` (default 1). Stale versions return 409 rather than silently accepting an old review. Updates replace the current source assessment and append a feedback event.

## Privacy controls

`POST /api/tasks/:id/privacy` with `{ "consent": false }` withdraws the task from subsequent local aggregate reporting immediately. It remains stored locally for the workspace. Setting true opts it back in explicitly.

`POST /api/tasks/:id/delete` requires `{ "confirmTaskId": "<exact task UUID>" }` and removes that task and all its events. Active or reserved operations block deletion until settled. The UI presents a separate explicit confirmation; this does not delete vendor logs, exported files, or external backups.

## Read and export

| Endpoint                     | Response                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`            | Provider key presence, configured estimates, policy/rate-card versions, compatibility `minCohort: 0`; no credentials |
| `GET /api/tasks`             | Recent local task summaries                                                                                          |
| `GET /api/tasks/:id`         | Internal task context, sources, current assessments, accepted organizations, full trace                              |
| `GET /api/tasks/:id/results` | Human-reviewed organization shortlist and CSV string; contains workspace content                                     |
| `GET /api/tasks/:id/export`  | Allowlisted JSON event summary without raw task/provider/reviewer content                                            |
| `GET /api/analytics`         | Opted-in aggregate usage from the first task; empty history returns zero counts and unknown latency                  |

The internal task endpoint is not a provider-facing feed. Use the sanitized export for sharing traces without content. Result CSVs intentionally include company names, evidence URLs, and reviewer notes; cells are escaped to prevent spreadsheet formula execution.

## Error behavior

Errors return `{ "error": "Actionable message" }`. Vendor errors expose only classified transport errors or HTTP status, never raw vendor bodies. Budget amounts in responses are estimates in integer USD micro-units, not proof of actual charges.
