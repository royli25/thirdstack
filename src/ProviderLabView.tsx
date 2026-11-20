import {
  isExtractProvider,
  providerEntry,
  providerIds,
  providerLabel,
  providerOperation,
} from "../server/provider-catalog";
import { useEffect, useRef, useState } from "react";
import {
  Play,
  CheckCircle,
  ArrowUpRight,
  Link01,
  Plus,
  Download01,
} from "@untitledui/icons";
import { ProviderSuiteEditor } from "./ProviderSuiteEditor";
import { ProviderComparison } from "./ProviderComparison";
import { api, money, ApiError } from "./api";
import { Panel, InlineError, StateBadge, date } from "./observation-ui";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Badge } from "./components/ui/badge";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import type { ProviderId, Source } from "../server/types";
import type {
  LabRun,
  LabCase,
  LabCall,
  ProviderMeasurement,
  Experiment,
  EvidenceReview,
  LabSuite,
} from "../server/provider-lab-types";

import { labMeasurements, providerUsage } from "../server/provider-lab-metrics";

export const providerNames = Object.fromEntries(
  providerIds.map((p) => [p, providerLabel(p)]),
) as Record<ProviderId, string>;
export interface LabOverview {
  suiteVersion: string;
  methodology: string;
  cases: LabCase[];
  suites: LabSuite[];
  backendBudgetMicros: number;
  dailyBudgetMicros: number;
  dailyCommittedMicros: number;
  dailyRemainingMicros: number;
  providers: {
    id: ProviderId;
    configured: boolean;
    enabled?: boolean;
    estimateMicros: number;
    plannedCalls: number;
  }[];
  runs: LabRun[];
  measurements: ProviderMeasurement[];
  experiments: Experiment[];
}
export function BenchmarkTable({
  metrics,
  replay = false,
}: {
  metrics: ProviderMeasurement[];
  replay?: boolean;
}) {
  return (
    <div
      className="lab-table-wrap"
      role="region"
      aria-label="Provider test measurements"
      tabIndex={0}
    >
      <table className="lab-table">
        <thead>
          <tr>
            <th>Provider</th>
            <th>{replay ? "Saved receipts" : "Test calls"}</th>
            <th>
              {replay ? "Original requests succeeded" : "Requests succeeded"}
            </th>
            <th>Reference checks</th>
            <th>Median response</th>
            <th>{replay ? "Replay spend" : "Estimated cost"}</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.provider}>
              <td>
                <strong>{providerNames[m.provider]}</strong>
                <small>
                  {isExtractProvider(m.provider)
                    ? "Page extraction"
                    : "Web search"}
                </small>
              </td>
              <td>{m.attempted}</td>
              <td>{m.attempted ? `${m.succeeded} / ${m.attempted}` : "—"}</td>
              <td>
                {m.referenceKnown
                  ? `${m.referencePassed} / ${m.referenceKnown}`
                  : "Not measured"}
              </td>
              <td>
                {m.medianLatencyMs === null
                  ? "—"
                  : `${(m.medianLatencyMs / 1000).toFixed(2)} s`}
              </td>
              <td>{money(m.estimatedMicros)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ProviderLabView({
  runId,
  providerFilter = "all",
  evidenceFilter = "all",
}: {
  runId?: string;
  providerFilter?: string;
  evidenceFilter?: string;
}) {
  const [data, setData] = useState<LabOverview>();
  const [run, setRun] = useState<LabRun>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<ProviderId[]>([...providerIds]);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [suiteId, setSuiteId] = useState("public-reference-v1");
  const [mode, setMode] = useState("live");
  const [sourceRunId, setSourceRunId] = useState("");
  const [suiteEditor, setSuiteEditor] = useState<{
    initial?: LabSuite;
    duplicate?: boolean;
  } | null>(null);
  const [baselineId, setBaselineId] = useState("none");
  const [comparisonProvider, setComparisonProvider] = useState<ProviderId>(
    providerIds[0],
  );
  const requestKey = useRef<string | null>(null);
  const requestSignature = useRef("");
  const initializedProviders = useRef(false);
  const activeRef = useRef(true);
  const currentRunId = useRef(runId);
  const detailMutation = useRef(0);
  function applyRun(incoming: LabRun) {
    if (!activeRef.current || currentRunId.current !== incoming.id) return;
    setRun((previous) =>
      previous?.id === incoming.id &&
      (previous.revision ?? 0) > (incoming.revision ?? 0)
        ? previous
        : incoming,
    );
  }
  useEffect(() => {
    activeRef.current = true;
    let stale = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const d = await api<LabOverview>("/provider-lab");
        if (!stale) {
          setData(d);
          if (!initializedProviders.current) {
            setProviders(
              d.providers
                .filter((p) => p.configured && p.enabled !== false)
                .map((p) => p.id),
            );
            initializedProviders.current = true;
          }
          setError("");
        }
      } catch (e) {
        if (!stale) {
          setError((e as Error).message);
          setData(undefined);
          if (e instanceof ApiError && e.status === 401) {
            setRun(undefined);
            setReceiptId(null);
          }
        }
      } finally {
        if (!stale) timer = setTimeout(refresh, 3000);
      }
    }
    void refresh();
    return () => {
      stale = true;
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    let stale = false;
    currentRunId.current = runId;
    let firstResponse = true;
    setBaselineId("none");
    let timer: ReturnType<typeof setTimeout>;
    setRun(undefined);
    setReceiptId(null);
    if (!runId) return;
    async function refresh() {
      const mutation = detailMutation.current;
      try {
        const r = await api<LabRun>(`/provider-lab/runs/${runId}`);
        if (!stale) {
          if (firstResponse) {
            setComparisonProvider(r.providers[0]);
            firstResponse = false;
          }
          applyRun(r);
          setError("");
          if (r.status === "running" || mutation !== detailMutation.current)
            timer = setTimeout(refresh, 1500);
        }
      } catch (e) {
        if (!stale && mutation === detailMutation.current) {
          setError((e as Error).message);
          setRun(undefined);
        }
        if (!stale && !(e instanceof ApiError && [401, 404].includes(e.status)))
          timer = setTimeout(refresh, 3000);
      }
    }
    void refresh();
    return () => {
      stale = true;
      currentRunId.current = undefined;
      clearTimeout(timer);
    };
  }, [runId]);
  async function start() {
    const startedFrom = currentRunId.current;
    setBusy(true);
    setError("");
    const signature = JSON.stringify({
      mode,
      providers: mode === "replay" ? undefined : providers,
      sourceRunId: mode === "replay" ? sourceRunId : undefined,
      suiteId: selectedSuite?.id,
      revision: selectedSuite?.revision,
    });
    if (signature !== requestSignature.current) {
      requestKey.current = null;
      requestSignature.current = signature;
    }
    requestKey.current ??= crypto.randomUUID();
    try {
      const r = await api<LabRun>(
        mode === "replay" ? "/provider-lab/replays" : "/provider-lab/runs",
        {
          requestKey: requestKey.current,
          ...(mode === "replay" ? { sourceRunId } : { providers }),
          suiteId: selectedSuite?.id,
          suiteRevision: selectedSuite?.revision,
        },
      );
      requestKey.current = null;
      if (activeRef.current && currentRunId.current === startedFrom) {
        location.hash = `lab/${r.id}`;
        setNotice(
          mode === "replay"
            ? "Saved responses replayed. No provider requests or spending."
            : "Controlled test started. Organic session statistics are unchanged.",
        );
      }
    } catch (e) {
      if (activeRef.current) setError((e as Error).message);
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  const selectedSuite =
    data?.suites.find((s) => s.id === suiteId) ?? data?.suites[0];
  const plannedCalls = (id: ProviderId) =>
    selectedSuite?.cases.filter(
      (c) => c.kind === (providerOperation(id) ?? "search"),
    ).length ?? 0;
  const estimate =
    mode === "replay"
      ? 0
      : (data?.providers
          .filter((p) => providers.includes(p.id))
          .reduce((n, p) => n + p.estimateMicros * plannedCalls(p.id), 0) ?? 0);
  const unavailable = data?.providers.some(
    (p) =>
      providers.includes(p.id) &&
      (!p.configured || p.enabled === false || !plannedCalls(p.id)),
  );
  const running = data?.runs.some((r) => r.status === "running");
  const receipt = run?.calls.find((c) => c.id === receiptId);
  const visibleCalls =
    run?.calls.filter(
      (c) =>
        (providerFilter === "all" || c.provider === providerFilter) &&
        (evidenceFilter === "missed"
          ? c.measurements?.referenceCheck === false
          : evidenceFilter === "unreviewed"
            ? ["succeeded", "failed", "interrupted"].includes(c.status) &&
              (!c.reviews.length || c.reviews.at(-1)?.verdict === "unknown")
            : evidenceFilter === "errors"
              ? ["failed", "interrupted"].includes(c.status)
              : evidenceFilter === "truncated"
                ? c.measurements?.truncated === true
                : true),
    ) ?? [];
  return (
    <div className="provider-page">
      <div className="page-heading">
        <div>
          <h1>Provider lab</h1>
          <p>Build test suites, run live checks, and replay saved evidence.</p>
        </div>
        <Button variant="outline" asChild>
          <a href="#company/exa">
            Tool company view <ArrowUpRight />
          </a>
        </Button>
      </div>
      <InlineError message={error} />
      {notice && (
        <div role="status" className="notice">
          <CheckCircle />
          {notice}
        </div>
      )}
      {!data && !error && <p role="status">Loading provider lab…</p>}
      {data && (
        <>
          <div className="lab-suite-toolbar">
            <div>
              <Label htmlFor="lab-suite">Test suite</Label>
              <Select
                value={selectedSuite?.id}
                disabled={busy}
                onValueChange={(id) => {
                  requestKey.current = null;
                  setSuiteId(id);
                  const suite = data.suites.find((s) => s.id === id);
                  setProviders(
                    data.providers
                      .filter(
                        (p) =>
                          p.configured &&
                          p.enabled !== false &&
                          suite?.cases.some(
                            (c) =>
                              c.kind === (providerOperation(p.id) ?? "search"),
                          ),
                      )
                      .map((p) => p.id),
                  );
                }}
              >
                <SelectTrigger id="lab-suite">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.suites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.title} · v{s.revision}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lab-mode">Test mode</Label>
              <Select
                value={mode}
                disabled={busy}
                onValueChange={(v) => {
                  setMode(v);
                  requestKey.current = null;
                }}
              >
                <SelectTrigger id="lab-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live provider calls</SelectItem>
                  <SelectItem value="replay">
                    Replay saved responses · no spend
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="lab-suite-actions">
              <Button variant="outline" onClick={() => setSuiteEditor({})}>
                <Plus />
                New suite
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setSuiteEditor({ initial: selectedSuite, duplicate: true })
                }
              >
                Duplicate
              </Button>
              {selectedSuite && !selectedSuite.builtIn && (
                <Button
                  variant="outline"
                  onClick={() => setSuiteEditor({ initial: selectedSuite })}
                >
                  Edit suite
                </Button>
              )}
            </div>
          </div>
          <div className="lab-setup-grid">
            <Panel
              title={
                mode === "replay"
                  ? "Simulate checks on saved responses"
                  : "Run a controlled test"
              }
              description={
                mode === "replay"
                  ? "Test references and text markers against historical evidence. This does not simulate an agent or new provider behavior."
                  : "Selected providers receive the versioned cases below. Search providers get matched queries; extraction stays separate."
              }
            >
              {mode === "replay" ? (
                <div className="lab-replay-source">
                  <Label htmlFor="replay-source">Saved live run</Label>
                  <Select
                    value={sourceRunId}
                    onValueChange={(id) => {
                      setSourceRunId(id);
                      requestKey.current = null;
                    }}
                  >
                    <SelectTrigger id="replay-source">
                      <SelectValue placeholder="Choose a completed live run" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.runs
                        .filter(
                          (r) =>
                            r.source === "live_controlled" &&
                            r.status === "completed",
                        )
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.title} · {date(r.createdAt)} · {r.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="field-hint">
                    Case IDs and inputs must match the saved run. Duplicate its
                    suite to revise reference checks. New queries or URLs need
                    live calls.
                  </p>
                </div>
              ) : (
                <div className="lab-provider-options">
                  {data.providers.map((p) => (
                    <label key={p.id} className="lab-provider-option">
                      <Checkbox
                        disabled={
                          busy ||
                          !!running ||
                          !p.configured ||
                          p.enabled === false ||
                          !plannedCalls(p.id)
                        }
                        checked={providers.includes(p.id)}
                        onCheckedChange={(checked) => {
                          requestKey.current = null;
                          setProviders((v) =>
                            checked === true
                              ? [...v, p.id]
                              : v.filter((x) => x !== p.id),
                          );
                        }}
                      />
                      <span>
                        <strong>{providerNames[p.id]}</strong>
                        <small>
                          {p.enabled === false
                            ? "Paused or unavailable"
                            : p.configured
                              ? `${plannedCalls(p.id)} calls · ${money(p.estimateMicros * plannedCalls(p.id))} estimated`
                              : "Not configured on backend"}
                        </small>
                      </span>
                      <Badge variant="outline">
                        {isExtractProvider(p.id) ? "Extract" : "Search"}
                      </Badge>
                    </label>
                  ))}
                </div>
              )}
              <div className="lab-run-footer">
                <span>
                  <strong>{money(estimate)}</strong> estimated ·{" "}
                  {money(data.backendBudgetMicros)} backend cap
                </span>
                <Button
                  variant="default"
                  disabled={
                    busy ||
                    !selectedSuite ||
                    (mode === "replay"
                      ? !sourceRunId
                      : !!running ||
                        !providers.length ||
                        unavailable ||
                        estimate > data.backendBudgetMicros ||
                        estimate > data.dailyRemainingMicros)
                  }
                  onClick={() => void start()}
                >
                  <Play />
                  {busy
                    ? "Starting…"
                    : mode === "replay"
                      ? "Run replay"
                      : running
                        ? "Test in progress"
                        : "Run live test"}
                </Button>
              </div>
              <p className="field-hint">
                {mode === "replay" ? (
                  "Replays use saved evidence and require no provider keys or test allowance."
                ) : (
                  <>
                    Uses server-side provider keys. Daily allowance remaining:{" "}
                    {money(data.dailyRemainingMicros)} of{" "}
                    {money(data.dailyBudgetMicros)}. Resets at midnight UTC. No
                    automatic retries or background schedule.
                  </>
                )}
              </p>
            </Panel>
            <Panel
              title="What you will learn"
              description="Measure the integration before making a quality claim."
            >
              <ol className="lab-method-steps">
                <li>
                  <span>1</span>
                  <div>
                    <strong>Execution</strong>
                    <p>
                      Did a request finish, how long did it take, and what did
                      it return?
                    </p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <strong>Reference coverage</strong>
                    <p>
                      Did the expected page appear in the first three search
                      results, or did the page contain the required markers?
                    </p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <strong>Evidence usefulness</strong>
                    <p>
                      Inspect the receipt and record a separate review. A
                      reference match does not prove a good answer.
                    </p>
                  </div>
                </li>
              </ol>
            </Panel>
          </div>
          <details className="lab-methodology">
            <summary>
              Test cases and methodology · {selectedSuite?.title} · v
              {selectedSuite?.revision}
            </summary>
            <p>{selectedSuite?.description}</p>
            <div className="lab-case-grid">
              {selectedSuite?.cases.map((c) => (
                <div key={c.id}>
                  <Badge variant="outline">{c.kind}</Badge>
                  <strong>{c.title}</strong>
                  <p>{c.input}</p>
                  <a
                    href={c.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Reference page <ArrowUpRight />
                  </a>
                </div>
              ))}
            </div>
          </details>
          {!runId && (
            <Panel
              title="Test history"
              description="Forced-provider runs never count as organic selection or model performance."
            >
              {data.runs.length === 0 ? (
                <div className="lab-empty">
                  <Link01 />
                  <h3>No controlled tests yet</h3>
                  <p>
                    Choose providers above to create the first measured
                    baseline.
                  </p>
                </div>
              ) : (
                <div className="lab-run-list">
                  {data.runs.map((r) => (
                    <a href={`#lab/${r.id}`} key={r.id}>
                      <div>
                        <strong>{r.title}</strong>
                        <small>
                          {r.source === "replay" ? "Replay" : "Live"} ·{" "}
                          {date(r.createdAt)} ·{" "}
                          {r.providers.map((p) => providerNames[p]).join(", ")}
                        </small>
                      </div>
                      <StateBadge label={r.status} />
                      <span>
                        {
                          r.calls.filter((c) =>
                            ["succeeded", "failed", "interrupted"].includes(
                              c.status,
                            ),
                          ).length
                        }{" "}
                        attempted ·{" "}
                        {r.calls.filter((c) => c.status === "skipped").length}{" "}
                        skipped
                      </span>
                      <span>{money(r.spentMicros)}</span>
                      <ArrowUpRight />
                    </a>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </>
      )}
      {runId && !run && !error && <p role="status">Loading test results…</p>}
      {run && (
        <>
          <div className="lab-result-heading">
            <div>
              <Button variant="ghost" asChild>
                <a href="#lab">All test runs</a>
              </Button>
              <h2>{run.title}</h2>
              <p>
                {date(run.createdAt)} ·{" "}
                <span>
                  {run.source === "replay"
                    ? "Replay of saved responses"
                    : "Live controlled test"}
                </span>{" "}
                · {run.suiteVersion}
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  const url = URL.createObjectURL(
                    new Blob(
                      [
                        JSON.stringify(
                          {
                            scope: "private_workspace",
                            exportedAt: new Date().toISOString(),
                            run,
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `two-hands-private-run-${run.id}.json`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                }}
              >
                <Download01 />
                Export private run
              </Button>
              <StateBadge label={run.status} />
              {run.status === "running" && (
                <Button
                  variant="outline"
                  disabled={run.cancelRequested}
                  onClick={async () => {
                    try {
                      detailMutation.current++;
                      const updated = await api<LabRun>(
                        `/provider-lab/runs/${run.id}/stop`,
                        {},
                      );
                      detailMutation.current++;
                      applyRun(updated);
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  {run.cancelRequested
                    ? "Stopping after current call…"
                    : "Stop remaining calls"}
                </Button>
              )}
            </div>
          </div>
          {run.source === "replay" && (
            <p className="notice">
              Historical responses · no new provider requests, timing, or usage.
              Reviews belong to this replay.{" "}
              <a href={`#lab/${run.sourceRunId}`}>Inspect original run</a>
            </p>
          )}
          <Panel
            title="Measured results"
            description="Search and extraction checks measure different tasks. This sample is diagnostic, not a provider ranking."
          >
            <BenchmarkTable
              replay={run.source === "replay"}
              metrics={labMeasurements([run]).filter((m) =>
                run.providers.includes(m.provider),
              )}
            />
            <p className="field-hint">
              {run.source === "replay" ? (
                "No new requests, timing, or provider usage. Original execution statuses are shown for context; reference checks were recomputed."
              ) : (
                <>
                  {money(run.spentMicros)} estimated used ·{" "}
                  {money(run.reservedMicros)} reserved · provider billing may
                  differ. Reference checks exclude calls without a usable
                  response; request failures remain visible separately.
                </>
              )}
            </p>
          </Panel>
          {data && (
            <Panel
              title="Compare with a baseline"
              description="Inspect changes case by case. Replays test checks; live runs measure fresh execution."
            >
              <div className="lab-evidence-filters">
                <div>
                  <Label htmlFor="compare-baseline">Baseline run</Label>
                  <Select value={baselineId} onValueChange={setBaselineId}>
                    <SelectTrigger id="compare-baseline">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Choose a completed run
                      </SelectItem>
                      {data.runs
                        .filter(
                          (r) => r.id !== run.id && r.status === "completed",
                        )
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.source === "replay" ? "Replay" : "Live"} ·{" "}
                            {r.title} · {r.id.slice(0, 8)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compare-provider">Compare provider</Label>
                  <Select
                    value={comparisonProvider}
                    onValueChange={(p) =>
                      setComparisonProvider(p as ProviderId)
                    }
                  >
                    <SelectTrigger id="compare-provider">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {run.providers.map((p) => (
                        <SelectItem key={p} value={p}>
                          {providerNames[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {baselineId !== "none" && (
                <ProviderComparison
                  plan={{
                    provider: comparisonProvider,
                    verification: "integration",
                    baselineRunId: baselineId,
                    followupRunId: run.id,
                  }}
                  runs={data.runs}
                />
              )}
            </Panel>
          )}
          <Panel
            title="Inspect the evidence"
            description="Open a receipt to see the exact input, captured results, and review history."
          >
            <div className="lab-evidence-filters">
              <div>
                <Label htmlFor="receipt-provider">Provider</Label>
                <Select
                  value={providerFilter}
                  onValueChange={(p) => {
                    location.hash = `lab/${run.id}/${p}/${evidenceFilter}`;
                  }}
                >
                  <SelectTrigger id="receipt-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    {run.providers.map((p) => (
                      <SelectItem key={p} value={p}>
                        {providerNames[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="receipt-finding">Show receipts</Label>
                <Select
                  value={evidenceFilter}
                  onValueChange={(f) => {
                    location.hash = `lab/${run.id}/${providerFilter}/${f}`;
                  }}
                >
                  <SelectTrigger id="receipt-finding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All results</SelectItem>
                    <SelectItem value="missed">Missed references</SelectItem>
                    <SelectItem value="unreviewed">Needs review</SelectItem>
                    <SelectItem value="errors">Request errors</SelectItem>
                    <SelectItem value="truncated">Partial captures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span role="status">
                {visibleCalls.length} of {run.calls.length} receipts
              </span>
            </div>
            <div className="lab-receipt-list">
              {visibleCalls.map((c) => (
                <button
                  className="lab-receipt-row"
                  key={c.id}
                  disabled={["pending", "running"].includes(c.status)}
                  onClick={() => setReceiptId(c.id)}
                >
                  <span className="provider-monogram">
                    {providerNames[c.provider][0]}
                  </span>
                  <span>
                    <strong>
                      {run.cases.find((t) => t.id === c.caseId)?.title}
                    </strong>
                    <small>
                      {providerNames[c.provider]} · {c.status}
                      {c.measurements?.truncated ? " · Partial capture" : ""}
                    </small>
                  </span>
                  <span className="lab-receipt-check">
                    {c.measurements?.referenceCheck === true
                      ? "Reference matched"
                      : c.measurements?.referenceCheck === false
                        ? "Reference missed"
                        : "Not measured"}
                    <small>
                      {c.reviews.at(-1)
                        ? `Review: ${c.reviews.at(-1)!.verdict.replaceAll("_", " ")}`
                        : "Not reviewed"}
                    </small>
                  </span>
                  <ArrowUpRight />
                </button>
              ))}
              {visibleCalls.length === 0 && (
                <p className="lab-empty">No receipts match these filters.</p>
              )}
            </div>
          </Panel>
          <details className="lab-methodology">
            <summary>Recorded settings and provenance</summary>
            <p>
              Forced by the backend test runner. No agent preference is
              inferred. Suite hash: <code>{run.suiteHash}</code>. Rate card:{" "}
              <code>{run.rateCardVersion}</code>.
            </p>
            <pre>{JSON.stringify(run.adapterSnapshot, null, 2)}</pre>
          </details>
        </>
      )}
      <Dialog
        open={!!suiteEditor}
        onOpenChange={(open) => {
          if (!open) setSuiteEditor(null);
        }}
      >
        <DialogContent className="company-plan-dialog">
          <DialogHeader>
            <DialogTitle>
              {suiteEditor?.initial && !suiteEditor.duplicate
                ? "Edit test suite"
                : "Create test suite"}
            </DialogTitle>
            <DialogDescription>
              Save versioned cases and explicit checks before running a
              comparison.
            </DialogDescription>
          </DialogHeader>
          {suiteEditor && (
            <ProviderSuiteEditor
              initial={suiteEditor.initial}
              duplicate={suiteEditor.duplicate}
              onSaved={(suite) => {
                setSuiteId(suite.id);
                setData((d) =>
                  d
                    ? {
                        ...d,
                        suites: [
                          ...d.suites.filter((s) => s.id !== suite.id),
                          suite,
                        ],
                      }
                    : d,
                );
                setProviders(
                  data?.providers
                    .filter(
                      (p) =>
                        p.configured &&
                        p.enabled !== false &&
                        suite.cases.some(
                          (c) =>
                            c.kind === (providerOperation(p.id) ?? "search"),
                        ),
                    )
                    .map((p) => p.id) ?? [],
                );
                requestKey.current = null;
                setSuiteEditor(null);
                setNotice(
                  "Suite saved. Earlier runs retain their original cases and checks.",
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!receipt}
        onOpenChange={(open) => {
          if (!open) setReceiptId(null);
        }}
      >
        <DialogContent className="lab-receipt-dialog">
          <DialogHeader>
            <DialogTitle>
              {receipt
                ? `${providerNames[receipt.provider]} test receipt`
                : "Test receipt"}
            </DialogTitle>
            <DialogDescription>
              Captured provider response and separate usefulness review.
            </DialogDescription>
          </DialogHeader>
          {receipt && run && (
            <ReceiptContent
              key={receipt.id}
              run={run}
              call={receipt}
              onSave={async (body) => {
                detailMutation.current++;
                const updated = await api<LabRun>(
                  `/provider-lab/runs/${run.id}/calls/${receipt.id}/review`,
                  body,
                );
                detailMutation.current++;
                applyRun(updated);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReceiptContent({
  run,
  call,
  onSave,
}: {
  run: LabRun;
  call: LabCall;
  onSave: (body: unknown) => Promise<void>;
}) {
  const previous = call.reviews.at(-1);
  const [verdict, setVerdict] = useState<EvidenceReview["verdict"]>(
    previous?.verdict ?? "unknown",
  );
  const [author, setAuthor] = useState<EvidenceReview["author"]>(
    previous?.author ?? "unspecified",
  );
  const [note, setNote] = useState(previous?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const test = run.cases.find((c) => c.id === call.caseId)!;
  const sources = call.result?.sources as Source[] | undefined;
  const usage = providerUsage([call]);
  return (
    <div className="lab-receipt-content">
      <div className="lab-input">
        <strong>{test.title}</strong>
        <p>{test.input}</p>
        <Badge variant="outline">{call.status}</Badge>
        {call.httpStatus && (
          <Badge variant="outline">API HTTP {call.httpStatus}</Badge>
        )}
        {call.measurements?.pageStatus && (
          <Badge variant="outline">
            Page HTTP {call.measurements.pageStatus}
          </Badge>
        )}
        {call.measurements?.truncated && (
          <Badge variant="outline">Partial capture</Badge>
        )}
      </div>
      {call.error && <p className="notice">{call.error}</p>}
      <div className="lab-usage-details">
        <span>
          {call.status === "skipped"
            ? "Not requested · $0.000 used"
            : `${money(call.estimateMicros)} estimated`}
        </span>
        {usage.usdCalls > 0 && (
          <span>{money(usage.reportedUsd * 1e6)} provider-reported USD</span>
        )}
        {usage.creditCalls > 0 && (
          <span>
            {usage.credits} provider-reported{" "}
            {providerEntry(call.provider)?.usageUnit ?? "credits"}
          </span>
        )}
        {(usage.usdCalls > 0 || usage.creditCalls > 0) && (
          <small>
            Reported usage is not an invoice; credits are not USD charges.
          </small>
        )}
      </div>
      <div
        className="lab-captured"
        role="region"
        aria-label="Captured test evidence"
        tabIndex={0}
      >
        {sources ? (
          sources.map((s, i) => (
            <article key={s.id}>
              <strong>
                {i + 1}. {s.title}
              </strong>
              <a href={s.url} target="_blank" rel="noopener noreferrer">
                {s.url}
              </a>
              <p>{s.snippet || "No excerpt returned."}</p>
            </article>
          ))
        ) : (
          <pre>
            {String(call.result?.text ?? "No source content was captured.")}
          </pre>
        )}
      </div>
      <details>
        <summary>Reference check definition</summary>
        <p>
          {test.kind === "search"
            ? "Expected page in the first three results. A useful alternative may still fail this narrow check."
            : `Successful page status and these markers: ${test.terms.join(", ")}.`}
        </p>
        <a href={test.referenceUrl} target="_blank" rel="noopener noreferrer">
          Open reference page
        </a>
      </details>
      {call.status === "skipped" ? (
        <p className="notice">
          This request was skipped. No provider evidence was collected and there
          is nothing to grade.
        </p>
      ) : (
        <form
          className="lab-review-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await onSave({ verdict, note, author });
              setSaved(true);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>Review evidence usefulness</h3>
          <p className="field-hint">
            Judge whether the captured evidence helps this test question. This
            is a reported judgment, not independent verification.
          </p>
          <div className="lab-review-selects">
            <div>
              <Label htmlFor="lab-verdict">Verdict</Label>
              <Select
                value={verdict}
                onValueChange={(v) => {
                  setVerdict(v as typeof verdict);
                  setSaved(false);
                }}
              >
                <SelectTrigger id="lab-verdict">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["unknown", "useful", "partial", "not_useful"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v === "not_useful"
                        ? "Not useful"
                        : v[0].toUpperCase() + v.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lab-author">Review source</Label>
              <Select
                value={author}
                onValueChange={(v) => {
                  setAuthor(v as typeof author);
                  setSaved(false);
                }}
              >
                <SelectTrigger id="lab-author">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unspecified">Account review</SelectItem>
                  <SelectItem value="human_reported">
                    Human review (self-reported)
                  </SelectItem>
                  <SelectItem value="assistant_reported">
                    Assistant review
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Label htmlFor="lab-review-note">What supports this judgment?</Label>
          <Textarea
            id="lab-review-note"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setSaved(false);
            }}
            minLength={10}
            maxLength={3000}
            required
            placeholder="Point to the returned evidence, missing details, or uncertainty."
          />
          <InlineError message={error} />
          <div className="lab-run-footer">
            <span className="field-hint">
              {call.reviews.length} saved review versions
            </span>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save evidence review"}
            </Button>
          </div>
          {saved && <p role="status">Evidence review saved.</p>}
        </form>
      )}
      {call.reviews.length > 0 && (
        <section
          className="lab-review-history"
          aria-label="Evidence review history"
        >
          <h3>Review history</h3>
          <p className="field-hint">
            Earlier judgments remain visible. Only the latest verdict
            contributes to review counts; identities are not independently
            verified.
          </p>
          {[...call.reviews].reverse().map((review, index) => (
            <article key={`${review.at}-${index}`}>
              <div>
                <strong>
                  Version {call.reviews.length - index} ·{" "}
                  {review.verdict.replaceAll("_", " ")}
                </strong>
                <time dateTime={review.at}>{date(review.at)}</time>
              </div>
              <small>
                {review.author === "assistant_reported"
                  ? "Assistant reported"
                  : review.author === "human_reported"
                    ? "Human reported"
                    : "Account review · identity unspecified"}
              </small>
              <p>{review.note}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
