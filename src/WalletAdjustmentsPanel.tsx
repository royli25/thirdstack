import { useEffect, useRef, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Badge } from "./components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Empty, InlineError, date } from "./observation-ui";
import { creditChange, sandboxCredits } from "./funding-format";
import type {
  AdjustableAccount,
  AdjustmentResult,
  WalletAdjustment,
} from "../server/wallet-operations";

type Admin = <T>(path: string, body?: unknown) => Promise<T>;
type Mode = "test" | "live";
const modeLabel = (mode: Mode) => (mode === "live" ? "Live" : "Sandbox");

/**
 * Operator balance adjustments. The operator picks the account and the mode
 * every time; nothing defaults to sandbox or to live. Each adjustment is
 * recorded with the administrator and the note.
 */
export function WalletAdjustmentsPanel({ admin }: { admin: Admin }) {
  const [accounts, setAccounts] = useState<AdjustableAccount[]>();
  const [items, setItems] = useState<WalletAdjustment[]>([]);
  const [accountId, setAccountId] = useState("");
  const [mode, setMode] = useState<Mode | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [refresh, setRefresh] = useState(0);
  const requestKey = useRef(crypto.randomUUID());
  useEffect(() => {
    let active = true;
    void admin<{ accounts: AdjustableAccount[]; items: WalletAdjustment[] }>(
      "/adjustments",
    )
      .then((data) => {
        if (active) {
          setAccounts(data.accounts);
          setItems(data.items);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [admin, refresh]);
  const account = accounts?.find((a) => a.accountId === accountId);
  const balance = account?.balances.find((b) => b.mode === mode);
  const valid =
    !!account &&
    !!mode &&
    /^-?(?:0|[1-9]\d{0,2})(?:\.\d{1,6})?$/.test(amount) &&
    Number(amount) !== 0 &&
    note.trim().length >= 10;
  // A changed form is a new request; a retry of the same form is not.
  const changed = () => {
    requestKey.current = crypto.randomUUID();
    setDone("");
  };
  return (
    <section className="ws-panel" id="wallet-adjustments">
      <header>
        <div>
          <h2>Balance adjustments</h2>
          <p>
            Add or remove credits on an enrolled account, for example to correct
            a balance after a payment alert. Adjustment credit pays for tool
            calls and is never refunded to a card.
          </p>
        </div>
      </header>
      <InlineError message={error} />
      {accounts && !accounts.length ? (
        <Empty title="No enrolled accounts">
          An account can be adjusted once it is enrolled for credit billing.
        </Empty>
      ) : (
        <form
          className="ws-adjustment-form"
          aria-label="Balance adjustment"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!valid) return;
            setBusy(true);
            setError("");
            setDone("");
            try {
              const result = await admin<AdjustmentResult>("/adjustments", {
                requestKey: requestKey.current,
                accountId,
                mode,
                amount,
                note: note.trim(),
              });
              setDone(
                `${result.replayed ? "Already recorded" : "Recorded"}: ${creditChange(result.adjustment.micros)} ${modeLabel(result.adjustment.mode).toLowerCase()} credits. Available now: ${sandboxCredits(result.balance.availableMicros)}.`,
              );
              requestKey.current = crypto.randomUUID();
              setAmount("");
              setNote("");
              setRefresh((v) => v + 1);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <span>Account</span>
            <Select
              value={accountId}
              onValueChange={(value) => {
                setAccountId(value);
                setMode("");
                changed();
              }}
            >
              <SelectTrigger aria-label="Account to adjust">
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {(accounts ?? []).map((a) => (
                  <SelectItem key={a.accountId} value={a.accountId}>
                    {a.account} · {a.accountId.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label>
            <span>Balance</span>
            <Select
              value={mode}
              disabled={!account}
              onValueChange={(value) => {
                setMode(value as Mode);
                changed();
              }}
            >
              <SelectTrigger aria-label="Balance to adjust">
                <SelectValue placeholder="Choose sandbox or live" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Sandbox credits</SelectItem>
                <SelectItem value="live">Live credits (real money)</SelectItem>
              </SelectContent>
            </Select>
          </label>
          <label>
            <span>Amount in USD</span>
            <Input
              aria-label="Adjustment amount"
              inputMode="decimal"
              placeholder="5.00 or -0.0088"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value.trim());
                changed();
              }}
            />
            <small>Negative removes credits. Up to $100 either way.</small>
          </label>
          <label className="ws-adjustment-note">
            <span>Reason</span>
            <Textarea
              aria-label="Adjustment reason"
              placeholder="What this corrects and the ticket or alert it belongs to…"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                changed();
              }}
            />
          </label>
          {account && mode && (
            <p className="ws-panel-note" data-adjustment-summary>
              {account.account} is funded in{" "}
              <strong>{modeLabel(account.fundingMode).toLowerCase()}</strong>{" "}
              mode.{" "}
              {balance
                ? `Its ${modeLabel(mode).toLowerCase()} balance has ${sandboxCredits(balance.availableMicros)} available.`
                : `It has no ${modeLabel(mode).toLowerCase()} balance yet.`}
              {mode !== account.fundingMode &&
                " This is not the balance that pays for its calls."}
              {mode === "live" && " Live credits are real customer money."}
            </p>
          )}
          <Button type="submit" disabled={busy || !valid}>
            {busy ? "Recording…" : "Record adjustment"}
          </Button>
          {done && <p role="status">{done}</p>}
        </form>
      )}
      {items.length ? (
        <div
          className="ws-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Recent adjustments"
        >
          <table className="ws-table">
            <thead>
              <tr>
                <th>Change</th>
                <th>Account</th>
                <th>Reason</th>
                <th>By</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{creditChange(item.micros)}</strong>{" "}
                    <Badge variant="outline">{modeLabel(item.mode)}</Badge>
                  </td>
                  <td>{item.account ?? item.accountId.slice(0, 8)}</td>
                  <td className="ws-adjustment-reason">{item.note}</td>
                  <td>{item.actor}</td>
                  <td>{date(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="ws-panel-note">No adjustments recorded yet.</div>
      )}
    </section>
  );
}
