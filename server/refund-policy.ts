/**
 * Refund policy for unused prepaid credits.
 *
 * THE POLICY IS NOT DECIDED. Everything an owner decision would change lives
 * in this file: whether operator refunds may run at all, how much of a
 * payment counts as unused, and the terms shown to customers. The refund
 * mechanism (reserve, Stripe refund, reconciliation, audit) does not change
 * when these do.
 */

/** Recorded on every refund request so a later policy change stays traceable. */
export const REFUND_POLICY_VERSION = "placeholder-card-funded-unused-v1";

/**
 * Shown on Credits beside real-money top-ups. It is a placeholder: it states
 * only what the system does today and promises no refund.
 */
export const REFUND_TERMS =
  "Refund terms are being finalized. Until they are published, contact Two Hands support about unused credits. Any refund is returned to the card that paid for them.";

/**
 * Operator refunds are off until the owner approves a policy and sets
 * `TWO_HANDS_UNUSED_REFUNDS=true`. Quotes stay available so the numbers can
 * be reviewed first.
 */
export function unusedRefundsEnabled() {
  return process.env.TWO_HANDS_UNUSED_REFUNDS === "true";
}

export interface RefundablePayment {
  id: string;
  createdAt: string;
  /** Verified payment less refunds already made or in flight, in cents. */
  remainingCents: number;
  /** A disputed payment is never refunded from here. */
  disputed: boolean;
}

/**
 * Placeholder policy.
 *
 * Only money that came from a card can go back to a card. The refundable
 * amount is the smaller of:
 *
 * - the account's available credit (posted balance less holds for calls in
 *   progress), and
 * - its card-funded credit that is not yet spent: net card payments (top-ups
 *   less refunds, dispute holds and releases) minus every usage charge. Usage
 *   is counted against card money first, so credit an operator added by
 *   `adjustment` is never paid out, and a negative adjustment reduces what
 *   can be refunded.
 *
 * It is taken in whole cents. Usage is treated as spending the oldest
 * payments first, so the refundable amount is attributed to the newest
 * payments first. No fee is deducted and there is no time limit. A frozen
 * balance refunds nothing.
 */
export function refundableByPayment(input: {
  availableMicros: number;
  /** Sum of the balance's payment postings. Omitted: no cap beyond available. */
  cardNetMicros?: number;
  chargedMicros?: number;
  adjustmentMicros?: number;
  frozen: boolean;
  payments: RefundablePayment[];
}): Map<string, number> {
  const result = new Map<string, number>();
  const cardFunded =
    input.cardNetMicros === undefined
      ? input.availableMicros
      : input.cardNetMicros -
        (input.chargedMicros ?? 0) +
        Math.min(0, input.adjustmentMicros ?? 0);
  let unused = input.frozen
    ? 0
    : Math.max(
        0,
        Math.floor(Math.min(input.availableMicros, cardFunded) / 10_000),
      );
  const newestFirst = [...input.payments].sort(
    (a, b) =>
      b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
  );
  for (const payment of newestFirst) {
    const cents = payment.disputed
      ? 0
      : Math.max(0, Math.min(unused, payment.remainingCents));
    result.set(payment.id, cents);
    unused -= cents;
  }
  return result;
}
