import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  RefreshCw01,
} from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { api } from "./api";
import { CopyButton, Empty, InlineError, date } from "./observation-ui";
import { netCredits } from "./funding-format";
import type { FundingSummary, StripeDeposit } from "../server/funding-types";

const labels: Record<StripeDeposit["status"], string> = {
  creating: "Preparing checkout",
  checkout_ready: "Awaiting payment",
  processing: "Processing",
  credited: "Credited",
  partially_refunded: "Partially refunded",
  refunded: "Refunded",
  disputed: "Dispute hold",
  expired: "Expired",
  failed: "Needs attention",
};
/** Statuses where the payment did not simply succeed. */
const attention: ReadonlySet<StripeDeposit["status"]> = new Set([
  "disputed",
  "expired",
  "failed",
]);
const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export function StripeFundingPanel({
  summary,
  refresh,
  creditBilling = false,
}: {
  summary?: FundingSummary;
  refresh: () => Promise<void>;
  /** The account pays for tool calls from prepaid credits (sandbox or live). */
  creditBilling?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<StripeDeposit>();
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [returned, setReturned] = useState(false);
  const key = useRef(crypto.randomUUID());
  const handledReturn = useRef(false);
  // Real-money wording for a live account. A saved receipt keeps the wording
  // of its own mode, so an old sandbox payment is never shown as real money.
  const live = summary?.stripe?.mode === "live";
  // Top-ups are withheld while the account could not spend the credits.
  const blocked = summary?.stripe?.blocked
    ? summary.stripe.unavailableReason
    : null;
  const isLive = (deposit?: StripeDeposit) =>
    deposit ? deposit.mode === "live" : live;
  const unit = (deposit?: StripeDeposit) =>
    isLive(deposit) ? "USD" : "test USD";
  const maximum = usd(summary?.stripe?.maximumCents ?? 100000).replace(
    /\.00$/,
    "",
  );
  useEffect(() => {
    const current = summary?.stripeIntents?.find((i) => i.id === selected?.id);
    if (current) setSelected(current);
  }, [summary?.stripeIntents, selected?.id]);
  useEffect(() => {
    if (handledReturn.current) return;
    handledReturn.current = true;
    const query = new URLSearchParams(location.search);
    const id = query.get("stripe_deposit");
    if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return;
    setReturned(true);
    setOpen(true);
    setBusy(true);
    // A return URL only opens a saved receipt. It never proves payment or adds credits.
    void api<StripeDeposit>(`/account/funding/stripe/${id}`)
      .then(setSelected)
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
    query.delete("stripe_deposit");
    query.delete("stripe_cancelled");
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${query.size ? `?${query}` : ""}${location.hash}`,
    );
  }, []);
  async function prepare(retry?: StripeDeposit) {
    setBusy(true);
    setError("");
    try {
      const result = await api<StripeDeposit>("/account/funding/stripe", {
        requestKey: retry?.requestKey ?? key.current,
        amount: retry ? (retry.amountCents / 100).toFixed(2) : amount,
      });
      setSelected(result);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="ws-panel ws-funding-method" id="stripe-deposits">
        <header>
          <div>
            <h2>Card via Stripe</h2>
            <p>
              {live
                ? "Hosted Checkout · USD card payments"
                : "Hosted Checkout · USD test payments"}
            </p>
          </div>
          <Badge variant="outline">
            {summary?.stripe?.enabled ? "Available" : "Unavailable"}
          </Badge>
        </header>
        <div>
          <p>
            {!summary?.stripe?.enabled
              ? blocked
                ? "Top-ups are not open for this account yet."
                : live
                  ? "Card top-ups are paused for this account. Your credits are kept."
                  : "Card payments are not available yet. There is nothing to configure in your account."
              : live
                ? "Pay by card on Stripe’s secure checkout. Each verified dollar adds one dollar of credits. Refunds and disputed payments adjust your credits."
                : creditBilling
                  ? "Complete a test payment on Stripe’s secure checkout. Each verified test dollar adds one dollar of sandbox credits. Refunds and disputed payments adjust your credits."
                  : "Complete a test payment on Stripe’s secure checkout. Each verified test dollar adds one test credit. Refunds and disputed payments adjust the credit balance."}
          </p>
          {!summary?.stripe?.enabled && (
            <div className="ws-funding-setup" data-top-up-blocked={!!blocked}>
              <strong>
                {blocked
                  ? "Why you can’t add credits yet"
                  : "Card deposits are unavailable"}
              </strong>
              <p>
                {blocked ??
                  (live
                    ? "Card top-ups are not available for this account right now. Your credits are kept."
                    : "You can continue setting up your agent without a payment method. No card details are needed.")}
              </p>
            </div>
          )}
          <Button
            disabled={!summary?.stripe?.enabled}
            onClick={() => {
              setSelected(undefined);
              setError("");
              setReturned(false);
              key.current = crypto.randomUUID();
              setOpen(true);
            }}
          >
            {live
              ? "Add credits"
              : creditBilling
                ? "Add sandbox credits"
                : "Deposit with Stripe"}
            <ArrowRight />
          </Button>
        </div>
      </section>
      {(summary?.stripe?.enabled || !!summary?.stripeIntents?.length) && (
        <section className="ws-panel">
          <header>
            <div>
              <h2>{live ? "Card payments" : "Card deposit history"}</h2>
              <p>
                {live
                  ? "Your top-ups, their receipts and any refunds."
                  : "Test payments and their current credit adjustments."}
              </p>
            </div>
            {!live && <Badge variant="outline">Test mode</Badge>}
          </header>
          {summary?.stripeIntents?.length ? (
            <div
              className="ws-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Card deposit history"
            >
              <table className="ws-table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Net credits</th>
                    <th>
                      <span className="sr-only">Inspect</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {summary.stripeIntents.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <strong>{usd(i.amountCents)}</strong> {unit(i)}
                      </td>
                      <td>{labels[i.status]}</td>
                      <td>{date(i.createdAt)}</td>
                      <td>
                        {netCredits(i.netCreditUnits, creditBilling || live)}
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelected(i);
                            setError("");
                            setReturned(false);
                            setOpen(true);
                          }}
                        >
                          {live ? "View payment" : "View card deposit"}
                          <ArrowRight />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title={live ? "No card payments yet" : "No card deposits yet"}
            >
              {live
                ? "Verified card payments will appear here."
                : "Verified Stripe test payments will appear here."}
            </Empty>
          )}
        </section>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent className="ws-detail-dialog customer-funding-dialog translate-x-0 translate-y-0">
          <DialogHeader>
            <DialogTitle>
              {selected
                ? isLive(selected)
                  ? "Card payment details"
                  : "Card deposit details"
                : live
                  ? "Add credits"
                  : "Deposit with Stripe"}
            </DialogTitle>
            <DialogDescription>
              {isLive(selected)
                ? "Card payment processed by Stripe. Credits pay for this account’s tool calls."
                : creditBilling
                  ? "Stripe test mode. Sandbox credits are not real money."
                  : "Stripe test mode. Test credits cannot pay for live tool calls."}
            </DialogDescription>
          </DialogHeader>
          <InlineError message={error} />
          {returned && (
            <p className="ws-panel-note">
              Returned from Checkout. Only Stripe’s verified payment status can
              add credits; returning or cancelling does not confirm a payment.
            </p>
          )}
          {selected ? (
            <div className="ws-deposit-detail">
              <div className="ws-deposit-state">
                {attention.has(selected.status) ? (
                  <AlertCircle aria-hidden="true" />
                ) : (
                  <CheckCircle aria-hidden="true" />
                )}
                <div>
                  <strong>{labels[selected.status]}</strong>
                  <p>{selected.message}</p>
                </div>
              </div>
              <div className="ws-detail-facts">
                <div>
                  <span>Requested payment</span>
                  <strong>
                    {usd(selected.amountCents)} {unit(selected)}
                  </strong>
                </div>
                <div>
                  <span>
                    {isLive(selected)
                      ? "Net credits"
                      : creditBilling
                        ? "Net sandbox credits"
                        : "Net test credits"}
                  </span>
                  <strong>
                    {netCredits(
                      selected.netCreditUnits,
                      creditBilling || isLive(selected),
                    )}
                  </strong>
                </div>
                <div>
                  <span>Refund reported</span>
                  <strong>{usd(selected.refundedCents)}</strong>
                </div>
                {!!selected.pendingRefundCents && (
                  <div>
                    <span>Refund in progress</span>
                    <strong>{usd(selected.pendingRefundCents)}</strong>
                  </div>
                )}
                <div>
                  <span>Last verified</span>
                  <strong>
                    {selected.lastCheckedAt
                      ? date(selected.lastCheckedAt)
                      : "Not checked"}
                  </strong>
                </div>
              </div>
              <div className="ws-receipt-id">
                <code>{selected.id}</code>
                <CopyButton text={selected.id} />
              </div>
              {selected.receiptUrl && (
                <a
                  className="ws-text-link"
                  href={selected.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Stripe receipt
                  <ArrowUpRight size={14} />
                </a>
              )}
              {selected.checkoutUrl && selected.status === "checkout_ready" && (
                <Button asChild>
                  <a
                    href={selected.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Continue to Stripe
                    <ArrowUpRight />
                  </a>
                </Button>
              )}
              {!selected.checkoutSessionId ? (
                <Button
                  disabled={busy || !summary?.stripe?.enabled}
                  onClick={() => void prepare(selected)}
                >
                  {busy ? "Preparing checkout…" : "Retry checkout"}
                  <RefreshCw01 />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      setSelected(
                        await api<StripeDeposit>(
                          `/account/funding/stripe/${selected.id}/reconcile`,
                          {},
                        ),
                      );
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {busy ? "Checking payment…" : "Check payment status"}
                  <RefreshCw01 />
                </Button>
              )}
              <p className="field-hint">
                Credits post once after server verification. If a payment is
                refunded or disputed, this receipt and the credit ledger retain
                the adjustment.
                {isLive(selected) && ` ${summary?.refundTerms ?? ""}`}
              </p>
            </div>
          ) : busy ? (
            <p role="status">Loading saved deposit…</p>
          ) : (
            <form
              className="ws-deposit-form"
              onSubmit={(e) => {
                e.preventDefault();
                void prepare();
              }}
            >
              <label>
                <span>{live ? "Amount in USD" : "Amount in test USD"}</span>
                <Input
                  aria-label="Card deposit amount"
                  inputMode="decimal"
                  required
                  value={amount}
                  disabled={busy}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    key.current = crypto.randomUUID();
                  }}
                />
                <small>$5–{maximum} · Up to two decimal places</small>
              </label>
              <p>
                Enter card details on Stripe. Two Hands never receives your card
                number.
                {live &&
                  ` This is a real card payment. ${summary?.refundTerms ?? ""}`}
              </p>
              <Button
                type="submit"
                disabled={busy || !summary?.stripe?.enabled}
              >
                Prepare checkout
                <ArrowRight />
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
