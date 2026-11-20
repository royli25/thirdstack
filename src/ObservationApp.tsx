import { startPolling } from "./polling";
import {
  isProviderId,
  providerEntry,
  providerIds,
  providerLabel,
} from "../server/provider-catalog";
import { useConnectAgent } from "./ConnectAgentDialog";

import { AdminNavigation } from "./AdminNavigation";
import { canOpen, homeRoute } from "./account-type";
import { WrongAccountArea } from "./ChooseAccountType";
import { OperatorAllowanceNotice } from "./OperatorAllowanceNotice";
import { AccountControls, useAccount } from "./AccountGate";
import { CustomerFunding, useCustomerFunding } from "./customer-funding";
import { spendableBalance } from "./funding-format";
import { WalletNotice } from "./WalletNotice";
const DisputeReviewView = lazy(() =>
  import("./DisputeReviewView").then((m) => ({ default: m.DisputeReviewView })),
);
import { ToolOptions, ConnectorOffers } from "./components/ToolOptions";
import { ProviderLogo } from "./components/shared";
import { OutcomeContent } from "./components/DeferredOutcomeContent";
const CompanyView = lazy(() =>
  import("./CompanyView").then((m) => ({ default: m.CompanyView })),
);
const ProviderLabView = lazy(() =>
  import("./ProviderLabView").then((m) => ({ default: m.ProviderLabView })),
);
const LandingView = lazy(() =>
  import("./LandingView").then((m) => ({ default: m.LandingView })),
);
import { dashboardSections, type DashboardSection } from "./dashboard-routes";
const UserDashboardView = lazy(() =>
  import("./UserDashboardView").then((m) => ({ default: m.UserDashboardView })),
);
const ToolSettingsView = lazy(() =>
  import("./ToolSettingsView").then((m) => ({ default: m.ToolSettingsView })),
);
const ToolAccessView = lazy(() =>
  import("./ToolAccessView").then((m) => ({ default: m.ToolAccessView })),
);
const CompanyPortal = lazy(() =>
  import("./RolePortals").then((m) => ({ default: m.CompanyPortal })),
);
const AdminCompanyReview = lazy(() =>
  import("./RolePortals").then((m) => ({ default: m.AdminCompanyReview })),
);
const AccountSettings = lazy(() =>
  import("./RolePortals").then((m) => ({ default: m.AccountSettings })),
);
const PortalShell = lazy(() =>
  import("./RolePortals").then((m) => ({ default: m.PortalShell })),
);
const ConnectorsView = lazy(() =>
  import("./ConnectorsView").then((m) => ({ default: m.ConnectorsView })),
);
import "./provider.css";
import "./customer-navigation.css";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Grid01,
  HomeLine,
  BarChartSquare02,
  ShieldTick,
  Link01,
  Plus,
  SearchLg,
  ArrowLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Menu01,
  XClose,
  FileCheck02,
  TerminalSquare,
  Activity,
  GitBranch01,
  CreditCard01,
  PuzzlePiece01,
  Key01,
} from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { api, money, setToken, ApiError } from "./api";
import type {
  ObservationSession,
  ObservationListItem,
  SessionDetail,
  ObservationEvent,
} from "../server/observation-types";
import type { TaskSummary } from "../server/types";
import {
  Panel,
  Empty,
  CopyButton,
  ExportButton,
  Field,
  NewSession,
  InlineError,
  StateBadge,
  EvaluationForm,
  EvaluationStats,
  IntentContent,
  ExternalLink,
  download,
  date,
  statusLabel,
} from "./observation-ui";

type Page =
  | "admin"
  | "tool-access"
  | "tool-settings"
  | "home"
  | "dashboard"
  | "sessions"
  | "models"
  | "tools"
  | "cases"
  | "settings"
  | "company"
  | "lab"
  | "connectors"
  | "disputes";
type Summary = {
  sessions: number;
  pendingApproval: number;
  outputs: number;
  reviews: number;
  estimatedMicros: number;
  openCases: number;
  models: {
    model: string;
    identity: string;
    sessions: number;
    reviewed: number;
    fullyReviewed: number;
    score: number | null;
    minimumSamples: number;
    scoreUnavailableReason?: string | null;
    assistantReviewed?: number;
    humanReportedReviews?: number;
  }[];
  sharing: {
    consentedSessions: number;
    minimumCohort: number;
    available: boolean;
    published: boolean;
  };
};
type Catalog = Awaited<
  ReturnType<import("../server/observation").Observatory["catalog"]>
>;

// Untitled UI home-line: https://www.untitledui.com/free-icons
function HomeNavigationIcon() {
  return (
    <span className="customer-home-icon" aria-hidden="true">
      <HomeLine
        style={{
          width: 24,
          height: 24,
          transform: "scale(0.7083333333)",
          transformOrigin: "top left",
        }}
      />
    </span>
  );
}

const pages = [
  { id: "sessions", label: "Sessions", icon: Grid01 },
  { id: "models", label: "Model evaluations", icon: BarChartSquare02 },
  { id: "tools", label: "Tool activity", icon: Link01 },
  { id: "cases", label: "Review cases", icon: ShieldTick },
  { id: "lab", label: "Provider lab", icon: TerminalSquare },
  { id: "connectors", label: "Connectors", icon: PuzzlePiece01 },
  { id: "disputes", label: "Payment disputes", icon: CreditCard01 },
] as const;
function readRoute() {
  const [page, id, section, finding] = location.hash.slice(1).split("/");
  if (!page)
    return {
      page: "home" as Page,
      id,
      labProvider: "all",
      labFinding: "all",
      section: "overview",
      focusPaymentMethods: false,
    };
  return {
    page: ([
      "admin",
      "tool-access",
      "tool-settings",
      "home",
      "dashboard",
      "sessions",
      "models",
      "tools",
      "cases",
      "settings",
      "company",
      "lab",
      "connectors",
      "disputes",
    ].includes(page)
      ? page
      : "sessions") as Page,
    id,
    labProvider: isProviderId(section) ? section : "all",
    labFinding: ["missed", "unreviewed", "errors", "truncated"].includes(
      finding,
    )
      ? finding
      : "all",
    section: [
      "overview",
      "trace",
      "output",
      "record",
      "benchmarks",
      "plans",
      "insights",
      "activity",
      "choices",
      "listing",
      "team",
      "details",
      "integration",
      "connectors",
    ].includes(section)
      ? section
      : "overview",
    focusPaymentMethods:
      page === "dashboard" && id === "credits" && section === "add-funds",
  };
}
function navigate(page: Page, id?: string) {
  location.hash = `${page}${id ? `/${id}` : ""}`;
  window.dispatchEvent(
    new CustomEvent("twohands:navigate", { detail: location.hash }),
  );
}
function eventLabel(e: ObservationEvent) {
  return (
    (
      {
        client_observed: "Agent client observed",
        intent_recorded: "Intent recorded",
        intent_approved: "Intent accepted",
        intent_authorized: "Backend authorization",
        tools_offered: "Tool options returned",
        selection_explanation: "Agent’s stated reason",
        tool_called: "Tool requested",
        route_decided: "Route decided by Two Hands",
        route_fallback: "Route fallback",
        route_unavailable: "No eligible route",
        tool_result: "Tool result received",
        call_interrupted: "Call interrupted",
        outcome_submitted: "Output submitted",
        outcome_evaluated: "Outcome evaluated",
        sharing_consent_changed: "Historical sharing preference",
        sharing_policy_applied: "Account sharing policy applied",
        review_case_opened: "Review case opened",
        review_case_closed: "Review case closed",
      } as Record<string, string>
    )[e.type] || e.type.replaceAll("_", " ")
  );
}
function reportedUsage(data: Record<string, any> | null | undefined) {
  const usd = data?.usage?.providerReportedUsd;
  const credits = data?.usage?.credits ?? data?.credits;
  const parts: string[] = [];
  if (typeof usd === "number" && Number.isFinite(usd) && usd >= 0)
    parts.push(
      `$${usd.toFixed(6).replace(/0+$/, "").replace(/\.$/, ".00")} provider-reported cost`,
    );
  if (typeof credits === "number" && Number.isFinite(credits) && credits >= 0)
    parts.push(
      `${credits} provider-reported credit${credits === 1 ? "" : "s"}`,
    );
  return parts.join(" · ") || "Cost / usage not reported by provider";
}
function ProviderUsageSummary({ calls }: { calls: SessionDetail["calls"] }) {
  return (
    <div className="provider-usage-summary">
      <strong>Provider-reported usage</strong>
      {providerIds.map((provider) => {
        const usd = providerEntry(provider)!.usageUnit === "usd";
        const completed = calls.filter(
          (c) => c.provider === provider && c.status !== "running",
        );
        if (!completed.length) return null;
        const reported = completed.filter((c) => {
          const r = c.result as Record<string, any> | undefined;
          const v = usd
            ? r?.usage?.providerReportedUsd
            : (r?.usage?.credits ?? r?.credits);
          return typeof v === "number" && Number.isFinite(v) && v >= 0;
        });
        const total = reported.reduce((sum, c) => {
          const r = c.result as Record<string, any>;
          return (
            sum +
            (usd
              ? r.usage.providerReportedUsd
              : (r.usage?.credits ?? r.credits))
          );
        }, 0);
        return (
          <p className="field-hint" key={provider}>
            {provider}:{" "}
            {reported.length
              ? usd
                ? `$${total.toFixed(6).replace(/0+$/, "").replace(/\.$/, ".00")}`
                : `${total} ${providerEntry(provider)!.usageUnit}`
              : "Not reported"}
            {` · ${reported.length} of ${completed.length} completed calls reported usage`}
          </p>
        );
      })}
      <p className="field-hint">
        Partial reporting is not a session billing total. Credits remain in
        provider units; invoices are not reconciled.
      </p>
    </div>
  );
}
function eventText(e: ObservationEvent) {
  const d = e.data;
  if (e.type === "client_observed")
    return `${d.clientName} · ${d.clientVersion} · Client-reported identity`;
  if (e.type === "selection_explanation") return String(d.text);
  if (e.type === "tool_called")
    return `${String(d.tool).replaceAll("_", " ")} · ${money(Number(d.estimateMicros))} estimated`;
  if (e.type === "tool_result")
    return `${String(d.status)} · ${d.httpStatus ? `HTTP ${d.httpStatus} · ` : ""}${d.latencyMs} ms · ${reportedUsage(d.result as Record<string, any> | null)}`;
  if (e.type === "tools_offered") return String(d.need);
  if (e.type === "route_decided" || e.type === "route_unavailable")
    return String(d.summary);
  if (e.type === "route_fallback")
    return `${String(d.fromTool).replaceAll("_", " ")} → ${String(d.toTool).replaceAll("_", " ")} · ${String(d.error)}`;
  if (e.type === "intent_recorded") return String(d.objective);
  if (e.type === "outcome_submitted")
    return "A new output version is ready for review.";
  if (e.type === "outcome_evaluated")
    return `${d.score === null ? "Unscored" : `${d.score}% intent match`} · ${d.coverage}% review coverage`;
  if (e.type === "intent_approved")
    return "Intent and tool budget accepted by the account operator.";
  if (e.type === "intent_authorized")
    return "Session authorized automatically under backend spending policy.";
  return "Recorded in this session’s audit history.";
}

