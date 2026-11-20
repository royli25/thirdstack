import { useContext, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Plus,
  RefreshCw01,
} from "@untitledui/icons";
import { StripeFundingPanel } from "./StripeFundingPanel";
import { WalletUsagePanel } from "./WalletUsagePanel";
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
import { CustomerFunding } from "./customer-funding";
import { CopyButton, Empty, InlineError, date } from "./observation-ui";
import type { DepositIntent } from "../server/funding-types";
import "./funding.css";

import {
  creditChange,
  ledgerReason,
  postingLabel,
  sandboxCredits,
  spendableBalance,
  testUsdc,
} from "./funding-format";
export { testUsdc } from "./funding-format";
const statuses: Record<DepositIntent["status"], string> = {
  awaiting_transfer: "Awaiting transfer",
  pending: "Pending",
  awaiting_finality: "Awaiting finality",
  credited: "Credited",
  rejected: "Needs attention",
  expired: "Window expired",
};

export function FundingView() {
  const { summary, error, loading, refresh, focusPaymentMethods } =
    useContext(CustomerFunding);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();
  const [amount, setAmount] = useState("10");
  const [sender, setSender] = useState("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const key = useRef(crypto.randomUUID());
  const paymentMethods = useRef<HTMLDivElement>(null);
  const selected = summary?.intents.find((i) => i.id === selectedId);
  useEffect(() => {
    if (focusPaymentMethods && !loading) paymentMethods.current?.focus();
  }, [focusPaymentMethods, loading]);
  function show(intent: DepositIntent) {
    setSelectedId(intent.id);
    setHash(intent.transactionHash ?? "");
    setFormError("");
    setOpen(true);
  }
  const instructions = summary?.network;
  // A live account pays with real money. It sees its wallet and card payments
  // only; the test-credit balance, on-chain test deposits and their ledger are
  // sandbox features and are not shown.
  const live =
    summary?.stripe?.mode === "live" || summary?.wallet?.mode === "live";
  // An account on credit billing has one spendable balance: its prepaid
  // credits. Test credits it collected earlier pay for nothing, so they are
  // kept out of the way instead of sitting beside the real balance.
  const creditBilling = !!summary && spendableBalance(summary).wallet;
  const [legacyOpen, setLegacyOpen] = useState(false);
  const showLegacy = !live && (!creditBilling || legacyOpen);
  const hasLegacy =
    !!summary &&
    (summary.balanceUnits > 0 ||
      !!summary.intents.length ||
      !!summary.entries?.length);
  return (
    <div className="ws-funding">
      <InlineError message={error} />
      {live ? (
        <div className="ws-funding-notice">
          <Badge variant="outline">
            {summary?.stripe?.enabled ? "Card payments" : "Top-ups paused"}
          </Badge>
          <p>
            {summary?.stripe?.enabled
              ? "Top-ups are real card payments processed by Stripe. Verified payments add prepaid credits that pay for this account’s tool calls."
              : "Card top-ups are paused. Your credits and payment history are kept."}{" "}
            {summary?.refundTerms}
          </p>
        </div>
      ) : creditBilling ? (
        <div className="ws-funding-notice">
          <Badge variant="outline">Sandbox credits</Badge>
          <p>
            This account’s paid tool calls are paid from its sandbox credits.{" "}
            {summary?.stripe?.enabled
              ? "Top-ups are Stripe test payments. No real money is taken."
              : (summary?.stripe?.blocked &&
                  summary.stripe.unavailableReason) ||
                "Top-ups are unavailable right now. Your sandbox credits are kept."}
          </p>
        </div>
      ) : (
        <div className="ws-funding-notice">
          <Badge variant="outline">
            {summary?.enabled || summary?.stripe?.enabled
              ? "Sandbox only"
              : "Payments disabled"}
          </Badge>
          <p>
            {summary?.enabled || summary?.stripe?.enabled
              ? "Stripe test payments and Base Sepolia USDC add test credits only. Test credits do not pay for live tool calls. No real-money deposits are accepted."
              : "Payments are disabled. You can connect an agent without making a deposit. Test credits are separate from live tool usage. No real-money deposits are accepted."}
          </p>
        </div>
      )}
      {loading ? (
        <div className="ws-loading" role="status">
          Loading deposit history…
        </div>
      ) : (
        <>
          <div
            id="test-funding-options"
            ref={paymentMethods}
            className="ws-funding-grid"
            role="group"
            aria-label={
              creditBilling ? "Credit top-up options" : "Test funding options"
            }
            tabIndex={-1}
          >
            {!creditBilling && (
              <section className="ws-panel ws-balance-card">
                <span>Your test balance</span>
                <strong>
                  {summary ? testUsdc(summary.balanceUnits) : "—"}
                  <small>test credits</small>
                </strong>
                <p>
                  {summary?.totalDeposits ?? 0} verified deposits · Separate
                  from estimated tool usage
                </p>
              </section>
            )}
            {creditBilling && summary?.wallet && (
              <section className="ws-panel ws-balance-card">
                <span>Available credits</span>
                <strong>
                  {sandboxCredits(summary.wallet.availableMicros)}
                  <small>{live ? "USD" : "sandbox"}</small>
                </strong>
                <p>
                  Held for in-progress calls:{" "}
                  {sandboxCredits(summary.wallet.heldMicros)} · Charged for tool
                  calls: {sandboxCredits(summary.wallet.chargedMicros)}
                  {summary.wallet.frozen
                    ? " · Paid tools are paused while a payment is under review"
                    : !summary.wallet.enforced
                      ? " · Credit billing is paused; your balance is kept"
                      : ""}
                </p>
                {summary.wallet.enforced &&
                  !!summary.wallet.callHoldMicros &&
                  summary.wallet.callsRemaining !== null &&
                  summary.wallet.callsRemaining !== undefined && (
                    <p>
                      A paid call needs{" "}
                      {sandboxCredits(summary.wallet.callHoldMicros)} available.
                      Your credits cover about{" "}
                      {summary.wallet.callsRemaining.toLocaleString("en-US")}{" "}
                      more.
                    </p>
                  )}
              </section>
            )}
            {!creditBilling && (
              <section className="ws-panel ws-funding-method">
                <header>
                  <div>
                    <h2>USDC on Base Sepolia</h2>
                    <p>Verified on-chain deposits</p>
                  </div>
                  <Badge variant="outline">
                    {summary?.enabled ? "Available" : "Unavailable"}
                  </Badge>
                </header>
                <div>
                  <p>
                    {summary?.enabled
                      ? "Send an exact amount from your wallet, submit the transaction hash, and check its status. Test credits are added once the matching transfer reaches the network’s finalized block."
                      : "Test deposits are not enabled for this service. You can continue setting up your agent without adding credits."}
                  </p>
                  {!summary?.enabled && (
                    <div className="ws-funding-setup">
                      <strong>On-chain deposits are unavailable</strong>
                      <p>
                        No wallet setup or transfer is needed. Deposits will be
                        available when Two Hands enables this payment method.
                      </p>
                    </div>
                  )}
                  <Button
                    disabled={!summary?.enabled}
                    onClick={() => {
                      key.current = crypto.randomUUID();
                      setSelectedId(undefined);
                      setFormError("");
                      setOpen(true);
                    }}
                  >
                    <Plus />
                    Add test credits
                  </Button>
                  {summary?.enabled && (
                    <>
                      <br />
                      <a
                        href="https://faucet.circle.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Get test USDC
                        <ArrowUpRight size={14} />
                      </a>
                    </>
                  )}
                </div>
              </section>
            )}
            <StripeFundingPanel
              summary={summary}
              refresh={refresh}
              creditBilling={creditBilling}
            />
          </div>
          {creditBilling && summary?.wallet && (
            <WalletUsagePanel
              live={live}
              refreshKey={`${summary.wallet.postedMicros}|${summary.wallet.heldMicros}`}
            />
          )}
          {creditBilling && (
            <section className="ws-panel">
              <header>
                <div>
                  <h2>Credit activity</h2>
                  <p>
                    Top-ups, tool call charges, refunds and adjustments, newest
                    first.
                  </p>
                </div>
              </header>
              {summary?.walletEntries?.length ? (
                <div
                  className="ws-table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Credit activity"
                >
                  <table className="ws-table">
                    <thead>
                      <tr>
                        <th>Change</th>
                        <th>Reason</th>
                        <th>Recorded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.walletEntries.map((entry, index) => (
                        <tr key={`${entry.createdAt}-${index}`}>
                          <td>
                            <strong>{creditChange(entry.micros)}</strong>
                          </td>
                          <td>{postingLabel(entry.kind)}</td>
                          <td>{date(entry.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No credit activity yet">
                  Your first verified top-up will appear here.
                </Empty>
              )}
              <div className="ws-panel-note">
                Each tool call is charged its verified provider cost plus 10%.{" "}
                {live
                  ? "Each card payment has a Stripe receipt under Card payments."
                  : "Each card top-up is listed under Card deposit history."}
              </div>
            </section>
          )}
          {creditBilling && !live && hasLegacy && (
            <section className="ws-panel ws-legacy-credits">
              <header>
                <div>
                  <h2>Earlier test credits</h2>
                  <p>
                    {testUsdc(summary?.balanceUnits ?? 0)} test credits from
                    before credit billing was turned on for this account. They
                    are kept for your records and do not pay for tool calls.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  aria-expanded={legacyOpen}
                  onClick={() => setLegacyOpen(!legacyOpen)}
                >
                  {legacyOpen
                    ? "Hide test credit history"
                    : "Show test credit history"}
                </Button>
              </header>
            </section>
          )}
          {showLegacy && (summary?.enabled || !!summary?.intents.length) && (
            <section className="ws-panel">
              <header>
                <div>
                  <h2>On-chain deposit history</h2>
                  <p>Saved requests and verified test credits.</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Refresh deposits"
                  onClick={() => void refresh()}
                >
                  <RefreshCw01 />
                </Button>
              </header>
              {summary?.intents.length ? (
                <div
                  className="ws-table-scroll"
                  tabIndex={0}
                  role="region"
                  aria-label="Deposit history"
                >
                  <table className="ws-table">
                    <thead>
                      <tr>
                        <th>Amount</th>
                        <th>Network</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Receipt</th>
                        <th>
                          <span className="sr-only">Inspect</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.intents.map((intent) => (
                        <tr key={intent.id}>
                          <td>
                            <strong>{testUsdc(intent.amountUnits)}</strong> test
                            USDC
                          </td>
                          <td>Base Sepolia</td>
                          <td>
                            <span
                              className={`ws-status ws-status-${intent.status === "credited" ? "succeeded" : intent.status === "rejected" ? "failed" : "running"}`}
                            >
                              <span />
                              {statuses[intent.status]}
                            </span>
                          </td>
                          <td>{date(intent.createdAt)}</td>
                          <td>
                            {intent.transactionHash ? (
                              <a
                                className="ws-text-link"
                                href={`${instructions?.explorer}/tx/${intent.transactionHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {intent.transactionHash.slice(0, 8)}…
                                {intent.transactionHash.slice(-6)}
                                <ArrowUpRight size={12} />
                              </a>
                            ) : (
                              "Awaiting transaction"
                            )}
                          </td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => show(intent)}
                            >
                              View deposit
                              <ArrowRight />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title="No deposits yet">
                  Create a test deposit request to validate the funding flow on
                  Base Sepolia.
                </Empty>
              )}
              <div className="ws-panel-note">
                Each on-chain transaction can be credited once. Request retries
                reuse the original receipt.
              </div>
            </section>
          )}
          {showLegacy &&
            (summary?.enabled ||
              summary?.stripe?.enabled ||
              !!summary?.entries?.length) && (
              <section className="ws-panel">
                <header>
                  <div>
                    <h2>Credit ledger</h2>
                    <p>
                      Verified deposits, refunds, and dispute holds across both
                      methods.
                    </p>
                  </div>
                </header>
                {summary?.entries?.length ? (
                  <div
                    className="ws-table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Credit ledger"
                  >
                    <table className="ws-table">
                      <thead>
                        <tr>
                          <th>Change</th>
                          <th>Method</th>
                          <th>Reason</th>
                          <th>Recorded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td>
                              <strong>
                                {entry.deltaUnits > 0 ? "+" : "−"}
                                {testUsdc(Math.abs(entry.deltaUnits))}
                              </strong>{" "}
                              test credits
                            </td>
                            <td>
                              {entry.source === "stripe"
                                ? "Stripe"
                                : "USDC on Base Sepolia"}
                            </td>
                            <td>{ledgerReason(entry.kind)}</td>
                            <td>{date(entry.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty title="No credit entries yet">
                    A verified deposit will create its first credit receipt
                    here.
                  </Empty>
                )}
                <div className="ws-panel-note">
                  One test USD or one test USDC equals one test credit. This
                  ledger is separate from provider spending authorization.
                </div>
              </section>
            )}
          {showLegacy && (summary?.enabled || !!summary?.intents.length) && (
            <section className="ws-panel">
              <header>
                <div>
                  <h2>Network details</h2>
                  <p>Only this network and USDC contract are accepted.</p>
                </div>
              </header>
              <div className="ws-funding-details">
                <div>
                  <span>Network</span>
                  <strong>
                    Base Sepolia · Chain ID {instructions?.chainId}
                  </strong>
                </div>
                <div>
                  <span>Token contract</span>
                  <code>{instructions?.tokenAddress}</code>
                  {instructions && (
                    <CopyButton text={instructions.tokenAddress} />
                  )}
                </div>
                <div>
                  <span>Receiving address</span>
                  <code>{summary?.recipient ?? "Not configured"}</code>
                  {summary?.recipient && (
                    <CopyButton text={summary.recipient} />
                  )}
                </div>
                <div>
                  <span>Verification</span>
                  <strong>
                    Successful USDC transfer, matching wallet and amount,
                    canonical block, and network finality
                  </strong>
                </div>
              </div>
            </section>
          )}
        </>
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
              {selectedId ? "Test deposit details" : "Add test credits"}
            </DialogTitle>
            <DialogDescription>
              USDC on Base Sepolia only. These tokens have no financial value.
            </DialogDescription>
          </DialogHeader>
          <InlineError message={formError} />
          {!selectedId ? (
            <form
              className="ws-deposit-form"
              onSubmit={async (event) => {
                event.preventDefault();
                setBusy(true);
                setFormError("");
                try {
                  const intent = await api<DepositIntent>(
                    "/account/funding/deposits",
                    { requestKey: key.current, amount, sender },
                  );
                  await refresh();
                  setSelectedId(intent.id);
                  setHash("");
                } catch (e) {
                  setFormError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                <span>Amount in test USDC</span>
                <Input
                  aria-label="Deposit amount"
                  inputMode="decimal"
                  value={amount}
                  required
                  disabled={busy}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    key.current = crypto.randomUUID();
                  }}
                />
                <small>1–1,000 test USDC · Up to six decimal places</small>
              </label>
              <label>
                <span>Sending wallet address</span>
                <Input
                  aria-label="Sending wallet address"
                  placeholder="0x…"
                  value={sender}
                  required
                  minLength={42}
                  maxLength={42}
                  disabled={busy}
                  onChange={(e) => {
                    setSender(e.target.value);
                    key.current = crypto.randomUUID();
                  }}
                />
                <small>Public address of the wallet sending the USDC.</small>
              </label>
              <Button type="submit" disabled={busy || !summary?.enabled}>
                {busy ? "Creating request…" : "Create deposit request"}
                <ArrowRight />
              </Button>
            </form>
          ) : selected ? (
            <div className="ws-deposit-detail">
              <div className="ws-deposit-state">
                {selected.status === "credited" ? <CheckCircle /> : <Clock />}
                <div>
                  <strong>{statuses[selected.status]}</strong>
                  <p>{selected.message}</p>
                </div>
              </div>
              <div className="ws-detail-facts">
                <div>
                  <span>Exact amount</span>
                  <strong>{testUsdc(selected.amountUnits)} test USDC</strong>
                </div>
                <div>
                  <span>Transfer window ends</span>
                  <strong>{date(selected.expiresAt)}</strong>
                </div>
              </div>
              <h3>Send test USDC to this address</h3>
              <div className="ws-receipt-id">
                <code>{selected.recipient}</code>
                <CopyButton text={selected.recipient} />
              </div>
              <p>
                Use Base Sepolia and the exact amount above. Send from{" "}
                <code className="ws-wrap-address">{selected.sender}</code>.
                You’ll need test ETH for gas. Two Hands does not sign or send
                the transfer.
              </p>
              {selected.status !== "credited" ? (
                <form
                  className="ws-deposit-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setBusy(true);
                    setFormError("");
                    try {
                      await api<DepositIntent>(
                        `/account/funding/deposits/${selected.id}/verify`,
                        { transactionHash: hash },
                      );
                      await refresh();
                    } catch (e) {
                      setFormError((e as Error).message);
                      await refresh();
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    <span>Transaction hash</span>
                    <Input
                      aria-label="Deposit transaction hash"
                      placeholder="0x…"
                      minLength={66}
                      maxLength={66}
                      value={hash}
                      required
                      disabled={busy}
                      onChange={(e) => setHash(e.target.value)}
                    />
                  </label>
                  <Button
                    type="submit"
                    disabled={busy || !hash.trim() || !summary?.enabled}
                  >
                    {busy
                      ? "Verifying…"
                      : selected.transactionHash
                        ? "Check transaction again"
                        : "Verify transaction"}
                    <RefreshCw01 />
                  </Button>
                  <p className="field-hint">
                    Transfers must be mined within the 30-minute request window.
                    Finality may take longer; you can verify the same transfer
                    afterward.
                  </p>
                </form>
              ) : (
                <>
                  <div className="ws-funding-success">
                    <CheckCircle />
                    {testUsdc(selected.amountUnits)} test USDC added to your
                    balance.
                  </div>
                  <a
                    className="ws-text-link"
                    href={`${instructions?.explorer}/tx/${selected.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Base Sepolia explorer
                    <ArrowUpRight />
                  </a>
                </>
              )}
              <div className="ws-panel-note">
                Request <code>{selected.id}</code>
              </div>
            </div>
          ) : (
            <div role="status">Loading deposit request…</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
