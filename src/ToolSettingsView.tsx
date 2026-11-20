import { providerIds, providerLabel } from "../server/provider-catalog";
import { useEffect, useRef, useState } from "react";
import type {
  ToolSettingsView as Settings,
  ToolSettingsValues,
} from "../server/tool-settings-types";
import type { ProviderId } from "../server/types";
import { useAccount } from "./AccountGate";
import { api } from "./api";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Panel, InlineError, date } from "./observation-ui";
import "./tool-settings.css";
import { useActorGeneration } from "./useActorGeneration";
const providers: ProviderId[] = [...providerIds];
type History = {
  actorId: string;
  actorEmail?: string | null;
  at: string;
  revision: number;
  data: {
    before: ToolSettingsValues;
    after: ToolSettingsValues;
    credentialReplaced?: ProviderId;
  };
};
export function ToolSettingsView() {
  const account = useAccount();
  const [view, setView] = useState<Settings>();
  const [values, setValues] = useState<ToolSettingsValues>();
  const [history, setHistory] = useState<History[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState("");
  const [provider, setProvider] = useState<ProviderId>(providerIds[0]);
  const requestKey = useRef(crypto.randomUUID());
  const allowed = account.profile?.isAdmin && !account.previewRole;
  const actor = `${account.profile?.user.id}:${account.sessionEpoch}:${account.previewRole}:${allowed}`;
  const generation = useActorGeneration(actor);
  async function reload() {
    const version = generation.next();
    setBusy(true);
    setError("");
    setKey("");
    try {
      const [settings, events] = await Promise.all([
        api<Settings>("/admin/tool-settings"),
        api<History[]>("/admin/tool-settings/history"),
      ]);
      if (!generation.current(version)) return;
      setView(settings);
      setValues(structuredClone(settings.values));
      setHistory(events);
      requestKey.current = crypto.randomUUID();
    } catch (e) {
      if (generation.current(version)) setError((e as Error).message);
    } finally {
      if (generation.current(version)) setBusy(false);
    }
  }
  useEffect(() => {
    setKey("");
    setView(undefined);
    setValues(undefined);
    setHistory([]);
    setError("");
    setNotice("");
    setBusy(false);
    if (allowed) void reload();
  }, [actor]);
  function changeGlobal(
    field: keyof Omit<ToolSettingsValues, "providers">,
    value: number,
  ) {
    if (values) setValues({ ...values, [field]: value });
    requestKey.current = crypto.randomUUID();
  }
  function changeProvider(
    id: ProviderId,
    field: string,
    value: number | boolean,
  ) {
    if (values)
      setValues({
        ...values,
        providers: {
          ...values.providers,
          [id]: { ...values.providers[id], [field]: value },
        },
      });
    requestKey.current = crypto.randomUUID();
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!values || !view) return;
    const version = generation.next();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await api<Settings>("/admin/tool-settings", {
        requestKey: requestKey.current,
        revision: view.revision,
        values,
        ...(key ? { credential: { provider, value: key } } : {}),
      });
      if (!generation.current(version)) return;
      setView(next);
      setValues(structuredClone(next.values));
      requestKey.current = crypto.randomUUID();
      setNotice("Settings saved. New calls use this revision.");
      const events = await api<History[]>("/admin/tool-settings/history");
      if (generation.current(version)) setHistory(events);
    } catch (e) {
      if (generation.current(version)) setError((e as Error).message);
    } finally {
      if (generation.current(version)) {
        setKey("");
        setBusy(false);
      }
    }
  }
  if (!allowed)
    return (
      <Panel title="Administrator access required">
        <p>
          Sign in as a platform administrator to manage tools and credentials.
        </p>
      </Panel>
    );
  return (
    <div className="tool-settings-view">
      <div className="page-heading">
        <div>
          <h1>Tool settings</h1>
          <p>Manage the integrations and limits used across Two Hands.</p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void reload()}>
          Reload settings
        </Button>
      </div>
      <InlineError message={error} />
      {notice && <p role="status">{notice}</p>}
      {!view || !values ? (
        <p role="status">
          {busy
            ? "Loading settings…"
            : "Settings are unavailable. Reload to try again."}
        </p>
      ) : (
        <>
          <p>
            Revision {view.revision} ·{" "}
            {view.updatedAt ? date(view.updatedAt) : "Server defaults"}.{" "}
            {view.effective}. Existing receipts and estimates remain unchanged.
          </p>
          <form onSubmit={save}>
            <fieldset disabled={busy} className="platform-settings-controls">
              <Panel
                title="Available tools"
                description="These controls apply to every account. Account routing and key restrictions still apply."
              >
                <div className="platform-provider-grid">
                  {providers
                    // A server older than this page may not list every provider yet.
                    .filter(
                      (id) => values.providers[id] && view.credentials[id],
                    )
                    .map((id) => (
                      <fieldset key={id}>
                        <legend>{providerLabel(id)}</legend>
                        <label
                          className="platform-enabled"
                          htmlFor={`${id}-enabled`}
                        >
                          <Switch
                            id={`${id}-enabled`}
                            checked={values.providers[id].enabled}
                            onCheckedChange={(enabled) =>
                              changeProvider(id, "enabled", enabled)
                            }
                          />{" "}
                          Enabled
                        </label>
                        <label>
                          Requests per minute
                          <Input
                            type="number"
                            min={1}
                            max={1000}
                            step={1}
                            value={values.providers[id].requestsPerMinute}
                            onChange={(e) =>
                              changeProvider(
                                id,
                                "requestsPerMinute",
                                Number(e.target.value),
                              )
                            }
                            required
                          />
                        </label>
                        <label>
                          Base estimate (USD)
                          <Input
                            type="number"
                            min={0}
                            max={10}
                            step={0.000001}
                            value={values.providers[id].estimateMicros / 1e6}
                            onChange={(e) =>
                              changeProvider(
                                id,
                                "estimateMicros",
                                Math.round(Number(e.target.value) * 1e6),
                              )
                            }
                            required
                          />
                        </label>
                        <p>
                          Credential:{" "}
                          {view.credentials[id].configured
                            ? "Configured"
                            : "Missing"}{" "}
                          · {view.credentials[id].source}
                        </p>
                        {view.credentials[id].needsReplacement && (
                          <p>
                            Managed credential unavailable after recovery or
                            access loss. Replace it to restore this provider;
                            environment keys will not be used as a fallback.
                          </p>
                        )}
                      </fieldset>
                    ))}
                </div>
              </Panel>
              <Panel
                title="Request and spending limits"
                description="New sessions and tests use these caps. Estimates control authorization; they are not a provider invoice or customer payment balance."
              >
                <div className="platform-fields">
                  {(
                    [
                      [
                        "timeoutMs",
                        "Request timeout (milliseconds)",
                        100,
                        120000,
                        1,
                      ],
                      [
                        "sessionBudgetMicros",
                        "Agent session cap (USD)",
                        0,
                        5,
                        0.000001,
                      ],
                      [
                        "testBudgetMicros",
                        "Controlled test cap (USD)",
                        0,
                        5,
                        0.000001,
                      ],
                      [
                        "testDailyBudgetMicros",
                        "Daily test cap (USD)",
                        0,
                        50,
                        0.000001,
                      ],
                      [
                        "exaAdditionalResultMicros",
                        "Exa additional result estimate (USD)",
                        0,
                        10,
                        0.000001,
                      ],
                    ] as const
                  ).map(([field, label, min, max, step]) => (
                    <label key={field}>
                      {label}
                      <Input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={
                          field === "timeoutMs"
                            ? values[field]
                            : values[field] / 1e6
                        }
                        onChange={(e) =>
                          changeGlobal(
                            field,
                            Math.round(
                              Number(e.target.value) *
                                (field === "timeoutMs" ? 1 : 1e6),
                            ),
                          )
                        }
                        required
                      />
                    </label>
                  ))}
                </div>
                <p>
                  <a href="#tool-access">Manage account spending allowances</a>
                </p>
              </Panel>
              <Panel
                title="Replace provider credential"
                description="Optional. Saved keys are never returned. The new value is cleared after saving or leaving this page."
              >
                {!view.secretStore.available && (
                  <p>
                    Managed credential storage is unavailable. Configure
                    Supabase Vault access before replacing a key here. Providers
                    with an unavailable saved credential remain unavailable
                    until repaired.
                  </p>
                )}
                <div className="platform-fields">
                  <div>
                    <label htmlFor="credential-provider">Provider</label>
                    <Select
                      value={provider}
                      onValueChange={(value) => {
                        setProvider(value as ProviderId);
                        setKey("");
                        requestKey.current = crypto.randomUUID();
                      }}
                      disabled={!view.secretStore.available}
                    >
                      <SelectTrigger id="credential-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {providerIds.map((p) => (
                          <SelectItem key={p} value={p}>
                            {providerLabel(p)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label>
                    New API key
                    <Input
                      type="password"
                      autoComplete="off"
                      value={key}
                      onChange={(e) => {
                        setKey(e.target.value);
                        requestKey.current = crypto.randomUUID();
                      }}
                      disabled={!view.secretStore.available}
                      minLength={16}
                      maxLength={4096}
                    />
                  </label>
                </div>
              </Panel>
              <Button disabled={busy}>
                {busy ? "Saving…" : "Save settings"}
              </Button>
            </fieldset>
          </form>
          <Panel
            title="Change history"
            description="Actor, settings differences, and credential replacement events; never credential values."
          >
            {history.length ? (
              <div className="platform-history">
                {history.map((h) => (
                  <details key={h.revision}>
                    <summary>
                      Revision {h.revision} · {date(h.at)} ·{" "}
                      {h.actorEmail ||
                        (h.actorId === account.profile?.user.id
                          ? account.profile.user.email
                          : h.actorId)}
                      {h.data.credentialReplaced
                        ? ` · ${h.data.credentialReplaced} credential replaced`
                        : ""}
                    </summary>
                    <p>Account ID: {h.actorId}</p>
                    <pre>
                      {JSON.stringify(
                        { before: h.data.before, after: h.data.after },
                        null,
                        2,
                      )}
                    </pre>
                  </details>
                ))}
              </div>
            ) : (
              <p>No saved changes yet.</p>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
