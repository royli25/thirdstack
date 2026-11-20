// One-time "Business or user?" screen, shown after sign-in to an account that has
// no type yet. If the person already picked a type on the sign-up screen, it is
// saved automatically. Once saved, the database will not let it change.
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "@untitledui/icons";
import { api } from "./api";
import { Button } from "./components/ui/button";
import {
  clearPendingAccountType,
  readPendingAccountType,
  type AccountType,
} from "./account-type";
import { AccountTypeOptions } from "./AccountTypeOptions";

export function ChooseAccountType({
  email,
  onChosen,
  onSignOut,
}: {
  email: string;
  /** Reload the profile once the type is saved. */
  onChosen: () => Promise<void>;
  onSignOut: () => void;
}) {
  const pending = useRef(readPendingAccountType());
  const [choice, setChoice] = useState<AccountType>(pending.current ?? "user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(type: AccountType) {
    setBusy(true);
    setError("");
    try {
      await api("/auth/account-type", { accountType: type });
      clearPendingAccountType();
      await onChosen();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  // A type picked on the sign-up screen needs no second click.
  const autoSaved = useRef(false);
  useEffect(() => {
    if (pending.current && !autoSaved.current) {
      autoSaved.current = true;
      void save(pending.current);
    }
  }, []);

  return (
    <main className="account-page">
      <a className="account-brand" href="#home">
        <img src="/two-hands.svg" width="156" height="34" alt="Two Hands" />
      </a>
      <section className="account-card" aria-busy={busy}>
        <h1>How will you use Two Hands?</h1>
        <p>
          Signed in as {email}. Choose the kind of account this is. You can’t
          change it later.
        </p>
        <AccountTypeOptions
          value={choice}
          onChange={setChoice}
          disabled={busy}
        />
        {error && (
          <div role="alert" className="auth-alert account-type-error">
            <AlertCircle aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <div className="account-type-actions">
          <Button disabled={busy} onClick={() => void save(choice)}>
            {busy
              ? "Saving…"
              : choice === "business"
                ? "Continue as a business"
                : "Continue as a user"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}

/**
 * Shown when a signed-in account opens the other type's area, for example a
 * business account opening #dashboard. The server refuses those requests too;
 * this screen just explains why and links back.
 */
export function WrongAccountArea({
  accountType,
  email,
  home,
  onSignOut,
}: {
  accountType: AccountType;
  email: string;
  /** This account's own area, such as "#company". */
  home: string;
  onSignOut: () => void;
}) {
  const other = accountType === "business" ? "user" : "business";
  return (
    <main className="account-page">
      <a className="account-brand" href="#home">
        <img src="/two-hands.svg" width="156" height="34" alt="Two Hands" />
      </a>
      <section className="account-card">
        <h1>This area is for {other} accounts</h1>
        <p>
          You’re signed in as {email}, which is a {accountType} account.
          Business and user accounts are separate. To use both, sign up again
          with a different email.
        </p>
        <div className="account-area-actions">
          <Button asChild>
            <a href={home}>
              {accountType === "business"
                ? "Open your company dashboard"
                : "Open your dashboard"}
            </a>
          </Button>
          <Button variant="ghost" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </section>
    </main>
  );
}
