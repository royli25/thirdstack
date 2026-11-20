# Stripe test deposits

This page covers the sandbox rail. Real-money top-ups use a separate flag, key, webhook secret and endpoint, described in [Stripe live mode](STRIPE_LIVE.md). The sandbox rail never accepts a live key or a live-mode object.

The Credits sidebar page (`#dashboard/credits`) supports Stripe-hosted card Checkout and USDC on Base Sepolia. Both are disabled by default. This implementation was left disabled on the development server: no Stripe account keys or receiving wallet were supplied, and no real payment or testnet transaction was performed.

One **test USD** or one **test USDC** adds one internal test credit. The balance uses integer millionths of a credit. With [wallet enforcement](WALLET_ENFORCEMENT.md) enabled, new verified Stripe test deposits for an enrolled account also fund its separate sandbox wallet. Otherwise these are development credits only; they do not increase backend session spending authority or pay live provider invoices. Test USD and test USDC are separately labeled in their payment receipts.

## Enable Stripe later

Install dependencies with `npm ci`, configure server-only environment variables, and restart:

```dotenv
STRIPE_TEST_ENABLED=true
STRIPE_SECRET_KEY=<Stripe sk_test_ or properly scoped rk_test_ key>
STRIPE_WEBHOOK_SECRET=<whsec_ signing secret for this endpoint>
PUBLIC_APP_URL=http://127.0.0.1:5173
```

Use test/sandbox credentials. Live keys and live-mode payment objects are refused. `PUBLIC_APP_URL` must be an HTTPS origin or an HTTP loopback origin, without credentials, paths, query parameters, or fragments. It controls return URLs; API callers cannot supply redirect URLs or arbitrary amounts/currencies to Stripe. A restricted key needs permission to create/retrieve Checkout Sessions, expand their PaymentIntent/latest Charge, and retrieve PaymentIntents directly for unmatched charge-event recovery.

