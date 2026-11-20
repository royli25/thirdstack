# Admin payment dispute review

The operator sidebar has **Payment disputes** at `#disputes`. It provides a review queue for Stripe test payments whose saved, server-verified Charge has been observed as disputed. The queue automatically includes existing disputed payment receipts, including those created before this feature.

The review workflow records investigation status and notes while retaining credit holds. It does not submit evidence to Stripe or change a bank dispute outcome. **Reviewed · hold retained** means the local investigation was reviewed; it does not mean the Stripe dispute was resolved or won.

In hosted PostgreSQL mode the same page has two operator money actions for payments that fund an account wallet, sandbox or live: **Release dispute hold**, which works only after Stripe has closed the dispute and restores credits according to Stripe's outcome, and **Wallet payments and refunds**, which refunds unused credits to the original card. Both are described in [Stripe live mode](STRIPE_LIVE.md#operator-tooling). They are not available with the SQLite admin credential.

## Enable admin access

In PostgreSQL [account mode](AUTH.md), set `SUPABASE_ADMIN_USER_IDS` to the intended platform administrator UUIDs and restart. Sign in and select the workspace to review. The server checks the live Auth session and allowlist on each request and records the authenticated account UUID; owners and members do not gain dispute access. `ADMIN_API_TOKEN` does not authenticate this mode.

For SQLite/local mode only, configure a separate server credential and restart:

```dotenv
ADMIN_API_TOKEN=<a strong random admin-only credential>
```

The credential must be nonempty and different from `API_TOKEN`. Blank or identical credentials disable the admin funding API. The workspace bearer token cannot access admin funding routes, and the admin credential alone cannot access workspace routes when `API_TOKEN` is configured. Use HTTPS for remote access. Do not paste credentials into review notes or URLs.

In SQLite/local mode, open Payment disputes and enter the admin credential. It stays in React memory while the page is mounted; it is not written to local/session storage or URLs. **Lock admin access**, leaving the page, or a rejected/disabled credential clears the open review and drafts. Delayed responses from an older login cannot reopen or lock a newer login.

Both deposit methods remain independently disabled until configured. Admin review can read historical disputes without enabling new deposits or provider spending. **Verify Stripe status** additionally requires the Stripe test verification credentials described in [Stripe setup](STRIPE_DEPOSITS.md); it uses the existing per-payment manual-check cooldown.

## Review workflow

1. Filter by Needs review, In review, or Reviewed; search receipt, payment/charge ID, or the latest note.
2. Open a payment to inspect its saved amount, refund total, net credits, provider verification time, payment and charge IDs, prior review, and audit history.
3. Refresh saved evidence, or explicitly verify the current payment state with Stripe.
4. Choose a local review status and enter a 10–4,000 character note describing the evidence checked and decision.
5. Save the review. The payment's credit hold remains unchanged. History records the previous/new status, note, evidence snapshot, server time, revision, and the account UUID in PostgreSQL mode or a server-derived admin-credential identifier in SQLite mode.

SQLite credential identifiers identify the shared credential used, not a verified individual. PostgreSQL account attribution identifies the authenticated account, without independently verifying who operated it or the truth of a review note.

Every save includes the current revision and a fingerprint of material payment evidence. If another admin saves first or the amount/payment identity/refund/dispute/credit state changes, a stale save returns `409`. Refresh the case before saving; the UI preserves the draft note. A later material evidence change reopens a reviewed case as Needs review. Merely refreshing a verification timestamp does not reopen it. Previous decisions remain in history.

Review saves use UUID idempotency keys. Retrying unchanged details after a lost response adds no duplicate decision. Reusing a key with different content or a different server-derived actor returns `409`. The review and its immutable audit evidence commit in one database transaction. Saving a local review does not change the financial ledger or underlying Stripe receipt. **Verify Stripe status** can update the saved receipt and ledger under the existing refund and dispute rules; it never releases a dispute hold.

## API

In PostgreSQL mode, all routes below require `Authorization: Bearer <account access token>` and a platform administrator UUID allowlisted server-side. The queue spans accounts. Individual reviews resolve from the stored payment ID. SQLite requires `Authorization: Bearer <ADMIN_API_TOKEN>`. Mutating routes require JSON and enforce same-origin writes. The admin router authenticates before the personal account middleware. Unknown routes inside this prefix remain behind admin authentication.

| Method | Route                                              | Behavior                                                                                                                |
| ------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/admin/funding/disputes?status=all&q=&page=1` | Filtered queue, 25 cases per page, total matches, and global review-status counts.                                      |
| GET    | `/api/admin/funding/disputes/:id`                  | Current saved payment, local review, evidence fingerprint, and latest 100 immutable review events.                      |
| POST   | `/api/admin/funding/disputes/:id/review`           | Save `{requestKey, revision, evidenceFingerprint, status, note}`. Status is `needs_review`, `in_review`, or `reviewed`. |
| POST   | `/api/admin/funding/disputes/:id/recheck`          | Verify the saved payment with Stripe, then return current review detail; body `{}`.                                     |
| POST   | `/api/admin/funding/disputes/:id/release`          | Release the wallet freeze after Stripe closed the dispute. `{requestKey, note}`.                                        |
| GET    | `/api/admin/funding/payments?q=`                   | Latest 50 wallet payments across accounts.                                                                              |
| GET    | `/api/admin/funding/refunds/:id`                   | Refund quote and refund requests for one payment.                                                                       |
| POST   | `/api/admin/funding/refunds/:id`                   | Refund unused credits to the card. `{requestKey, amount, note}`. Refused unless `TWO_HANDS_UNUSED_REFUNDS=true`.        |
| POST   | `/api/admin/funding/refund-requests/:id/resolve`   | Settle a refund whose outcome is unknown by asking Stripe; body `{}`.                                                   |
| GET    | `/api/admin/funding/alerts`                        | Open payment alerts across accounts.                                                                                    |
| POST   | `/api/admin/funding/alerts/:id/resolve`            | Record who handled an alert. `{note}`. Changes no balance.                                                              |
| GET    | `/api/admin/funding/status`                        | Configuration state of the sandbox and live rails, for operators only.                                                  |

The queue is one case per disputed payment, not an inventory of individual Stripe dispute objects. Bank-dispute reason codes, response deadlines, document uploads, evidence submission, and credit restoration are not implemented in this checkpoint. Inspect Stripe directly for those operations. Notes and audit evidence are stored in funding-only tables and excluded from provider/model statistics and commercial observation exports.

## Event ordering and tests

A refund/dispute event can arrive before Checkout completion has populated saved charge/payment IDs. For unmatched charge events with a PaymentIntent ID, the server retrieves that test PaymentIntent and uses its own deposit metadata to locate a candidate. It then performs the existing full saved Checkout/payment/capture validation before changing credits. Metadata alone cannot authorize a credit. Retrieval failures are not acknowledged as processed, allowing Stripe to retry.

Unit coverage includes historical queue discovery, exact admin/workspace credential separation, fail-closed configuration, origin/schema checks, atomic notes/audit rollback, immutable evidence, stale review/evidence conflicts, idempotent replay, meaningful-evidence reopening, and retained credit holds. Browser coverage exercises desktop/mobile review flows, conflict recovery, locking, disabled defaults, rejected credentials, and old-response isolation. Payment evidence and webhook deliveries in tests are isolated fixtures; no actual payment or transfer was made.
