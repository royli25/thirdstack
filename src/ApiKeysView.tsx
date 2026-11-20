import { startPolling } from "./polling";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Plus,
  RefreshCw01,
  SearchMd,
} from "@untitledui/icons";
import { useConnectAgent } from "./ConnectAgentDialog";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { CopyButton, Empty, InlineError, date } from "./observation-ui";
import { api, ApiError } from "./api";
import {
  API_KEY_SCOPES,
  API_KEY_TOOLS,
  type ApiKeyScope,
  type ScopedApiKey,
  type ApiKeyEvent,
} from "../server/api-key-types";
import "./api-keys.css";

const labels: Record<ApiKeyScope, [string, string]> = {
  "tools:discover": [
    "Discover tools",
    "Read the tool catalog and preview compatible tools.",
  ],
  "research:read": [
    "Read research",
    "Read your saved sessions, evidence, and activity.",
  ],
  "research:write": [
    "Write research",
    "Record agent intents, connection activity, and delivered outputs.",
  ],
  "tools:execute": [
    "Execute tools",
    "Call allowed providers within backend and key spending limits.",
  ],
  "usage:read": [
    "Read usage",
    "Read your usage totals and provider reporting coverage.",
  ],
};
const statusLabel = {
  active: "Active",
  at_limit: "At spend limit",
  expired: "Expired",
  revoked: "Revoked",
};
const dateOnly = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const canEdit = (key: ScopedApiKey) =>
  key.status === "active" || key.status === "at_limit";
