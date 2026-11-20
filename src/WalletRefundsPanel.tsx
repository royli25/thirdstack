import { useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw01 } from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Empty, InlineError, date } from "./observation-ui";
import type { StripeDeposit } from "../server/funding-types";
import type { StripeFundingStatus } from "../server/funding-types";
import type { OperatorAlert, RefundQuote } from "../server/wallet-operations";

type Admin = <T>(path: string, body?: unknown) => Promise<T>;
type Rails = {
  test: StripeFundingStatus;
  live: StripeFundingStatus;
  refundsEnabled: boolean;
};
const alertLabels: Record<string, string> = {
  unmatched_live_event: "Live Stripe event matched no account",
  refund_total_unverified: "Refund total could not be verified",
  rate_unverified:
    "Billing rate lapsed or no longer matches; billable calls are refused",
};
type Row = { payment: StripeDeposit; mode: "test" | "live"; account: string };
const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const modeLabel = (mode: "test" | "live") =>
  mode === "live" ? "Live" : "Sandbox";
const requestLabels = {
  reserved: "Reserved · outcome unknown",
  submitted: "Sent to Stripe",
  completed: "Refunded",
  failed: "Failed · credits returned",
};

/** Operator refunds of unused wallet credit, back to the card that paid. */
export function WalletRefundsPanel({ admin }: { admin: Admin }) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>();
  const [quote, setQuote] = useState<RefundQuote>();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const requestKey = useRef(crypto.randomUUID());
  const [alerts, setAlerts] = useState<OperatorAlert[]>([]);
  const [rails, setRails] = useState<Rails>();
  const [alertNotes, setAlertNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    void admin<{ items: OperatorAlert[] }>("/alerts")
      .then((data) => active && setAlerts(data.items))
      .catch(() => {});
    void admin<Rails>("/status")
      .then((data) => active && setRails(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [admin, refresh]);
  useEffect(() => {
    let active = true;
    void admin<{ items: Row[] }>(`/payments?q=${encodeURIComponent(query)}`)
      .then((data) => {
        if (active) {
          setRows(data.items);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [admin, query, refresh]);
  async function run(action: () => Promise<RefundQuote>) {
    setBusy(true);
    setDetailError("");
    try {
      setQuote(await action());
      requestKey.current = crypto.randomUUID();
      setRefresh((v) => v + 1);
    } catch (e) {
      setDetailError((e as Error).message);
      // The request may have been recorded even though Stripe did not answer.
      if (quote)
        await admin<RefundQuote>(`/refunds/${quote.payment.id}`)
          .then(setQuote)
          .catch(() => {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="ws-panel">
        <header>
          <div>
            <h2>Payment alerts</h2>
            <p>
              Conditions the server could not settle by itself. Resolving an
              alert records who handled it; it changes no balance.
            </p>
          </div>
        </header>
        {rails && (
          <div className="ws-panel-note">
            Live card payments:{" "}
            {rails.live.enabled
              ? "on"
              : `off · ${rails.live.unavailableReason}`}{" "}
            · Sandbox:{" "}
            {rails.test.enabled
              ? "on"
              : `off · ${rails.test.unavailableReason}`}{" "}
            · Refunds of unused credits: {rails.refundsEnabled ? "on" : "off"}
          </div>
        )}
        {alerts.length ? (
          <ol className="ws-dispute-history" aria-label="Payment alerts">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <strong>
                  {alertLabels[alert.kind] ?? alert.kind.replaceAll("_", " ")} ·{" "}
                  {modeLabel(alert.mode)}
                </strong>
                <p>
                  <code>{alert.reference}</code>
                  {alert.account ? ` · ${alert.account}` : ""} ·{" "}
                  {JSON.stringify(alert.detail)}
                </p>
                <small>{date(alert.createdAt)}</small>
                <div className="ws-dispute-controls">
                  <Input
                    aria-label={`Resolution note for ${alert.reference}`}
                    placeholder="What you checked and did…"
                    value={alertNotes[alert.id] ?? ""}
                    onChange={(e) =>
                      setAlertNotes((v) => ({
                        ...v,
                        [alert.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(alertNotes[alert.id] ?? "").trim().length < 10}
                    onClick={() =>
                      void admin<{ items: OperatorAlert[] }>(
                        `/alerts/${alert.id}/resolve`,
                        { note: alertNotes[alert.id] },
                      )
                        .then((data) => setAlerts(data.items))
                        .catch((e: Error) => setError(e.message))
                    }
                  >
                    Mark resolved
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <Empty title="No open payment alerts">
            Unmatched live events, refund totals that could not be verified and
            lapsed billing rates appear here.
          </Empty>
        )}
      </section>
      <section className="ws-panel">
        <header>
          <div>
            <h2>Wallet payments and refunds</h2>
            <p>
              Refund unused credits to the card that paid for them. The amount
              leaves the balance before Stripe is asked.
            </p>
          </div>
        </header>
        <InlineError message={error} />
        <div className="ws-dispute-controls">
          <Input
            aria-label="Search wallet payments"
            placeholder="Search payment, charge, or account…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant="outline" onClick={() => setRefresh((v) => v + 1)}>
            <RefreshCw01 />
            Refresh payments
          </Button>
        </div>
        {rows?.length ? (
          <div
            className="ws-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Wallet payments"
          >
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Account</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.payment.id}>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setAmount("");
                          setNote("");
                          setQuote(undefined);
                          void run(() =>
                            admin<RefundQuote>(`/refunds/${row.payment.id}`),
                          );
                        }}
                      >
                        Review refund
                        <ArrowRight />
                      </Button>
                      <small className="ws-dispute-subline">
                        {row.payment.id.slice(0, 8)}…
                      </small>
                    </td>
                    <td>{row.account}</td>
                    <td>
                      {usd(row.payment.amountCents)}{" "}
                      <Badge variant="outline">{modeLabel(row.mode)}</Badge>
                    </td>
                    <td>{row.payment.status.replaceAll("_", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No wallet payments">
            Verified payments that fund an account wallet appear here.
          </Empty>
        )}
        <Dialog
          open={!!quote}
          onOpenChange={(value) => {
            if (!value && !busy) setQuote(undefined);
          }}
        >
          <DialogContent className="ws-detail-dialog translate-x-0 translate-y-0">
            <DialogHeader>
              <DialogTitle>Refund unused credits</DialogTitle>
              <DialogDescription>
                {quote
                  ? `${modeLabel(quote.mode)} payment of ${usd(quote.payment.amountCents)}. Refunds return to the original card.`
                  : "Loading payment…"}
              </DialogDescription>
            </DialogHeader>
            <InlineError message={detailError} />
            {quote && (
              <div className="ws-deposit-detail">
                <div className="ws-detail-facts">
                  <div>
                    <span>Refundable from this payment</span>
                    <strong>{usd(quote.refundableCents)}</strong>
                  </div>
                  <div>
                    <span>Account available credits</span>
                    <strong>${(quote.availableMicros / 1e6).toFixed(4)}</strong>
                  </div>
                  <div>
                    <span>Already refunded</span>
                    <strong>{usd(quote.payment.refundedCents)}</strong>
                  </div>
                  <div>
                    <span>Policy</span>
                    <strong>{quote.policyVersion}</strong>
                  </div>
                </div>
                {!quote.refundsEnabled && (
                  <p className="ws-panel-note">
                    Refunds of unused credits are switched off on this server
                    until a refund policy is approved. This quote is for review
                    only.
                  </p>
                )}
                {quote.frozen && (
                  <p className="ws-panel-note">
                    This account has an unresolved payment dispute. Nothing can
                    be refunded until its hold is released.
                  </p>
                )}
                <form
                  className="ws-deposit-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(() =>
                      admin<RefundQuote>(`/refunds/${quote.payment.id}`, {
                        requestKey: requestKey.current,
                        amount,
                        note,
                      }),
                    );
                  }}
                >
                  <label>
                    <span>Refund amount in USD</span>
                    <Input
                      aria-label="Refund amount"
                      inputMode="decimal"
                      required
                      value={amount}
                      disabled={busy}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        requestKey.current = crypto.randomUUID();
                      }}
                    />
                  </label>
                  <label>
                    <span>Reason</span>
                    <Textarea
                      aria-label="Refund reason"
                      minLength={10}
                      maxLength={4000}
                      required
                      value={note}
                      disabled={busy}
                      onChange={(e) => {
                        setNote(e.target.value);
                        requestKey.current = crypto.randomUUID();
                      }}
                    />
                    <small>
                      Recorded with your account in the audit history. At least
                      10 characters.
                    </small>
                  </label>
                  <Button
                    type="submit"
                    disabled={
                      busy || !quote.refundsEnabled || !quote.refundableCents
                    }
                  >
                    {busy ? "Working…" : "Refund to card"}
                  </Button>
                </form>
                <h3>Refund requests</h3>
                {quote.requests.length ? (
                  <ol className="ws-dispute-history">
                    {quote.requests.map((r) => (
                      <li key={r.id}>
                        <strong>
                          {usd(r.amountCents)} · {requestLabels[r.status]}
                        </strong>
                        <p>{r.note}</p>
                        <small>
                          {date(r.createdAt)} · {r.actor}
                        </small>
                        {(r.status === "reserved" ||
                          r.status === "submitted") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              void run(() =>
                                admin<RefundQuote>(
                                  `/refund-requests/${r.id}/resolve`,
                                  {},
                                ),
                              )
                            }
                          >
                            Check with Stripe
                          </Button>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No refunds requested for this payment.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </section>
    </>
  );
}
