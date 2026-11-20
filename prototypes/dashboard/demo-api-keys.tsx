import { useEffect, useRef, useState, type FormEvent, type Ref } from "react";
import {
  ArrowUpRight,
  Copy01,
  Eye,
  EyeOff,
  Key01,
  Plus,
  SearchMd,
  TerminalSquare,
} from "@untitledui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  API_KEY_SCOPES,
  API_KEY_TOOLS,
  type ApiKeyScope,
} from "../../server/api-key-types";
import {
  providerCatalog,
  type CatalogToolName,
} from "../../server/provider-catalog";
import "@fontsource-variable/geist-mono";
import "./demo-api-keys.css";

const permissions = {
  "tools:discover": [
    "Discover tools",
    "Read the tool catalog and preview compatible tools.",
  ],
  "research:read": [
    "Read research",
    "Read saved sessions, activity, and evidence for this account.",
  ],
  "research:write": [
    "Write research",
    "Record agent requests and their delivered outputs.",
  ],
  "tools:execute": [
    "Execute tools",
    "Call the tools you allow within the applicable spend limits.",
  ],
  "usage:read": [
    "Read usage",
    "View usage totals and provider reporting coverage.",
  ],
} satisfies Record<ApiKeyScope, readonly [string, string]>;
const readOnly: ApiKeyScope[] = [
  "tools:discover",
  "research:read",
  "usage:read",
];
const statuses = {
  active: "Active",
  at_limit: "At spend limit",
  expired: "Expired",
  revoked: "Revoked",
} as const;
const expiryOptions = ["7", "30", "90", "365"] as const;
type Expiry = (typeof expiryOptions)[number];
type KeyStatus = keyof typeof statuses;
type Filter = KeyStatus | "all";
type KeyPolicy = {
  name: string;
  scopes: ApiKeyScope[];
  tools: CatalogToolName[];
  limit: number;
};
type KeyEvent = { label: string; at: number };
type DemoKey = KeyPolicy & {
  id: string;
  prefix: string;
  spent: number;
  reserved: number;
  expires: number;
  lastUsed: number | null;
  revokedAt?: number;
  events: KeyEvent[];
};
type KeyForm = Omit<KeyPolicy, "limit"> & { limit: string; expiry: Expiry };
type KeyDialog =
  | { mode: "create"; source?: DemoKey }
  | { mode: "manage"; key: DemoKey }
  | { mode: "revoke"; key: DemoKey }
  | { mode: "secret"; name: string; value: string };

const day = 86_400_000;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const date = (time: number) => dateFormat.format(time);
const dollars = (micros: number) => money.format(micros / 1e6);

export function sampleDemoKeys(): DemoKey[] {
  const now = Date.now();
  return [
    {
      id: "codex",
      name: "Codex development",
      prefix: "demo_7f2a…91cd",
      scopes: [...API_KEY_SCOPES],
      tools: ["exa_search", "tavily_search"],
      limit: 10_000_000,
      spent: 420_000,
      reserved: 0,
      expires: now + 30 * day,
      lastUsed: now - day,
      events: [{ label: "Key created", at: now - 60 * day }],
    },
    {
      id: "claude",
      name: "Claude research",
      prefix: "demo_b810…3e42",
      scopes: [...API_KEY_SCOPES],
      tools: [...API_KEY_TOOLS],
      limit: 5_000_000,
      spent: 4_900_000,
      reserved: 100_000,
      expires: now + 12 * day,
      lastUsed: now - 2 * day,
      events: [{ label: "Key created", at: now - 18 * day }],
    },
    {
      id: "reporting",
      name: "Usage reporting",
      prefix: "demo_a954…20ef",
      scopes: [...readOnly],
      tools: [...API_KEY_TOOLS],
      limit: 0,
      spent: 0,
      reserved: 0,
      expires: now - 5 * day,
      lastUsed: null,
      events: [{ label: "Key created", at: now - 35 * day }],
    },
    {
      id: "cursor",
      name: "Cursor testing",
      prefix: "demo_2ac1…b032",
      scopes: [...API_KEY_SCOPES],
      tools: ["firecrawl_extract"],
      limit: 2_000_000,
      spent: 80_000,
      reserved: 0,
      expires: now + 9 * day,
      lastUsed: now - 8 * day,
      revokedAt: now - 6 * day,
      events: [
        { label: "Key revoked", at: now - 6 * day },
        { label: "Key created", at: now - 21 * day },
      ],
    },
  ];
}

