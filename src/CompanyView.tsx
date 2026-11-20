import {
  isProviderId,
  providerEntry,
  toolForProvider,
} from "../server/provider-catalog";
import { ProviderLogo } from "./components/shared";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  FileCheck02,
  BarChartSquare02,
  Link01,
} from "@untitledui/icons";
import { api, money } from "./api";
import { ProviderComparison } from "./ProviderComparison";
import { ProviderActivityView } from "./ProviderActivityView";
import { SellerChoicesView } from "./SellerChoicesView";
import { SellerListingView } from "./SellerListingView";
import { Panel, InlineError, StateBadge, date } from "./observation-ui";
import {
  BenchmarkTable,
  providerNames,
  type LabOverview,
} from "./ProviderLabView";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import type { CompanyReport, Opportunity } from "../server/company-insights";
import type { ProviderId } from "../server/types";
import type { Experiment, LabRun } from "../server/provider-lab-types";

const demoPlansKey = "apilayer-company-demo-plans-v1";
function readDemoPlans(): Experiment[] {
  try {
    const data = JSON.parse(localStorage.getItem(demoPlansKey) || "[]");
    return Array.isArray(data)
      ? data
          .filter(
            (p) =>
              p &&
              typeof p.id === "string" &&
              isProviderId(p.provider) &&
              ["planned", "testing", "reviewed"].includes(p.status) &&
              ["retrieval", "agent_choice", "integration"].includes(
                p.verification,
              ) &&
              [
                "title",
                "hypothesis",
                "change",
                "successMeasure",
                "conclusion",
                "createdAt",
                "updatedAt",
              ].every((key) => typeof p[key] === "string"),
          )
          .slice(0, 100)
      : [];
  } catch {
    return [];
  }
}
const percent = (a: number, b: number) =>
  b ? `${Math.round((a / b) * 100)}%` : "—";
const displayVerification = {
  retrieval: "Controlled retrieval test",
  agent_choice: "External agent comparison",
  integration: "Integration test",
};

