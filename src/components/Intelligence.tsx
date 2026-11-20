import { useEffect, useState } from "react";
import {
  BarChart03 as BarChart3,
  Fingerprint01 as Fingerprint,
  GitBranch01 as GitBranch,
  LayersThree01 as Layers3,
  Loading02 as LoaderCircle,
  Lock01 as LockKeyhole,
  SearchLg as Search,
  ShieldTick as ShieldCheck,
} from "@untitledui/icons";
import { api, money } from "../api";
import type { Analytics } from "../../server/analytics";
import { Stat, ProviderMark } from "./shared";

export function metric(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : String(value);
}

export function Intelligence() {
  const [data, setData] = useState<Analytics>();
  const [error, setError] = useState("");
  useEffect(() => {
    api<Analytics>("/analytics")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> CROSS-PROVIDER OBSERVATIONS
          </div>
          <h1>A view beyond the API call.</h1>
          <p>
            Understand demand, routing conversion, and downstream evidence
            coverage.
          </p>
        </div>
        <span className="privacy-badge">
          <LockKeyhole size={13} />
          AGGREGATED & DE-IDENTIFIED
        </span>
      </div>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {!data ? (
        !error && (
          <div
            className="empty-state"
            role="status"
            aria-label="Loading provider analytics"
          >
            <LoaderCircle className="spin" />
          </div>
        )
      ) : (
        <>
          <div className="stats-grid">
            <Stat
              label="Consented tasks"
              value={String(data.cohortSize)}
              detail="Eligible opted-in tasks"
              icon={<Fingerprint size={17} />}
            />
            <Stat
              label="Search demand"
              value={metric(data.capabilities.search)}
              detail="Normalized research.search invocations"
              icon={<Search size={17} />}
            />
            <Stat
              label="Fallbacks considered"
              value={metric(data.fallbacks)}
              detail="Error or evidence coverage triggered"
              icon={<GitBranch size={17} />}
            />
            <Stat
              label="Opt-in comparisons"
              value={metric(data.comparisons)}
              detail="Same query, alternative live provider"
              icon={<Layers3 size={17} />}
            />
          </div>
          {data.cohortSize === 0 && (
            <div className="info-strip">
              <div>
                <h2>No usage yet</h2>
                <p>Recorded activity will appear here when available.</p>
              </div>
            </div>
          )}
          <section className="panel">
            <div className="panel-heading">
              <span>
                <BarChart3 size={17} />
                Competitive conversion & observed outcomes
              </span>
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Provider conversion and outcomes"
            >
              <table>
                <thead>
                  <tr>
                    <th>Provider</th>
                    <th>Eligible / first selected</th>
                    <th>HTTP success</th>
                    <th>Avg latency</th>
                    <th>Coverage pass</th>
                    <th>Est. cost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map((p) => (
                    <tr key={p.provider}>
                      <td>
                        <span className="table-provider">
                          <ProviderMark provider={p.provider} />
                          {p.provider}
                        </span>
                      </td>
                      <>
                        <td>
                          {metric(p.eligible)} / {metric(p.selected)}
                        </td>
                        <td>
                          {metric(p.httpSuccesses)} / {metric(p.calls)}
                        </td>
                        <td>
                          {p.latencyMs === null ? "—" : `${p.latencyMs} ms`}
                        </td>
                        <td>
                          {metric(p.coveragePasses)} /{" "}
                          {metric(p.coverageChecks)}
                        </td>
                        <td>
                          {p.estimatedMicros === null
                            ? "—"
                            : money(p.estimatedMicros)}
                        </td>
                      </>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <div className="intelligence-cards">
            <section className="panel">
              <div className="panel-heading">Coverage & fallback outcomes</div>
              <div className="rail-body">
                <div className="rail-row">
                  <span>Insufficient evidence after HTTP 200</span>
                  <b>{metric(data.insufficient200)}</b>
                </div>
                <div className="rail-row">
                  <span>Coverage recovered after fallback</span>
                  <b>{metric(data.fallbackRecoveries)}</b>
                </div>
                <p className="tiny muted">
                  Observed coverage changes only; this does not establish
                  causation or prove company facts.
                </p>
              </div>
              <div className="panel-heading">Demand by capability</div>
              <div className="rail-body">
                {Object.entries(data.capabilities).map(([k, v]) => (
                  <div className="rail-row" key={k}>
                    <span>{k}</span>
                    <b>{metric(v as number | null)}</b>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading">Budget & latency preferences</div>
              <div className="rail-body">
                {Object.entries(data.preferenceCounts).map(([k, v]) => (
                  <div className="rail-row" key={k}>
                    <span>{k}</span>
                    <b>{metric(v as number | null)}</b>
                  </div>
                ))}
                <p className="tiny muted">
                  Behavioral preference counts, not willingness-to-pay
                  estimates.
                </p>
              </div>
            </section>
            <section className="panel">
              <div className="panel-heading">Eligibility loss reasons</div>
              <div className="rail-body">
                {data.providers
                  .filter((p) => !p.suppressed)
                  .map((p) => (
                    <div key={p.provider}>
                      <b>{p.provider}</b>
                      {p.lossReasons.length ? (
                        p.lossReasons.map(([k, v]) => (
                          <p key={k} className="tiny muted">
                            {k}: {metric(v)}
                          </p>
                        ))
                      ) : (
                        <p className="tiny muted">
                          No eligibility exclusions recorded.
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          </div>
          <div className="info-strip">
            <ShieldCheck size={17} />
            {data.note}
          </div>
        </>
      )}
    </>
  );
}
