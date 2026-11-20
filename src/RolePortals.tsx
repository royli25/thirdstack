import { startPolling } from "./polling";
import { providerIds, providerLabel } from "../server/provider-catalog";
import { AdminNavigation } from "./AdminNavigation";
import { CompanyTeamView } from "./CompanyTeamView";
import { ConnectorsView } from "./ConnectorsView";
import {
  CompanyDashboard,
  companyDashboardLinks,
  companyDashboardSection,
} from "./CompanyDashboard";
import { useEffect, useRef, useState, type ReactNode, Fragment } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building07,
  RefreshCw01,
  CheckCircle,
  Menu01,
  Plus,
  XClose,
} from "@untitledui/icons";
import { useAccount, AccountControls } from "./AccountGate";
import { api } from "./api";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./components/ui/dialog";
import { Panel, Empty, InlineError, date } from "./observation-ui";
import type {
  ToolCompany,
  CompanyInsights,
  CompanyReviewItem,
  CompanyPreviewTarget,
} from "../server/company-types";
import "./roles.css";
export function PortalShell({
  area,
  title,
  links,
  adminPage = "admin",
  children,
}: {
  area: "company" | "admin" | "settings";
  title: string;
  links: {
    href: string;
    label: string;
    selected: boolean;
    icon?: typeof ArrowRight;
  }[];
  children: ReactNode;
  adminPage?: string;
}) {
  const [open, setOpen] = useState(false);
  const navigationTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = () => setOpen(false);
    window.addEventListener("hashchange", close);
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("hashchange", close);
      window.removeEventListener("popstate", close);
    };
  }, [area]);
  const nav = (
    <>
      <a href="#home" className="obs-brand">
        <img src="/two-hands.svg" width="147" height="32" alt="Two Hands" />
      </a>
      <nav
        className="customer-navigation"
        aria-label={
          area === "settings"
            ? "Settings navigation"
            : area === "company"
              ? "Tool company navigation"
              : "Admin navigation"
        }
      >
        {area === "admin" ? (
          <AdminNavigation page={adminPage} onNavigate={() => setOpen(false)} />
        ) : (
          links.map((link) => (
            <Fragment key={link.href}>
              {area === "company" && link.label === "Company details" && (
                <div className="customer-navigation-divider" role="separator" />
              )}
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={link.selected ? "selected" : ""}
                aria-current={link.selected ? "page" : undefined}
              >
                {link.icon && <link.icon aria-hidden="true" />}
                {link.label}
              </a>
            </Fragment>
          ))
        )}
      </nav>
      <div className="sidebar-bottom">
        <AccountControls />
      </div>
    </>
  );
  return (
    <div
      className={`observation-shell role-portal portal-${area}${area !== "company" ? " workspace-console" : ""}`}
    >
      <nav aria-label="Skip links">
        <a
          className="skip-link"
          href="#portal-content"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById("portal-content")?.focus();
          }}
        >
          Skip to content
        </a>
      </nav>
      <aside className="obs-sidebar customer-sidebar">{nav}</aside>
      <div className="obs-body">
        <header className="obs-topbar" aria-label={title}>
          <div>
            <Button
              ref={navigationTrigger}
              variant="ghost"
              size="icon"
              className="mobile-nav-button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <Menu01 />
            </Button>
            <a
              href="#home"
              className="customer-mobile-brand"
              aria-label="Two Hands home"
            >
              <img
                src="/two-hands.svg"
                width="123"
                height="27"
                alt="Two Hands"
              />
            </a>
          </div>
        </header>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="mobile-navigation translate-x-0 translate-y-0"
            showCloseButton={false}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              navigationTrigger.current?.focus();
            }}
          >
            <DialogTitle className="sr-only">Navigation</DialogTitle>
            <DialogDescription className="sr-only">
              Navigate your {area === "admin" ? "administration" : area} pages.
            </DialogDescription>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="portal-navigation-close"
                aria-label="Close navigation"
              >
                <XClose />
              </Button>
            </DialogClose>
            <div className="mobile-sidebar-content customer-sidebar">{nav}</div>
          </DialogContent>
        </Dialog>
        <main className="obs-main" id="portal-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
