import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code01,
  Copy01,
  FileSearch02,
  Grid01,
  Plus,
  Receipt,
  SearchLg,
  TerminalSquare,
} from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import { GlyphField } from "@/components/landing/GlyphField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import brand from "../../public/two-hands.svg";
import brandMark from "../../public/two-hands-mark.svg";
import claudeMark from "./assets/claude-mark.svg";
import codexMark from "./assets/codex-mark.png";
import cursorMark from "./assets/cursor-mark.svg";
import { demoProviders, type DemoProvider } from "./demo-providers";
import { providerMarks } from "./provider-mark";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@/theme.css";
import "@/design-system.css";
import "./dashboard.css";
import "./landing.css";

const dashboard = "/#dashboard";
const catalog = "/#dashboard/tools";
const connectCommand = "npm run mcp:install";
const sampleSession = "00000000-0000-4000-8000-000000000001";
const providerOrder = [
  "exa",
  "firecrawl",
  "tavily",
  "parallel",
  "brave",
  "browserbase",
  "jina",
  "linkup",
  "perplexity",
  "serper",
] as const;
const steps = [
  {
    label: "Your agent",
    title: "Ask in your own words.",
    body: "Start in the agent you already use. Your agent keeps the conversation, plans the work, and delivers the answer.",
  },
  {
    label: "MCP connection",
    title: "Connect once.",
    body: "The MCP bridge gives compatible hosts a single connection to the Two Hands catalog.",
  },
  {
    label: "Tool router",
    title: "Find the tool that fits.",
    body: "Two Hands returns compatible tools and per-call estimates. Your agent chooses the provider for the task.",
  },
  {
    label: "Call record",
    title: "See what ran.",
    body: "Review the provider, estimated cost, and returned evidence in your dashboard.",
  },
] as const;

const searchExample = {
  id: "web-search",
  label: "Search the web",
  description:
    "Compare search tools for the job at hand, from finding primary sources to getting excerpts from relevant pages.",
  bullets: [
    "See compatible search providers",
    "Compare default estimates",
    "Review the agent’s stated choice",
  ],
  icon: SearchLg,
  prompt: "Find primary sources on the history of public libraries.",
  provider: "Exa",
  logo: providerMarks.exa,
  tool: "exa_search",
  estimate: "$0.007",
  reason: "The task needs source-page text alongside search results.",
  input: {
    sessionId: sampleSession,
    requestKey: "sample-search",
    query: "history of public libraries primary sources",
    statedReason: "The task needs source-page text alongside search results.",
  },
} as const;
const extractExample = {
  id: "page-extraction",
  label: "Extract a page",
  description:
    "Start from a known URL and give your agent readable content to work with.",
  bullets: [
    "Pass a public HTTPS URL",
    "Retrieve readable page content",
    "Keep the tool result tied to the call",
  ],
  icon: FileSearch02,
  prompt: "Pull the key details from this page.",
  provider: "Firecrawl",
  logo: providerMarks.firecrawl,
  tool: "firecrawl_extract",
  estimate: "$0.001",
  reason: "The request points to a specific public page.",
  input: {
    sessionId: sampleSession,
    requestKey: "sample-extract",
    url: "https://example.com",
    statedReason: "The request points to a specific public page.",
  },
} as const;
const exampleDefinitions = [
  searchExample,
  extractExample,
  {
    ...searchExample,
    id: "tool-review",
    label: "Review a tool call",
    description:
      "Follow a provider call back to its recorded request and evidence in the dashboard.",
    bullets: [
      "Inspect the recorded request",
      "Read the agent’s tool selection summary",
      "Revisit a saved result",
    ],
    icon: Receipt,
  },
] as const;

function Brand() {
  return (
    <a href="/landing.html">
      <img
        className="th-brand"
        src={brand}
        width={136}
        height={30}
        alt="Two Hands home"
      />
    </a>
  );
}