export function CompanyView({
  provider,
  section,
}: {
  provider: ProviderId;
  section: string;
}) {
  const [source, setSource] = useState<"demo" | "local">(() => {
    try {
      return sessionStorage.getItem("apilayer-company-source") === "local"
        ? "local"
        : "demo";
    } catch {
      return "demo";
    }
  });
  const [report, setReport] = useState<CompanyReport>();
  const [lab, setLab] = useState<LabOverview>();
  const [error, setError] = useState("");
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [plan, setPlan] = useState<Partial<Experiment> | null>(null);
  const [demoPlans, setDemoPlans] = useState<Experiment[]>(readDemoPlans);
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const current = useRef(0);
  const tab = [
    "benchmarks",
    "plans",
    "activity",
    "choices",
    "listing",
  ].includes(section)
    ? section
    : "overview";
  useEffect(() => {
    const generation = ++current.current;
    let timer: ReturnType<typeof setTimeout>;
    setReport(undefined);
    setLab(undefined);
    setError("");
    setOpportunity(null);
    setPlan(null);
    const refresh = () =>
      Promise.all([
        api<CompanyReport>(
          `/company-insights/${provider}?source=${source}&scope=account`,
        ),
        source === "local"
          ? api<LabOverview>("/provider-lab")
          : Promise.resolve(undefined),
      ])
        .then(([r, l]) => {
          if (current.current === generation) {
            setReport(r);
            setLab(l);
            setError("");
          }
        })
        .catch((e) => {
          if (current.current === generation) {
            setError((e as Error).message);
            setReport(undefined);
            setLab(undefined);
          }
        })
        .finally(() => {
          if (current.current === generation) timer = setTimeout(refresh, 5000);
        });
    void refresh();
    return () => {
      current.current++;
      clearTimeout(timer);
    };
  }, [provider, source, revision]);
  const metric = report?.benchmarks.find((m) => m.provider === provider);
  const organic = report?.privateActivity ?? report?.organic;
  const plans = (
    source === "demo" ? demoPlans : (lab?.experiments ?? [])
  ).filter((p) => p.provider === provider);
  function newPlan(o?: Opportunity) {
    setOpportunity(null);
    setPlan({
      provider,
      verification: o?.verification ?? "retrieval",
      title: o?.title ?? "",
      hypothesis: o?.hypothesis ?? "",
      change: o?.action ?? "",
      successMeasure: o?.successMeasure ?? "",
      status: "planned",
      baselineRunId:
        source === "local" && (!o || o.verification !== "agent_choice")
          ? (report?.benchmarkRunId ?? null)
          : null,
      followupRunId: null,
      conclusion: "",
    });
  }
  async function savePlan(value: Record<string, unknown>) {
    const generation = current.current;
    if (source === "demo") {
      const at = new Date().toISOString();
      const saved = {
        ...value,
        id: plan?.id ?? crypto.randomUUID(),
        createdAt: plan?.createdAt ?? at,
        updatedAt: at,
      } as Experiment;
      const next = [saved, ...demoPlans.filter((p) => p.id !== saved.id)].slice(
        0,
        100,
      );
      localStorage.setItem(demoPlansKey, JSON.stringify(next));
      setDemoPlans(next);
      setNotice(
        "Demo test plan saved in this browser. No provider request was made.",
      );
    } else {
      await api(
        `/provider-lab/experiments${plan?.id ? `/${plan.id}` : ""}`,
        value,
      );
      if (current.current !== generation) return;
      setRevision((v) => v + 1);
      setNotice(
        "Test plan saved. Run a separate test after making the documented change.",
      );
    }
    setPlan(null);
    location.hash = `company/${provider}/plans`;
  }
  return (
    <div className="provider-page company-page">
      <div className="page-heading company-heading">
        <div>
          <div className="company-title">
            <ProviderLogo
              provider={provider}
              className={`company-logo company-logo-${provider}`}
              size={32}
            />
            <h1>{providerNames[provider]} insights</h1>
          </div>
          <p>See where agents choose your tool—and what to improve next.</p>
        </div>
        <div className="company-controls">
          <div>
            <Label htmlFor="company-provider">Tool company</Label>
            <Select
              value={provider}
              onValueChange={(p) => {
                location.hash = `company/${p}/${tab}`;
              }}
            >
              <SelectTrigger id="company-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(providerNames).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="company-source">Data source</Label>
            <Select
              value={source}
              onValueChange={(v) => {
                setSource(v as typeof source);
                try {
                  sessionStorage.setItem("apilayer-company-source", v);
                } catch {
                  /* Current view remains usable without storage. */
                }
              }}
            >
              <SelectTrigger id="company-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Demo data</SelectItem>
                <SelectItem value="local">Local lab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="company-source-banner">
        <span className="provider-monogram">
          <BarChartSquare02 />
        </span>
        <div>
          <strong>
            {source === "demo"
              ? "A preview of the tool company experience"
              : "Your local provider evidence"}
          </strong>
          <p>
            {source === "demo"
              ? "All metrics below are simulated to demonstrate the workflow. No customer results or paid-provider outcomes are implied."
              : "Your account activity is visible below, including small samples. Controlled tests are shown separately. Sessions contribute to commercial aggregates from the first eligible activity. Publishing requires a separate release."}
          </p>
        </div>
        <Badge variant="outline">
          {source === "demo" ? "Demo data" : "Local preview"}
        </Badge>
      </div>
      <InlineError message={error} />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {!report && !error && <p role="status">Loading provider insights…</p>}
      {report && (
        <Tabs
          value={tab}
          onValueChange={(v) => {
            location.hash = `company/${provider}/${v}`;
          }}
          className="company-tabs"
        >
          <TabsList variant="line">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Live usage</TabsTrigger>
            <TabsTrigger value="choices">Agent choices</TabsTrigger>
            <TabsTrigger value="listing">Listing</TabsTrigger>
            <TabsTrigger value="benchmarks">Controlled tests</TabsTrigger>
            <TabsTrigger value="plans">
              Test plans
              {plans.length > 0 && (
                <span className="tab-count">{plans.length}</span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="activity">
            <ProviderActivityView
              key={`${provider}/${source}`}
              provider={provider}
              demo={source === "demo"}
            />
          </TabsContent>
          <TabsContent value="choices">
            <SellerChoicesView
              key={`${provider}/${source}`}
              provider={provider}
              demo={source === "demo"}
            />
          </TabsContent>
          <TabsContent value="listing">
            <SellerListingView
              key={`${provider}/${source}`}
              provider={provider}
              demo={source === "demo"}
            />
          </TabsContent>
          <TabsContent value="overview">
            <div className="company-metric-grid">
              <Metric
                title="Selected when offered"
                value={
                  organic
                    ? percent(organic.selectedSessions, organic.offeredSessions)
                    : "—"
                }
                detail={
                  organic
                    ? `${organic.selectedSessions} of ${organic.offeredSessions} eligible sessions`
                    : "No recorded offers yet"
                }
              />
              <Metric
                title="Organic requests succeeded"
                value={
                  organic
                    ? percent(organic.successfulCalls, organic.calls)
                    : "—"
                }
                detail={
                  organic
                    ? `${organic.successfulCalls} of ${organic.calls} organic calls`
                    : "No completed organic calls yet"
                }
              />
              <Metric
                title="Controlled reference checks"
                value={
                  metric?.referenceKnown
                    ? `${metric.referencePassed} / ${metric.referenceKnown}`
                    : "—"
                }
                detail="Controlled sample · not answer accuracy"
              />
              <Metric
                title="Controlled evidence reviewed"
                value={
                  metric ? `${metric.reviewed} / ${metric.attempted}` : "—"
                }
                detail="Known usefulness verdicts in the test sample"
              />
            </div>
            {source === "local" && (
              <p className="field-hint company-local-status">
                Controlled execution: {metric?.succeeded ?? 0} /{" "}
                {metric?.attempted ?? 0} calls succeeded in the latest sample.{" "}
                {report.organic
                  ? "Company aggregate minimum met."
                  : report.organicUnavailableReason}
              </p>
            )}
            <div className="company-main-grid">
              <Panel
                title="From discovery to use"
                description={report.period}
                action={<Badge variant="outline">Organic selection</Badge>}
              >
                {organic ? (
                  <>
                    <div className="company-funnel">
                      {[
                        {
                          label: "Offered to the agent",
                          value: organic.offeredSessions,
                          denominator: organic.offeredSessions,
                        },
                        {
                          label: "Selected in a session",
                          value: organic.selectedSessions,
                          denominator: organic.offeredSessions,
                        },
                      ].map((row) => (
                        <div className="company-funnel-row" key={row.label}>
                          <div>
                            <span>{row.label}</span>
                            <strong>{row.value}</strong>
                          </div>
                          <div className="company-bar-track">
                            <span
                              style={{
                                width: `${row.denominator ? (row.value / row.denominator) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="company-call-summary">
                      <span>
                        <strong>{organic.calls}</strong> completed calls
                      </span>
                      <span>
                        <strong>{organic.referencedCalls}</strong> referenced in
                        an answer
                      </span>
                    </div>
                    <p className="field-hint">
                      Offering a tool does not prove the agent considered it.
                      Selection is measured per session; answer references are
                      measured per call and do not establish quality.
                    </p>
                  </>
                ) : (
                  <div className="lab-empty">
                    <Link01 />
                    <h3>No recorded organic activity</h3>
                    <p>{report.organicUnavailableReason}</p>
                  </div>
                )}
              </Panel>
              <Panel
                title="What the agent sees"
                description="Describe this integration clearly before judging adoption."
              >
                <div className="company-capability">
                  <code>{toolForProvider(provider)}</code>
                  <p>{report.capabilities.description}</p>
                  <strong>When to use it</strong>
                  <p>{report.capabilities.useWhen}</p>
                  <a
                    href={report.capabilities.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Provider documentation <ArrowUpRight />
                  </a>
                </div>
              </Panel>
            </div>
            <Panel
              title="Where to focus next"
              description="Evidence, a possible explanation, and a concrete way to test it."
              action={
                <Badge variant="outline">
                  {report.opportunities.length} opportunities
                </Badge>
              }
            >
              <div className="company-opportunities">
                {report.opportunities.map((o, i) => (
                  <button
                    key={o.id}
                    className="company-opportunity"
                    onClick={() => setOpportunity(o)}
                  >
                    <span className="opportunity-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="opportunity-title">
                        <strong>{o.title}</strong>
                        <Badge variant="outline">{o.category}</Badge>
                      </span>
                      <span className="opportunity-evidence">{o.evidence}</span>
                    </span>
                    <ArrowRight />
                  </button>
                ))}
              </div>
            </Panel>
          </TabsContent>
          <TabsContent value="benchmarks">
            <div className="lab-result-heading">
              <div>
                <h2>Compare evidence, not popularity</h2>
                <p>{report.benchmarkLabel}</p>
              </div>
              <Button variant="outline" asChild>
                <a
                  href={
                    report.benchmarkRunId
                      ? `#lab/${report.benchmarkRunId}/${provider}/all`
                      : "#lab"
                  }
                >
                  {report.benchmarkRunId
                    ? "Inspect test receipts"
                    : "Open provider lab"}{" "}
                  <ArrowUpRight />
                </a>
              </Button>
            </div>
            <Panel
              title="Controlled provider measurements"
              description="Search providers receive matched queries. Extraction is a separate task and should not be ranked against search."
            >
              <BenchmarkTable metrics={report.benchmarks} />
              <p className="field-hint">
                Reference checks are mechanical coverage checks on returned
                responses, not factual accuracy. Failures remain in the
                execution denominator. No overall winner is inferred.
              </p>
            </Panel>
            {report.usage &&
              (report.usage.usdCalls > 0 || report.usage.creditCalls > 0) && (
                <Panel
                  title="What the provider reported"
                  description="Usage from test receipts, separate from backend planning estimates."
                >
                  {report.usage.usdCalls > 0 && (
                    <p>
                      {money(report.usage.reportedUsd * 1e6)} provider-reported
                      USD across {report.usage.usdCalls} calls ·{" "}
                      {money(report.usage.estimatedMicrosForUsdCalls)} estimated
                      for those same calls.
                    </p>
                  )}
                  {report.usage.creditCalls > 0 && (
                    <p>
                      {report.usage.credits} provider-reported{" "}
                      {providerEntry(provider)?.usageUnit ?? "credits"} across{" "}
                      {report.usage.creditCalls} calls. Credits have not been
                      converted to USD.
                    </p>
                  )}
                  <p className="field-hint">
                    This is usage reported by the provider, not invoice
                    reconciliation or a promise of account charges.
                  </p>
                </Panel>
              )}
            <div className="company-main-grid">
              <Panel title="Usefulness is a separate review">
                <div className="company-review-summary">
                  <strong>{metric?.useful ?? 0}</strong>
                  <span>
                    useful · {metric?.partial ?? 0} partial ·{" "}
                    {metric?.reviewed ?? 0} known reviews
                  </span>
                </div>
                <p className="field-hint">
                  {source === "demo"
                    ? "The review counts are illustrative."
                    : "Reviews are explicitly attributed and versioned."}{" "}
                  Unreviewed or unknown evidence is not counted as a pass. Five
                  diagnostic cases cannot establish general superiority.
                </p>
              </Panel>
              <Panel title="A fair next comparison">
                <ol className="company-comparison-rules">
                  <li>Keep the cases and rubric fixed.</li>
                  <li>Document one tool or integration change.</li>
                  <li>Repeat the test and inspect changed results.</li>
                  <li>
                    Record uncertainty; retrieval results can change over time.
                  </li>
                </ol>
                <Button variant="outline" onClick={() => newPlan()}>
                  Create a test plan <Plus />
                </Button>
              </Panel>
            </div>
          </TabsContent>
          <TabsContent value="plans">
            <div className="lab-result-heading">
              <div>
                <h2>Turn a finding into a test</h2>
                <p>
                  {source === "demo"
                    ? "Demo plans stay in this browser."
                    : "Plans are saved locally; creating one does not execute provider calls."}
                </p>
              </div>
              <Button onClick={() => newPlan()}>
                <Plus />
                New test plan
              </Button>
            </div>
            {plans.length === 0 ? (
              <Panel title="No test plans yet">
                <div className="lab-empty">
                  <FileCheck02 />
                  <h3>Start with a specific question</h3>
                  <p>
                    Choose an improvement opportunity or write a hypothesis.
                    Define what you will change and how you will measure it.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      location.hash = `company/${provider}/overview`;
                    }}
                  >
                    Explore opportunities <ArrowRight />
                  </Button>
                </div>
              </Panel>
            ) : (
              <div className="company-plan-grid">
                {plans.map((p) => (
                  <Panel
                    key={p.id}
                    title={p.title}
                    description={
                      displayVerification[p.verification] ?? "Test plan"
                    }
                    action={<StateBadge label={p.status} />}
                  >
                    <p>{p.hypothesis}</p>
                    <dl className="company-plan-details">
                      <dt>Proposed change</dt>
                      <dd>{p.change}</dd>
                      <dt>Success measure</dt>
                      <dd>{p.successMeasure}</dd>
                    </dl>
                    {p.conclusion && (
                      <div className="company-plan-conclusion">
                        <strong>Recorded conclusion</strong>
                        <p>{p.conclusion}</p>
                      </div>
                    )}
                    {p.baselineRunId && (
                      <p className="field-hint">
                        Baseline:{" "}
                        <a href={`#lab/${p.baselineRunId}/${provider}/all`}>
                          inspect run
                        </a>
                        {p.followupRunId && (
                          <>
                            {" "}
                            · Follow-up:{" "}
                            <a href={`#lab/${p.followupRunId}/${provider}/all`}>
                              inspect run
                            </a>
                          </>
                        )}
                      </p>
                    )}
                    {source === "local" && (
                      <ProviderComparison plan={p} runs={lab?.runs ?? []} />
                    )}
                    <div className="lab-run-footer">
                      <small>Updated {date(p.updatedAt)}</small>
                      <Button variant="outline" onClick={() => setPlan(p)}>
                        Edit plan
                      </Button>
                    </div>
                  </Panel>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      <p className="company-footer-note">
        Local demo preview. This switch does not create a company account, grant
        access, or enable commercial sharing.
      </p>
      <Dialog
        open={!!opportunity}
        onOpenChange={(open) => {
          if (!open) setOpportunity(null);
        }}
      >
        <DialogContent className="company-opportunity-dialog">
          <DialogHeader>
            <DialogTitle>{opportunity?.title}</DialogTitle>
            <DialogDescription>
              {source === "demo"
                ? "Illustrative improvement opportunity"
                : "Evidence-backed investigation, with an untested hypothesis"}
            </DialogDescription>
          </DialogHeader>
          {opportunity && (
            <div className="company-opportunity-detail">
              <section>
                <h3>Evidence</h3>
                <p>{opportunity.evidence}</p>
              </section>
              <section>
                <h3>Possible explanation</h3>
                <p>{opportunity.hypothesis}</p>
              </section>
              <section>
                <h3>What to change or investigate</h3>
                <p>{opportunity.action}</p>
              </section>
              <section>
                <h3>How to check it</h3>
                <p>{opportunity.successMeasure}</p>
                <Badge variant="outline">
                  {displayVerification[opportunity.verification]}
                </Badge>
              </section>
              <div className="lab-run-footer">
                {report?.benchmarkRunId && (
                  <Button variant="outline" asChild>
                    <a
                      href={`#lab/${report.benchmarkRunId}/${provider}/${opportunity.id === "reference-gaps" ? "missed" : opportunity.id === "capture-limit" ? "truncated" : opportunity.id === "review-evidence" ? "unreviewed" : "all"}`}
                    >
                      Inspect evidence
                    </a>
                  </Button>
                )}
                <Button onClick={() => newPlan(opportunity)}>
                  Create test plan <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!plan}
        onOpenChange={(open) => {
          if (!open) setPlan(null);
        }}
      >
        <DialogContent className="company-plan-dialog">
          <DialogHeader>
            <DialogTitle>
              {plan?.id ? "Edit test plan" : "Create a test plan"}
            </DialogTitle>
            <DialogDescription>
              {source === "demo"
                ? "Saved only as a demo in this browser. No provider calls."
                : "Record the change before comparing results. This does not alter a provider or run a test."}
            </DialogDescription>
          </DialogHeader>
          {plan && (
            <ExperimentForm
              key={plan.id ?? plan.title ?? "new"}
              initial={plan}
              provider={provider}
              runs={lab?.runs ?? []}
              source={source}
              onSave={savePlan}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="company-metric">
      <h2>{title}</h2>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}
function ExperimentForm({
  initial,
  provider,
  runs,
  source,
  onSave,
}: {
  initial: Partial<Experiment>;
  provider: ProviderId;
  runs: LabRun[];
  source: "demo" | "local";
  onSave: (value: Record<string, unknown>) => Promise<void>;
}) {
  const [value, setValue] = useState({
    provider,
    verification: initial.verification ?? "retrieval",
    title: initial.title ?? "",
    hypothesis: initial.hypothesis ?? "",
    change: initial.change ?? "",
    successMeasure: initial.successMeasure ?? "",
    status: initial.status ?? "planned",
    baselineRunId: initial.baselineRunId ?? null,
    followupRunId: initial.followupRunId ?? null,
    conclusion: initial.conclusion ?? "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const available = runs.filter(
    (r) => r.status === "completed" && r.providers.includes(provider),
  );
  const field = (
    key: "hypothesis" | "change" | "successMeasure" | "conclusion",
    label: string,
    required = true,
  ) => (
    <div>
      <Label htmlFor={`plan-${key}`}>{label}</Label>
      <Textarea
        id={`plan-${key}`}
        value={value[key]}
        onChange={(e) => setValue((v) => ({ ...v, [key]: e.target.value }))}
        required={required}
        minLength={required ? 10 : undefined}
        maxLength={3000}
        rows={3}
      />
    </div>
  );
  return (
    <form
      className="company-plan-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSave(value);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <Label htmlFor="plan-title">Test title</Label>
        <Input
          id="plan-title"
          value={value.title}
          onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))}
          minLength={3}
          maxLength={160}
          required
        />
      </div>
      <div className="lab-review-selects">
        <div>
          <Label htmlFor="plan-kind">Verification method</Label>
          <Select
            value={value.verification}
            onValueChange={(v) =>
              setValue((x) => ({
                ...x,
                verification: v as typeof value.verification,
                ...(v === "agent_choice"
                  ? { baselineRunId: null, followupRunId: null }
                  : {}),
              }))
            }
          >
            <SelectTrigger id="plan-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(displayVerification).map(([v, label]) => (
                <SelectItem key={v} value={v}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="plan-status">Status</Label>
          <Select
            value={value.status}
            onValueChange={(v) =>
              setValue((x) => ({ ...x, status: v as typeof value.status }))
            }
          >
            <SelectTrigger id="plan-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="testing">Testing</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {field("hypothesis", "Hypothesis")}
      {field("change", "Proposed change")}
      {field("successMeasure", "Success measure")}
      {value.verification === "agent_choice" && (
        <p className="notice">
          This needs matched external-agent tasks. Forced-provider retrieval
          tests do not measure whether agents prefer a description.
        </p>
      )}
      {source === "local" && value.verification !== "agent_choice" && (
        <div className="lab-review-selects">
          {(["baselineRunId", "followupRunId"] as const).map((key) => (
            <div key={key}>
              <Label htmlFor={`plan-${key}`}>
                {key === "baselineRunId" ? "Baseline run" : "Follow-up run"}
              </Label>
              <Select
                value={value[key] ?? "none"}
                onValueChange={(id) =>
                  setValue((v) => ({ ...v, [key]: id === "none" ? null : id }))
                }
              >
                <SelectTrigger id={`plan-${key}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not linked</SelectItem>
                  {available.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.source === "replay" ? "Replay · " : "Live · "}
                      {date(r.createdAt)} · {r.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
      {field(
        "conclusion",
        "Conclusion and uncertainty",
        value.status === "reviewed",
      )}
      <InlineError message={error} />
      <div className="lab-run-footer">
        <span className="field-hint">
          {source === "demo"
            ? "Demo plan · browser only"
            : "No settings or provider calls are changed"}
        </span>
        <Button disabled={busy}>
          {busy
            ? "Saving…"
            : source === "demo"
              ? "Save demo plan"
              : "Save test plan"}
        </Button>
      </div>
    </form>
  );
}
