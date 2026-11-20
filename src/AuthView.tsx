import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loading02,
  Mail01,
} from "@untitledui/icons";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { authFailure, type AuthMode, type AuthStage } from "./auth-state";
import {
  defaultAccountType,
  savePendingAccountType,
  type AccountType,
} from "./account-type";
import { AccountTypeOptions } from "./AccountTypeOptions";
import googleMark from "./assets/auth-google.png";
import authMark from "./assets/auth-mark.svg";
import "./auth.css";

type Props = {
  client: SupabaseClient | null;
  ready: boolean;
  session: Session | null;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  error: string;
  callbackStage?: AuthStage;
  googleAvailable: () => Promise<boolean | undefined>;
  returnRoute: string;
  emptyPreview: boolean;
  onRetry: () => void;
  onSignOut: () => void;
  onReturnToAdmin?: () => void;
};

function Action({
  children,
  icon,
  secondary = false,
  link = false,
  loading = false,
  ...props
}: React.ComponentProps<typeof Button> & {
  icon?: ReactNode;
  secondary?: boolean;
  link?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      {...props}
      variant={link ? "ghost" : secondary ? "secondary" : "default"}
      className={`auth-button ${link ? "auth-button-link" : secondary ? "auth-button-secondary" : "auth-button-primary"}`}
    >
      {link && icon}
      {children}
      {!link &&
        (loading ? (
          <Loading02 className="auth-spinner" aria-hidden="true" />
        ) : (
          icon
        ))}
    </Button>
  );
}

