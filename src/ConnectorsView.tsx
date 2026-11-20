import { useEffect, useRef, useState } from "react";
import { Plus, RefreshCw01 } from "@untitledui/icons";
import type {
  ConnectorTool,
  ConnectorView,
  ConnectorToolStatus,
} from "../server/connectors";
import { api, money } from "./api";
import { Panel, InlineError, date } from "./observation-ui";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import "./roles.css";
import "./connectors.css";

type Mode = "operator" | "company" | "admin";
type HistoryEvent = {
  id: number;
  type: string;
  at: string;
  actor?: string;
  data: Record<string, unknown>;
};
type ToolDecision = "keep" | "approve" | "reject" | "disable";

const connectorStatus: Record<ConnectorView["status"], string> = {
  pending: "Waiting for review",
  approved: "Live",
  rejected: "Changes requested",
  suspended: "Suspended",
};
const toolStatus: Record<ConnectorToolStatus, string> = {
  pending: "Needs review",
  approved: "Approved",
  rejected: "Rejected",
  disabled: "Turned off",
  removed: "Removed by company",
};
const eventLabels: Record<string, string> = {
  connector_registered: "Registered",
  connector_updated: "Connection updated",
  tools_refreshed: "Tool list refreshed",
  tools_refresh_failed: "Tool list could not be read",
  connector_reviewed: "Reviewed",
};
const usd = (micros: number) => (micros / 1e6).toString();

function Status({ value, label }: { value: string; label: string }) {
  return (
    <span className="connector-status" data-status={value}>
      {label}
    </span>
  );
}

function eventDetail(e: HistoryEvent) {
  const d = e.data;
  if (e.type === "connector_reviewed")
    return `${String(d.from)} → ${String(d.to)}${d.note ? ` · ${String(d.note)}` : ""}`;
  if (e.type === "tools_refreshed") {
    const parts = (["added", "changed", "removed"] as const)
      .map((k) => {
        const list = (d[k] as string[] | undefined) ?? [];
        return list.length ? `${k}: ${list.join(", ")}` : "";
      })
      .filter(Boolean);
    return parts.join(" · ") || "No changes";
  }
  if (e.type === "connector_updated")
    return `Changed ${((d.changed as string[]) ?? []).join(", ")}`;
  if (e.type === "tools_refresh_failed") return String(d.error ?? "");
  if (e.type === "connector_registered")
    return `${((d.tools as string[]) ?? []).length} tools read`;
  return "";
}

/**
 * Company connectors. One screen for three audiences:
 * the local operator (registers and reviews), a company (registers and
 * maintains; analysts read), and platform administrators (review only).
 */