const money = (micros: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(micros / 1e6);
export function ApiKeysView() {
  const openConnectAgent = useConnectAgent();
  const openingConnection = useRef(false);
  const [keys, setKeys] = useState<ScopedApiKey[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [localSetupRequired, setLocalSetupRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [mode, setMode] = useState<
    "create" | "edit" | "secret" | "revoke" | "setup" | null
  >(null);
  const [selected, setSelected] = useState<ScopedApiKey>();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<ApiKeyScope[]>([...API_KEY_SCOPES]);
  const [tools, setTools] = useState<string[]>([...API_KEY_TOOLS]);
  const [limit, setLimit] = useState("10");
  const [days, setDays] = useState("30");
  const [secret, setSecret] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [events, setEvents] = useState<ApiKeyEvent[]>([]);
  const createTrigger = useRef<HTMLButtonElement>(null);
  const dialogTrigger = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const key = useRef(crypto.randomUUID());
  const generation = useRef(0);
  const accessEpoch = useRef(0);
  const ownerApi = useCallback(
    async <T,>(path: string, body?: unknown): Promise<T> => {
      const epoch = accessEpoch.current;
      try {
        const result = await api<T>(path, body);
        if (epoch !== accessEpoch.current)
          throw new ApiError("Owner access changed. Refresh API keys.", 409);
        return result;
      } catch (e) {
        if (
          e instanceof ApiError &&
          [401, 403, 503].includes(e.status) &&
          epoch === accessEpoch.current
        ) {
          accessEpoch.current++;
          generation.current++;
          setKeys([]);
          setMode(null);
          setSelected(undefined);
          setSecret("");
          setRevealed(false);
          setEvents([]);
          setBusy(false);
          setLoading(false);
          setEnabled(false);
          setLocalSetupRequired(false);
          setFormError("");
          setError(e.message);
        }
        throw e;
      }
    },
    [],
  );
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const data = await ownerApi<{
        keys: ScopedApiKey[];
        enabled: boolean;
        accountModel: "authenticated_account" | "local_account";
      }>("/account/api-keys");
      if (current === generation.current) {
        setKeys(data.keys);
        setEnabled(data.enabled);
        setLocalSetupRequired(
          !data.enabled && data.accountModel === "local_account",
        );
        setError("");
      }
    } catch (e) {
      if (current === generation.current) setError((e as Error).message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [ownerApi]);
  useEffect(() => {
    const stop = startPolling(refresh, 15000);
    return () => {
      generation.current++;
      accessEpoch.current++;
      stop();
    };
  }, [refresh]);
  function close() {
    setMode(null);
    setSelected(undefined);
    setSecret("");
    setRevealed(false);
    setFormError("");
  }
  const changed = () => {
    key.current = crypto.randomUUID();
  };
  async function manage(item: ScopedApiKey) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await ownerApi<{
        key: ScopedApiKey;
        events: ApiKeyEvent[];
      }>(`/account/api-keys/${item.id}`);
      setSelected(data.key);
      setName(data.key.name);
      setScopes(data.key.scopes);
      setTools(data.key.allowedTools);
      setLimit(String(data.key.limitMicros / 1e6));
      setEvents(data.events);
      setSecret("");
      setFormError("");
      setMode("edit");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const searchTerm = search.trim().toLowerCase();
  const matching = keys.filter(
    (k) =>
      (filter === "all" || k.status === filter) &&
      `${k.name} ${k.prefix}`.toLowerCase().includes(searchTerm),
  );
  const selectedIsReadOnly = !!selected && !canEdit(selected);

  if (error && !enabled)
    return (
      <div className="ws-api-keys">
        <header className="api-keys-heading">
          <h1>API keys</h1>
          <Button
            className="api-keys-create"
            variant="brand"
            size="sm"
            disabled
          >
            <Plus />
            Create API key
          </Button>
        </header>
        <div className="api-keys-error">
          <InlineError message={error} />
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw01 />
            Refresh API keys
          </Button>
        </div>
      </div>
    );

  return (
    <div className="ws-api-keys">
      <header className="api-keys-heading">
        <h1>API keys</h1>
        <Button
          className="api-keys-create"
          variant="brand"
          size="sm"
          ref={createTrigger}
          disabled={!enabled || busy}
          onClick={(event) => {
            dialogTrigger.current = event.currentTarget;
            setSelected(undefined);
            setName("");
            setScopes([...API_KEY_SCOPES]);
            setTools([...API_KEY_TOOLS]);
            setLimit("10");
            setDays("30");
            setFormError("");
            setNotice("");
            setSecret("");
            setEvents([]);
            changed();
            setMode("create");
          }}
        >
          <Plus />
          Create API key
        </Button>
      </header>
      {error && (
        <div className="api-keys-error">
          <InlineError message={error} />
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw01 />
            Refresh API keys
          </Button>
        </div>
      )}
      {!mode && notice && (
        <p role="status" className="ws-panel-note">
          {notice}
        </p>
      )}
      <div className="api-keys-toolbar">
        <label className="api-keys-search">
          <SearchMd size={16} aria-hidden />
          <Input
            ref={searchInput}
            aria-label="Search API keys"
            placeholder="Search name or key prefix"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger aria-label="Key status" className="api-keys-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statusLabel).map(([value, label]) => (
              <SelectItem value={value} key={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card className="api-keys-library">
        <div role="region" aria-label="API keys">
          <table
            className="api-keys-table"
            role="table"
            aria-label="Your API keys"
          >
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">
                  Name
                </th>
                <th scope="col" role="columnheader">
                  Spend
                </th>
                <th scope="col" role="columnheader">
                  Expires
                </th>
                <th scope="col" role="columnheader">
                  Last used
                </th>
                <th scope="col" role="columnheader">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {loading ? (
                <tr className="api-keys-state" role="row">
                  <td role="cell" colSpan={5}>
                    <p role="status" className="ws-panel-note">
                      Loading API keys…
                    </p>
                  </td>
                </tr>
              ) : localSetupRequired && keys.length === 0 ? (
                <tr className="api-keys-state" role="row">
                  <td role="cell" colSpan={5}>
                    <Empty
                      title="Key creation is unavailable"
                      action={
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(event) => {
                            dialogTrigger.current = event.currentTarget;
                            setMode("setup");
                          }}
                        >
                          View local setup
                        </Button>
                      }
                    >
                      Finish setting up this local server to create API keys.
                    </Empty>
                  </td>
                </tr>
              ) : matching.length ? (
                matching.map((k) => {
                  const action = canEdit(k) ? "Manage" : "View";
                  return (
                    <tr key={k.id} role="row">
                      <th
                        scope="row"
                        role="rowheader"
                        className="api-key-identity"
                      >
                        <strong>{k.name}</strong>
                        <code>{k.prefix}</code>
                      </th>
                      <td role="cell">
                        <span
                          className="api-key-mobile-label"
                          aria-hidden="true"
                        >
                          Spend
                        </span>
                        {money(k.spentMicros)}
                      </td>
                      <td role="cell">
                        <span
                          className="api-key-mobile-label"
                          aria-hidden="true"
                        >
                          Expires
                        </span>
                        <time dateTime={k.expiresAt} title={date(k.expiresAt)}>
                          {dateOnly.format(new Date(k.expiresAt))}
                        </time>
                      </td>
                      <td role="cell">
                        <span
                          className="api-key-mobile-label"
                          aria-hidden="true"
                        >
                          Last used
                        </span>
                        {k.lastUsedAt ? (
                          <time
                            dateTime={k.lastUsedAt}
                            title={date(k.lastUsedAt)}
                          >
                            {dateOnly.format(new Date(k.lastUsedAt))}
                          </time>
                        ) : (
                          "Never"
                        )}
                      </td>
                      <td role="cell">
                        <Button
                          className="api-key-action"
                          variant="secondary"
                          size="xs"
                          disabled={busy}
                          aria-label={`${action} ${k.name}`}
                          onClick={(event) => {
                            dialogTrigger.current = event.currentTarget;
                            void manage(k);
                          }}
                        >
                          {action}
                          <ArrowUpRight />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="api-keys-state" role="row">
                  <td role="cell" colSpan={5}>
                    <Empty
                      title={
                        keys.length ? "No matching keys" : "No API keys yet"
                      }
                      action={
                        keys.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSearch("");
                              setFilter("all");
                              searchInput.current?.focus();
                            }}
                          >
                            Clear filters
                          </Button>
                        )
                      }
                    >
                      {keys.length
                        ? "Try another name or status."
                        : "Create a key for an agent or application."}
                    </Empty>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <Dialog
        open={!!mode}
        onOpenChange={(value) => {
          if (!value && !busy) close();
        }}
      >
        <DialogContent
          className="ws-detail-dialog api-key-dialog translate-x-0 translate-y-0"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (openingConnection.current) {
              openingConnection.current = false;
              return;
            }
            const trigger = dialogTrigger.current;
            requestAnimationFrame(() => {
              if (trigger?.isConnected && !trigger.disabled) trigger.focus();
              else if (createTrigger.current && !createTrigger.current.disabled)
                createTrigger.current.focus();
              else searchInput.current?.focus();
            });
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create"
                ? "Create API key"
                : mode === "setup"
                  ? "Set up local API keys"
                  : mode === "secret"
                    ? "Save your API key"
                    : mode === "revoke"
                      ? "Revoke API key"
                      : selectedIsReadOnly
                        ? "View API key"
                        : "Manage API key"}
            </DialogTitle>
            <DialogDescription>
              {mode === "secret"
                ? "Copy this credential now. Its full value cannot be retrieved again."
                : mode === "setup"
                  ? "Set API_TOKEN to a private value of at least 24 characters in the local server environment. Restart the server, then enter that access token when prompted."
                  : mode === "revoke"
                    ? "New requests stop immediately. Already admitted provider calls can finish and settle their reserved estimates."
                    : selectedIsReadOnly
                      ? "Review this key’s permissions, allowed tools, and spend."
                      : "Set permissions, allowed tools, and a total estimated-spend limit."}
            </DialogDescription>
          </DialogHeader>
          <InlineError message={formError} />
          {mode === "edit" && notice && (
            <p role="status" className="ws-panel-note">
              {notice}
            </p>
          )}
          {mode === "setup" ? (
            <Button variant="outline" onClick={close}>
              Done
            </Button>
          ) : mode === "secret" ? (
            <div className="ws-deposit-detail">
              <strong>{selected?.name}</strong>
              {secret ? (
                <>
                  <div className="ws-key-secret">
                    <Input
                      aria-label="New API key secret"
                      type={revealed ? "text" : "password"}
                      value={secret}
                      readOnly
                      autoComplete="off"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={revealed ? "Hide API key" : "Reveal API key"}
                      onClick={() => setRevealed((v) => !v)}
                    >
                      {revealed ? <EyeOff /> : <Eye />}
                    </Button>
                    <CopyButton text={secret} />
                  </div>
                  <p>
                    Store this key in your application’s secret settings.
                    Closing this dialog clears it from the page.
                  </p>
                </>
              ) : (
                <p>
                  This request already created a key. Its secret is no longer
                  available. Revoke that key and create another if the original
                  response was lost.
                </p>
              )}
              <div className="button-row">
                <Button onClick={close}>Done</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openingConnection.current = true;
                    close();
                    openConnectAgent(
                      dialogTrigger.current ?? createTrigger.current,
                      "product",
                    );
                  }}
                >
                  Product integration setup
                  <ArrowRight />
                </Button>
              </div>
            </div>
          ) : mode === "revoke" && selected ? (
            <div className="ws-deposit-detail">
              <strong>{selected.name}</strong>
              <code>{selected.prefix}</code>
              <p>
                Revocation is permanent. Other keys and saved receipts remain
                available.
              </p>
              <Button
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setFormError("");
                  try {
                    await ownerApi(`/account/api-keys/${selected.id}/revoke`, {
                      revision: selected.revision,
                    });
                    setNotice(`${selected.name} revoked.`);
                    close();
                    await refresh();
                  } catch (e) {
                    setFormError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Revoking…" : "Revoke this key"}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setMode("edit")}
              >
                Keep key
              </Button>
            </div>
          ) : (
            <form
              className="ws-deposit-form"
              onSubmit={async (e) => {
                e.preventDefault();
                if (selectedIsReadOnly) return;
                setBusy(true);
                setFormError("");
                try {
                  const body = {
                    name,
                    scopes,
                    allowedTools: tools,
                    limitUsd: limit,
                  };
                  if (mode === "create") {
                    const result = await ownerApi<{
                      key: ScopedApiKey;
                      secret: string | null;
                    }>("/account/api-keys", {
                      ...body,
                      requestKey: key.current,
                      expiresInDays: Number(days),
                    });
                    setSelected(result.key);
                    setSecret(result.secret ?? "");
                    setRevealed(false);
                    setMode("secret");
                  } else if (selected) {
                    const result = await ownerApi<ScopedApiKey>(
                      `/account/api-keys/${selected.id}`,
                      { ...body, revision: selected.revision },
                    );
                    setSelected(result);
                    setNotice("API key settings updated.");
                    setEvents(
                      (
                        await ownerApi<{ events: ApiKeyEvent[] }>(
                          `/account/api-keys/${selected.id}`,
                        )
                      ).events,
                    );
                  }
                  await refresh();
                } catch (e) {
                  setFormError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                <span>Key name</span>
                <Input
                  aria-label="API key name"
                  value={name}
                  maxLength={80}
                  required
                  disabled={busy || selectedIsReadOnly}
                  onChange={(e) => {
                    setName(e.target.value);
                    changed();
                  }}
                  placeholder="Codex development"
                />
              </label>
              <label>
                <span>Permission preset</span>
                <select
                  aria-label="Permission preset"
                  disabled={busy || selectedIsReadOnly}
                  value={
                    scopes.length === API_KEY_SCOPES.length
                      ? "agent"
                      : scopes.length === 3 &&
                          scopes.includes("usage:read") &&
                          !scopes.includes("tools:execute") &&
                          !scopes.includes("research:write")
                        ? "read"
                        : "custom"
                  }
                  onChange={(e) => {
                    if (e.target.value === "agent")
                      setScopes([...API_KEY_SCOPES]);
                    else if (e.target.value === "read")
                      setScopes([
                        "tools:discover",
                        "research:read",
                        "usage:read",
                      ]);
                    changed();
                  }}
                >
                  <option value="agent">Agent access</option>
                  <option value="read">Read only</option>
                  <option value="custom">Custom permissions</option>
                </select>
              </label>
              <fieldset className="ws-key-options">
                <legend>Permissions</legend>
                {API_KEY_SCOPES.map((scope) => (
                  <label key={scope}>
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      disabled={busy || selectedIsReadOnly}
                      onChange={(e) => {
                        setScopes((v) =>
                          e.target.checked
                            ? [...v, scope]
                            : v.filter((x) => x !== scope),
                        );
                        changed();
                      }}
                    />
                    <span>
                      <strong>{labels[scope][0]}</strong>
                      <small>{labels[scope][1]}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <fieldset className="ws-key-options">
                <legend>Allowed tools</legend>
                {API_KEY_TOOLS.map((tool) => (
                  <label key={tool}>
                    <input
                      type="checkbox"
                      checked={tools.includes(tool)}
                      disabled={busy || selectedIsReadOnly}
                      onChange={(e) => {
                        setTools((v) =>
                          e.target.checked
                            ? [...v, tool]
                            : v.filter((x) => x !== tool),
                        );
                        changed();
                      }}
                    />
                    <span>
                      <strong>{tool}</strong>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label>
                <span>Total estimated-spend limit in USD</span>
                <Input
                  aria-label="API key spend limit"
                  inputMode="decimal"
                  value={limit}
                  required
                  disabled={busy || selectedIsReadOnly}
                  onChange={(e) => {
                    setLimit(e.target.value);
                    changed();
                  }}
                />
                <small>
                  $0–$1,000, up to six decimal places. Includes estimates spent
                  and currently reserved across all sessions using this key.
                  Provider invoices can differ.
                </small>
              </label>
              {mode === "create" ? (
                <label>
                  <span>Expires after</span>
                  <select
                    aria-label="API key expiry"
                    value={days}
                    onChange={(e) => {
                      setDays(e.target.value);
                      changed();
                    }}
                  >
                    {[7, 30, 90, 365].map((n) => (
                      <option value={n} key={n}>
                        {n} days
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                selected && (
                  <div className="ws-detail-facts">
                    <div>
                      <span>Expires</span>
                      <strong>{date(selected.expiresAt)}</strong>
                    </div>
                    <div>
                      <span>Spent / reserved estimates</span>
                      <strong>
                        {money(selected.spentMicros)} /{" "}
                        {money(selected.reservedMicros)}
                      </strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{statusLabel[selected.status]}</strong>
                    </div>
                    <div>
                      <span>Revision</span>
                      <strong>{selected.revision}</strong>
                    </div>
                  </div>
                )
              )}
              {!selectedIsReadOnly && (
                <Button
                  type="submit"
                  disabled={busy || scopes.length === 0 || tools.length === 0}
                >
                  {busy
                    ? "Saving…"
                    : mode === "create"
                      ? "Create key"
                      : "Save key settings"}
                </Button>
              )}
              {selected && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void manage(selected)}
                  >
                    Reload saved settings
                  </Button>
                  {!selected.revokedAt && (
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => {
                        setFormError("");
                        setMode("revoke");
                      }}
                    >
                      Revoke key
                    </Button>
                  )}
                  <h3>Key audit history</h3>
                  {events.length ? (
                    <ol className="ws-dispute-history">
                      {events.map((event) => (
                        <li key={event.id}>
                          <strong>
                            {event.type} · Revision {event.current.revision}
                          </strong>
                          <small className="ws-dispute-subline">
                            {date(event.at)} · Account owner credential
                          </small>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p>No key changes recorded.</p>
                  )}
                </>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
