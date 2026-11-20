import { useEffect, useState } from "react";
import type { SellerAnalysis } from "../server/seller-report";
import type { Alert, Finding } from "../server/seller-insights";
import type { SellerSettings } from "../server/seller-store";
import type { ProviderId } from "../server/types";
import { api, money } from "./api";
import { Panel, InlineError } from "./observation-ui";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

type SellerReport = SellerAnalysis & { simulated: { note: string } | null };
type Overview = {
  change: {
    eligiblePercent: number | null;
    chosenSharePoints: number | null;
    citedSharePoints: number | null;
    failureRatePoints: number | null;
  };
  alerts: Alert[];
  findings: Finding[];
  findingCount: number;
  namedComparison: boolean;
  listing: { liveVersion: number; pendingVersion: number | null };
  filters: { taskTypes: { key: string; label: string }[]; hosts: string[] };
};
const signed = (v: number | null, unit: string) =>
  v === null
    ? "No earlier period to compare"
    : `${v > 0 ? "+" : ""}${v}${unit} on the previous period`;
type Row = { key: string; label: string; count: number };
const percent = (v: number | null) =>
  v === null ? "—" : `${Math.round(v * 100)}%`;

function Bars({ rows, empty }: { rows: Row[]; empty: string }) {
  const most = Math.max(1, ...rows.map((r) => r.count));
  if (!rows.length) return <p className="choices-empty">{empty}</p>;
  return (
    <ul className="choices-bars">
      {rows.map((r) => (
        <li key={r.key}>
          <div>
            <span>{r.label}</span>
            <strong>{r.count}</strong>
          </div>
          <span className="choices-track">
            <span style={{ width: `${(r.count / most) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SellerChoicesView({
  provider,
  demo,
}: {
  provider: ProviderId;
  demo: boolean;
}) {
  const [days, setDays] = useState("30");
  const [taskType, setTaskType] = useState("all");
  const [host, setHost] = useState("all");
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<SellerReport>();
  const [overview, setOverview] = useState<Overview>();
  const [error, setError] = useState("");
  const filter = `days=${days}${taskType === "all" ? "" : `&taskType=${taskType}`}${host === "all" ? "" : `&host=${encodeURIComponent(host)}`}`;
  useEffect(() => {
    let stale = false;
    setData(undefined);
    setError("");
    if (demo) return;
    Promise.all([
      api<SellerReport>(`/seller/${provider}/report?${filter}`),
      api<Overview>(`/seller/${provider}/overview?days=${days}`),
    ])
      .then(([report, summary]) => {
        if (stale) return;
        setData(report);
        setOverview(summary);
      })
      .catch((e) => !stale && setError((e as Error).message));
    return () => {
      stale = true;
    };
  }, [provider, days, filter, demo, revision]);
  const named = overview?.namedComparison ?? false;
  async function setNamed(value: boolean) {
    try {
      const current = await api<SellerSettings>(`/seller/${provider}/settings`);
      await api(`/seller/${provider}/settings`, {
        revision: current.revision,
        namedComparison: value,
        alerts: current.alerts,
      });
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (demo)
    return (
      <Panel title="Agent choices from real tool use">
        <div className="lab-empty">
          <h3>Connect this view to your workspace</h3>
          <p>
            Choose Local lab above to see where agents chose this tool, where
            they chose another, and the reasons they gave.
          </p>
        </div>
      </Panel>
    );
  const f = data?.funnel;
  const steps = f
    ? [
        ["Eligible", f.eligible, "tasks this tool could have served", null],
        ["Chosen by the agent", f.chosen, "of eligible", f.chosenShare],
        ["Call succeeded", f.succeeded, "of chosen", f.succeededShare],
        ["Cited in the answer", f.cited, "of succeeded", f.citedShare],
      ]
    : [];
  return (
    <div className="provider-activity seller-choices">
      <div className="lab-result-heading">
        <div>
          <h2>Agent choices</h2>
          <p>Where agents chose this tool, where they chose another, and why</p>
        </div>
        <div className="activity-controls">
          <div className="choices-switch">
            <Label htmlFor="choices-named">Share and see company names</Label>
            <Switch
              id="choices-named"
              checked={named}
              onCheckedChange={setNamed}
            />
          </div>
          <div>
            <Label htmlFor="choices-task">Task type</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger id="choices-task">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All task types</SelectItem>
                {overview?.filters.taskTypes.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="choices-host">Agent</Label>
            <Select value={host} onValueChange={setHost}>
              <SelectTrigger id="choices-host">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {overview?.filters.hosts.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="choices-window">Time window</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger id="choices-window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 30, 90].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    Last {d} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <InlineError message={error} />
      {!data && !error && <p role="status">Loading agent choices…</p>}
      {data && f && (
        <>
          {data.simulated && (
            <p className="choices-simulated" role="note">
              {data.simulated.note}
            </p>
          )}
          {overview && (
            <div className="choices-grid">
              <Panel
                title="What changed"
                description={`Against the ${data.days} days before. Names appear only when the other company has also agreed.`}
              >
                <dl className="choices-facts">
                  <div>
                    <dt>Eligible tasks</dt>
                    <dd>{signed(overview.change.eligiblePercent, "%")}</dd>
                  </div>
                  <div>
                    <dt>Chosen share</dt>
                    <dd>{signed(overview.change.chosenSharePoints, " pts")}</dd>
                  </div>
                  <div>
                    <dt>Failed calls</dt>
                    <dd>{signed(overview.change.failureRatePoints, " pts")}</dd>
                  </div>
                </dl>
                {overview.alerts.length ? (
                  <ul className="choices-callouts">
                    {overview.alerts.map((a) => (
                      <li key={a.id}>{a.message}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="choices-note">
                    Nothing crossed your alert thresholds.
                  </p>
                )}
              </Panel>
              <Panel
                title="Where to look next"
                description={`${overview.findingCount} finding${overview.findingCount === 1 ? "" : "s"} from this period's evidence`}
              >
                {overview.findings.length ? (
                  <ul className="choices-findings">
                    {overview.findings.map((f) => (
                      <li key={f.id}>
                        <strong>{f.title}</strong>
                        <span>{f.evidence}</span>
                        <span>{f.suggestion}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="choices-empty">
                    Nothing stands out in this period.
                  </p>
                )}
              </Panel>
            </div>
          )}
          <p className="choices-note">
            {data.dataQuality.tasks} tasks
            {data.dataQuality.excludedInternal
              ? ` · ${data.dataQuality.excludedInternal} internal tasks left out`
              : ""}
            {data.dataQuality.reasonThemeReported !== null
              ? ` · ${percent(data.dataQuality.reasonThemeReported)} of choices carry a reason`
              : ""}
            {" · Download: "}
            {["tasks", "reasons", "missed", "failures", "trend"].map((s, i) => (
              <span key={s}>
                {i ? ", " : ""}
                <a
                  href={`/api/seller/${provider}/export?section=${s}&${filter}`}
                >
                  {s}
                </a>
              </span>
            ))}
          </p>
          <Panel
            title="From eligible to cited"
            description={`A task is one recorded session. Shares need at least ${data.minSample} tasks.`}
          >
            <ol className="choices-funnel">
              {steps.map(([label, count, of, share]) => (
                <li key={String(label)}>
                  <div>
                    <span>{label}</span>
                    <small>
                      {share === null &&
                      of !== "of eligible" &&
                      label === "Eligible"
                        ? of
                        : `${percent(share as number | null)} ${of}`}
                    </small>
                  </div>
                  <span className="choices-track">
                    <span
                      style={{
                        width: `${f.eligible ? (Number(count) / f.eligible) * 100 : 0}%`,
                      }}
                    />
                  </span>
                  <strong>{count}</strong>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel
            title="Who was chosen, by kind of task"
            description="Only tasks where this tool was eligible. Neither means the agent answered without calling a tool of this kind. Task type is reported by the agent."
          >
            {data.byTaskType.length ? (
              <div className="lab-table-wrap">
                <table className="lab-table choices-table">
                  <thead>
                    <tr>
                      <th>Task type</th>
                      <th>Eligible</th>
                      <th>Chosen</th>
                      <th>{data.providerName}</th>
                      <th>Others</th>
                      <th>Neither</th>
                      <th>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byTaskType.map((t) => {
                      const others = t.rivals.reduce((n, r) => n + r.count, 0);
                      return (
                        <tr key={t.taskType}>
                          <td>{t.label}</td>
                          <td>{t.eligible}</td>
                          <td>
                            <span
                              className="choices-stack"
                              role="img"
                              aria-label={`${data.providerName} ${t.you}, ${t.rivals.map((r) => `${r.label} ${r.count}`).join(", ") || "others 0"}, neither ${t.none}`}
                            >
                              <span
                                className="you"
                                style={{
                                  width: `${(t.you / t.eligible) * 100}%`,
                                }}
                              />
                              <span
                                className="rival"
                                style={{
                                  width: `${(others / t.eligible) * 100}%`,
                                }}
                              />
                            </span>
                          </td>
                          <td>{t.you}</td>
                          <td
                            title={t.rivals
                              .map((r) => `${r.label} ${r.count}`)
                              .join(", ")}
                          >
                            {others}
                          </td>
                          <td>{t.none}</td>
                          <td>{percent(t.share)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="choices-empty">No eligible tasks in this window.</p>
            )}
            {data.lostTo.length > 0 && (
              <p className="choices-note">
                Chosen instead:{" "}
                {data.lostTo.map((r) => `${r.label} in ${r.count}`).join(", ")}.
              </p>
            )}
          </Panel>
          <div className="choices-grid">
            <Panel
              title={`Why agents chose ${data.providerName}`}
              description="The theme each agent gave with its first call"
            >
              <Bars rows={data.reasonsFor} empty="No choices recorded yet." />
            </Panel>
            <Panel
              title="Why agents chose another tool"
              description="Same tasks this tool was eligible for"
            >
              <Bars
                rows={data.reasonsAgainst}
                empty="No losses recorded yet."
              />
            </Panel>
            <Panel
              title="Demand this tool could not serve"
              description="Requests of this kind where it was ruled out before the agent chose"
            >
              <Bars rows={data.missed} empty="Nothing was ruled out." />
            </Panel>
            <Panel
              title="When a call went wrong"
              description={`${data.calls.total} calls · ${data.calls.succeeded} succeeded · ${data.calls.emptyResults} returned nothing`}
            >
              <Bars
                rows={[
                  ...data.calls.failures,
                  ...data.calls.afterFailure.map((r) => ({
                    ...r,
                    label: `Then: ${r.label[0].toLowerCase()}${r.label.slice(1)}`,
                  })),
                ]}
                empty="No failed calls."
              />
            </Panel>
            <Panel title="Price as agents see it">
              <dl className="choices-facts">
                <div>
                  <dt>Average estimate shown</dt>
                  <dd>
                    {data.cost.averageEstimateMicros === null
                      ? "—"
                      : money(data.cost.averageEstimateMicros)}
                  </dd>
                </div>
                <div>
                  <dt>Average cost reported back</dt>
                  <dd>
                    {data.cost.averageReportedUsd === null
                      ? "Not reported"
                      : `${money(data.cost.averageReportedUsd * 1e6)} over ${data.cost.usdCalls} calls`}
                  </dd>
                </div>
                <div>
                  <dt>Tasks ruled out on budget</dt>
                  <dd>{data.cost.ruledOutOnBudget}</dd>
                </div>
                <div>
                  <dt>Tasks lost with lower cost as the reason</dt>
                  <dd>{data.cost.lostOnCost}</dd>
                </div>
                <div>
                  <dt>Calls Two Hands routed here, not counted as choices</dt>
                  <dd>{data.calls.routedByOctolab}</dd>
                </div>
              </dl>
            </Panel>
            <Panel
              title="Used alongside, and by which agents"
              description="Tasks that chose this tool. Agent names are self-reported."
            >
              <Bars
                rows={[
                  ...data.coUsage.map((r) => ({
                    ...r,
                    label: `With ${r.label}`,
                  })),
                  ...data.hosts,
                ]}
                empty="No tasks chose this tool yet."
              />
            </Panel>
          </div>
          <ul className="choices-notes">
            {data.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
