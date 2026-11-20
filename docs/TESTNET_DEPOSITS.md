# Base Sepolia test deposits

The Credits page at `#dashboard/credits` supports a development-only USDC deposit flow on Base Sepolia alongside [Stripe test deposits](STRIPE_DEPOSITS.md). Both methods share one test-credit balance with separate payment receipts. On-chain deposits are disabled by default and were deliberately left disabled on the local development server at the user's request. No receiving wallet was configured and no real or testnet transfer was sent during implementation.

## Enable later

Configure these server environment variables, then restart the backend:

```dotenv
DEPOSITS_TESTNET_ENABLED=true
BASE_SEPOLIA_DEPOSIT_ADDRESS=<public EVM address you control>
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

Use only a public receiving address. The server does not require or accept a private key. RPC credentials, if used in a dedicated endpoint URL, stay server-side. The public RPC can be rate limited; configure a suitable dedicated RPC for sustained testing.

Set `DEPOSITS_TESTNET_ENABLED=false` and restart to disable creation and verification. Historical requests and test balances remain readable. Existing credited receipts replay without another network request.

## User flow

1. Open Credits and choose Add test credits.
2. Enter 1–1,000 test USDC, with up to six decimal places, and the public sending wallet address.
3. Create the deposit request. The server records its exact amount, sender, recipient, network, token, and a 30-minute transfer window.
4. In a separate wallet, send the exact test USDC amount on Base Sepolia to the displayed receiving address. The wallet requires test ETH for gas. Two Hands does not sign or send this transfer.
5. Submit the transaction hash and choose Verify transaction.
6. A matching transfer remains pending until its block is finalized. Use Check transaction again to recheck; checks are limited to one per request per ten seconds.

The transfer must be mined within the request window. Verification can finish after that window; finalization does not require creating another request. Incorrect transfers are not credited. A rejected request can be checked with a corrected hash after the cooldown.

Get test USDC from [Circle's faucet](https://faucet.circle.com/). Testnet tokens have no financial value, as described in [Circle's contract documentation](https://developers.circle.com/stablecoins/usdc-contract-addresses).

## Verification boundary

The verifier is pinned to Base Sepolia, chain ID `84532`, and Circle's USDC contract `0x036CbD53842c5426634e7929541eC2318f3dCF7e`. API callers cannot override the chain or token.

Every credited deposit requires:

- RPC chain identity matching Base Sepolia.
- A successful receipt for the submitted transaction hash.
- A canonical block whose hash and number agree with the receipt.
- A block timestamp inside the original request's transfer window.
- Exactly one unremoved ERC-20 Transfer event from the configured USDC contract, matching the sending wallet, receiving address, and exact integer amount.
- A finalized network block at or above the receipt's block, followed by another canonical block-hash check.

See [Base chain identity](https://docs.base.org/base-chain/api-reference/ethereum-json-rpc-api/eth_chainId), [Base finalized-head semantics](https://docs.base.org/base-chain/specs/protocol/consensus/derivation), and the [ERC-20 Transfer specification](https://eips.ethereum.org/EIPS/eip-20). Finality is reported by the configured RPC; this is not an independent cryptographic light client.

Amounts use integer six-decimal units. Deposit request creation has a client-generated idempotency key; changing an amount or sender with the same key is rejected. A transaction can be credited only once, enforced by a database uniqueness constraint that remains global across PostgreSQL workspaces. Ledger insertion, credited request state, and its audit event commit in one database transaction. Repeated verification of an already credited deposit returns the saved result without further RPC calls.

The append-only `funding_ledger` combines on-chain credits and Stripe credit adjustments. Existing on-chain receipts in `funding_credits` are imported once with stable source IDs; historical proof remains intact. One test USDC or one test USD equals one test credit, represented in integer millionths. A Stripe refund or dispute affects only that payment's net credits. Funding ledger entries and deposit audit events are excluded from provider statistics and commercial observation aggregates. The test-credit balance does not increase backend research budgets or pay actual provider invoices.

## API

All routes enforce [workspace access](AUTH.md) and same-origin write protection. PostgreSQL funding access requires a workspace owner or platform administrator account; members and scoped keys are denied. SQLite retains the configured owner bearer-token boundary.

| Method | Route                                      | Behavior                                                                                                                                                                                                |
| ------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/api/account/funding`                     | Both method statuses, public network/address details, combined test balance, per-method counts, latest 100 receipts per method, and latest 100 ledger entries. Never returns RPC or Stripe credentials. |
| POST   | `/api/account/funding/deposits`            | Create or replay `{requestKey, amount, sender}`. Amount is a decimal string.                                                                                                                            |
| GET    | `/api/account/funding/deposits/:id`        | Read one saved request.                                                                                                                                                                                 |
| POST   | `/api/account/funding/deposits/:id/verify` | Verify `{transactionHash}` using read-only JSON-RPC calls.                                                                                                                                              |

Each workspace supports at most 1,000 on-chain requests, separately from the Stripe intent limit. The receiver is configured server-wide, while PostgreSQL receipt ownership and test balances are workspace-scoped. Transaction proof remains globally unique across workspaces. This is a test integration, not production customer payment accounting.

## Tests and remaining activation work

Unit tests exercise exact decimals, idempotency, delayed finality, expiry, missing receipts, incorrect network/token/sender/recipient/amount, reverted and removed events, duplicate events, inconsistent blocks, malformed RPC data, concurrent claims, persistence, authorization, and origin protection. Browser tests exercise both the disabled production setup state and a complete simulated deposit with duplicate prevention. Fixture RPC responses and receiving addresses exist only in the dedicated in-memory fixture server.

Before enabling even test deposits, choose a receiving address you control and configure the server. Then perform an explicitly authorized wallet transfer and compare its real receipt with the saved ledger. That live transfer has not been performed.

PostgreSQL account ownership and audit attribution are implemented but require hosted validation. Production funds require a separate implementation and review: customer/payment ownership policy, payment reconciliation, wallet/custody policy, operational monitoring, accounting rules, and an independently reviewed mainnet activation path. Mainnet cannot be enabled by changing a chain ID in the current configuration.
