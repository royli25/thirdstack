import { lazy, Suspense, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Copy01,
  CurrencyDollar,
  FileCheck02,
  Link01,
  Menu01,
  SearchLg,
  SwitchHorizontal01,
} from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { routerNoise, buildNoise, setupNoise } from "./shake-art";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@fontsource-variable/hubot-sans/wdth.css";
import "@/theme.css";
import "@/design-system.css";
import "./dashboard.css";
import "./shake.css";

const DevToolbar = import.meta.env.DEV
  ? lazy(() =>
      import("agentation").then(({ Agentation }) => ({ default: Agentation })),
    )
  : null;
const assets = import.meta.glob<string>("./assets/shake/*", {
  eager: true,
  query: "?url",
  import: "default",
});
const asset = (name: string) => assets[`./assets/shake/${name}`];
const logos = [
  ["Claude", "imgLogo.svg"],
  ["Codex", "imgLogo1.png"],
  ["Cursor", "imgLogo2.svg"],
  ["Exa", "imgLogoExa.svg"],
  ["Tavily", "imgLogo3.svg"],
  ["Firecrawl", "imgLogo4.png"],
  ["Brave", "imgLogo5.png"],
  ["Parallel", "imgLogo6.svg"],
  ["Jina Reader", "imgLogo7.png"],
  ["Perplexity", "imgGroup2.svg"],
  ["Serper", "imgLogo8.png"],
  ["Linkup", "imgLogo9.png"],
  ["Browserbase", "imgLogo10.svg"],
] as const;
const nav = [
  ["Product", "product"],
  ["Catalog", "catalog"],
  ["Use cases", "use-cases"],
  ["Developers", "developers"],
  ["FAQ", "faq"],
] as const;
const features = [
  {
    id: "discover",
    name: "Discover",
    title: "Find every tool that fits the task",
    body: "Your agent describes the operation and the need. Two Hands returns the compatible tools across the whole catalog, so it never has to know every provider by name.",
    checks: [
      "Search and extraction in one catalog",
      "Compatible tools only",
      "One call: discover_tools",
    ],
  },
  {
    id: "estimate",
    name: "Estimate",
    title: "Know the estimate before the call",
    body: "Every offered tool includes a configured per-call estimate. Your agent can compare options before making a choice.",
    checks: [
      "Per-call estimates alongside each tool",
      "Compare compatible providers",
      "Estimates stay separate from reconciled charges",
    ],
  },
  {
    id: "choose",
    name: "Choose",
    title: "Your agent makes the call",
    body: "The agent chooses the tool that fits your request and states its reason. Two Hands records that explanation as agent-reported.",
    checks: [
      "Your agent chooses the provider",
      "An explicit, recorded selection",
      "No silent switching",
    ],
  },
  {
    id: "record",
    name: "Record",
    title: "Follow the answer back to the call",
    body: "Keep the request, chosen provider, estimate, and returned evidence together. Revisit what ran in your dashboard.",
    checks: [
      "A record of each tool call",
      "Returned evidence attached",
      "Observed events and agent reports stay distinct",
    ],
  },
] as const;
const catalogRows = [
  ["Exa", "imgLogoExa.svg", "exa_search", "$0.007"],
  ["Tavily", "imgLogo12.svg", "tavily_search", "$0.008"],
  ["Brave", "imgLogo5.png", "brave_search", "$0.005"],
  ["Parallel", "imgLogo13.svg", "parallel_search", "$0.005"],
  ["Perplexity", "imgGroup3.svg", "perplexity_search", "$0.005"],
] as const;
const questions = [
  [
    "Which agents work with Two Hands?",
    "Any MCP-compatible host. Claude, Codex, and Cursor are the ones we test against most.",
  ],
  [
    "Does Two Hands pick the provider?",
    "No. It returns the compatible tools with their estimates. Your agent chooses and states why, and that choice is recorded as agent-reported.",
  ],
  [
    "How are costs shown?",
    "Every tool carries a configured per-call estimate. Estimates, provider-reported amounts, and reconciled charges are kept separate.",
  ],
  [
    "What ends up in the dashboard?",
    "Each session’s goal, the tools that were offered, the calls your agent made, and the evidence that came back.",
  ],
] as const;
const cases = [
  [
    "Research briefs",
    "Find primary sources and cite the pages they came from.",
    "  ┌─────┐\n  │ src │──▶ brief\n  └─────┘\n   ×3 cited",
  ],
  [
    "Competitive analysis",
    "Track competitor pages, pricing, and launches across the web.",
    " A ███████▌\n B ████▌\n C ██████████",
  ],
  [
    "Docs Q&A",
    "Pull readable content from public documentation and answer from it.",
    " GET /docs\n → markdown\n → answer ✓",
  ],
  [
    "Price monitoring",
    "Extract the same pages on a schedule and compare what changed.",
    " $ 129 → 119\n $  49 →  49\n $  12 →  15 ▲",
  ],
  [
    "News digests",
    "Search recent coverage and summarize it with links back.",
    " ● 09:00 search\n ● 09:01 extract ×6\n ● 09:02 digest",
  ],
  [
    "Fact checking",
    "Check a draft’s claims against sources, with evidence attached.",
    " claim  ✓ sourced\n claim  ✓ sourced\n claim  ? needs src",
  ],
] as const;
const setupSteps = [
  ["npm run build && npm start", "Run the Two Hands server"],
  ["npm run mcp:install", "Register the MCP bridge"],
  ["new chat", "Open a fresh session in your host"],
  ["ask away", "Your agent finds the catalog on its own"],
] as const;

