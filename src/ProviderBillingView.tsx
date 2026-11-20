import { providerIds, providerLabel } from "../server/provider-catalog";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download01, Upload01 } from "@untitledui/icons";
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
import { api, money } from "./api";
import { download } from "./observation-ui";
import { billingCsv, usdMicros } from "./billing-import";
import type {
  BillingOverview,
  BillingBatchView,
} from "../server/provider-billing-types";
import "./provider-billing.css";

type AdapterStatus = {
  tool: string;
  provider: string;
  version: string;
  operation: string;
  credential: { state: string; configured: boolean; revision: string | null };
  accountReference: string | null;
  accountManagedByServer: boolean;
};
export function ProviderAdaptersView() {
  const [adapters, setAdapters] = useState<AdapterStatus[]>(),
    [error, setError] = useState("");
  const [selected, setSelected] = useState<AdapterStatus>(),
    [account, setAccount] = useState(""),
    [saving, setSaving] = useState(false);
  useEffect(() => {
    let current = true;
    api<{ adapters: AdapterStatus[] }>("/account/provider-adapters")
      .then((data) => {
        if (current) setAdapters(data.adapters);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, []);
  return (
    <section className="ws-panel">
      <header>
        <div>
          <h2>Provider readiness</h2>
          <p>
            Connection setup and the integration version used for new requests.
          </p>
        </div>
      </header>
      {error && (
        <p className="ws-panel-note" role="alert">
          {error}
        </p>
      )}
      <div
        className="ws-table-scroll"
        tabIndex={0}
        role="region"
        aria-label="Provider readiness"
      >
        <table className="ws-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Version</th>
              <th>Connection setup</th>
              <th>Billing account</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adapters?.map((a) => (
              <tr key={a.tool}>
                <td>{providerLabel(a.provider)}</td>
                <td>{a.version}</td>
                <td>
                  {a.credential.configured
                    ? "Key configured"
                    : a.credential.state === "invalid"
                      ? "Key needs attention"
                      : "Key not configured"}
                </td>
                <td>{a.accountReference ?? "Not recorded"}</td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={
                      !a.credential.configured || a.accountManagedByServer
                    }
                    onClick={() => {
                      setSelected(a);
                      setAccount(a.accountReference ?? "");
                      setError("");
                    }}
                  >
                    Record account
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ws-panel-note">
        These checks do not contact providers. A configured key still needs a
        separately authorized live check. Secret keys stay on the server.
      </p>
      <Dialog
        open={!!selected}
        onOpenChange={(value) => {
          if (!saving && !value) setSelected(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record billing account</DialogTitle>
            <DialogDescription>
              Use the same account reference as your provider bill. This labels
              future requests and does not verify ownership or relabel old
              calls.
            </DialogDescription>
          </DialogHeader>
          <form
            className="billing-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!selected) return;
              setSaving(true);
              setError("");
              try {
                await api(
                  `/account/provider-adapters/${selected.tool}/account`,
                  {
                    accountReference: account,
                    credentialRevision: selected.credential.revision,
                  },
                );
                setAdapters((current) =>
                  current?.map((a) =>
                    a.tool === selected.tool
                      ? { ...a, accountReference: account }
                      : a,
                  ),
                );
                setSelected(undefined);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="billing-label">
              Billing account reference
              <Input
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                pattern="[a-zA-Z0-9._:-]{1,120}"
                required
                maxLength={120}
              />
            </label>
            {error && <p role="alert">{error}</p>}
            <Button disabled={saving}>Save account reference</Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
export function ProviderBillingView({ days }: { days: string }) {
  const [data, setData] = useState<BillingOverview>(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState<BillingBatchView>(),
    [correction, setCorrection] = useState<BillingBatchView>();
  const [busy, setBusy] = useState(false),
    [note, setNote] = useState("");
  const generation = useRef(0);
  const load = useCallback(async () => {
    const id = ++generation.current;
    try {
      const next = await api<BillingOverview>(
        `/account/provider-billing?days=${days}`,
      );
      if (id === generation.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (id === generation.current) {
        setError((e as Error).message);
        setData(undefined);
      }
    }
  }, [days]);
  useEffect(() => {
    void load();
    return () => {
      generation.current++;
    };
  }, [load]);
  const review = async (decision: "approved" | "rejected") => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      await api(`/account/provider-billing/imports/${selected.id}/review`, {
        requestKey: crypto.randomUUID(),
        decision,
        note,
      });
      setSelected(undefined);
      setNote("");
      setNotice(
        decision === "approved"
          ? "Import approved. Only eligible matched invoice amounts count as reconciled charges."
          : "Import rejected. Its history is preserved.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ws-panel">
      <header>
        <div>
          <h2>Provider billing</h2>
          <p>
            Compare imported bills with recorded requests. Review each import
            before it affects reconciled totals.
          </p>
        </div>
        <div className="billing-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCorrection(undefined);
              setOpen(true);
            }}
          >
            <Upload01 size={14} />
            Import records
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Export provider billing"
            onClick={async () => {
              try {
                download(
                  "provider-billing.json",
                  await api("/account/provider-billing/export"),
                  "application/json",
                );
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <Download01 size={14} />
          </Button>
        </div>
      </header>
      {error && (
        <p className="ws-panel-note" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="ws-panel-note" role="status">
          {notice}
        </p>
      )}
      <div className="billing-summary">
        <div>
          <span>Reconciled charges</span>
          <strong>
            {data?.reconciledMicros == null
              ? "Not reconciled"
              : money(data.reconciledMicros)}
          </strong>
        </div>
        <div>
          <span>Difference from matched estimates</span>
          <strong>
            {data?.varianceMicros == null ? "—" : money(data.varianceMicros)}
          </strong>
        </div>
        <div>
          <span>Invoice coverage</span>
          <strong>
            {data ? `${data.reconciledCalls} / ${data.totalCalls} calls` : "—"}
          </strong>
        </div>
        <div>
          <span>Records needing attention</span>
          <strong>{data?.unresolvedRecords ?? "—"}</strong>
        </div>
      </div>
      <p className="ws-panel-note">
        Totals follow the selected request dates. Estimates and
        provider-reported usage above stay unchanged. Unmatched records, usage
        reports, non-USD amounts and credit conversions are kept separate from
        reconciled invoice charges.
      </p>
      {!data?.batches.length ? (
        <div className="billing-empty">
          <strong>No billing records imported</strong>
          <p>
            Import a provider invoice or usage export to compare it with your
            requests. Missing billing data is never treated as a zero charge.
          </p>
        </div>
      ) : (
        <div
          className="ws-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Billing imports"
        >
          <table className="ws-table">
            <thead>
              <tr>
                <th>Provider / document</th>
                <th>Account</th>
                <th>Source</th>
                <th>Review</th>
                <th>Matching</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.batches.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    {providerLabel(batch.provider)}
                    <small className="billing-subtext">
                      {batch.sourceReference}
                    </small>
                  </td>
                  <td>{batch.accountReference}</td>
                  <td>
                    {batch.sourceKind === "invoice"
                      ? "Invoice"
                      : "Usage report"}
                  </td>
                  <td>
                    <Badge variant="outline">
                      {batch.review
                        ? batch.review.decision === "rejected"
                          ? "Rejected"
                          : batch.effective
                            ? "Approved"
                            : "Replaced"
                        : "Needs review"}
                    </Badge>
                  </td>
                  <td>
                    {batch.lines.filter((l) => l.status === "matched").length} /{" "}
                    {batch.lines.length}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelected(batch);
                        setNote("");
                        setError("");
                      }}
                    >
                      View import
                    </Button>
                    {batch.review && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCorrection(batch);
                          setOpen(true);
                        }}
                      >
                        Correct
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <BillingImport
        open={open}
        close={() => setOpen(false)}
        correction={correction}
        complete={async () => {
          setOpen(false);
          setNotice(
            "Records imported for review. Reconciled totals have not changed.",
          );
          await load();
        }}
      />
      <Dialog
        open={!!selected}
        onOpenChange={(value) => {
          if (!busy && !value) setSelected(undefined);
        }}
      >
        <DialogContent className="billing-dialog">
          <DialogHeader>
            <DialogTitle>Review billing import</DialogTitle>
            <DialogDescription>
              {selected
                ? `${providerLabel(selected.provider)} · ${selected.sourceReference} · ${selected.accountReference}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <p>
            The account owner supplied these records. Approval records your
            review of the import. Provider invoice verification is separate.
          </p>
          {error && <p role="alert">{error}</p>}
          {selected && (
            <>
              <p>
                {selected.currency} ·{" "}
                {selected.sourceKind === "invoice"
                  ? "Invoice amounts"
                  : "Usage report; amounts do not count as invoice charges"}
                {selected.creditRate
                  ? ` · Credit conversion uses rate ${selected.creditRate.version}`
                  : ""}
              </p>
              <div
                className="ws-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Billing record matches"
              >
                <table className="ws-table">
                  <thead>
                    <tr>
                      <th>Record / request</th>
                      <th>Match</th>
                      <th>Estimate</th>
                      <th>Reported USD</th>
                      <th>Reported credits</th>
                      <th>Imported amount</th>
                      <th>Imported credits</th>
                      <th>Credit conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map((line, i) => (
                      <tr key={`${line.recordId}-${i}`}>
                        <td>
                          {line.recordId}
                          <small className="billing-subtext">
                            {line.requestId ?? "No request reference"}
                          </small>
                        </td>
                        <td>
                          {line.status.replaceAll("_", " ")}
                          <small className="billing-subtext">
                            {line.reason}
                          </small>
                        </td>
                        <td>
                          {line.estimatedMicros === null
                            ? "Unknown"
                            : money(line.estimatedMicros)}
                        </td>
                        <td>
                          {line.reportedUsd === null
                            ? "Not reported"
                            : money(line.reportedUsd * 1e6)}
                        </td>
                        <td>{line.reportedCredits ?? "Not reported"}</td>
                        <td>
                          {line.amountMicros === undefined
                            ? "Unknown"
                            : `${(line.amountMicros / 1e6).toFixed(6)} ${selected.currency}`}
                        </td>
                        <td>{line.credits ?? "Not reported"}</td>
                        <td>
                          {line.convertedCreditMicros === null
                            ? "Not converted"
                            : money(line.convertedCreditMicros)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {selected.review ? (
                <p>
                  Decision: {selected.review.decision}. {selected.review.note}{" "}
                  Corrections are saved as new versions.
                </p>
              ) : (
                <>
                  <label className="billing-label">
                    Review note
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={1000}
                      placeholder="What did you check?"
                    />
                  </label>
                  <div className="billing-actions">
                    <Button
                      disabled={busy || note.trim().length < 3}
                      onClick={() => void review("approved")}
                    >
                      Approve import
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || note.trim().length < 3}
                      onClick={() => void review("rejected")}
                    >
                      Reject import
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function BillingImport({
  open,
  close,
  complete,
  correction,
}: {
  open: boolean;
  close: () => void;
  complete: () => Promise<void>;
  correction?: BillingBatchView;
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [csv, setCsv] = useState("");
  useEffect(() => {
    if (open) {
      setError("");
      setCsv("");
    }
  }, [open, correction]);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const start = String(form.get("start")),
        end = String(form.get("end")),
        rate = String(form.get("rate") ?? "").trim();
      await api("/account/provider-billing/imports", {
        requestKey: crypto.randomUUID(),
        provider: form.get("provider"),
        accountReference: form.get("account"),
        sourceKind: form.get("kind"),
        sourceReference: form.get("document"),
        currency: form.get("currency"),
        windowStart: `${start}T00:00:00.000Z`,
        windowEnd: new Date(
          Date.parse(`${end}T00:00:00Z`) + 86400000,
        ).toISOString(),
        records: billingCsv(csv),
        ...(correction ? { supersedesBatchId: correction.id } : {}),
        ...(rate
          ? {
              creditRate: {
                version: String(form.get("rateReference")),
                microsPerCredit: usdMicros(rate),
              },
            }
          : {}),
      });
      await complete();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy && !value) close();
      }}
    >
      <DialogContent className="billing-dialog">
        <DialogHeader>
          <DialogTitle>
            {correction ? "Correct billing import" : "Import billing records"}
          </DialogTitle>
          <DialogDescription>
            Use a provider invoice or account usage report. Record and request
            references let Two Hands find matching calls.
          </DialogDescription>
        </DialogHeader>
        <form
          key={correction?.id ?? "new"}
          onSubmit={(e) => void submit(e)}
          className="billing-form"
        >
          <div className="billing-form-grid">
            <label className="billing-label">
              Provider
              <select
                name="provider"
                defaultValue={correction?.provider ?? providerIds[0]}
              >
                {providerIds.map((p) => (
                  <option key={p} value={p}>
                    {providerLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="billing-label">
              Provider account
              <Input
                name="account"
                required
                maxLength={120}
                defaultValue={correction?.accountReference}
                placeholder="Account reference"
              />
            </label>
            <label className="billing-label">
              Source
              <select
                name="kind"
                defaultValue={correction?.sourceKind ?? "invoice"}
              >
                <option value="invoice">Invoice</option>
                <option value="account_usage">Usage report</option>
              </select>
            </label>
            <label className="billing-label">
              Document reference
              <Input
                name="document"
                required
                maxLength={120}
                defaultValue={correction?.sourceReference}
                placeholder="Invoice or report ID"
              />
            </label>
            <label className="billing-label">
              From
              <Input
                name="start"
                type="date"
                required
                defaultValue={correction?.windowStart.slice(0, 10)}
              />
            </label>
            <label className="billing-label">
              Through
              <Input
                name="end"
                type="date"
                required
                defaultValue={
                  correction
                    ? new Date(Date.parse(correction.windowEnd) - 86400000)
                        .toISOString()
                        .slice(0, 10)
                    : undefined
                }
              />
            </label>
            <label className="billing-label">
              Currency
              <Input
                name="currency"
                required
                defaultValue={correction?.currency ?? "USD"}
                pattern="[A-Z]{3}"
                maxLength={3}
              />
            </label>
            <label className="billing-label">
              USD per credit (optional)
              <Input
                name="rate"
                inputMode="decimal"
                placeholder="Leave blank if unknown"
              />
            </label>
            <label className="billing-label">
              Rate reference (if converting credits)
              <Input
                name="rateReference"
                maxLength={120}
                placeholder="Account plan or rate version"
              />
            </label>
          </div>
          <p>
            Dates use UTC. Account and document references must use letters,
            numbers, dots, dashes, colons or underscores. Keep secret keys out
            of this form.
          </p>
          <div className="billing-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                download(
                  "billing-import-template.csv",
                  "Record ID,Request ID,Amount,Credits\n",
                  "text/csv",
                )
              }
            >
              Download template
            </Button>
            <label className="billing-label">
              Choose CSV
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 20000) {
                    setError("Import up to 20 KB at a time.");
                    return;
                  }
                  try {
                    setCsv(await file.text());
                    setError("");
                  } catch {
                    setError("The file could not be read.");
                  }
                }}
              />
            </label>
          </div>
          <label className="billing-label">
            Billing records
            <Textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              maxLength={20000}
              rows={5}
              placeholder={"Record ID,Request ID,Amount,Credits"}
              required
            />
          </label>
          <p>
            Amounts use the selected currency. Leave unknown amounts or request
            references blank. A correction replaces the whole earlier import
            only after approval.
          </p>
          {error && <p role="alert">{error}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Importing…" : "Import for review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
