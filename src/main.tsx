import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { AccountGate } from "./AccountGate";
import { ConnectAgentProvider } from "./ConnectAgentDialog";
import { ObservationApp } from "./ObservationApp";
import { AppErrorBoundary } from "./AppErrorBoundary";
import { OAuthConsent } from "./OAuthConsent";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./theme.css";
import "./observation.css";
import "./customer-theme.css";
import "./design-system.css";
import "./settings.css";
import "./workspace-console.css";
const Legacy = lazy(() => import("./Legacy"));
const DevToolbar = import.meta.env.DEV
  ? lazy(() =>
      import("agentation").then(({ Agentation }) => ({ default: Agentation })),
    )
  : null;
const insecureRemote =
  location.protocol === "http:" &&
  !["127.0.0.1", "localhost", "[::1]"].includes(location.hostname);
const secureUrl = new URL(location.href);
secureUrl.protocol = "https:";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      {insecureRemote ? (
        <main className="account-page">
          <a className="account-brand" href="#home">
            <img src="/two-hands.svg" width="156" height="34" alt="Two Hands" />
          </a>
          <section className="account-card">
            <h1>Open Two Hands securely</h1>
            <p role="alert">
              This page uses a remote HTTP address. Open Two Hands over HTTPS to
              sign in or connect an agent. HTTP is supported on localhost.
            </p>
            <a className="ws-text-link" href={secureUrl.href}>
              Open HTTPS address
            </a>
          </section>
        </main>
      ) : (
        <AccountGate>
          <ConnectAgentProvider>
            <Suspense fallback={<p>Loading Two Hands…</p>}>
              {location.pathname === "/oauth/consent" ||
              new URL(location.href).searchParams.has("authorization_id") ? (
                <OAuthConsent />
              ) : location.pathname.startsWith("/research") ? (
                <Legacy />
              ) : (
                <ObservationApp />
              )}
            </Suspense>
          </ConnectAgentProvider>
        </AccountGate>
      )}
      {DevToolbar && (
        <Suspense fallback={null}>
          <DevToolbar endpoint="http://localhost:4747" useHashLocation />
        </Suspense>
      )}
    </AppErrorBoundary>
  </React.StrictMode>,
);
