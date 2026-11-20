import {
  isExtractProvider,
  providerIds,
  providerLabel,
  searchProviderIds,
} from "../../server/provider-catalog";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Check,
  Fingerprint01 as Fingerprint,
  GitBranch01 as GitBranch,
  Globe02 as Globe2,
  LayersThree01 as Layers3,
  Loading02 as LoaderCircle,
  Lock01 as LockKeyhole,
  ShieldTick as ShieldCheck,
  Stars01 as Sparkles,
} from "@untitledui/icons";
import type { ServerHealth } from "../../server/types";
import { money } from "../api";
import { ProviderMark } from "./shared";
const defaults = [
  "Currently operating",
  "External funding evidence",
  "Agent payments relevance",
];
const initialPrompt =
  "Find 20 companies currently operating in agent payments that have raised external funding. Exclude dead landing pages and return evidence links.";

export function IntentForm({
  health,
  onCreate,
  busy,
  onSettings,
}: {
  health: ServerHealth | undefined;
  onCreate: (body: any) => void;
  busy: boolean;
  onSettings: () => void;
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [query, setQuery] = useState("agent payments companies funding");
  const [criteria, setCriteria] = useState(defaults.join("\n"));
  const [budget, setBudget] = useState("0.10");
  const [count, setCount] = useState(20);
  const [mode, setMode] = useState("route");
  const [preference, setPreference] = useState("balanced");
  const [domains, setDomains] = useState("");
  const [supporting, setSupporting] = useState("");
  const [consent, setConsent] = useState(false);
  return (
    <div className="workspace-grid compose-grid">
      <div>
        <section className="panel compose">
          <div className="panel-heading">
            <span>
              <Sparkles size={17} />
              Define your research
            </span>
            <span className="small-label">01 / FRAME THE INTENT</span>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate({
                prompt,
                query,
                queries: [
                  query,
                  ...supporting
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                ],
                criteria: criteria
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
                requiredCount: count,
                budgetMicros: Math.round(Number(budget) * 1e6),
                domains: domains
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                mode,
                preference,
                consent,
              });
            }}
          >
            <label className="field-label" htmlFor="objective">
              What should the agent accomplish?
            </label>
            <textarea
              id="objective"
              className="prompt-input"
              rows={4}
              value={prompt}
              minLength={10}
              maxLength={4000}
              required
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="prompt-footnote">
              <Fingerprint size={14} />
              Your explicit criteria guide the task. No hidden intent inference.
            </div>
            <div className="form-section">
              <div className="section-label">
                <span>Success criteria</span>
                <span>Editable rubric</span>
              </div>
              <label htmlFor="criteria" className="sr-only">
                Success criteria, one per line
              </label>
              <textarea
                id="criteria"
                className="criteria-input"
                rows={3}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                required
              />
              <p className="tiny muted">
                One criterion per line. Each will be reviewed as pass, fail, or
                unknown.
              </p>
              <div className="form-row">
                <label>
                  Target organizations
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                  />
                </label>
                <label>
                  Budget cap (USD)
                  <input
                    type="number"
                    min="0.001"
                    max="5"
                    step="0.001"
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="form-section">
              <div className="section-label">
                <span>Search & routing</span>
                <span>Deterministic policy</span>
              </div>
              <label>
                Search query
                <input
                  required
                  minLength={3}
                  maxLength={500}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <details className="plan-details">
                <summary>
                  <GitBranch size={13} />
                  Add supporting searches <span>optional · up to 4</span>
                </summary>
                <label>
                  Supporting queries, one per line
                  <textarea
                    rows={3}
                    value={supporting}
                    onChange={(e) => setSupporting(e.target.value)}
                    placeholder={
                      "agent payment startup seed funding\nagentic payments product launch"
                    }
                  />
                </label>
                <p className="tiny muted">
                  The controlled agent executes these queries in order, under
                  the same task budget. This is an explicit research plan, not
                  an autonomous LLM.
                </p>
              </details>
              <div className="mode-options">
                <button
                  type="button"
                  className={mode === "route" ? "chosen" : ""}
                  onClick={() => setMode("route")}
                >
                  <GitBranch size={18} />
                  <span>
                    Smart route<small>One provider, fallback if needed</small>
                  </span>
                  <span className="radio-dot" />
                </button>
                <button
                  type="button"
                  className={mode === "compare" ? "chosen" : ""}
                  onClick={() => setMode("compare")}
                >
                  <Layers3 size={18} />
                  <span>
                    Compare providers
                    <small>Two live calls · both count toward budget</small>
                  </span>
                  <span className="radio-dot" />
                </button>
              </div>
              <div className="form-row">
                <label>
                  Routing preference
                  <select
                    value={preference}
                    onChange={(e) => setPreference(e.target.value)}
                  >
                    <option value="balanced">Balanced</option>
                    <option value="cost">Lower estimated cost</option>
                    <option value="latency">Lower observed latency</option>
                  </select>
                </label>
                <label>
                  Allowed domains <span className="muted">(optional)</span>
                  <input
                    placeholder="example.com, news.com"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="estimate-preview">
              <Activity size={15} />
              <div>
                <b>Preflight estimate</b>
                <p>
                  {1 + supporting.split("\n").filter((s) => s.trim()).length}{" "}
                  planned {supporting.trim() ? "queries" : "query"} ·{" "}
                  {money(
                    (health
                      ? searchProviderIds
                          .filter((p) => health.providers[p])
                          .reduce((sum, p) => sum + health.estimates[p], 0)
                      : 0) *
                      (1 +
                        supporting.split("\n").filter((s) => s.trim()).length),
                  )}{" "}
                  if every available provider is called once per query. Each
                  call is checked against the remaining budget.
                </p>
              </div>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                Include this task in de-identified provider analytics
                <small>
                  Optional. Prompts, queries, and source content are excluded.
                </small>
              </span>
            </label>
            <div className="compose-footer">
              <span>
                <LockKeyhole size={14} />
                Saved locally on your server
              </span>
              <button className="button primary" disabled={busy} type="submit">
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Save intent
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
        <div className="explanation-row">
          <span>
            01 <b>Frame intent</b>
          </span>
          <ArrowRight size={14} />
          <span>
            02 <b>Route & execute</b>
          </span>
          <ArrowRight size={14} />
          <span>
            03 <b>Review evidence</b>
          </span>
        </div>
      </div>
      <div className="right-rail">
        <section className="panel provider-panel">
          <div className="panel-heading">
            <span>
              <Globe2 size={17} />
              Provider network
            </span>
            <span className="small-label">Live</span>
          </div>
          <p className="rail-intro">
            One normalized tool. Multiple real providers.
          </p>
          {providerIds.map((p) => (
            <div className="provider-row" key={p}>
              <ProviderMark provider={p} />
              <div>
                <b>{providerLabel(p)}</b>
                <small>
                  {isExtractProvider(p)
                    ? "Page extraction · optional"
                    : "Web search"}
                </small>
              </div>
              <span
                className={`status-dot ${health?.providers[p] ? "complete" : ""}`}
              />
            </div>
          ))}
          <button
            className="text-button connections-button"
            onClick={onSettings}
          >
            Manage connections
            <ArrowUpRight size={14} />
          </button>
        </section>
        <section className="principle-card">
          <div className="principle-icon">
            <GitBranch size={23} />
          </div>
          <h3>Every decision, explained.</h3>
          <p>
            Compare eligible providers, inspect scoring, and follow the evidence
            from request to outcome.
          </p>
          <div>
            <Check size={14} /> Budget checked before every call
          </div>
          <div>
            <Check size={14} /> Unknown signals stay neutral
          </div>
          <div>
            <Check size={14} /> No synthetic provider results
          </div>
        </section>
        <div className="privacy-note">
          <ShieldCheck size={17} />
          <p>
            API success ≠ task success.
            <br />A 200 response may still leave your criteria unproven. The
            inspector shows both.
          </p>
        </div>
      </div>
    </div>
  );
}
