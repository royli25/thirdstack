import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { AccountProfile, AuthPublicConfig } from "../server/account-types";
import type { CompanyPreviewTarget } from "../server/company-types";
import { setAccountSession, setPreviewRole } from "./api";
import { Button } from "./components/ui/button";
import { AccountMenu } from "./AccountMenu";
import "./account.css";
import { AuthView } from "./AuthView";
import { readAuthCallback, type AuthMode } from "./auth-state";
import { canOpen, clearPendingAccountType, homeRoute } from "./account-type";
import { ChooseAccountType } from "./ChooseAccountType";

/** The sign-in page. Logged-out visitors to any signed-in area are sent here. */
const LOGIN_PATH = "/login";
const onLoginPage = () => location.pathname === LOGIN_PATH;

/**
 * Send a freshly signed-in account to the right place:
 *  - from /login, to the page it asked for (the #hash) if this account may open
 *    it, otherwise to its own area;
 *  - from #signin or the generic #dashboard, to its own area;
 *  - from the other account type's area, to its own area.
 * Returns the hash it chose so the caller can update its route state.
 */
function routeAfterSignIn(profile: AccountProfile): string {
  if (new URL(location.href).searchParams.has("authorization_id")) {
    history.replaceState(null, "", "/oauth/consent" + location.search);
    return "";
  }
  const home = homeRoute(profile);
  const hash = location.hash;
  const generic = !hash || hash === "#signin" || hash === "#home";
  if (onLoginPage()) {
    const next = !generic && canOpen(profile, hash) ? hash : home;
    // Leave /login without reloading the page.
    history.replaceState(null, "", "/" + location.search + next);
    return next;
  }
  if (hash === "#signin" || hash === "#dashboard" || !canOpen(profile, hash))
    location.hash = home;
  return location.hash;
}
type AccountContext = {
  oauth?: { resource: string };
  sessionEpoch?: number;
  enabled: boolean;
  profile?: AccountProfile;
  signOut: () => void;
  refresh: () => Promise<void>;
  previewRole: "user" | "company" | null;
  previewTarget: string | null;
  previewTargets: CompanyPreviewTarget[];
  previewTargetError: string;
  reloadPreviewTargets: () => Promise<void>;
  preview: (role: "user" | "company" | null, target?: string) => Promise<void>;
};
const Context = createContext<AccountContext>({
  enabled: false,
  signOut: () => {},
  refresh: async () => {},
  previewRole: null,
  previewTarget: null,
  previewTargets: [],
  previewTargetError: "",
  reloadPreviewTargets: async () => {},
  preview: async () => {},
});
export const useAccount = () => useContext(Context);
export function AccountControls({ compact = false }: { compact?: boolean }) {
  const account = useAccount();
  if (!account.enabled)
    return (
      <AccountMenu
        label="Local account"
        detail="Local mode"
        compact={compact}
      />
    );
  if (!account.profile) return null;
  return (
    <AccountMenu
      label={account.profile.user.email}
      detail={
        account.profile.isAdmin
          ? "Administrator"
          : account.profile.accountType === "business"
            ? "Business account"
            : "Personal account"
      }
      onSignOut={account.signOut}
      compact={compact}
    />
  );
}