export function ConnectorsView({
  mode,
  base,
  canWrite,
  canReview,
  locked,
}: {
  mode: Mode;
  /** API path, for example `/connectors` or `/companies/:id/connectors`. */
  base: string;
  canWrite: boolean;
  canReview: boolean;
  /** Shown instead of the screen, for example before company approval. */
  locked?: string;
}) {
  const [connectors, setConnectors] = useState<ConnectorView[]>();
  const [tokenStorage, setTokenStorage] = useState(true);
  const [selectedId, setSelectedId] = useState<string>();
  const [detail, setDetail] = useState<{
    connector: ConnectorView;
    events: HistoryEvent[];
  }>();
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (locked) return;
    let active = true;
    api<{ connectors: ConnectorView[]; tokenStorage: boolean }>(base)
      .then((data) => {
        if (!active) return;
        setConnectors(data.connectors);
        setTokenStorage(data.tokenStorage);
        setSelectedId((current) =>
          current && data.connectors.some((c) => c.id === current)
            ? current
            : (data.connectors.find((c) => c.status === "pending")?.id ??
              data.connectors[0]?.id),
        );
      })
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [base, revision, locked]);

  useEffect(() => {
    if (!selectedId || locked) {
      setDetail(undefined);
      return;
    }
    let active = true;
    api<{ connector: ConnectorView; events: HistoryEvent[] }>(
      `${base}/${selectedId}`,
    )
      .then((data) => active && setDetail(data))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [base, selectedId, revision, locked]);

  async function act<T>(path: string, body: unknown, done: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api<T>(path, body);
      setNotice(done);
      setRevision((v) => v + 1);
      return result;
    } catch (e) {
      setError((e as Error).message);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  const heading = {
    operator: {
      title: "Connectors",
      text: "MCP servers that tool companies run themselves. Register one, review its tools, and agents can call the approved ones through Two Hands.",
    },
    company: {
      title: "Connectors",
      text: "Connect your own MCP server. Two Hands reads its tools, a platform reviewer approves them, and agents can then call them with every call recorded.",
    },
    admin: {
      title: "Connector reviews",
      text: "Approve company tools at an exact schema and price. A changed schema returns a tool to review; suspending a connector stops every call immediately.",
    },
  }[mode];

  return (
    <div className="connectors-page">
      <div className="page-heading">
        <div>
          <h1>{heading.title}</h1>
          <p>{heading.text}</p>
        </div>
        {!locked && (
          <div className="connectors-heading-actions">
            <Button
              variant="outline"
              onClick={() => setRevision((v) => v + 1)}
              disabled={busy}
            >
              <RefreshCw01 />
              Reload
            </Button>
            {canWrite && (
              <Button
                onClick={() => {
                  setRegistering(true);
                  setNotice("");
                }}
              >
                <Plus />
                Register connector
              </Button>
            )}
          </div>
        )}
      </div>
      <InlineError message={error} />
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {locked ? (
        <Panel title="Not available yet">
          <p>{locked}</p>
        </Panel>
      ) : !connectors ? (
        !error && <p role="status">Loading connectors…</p>
      ) : (
        <div className="connectors-layout">
          <Panel
            title={mode === "admin" ? "All connectors" : "Your connectors"}
            className="connectors-list"
          >
            {connectors.length ? (
              <ul>
                {connectors.map((c) => {
                  const live = c.tools.filter(
                    (t) => t.status === "approved",
                  ).length;
                  const waiting = c.tools.filter(
                    (t) => t.status === "pending",
                  ).length;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-pressed={!registering && c.id === selectedId}
                        onClick={() => {
                          setRegistering(false);
                          setSelectedId(c.id);
                          setNotice("");
                        }}
                      >
                        <span className="connector-list-name">
                          <strong>{c.name}</strong>
                          <code>{c.slug}</code>
                        </span>
                        <Status
                          value={c.status}
                          label={connectorStatus[c.status]}
                        />
                        <small>
                          {live} approved
                          {waiting ? ` · ${waiting} need review` : ""}
                        </small>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="connectors-empty">
                {canWrite
                  ? "No connectors yet. Register your MCP server to get started."
                  : "No connectors have been registered."}
              </p>
            )}
          </Panel>
          {registering && canWrite ? (
            <RegisterForm
              tokenStorage={tokenStorage}
              busy={busy}
              onCancel={() => setRegistering(false)}
              onSubmit={async (body) => {
                const created = await act<ConnectorView>(
                  base,
                  body,
                  "Connector registered. Its tools are waiting for review.",
                );
                if (created) {
                  setRegistering(false);
                  setSelectedId(created.id);
                }
                return !!created;
              }}
            />
          ) : detail ? (
            <ConnectorDetail
              key={`${detail.connector.id}:${detail.connector.revision}`}
              connector={detail.connector}
              events={detail.events}
              canWrite={canWrite}
              canReview={canReview}
              tokenStorage={tokenStorage}
              busy={busy}
              act={(path, body, done) =>
                act(`${base}/${detail.connector.id}${path}`, body, done)
              }
            />
          ) : (
            connectors.length > 0 && (
              <Panel title="Select a connector">
                <p>Choose a connector to see its tools and history.</p>
              </Panel>
            )
          )}
        </div>
      )}
    </div>
  );
}

function RegisterForm({
  tokenStorage,
  busy,
  onCancel,
  onSubmit,
}: {
  tokenStorage: boolean;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (body: unknown) => Promise<boolean>;
}) {
  const requestKey = useRef(crypto.randomUUID());
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    endpoint: "",
    token: "",
    price: "0.002",
  });
  const set = (key: keyof typeof form) => (value: string) =>
    setForm({ ...form, [key]: value });
  return (
    <Panel
      title="Register a connector"
      description="Two Hands connects to your server now and reads its tool list. Nothing is available to agents until a reviewer approves it."
    >
      <form
        className="portal-form connectors-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await onSubmit({
            requestKey: requestKey.current,
            name: form.name,
            slug: form.slug,
            description: form.description,
            endpoint: form.endpoint,
            ...(form.token ? { token: form.token } : {}),
            declaredPriceUsd: Number(form.price),
          });
          if (ok) requestKey.current = crypto.randomUUID();
        }}
      >
        <label>
          Display name
          <Input
            required
            minLength={2}
            maxLength={80}
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
          />
        </label>
        <label>
          Short name
          <Input
            required
            pattern="[a-z][a-z0-9]{1,23}"
            maxLength={24}
            placeholder="weatherco"
            value={form.slug}
            onChange={(e) => set("slug")(e.target.value.toLowerCase())}
          />
          <small>
            2–24 lowercase letters or digits. Agents see tools as{" "}
            <code>{form.slug || "name"}__tool</code>. It cannot be changed
            later.
          </small>
        </label>
        <label>
          What your tools do
          <Textarea
            required
            minLength={20}
            maxLength={1500}
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
          />
        </label>
        <label>
          MCP endpoint
          <Input
            required
            type="url"
            placeholder="https://mcp.yourcompany.com/mcp"
            maxLength={2048}
            value={form.endpoint}
            onChange={(e) => set("endpoint")(e.target.value)}
          />
          <small>
            A public HTTPS address using Streamable HTTP. Redirects are not
            followed.
          </small>
        </label>
        <label>
          Access token (optional)
          <Input
            type="password"
            autoComplete="off"
            minLength={8}
            maxLength={4096}
            disabled={!tokenStorage}
            value={form.token}
            onChange={(e) => set("token")(e.target.value)}
          />
          <small>
            {tokenStorage
              ? "Sent as a bearer token. Stored encrypted and never shown again."
              : "Token storage is not configured on this server, so only endpoints without a token can be registered."}
          </small>
        </label>
        <label>
          Price per call, USD
          <Input
            required
            type="number"
            min={0}
            max={5}
            step={0.0001}
            value={form.price}
            onChange={(e) => set("price")(e.target.value)}
          />
          <small>
            Your proposed estimate. The reviewer sets the approved price.
          </small>
        </label>
        <div className="connectors-actions">
          <Button type="submit" disabled={busy}>
            {busy ? "Connecting…" : "Connect and read tools"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function ConnectorDetail({
  connector: c,
  events,
  canWrite,
  canReview,
  tokenStorage,
  busy,
  act,
}: {
  connector: ConnectorView;
  events: HistoryEvent[];
  canWrite: boolean;
  canReview: boolean;
  tokenStorage: boolean;
  busy: boolean;
  act: (path: string, body: unknown, done: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({
    endpoint: c.endpoint,
    token: "",
    removeToken: false,
    description: c.description,
    price: usd(c.declaredPriceMicros),
  });
  const reviewable = c.tools.filter((t) => t.status !== "removed");
  const [decisions, setDecisions] = useState<Record<string, ToolDecision>>(() =>
    Object.fromEntries(
      // Approval is always an explicit choice per tool.
      reviewable.map((t) => [t.name, "keep"]),
    ),
  );
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(reviewable.map((t) => [t.name, usd(t.estimateMicros)])),
  );
  const [verdict, setVerdict] = useState<
    "approve" | "reject" | "suspend" | "reinstate"
  >(c.status === "suspended" ? "reinstate" : "approve");
  const [note, setNote] = useState("");
  const pendingCount = c.tools.filter((t) => t.status === "pending").length;

  return (
    <div className="connector-detail">
      <Panel
        title={c.name}
        description={c.description}
        action={<Status value={c.status} label={connectorStatus[c.status]} />}
      >
        <dl className="portal-details connector-facts">
          <dt>Short name</dt>
          <dd>
            <code>{c.slug}</code>
          </dd>
          <dt>Endpoint</dt>
          <dd className="connector-endpoint">{c.endpoint}</dd>
          <dt>Access token</dt>
          <dd>{c.hasCredential ? "Stored, encrypted" : "None"}</dd>
          <dt>Proposed price</dt>
          <dd>{money(c.declaredPriceMicros)} per call</dd>
          <dt>Tool list</dt>
          <dd>
            Version {c.snapshotVersion}
            {c.lastRefreshedAt ? `, read ${date(c.lastRefreshedAt)}` : ""}
            {c.lastRefreshError && (
              <span className="connector-warning">
                {" "}
                · Last refresh failed: {c.lastRefreshError}
              </span>
            )}
          </dd>
          {c.reviewNote && (
            <>
              <dt>Reviewer note</dt>
              <dd>{c.reviewNote}</dd>
            </>
          )}
        </dl>
        {canWrite && (
          <div className="connectors-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                act(
                  "/refresh",
                  {},
                  "Tool list refreshed. Changed tools need review again.",
                )
              }
            >
              <RefreshCw01 />
              Refresh tool list
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Close" : "Edit connection"}
            </Button>
          </div>
        )}
        {editing && canWrite && (
          <form
            className="portal-form connectors-form connector-edit"
            onSubmit={async (e) => {
              e.preventDefault();
              await act(
                "/update",
                {
                  revision: c.revision,
                  endpoint: edit.endpoint,
                  description: edit.description,
                  declaredPriceUsd: Number(edit.price),
                  ...(edit.removeToken
                    ? { token: null }
                    : edit.token
                      ? { token: edit.token }
                      : {}),
                },
                "Saved. A new endpoint or token needs review before agents can use it again.",
              );
            }}
          >
            <label>
              MCP endpoint
              <Input
                required
                type="url"
                value={edit.endpoint}
                onChange={(e) => setEdit({ ...edit, endpoint: e.target.value })}
              />
            </label>
            <label>
              New access token
              <Input
                type="password"
                autoComplete="off"
                minLength={8}
                disabled={!tokenStorage || edit.removeToken}
                placeholder={c.hasCredential ? "Leave blank to keep" : ""}
                value={edit.token}
                onChange={(e) => setEdit({ ...edit, token: e.target.value })}
              />
            </label>
            {c.hasCredential && (
              <label className="portal-checkbox">
                <input
                  type="checkbox"
                  checked={edit.removeToken}
                  onChange={(e) =>
                    setEdit({ ...edit, removeToken: e.target.checked })
                  }
                />
                Remove the stored token
              </label>
            )}
            <label>
              Description
              <Textarea
                required
                minLength={20}
                maxLength={1500}
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </label>
            <label>
              Proposed price per call, USD
              <Input
                type="number"
                min={0}
                max={5}
                step={0.0001}
                value={edit.price}
                onChange={(e) => setEdit({ ...edit, price: e.target.value })}
              />
            </label>
            <div className="connectors-actions">
              <Button type="submit" disabled={busy}>
                Save changes
              </Button>
            </div>
          </form>
        )}
      </Panel>

      <Panel
        title="Tools"
        description={
          canReview
            ? "Approve each tool at the schema shown. The price is what agents are charged per call."
            : pendingCount
              ? `${pendingCount} tool${pendingCount === 1 ? "" : "s"} waiting for review. Agents can only see approved tools.`
              : "Agents can see and call approved tools."
        }
      >
        <div className="lab-table-wrap">
          <table className="lab-table connector-tools">
            <thead>
              <tr>
                <th>Tool</th>
                <th>Status</th>
                <th>Price</th>
                {canReview && <th>Decision</th>}
              </tr>
            </thead>
            <tbody>
              {c.tools.map((t) => (
                <ToolRow
                  key={t.name}
                  tool={t}
                  canReview={canReview && t.status !== "removed"}
                  decision={decisions[t.name] ?? "keep"}
                  price={prices[t.name] ?? usd(t.estimateMicros)}
                  onDecision={(d) =>
                    setDecisions({ ...decisions, [t.name]: d })
                  }
                  onPrice={(p) => setPrices({ ...prices, [t.name]: p })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {canReview && (
        <Panel
          title="Review"
          description="Your decisions apply to the exact tool versions shown above. If the company changed anything since you opened this page, the review is refused and you can reload."
        >
          <form
            className="portal-form connectors-form"
            onSubmit={async (e) => {
              e.preventDefault();
              await act(
                "/review",
                {
                  revision: c.revision,
                  decision: verdict,
                  note,
                  tools: reviewable
                    .filter((t) => decisions[t.name] !== "keep")
                    .map((t) => ({
                      name: t.name,
                      schemaHash: t.schemaHash,
                      decision: decisions[t.name],
                      ...(decisions[t.name] === "approve"
                        ? { estimateUsd: Number(prices[t.name]) }
                        : {}),
                    })),
                },
                {
                  approve:
                    "Review saved. Approved tools are now available to agents.",
                  reject: "Review saved. The company can update and resubmit.",
                  suspend: "Connector suspended. Agents can no longer call it.",
                  reinstate: "Connector reinstated.",
                }[verdict],
              );
            }}
          >
            <label>
              Connector decision
              <select
                value={verdict}
                onChange={(e) => setVerdict(e.target.value as typeof verdict)}
              >
                <option value="approve">Approve</option>
                <option value="reject">Request changes</option>
                <option value="suspend">Suspend</option>
                {c.status === "suspended" && (
                  <option value="reinstate">Reinstate</option>
                )}
              </select>
            </label>
            <label>
              Note to the company
              <Textarea
                maxLength={600}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <div className="connectors-actions">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save review"}
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="History">
        {events.length ? (
          <ul className="connector-history">
            {events.map((e) => (
              <li key={e.id}>
                <strong>{eventLabels[e.type] ?? e.type}</strong>
                <span>
                  {date(e.at)}
                  {eventDetail(e) ? ` · ${eventDetail(e)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="connectors-empty">No history yet.</p>
        )}
      </Panel>
    </div>
  );
}

function ToolRow({
  tool: t,
  canReview,
  decision,
  price,
  onDecision,
  onPrice,
}: {
  tool: ConnectorTool;
  canReview: boolean;
  decision: ToolDecision;
  price: string;
  onDecision: (d: ToolDecision) => void;
  onPrice: (p: string) => void;
}) {
  return (
    <tr data-status={t.status}>
      <td>
        <code>{t.exposedName}</code>
        {t.description && (
          <p className="connector-tool-text">{t.description}</p>
        )}
        <details className="connector-schema">
          <summary>Input schema · {t.schemaHash.slice(0, 8)}</summary>
          <pre>{JSON.stringify(t.inputSchema, null, 2)}</pre>
        </details>
      </td>
      <td>
        <Status value={t.status} label={toolStatus[t.status]} />
      </td>
      <td>
        {canReview && decision === "approve" ? (
          <Input
            aria-label={`Price per call for ${t.name}, USD`}
            className="connector-price"
            type="number"
            min={0}
            max={5}
            step={0.0001}
            value={price}
            onChange={(e) => onPrice(e.target.value)}
          />
        ) : (
          money(t.estimateMicros)
        )}
      </td>
      {canReview && (
        <td>
          <select
            aria-label={`Decision for ${t.name}`}
            value={decision}
            onChange={(e) => onDecision(e.target.value as ToolDecision)}
          >
            <option value="keep">No change</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="disable">Turn off</option>
          </select>
        </td>
      )}
    </tr>
  );
}
