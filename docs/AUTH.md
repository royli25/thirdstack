# Account access

Two Hands uses Supabase Auth for browser identity and PostgreSQL for personal data. The backend verifies the session and resolves private data from the signed-in user ID. The first personal-data request prepares a private storage partition if the account has no existing solely owned partition. Company-only routes require only account identity and company authorization.

The public landing page remains available before sign-in. The browser uses the Supabase Auth SDK for email/password signup, confirmation, recovery, session refresh, and sign-out. See [the three role journeys](ROLE_JOURNEYS.md).

## Configuration

Development settings belong in ignored `.env.development.local`; `npm run dev` validates and loads that file exclusively. Production settings belong in deployment secrets. Use separate Supabase projects for the two environments, with the database and Auth settings paired within each project. See [development setup](DEVELOPMENT.md) for the project-reference guard and callback origins. Existing `npm start`/operator `.env` compatibility remains a deployment concern.

| Setting                  | Purpose                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| STORAGE_BACKEND=postgres | Explicitly selects PostgreSQL and Supabase account authentication.                                                                 |
| DATABASE_URL             | Server-only direct/session-pooler connection; never a browser variable.                                                            |
| LEGACY_WORKSPACE_ID      | Required fallback namespace: the inspected SQLite identity for an import, or a fresh UUID for empty development. Grants no access. |
| SUPABASE_URL             | Hosted project's HTTPS API origin.                                                                                                 |
| SUPABASE_PUBLISHABLE_KEY | Public sb_publishable_… Auth key. Secret/service-role keys are rejected.                                                           |
| LEGACY_OWNER_USER_ID     | Explicit intended Supabase user UUID for the SQLite import.                                                                        |
| SUPABASE_ADMIN_USER_IDS  | Optional comma-separated platform operator UUID allowlist. Blank grants no platform administrators.                                |

VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are supported public aliases. The frontend receives validated public settings from /api/auth/config; private credentials are never embedded into its build.

No dashboard password, personal access token, legacy JWT signing secret, or service-role key is needed. The connected management plugin and the application's runtime database connection serve different purposes.

Use the same Supabase project for Auth and PostgreSQL. The backend database account must read Auth session/user records and private membership metadata and assume the private runtime role. Business queries use that non-login, non-bypass role with forced workspace RLS. An unexpectedly privileged/inheriting runtime role is rejected.

In Supabase Auth, enable email/password sign-in and email confirmation. Set the Site URL and allow only actual development/production callback URLs at the app origin. The callback uses /?auth_callback=1 with #dashboard, #company, or #admin to preserve the intended area. Configure production email delivery before relying on confirmations or password resets for customers. SMTP secrets stay outside frontend configuration.

## Historical data

Follow [PostgreSQL migration](POSTGRES_MIGRATION.md) for SQLite imports. The configured import owner retains access through their account. When an account already solely owns several legacy partitions, the oldest is used for personal access. Other partitions stay stored with their original keys, payments, audit events, and consent records. Historical membership grants do not provide shared browser access.

## Roles and machine access

- Signed-in accounts manage their own activity, routing settings, API keys, and test funding.
- Platform administrators manage tool allowances by account, review company ownership, run controlled diagnostics, and review the global payment dispute queue. Account activity uses the signed-in operator's own data.
- Tool company owners and analysts retain their independently verified company permissions and approved aggregate insights.
- Scoped machine keys remain attached to the original storage partition. Their route, tool, spend, expiry, and revocation restrictions continue to apply.

Platform roles come from the server UUID allowlist. User preview removes operator privileges and uses the administrator's existing personal data. Company preview uses an explicit company or integrated provider and retains the administrator as the audit actor.

## Account API

| Method | Route                 | Behavior                                                                                               |
| ------ | --------------------- | ------------------------------------------------------------------------------------------------------ |
| GET    | `/api/auth/config`    | Public Auth configuration                                                                              |
| GET    | `/api/auth/me`        | Signed-in identity, personal account availability, company memberships, and administrator capabilities |
| POST   | `/api/auth/companies` | Register a tool company for review                                                                     |
| GET    | `/api/account/usage`  | Personal tool usage                                                                                    |
| GET    | `/api/public/catalog` | Public provider availability and configured estimates                                                  |

Protected browser requests send the Supabase bearer token. The backend resolves personal data from that token. Writes require same-origin JSON. Existing published `/api/workspace/…` tool and account endpoints are accepted for compatibility.

Signed Stripe webhooks resolve the account partition from verified payment identifiers. The dispute queue spans accounts, and individual reviews resolve from the stored payment ID and record the verified administrator.

## Validation and deployment

Normal tests cover Auth-server verification and local compatibility. Disposable PostgreSQL tests cover ownership, role/path variants, membership/session revocation, scoped keys, multi-workspace signed webhooks, and admin attribution. Browser fixtures exercise SDK flows with synthetic Auth responses; they do not deliver email or validate hosted login.

Run only against a disposable fixture database:

```sh
OCTOLAB_TEST_POSTGRES_URL=postgresql://... npm test -- tests/accounts.test.ts tests/postgres.test.ts
```

These fixtures create a minimal synthetic Auth schema. Never point them at production Supabase.

## Account types

Every account is either a **business** (tool company, opens `#company`) or a **user** (opens `#dashboard`). The type is stored in `octolab.account_types` (migration `20261117130000_account_types.sql`). RLS is forced on that table, and no browser or runtime role has a grant on it.

- New accounts pick Business or User on the sign-in screen, or on a one-time chooser after their first sign-in. `POST /api/auth/account-type` saves it once; `/api/auth/me` returns `accountType`.
- A database trigger rejects every update, delete and truncate, so the type cannot change. To correct a mistake, an operator must run SQL by hand: `ALTER TABLE octolab.account_types DISABLE TRIGGER account_types_no_update_or_delete;`, fix the row, then `ENABLE` the trigger again.
- Personal routes (dashboard, credits and payments, API keys, MCP sessions) require a user account. Company, connector and seller routes, and company registration, require a business account. Analysts must have business accounts. Platform admins on `SUPABASE_ADMIN_USER_IDS` are exempt.
- The migration backfills existing accounts: company members become business, and other workspace owners become user.
- API keys are not affected by account types. Keys created earlier by an account that is now business keep working for MCP tool calls (a deliberate decision), even though that account can no longer open the user dashboard.
- Logged-out visitors to a signed-in area are sent to `/login`. `#signin` still works.
