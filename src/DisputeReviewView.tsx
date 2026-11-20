import { useAccount } from "./AccountGate";
import { apiHeaders } from "./api";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, RefreshCw01, ShieldTick } from "@untitledui/icons";
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
import { CopyButton, Empty, InlineError, date } from "./observation-ui";
import { WalletRefundsPanel } from "./WalletRefundsPanel";
import { WalletAdjustmentsPanel } from "./WalletAdjustmentsPanel";
import "./user-dashboard.css";
import type {
  DisputeReviewDetail,
  DisputeReviewQueue,
  DisputeReviewStatus,
} from "../server/dispute-review";
const labels: Record<DisputeReviewStatus, string> = {
  needs_review: "Needs review",
  in_review: "In review",
  reviewed: "Reviewed · hold retained",
};
const usd = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const unit = (payment: { mode?: "test" | "live" }) =>
  payment.mode === "live" ? "USD" : "test USD";
export function DisputeReviewView() {
  const account = useAccount();
  const accountAccess = account.enabled && !!account.profile?.isAdmin;
  const [token, setToken] = useState("");
  const [draftToken, setDraftToken] = useState("");
  const [queue, setQueue] = useState<DisputeReviewQueue>();
  const [detail, setDetail] = useState<DisputeReviewDetail>();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<DisputeReviewStatus>("in_review");
  const [conflict, setConflict] = useState(false);
  const epoch = useRef(0);
  const requestKey = useRef(crypto.randomUUID());
  const releaseKey = useRef(crypto.randomUUID());
  const lock = useCallback((message = "") => {
    epoch.current++;
    setToken("");
    setDraftToken("");
    setQueue(undefined);
    setDetail(undefined);
    setNote("");
    setStatus("in_review");
    setFilter("all");
    setQuery("");
    setPage(1);
    setError(message);
    setDetailError("");
    setConflict(false);
    setBusy(false);
    setLoading(false);
    requestKey.current = crypto.randomUUID();
  }, []);
  const admin = useCallback(
    async <T,>(path: string, body?: unknown): Promise<T> => {
      const sessionEpoch = epoch.current;
      const response = await fetch(`/api/admin/funding${path}`, {
        headers: {
          ...(account.enabled
            ? apiHeaders()
            : { Authorization: "Bearer " + token }),
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(body !== undefined
          ? { method: "POST", body: JSON.stringify(body) }
          : {}),
      });
      const data = await response
        .json()
        .catch(() => ({ error: "Admin request failed." }));
      if (
        (response.status === 401 ||
          response.status === 403 ||
          response.status === 503) &&
        sessionEpoch === epoch.current
      )
        lock(data.error);
      if (!response.ok)
        throw Object.assign(new Error(data.error || "Admin request failed."), {
          status: response.status,
        });
      return data;
    },
    [token, lock, account.enabled],
  );
  useEffect(() => {
    if (!token && !accountAccess) return;
    let active = true;
    setLoading(true);
    setError("");
    void admin<DisputeReviewQueue>(
      `/disputes?status=${filter}&q=${encodeURIComponent(query)}&page=${page}`,
    )
      .then((data) => {
        if (active) setQueue(data);
      })
      .catch((e: Error & { status?: number }) => {
        if (active) {
          setError(e.message);
          if (e.status === 401 || e.status === 403 || e.status === 503)
            setQueue(undefined);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [admin, token, accountAccess, filter, query, page, refresh]);
  useEffect(
    () => () => {
      epoch.current++;
    },
    [],
  );
  async function open(id: string) {
    const current = epoch.current;
    setBusy(true);
    setError("");
    try {
      const result = await admin<DisputeReviewDetail>(`/disputes/${id}`);
      if (current === epoch.current) {
        setDetail(result);
        setNote(result.item.note);
        setStatus(
          result.item.reviewStatus === "needs_review"
            ? "in_review"
            : result.item.reviewStatus,
        );
        setDetailError("");
        setConflict(false);
        requestKey.current = crypto.randomUUID();
      }
    } catch (e) {
      if (current === epoch.current) setError((e as Error).message);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  async function reload(verify = false) {
    if (!detail) return;
    const current = epoch.current;
    setBusy(true);
    setDetailError("");
    try {
      const result = await admin<DisputeReviewDetail>(
        `/disputes/${detail.item.payment.id}${verify ? "/recheck" : ""}`,
        verify ? {} : undefined,
      );
      if (current === epoch.current) {
        setDetail(result);
        setConflict(false);
        requestKey.current = crypto.randomUUID();
        if (result.item.evidenceChanged) setStatus("in_review");
        setRefresh((v) => v + 1);
      }
    } catch (e) {
      if (current === epoch.current) setDetailError((e as Error).message);
    } finally {
      if (current === epoch.current) setBusy(false);
    }
  }
  return (
    <div className="tool-workspace dispute-review">
      <div className="page-heading ws-page-heading">
        <div>
          <h1>Payment disputes</h1>
          <p>
            Review disputed payments, release holds once Stripe closes a
            dispute, and refund unused credits.
          </p>
        </div>
        <Badge variant="outline">Admin</Badge>
      </div>
      <div className="ws-funding-notice">
        <ShieldTick size={18} />
        <p>
          Marking a case reviewed keeps the customer’s credits on hold. Stripe
          determines the dispute outcome; a hold can be released only after
          Stripe has closed the dispute.
        </p>
      </div>
      <InlineError message={error} />
      {!queue && account.enabled ? (
        <section className="ws-panel">
          <header>
            <div>
              <h2>
                {accountAccess
                  ? "Dispute queue"
                  : "Administrator access required"}
              </h2>
              <p>
                {accountAccess
                  ? "Loading payment disputes…"
                  : "This account is not authorized for payment review."}
              </p>
            </div>
          </header>
          {accountAccess && (
            <Button variant="outline" onClick={() => setRefresh((v) => v + 1)}>
              Retry queue
            </Button>
          )}
        </section>
      ) : !queue ? (
        <section className="ws-panel">
          <header>
            <div>
              <h2>Admin access</h2>
              <p>
                Use the separate admin credential. It stays in memory while this
                page is open.
              </p>
            </div>
          </header>
          <form
            className="ws-deposit-form"
            style={{ padding: 20, maxWidth: 520 }}
            onSubmit={(e) => {
              e.preventDefault();
              epoch.current++;
              setToken(draftToken);
              setDraftToken("");
              setRefresh((v) => v + 1);
            }}
          >
            <label>
              <span>Admin access token</span>
              <Input
                type="password"
                autoComplete="off"
                aria-label="Admin access token"
                value={draftToken}
                onChange={(e) => setDraftToken(e.target.value)}
                required
              />
            </label>
            <Button type="submit" disabled={loading}>
              {loading ? "Connecting…" : "Open dispute queue"}
              <ArrowRight />
            </Button>
          </form>
        </section>
      ) : (
        <>
          <div className="ws-dispute-controls">
            <label>
              <span>Review status</span>
              <select
                aria-label="Dispute review status"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All reviews</option>
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label} ({queue.counts[value as DisputeReviewStatus]})
                  </option>
                ))}
              </select>
            </label>
            <Input
              aria-label="Search disputed payments"
              placeholder="Search receipt, charge, or note…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => setRefresh((v) => v + 1)}
            >
              <RefreshCw01 />
              Refresh queue
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                lock();
              }}
            >
              Lock admin access
            </Button>
          </div>
          <section className="ws-panel">
            <header>
              <div>
                <h2>Disputed payments</h2>
                <p>{queue.total} matching cases · Credit holds remain active</p>
              </div>
              {loading && <span role="status">Refreshing…</span>}
            </header>
            {queue.items.length ? (
              <div
                className="ws-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Dispute queue"
              >
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Payment</th>
                      <th>Amount</th>
                      <th>Review</th>
                      <th>Last verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.items.map((c) => (
                      <tr key={c.payment.id}>
                        <td>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => void open(c.payment.id)}
                          >
                            Review payment
                            <ArrowRight />
                          </Button>
                          <small className="ws-dispute-subline">
                            {c.payment.id.slice(0, 8)}…
                          </small>
                          <small className="ws-dispute-subline">
                            {c.payment.chargeId}
                          </small>
                        </td>
                        <td>
                          {usd(c.payment.amountCents)} {unit(c.payment)}
                        </td>
                        <td>
                          {labels[c.reviewStatus]}
                          {c.evidenceChanged && (
                            <small className="ws-dispute-subline">
                              Evidence changed
                            </small>
                          )}
                        </td>
                        <td>
                          {c.payment.lastCheckedAt
                            ? date(c.payment.lastCheckedAt)
                            : "Not checked"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No matching disputes" icon={ShieldTick}>
                Disputed Stripe payments appear here after server verification.
              </Empty>
            )}
            <div className="ws-dispute-pagination">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((v) => v - 1)}
              >
                Previous
              </Button>
              <span>Page {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * queue.pageSize >= queue.total || loading}
                onClick={() => setPage((v) => v + 1)}
              >
                Next
              </Button>
            </div>
          </section>
          <WalletRefundsPanel admin={admin} />
          <WalletAdjustmentsPanel admin={admin} />
        </>
      )}
      <Dialog
        open={!!detail}
        onOpenChange={(value) => {
          if (!value && !busy) setDetail(undefined);
        }}
      >
        <DialogContent className="ws-detail-dialog translate-x-0 translate-y-0">
          <DialogHeader>
            <DialogTitle>Dispute review</DialogTitle>
            <DialogDescription>
              Saved Stripe payment evidence and separate admin review history.
              {detail?.item.payment.mode === "live"
                ? " This is a real-money payment."
                : " This payment is in test mode."}
            </DialogDescription>
          </DialogHeader>
          <InlineError message={detailError} />
          {detail && (
            <div className="ws-deposit-detail">
              <div className="ws-deposit-state">
                <ShieldTick />
                <div>
                  <strong>
                    {detail.item.payment.disputeResolution
                      ? "Dispute hold released"
                      : "Credit hold retained"}
                  </strong>
                  <p>{detail.item.payment.message}</p>
                </div>
              </div>
              {detail.item.evidenceChanged && (
                <p className="ws-panel-note">
                  Payment evidence changed since the saved review. This case
                  needs review again; previous decisions remain in the audit
                  history.
                </p>
              )}
              <div className="ws-receipt-id">
                <code>{detail.item.payment.id}</code>
                <CopyButton text={detail.item.payment.id} />
              </div>
              <div className="ws-detail-facts">
                <div>
                  <span>Payment</span>
                  <strong>
                    {usd(detail.item.payment.amountCents)}{" "}
                    {unit(detail.item.payment)}
                  </strong>
                </div>
                <div>
                  <span>Reported refund</span>
                  <strong>{usd(detail.item.payment.refundedCents)}</strong>
                </div>
                <div>
                  <span>Current net credits</span>
                  <strong>
                    {(detail.item.payment.netCreditUnits / 1e6).toFixed(2)}
                  </strong>
                </div>
                <div>
                  <span>Last verified</span>
                  <strong>
                    {detail.item.payment.lastCheckedAt
                      ? date(detail.item.payment.lastCheckedAt)
                      : "Not checked"}
                  </strong>
                </div>
              </div>
              <div className="ws-funding-details">
                <div>
                  <span>Payment intent</span>
                  <code>{detail.item.payment.paymentIntentId}</code>
                </div>
                <div>
                  <span>Charge</span>
                  <code>{detail.item.payment.chargeId}</code>
                </div>
                <div>
                  <span>Saved review</span>
                  <strong>
                    {labels[detail.item.reviewStatus]} · Revision{" "}
                    {detail.item.revision}
                  </strong>
                </div>
              </div>
              <div className="ws-dispute-controls">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void reload()}
                >
                  Refresh saved case
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void reload(true)}
                >
                  <RefreshCw01 />
                  Verify Stripe status
                </Button>
              </div>
              <form
                className="ws-deposit-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const current = epoch.current;
                  setBusy(true);
                  setDetailError("");
                  try {
                    const result = await admin<DisputeReviewDetail>(
                      `/disputes/${detail.item.payment.id}/review`,
                      {
                        requestKey: requestKey.current,
                        revision: detail.item.revision,
                        evidenceFingerprint: detail.item.evidenceFingerprint,
                        status,
                        note,
                      },
                    );
                    if (current === epoch.current) {
                      setDetail(result);
                      setNote(result.item.note);
                      requestKey.current = crypto.randomUUID();
                      setRefresh((v) => v + 1);
                    }
                  } catch (e) {
                    if (current === epoch.current) {
                      setDetailError((e as Error).message);
                      if ((e as { status?: number }).status === 409)
                        setConflict(true);
                    }
                  } finally {
                    if (current === epoch.current) setBusy(false);
                  }
                }}
              >
                <label>
                  <span>Review decision</span>
                  <select
                    aria-label="Review decision"
                    value={status}
                    disabled={busy}
                    onChange={(e) => {
                      setStatus(e.target.value as DisputeReviewStatus);
                      requestKey.current = crypto.randomUUID();
                    }}
                  >
                    {Object.entries(labels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Review note</span>
                  <Textarea
                    aria-label="Dispute review note"
                    value={note}
                    minLength={10}
                    maxLength={4000}
                    required
                    disabled={busy}
                    onChange={(e) => {
                      setNote(e.target.value);
                      requestKey.current = crypto.randomUUID();
                    }}
                  />
                  <small>
                    Record the evidence checked and the reason for this
                    decision. At least 10 characters.
                  </small>
                </label>
                <Button type="submit" disabled={busy || conflict}>
                  {busy ? "Saving…" : "Save review · retain hold"}
                </Button>
              </form>
              {!detail.item.payment.disputeResolution && (
                <div className="ws-deposit-form">
                  <p className="field-hint">
                    Releasing the hold lifts the freeze on this account’s paid
                    tools. It works only after Stripe has closed the dispute.
                    Credits are restored if Stripe reinstated the payment, and
                    not if the dispute was lost. The note above is saved with
                    the release.
                  </p>
                  <Button
                    variant="outline"
                    disabled={busy || note.trim().length < 10}
                    onClick={async () => {
                      const current = epoch.current;
                      setBusy(true);
                      setDetailError("");
                      try {
                        const result = await admin<{
                          detail: DisputeReviewDetail;
                        }>(`/disputes/${detail.item.payment.id}/release`, {
                          requestKey: releaseKey.current,
                          note,
                        });
                        if (current === epoch.current) {
                          setDetail(result.detail);
                          releaseKey.current = crypto.randomUUID();
                          setRefresh((v) => v + 1);
                        }
                      } catch (e) {
                        if (current === epoch.current)
                          setDetailError((e as Error).message);
                      } finally {
                        if (current === epoch.current) setBusy(false);
                      }
                    }}
                  >
                    Release dispute hold
                  </Button>
                </div>
              )}
              <h3>Review audit history</h3>
              {detail.history.length ? (
                <ol className="ws-dispute-history">
                  {detail.history.map((event) => (
                    <li key={event.id}>
                      <strong>
                        {labels[event.status]} · Revision {event.revision}
                      </strong>
                      <p>{event.note}</p>
                      <small>
                        {date(event.createdAt)} · {event.actor}
                      </small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No admin decisions recorded yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
