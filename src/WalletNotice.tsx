import type { WalletStatus } from "../server/wallet";
import "./tool-access.css";

/**
 * Tells the account owner when prepaid credits are stopping, or about to
 * stop, paid tool calls, and what they can do. Shows nothing for an account
 * that is not on credit billing.
 */
export function walletNotice(wallet?: WalletStatus) {
  if (!wallet?.enforced) return null;
  if (wallet.frozen)
    return {
      kind: "frozen",
      text: "Paid tools are paused while a card payment is under review. Free tools still work, and your credits are kept.",
      action: "See the payment",
    };
  if (wallet.callsRemaining === 0)
    return {
      kind: "empty",
      text: "Your credits no longer cover a paid tool call, so paid calls are being refused. Free tools still work.",
      action: "Add credits",
    };
  if (wallet.billingAvailable === false)
    return {
      kind: "billing",
      text: "One paid tool is temporarily unavailable while Two Hands re-checks its pricing. Your credits are unaffected and nothing is needed from you.",
      action: null,
    };
  if (wallet.lowBalance)
    return {
      kind: "low",
      text: `Credits are running low: about ${wallet.callsRemaining} paid ${wallet.callsRemaining === 1 ? "call" : "calls"} left before paid tools are refused.`,
      action: "Add credits",
    };
  return null;
}
export function WalletNotice({
  wallet,
  onCredits,
}: {
  wallet?: WalletStatus;
  /** On Credits the page itself is the next step, so no link is shown. */
  onCredits?: boolean;
}) {
  const notice = walletNotice(wallet);
  if (!notice) return null;
  return (
    <p
      className="tool-access-notice"
      role="status"
      data-wallet-notice={notice.kind}
    >
      {notice.text}
      {notice.action && !onCredits && (
        <>
          {" "}
          <a
            className="ws-text-link"
            href={
              notice.kind === "frozen"
                ? "#dashboard/credits"
                : "#dashboard/credits/add-funds"
            }
          >
            {notice.action}
          </a>
        </>
      )}
    </p>
  );
}
