# Wallet enforcement

Phase 2 of the [prepaid usage billing PRD](PRODUCTION_WALLET_PRD.md). With `TWO_HANDS_WALLET_ENFORCEMENT=true`, an enrolled account's prepaid service-credit balance gates and pays for eligible hosted paid tool calls. The flag is off by default, and with it off admission is unchanged.

An account is funded in one Stripe mode, chosen by an operator in `wallet_rates.funding_mode`. The default, `test`, is the sandbox described here: Stripe test-mode credits and no real money. `live` is real money and is covered in [Stripe live mode](STRIPE_LIVE.md). Each mode has its own balance, holds and journal postings, and a call is admitted, held and charged against the balance of the account's funding mode only. Everything below applies to both modes unless it says sandbox.

## What is enforced

- **Enrollment.** An operator enrolls an account by recording a verified rate in `octolab.wallet_rates`. The rate binds the provider account reference and a credential digest: SHA-256 over `two-hands-wallet-tavily-v1`, a NUL byte, and the exact credential, computed inside the secret-handling environment. Never export the credential or its digest. The runtime cannot enroll an account, set a rate, or post credit adjustments. Accounts without a rate row are untouched by the wallet.
- **Billable configuration.** Only Tavily basic search with 10 maximum results on adapter version 1.0.0 is held and charged.
- **Fail closed on a lapsed rate.** If an enrolled account's rate has expired, or no longer matches the provider account or credential (for example after a key rotation), a call in the billable configuration is refused before dispatch with `409` and `code:"billing_unavailable"` (`wallet.reason:"rate_unverified"`), and the server logs an operator alert naming the rate version. It is never run uncharged. An operator re-verifies the rate to restore it.
- **Other paid tools.** Advanced or non-default searches, other providers and paid connector tools are never held or charged. They are refused with `insufficient_credits` while the enrolled account could not cover the rated hold or has an unresolved dispute, so an empty wallet cannot be worked around with an unrated variant. Otherwise they run under the operator allowance, key caps and session caps as before. Free tools are never refused by the wallet.
- **Separate controls.** A call still needs the [operator allowance](WORKSPACE_ALLOWANCES.md), its key cap and its session budget. A top-up never grants or raises an allowance; an operator provisions the allowance at onboarding. A denial by any control reserves nothing in the others.
- **Entry points.** Direct calls and routed attempts on the canonical observation path pass through wallet admission, for scoped keys and signed-in sessions alike. Legacy tasks, the provider lab, SQLite and demo traffic keep their existing operator-funded accounting and never touch the wallet.

## Call lifecycle

