import { useEffect, useRef, useState, type FormEvent } from "react";
import type { OperatorAllowance } from "../server/account-allowance";
import { api, ApiError, money } from "./api";
import { Panel, Empty, InlineError, Field } from "./observation-ui";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import "./tool-access.css";
import { Users01, Key01 } from "@untitledui/icons";
type AllowanceAccount = {
  accountId: string;
  name: string;
  operatorAllowance: OperatorAllowance;
};
type AccountPage = { items: AllowanceAccount[]; nextCursor: string | null };
const labels: Record<OperatorAllowance["state"], string> = {
  unconfigured: "Not enabled",
  paused: "Paused",
  exhausted: "Allowance exhausted",
  available: "Enabled",
  local: "Local development",
};

export function ToolAccessView() {
  const [items, setItems] = useState<AllowanceAccount[]>([]),
    [cursor, setCursor] = useState<string | null>(null),
    [selected, setSelected] = useState<AllowanceAccount>();
  const [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [limit, setLimit] = useState("0"),
    [paused, setPaused] = useState(false),
    [reason, setReason] = useState("");
  const generation = useRef(0),
    alive = useRef(true),
    requestKey = useRef<string | null>(null);
  const load = async (after?: string) => {
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      const page = await api<AccountPage>(
        "/admin/account-allowances" +
          (after ? "?after=" + encodeURIComponent(after) : ""),
      );
      if (!alive.current || current !== generation.current) return;
      setItems((old) => (after ? [...old, ...page.items] : page.items));
      setCursor(page.nextCursor);
      if (!after) {
        setSelected(undefined);
        requestKey.current = null;
        setReason("");
      }
    } catch (e) {
      if (alive.current && current === generation.current)
        setError((e as Error).message);
    } finally {
      if (alive.current && current === generation.current) setLoading(false);
    }
  };
  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
      generation.current++;
    };
  }, []);
  const choose = (account: AllowanceAccount) => {
    setSelected(account);
    setLimit(String(account.operatorAllowance.limitMicros / 1e6));
    setPaused(account.operatorAllowance.state === "paused");
    setReason("");
    requestKey.current = null;
    setError("");
    setNotice("");
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (!/^(?:0|[1-9]\d{0,3})(?:\.\d{1,6})?$/.test(limit)) {
      setError("Enter a USD limit with up to six decimal places.");
      return;
    }
    const [whole, fraction = ""] = limit.split("."),
      amount = Number(whole) * 1e6 + Number(fraction.padEnd(6, "0"));
    if (amount > 1e9) {
      setError("The maximum estimated allowance is $1,000.");
      return;
    }
    if (
      amount <
      selected.operatorAllowance.spentMicros +
        selected.operatorAllowance.reservedMicros
    ) {
      setError(
        "The limit cannot be below spent and reserved estimates. Pause access to block new calls.",
      );
      return;
    }
    if (!reason.trim()) {
      setError("Enter a reason for the audit history.");
      return;
    }
    requestKey.current ??= crypto.randomUUID();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await api<{
        operatorAllowance: OperatorAllowance;
        replayed: boolean;
      }>(`/admin/account-allowances/${selected.accountId}`, {
        requestKey: requestKey.current,
        revision: selected.operatorAllowance.revision,
        limitMicros: amount,
        paused,
        reason: reason.trim(),
      });
      if (!alive.current) return;
      const updated = {
        ...selected,
        operatorAllowance: result.operatorAllowance,
      };
      setItems((old) =>
        old.map((item) =>
          item.accountId === updated.accountId ? updated : item,
        ),
      );
      choose(updated);
      setNotice(
        result.replayed
          ? "Saved request confirmed. Current allowance settings are shown."
          : "Tool access saved. No provider call was made.",
      );
    } catch (e) {
      if (alive.current) {
        setError((e as Error).message);
        if (e instanceof ApiError && e.status === 409) {
          requestKey.current = null;
          setSelected(undefined);
          setError(
            (e as Error).message +
              " Reload accounts and select the account again before saving.",
          );
        }
      }
    } finally {
      if (alive.current) setSaving(false);
    }
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Tool access</h1>
          <p>Manage platform-funded tool access for each account.</p>
        </div>
        <Button
          variant="outline"
          disabled={loading || saving}
          onClick={() => void load()}
        >
          Reload accounts
        </Button>
      </div>
      <InlineError message={error} />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <p className="subtle">
        Limits apply to estimated provider spending since activation. Payment
        credits do not grant tool access. Pausing preserves spent and in-flight
        reservations.
      </p>
      <div className="tool-access-grid">
        <Panel title="Accounts">
          {loading && !items.length ? (
            <p role="status">Loading accounts…</p>
          ) : !items.length ? (
            <Empty title="No accounts are available yet" icon={Users01}>
              Accounts will appear here when they’re available for review.
            </Empty>
          ) : (
            <div className="tool-access-list">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.accountId}
                  aria-pressed={selected?.accountId === item.accountId}
                  disabled={saving}
                  onClick={() => choose(item)}
                >
                  <strong>{item.name}</strong>
                  <span>{labels[item.operatorAllowance.state]}</span>
                </button>
              ))}
            </div>
          )}
          {cursor && (
            <Button
              variant="outline"
              disabled={loading || saving}
              onClick={() => void load(cursor)}
            >
              Load more accounts
            </Button>
          )}
        </Panel>
        <Panel title={selected ? selected.name : "Select an account"}>
          {!selected ? (
            <Empty title="Choose an account" icon={Key01}>
              Review an account’s allowance, then enable or pause its tool
              access.
            </Empty>
          ) : (
            <>
              <dl className="portal-details">
                <dt>Status</dt>
                <dd>{labels[selected.operatorAllowance.state]}</dd>
                <dt>Estimated spent</dt>
                <dd>{money(selected.operatorAllowance.spentMicros)}</dd>
                <dt>In flight</dt>
                <dd>{money(selected.operatorAllowance.reservedMicros)}</dd>
                <dt>Remaining</dt>
                <dd>
                  {money(selected.operatorAllowance.remainingMicros ?? 0)}
                </dd>
              </dl>
              <form className="portal-form" onSubmit={save}>
                <fieldset disabled={saving} className="tool-access-fields">
                  <Field
                    label="Estimated lifetime limit (USD)"
                    id="tool-access-limit"
                    hint="Maximum $1,000. This does not reset previously consumed estimates."
                  >
                    <Input
                      id="tool-access-limit"
                      inputMode="decimal"
                      value={limit}
                      onChange={(e) => {
                        setLimit(e.target.value);
                        requestKey.current = null;
                      }}
                      required
                    />
                  </Field>
                  <label className="portal-checkbox">
                    <input
                      type="checkbox"
                      checked={paused}
                      onChange={(e) => {
                        setPaused(e.target.checked);
                        requestKey.current = null;
                      }}
                    />
                    Pause new provider calls
                  </label>
                  <Field label="Reason for change" id="tool-access-reason">
                    <Textarea
                      id="tool-access-reason"
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        requestKey.current = null;
                      }}
                      required
                    />
                  </Field>
                  <Button type="submit">
                    {saving ? "Saving…" : "Save tool access"}
                  </Button>
                </fieldset>
              </form>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
