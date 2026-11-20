# Seller reports

The **Agent choices** section of the company area shows a tool company where agents chose its tool, where they chose another, and the reasons they gave. It is built only from recorded sessions.

## What agents now report

| Field         | Where                         | Meaning                                                   |
| ------------- | ----------------------------- | --------------------------------------------------------- |
| `taskType`    | `record_intent`               | Closest category for the task. Defaults to `other`        |
| `reasonTheme` | each named provider tool call | Optional single theme for the stated reason for that call |

Both come from fixed lists in `server/seller-taxonomy.ts` and are agent-reported, never observed. They exist so reports can group activity without exposing objectives or stated reasons. Sessions and calls recorded earlier have neither and appear as "Other" and "No theme given".

## The report

`GET /api/company-insights/:provider/choices?days=7|30|90&named=0|1`, computed in `server/seller-report.ts`. A task is one session.

- **Funnel**: eligible, chosen by the agent, call succeeded, cited in the answer.
- **By task type**: for eligible tasks, how many chose this tool, another tool of the same kind, or neither.
- **Reasons**: themes from the first call to this tool, and from the first call to the tool chosen instead.
- **Demand not served**: requests of this kind where the tool was ruled out before the agent chose, by cause.
- **Failures**: failed calls by kind, and what the agent did next.
- **Price**: average estimate shown, average cost the provider reported, tasks ruled out on budget, tasks lost with cost as the reason.
- **Used alongside** and **by which agents**.

## Rules the report keeps

- Aggregates only. No objective, query, URL, stated reason, answer, title, model name or session ID.
- "Chosen" is the agent's own choice. Calls octolab routed are counted separately and never as a choice.
- A share needs at least 30 tasks (`SELLER_MIN_SAMPLE`). Counts are always shown.
- With `named=0`, other companies are grouped as "Other search tools" or "Other page tools". With `named=1` they are named.
- Reasons and task types are what agents reported.

## Seller tools

Everything a company uses after onboarding is under `/api/seller/:provider` (`server/seller-api.ts`). All responses are aggregate.

| Route                            | What it answers                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /overview`                  | One call for a home screen: funnel, change on the previous period, alerts, top findings, trend |
| `GET /report`                    | The full report. Filters: `days`, `taskType`, `host`                                           |
| `GET /trend?bucket=day\|week`    | Series with empty periods filled in                                                            |
| `GET /findings`                  | Ranked, rule-based observations, each with its evidence, a suggestion and how to check a fix   |
| `GET /alerts`                    | What changed against the previous equal period, judged by the seller's thresholds              |
| `GET /digest[?format=text]`      | A short plain-language summary of the period                                                   |
| `GET /listing-impact`            | How each listing version performed over 90 days, for tasks shown that version                  |
| `GET /export?section=…`          | CSV of `tasks`, `reasons`, `missed`, `failures` or `trend`                                     |
| `GET /listing`, `POST /listing`  | The text agents see now, the pending draft, history; submit a new draft                        |
| `POST /listing/check`            | Dry-run the wording rules without submitting                                                   |
| `POST /listing/withdraw`         | Withdraw a pending draft                                                                       |
| `POST /listing/review`           | A reviewer approves or rejects. Approval makes the version live                                |
| `GET /settings`, `PUT /settings` | Named comparison and alert thresholds, with a revision check                                   |
| `GET /history`                   | Audit trail of settings and listing changes                                                    |

`/api/seller-admin/internal-hosts` lists agent names treated as internal traffic. Their sessions are left out of every report and counted under data quality.

### Listings

A listing is the description, "use when" and limitations agents read in discovery. Sellers can change it, with three safeguards:

- **Wording rules** (`lintListing`) refuse text that tells the agent what to choose, addresses it directly, makes ranking claims, includes links, or names another company.
- **Review**: a draft is not shown to agents until a reviewer approves it. One draft can be pending at a time.
- **Versions**: each approved listing gets a number. Every offer records the version it showed, so results can be tied to the wording agents saw. Version 0 is the adapter's built-in text.

Listing impact compares versions. They ran at different times on different tasks, so a difference is a signal to test, not proof the wording caused it.

The named tool descriptions an MCP client loads at startup still use the built-in text. Approved listings appear in the catalog and in `discover_tools` results.

### Named comparison

Each company chooses whether to share and see names. Another company is named in a report only when both have agreed. Otherwise it appears as "Other search tools" or "Other page tools".

### Direct calls

An agent that calls a tool without asking for options first still made a choice. That task counts as eligible and chosen, with listing version 0.

## Hosted mode

With the PostgreSQL backend, company members use the same tools at `/api/companies/:id/seller/...` (`server/seller-hosted.ts`). The path after `/seller` matches the table above.

- **Binding.** The company's approved provider decides what is shown. Nothing in the request can change it. The company must be approved with insights released; otherwise every route returns 403. A non-member gets 404.
- **Roles.** Analysts and owners can read. Only the owner (or a platform administrator) can submit or withdraw a listing and change settings. Only a platform administrator can review a listing.
- **Audit.** Opening the overview, the report or an export is recorded in the company's access history. Listing and settings changes record who made them.
- **Data.** `loadSellerDataHosted` reads consented sessions across every customer workspace from the last 200 days. It keeps only what the analysis needs and drops objectives, queries, URLs, stated reasons, answers and page content before analysis. Workspace and session IDs are never returned.
- **Storage.** Seller settings, listings and their history live in `seller_settings`, `seller_listings` and `seller_events` (migration `20261112210000_seller_tools.sql`). They are keyed by provider, shared across workspaces, closed to workspace roles, and not part of a workspace import.
- **Operator view.** `/api/seller/:provider/...` remains for platform administrators.

The migration has been applied only to disposable test databases. Applying it to the hosted project is a separate, deliberate step.

Hosted reports load the whole window on each request. That is fine at current volumes and will need a summary table as usage grows.

## Not built yet

- **Screens for company members.** The Agent choices and Listing tabs call the operator routes. The signed-in company dashboard still needs to call the company routes.
- **Delivery.** Alerts and the digest are computed on request. Nothing is emailed or scheduled.
- **Billing** for companies.

## Simulated data

```bash
npm run simulate:sellers -- 800 ./data/simulation.sqlite --reset
```

`scripts/simulate-seller-data.ts` seeds a separate database with invented agent sessions. It uses the real session, discovery, call, routing, listing and outcome code with fake providers and scripted choices, makes no network calls, and refuses to write to the working database. Sessions are spread over 60 days and include a listing change, a failure incident and some internal traffic, so period comparison, alerts and listing impact have something to show. The database is marked as simulated and every report built from it carries that notice. Timings are not realistic. Start the server with `DB_PATH=./data/simulation.sqlite` to view it.

Simulated results show that the report works. They say nothing about any real provider or agent.