function PreviewNotice({
  role,
  target,
  targets,
  onTarget,
  onExit,
}: {
  role: "user" | "company";
  target: string | null;
  targets: CompanyPreviewTarget[];
  onTarget: (target: string) => void;
  onExit: () => void;
}) {
  return (
    <div className="preview-notice" role="status">
      <span>Previewing {role === "user" ? "as user" : "company"}</span>
      {role === "company" && targets.length > 0 && (
        <select
          aria-label="Preview company"
          value={target || ""}
          onChange={(e) => onTarget(e.target.value)}
        >
          {targets.map((item) => (
            <option key={item.target} value={item.target}>
              {item.name}
              {item.kind === "provider" ? " · integrated provider" : ""}
            </option>
          ))}
        </select>
      )}
      <Button variant="outline" size="sm" onClick={onExit}>
        Return to admin
      </Button>
    </div>
  );
}
export function AccountGate({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AuthPublicConfig>();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AccountProfile>();
  const [switching, setSwitching] = useState(false);
  const [previewRole, setPreview] = useState<"user" | "company" | null>(null);
  const previewRef = useRef<"user" | "company" | null>(null);
  const targetRef = useRef<string | null>(null);
  const previewGeneration = useRef(0);
  const [previewTarget, setPreviewTarget] = useState<string | null>(null);
  const [previewTargets, setPreviewTargets] = useState<CompanyPreviewTarget[]>(
    [],
  );
  const [previewTargetError, setPreviewTargetError] = useState("");
  const canPreviewRef = useRef(false);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const [mode, setMode] = useState<AuthMode>("options");
  const callbackUrl = useRef(new URL(location.href));
  const [callback, setCallback] = useState(() =>
    readAuthCallback(callbackUrl.current),
  );
  const callbackHandled = useRef(false);
  const googleAvailability = useRef<Promise<boolean | undefined>>(
    Promise.resolve(undefined),
  );
  const [route, setRoute] = useState(location.hash);
  const client = useRef<SupabaseClient | null>(null),
    currentSession = useRef<Session | null>(null),
    sessionEpoch = useRef(0),
    version = useRef(0);
  const memoryAuthStorage = useRef(new Map<string, string>());
  const routedAccount = useRef("");
  const clear = () => {
    sessionEpoch.current++;
    canPreviewRef.current = false;
    previewRef.current = null;
    targetRef.current = null;
    previewGeneration.current++;
    setPreviewTarget(null);
    setPreviewTargets([]);
    setPreviewTargetError("");
    setPreviewRole(null);
    setPreview(null);
    version.current++;
    routedAccount.current = "";
    currentSession.current = null;
    setMode("options");
    setAccountSession("", "");
    setSession(null);
    setProfile(undefined);
  };
  const signOut = () => {
    clear();
    void client.current?.auth.signOut({ scope: "local" }).catch(() => {});
  };
  const loadProfile = async (value: Session) => {
    const request = ++version.current;
    try {
      const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: "Bearer " + value.access_token,
            ...(previewRef.current
              ? { "X-Octolab-Preview": previewRef.current }
              : {}),
            ...(targetRef.current
              ? { "X-Octolab-Preview-Target": targetRef.current }
              : {}),
          },
        }),
        data = await response.json();
      if (
        request !== version.current ||
        currentSession.current?.user.id !== value.user.id
      )
        return;
      if (response.status === 401) {
        signOut();
        setError(data.error || "Your session ended. Sign in again.");
        return;
      }
      if (!response.ok)
        throw new Error(data.error || "Could not load account access.");
      const result = data as AccountProfile;
      canPreviewRef.current = !!(result.canPreview || result.isAdmin);
      // A type picked earlier on the sign-up screen is only needed until the
      // account has one; never let it linger for the next sign-in.
      if (result.accountType) clearPendingAccountType();
      // Route once per signed-in account, after its type is known. Accounts
      // without a type see the chooser first and are routed after choosing.
      const typed = !!result.accountType || result.isAdmin;
      if (typed && routedAccount.current !== result.user.id) {
        routedAccount.current = result.user.id;
        setRoute(routeAfterSignIn(result));
      }
      setAccountSession(value.access_token, result.user.id);
      setProfile(result);
      setError("");
      return result;
    } catch (e) {
      if (request === version.current) {
        setProfile(undefined);
        setAccountSession(value.access_token, value.user.id);
        setError((e as Error).message);
      }
    } finally {
      if (request === version.current) setReady(true);
    }
  };
  const reloadPreviewTargets = async () => {
    const current = currentSession.current;
    if (!current || !canPreviewRef.current) return;
    try {
      const response = await fetch("/api/auth/preview-targets", {
        headers: { Authorization: "Bearer " + current.access_token },
      });
      const data = await response.json();
      if (
        currentSession.current?.user.id !== current.user.id ||
        !canPreviewRef.current
      )
        return;
      if (!response.ok)
        throw new Error(data.error || "Could not load company previews.");
      setPreviewTargets(data);
      setPreviewTargetError("");
    } catch (e) {
      if (currentSession.current?.user.id === current.user.id)
        setPreviewTargetError((e as Error).message);
    }
  };
  useEffect(() => {
    if (profile?.canPreview || profile?.isAdmin) void reloadPreviewTargets();
  }, [profile?.canPreview, profile?.isAdmin]);
  useEffect(() => {
    const changed = () => setRoute(location.hash);
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    let disposed = false,
      unsubscribe = () => {};
    void (async () => {
      try {
        const response = await fetch("/api/auth/config");
        if (!response.ok) throw new Error("Could not load sign-in settings.");
        const settings = (await response.json()) as AuthPublicConfig;
        if (disposed) return;
        if (typeof settings.enabled !== "boolean")
          throw new Error("Sign-in settings are unavailable.");
        if (settings.enabled) {
          const origin = new URL(settings.url);
          if (
            origin.protocol !== "https:" ||
            !/^[a-z0-9-]+\.supabase\.co$/.test(origin.hostname) ||
            origin.pathname !== "/" ||
            origin.username ||
            origin.password
          )
            throw new Error("Sign-in is not configured correctly.");
        }
        setConfig(settings);
        if (!settings.enabled) {
          setReady(true);
          return;
        }
        if (!/^sb_publishable_/.test(settings.publishableKey))
          throw new Error("Sign-in is not configured correctly.");
        googleAvailability.current = fetch(
          new URL("/auth/v1/settings", settings.url),
          {
            headers: { apikey: settings.publishableKey },
            signal: AbortSignal.timeout(8000),
          },
        )
          .then(async (response) => {
            if (!response.ok) return undefined;
            const value = await response.json();
            return typeof value.external?.google === "boolean"
              ? value.external.google
              : undefined;
          })
          .catch(() => undefined);
        const { createClient } = await import("@supabase/supabase-js");
        if (disposed) return;
        const supabase = createClient(settings.url, settings.publishableKey, {
          auth: {
            flowType: "pkce",
            persistSession: true,
            storage: {
              getItem: (key) => {
                try {
                  return localStorage.getItem(key);
                } catch {
                  return memoryAuthStorage.current.get(key) ?? null;
                }
              },
              setItem: (key, value) => {
                memoryAuthStorage.current.set(key, value);
                try {
                  localStorage.setItem(key, value);
                } catch {}
              },
              removeItem: (key) => {
                memoryAuthStorage.current.delete(key);
                try {
                  localStorage.removeItem(key);
                } catch {}
              },
            },
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        });
        client.current = supabase;
        const apply = (value: Session | null) => {
          if (disposed) return;
          if (currentSession.current?.access_token !== value?.access_token)
            sessionEpoch.current++;
          const changed = currentSession.current?.user.id !== value?.user.id;
          if (changed) {
            version.current++;
            setProfile(undefined);
          }
          currentSession.current = value;
          setSession(value);
          setAccountSession(value?.access_token || "", value?.user.id || "");
          if (!value) setReady(true);
        };
        const { data } = supabase.auth.onAuthStateChange((event, value) => {
          if (event === "PASSWORD_RECOVERY") setMode("recover");
          if (
            event === "SIGNED_IN" &&
            callback.flow === "signup" &&
            value?.user.email_confirmed_at &&
            !callbackHandled.current
          ) {
            callbackHandled.current = true;
            setMode("confirmed");
          }
          apply(value);
        });
        unsubscribe = () => {
          data.subscription.unsubscribe();
          supabase.auth.stopAutoRefresh();
        };
        const initial = await supabase.auth.getSession();
        if (initial.error) throw initial.error;
        if (
          !initial.data.session &&
          callbackUrl.current.searchParams.has("code")
        ) {
          setCallback((value) => ({
            ...value,
            stage:
              value.flow === "google"
                ? "google-error"
                : value.flow === "recovery"
                  ? "reset-expired"
                  : "confirmation-expired",
          }));
        }
        apply(initial.data.session);
      } catch (e) {
        if (!disposed) {
          setError((e as Error).message);
          setReady(true);
        }
      }
    })();
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (session) void loadProfile(session);
  }, [session?.access_token]);
  useEffect(() => {
    const invalid = () => {
      if (config?.enabled && currentSession.current) {
        clear();
        setError("Your session ended. Sign in again.");
        void client.current?.auth.signOut({ scope: "local" }).catch(() => {});
      }
    };
    window.addEventListener("octolab-session-invalid", invalid);
    return () => window.removeEventListener("octolab-session-invalid", invalid);
  }, [config]);
  useEffect(() => {
    if (!config?.enabled) return;
    const refresh = () => {
      if (currentSession.current) void loadProfile(currentSession.current);
    };
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [config?.enabled]);
  const publicPage =
    !new URL(location.href).searchParams.has("authorization_id") &&
    location.pathname !== "/oauth/consent" &&
    !onLoginPage() &&
    !location.pathname.startsWith("/research") &&
    (!route || route === "#home" || route.startsWith("#home/"));
  // Logged-out visitors to a signed-in area go to /login. The #hash is kept, so
  // they return to the page they asked for after signing in.
  useEffect(() => {
    if (
      config?.enabled &&
      ready &&
      !session &&
      !publicPage &&
      !onLoginPage() &&
      !location.pathname.startsWith("/research")
    )
      history.replaceState(
        null,
        "",
        LOGIN_PATH + location.search + location.hash,
      );
  }, [config?.enabled, ready, session, publicPage]);
  const context: AccountContext = {
    oauth: config?.oauth,
    sessionEpoch: sessionEpoch.current,
    enabled: !!config?.enabled,
    profile,
    previewRole,
    previewTarget,
    previewTargets,
    previewTargetError,
    reloadPreviewTargets,
    preview: async (role, target) => {
      if (!currentSession.current || !canPreviewRef.current) return;
      if (role === "company" && !target) {
        setPreviewTargetError("Choose a company to preview.");
        return;
      }
      const operation = ++previewGeneration.current;
      previewRef.current = role;
      targetRef.current = role === "company" ? target! : null;
      setPreviewTarget(targetRef.current);
      setPreviewRole(role, targetRef.current);
      setPreview(role);
      setSwitching(true);
      setProfile(undefined);
      let loaded: AccountProfile | undefined;
      try {
        loaded = await loadProfile(currentSession.current);
      } finally {
        if (operation === previewGeneration.current) setSwitching(false);
      }
      if (operation !== previewGeneration.current || !loaded) return;
      location.hash =
        role === "company"
          ? `company/${loaded.companyPreview?.id || ""}/insights`
          : role === "user"
            ? "dashboard"
            : "admin";
    },
    signOut,
    refresh: async () => {
      const started = version.current;
      const userId = currentSession.current?.user.id;
      const fresh = await client.current?.auth.getSession();
      if (
        started !== version.current ||
        currentSession.current?.user.id !== userId
      )
        return;
      const value = fresh?.data.session ?? currentSession.current;
      if (value) {
        currentSession.current = value;
        await loadProfile(value);
      }
    },
  };
  if (switching)
    return (
      <main className="account-page">
        <section className="account-card">
          <h1>Switching experience…</h1>
          <p>Applying your access permissions.</p>
        </section>
      </main>
    );
  if (config && !config.enabled)
    return <Context.Provider value={context}>{children}</Context.Provider>;
  if (publicPage)
    return <Context.Provider value={context}>{children}</Context.Provider>;
  const emptyPreview =
    previewRole === "user" && profile?.hasPersonalAccount === false;
  // Signed in but no account type yet: ask once (admins are exempt).
  if (
    profile &&
    !profile.accountType &&
    !profile.isAdmin &&
    !profile.canPreview &&
    !emptyPreview &&
    mode !== "recover" &&
    mode !== "confirmed"
  )
    return (
      <ChooseAccountType
        email={profile.user.email}
        onChosen={async () => {
          if (currentSession.current) await loadProfile(currentSession.current);
        }}
        onSignOut={signOut}
      />
    );
  if (profile && !emptyPreview && mode !== "recover" && mode !== "confirmed")
    return (
      <Context.Provider value={context}>
        <div
          key={profile.user.id + ":" + previewRole + ":" + previewTarget}
          className="account-content"
        >
          {children}
          {previewRole === "company" && (
            <PreviewNotice
              role={previewRole}
              target={previewTarget}
              targets={previewTargets}
              onTarget={(target) => void context.preview("company", target)}
              onExit={() => void context.preview(null)}
            />
          )}
        </div>
      </Context.Provider>
    );
  return (
    <AuthView
      client={client.current}
      ready={ready}
      session={session}
      mode={mode}
      onModeChange={(next) => {
        setError("");
        setMode(next);
      }}
      error={error}
      callbackStage={callback.stage}
      googleAvailable={() => googleAvailability.current}
      returnRoute={route}
      emptyPreview={emptyPreview}
      onRetry={() => {
        if (session) void loadProfile(session);
        else location.reload();
      }}
      onSignOut={signOut}
      onReturnToAdmin={() => void context.preview(null)}
    />
  );
}
