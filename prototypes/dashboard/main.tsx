import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowUpRight,
  CreditCard01,
  Grid01,
  HelpCircle,
  Key01,
  Link01,
  LogIn01,
  Menu01,
  SearchMd,
  Settings01,
} from "@untitledui/icons";
import { Popover } from "radix-ui";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import brand from "../../public/two-hands.svg";
import chatgptMark from "./assets/chatgpt-mark.png";
import claudeMark from "./assets/claude-mark.svg";
import codexMark from "./assets/codex-mark.png";
import cursorMark from "./assets/cursor-mark.svg";
import pinMark from "./assets/pin.svg";
import type { DemoToolName } from "./demo-providers";
import "@fontsource-variable/geist";
import "@/theme.css";
import "@/design-system.css";
import "./dashboard.css";
import { ProviderMark, providerMarks } from "./provider-mark";
import { ToolCatalog } from "./tool-catalog";
import { DemoLogin } from "./demo-login";
import { DemoApiKeys, sampleDemoKeys } from "./demo-api-keys";

const providers = [
  {
    name: "Exa",
    logo: providerMarks.exa,
    running: 1,
    latency: 740,
    estimateMills: 7,
  },
  {
    name: "Tavily",
    logo: providerMarks.tavily,
    running: 1,
    latency: 910,
    estimateMills: 8,
  },
  {
    name: "Firecrawl",
    logo: providerMarks.firecrawl,
    running: 0,
    latency: 970,
    estimateMills: 1,
  },
] as const;

const models = {
  gpt: { name: "GPT-5.4", host: "ChatGPT", logo: chatgptMark },
  sonnet: { name: "Claude Sonnet 4.6", host: "Claude", logo: claudeMark },
  opus: { name: "Claude Opus 4.6", host: "Claude", logo: claudeMark },
};

const demoUsage = [
  {
    id: 1,
    project: "Market scan",
    model: models.gpt,
    daysAgo: 0,
    calls: { Exa: 9, Tavily: 5, Firecrawl: 3 },
  },
  {
    id: 2,
    project: "Documentation audit",
    model: models.sonnet,
    daysAgo: 1,
    calls: { Exa: 10, Tavily: 9, Firecrawl: 4 },
  },
  {
    id: 3,
    project: "Vendor comparison",
    model: models.opus,
    daysAgo: 2,
    calls: { Exa: 16, Tavily: 7, Firecrawl: 5 },
  },
  {
    id: 4,
    project: "Weekly brief",
    model: models.gpt,
    daysAgo: 4,
    calls: { Exa: 8, Tavily: 10, Firecrawl: 7 },
  },
  {
    id: 5,
    project: "Product research",
    model: models.sonnet,
    daysAgo: 6,
    calls: { Exa: 14, Tavily: 6, Firecrawl: 5 },
  },
].map((row) => ({
  ...row,
  estimateMills: providers.reduce(
    (total, provider) =>
      total + row.calls[provider.name] * provider.estimateMills,
    0,
  ),
}));

const dateRanges = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const usdEstimate = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const percentage = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

type Metric = readonly [label: string, value: string, caption: string];

type Overlay =
  | { view: "refund"; item: (typeof demoUsage)[number] }
  | { view: "metric"; metric: Metric }
  | {
      view:
        | "credits"
        | "add-funds"
        | "connect"
        | "activity"
        | "providers"
        | "settings"
        | "help";
    };

const catalogHash = "#dashboard/tools";
const keysHash = "#dashboard/keys";
const loginHash = "#login";

