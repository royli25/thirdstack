import { useEffect, useState } from "react";
import { api } from "./api";
import { useAccount } from "./AccountGate";
import { Button } from "./components/ui/button";
import "./mcp-oauth.css";
type Connection = {
  clientId: string;
  clientName: string;
  grantedAt: string;
  revokedAt: string | null;
};
export function AgentConnections() {
  const account = useAccount();
  const [connections, setConnections] = useState<Connection[]>();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [retry, setRetry] = useState(0);
  const [cleanup, setCleanup] = useState(new Set<string>());
  useEffect(() => {
    const refresh = () => setRetry((n) => n + 1);
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  useEffect(() => {
    let current = true;
    setError("");
    setConnections(undefined);
    api<{ connections: Connection[] }>("/agent-auth/connections")
      .then((r) => {
        if (current) setConnections(r.connections);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [account.sessionEpoch, retry]);
  async function disconnect(id: string) {
    if (busy) return;
    setBusy(id);
    setError("");
    setNotice("");
    try {
      const result = await api<{ authRevoked: boolean }>(
        `/agent-auth/connections/${id}/revoke`,
        {},
      );
      setConnections((items) =>
        items?.map((c) =>
          c.clientId === id ? { ...c, revokedAt: new Date().toISOString() } : c,
        ),
      );
      setCleanup((current) => {
        const next = new Set(current);
        if (result.authRevoked) next.delete(id);
        else next.add(id);
        return next;
      });
      setNotice(
        result.authRevoked
          ? "Agent disconnected."
          : "Agent access is disconnected. Retry disconnect to remove saved sign-in credentials when the sign-in service is available.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <section className="agent-connections" aria-label="Connected agents">
      <div className="agent-connections-header">
        <h3>Connected agents</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRetry((n) => n + 1)}
        >
          Refresh agents
        </Button>
      </div>
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            className="ws-text-link"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {!connections && !error && <p role="status">Loading connected agents…</p>}
      {connections?.length === 0 && (
        <p className="ws-panel-note">
          Your authorized agents will appear here.
        </p>
      )}
      <ul>
        {connections?.map((c) => (
          <li key={c.clientId}>
            <div>
              <span>{c.clientName}</span>
              <small>
                {c.revokedAt
                  ? "Disconnected"
                  : `Connected ${new Date(c.grantedAt).toLocaleDateString()}`}
              </small>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!!busy || (!!c.revokedAt && !cleanup.has(c.clientId))}
              onClick={() => void disconnect(c.clientId)}
            >
              {busy === c.clientId
                ? "Disconnecting…"
                : c.revokedAt
                  ? cleanup.has(c.clientId)
                    ? "Retry cleanup"
                    : "Disconnected"
                  : "Disconnect"}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