For local testing, forward snapshot events to the backend using [Stripe CLI](https://docs.stripe.com/stripe-cli):

```sh
stripe listen --forward-to http://127.0.0.1:3001/api/webhooks/stripe
```

Use the listener's signing secret as `STRIPE_WEBHOOK_SECRET`. A registered endpoint must use publicly accessible HTTPS. Protect browser/API access with [Supabase Auth in PostgreSQL mode](AUTH.md), or a long `API_TOKEN` in SQLite/local mode. For Workbench snapshot destinations, match the API version used by the installed Stripe SDK (currently Stripe 23.1.0 / `2026-10-28.endive`). Thin notification payloads are not supported by this handler.

Subscribe to:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`
- `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
- `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`

Set `STRIPE_TEST_ENABLED=false` and restart to disable new checkouts. Keep test keys and webhook secret configured while outstanding payments/refunds/disputes still need reconciliation; existing signed webhooks and manual checks remain active when creation is disabled. Removing keys disables verification, retaining saved receipts and ledger entries.

## User flow

1. Open Credits and choose **Deposit with Stripe**.
2. Enter $5–$1,000 test USD, with up to two decimal places, then prepare Checkout.
3. Choose **Continue to Stripe**. The hosted checkout opens separately; card numbers never pass through octolab.
4. Use Stripe's documented sandbox payment methods. The signed webhook verifies the payment and updates the ledger even if the browser never returns.
5. Return to Credits or choose **Check payment status**. Checking retrieves current payment proof from Stripe; return URLs never prove payment. Manual checks are limited to once per deposit per ten seconds; signed webhooks bypass that UI cooldown.
6. Inspect the card receipt, on-chain receipts, and unified credit ledger. Refunds reduce net credits. A dispute holds all remaining credits from that payment for operator review.

See [Stripe's fulfillment guide](https://docs.stripe.com/checkout/fulfillment) and [signature verification requirements](https://docs.stripe.com/webhooks).

## Verification and recovery

Every Checkout request is recorded before contacting Stripe. Its amount and request UUID are immutable. Retries use the same Stripe idempotency key and exact parameters, including a fixed expiry. If a response is lost, retry the saved request instead of starting another checkout. The UI exposes recovery for requests without a saved session. Unknown outcomes older than 23 hours require operator reconciliation; a new Stripe request is never silently issued for the old intent after the idempotency retention window. Checkout expires 24 hours after the saved intent; the 23-hour retry cutoff leaves at least one hour before that fixed expiry, satisfying Stripe’s minimum creation window while keeping every retry parameter stable.

The server pins USD, one card payment, and the original amount. Before crediting it retrieves the saved Checkout Session with expanded PaymentIntent and latest Charge, then validates test mode, session ID, client reference, metadata, successful/paid/complete/captured states, exact amount, currency, and stable payment/charge identity. A checkout can finish before the create response returns: its signed session event can recover the matching saved intent.

Webhook verification uses the official SDK and original raw request bytes. Only the exact `/api/webhooks/stripe` POST route bypasses account/workspace credential checks; it requires a valid Stripe signature. In PostgreSQL mode, signature verification precedes workspace resolution from saved deposit/payment/session/charge/event identities. Conflicting ownership stops processing; caller-selected tenant headers cannot retarget payment proof. Creation and receipt/check routes require a workspace owner or platform administrator account, or the SQLite owner credential, with same-origin write protection. Failed retrieval or validation is not marked processed; Stripe can retry. Event IDs deduplicate delivery, unique payment IDs prevent cross-intent reuse, and concurrent reconciliation shares one in-process request. Webhooks always read current Stripe state, avoiding stale event snapshots overwriting newer receipts.

`funding_ledger` is append-only. Payment state, its audit event, and the credit delta commit atomically. Refund totals never decrease when older data appears. Dispute holds are sticky: closing a dispute does not automatically restore credits, even if the Charge later reports no dispute. The [admin dispute review queue](DISPUTE_REVIEW.md) supports triage, notes, and audited review decisions while retaining holds. For a payment that funds an account wallet, an administrator can [release the wallet freeze](STRIPE_LIVE.md#release-a-dispute-freeze) after Stripe closes the dispute and [refund unused credits](STRIPE_LIVE.md#refund-unused-credits); the test-credit ledger itself has no restore. There is no public restore or refund-issuance endpoint.

Existing `funding_credits` on-chain receipts are imported once into the unified ledger with stable source IDs and revision zero. Historical proof remains intact. Refunding a card payment affects only that payment's net credits. Funding tables remain outside provider/model statistics and commercial exports.

## API

| Method | Route                                       | Behavior                                                                                                                                                                                               |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/account/funding`                      | Both method statuses, public on-chain configuration, combined balance, per-method counts, latest 100 receipts per method, and latest 100 ledger entries. Never returns Stripe keys or RPC credentials. |
| POST   | `/api/account/funding/stripe`               | Create/recover `{requestKey, amount}`; amount is a decimal USD string.                                                                                                                                 |
| GET    | `/api/account/funding/stripe/:id`           | Read a saved card receipt.                                                                                                                                                                             |
| POST   | `/api/account/funding/stripe/:id/reconcile` | Verify current Stripe payment state; body `{}`.                                                                                                                                                        |
| POST   | `/api/webhooks/stripe`                      | Signed raw JSON snapshot events; no workspace bearer token.                                                                                                                                            |

Each workspace allows 1,000 saved Stripe intents. PostgreSQL uses authenticated workspace ownership; members and scoped keys cannot use funding controls. SQLite retains shared local authorization. External payment/event identities stay globally unique across workspaces. This remains a test-payment integration surface, not production customer financial accounting.

## Validation and production work

Unit tests cover exact cents, request replay, concurrent create/verification, lost responses, correlation/amount/mode mismatches, unpaid/expired checkout, raw signature integrity, webhook retries, refunds, disputes, restart persistence, migration, transaction rollback, cooldowns, creation disablement, and endpoint authentication. Desktop/mobile browser tests exercise disabled defaults, hosted-checkout handoff links, signed fixture webhooks, refund receipts, combined credits, return/cancel behavior, accessibility, and layout. Synthetic gateways exist only in the in-memory test process; no fixture payment route is loaded by production.

Actual Stripe sandbox validation remains unperformed until account credentials and a webhook listener are configured. No live charge was made. PostgreSQL account ownership and audit attribution are implemented but require hosted validation. Before real funds: production customer/payment ownership policy, a durable reconciliation queue and alerts, dispute resolution policy, financial accounting/spend enforcement, and an independent security review are required. The separate live-mode implementation is in [Stripe live mode](STRIPE_LIVE.md) and is off by default; the flags on this page cannot enable live billing or mainnet.
