import { useEffect, useRef, useState } from "react";
import { CheckCircle, ShieldTick } from "@untitledui/icons";
import { api } from "./api";
import { useAccount } from "./AccountGate";
import { Button } from "./components/ui/button";
import "./mcp-oauth.css";

type Details = {
  authorizationId: string;
  clientId: string;
  clientName: string;
  redirectUri: string;
  resource: string;
  scopes: string[];
};
export function OAuthConsent() {
  const account = useAccount();
  const id = new URL(location.href).searchParams.get("authorization_id") || "";
  const [details, setDetails] = useState<Details>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const operation = useRef(false);
  useEffect(() => {
    let current = true;
    setDetails(undefined);
    setError("");
    if (!/^[A-Za-z0-9_-]{1,256}$/.test(id)) {
      setError("This connection link is invalid. Start again from your agent.");
      return;
    }
    api<Details>(`/agent-auth/requests/${encodeURIComponent(id)}`)
      .then((value) => {
        if (current) setDetails(value);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [id, retry, account.sessionEpoch]);
  async function decide(allow: boolean) {
    if (operation.current || !details) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ redirectUrl: string }>(
        `/agent-auth/requests/${encodeURIComponent(id)}`,
        { allow },
      );
      const target = new URL(result.redirectUrl),
        expected = new URL(details.redirectUri);
      if (
        target.origin !== expected.origin ||
        target.pathname !== expected.pathname ||
        target.username ||
        target.password ||
        target.hash
      )
        throw new Error(
          "The agent returned an unexpected callback. Start again from your agent.",
        );
      location.assign(target.href);
    } catch (e) {
      setError((e as Error).message);
      operation.current = false;
      setBusy(false);
    }
  }
  return (
    <main className="oauth-page">
      <a href="/" aria-label="Two Hands home">
        <img src="/two-hands.svg" alt="Two Hands" width="156" height="34" />
      </a>
      <section
        className="oauth-card"
        aria-labelledby="oauth-heading"
        aria-busy={busy}
      >
        <ShieldTick size={28} aria-hidden="true" />
        <h1 id="oauth-heading">
          {details
            ? `Connect ${details.clientName} to Two Hands`
            : "Connect your agent"}
        </h1>
        {account.profile && (
          <p className="oauth-account">
            Signed in as {account.profile.user.email}{" "}
            <button
              className="ws-text-link"
              disabled={busy}
              onClick={account.signOut}
            >
              Use a different account
            </button>
          </p>
        )}
        {details && (
          <>
            <p>
              Allow this agent to use tools through your personal Two Hands
              account.
            </p>
            <ul className="oauth-permissions">
              <li>
                <CheckCircle aria-hidden="true" />
                Find available tools and call them on your behalf.
              </li>
              <li>
                <CheckCircle aria-hidden="true" />
                Read your account’s research history and save new results.
              </li>
              <li>
                <CheckCircle aria-hidden="true" />
                Use your existing tool allowance. Calls may incur usage costs.
              </li>
            </ul>
            <p>
              Account settings, API keys, payments, and administrator controls
              stay private. You can disconnect this agent at any time.
            </p>
            <details>
              <summary>Connection details</summary>
              <dl>
                <dt>Client ID</dt>
                <dd>{details.clientId}</dd>
                <dt>Returns to</dt>
                <dd>{details.redirectUri}</dd>
                <dt>MCP server</dt>
                <dd>{details.resource}</dd>
                <dt>Identity permissions</dt>
                <dd>{details.scopes.join(", ") || "Account identification"}</dd>
              </dl>
              <p>The client name is supplied by the requesting application.</p>
            </details>
          </>
        )}
        {!details && !error && <p role="status">Loading connection request…</p>}
        {error && <p role="alert">{error}</p>}
        {details ? (
          <div className="oauth-actions">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void decide(false)}
            >
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void decide(true)}>
              {busy ? "Returning to your agent…" : "Allow connection"}
            </Button>
          </div>
        ) : (
          error && (
            <div className="oauth-actions">
              <a className="ws-text-link" href="/">
                Return to Two Hands
              </a>
              <Button variant="outline" onClick={() => setRetry((n) => n + 1)}>
                Try again
              </Button>
            </div>
          )
        )}
      </section>
    </main>
  );
}
