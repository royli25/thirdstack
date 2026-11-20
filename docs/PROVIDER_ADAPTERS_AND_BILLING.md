# Provider integrations and billing

Connections shows each provider's integration version and local key setup. New requests record the integration version and, when configured, the provider account reference. Local setup checks never claim that a key has been accepted by a provider. No provider request runs when opening these pages.

## Recording a billing account

An owner can choose **Record account** in Connections and enter the account reference used on their provider's bills. This labels future requests; it does not verify ownership or relabel old requests. Changing the provider key clears that local association until the owner records it again. A reference managed by server configuration cannot be edited through this page.

Optional server-managed references are `EXA_ACCOUNT_REFERENCE`, `TAVILY_ACCOUNT_REFERENCE`, and `FIRECRAWL_ACCOUNT_REFERENCE`. These are account labels, never secret keys. Provider credentials remain server-side.

## Comparing bills with requests

In Usage, choose **Import records**. Download the CSV template and supply these four columns in order:

| Column     | Meaning                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| Record ID  | The line's stable identifier from the provider document.                  |
| Request ID | The provider's request reference, when available.                         |
| Amount     | The document amount in its selected currency. Leave unknown values blank. |
| Credits    | Reported credit units, when available.                                    |

Choose the provider, account reference, source document, currency and billing dates. Dates use UTC; **Through** includes that day. Imports support up to 1,000 records and the form accepts up to 20 KB of CSV. Quoted CSV fields are supported. Amounts support six decimal places.

Imports start awaiting review. Open an import to inspect matches, add a review note, and approve or reject it. Only approved USD invoice amounts with one exact request/account match contribute to reconciled charges. Imported documents are supplied by the operator; approval is a recorded review, not independent proof of an invoice.

Estimates, provider-response USD, credits, imported amounts, explicit credit conversions, reconciled charges and differences remain separate. Usage reports and credit conversions never become invoice charges. Missing values remain unknown, including old calls without a recorded account or provider request reference. Repeated records and ambiguous matches are excluded and explained. Multiple invoice lines in one import with the same provider request ID are duplicates even when their record IDs differ; none contributes to reconciled charges. Original controlled-run receipts can match; replay runs incur no new usage and are excluded.

Choose **Correct** to import a complete replacement for an earlier document. The earlier approved version remains in effect until its replacement is approved. Imports and decisions are retained, and reviewed match evidence survives cleanup of the original request history. Repeating an identical import does not count it twice.

The date selector limits the request dates used in the totals. Imports remain visible across periods. Private exports include only financial references, amounts and match information. They omit raw research inputs, provider outputs, explanations, review notes and credentials. No export is published automatically.

## Access and operational boundaries

Billing and setup are owner operations. Scoped agent keys and ordinary workspace members cannot access them. Signed-in owners use the existing account boundary; local legacy writes require the existing protected owner credential. No new migrations or provider dependencies are required. No payment balances, reservations or historical estimate amounts are changed by billing imports.

This increment supports manual invoice/usage imports. It does not fetch invoices from provider accounts, verify ownership, enable deposits, perform live provider checks, or create recurring jobs.

## Adding an internal integration

`server/provider-catalog.ts` is the single source of provider identity: provider ID, public tool name, label, logo, operation (`search` or `extract`), credential and account-reference environment variables, default price and pricing source. Server enums, workspace filters, the dashboard, billing, lab and company views derive their provider lists from it, and the database accepts any well-formed identifier, so a new provider needs no schema migration.

To add a provider:

1. Add a catalog entry in `server/provider-catalog.ts`.
2. Add its capability text in `server/provider-capability-data.ts`.
3. Implement its HTTP transport in `server/providers.ts` and add an adapter definition in `server/provider-adapters.ts`.
4. Add contract tests (see below) and an optional logo under `public/providers/`.

`server/provider-adapters.ts` contains the allowlisted adapter definitions. Each declares version, capabilities, request validation, credential reference, pricing, execution and normalized response validation. Public tool identifiers remain unchanged. Discovery, MCP registration, execution receipts and lab snapshots use these definitions. Stable production identifiers are derived in `server/provider-identifiers.ts`.

`AdapterRegistry` supports an isolated fixture registry for contract testing; production registration rejects fixture definitions. Executable definitions are code-owned. API callers cannot upload code or arbitrary endpoints. Add contract cases for unsupported inputs, missing/rotated credentials, timeouts, invalid responses, pricing, provenance and receipt replay before enabling another adapter.

## Validation

- `npm run check`
- `npx playwright test tests/browser/provider-billing.spec.ts tests/browser/tool-workspace.spec.ts tests/browser/provider-lab.spec.ts tests/browser/provider-workbench.spec.ts`
- `OCTOLAB_BILLING_TEST_POSTGRES_URL=<disposable local database> npx vitest run tests/provider-billing-postgres.test.ts`

All automated provider results in these tests are isolated fixtures. A live provider or real invoice check must be reported separately.