export function AuthView({
  client,
  ready,
  session,
  mode,
  onModeChange,
  error,
  callbackStage,
  googleAvailable,
  returnRoute,
  emptyPreview,
  onRetry,
  onSignOut,
  onReturnToAdmin,
}: Props) {
  const [stage, setStage] = useState<AuthStage | undefined>(callbackStage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fields, setFields] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [message, setMessage] = useState("");
  // Business or user, for new accounts. Saved as "pending" when sign-up starts and
  // stored on the account after the first sign-in (see ChooseAccountType).
  const [accountType, setAccountType] = useState<AccountType>(() =>
    defaultAccountType(returnRoute),
  );
  const [resent, setResent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Hidden only once the Auth service confirms Google is turned off.
  const [googleOff, setGoogleOff] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const operation = useRef(0);
  const previousMode = useRef(mode);
  useEffect(() => {
    let active = true;
    googleAvailable()
      .then((available) => active && setGoogleOff(available === false))
      .catch(() => {});
    return () => {
      active = false;
    };
    // Re-check once sign-in settings load: the client is created after the
    // Auth settings request starts, so the answer is final by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client]);

  useEffect(() => {
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem("two-hands-google-pending");
      sessionStorage.removeItem("two-hands-google-pending");
    } catch {
      /* Sign-in remains usable when browser storage is blocked. */
    }
    if (
      pending &&
      !new URL(location.href).searchParams.has("auth_callback") &&
      !callbackStage
    )
      setStage("google-canceled");
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setBusy(false);
        setStage("google-canceled");
      }
    };
    window.addEventListener("pageshow", restored);
    return () => {
      operation.current++;
      window.removeEventListener("pageshow", restored);
    };
  }, []);
  useEffect(() => {
    if (previousMode.current === mode) return;
    previousMode.current = mode;
    setStage(undefined);
    setMessage("");
    setFields({});
    setPassword("");
    setRevealed(false);
  }, [mode]);
  useEffect(() => {
    if (stage) heading.current?.focus();
  }, [stage]);
  useEffect(() => {
    if (callbackStage) setStage(callbackStage);
  }, [callbackStage]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(
      () => setCooldown((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown > 0]);

  function changeMode(next: AuthMode) {
    operation.current++;
    setStage(undefined);
    setMessage("");
    setFields({});
    setPassword("");
    setRevealed(false);
    setResent(false);
    setBusy(false);
    onModeChange(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function redirect(flow: string) {
    const url = new URL("/", location.origin);
    url.searchParams.set("auth_callback", "1");
    url.searchParams.set("auth_flow", flow);
    const authorizationId = new URL(location.href).searchParams.get(
      "authorization_id",
    );
    if (authorizationId && /^[A-Za-z0-9_-]{1,256}$/.test(authorizationId)) {
      url.searchParams.set("authorization_id", authorizationId);
      url.hash = "#oauth/consent";
      return url.href;
    }
    url.hash =
      /^#[a-z0-9/_-]+$/i.test(returnRoute) && returnRoute !== "#signin"
        ? returnRoute
        : accountType === "business"
          ? "#company"
          : "#dashboard";
    return url.href;
  }
  function failure(caught: unknown) {
    const kind = authFailure(caught);
    if (kind === "credentials")
      setMessage("The email or password is incorrect.");
    else if (kind === "weak-password")
      setFields({ password: "Use at least 12 characters." });
    else if (kind === "expired")
      setStage(mode === "recover" ? "reset-expired" : "confirmation-expired");
    else {
      setStage(kind);
      if (kind === "rate-limited") setCooldown(60);
    }
  }
  function validate(needsEmail: boolean, needsPassword: boolean) {
    const next: typeof fields = {};
    if (needsEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (needsPassword && !password)
      next.password =
        mode === "signin"
          ? "Enter your password."
          : "Use at least 12 characters.";
    else if (needsPassword && mode !== "signin" && password.length < 12)
      next.password = "Use at least 12 characters.";
    else if (needsPassword && password.length > 256)
      next.password = "Use no more than 256 characters.";
    setFields(next);
    if (next.email) emailInput.current?.focus();
    else if (next.password) passwordInput.current?.focus();
    return !Object.keys(next).length;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!client || busy) return;
    const confirming = stage === "confirmation-expired";
    const needsPassword = !confirming && mode !== "reset";
    if (!validate(mode !== "recover", needsPassword)) return;
    setBusy(true);
    setMessage("");
    const revision = ++operation.current;
    try {
      if (confirming) {
        const result = await client.auth.resend({
          type: "signup",
          email: email.trim(),
          options: { emailRedirectTo: redirect("signup") },
        });
        if (result.error) throw result.error;
        if (revision === operation.current) setStage("confirmation-sent");
      } else if (mode === "signin") {
        const result = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (result.error) throw result.error;
      } else if (mode === "signup") {
        savePendingAccountType(accountType);
        const result = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirect("signup") },
        });
        if (result.error) throw result.error;
        if (revision === operation.current && !result.data.session) {
          setPassword("");
          setStage("confirmation-sent");
        }
      } else if (mode === "reset") {
        const result = await client.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirect("recovery"),
        });
        if (result.error) throw result.error;
        if (revision === operation.current) setStage("reset-sent");
      } else if (mode === "recover") {
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        if (revision === operation.current) {
          setPassword("");
          setStage("password-updated");
        }
      }
    } catch (caught) {
      if (revision === operation.current) failure(caught);
    } finally {
      if (revision === operation.current) setBusy(false);
    }
  }
  async function google() {
    if (!client || busy) return;
    const revision = ++operation.current;
    setStage("google-connecting");
    setMessage("");
    try {
      if ((await googleAvailable()) === false) {
        if (revision === operation.current) {
          setGoogleOff(true);
          setStage(undefined);
        }
        return;
      }
      const result = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirect("google"), skipBrowserRedirect: true },
      });
      if (result.error || !result.data.url)
        throw result.error || new Error("Google sign-in is unavailable.");
      if (revision !== operation.current) return;
      // Used only if this Google account is new; existing accounts keep their type.
      savePendingAccountType(accountType);
      try {
        sessionStorage.setItem("two-hands-google-pending", "1");
      } catch {
        /* The marker only detects canceled navigation. */
      }
      location.assign(result.data.url);
    } catch {
      if (revision === operation.current) setStage("google-error");
    }
  }
  async function resend(reset = false) {
    if (!client || busy || cooldown) return;
    setBusy(true);
    setMessage("");
    try {
      const result = reset
        ? await client.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: redirect("recovery"),
          })
        : await client.auth.resend({
            type: "signup",
            email: email.trim(),
            options: { emailRedirectTo: redirect("signup") },
          });
      if (result.error) throw result.error;
      setResent(true);
      setCooldown(60);
    } catch (caught) {
      failure(caught);
    } finally {
      setBusy(false);
    }
  }

  const loading =
    !ready ||
    (!!session &&
      !error &&
      !emptyPreview &&
      mode !== "recover" &&
      mode !== "confirmed" &&
      stage !== "password-updated");
  const unavailable = ready && !client;
  let title =
    mode === "options"
      ? "Continue to twohands"
      : mode === "signin"
        ? "Sign in with email"
        : mode === "signup"
          ? "Create your account"
          : mode === "reset"
            ? "Reset your password"
            : mode === "confirmed"
              ? "Email confirmed"
              : "Choose a new password";
  let description =
    mode === "options"
      ? "1 connection to give your agent infinite hands. Connect your tools and keep track of usage."
      : mode === "signin"
        ? "Enter the email and password for your Two Hands account."
        : mode === "signup"
          ? accountType === "business"
            ? "Create a business account to list your tool and see how agents use it."
            : "Create an account to connect your agent to Two Hands."
          : mode === "reset"
            ? "Enter the email address you use for Two Hands."
            : mode === "confirmed"
              ? "Your Two Hands account is ready. Sign in to open your dashboard."
              : "Choose a new password for your Two Hands account.";
  if (stage) {
    const content: Record<AuthStage, [string, string]> = {
      "google-connecting": [
        "Connecting to Google",
        "We’re opening Google so you can choose an account.",
      ],
      "google-canceled": [
        "Google sign-in canceled",
        "You can try Google again or continue with email.",
      ],
      "google-error": [
        "Couldn’t connect to Google",
        "Google didn’t respond. Try Google again, or continue with email.",
      ],
      "confirmation-required": [
        "Confirm your email",
        `Open the confirmation link sent to ${email} before signing in.`,
      ],
      "confirmation-sent": [
        "Check your email",
        `${resent ? "Open the confirmation link sent" : "We sent a confirmation link"} to ${email}${resent ? " to" : ". Open it to"} finish creating your account.`,
      ],
      "reset-sent": [
        "Check your email",
        `If an account exists for ${email}, you’ll receive a password reset link.`,
      ],
      "password-updated": [
        "Password updated",
        "Your new password is ready to use.",
      ],
      "confirmation-expired": [
        "Confirmation link expired",
        "Request a new confirmation link to finish setting up your account.",
      ],
      "reset-expired": [
        "Reset link expired",
        "Request a new link to reset your password.",
      ],
      "rate-limited": [
        "Too many attempts",
        "Wait a few minutes before trying again.",
      ],
      "service-error": [
        "Sign-in is temporarily unavailable",
        "Check your connection and try again.",
      ],
    };
    [title, description] = content[stage];
  }
  if (loading) {
    title = "Opening your dashboard";
    description = "We’re getting your Two Hands account ready.";
  } else if (emptyPreview) {
    title = "No personal activity to preview";
    description = "This account has no personal activity yet.";
  } else if (session && error && mode !== "recover") {
    title = "Couldn’t load your account";
    description = "You’re signed in. Try loading your account again.";
  } else if (unavailable) {
    title = "Sign-in is temporarily unavailable";
    description = "Check your connection and try again.";
  }
  const back = (label = "Back to sign in", next: AuthMode = "signin") => (
    <Action
      type="button"
      link
      icon={<ArrowLeft />}
      disabled={busy}
      onClick={() => changeMode(next)}
    >
      {label}
    </Action>
  );
  const browse = (
    <a className="auth-browse" href="#home/landing-catalog">
      Browse tools first
    </a>
  );
  const form =
    stage === "confirmation-expired" ||
    (!stage && ["signin", "signup", "reset", "recover"].includes(mode));
  const emailField = form && mode !== "recover";
  const passwordField =
    form && mode !== "reset" && stage !== "confirmation-expired";

  return (
    <main className="auth-screen">
      <section
        className="auth-stack"
        aria-labelledby="auth-heading"
        aria-busy={busy || loading || stage === "google-connecting"}
      >
        <a href="#home" className="auth-mark" aria-label="Two Hands home">
          <img src={authMark} width={27.4182} height={16.3455} alt="" />
        </a>
        <header className="auth-intro">
          <h1 id="auth-heading" ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <p>{description}</p>
        </header>
        {loading ? (
          <Action disabled loading>
            Loading your account…
          </Action>
        ) : emptyPreview ? (
          <Action onClick={onReturnToAdmin} icon={<ArrowRight />}>
            Return to admin
          </Action>
        ) : session && error && mode !== "recover" ? (
          <div className="auth-actions">
            <Action onClick={onRetry} icon={<ArrowRight />}>
              Retry account access
            </Action>
            <Action link onClick={onSignOut}>
              Sign out
            </Action>
          </div>
        ) : unavailable ? (
          <div className="auth-actions">
            <Action onClick={() => location.reload()} icon={<ArrowRight />}>
              Try again
            </Action>
            {browse}
          </div>
        ) : form ? (
          <form noValidate onSubmit={submit} className="auth-form">
            {message && (
              <div role="alert" className="auth-alert">
                <AlertCircle aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}
            {error && !message && !callbackStage && (
              <div role="alert" className="auth-alert">
                <AlertCircle aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <fieldset disabled={busy} className="auth-fields">
              {mode === "signup" && !stage && (
                <AccountTypeOptions
                  value={accountType}
                  onChange={setAccountType}
                />
              )}
              {emailField && (
                <div className="auth-field">
                  <label htmlFor="auth-email">Email</label>
                  <Input
                    id="auth-email"
                    ref={emailInput}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setFields((value) => ({ ...value, email: undefined }));
                    }}
                    aria-invalid={!!fields.email}
                    aria-describedby={
                      fields.email ? "auth-email-error" : undefined
                    }
                  />
                  {fields.email && (
                    <p id="auth-email-error" className="auth-field-error">
                      {fields.email}
                    </p>
                  )}
                </div>
              )}
              {passwordField && (
                <div className="auth-field">
                  <label htmlFor="auth-password">
                    {mode === "recover" ? "New password" : "Password"}
                  </label>
                  <div className="auth-password">
                    <Input
                      id="auth-password"
                      ref={passwordInput}
                      type={revealed ? "text" : "password"}
                      autoComplete={
                        mode === "signin" ? "current-password" : "new-password"
                      }
                      placeholder={
                        mode === "signup"
                          ? "Create a password"
                          : mode === "recover"
                            ? "Enter a new password"
                            : "Enter your password"
                      }
                      value={password}
                      maxLength={256}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setFields((value) => ({
                          ...value,
                          password: undefined,
                        }));
                      }}
                      aria-invalid={!!fields.password}
                      aria-describedby={
                        fields.password
                          ? "auth-password-error"
                          : mode !== "signin"
                            ? "auth-password-hint"
                            : undefined
                      }
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={revealed ? "Hide password" : "Show password"}
                      aria-pressed={revealed}
                      onClick={() => setRevealed(!revealed)}
                    >
                      {revealed ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {fields.password ? (
                    <p id="auth-password-error" className="auth-field-error">
                      {fields.password}
                    </p>
                  ) : (
                    mode !== "signin" && (
                      <p id="auth-password-hint" className="auth-field-hint">
                        Use at least 12 characters.
                      </p>
                    )
                  )}
                </div>
              )}
              <div className="auth-actions">
                <Action
                  type="submit"
                  disabled={busy}
                  loading={busy}
                  icon={
                    stage === "confirmation-expired" ? (
                      <Mail01 />
                    ) : (
                      <ArrowRight />
                    )
                  }
                >
                  {busy
                    ? mode === "signup"
                      ? "Creating account…"
                      : mode === "reset"
                        ? "Sending reset link…"
                        : mode === "recover"
                          ? "Updating password…"
                          : "Signing in…"
                    : stage === "confirmation-expired"
                      ? "Send a new confirmation link"
                      : mode === "signup"
                        ? "Create account"
                        : mode === "reset"
                          ? "Send reset link"
                          : mode === "recover"
                            ? "Update password"
                            : "Sign in"}
                </Action>
                {mode === "signin" && !stage && (
                  <>
                    <Action
                      type="button"
                      secondary
                      onClick={() => changeMode("signup")}
                    >
                      Create an account
                    </Action>
                    <Action
                      type="button"
                      link
                      onClick={() => changeMode("reset")}
                    >
                      Forgot password?
                    </Action>
                  </>
                )}
                {mode === "signup" && !stage && (
                  <Action
                    type="button"
                    link
                    onClick={() => changeMode("signin")}
                  >
                    Already have an account? Sign in
                  </Action>
                )}
                {mode !== "recover" &&
                  back(
                    mode === "signin" || mode === "signup"
                      ? "Back to sign-in options"
                      : "Back to sign in",
                    mode === "signin" || mode === "signup"
                      ? "options"
                      : "signin",
                  )}
              </div>
            </fieldset>
          </form>
        ) : (
          <div className="auth-actions">
            {!stage && mode === "options" && (
              <>
                <AccountTypeOptions
                  legend="New to Two Hands? Choose an account type"
                  value={accountType}
                  onChange={setAccountType}
                />
                {!googleOff && (
                  <Action
                    onClick={() => void google()}
                    icon={
                      <img src={googleMark} width={16} height={16} alt="" />
                    }
                  >
                    Continue with Google
                  </Action>
                )}
                <Action
                  secondary={!googleOff}
                  onClick={() => changeMode("signin")}
                  icon={<ArrowRight />}
                >
                  Continue with email
                </Action>
                <div className="auth-browse-row">{browse}</div>
              </>
            )}
            {stage === "google-connecting" && (
              <>
                <Action disabled loading>
                  Connecting…
                </Action>
                {back("Back to sign-in options", "options")}
              </>
            )}
            {(stage === "google-canceled" || stage === "google-error") && (
              <>
                <Action
                  onClick={() => void google()}
                  icon={<img src={googleMark} width={16} height={16} alt="" />}
                >
                  Try Google again
                </Action>
                <Action
                  secondary
                  onClick={() => changeMode("signin")}
                  icon={<ArrowRight />}
                >
                  Continue with email
                </Action>
                {back("Back to sign-in options", "options")}
              </>
            )}
            {(stage === "confirmation-sent" ||
              stage === "confirmation-required") && (
              <>
                {resent && (
                  <div role="status" className="auth-alert auth-success">
                    <CheckCircle aria-hidden="true" />
                    <span>Confirmation email sent again.</span>
                  </div>
                )}
                <Action
                  secondary={stage === "confirmation-sent"}
                  disabled={busy || cooldown > 0}
                  loading={busy}
                  icon={<Mail01 />}
                  onClick={() => void resend()}
                >
                  Resend confirmation email
                </Action>
                {back(
                  stage === "confirmation-required"
                    ? "Use a different email"
                    : "Back to sign in",
                )}
              </>
            )}
            {stage === "reset-sent" && (
              <>
                {resent && (
                  <p role="status" className="auth-field-hint">
                    Reset link requested again.
                  </p>
                )}
                <Action
                  secondary
                  disabled={busy || cooldown > 0}
                  loading={busy}
                  icon={<Mail01 />}
                  onClick={() => void resend(true)}
                >
                  Send another link
                </Action>
                {back()}
              </>
            )}
            {stage === "password-updated" && (
              <Action
                icon={<ArrowRight />}
                onClick={() => {
                  onSignOut();
                  changeMode("signin");
                }}
              >
                Back to sign in
              </Action>
            )}
            {stage === "reset-expired" && (
              <>
                <Action icon={<Mail01 />} onClick={() => changeMode("reset")}>
                  Request a new reset link
                </Action>
                {back()}
              </>
            )}
            {mode === "confirmed" && !stage && (
              <Action
                icon={<ArrowRight />}
                onClick={() => changeMode("signin")}
              >
                Sign in
              </Action>
            )}
            {stage === "rate-limited" && (
              <>
                <Action
                  disabled={cooldown > 0}
                  icon={<ArrowRight />}
                  onClick={() => {
                    setStage(undefined);
                    setMessage("");
                  }}
                >
                  Try again
                </Action>
                {back("Back to sign-in options", "options")}
              </>
            )}
            {stage === "service-error" && (
              <>
                <Action
                  icon={<ArrowRight />}
                  onClick={() => {
                    setStage(undefined);
                    setMessage("");
                    if (!client) location.reload();
                  }}
                >
                  Try again
                </Action>
                {browse}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
