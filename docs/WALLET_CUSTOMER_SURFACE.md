# Customer payment surface

Phase 4 of the [prepaid usage billing PRD](PRODUCTION_WALLET_PRD.md): what an account owner sees and can do about prepaid credits without an operator explaining it. It builds on [wallet enforcement](WALLET_ENFORCEMENT.md) and [Stripe live mode](STRIPE_LIVE.md) and changes no existing money rule: holds, charges, deposits, refunds and disputes post exactly as before.

It was validated with injected provider and Stripe fixtures and a disposable local PostgreSQL only. Nothing here has run against the hosted project.

## What the account owner sees

**One balance.** An account on credit billing (enrolled, or with any wallet activity) has one spendable balance: **Available credits**. Credits and the sidebar show that number, labelled `sandbox` for a sandbox account and in USD for a live one. The sidebar button reads **Add credits**.

The test-credit balance, the on-chain test deposit method, its history, the test-credit ledger and network details are not shown beside it. If the account has earlier test credits, one panel at the bottom of Credits, **Earlier test credits**, states the amount, says they do not pay for tool calls, and opens the old history on request. A live account does not see that panel at all, as in phase 3. An account that is not on credit billing sees Credits as before.

No ledger row was changed. A sandbox top-up for a sandbox account still credits both the test-credit ledger and the wallet, as in the pilot; only the page stopped showing the two numbers side by side. See [decisions](#decisions-made-on-the-owners-behalf).

**Tool call charges.** A table on Credits, newest first, for the last 7, 30, 90 or 365 days:

| Outcome     | Meaning                                                                     | Charged           |
| ----------- | --------------------------------------------------------------------------- | ----------------- |
| Charged     | The call returned a result. Provider cost, 10% markup and total are shown   | Cost plus 10%     |
| Not charged | The call failed, was interrupted, or its reported cost did not match        | $0, hold returned |
| In progress | The hold is open                                                            | Hold shown        |
| Refused     | Stopped before it ran: credits short, payment under review, or not billable | $0                |

Each call row has its call ID. Searching that ID on Activity finds the request. On **Activity → Requests**, a **Charged** column appears when a listed call was paid from credits, and the request detail shows outcome, provider cost, markup and total. The Activity CSV export gains `chargeOutcome` and `chargedMicros`.

**Statement.** A date range and **Download CSV** under the charges table. The file has an opening balance row, every posting in the range oldest first with a running balance, and a closing balance row. Amounts are integer USD micros as stored, with a dollar column. Sandbox statements say `sandbox credits (not real money)` on every row. The file holds no prompts, results, keys or payment secrets, and an operator's free-text adjustment note is replaced by the posting ID.

**Notices.** One line at the top of every dashboard page, only for an account whose calls are gated by credits:

- a card payment is under review and paid tools are paused;
- credits no longer cover a paid call, so paid calls are being refused;
- one paid tool is temporarily unavailable and nothing is needed from the owner;
- credits are low: fewer than 25 billable calls left.

The balance card also says how much a paid call needs and about how many calls the balance covers.

## Refusals

A refused paid call now says what happened, that nothing was charged, and what the account owner can do. The HTTP body keeps its shape and adds `ownerAction`:

```json
{
  "error": "This account has $0.0012 of credits available and a paid tool call needs $0.0088. Nothing was charged. The account owner can add credits on the Two Hands Credits page. Continue with free tools or the evidence already gathered.",
  "code": "insufficient_credits",
  "wallet": {
    "reason": "insufficient_balance",
    "requiredMicros": 8800,
    "availableMicros": 1200,
    "heldMicros": 0
  },
  "ownerAction": {
    "action": "add_credits",
    "message": "The account owner can add credits on the Two Hands Credits page."
  }
}
```

| Code and reason                                 | `ownerAction.action`      | What the owner is told                                     |
| ----------------------------------------------- | ------------------------- | ---------------------------------------------------------- |
| `insufficient_credits` / `insufficient_balance` | `add_credits`             | Add credits on Credits                                     |
| `insufficient_credits` / `dispute_hold`         | `wait_for_payment_review` | Paid tools resume when the payment review closes           |
| `billing_unavailable` / `rate_unverified`       | `none`                    | Nothing is needed; Two Hands has been notified             |
| `operator_allowance_exceeded`                   | `contact_support`         | Ask Two Hands to turn on, resume or raise paid tool access |

The text names no rate version, provider account, allowance limit or amount other than the account's own balance and the price of the call. The agent is still told to continue with free tools; the consumer in the host conversation is never asked to manage funding.

MCP hosts on the hosted endpoint see the same message with the owner guidance and the `[code]`. A stdio bridge to a remote server never repeats a remote body; for HTTP 402 it now gives a fixed sentence with the same guidance.

**Refusal log.** A refusal rolls back before a receipt exists, so `wallet_refusals` records it afterwards: account, mode, tool name, reason, the amount needed and available, and a per-minute counter, so a retrying agent raises a count instead of adding rows. It stores no request content and moves no money. A `rate_unverified` refusal also leaves a durable `rate_unverified` operator alert, so "Two Hands has been notified" is true.

**Discovery and routing.** `discover_tools`, the account preview, the catalog and `route_call` now account for the wallet:

- responses include `wallet`: `{enforced, mode, paidCallsAllowed, reason, requiredMicros, availableMicros, billable}`, where `billable` is the one priced configuration with `providerCostMicros`, `markupBps`, `customerPriceMicros`, `rateVersion` and `expiresAt`;
- while credits would refuse a paid call, paid candidates are marked `disabled` with a reason an agent can relay, their estimates carry `walletAllowed:false`, and routing skips them, so an agent is steered to free tools instead of into a certain refusal;
- catalog entries carry `walletAllowed`.

This is a snapshot, like `operatorAllowed`. Admission still decides under the account lock. The balance figure is returned to the caller and is not written into the recorded `tools_offered` event.

## Top-ups the account cannot spend

While `TWO_HANDS_WALLET_ENFORCEMENT=true`, a new top-up is offered and accepted only if the account could spend the credits:

| `stripe.blocked`      | Condition                         |
| --------------------- | --------------------------------- |
| `not_enrolled`        | No `wallet_rates` row             |
| `billing_unavailable` | Enrolled, but the rate has lapsed |
| `tool_access_pending` | Enrolled, no operator allowance   |
| `tool_access_paused`  | Allowance paused                  |
| `tool_access_used`    | Allowance exhausted               |

`GET /api/account/funding` then returns `stripe.enabled:false` with a plain explanation in `unavailableReason`, the button is disabled, and Credits shows **Why you can't add credits yet**. `POST /api/account/funding/stripe` refuses with 409 and "No payment was started", so the gate does not depend on the page. A checkout that already exists can still be completed and reconciled. Existing credits are never touched.

With enforcement off, and on local SQLite, sandbox top-ups stay open to everyone as a test of the payment flow. On the hosted server, where enforcement is on, this means only enrolled accounts with tool access can make a sandbox card top-up. On-chain test deposits are unchanged.

## Balance adjustments

**Balance adjustments** on the admin Payment disputes page, or `POST /api/admin/funding/adjustments` with `{requestKey, accountId, mode, amount, note}`. `GET /api/admin/funding/adjustments?q=` lists enrolled accounts with their balances per mode and the latest 50 adjustments.

- **Mode is explicit.** `mode` is required and nothing defaults. The page preselects neither sandbox nor live and states which balance pays for the account's calls.
- **Checks.** The account must be enrolled. The mode must be its funding mode, or a mode it already has a balance in (for example the sandbox credits of an account now funded live). `amount` is USD with up to six decimals, negative to remove credits, not zero, at most $100 either way. A removal cannot take available credits below zero.
- **Audit.** The `adjustment` journal row and an immutable `wallet_operator_actions` row (administrator, note, amount, balance before) commit in one transaction on the database owner connection, under the account lock that admission takes. The runtime role still cannot post an adjustment or read the audit table.
- **Idempotent.** The same `requestKey` returns the saved adjustment, including a concurrent duplicate. The same key with different content is refused.

Adjustment credit pays for tool calls and is never refunded to a card. The customer sees "Adjustment by Two Hands" in Credit activity and on the statement.

Operator alerts were already listed on that page (phase 3). It now also labels the new `rate_unverified` alert.

## API

| Method | Route                                                                           | Access        |
| ------ | ------------------------------------------------------------------------------- | ------------- |
| GET    | `/api/account/funding/activity?days=7\|30\|90\|365&page=`                       | User account  |
| GET    | `/api/account/funding/statement?from=YYYY-MM-DD&to=YYYY-MM-DD&format=csv\|json` | User account  |
| GET    | `/api/admin/funding/adjustments?q=`                                             | Administrator |
| POST   | `/api/admin/funding/adjustments`                                                | Administrator |

A statement range is whole UTC days, 1 to 366 days, at most 10,000 lines (413 beyond that). Both customer routes run in a read-only transaction as the runtime role. Scoped API keys cannot call them. `GET /api/account/funding` adds `stripe.blocked` and, on `wallet`, `enrolled`, `billingAvailable`, `callHoldMicros`, `callsRemaining` and `lowBalance`.

**Account types.** These are personal Credits routes, so they sit behind the same check as `/api/account/funding`: a business account gets 403 `wrong_account_type`, and the business dashboard has no Credits entry. The admin routes need a platform administrator. See [account types](AUTH.md#account-types).

## Schema

Migration `20261119120000_wallet_customer_surface.sql`. It adds one table and loosens one constraint. It changes and deletes no row.

- `wallet_refusals`: the refusal log. Row-level security scoped to the account. The runtime role can read and insert its own rows and update only the counter columns of a row.
- `wallet_operator_actions`: `kind` also accepts `adjustment`, and `deposit_id` may be null for that kind only (`wallet_operator_actions_subject`).

The runtime role's rights on `wallet_journal`, `wallet_balances`, `wallet_rates` and `wallet_refund_requests` are unchanged.

## Rollout

**Apply the migration before this release is deployed.** The server refuses to start when a checked-in migration is not installed, and Render redeploys the tip of `main` on any environment change. Every migration through `20261118120000_stripe_live_wallet.sql` is applied on hosted and must not be edited.

1. Apply `20261119120000_wallet_customer_surface.sql` with `npm run db:migrate` from the built image ([release checklist](RELEASE_CHECKLIST.md)).
2. Merge and deploy. There is no new flag and no new environment variable.
3. Check the pilot account on Credits: one balance with `sandbox`, its tool call charges, a statement download for this month whose closing balance equals Available credits plus held credits, and **Earlier test credits** showing the old test balance.
4. Check an account that is not enrolled: the card top-up is disabled with the explanation, and nothing else changed.
5. On Payment disputes, check that Balance adjustments lists the pilot account. Do not post a test adjustment to a live balance.

To back out, redeploy the previous release. The migration can stay: the earlier code ignores the new table and never writes an `adjustment` action.

**Effect on hosted at deploy.** Hosted runs with enforcement on, so the top-up gate takes effect immediately: accounts that are not enrolled can no longer start a sandbox card top-up. If that is not wanted yet, hold this release.

## Where this differs from the PRD

The PRD's phase 4 row is "Expand: more endpoints and accounts, plus a documented migration path from operator-only access". This release is the customer surface the PRD describes under Customer experience, which the earlier phases left out. Against that text:

- **Quotes.** `wallet` in discovery gives the exact price, rate version and expiry of the one billable configuration and eligibility. There is no quote reference, no binding of a quote to a call, and no `quote_changed` response. With one fixed-price configuration a price can only change when an operator replaces the rate.
- **Receipt link.** Credits links to Activity by call ID search, not a direct link to one receipt.
- **Tax** is not shown at top-up because none is collected (open decision).
- **Onboarding.** The PRD says to provision the allowance during onboarding so a top-up unlocks calls. This release does not provision anything. It stops the top-up until an operator has done both steps. The proposal is below.
- **Spend per key** in the API keys list still shows estimates, not posted charges.
- **More endpoints and accounts** are not added. Only Tavily basic search with 10 results is billable.

## Decisions made on the owner's behalf

1. **The test-credit balance is demoted, not removed, and the sandbox double credit continues.** New sandbox top-ups still post to both ledgers. Stopping that would change sandbox money handling and the dispute review screen, which reads the test-credit ledger.
2. **The top-up gate has no flag of its own.** It follows `TWO_HANDS_WALLET_ENFORCEMENT`.
3. **Low balance means fewer than 25 billable calls left** (`LOW_BALANCE_CALLS`), about $0.22 at the pilot price.
4. **One adjustment is capped at $100 either way**, the same as the default top-up cap, and cannot make a balance negative.
5. **An adjustment may target an older balance** of the account, not only its funding mode, so sandbox credits of a live account can still be corrected.
6. **Refusals are kept as counters per minute**, with the tool name and amounts, indefinitely. There is no retention job for `wallet_refusals`.
7. **The customer sees the rate version** in discovery (`billable.rateVersion`), as the PRD asks. It is an opaque label chosen by the operator.
8. **A `rate_unverified` refusal raises an operator alert.** Before, it was a log line only.
9. **Statements cover the balance of the account's current funding mode.** An account switched to live cannot export its old sandbox statement from the page.

## Open owner decisions

Carried over, unchanged: the refund policy, tax handling, Tavily's confirmation on resale, live Stripe activation, and the pilot top-up cap.

New:

1. **How enrollment and tool access are granted to new accounts.** See the proposal below. Nothing was built.
2. **Whether failed provider calls should keep consuming the operator allowance.** Today a failed or interrupted call consumes its estimate from the lifetime allowance and charges the wallet nothing. The allowance exists to cap Two Hands' upstream exposure, and a failed call may still have cost Two Hands money, so that is defensible as a risk control. But once the wallet is the spending control, a customer with credits can be stopped by an allowance that failed calls used up, and the only remedy is to ask an operator. Options: keep it; stop counting calls that failed before any provider response; or replace the lifetime cap with a rolling exposure limit. This release changes nothing here.
3. **Whether sandbox top-ups should stop crediting the test-credit ledger** for accounts on credit billing (decision 1).
4. **Whether unenrolled accounts should lose sandbox card top-ups now** (the gate), or only once self-service enrollment exists.
5. **Who may post adjustments to a live balance**, and whether a second administrator must approve one. Today any platform administrator can, up to $100 per action.
6. **How long refusal records are kept.**

## Proposal: enrollment for new accounts

Not built. Enrollment today is two operator steps: a `wallet_rates` row (a verified provider cost bound to the provider account and a digest of the server's credential) and a Tool access allowance.

The rate is the same for every account that uses the same Two Hands provider credential, so it does not need to be verified per account. Proposed, behind a default-off flag such as `TWO_HANDS_SELF_SERVE_ENROLLMENT`:

1. **One platform rate.** An operator records the verified rate once, in a platform table, with its expiry. Re-verifying it after a key rotation fixes every account at once.
2. **An admin action "Turn on paid tools"** on Tool access that enrolls an account against the platform rate in sandbox or live mode and grants a starting allowance in one audited step. This removes the hand-written SQL without removing the operator's decision.
3. **Later, automatic enrollment** of a new `user` account in sandbox mode with a small starting allowance, once the owner has decided the allowance question above and the risk limit per account. Live mode stays an explicit operator decision per account.

Step 2 is the smallest useful change and needs no owner decision beyond agreeing to it.

## Validation

`tests/wallet-surface.test.ts` covers refusal wording and what it must not contain, MCP text for local and remote servers, the statement file, per-call activity for charged, failed and refused calls, the refusal counter, the durable rate alert, owner guidance on HTTP refusals, discovery and routing eligibility, calls remaining and the low-balance flag, the top-up gate in each state and with enforcement off, statement balances and range validation, runtime-role restrictions, neighbouring-account isolation, adjustments with replay, concurrency, refusals and separate modes, and the admin routes. `tests/account-types.test.ts` covers the new routes for business accounts. PostgreSQL cases need a disposable loopback database in `OCTOLAB_TEST_POSTGRES_URL`. Never run them against the hosted project.

`tests/browser/wallet-surface.spec.ts` covers Credits for an account on credit billing, the blocked top-up, the three notices, the Activity charge column and detail, and the adjustment form, on desktop and mobile. The fixture server is SQLite, so these tests supply the JSON a hosted account would receive.
