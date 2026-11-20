# On-chain traceability of payments from custodial and embedded platform wallets (as of Nov 2026)

Method note: In this session WebFetch was blocked at the network level (docs.stripe.com and docs.cdp.coinbase.com failed DNS resolution in the sandbox). **Every finding below comes from WebSearch result snippets or summaries, not full-page reads.** Treat exact field names, dates and quotes as snippet-level and verify them against the primary page before publishing. About 18 search calls were made.

Context finding that frames everything else: as of Nov 2026, **OpenAI's ChatGPT Wallet (launched Nov 13, 2026) reportedly does not support stablecoins or crypto at all.** It uses Visa/Mastercard/Amex network tokens submitted through the merchant's normal checkout, and it holds no balances — [KuCoin News](https://www.kucoin.com/news/flash/openai-launches-chatgpt-wallet-for-ai-agent-purchases-excludes-cryptocurrency); [Stablecoin Insider](https://stablecoininsider.org/chatgpt-wallet/); [CU Today](https://www.cutoday.info/Fresh-Today/OpenAI-Launches-ChatGPT-Wallet-Moving-AI-Agents-Closer-To-Controlling-Consumer-Payments); [Bloomingbit](https://en.bloomingbit.io/feed/news/124452). Reported details: US ChatGPT Pro users aged 18+, biometric approval per purchase, and agent autonomy within preset limits planned "eventually." So a Flovia-style snippet would currently see **no on-chain payer address from an OpenAI-wallet payment**, because there is no on-chain leg. Everything below concerns a hypothetical or future stablecoin path, and other platform wallets that already exist.

---

## 1. Omnibus/pooled custody vs per-user addresses: how do exchanges and fintechs send outbound payments, and what does the receiver see?

### Takeaway
Large custodial exchanges (Coinbase, and probably PayPal/Venmo and Robinhood) generally send customer withdrawals from shared omnibus or hot wallets. A merchant receiving such a payment sees the platform's hot wallet address, not an address belonging to the individual. That address's "history" is the exchange's entire outbound flow, so it says nothing about the payer. Bridge (Stripe) is an exception: it says it uses per-customer segregated wallets.

### Cited Findings
- Coinbase's User Agreement (as transcribed by a third-party tracker) says Coinbase may hold customer assets in shared omnibus blockchain addresses across multiple protocols, with no obligation to create segregated addresses per user — [ConductAtlas: omnibus addresses provision](https://conductatlas.com/platform/coinbase/coinbase-user-agreement/coinbase-may-use-omnibus-blockchain-addresses/); [ConductAtlas: omnibus custody and fungibility](https://conductatlas.com/platform/coinbase/coinbase-user-agreement/omnibus-custody-and-fungibility-of-digital-assets/). (Secondary transcription, not read on coinbase.com.)
- Coinbase describes hot-wallet controls: no individual has standing production access to its wallet signing service, cold-to-hot movements are rate-limited, and flagged withdrawals are reviewed — [Unchained](https://unchainedcrypto.com/coinbase-lays-out-hot-wallet-controls-as-customers-ask-if-a-binance-style-hack-could-hit-it/).
- On-chain analysts routinely label Coinbase hot wallets as single entities. Example: Arkham reported that a fresh Solana address withdrew 850K SOL (about $138M) from a "Coinbase Prime hot wallet" in June 2025 — [Arkham Research](https://info.arkm.com/research/138m-sol-stake).
- Stripe's own deposit-mode docs warn that "Exchange or omnibus wallet payers might not be able to recover refunded funds." Stripe refunds go to the sending address, and for exchange payers that address is a shared wallet, not the user's — [Stripe Docs: deposit mode stablecoin payments](https://docs.stripe.com/payments/deposit-mode-stablecoin-payments). This is direct evidence from a payment processor that exchange-originated payments arrive from omnibus addresses.
- PayPal: users can send PYUSD to external wallet addresses on supported networks (Ethereum, Solana; a 10 PYUSD minimum applies to ERC-20 sends) — [PayPal Help: What is PYUSD](https://www.paypal.com/us/cshelp/article/what-is-paypal-usd-pyusd-HELP1005); [Paxos PYUSD](https://paxos.com/pyusd). A third-party guide says PYUSD is minted to "PayPal/Venmo's omnibus wallet," which credits users' app balances — [DEXTools guide](https://www.dextools.io/tutorials/what-is-pyusd-paypal-stablecoin-guide). This is not confirmed by PayPal or Paxos.
- Bridge (Stripe) says its custodial wallets use "individual segregated wallets per customer rather than pooled wallets." Funds move only through Bridge orchestration APIs, with compliance approval. Bridge custodial wallets hold USDB and express amounts in whole US cents — [Bridge API docs: custodial wallets](https://apidocs.bridge.xyz/docs/custodial-wallets); [Bridge support: custody safeguards](https://support.bridge.xyz/articles/6027801704-what-are-the-custody-and-risk-safeguards-for-bridge-wallets).
- Circle developer-controlled wallets: the developer holds keys (via an entity secret), creates and funds wallets per user or account, and executes transfers on the user's request. Circle also supports unified EVM addresses — [Circle skill: developer-controlled wallets](https://www.skills.sh/circlefin/skills/use-developer-controlled-wallets); [Circle docs: dev-controlled](https://developers.circle.com/wallets/dev-controlled.md).

### Inferences
- For Coinbase, Robinhood and PayPal-style retail custodial sends, a merchant would most likely see a high-volume, analytics-labeled hot wallet ("Coinbase 10," etc.). Enriching that address gives "this came from Coinbase," which reveals the platform but nothing about the individual. Its transaction history is the exchange's, mixing millions of users.
- For per-user models (Bridge segregated wallets, Circle developer-controlled wallets with one wallet per user), the merchant would see a persistent, user-specific address. Its history would show that user's in-platform on-chain activity: funding transfers from the platform's treasury, prior payments to other merchants, and so on. That is far more revealing, though the address is still pseudonymous.
- Platforms can also mix models: per-user deposit addresses for inbound funds, swept to a shared hot wallet for outbound sends. Under that model the receiver sees the hot wallet. I did not find primary docs confirming which model Robinhood or PayPal uses for outbound sends.

### Gaps
- No primary Coinbase, PayPal or Robinhood doc found that states the outbound send address model. Robinhood was not researched due to the search budget.
- Not confirmed: whether Circle wallets default to one address per user, or whether Bridge's "segregated wallet" means a distinct on-chain address per customer or ledger-level segregation.
- No source found on whether exchanges batch outbound stablecoin transfers. Batching would further obscure payment origin.

---

## 2. Embedded/smart wallets (Coinbase Smart Wallet/CDP, Privy, Turnkey, Circle, Magic): unique persistent addresses? Linkable history? Paymasters, relayers, bundlers?

### Takeaway
Embedded and smart wallets give each user a **unique, persistent address**. For Coinbase Smart Wallet it is the same address across more than 200 EVM chains, which makes cross-chain history linking easy. Paymasters and bundlers change who pays gas and who submits the top-level transaction, but they do not hide the user's smart-account address. It is the `sender` in the UserOperation and the `from` of the token Transfer event the merchant receives. No transaction-level privacy (shielding) was found in Privy's docs. Privy's "privacy" refers to key custody.

### Cited Findings
- Coinbase Smart Wallet's factory deploys via Safe Singleton Factory, giving the same address on 248 chains. Coinbase's FAQ says a user's Smart Wallet address is the same across all supported chains — [GitHub: coinbase/smart-wallet README](https://raw.githubusercontent.com/coinbase/smart-wallet/main/README.md); [Coinbase Smart Wallet FAQ](https://smart-wallet-docs-iqzm2ymzy-coinbase-vercel.vercel.app/FAQ).
- The address is derived deterministically via CREATE2 from the owner public key and the factory. It can exist before the contract is deployed on a given chain — [eco.com deep dive (secondary)](https://eco.com/support/en/articles/15254041-coinbase-smart-wallet-deep-dive-2026).
- Each Smart Wallet transaction is an ERC-4337 UserOperation. CDP merges its Paymaster and Bundler into one endpoint. `tx.origin` is the bundler EOA, not the Smart Wallet — [CDP: account abstraction basics](https://docs.cdp.coinbase.com/paymaster/need-to-knows/account-abstraction-basics); [Coinbase Smart Wallet FAQ](https://smart-wallet-docs-iqzm2ymzy-coinbase-vercel.vercel.app/FAQ).
- The top-level transaction targets the EntryPoint, and the user's intent sits inside the UserOperation calldata, which includes `sender` and `paymaster` fields — [CoinTracker: recovering intent in ERC-4337](https://www.cointracker.io/blog/from-envelope-to-letter-recovering-intent-in-erc-4337).
- Privy embedded wallet keys are generated in a TEE, split with Shamir's Secret Sharing and never stored whole. Another Privy page describes the wallets as self-custodial, with neither Privy nor apps accessing keys — [Privy security FAQs](https://docs.privy.io/security/security-faqs); [Privy: how embedded wallets work](https://privy.io/blog/how-privy-embedded-wallets-work).
- The search found no Privy doc describing shielded or private on-chain transfers. Privy's transaction scanning (Blockaid) is a security feature, not a privacy feature — [Privy blog: transaction scanning](https://privy.io/blog/transaction-scanning); [Blockaid](https://www.blockaid.io/blog/privy-integrates-blockaid-to-bring-transaction-security-into-global-wallets). A results page titled "Private transactions with Privy" appeared but its content could not be read — [Privy docs: private transactions](https://docs.privy.io/financial-flows/private-transactions). **Its existence suggests Privy may offer some private-transaction feature, but what it does is unverified.**
- Helius documents a shielded "embedded privacy wallet" for Solana that is not yet live — [Helius privacy docs](https://www.helius.dev/docs/privacy/integration/embedded-wallet).

### Inferences
- From the merchant's view, an ERC-20 USDC `Transfer` log from a smart account shows `from = smart account address`. That is standard ERC-20 and EntryPoint behavior, not confirmed for this specific case by a fetched source. A snippet that reads only `tx.from` would wrongly capture the **bundler EOA**, a shared address used by many users. A correctly built snippet reads the token transfer event or the UserOperationEvent's `sender`. This is an important implementation pitfall for Flovia.
- Because the smart-wallet address is persistent and identical across chains, enrichment can reconstruct that user's full on-chain history on every EVM chain where they used it. Embedded and smart wallets are therefore the **most traceable** platform-wallet category, much more than omnibus exchange sends.
- Paymaster sponsorship links the user's operations to the sponsoring app's paymaster. That reveals which app the user transacts through, which is extra attribution signal, not less.
- Turnkey and Magic were not specifically researched. Their standard design (one key-managed EOA or smart account per user) would behave like Privy: unique and persistent.

### Gaps
- Turnkey, Magic, and Circle user-controlled wallets: no sources gathered.
- No source found on whether any of these providers rotate fresh addresses per payment by default. None was indicated.
- Contents of the Privy "private transactions" page are unknown.

---

## 3. Stripe stablecoin acceptance (Pay with Crypto, deposit mode, Bridge, financial accounts, Tempo): does the merchant get the crypto and the payer's address? Tempo privacy?

### Takeaway
Stripe's standard Pay with Crypto **settles USD** to the merchant's Stripe balance. But Stripe **does expose on-chain details to the merchant via the API**: in deposit mode, the charge's `payment_method_details.crypto` reportedly includes the transaction hash, **buyer wallet address**, network and token. A Stripe merchant can therefore already get the payer's sending address without a third-party snippet. Tempo (Stripe/Paradigm L1, mainnet reportedly March 2026) is a public EVM chain by default. Its privacy offering is "Tempo Zones," permissioned private environments where in-zone transfers are hidden but deposits at the boundary reveal sender, token and amount.

### Cited Findings
- Pay with Crypto flow: the customer is redirected to a crypto.link.com page, connects a wallet, and signs a USDC transfer. Transactions settle in USD to the Stripe balance (USD settlement only). The fee is 1.5%. Limits are $10,000 per transaction and $100,000 per month per customer. Refunds go back as stablecoins to the customer's original wallet. Availability is limited to a set of US businesses — [Stripe Docs: stablecoin payments](https://docs.stripe.com/crypto/stablecoin-payments.md); [Stripe Docs: stablecoins (public preview)](https://docs.stripe.com/crypto/stablecoins).
- Deposit mode: the merchant creates a PaymentIntent with `payment_method: crypto`, `mode: "deposit"` and `deposit_options.networks`. The customer sends the exact token amount to a deposit address. After success, "the `payment_method_details.crypto` hash on the charge includes fields such as the transaction hash, buyer wallet address, network, and token currency," retrieved by expanding `latest_charge` — [Stripe Docs: deposit mode stablecoin payments](https://docs.stripe.com/payments/deposit-mode-stablecoin-payments). (Snippet-level; the exact key name was not confirmed.)
- Deposit-mode refunds go "to the sending wallet address from the detected on-chain transaction," and "exchange or omnibus wallet payers might not be able to recover refunded funds" — [Stripe Docs: deposit mode](https://docs.stripe.com/payments/deposit-mode-stablecoin-payments).
- Refund objects carry the blockchain tx hash in `reference` (changelog 2025-10-29). The `token_currency` enum added `phantom_cash` and `usdt` (2026-04-22) — [Stripe changelog: refund tx hash](https://docs.stripe.com/changelog/clover/2025-10-29/stablecoin-refunds-reference-details); [Stripe changelog: Phantom Cash/USDT](https://docs.stripe.com/changelog/dahlia/2026-04-22/stablecoin-payments-phantom-cash-and-usdt). The Stripe SDKs have a `Charge.PaymentMethodDetails.Crypto` model — [stripe-java](https://stripe.dev/stripe-java/com/stripe/model/Charge.PaymentMethodDetails.Crypto.html).
- Stripe's Stablecoin Payments legal terms describe a model where a Settlement Services Provider gives the merchant a "Deposit Address" to share with customers — [Stripe legal: Stablecoin Payments](https://stripe.com/legal/stablecoin-payments).
- Stripe also lists stablecoin financial accounts and stablecoins on Link (not read in detail) — [Stripe Docs: financial accounts stablecoins](https://docs.stripe.com/financial-accounts/stablecoins); [Stripe Docs: Stablecoins on Link](https://docs.stripe.com/payments/link/stablecoins).
- Tempo: Stripe docs say the network has "built-in privacy," account-level controls and reconciliation, fees typically under $0.001, ISO 20022-aligned memos, and protocol-level blocklists/allowlists. Stripe Checkout accepts stablecoins on Tempo, and MPP supports agent payments — [Stripe Docs: Tempo](https://docs.stripe.com/stablecoins/ecosystem/tempo). Earlier coverage called the privacy "opt-in," keeping select transaction data private while meeting compliance — [Decrypt](https://decrypt.co/resources/what-tempo-payments-stablecoin-blockchain-stripe); [Finextra](https://www.finextra.com/blogposting/29355/deep-dive-what-you-need-to-know-about-tempo---stripes-l1-blockchain).
- Tempo Zones: separate EVM-compatible private chains that settle to Tempo mainnet. Balances and transfers inside a Zone are hidden from the public. Deposits into a Zone reveal token, amount and **sender** on mainnet, while the recipient and memo are encrypted. The Zone operator (the business, or Tempo for Tempo-hosted Zones) can see activity, which Tempo frames as "controlled visibility," not anonymity. The operator can pause transfers — [Tempo blog: Introducing Tempo Zones](https://tempo.xyz/blog/introducing-tempo-zones/); [Bitcoin.com News](https://news.bitcoin.com/tempo-launches-private-stablecoin-zones-for-enterprise-payroll-and-treasury-settlements/); [Payzum](https://payzum.com/blog/stablecoin-payment-privacy/).
- Availability conflict: Tempo's page says Zones are in enterprise early access, while Payzum says they have been GA for enterprises since Oct 14, 2026 — [Tempo blog](https://tempo.xyz/blog/introducing-tempo-zones/); contradicted by [Payzum](https://payzum.com/blog/stablecoin-payment-privacy/). The Payzum date is unverified.
- Tempo mainnet / MPP launch date of March 18, 2026 is reported by MPP coverage — [Apify blog](https://blog.apify.com/machine-payments-protocol-overview/); [DEV Community](https://dev.to/t49qnsx7qtkpanks/stripe-mpp-launched-march-2026-what-session-based-agent-payments-mean-for-mcp-developers-21hp).

### Inferences
- For a Stripe merchant, a Flovia-style snippet is partly redundant on the address-capture side, since Stripe already returns the buyer wallet address. Flovia's added value would be the enrichment, meaning history lookups. Stripe's hosted crypto.link.com page means a front-end snippet may **not** see the wallet connection directly. It would get the address only from Stripe's API or webhook.
- Whatever Stripe returns as "buyer wallet address" is the on-chain sender. For Coinbase or PayPal omnibus payers that is the exchange hot wallet. For Privy or Coinbase Smart Wallet payers it is the user's persistent address.
- On Tempo mainnet, which is public and EVM-style, payments behave like Base or Ethereum: sender visible, history linkable. Inside a Tempo Zone the public cannot see in-zone transfers. A merchant receiving inside a Zone would presumably see the counterparty as the zone design allows, but public enrichment of in-zone history would fail. A deposit into a Zone still publicly reveals the sender.
- If a large platform (e.g., OpenAI via Stripe) ever routes stablecoin payments through Stripe-managed or Bridge wallets that settle as fiat, the merchant may receive USD and no on-chain data, or only Stripe's reported sender address.

### Gaps
- Not confirmed whether the standard (non-deposit) Pay with Crypto flow also exposes the buyer address in the API. Likely, since it uses the same `payment_method_details.crypto` model, but unverified.
- Exact Tempo "built-in privacy" mechanics outside Zones (e.g., any confidential-amount feature on mainnet) could not be confirmed. Pages could not be fetched.
- Whether Stripe sponsors Tempo fees for customers (private preview per MPP docs) affects who appears as the tx submitter. Details are unverified.

---

## 4. x402 and MPP: is the payer address visible to the seller? Privacy-preserving approaches?

### Takeaway
In both x402 and MPP (Tempo method), the payer's address is **visible to the seller**. In x402 it appears in the signed payment payload and settlement record. In MPP it appears in the channel or opening transaction. Facilitators submit transactions and pay gas but do not hide the payer. MPP sessions (payment channels) reduce the number of on-chain transactions to two (open and close), which reduces granularity, but the channel still links payer to payee. Privacy-preserving x402 variants exist only as hackathon proposals or vendor claims.

### Cited Findings
- x402 (Coinbase CDP FAQ): sellers never see the buyer's key. They verify a signature and receive funds at an address. Every settlement is an on-chain transfer, and the `PAYMENT-RESPONSE` header carries the tx reference. To refund, the seller sends a transfer back to "the payer address from the settlement record" — [CDP x402 FAQ](https://docs.cdp.coinbase.com/x402/support/faq).
- Facilitator settlement metadata includes `"payer": "0x123..."` alongside the transaction hash and network (Crossmint facilitator API) — [Crossmint facilitator API](https://www.mintlify.com/Crossmint/crossmint-agentic-finance/api/facilitator). Facilitator role overview — [CDP x402 facilitator](https://docs.cdp.coinbase.com/x402/docs/facilitator).
- Privy and Fireblocks provide x402 integrations for embedded and agent wallets. The payer is then the embedded wallet's persistent address — [Privy x402 recipe](https://docs.privy.io/recipes/agent-integrations/x402.md); [Privy blog](https://privy.io/blog/building-agentic-and-programmatic-payments-with-x402-and-privy); [Fireblocks x402 concepts](https://developers.fireblocks.com/docs/x402-concepts.md).
- Proposed privacy: "Private-Escrow x402" (ETHGlobal showcase) has a facilitator that batches proofs so the "facilitator sees payments but can't link buyer→seller→resource." Its ZK component is listed as planned — [ETHGlobal: Private-Escrow x402](https://ethglobal.com/showcase/private-escrow-x402-fj0v1).
- Metadata leakage: a vendor comparison notes the resource server also sees client IP and HTTP session alongside the wallet address — [PayRam vs x402 (vendor content)](https://raw.githubusercontent.com/LeoYeAI/openclaw-master-skills/main/skills/payram-vs-x402/SKILL.md).
- MPP: co-authored by Stripe and Tempo and launched March 18, 2026, MPP uses an HTTP 402 Challenge–Credential–Receipt flow and is payment-method agnostic. It has "charges" for one-time payments and "sessions" for metered use. A Tempo session opens a channel via the TIP-1034 precompile between payer and payee (identified by channel ID). The Credential is the opening tx or a signed voucher. A session needs only two on-chain txs for unlimited payments. After a 900-second close grace period the payer can withdraw the deposit — [mpp-specs (GitHub)](https://github.com/tempoxyz/mpp-specs); [mpp.dev: Tempo session](https://mpp.dev/payment-methods/tempo/session); [Tempo blog: MPP sessions](https://tempo.xyz/blog/mpp-sessions); [Stripe blog: MPP](https://stripe.com/blog/machine-payments-protocol); [Cloudflare MPP docs](https://developers.cloudflare.com/agents/agentic-payments/mpp).
- MPP also supports cards and wallets via Stripe Shared Payment Tokens, in which case no on-chain address exists. MPP has an optional identity extension, and Credentials can be used for access control without payment — [Stripe Docs: MPP](https://docs.stripe.com/payments/machine/mpp.md); [mpp.dev credentials](https://mpp.dev/protocol/credentials); [mpp.dev FAQ](https://mpp.dev/faq).

### Inferences
- x402 is ideal for Flovia-style capture: the payer address arrives in the payment header or settlement record with no wallet-connect UI needed. Whether that address is revealing depends on the wallet type: persistent embedded or smart wallet (revealing) versus a custodial agent wallet backed by an omnibus (not revealing).
- MPP sessions: on-chain observers see one deposit or open and one close per session. The merchant sees per-request vouchers off-chain. The payer's channel-funding address is still visible and enrichable.
- An MPP payment via Shared Payment Token (card) gives the merchant no wallet address. This is the same as ChatGPT Wallet's card-token approach.
- Stealth addresses, privacy pools and confidential transfers: aside from Tempo Zones and the unshipped proposals above, I found no production deployment in x402, MPP or the major platform wallets as of Nov 2026.

### Gaps
- Not researched: whether the current x402 spec version (v2) adds any payer-privacy fields, or whether the "upto"/deferred schemes batch payments.
- No source checked on ERC-5564 stealth addresses or Privacy Pools adoption by any payments platform.
- MPP identity extension details not retrieved.

---

## 5. How well does on-chain clustering/attribution identify individuals behind custodial flows?

### Takeaway
Analytics firms reliably attribute addresses to **services** (e.g., "Coinbase hot wallet"), but on-chain data alone cannot say which **customer** of a custodian made an omnibus payment. The customer-level mapping lives off-chain in the custodian's ledger and is obtainable only via subpoena, Travel Rule exchanges or data sharing. Individual-level linkage is realistic for self-custodial and per-user addresses, using heuristics like Ethereum deposit-address reuse and cross-chain address reuse. Even then it yields pseudonymous clusters, not names, unless combined with off-chain data. That off-chain data is exactly what a merchant has: order, email, shipping address.

### Cited Findings
- Elliptic: clustering heuristics are probabilistic. Shared custody, omnibus wallets and service-architecture ambiguity are major constraints. In custodial wallets, customer-level ownership is recorded off-chain — [Elliptic: wallet clustering limits](https://www.elliptic.co/corpus/gen-3524/blockchain-privacy/wallet-clustering-limits.html); [Elliptic: custodian identification](https://www.elliptic.co/corpus/gen-3627/forensic-corporate-collections/custodian-identification.html).
- Elliptic: "attribution to an exchange identifies the service, not the person using it," because hosted wallets commingle funds. Over-clustering can wrongly attribute unrelated addresses to an exchange — [Elliptic: wallet attribution](https://www.elliptic.co/wallet-attribution.html); [Elliptic: wallet clustering](https://www.elliptic.co/wallet-clustering.html).
- Chainalysis (secondhand): treats address grouping, wallet control and real-world attribution as different levels of evidence, and warns that "cluster" is used too broadly — [KuCoin blog on Chainalysis ontology](https://www.kucoin.com/blog/chainalysis-address-clustering-ontology-blockchain-tracing). (Not verified against a primary Chainalysis source.)
- Coinbase's own analytics team notes blockchain analytics is "tricky at scale" — [Coinbase blog](https://www.coinbase.com/blog/part-2-blockchain-analytics-is-tricky-at-scale). (Title only; content not read.)
- Independent evaluation: USENIX Security 2025 "Ghost Clusters" compared Chainalysis attribution against ground truth for three seized illicit services (BestMixer, Hansa, Wall Street Market) — [USENIX: Ghost Clusters](https://www.usenix.org/conference/usenixsecurity25/presentation/lubbertsen). Accuracy figures were not retrieved.
- Academic heuristic: Victor (2020), "Address Clustering Heuristics for Ethereum," found the **deposit-address heuristic** most effective. Users who send to the same exchange deposit address are linked, because the deposit address forwards to the exchange hot wallet. Other heuristics: airdrop multi-participation, token approvals — [Springer (FC 2020)](https://link.springer.com/doi/10.1007/978-3-030-51280-4_33); [Tutela (arXiv 2201.06811)](https://arxiv.org/pdf/2201.06811). A 2023 application (Etherclust) clustered 6.79M addresses into 1.41M multi-address entities, about 2.93% of 231.6M Ethereum addresses at the time — [arXiv 2510.09433](https://arxiv.org/pdf/2510.09433v2).
- Commercial tools (Arkham, etc.) publicly label exchange hot wallets, e.g., "Coinbase Prime hot wallet" — [Arkham Research](https://info.arkm.com/research/138m-sol-stake).

### Inferences
- **Realistic for a Flovia snippet:**
  - (a) Labeling the payment's source as "Coinbase/PayPal/Kraken hot wallet," or "Coinbase Smart Wallet," or "Privy embedded wallet."
  - (b) For per-user or self-custodial addresses, reconstructing that address's full public history: balances, DeFi use, NFTs, other merchants paid, cross-chain activity (trivial for Coinbase Smart Wallet, whose address is identical across chains).
  - (c) Linking the address to the merchant's own customer record, giving a de-pseudonymized wallet. This is the main privacy risk.
- **Not realistic:**
  - Identifying which individual sent an omnibus/hot-wallet payment.
  - Reconstructing that user's other activity from chain data. The hot wallet's history belongs to the exchange.
  - Seeing in-zone activity on Tempo Zones.
- Subtle leak: when a user withdraws from an exchange to their own wallet and then pays the merchant, the merchant sees the self-custody address. That address's history shows the exchange withdrawal, which reveals the user's exchange and approximate amounts and timing.
- Data-protection note (inference, outside scope): pairing a wallet address with customer PII likely makes the address personal data under GDPR or CCPA-style regimes.

### Gaps
- No quantitative accuracy figures for individual-level attribution in custodial flows. The Ghost Clusters numbers were not retrieved.
- No Arkham or Nansen methodology documents gathered.
- No data on what share of stablecoin merchant payments come from omnibus vs self-custodial vs embedded wallets.