export function ObservationApp() {
  const openConnectAgent = useConnectAgent();
  const account = useAccount();
  const [route, setRoute] = useState(readRoute);
  const [sessions, setSessions] = useState<ObservationListItem[]>([]);
  const [summary, setSummary] = useState<Summary>();
  const [catalog, setCatalog] = useState<Catalog>([]);
  const [catalogStatus, setCatalogStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [catalogError, setCatalogError] = useState("");
  const [legacy, setLegacy] = useState<TaskSummary[]>([]);
  const [connection, setConnection] = useState<{
    lastSeenAt: string | null;
    clientName: string | null;
    clients?: {
      clientName: string;
      clientVersion: string;
      lastSeenAt: string;
    }[];
  }>({ lastSeenAt: null, clientName: null });
  const [selected, setSelected] = useState<SessionDetail>();
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  // Set when a local-mode request is refused for a missing server token.
  const [accessRequired, setAccessRequired] = useState(false);
  useEffect(() => {
    if (account.enabled) return;
    const onRequired = () => setAccessRequired(true);
    window.addEventListener("octolab-access-required", onRequired);
    return () =>
      window.removeEventListener("octolab-access-required", onRequired);
  }, [account.enabled]);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigatingFromMenu = useRef(false);
  const scrollToRoute = useRef<string | undefined>(undefined);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [token, setTokenInput] = useState("");
  const [connectionRevision, setConnectionRevision] = useState(0);
  const ownerAccess = !account.enabled || !!account.profile;
  const funding = useCustomerFunding(
    route.page === "dashboard" &&
      Boolean(ownerAccess && (!account.enabled || account.profile?.user.id)),
    [
      account.profile?.user.id,
      account.sessionEpoch,
      account.previewRole,
      connectionRevision,
    ].join("|"),
    route.id === "credits",
  );
  const generation = useRef(0);
  const detailGeneration = useRef(0);
  const selectedId = useRef<string | undefined>(route.id);
  selectedId.current = route.page === "sessions" ? route.id : undefined;
  useEffect(() => {
    const onNavigate = (event: Event) => {
      scrollToRoute.current = (event as CustomEvent<string>).detail;
    };
    const onRouteClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link =
        event.target instanceof Element
          ? event.target.closest<HTMLAnchorElement>("a[href]")
          : null;
      if (
        !link ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;
      const next = new URL(link.href, location.href);
      if (
        next.origin === location.origin &&
        next.pathname === location.pathname &&
        next.search === location.search &&
        next.hash &&
        next.hash !== location.hash &&
        next.hash !== "#main-content" &&
        !next.hash.startsWith("#home")
      )
        scrollToRoute.current = next.hash;
    };
    const onRoute = () => {
      if (scrollToRoute.current !== location.hash)
        scrollToRoute.current = undefined;
      setRoute(readRoute());
      setMenuOpen(false);
    };
    document.addEventListener("click", onRouteClick);
    window.addEventListener("twohands:navigate", onNavigate);
    window.addEventListener("hashchange", onRoute);
    window.addEventListener("popstate", onRoute);
    return () => {
      document.removeEventListener("click", onRouteClick);
      window.removeEventListener("twohands:navigate", onNavigate);
      window.removeEventListener("hashchange", onRoute);
      window.removeEventListener("popstate", onRoute);
    };
  }, []);
  useLayoutEffect(() => {
    if (scrollToRoute.current !== location.hash) return;
    scrollToRoute.current = undefined;
    // Reset a new destination after render; history traversal keeps native restoration.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [route]);
  const independentArea =
    account.enabled &&
    (route.page === "company" ||
      route.page === "admin" ||
      route.page === "tool-access" ||
      route.page === "tool-settings" ||
      route.page === "connectors");
  const operatorArea =
    (!account.enabled && route.page !== "dashboard" && route.page !== "home") ||
    (!!account.profile?.isAdmin &&
      ![
        "dashboard",
        "company",
        "home",
        "admin",
        "tool-access",
        "tool-settings",
        "connectors",
      ].includes(route.page));
  const needsCatalog =
    route.page !== "dashboard" ||
    ["tools", "routing", "connections"].includes(route.id ?? "");
  const refresh = useCallback(async () => {
    if (independentArea || route.page === "home") return true;
    const current = ++generation.current;
    let accessRevoked = false;
    setCatalogStatus((status) => (status === "ready" ? status : "loading"));
    // Catalog readiness must not depend on unrelated account requests.
    const catalogRequest = !needsCatalog
      ? Promise.resolve(true)
      : api<Catalog>("/observations/catalog").then(
          (data) => {
            if (current === generation.current && !accessRevoked) {
              setCatalog(data);
              setCatalogStatus("ready");
              setCatalogError("");
            }
            return true;
          },
          (error: unknown) => {
            if (current === generation.current) {
              setCatalogStatus("error");
              setCatalogError((error as Error).message);
              if (
                error instanceof ApiError &&
                (error.status === 401 || error.status === 403)
              )
                setCatalog([]);
            }
            return false;
          },
        );
    try {
      const [ss, sm, catalogOk, l, c] = await Promise.all([
        operatorArea
          ? api<ObservationListItem[]>("/observations")
          : Promise.resolve([]),
        operatorArea
          ? api<Summary>("/observations/summary")
          : Promise.resolve(undefined),
        catalogRequest,
        operatorArea ? api<TaskSummary[]>("/tasks") : Promise.resolve([]),
        operatorArea
          ? api<typeof connection>("/observations/connection")
          : Promise.resolve({ lastSeenAt: null, clientName: null }),
      ]);
      if (current !== generation.current) return;
      setSessions(ss);
      setSummary(sm);
      setLegacy(l);
      setConnection(c);
      setError("");
      return catalogOk;
    } catch (e) {
      if (current === generation.current) {
        setError((e as Error).message);
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          accessRevoked = true;
          detailGeneration.current++;
          setSessions([]);
          setSummary(undefined);
          setCatalog([]);
          setCatalogStatus("error");
          setCatalogError((e as Error).message);
          setLegacy([]);
          setSelected(undefined);
          setConnection({ lastSeenAt: null, clientName: null });
        }
      }
      return false;
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [independentArea, operatorArea, route.page, needsCatalog]);
  const reloadDetail = useCallback(async (id: string) => {
    const current = ++detailGeneration.current;
    try {
      const s = await api<SessionDetail>(`/observations/${id}`);
      if (selectedId.current === id && current === detailGeneration.current) {
        setSelected(s);
        setDetailError("");
      }
    } catch (e) {
      if (selectedId.current === id && current === detailGeneration.current)
        setDetailError((e as Error).message);
    } finally {
      if (selectedId.current === id && current === detailGeneration.current)
        setDetailLoading(false);
    }
  }, []);
  useEffect(() => {
    const stop = startPolling(refresh, operatorArea ? 10000 : 60000);
    return () => {
      stop();
      generation.current++;
    };
  }, [refresh]);
  useEffect(() => {
    detailGeneration.current++;
    setSelected(undefined);
    setDetailError("");
    if (independentArea || !route.id || route.page !== "sessions") return;
    setDetailLoading(true);
    const stop = startPolling(() => reloadDetail(route.id!), 3000);
    return () => {
      stop();
      detailGeneration.current++;
    };
  }, [route.id, route.page, reloadDetail, independentArea]);
  async function mutate(path: string, body: unknown, message: string) {
    setBusy(true);
    setNotice("");
    try {
      const data = await api(path, body);
      await refresh();
      if (route.id && route.page === "sessions") await reloadDetail(route.id);
      setNotice(message);
      return data;
    } finally {
      setBusy(false);
    }
  }
  async function safeAction(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      setNotice("");
      setDetailError((e as Error).message);
    }
  }
  const filtered = sessions.filter(
    (s) =>
      (!query ||
        `${s.title} ${s.objective} ${s.model}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (filter === "all" ||
        (filter === "approval" && !s.approvedAt) ||
        (filter === "review" && statusLabel(s) === "Needs review") ||
        (filter === "reviewed" && statusLabel(s) === "Reviewed")),
  );
  const currentTitle =
    route.page === "home"
      ? "Home"
      : route.page === "dashboard"
        ? (
            {
              tools: "Tool catalog",
              activity: "Activity",
              requests: "Request log",
              usage: "Usage",
              routing: "Configure routing",
              connections: "Connections",
              credits: "Credits",
              keys: "API keys",
            } as Record<string, string>
          )[route.id ?? ""] || "Home"
        : route.page === "company"
          ? "Tool company"
          : route.page === "settings"
            ? "Connections & settings"
            : route.page === "tool-access"
              ? "Tool access"
              : pages.find((p) => p.id === route.page)?.label || "Sessions";
  useEffect(() => {
    const title =
      route.page === "admin"
        ? "Company reviews"
        : route.page === "tool-settings"
          ? "Tool settings"
          : currentTitle;
    document.title =
      route.page === "home"
        ? "Two Hands — Intent & outcomes"
        : `${title} · Two Hands`;
  }, [currentTitle, route.page]);
  if (route.page === "home") return <LandingView />;
  // Business accounts use #company and user accounts use #dashboard; admins can
  // open both. The server enforces the same rule on every request.
  if (
    account.enabled &&
    account.profile &&
    (route.page === "dashboard" || route.page === "company") &&
    !canOpen(account.profile, "#" + route.page)
  )
    return (
      <WrongAccountArea
        accountType={account.profile.accountType ?? "user"}
        email={account.profile.user.email}
        home={homeRoute(account.profile)}
        onSignOut={account.signOut}
      />
    );
  if (account.enabled && route.page === "settings") return <AccountSettings />;
  if (account.enabled && route.page === "company")
    return (
      <CompanyPortal
        key={route.id === "new" ? "new" : route.id || "company"}
        id={route.id}
        section={route.section}
      />
    );
  if (account.enabled && account.profile?.isAdmin && route.page === "admin")
    return <AdminCompanyReview />;
  if (
    account.enabled &&
    !account.profile?.isAdmin &&
    !["dashboard"].includes(route.page)
  )
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Administrator access required</h1>
          <p>This area is reserved for platform administration.</p>
          <Button asChild>
            <a href="#dashboard">Open your dashboard</a>
          </Button>
        </section>
      </main>
    );
  if (
    account.enabled &&
    account.profile?.isAdmin &&
    route.page === "tool-access"
  )
    return (
      <PortalShell
        area="admin"
        title="Tool access"
        links={[]}
        adminPage="tool-access"
      >
        <Suspense fallback={<p role="status">Loading tool access…</p>}>
          <ToolAccessView />
        </Suspense>
      </PortalShell>
    );
  if (
    account.enabled &&
    account.profile?.isAdmin &&
    route.page === "tool-settings"
  )
    return (
      <PortalShell
        area="admin"
        title="Tool settings"
        links={[]}
        adminPage="tool-settings"
      >
        <ToolSettingsView />
      </PortalShell>
    );
  if (
    account.enabled &&
    account.profile?.isAdmin &&
    route.page === "connectors"
  )
    return (
      <PortalShell
        area="admin"
        title="Connector reviews"
        links={[]}
        adminPage="connectors"
      >
        <ConnectorsView
          mode="admin"
          base="/admin/connectors"
          canWrite={false}
          canReview
        />
      </PortalShell>
    );
  const surface =
    route.page === "dashboard"
      ? "user"
      : route.page === "company"
        ? "business"
        : "operator";
  const inToolCatalog = route.id === "tools" || route.id === "routing";
  const customerSidebar = surface === "user";
  const onOverview = !route.id || route.id === "overview";
  const inActivity = ["activity", "requests", "usage"].includes(route.id ?? "");
  const sidebarContent = (
    <>
      <a href="#home" className="obs-brand">
        <img src="/two-hands.svg" width="147" height="32" alt="Two Hands" />
      </a>
      <nav
        className="customer-navigation"
        aria-label={
          surface === "user"
            ? "User navigation"
            : surface === "business"
              ? "Tool company navigation"
              : account.enabled
                ? "Admin navigation"
                : "Operator navigation"
        }
      >
        {surface === "user" ? (
          <>
            <a
              href="#dashboard"
              className={onOverview ? "selected" : ""}
              aria-current={onOverview ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <HomeNavigationIcon />
              Home
            </a>
            <a
              href="#dashboard/tools"
              className={inToolCatalog ? "selected" : ""}
              aria-current={
                route.id === "tools"
                  ? "page"
                  : inToolCatalog
                    ? "location"
                    : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              <Link01 />
              Tool catalog
            </a>
            <a
              href="#dashboard/activity"
              className={inActivity ? "selected" : ""}
              aria-current={
                route.id === "activity"
                  ? "page"
                  : inActivity
                    ? "location"
                    : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              <Activity />
              Activity
            </a>
            {ownerAccess && (
              <>
                <a
                  href="#dashboard/keys"
                  className={route.id === "keys" ? "selected" : ""}
                  aria-current={route.id === "keys" ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <Key01 />
                  API keys
                </a>
                <div className="customer-navigation-divider" />
                <a
                  href="#dashboard/credits"
                  className={`customer-navigation-credits${route.id === "credits" ? " selected" : ""}`}
                  aria-current={route.id === "credits" ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <CreditCard01 />
                  Credits
                  {funding.summary && (
                    <span className="customer-navigation-balance">
                      {/* One balance: prepaid credits for an account on
                          credit billing, otherwise its test credits. */}
                      {spendableBalance(funding.summary).label}
                      {spendableBalance(funding.summary).wallet &&
                        !spendableBalance(funding.summary).live &&
                        " sandbox"}
                      <span className="sr-only"> credits</span>
                    </span>
                  )}
                </a>
                <Button
                  className="customer-add-funds"
                  variant="brand"
                  size="sm"
                  asChild
                >
                  <a
                    href="#dashboard/credits/add-funds"
                    onClick={() => {
                      if (menuOpen) navigatingFromMenu.current = true;
                      setMenuOpen(false);
                    }}
                  >
                    {funding.summary && spendableBalance(funding.summary).wallet
                      ? "Add credits"
                      : "Add test funds"}
                  </a>
                </Button>
              </>
            )}
          </>
        ) : surface === "business" ? (
          [
            { id: "overview", label: "Overview", icon: Grid01 },
            { id: "activity", label: "Live usage", icon: Activity },
            { id: "choices", label: "Agent choices", icon: GitBranch01 },
            { id: "listing", label: "Listing", icon: FileCheck02 },
            {
              id: "benchmarks",
              label: "Controlled tests",
              icon: BarChartSquare02,
            },
            { id: "plans", label: "Test plans", icon: FileCheck02 },
          ].map((p) => (
            <a
              href={`#company/${route.id || providerIds[0]}/${p.id}`}
              key={p.id}
              className={route.section === p.id ? "selected" : ""}
              aria-current={route.section === p.id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <p.icon />
              {p.label}
            </a>
          ))
        ) : account.enabled && account.profile?.isAdmin ? (
          <AdminNavigation
            page={route.page}
            onNavigate={() => setMenuOpen(false)}
          />
        ) : (
          pages.map((p) => (
            <a
              href={`#${p.id}`}
              key={p.id}
              className={route.page === p.id ? "selected" : ""}
              aria-current={route.page === p.id ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <p.icon />
              {p.label}
              {p.id === "cases" && !!summary?.openCases && (
                <span className="nav-count">{summary.openCases}</span>
              )}
            </a>
          ))
        )}
      </nav>
      <div className="sidebar-bottom">
        <AccountControls compact={customerSidebar} />
      </div>
    </>
  );
  return (
    <div
      className={`observation-shell${surface !== "user" ? " workspace-console" : ""}`}
      data-surface={surface}
    >
      <nav aria-label="Skip links">
        <a
          className="skip-link"
          href="#main-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("main-content")?.focus();
          }}
        >
          Skip to content
        </a>
      </nav>
      <aside className="obs-sidebar customer-sidebar">{sidebarContent}</aside>
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent
          className="mobile-navigation customer-mobile-navigation translate-x-0 translate-y-0"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (navigatingFromMenu.current) {
              navigatingFromMenu.current = false;
              const fundingOptions = document.getElementById(
                "test-funding-options",
              );
              if (fundingOptions) fundingOptions.focus();
              else document.getElementById("main-content")?.focus();
              return;
            }
            document
              .querySelector<HTMLButtonElement>(".mobile-nav-button")
              ?.focus();
          }}
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="mobile-sidebar-content customer-sidebar">
            {sidebarContent}
          </div>
        </DialogContent>
      </Dialog>
      <div className="obs-body">
        <header className="obs-topbar">
          <a href="#home" className="customer-mobile-brand">
            <img src="/two-hands.svg" width="109" height="24" alt="Two Hands" />
          </a>
          <div>
            <Button
              className="mobile-nav-button"
              variant="ghost"
              size="icon"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <XClose /> : <Menu01 />}
            </Button>
            {!customerSidebar && (
              <span className="sr-only">{currentTitle}</span>
            )}
            {route.id && route.page === "sessions" && (
              <>
                <span className="breadcrumb-slash">/</span>
                <span className="breadcrumb-title">
                  {selected?.title || "Session"}
                </span>
              </>
            )}
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="obs-main">
          <InlineError message={error} />
          {(error || (accessRequired && !account.enabled)) && (
            <Button
              variant="outline"
              onClick={() =>
                account.enabled ? account.signOut() : setConnectOpen(true)
              }
            >
              {account.enabled ? "Sign out" : "Enter access token"}
            </Button>
          )}
          {notice && (
            <div role="status" className="notice">
              <CheckCircle />
              {notice}
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
              >
                <XClose />
              </button>
            </div>
          )}
          {route.page === "company" && (
            <Suspense fallback={<p role="status">Loading company…</p>}>
              <CompanyView
                key={connectionRevision}
                provider={isProviderId(route.id) ? route.id : providerIds[0]}
                section={route.section}
              />
            </Suspense>
          )}
          {route.page === "disputes" && (
            <Suspense fallback={<p role="status">Loading disputes…</p>}>
              <DisputeReviewView />
            </Suspense>
          )}
          {route.page === "connectors" && !account.enabled && (
            <ConnectorsView
              key={connectionRevision}
              mode="operator"
              base="/connectors"
              canWrite
              canReview
            />
          )}
          {route.page === "lab" && (
            <Suspense fallback={<p role="status">Loading tests…</p>}>
              <ProviderLabView
                key={connectionRevision}
                runId={route.id}
                providerFilter={route.labProvider}
                evidenceFilter={route.labFinding}
              />
            </Suspense>
          )}
          {route.page === "dashboard" &&
            account.enabled &&
            (inActivity || inToolCatalog) && <OperatorAllowanceNotice />}
          {route.page === "dashboard" && (
            <WalletNotice
              wallet={funding.summary?.wallet}
              onCredits={route.id === "credits"}
            />
          )}
          {route.page === "dashboard" && (
            <CustomerFunding.Provider
              value={{
                ...funding,
                focusPaymentMethods: route.focusPaymentMethods,
              }}
            >
              <Suspense fallback={<p role="status">Loading page…</p>}>
                <UserDashboardView
                  key={connectionRevision}
                  section={
                    dashboardSections.includes(route.id as DashboardSection)
                      ? (route.id as DashboardSection)
                      : "overview"
                  }
                  catalog={catalog}
                  catalogLoading={catalogStatus === "loading"}
                  catalogError={catalogStatus === "error" ? catalogError : ""}
                  refreshCatalog={refresh}
                  connectionRevision={connectionRevision}
                />
              </Suspense>
            </CustomerFunding.Provider>
          )}
          {route.page === "sessions" && !route.id && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Sessions</h1>
                  <p>From the original intent to the delivered outcome.</p>
                </div>
                <Button onClick={() => setNewOpen(true)}>
                  <Plus />
                  Record intent
                </Button>
              </div>
              <div className="summary-grid">
                <div>
                  <span>Recorded sessions</span>
                  <strong>{summary?.sessions ?? "—"}</strong>
                  <small>
                    {summary?.pendingApproval || 0} awaiting approval
                  </small>
                </div>
                <div>
                  <span>Reviewed outcomes</span>
                  <strong>
                    {summary?.reviews ?? "—"}
                    <em>/ {summary?.outputs ?? 0}</em>
                  </strong>
                  <small>Against accepted success criteria</small>
                </div>
                <div>
                  <span>Estimated tool spend</span>
                  <strong>
                    {summary ? money(summary.estimatedMicros) : "—"}
                  </strong>
                  <small>Provider billing may differ</small>
                </div>
              </div>
              <Panel
                title="Activity"
                action={
                  <span className="subtle">
                    {sessions.length}{" "}
                    {sessions.length === 1 ? "session" : "sessions"}
                  </span>
                }
              >
                <div className="list-toolbar">
                  <div className="search-input">
                    <SearchLg />
                    <Input
                      aria-label="Search sessions"
                      placeholder="Search sessions…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger
                      aria-label="Filter sessions"
                      className="filter-select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sessions</SelectItem>
                      <SelectItem value="approval">
                        Awaiting approval
                      </SelectItem>
                      <SelectItem value="review">Needs review</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {loading ? (
                  <p className="loading-state" role="status">
                    Loading sessions…
                  </p>
                ) : filtered.length ? (
                  <div className="session-list">
                    <div className="session-list-head">
                      <span>Session</span>
                      <span>Model</span>
                      <span>Status</span>
                      <span>Updated</span>
                    </div>
                    {filtered.map((s) => (
                      <a
                        className="session-row"
                        href={`#sessions/${s.id}`}
                        key={s.id}
                      >
                        <div className="session-name">
                          <span className="session-symbol">
                            <FileCheck02 />
                          </span>
                          <div>
                            <strong>{s.title}</strong>
                            <span>
                              {s.criteria.length}{" "}
                              {s.criteria.length === 1
                                ? "criterion"
                                : "criteria"}{" "}
                              · {money(s.spentMicros)} estimated
                            </span>
                          </div>
                        </div>
                        <span className="model-name">{s.model}</span>
                        <StateBadge label={statusLabel(s)} />
                        <time>{date(s.updatedAt)}</time>
                      </a>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title={
                      sessions.length
                        ? "No matching sessions"
                        : "Your first observed session starts with your agent"
                    }
                    action={
                      <div className="button-row">
                        <Button onClick={() => setNewOpen(true)}>
                          <Plus />
                          Record intent
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => openConnectAgent()}
                        >
                          Connect agent
                          <ArrowUpRight />
                        </Button>
                      </div>
                    }
                  >
                    {sessions.length
                      ? "Try another search or status filter."
                      : "Record the expected outcome here, then let your agent choose tools and do the work. Its calls and final output will appear in this account."}
                  </Empty>
                )}
              </Panel>
              {legacy.length > 0 && (
                <Panel
                  title="Earlier research"
                  description="Preserved runs from the local routing workflow."
                >
                  <div className="legacy-list">
                    {legacy.map((t) => (
                      <a href={`/research/#inspector/${t.id}`} key={t.id}>
                        <div>
                          <strong>{t.query}</strong>
                          <span>
                            Local router · {t.sourceCount} sources ·{" "}
                            {money(t.spentMicros)} estimated
                          </span>
                        </div>
                        <ArrowUpRight />
                      </a>
                    ))}
                  </div>
                </Panel>
              )}
            </>
          )}
          {route.page === "sessions" && route.id && (
            <>
              {detailLoading && !selected ? (
                <p className="loading-state" role="status">
                  Loading session…
                </p>
              ) : selected ? (
                <SessionView
                  key={selected.id}
                  session={selected}
                  section={route.section}
                  busy={busy}
                  onMutate={mutate}
                  onAction={safeAction}
                  onDeleted={() => navigate("sessions")}
                />
              ) : (
                <Empty
                  title="Session unavailable"
                  action={
                    <Button onClick={() => navigate("sessions")}>
                      Back to sessions
                    </Button>
                  }
                >
                  {detailError || "This session may have been deleted."}
                </Empty>
              )}
              <InlineError message={selected ? detailError : ""} />
            </>
          )}
          {route.page === "models" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Model evaluations</h1>
                  <p>
                    Compare reviewed outcomes against what was actually
                    requested.
                  </p>
                </div>
              </div>
              <Panel
                title="Intent match by model"
                description="One latest, fully reviewed output per session. Scores appear after five eligible sessions."
              >
                {summary?.models.length ? (
                  <div className="model-table">
                    <div className="model-table-head">
                      <span>Model identity</span>
                      <span>Sessions</span>
                      <span>Fully reviewed</span>
                      <span>Intent match</span>
                    </div>
                    {summary.models.map((m) => (
                      <div className="model-table-row" key={m.model}>
                        <div>
                          <strong>{m.model}</strong>
                          <span>
                            Reported identity · {m.assistantReviewed || 0}{" "}
                            assistant reviews
                          </span>
                        </div>
                        <span>{m.sessions}</span>
                        <span>
                          {m.fullyReviewed} / {m.minimumSamples} minimum
                        </span>
                        <strong>
                          {m.score === null
                            ? m.scoreUnavailableReason || "Not enough reviews"
                            : `${m.score}%`}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    title="No model evaluations yet"
                    icon={BarChartSquare02}
                  >
                    Once your agent submits an output, review it against the
                    accepted criteria. Complete reviews build this comparison.
                  </Empty>
                )}
              </Panel>
              <div className="quiet-note">
                <ShieldTick />
                <p>
                  These are scores from your reviewed sessions, not a general
                  accuracy benchmark. Model identities and reviewer identities
                  are not independently verified.
                </p>
              </div>
            </>
          )}
          {route.page === "tools" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Tool activity</h1>
                  <p>
                    The options available to your agent, and what happened when
                    it used them.
                  </p>
                </div>
              </div>
              <div className="tool-grid">
                {catalog.map((t) => (
                  <Panel
                    key={t.tool}
                    title={providerLabel(t.provider)}
                    action={
                      <StateBadge
                        label={t.available ? "Available" : "Not configured"}
                      />
                    }
                    description={t.description}
                  >
                    <dl className="tool-metrics">
                      <div>
                        <dt>Default call estimate</dt>
                        <dd>{money(t.estimatedMicros)}</dd>
                      </div>
                      <div>
                        <dt>Recorded account calls</dt>
                        <dd>{t.sampleCount}</dd>
                      </div>
                      <div>
                        <dt>Average latency</dt>
                        <dd>
                          {t.averageLatencyMs === null
                            ? "—"
                            : `${t.averageLatencyMs} ms`}
                        </dd>
                      </div>
                      <div>
                        <dt>Successful requests</dt>
                        <dd>
                          {t.successRate === null
                            ? "—"
                            : `${Math.round(t.successRate * 100)}%`}
                        </dd>
                      </div>
                    </dl>
                    {t.sampleCount < 5 && (
                      <p className="field-hint">
                        Latency and reliability need five completed calls.
                      </p>
                    )}
                    {t.controlledTestSample && (
                      <div className="tool-lab-sample">
                        <strong>Separate controlled sample</strong>
                        <p>
                          {t.controlledTestSample.attempted} forced test calls ·{" "}
                          {t.controlledTestSample.referencePassed} /{" "}
                          {t.controlledTestSample.referenceKnown} known
                          reference checks
                        </p>
                        <a href={`#lab/${t.controlledTestSample.runId}`}>
                          Inspect test evidence <ArrowUpRight />
                        </a>
                        <small>
                          Does not count as organic selection or measured answer
                          quality.
                        </small>
                      </div>
                    )}
                    <code className="tool-name">{t.tool}</code>
                  </Panel>
                ))}
              </div>
              <Panel title="What this records">
                <div className="explanation-grid">
                  <div>
                    <CheckCircle />
                    <strong>Observed behavior</strong>
                    <p>
                      Tools offered through Two Hands, actual calls, arguments,
                      response status, timings, and usage.
                    </p>
                  </div>
                  <div>
                    <FileCheck02 />
                    <strong>Stated explanations</strong>
                    <p>
                      Short reasons supplied by the agent are labeled separately
                      from execution evidence.
                    </p>
                  </div>
                  <div>
                    <ShieldTick />
                    <strong>Outcome evaluation</strong>
                    <p>
                      Delivered output is reviewed against the original
                      criteria. A successful request is not a successful
                      outcome.
                    </p>
                  </div>
                </div>
              </Panel>
            </>
          )}
          {route.page === "cases" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Review cases</h1>
                  <p>
                    Keep the intent, evaluation, and evidence together when an
                    outcome falls short.
                  </p>
                </div>
              </div>
              <Panel
                title="Case history"
                description="Evidence for resolution. No insurance policy or automatic refund is issued here."
              >
                {sessions.some((s) => s.cases.length) ? (
                  <div className="case-list">
                    {sessions.flatMap((s) =>
                      s.cases.map((c) => (
                        <a key={c.id} href={`#sessions/${s.id}/output`}>
                          <ShieldTick />
                          <div>
                            <strong>{s.title}</strong>
                            <p>{c.reason}</p>
                            <span>
                              {date(c.at)} · Case {c.id.slice(0, 8)}
                            </span>
                          </div>
                          <StateBadge
                            label={
                              c.status[0].toUpperCase() + c.status.slice(1)
                            }
                          />
                          <ArrowUpRight />
                        </a>
                      )),
                    )}
                  </div>
                ) : (
                  <Empty title="No review cases" icon={ShieldTick}>
                    After evaluating an output, open a case from its session to
                    document a shortfall and track a resolution.
                  </Empty>
                )}
              </Panel>
            </>
          )}
          {route.page === "settings" && (
            <div className="settings-page">
              <div className="page-heading">
                <div>
                  <h1>Connections & settings</h1>
                  <p>
                    Your agent owns the conversation. Two Hands observes the
                    tools and outcomes.
                  </p>
                </div>
              </div>
              {!account.enabled && (
                <Panel
                  className="settings-section"
                  title="Product views"
                  description="Manage your tools, your company, or platform activity."
                >
                  <nav
                    className="settings-destinations"
                    aria-label="Product views"
                  >
                    <a className="settings-destination" href="#dashboard">
                      <div className="session-name">
                        <span className="session-symbol">
                          <HomeNavigationIcon />
                        </span>
                        <div>
                          <strong>Home</strong>
                          <span>Your Two Hands account</span>
                        </div>
                      </div>
                      <ArrowUpRight />
                    </a>
                    <a className="settings-destination" href="#sessions">
                      <div className="session-name">
                        <span className="session-symbol">
                          <TerminalSquare />
                        </span>
                        <div>
                          <strong>Administration</strong>
                          <span>Sessions, reviews, and platform settings</span>
                        </div>
                      </div>
                      <ArrowUpRight />
                    </a>
                    <a className="settings-destination" href="#company/exa">
                      <div className="session-name">
                        <span className="session-symbol">
                          <BarChartSquare02 />
                        </span>
                        <div>
                          <strong>Tool company</strong>
                          <span>Provider insights and controlled tests</span>
                        </div>
                      </div>
                      <ArrowUpRight />
                    </a>
                  </nav>
                </Panel>
              )}
              <Panel
                className="settings-section settings-connections"
                title="Connections"
                description="Connect your agent and check which providers are available."
              >
                <div className="settings-grid">
                  <Panel
                    title="Agent connection"
                    action={<Badge variant="outline">MCP</Badge>}
                  >
                    <div className="connection-detail">
                      <TerminalSquare />
                      <div>
                        <strong>
                          {connection.clientName || "No MCP client seen yet"}
                        </strong>
                        <p>
                          {connection.lastSeenAt
                            ? `Last request ${date(connection.lastSeenAt)}. This records a connection, not a continuous health check.`
                            : "Connect an MCP client to Two Hands."}
                        </p>
                      </div>
                    </div>
                    {!!connection.clients?.length && (
                      <div className="connection-history">
                        {connection.clients.map((c) => (
                          <div key={`${c.clientName}/${c.clientVersion}`}>
                            <strong>{c.clientName}</strong>
                            <span>
                              {c.clientVersion} · {date(c.lastSeenAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => openConnectAgent()}
                    >
                      Open connection setup
                    </Button>
                    <p className="field-hint">
                      Connect a coding agent with browser sign-in, or configure
                      your product backend with an API key. Provider credentials
                      stay on the server.
                    </p>
                  </Panel>
                  <Panel title="Provider connections">
                    <div className="provider-connections">
                      {catalog.map((t) => (
                        <div key={t.provider}>
                          <span className={`provider-letter ${t.provider}`}>
                            <ProviderLogo provider={t.provider} size={18} />
                          </span>
                          <strong>{providerLabel(t.provider)}</strong>
                          <StateBadge
                            label={t.available ? "Configured" : "Missing key"}
                          />
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        account.enabled
                          ? account.signOut()
                          : setConnectOpen(true)
                      }
                    >
                      {account.enabled ? "Sign out" : "Account access token"}
                    </Button>
                  </Panel>
                </div>
              </Panel>
              <Panel
                className="settings-section"
                title="Data controls"
                description="All sessions contribute to commercial aggregates under account policy."
              >
                <div className="data-control-row">
                  <div>
                    <strong>Commercial aggregate sharing</strong>
                    <p>
                      Enabled for every session, including existing records.
                      Only aggregate statistics are eligible for export.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {summary?.sharing.consentedSessions || 0} included
                  </Badge>
                </div>
                <div className="data-control-row">
                  <div>
                    <strong>Aggregate export</strong>
                    <p>
                      Available from the first recorded provider usage. Excludes
                      raw intent, output, queries, URLs, and explanations.
                    </p>
                  </div>
                  <ExportButton
                    label="Export aggregate"
                    onClick={() =>
                      void safeAction(async () =>
                        download(
                          "apilayer-commercial-aggregate.json",
                          await api("/observations/aggregate"),
                        ),
                      )
                    }
                  />
                </div>
                <p className="field-hint">
                  Nothing is automatically sent or sold to tool companies.
                </p>
              </Panel>
            </div>
          )}
        </main>
      </div>
      <NewSession
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreate={async (data) => {
          const s = await api<ObservationSession>("/observations", data);
          await refresh();
          navigate("sessions", s.id);
        }}
      />
      <Dialog
        open={!account.enabled && connectOpen}
        onOpenChange={setConnectOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account access</DialogTitle>
            <DialogDescription>
              Enter the server’s access token when authentication is enabled. It
              stays in this browser tab’s memory.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              detailGeneration.current++;
              setSelected(undefined);
              setToken(token);
              setConnectionRevision((v) => v + 1);
              const connected = await refresh();
              if (connected) {
                setAccessRequired(false);
                if (route.id && route.page === "sessions")
                  void reloadDetail(route.id);
                setConnectOpen(false);
                setTokenInput("");
              }
            }}
          >
            <InlineError message={error} />
            <Field label="Access token" id="obs-access-token">
              <Input
                id="obs-access-token"
                type="password"
                autoComplete="off"
                value={token}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </Field>
            <DialogFooter>
              <Button type="submit">Connect</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionView({
  session: s,
  section,
  busy,
  onMutate,
  onAction,
  onDeleted,
}: {
  session: SessionDetail;
  section: string;
  busy: boolean;
  onMutate: (path: string, body: unknown, message: string) => Promise<any>;
  onAction: (fn: () => Promise<unknown>) => Promise<void>;
  onDeleted: () => void;
}) {
  const tab = section;
  const setTab = (value: string) => {
    location.hash = `sessions/${s.id}/${value}`;
  };
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const evidenceCall = s.calls.find((c) => c.id === evidenceId);
  const [caseReason, setCaseReason] = useState("");
  const [caseEvaluationId, setCaseEvaluationId] = useState("");
  const [caseOpen, setCaseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [resolution, setResolution] = useState<Record<string, string>>({});
  const latest = s.outcomes.at(-1);
  const evaluation = s.evaluations
    .filter((e) => e.outcomeId === latest?.id)
    .at(-1);
  const prompt = `Use the connected apilayer MCP tools for session ${s.id}. Read get_session first and follow its accepted intent and constraints. Discover tool options, choose providers yourself, and keep estimated tool spending within ${money(s.budgetMicros)}. Every tool call requires a brief statedReason explaining why it fits the current need, not private reasoning. Submit your actual final answer with evidence call IDs using submit_outcome. Do not claim an independent evaluation.\n\nGoal: ${s.objective}`;
  return (
    <>
      <div className="session-heading">
        <Button variant="ghost" size="sm" onClick={() => navigate("sessions")}>
          <ArrowLeft />
          Sessions
        </Button>
        <div className="page-heading">
          <div>
            <div className="title-with-status">
              <h1>{s.title}</h1>
              <StateBadge label={statusLabel(s)} />
            </div>
            <p>
              {s.model} <span>·</span> {s.host} <span>·</span> Started{" "}
              {date(s.createdAt)}
            </p>
          </div>
          <div className="button-row">
            <ExportButton
              onClick={() =>
                void onAction(async () =>
                  download(
                    `apilayer-${s.id}-summary.json`,
                    await api(`/observations/${s.id}/export`),
                  ),
                )
              }
            />
            <CopyButton text={prompt} label="Copy agent prompt" />
          </div>
        </div>
      </div>
      {!s.approvedAt && (
        <div className="approval-banner">
          <div>
            <Clock />
            <div>
              <strong>Review the intent before work begins</strong>
              <p>
                Accepting authorizes up to {money(s.budgetMicros)} in estimated
                tool usage. An agent’s proposal does not authorize spending.
              </p>
            </div>
          </div>
          <Button
            disabled={busy}
            onClick={() =>
              void onAction(() =>
                onMutate(
                  `/observations/${s.id}/approve`,
                  { intentHash: s.intentHash },
                  "Intent accepted. Copy the session prompt into Claude or Codex.",
                ),
              )
            }
          >
            Accept intent & budget
          </Button>
        </div>
      )}
      {!s.integrity && (
        <InlineError message="The local audit chain failed its integrity check. Treat this record as altered until investigated." />
      )}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="session-tabs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trace">
            Tool trace <span>{s.calls.length}</span>
          </TabsTrigger>
          <TabsTrigger value="output">Output & evaluation</TabsTrigger>
          <TabsTrigger value="record">Record & controls</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="detail-columns">
            <div className="detail-primary">
              <Panel
                title="Accepted intent"
                action={
                  <Badge variant="outline">
                    {s.approvedAt ? "Fixed version" : "Proposed"}
                  </Badge>
                }
              >
                <IntentContent session={s} />
              </Panel>
              <Panel
                title="Latest activity"
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTab("trace")}
                  >
                    Full trace
                    <ArrowUpRight />
                  </Button>
                }
              >
                <div className="compact-timeline">
                  {s.events
                    .slice(-5)
                    .reverse()
                    .map((e) => (
                      <div key={e.id}>
                        <span className={`event-dot ${e.provenance}`} />
                        <div>
                          <strong>{eventLabel(e)}</strong>
                          <p>{eventText(e)}</p>
                        </div>
                        <time>
                          {new Date(e.at).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    ))}
                </div>
              </Panel>
            </div>
            <div className="detail-aside">
              <Panel title="Session details">
                <dl className="tool-metrics">
                  <div>
                    <dt>Tool calls</dt>
                    <dd>{s.calls.length}</dd>
                  </div>
                  <div>
                    <dt>Estimated spend</dt>
                    <dd>{money(s.spentMicros)}</dd>
                  </div>
                  <div>
                    <dt>Reserved</dt>
                    <dd>{money(s.reservedMicros)}</dd>
                  </div>
                  <div>
                    <dt>Remaining budget</dt>
                    <dd>
                      {money(s.budgetMicros - s.spentMicros - s.reservedMicros)}
                    </dd>
                  </div>
                  <div>
                    <dt>Output versions</dt>
                    <dd>{s.outcomes.length}</dd>
                  </div>
                </dl>
                <p className="field-hint">
                  Budget accounting uses request estimates. Provider-reported
                  usage is shown separately.
                </p>
              </Panel>
              <Panel title="Provider usage">
                <ProviderUsageSummary calls={s.calls} />
              </Panel>
              <Panel title="Outcome">
                {evaluation ? (
                  <>
                    <EvaluationStats evaluation={evaluation} />
                    <Button variant="outline" onClick={() => setTab("output")}>
                      View evaluation
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="subtle">
                      {latest
                        ? "The agent submitted an output. Review it against the accepted criteria."
                        : "Waiting for the agent to submit its final output."}
                    </p>
                    <Button
                      variant="outline"
                      disabled={!latest}
                      onClick={() => setTab("output")}
                    >
                      Review output
                    </Button>
                  </>
                )}
              </Panel>
              <div className="quiet-note">
                <ShieldTick />
                <p>
                  Model identity is{" "}
                  {s.modelSource === "agent_reported"
                    ? "agent-reported"
                    : "operator-entered"}
                  . Explanations are stated reasons, not access to private
                  reasoning.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="trace">
          <Panel
            title="Tool decisions & execution"
            description="Observed actions and agent-stated explanations are labeled separately."
          >
            <Accordion type="multiple" className="event-list">
              {s.events.map((e) => (
                <AccordionItem value={String(e.id)} key={e.id}>
                  <AccordionTrigger>
                    <div className="trace-event">
                      <span className={`event-icon ${e.provenance}`}>
                        {e.provenance === "agent_reported" ? (
                          <FileCheck02 />
                        ) : e.provenance === "workspace_review" ? (
                          <ShieldTick />
                        ) : (
                          <Link01 />
                        )}
                      </span>
                      <div>
                        <div className="event-title">
                          <strong>{eventLabel(e)}</strong>
                          <Badge variant="outline">
                            {e.provenance === "agent_reported"
                              ? "Agent reported"
                              : e.provenance === "workspace_review"
                                ? "Account review"
                                : "Observed"}
                          </Badge>
                        </div>
                        <p>{eventText(e)}</p>
                      </div>
                      <time>{new Date(e.at).toLocaleTimeString()}</time>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {e.type === "tools_offered" && (
                      <ToolOptions
                        tools={
                          e.data.tools as Parameters<
                            typeof ToolOptions
                          >[0]["tools"]
                        }
                      />
                    )}
                    {e.type === "tools_offered" && (
                      <ConnectorOffers
                        offers={
                          e.data.connectorTools as Parameters<
                            typeof ConnectorOffers
                          >[0]["offers"]
                        }
                      />
                    )}
                    {e.type === "tool_result" && (
                      <ToolResult
                        data={e.data.result as Record<string, any> | null}
                      />
                    )}
                    {e.type === "selection_explanation" && (
                      <div className="decision-explanation">
                        <p>{String(e.data.text)}</p>
                        <span>
                          Agent-reported explanation. Internal reasoning is not
                          exposed by MCP.
                        </span>
                      </div>
                    )}
                    {e.type === "tool_called" &&
                      !s.calls.find((c) => c.id === e.data.callId)
                        ?.statedReason && (
                        <p className="field-hint">
                          No selection explanation was supplied. The tool choice
                          is observed; the agent’s internal reasoning is
                          unavailable.
                        </p>
                      )}
                    <Collapsible className="raw-record">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Recorded data
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <pre
                          className="event-json"
                          tabIndex={0}
                          aria-label={`${eventLabel(e)} record`}
                        >
                          {JSON.stringify(e.data, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Panel>
        </TabsContent>
        <TabsContent value="output">
          {latest ? (
            <>
              <div className="output-layout">
                <Panel
                  title="Delivered output"
                  description={`Version ${s.outcomes.length} · ${date(latest.at)} · Agent reported`}
                  action={<CopyButton text={latest.text} />}
                >
                  <OutcomeContent text={latest.text} />
                  <div className="output-evidence">
                    <span>
                      {latest.evidenceCallIds.length} linked tool calls
                    </span>
                    <div className="button-row">
                      {latest.evidenceCallIds.map((id) => {
                        const call = s.calls.find((c) => c.id === id);
                        const source = call?.arguments.url
                          ? new URL(String(call.arguments.url)).hostname
                          : call?.tool.replaceAll("_", " ") || "tool";
                        return (
                          <Button
                            key={id}
                            variant="outline"
                            size="sm"
                            onClick={() => setEvidenceId(id)}
                            aria-label={`View evidence from ${source} · ${id.slice(0, 8)}`}
                          >
                            <FileCheck02 />
                            View evidence from {source}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </Panel>
                <Panel
                  title="Evaluate against intent"
                  description="Judge the delivered output, not just whether the tool calls succeeded."
                >
                  {evaluation && <EvaluationStats evaluation={evaluation} />}
                  <EvaluationForm
                    key={latest.id}
                    session={s}
                    onSave={(data) =>
                      onMutate(
                        `/observations/${s.id}/evaluate`,
                        data,
                        "Evaluation saved against this output version.",
                      )
                    }
                  />
                </Panel>
              </div>
              {s.evaluations.length > 0 && (
                <Panel
                  title="Resolution"
                  description="Document a shortfall for review without issuing a refund or implying insurance coverage."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormError("");
                        setCaseEvaluationId(
                          evaluation?.id || s.evaluations.at(-1)!.id,
                        );
                        setCaseOpen(true);
                      }}
                    >
                      <ShieldTick />
                      Open review case
                    </Button>
                  }
                >
                  {s.cases.length ? (
                    <div className="session-cases">
                      {s.cases.map((c) => (
                        <div key={c.id}>
                          <div className="case-title">
                            <StateBadge
                              label={
                                c.status[0].toUpperCase() + c.status.slice(1)
                              }
                            />
                            <span>
                              Output version{" "}
                              {s.outcomes.findIndex(
                                (o) =>
                                  o.id ===
                                  s.evaluations.find(
                                    (e) => e.id === c.evaluationId,
                                  )?.outcomeId,
                              ) + 1}{" "}
                              · Evaluation {c.evaluationId.slice(0, 8)} ·{" "}
                              {date(c.at)}
                            </span>
                          </div>
                          <p>{c.reason}</p>
                          {c.resolution && (
                            <p className="resolution-note">{c.resolution}</p>
                          )}
                          {c.status === "open" && (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                void onAction(() =>
                                  onMutate(
                                    `/observations/${s.id}/cases/${c.id}`,
                                    {
                                      status: "resolved",
                                      resolution: resolution[c.id] || "",
                                    },
                                    "Case resolution recorded. No payment was issued.",
                                  ),
                                );
                              }}
                            >
                              <Textarea
                                aria-label="Case resolution"
                                required
                                minLength={10}
                                maxLength={4000}
                                value={resolution[c.id] || ""}
                                onChange={(e) =>
                                  setResolution((r) => ({
                                    ...r,
                                    [c.id]: e.target.value,
                                  }))
                                }
                                placeholder="Describe the resolution or remedy."
                              />
                              <Button
                                variant="outline"
                                disabled={busy}
                                type="submit"
                              >
                                Record resolution
                              </Button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="subtle">
                      No review case has been opened for this session.
                    </p>
                  )}
                </Panel>
              )}
              {s.outcomes.length > 1 && (
                <Panel title="Previous output versions">
                  <Accordion type="single" collapsible>
                    {s.outcomes
                      .slice(0, -1)
                      .reverse()
                      .map((o, i) => (
                        <AccordionItem value={o.id} key={o.id}>
                          <AccordionTrigger>
                            Version {s.outcomes.length - i - 1} · {date(o.at)}
                          </AccordionTrigger>
                          <AccordionContent>
                            <OutcomeContent text={o.text} />
                            <div
                              role="region"
                              aria-label={`Review output version ${s.outcomes.length - i - 1}`}
                              className="historical-review"
                            >
                              <p className="field-hint">
                                This review applies only to this earlier output.
                                It will not replace the latest output’s score.
                              </p>
                              <EvaluationForm
                                key={o.id}
                                session={s}
                                outcomeId={o.id}
                                onSave={(data) =>
                                  onMutate(
                                    `/observations/${s.id}/evaluate`,
                                    data,
                                    "Retrospective evaluation saved against this output version.",
                                  )
                                }
                              />
                            </div>
                            {s.evaluations
                              .filter((e) => e.outcomeId === o.id)
                              .map((e) => (
                                <EvaluationStats key={e.id} evaluation={e} />
                              ))}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </Panel>
              )}
            </>
          ) : (
            <Panel title="Output & evaluation">
              <Empty
                title="Waiting for the delivered output"
                action={<CopyButton text={prompt} label="Copy agent prompt" />}
              >
                Your agent submits its final answer through Two Hands. You can
                then compare it with the original intent and record an
                evaluation.
              </Empty>
            </Panel>
          )}
        </TabsContent>
        <TabsContent value="record">
          <Panel
            title="Audit record"
            description="Intent, outputs, evaluations, and tool events retain their versions."
          >
            <dl className="record-details">
              <div>
                <dt>Session ID</dt>
                <dd>{s.id}</dd>
              </div>
              <div>
                <dt>Intent fingerprint</dt>
                <dd>{s.intentHash}</dd>
              </div>
              <div>
                <dt>Local chain integrity</dt>
                <dd>{s.integrity ? "Consistent" : "Failed"}</dd>
              </div>
              <div>
                <dt>Model provenance</dt>
                <dd>
                  {s.modelSource === "agent_reported"
                    ? "Agent reported"
                    : "Operator entered"}{" "}
                  · not independently verified
                </dd>
              </div>
            </dl>
            <p className="field-hint">
              Hash chaining detects inconsistencies in this local record. It is
              not an independent attestation or proof against an operator
              rewriting the database.
            </p>
            <div className="button-row">
              <ExportButton
                onClick={() =>
                  void onAction(async () =>
                    download(
                      `apilayer-${s.id}-summary.json`,
                      await api(`/observations/${s.id}/export`),
                    ),
                  )
                }
              />
              <ExportButton
                label="Export private evidence"
                onClick={() =>
                  download(`apilayer-${s.id}-private-evidence.json`, {
                    version: "private-evidence-v1",
                    exportedAt: new Date().toISOString(),
                    containsPrivateContent: true,
                    session: s,
                  })
                }
              />
            </div>
          </Panel>
          <Panel title="Commercial aggregate sharing">
            <div className="data-control-row">
              <div>
                <strong>Included by account policy</strong>
                <p>
                  All sessions contribute aggregate tool usage and outcome
                  statistics. Raw intent, outputs, queries, URLs, and
                  explanations are excluded from commercial exports.
                </p>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <p className="field-hint">
              Usage is available without a minimum account or session count.
              Nothing is automatically published or sent to tool companies.
            </p>
          </Panel>
          <Panel
            title="Delete local session"
            description="Removes its intent, tool results, outputs, evaluations, and cases from this account."
          >
            <Button
              variant="destructive"
              disabled={busy || s.calls.some((c) => c.status === "running")}
              onClick={() => {
                setDeleteConfirm("");
                setFormError("");
                setDeleteOpen(true);
              }}
            >
              Delete session
            </Button>
          </Panel>
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!evidenceId}
        onOpenChange={(open) => {
          if (!open) setEvidenceId(null);
        }}
      >
        <DialogContent className="evidence-dialog">
          <DialogHeader>
            <DialogTitle>Recorded evidence</DialogTitle>
            <DialogDescription>
              {evidenceCall?.tool.replaceAll("_", " ")} · {evidenceCall?.id}.
              This reads the saved receipt without making another provider
              request.
            </DialogDescription>
          </DialogHeader>
          {evidenceCall && (
            <>
              <div className="evidence-receipt-meta">
                <StateBadge
                  label={
                    evidenceCall.status[0].toUpperCase() +
                    evidenceCall.status.slice(1)
                  }
                />
                <span>
                  {date(evidenceCall.startedAt)} ·{" "}
                  {money(evidenceCall.estimateMicros)} pre-call estimate
                </span>
              </div>
              <p className="evidence-query">
                {String(
                  evidenceCall.arguments.url ||
                    evidenceCall.arguments.query ||
                    "",
                )}
              </p>
              <ToolResult data={evidenceCall.result || null} full />
              {evidenceCall.error && (
                <InlineError message={evidenceCall.error} />
              )}
              <Collapsible className="raw-record">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    Full recorded receipt
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <pre
                    className="event-json"
                    tabIndex={0}
                    aria-label="Full evidence receipt"
                  >
                    {JSON.stringify(evidenceCall, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open a review case</DialogTitle>
            <DialogDescription>
              Link the shortfall to a recorded evaluation. This records a case,
              not a payment or insurance decision.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setFormError("");
              try {
                await onMutate(
                  `/observations/${s.id}/cases`,
                  { evaluationId: caseEvaluationId, reason: caseReason },
                  "Review case opened.",
                );
                setCaseOpen(false);
                setCaseReason("");
              } catch (e) {
                setFormError((e as Error).message);
              }
            }}
          >
            <Field label="Reviewed output" id="case-evaluation">
              <Select
                value={caseEvaluationId}
                onValueChange={setCaseEvaluationId}
              >
                <SelectTrigger id="case-evaluation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {s.evaluations.map((e, i) => (
                    <SelectItem key={e.id} value={e.id}>
                      Version{" "}
                      {s.outcomes.findIndex((o) => o.id === e.outcomeId) + 1} ·
                      Review {i + 1} · {date(e.at)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="What fell short?" id="case-reason">
              <Textarea
                id="case-reason"
                minLength={10}
                maxLength={4000}
                required
                value={caseReason}
                onChange={(e) => setCaseReason(e.target.value)}
              />
            </Field>
            <InlineError message={formError} />
            <DialogFooter>
              <Button disabled={busy}>Open case</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this session?</DialogTitle>
            <DialogDescription>
              This permanently removes the local record. Export private evidence
              first if you need to retain it. Type the session name to confirm.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (deleteConfirm !== s.title) return;
              setFormError("");
              try {
                await onMutate(
                  `/observations/${s.id}/delete`,
                  { confirmSessionId: s.id },
                  "Session deleted.",
                );
                setDeleteOpen(false);
                onDeleted();
              } catch (e) {
                setFormError((e as Error).message);
              }
            }}
          >
            <Field label={s.title} id="confirm-delete-session">
              <Input
                id="confirm-delete-session"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
              />
            </Field>
            <InlineError message={formError} />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
                Keep session
              </Button>
              <Button
                disabled={busy || deleteConfirm !== s.title}
                variant="destructive"
              >
                Delete permanently
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
function ToolResult({
  data,
  full = false,
}: {
  data: Record<string, any> | null;
  full?: boolean;
}) {
  if (!data) return null;
  return (
    <div className="tool-result-preview">
      <p className="field-hint">
        {reportedUsage(data)}. Provider-reported usage is not a reconciled
        invoice.
      </p>
      {typeof data.text === "string" && (
        <>
          <div className="result-status">
            <Badge variant="outline">API HTTP {data.httpStatus}</Badge>
            {data.pageStatus && (
              <StateBadge label={`Page HTTP ${data.pageStatus}`} />
            )}
          </div>
          {data.truncated && (
            <p className="partial-evidence">
              Partial extraction:{" "}
              {Number(
                data.returnedCharacters || data.text.length,
              ).toLocaleString()}{" "}
              of {Number(data.originalCharacters).toLocaleString()}{" "}
              provider-returned characters were recorded.
            </p>
          )}
          {data.truncated === undefined && data.text.length === 20000 && (
            <p className="field-hint">
              This older receipt is at the capture limit; completeness was not
              recorded.
            </p>
          )}
          {full ? (
            <div
              className="captured-evidence"
              tabIndex={0}
              role="region"
              aria-label="Captured source content"
            >
              <OutcomeContent text={data.text} />
            </div>
          ) : (
            <p className="extracted-text">
              {data.text.slice(0, 1500)}
              {data.text.length > 1500 ? "…" : ""}
            </p>
          )}
          {!full && data.text.length > 1500 && (
            <p className="field-hint">
              Preview shortened for readability. Recorded data below contains
              the captured text.
            </p>
          )}
        </>
      )}
      {Array.isArray(data.sources) && (
        <div className="source-links">
          {data.sources.map((source: any) => (
            <div key={source.id}>
              <ExternalLink href={source.url}>{source.title}</ExternalLink>
              <p>{source.snippet?.slice(0, 250)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
