import {
  providerEntry,
  providerIds,
  providerLabel,
  searchProviderIds,
} from "../server/provider-catalog";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart03 as BarChart3,
  CheckCircle as CheckCircle2,
  ChevronRight,
  Circle as CircleDot,
  Download01 as Download,
  FileSearch02 as FileSearch,
  Fingerprint01 as Fingerprint,
  GitBranch01 as GitBranch,
  Globe02 as Globe2,
  Loading02 as LoaderCircle,
  Lock01 as LockKeyhole,
  Plus,
  SearchLg as Search,
  Settings02 as Settings2,
  ShieldTick as ShieldCheck,
  Terminal,
  XClose as X,
} from "@untitledui/icons";
import { chooseTaskSnapshot } from "./task-state";
import type { ServerHealth, TaskSummary } from "../server/types";
import { api, money, setToken, type TaskDetail } from "./api";
import { Stat, ProviderMark } from "./components/shared";
import { IntentForm } from "./components/IntentForm";
import { CompanyResults, FollowUp, EvidenceList } from "./components/Evidence";
import { Inspector } from "./components/Inspector";
import { AddEvidence, TaskPrivacy } from "./components/TaskControls";
import { Intelligence } from "./components/Intelligence";
type Screen = "workspace" | "inspector" | "intelligence";
function readRoute() {
  const [view, id] = location.hash.slice(1).split("/");
  return {
    screen: (["workspace", "inspector", "intelligence"].includes(view)
      ? view
      : "workspace") as Screen,
    id: id || undefined,
  };
}
export function App() {
  const [screen, setScreen] = useState<Screen>(() => readRoute().screen);
  const [health, setHealth] = useState<ServerHealth>();
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [task, setTask] = useState<TaskDetail>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    () => readRoute().id,
  );
  const selectedId = useRef<string | undefined>(readRoute().id);
  const setSelection = useCallback((id: string | undefined) => {
    selectedId.current = id;
    setSelectedTaskId(id);
  }, []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [connectionRevision, setConnectionRevision] = useState(0);
  const modalRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!showSettings) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, select, textarea, a[href]",
        ) || [],
      ).filter((el) => el.offsetParent !== null);
    const timer = setTimeout(() => focusable()[0]?.focus(), 0);
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowSettings(false);
      }
      if (event.key === "Tab") {
        const items = focusable();
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [showSettings]);
  const refreshGeneration = useRef(0);
  const refresh = useCallback(async (clearError = false) => {
    const generation = ++refreshGeneration.current;
    try {
      const [h, t] = await Promise.all([
        api<ServerHealth>("/health"),
        api<TaskSummary[]>("/tasks"),
      ]);
      if (generation !== refreshGeneration.current) return;
      setHealth(h);
      setTasks(t);
      if (clearError) setError("");
    } catch (e) {
      if (generation === refreshGeneration.current)
        setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const loadTask = useCallback(
    async (id: string, selection = false) => {
      if (selection) {
        setSelection(id);
        setTask((current) => (current?.id === id ? current : undefined));
        setError("");
      }
      try {
        const data = await api<TaskDetail>(`/tasks/${id}`);
        if (selectedId.current === id)
          setTask((current) => chooseTaskSnapshot(current, data));
      } catch (e) {
        if (selectedId.current === id) setError((e as Error).message);
      }
    },
    [setSelection],
  );
  useEffect(() => {
    if (!task || task.status !== "running") return;
    const timer = setInterval(() => {
      void loadTask(task.id);
      void refresh();
    }, 1200);
    return () => clearInterval(timer);
  }, [task?.id, task?.status, loadTask, refresh]);
  useEffect(() => {
    const id = readRoute().id;
    if (id) void loadTask(id);
  }, [loadTask]);
  const lastRoute = useRef(location.hash);
  const routeInitialized = useRef(false);
  useEffect(() => {
    function restoreRoute() {
      if (lastRoute.current === location.hash) return;
      lastRoute.current = location.hash;
      const route = readRoute();
      setSelection(route.id);
      setScreen(route.screen);
      setTask((current) => (current?.id === route.id ? current : undefined));
      setError("");
      if (route.id) void loadTask(route.id);
      void refresh();
    }
    window.addEventListener("popstate", restoreRoute);
    window.addEventListener("hashchange", restoreRoute);
    return () => {
      window.removeEventListener("popstate", restoreRoute);
      window.removeEventListener("hashchange", restoreRoute);
    };
  }, [loadTask, refresh, setSelection]);
  useEffect(() => {
    const hash = `#${screen}${selectedTaskId ? `/${selectedTaskId}` : ""}`;
    if (location.hash !== hash) {
      if (routeInitialized.current) history.pushState(null, "", hash);
      else history.replaceState(null, "", hash);
    }
    lastRoute.current = hash;
    routeInitialized.current = true;
  }, [screen, selectedTaskId]);
  async function select(id: string) {
    setScreen("workspace");
    await loadTask(id, true);
  }
  async function run(query?: string) {
    if (!task) return;
    setBusy(true);
    setError("");
    try {
      await api(`/tasks/${task.id}/run`, query ? { query } : {});
      await loadTask(task.id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function exportTask() {
    if (!task) return;
    try {
      const data = await api(`/tasks/${task.id}/export`);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `apilayer-${task.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const configured =
    health && Object.values(health.providers).filter(Boolean).length;
  const searchReady =
    health && searchProviderIds.some((p) => health.providers[p]);
  function startResearch() {
    setSelection(undefined);
    setTask(undefined);
    setScreen("workspace");
    setError("");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <img src="/two-hands.svg" width="147" height="32" alt="Two Hands" />
        </a>
        <div className="space-label">Research control room</div>
        <nav aria-label="Main navigation">
          {(
            [
              ["workspace", "Research", FileSearch],
              ["inspector", "Routing inspector", GitBranch],
              ["intelligence", "Provider intelligence", BarChart3],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              className={`nav-item ${screen === id ? "active" : ""}`}
              onClick={() => setScreen(id)}
            >
              <Icon size={18} />
              {label}
              {id === "inspector" && task?.events.length ? (
                <span className="nav-count">{task.events.length}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="side-heading">
          <span>Recent research</span>
          <button aria-label="New research" onClick={startResearch}>
            <Plus size={15} />
          </button>
        </div>
        <div className="recent-list">
          {tasks.length ? (
            tasks.slice(0, 8).map((t) => (
              <button
                key={t.id}
                onClick={() => void select(t.id)}
                className={`recent-task ${task?.id === t.id ? "selected" : ""}`}
              >
                <span className={`status-dot ${t.status}`} />
                <span>{t.query}</span>
              </button>
            ))
          ) : (
            <p className="sidebar-empty">
              Your research sessions will appear here.
            </p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="local-tag">
            <ShieldCheck size={16} />
            <span>
              Server-side credentials
              <small>Local account · SQLite storage</small>
            </span>
          </div>
          <button
            className="settings-link"
            onClick={() => setShowSettings(true)}
          >
            <Settings2 size={16} />
            Connections & settings
            <ChevronRight size={14} />
          </button>
          <div className="profile">
            <div className="avatar">R</div>
            <span>
              Research<small>Development environment</small>
            </span>
            <span className="status-dot complete" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            Research
            <ChevronRight size={13} />
            <span>
              {screen === "workspace"
                ? "Agent research"
                : screen === "inspector"
                  ? "Routing inspector"
                  : "Provider intelligence"}
            </span>
          </div>
          <div className="topbar-right">
            <span className={`connection ${configured ? "online" : ""}`}>
              <span className="status-dot" />
              {health
                ? `${configured} providers configured`
                : "Server disconnected"}
            </span>
            <button
              className="icon-button"
              title="Connections and settings"
              onClick={() => setShowSettings(true)}
            >
              <Settings2 size={17} />
            </button>
          </div>
        </header>
        <main>
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {screen === "workspace" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span /> INTENT → EXECUTION → EVIDENCE
                  </div>
                  <h1>Research, with a clear trail.</h1>
                  <p>
                    Give your agent a goal. See every tool decision behind the
                    result.
                  </p>
                </div>
                <span className="version-tag">
                  DEMO V1 <span>•</span> Live APIS ONLY
                </span>
              </div>
              {!task && selectedTaskId ? (
                <div className="panel empty-state" role="status">
                  <h3>
                    {error
                      ? "Research session unavailable"
                      : "Loading research session…"}
                  </h3>
                  <p>
                    {error
                      ? "Choose another recent session or start new research."
                      : "Retrieving the saved intent and evidence trail."}
                  </p>
                  <button className="button secondary" onClick={startResearch}>
                    New research
                  </button>
                </div>
              ) : !task ? (
                <IntentForm
                  health={health}
                  onCreate={async (body) => {
                    setBusy(true);
                    setError("");
                    try {
                      const t = await api("/tasks", body);
                      await loadTask(t.id, true);
                      await refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  busy={busy}
                  onSettings={() => setShowSettings(true)}
                />
              ) : (
                <>
                  <div className="session-heading">
                    <div>
                      <span className="mono muted">
                        SESSION / {task.id.slice(0, 8)}
                      </span>
                      <div className="session-title">
                        {task.intent.query}
                        <span className={`badge ${task.status}`}>
                          {task.status === "complete"
                            ? "Search complete"
                            : task.status}
                        </span>
                      </div>
                    </div>
                    <button
                      className="button secondary"
                      onClick={startResearch}
                    >
                      {" "}
                      <Plus size={15} />
                      New research
                    </button>
                  </div>
                  {task.error && (
                    <div className="error-banner" role="alert">
                      {task.error}
                    </div>
                  )}
                  <div className="stats-grid">
                    <Stat
                      label="Task budget"
                      value={money(task.intent.budgetMicros)}
                      detail="User-approved spending cap"
                      icon={<ShieldCheck size={17} />}
                    />
                    <Stat
                      label="Estimated SPEND"
                      value={money(task.spentMicros)}
                      detail={`${money(task.intent.budgetMicros - task.spentMicros - task.reservedMicros)} remaining · not a billed charge`}
                      icon={<Activity size={17} />}
                    />
                    <Stat
                      label="Source urls"
                      value={String(
                        new Set(task.sources.map((s) => s.url)).size,
                      ).padStart(2, "0")}
                      detail="Unique supplied or returned URLs"
                      icon={<Globe2 size={17} />}
                    />
                    <Stat
                      label="Verified organizations"
                      value={`${task.organizations.length} / ${task.intent.requiredCount}`}
                      detail="Human-reviewed against every criterion"
                      icon={<CheckCircle2 size={17} />}
                    />
                  </div>
                  <div className="workspace-grid">
                    <div>
                      <section className="panel intent-summary">
                        <div className="panel-heading">
                          <span>
                            <Fingerprint size={17} />
                            Task intent
                          </span>
                          <span className="small-label">
                            VISIBLE BEFORE EXECUTION
                          </span>
                        </div>
                        <p>{task.intent.prompt}</p>
                        <div className="criteria-pills">
                          {task.intent.criteria.map((c) => (
                            <span key={c}>
                              <CircleDot size={12} />
                              {c}
                            </span>
                          ))}
                        </div>
                        {task.intent.queries &&
                          task.intent.queries.length > 1 && (
                            <details className="saved-plan">
                              <summary>
                                <GitBranch size={13} />
                                Research plan · {
                                  task.intent.queries.length
                                }{" "}
                                queries
                              </summary>
                              <ol>
                                {task.intent.queries.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ol>
                            </details>
                          )}
                        <div className="intent-meta">
                          <span>
                            {task.intent.mode === "compare"
                              ? "Compare both providers"
                              : "Automatic routing"}
                          </span>
                          <span>{task.intent.preference} policy</span>
                          <span>
                            {task.intent.domains.length
                              ? task.intent.domains.join(", ")
                              : "All public domains"}
                          </span>
                        </div>
                      </section>
                      <AddEvidence
                        key={`add-${task.id}`}
                        task={task}
                        onRefresh={() => loadTask(task.id)}
                        onError={setError}
                      />
                      <CompanyResults task={task} onError={setError} />
                      <section className="panel results-panel">
                        <div className="panel-heading">
                          <span>
                            <FileSearch size={17} />
                            Evidence{" "}
                            <span className="count">{task.sources.length}</span>
                          </span>
                          <button
                            className="text-button"
                            onClick={() => setScreen("inspector")}
                          >
                            Inspect execution
                            <ArrowUpRight size={14} />
                          </button>
                        </div>
                        {task.sources.length ? (
                          <>
                            <div className="info-strip">
                              <ShieldCheck size={15} />
                              <span>
                                Returned sources are leads. Funding, activity,
                                and relevance stay unknown until you review
                                evidence.
                              </span>
                            </div>
                            <div className="source-list">
                              <EvidenceList
                                key={task.id}
                                task={task}
                                health={health}
                                onRefresh={async () => {
                                  await loadTask(task.id);
                                  await refresh();
                                }}
                                onError={setError}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="empty-state">
                            <div
                              className={`empty-icon ${task.status === "running" ? "pulsing" : ""}`}
                            >
                              {task.status === "running" ? (
                                <LoaderCircle className="spin" size={29} />
                              ) : (
                                <Search size={29} />
                              )}
                            </div>
                            <h3>
                              {task.status === "running"
                                ? "Searching real providers…"
                                : "Your evidence trail starts here"}
                            </h3>
                            <p>
                              {task.status === "failed"
                                ? "No sources returned. Open the inspector for the routing and provider outcomes."
                                : "Your intent is saved. Start a live search to route a query through a configured provider."}
                            </p>
                            {task.status !== "running" && (
                              <button
                                className="button primary"
                                disabled={busy || !searchReady}
                                onClick={() => void run()}
                              >
                                <Search size={15} />
                                Run live search
                                <ArrowRight size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </section>
                      {task.sources.length > 0 && (
                        <FollowUp
                          disabled={
                            busy || task.status === "running" || !searchReady
                          }
                          onRun={run}
                        />
                      )}
                    </div>
                    <div className="right-rail">
                      <section className="panel">
                        <div className="panel-heading">
                          <span>
                            <GitBranch size={17} />
                            Execution overview
                          </span>
                        </div>
                        <div className="rail-body">
                          <div className="rail-row">
                            <span>Policy version</span>
                            <code>{health?.policyVersion}</code>
                          </div>
                          <div className="rail-row">
                            <span>Provider attempts</span>
                            <b>
                              {
                                task.events.filter(
                                  (e) => e.type === "provider_request",
                                ).length
                              }
                            </b>
                          </div>
                          <div className="rail-row">
                            <span>Fallbacks considered</span>
                            <b>
                              {
                                task.events.filter(
                                  (e) => e.type === "fallback_triggered",
                                ).length
                              }
                            </b>
                          </div>
                          <div className="rail-row">
                            <span>Reserved</span>
                            <b>{money(task.reservedMicros)}</b>
                          </div>
                          <div className="budget-track">
                            <span
                              style={{
                                width: `${Math.min(100, ((task.spentMicros + task.reservedMicros) / task.intent.budgetMicros) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="tiny muted">
                            Keyless requests use the free tier. Other costs use
                            the configured rate card and are estimates, not
                            invoice charges.
                          </p>
                          <button
                            className="button secondary full"
                            disabled={
                              busy || task.status === "running" || !searchReady
                            }
                            onClick={() => void run()}
                          >
                            {task.status === "running" ? (
                              <LoaderCircle size={15} className="spin" />
                            ) : (
                              <Search size={15} />
                            )}{" "}
                            {task.status === "running"
                              ? "Research in progress"
                              : "Run search again"}
                          </button>
                          {task.status === "running" && (
                            <button
                              className="text-button stop-button"
                              onClick={() => {
                                void api(`/tasks/${task.id}/cancel`, {})
                                  .then(() => loadTask(task.id))
                                  .catch((e) => setError(e.message));
                              }}
                            >
                              <X size={12} />
                              Stop after current call
                            </button>
                          )}
                        </div>
                      </section>
                      <section className="panel">
                        <div className="panel-heading">
                          <span>
                            <Terminal size={16} />
                            Latest activity
                          </span>
                          <span className="live-dot" />
                        </div>
                        <div className="mini-trace">
                          {task.events
                            .slice(-5)
                            .reverse()
                            .map((e) => (
                              <div key={e.id}>
                                <span className="trace-dot" />
                                <span>
                                  {e.type.replaceAll("_", " ")}
                                  <small>
                                    {new Date(e.at).toLocaleTimeString()}{" "}
                                    {e.data.provider && `· ${e.data.provider}`}
                                  </small>
                                </span>
                              </div>
                            ))}
                        </div>
                      </section>
                      <TaskPrivacy
                        key={`privacy-${task.id}`}
                        task={task}
                        onRefresh={() => loadTask(task.id)}
                        onError={setError}
                        onDeleted={() => {
                          if (selectedId.current === task.id) {
                            setSelection(undefined);
                            setTask(undefined);
                          }
                          void refresh();
                        }}
                      />
                      <button
                        className="button secondary full"
                        onClick={() => void exportTask()}
                      >
                        <Download size={15} />
                        Export sanitized trace
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          {screen === "inspector" && (
            <Inspector
              task={task}
              tasks={tasks}
              onSelect={(id) => loadTask(id, true)}
              onExport={exportTask}
            />
          )}
          {screen === "intelligence" && (
            <Intelligence key={connectionRevision} />
          )}
          <footer>
            <span>
              <img src="/two-hands-mark.svg" alt="" width="13" height="13" />
              Two Hands{" "}
              <span className="muted">/ Intent & tool intelligence</span>
            </span>
            <span>Observed execution. Estimated cost. Evaluated outcomes.</span>
          </footer>
        </main>
      </div>
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <section
            className="modal"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-heading">
              <h2 id="settings-title">Connections & settings</h2>
              <button
                aria-label="Close settings"
                onClick={() => setShowSettings(false)}
              >
                <X size={20} />
              </button>
            </div>
            <p className="muted">
              Credentials are read from server environment variables. They are
              never sent to this browser.
            </p>
            {providerIds.map((p) => (
              <div key={p} className="provider-connection">
                <ProviderMark provider={p} />
                <div>
                  <strong>{providerLabel(p)}</strong>
                  <code>{providerEntry(p)!.credentialEnv}</code>
                  <a
                    className="setup-link"
                    href={providerEntry(p)!.keySetupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {p} key setup
                    <ArrowUpRight size={10} />
                  </a>
                  {health?.providerIssues?.[p] && (
                    <p className="tiny danger">{health.providerIssues[p]}</p>
                  )}
                </div>
                <span
                  className={`badge ${health?.providers[p] ? "complete" : ""}`}
                >
                  {health?.providerAuth?.[p] === "keyless"
                    ? "Keyless free tier"
                    : health?.providers[p]
                      ? "Key configured"
                      : "Not configured"}
                </span>
              </div>
            ))}
            <div className="info-strip">
              <LockKeyhole size={18} />
              <span>
                Add keys to your server environment or .env file, then restart.
                “Configured” means a key is present; the first call verifies
                access. Firecrawl can also use its documented keyless tier when
                FIRECRAWL_ALLOW_KEYLESS=true is explicitly set on the server; it
                stops if access is refused.
              </span>
            </div>
            <label>
              Account access token
              <input
                type="password"
                autoComplete="off"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Only if API_TOKEN is set on the server"
              />
            </label>
            <p className="tiny muted">
              Held in memory for this tab. Reloading clears it.
            </p>
            <button
              className="button primary full"
              onClick={() => {
                setToken(tokenInput);
                setConnectionRevision((revision) => revision + 1);
                void refresh(true);
                if (selectedId.current) void loadTask(selectedId.current);
                setShowSettings(false);
              }}
            >
              Connect to Two Hands
              <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
