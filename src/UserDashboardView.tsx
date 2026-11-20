import { startPolling } from "./polling";
import { ProviderLogo } from "./components/shared";
import {
  providerCatalog,
  providerEntry,
  providerIds,
  providerLabel,
  toolOperation,
} from "../server/provider-catalog";
const ProviderBillingView = lazy(() =>
  import("./ProviderBillingView").then((m) => ({
    default: m.ProviderBillingView,
  })),
);
const ProviderAdaptersView = lazy(() =>
  import("./ProviderBillingView").then((m) => ({
    default: m.ProviderAdaptersView,
  })),
);
import { useAccount } from "./AccountGate";
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { CustomerFunding } from "./customer-funding";
import {
  chargeOutcome,
  chargeReason,
  sandboxCredits,
  spendableBalance,
} from "./funding-format";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download01,
  GitBranch01,
  Pin01,
  RefreshCw01,
  SearchLg,
  SearchMd,
  TerminalSquare,
} from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Card, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Switch } from "./components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { api, ApiError, money } from "./api";
import {
  CopyButton,
  Empty,
  InlineError,
  date,
  download,
} from "./observation-ui";
import type { ObservedCall, ToolName } from "../server/observation-types";
import type {
  ActivityItem,
  ActivityPage,
  RoutingPolicy,
  AccountUsage,
} from "../server/account-data-types";
import type { Observatory } from "../server/observation";
import "./user-dashboard.css";
import "./dashboard-overview.css";
import claudeMark from "./assets/claude-mark.svg";
import codexMark from "./assets/codex-mark.png";
import cursorMark from "./assets/cursor-mark.svg";
import catalogExaMark from "./assets/catalog-exa.svg";
import catalogFirecrawlMark from "./assets/catalog-firecrawl.png";
import "./tool-catalog.css";
import { ApiKeysView } from "./ApiKeysView";
const FundingView = lazy(() =>
  import("./FundingView").then((m) => ({ default: m.FundingView })),
);
import {
  AgentConnectionInstructions,
  useConnectAgent,
} from "./ConnectAgentDialog";

