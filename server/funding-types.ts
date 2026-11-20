export const BASE_SEPOLIA = {
  chainId: 84532,
  chainName: "Base Sepolia",
  asset: "USDC",
  decimals: 6,
  tokenAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  explorer: "https://sepolia.basescan.org",
} as const;
export interface DepositIntent {
  id: string;
  requestKey: string;
  amountUnits: number;
  sender: string;
  recipient: string;
  chainId: 84532;
  tokenAddress: string;
  status:
    | "awaiting_transfer"
    | "pending"
    | "awaiting_finality"
    | "credited"
    | "rejected"
    | "expired";
  createdAt: string;
  expiresAt: string;
  transactionHash: string | null;
  blockNumber: string | null;
  lastCheckedAt: string | null;
  creditedAt: string | null;
  message: string;
  verificationProof?: {
    blockHash: string;
    logIndex: string;
    finalizedBlockNumber: string;
    finalizedBlockHash: string;
  };
}
export interface FundingSummary {
  enabled: boolean;
  unavailableReason: string | null;
  network: typeof BASE_SEPOLIA;
  recipient: string | null;
  balanceUnits: number;
  totalDeposits: number;
  intents: DepositIntent[];
  testnet: true;
  spendableForProviders: false;
  onchainBalanceUnits?: number;
  onchainDeposits?: number;
  stripeDeposits?: number;
  stripe?: StripeFundingStatus;
  stripeIntents?: StripeDeposit[];
  entries?: FundingEntry[];
  wallet?: import("./wallet.js").WalletStatus;
  /** Latest postings of the balance that pays for this account's calls. */
  walletEntries?: import("./wallet.js").WalletEntry[];
  /** Refund terms shown beside real-money top-ups. */
  refundTerms?: string;
}
export interface FundingEntry {
  id: number;
  source: "onchain" | "stripe";
  sourceId: string;
  deltaUnits: number;
  kind: string;
  reference: string;
  createdAt: string;
}
/** "test" is the Stripe sandbox. "live" is real money. */
export type StripeMode = "test" | "live";
/**
 * Why a top-up is not offered to an account that could not spend it. The
 * customer sees a plain explanation; the code is for the page and for tests.
 */
export type TopUpBlock =
  | "not_enrolled"
  | "billing_unavailable"
  | "tool_access_pending"
  | "tool_access_paused"
  | "tool_access_used";
export interface StripeFundingStatus {
  enabled: boolean;
  unavailableReason: string | null;
  /** Set when top-ups are withheld because the credits could not be spent. */
  blocked?: TopUpBlock;
  mode: StripeMode;
  minimumCents: number;
  maximumCents: number;
}
export interface StripeDeposit {
  id: string;
  /** Fixed when the checkout is requested. Absent on receipts saved before live mode existed, which are sandbox. */
  mode?: StripeMode;
  requestKey: string;
  amountCents: number;
  status:
    | "creating"
    | "checkout_ready"
    | "processing"
    | "credited"
    | "partially_refunded"
    | "refunded"
    | "disputed"
    | "expired"
    | "failed";
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  refundedCents: number;
  disputed: boolean;
  netCreditUnits: number;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  message: string;
  /** Stripe-hosted receipt for the verified charge. */
  receiptUrl?: string | null;
  /** Operator refund reserved from the balance that Stripe has not reported yet. */
  pendingRefundCents?: number;
  /** Set when an operator releases the dispute freeze after Stripe closed the dispute. */
  disputeResolution?: {
    outcome: "won" | "lost";
    restoredMicros: number;
    releasedAt: string;
    /** Amount Stripe took back for lost disputes. Never restored. */
    lostCents?: number;
    /** The Stripe disputes this release settled. A dispute not listed is a new one. */
    disputeIds?: string[];
  };
  /** How many dispute cycles this payment has had. Absent means at most one. */
  disputeCycle?: number;
  /** Refunds Stripe reported and later failed; their credits were restored. */
  failedRefundIds?: string[];
}