const statusLabels = {
  pending: "Under review",
  approved: "Approved",
  rejected: "Changes requested",
  suspended: "Access suspended",
};
export function CompanyPortal(props: { id?: string; section: string }) {
  const account = useAccount();
  const target = account.profile?.companyPreview;
  if (target && props.id && props.id !== target.id)
    return (
      <PortalShell area="company" title="Company preview" links={[]}>
        <Panel title="Choose a company from the preview selector">
          <p>This page is outside the company you’re previewing.</p>
        </Panel>
      </PortalShell>
    );
  const selected =
    account.profile?.companies.find((company) => company.id === props.id) ??
    account.profile?.companies[0];
  if (target?.kind === "provider")
    return (
      <CompanyDashboardPortal
        key={target.target}
        target={target}
        section={props.section}
      />
    );
  if (selected && props.id !== "new" && props.section === "connectors")
    return <CompanyConnectorsPortal key={selected.id} company={selected} />;
  if (
    selected &&
    props.id !== "new" &&
    !["team", "details"].includes(props.section)
  )
    return (
      <CompanyDashboardPortal
        key={selected.id}
        initialCompany={selected}
        section={props.section}
      />
    );
  return (
    <RegisteredCompanyPortal
      key={`${props.id ?? "company"}:${props.section}`}
      {...props}
    />
  );
}
function CompanyConnectorsPortal({ company }: { company: ToolCompany }) {
  const canManage =
    company.role === "owner" || company.role === "platform_admin";
  return (
    <PortalShell
      area="company"
      title={company.name}
      links={companyDashboardLinks(company.id, "connectors", true, canManage)}
    >
      <ConnectorsView
        mode="company"
        base={`/companies/${company.id}/connectors`}
        canWrite={canManage}
        canReview={false}
        locked={
          company.status === "approved"
            ? undefined
            : "Connectors become available once our team approves your company registration."
        }
      />
    </PortalShell>
  );
}
function CompanyDashboardPortal({
  target,
  initialCompany,
  section,
}: {
  target?: CompanyPreviewTarget;
  initialCompany?: ToolCompany;
  section: string;
}) {
  const account = useAccount();
  const [company, setCompany] = useState(initialCompany);
  const [insights, setInsights] = useState<CompanyInsights>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const id = initialCompany?.id ?? target!.id;
  useEffect(() => {
    let active = true;
    setInsights(undefined);
    setError("");
    const refresh = async () => {
      if (active) setLoading(true);
      try {
        const current = initialCompany
          ? await api<ToolCompany>(`/companies/${id}`)
          : undefined;
        if (!active) return;
        setCompany(current);
        const data = current
          ? current.status === "approved" && current.providerId
            ? await api<CompanyInsights>(`/companies/${id}/insights`)
            : undefined
          : await api<CompanyInsights>("/auth/preview-insights");
        if (active) {
          setInsights(data);
          setError("");
        }
      } catch (e) {
        if (active) {
          setInsights(undefined);
          setError((e as Error).message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    const stop = startPolling(refresh, 30000);
    return () => {
      active = false;
      stop();
    };
  }, [id, revision, initialCompany?.status, initialCompany?.revision]);
  const canManage =
    company?.role === "owner" || company?.role === "platform_admin";
  return (
    <PortalShell
      area="company"
      title={company?.name ?? target?.name ?? "Tool company"}
      links={companyDashboardLinks(
        id,
        companyDashboardSection(section),
        !!initialCompany,
        canManage,
      )}
    >
      <CompanyDashboard
        id={id}
        name={company?.name ?? target?.name ?? "Tool company"}
        providerId={company?.providerId ?? target?.providerId ?? null}
        company={company}
        section={section}
        insights={insights}
        loading={loading}
        error={error}
        refresh={() => setRevision((value) => value + 1)}
        companies={account.profile?.companies}
      />
    </PortalShell>
  );
}
function RegisteredCompanyPortal({
  id,
  section,
}: {
  id?: string;
  section: string;
}) {
  const account = useAccount();
  const companies = account.profile?.companies ?? [];
  const selected = companies.find((c) => c.id === id) ?? companies[0];
  const [editing, setEditing] = useState(false);
  const registering = id === "new" || !companies.length || editing;
  const [company, setCompany] = useState<ToolCompany | undefined>(selected);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    website: "",
    toolName: "",
    description: "",
  });
  const requestKey = useRef(crypto.randomUUID());
  const tab = section === "team" ? "team" : "overview";
  const canManage =
    company?.role === "owner" || company?.role === "platform_admin";
  useEffect(() => {
    let active = true;
    setError("");
    if (registering || !selected) return;
    setCompany(selected);
    const refresh = async () => {
      try {
        const value = await api<ToolCompany>(`/companies/${selected.id}`);
        if (!active) return;
        setCompany(value);
      } catch (e) {
        if (active) {
          setCompany(undefined);
          setError((e as Error).message);
        }
      }
    };
    const stop = startPolling(refresh, 30000);
    return () => {
      active = false;
      stop();
    };
  }, [selected?.id, registering, tab]);
  const links = registering
    ? [
        {
          href: "#company/new",
          label: "Register company",
          selected: true,
          icon: Building07,
        },
      ]
    : [
        ...companyDashboardLinks(
          selected!.id,
          section === "team" ? "team" : "details",
          true,
          canManage,
        ),
        ...(!account.previewRole
          ? [
              {
                href: "#company/new",
                label: "Register another company",
                selected: false,
                icon: Plus,
              },
            ]
          : []),
      ];
  return (
    <PortalShell
      area="company"
      title={
        registering ? "Company registration" : (company?.name ?? "Tool company")
      }
      links={links}
    >
      <div className="page-heading">
        <div>
          <h1>
            {registering
              ? editing
                ? "Update company details"
                : "Bring your tool to Two Hands"
              : tab === "team"
                ? "Company team"
                : "Company details"}
          </h1>
          <p>
            {registering
              ? "Register your company so our team can verify ownership and arrange your integration."
              : tab === "team"
                ? "Manage who can view your company’s aggregate insights."
                : "Your company profile, integration status, and data access."}
          </p>
        </div>
      </div>
      <InlineError message={error} />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {registering ? (
        <Panel
          title="Company details"
          description="Registration does not claim an existing provider or enable its data."
        >
          <form
            className="portal-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const value =
                  editing && selected
                    ? await api<ToolCompany>(
                        `/companies/${selected.id}/resubmit`,
                        { ...form, revision: company!.revision },
                      )
                    : await api<ToolCompany>("/auth/companies", {
                        ...form,
                        requestKey: requestKey.current,
                      });
                await account.refresh();
                setEditing(false);
                requestKey.current = crypto.randomUUID();
                location.hash = `company/${value.id}/overview`;
                setNotice(
                  "Registration submitted. You can track its review here.",
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Company name
              <Input
                required
                minLength={2}
                maxLength={80}
                autoComplete="organization"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Company website
              <Input
                required
                type="url"
                placeholder="https://yourcompany.com"
                maxLength={300}
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </label>
            <label>
              Tool name
              <Input
                required
                minLength={2}
                maxLength={80}
                value={form.toolName}
                onChange={(e) => setForm({ ...form, toolName: e.target.value })}
              />
            </label>
            <label>
              What does your tool do?
              <Textarea
                required
                minLength={20}
                maxLength={1500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy
                ? "Submitting…"
                : editing
                  ? "Resubmit for review"
                  : "Submit for review"}
              <ArrowRight size={16} />
            </Button>
          </form>
          {editing && (
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Back to company
            </Button>
          )}
        </Panel>
      ) : (
        company && (
          <>
            {companies.length > 1 && (
              <label className="portal-company-select">
                Company
                <select
                  aria-label="Current company"
                  value={selected!.id}
                  onChange={(e) =>
                    (location.hash = `company/${e.target.value}/overview`)
                  }
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {tab === "team" ? (
              canManage ? (
                <CompanyTeamView key={company.id} companyId={company.id} />
              ) : (
                <Panel title="Company owner access required">
                  <p>
                    Only a company owner can manage the team and review access
                    history.
                  </p>
                </Panel>
              )
            ) : tab === "overview" ? (
              <div className="company-details-grid">
                <Panel
                  title="Integration status"
                  action={
                    <span className="portal-status">
                      {statusLabels[company.status]}
                    </span>
                  }
                >
                  {canManage &&
                    ["pending", "rejected"].includes(company.status) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setForm({
                            name: company.name,
                            website: company.website,
                            toolName: company.toolName,
                            description: company.description,
                          });
                          setEditing(true);
                        }}
                      >
                        Update registration
                      </Button>
                    )}
                  <ol className="portal-steps">
                    <li>
                      <strong>Company registered</strong>
                      <p>Submitted {date(company.createdAt)}.</p>
                    </li>
                    <li>
                      <strong>Ownership and integration review</strong>
                      <p>
                        {company.status === "pending"
                          ? "Our team checks your website, ownership, and tool requirements. Your registration is waiting for review."
                          : company.feedback || statusLabels[company.status]}
                      </p>
                    </li>
                    <li>
                      <strong>Tool connected</strong>
                      <p>
                        {company.status !== "approved" ? (
                          "An administrator links the verified integration after approval."
                        ) : company.providerId ? (
                          `Your company is linked to ${providerLabel(company.providerId)}.`
                        ) : (
                          <>
                            Connect your own MCP server under{" "}
                            <a href={`#company/${company.id}/connectors`}>
                              Connectors
                            </a>
                            .
                          </>
                        )}
                      </p>
                    </li>
                    <li>
                      <strong>Aggregate insights</strong>
                      <p>
                        {company.insightsEnabled
                          ? "Enabled. Usage appears from the first eligible recorded activity."
                          : "Available after approval and a separate data-access review."}
                      </p>
                    </li>
                  </ol>
                </Panel>
                <Panel title="Company profile">
                  <dl className="portal-details">
                    <dt>Website</dt>
                    <dd>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {company.website}
                      </a>
                    </dd>
                    <dt>Tool</dt>
                    <dd>{company.toolName}</dd>
                    <dt>Description</dt>
                    <dd>{company.description}</dd>
                  </dl>
                </Panel>
              </div>
            ) : null}
          </>
        )
      )}
    </PortalShell>
  );
}
export function AdminCompanyReview() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CompanyReviewItem[]>([]),
    [selected, setSelected] = useState<CompanyReviewItem>();
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("pending");
  const [form, setForm] = useState({
    status: "approved",
    providerId: "",
    insightsEnabled: false,
    feedback: "",
  });
  const [history, setHistory] = useState<
    {
      actorId: string;
      at: string;
      revision: number;
      data: Record<string, unknown>;
    }[]
  >([]);
  const [cursor, setCursor] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const selectionVersion = useRef(0);
  const queuePath = `/admin/companies?status=${filter}${cursor ? "&cursor=" + encodeURIComponent(cursor) : ""}`;
  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api<{
        items: CompanyReviewItem[];
        nextCursor: string | null;
      }>(queuePath);
      setItems(data.items);
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<{ items: CompanyReviewItem[]; nextCursor: string | null }>(queuePath)
      .then((data) => {
        if (active) {
          setItems(data.items);
          setNextCursor(data.nextCursor);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [queuePath]);
  const select = async (item: CompanyReviewItem) => {
    const version = ++selectionVersion.current;
    setSelected(item);
    setError("");
    setForm({
      status: item.status === "pending" ? "approved" : item.status,
      providerId: item.providerId ?? "",
      insightsEnabled: item.insightsEnabled,
      feedback: item.feedback,
    });
    setHistory([]);
    try {
      const data = await api<typeof history>(
        `/admin/companies/${item.id}/history`,
      );
      if (version === selectionVersion.current) setHistory(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <PortalShell area="admin" title="Administration" links={[]}>
      <div className="admin-company-review">
        <div className="page-heading">
          <div>
            <h1>Company reviews</h1>
            <p>
              Verify tool company ownership, link integrations, and control
              access to aggregate insights.
            </p>
          </div>
          <Button
            variant="outline"
            disabled={loading || busy}
            onClick={() => void refresh().catch((e) => setError(e.message))}
          >
            <RefreshCw01 aria-hidden="true" />
            Refresh reviews
          </Button>
        </div>
        <InlineError message={error} />
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <div className="console-review-toolbar">
          <label className="portal-company-select console-review-filter">
            Review status
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCursor("");
                setSelected(undefined);
                selectionVersion.current++;
              }}
            >
              <option value="pending">Pending</option>
              <option value="all">All companies</option>
              <option value="approved">Approved</option>
              <option value="rejected">Changes requested</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>
          <p>
            {loading
              ? "Loading registrations…"
              : `${items.length} ${items.length === 1 ? "company" : "companies"} on this page`}
          </p>
        </div>
        <div className="portal-review-grid">
          <Panel title="Registered companies">
            <div className="portal-company-list">
              {items
                .filter((i) => filter === "all" || i.status === filter)
                .map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={selected?.id === item.id}
                    onClick={() => void select(item)}
                  >
                    <strong>{item.name}</strong>
                    <span>
                      {item.toolName} · {statusLabels[item.status]}
                    </span>
                  </button>
                ))}
              {loading && !items.length ? (
                <p role="status" className="subtle">
                  Loading company reviews…
                </p>
              ) : (
                !error &&
                !items.some((i) => filter === "all" || i.status === filter) && (
                  <Empty title="No companies in this queue" icon={CheckCircle}>
                    New registrations will appear here. Change the review status
                    to see other companies.
                  </Empty>
                )
              )}
            </div>
            <div className="account-actions">
              {cursor && (
                <Button variant="outline" onClick={() => setCursor("")}>
                  First page
                </Button>
              )}
              {nextCursor && (
                <Button variant="outline" onClick={() => setCursor(nextCursor)}>
                  Next page
                </Button>
              )}
            </div>
          </Panel>
          <Panel
            title={selected ? `Review ${selected.name}` : "Select a company"}
          >
            {selected ? (
              <>
                <dl className="portal-details">
                  <dt>Applicant</dt>
                  <dd>{selected.ownerEmail}</dd>
                  <dt>Website</dt>
                  <dd>
                    <a href={selected.website} target="_blank" rel="noreferrer">
                      {selected.website}
                    </a>
                  </dd>
                  <dt>Tool</dt>
                  <dd>{selected.toolName}</dd>
                  <dt>Description</dt>
                  <dd>{selected.description}</dd>
                </dl>
                <form
                  className="portal-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy(true);
                    setError("");
                    try {
                      await api(`/admin/companies/${selected.id}/review`, {
                        ...form,
                        providerId: form.providerId || null,
                        revision: selected.revision,
                      });
                      await refresh();
                      setSelected(undefined);
                      setNotice(
                        "Company review saved. The owner will see your feedback.",
                      );
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <label>
                    Decision
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          status: e.target.value,
                          insightsEnabled: false,
                        })
                      }
                    >
                      <option value="approved">Approve</option>
                      <option value="rejected">Request changes</option>
                      <option value="suspended">Suspend access</option>
                    </select>
                  </label>
                  <label>
                    Verified provider integration
                    <select
                      value={form.providerId}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          providerId: e.target.value,
                          insightsEnabled: e.target.value
                            ? form.insightsEnabled
                            : false,
                        })
                      }
                    >
                      <option value="">
                        None: the company supplies its own connector
                      </option>
                      {providerIds.map((p) => (
                        <option key={p} value={p}>
                          {providerLabel(p)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="portal-checkbox">
                    <input
                      type="checkbox"
                      disabled={form.status !== "approved" || !form.providerId}
                      checked={form.insightsEnabled}
                      onChange={(e) =>
                        setForm({ ...form, insightsEnabled: e.target.checked })
                      }
                    />
                    Release aggregate insights after ownership review
                  </label>
                  <label>
                    Feedback to company
                    <Textarea
                      required
                      minLength={5}
                      maxLength={1500}
                      value={form.feedback}
                      onChange={(e) =>
                        setForm({ ...form, feedback: e.target.value })
                      }
                    />
                  </label>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save review"}
                  </Button>
                </form>
                <details className="portal-audit">
                  <summary>Review history</summary>
                  {history.map((event) => (
                    <div key={event.revision}>
                      <strong>
                        {event.revision === 0
                          ? "Registration submitted"
                          : String(event.data.status)}
                      </strong>
                      <p>
                        {date(event.at)} · {event.actorId}
                      </p>
                      {typeof event.data.feedback === "string" && (
                        <p>{event.data.feedback}</p>
                      )}
                    </div>
                  ))}
                </details>
              </>
            ) : (
              <Empty title="Ready for review" icon={Building07}>
                Select a company to review its profile, verify ownership, and
                link an integration.
              </Empty>
            )}
          </Panel>
        </div>
      </div>
    </PortalShell>
  );
}