function statusOf(key: DemoKey): KeyStatus {
  if (key.revokedAt) return "revoked";
  if (key.expires <= Date.now()) return "expired";
  return key.spent + key.reserved >= key.limit ? "at_limit" : "active";
}

function Status({ value }: { value: KeyStatus }) {
  return (
    <Badge className="demo-key-status" variant="secondary" data-status={value}>
      {statuses[value]}
    </Badge>
  );
}

function settingsFrom(key?: DemoKey): KeyForm {
  return {
    name: key?.name ?? "",
    scopes: key?.scopes ?? [...API_KEY_SCOPES],
    tools: key?.tools ?? [...API_KEY_TOOLS],
    limit: key ? String(key.limit / 1e6) : "10",
    expiry: "30",
  };
}

function toggleSelection<T>(items: T[], item: T, checked: boolean) {
  return checked
    ? [...items, item]
    : items.filter((candidate) => candidate !== item);
}

function KeySettings({
  dialog,
  onCreate,
  onSave,
  onClose,
  onRevoke,
}: {
  dialog: Extract<KeyDialog, { mode: "create" | "manage" | "revoke" }>;
  onCreate: (policy: KeyPolicy, expiry: Expiry) => void;
  onSave: (key: DemoKey, policy: KeyPolicy) => void;
  onClose: () => void;
  onRevoke: (key: DemoKey) => void;
}) {
  const key = dialog.mode === "create" ? undefined : dialog.key;
  const replacement = dialog.mode === "create" ? dialog.source : undefined;
  const [form, setForm] = useState(() => settingsFrom(key ?? replacement));
  const [error, setError] = useState("");
  const status = key ? statusOf(key) : undefined;
  const editable = status !== "revoked" && status !== "expired";
  const preset =
    form.scopes.length === API_KEY_SCOPES.length
      ? "agent"
      : form.scopes.length === readOnly.length &&
          readOnly.every((scope) => form.scopes.includes(scope))
        ? "read"
        : "custom";

  function update(patch: Partial<KeyForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setError("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable) return;
    const name = form.name.trim();
    const value = form.limit.trim();
    const limit = Math.round(Number(value) * 1e6);
    if (!name) return setError("Enter a name for this key.");
    if (!form.scopes.length) return setError("Select at least one permission.");
    if (!form.tools.length) return setError("Select at least one tool.");
    if (
      !/^(?:0|[1-9]\d{0,3})(?:\.\d{1,6})?$/.test(value) ||
      limit > 1_000_000_000
    )
      return setError(
        "Enter a USD amount from $0 to $1,000, with up to six decimal places.",
      );
    if (key && limit < key.spent + key.reserved)
      return setError(
        `Enter at least ${dollars(key.spent + key.reserved)} to cover spent and reserved estimates.`,
      );
    const policy = { name, scopes: form.scopes, tools: form.tools, limit };
    if (key) onSave(key, policy);
    else onCreate(policy, form.expiry);
  }

  return (
    <form className="demo-key-form" onSubmit={submit} noValidate>
      {key && (
        <div className="demo-key-details" aria-label="Key details">
          <div>
            <span>Status</span>
            {status && <Status value={status} />}
          </div>
          <div>
            <span>Expires</span>
            <strong>{date(key.expires)}</strong>
          </div>
          <div>
            <span>Estimated spend</span>
            <strong>{dollars(key.spent)}</strong>
          </div>
          <div>
            <span>Reserved</span>
            <strong>{dollars(key.reserved)}</strong>
          </div>
        </div>
      )}
      {editable && (
        <>
          <label className="demo-key-field">
            Key name
            <Input
              autoFocus
              value={form.name}
              placeholder="Codex development"
              maxLength={80}
              onChange={(e) => update({ name: e.target.value })}
            />
          </label>
          <div className="demo-key-field">
            <label htmlFor="demo-key-preset">Permission preset</label>
            <Select
              value={preset}
              onValueChange={(value) => {
                if (value === "agent") update({ scopes: [...API_KEY_SCOPES] });
                if (value === "read") update({ scopes: [...readOnly] });
              }}
            >
              <SelectTrigger id="demo-key-preset" className="demo-key-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="agent">Agent access</SelectItem>
                <SelectItem value="read">Read only</SelectItem>
                <SelectItem value="custom" disabled>
                  Custom permissions
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      <fieldset className="demo-key-options" disabled={!editable}>
        <legend>Permissions</legend>
        {API_KEY_SCOPES.map((scope) => (
          <label key={scope}>
            <Checkbox
              checked={form.scopes.includes(scope)}
              onCheckedChange={(value) =>
                update({
                  scopes: toggleSelection(form.scopes, scope, value === true),
                })
              }
            />
            <span>
              <strong>{permissions[scope][0]}</strong>
              <small>{permissions[scope][1]}</small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset className="demo-key-options" disabled={!editable}>
        <legend>Allowed tools</legend>
        <p>Controls which tools the key can discover and call.</p>
        {providerCatalog.map(({ id, label, tool }) => (
          <label key={id}>
            <Checkbox
              checked={form.tools.includes(tool)}
              onCheckedChange={(value) =>
                update({
                  tools: toggleSelection(form.tools, tool, value === true),
                })
              }
            />
            <span>
              <strong>{label}</strong>
              <small>
                <code>{tool}</code>
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="demo-key-form-limits">
        <label className="demo-key-field">
          Lifetime spend limit (USD)
          <Input
            value={form.limit}
            inputMode="decimal"
            disabled={!editable}
            aria-describedby="demo-key-limit-hint"
            onChange={(e) => update({ limit: e.target.value })}
          />
        </label>
        {!key && (
          <div className="demo-key-field">
            <label htmlFor="demo-key-expiry">Expires after</label>
            <Select
              value={form.expiry}
              onValueChange={(value: Expiry) => update({ expiry: value })}
            >
              <SelectTrigger id="demo-key-expiry" className="demo-key-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {expiryOptions.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <p id="demo-key-limit-hint">
          $0–$1,000 across all sessions using this key. $0 allows free
          operations. Provider invoices can differ.
        </p>
      </div>
      {key && (
        <div className="demo-key-history">
          <h3>Key history</h3>
          <ul>
            {key.events.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <span>{event.label}</span>
                <time dateTime={new Date(event.at).toISOString()}>
                  {date(event.at)}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p role="alert" className="demo-key-error">
          {error}
        </p>
      )}
      <DialogFooter className="demo-key-dialog-actions">
        {key && editable && (
          <Button
            type="button"
            variant="ghost"
            className="demo-key-revoke"
            onClick={() => onRevoke(key)}
          >
            Revoke key
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onClose}>
          {editable ? "Cancel" : "Close"}
        </Button>
        {editable && (
          <Button type="submit" variant="brand">
            {key ? "Save changes" : "Create API key"}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}

const setup = "APILAYER_API_KEY=<your scoped key>";

export function DemoApiKeys({
  keys,
  onChange,
  onConnect,
  headingRef,
}: {
  keys: DemoKey[];
  onChange: (keys: DemoKey[]) => void;
  onConnect: (trigger: HTMLButtonElement) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [dialog, setDialog] = useState<KeyDialog | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState<"key" | "setup" | null>(null);
  const [copyError, setCopyError] = useState("");
  const createButton = useRef<HTMLButtonElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const dialogHeading = useRef<HTMLHeadingElement>(null);
  const term = query.trim().toLowerCase();
  const matching = keys.filter(
    (key) =>
      (filter === "all" || filter === statusOf(key)) &&
      `${key.name} ${key.prefix}`.toLowerCase().includes(term),
  );
  const record =
    dialog?.mode === "manage" || dialog?.mode === "revoke"
      ? dialog.key
      : undefined;
  const closedRecord =
    !!record && ["expired", "revoked"].includes(statusOf(record));

  useEffect(() => {
    if (dialog?.mode === "secret" || dialog?.mode === "revoke")
      dialogHeading.current?.focus();
  }, [dialog]);

  function open(next: KeyDialog, source: HTMLElement) {
    trigger.current = source;
    setFeedback("");
    setCopied(null);
    setCopyError("");
    setRevealed(false);
    setDialog(next);
  }

  function close() {
    setDialog(null);
    setRevealed(false);
    setCopied(null);
    setCopyError("");
  }

  function create(policy: KeyPolicy, expiry: Expiry) {
    const now = Date.now();
    const id = crypto.randomUUID();
    const token = id.replaceAll("-", "");
    const value = `demo_only_${token}`;
    const key: DemoKey = {
      ...policy,
      id,
      prefix: `demo_only_${token.slice(0, 4)}…${token.slice(-4)}`,
      spent: 0,
      reserved: 0,
      expires: now + Number(expiry) * day,
      lastUsed: null,
      events: [{ label: "Key created", at: now }],
    };
    onChange([key, ...keys]);
    setQuery("");
    setFilter("all");
    setDialog({ mode: "secret", name: key.name, value });
  }

  function updateKey(key: DemoKey, patch: Partial<DemoKey>, event: KeyEvent) {
    onChange(
      keys.map((current) =>
        current.id === key.id
          ? { ...current, ...patch, events: [event, ...current.events] }
          : current,
      ),
    );
    setFeedback(
      event.label === "Key revoked"
        ? `${key.name} revoked.`
        : "API key settings updated.",
    );
    close();
  }

  async function copy(value: string, kind: "key" | "setup") {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
    } catch {
      setCopied(null);
      setCopyError(
        kind === "key"
          ? "Couldn’t copy the key. Reveal it and copy it manually."
          : "Couldn’t copy the example. Select it and copy it manually.",
      );
    }
  }

  return (
    <>
      <header className="demo-page-heading demo-keys-heading">
        <h1 ref={headingRef} tabIndex={-1}>
          API keys
        </h1>
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="demo-key-create"
          ref={createButton}
          onClick={(event) => open({ mode: "create" }, event.currentTarget)}
        >
          <Plus />
          Create API key
        </Button>
      </header>
      <div className="demo-key-toolbar">
        <label className="demo-search demo-key-search">
          <SearchMd size={16} />
          <Input
            ref={search}
            type="search"
            aria-label="Search API keys"
            placeholder="Search name or key prefix"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Select
          value={filter}
          onValueChange={(value: Filter) => setFilter(value)}
        >
          <SelectTrigger aria-label="Key status" className="demo-key-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(statuses).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {feedback && (
        <p role="status" className="demo-key-feedback">
          {feedback}
        </p>
      )}
      <Card className="demo-keys-library">
        <header>
          <CardTitle>Your keys</CardTitle>
          <span role="status">
            {matching.length} {matching.length === 1 ? "key" : "keys"}
          </span>
        </header>
        {matching.length ? (
          <table className="demo-keys-table" aria-label="Your API keys">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Spend</th>
                <th scope="col">Expires</th>
                <th scope="col">Last used</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {matching.map((key) => {
                const status = statusOf(key);
                return (
                  <tr key={key.id}>
                    <th scope="row">
                      <div className="demo-key-identity">
                        <strong>{key.name}</strong>
                        <code>{key.prefix}</code>
                      </div>
                    </th>
                    <td>
                      <span
                        className="demo-key-mobile-label"
                        aria-hidden="true"
                      >
                        Spend
                      </span>
                      {dollars(key.spent)}
                    </td>
                    <td>
                      <span
                        className="demo-key-mobile-label"
                        aria-hidden="true"
                      >
                        Expires
                      </span>
                      {date(key.expires)}
                    </td>
                    <td>
                      <span
                        className="demo-key-mobile-label"
                        aria-hidden="true"
                      >
                        Last used
                      </span>
                      {key.lastUsed === null ? "Never" : date(key.lastUsed)}
                    </td>
                    <td className="demo-key-row-action">
                      <Button
                        className="demo-action-chip"
                        size="xs"
                        type="button"
                        variant="secondary"
                        aria-label={`${status === "revoked" || status === "expired" ? "View" : "Manage"} ${key.name}`}
                        onClick={(event) =>
                          open({ mode: "manage", key }, event.currentTarget)
                        }
                      >
                        {status === "revoked" || status === "expired"
                          ? "View"
                          : "Manage"}
                        <ArrowUpRight size={13} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="demo-keys-empty">
            <span className="demo-key-icon">
              <Key01 size={18} />
            </span>
            <h3>{keys.length ? "No matching keys" : "No API keys yet"}</h3>
            <p>
              {keys.length
                ? "Try another name or status."
                : "Create a key for an agent or application."}
            </p>
            <Button
              variant={keys.length ? "outline" : "brand"}
              size="sm"
              onClick={(event) => {
                if (keys.length) {
                  setQuery("");
                  setFilter("all");
                  search.current?.focus();
                } else open({ mode: "create" }, event.currentTarget);
              }}
            >
              {keys.length ? "Clear filters" : "Create API key"}
            </Button>
          </div>
        )}
      </Card>
      <Card className="demo-key-connect">
        <div className="demo-key-connect-intro">
          <span className="demo-key-icon">
            <TerminalSquare size={18} />
          </span>
          <div>
            <CardTitle>Connect an agent</CardTitle>
            <p>
              Set the key in your MCP bridge’s private environment, then restart
              the client.
            </p>
          </div>
        </div>
        <div className="demo-key-connection-actions">
          <div className="demo-key-command">
            <code>{setup}</code>
            <Button
              size="xs"
              variant="ghost"
              aria-label="Copy environment example"
              onClick={() => void copy(setup, "setup")}
            >
              <Copy01 />
              {copied === "setup" ? "Copied" : "Copy"}
            </Button>
          </div>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            className="demo-key-connection-setup"
            onClick={(event) => onConnect(event.currentTarget)}
          >
            Connection setup
            <ArrowUpRight />
          </Button>
        </div>
        {!dialog && copyError && (
          <p role="alert" className="demo-key-error">
            {copyError}
          </p>
        )}
      </Card>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        {dialog && (
          <DialogContent
            className="demo-key-dialog"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              (trigger.current?.isConnected
                ? trigger.current
                : createButton.current
              )?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle ref={dialogHeading} tabIndex={-1}>
                {dialog.mode === "secret"
                  ? "Save your API key"
                  : dialog.mode === "revoke"
                    ? `Revoke ${dialog.key.name}?`
                    : dialog.mode === "create"
                      ? "Create API key"
                      : dialog.key.name}
              </DialogTitle>
              <DialogDescription>
                {dialog.mode === "secret"
                  ? "Copy this demo key before closing. Its full value is shown only once."
                  : dialog.mode === "revoke"
                    ? "This key stops accepting new requests immediately. Calls already started can finish. Revocation is permanent."
                    : closedRecord && record
                      ? `This key ${record.revokedAt ? "was revoked" : "expired"} on ${date(record.revokedAt ?? record.expires)}.`
                      : "Choose the permissions, allowed tools, and lifetime spend limit for this key."}
              </DialogDescription>
            </DialogHeader>
            {dialog.mode === "secret" ? (
              <>
                <div className="demo-key-secret">
                  <label htmlFor="demo-key-secret-value">{dialog.name}</label>
                  <div>
                    <Input
                      id="demo-key-secret-value"
                      aria-label="New demo API key"
                      readOnly
                      autoComplete="off"
                      type={revealed ? "text" : "password"}
                      value={dialog.value}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={revealed ? "Hide API key" : "Reveal API key"}
                      onClick={() => setRevealed(!revealed)}
                    >
                      {revealed ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {copyError && (
                    <p role="alert" className="demo-key-error">
                      {copyError}
                    </p>
                  )}
                  <p role="status">
                    {copied === "key"
                      ? "API key copied."
                      : "Demo value. It cannot authorize requests."}
                  </p>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={close}>
                    Done
                  </Button>
                  <Button
                    type="button"
                    variant="brand"
                    onClick={() => void copy(dialog.value, "key")}
                  >
                    <Copy01 />
                    {copied === "key" ? "Copied" : "Copy key"}
                  </Button>
                </DialogFooter>
              </>
            ) : dialog.mode === "revoke" ? (
              <>
                <code className="demo-key-revoke-id">{dialog.key.prefix}</code>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setDialog({ mode: "manage", key: dialog.key })
                    }
                  >
                    Keep key
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      const now = Date.now();
                      updateKey(
                        dialog.key,
                        { revokedAt: now },
                        { label: "Key revoked", at: now },
                      );
                    }}
                  >
                    Revoke key
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <KeySettings
                  key={
                    dialog.mode === "manage"
                      ? dialog.key.id
                      : (dialog.source?.id ?? "new")
                  }
                  dialog={dialog}
                  onCreate={create}
                  onSave={(key, policy) =>
                    updateKey(key, policy, {
                      label: "Settings updated",
                      at: Date.now(),
                    })
                  }
                  onClose={close}
                  onRevoke={(key) => setDialog({ mode: "revoke", key })}
                />
                {closedRecord && record && (
                  <Button
                    size="sm"
                    type="button"
                    variant="brand"
                    className="demo-key-replacement"
                    onClick={() =>
                      setDialog({ mode: "create", source: record })
                    }
                  >
                    Create replacement
                  </Button>
                )}
              </>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