function Logo({ src, size = 22 }: { src: string; size?: number }) {
  return (
    <img
      className={`shake-logo ${src.startsWith("imgGroup") ? "shake-flipped-logo" : ""}`}
      src={asset(src)}
      alt=""
      width={size}
      height={size}
    />
  );
}
function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a href="#top" aria-label="Two Hands home">
      <img
        className="shake-brand"
        src={brand}
        alt="Two Hands"
        width={footer ? 140 : 128}
        height={footer ? 31 : 28}
      />
    </a>
  );
}
function Band() {
  return (
    <div className="shake-band" aria-hidden="true">
      <img src={asset("imgLines1.svg")} alt="" />
    </div>
  );
}
function Frame({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`shake-section ${className}`}>
      <div className="shake-frame">{children}</div>
    </section>
  );
}
function Action({
  children = "Connect now",
  onClick,
  blue = false,
  className = "",
}: {
  children?: ReactNode;
  onClick: () => void;
  blue?: boolean;
  className?: string;
}) {
  return (
    <Button
      variant={blue ? "brand" : "default"}
      onClick={onClick}
      className={`shake-action ${className}`}
    >
      {children}
      <ArrowUpRight size={16} />
    </Button>
  );
}
function Checklist({ items }: { items: readonly string[] }) {
  return (
    <ul className="shake-checks">
      {items.map((item) => (
        <li key={item}>
          <span>
            <Check size={13} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
function Schemas() {
  const cards = [
    [
      "Exa",
      "imgLogoExa.svg",
      '{ "results": [{ "url", "text", "highlights" }] }',
    ],
    [
      "Tavily",
      "imgLogo11.svg",
      '{ "answer", "results": [{ "content", "score" }] }',
    ],
    [
      "Serper",
      "imgLogo8.png",
      '{ "organic": [{ "link", "snippet", "position" }] }',
    ],
    ["Firecrawl", "imgLogo4.png", '{ "data": { "markdown", "metadata" } }'],
  ];
  return (
    <div className="shake-schema-art">
      <div className="shake-schemas">
        {cards.map(([name, logo, schema]) => (
          <div className="shake-schema" key={name}>
            <div>
              <Logo src={logo} size={16} />
              <strong>{name}</strong>
              <span>its own key · its own schema</span>
            </div>
            <code>{schema}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
function Router() {
  return (
    <div className="shake-router-art">
      <div className="shake-router-scene">
        <pre className="shake-router-noise" aria-hidden="true">
          {routerNoise}
        </pre>
        <div className="shake-sources">
          {[
            ["Search", "7", "Exa · Tavily · Brave · Parallel …"],
            [
              "Extraction",
              "4",
              "Firecrawl · Jina Reader · Parallel Extract · Browserbase",
            ],
          ].map(([title, count, body]) => (
            <div key={title}>
              <strong>{title}</strong>
              <small>{count}</small>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <div className="shake-router-card">
          <div className="shake-router-title">
            <img src={brandMark} alt="" width={24} height={24} />
            Two Hands router
          </div>
          <div className="shake-router-field">
            <small>Operation</small>search
          </div>
          <div className="shake-router-field">
            <small>Need</small>primary sources, with page text
          </div>
          <div className="shake-router-split">
            <div className="shake-router-field">
              <small>Offered</small>3 tools
            </div>
            <div className="shake-router-field">
              <small>Agent’s pick</small>
              <span>
                <Logo src="imgLogoExa.svg" size={16} />
                Exa · $0.007
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function CatalogVisual({ feature }: { feature: string }) {
  if (feature === "record")
    return (
      <div className="shake-catalog-card shake-record">
        <span className="shake-sample">Sample call record</span>
        <div className="shake-record-head">
          <CheckCircle size={18} />
          Tool call completed
        </div>
        {[
          ["Tool", "exa_search"],
          ["Provider", "Exa"],
          ["Estimate", "$0.007"],
          ["Evidence", "3 source pages"],
        ].map(([label, value]) => (
          <div className="shake-catalog-row" key={label}>
            <span>{label}</span>
            <code>{value}</code>
          </div>
        ))}
        <p>Request, selection, and returned evidence in one place.</p>
      </div>
    );
  return (
    <div className="shake-catalog-card">
      <div className="shake-search-pill">
        <SearchLg size={13} />
        <code>
          {feature === "discover"
            ? "search · “primary sources, page text”"
            : feature === "estimate"
              ? "Configured estimates · sample data"
              : "Agent-reported choice · sample"}
        </code>
      </div>
      {catalogRows.map(([name, logo, tool, estimate]) => (
        <div
          className={`shake-catalog-row ${feature === "choose" && name === "Exa" ? "shake-picked" : ""}`}
          key={name}
        >
          <Logo src={logo} size={18} />
          <strong>{name}</strong>
          <code>{feature === "estimate" ? estimate : tool}</code>
          {feature === "choose" && name === "Exa" && <Check size={14} />}
        </div>
      ))}
      {feature === "choose" && (
        <p>“The task needs source-page text alongside search results.”</p>
      )}
    </div>
  );
}
function Landing() {
  const [connectOpen, setConnectOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const connect = () => setConnectOpen(true);
  async function copyCommand() {
    try {
      await navigator.clipboard.writeText("npm run mcp:install");
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <div className="shake-landing" id="top">
      <a className="shake-skip" href="#main">
        Skip to content
      </a>
      <div className="shake-announcement">
        One connection for your agent’s tools, estimates, and call records.
      </div>
      <header className="shake-header">
        <div className="shake-frame shake-nav">
          <Brand />
          <nav aria-label="Main navigation" data-open={mobileNav}>
            {nav.map(([label, id]) => (
              <a href={`#${id}`} key={id} onClick={() => setMobileNav(false)}>
                {label}
              </a>
            ))}
          </nav>
          <div className="shake-nav-actions">
            <Button variant="secondary" size="sm" asChild>
              <a href="/#login">Sign in</a>
            </Button>
            <Button size="sm" onClick={connect}>
              Connect now
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shake-menu"
            aria-label="Toggle navigation"
            aria-expanded={mobileNav}
            onClick={() => setMobileNav(!mobileNav)}
          >
            <Menu01 />
          </Button>
        </div>
      </header>
      <main id="main">
        <Frame className="shake-hero">
          <div className="shake-hero-copy">
            <div>
              <span className="shake-chip">
                <span />
                One connection. Every tool.
              </span>
              <h1>You build the product, we handle the agent tools.</h1>
            </div>
            <div className="shake-hero-bottom">
              <p>
                One wallet for your agents to pay for any API or service. Built
                for developers and enterprise.
              </p>
              <div className="shake-hero-actions">
                <Action onClick={connect} blue>
                  Create account
                </Action>
                <Button className="shake-action" variant="secondary" asChild>
                  <a href="/#dashboard/tools">Explore tools</a>
                </Button>
              </div>
            </div>
          </div>
        </Frame>
        <Frame className="shake-logos">
          <div className="shake-built">
            <span>Built for:</span>
            <div className="shake-agent-marks">
              {[
                "imgLogoCodex.png",
                "imgLogoClaudeCode.png",
                "imgLogoGrokBot.png",
                "imgLogoAntigravity.png",
              ].map((src) => (
                <Logo key={src} src={src} size={28} />
              ))}
            </div>
            <span>MCP-compatible agents.</span>
          </div>
          <div className="shake-logo-grid">
            {logos.map(([name, logo]) => (
              <div key={name}>
                <Logo src={logo} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </Frame>
        <Band />
        <Frame id="product" className="shake-problem">
          <div className="shake-intro">
            <div>
              <h2>
                Your agent is stitching together tools that don’t agree.{" "}
                <span>One connection brings them together.</span>
              </h2>
              <p>
                Every provider has its own keys, its own response shape, and its
                own pricing page. Your agent ends up spending its effort on
                plumbing instead of the question.
              </p>
            </div>
          </div>
          <Schemas />
          <div className="shake-problem-foot">
            <p>
              Juggling providers means someone is always fixing something. A
              changed response format breaks a parser. A missing estimate turns
              into a surprise bill. A provider outage stalls the task, and
              nobody can say afterwards which tool returned what.
            </p>
          </div>
        </Frame>
        <Frame className="shake-solution">
          <div className="shake-intro">
            <div>
              <h2>One router between your agent and every tool</h2>
              <p>
                Two Hands gives your agent one place to find, compare, call, and
                record its tools.
              </p>
            </div>
          </div>
          <Router />
          <div className="shake-solution-foot">
            <p>
              Two Hands puts 7 search tools and 4 extraction tools behind one
              MCP server. Your agent describes what it needs, gets back the
              tools that fit with their estimates, chooses one, and says why.
              Every call is recorded with the evidence it returned.
            </p>
            <Action
              blue
              onClick={() => {
                document
                  .getElementById("catalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              See Two Hands in action
            </Action>
          </div>
          <div className="shake-stats">
            {[
              [
                Link01,
                "One connection",
                "A single MCP server for every compatible host",
              ],
              [
                CurrencyDollar,
                "Per-call estimates",
                "Configured estimates before your agent spends anything",
              ],
              [
                Check,
                "Agent-chosen",
                "Your agent picks the tool and states a reason",
              ],
              [
                FileCheck02,
                "Call records",
                "Request, provider, estimate, and evidence, saved",
              ],
              [
                SwitchHorizontal01,
                "No silent switching",
                "Two Hands never reroutes a call behind your agent’s back",
              ],
            ].map(([Icon, title, body]) => {
              const StatIcon = Icon as typeof Link01;
              return (
                <div key={String(title)}>
                  <span className="shake-stat-icon">
                    <StatIcon size={18} />
                  </span>
                  <h3>{String(title)}</h3>
                  <p>{String(body)}</p>
                </div>
              );
            })}
          </div>
        </Frame>
        <Band />
        <Frame className="shake-build">
          <pre aria-hidden="true">{buildNoise}</pre>
          <h2>What would you build if your agent could reach every tool?</h2>
          <div className="shake-typer">
            A weekly news digest
            <span aria-hidden="true" />
          </div>
        </Frame>
        <Band />
        <Frame id="catalog" className="shake-features">
          <div className="shake-feature-intro">
            <h2>
              The parts of a tool call your agent shouldn’t have to rebuild
            </h2>
            <div>
              <Checklist
                items={[
                  "Discover, estimate, choose, and record through one connection",
                  "Focus on the answer, not on provider plumbing",
                ]}
              />
              <Action blue onClick={connect} />
            </div>
          </div>
          <Tabs defaultValue="discover" className="shake-tabs">
            <TabsList
              className="shake-tab-list"
              aria-label="Parts of a tool call"
            >
              {features.map((f) => (
                <TabsTrigger
                  className={`shake-tab shake-tab-${f.id}`}
                  key={f.id}
                  value={f.id}
                >
                  <span />
                  {f.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {features.map((f) => (
              <TabsContent key={f.id} value={f.id} className="shake-tab-panel">
                <div className="shake-feature-copy">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  <Checklist items={f.checks} />
                </div>
                <div className="shake-feature-visual">
                  <CatalogVisual feature={f.id} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Frame>
        <Frame id="developers" className="shake-setup">
          <pre aria-hidden="true">{setupNoise}</pre>
          <div className="shake-setup-copy">
            <h2>
              Give your agent the whole catalog <span>today.</span>
            </h2>
            <Action blue onClick={connect} />
          </div>
          <div className="shake-steps-wrap">
            <p>
              Four steps from a fresh checkout to an agent that can search and
              extract.
            </p>
            <div className="shake-steps">
              {setupSteps.map(([command, body], i) => (
                <div key={command}>
                  <small>0{i + 1}</small>
                  <code>{command}</code>
                  <p>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Frame>
        <Frame id="use-cases" className="shake-use-cases">
          <div className="shake-use-intro">
            <h2>What teams use Two Hands for</h2>
            <p>
              From research briefs to price monitoring: any task where your
              agent needs to search the web or read a page, and you need to know
              what it used.
            </p>
          </div>
          <div className="shake-case-grid">
            {cases.map(([title, body, art]) => (
              <article key={title}>
                <pre aria-hidden="true">{art}</pre>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <Action className="shake-bar-action" onClick={connect} />
        </Frame>
        <Band />
        <Frame id="faq" className="shake-faq">
          <h2>Questions teams ask first</h2>
          <Accordion
            type="single"
            collapsible
            defaultValue="question-0"
            className="shake-questions"
          >
            {questions.map(([question, answer], i) => (
              <AccordionItem key={question} value={`question-${i}`}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Frame>
      </main>
      <footer className="shake-footer">
        <div className="shake-frame">
          <div className="shake-footer-top">
            <div>
              <Brand footer />
              <p>The agent stack for the future.</p>
            </div>
            <nav aria-label="Product links">
              <h3>Product</h3>
              <a href="#product">How it works</a>
              <a href="/#dashboard/tools">Catalog</a>
              <a href="/#dashboard">Dashboard</a>
            </nav>
            <nav aria-label="Developer links">
              <h3>Developers</h3>
              <a href="#developers">MCP setup</a>
              <a href="#faq">FAQ</a>
              <a href="/#login">Sign in</a>
            </nav>
          </div>
          <div className="shake-footer-base">
            <span>© 2026 Two Hands</span>
            <span>Draft · not production</span>
          </div>
        </div>
      </footer>
      <Dialog
        open={connectOpen}
        onOpenChange={(open) => {
          setConnectOpen(open);
          setCopied(false);
          setCopyError(false);
        }}
      >
        <DialogContent className="shake-connect-dialog">
          <DialogHeader>
            <DialogTitle>Connect your agent to Two Hands</DialogTitle>
            <DialogDescription>
              This prototype previews the setup. Use the local project to
              register the MCP bridge with your agent.
            </DialogDescription>
          </DialogHeader>
          <div className="shake-command">
            <code>npm run mcp:install</code>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={copied ? "Command copied" : "Copy setup command"}
              onClick={copyCommand}
            >
              {copied ? <Check /> : <Copy01 />}
            </Button>
          </div>
          <p role="status" className="shake-copy-status">
            {copyError
              ? "Copy wasn’t available. Select the command above to copy it."
              : copied
                ? "Command copied."
                : "Run from the project directory, then start a new chat in your MCP host."}
          </p>
          <Button asChild>
            <a href="/#dashboard">
              Explore the demo dashboard
              <ArrowRight size={16} />
            </a>
          </Button>
        </DialogContent>
      </Dialog>
      {DevToolbar && (
        <Suspense fallback={null}>
          <DevToolbar endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Landing />);
