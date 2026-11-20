import { useEffect, useState } from "react";
import type { ProviderId } from "../server/types";
import type { Listing } from "../server/seller-store";
import { api } from "./api";
import { Panel, InlineError, date } from "./observation-ui";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

type ListingState = {
  tool: string;
  current: {
    version: number;
    description: string;
    useWhen: string;
    limitations: string;
  };
  pending: Listing | null;
  history: Listing[];
  limits: { description: number; useWhen: number; limitations: number };
};
type Impact = {
  minSample: number;
  caution: string;
  versions: {
    version: number;
    label: string;
    eligible: number;
    chosen: number;
    chosenShare: number | null;
    againstPrevious: { chosenSharePoints: number | null } | null;
  }[];
};
const fields = [
  ["description", "What it does"],
  ["useWhen", "When to use it"],
  ["limitations", "Limits agents should know"],
] as const;
const percent = (v: number | null) =>
  v === null ? "—" : `${Math.round(v * 100)}%`;

export function SellerListingView({
  provider,
  demo,
}: {
  provider: ProviderId;
  demo: boolean;
}) {
  const [state, setState] = useState<ListingState>();
  const [impact, setImpact] = useState<Impact>();
  const [draft, setDraft] = useState({
    description: "",
    useWhen: "",
    limitations: "",
    note: "",
  });
  const [problems, setProblems] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let stale = false;
    if (demo) return;
    Promise.all([
      api<ListingState>(`/seller/${provider}/listing`),
      api<Impact>(`/seller/${provider}/listing-impact`),
    ])
      .then(([listing, measured]) => {
        if (stale) return;
        setState(listing);
        setImpact(measured);
        // Only the editable fields: the server rejects anything else.
        setDraft((d) =>
          d.description
            ? d
            : {
                description: listing.current.description,
                useWhen: listing.current.useWhen,
                limitations: listing.current.limitations,
                note: "",
              },
        );
      })
      .catch((e) => !stale && setError((e as Error).message));
    return () => {
      stale = true;
    };
  }, [provider, demo, revision]);
  if (demo)
    return (
      <Panel title="Your listing">
        <div className="lab-empty">
          <h3>Connect this view to your workspace</h3>
          <p>
            Choose Local lab above to edit what agents read about this tool.
          </p>
        </div>
      </Panel>
    );
  async function act(path: string, body: unknown, done: string) {
    setError("");
    setNotice("");
    try {
      await api(`/seller/${provider}${path}`, body);
      setNotice(done);
      setRevision((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function check() {
    setError("");
    try {
      const { note: _note, ...body } = draft;
      const result = await api<{ ok: boolean; problems: string[] }>(
        `/seller/${provider}/listing/check`,
        { ...body, note: draft.note },
      );
      setProblems(result.problems);
      setNotice(result.ok ? "This text can be submitted for review." : "");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="provider-activity seller-choices">
      <div className="lab-result-heading">
        <div>
          <h2>Your listing</h2>
          <p>
            What agents read when they decide whether to use this tool. Changes
            are reviewed before agents see them.
          </p>
        </div>
      </div>
      <InlineError message={error} />
      {notice && <p role="status">{notice}</p>}
      {!state && !error && <p role="status">Loading listing…</p>}
      {state && (
        <>
          <div className="choices-grid">
            <Panel
              title="Shown to agents now"
              action={
                <Badge variant="secondary">
                  {state.current.version
                    ? `Version ${state.current.version}`
                    : "Built-in text"}
                </Badge>
              }
            >
              <dl className="listing-current">
                {fields.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    <dd>{state.current[key]}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
            <Panel
              title={state.pending ? "Waiting for review" : "Propose a change"}
              description={
                state.pending
                  ? `Version ${state.pending.version}, submitted ${date(state.pending.submittedAt)}`
                  : "Describe the tool. Text that tells the agent what to choose, ranks the tool, or names another company is refused."
              }
            >
              {state.pending ? (
                <>
                  <dl className="listing-current">
                    {fields.map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{state.pending![key]}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="listing-actions">
                    <Button
                      onClick={() =>
                        act(
                          "/listing/review",
                          {
                            version: state.pending!.version,
                            decision: "approve",
                          },
                          "Approved. Agents now see this version.",
                        )
                      }
                    >
                      Approve as reviewer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        act(
                          "/listing/review",
                          {
                            version: state.pending!.version,
                            decision: "reject",
                          },
                          "Rejected. Agents still see the earlier text.",
                        )
                      }
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        act(
                          "/listing/withdraw",
                          { version: state.pending!.version },
                          "Withdrawn.",
                        )
                      }
                    >
                      Withdraw
                    </Button>
                  </div>
                </>
              ) : (
                <form
                  className="listing-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void act(
                      "/listing",
                      draft,
                      "Submitted for review. Agents still see the current text.",
                    );
                  }}
                >
                  {fields.map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={`listing-${key}`}>
                        {label} · {draft[key].length}/{state.limits[key]}
                      </Label>
                      <Textarea
                        id={`listing-${key}`}
                        value={draft[key]}
                        maxLength={state.limits[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                  <div>
                    <Label htmlFor="listing-note">
                      Note to yourself: what this change is meant to fix
                    </Label>
                    <Textarea
                      id="listing-note"
                      value={draft.note}
                      maxLength={300}
                      onChange={(e) =>
                        setDraft({ ...draft, note: e.target.value })
                      }
                    />
                  </div>
                  {problems.length > 0 && (
                    <ul className="choices-callouts">
                      {problems.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  )}
                  <div className="listing-actions">
                    <Button type="submit">Submit for review</Button>
                    <Button type="button" variant="outline" onClick={check}>
                      Check wording
                    </Button>
                  </div>
                </form>
              )}
            </Panel>
          </div>
          {impact && (
            <Panel
              title="How each version performed"
              description={`Tasks that were shown each version, over the last 90 days. ${impact.caution}`}
            >
              <div className="lab-table-wrap">
                <table className="lab-table choices-table">
                  <thead>
                    <tr>
                      <th>Version</th>
                      <th>Eligible</th>
                      <th>Chosen</th>
                      <th>Share</th>
                      <th>Against previous</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impact.versions.map((v) => (
                      <tr key={v.version}>
                        <td>{v.label}</td>
                        <td>{v.eligible}</td>
                        <td>{v.chosen}</td>
                        <td>{percent(v.chosenShare)}</td>
                        <td>
                          {v.againstPrevious?.chosenSharePoints == null
                            ? "—"
                            : `${v.againstPrevious.chosenSharePoints > 0 ? "+" : ""}${v.againstPrevious.chosenSharePoints} pts`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
          <Panel title="Version history">
            {state.history.length ? (
              <ul className="choices-findings">
                {state.history.map((l) => (
                  <li key={l.version}>
                    <strong>
                      Version {l.version} · {l.status}
                    </strong>
                    <span>
                      Submitted {date(l.submittedAt)}
                      {l.note ? ` · ${l.note}` : ""}
                      {l.reviewNote ? ` · Reviewer: ${l.reviewNote}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="choices-empty">
                No changes yet. Agents see the built-in text.
              </p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
