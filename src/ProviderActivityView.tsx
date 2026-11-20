import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw01 } from "@untitledui/icons";
import type { ProviderActivity } from "../server/provider-activity";
import type { ProviderId } from "../server/types";
import { api, money } from "./api";
import { Panel, InlineError, date } from "./observation-ui";
import { providerNames } from "./ProviderLabView";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";

export function ProviderActivityView({
  provider,
  demo,
}: {
  provider: ProviderId;
  demo: boolean;
}) {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<ProviderActivity>();
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let stale = false;
    let timer: ReturnType<typeof setTimeout>;
    setData(undefined);
    setError("");
    if (demo) return;
    async function refresh() {
      try {
        const value = await api<ProviderActivity>(
          `/provider-activity/${provider}?days=${days}`,
        );
        if (!stale) {
          setData(value);
          setError("");
        }
      } catch (e) {
        if (!stale) {
          setData(undefined);
          setError((e as Error).message);
        }
      } finally {
        if (!stale) timer = setTimeout(refresh, 10000);
      }
    }
    void refresh();
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [provider, days, demo, revision]);
  if (demo)
    return (
      <Panel title="Activity from real tool use">
        <div className="lab-empty">
          <h3>See recorded activity</h3>
          <p>
            Choose Local lab above to inspect recorded requests, reported hosts,
            daily activity, and tools used in the same sessions.
          </p>
        </div>
      </Panel>
    );
  const ms = (v: number | null) =>
    v === null ? "—" : `${(v / 1000).toFixed(2)} s`;
  const maximum = Math.max(1, ...(data?.daily.map((d) => d.calls) ?? []));
  return (
    <div className="provider-activity">
      <div className="lab-result-heading">
        <div>
          <h2>Live usage</h2>
          <p>Recorded organic requests · refreshes every 10 seconds</p>
        </div>
        <div className="activity-controls">
          <div>
            <Label htmlFor="activity-window">Time window</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger id="activity-window">
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
          <Button
            variant="outline"
            aria-label="Refresh activity"
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw01 />
          </Button>
        </div>
      </div>
      <InlineError message={error} />
      {!data && !error && <p role="status">Loading observed activity…</p>}
      {data && (
        <>
          <div className="company-metric-grid">
            {[
              [
                "Organic requests",
                String(data.calls),
                `${data.sessions} recorded sessions · ${data.running} in progress`,
              ],
              [
                "Requests succeeded",
                data.settled
                  ? `${Math.round((data.succeeded / data.settled) * 100)}%`
                  : "—",
                `${data.succeeded} of ${data.settled} settled requests`,
              ],
              [
                "Median / p95 response",
                `${ms(data.medianLatencyMs)} / ${ms(data.p95LatencyMs)}`,
                "Measured on settled requests with timing",
              ],
              [
                "Estimated spend",
                money(data.estimatedMicros),
                `${data.usdReportingCalls} calls reported USD usage`,
              ],
            ].map(([title, value, detail]) => (
              <div className="company-metric" key={title}>
                <h2>{title}</h2>
                <strong>{value}</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
          <Panel
            title="Request activity"
            description={`UTC days · ${data.lastObservedAt ? `Latest recorded request ${date(data.lastObservedAt)}` : "No requests recorded in this window"}`}
            action={<Badge variant="outline">Observed</Badge>}
          >
            <div
              className="activity-chart"
              role="img"
              aria-label={`${data.calls} organic requests over ${days} days. ${data.succeeded} succeeded; ${data.failed} failed; ${data.interrupted} interrupted.`}
            >
              {data.daily.map((d) => (
                <div
                  className="activity-chart-column"
                  key={d.date}
                  title={`${d.date}: ${d.calls} requests, ${d.succeeded} succeeded, ${d.failed} failed or interrupted`}
                >
                  <div style={{ height: `${(d.calls / maximum) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="activity-chart-axis">
              <span>{data.start.slice(0, 10)}</span>
              <span>{data.end.slice(0, 10)}</span>
            </div>
            <details className="lab-methodology">
              <summary>Daily request table</summary>
              <div
                className="lab-table-wrap"
                role="region"
                aria-label="Daily request activity"
                tabIndex={0}
              >
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Date (UTC)</th>
                      <th>Requests</th>
                      <th>Succeeded</th>
                      <th>Failed / interrupted</th>
                      <th>Estimated spend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.map((d) => (
                      <tr key={d.date}>
                        <th scope="row">{d.date}</th>
                        <td>{d.calls}</td>
                        <td>{d.succeeded}</td>
                        <td>{d.failed}</td>
                        <td>{money(d.estimatedMicros)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Panel>
          <div className="company-main-grid">
            <Panel
              title="Where requests come from"
              description="Caller-reported host labels; these are not verified customer or model identities."
            >
              <div
                className="lab-table-wrap"
                role="region"
                aria-label="Reported hosts"
                tabIndex={0}
              >
                <table className="lab-table">
                  <thead>
                    <tr>
                      <th>Reported host</th>
                      <th>Sessions</th>
                      <th>Requests</th>
                      <th>Succeeded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hosts.map((h) => (
                      <tr key={h.host}>
                        <th scope="row">{h.host}</th>
                        <td>{h.sessions}</td>
                        <td>{h.calls}</td>
                        <td>{h.succeeded}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.hosts.length && (
                  <p className="lab-empty">No reported hosts yet.</p>
                )}
              </div>
            </Panel>
            <Panel
              title="Tools used together"
              description="Requests in the same recorded session and time window. This does not establish a workflow sequence."
            >
              <div className="activity-co-usage">
                {data.coUsage.map((p) => (
                  <a key={p.provider} href={`#company/${p.provider}/activity`}>
                    <span>
                      {providerNames[provider]} <ArrowRight />{" "}
                      {providerNames[p.provider]}
                    </span>
                    <strong>{p.sessions} sessions</strong>
                  </a>
                ))}
              </div>
            </Panel>
          </div>
          <div className="company-main-grid">
            <Panel
              title="Request failures"
              description="Transport outcomes, separate from the usefulness of returned evidence."
            >
              {data.errors.length ? (
                <ul className="activity-errors">
                  {data.errors.map((e) => (
                    <li key={e.label}>
                      <span>{e.label}</span>
                      <strong>{e.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="field-hint">
                  No failed or interrupted requests recorded in this window.
                </p>
              )}
            </Panel>
            <Panel title="Evidence reaching the answer">
              <div className="company-review-summary">
                <strong>{data.referenced}</strong>
                <span>settled calls referenced by a submitted output</span>
              </div>
              <p className="field-hint">
                A reference shows that the agent linked a call. It does not
                independently verify answer quality.{" "}
                {data.usdReportingCalls > 0
                  ? `${money(data.reportedUsd * 1e6)} USD reported across ${data.usdReportingCalls} calls; remaining usage is unreported.`
                  : "Provider-reported USD usage is unreported in this window."}
              </p>
            </Panel>
          </div>
          <p className="field-hint">{data.limitations}</p>
        </>
      )}
    </div>
  );
}
