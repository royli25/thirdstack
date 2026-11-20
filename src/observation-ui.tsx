import { useState, type ReactNode } from "react";
import {
  Copy01,
  Check,
  Download01,
  ArrowUpRight,
  AlertCircle,
  FileCheck02,
} from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Checkbox } from "./components/ui/checkbox";
import { Badge } from "./components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import type {
  SessionDetail,
  ObservationSession,
  ObservationListItem,
  Evaluation,
  ReviewVerdict,
  ReviewAuthor,
} from "../server/observation-types";
import { money } from "./api";

export const date = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
export const statusLabel = (s: ObservationSession | ObservationListItem) =>
  !s.approvedAt
    ? "Awaiting approval"
    : s.status === "active"
      ? "In progress"
      : s.evaluations.some((e) => e.outcomeId === s.outcomes.at(-1)?.id)
        ? "Reviewed"
        : "Needs review";
export function StateBadge({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className={`state-badge state-${label.toLowerCase().replaceAll(" ", "-")}`}
    >
      {label}
    </Badge>
  );
}
export function Panel({
  title,
  description,
  children,
  action,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`product-panel ${className}`}>
      <CardHeader className="panel-heading">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
export function Empty({
  title,
  children,
  action,
  icon: Icon = FileCheck02,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: typeof FileCheck02;
}) {
  return (
    <div className="obs-empty">
      <div className="empty-symbol" aria-hidden="true">
        <Icon />
      </div>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [state, setState] = useState("");
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("Copied");
        } catch {
          setState("Copy unavailable");
        }
        setTimeout(() => setState(""), 2500);
      }}
    >
      {state === "Copied" ? <Check /> : <Copy01 />}
      {state || label}
    </Button>
  );
}
export function download(
  name: string,
  data: unknown,
  type = "application/json",
) {
  const url = URL.createObjectURL(
    new Blob(
      [
        type === "application/json"
          ? JSON.stringify(data, null, 2)
          : String(data),
      ],
      { type },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ExportButton({
  onClick,
  label = "Export summary",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Download01 />
      {label}
    </Button>
  );
}
export function Field({
  label,
  id,
  children,
  hint,
}: {
  label: string;
  id: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="obs-field">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}
export function InlineError({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="inline-error">
      <AlertCircle />
      <span>{message}</span>
    </div>
  ) : null;
}
export function NewSession({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: unknown) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [criteria, setCriteria] = useState("");
  const [constraints, setConstraints] = useState("");
  const [budget, setBudget] = useState("0.10");
  const [model, setModel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="obs-dialog">
        <DialogHeader>
          <DialogTitle>Record an intent</DialogTitle>
          <DialogDescription>
            Capture what you expect before your agent starts. You’ll review the
            intent and authorize its tool budget next.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await onCreate({
                title,
                objective,
                criteria: criteria
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean)
                  .map((text) => ({ text, weight: 1 })),
                constraints,
                budgetMicros: Math.round(Number(budget) * 1e6),
                model: model.trim() || "Not reported",
                host: "External agent",
              });
              onOpenChange(false);
              setTitle("");
              setObjective("");
              setCriteria("");
              setConstraints("");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label="Session name" id="session-title">
            <Input
              id="session-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Research agent payment companies"
              maxLength={160}
              required
            />
          </Field>
          <Field label="What should the model deliver?" id="session-objective">
            <Textarea
              id="session-objective"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describe the output you want and who it is for."
              rows={3}
              maxLength={12000}
              required
            />
          </Field>
          <Field
            label="Success criteria"
            id="session-criteria"
            hint="One measurable criterion per line. These stay fixed once accepted."
          >
            <Textarea
              id="session-criteria"
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder={
                "Cite a primary source for every claim\nFlag any information that cannot be verified"
              }
              rows={3}
              required
            />
          </Field>
          <Field label="Constraints" id="session-constraints">
            <Input
              id="session-constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Optional scope, exclusions, or deadline"
              maxLength={4000}
            />
          </Field>
          <div className="form-two">
            <Field label="Tool budget (USD)" id="session-budget">
              <Input
                id="session-budget"
                type="number"
                min="0"
                max="5"
                step="0.001"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              />
            </Field>
            <Field
              label="Model name"
              id="session-model"
              hint="Optional; recorded as operator-entered."
            >
              <Input
                id="session-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Claude Sonnet"
                maxLength={160}
              />
            </Field>
          </div>
          <InlineError message={error} />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy} type="submit">
              {busy ? "Recording…" : "Record intent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function EvaluationForm({
  session,
  outcomeId,
  onSave,
}: {
  session: SessionDetail;
  outcomeId?: string;
  onSave: (data: unknown) => Promise<void>;
}) {
  const outcome = outcomeId
    ? session.outcomes.find((o) => o.id === outcomeId)!
    : session.outcomes.at(-1)!;
  const previous = session.evaluations
    .filter((e) => e.outcomeId === outcome.id)
    .at(-1);
  const [rows, setRows] = useState(() =>
    session.criteria.map((c) => ({
      criterionId: c.id,
      verdict:
        previous?.criteria.find((r) => r.criterionId === c.id)?.verdict ||
        ("unknown" as ReviewVerdict),
      note: previous?.criteria.find((r) => r.criterionId === c.id)?.note || "",
      evidenceCallIds:
        previous?.criteria.find((r) => r.criterionId === c.id)
          ?.evidenceCallIds || ([] as string[]),
    })),
  );
  const [reviewerKind, setReviewerKind] = useState<ReviewAuthor["kind"]>(
    previous?.reviewer?.kind || "unspecified",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!previous);
  const [evidenceCriterion, setEvidenceCriterion] = useState<number | null>(
    null,
  );
  const [evidenceQuery, setEvidenceQuery] = useState("");
  if (previous && !editing)
    return (
      <div className="saved-evaluation">
        {session.criteria.map((c, i) => {
          const r = previous.criteria.find((r) => r.criterionId === c.id)!;
          return (
            <div className="saved-criterion" key={c.id}>
              <div className="criterion-title">
                <span className="criterion-number">{i + 1}</span>
                <strong>{c.text}</strong>
                <StateBadge
                  label={r.verdict[0].toUpperCase() + r.verdict.slice(1)}
                />
              </div>
              <p>{r.note}</p>
              {!!r.evidenceCallIds.length && (
                <p className="field-hint">
                  Evidence:{" "}
                  {r.evidenceCallIds
                    .map((id) => {
                      const call = session.calls.find((c) => c.id === id);
                      return `${call?.tool.replaceAll("_", " ") || "Call"} · ${id.slice(0, 8)}`;
                    })
                    .join("; ")}
                </p>
              )}
            </div>
          );
        })}
        <Button
          variant="outline"
          onClick={() => {
            setRows(
              session.criteria.map((c) =>
                previous.criteria.find((r) => r.criterionId === c.id)!,
              ),
            );
            setReviewerKind(previous.reviewer?.kind || "unspecified");
            setEditing(true);
          }}
        >
          Revise evaluation
        </Button>
      </div>
    );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          await onSave({
            outcomeId: outcome.id,
            criteria: rows,
            ...(outcomeId ? { historical: true as const } : {}),
            reviewer: { kind: reviewerKind },
          });
          setEditing(false);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="review-source">
        <Label htmlFor={`review-source-${outcome.id}`}>Review source</Label>
        <Select
          value={reviewerKind}
          onValueChange={(value) =>
            setReviewerKind(value as ReviewAuthor["kind"])
          }
        >
          <SelectTrigger id={`review-source-${outcome.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unspecified">Account review</SelectItem>
            <SelectItem value="human_reported">
              Human review (self-reported)
            </SelectItem>
            <SelectItem value="assistant_reported">Assistant review</SelectItem>
          </SelectContent>
        </Select>
        <p className="field-hint">
          Recorded separately from the model’s own output. Reviewer identity is
          not independently verified.
        </p>
      </div>
      <div className="review-criteria">
        {session.criteria.map((c, i) => (
          <div className="review-criterion" key={c.id}>
            <div className="criterion-title">
              <span className="criterion-number">{i + 1}</span>
              <Label htmlFor={`verdict-${outcome.id}-${c.id}`}>{c.text}</Label>
              <Select
                value={rows[i].verdict}
                onValueChange={(v) =>
                  setRows((r) =>
                    r.map((x, j) =>
                      i === j ? { ...x, verdict: v as ReviewVerdict } : x,
                    ),
                  )
                }
              >
                <SelectTrigger
                  id={`verdict-${outcome.id}-${c.id}`}
                  aria-label={`Verdict for ${c.text}`}
                  className="verdict-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              aria-label={`Review note for ${c.text}`}
              value={rows[i].note}
              onChange={(e) =>
                setRows((r) =>
                  r.map((x, j) =>
                    i === j ? { ...x, note: e.target.value } : x,
                  ),
                )
              }
              placeholder="Explain what in the output supports this judgment, or what remains unknown."
              maxLength={2000}
              required
              rows={2}
            />
            {session.calls.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEvidenceQuery("");
                  setEvidenceCriterion(i);
                }}
                aria-label={`${rows[i].evidenceCallIds.length ? `${rows[i].evidenceCallIds.length} linked ${rows[i].evidenceCallIds.length === 1 ? "call" : "calls"} · Edit evidence` : "Link supporting evidence"} for ${c.text}`}
              >
                {rows[i].evidenceCallIds.length
                  ? `${rows[i].evidenceCallIds.length} linked ${rows[i].evidenceCallIds.length === 1 ? "call" : "calls"} · Edit evidence`
                  : "Link supporting evidence"}
              </Button>
            )}
          </div>
        ))}
      </div>
      <Dialog
        open={evidenceCriterion !== null}
        onOpenChange={(open) => {
          if (!open) setEvidenceCriterion(null);
        }}
      >
        <DialogContent className="evidence-picker-dialog">
          <DialogHeader>
            <DialogTitle>Choose supporting evidence</DialogTitle>
            <DialogDescription>
              {evidenceCriterion === null
                ? ""
                : session.criteria[evidenceCriterion].text}
            </DialogDescription>
          </DialogHeader>
          <Input
            aria-label="Search recorded calls"
            placeholder="Search a query, page, or tool…"
            value={evidenceQuery}
            onChange={(e) => setEvidenceQuery(e.target.value)}
          />
          <p className="field-hint">
            {session.calls.length} calls in this session. Linking existing
            evidence makes no new provider calls.
          </p>
          <div className="evidence-picker-list">
            {session.calls
              .filter((call) =>
                `${call.tool} ${call.arguments.query || call.arguments.url || ""} ${call.id} ${call.status}`
                  .toLowerCase()
                  .includes(evidenceQuery.toLowerCase()),
              )
              .map((call) => (
                <label key={call.id} className="evidence-picker-row">
                  <Checkbox
                    checked={
                      evidenceCriterion !== null &&
                      rows[evidenceCriterion].evidenceCallIds.includes(call.id)
                    }
                    onCheckedChange={(checked) =>
                      setRows((r) =>
                        r.map((x, j) =>
                          j === evidenceCriterion
                            ? {
                                ...x,
                                evidenceCallIds:
                                  checked === true
                                    ? [
                                        ...new Set([
                                          ...x.evidenceCallIds,
                                          call.id,
                                        ]),
                                      ]
                                    : x.evidenceCallIds.filter(
                                        (id) => id !== call.id,
                                      ),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                  <span>
                    <strong>
                      {call.arguments.query ||
                        call.arguments.url ||
                        call.tool.replaceAll("_", " ")}
                    </strong>
                    <small>
                      {call.tool.replaceAll("_", " ")} · {call.id.slice(0, 8)} ·{" "}
                      {call.status}
                    </small>
                  </span>
                </label>
              ))}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setEvidenceCriterion(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <InlineError message={error} />
      <div className="form-footer">
        <span className="subtle">
          Saved as an account review, with its own timestamp.
        </span>
        {previous && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            Cancel revision
          </Button>
        )}
        <Button disabled={busy}>
          {busy
            ? "Saving…"
            : previous
              ? "Save revised evaluation"
              : "Save evaluation"}
        </Button>
      </div>
    </form>
  );
}
export function EvaluationStats({ evaluation }: { evaluation: Evaluation }) {
  return (
    <div className="review-stats">
      <div>
        <span>Intent match</span>
        <strong>
          {evaluation.score === null ? "—" : `${evaluation.score}%`}
        </strong>
        <small>Among assessed criteria</small>
      </div>
      <div>
        <span>Review coverage</span>
        <strong>{evaluation.coverage}%</strong>
        <small>Unknown criteria remain unscored</small>
      </div>
      <div>
        <span>
          {evaluation.historical ? "Reviewed retrospectively" : "Reviewed"}
        </span>
        <strong className="stat-date">{date(evaluation.at)}</strong>
        <small>
          {evaluation.reviewer?.kind === "assistant_reported"
            ? "Assistant review"
            : evaluation.reviewer?.kind === "human_reported"
              ? "Human review (self-reported)"
              : "Account review"}
          {evaluation.reviewer?.label ? ` · ${evaluation.reviewer.label}` : ""}
        </small>
      </div>
    </div>
  );
}
export function IntentContent({ session }: { session: ObservationSession }) {
  return (
    <>
      <p className="intent-objective">{session.objective}</p>
      <div className="intent-criteria">
        {session.criteria.map((c, i) => (
          <div key={c.id}>
            <span className="criterion-number">{i + 1}</span>
            <span>{c.text}</span>
            {c.weight > 1 && <Badge variant="outline">Weight {c.weight}</Badge>}
          </div>
        ))}
      </div>
      {session.constraints && (
        <div className="constraint-block">
          <span>Constraints</span>
          <p>{session.constraints}</p>
        </div>
      )}
      <div className="intent-meta">
        <span>
          {session.approvedAt
            ? `${session.authorizationSource === "backend_policy" ? "Backend authorized" : "Accepted"} ${date(session.approvedAt)}`
            : "Awaiting your approval"}
        </span>
        <span>Tool budget {money(session.budgetMicros)}</span>
      </div>
    </>
  );
}
export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="external-link"
      href={href}
      target="_blank"
      rel="noreferrer noopener"
    >
      {children}
      <ArrowUpRight />
    </a>
  );
}