export function AccountSettings() {
  const account = useAccount();
  const [busy, setBusy] = useState(false);
  const canPreview = account.profile?.canPreview || account.profile?.isAdmin;
  const current =
    account.previewRole ||
    (account.profile?.isAdmin
      ? "admin"
      : account.profile?.accountType === "business"
        ? "company"
        : "user");
  const [experience, setExperience] = useState(current);
  const [target, setTarget] = useState(account.previewTarget || "");
  const selectedTarget = target || account.previewTargets[0]?.target || "";
  const destination =
    current === "company"
      ? "#company"
      : current === "admin"
        ? "#admin"
        : "#dashboard";
  return (
    <PortalShell
      area="settings"
      title="Settings"
      links={[
        {
          href: destination,
          label:
            "Back to " +
            (current === "company"
              ? "company"
              : current === "admin"
                ? "administration"
                : "dashboard"),
          selected: false,
          icon: ArrowLeft,
        },
      ]}
    >
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account and product access.</p>
        </div>
      </div>
      {canPreview && (
        <Panel
          className="settings-section"
          title="Preview as"
          description="Preview a company’s owner experience or your user experience. Your admin identity stays intact; other administrator actions are disabled during preview."
        >
          <label className="settings-preview-field">
            Experience
            <select
              aria-label="Preview as"
              value={experience}
              disabled={busy}
              onChange={async (e) => {
                const value = e.target.value;
                setExperience(value);
                if (value === "company") return;
                setBusy(true);
                try {
                  await account.preview(value === "admin" ? null : "user");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <option value="admin">Administrator</option>
              <option value="user">User</option>
              <option value="company">Tool company</option>
            </select>
          </label>
          {experience === "company" && (
            <div className="settings-company-preview">
              <label className="settings-preview-field">
                Company to preview
                <select
                  aria-label="Company to preview"
                  value={selectedTarget}
                  disabled={busy || !account.previewTargets.length}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  {!account.previewTargets.length && (
                    <option value="">Loading companies…</option>
                  )}
                  <optgroup label="Registered companies">
                    {account.previewTargets
                      .filter((item) => item.kind === "company")
                      .map((item) => (
                        <option key={item.target} value={item.target}>
                          {item.name} ·{" "}
                          {statusLabels[item.status as ToolCompany["status"]]}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Integrated providers">
                    {account.previewTargets
                      .filter((item) => item.kind === "provider")
                      .map((item) => (
                        <option key={item.target} value={item.target}>
                          {item.name} · unregistered
                        </option>
                      ))}
                  </optgroup>
                </select>
              </label>
              <InlineError message={account.previewTargetError} />
              {account.previewTargetError && (
                <Button
                  variant="outline"
                  onClick={() => void account.reloadPreviewTargets()}
                >
                  Reload companies
                </Button>
              )}
              <Button
                disabled={busy || !selectedTarget}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await account.preview("company", selectedTarget);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Open company preview
                <ArrowRight />
              </Button>
            </div>
          )}
        </Panel>
      )}
      <Panel
        className="settings-section"
        title="Account"
        description="Your identity and access to Two Hands."
      >
        <dl className="settings-identity">
          <div>
            <dt>Email address</dt>
            <dd>{account.profile?.user.email}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>
              {current === "admin"
                ? "Administrator"
                : current === "company"
                  ? "Tool company"
                  : "Personal account"}
            </dd>
          </div>
        </dl>
        <div className="settings-account-links">
          {account.previewRole !== "company" && (
            <a href="#dashboard">
              Home <ArrowRight size={16} />
            </a>
          )}
          <a href="#company">
            My tool company <ArrowRight size={16} />
          </a>
        </div>
      </Panel>
    </PortalShell>
  );
}
