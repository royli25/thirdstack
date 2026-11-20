import {
  providerLabel,
  searchProviderIds,
} from "../../server/provider-catalog";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle as CheckCircle2,
  ChevronDown,
  Circle as CircleDot,
  Download01 as Download,
  LinkExternal01 as ExternalLink,
  FileSearch02 as FileSearch,
  Globe02 as Globe2,
  Loading02 as LoaderCircle,
  SearchLg as Search,
  ShieldTick as ShieldCheck,
} from "@untitledui/icons";
import { api, type TaskDetail } from "../api";
import type {
  Source,
  Assessment,
  Verdict,
  ServerHealth,
} from "../../server/types";

export function CompanyResults({
  task,
  onError,
}: {
  task: TaskDetail;
  onError: (s: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  async function download() {
    try {
      const data = await api(`/tasks/${task.id}/results`);
      const url = URL.createObjectURL(
        new Blob([data.csv], { type: "text/csv;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `apilayer-companies-${task.id.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      onError((e as Error).message);
    }
  }
  const count = task.organizations.length;
  return (
    <section className="panel company-results">
      <div className="panel-heading">
        <span>
          <CheckCircle2 size={17} />
          Company shortlist{" "}
          <span className="count">
            {count} / {task.intent.requiredCount}
          </span>
        </span>
        <button
          className="text-button"
          disabled={!count}
          onClick={() => void download()}
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>
      {count ? (
        <>
          <div className="info-strip">
            <ShieldCheck size={15} />
            {count >= task.intent.requiredCount
              ? "Target count reached through human evidence review."
              : "Partial result. More reviewed companies are needed to meet the target."}
          </div>
          <div className="company-list">
            {task.organizations.slice(0, expanded ? 100 : 3).map((org, i) => (
              <div className="company-item" key={org.name}>
                <span className="source-index">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{org.name}</strong>
                  <p>{org.notes.join(" ")}</p>
                  <div className="company-links">
                    {org.sources.map((s, j) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Evidence {j + 1}
                        <ArrowUpRight size={11} />
                      </a>
                    ))}
                  </div>
                </div>
                <span className="badge complete">Human verified</span>
              </div>
            ))}
          </div>
          {count > 3 && (
            <button
              className="text-button show-companies"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show fewer" : `Show all ${count} companies`}
              <ChevronDown size={13} />
            </button>
          )}
        </>
      ) : (
        <div className="shortlist-empty">
          <CircleDot size={16} />
          <p>
            No verified companies yet. Review sources, name the organization,
            and link evidence to each criterion to build your shortlist.
          </p>
        </div>
      )}
    </section>
  );
}

export function FollowUp({
  disabled,
  onRun,
}: {
  disabled: boolean;
  onRun: (query: string) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <form
      className="follow-up"
      onSubmit={(e) => {
        e.preventDefault();
        if (q.trim()) {
          onRun(q);
          setQ("");
        }
      }}
    >
      <Search size={18} />
      <input
        aria-label="Follow-up query"
        placeholder="Follow up with a more specific search…"
        required
        minLength={3}
        maxLength={500}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button
        className="button primary"
        disabled={disabled || q.trim().length < 3}
      >
        <ArrowRight size={17} />
        <span className="sr-only">Run follow-up</span>
      </button>
      <small>Uses the remaining task budget and the same routing policy.</small>
    </form>
  );
}

export function SourceCard({
  source,
  index,
  task,
  health,
  onRefresh,
  onError,
}: {
  source: Source;
  index: number;
  task: TaskDetail;
  health: ServerHealth | undefined;
  onRefresh: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const existing = task.assessments.find((a) => a.sourceId === source.id);
  const [open, setOpen] = useState(false);
  const [fullText, setFullText] = useState(false);
  const [organization, setOrganization] = useState(
    existing?.organization || "",
  );
  const [checks, setChecks] = useState<Record<string, Verdict>>(
    existing?.criteria ||
      Object.fromEntries(task.intent.criteria.map((c) => [c, "unknown"])),
  );
  const [note, setNote] = useState(existing?.note || "");
  const [evidence, setEvidence] = useState<Record<string, string[]>>(
    existing?.evidence ||
      Object.fromEntries(task.intent.criteria.map((c) => [c, [source.id]])),
  );
  const [busy, setBusy] = useState(false);
  async function save(disposition: Assessment["disposition"]) {
    setBusy(true);
    try {
      await api(`/tasks/${task.id}/assessments`, {
        sourceId: source.id,
        organization,
        criteria: checks,
        disposition,
        note,
        evidence,
        evidenceVersions: Object.fromEntries(
          Object.values(evidence)
            .flat()
            .map((id) => [
              id,
              task.sources.find((s) => s.id === id)!.contentVersion ?? 1,
            ]),
        ),
      });
      await onRefresh();
      setOpen(false);
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function extract() {
    setBusy(true);
    try {
      await api(`/tasks/${task.id}/fetch`, { sourceId: source.id });
    } catch (e) {
      onError((e as Error).message);
    } finally {
      await onRefresh();
      setBusy(false);
    }
  }
  return (
    <article className="source-card">
      <div className="source-top">
        <span className="source-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="source-title">
          <a href={source.url} target="_blank" rel="noopener noreferrer">
            {source.title}
            <ArrowUpRight size={14} />
          </a>
          <div>
            <Globe2 size={11} />
            {new URL(source.url).hostname}
            <span>
              {source.provider === "user"
                ? "Supplied by you"
                : `via ${source.provider}`}
            </span>
            {source.publishedAt && (
              <span>{source.publishedAt.slice(0, 10)}</span>
            )}
          </div>
        </div>
        <span
          className={`badge ${existing?.disposition === "accepted" ? "complete" : existing?.disposition === "rejected" ? "failed" : ""}`}
        >
          {existing?.disposition || "Unreviewed"}
        </span>
      </div>
      {source.extraction && (
        <div className="extraction-provenance">
          <FileSearch size={11} />
          Extracted via Firecrawl ·{" "}
          {source.extraction.authMode === "keyless"
            ? "keyless free tier"
            : "API key"}
          {source.extraction.pageStatus !== undefined &&
            ` · page HTTP ${source.extraction.pageStatus}`}
        </div>
      )}
      {(source.extraction?.pageStatus ?? 0) >= 400 && (
        <div className="page-error" role="status">
          Page returned HTTP {source.extraction!.pageStatus}. This evidence
          cannot support an accepted company until the page is retrieved
          successfully or replaced.
        </div>
      )}
      <p
        className={`source-snippet ${fullText ? "full-text" : ""}`}
        tabIndex={fullText ? 0 : undefined}
      >
        {source.snippet ||
          "No text evidence returned. Open the source or extract the page to review it."}
      </p>
      <div className="source-actions">
        {source.snippet.length > 240 && (
          <button
            className="text-button"
            onClick={() => setFullText(!fullText)}
          >
            {fullText ? "Collapse evidence" : "Read full evidence"}
            <ChevronDown size={12} />
          </button>
        )}
        <button
          className="text-button"
          disabled={busy}
          onClick={() => setOpen(!open)}
        >
          <ShieldCheck size={14} />
          {existing ? "Edit review" : "Review evidence"}
          <ChevronDown size={13} />
        </button>
        <button
          className="text-button"
          disabled={
            !health?.providers.firecrawl || busy || task.status === "running"
          }
          onClick={() => void extract()}
          title={
            health?.providerAuth?.firecrawl === "keyless"
              ? "Free keyless extraction, subject to allowance and session limits"
              : "Firecrawl extraction, estimated against the task budget"
          }
        >
          {busy ? (
            <LoaderCircle className="spin" size={13} />
          ) : (
            <FileSearch size={13} />
          )}
          Extract page
        </button>
        <a
          className="text-button"
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open source
          <ExternalLink size={12} />
        </a>
      </div>
      {open && (
        <div className="review-form">
          <label>
            Organization name
            <input
              value={organization}
              maxLength={120}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Use a consistent name across evidence links"
            />
          </label>
          {task.intent.criteria.map((c) => (
            <div className="criterion-review" key={c}>
              <span>{c}</span>
              <select
                aria-label={c}
                value={checks[c]}
                onChange={(e) =>
                  setChecks({ ...checks, [c]: e.target.value as Verdict })
                }
              >
                <option value="unknown">Unknown</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
              {task.sources.length > 1 && (
                <select
                  className="evidence-select"
                  aria-label={`${c} evidence source`}
                  value={evidence[c]?.[0] || source.id}
                  onChange={(e) =>
                    setEvidence({ ...evidence, [c]: [e.target.value] })
                  }
                >
                  {task.sources.map((s, i) => (
                    <option key={s.id} value={s.id}>
                      Evidence {i + 1}: {s.title.slice(0, 45)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
          <label>
            Evidence note
            <textarea
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain what this source establishes and what is missing."
            />
          </label>
          <div className="review-buttons">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => void save("pending")}
            >
              Save review
            </button>
            <button
              className="button secondary danger"
              disabled={busy}
              onClick={() => void save("rejected")}
            >
              Reject
            </button>
            <button
              className="button primary"
              disabled={
                busy ||
                !organization.trim() ||
                !note.trim() ||
                Object.values(checks).some((v) => v !== "pass") ||
                Object.values(evidence)
                  .flat()
                  .some(
                    (id) =>
                      (task.sources.find((s) => s.id === id)?.extraction
                        ?.pageStatus ?? 0) >= 400,
                  )
              }
              onClick={() => void save("accepted")}
            >
              <Check size={14} />
              Accept organization
            </button>
          </div>
          <p className="tiny muted">
            Accept only when the linked evidence supports every criterion.
            Accepted organizations are deduplicated by name.
          </p>
        </div>
      )}
    </article>
  );
}

export function EvidenceList({
  task,
  health,
  onRefresh,
  onError,
}: {
  task: TaskDetail;
  health: ServerHealth | undefined;
  onRefresh: () => Promise<void>;
  onError: (s: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [review, setReview] = useState("all");
  const [unique, setUnique] = useState(false);
  const assessments = new Map(task.assessments.map((a) => [a.sourceId, a]));
  let sources = task.sources.filter(
    (s) =>
      (provider === "all" || s.provider === provider) &&
      (review === "all" ||
        (review === "unreviewed"
          ? !assessments.has(s.id)
          : assessments.get(s.id)?.disposition === review)) &&
      `${s.title} ${s.url} ${s.snippet}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  if (unique) {
    const byUrl = new Map<string, Source>();
    for (const source of sources) {
      const prior = byUrl.get(source.url);
      if (
        !prior ||
        (assessments.has(source.id) && !assessments.has(prior.id)) ||
        (assessments.has(source.id) === assessments.has(prior.id) &&
          source.snippet.length > prior.snippet.length)
      )
        byUrl.set(source.url, source);
    }
    sources = [...byUrl.values()];
  }
  return (
    <>
      <div className="evidence-filters">
        <div className="evidence-search">
          <Search size={14} />
          <input
            aria-label="Search returned evidence"
            placeholder="Search titles, domains, or evidence…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Filter evidence by provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="all">All providers</option>
          {searchProviderIds.map((p) => (
            <option key={p} value={p}>
              {providerLabel(p)}
            </option>
          ))}
          <option value="user">Supplied links</option>
        </select>
        <select
          aria-label="Filter evidence by review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
        >
          <option value="all">All reviews</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={unique}
            onChange={(e) => setUnique(e.target.checked)}
          />
          Unique URLs only
        </label>
        <span>
          {sources.length} of {task.sources.length} sources
        </span>
      </div>
      {sources.length ? (
        sources.map((source) => (
          <SourceCard
            key={`${source.id}:${source.contentVersion ?? 1}:${assessments.get(source.id)?.updatedAt ?? "new"}`}
            source={source}
            index={task.sources.indexOf(source)}
            task={task}
            health={health}
            onRefresh={onRefresh}
            onError={onError}
          />
        ))
      ) : (
        <div className="empty-state">
          <Search size={23} />
          <h3>No evidence matches these filters.</h3>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setProvider("all");
              setReview("all");
              setUnique(false);
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </>
  );
}