function Header() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    function sync() {
      setCompact((current) => window.scrollY > (current ? 120 : 168));
    }
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <header className="th-header">
      <div className="th-header-inner th-wrap" data-compact={compact}>
        <div className="th-header-brand">
          <Brand />
        </div>
        <div className="th-header-actions">
          <Button asChild variant="ghost" size="sm">
            <a href="/#login">Sign in</a>
          </Button>
          <Button asChild variant="brand" size="sm">
            <a href={dashboard}>
              Open dashboard <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="th-hero" aria-labelledby="hero-heading">
      <div className="th-hero-copy th-wrap">
        <h1 id="hero-heading">
          One connection for
          <br />
          your agent’s tools.
        </h1>
        <p>
          Give Claude, Codex, and other MCP hosts a single connection for search
          and page extraction.{" "}
          <span>
            See which tools your agent used and their estimated costs.
          </span>
        </p>
        <div className="th-hero-actions">
          <div className="th-actions">
            <Button asChild variant="brand" size="lg">
              <a href={dashboard}>
                Open dashboard <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={catalog}>Browse tools</a>
            </Button>
          </div>
          <a className="th-hero-jump" href="#platform">
            <i /> How Two Hands works <ArrowDown size={15} />
          </a>
        </div>
      </div>
      <GlyphField />
    </section>
  );
}