1. **Reserve.** In the workspace transaction that writes the call receipt, the server freezes the rate, locks the account's balance row, and inserts a hold of the provider cost × 110% rounded up to the next USD micro. Available credits are posted balance minus open holds. All keys and sessions of an account serialize on the workspace lock, so concurrent calls cannot reserve beyond one balance.
2. **Deny.** If available credits are below the hold, or a payment dispute is unresolved, the transaction rolls back before any provider I/O. HTTP callers receive `402` with `{error, code:"insufficient_credits", wallet:{reason, requiredMicros, availableMicros, heldMicros}}`, where `reason` is `insufficient_balance` or `dispute_hold`. The body also carries `ownerAction:{action,message}`: what the account owner can do. MCP hosts see the message, which includes that guidance, with the `[insufficient_credits]` code. Each refusal is logged for the owner in `wallet_refusals` after the rollback (see [customer payment surface](WALLET_CUSTOMER_SURFACE.md#refusals)). The `billing_unavailable` refusal for a lapsed rate has the same shape. Agents can continue with free tools; consumers are never asked to manage funding.
3. **Settle.** The saved result, hold closure and debit commit in one transaction. A succeeded call posts one debit of the frozen cost plus 10% (markup rounded to the nearest micro, ties up) and releases the remainder. A valid zero-result response is billable. A verified cost of zero posts a zero charge.
4. **Release.** A failed call, an interrupted call settled by startup recovery, or a response whose reported credit quantity contradicts the frozen rate (`cost_conflict`) closes the hold and charges zero. A hold admitted before the flag or rate was turned off still settles.
5. **Replay.** The same request key returns the saved call without another hold, dispatch or debit. A changed payload under the same key is rejected. The journal's primary key allows one usage posting per call.

## Funding

A Stripe sandbox checkout intent created while the flag is on, for an account with an active rate, is enrolled in `wallet_deposits` in the transaction that saves the intent. A checkout prepared earlier is enrolled when its payment is verified for the first time while the flag is on and the rate is active, so money paid under enforcement always funds the wallet and its dispute always freezes it. A payment that was already verified before enrollment is never backfilled, even if its events replay or it is checked again, and the existing test-credit balance and ledger keep their own behavior. After the existing test-mode payment verification, the wallet converges on the deposit's verified net amount: webhook retries post once, refunds append negative entries, and a dispute appends a `dispute_hold` that removes the payment's remaining credits and freezes paid admission. If a reversal exceeds unused credits the posted balance goes negative, which also blocks admission. Only an operator can lift a dispute freeze, with the [release action](STRIPE_LIVE.md#release-a-dispute-freeze) on the admin Payment disputes page, after Stripe has closed the dispute. A dispute freezes only the balance of its own mode.

## Tables

All are private to the `octolab` schema, row-level-security scoped to the workspace, and independent of research retention.

| Table                     | Purpose                                                                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wallet_rates`            | Operator-verified rate, enrollment and `funding_mode`. Runtime read-only.                                                                                                                                            |
| `wallet_holds`            | One immutable hold per admitted call with the frozen rate, cost, markup and maximum.                                                                                                                                 |
| `wallet_hold_closures`    | One explicit outcome per hold: `posted`, `failed`, `interrupted` or `cost_conflict`.                                                                                                                                 |
| `wallet_deposits`         | Deposits enrolled at checkout creation or first verification.                                                                                                                                                        |
| `wallet_journal`          | Append-only postings: `deposit`, `refund`, `dispute_hold`, `usage`, and operator-only `dispute_release` and `adjustment`. Every posting names its mode; see [manual adjustments](STRIPE_LIVE.md#manual-adjustments). |
| `wallet_balances`         | Projection of posted, held and charged micros, one row per account and mode. Runtime read-only; written only by triggers in the same transaction as each posting.                                                    |
| `wallet_refund_requests`  | Operator refunds of unused credit and their state. Runtime read-only.                                                                                                                                                |
| `wallet_operator_actions` | Immutable record of dispute releases and refund actions with the administrator. No runtime access.                                                                                                                   |
| `wallet_operator_alerts`  | Durable record of payment conditions that need an operator. Runtime can raise one for its own account; only the admin API reads and resolves them.                                                                   |

Each journal row carries both sides of the posting (`wallet_micros` and the opposite `clearing_micros`). Foreign keys tie a usage posting to a `posted` closure and to the hold's exact total, so an altered amount or a debit without a billable result cannot be stored. The runtime role can insert but not update or delete journal rows, and cannot write `wallet_balances` at all: the projection that admission reads changes only through owner-run trigger functions fired by a journal, hold or closure insert. Those functions read `wallet_holds`, so the migration owner must be exempt from row-level security (a superuser or a `BYPASSRLS` role, as on the hosted project); otherwise a closure fails loudly instead of drifting.

`SELECT octolab.wallet_rebuild_balances()` rebuilds every projection row from the journal and open holds; it changes nothing when the projection is already correct. Backup evidence reports `walletValid`, which fails when a posted closure lacks its debit, a finished call still has an open hold, an enrolled deposit's journal differs from its verified net credits, or the projection differs from a rebuild.

## Rollout

**Apply the migration before this release is deployed.** At startup the server refuses to serve when a checked-in migration is not installed, so a deploy that reaches the hosted service first will not boot. Render redeploys the tip of `main` on any environment change, so the order is: apply the migration, then merge.

1. Apply migration `20261117120000_wallet_enforcement.sql` with the existing release procedure. It only adds tables, functions and policies.
2. Merge and deploy with `TWO_HANDS_WALLET_ENFORCEMENT=false`. With the flag off no call is held or charged and no deposit is enrolled.
3. Provision the pilot account's operator allowance and record its verified rate in `wallet_rates`.
4. Enable the flag, make a new Stripe sandbox top-up, and run the drill: successful call, provider failure, replay, partial refund and dispute.
5. To pause, set the flag to `false`. New calls stop being held or charged; open holds, refunds and disputes for enrolled deposits continue to reconcile.

Wallet code paths that also run with the flag off (deposit reconciliation, the Credits summary, startup recovery) check that the wallet tables exist and do nothing when they do not. That protects tooling that skips the startup check; it does not make deploy-before-migrate a supported order.

Credits (`#dashboard/credits`) shows **Available credits**, **Held for in-progress calls** and **Charged for tool calls** from the `wallet` object on `GET /api/account/funding`, for an enforced account and for any account that has wallet activity. While the flag is off or the rate has lapsed the balance stays visible with a note that credit billing is paused. The summary is two single-row reads and is safe to poll.

## Not in this phase

A bounded recovery window for unresolved holds beyond startup recovery, and an operator interface for enrollment. Live-mode Stripe, dispute release and unused-balance refunds were added in [phase 3](STRIPE_LIVE.md). Per-call charges, statement export, wallet eligibility in discovery, clearer refusals, the top-up gate and the adjustment action were added in [phase 4](WALLET_CUSTOMER_SURFACE.md).

## Validation

`tests/wallet.test.ts` covers the default-off flag, the structured denial before dispatch, hold and single debit with replay after a lost response, concurrent holds from two keys against one balance, in-flight holds, failure and interruption release, zero-cost and sub-cent rounding, verified deposit, refund and dispute, the separate operator allowance, unrated paid calls refused while credits are short, fail-closed lapsed and rotated rates, neighbouring-account isolation, runtime posting and projection restrictions, enrollment at first verification, malformed reported quantities, a schema without the wallet tables, and projection rebuild. PostgreSQL cases need a disposable loopback database in `OCTOLAB_TEST_POSTGRES_URL` and use injected provider and Stripe fixtures only. Never run them, fixture credits or test grants against the hosted project.