function subscribeToPage(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function demoPage() {
  switch (window.location.hash) {
    case catalogHash:
      return "catalog";
    case keysHash:
      return "keys";
    case loginHash:
      return "login";
    default:
      return "dashboard";
  }
}

function PanelHeading({
  title,
  action,
  onAction,
  id,
}: {
  title: string;
  action: string;
  onAction: () => void;
  id: string;
}) {
  return (
    <header className="demo-panel-heading">
      <CardTitle id={id} className="font-medium">
        {title}
      </CardTitle>
      <Button variant="ghost" size="xs" onClick={onAction}>
        {action}
        <ArrowUpRight className="size-[13px]" />
      </Button>
    </header>
  );
}

function providerUsage(rows: typeof demoUsage, days: number) {
  return providers.map((provider) => {
    const completed = rows.reduce(
      (total, row) => total + row.calls[provider.name],
      0,
    );
    return {
      ...provider,
      completed,
      requests: completed + provider.running,
      estimate: (completed * provider.estimateMills) / 1000,
      failed: Number(days > 1 || provider.name === "Exa"),
    };
  });
}

function Dashboard() {
  const page = useSyncExternalStore(subscribeToPage, demoPage);
  const catalogPage = page === "catalog";
  const keysPage = page === "keys";
  const [keys, setKeys] = useState(sampleDemoKeys);
  const previousPage = useRef(page);
  const pageHeading = useRef<HTMLHeadingElement>(null);
  const [pausedTools, setPausedTools] = useState<Set<DemoToolName>>(
    () => new Set(),
  );
  const [range, setRange] = useState("7");
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState<Set<string>>(() => new Set());
  const [wallets, setWallets] = useState({
    sample: 10000,
    signedIn: null as number | null,
  });
  const [amount, setAmount] = useState("25");
  const [connected, setConnected] = useState(false);
  const [refunds, setRefunds] = useState<Set<number>>(() => new Set());
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const returnFocus = useRef<HTMLElement>(null);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const balance = wallets.signedIn ?? wallets.sample;
  const accountName = wallets.signedIn === null ? "Roy Li" : "Demo account";

  useEffect(() => {
    document.title = keysPage
      ? "API keys · Two Hands demo"
      : page === "login"
        ? "Sign in · Two Hands demo"
        : "Two Hands dashboard demo";
    if (previousPage.current === page) return;
    previousPage.current = page;
    pageHeading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [page, keysPage]);

  const days = Number(range);
  const rows = demoUsage.filter(({ daysAgo }) => daysAgo < days);
  const usage = providerUsage(rows, days);
  const totals = usage.reduce(
    (total, provider) => ({
      estimate: total.estimate + provider.estimate,
      requests: total.requests + provider.requests,
      running: total.running + provider.running,
      completed: total.completed + provider.completed,
      failed: total.failed + provider.failed,
      latency: total.latency + provider.completed * provider.latency,
    }),
    {
      estimate: 0,
      requests: 0,
      running: 0,
      completed: 0,
      failed: 0,
      latency: 0,
    },
  );
  const metrics: Metric[] = [
    [
      "Estimated cost",
      usdEstimate.format(totals.estimate),
      "Recorded calls · not an invoice",
    ],
    [
      "Tool requests",
      String(totals.requests),
      `${totals.running} running · ${totals.failed} failed`,
    ],
    [
      "API success rate",
      percentage.format((totals.completed - totals.failed) / totals.completed),
      `${totals.completed} completed calls · execution only`,
    ],
    [
      "Average latency",
      `${Math.round(totals.latency / totals.completed)} ms`,
      `${totals.completed} timed calls`,
    ],
  ];
  const visibleProviders = usage
    .filter(({ name }) =>
      name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => Number(pins.has(b.name)) - Number(pins.has(a.name)));

  function show(next: Overlay, focusTarget?: HTMLElement | null) {
    returnFocus.current =
      focusTarget ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    setOverlay(next);
  }

  function openNavigation(view: "activity" | "credits") {
    show({ view }, navigationOpen ? menuTrigger.current : null);
    setNavigationOpen(false);
  }

  function toggleTool(tool: DemoToolName, enabled: boolean) {
    setPausedTools((previous) => {
      const next = new Set(previous);
      if (enabled) next.delete(tool);
      else next.add(tool);
      return next;
    });
  }

  function togglePin(name: string) {
    const pinned = new Set(pins);
    if (pinned.has(name)) {
      pinned.delete(name);
      setNotice(`${name} unpinned`);
    } else {
      pinned.add(name);
      setNotice(`${name} pinned`);
    }
    setPins(pinned);
  }

  function addDemoFunds(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = Math.round(Number(amount) * 100);
    if (cents < 100 || cents > 100000 || !Number.isFinite(cents)) return;
    setWallets((current) =>
      current.signedIn === null
        ? { ...current, sample: current.sample + cents }
        : { ...current, signedIn: current.signedIn + cents },
    );
    setNotice(`${usd.format(cents / 100)} in demo credits added`);
    setOverlay(null);
  }

  const rangeLabel = dateRanges.find(({ value }) => value === range)?.label;
  if (page === "login") {
    return (
      <DemoLogin
        catalogHref={catalogHash}
        headingRef={pageHeading}
        onSignIn={() => {
          setWallets((current) => ({
            ...current,
            signedIn: current.signedIn ?? 500,
          }));
          setNotice("Demo account opened");
          window.location.hash = "#dashboard";
        }}
      />
    );
  }

  return (
    <div className="dashboard-demo">
      <div className="demo-mobile-header">
        <a href="#dashboard" aria-label="Two Hands dashboard">
          <img src={brand} width={109} height={24} alt="" />
        </a>
        <Button
          type="button"
          ref={menuTrigger}
          variant="ghost"
          size="icon-sm"
          aria-label={navigationOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={navigationOpen}
          aria-controls="demo-sidebar"
          onClick={() => setNavigationOpen(!navigationOpen)}
        >
          <Menu01 />
        </Button>
      </div>
      <aside
        id="demo-sidebar"
        className="demo-sidebar"
        data-open={navigationOpen}
      >
        <div className="demo-sidebar-top">
          <a
            className="demo-logo"
            href="#dashboard"
            aria-label="Two Hands dashboard"
          >
            <img src={brand} width={136.25} height={30} alt="" />
          </a>
          <nav aria-label="Dashboard navigation">
            <a
              className="demo-nav-row"
              href="#dashboard"
              aria-current={page === "dashboard" ? "page" : undefined}
              onClick={() => setNavigationOpen(false)}
            >
              <Grid01 size={17} />
              My dashboard
            </a>
            <a
              className="demo-nav-row"
              href={catalogHash}
              aria-current={catalogPage ? "page" : undefined}
              onClick={() => setNavigationOpen(false)}
            >
              <Link01 size={17} />
              Tool catalog
            </a>
            <button
              type="button"
              className="demo-nav-row"
              onClick={() => openNavigation("activity")}
            >
              <Activity size={17} />
              Activity
            </button>
            <a
              className="demo-nav-row"
              href={keysHash}
              aria-current={keysPage ? "page" : undefined}
              onClick={() => setNavigationOpen(false)}
            >
              <Key01 size={17} />
              API keys
            </a>
          </nav>
          <div className="demo-wallet">
            <button
              type="button"
              className="demo-nav-row demo-credits-row"
              onClick={() => openNavigation("credits")}
            >
              <CreditCard01 size={17} />
              Credits
              <span>{usd.format(balance / 100)}</span>
            </button>
            <Button
              type="button"
              variant="brand"
              size="xs"
              className="demo-add-funds"
              onClick={() => {
                show(
                  { view: "add-funds" },
                  navigationOpen ? menuTrigger.current : null,
                );
                setNavigationOpen(false);
              }}
            >
              Add funds
            </Button>
          </div>
        </div>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="demo-account"
              ref={accountTrigger}
              aria-label={`${accountName} account menu`}
            >
              <span aria-hidden className="demo-avatar" />
              <span>{accountName}</span>
              <Settings01 size={17} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="demo-account-menu"
              side="top"
              sideOffset={5}
              align="start"
            >
              <Popover.Close asChild>
                <button
                  type="button"
                  onClick={() =>
                    show({ view: "settings" }, accountTrigger.current)
                  }
                >
                  <Settings01 size={15} />
                  Settings
                </button>
              </Popover.Close>
              <Popover.Close asChild>
                <button
                  type="button"
                  onClick={() => show({ view: "help" }, accountTrigger.current)}
                >
                  <HelpCircle size={15} />
                  Help
                </button>
              </Popover.Close>
              <Popover.Close asChild>
                <a href="./landing.html">
                  <ArrowUpRight size={15} />
                  Landing page
                </a>
              </Popover.Close>
              <Popover.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    setNavigationOpen(false);
                    window.location.hash = loginHash;
                  }}
                >
                  <LogIn01 size={15} />
                  Demo sign-in
                </button>
              </Popover.Close>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </aside>
      <main className="demo-main" id="dashboard">
        {!keysPage && (
          <header className="demo-page-heading">
            <h1 ref={pageHeading} tabIndex={-1}>
              {catalogPage ? "Tool catalog" : "My dashboard"}
            </h1>
            <div className="demo-controls">
              {!catalogPage && (
                <Select value={range} onValueChange={setRange}>
                  <SelectTrigger
                    aria-label="Date range"
                    className="demo-date-range"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    {dateRanges.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                type="button"
                variant="brand"
                size="sm"
                className="demo-connect"
                onClick={() => show({ view: "connect" })}
              >
                <span className="demo-agent-marks" aria-hidden="true">
                  <span>
                    <img src={claudeMark} width={13} height={13} alt="" />
                  </span>
                  <span className="demo-codex-mark">
                    <img src={codexMark} width={18} height={18} alt="" />
                  </span>
                  <span>
                    <img src={cursorMark} width={13} height={13} alt="" />
                  </span>
                </span>
                {connected ? "Agent connected" : "Connect agent"}
              </Button>
            </div>
          </header>
        )}

        {keysPage ? (
          <DemoApiKeys
            keys={keys}
            onChange={setKeys}
            onConnect={(trigger) => show({ view: "connect" }, trigger)}
            headingRef={pageHeading}
          />
        ) : catalogPage ? (
          <ToolCatalog
            pausedTools={pausedTools}
            onToggle={toggleTool}
            samples={providerUsage(demoUsage, 7)}
          />
        ) : (
          <>
            <section className="demo-metrics" aria-label="Dashboard metrics">
              {metrics.map((metric) => {
                const [label, value] = metric;
                return (
                  <Card key={label} className="demo-metric">
                    <button
                      type="button"
                      onClick={() => show({ view: "metric", metric })}
                    >
                      <span className="demo-metric-label">
                        {label}
                        <ArrowUpRight size={13} />
                      </span>
                      <span className="demo-metric-value">{value}</span>
                    </button>
                  </Card>
                );
              })}
            </section>

            <div className="demo-panel-grid">
              <Card
                className="demo-panel"
                role="region"
                aria-labelledby="demo-usage-heading"
              >
                <PanelHeading
                  id="demo-usage-heading"
                  title="Usage"
                  action="View activity"
                  onAction={() => show({ view: "activity" })}
                />
                <div className="demo-usage">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Projects</th>
                        <th scope="col">Model</th>
                        <th scope="col">Cost</th>
                        <th scope="col">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.project}</td>
                          <td>
                            <span className="demo-model">
                              <img
                                src={row.model.logo}
                                width={20}
                                height={20}
                                alt={
                                  row.model.host === "ChatGPT" ? "ChatGPT" : ""
                                }
                              />
                              <span>{row.model.name}</span>
                            </span>
                          </td>
                          <td>
                            {usdEstimate.format(row.estimateMills / 1000)}
                          </td>
                          <td>
                            <Button
                              type="button"
                              size="xs"
                              variant="secondary"
                              className="demo-refund"
                              disabled={refunds.has(row.id)}
                              onClick={() =>
                                show({ view: "refund", item: row })
                              }
                            >
                              {refunds.has(row.id) ? "Requested" : "Refund"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card
                className="demo-panel"
                role="region"
                aria-labelledby="demo-provider-heading"
              >
                <PanelHeading
                  id="demo-provider-heading"
                  title="By Provider"
                  action="Details"
                  onAction={() => show({ view: "providers" })}
                />
                <div className="demo-provider-list">
                  <label className="demo-search">
                    <SearchMd size={15} />
                    <Input
                      type="search"
                      aria-label="Search providers"
                      placeholder="Search providers"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </label>
                  {visibleProviders.map(
                    ({ name, logo, requests, estimate }) => (
                      <Card key={name} className="demo-provider">
                        <div className="demo-provider-identity">
                          <ProviderMark logo={logo} />
                          <h3>{name}</h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="demo-pin"
                            aria-label={`Pin ${name}`}
                            aria-pressed={pins.has(name)}
                            onClick={() => togglePin(name)}
                          >
                            <img src={pinMark} width={16} height={16} alt="" />
                          </Button>
                        </div>
                        <dl className="demo-provider-metrics">
                          <div>
                            <dt>Requests</dt>
                            <dd>{requests}</dd>
                          </div>
                          <div>
                            <dt>Estimated cost</dt>
                            <dd>{usdEstimate.format(estimate)}</dd>
                          </div>
                          <div>
                            <dt>Request share</dt>
                            <dd>
                              {percentage.format(requests / totals.requests)}
                            </dd>
                          </div>
                        </dl>
                      </Card>
                    ),
                  )}
                  {!visibleProviders.length && (
                    <p className="demo-no-results" role="status">
                      No matching providers
                    </p>
                  )}
                </div>
              </Card>
            </div>
            <Card className="demo-discover">
              <CardTitle className="font-normal">Discover More Tools</CardTitle>
            </Card>
          </>
        )}
      </main>
      <p className="sr-only" role="status">
        {notice}
      </p>
      <Dialog
        open={overlay !== null}
        onOpenChange={(open) => {
          if (!open) setOverlay(null);
        }}
      >
        {overlay && (
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              returnFocus.current?.focus();
            }}
          >
            {overlay.view === "add-funds" && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-medium">Add funds</DialogTitle>
                  <DialogDescription>
                    Add sample credits to test the dashboard balance.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={addDemoFunds} className="demo-funds-form">
                  <label htmlFor="demo-amount">Amount in USD</label>
                  <Input
                    id="demo-amount"
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                  <DialogFooter>
                    <Button type="submit" variant="brand">
                      Add demo credits
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
            {overlay.view === "connect" && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-medium">
                    Connect agent
                  </DialogTitle>
                  <DialogDescription>
                    {connected
                      ? "A sample agent is connected for this demo."
                      : "Simulate connecting an agent to see the connected state."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    variant={connected ? "outline" : "brand"}
                    onClick={() => {
                      setConnected(!connected);
                      setNotice(
                        connected
                          ? "Sample agent disconnected"
                          : "Sample agent connected",
                      );
                      setOverlay(null);
                    }}
                  >
                    {connected
                      ? "Disconnect demo agent"
                      : "Simulate connection"}
                  </Button>
                </DialogFooter>
              </>
            )}
            {overlay.view === "refund" && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-medium">
                    Request a refund
                  </DialogTitle>
                  <DialogDescription>
                    Test the refund request for {overlay.item.project} (
                    {usdEstimate.format(overlay.item.estimateMills / 1000)})
                    using sample data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={() => {
                      setRefunds(
                        (pending) => new Set([...pending, overlay.item.id]),
                      );
                      setNotice("Demo refund request saved");
                      setOverlay(null);
                    }}
                  >
                    Save demo request
                  </Button>
                </DialogFooter>
              </>
            )}
            {overlay.view === "metric" && (
              <DialogHeader>
                <DialogTitle className="font-medium">
                  {overlay.metric[0]}
                </DialogTitle>
                <DialogDescription>
                  {rangeLabel} · {overlay.metric[2]}
                </DialogDescription>
                <p className="demo-dialog-value">{overlay.metric[1]}</p>
              </DialogHeader>
            )}
            {overlay.view === "activity" && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-medium">Activity</DialogTitle>
                  <DialogDescription>
                    {rangeLabel} · Sample usage
                  </DialogDescription>
                </DialogHeader>
                <ul className="demo-dialog-list">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <span>{row.project}</span>
                      <span>
                        {usdEstimate.format(row.estimateMills / 1000)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {overlay.view === "providers" && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-medium">
                    Provider details
                  </DialogTitle>
                  <DialogDescription>
                    {rangeLabel} · Sample requests
                  </DialogDescription>
                </DialogHeader>
                <ul className="demo-dialog-list">
                  {usage.map(({ name, logo, requests }) => (
                    <li key={name}>
                      <span>
                        <ProviderMark logo={logo} />
                        {name}
                      </span>
                      <span>{requests} requests</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {overlay.view === "credits" && (
              <DialogHeader>
                <DialogTitle className="font-medium">Credits</DialogTitle>
                <DialogDescription>
                  Sample balance for this dashboard
                </DialogDescription>
                <p className="demo-dialog-value">{usd.format(balance / 100)}</p>
              </DialogHeader>
            )}
            {overlay.view === "settings" && (
              <DialogHeader>
                <DialogTitle className="font-medium">Settings</DialogTitle>
                <DialogDescription>{accountName} · Prototype</DialogDescription>
              </DialogHeader>
            )}
            {overlay.view === "help" && (
              <DialogHeader>
                <DialogTitle className="font-medium">Help</DialogTitle>
                <DialogDescription>
                  Try searching and pinning providers, changing the date range,
                  or adding demo credits. Refresh the page to reset the sample
                  data.
                </DialogDescription>
              </DialogHeader>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Dashboard />);
