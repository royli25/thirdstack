import { useEffect, useState } from "react";
import {
  ChevronDown,
  Code02 as Code2,
  Download01 as Download,
  Fingerprint01 as Fingerprint,
  GitBranch01 as GitBranch,
  Lock01 as LockKeyhole,
  Play,
  PauseCircle as Pause,
  RefreshCcw01 as RotateCcw,
  ShieldTick as ShieldCheck,
} from "@untitledui/icons";
import {
  recordingIndex,
  loadRecording,
  type Recording,
  type RecordingMetadata,
} from "../recordings";
import { money, type TaskDetail } from "../api";
import type { TraceEvent, TaskSummary } from "../../server/types";
import { ProviderMark } from "./shared";

export function Inspector({
  task: activeTask,
  tasks,
  onSelect,
  onExport,
}: {
  task: TaskDetail | undefined;
  tasks: TaskSummary[];
  onSelect: (id: string) => Promise<void>;
  onExport: () => Promise<void>;
}) {
  const [recordings, setRecordings] = useState<RecordingMetadata[]>([]);
  const [recording, setRecording] = useState<Recording>();
  const [recordingError, setRecordingError] = useState("");
  const task = recording || activeTask;
  useEffect(() => {
    recordingIndex()
      .then(setRecordings)
      .catch((e) => setRecordingError(e.message));
  }, []);
  async function select(value: string) {
    setRecordingError("");
    if (value.startsWith("recording:")) {
      const metadata = recordings.find((r) => `recording:${r.id}` === value);
      if (!metadata) return;
      try {
        setRecording(await loadRecording(metadata));
      } catch (e) {
        setRecordingError((e as Error).message);
      }
    } else {
      setRecording(undefined);
      await onSelect(value);
    }
  }
  async function download() {
    if (!recording) {
      await onExport();
      return;
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(recording.raw, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${recording.metadata.id}-historical.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [replayCount, setReplayCount] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setReplayCount(null);
    setPlaying(false);
    setExpanded(null);
  }, [task?.id]);
  useEffect(() => {
    if (!playing || !task) return;
    const timer = setInterval(
      () =>
        setReplayCount((current) => {
          const next = (current ?? 0) + 1;
          if (next >= task.events.length) {
            setPlaying(false);
            return task.events.length;
          }
          return next;
        }),
      600,
    );
    return () => clearInterval(timer);
  }, [playing, task?.events.length]);
  const events =
    task?.events
      .slice(0, replayCount ?? task.events.length)
      .filter(
        (e) =>
          filter === "all" ||
          (filter === "routing" &&
            [
              "provider_candidates",
              "route_selected",
              "route_blocked",
              "fallback_triggered",
              "comparison_requested",
            ].includes(e.type)) ||
          (filter === "execution" &&
            [
              "provider_request",
              "provider_response",
              "budget_reserved",
              "budget_settled",
            ].includes(e.type)) ||
          (filter === "outcomes" &&
            [
              "outcome_evaluated",
              "extraction_received",
              "assessment_invalidated",
              "user_feedback",
              "run_finished",
            ].includes(e.type)),
      ) || [];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span /> EVERY DECISION, RECONSTRUCTABLE
          </div>
          <h1>The execution behind the answer.</h1>
          <p>
            Follow intent, provider selection, cost, and evidence through one
            timeline.
          </p>
        </div>
        <button
          className="button secondary"
          disabled={!task}
          onClick={() => void download()}
        >
          <Download size={15} />
          Sanitized export
        </button>
      </div>
      <div className="inspector-toolbar">
        <select
          aria-label="Inspect research session"
          value={task?.id || ""}
          onChange={(e) => void select(e.target.value)}
        >
          <option value="" disabled>
            Select a research session
          </option>
          {recordings.length > 0 && (
            <optgroup label="Historical live recordings — sanitized">
              {recordings.map((r) => (
                <option key={r.id} value={`recording:${r.id}`}>
                  {r.title}
                </option>
              ))}
            </optgroup>
          )}
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.query} · {t.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <span className="mono muted">
          {task
            ? `${task.events.length} Append-only events`
            : "No session selected"}
        </span>
      </div>
      {recordingError && (
        <div className="info-strip">
          {recordingError}. Current research traces remain available.
        </div>
      )}
      {recording && (
        <div className="historical-banner" role="status">
          <LockKeyhole size={17} />
          <div>
            <strong>Historical live recording · read only</strong>
            <p>
              Captured{" "}
              {new Date(recording.metadata.capturedAt).toLocaleString()}.
              Sanitized real execution, not a new live call or current provider
              benchmark. This recording does not populate research results or
              provider analytics.
            </p>
          </div>
        </div>
      )}
      {task && (
        <div className="replay-controls">
          <button
            className="button secondary"
            disabled={!task.events.length}
            onClick={() => {
              if (playing) {
                setPlaying(false);
              } else {
                if (replayCount === null || replayCount >= task.events.length)
                  setReplayCount(0);
                setPlaying(true);
              }
            }}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
            {playing ? "Pause replay" : "Replay trace"}
          </button>
          <input
            aria-label="Recorded trace position"
            type="range"
            min={0}
            max={task.events.length}
            value={replayCount ?? task.events.length}
            onChange={(e) => {
              setPlaying(false);
              setReplayCount(Number(e.target.value));
            }}
          />
          <span className="mono">
            {replayCount ?? task.events.length} / {task.events.length}
          </span>
          <button
            className="icon-button"
            aria-label="Show full trace"
            onClick={() => {
              setPlaying(false);
              setReplayCount(null);
            }}
          >
            <RotateCcw size={14} />
          </button>
          <span className="tiny muted">Recorded events · no API calls</span>
        </div>
      )}
      <div className="inspector-grid">
        <section className="panel">
          <div className="tab-bar">
            {["all", "routing", "execution", "outcomes"].map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All events" : f}
              </button>
            ))}
          </div>
          {events.length ? (
            <div className="event-list">
              {events.map((e) => (
                <div
                  key={e.id}
                  className={`event ${expanded === e.id ? "expanded" : ""}`}
                >
                  <button
                    className="event-summary"
                    onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  >
                    <span
                      className={`event-icon ${e.type.includes("outcome") ? "purple" : e.type.includes("response") ? "green" : ""}`}
                    >
                      {e.type.includes("route") ||
                      e.type.includes("candidates") ? (
                        <GitBranch size={16} />
                      ) : e.type.includes("outcome") ? (
                        <ShieldCheck size={16} />
                      ) : (
                        <Code2 size={16} />
                      )}
                    </span>
                    <span className="event-description">
                      <b>{e.type.replaceAll("_", " ")}</b>
                      <small>{eventSummary(e)}</small>
                    </span>
                    <time>{new Date(e.at).toLocaleTimeString()}</time>
                    <ChevronDown size={15} />
                  </button>
                  {expanded === e.id && (
                    <div className="event-details">
                      {e.type === "provider_candidates" && (
                        <div className="candidate-table">
                          {e.data.candidates.map((c: any) => (
                            <div key={c.provider}>
                              <div>
                                <ProviderMark provider={c.provider} />
                                <strong>{c.provider}</strong>
                                <span
                                  className={`badge ${c.eligible ? "complete" : ""}`}
                                >
                                  {c.eligible ? "Eligible" : "Excluded"}
                                </span>
                                <b>{c.score.toFixed(3)}</b>
                              </div>
                              <div className="score-grid">
                                {Object.entries(c.components).map(([k, v]) => (
                                  <span key={k}>
                                    {k}
                                    <b>
                                      {c.insufficientData.includes(k)
                                        ? "—"
                                        : Number(v).toFixed(2)}
                                    </b>
                                    {c.insufficientData.includes(k) && (
                                      <small>Not measured</small>
                                    )}
                                  </span>
                                ))}
                              </div>
                              {c.reasons.length > 0 && (
                                <p>{c.reasons.join(" · ")}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="payload-label">
                        <span>Recorded event payload</span>
                        <span>{e.callId?.slice(0, 8) || "Task level"}</span>
                      </div>
                      <pre tabIndex={0} aria-label="Recorded event JSON">
                        {JSON.stringify(e.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <GitBranch size={32} />
              <h3>
                {task
                  ? "No events match this view"
                  : "Choose a research session"}
              </h3>
              <p>Routing decisions appear here as your live research runs.</p>
            </div>
          )}
        </section>
        <div className="right-rail">
          <section className="panel">
            <div className="panel-heading">
              <span>
                <Fingerprint size={17} />
                Reading the trace
              </span>
            </div>
            <div className="legend-body">
              <div>
                <span className="legend-tag">Observed</span>
                <p>
                  Provider HTTP status, latency, returned URLs, and actual
                  routing decisions.
                </p>
              </div>
              <div>
                <span className="legend-tag amber">Estimated</span>
                <p>
                  Costs from the configured rate card. Not actual vendor-billed
                  charges.
                </p>
              </div>
              <div>
                <span className="legend-tag purple">Evaluated</span>
                <p>
                  Search coverage checks and human assessments. A successful
                  HTTP call can leave the task unproven.
                </p>
              </div>
            </div>
          </section>
          <div className="privacy-note">
            <LockKeyhole size={16} />
            <p>
              {recording
                ? "This historical recording excludes prompts, source content, and evidence URLs. It cannot execute provider calls."
                : "This internal inspector contains task context. Share the sanitized export when prompts and source content should stay private."}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function eventSummary(e: TraceEvent) {
  const d = e.data;
  if (e.type === "provider_candidates")
    return `${d.candidates.filter((c: any) => c.eligible).length} eligible providers · ${d.policyVersion}`;
  if (e.type === "provider_response")
    return `${d.provider} · ${d.httpStatus ? `HTTP ${d.httpStatus}` : "No HTTP response"} · ${d.latencyMs} ms · ${d.resultCount} sources`;
  if (e.type === "budget_settled" || e.type === "budget_reserved")
    return `${money(d.estimateMicros)} ${d.chargeType === "free-tier" ? "free tier" : "estimated"} · ${d.provider}`;
  if (e.type === "outcome_evaluated")
    return `${d.pass ? "Evidence coverage passed" : "Evidence coverage not met"} · task criteria ${d.taskCriteria}`;
  if (e.type === "extraction_received")
    return `Page ${d.pageStatus ? `HTTP ${d.pageStatus}` : "status unknown"} · ${d.evidenceUsable === false ? "unusable evidence" : "task criteria unknown"}`;
  if (e.type === "intent_created")
    return "Explicit rubric, spending cap, and consent scope recorded";
  return (
    d.reason || d.provider || d.note || d.status || "Task context recorded"
  );
}