function ProviderGrid() {
  const [selected, setSelected] = useState<DemoProvider | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const ordered = providerOrder.flatMap((id) =>
    demoProviders.filter((provider) => provider.id === id),
  );
  function providerButton(provider: DemoProvider) {
    return (
      <button
        className="th-provider"
        key={provider.id}
        type="button"
        onClick={(event) => {
          trigger.current = event.currentTarget;
          setSelected(provider);
        }}
      >
        <img src={provider.logo} width={22} height={22} alt="" />
        {provider.label}
      </button>
    );
  }

  return (
    <section className="th-provider-section" aria-labelledby="provider-heading">
      <div className="th-provider-grid">
        {ordered.slice(0, 2).map(providerButton)}
        <h2 id="provider-heading">In the demo catalog</h2>
        {ordered.slice(2).map(providerButton)}
      </div>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>{selected.label}</DialogTitle>
              <DialogDescription>{selected.summary}</DialogDescription>
            </DialogHeader>
            <ul className="th-provider-endpoints" aria-label="Endpoints">
              {selected.endpoints.map(({ name, estimatedUsd }) => (
                <li key={name}>
                  <code>{name}</code>
                  <span>
                    ${estimatedUsd.toFixed(estimatedUsd < 0.001 ? 4 : 3)} / call
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline">
              <a href={catalog}>
                View the tool catalog <ArrowUpRight />
              </a>
            </Button>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}

function StackPlane({ index }: { index: number }) {
  switch (index) {
    case 0:
      return (
        <>
          <div className="th-stack-pane">
            <img src={claudeMark} alt="" />
            <img src={codexMark} alt="" />
            <img src={cursorMark} alt="" />
          </div>
          <div className="th-stack-block">
            <i />
            <i />
            <i />
          </div>
        </>
      );
    case 1:
      return (
        <>
          <div className="th-stack-pane">
            <TerminalSquare size={26} />
            <strong>MCP</strong>
          </div>
          <div className="th-stack-block">
            <i />
            <i />
            <i />
          </div>
        </>
      );
    case 2:
      return (
        <>
          <div className="th-stack-pane">
            <img src={brandMark} alt="" />
            <strong>Two Hands</strong>
          </div>
          <div className="th-stack-logos">
            <img src={providerMarks.exa} alt="" />
            <img src={providerMarks.tavily} alt="" />
            <img src={providerMarks.firecrawl} alt="" />
          </div>
        </>
      );
    default:
      return (
        <>
          <div className="th-stack-pane">
            <Receipt size={26} />
            <strong>Tool receipt</strong>
          </div>
          <div className="th-stack-ledger">
            <i />
            <i />
            <i />
            <i />
          </div>
        </>
      );
  }
}

function Architecture() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);
  useEffect(() => {
    let scheduled = 0;
    function sync() {
      scheduled = 0;
      const node = section.current;
      const pane = progress.current;
      if (!node || !pane) return;
      const runway = node.offsetHeight - pane.offsetHeight;
      if (runway <= 2) return;
      const fraction = -node.getBoundingClientRect().top / runway;
      setActive(
        Math.max(-1, Math.min(steps.length - 1, Math.floor(fraction * 5) - 1)),
      );
    }
    function schedule() {
      if (!scheduled) scheduled = requestAnimationFrame(sync);
    }
    sync();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(scheduled);
    };
  }, []);

  function choose(index: number) {
    const node = section.current;
    const pane = progress.current;
    if (!node || !pane) return;
    const runway = node.offsetHeight - pane.offsetHeight;
    if (runway <= 2) {
      setActive(index);
      return;
    }
    const start = node.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: start + ((index + 1.35) / 5) * runway,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  return (
    <section
      ref={section}
      id="platform"
      className="th-architecture"
      aria-labelledby="architecture-heading"
    >
      <div ref={progress} className="th-architecture-sticky">
        <div className="th-architecture-copy">
          <div className="th-architecture-overview" hidden={active >= 0}>
            <h2 id="architecture-heading">The tool layer for your agent</h2>
            <p>
              One connection joins the agent you use to the tools it needs.
              Follow a request from your host to a recorded tool call.
            </p>
          </div>
          <ol className="th-stage-list" data-active={active}>
            {steps.map(({ label, title, body }, index) => (
              <li
                key={label}
                className="th-stage"
                data-position={
                  active < 0 || index > active
                    ? "next"
                    : index < active
                      ? "previous"
                      : "active"
                }
              >
                <button
                  type="button"
                  aria-current={index === active ? "step" : undefined}
                  onClick={() => choose(index)}
                >
                  <i /> <span>0{index + 1}</span> {label}
                </button>
                {index === active && (
                  <div className="th-stage-detail">
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div
          className="th-architecture-figure"
          role="img"
          aria-label="An exploded stack showing the agent, MCP connection, tool router, and tool call receipt."
        >
          <div className="th-stack" data-overview={active < 0}>
            {steps.map(({ label }, index) => (
              <div
                key={label}
                className="th-stack-layer"
                data-active={index === active}
                style={
                  {
                    "--layer-offset":
                      (index - (active < 0 ? 1.5 : active)) *
                      (active < 0 ? 100 : 172),
                    zIndex: steps.length - index,
                  } as React.CSSProperties
                }
                aria-hidden="true"
              >
                <div className="th-stack-face">
                  <StackPlane index={index} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExampleReceipt({
  example,
}: {
  example: (typeof exampleDefinitions)[number];
}) {
  return (
    <div className="th-receipt">
      <div className="th-receipt-tool">
        <img src={example.logo} width={30} height={30} alt="" />
        <div>
          <strong>{example.provider}</strong>
          <code>{example.tool}</code>
        </div>
        <Receipt size={18} />
      </div>
      <div className="th-receipt-estimate">
        <span>Default estimate</span>
        <strong>
          {example.estimate}
          <small> / call</small>
        </strong>
      </div>
      <div className="th-receipt-line">
        <span>Sample request</span>
        <p>{example.prompt}</p>
      </div>
      <div className="th-receipt-line">
        <span>Agent-reported reason</span>
        <p>{example.reason}</p>
      </div>
    </div>
  );
}

function Workflows() {
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    function syncHash() {
      const index = exampleDefinitions.findIndex(
        ({ id }) => window.location.hash === `#${id}`,
      );
      if (index >= 0) setSelected(index);
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);
  const example = exampleDefinitions[selected];
  return (
    <section
      id="workflows"
      className="th-workflows"
      aria-labelledby="workflows-heading"
    >
      <div className="th-workflows-copy">
        <h2 id="workflows-heading">What your agent can do</h2>
        {exampleDefinitions.map(
          ({ id, label, description, bullets, icon: Icon }, index) => {
            const active = selected === index;
            return (
              <div className="th-workflow" key={id} id={id}>
                <h3>
                  <button
                    type="button"
                    aria-expanded={active}
                    aria-controls={`workflow-${index}`}
                    onClick={() => setSelected(index)}
                  >
                    {label}
                    <ChevronDown size={17} />
                  </button>
                </h3>
                <div
                  id={`workflow-${index}`}
                  className="th-workflow-detail"
                  hidden={!active}
                >
                  <p>{description}</p>
                  <ul>
                    {bullets.map((bullet) => (
                      <li key={bullet}>
                        <Icon size={16} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" size="sm">
                    <a href={index === 2 ? dashboard : catalog}>
                      {index === 2 ? "Open demo" : "Browse tools"}{" "}
                      <ArrowUpRight />
                    </a>
                  </Button>
                </div>
              </div>
            );
          },
        )}
      </div>
      <div className="th-workflows-figure">
        <Tabs defaultValue="receipt" className="th-format">
          <div className="th-example-panel">
            <div className="th-panel-heading">
              <Receipt size={16} /> Sample tool call
            </div>
            <TabsContent value="receipt">
              <ExampleReceipt example={example} />
            </TabsContent>
            <TabsContent value="json">
              <pre className="th-code-example">
                <code>
                  {JSON.stringify(
                    { name: example.tool, arguments: example.input },
                    null,
                    2,
                  )}
                </code>
              </pre>
            </TabsContent>
          </div>
          <TabsList aria-label="Example format">
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="json">MCP call</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </section>
  );
}

const productGroups = [
  [
    {
      heading: "Tools",
      entries: [
        {
          title: "Tool catalog",
          description: "Browse providers, endpoints, and estimates.",
          href: catalog,
          icon: Grid01,
        },
        {
          title: "Tool routing",
          description: "See how a request reaches the right provider.",
          href: "#platform",
          icon: Activity,
        },
        {
          title: "Web search",
          description: "Find source pages and excerpts.",
          href: "#web-search",
          icon: SearchLg,
        },
        {
          title: "Page extraction",
          description: "Retrieve readable content from a public URL.",
          href: "#page-extraction",
          icon: FileSearch02,
        },
      ],
    },
  ],
  [
    {
      heading: "Dashboard",
      entries: [
        {
          title: "Dashboard",
          description: "Review sample tool calls and usage.",
          href: dashboard,
          icon: Activity,
        },
      ],
    },
    {
      heading: "Account access",
      entries: [
        {
          title: "API keys",
          description: "Explore scoped access in the demo workspace.",
          href: "/#dashboard/keys",
          icon: Code01,
        },
      ],
    },
    {
      heading: "Integration",
      entries: [
        {
          title: "MCP setup",
          description: "Register Two Hands in an MCP-compatible host.",
          href: "#developers",
          icon: TerminalSquare,
        },
      ],
    },
  ],
];

function Products() {
  return (
    <section id="products" className="th-ruled">
      <div className="th-wrap th-section">
        <h2>Explore Two Hands</h2>
        <div className="th-products">
          {productGroups.map((column) => (
            <div key={column[0].heading}>
              {column.map(({ heading, entries }) => (
                <div className="th-product-group" key={heading}>
                  <h3>{heading}</h3>
                  {entries.map(({ title, description, href, icon: Icon }) => (
                    <a key={title} href={href}>
                      <span className="th-product-icon">
                        <Icon size={23} />
                      </span>
                      <span>
                        <strong>{title}</strong>
                        <span>{description}</span>
                      </span>
                    </a>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const stories = [
  {
    title: "Find sources for a research brief",
    link: "#web-search",
    type: "Search",
    theme: "search",
    icon: SearchLg,
  },
  {
    title: "Read a specific web page",
    link: "#page-extraction",
    type: "Extraction",
    theme: "extract",
    icon: FileSearch02,
  },
  {
    title: "Trace a tool call in the dashboard",
    link: "#tool-review",
    type: "Review",
    theme: "review",
    icon: Activity,
  },
] as const;

function ExampleStories() {
  return (
    <section className="th-ruled th-story-section">
      <div className="th-wrap th-section">
        <h2>Try a sample workflow</h2>
        <div className="th-stories">
          {stories.map(({ title, link, type, theme, icon: Icon }) => (
            <a href={link} key={title}>
              <div
                className="th-story-art"
                data-theme={theme}
                aria-hidden="true"
              >
                <div>
                  <Icon size={35} />
                </div>
              </div>
              <div className="th-story-description">
                <span>{type}</span>
                <h3>{title}</h3>
                <ArrowUpRight size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function SetupDisclosure({
  label,
  children,
  open = false,
}: {
  label: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="th-setup-disclosure" open={open}>
      <summary>
        {label}
        <Plus size={16} />
      </summary>
      {children}
    </details>
  );
}

function Developers() {
  const [copyStatus, setCopyStatus] = useState("");
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(connectCommand);
      setCopyStatus("Command copied.");
    } catch {
      setCopyStatus("Select the command to copy it.");
    }
  }

  return (
    <section id="developers" className="th-ruled">
      <div className="th-wrap th-section th-developers">
        <div>
          <h2>Connect your agent</h2>
          <ul className="th-developer-list">
            <li>
              <Check size={16} />
              <div>
                <strong>One MCP connection</strong>
                <p>Register the bridge from a local checkout.</p>
              </div>
            </li>
            <li>
              <Check size={16} />
              <div>
                <strong>Structured tool calls</strong>
                <p>Hosts send the parameters for each chosen tool.</p>
              </div>
            </li>
            <li>
              <Check size={16} />
              <div>
                <strong>Call receipts</strong>
                <p>See requests and estimates in the dashboard.</p>
              </div>
            </li>
          </ul>
          <div className="th-actions">
            <Button asChild variant="brand" size="lg">
              <a href={dashboard}>
                Open dashboard <ArrowRight />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={catalog}>Browse tools</a>
            </Button>
          </div>
        </div>
        <div className="th-setup">
          <div className="th-setup-title">
            <TerminalSquare size={17} /> Local setup
          </div>
          <SetupDisclosure label="Build and start" open>
            <pre>
              <code>npm run build{"\n"}npm start</code>
            </pre>
          </SetupDisclosure>
          <SetupDisclosure label="Register the MCP bridge" open>
            <div className="th-terminal-command">
              <code>{connectCommand}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Copy MCP install command"
                onClick={copyCommand}
              >
                {copyStatus === "Command copied." ? <Check /> : <Copy01 />}
              </Button>
            </div>
            <p className="th-copy-status" role="status">
              {copyStatus}
            </p>
          </SetupDisclosure>
          <SetupDisclosure label="Open a fresh session">
            <p className="th-setup-note">
              Keep the server running and start a new chat in your MCP host so
              it can load the Two Hands tool registration.
            </p>
          </SetupDisclosure>
        </div>
      </div>
    </section>
  );
}

function Resources() {
  return (
    <section id="resources" className="th-ruled th-resources">
      <div className="th-wrap th-section">
        <h2>Start with the demo</h2>
        <p>
          Explore the workspace and its sample data before connecting your own
          agent.
        </p>
        <div className="th-resource-links">
          <a href={dashboard}>
            <strong>Dashboard</strong>
            <ArrowUpRight size={16} />
            <span>Explore tool calls and usage with sample data.</span>
          </a>
          <a href={catalog}>
            <strong>Tool catalog</strong>
            <ArrowUpRight size={16} />
            <span>Find providers and compare endpoint estimates.</span>
          </a>
          <a href="/#dashboard/keys">
            <strong>API keys</strong>
            <ArrowUpRight size={16} />
            <span>Try creating and revoking a scoped demo key.</span>
          </a>
          <a href="#developers">
            <strong>Setup</strong>
            <ArrowUpRight size={16} />
            <span>Register the MCP bridge in a local checkout.</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="th-ruled">
      <div className="th-wrap th-footer">
        <div>
          <Brand />
          <p>Tool routing for MCP hosts.</p>
        </div>
        <nav aria-label="Footer">
          <div>
            <h2>Platform</h2>
            <a href="#platform">How it works</a>
            <a href={catalog}>Tool catalog</a>
            <a href="#workflows">Workflows</a>
          </div>
          <div>
            <h2>Workspace</h2>
            <a href={dashboard}>Demo dashboard</a>
            <a href="/#login">Sign in</a>
          </div>
          <div>
            <h2>Developers</h2>
            <a href="#developers">MCP setup</a>
            <a href="#resources">Demo resources</a>
          </div>
        </nav>
      </div>
    </footer>
  );
}

function LandingPrototype() {
  return (
    <div className="th-landing">
      <a className="th-skip" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <ProviderGrid />
        <Architecture />
        <Workflows />
        <Products />
        <ExampleStories />
        <Developers />
        <Resources />
        <section className="th-close th-ruled" aria-labelledby="close-heading">
          <div className="th-wrap">
            <h2 id="close-heading">Give your agent more tools to work with.</h2>
            <Button asChild variant="brand" size="lg">
              <a href={dashboard}>
                Open dashboard <ArrowRight />
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<LandingPrototype />);
