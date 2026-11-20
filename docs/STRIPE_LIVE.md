# Stripe live mode (real-money top-ups)

Phase 3 of the [prepaid usage billing PRD](PRODUCTION_WALLET_PRD.md). With `STRIPE_LIVE_ENABLED=true`, an account that an operator has enrolled for live funding can pay real money through Stripe Checkout into its prepaid wallet. The flag is off by default, and with it off nothing in this document is reachable by a customer.

No live payment has been made with this code. It was validated with injected Stripe fixtures and a disposable local PostgreSQL only. Going live needs the owner steps in [Rollout](#rollout) and the open decisions at the end.

## How test and live are kept apart

Sandbox and live are two separate rails. Nothing is shared between them except the code.

|                  | Sandbox                                                   | Live                                                            |
| ---------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| Flag             | `STRIPE_TEST_ENABLED`                                     | `STRIPE_LIVE_ENABLED`                                           |
| Secret key       | `STRIPE_SECRET_KEY` (`sk_test_`/`rk_test_` only)          | `STRIPE_LIVE_SECRET_KEY` (`sk_live_`/`rk_live_` only)           |
| Webhook secret   | `STRIPE_WEBHOOK_SECRET`                                   | `STRIPE_LIVE_WEBHOOK_SECRET` (must differ from the test secret) |
| Webhook endpoint | `POST /api/webhooks/stripe`                               | `POST /api/webhooks/stripe/live`                                |
| Accepted objects | `livemode: false`, `cs_test_…`                            | `livemode: true`, `cs_live_…`                                   |
| Ledger           | Test-credit ledger, shadow wallet, sandbox wallet balance | Live wallet balance only                                        |

- **The endpoint picks the rail.** Each webhook endpoint verifies with its own signing secret and then refuses an event whose `livemode` does not match. A live event sent to the sandbox endpoint fails signature verification, and the reverse. The payload never chooses.
- **Every deposit records its mode.** `stripe_deposits.mode` is set when the checkout is requested and a trigger refuses any later change. A check constraint ties the Checkout Session ID prefix to the mode.
- **Every wallet row records its mode, and each mode has its own balance.** `wallet_deposits`, `wallet_holds`, `wallet_journal` and `wallet_balances` carry `mode`. Foreign keys force a deposit, refund or dispute posting into its deposit's mode and a usage debit into its hold's mode. A sandbox posting cannot land in the live balance whichever database role writes it.
- **An event may only touch a deposit of its own mode.** A signed live event that names a sandbox deposit (or the reverse) is ignored and logged.
- **Rows written before this release are sandbox rows.** The migration labels all existing deposits, holds, postings and balances `test`.

**Both rails can be enabled at once.** The hosted server keeps sandbox on for accounts that are not in the live pilot and for drills. What is exclusive is the account: `wallet_rates.funding_mode` (`test` by default, set by an operator) decides which balance pays for an account's calls and which rail its top-ups use. A live account is never sent to sandbox checkout, and if live is switched off it is refused rather than downgraded. A sandbox account can never start a live checkout. When an operator switches a sandbox pilot account to `live`, its live balance starts at zero; its sandbox credits stay in the sandbox balance, visible in history and not spendable.

A dispute freezes only the balance of its own mode.

## Live deposits

- **Eligibility.** A live checkout is created only when the live rail is configured, the account's rate row has `funding_mode='live'` and is current, and `TWO_HANDS_WALLET_ENFORCEMENT=true`. This follows the PRD rule that Checkout is shown only once the account can use a paid tool. The [operator allowance](WORKSPACE_ALLOWANCES.md) is still a separate required control.
- **Limits.** $5 minimum. The maximum per top-up is `STRIPE_LIVE_MAX_TOPUP_USD` (default 100, allowed 5–1000). An unreadable value falls back to $5, never to no cap.
- **One ledger.** A verified live payment posts to `wallet_journal` in live mode and nowhere else. It never reaches `funding_ledger` (test credits) or the shadow wallet. If a live payment cannot be attached to a wallet, reconciliation fails loudly and the webhook is not acknowledged, so Stripe retries and nothing is silently dropped.
- **Checkout.** The line item is "Two Hands service credits". No sandbox wording appears on a live Checkout page or receipt. Cards only, USD only. No tax is collected (see open decisions).
- **Receipts.** The Stripe-hosted receipt link of the verified charge is saved on the deposit and shown on Credits.

The sandbox rail is unchanged: a sandbox deposit for a sandbox-enrolled account still credits both the test-credit ledger and the sandbox wallet, as in the pilot. That double credit cannot happen with real money.

## Reconciliation

The live rail runs the same code path as the sandbox rail, so it has the same guarantees: signed events are only triggers, state is always re-read from Stripe, amount, currency, mode and identity must match the saved intent, event IDs deduplicate delivery, and the journal converges on the verified net amount.

| Event                                                                                                | Result                                                                                       |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `payment_intent.succeeded` | Credits the verified amount once                                                             |
| `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, `payment_intent.canceled`  | No credit                                                                                    |
| `checkout.session.expired`                                                                           | Marks the checkout expired, no credit                                                        |
| `charge.refunded`                                                                                    | Appends a negative `refund` posting for a partial or full refund                             |
| `charge.dispute.created`                                                                             | Appends a `dispute_hold` that removes the payment's remaining credits and freezes paid calls |
| `charge.dispute.closed`                                                                              | Re-verifies the payment. The freeze stays until an operator releases it                      |
| `refund.failed`                                                                                      | Reads the payment's refunds from Stripe and restores the failed refund's credits             |

**Refund totals.** A payment's refunded total follows Stripe's charge. It never drops because of an older read. It drops only when Stripe's list of refunds for the payment contains a failed or canceled refund and the refunds still standing add up to the charge's refunded total. The credits of the failed refund are then posted back once, whether the refund was issued in the Stripe dashboard or by an operator refund request, and the failed refund IDs are saved on the payment. If Stripe's total is lower and the list does not explain it, the saved total is kept and a `refund_total_unverified` [alert](#payment-alerts) is left for an operator.

**Disputes run in cycles.** One `dispute_hold` removes whatever a payment still holds, and one `dispute_release` ends that cycle. A Stripe charge reports `disputed` for good, so after a release the server no longer treats the payment as held: it converges on the payment's amount less Stripe's refunded total and less anything lost to a dispute. A refund Stripe reports after a release therefore still comes out of the restored credits. On each verification of a released payment the server lists its disputes at Stripe; a dispute that the release did not settle starts a new cycle, which posts a new hold and freezes the account again until an operator releases it again. An account is frozen while any payment in that mode has more holds than releases.

**Events that match nothing.** A signed live event that belongs to no saved deposit is acknowledged, logged, and recorded as an `unmatched_live_event` alert with its event ID and type. The same event in sandbox is ignored as before.

## Operator tooling

Both actions are on the admin **Payment disputes** page (`#disputes`) and under `/api/admin/funding`, which requires a platform administrator account. They run on the database owner connection under the account lock that call admission takes. The runtime role still cannot post a `dispute_release` or create a refund request. Each action writes an immutable `wallet_operator_actions` row with the administrator, a note and the Stripe evidence.

### Release a dispute freeze

`POST /api/admin/funding/disputes/:id/release` with `{requestKey, note}`. This replaces the hand-written `dispute_release` row.

1. The server re-verifies the payment and lists its disputes at Stripe.
2. If Stripe reports no dispute, or any dispute is still open (`needs_response`, `under_review`, `warning_needs_response`, `warning_under_review`), nothing is released (`409`).
3. Stripe's outcome decides the credits, not the operator. Every other status is final:
   - `won`, `warning_closed` and `prevented` leave the payment standing. Its amount less Stripe's refunded total is restored. A prevented dispute is settled by a refund, which the refunded total already contains.
   - `lost` is not restored.
   - A final status this code does not recognise is treated like `lost`: the hold is released, nothing is restored for that dispute, and the status is saved in the audit record. An operator who finds the payment did stand corrects it with an `adjustment`.
4. One `dispute_release` posting ends the cycle and lifts the freeze. A repeat with the same request key, including a concurrent duplicate, returns the saved result; a second release of the same cycle is refused.

After a release the payment shows its refund status again (credited, partially refunded or refunded) and keeps reconciling as described under [Reconciliation](#reconciliation). The test-credit ledger of a sandbox payment keeps its hold; only the wallet is released. A released payment cannot be refunded with the refund action below.

### Refund unused credits

`GET /api/admin/funding/refunds/:id` returns a quote. `POST /api/admin/funding/refunds/:id` with `{requestKey, amount, note}` refunds to the card that paid. `POST /api/admin/funding/refund-requests/:id/resolve` settles a request whose outcome is unknown.

1. The payment is re-verified with Stripe.
2. In one transaction, under the account lock, the server checks the refundable amount, records a `wallet_refund_requests` row and posts a negative `refund` entry. The credits are gone from the balance before Stripe is called.
3. Stripe is asked for the refund with an idempotency key derived from the request.
4. If Stripe refuses, the request is marked failed and reconciliation returns the credits. If Stripe's answer is lost, the amount stays reserved; **Check with Stripe** lists the payment's refunds and either confirms the refund, retries with the same idempotency key (within 23 hours), or releases the reservation.
5. While a request is reserved or submitted, payment checks and replayed events keep the amount out of the balance, so they cannot hand it back before Stripe reports the refund. When Stripe does report it, nothing is debited twice.
6. If Stripe accepts the refund and it fails later, `refund.failed` (or any later check while the request is in flight) closes the request and returns the credits without operator action.

One refund can be in flight per payment. Disputed payments and frozen accounts refund nothing. A duplicate request with the same key, including a concurrent one, returns the saved request.

**The refund policy is not decided.** Everything a decision would change is in `server/refund-policy.ts`:

- `unusedRefundsEnabled()` reads `TWO_HANDS_UNUSED_REFUNDS`, default off. With it off, quotes work and refunds are refused.
- `refundableByPayment()` is a placeholder. Only money that came from a card can go back to a card. The refundable amount is the smaller of the account's available credits and its card-funded credit not yet spent: net card payments minus every usage charge. Usage is counted against card money first, so credit added by an operator `adjustment` is never paid out, and a negative adjustment reduces what can be refunded. The amount is in whole cents and is attributed to the newest payments first. No fee is deducted and there is no time limit.
- `REFUND_TERMS` is the placeholder text shown to customers. It promises nothing.
- `REFUND_POLICY_VERSION` is saved on every request.

### Payment alerts

`wallet_operator_alerts` is the durable record of a payment condition the server could not settle by itself. The admin Payment disputes page lists open alerts; `GET /api/admin/funding/alerts` returns them and `POST /api/admin/funding/alerts/:id/resolve` with `{note}` records who handled one. Resolving changes no balance. There is one open alert per kind and reference.

| Kind                      | Raised when                                                                                                 | What to do                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `unmatched_live_event`    | A signed live event matched no saved deposit                                                                | Find the payment in Stripe by the event ID. If it is Two Hands money, credit or refund it by hand |
| `refund_total_unverified` | Stripe's refunded total is lower than the saved one and its refund list does not explain it                 | Compare the payment's refunds in Stripe. Correct the balance with an `adjustment` if needed       |
| `rate_unverified`         | A billable call was refused because the account's rate expired or no longer matches the provider credential | Re-verify the rate in `wallet_rates`. Customers are told nothing is needed from them              |

`GET /api/admin/funding/status` returns the configuration state of both rails, including why a rail is unavailable. Customers never see that reason: a live account is told only that top-ups are not available right now.

### Manual adjustments

Use **Balance adjustments** on the admin Payment disputes page (`POST /api/admin/funding/adjustments`, see [customer payment surface](WALLET_CUSTOMER_SURFACE.md#balance-adjustments)). The operator names the account and the mode, and the action is recorded in `wallet_operator_actions`.

The hand-written posting below still works and is the fallback if the admin page is unavailable. Every journal posting must name its mode, and the column has no default, so a posting that forgets the mode is refused instead of landing in the sandbox balance of a live account. Use the account's funding mode:

```sql
INSERT INTO octolab.wallet_journal (workspace_id, source_id, kind, reference, wallet_micros, mode)
VALUES ('<workspace id>', gen_random_uuid()::text, 'adjustment', '<reason and ticket>', <micros>, 'live');
```

Credit added this way is spendable on tool calls and is never refundable to a card.

## Credits page

For a live account, Credits (`#dashboard/credits`) shows only real-money information:

- **Available credits** in USD, with held and charged amounts.
- **Card via Stripe** with real-money wording, the top-up range, and the refund terms placeholder. No "sandbox only" or "test" wording.
- **Card payments** with each payment's status and its Stripe receipt link.
- **Credit activity**: the latest 100 wallet postings (top-ups, tool call charges, refunds, dispute holds, adjustments).

The test-credit balance, on-chain test deposits, their ledger and network details are hidden for a live account. A sandbox account sees the page as before. An old sandbox payment on a live account keeps its "test USD" label.

`GET /api/account/funding` adds `stripe.mode`, `wallet.mode`, `walletEntries` and `refundTerms`. Deposits add `mode`, `receiptUrl`, `pendingRefundCents` and `disputeResolution`.

## Schema

Migration `20261118120000_stripe_live_wallet.sql`. It adds columns, constraints and three tables, replaces the wallet projection functions, and drops two unique constraints. It deletes no rows.

- `stripe_deposits.mode`, with a session-prefix check and an immutability trigger.
- `wallet_rates.funding_mode`.
- `mode` on `wallet_deposits`, `wallet_holds`, `wallet_journal` and `wallet_balances`, with mode-carrying foreign keys. `wallet_balances` is now keyed by `(workspace_id, mode)`. `wallet_journal.mode` has no default.
- The one-hold and one-release-per-payment unique constraints on `wallet_journal` are dropped so a payment can be disputed again after a release. The application posts a hold only when the payment is not already held.
- `wallet_refund_requests` (runtime read-only), `wallet_operator_actions` (no runtime access) and `wallet_operator_alerts` (runtime insert for its own account only).

`walletValid` in backup evidence compares the projection per mode, and compares a payment released by the operator action against all of its postings. A hold released by hand before this release keeps its old check.

## Rollout

**Apply the migration before the release is deployed.** The server refuses to start when a checked-in migration is not installed, and Render redeploys the tip of `main` on any environment change. A plain Save in Render does not restart the service; use a manual deploy.

1. Stop the API, then apply `20261118120000_stripe_live_wallet.sql` with `npm run db:migrate` from the built image ([release checklist](RELEASE_CHECKLIST.md)). Migrations up to and including `20261117120000_wallet_enforcement.sql` and `20261117130000_account_types.sql` are already applied and must not be edited.
2. Merge and deploy with `STRIPE_LIVE_ENABLED=false` and `TWO_HANDS_UNUSED_REFUNDS=false`. Behaviour is unchanged: every existing row is a sandbox row and the pilot account keeps its sandbox balance.
3. Re-run the sandbox drill from [wallet enforcement](WALLET_ENFORCEMENT.md) once to confirm nothing regressed.
4. The owner activates the live Stripe account and creates a live webhook endpoint at `https://twohands.tech/api/webhooks/stripe/live`, subscribed to exactly these events:
   - `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
   - `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
   - `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`
   - `refund.failed`

   Use snapshot payloads and the API version of the installed SDK, as for the sandbox endpoint. Keep the existing sandbox endpoint.

5. The owner enters `STRIPE_LIVE_SECRET_KEY` and `STRIPE_LIVE_WEBHOOK_SECRET` in the Render dashboard. A restricted key needs: create and read Checkout Sessions, read PaymentIntents and Charges, read Disputes, and create and read Refunds. Leave `STRIPE_LIVE_ENABLED=false` for now.
6. Enroll the pilot account for live funding. This is an operator database step, as rate enrollment already is: set `funding_mode='live'` on its `wallet_rates` row, with a current verified rate. Its live balance starts at $0.
7. Set `STRIPE_LIVE_ENABLED=true` and deploy.
8. Run the live smoke drill below.
9. To pause new live top-ups, set `STRIPE_LIVE_ENABLED=false`. Keep the live key and webhook secret configured: refunds and disputes for existing payments keep reconciling. To pause paid calls, set `TWO_HANDS_WALLET_ENFORCEMENT=false`.

### Live smoke drill

Use the pilot account and the owner's own card. Total exposure is one $5 payment.

1. On Credits, confirm the page shows no sandbox wording, the refund terms placeholder, and **Add credits**.
2. Add $5. Pay on Stripe. Confirm the payment shows **Credited**, Available credits is $5.00, the Stripe receipt link opens, and the Stripe dashboard shows one live $5.00 payment with the deposit ID in its metadata.
3. Confirm the test-credit ledger did not change and the sandbox balance is unchanged (`wallet_balances` has separate `test` and `live` rows).
4. In Stripe, resend the `checkout.session.completed` event. Confirm the balance is still $5.00.
5. Make one Tavily basic search with a scoped key. Confirm Available credits is $4.9912 and Credit activity shows one tool call.
6. In the Stripe dashboard, refund $1.00. Confirm Available credits drops to $3.9912 and the payment shows **Partially refunded**.
7. Set `TWO_HANDS_UNUSED_REFUNDS=true`, deploy, and on **Payment disputes → Wallet payments and refunds** review the payment. Confirm the quote is $3.99. Refund $3.99. Confirm the request shows **Refunded**, Stripe shows $4.99 refunded in total, and Available credits is $0.0012.
8. Set `TWO_HANDS_UNUSED_REFUNDS=false` again unless the refund policy has been approved.
9. Check `db:backup` evidence reports `walletValid: true`.

A live dispute cannot be simulated. Drill the release action in sandbox with Stripe's dispute test cards before relying on it.

## Known gaps

- **Tax.** No tax is calculated or collected at Checkout.
- **Enrollment** (`wallet_rates`, including `funding_mode`) is still an operator database step with no admin screen. Adjustments have an admin action since [phase 4](WALLET_CUSTOMER_SURFACE.md).
- **A released payment cannot be refunded with the refund action.** Refund it in the Stripe dashboard; the balance follows.
- **Alerts are not pushed.** They are durable and listed on the admin page, but nothing pages an operator. There is no reconciliation queue beyond Stripe's own retries and the manual check.
- **Statement export** and wallet eligibility in discovery were added in [phase 4](WALLET_CUSTOMER_SURFACE.md). Quote expiry and `quote_changed` are not built.
- **Browser tests use a simulated live account.** They drive the real Credits and admin pages with the JSON a hosted live account would receive; no browser test runs against PostgreSQL accounts.

## Validation

`tests/stripe-live.test.ts` covers the default-off flag and its separate variables, fail-closed live configuration, the account funding mode choosing the rail with no fallback, the top-up cap and eligibility, a live payment crediting only the live wallet once, signature verification per endpoint with swapped secrets, cross-mode events and database constraints, async success and failure, expiry, partial and full refunds, dispute freeze per mode, dispute release by Stripe outcome with replay and audit, every final and open dispute status, a refund after a release, a second dispute after a release, a failed dashboard refund, an unverifiable refund total, an operator refund that fails after acceptance, refund reservation before the Stripe call, a refused refund, an unknown outcome resolved from Stripe, an idempotent retry, concurrent duplicate requests, the card-funded refund cap, an adjustment without a mode, unmatched live events, customer-safe unavailable copy, runtime-role restrictions, and the HTTP routes. PostgreSQL cases need a disposable loopback database in `OCTOLAB_TEST_POSTGRES_URL` and use injected provider and Stripe fixtures only. Never run them, fixture credits or test grants against the hosted project.

`tests/browser/stripe-live.spec.ts` covers the live Credits page, the paused state, and the operator alert, refund and release controls on desktop and mobile.

## Open owner decisions

1. **Refund policy for unused credits.** Whether refunds are offered, any fee or time limit, and the customer terms. Until then `TWO_HANDS_UNUSED_REFUNDS` stays off and Credits shows the placeholder.
2. **Tax handling.** Whether tax applies to service credits and how it is collected.
3. **Tavily's confirmation** that reselling through Two Hands is permitted. Real money should not pay for Tavily calls before this.
4. **Live Stripe account activation**, done by the owner.
5. **Pilot top-up cap.** The default is $100 per top-up; there is no cap on the total balance.
