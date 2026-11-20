# User, admin, and tool company journeys

PostgreSQL account mode separates three areas. One account can have more than one authorized area; moving between areas does not grant permissions. Company ownership is independent of personal account access. Platform administration comes only from the server's explicit UUID allowlist.

| Person             | Entry and sidebar                                                                                                            | First task                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| User               | `#dashboard`: tools, routing, activity, usage, connections; owners also see credits and API keys                             | Sign in, create a scoped API key, then connect an external agent; private account setup is automatic |
| Tool company owner | `#company`: overview, live usage, controlled tests, test plans, integration, company details, and owner-only team management | Register the company and tool for ownership/integration review; independent of personal activity     |
| Platform admin     | `#admin`: persistent navigation across company reviews, account activity, disputes, provider lab, and tool access            | Review company ownership and manage audited tool allowances; open each destination directly          |

Users keep the conversation and tool choices in Claude, Codex, or another MCP host. The dashboard configures and inspects that infrastructure. It does not turn each consumer task into an operator approval flow.

The admin sidebar includes Model evaluations, Tool activity, and Review cases. Account activity uses the signed-in account, payment disputes span accounts, and Tool access lists confirmed accounts with their [operator allowances](WORKSPACE_ALLOWANCES.md).

## Register and review a tool company

1. Open **For tool companies** on the public site, then sign in or create and confirm an account. Confirmation and recovery return to the company area.
2. Submit company name, HTTPS website, tool name, and description. The registration starts **Under review** (`pending`). It neither claims an existing provider nor exposes its data.
3. A platform admin opens **Company reviews**, checks the applicant and ownership evidence, selects the verified existing integration, and records feedback. Approval requires a provider binding. Only one approved company can own each integrated provider.
4. If the admin requests changes (`rejected`), the owner uses **Update registration**, edits the details, and resubmits. This creates a new audited revision and returns the registration to `pending`. Stale edits return `409`.
5. Approval and aggregate-insight release are separate administrator decisions. Suspending the company immediately blocks subsequent insight requests. An owner cannot lift suspension or edit an approved integration into a different provider.

The portal supports one owner per company registration, up to five registrations per account, and the existing Exa, Tavily, and Firecrawl integrations. Owners can add analysts to their company; emailed invitations remain separate work. Company registration itself accepts no credentials or endpoints. After approval, which no longer requires a built-in provider, an owner can register the company's own MCP server as a [connector](CONNECTORS.md); a platform administrator reviews it before agents can use it.

## Manage company team access

Open **Company team** in the company sidebar. The owner can add an analyst by the email of an existing, confirmed Two Hands account, then remove that access when needed. A company can have at most 20 members including its owner. The owner cannot be removed or transferred through this screen.

Analysts can read their company's profile and approved aggregate insights. They cannot change a registration, manage team members, read access history, or approve an integration. Membership is checked on subsequent requests, so removal blocks further company reads. Replaying an earlier grant after revocation does not restore access; a deliberate new grant requires a new request key.

The owner-only **Access history** records recent analyst grants, revocations, and aggregate-report access, including when a report was withheld for release. Historical cohort-suppressed access events remain readable. Platform admins can inspect/manage company teams under their explicit permissions.

## Switch areas and preview permissions

**Settings** is available in the upward-opening account menu, together with in-app **Help and documentation**. It holds links to the account's user and company areas. Administrators also have **Preview as** options with a visible **Return to admin** control. User preview removes administrator privileges and uses the administrator’s existing personal data. Company preview selects one real registration or an explicitly labeled integrated provider without a registration. It restricts backend requests to that target, uses real eligible aggregate counts without a minimum account/session count, and creates no permanent membership or fake company records. Provider-only previews are read-only; registered-company actions retain the actual administrator as their audit actor.

## Read company insights

An approved company owner or analyst sees metrics only for the provider bound by an administrator. The backend checks current membership and company status on each request; personal data access cannot change that binding. Company members cannot read another company's record, customer prompts/results, private exports, or the operator lab.

