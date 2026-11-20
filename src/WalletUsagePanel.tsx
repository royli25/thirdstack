import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Download01 } from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { api, apiHeaders } from "./api";
import { CopyButton, Empty, InlineError, date } from "./observation-ui";
import { chargeOutcome, chargeReason, sandboxCredits } from "./funding-format";
import type { WalletActivityPage } from "../server/wallet";

const iso = (value: Date) => value.toISOString().slice(0, 10);

/**
 * What each paid tool call cost: provider cost, the 10% markup and the total
 * charged, or why nothing was charged. Refused calls are listed too, so the
 * owner can see when credits stopped an agent.
 */
export function WalletUsagePanel({
  live,
  refreshKey,
}: {
  live: boolean;
  /** Changes when the balance changes, so the table follows it. */
  refreshKey: string;
}) {
  const [days, setDays] = useState("30");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WalletActivityPage>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void api<WalletActivityPage>(
      `/account/funding/activity?days=${days}&page=${page}`,
    )
      .then((result) => {
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [days, page, refreshKey]);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <section className="ws-panel" id="tool-call-charges">
      <header>
        <div>
          <h2>Tool call charges</h2>
          <p>
            Each paid call with its provider cost, the 10% Two Hands markup and
            the amount charged. Calls that failed or were refused cost nothing.
          </p>
        </div>
        <Select
          value={days}
          onValueChange={(value) => {
            setDays(value);
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Charges date range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </header>
      <InlineError message={error} />
      {!data ? (
        !error && (
          <div className="ws-loading" role="status">
            Loading tool call charges…
          </div>
        )
      ) : data.items.length ? (
        <div
          className="ws-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Tool call charges"
        >
          <table className="ws-table">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Time</th>
                <th>Outcome</th>
                <th>Provider cost</th>
                <th>Markup (10%)</th>
                <th>Charged</th>
                <th>Call ID</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={item.callId ?? `${item.at}-${item.tool}-${index}`}>
                  <td>
                    <strong>{item.tool}</strong>
                    {item.count > 1 && ` × ${item.count}`}
                  </td>
                  <td>
                    <time dateTime={item.at}>{date(item.at)}</time>
                  </td>
                  <td>
                    <span
                      className={`ws-status ws-status-${item.outcome === "charged" ? "succeeded" : item.outcome === "in_progress" ? "running" : "failed"}`}
                    >
                      <span />
                      {chargeOutcome(item.outcome)}
                    </span>
                    {item.reason && (
                      <small className="ws-charge-reason">
                        {chargeReason(item.reason)}
                      </small>
                    )}
                  </td>
                  <td className="ws-mono">
                    {item.outcome === "charged" &&
                    item.providerCostMicros !== null
                      ? sandboxCredits(item.providerCostMicros)
                      : "—"}
                  </td>
                  <td className="ws-mono">
                    {item.outcome === "charged" && item.markupMicros !== null
                      ? sandboxCredits(item.markupMicros)
                      : "—"}
                  </td>
                  <td className="ws-mono">
                    <strong>
                      {item.outcome === "in_progress"
                        ? `${sandboxCredits(item.heldMicros)} held`
                        : sandboxCredits(item.chargedMicros)}
                    </strong>
                  </td>
                  <td>
                    {item.callId ? (
                      <span className="ws-charge-call">
                        <code>{item.callId.slice(0, 8)}…</code>
                        <CopyButton text={item.callId} />
                      </span>
                    ) : (
                      "Not run"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title="No paid tool calls in this period">
          Paid calls made by your agents will appear here with what each one was
          charged.
        </Empty>
      )}
      {data && pages > 1 && (
        <div className="ws-charge-pages">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ArrowLeft />
            Newer
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            Older
            <ArrowRight />
          </Button>
        </div>
      )}
      <div className="ws-panel-note">
        To see a call’s request and result, copy its call ID and search for it
        in{" "}
        <a className="ws-inline-link" href="#dashboard/activity">
          Activity
        </a>
        .{" "}
        {live
          ? "Amounts are in USD."
          : "Amounts are sandbox credits, not real money."}
      </div>
      <StatementExport live={live} />
    </section>
  );
}

/** Downloads a dated statement: opening balance, every posting, closing balance. */
function StatementExport({ live }: { live: boolean }) {
  const today = new Date();
  const [from, setFrom] = useState(
    iso(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))),
  );
  const [to, setTo] = useState(iso(today));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="ws-statement"
      aria-label="Statement export"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
          const response = await fetch(
            `/api/account/funding/statement?from=${from}&to=${to}`,
            { headers: apiHeaders(), signal: AbortSignal.timeout(60000) },
          );
          if (!response.ok)
            throw new Error(
              (await response.json().catch(() => ({}))).error ||
                `Statement could not be prepared (${response.status}).`,
            );
          const url = URL.createObjectURL(await response.blob());
          const link = document.createElement("a");
          link.href = url;
          link.download = `two-hands-${live ? "credits" : "sandbox-credits"}-${from}-to-${to}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <h3>Statement</h3>
        <p>
          Opening balance, every top-up, charge, refund and adjustment, and the
          closing balance for the dates you choose (UTC).
        </p>
      </div>
      <label>
        <span>From</span>
        <Input
          type="date"
          aria-label="Statement start date"
          value={from}
          max={to}
          required
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <label>
        <span>To</span>
        <Input
          type="date"
          aria-label="Statement end date"
          value={to}
          min={from}
          required
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
      <Button type="submit" variant="outline" disabled={busy}>
        <Download01 />
        {busy ? "Preparing…" : "Download CSV"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
