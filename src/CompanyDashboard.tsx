import {
  ArrowRight,
  ArrowUpRight,
  BarChartSquare02,
  FileCheck02,
  Link01,
  RefreshCw01,
  Grid01,
  Activity,
  Building07,
  Users01,
  CheckCircle,
  Target04,
  LayersThree01,
  PuzzlePiece01,
} from "@untitledui/icons";
import type { CompanyInsights, ToolCompany } from "../server/company-types";
import { capabilityData } from "../server/provider-capability-data";
import { providerTools } from "../server/provider-identifiers";
import type { ProviderId } from "../server/types";
import { ProviderLogo } from "./components/shared";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Panel, InlineError } from "./observation-ui";
import "./company-dashboard.css";

const sections = [
  ["overview", "Overview", Grid01],
  ["activity", "Live usage", Activity],
  ["benchmarks", "Controlled tests", BarChartSquare02],
  ["plans", "Test plans", FileCheck02],
  ["integration", "Integration", Link01],
] as const;
export function companyDashboardSection(section: string) {
  return sections.some(([id]) => id === section) ? section : "overview";
}
export function companyDashboardLinks(
  id: string,
  section: string,
  registered: boolean,
  canManage: boolean,
) {
  return [
    ...sections.map(([value, label, icon]) => ({
      href: `#company/${id}/${value}`,
      label,
      selected: section === value,
      icon,
    })),
    ...(registered
      ? [
          {
            href: `#company/${id}/connectors`,
            label: "Connectors",
            selected: section === "connectors",
            icon: PuzzlePiece01,
          },
          {
            href: `#company/${id}/details`,
            label: "Company details",
            selected: section === "details",
            icon: Building07,
          },
        ]
      : []),
    ...(registered && canManage
      ? [
          {
            href: `#company/${id}/team`,
            label: "Company team",
            selected: section === "team",
            icon: Users01,
          },
        ]
      : []),
  ];
}
function EmptySection({
  title,
  children,
  icon = "usage",
}: {
  title: string;
  children: React.ReactNode;
  icon?: "usage" | "test" | "plan";
}) {
  const Icon =
    icon === "usage"
      ? BarChartSquare02
      : icon === "test"
        ? FileCheck02
        : Link01;
  return (
    <div className="company-dashboard-empty">
      <span className="company-empty-symbol">
        <Icon aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
function Usage({
  insights,
  loading,
  restricted,
}: {
  insights?: CompanyInsights;
  loading: boolean;
  restricted: boolean;
}) {
  const m =
    insights?.status === "available" &&
    insights.metrics &&
    insights.metrics.calls > 0
      ? insights.metrics
      : null;
  if (loading && !insights) return <p role="status">Loading recorded usage…</p>;
  if (!m)
    return (
      <EmptySection
        title={
          insights?.status === "available" && !restricted
            ? "No usage yet"
            : "No usage available yet"
        }
      >
        Recorded activity will appear here when it’s available.
      </EmptySection>
    );
  return (
    <>
      <div className="company-funnel">
        {[
          ["Offered to agents", m.offeredSessions],
          ["Used in a session", m.selectedSessions],
        ].map(([label, value]) => (
          <div className="company-funnel-row" key={label}>
            <div>
              <span>{label}</span>
              <strong>{Number(value).toLocaleString()}</strong>
            </div>
            <div className="company-bar-track">
              <span
                style={{
                  width: `${Math.min(100, m.offeredSessions ? (Number(value) / m.offeredSessions) * 100 : 0)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="company-call-summary">
        <span>
          <strong>{m.calls.toLocaleString()}</strong>{" "}
          {m.calls === 1 ? "completed call" : "completed calls"}
        </span>
        <span>
          <strong>{m.successfulCalls.toLocaleString()}</strong>{" "}
          {m.successfulCalls === 1 ? "successful call" : "successful calls"}
        </span>
      </div>
    </>
  );
}
function ControlledTests() {
  return (
    <EmptySection title="No controlled tests yet" icon="test">
      Completed tests and their evidence will appear here when they’re available
      to your company.
    </EmptySection>
  );
}
function TestPlans() {
  return (
    <EmptySection title="No test plans yet" icon="plan">
      Your hypotheses, planned changes, and success measures will appear here.
      No runs have been scheduled.
    </EmptySection>
  );
}
export function CompanyDashboard({
  id,
  name,
  providerId,
  company,
  section,
  insights,
  loading,
  error,
  refresh,
  companies = [],
}: {
  id: string;
  name: string;
  providerId: ProviderId | null;
  company?: ToolCompany;
  section: string;
  insights?: CompanyInsights;
  loading: boolean;
  error: string;
  refresh: () => void;
  companies?: Pick<ToolCompany, "id" | "name">[];
}) {
  const tool = Object.entries(providerTools).find(
    ([, provider]) => provider === providerId,
  )?.[0] as keyof typeof capabilityData | undefined;
  const capability = tool ? capabilityData[tool] : undefined;
  const tab = companyDashboardSection(section);
  const metrics = insights?.status === "available" ? insights.metrics : null;
  const restricted =
    !!company && (company.status !== "approved" || !company.insightsEnabled);
  const status = company
    ? {
        pending: "Under review",
        approved: "Approved",
        rejected: "Changes requested",
        suspended: "Access suspended",
      }[company.status]
    : "Provider preview";
  const statusNote =
    company?.status === "pending"
      ? "Company review pending"
      : insights?.status === "awaiting_release"
        ? "Shared data access pending"
        : "";
  const percent = (value: number, total: number) =>
    total ? `${Math.round((value / total) * 100)}%` : "—";
  const pageDescriptions: Record<string, [string, string]> = {
    overview: [
      `${name} dashboard`,
      "Understand how agents discover, use, and evaluate your tool.",
    ],
    activity: [
      "Live usage",
      "Follow your tool from discovery to completed requests.",
    ],
    benchmarks: [
      "Controlled tests",
      "Compare changes with consistent cases and reviewed evidence.",
    ],
    plans: ["Test plans", "Turn a hypothesis into a change you can measure."],
    integration: [
      "Integration",
      "See the tool information available to agents.",
    ],
  };
  const [pageTitle, pageDescription] = pageDescriptions[tab];
  const metricCards = (
    <div className="company-metric-grid" aria-label="Recorded usage summary">
      {[
        [
          "Selected when offered",
          metrics
            ? percent(metrics.selectedSessions, metrics.offeredSessions)
            : "—",
          metrics
            ? `${metrics.selectedSessions.toLocaleString()} of ${metrics.offeredSessions.toLocaleString()} sessions`
            : "No usage available yet",
          BarChartSquare02,
        ],
        [
          "Requests succeeded",
          metrics ? percent(metrics.successfulCalls, metrics.calls) : "—",
          metrics
            ? `${metrics.successfulCalls.toLocaleString()} of ${metrics.calls.toLocaleString()} completed calls`
            : "No completed requests available",
          CheckCircle,
        ],
        [
          "Sessions using your tool",
          metrics ? metrics.selectedSessions.toLocaleString() : "—",
          "Recorded agent selections",
          Users01,
        ],
        [
          "Completed requests",
          metrics ? metrics.calls.toLocaleString() : "—",
          "Organic tool activity",
          Activity,
        ],
      ].map(([label, value, detail, Icon]) => {
        const MetricIcon = Icon as typeof Activity;
        return (
          <div className="company-metric" key={String(label)}>
            <h2>
              {String(label)}
              <MetricIcon aria-hidden="true" />
            </h2>
            <strong>{String(value)}</strong>
            <p>{String(detail)}</p>
          </div>
        );
      })}
    </div>
  );
  const Integration = ({ full = false }: { full?: boolean }) => (
    <div
      className={`company-capability${full ? " company-capability-full" : ""}`}
    >
      <code>{tool || company?.toolName || "Integration not linked"}</code>
      <p>
        {capability?.description ||
          company?.description ||
          "Your tool’s description and supported operations will appear here."}
      </p>
      {capability && (
        <>
          <strong>When agents use it</strong>
          <p>{capability.useWhen}</p>
          <a
            href={capability.documentationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Provider documentation <ArrowUpRight />
          </a>
          {full && (
            <div className="company-request-defaults">
              <h3 className="company-dashboard-subheading">Request defaults</h3>
              <dl className="company-dashboard-defaults">
                {Object.entries(capability.adapter).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
              <details className="company-dashboard-limitations">
                <summary>Integration limitations</summary>
                <p>{capability.limitations}</p>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
  return (
    <div
      className="provider-page company-page company-dashboard"
      data-company-section={tab}
    >
      <div className="page-heading company-heading">
        <div>
          <div className="company-title">
            <h1>{pageTitle}</h1>
          </div>
          <p>{pageDescription}</p>
        </div>
        <div className="company-dashboard-actions">
          {companies.length > 1 && (
            <label className="company-dashboard-company">
              Company
              <select
                aria-label="Current company"
                value={id}
                onChange={(e) => {
                  location.hash = `company/${e.target.value}/${tab}`;
                }}
              >
                {companies.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            variant="outline"
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh company dashboard"
          >
            <RefreshCw01
              className={loading ? "company-refreshing" : undefined}
            />
            Refresh
          </Button>
        </div>
      </div>
      <div className="company-identity-strip">
        <div>
          {providerId ? (
            <ProviderLogo
              provider={providerId}
              className={`company-logo company-logo-${providerId}`}
              size={24}
            />
          ) : (
            <Building07 aria-hidden="true" />
          )}
          <strong>{name}</strong>
          <span className="company-identity-divider" />
          <span>
            {providerId
              ? company?.toolName || tool || "Tool integration"
              : "Company registration"}
          </span>
        </div>
        <Badge variant="secondary">
          <span className="company-status-dot" />
          {status}
        </Badge>
      </div>
      <InlineError message={error} />
      {statusNote && (
        <p className="company-dashboard-context">
          {statusNote}
          {company && (
            <>
              {" "}
              · <a href={`#company/${id}/details`}>View company details</a>
            </>
          )}
        </p>
      )}
      {tab === "overview" && (
        <>
          {metricCards}
          <div className="company-main-grid">
            <Panel
              title="From discovery to use"
              description="Recorded organic activity"
              action={
                <a
                  className="company-dashboard-card-link"
                  href={`#company/${id}/activity`}
                  aria-label="View live usage"
                >
                  <ArrowUpRight />
                </a>
              }
            >
              <Usage
                insights={insights}
                loading={loading}
                restricted={restricted}
              />
            </Panel>
            <Panel
              title="What the agent sees"
              description="Your tool’s current description and capabilities"
              action={
                <a
                  className="company-dashboard-card-link"
                  href={`#company/${id}/integration`}
                  aria-label="View integration"
                >
                  <ArrowUpRight />
                </a>
              }
            >
              <Integration />
            </Panel>
          </div>
          <div className="company-main-grid">
            <Panel
              title="Controlled tests"
              description="Execution and evidence from controlled comparisons"
              action={
                <a
                  className="company-dashboard-card-link"
                  href={`#company/${id}/benchmarks`}
                  aria-label="View controlled tests"
                >
                  <ArrowUpRight />
                </a>
              }
            >
              <ControlledTests />
            </Panel>
            <Panel
              title="Test plans"
              description="A place to track what you want to learn next"
              action={
                <a
                  className="company-dashboard-card-link"
                  href={`#company/${id}/plans`}
                  aria-label="View test plans"
                >
                  <ArrowUpRight />
                </a>
              }
            >
              <TestPlans />
            </Panel>
          </div>
          <Panel
            title="What to review next"
            description="Start with your integration, then use evidence to guide changes."
          >
            <div className="company-dashboard-review">
              {[
                [
                  "Describe the right use case",
                  "Check that agents can tell when your tool fits the task.",
                  "integration",
                ],
                [
                  "Understand actual selection",
                  "Review discovery and usage together as activity becomes available.",
                  "activity",
                ],
                [
                  "Compare a measured baseline",
                  "Keep test cases and evaluation criteria consistent across changes.",
                  "benchmarks",
                ],
              ].map(([title, detail, destination]) => (
                <a href={`#company/${id}/${destination}`} key={title}>
                  <div>
                    <strong>{title}</strong>
                    <p>{detail}</p>
                  </div>
                  <ArrowRight />
                </a>
              ))}
            </div>
          </Panel>
        </>
      )}
      {tab === "activity" && (
        <>
          {metricCards}
          <Panel
            title="Live usage"
            description="Recorded organic activity for your tool"
          >
            <Usage
              insights={insights}
              loading={loading}
              restricted={restricted}
            />
            <div className="company-data-note">
              <LayersThree01 aria-hidden="true" />
              <p>
                Based on eligible activity recorded through Two Hands. A
                successful request records execution, not the quality of the
                agent’s final answer.
              </p>
            </div>
          </Panel>
        </>
      )}
      {tab === "benchmarks" && (
        <>
          <Panel
            className="company-full-empty"
            title="Controlled tests"
            description="Compare execution, response time, and returned evidence"
          >
            <ControlledTests />
          </Panel>
          <Panel title="Keep comparisons useful">
            <div className="company-dashboard-method">
              <div>
                <strong>Use the same cases</strong>
                <p>Compare like-for-like tasks and settings.</p>
              </div>
              <div>
                <strong>Review the evidence</strong>
                <p>
                  A successful request alone does not measure answer quality.
                </p>
              </div>
              <div>
                <strong>Document the change</strong>
                <p>Make the baseline and follow-up easy to compare.</p>
              </div>
            </div>
          </Panel>
        </>
      )}
      {tab === "plans" && (
        <>
          <Panel
            className="company-full-empty"
            title="Test plans"
            description="Document a hypothesis, a change, and a way to measure it"
          >
            <TestPlans />
          </Panel>
          <Panel title="A useful plan starts with a clear question">
            <div className="company-dashboard-method">
              <div>
                <Target04 aria-hidden="true" />
                <strong>Define the hypothesis</strong>
                <p>Identify the behavior you want to understand or improve.</p>
              </div>
              <div>
                <Link01 aria-hidden="true" />
                <strong>Describe one change</strong>
                <p>Keep the integration or description change specific.</p>
              </div>
              <div>
                <BarChartSquare02 aria-hidden="true" />
                <strong>Choose a success measure</strong>
                <p>Use the same cases and criteria before and after.</p>
              </div>
            </div>
          </Panel>
        </>
      )}
      {tab === "integration" && (
        <Panel
          title="What the agent sees"
          description="Current tool metadata and request defaults"
        >
          <Integration full />
        </Panel>
      )}
    </div>
  );
}