type Catalog = Awaited<ReturnType<Observatory["catalog"]>>;
type Preview = Awaited<ReturnType<Observatory["preview"]>>;
type Connection = {
  clients: { clientName: string; clientVersion: string; lastSeenAt: string }[];
  providers: Record<string, boolean>;
  sessionBudgetMicros: number;
  requestsPerMinute: number;
};
import { type DashboardSection } from "./dashboard-routes";
export { dashboardSections, type DashboardSection } from "./dashboard-routes";
const labels: Record<DashboardSection, [string, string]> = {
  overview: ["Home", "A clear view of the tools working behind your agent."],
  tools: [
    "Tool catalog",
    "Find the right capability. Compare what each tool returns and costs.",
  ],
  activity: [
    "Activity",
    "A clear view of the tools working behind your agent.",
  ],
  requests: [
    "Request log",
    "Inspect the requests your agent made and the evidence it received.",
  ],
  usage: [
    "Usage",
    "Understand request volume, estimated cost, and provider-reported usage.",
  ],
  routing: [
    "Configure routing",
    "Control which tools are available to agents on this account.",
  ],
  keys: [
    "API keys",
    "Create credentials for your agents and control access and estimated spending.",
  ],
  credits: ["Credits", "Your test balance and deposit history."],
  connections: [
    "Connections",
    "One MCP connection. Your tools, in the agent you already use.",
  ],
};
const toolLabels = Object.fromEntries(
  providerCatalog.map((p) => [p.tool, p.summary]),
) as Record<ToolName, string>;
export { providerLabel };
function latency(ms: number | null | undefined) {
  return ms == null
    ? "—"
    : ms >= 1000
      ? `${(ms / 1000).toFixed(2)} s`
      : `${ms} ms`;
}
function ProviderIcon({ provider }: { provider: string }) {
  return (
    <span
      className={`ws-provider-icon ws-provider-${provider}`}
      aria-hidden="true"
    >
      <ProviderLogo provider={provider} />
    </span>
  );
}
function Status({ status }: { status: string }) {
  return (
    <span className={`ws-status ws-status-${status}`}>
      <span />
      {status === "succeeded"
        ? "Succeeded"
        : status === "failed"
          ? "Failed"
          : status === "running"
            ? "Running"
            : "Interrupted"}
    </span>
  );
}
function Section({
  title,
  description,
  action,
  children,
  className = "",
  headingRef,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  headingRef?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <section className={`ws-panel ${className}`}>
      <header>
        <div>
          <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>
            {title}
          </h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
function Go({
  section,
  children,
}: {
  section: DashboardSection;
  children: React.ReactNode;
}) {
  return (
    <a className="ws-text-link" href={`#dashboard/${section}`}>
      {children}
      <ArrowUpRight size={14} />
    </a>
  );
}
function NativeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="ws-select">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(([v, name]) => (
          <option key={v} value={v}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
function Loading() {
  return (
    <div className="ws-loading" role="status">
      <span />
      Loading account data…
    </div>
  );
}

export function UserDashboardView({
  section = "overview",
  catalog,
  catalogLoading,
  catalogError,
  refreshCatalog,
  connectionRevision,
}: {
  section?: DashboardSection;
  catalog: Catalog;
  catalogLoading: boolean;
  catalogError: string;
  refreshCatalog: () => Promise<unknown>;
  connectionRevision: number;
}) {
  const account = useAccount();
  const openConnectAgent = useConnectAgent();
  const canManage = !account.enabled || !!account.profile;
  const fundingSummary = useContext(CustomerFunding).summary;
  // Any account that pays for tool calls from prepaid credits, sandbox or live.
  const liveCredits =
    !!fundingSummary && spendableBalance(fundingSummary).wallet;
  const [days, setDays] = useState("7");
  const [usage, setUsage] = useState<AccountUsage>();
  const [policy, setPolicy] = useState<RoutingPolicy>();
  const [connection, setConnection] = useState<Connection>();
  const [activity, setActivity] = useState<ActivityPage>();
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityError, setActivityError] = useState("");
  const [saving, setSaving] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [notice, setNotice] = useState("");
  const [selectedCall, setSelectedCall] = useState<ActivityItem>();
  const [pinnedProviders, setPinnedProviders] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [selectedTool, setSelectedTool] = useState<Catalog[number]>();
  const catalogTrigger = useRef<HTMLButtonElement>(null);
  const activitySearch = useRef<HTMLInputElement>(null);
  const activityHeading = useRef<HTMLHeadingElement>(null);
  const activityRetryFocus = useRef<string | null>(null);
  const generation = useRef(0);
  const activityGeneration = useRef(0);
  const requestKey = `${days}|${query}|${provider}|${status}|${page}|${section}`;
  const currentRequest = useRef(requestKey);
  currentRequest.current = requestKey;
  const needsUsage = section === "activity" || section === "usage";
  const needsPolicy = section === "tools" || section === "routing";
  const needsConnection = section === "connections" || section === "routing";
  const retryActivity = () => {
    activityRetryFocus.current = requestKey;
    setRefreshTick((tick) => tick + 1);
  };
  const load = useCallback(async () => {
    const id = ++generation.current;
    try {
      const [u, p, c] = await Promise.all([
        needsUsage
          ? api<AccountUsage>(`/account/usage?days=${days}`)
          : Promise.resolve(undefined),
        needsPolicy
          ? api<RoutingPolicy>("/account/routing")
          : Promise.resolve(undefined),
        needsConnection
          ? api<Connection>("/account/connection")
          : Promise.resolve(undefined),
      ]);
      if (generation.current !== id) return;
      if (u) setUsage(u);
      if (p)
        setPolicy((current) =>
          current && current.revision > p.revision ? current : p,
        );
      if (c) setConnection(c);
      setError("");
    } catch (e) {
      if (generation.current === id) {
        setError((e as Error).message);
        if (e instanceof ApiError && e.status === 401) {
          setUsage(undefined);
          setPolicy(undefined);
          setConnection(undefined);
        }
      }
    } finally {
      if (generation.current === id) setLoading(false);
    }
  }, [days, connectionRevision, needsUsage, needsPolicy, needsConnection]);
  useEffect(() => {
    if (!needsUsage && !needsPolicy && !needsConnection) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const stop = startPolling(load, needsUsage ? 15000 : 60000);
    return () => {
      stop();
      generation.current++;
    };
  }, [load, needsUsage, needsPolicy, needsConnection]);
  useEffect(() => {
    if (!["activity", "requests"].includes(section)) {
      setActivityLoading(false);
      return;
    }
    const id = ++activityGeneration.current;
    const key = requestKey;
    setActivityLoading(true);
    setActivityError("");
    const fetchActivity = async () => {
      try {
        const params = new URLSearchParams({
          days,
          q: section === "requests" ? query : "",
          provider: section === "requests" ? provider : "all",
          status: section === "requests" ? status : "all",
          page: section === "requests" ? String(page) : "1",
        });
        const data = await api<ActivityPage>(`/account/activity?${params}`);
        if (
          id === activityGeneration.current &&
          key === currentRequest.current
        ) {
          setActivity(data);
          setActivityError("");
        }
      } catch (e) {
        if (
          id === activityGeneration.current &&
          key === currentRequest.current
        ) {
          setActivityError((e as Error).message);
          setActivity(undefined);
        }
      } finally {
        if (
          id === activityGeneration.current &&
          key === currentRequest.current
        ) {
          setActivityLoading(false);
          if (activityRetryFocus.current === key) {
            activityRetryFocus.current = null;
            requestAnimationFrame(() => {
              if (currentRequest.current === key)
                activityHeading.current?.focus();
            });
          }
        }
      }
    };
    const stop = startPolling(fetchActivity, 15000, query ? 200 : 0);
    return () => {
      stop();
      activityGeneration.current++;
    };
  }, [
    days,
    query,
    provider,
    status,
    page,
    section,
    connectionRevision,
    refreshTick,
  ]);
  async function toggle(tool: ToolName, enabled: boolean) {
    if (!policy || saving || !canManage) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const next = await api<RoutingPolicy>("/account/routing", {
        revision: policy.revision,
        disabledTools: enabled
          ? policy.disabledTools.filter((t) => t !== tool)
          : [...new Set([...policy.disabledTools, tool])],
      });
      setPolicy(next);
      await refreshCatalog();
      setNotice(
        `${tool} ${enabled ? "enabled" : "paused"}. Routing settings saved.`,
      );
    } catch (e) {
      setError((e as Error).message);
      if (e instanceof ApiError && e.status === 409) {
        const latest = await api<RoutingPolicy>("/account/routing").catch(
          () => undefined,
        );
        if (latest) setPolicy(latest);
      }
    } finally {
      setSaving(false);
    }
  }
  const enabled = (tool: ToolName) => !policy?.disabledTools.includes(tool);
  const detailTool = selectedTool
    ? (catalog.find(({ tool }) => tool === selectedTool.tool) ?? selectedTool)
    : undefined;
  const showPeriod = ["activity", "requests", "usage"].includes(section);
  const completed = usage ? usage.succeeded + usage.failed : 0;
  if (section === "keys") {
    return (
      <div className="tool-workspace">
        <ApiKeysView key={connectionRevision} />
      </div>
    );
  }
  return (
    <div className="tool-workspace" data-dashboard-section={section}>
      <div
        className={`page-heading ws-page-heading${section === "tools" ? " catalog-page-heading" : ""}`}
      >
        <div>
          <h1>{labels[section][0]}</h1>
          {!["tools", "overview", "activity"].includes(section) && (
            <p>
              {section === "credits" && liveCredits
                ? "Your prepaid credits, card payments and usage charges."
                : labels[section][1]}
            </p>
          )}
        </div>
        <div className="ws-heading-actions">
          {showPeriod && (
            <Select
              value={days}
              onValueChange={(v) => {
                setDays(v);
                setPage(1);
              }}
            >
              <SelectTrigger aria-label="Date range">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[7, 30, 90].map((days) => (
                  <SelectItem key={days} value={String(days)}>
                    Last {days} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!["tools", "overview"].includes(section) &&
            (section !== "activity" || error) && (
              <Button
                variant="outline"
                size="sm"
                aria-label="Refresh account"
                onClick={() => {
                  void load();
                  void refreshCatalog();
                  setRefreshTick((v) => v + 1);
                }}
              >
                <RefreshCw01 size={15} />
              </Button>
            )}
          {(section === "tools" || section === "activity") && (
            <Button
              className="dashboard-connect"
              variant="brand"
              size="sm"
              onClick={() => openConnectAgent()}
            >
              <span className="ws-agent-marks" aria-hidden="true">
                <img src={claudeMark} alt="" />
                <img src={codexMark} alt="" />
                <img src={cursorMark} alt="" />
              </span>
              Connect agent
            </Button>
          )}
          {section === "requests" && (
            <Button variant="outline" size="sm" asChild>
              <a href="#dashboard/activity">
                <ChevronLeft />
                Back to activity
              </a>
            </Button>
          )}
          {section === "routing" && (
            <Button variant="outline" size="sm" asChild>
              <a href="#dashboard/tools">
                <ChevronLeft />
                Back to catalog
              </a>
            </Button>
          )}
        </div>
      </div>
      <InlineError message={error} />
      {notice && (
        <div className="ws-notice" role="status">
          <CheckCircle size={16} />
          {notice}
          <button
            aria-label="Dismiss saved notification"
            onClick={() => setNotice("")}
          >
            Dismiss
          </button>
        </div>
      )}
      {loading &&
      ((needsUsage && !usage) ||
        (needsPolicy && !policy) ||
        (needsConnection && !connection)) ? (
        <Loading />
      ) : (
        <>
          {(section === "activity" || section === "usage") && (
            <>
              <div className="ws-metrics">
                <Metric
                  label="Estimated cost"
                  value={usage ? money(usage.estimatedMicros) : "—"}
                  hint="Recorded calls · not an invoice"
                  href="#dashboard/usage"
                />
                <Metric
                  label="Tool requests"
                  value={usage?.requests.toLocaleString() ?? "—"}
                  hint={
                    usage
                      ? `${usage.running} running · ${usage.failed} failed`
                      : "Request counts unavailable"
                  }
                  href="#dashboard/requests"
                />
                <Metric
                  label="API success rate"
                  value={
                    completed
                      ? `${((usage!.succeeded / completed) * 100).toFixed(1)}%`
                      : "—"
                  }
                  hint={
                    !usage
                      ? "Completion counts unavailable"
                      : completed
                        ? `${completed} completed calls · execution only`
                        : "No completed requests in this period"
                  }
                  href="#dashboard/requests"
                />
                <Metric
                  label="Average latency"
                  value={latency(usage?.averageLatencyMs)}
                  hint={
                    usage
                      ? `${usage.latencySamples} timed calls`
                      : "Latency samples unavailable"
                  }
                  href="#dashboard/requests"
                />
              </div>
              {section === "activity" && (
                <div className="ws-overview-grid">
                  <Section
                    title="Usage"
                    headingRef={activityHeading}
                    action={<Go section="requests">View requests</Go>}
                  >
                    <InlineError message={activityError} />
                    {activityError ? (
                      <ActivityUnavailable onRetry={retryActivity} />
                    ) : (
                      <OverviewRequests
                        items={activity?.items.slice(0, 5) ?? []}
                        loading={activityLoading && !activity}
                        onSelect={setSelectedCall}
                      />
                    )}
                  </Section>
                  <Section
                    title="By provider"
                    action={<Go section="usage">Details</Go>}
                  >
                    <OverviewProviders
                      usage={usage}
                      pinned={pinnedProviders}
                      onPin={(provider) =>
                        setPinnedProviders((current) => {
                          const next = new Set(current);
                          if (next.has(provider)) next.delete(provider);
                          else next.add(provider);
                          return next;
                        })
                      }
                    />
                  </Section>
                </div>
              )}
              {section === "usage" && (
                <div className="ws-chart-grid">
                  <Section
                    title="Request volume"
                    description="Daily tool requests · UTC"
                    action={<Go section="activity">View activity</Go>}
                  >
                    {usage && <UsageChart usage={usage} />}
                  </Section>
                  <Section
                    title="Usage by provider"
                    description="Requests in this period"
                  >
                    <ProviderBreakdown usage={usage} />
                  </Section>
                </div>
              )}
              {section === "usage" && (
                <Section
                  title="Cost and reported usage"
                  description="Estimates and provider-reported units are kept separate."
                >
                  <div
                    className="ws-table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Scrollable request and usage table"
                  >
                    <table className="ws-table">
                      <thead>
                        <tr>
                          <th>Provider</th>
                          <th>Requests</th>
                          <th>Estimated cost</th>
                          <th>Reported credits</th>
                          <th>Reporting coverage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usage?.providers.map((p) => (
                          <tr key={p.provider}>
                            <td>
                              <span className="ws-provider-cell">
                                <ProviderIcon provider={p.provider} />
                                {providerLabel(p.provider)}
                              </span>
                            </td>
                            <td>{p.requests}</td>
                            <td>{money(p.estimatedMicros)}</td>
                            <td>{p.reportedCredits ?? "Not reported"}</td>
                            <td>
                              {p.creditReportingCalls} / {p.requests} calls
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ws-panel-note">
                    Provider-reported USD:{" "}
                    <strong>
                      {usage?.reportedUsd == null
                        ? "Not reported"
                        : money(usage.reportedUsd * 1e6)}
                    </strong>{" "}
                    · {usage?.usdReportingCalls ?? 0} of {usage?.requests ?? 0}{" "}
                    calls reported a USD cost. Partial reporting is not a
                    billing total. Provider credits are not converted to
                    dollars.
                  </div>
                </Section>
              )}
              {section === "activity" && (
                <Section
                  title="Discover more tools"
                  className="ws-overview-discover"
                  action={<Go section="tools">Browse catalog</Go>}
                />
              )}
            </>
          )}
          {section === "requests" && (
            <Section
              title="Requests"
              headingRef={activityHeading}
              description="Every provider call, with its inputs, result, and stated selection reason."
              action={
                <ExportActivity
                  days={days}
                  query={query}
                  provider={provider}
                  status={status}
                  total={activity?.total ?? 0}
                />
              }
            >
              <div className="ws-filters">
                <div className="search-input">
                  <SearchLg />
                  <Input
                    ref={activitySearch}
                    aria-label="Search requests"
                    placeholder="Search requests, tools, or sessions…"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <NativeSelect
                  label="Provider"
                  value={provider}
                  onChange={(v) => {
                    setProvider(v);
                    setPage(1);
                  }}
                  options={[
                    ["all", "All providers"],
                    ...providerIds.map(
                      (p) => [p, providerLabel(p)] as [string, string],
                    ),
                  ]}
                />
                <NativeSelect
                  label="Request status"
                  value={status}
                  onChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                  options={[
                    ["all", "All statuses"],
                    ["succeeded", "Succeeded"],
                    ["failed", "Failed"],
                    ["interrupted", "Interrupted"],
                    ["running", "Running"],
                  ]}
                />
              </div>
              <InlineError message={activityError} />
              {activityError ? (
                <ActivityUnavailable onRetry={retryActivity} />
              ) : activityLoading ? (
                <Loading />
              ) : (
                <ActivityTable
                  items={activity?.items ?? []}
                  onSelect={setSelectedCall}
                  filtered={!!query || provider !== "all" || status !== "all"}
                  onClearFilters={() => {
                    setQuery("");
                    setProvider("all");
                    setStatus("all");
                    setPage(1);
                    activitySearch.current?.focus();
                  }}
                />
              )}
              {activity && !activityError && !activityLoading && (
                <div className="ws-pagination">
                  <span>
                    {activity?.total ?? 0} requests · Times shown in your local
                    timezone
                  </span>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page === 1 || activityLoading}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft />
                      Previous
                    </Button>
                    <span>
                      Page {page} of{" "}
                      {Math.max(1, Math.ceil((activity?.total ?? 0) / 20))}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        activityLoading || page * 20 >= (activity?.total ?? 0)
                      }
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              )}
            </Section>
          )}
          {section === "tools" && (
            <>
              <CatalogView
                catalog={catalog}
                loading={catalogLoading}
                error={catalogError}
                onRetry={() => void refreshCatalog()}
                enabled={enabled}
                onSelect={(tool, trigger) => {
                  catalogTrigger.current = trigger;
                  setSelectedTool(tool);
                }}
              />
              <ConnectorCatalog />
            </>
          )}
          {section === "routing" && (
            <>
              <div className="ws-routing-explainer">
                <GitBranch01 />
                <div>
                  <strong>
                    Your agent chooses from the tools enabled on your account.
                  </strong>
                  <p>
                    Two Hands matches tools to a request and returns compatible
                    options with estimates. The agent explicitly selects a tool
                    and supplies its reason. Paused tools are excluded from
                    eligible choices and blocked from new calls.
                  </p>
                </div>
              </div>
              <Section
                title="Tool availability"
                description="Saved on the server and applied across connected clients."
                action={<Badge variant="outline">Account policy</Badge>}
              >
                <div className="ws-routing-list">
                  {catalog.map((t) => (
                    <div key={t.tool}>
                      <ProviderIcon provider={t.provider} />
                      <div>
                        <strong>
                          {providerLabel(t.provider)} <code>{t.tool}</code>
                        </strong>
                        <p>
                          {toolLabels[t.tool]} · {money(t.estimatedMicros)}{" "}
                          default estimate
                        </p>
                      </div>
                      <Badge variant="outline">
                        {!t.available
                          ? "Not configured"
                          : enabled(t.tool)
                            ? "Enabled"
                            : "Paused"}
                      </Badge>
                      <Switch
                        aria-label={`${enabled(t.tool) ? "Pause" : "Enable"} ${t.tool}`}
                        checked={enabled(t.tool)}
                        disabled={!policy || saving || !canManage}
                        onCheckedChange={(value) => void toggle(t.tool, value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="ws-panel-note">
                  Changes apply to new calls immediately. In-flight requests
                  finish and saved receipts remain available.
                  {policy?.updatedAt && (
                    <span> Last saved {date(policy.updatedAt)}.</span>
                  )}
                </div>
              </Section>
              <RoutingPreview revision={policy?.revision} />
              <Section
                title="Execution policy"
                description="Limits are managed by the backend and applied automatically."
              >
                <div className="ws-policy-grid">
                  <div>
                    <span>Tool selection</span>
                    <strong>Explicit agent choice</strong>
                    <small>No silent provider substitution</small>
                  </div>
                  <div>
                    <span>Session limit</span>
                    <strong>
                      {connection ? money(connection.sessionBudgetMicros) : "—"}
                    </strong>
                    <small>Backend authorization per session</small>
                  </div>
                  <div>
                    <span>Request rate</span>
                    <strong>
                      {connection?.requestsPerMinute ?? "—"} / minute
                    </strong>
                    <small>Per provider across this account</small>
                  </div>
                </div>
              </Section>
            </>
          )}
          {section === "usage" && canManage && (
            <Suspense fallback={<p role="status">Loading billing…</p>}>
              <ProviderBillingView key={connectionRevision} days={days} />
            </Suspense>
          )}
          {section === "credits" && (
            <Suspense fallback={<p role="status">Loading credits…</p>}>
              <FundingView key={connectionRevision} />
            </Suspense>
          )}
          {section === "connections" && (
            <>
              <ConnectionView connection={connection} catalog={catalog} />
              {canManage && (
                <Suspense fallback={<p role="status">Loading providers…</p>}>
                  <ProviderAdaptersView key={connectionRevision} />
                </Suspense>
              )}
            </>
          )}
        </>
      )}
      <Dialog
        open={!!selectedTool}
        onOpenChange={(open) => {
          if (!open) setSelectedTool(undefined);
        }}
      >
        <DialogContent
          className="ws-detail-dialog catalog-dialog translate-x-0 translate-y-0"
          onCloseAutoFocus={(event) => {
            if (catalogTrigger.current?.isConnected) {
              event.preventDefault();
              catalogTrigger.current.focus();
            }
            catalogTrigger.current = null;
          }}
        >
          <DialogHeader>
            <DialogTitle className="catalog-dialog-title">
              {detailTool && <CatalogMark provider={detailTool.provider} />}
              {detailTool ? catalogProviderLabel(detailTool.provider) : "Tool"}
              {detailTool && (
                <CatalogStatus label={toolAvailability(detailTool, enabled)} />
              )}
            </DialogTitle>
            <DialogDescription>{detailTool?.description}</DialogDescription>
          </DialogHeader>
          {detailTool && (
            <CatalogToolDetails
              tool={detailTool}
              endpoints={catalog.filter(
                (endpoint) =>
                  catalogProviderId(endpoint.provider) ===
                  catalogProviderId(detailTool.provider),
              )}
              onSelect={setSelectedTool}
              enabled={enabled}
              onToggle={(tool, value) => void toggle(tool, value)}
              saving={saving || !policy || !canManage}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!selectedCall}
        onOpenChange={(open) => {
          if (!open) setSelectedCall(undefined);
        }}
      >
        <DialogContent className="ws-detail-dialog translate-x-0 translate-y-0">
          <DialogHeader>
            <DialogTitle>Request details</DialogTitle>
            <DialogDescription>{selectedCall?.sessionTitle}</DialogDescription>
          </DialogHeader>
          {selectedCall && <CallDetail item={selectedCall} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href: string;
}) {
  return (
    <a className="ws-metric" href={href}>
      <span>
        {label}
        <ArrowUpRight size={13} />
      </span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </a>
  );
}
function UsageChart({ usage }: { usage: AccountUsage }) {
  const maximum = Math.max(2, ...usage.series.map((d) => d.requests));
  return (
    <div
      className="ws-chart"
      aria-label={`${usage.requests} requests over the last ${usage.days} days. ${usage.series.map((d) => `${d.date}: ${d.requests}`).join("; ")}`}
      role="img"
    >
      <div className="ws-chart-labels">
        <span>{maximum}</span>
        <span>{Math.round(maximum / 2)}</span>
        <span>0</span>
      </div>
      <div className="ws-plot">
        <div className="ws-chart-gridlines">
          <i />
          <i />
          <i />
        </div>
        <div
          className="ws-bars"
          style={{
            columnGap: `${Math.min(4, 20 / Math.max(1, usage.series.length))}%`,
          }}
        >
          {usage.series.map((d) => (
            <div
              key={d.date}
              title={`${d.date} UTC · ${d.requests} requests · ${money(d.estimatedMicros)} estimated`}
            >
              <span style={{ height: `${(d.requests / maximum) * 100}%` }} />
            </div>
          ))}
        </div>
        {!usage.requests && (
          <div className="ws-chart-empty">
            <Activity size={21} />
            <strong>No requests in this period</strong>
            <span>Tool usage will appear here automatically.</span>
          </div>
        )}
        <div className="ws-chart-dates">
          <span>{usage.series[0]?.date.slice(5)}</span>
          <span>
            {usage.series[Math.floor(usage.series.length / 2)]?.date.slice(5)}
          </span>
          <span>{usage.series.at(-1)?.date.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}
function ProviderBreakdown({ usage }: { usage?: AccountUsage }) {
  return (
    <div className="ws-provider-breakdown">
      {usage?.providers.map((p) => (
        <div key={p.provider}>
          <div>
            <span className="ws-provider-cell">
              <ProviderIcon provider={p.provider} />
              {providerLabel(p.provider)}
            </span>
            <strong>
              {p.requests.toLocaleString()}
              <small>requests</small>
            </strong>
          </div>
          <div className="ws-meter">
            <span
              style={{
                width: `${usage.requests ? (p.requests / usage.requests) * 100 : 0}%`,
              }}
            />
          </div>
          <p>
            {money(p.estimatedMicros)} estimated
            <span>
              {usage.requests
                ? Math.round((p.requests / usage.requests) * 100)
                : 0}
              % of requests
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
function OverviewEmptyState() {
  const markFilter = useId();
  return (
    <div className="ws-overview-empty">
      <svg
        className="ws-overview-empty-mark"
        width="135.35"
        height="81"
        viewBox="0 8 52 31"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={markFilter}
            x="-1"
            y="7"
            width="54"
            height="33"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0.937255 0 0 0 0 0.937255 0 0 0 0 0.937255 0 0 0 1 0"
              result="mark"
            />
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="0.288"
              result="blur"
            />
            <feComposite
              in="SourceAlpha"
              in2="blur"
              operator="out"
              result="edge"
            />
            <feFlood floodColor="black" floodOpacity="0.3" result="shadow" />
            <feComposite in="shadow" in2="edge" operator="in" result="inset" />
            <feMerge>
              <feMergeNode in="mark" />
              <feMergeNode in="inset" />
            </feMerge>
          </filter>
        </defs>
        <image
          href="/two-hands-mark.svg"
          x="-1.5"
          y="-4"
          width="55"
          height="55"
          filter={`url(#${markFilter})`}
        />
      </svg>
      <h3>No requests yet</h3>
    </div>
  );
}
function ActivityUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty
      title="Activity unavailable"
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw01 />
          Retry activity
        </Button>
      }
    >
      We couldn’t load your request history. Try again.
    </Empty>
  );
}

function OverviewRequests({
  items,
  loading,
  onSelect,
}: {
  items: ActivityItem[];
  loading: boolean;
  onSelect: (item: ActivityItem) => void;
}) {
  if (loading) return <Loading />;
  if (!items.length) return <OverviewEmptyState />;
  return (
    <table className="ws-overview-requests">
      <thead>
        <tr>
          <th scope="col">Request</th>
          <th scope="col">Model</th>
          <th scope="col">Est. cost</th>
          <th scope="col">
            <span className="sr-only">Action</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <th scope="row">
              <strong>{item.sessionTitle}</strong>
              <small>{providerLabel(item.provider)}</small>
            </th>
            <td>{item.model || "—"}</td>
            <td>{money(item.estimateMicros)}</td>
            <td>
              <Button
                variant="secondary"
                className="ws-overview-request-action"
                size="xs"
                aria-label={"Inspect request " + item.id}
                onClick={() => onSelect(item)}
              >
                View <ArrowUpRight />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const requestShare = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

function OverviewProviders({
  usage,
  pinned,
  onPin,
}: {
  usage?: AccountUsage;
  pinned: ReadonlySet<string>;
  onPin: (provider: string) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const metrics = new Map(
    usage?.providers.map((item) => [item.provider, item]),
  );
  const providers = providerIds
    .filter((provider) => providerLabel(provider).toLowerCase().includes(term))
    .sort(
      (a, b) =>
        Number(pinned.has(b)) - Number(pinned.has(a)) ||
        (metrics.get(b)?.requests ?? 0) - (metrics.get(a)?.requests ?? 0),
    );
  return (
    <div className="ws-overview-providers">
      <label className="ws-overview-provider-search">
        <SearchMd size={16} />
        <Input
          type="search"
          aria-label="Search providers"
          placeholder="Search providers"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {providers.length ? (
        <ul className="ws-overview-provider-list" aria-label="Provider usage">
          {providers.map((provider) => {
            const totals = metrics.get(provider);
            const label = providerLabel(provider);
            return (
              <li className="ws-overview-provider" key={provider}>
                <div className="ws-overview-provider-heading">
                  <h3>
                    <CatalogMark provider={provider} />
                    {label}
                  </h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="ws-overview-pin"
                    aria-label={"Pin " + label}
                    aria-pressed={pinned.has(provider)}
                    onClick={() => onPin(provider)}
                  >
                    <Pin01 />
                  </Button>
                </div>
                <dl>
                  <div>
                    <dt>Requests</dt>
                    <dd>{totals?.requests.toLocaleString() ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Estimated cost</dt>
                    <dd>{totals ? money(totals.estimatedMicros) : "—"}</dd>
                  </div>
                  <div>
                    <dt>Request share</dt>
                    <dd>
                      {totals
                        ? requestShare.format(
                            usage?.requests
                              ? totals.requests / usage.requests
                              : 0,
                          )
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="ws-panel-note" role="status">
          No matching providers
        </p>
      )}
    </div>
  );
}
function ActivityTable({
  items,
  loading,
  onSelect,
  filtered,
  onClearFilters,
}: {
  items: ActivityItem[];
  loading?: boolean;
  onSelect: (i: ActivityItem) => void;
  filtered?: boolean;
  onClearFilters?: () => void;
}) {
  const openConnectAgent = useConnectAgent();
  // Shown only when a listed call was paid from prepaid credits.
  const charged = items.some((item) => item.charge);
  if (loading) return <Loading />;
  if (!items.length)
    return (
      <Empty
        title={filtered ? "No matching requests" : "No requests yet"}
        action={
          filtered && onClearFilters ? (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : filtered ? (
            <Button variant="outline" size="sm" asChild>
              <a href="#dashboard/tools">
                Explore tools
                <ArrowRight />
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openConnectAgent()}
            >
              Connect your agent
              <ArrowRight />
            </Button>
          )
        }
      >
        {filtered
          ? "Try another search, provider, status, or date range."
          : "Use Two Hands tools in your agent. Each call will appear here with its cost estimate and result."}
      </Empty>
    );
  return (
    <div
      className="ws-table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Scrollable request and usage table"
    >
      <table className="ws-table ws-activity-table">
        <thead>
          <tr>
            <th>Tool / request</th>
            <th>Provider</th>
            <th>Status</th>
            <th>Est. cost</th>
            {charged && <th>Charged</th>}
            <th>Latency</th>
            <th>Time</th>
            <th>
              <span className="sr-only">Inspect</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <button
                  className="ws-request-button"
                  onClick={() => onSelect(item)}
                >
                  <strong>{item.tool}</strong>
                  <span>
                    {item.arguments.query ??
                      item.arguments.url ??
                      item.sessionTitle}
                  </span>
                </button>
              </td>
              <td>
                <span className="ws-provider-cell">
                  <ProviderIcon provider={item.provider} />
                  {providerLabel(item.provider)}
                </span>
              </td>
              <td>
                <Status status={item.status} />
              </td>
              <td className="ws-mono">{money(item.estimateMicros)}</td>
              {charged && (
                <td className="ws-mono">
                  {!item.charge
                    ? "—"
                    : item.charge.outcome === "in_progress"
                      ? `${sandboxCredits(item.charge.heldMicros)} held`
                      : sandboxCredits(item.charge.chargedMicros)}
                </td>
              )}
              <td className="ws-mono">{latency(item.latencyMs)}</td>
              <td>
                <time dateTime={item.startedAt}>{date(item.startedAt)}</time>
              </td>
              <td>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Inspect request ${item.id}`}
                  onClick={() => onSelect(item)}
                >
                  <ArrowUpRight />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
const toolCategories = [
  ["all", "All tools"],
  ["search", "Web search"],
  ["extract", "Extraction"],
] as const;

const catalogCopy: Partial<
  Record<Catalog[number]["provider"], { name?: string; summary: string }>
> = {
  brave: { summary: "Search Brave’s independent web index." },
  browserbase: {
    name: "Browserbase",
    summary: "Read hard-to-access web pages as Markdown.",
  },
  exa: { summary: "Search the web and retrieve full page text." },
  firecrawl: { summary: "Extract readable content from a web page." },
  jina: { summary: "Convert a web page into text for your agent." },
  linkup: {
    summary: "Search the web and retrieve content from the original sources.",
  },
  parallel: {
    name: "Parallel",
    summary: "Find ranked excerpts or extract the full content of a page.",
  },
  perplexity: {
    name: "Perplexity",
    summary: "Get ranked web results with page excerpts.",
  },
  serper: { summary: "Get Google web results with short snippets." },
  tavily: { summary: "Search the web and return relevant excerpts." },
};

type ToolAvailability =
  "Available" | "Paused" | "Not configured" | "Restricted";
type ToolEnabled = (tool: ToolName) => boolean;

function catalogProviderId(provider: Catalog[number]["provider"]) {
  return provider === "parallel_extract" ? "parallel" : provider;
}

function catalogProviderLabel(provider: Catalog[number]["provider"]) {
  const id = catalogProviderId(provider);
  return catalogCopy[id]?.name ?? providerLabel(id);
}

function CatalogMark({ provider }: { provider: Catalog[number]["provider"] }) {
  if (provider === "exa" || provider === "firecrawl")
    return (
      <img
        className="catalog-provider-mark"
        src={provider === "exa" ? catalogExaMark : catalogFirecrawlMark}
        width={22}
        height={22}
        alt=""
      />
    );
  return <ProviderIcon provider={provider} />;
}

function toolAvailability(
  tool: Catalog[number],
  enabled: ToolEnabled,
): ToolAvailability {
  if (!enabled(tool.tool)) return "Paused";
  if (!tool.available) return "Not configured";
  return tool.operatorAllowed ? "Available" : "Restricted";
}

function CatalogStatus({ label }: { label: ToolAvailability | "Mixed" }) {
  return (
    <Badge className="catalog-status" variant="secondary">
      {label}
    </Badge>
  );
}

type ConnectorListing = {
  tool: string;
  connector: string;
  company: string;
  title: string | null;
  description: string;
  estimatedMicros: number;
};
/** Approved tools that companies supply through their own MCP servers. */
function ConnectorCatalog() {
  const [tools, setTools] = useState<ConnectorListing[]>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api<{ tools: ConnectorListing[] }>("/observations/connector-tools")
      .then((data) => active && setTools(data.tools))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, []);
  if (error || !tools?.length) return null;
  return (
    <Section
      className="connector-catalog"
      title="Company connector tools"
      description="Supplied by tool companies through their own MCP servers and approved by Two Hands. Descriptions come from the company. Agents call them with call_connector_tool."
    >
      <div className="catalog-grid">
        {tools.map((t) => (
          <Card className="ws-tool-card" role="article" key={t.tool}>
            <div className="catalog-card-intro">
              <div className="catalog-card-header">
                <div className="catalog-card-identity">
                  <CardTitle>{t.title || t.tool.split("__")[1]}</CardTitle>
                </div>
                <CatalogStatus label="Available" />
              </div>
              <p className="catalog-summary">{t.description}</p>
            </div>
            <div className="catalog-estimate">
              <p>Approved estimate</p>
              <div className="catalog-estimate-value">
                <span>
                  {money(t.estimatedMicros)} <small>/ call</small>
                </span>
                <span>{t.company}</span>
              </div>
            </div>
            <footer className="catalog-card-footer">
              <code>{t.tool}</code>
            </footer>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function CatalogView({
  catalog,
  loading,
  error,
  onRetry,
  enabled,
  onSelect,
}: {
  catalog: Catalog;
  loading: boolean;
  error: string;
  onRetry: () => void;
  enabled: ToolEnabled;
  onSelect: (tool: Catalog[number], trigger: HTMLButtonElement) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sort, setSort] = useState("name");
  const search = useRef<HTMLInputElement>(null);
  const initialLoading = loading && catalog.length === 0;
  const controlsDisabled = initialLoading || (!!error && catalog.length === 0);

  const providers = new Map<
    ReturnType<typeof catalogProviderId>,
    Catalog[number][]
  >();
  for (const tool of catalog) {
    const id = catalogProviderId(tool.provider);
    const endpoints = providers.get(id) ?? [];
    endpoints.push(tool);
    providers.set(id, endpoints);
  }

  const term = query.trim().toLowerCase();
  const visible = Array.from(providers, ([id, endpoints]) => ({
    id,
    endpoints,
    label: catalogProviderLabel(id),
    lowestEstimate: Math.min(...endpoints.map((tool) => tool.estimatedMicros)),
    statuses: new Set(endpoints.map((tool) => toolAvailability(tool, enabled))),
    matchingEndpoint: endpoints.find(
      (endpoint) =>
        (category === "all" || toolOperation(endpoint.tool) === category) &&
        (availability === "all" ||
          toolAvailability(endpoint, enabled) === availability),
    ),
  }))
    .filter(
      ({ label, endpoints, matchingEndpoint }) =>
        matchingEndpoint &&
        [
          label,
          ...endpoints.flatMap((tool) => [
            providerLabel(tool.provider),
            tool.tool,
            tool.description,
          ]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(term),
    )
    .sort(
      (a, b) =>
        (sort === "price" ? a.lowestEstimate - b.lowestEstimate : 0) ||
        a.label.localeCompare(b.label),
    );

  return (
    <section className="tool-catalog" aria-label="Browse tools">
      <div className="catalog-controls">
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <SearchMd size={16} aria-hidden="true" />
            <Input
              ref={search}
              aria-label="Search tools"
              placeholder="Search tools or providers"
              disabled={controlsDisabled}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select
            value={availability}
            onValueChange={setAvailability}
            disabled={controlsDisabled}
          >
            <SelectTrigger aria-label="Availability" className="catalog-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="all">Any availability</SelectItem>
              <SelectItem value="Available">Available</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Not configured">Not configured</SelectItem>
              <SelectItem value="Restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={setSort}
            disabled={controlsDisabled}
          >
            <SelectTrigger aria-label="Sort tools" className="catalog-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectItem value="name">Provider name</SelectItem>
              <SelectItem value="price">Lowest estimate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div
          className="catalog-categories"
          role="group"
          aria-label="Tool categories"
        >
          {toolCategories.map(([id, label]) => (
            <Button
              key={id}
              type="button"
              variant="ghost"
              size="xs"
              aria-pressed={category === id}
              disabled={controlsDisabled}
              onClick={() => setCategory(id)}
            >
              {label}
            </Button>
          ))}
        </div>
        {!loading && !error && (
          <p className="sr-only" role="status">
            {visible.length} {visible.length === 1 ? "provider" : "providers"}
          </p>
        )}
      </div>
      {error && (
        <Card className="mb-4 gap-3 p-5">
          <CardTitle>Couldn’t load tools</CardTitle>
          <InlineError message={error} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            aria-label="Retry loading tools"
            onClick={onRetry}
          >
            Retry
          </Button>
        </Card>
      )}
      {initialLoading ? (
        <>
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            Loading tools…
          </p>
          <div className="catalog-grid" aria-hidden="true" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index} className="gap-5 p-5">
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded bg-muted" />
                  <div className="h-5 w-28 rounded bg-muted" />
                </div>
                <div className="h-4 rounded bg-muted" />
                <div className="h-16 rounded bg-muted" />
                <div className="h-6 w-24 rounded bg-muted" />
              </Card>
            ))}
          </div>
        </>
      ) : error && catalog.length === 0 ? null : visible.length ? (
        <div className="catalog-grid" aria-busy={loading}>
          {visible.map(
            ({
              id,
              endpoints,
              label,
              lowestEstimate,
              statuses,
              matchingEndpoint,
            }) => {
              const endpoint = endpoints[0]!;
              const multiple = endpoints.length > 1;
              return (
                <Card className="ws-tool-card" role="article" key={id}>
                  <div className="catalog-card-intro">
                    <div className="catalog-card-header">
                      <div className="catalog-card-identity">
                        <CatalogMark provider={id} />
                        <CardTitle>{label}</CardTitle>
                      </div>
                      <CatalogStatus
                        label={
                          statuses.size === 1
                            ? toolAvailability(endpoint, enabled)
                            : "Mixed"
                        }
                      />
                    </div>
                    <p className="catalog-summary">
                      {catalogCopy[id]?.summary ??
                        providerEntry(id)?.summary ??
                        endpoint.description}
                    </p>
                  </div>
                  <div className="catalog-estimate">
                    <p>{multiple ? "Estimates from" : "Default estimate"}</p>
                    <div className="catalog-estimate-value">
                      <span>
                        {money(lowestEstimate)} <small>/ call</small>
                      </span>
                      <span>
                        {endpoints.length} {multiple ? "endpoints" : "endpoint"}
                      </span>
                    </div>
                  </div>
                  <footer className="catalog-card-footer">
                    {multiple ? (
                      <span>Search and extraction</span>
                    ) : (
                      <code>{endpoint.tool}</code>
                    )}
                    <Button
                      className="catalog-action-chip"
                      type="button"
                      variant="secondary"
                      size="xs"
                      aria-label={`View tool: ${label}`}
                      onClick={(event) =>
                        onSelect(
                          matchingEndpoint ?? endpoint,
                          event.currentTarget,
                        )
                      }
                    >
                      View tool
                      <ArrowUpRight className="size-[13px]" />
                    </Button>
                  </footer>
                </Card>
              );
            },
          )}
        </div>
      ) : (
        <Card className="catalog-empty">
          <CardTitle>No matching tools</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setAvailability("all");
              search.current?.focus();
            }}
          >
            Clear filters
          </Button>
        </Card>
      )}
    </section>
  );
}

function CatalogToolDetails({
  tool,
  endpoints,
  enabled,
  onSelect,
  onToggle,
  saving,
}: {
  tool: Catalog[number];
  endpoints: Catalog;
  enabled: ToolEnabled;
  onSelect: (tool: Catalog[number]) => void;
  onToggle: (tool: ToolName, enabled: boolean) => void;
  saving: boolean;
}) {
  return (
    <div className="catalog-tool-details">
      <dl className="catalog-facts">
        <div>
          <dt>Workspace calls</dt>
          <dd>{tool.sampleCount}</dd>
        </div>
        <div>
          <dt>Average latency</dt>
          <dd>{latency(tool.averageLatencyMs)}</dd>
        </div>
        <div>
          <dt>API success rate</dt>
          <dd>
            {tool.successRate == null
              ? "Needs 5 completed calls"
              : `${(tool.successRate * 100).toFixed(1)}%`}
          </dd>
        </div>
      </dl>
      <h3>When to use it</h3>
      <p>{tool.useWhen}</p>
      <h3>What to expect</h3>
      <p>{tool.limitations}</p>
      <h3>Endpoints</h3>
      <ul className="catalog-endpoints">
        {endpoints.map((endpoint) => (
          <li key={endpoint.tool} className="catalog-endpoint">
            <div>
              {endpoints.length > 1 ? (
                <button
                  type="button"
                  aria-pressed={endpoint.tool === tool.tool}
                  onClick={() => onSelect(endpoint)}
                >
                  <code>{endpoint.tool}</code>
                </button>
              ) : (
                <code>{endpoint.tool}</code>
              )}
              <span>{money(endpoint.estimatedMicros)} / call</span>
            </div>
            <Switch
              checked={enabled(endpoint.tool)}
              disabled={saving}
              onCheckedChange={(value) => onToggle(endpoint.tool, value)}
              aria-label={`${enabled(endpoint.tool) ? "Pause" : "Enable"} ${endpoint.tool}`}
            />
          </li>
        ))}
      </ul>
      <p className="catalog-detail-note">
        Availability settings apply to discovery and new provider calls.
        Estimates can vary by request.
      </p>
      <details className="catalog-adapter-details">
        <summary>Adapter defaults</summary>
        <pre>{JSON.stringify(tool.adapter, null, 2)}</pre>
      </details>
      <Button variant="outline" size="sm" asChild>
        <a
          href={tool.documentationUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Provider documentation
          <ArrowUpRight />
        </a>
      </Button>
      <p className="field-hint">
        Observed execution metrics describe this account. API success does not
        measure answer quality.
      </p>
    </div>
  );
}
function RoutingPreview({ revision }: { revision?: number }) {
  const [operation, setOperation] = useState("search");
  const [value, setValue] = useState("");
  const [content, setContent] = useState("any");
  const [results, setResults] = useState("10");
  const [preview, setPreview] = useState<Preview>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const version = useRef(0);
  useEffect(() => {
    version.current++;
    setPreview(undefined);
    setError("");
    setBusy(false);
  }, [operation, value, content, results, revision]);
  return (
    <Section
      title="Preview a route"
      description="See compatible tools and request estimates before your agent calls them."
      action={<Badge variant="outline">No provider call · Free</Badge>}
    >
      <form
        className="ws-preview-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const id = ++version.current;
          setBusy(true);
          setError("");
          try {
            const data = await api<Preview>("/account/preview", {
              need: value,
              operations: [
                {
                  operation,
                  ...(operation === "search"
                    ? { query: value, maxResults: Number(results) }
                    : { url: value }),
                  content,
                },
              ],
            });
            if (id === version.current) setPreview(data);
          } catch (e) {
            if (id === version.current) {
              setPreview(undefined);
              setError((e as Error).message);
            }
          } finally {
            if (id === version.current) setBusy(false);
          }
        }}
      >
        <div className="ws-preview-fields">
          <label>
            <span>Operation</span>
            <NativeSelect
              label="Preview operation"
              value={operation}
              onChange={setOperation}
              options={[
                ["search", "Web search"],
                ["extract", "Page extraction"],
              ]}
            />
          </label>
          <label className="ws-preview-query">
            <span>
              {operation === "search" ? "Search query" : "Public HTTPS URL"}
            </span>
            <Input
              aria-label={
                operation === "search" ? "Preview search query" : "Preview URL"
              }
              value={value}
              required
              maxLength={operation === "search" ? 500 : 2048}
              type={operation === "extract" ? "url" : "text"}
              placeholder={
                operation === "search"
                  ? "What does your agent need to find?"
                  : "https://example.com/page"
              }
              onChange={(e) => setValue(e.target.value)}
            />
          </label>
          <label>
            <span>Required content</span>
            <NativeSelect
              label="Required content"
              value={content}
              onChange={setContent}
              options={[
                ["any", "Any evidence"],
                ["page_text", "Page text"],
                ["complete_page", "Complete page"],
              ]}
            />
          </label>
          {operation === "search" && (
            <label>
              <span>Results</span>
              <NativeSelect
                label="Result count"
                value={results}
                onChange={setResults}
                options={[
                  ["5", "5"],
                  ["10", "10"],
                  ["20", "20"],
                ]}
              />
            </label>
          )}
        </div>
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? "Checking…" : "Preview route"}
          <GitBranch01 />
        </Button>
        <InlineError message={error} />
      </form>
      {preview && (
        <div className="ws-preview-result" role="status">
          <div>
            <strong>
              {preview.candidateTools.length} eligible{" "}
              {preview.candidateTools.length === 1 ? "tool" : "tools"}
            </strong>
            <span>
              Against the {money(preview.budgetMicros)} backend session limit
            </span>
          </div>
          {preview.tools.map((t) => (
            <div className="ws-preview-option" key={t.tool}>
              <code>{t.tool}</code>
              <Badge variant="outline">
                {t.discoveryMatches[0]?.status.replaceAll("_", " ")}
              </Badge>
              <strong>
                {t.requestEstimates[0]
                  ? money(t.requestEstimates[0].estimatedMicros)
                  : "—"}
              </strong>
              <p>{t.discoveryMatches[0]?.reason}</p>
            </div>
          ))}
          <p className="field-hint">
            A preview does not start a session, reserve a budget, or choose a
            provider. The agent makes the final selection.
          </p>
        </div>
      )}
    </Section>
  );
}
function CallDetail({ item }: { item: ActivityItem }) {
  const [call, setCall] = useState<ObservedCall>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let finished = false;
    setCall(undefined);
    setError("");
    const load = async () => {
      try {
        const data = await api<ObservedCall>(
          `/observations/${item.sessionId}/calls/${item.id}`,
        );
        if (active) {
          setCall(data);
          setError("");
          finished = data.status !== "running";
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    };
    const stop = startPolling(async () => {
      if (!finished) await load();
    }, 3000);
    return () => {
      active = false;
      stop();
    };
  }, [item.id, item.sessionId]);
  return (
    <div className="ws-call-detail">
      <div className="ws-detail-tool">
        <ProviderIcon provider={item.provider} />
        <code>{item.tool}</code>
        <Status status={call?.status ?? item.status} />
      </div>
      <InlineError message={error} />
      <div className="ws-detail-facts">
        <div>
          <span>Estimated cost</span>
          <strong>{money(item.estimateMicros)}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>{latency(call?.latencyMs ?? item.latencyMs)}</strong>
        </div>
        <div>
          <span>Client / model</span>
          <strong>
            {item.host} / {item.model}
          </strong>
          <small>Reported identity</small>
        </div>
        <div>
          <span>Started</span>
          <strong>{date(item.startedAt)}</strong>
        </div>
      </div>
      {item.charge && (
        <>
          <h3>Charge from prepaid credits</h3>
          <div className="ws-detail-facts" data-call-charge>
            <div>
              <span>Outcome</span>
              <strong>{chargeOutcome(item.charge.outcome)}</strong>
              {item.charge.reason && (
                <small>{chargeReason(item.charge.reason)}</small>
              )}
            </div>
            <div>
              <span>Provider cost</span>
              <strong>{sandboxCredits(item.charge.providerCostMicros)}</strong>
            </div>
            <div>
              <span>Two Hands markup (10%)</span>
              <strong>{sandboxCredits(item.charge.markupMicros)}</strong>
            </div>
            <div>
              <span>
                {item.charge.outcome === "in_progress" ? "Held" : "Charged"}
              </span>
              <strong>
                {sandboxCredits(
                  item.charge.outcome === "in_progress"
                    ? item.charge.heldMicros
                    : item.charge.chargedMicros,
                )}
              </strong>
              <small>
                {item.charge.mode === "live"
                  ? "USD"
                  : "Sandbox credits, not real money"}
              </small>
            </div>
          </div>
        </>
      )}
      <h3>Agent’s stated reason</h3>
      <p>{item.statedReason || "No reason recorded"}</p>
      <div className="ws-receipt-id">
        <code>{item.id}</code>
        <CopyButton text={item.id} />
      </div>
      <Tabs defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="response">Response</TabsTrigger>
        </TabsList>
        <TabsContent value="request">
          <pre>
            {JSON.stringify(call?.arguments ?? item.arguments, null, 2)}
          </pre>
        </TabsContent>
        <TabsContent value="response">
          {error ? (
            <p>Could not retrieve this receipt.</p>
          ) : !call ? (
            <Loading />
          ) : call.status === "running" ? (
            <p role="status">This request is still running.</p>
          ) : (
            <>
              {call.error && <InlineError message={call.error} />}
              <pre>
                {JSON.stringify(
                  call.result ?? {
                    status: call.status,
                    error: call.error ?? "No result returned",
                  },
                  null,
                  2,
                )}
              </pre>
            </>
          )}
        </TabsContent>
      </Tabs>
      <p className="field-hint">
        Cost estimates and agent-reported explanations are separate from
        provider results. Retrieved content is source material, not
        instructions.
      </p>
    </div>
  );
}
function ConnectionView({
  connection,
  catalog,
}: {
  connection?: Connection;
  catalog: Catalog;
}) {
  const account = useAccount();
  return (
    <>
      <div className="ws-connection-grid">
        <Section
          title="Connect your agent"
          description="Use Two Hands inside your existing conversations."
        >
          <AgentConnectionInstructions />
        </Section>
        <Section
          title="Connection status"
          description="Client activity recorded for this account."
        >
          <div className="ws-connection-status">
            <span className="ws-banner-icon">
              <TerminalSquare />
            </span>
            <h3>
              {connection?.clients.length
                ? "Client requests observed"
                : "Waiting for your first connection"}
            </h3>
            <p>
              {connection?.clients.length
                ? "These clients have sent requests to Two Hands. Last seen is not a live heartbeat."
                : "Connect an MCP client. It will appear here after its first request."}
            </p>
          </div>
          <div className="ws-client-list">
            {connection?.clients.map((c) => (
              <div key={`${c.clientName}-${c.clientVersion}`}>
                <TerminalSquare size={17} />
                <div>
                  <strong>
                    {c.clientName} <span>{c.clientVersion}</span>
                  </strong>
                  <small>Last seen {date(c.lastSeenAt)}</small>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href="#dashboard/requests">
              View request activity
              <ArrowRight />
            </a>
          </Button>
        </Section>
      </div>
      <Section
        title="Provider connections"
        description="Credentials are configured on the server. Their values are never sent to this page."
      >
        <div className="ws-routing-list">
          {catalog.map((t) => (
            <div key={t.tool}>
              <ProviderIcon provider={t.provider} />
              <div>
                <strong>{providerLabel(t.provider)}</strong>
                <p>{t.tool}</p>
              </div>
              <Badge variant="outline">
                {t.available ? "Configured" : "Not configured"}
              </Badge>
            </div>
          ))}
        </div>
        <div className="ws-panel-note">
          {account.enabled && !account.profile?.isAdmin
            ? "Two Hands manages provider availability. Use browser sign-in for coding agents or API keys for product integrations."
            : "Missing a provider? Set its API key in the server environment, then restart the server."}
          <Go section="tools">Open tool catalog</Go>
        </div>
      </Section>
    </>
  );
}
function ExportActivity({
  days,
  query,
  provider,
  status,
  total,
}: {
  days: string;
  query: string;
  provider: string;
  status: string;
  total: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="ws-export">
      <Button
        size="sm"
        variant="outline"
        disabled={busy || !total}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const params = new URLSearchParams({
              days,
              q: query,
              provider,
              status,
              export: "true",
            });
            const result = await api<ActivityPage>(
              `/account/activity?${params}`,
            );
            const items = result.items;
            const cell = (value: unknown) => {
              const v = String(value ?? "");
              return `"${(/^[=+@\-\t\r]/.test(v) ? "'" : "") + v.replaceAll('"', '""')}"`;
            };
            const columns = [
              "id",
              "sessionId",
              "sessionTitle",
              "tool",
              "provider",
              "status",
              "startedAt",
              "latencyMs",
              "estimateMicros",
              "reportedUsd",
              "reportedCredits",
            ] as const;
            const csv = [
              [...columns, "chargeOutcome", "chargedMicros"].join(","),
              ...items.map((i) =>
                [
                  ...columns.map((c) => cell(i[c])),
                  cell(i.charge?.outcome),
                  cell(i.charge?.chargedMicros),
                ].join(","),
              ),
            ].join("\r\n");
            download(`two-hands-activity-${days}d.csv`, csv, "text/csv");
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Download01 />
        {busy ? "Exporting…" : "Export CSV"}
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
