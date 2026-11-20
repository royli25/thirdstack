export function testUsdc(units: number) {
  const whole = Math.floor(units / 1000000);
  const fraction = String(units % 1000000)
    .padStart(6, "0")
    .replace(/0+$/, "");
  return `${whole.toLocaleString("en-US")}${fraction ? `.${fraction}` : ".00"}`;
}

/** Service credits in USD micros, keeping sub-cent usage visible. */
export function sandboxCredits(micros: number) {
  return `$${(micros / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/** A signed wallet posting, such as "+$5.00" or "−$0.0077". Zero has no sign. */
export function creditChange(micros: number) {
  const sign = micros < 0 ? "−" : micros > 0 ? "+" : "";
  return `${sign}${sandboxCredits(Math.abs(micros))}`;
}

/** Net credits a card payment currently contributes, such as "$6.00" or "6.00". */
export function netCredits(units: number, dollars: boolean) {
  const amount = (units / 1_000_000).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return dollars ? `$${amount}` : amount;
}

/** A test-credit ledger reason as a label, such as "Dispute hold". */
export function ledgerReason(kind: string) {
  const text = kind.replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const postingLabels: Record<string, string> = {
  deposit: "Card top-up",
  refund: "Refund to card",
  dispute_hold: "Payment dispute hold",
  dispute_release: "Dispute closed",
  usage: "Tool call",
  adjustment: "Adjustment by Two Hands",
};
export function postingLabel(kind: string) {
  return postingLabels[kind] ?? kind.replaceAll("_", " ");
}

type BalanceSummary = {
  balanceUnits: number;
  stripe?: { mode: "test" | "live" };
  wallet?: {
    mode: "test" | "live";
    enforced: boolean;
    active: boolean;
    enrolled?: boolean;
    availableMicros: number;
  };
};
/**
 * The one balance an account can spend. An account on credit billing spends
 * its wallet, in sandbox or live credits. Every other account only has test
 * credits, which pay for nothing.
 */
export function spendableBalance(summary: BalanceSummary) {
  const { wallet } = summary;
  const live = wallet?.mode === "live" || summary.stripe?.mode === "live";
  if (wallet && (live || wallet.enrolled || wallet.enforced || wallet.active))
    return {
      wallet: true as const,
      live,
      label: sandboxCredits(wallet.availableMicros),
    };
  return {
    wallet: false as const,
    live: false,
    label: `${testUsdc(summary.balanceUnits)} test`,
  };
}

const outcomeLabels: Record<string, string> = {
  charged: "Charged",
  released: "Not charged",
  in_progress: "In progress",
  refused: "Refused",
};
export function chargeOutcome(outcome: string) {
  return outcomeLabels[outcome] ?? outcome.replaceAll("_", " ");
}
const outcomeReasons: Record<string, string> = {
  failed: "The call failed, so its hold was returned.",
  interrupted: "The call was interrupted, so its hold was returned.",
  cost_conflict:
    "The provider reported a different cost than the agreed price, so nothing was charged.",
  insufficient_balance: "Credits did not cover the call. It was not run.",
  dispute_hold: "Paid tools were paused for a payment review. It was not run.",
  rate_unverified:
    "The tool could not be billed at the time. It was not run and nothing is needed from you.",
};
export function chargeReason(reason: string | null) {
  return reason ? (outcomeReasons[reason] ?? reason.replaceAll("_", " ")) : "";
}