Reports have four allowlisted counts: eligible offered sessions, sessions using the tool, completed calls, and successful calls. Eligibility follows discovery matches, and counted execution must follow the eligible offer. These are observed session-level counts, not proof that a model considered an option, an exact candidate attribution, an explanation for rejection, or a quality score.

Registered companies and administrator company previews share the same dashboard structure. Overview keeps four cards for selection, request success, selected sessions, and completed requests; Live usage, Controlled tests, Test plans, and Integration remain in the sidebar whether data is available, zero, or withheld. Pending or unbound registrations retain their own company/tool identity. Controlled-test and plan sections currently show truthful empty states, not operator-lab receipts or scheduled experiments. Company details and owner-only Company team remain separate sections.

After explicit insight release, counts are available from the first eligible recorded usage, including one account and one session. No usage returns real zero counts; sections stay visible. Pending release still returns `metrics: null`. No raw content, consumer identities, or session IDs are returned. No package is published or delivered automatically.

## Company and review API

All company routes require a verified Supabase account session. Machine API keys and editable account metadata do not grant company/admin access. Writes require same-origin JSON. Administrator previews send `X-Octolab-Preview: user` or `company`; company preview additionally requires `X-Octolab-Preview-Target: company:<UUID>` or `provider:<registered-provider-id>`. The backend verifies the original administrator and confines the request to the selected context. Non-admin preview attempts receive `403`. `GET /api/auth/preview-targets` lists available targets; `GET /api/auth/preview-insights` reads the selected provider-only preview with the same aggregate privacy rules.

| Method | Route                                 | Contract                                                                                                                                                   |
| ------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/auth/companies`                 | `{name, website, toolName, description, requestKey}` creates an idempotent owner registration                                                              |
| GET    | `/api/companies/:id`                  | Company-member or platform-admin record; unrelated accounts receive `404`                                                                                  |
| POST   | `/api/companies/:id/resubmit`         | Owner-only revisioned edit of `pending`/`rejected` registrations; same details plus `revision`, without `requestKey`                                       |
| GET    | `/api/companies/:id/insights`         | Approved company report with `available` (including zero usage) or `awaiting_release` status; historical `insufficient_data` access events remain readable |
| GET    | `/api/companies/:id/members`          | Owner/admin-only company team list                                                                                                                         |
| POST   | `/api/companies/:id/members`          | Owner/admin-only `{action:"grant", email, requestKey}` or `{action:"revoke", userId, requestKey}`                                                          |
| GET    | `/api/companies/:id/access-history`   | Owner/admin-only latest 100 membership-change and report-access events                                                                                     |
| GET    | `/api/admin/companies?status=pending` | Admin queue, server-filtered by `pending`, `approved`, `rejected`, `suspended`, or `all`; up to 100 items and an opaque `nextCursor`                       |
| POST   | `/api/admin/companies/:id/review`     | `{revision, status, providerId, insightsEnabled, feedback}` records approval, requested changes, or suspension                                             |
| GET    | `/api/admin/companies/:id/history`    | Admin-only registration, resubmission, and review history with actor, time, revision, and decision data                                                    |

Pass `cursor=<nextCursor>` with the same status to continue the queue. Review writes require the current revision, so a stale review cannot overwrite a newer decision. Company fields are bounded: name/tool name 2–80 characters, website at most 300 characters, description 20–1,500 characters; review feedback is 5–1,500 characters.

The public `GET /api/public/catalog` returns tool descriptions, availability, and configured estimates without private activity. The previous `/api/company-insights/:provider` remains an administrator-only operator preview in PostgreSQL mode, separate from this company-membership-scoped API. SQLite/local mode preserves its existing demo and local access-token behavior.

See [account configuration](AUTH.md), [provider lab](PROVIDER_LAB.md), and [current hosted rollout status](SUPABASE_ROLLOUT.md).
