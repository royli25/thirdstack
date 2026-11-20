import { useRef, useState, type MouseEvent, type Ref } from "react";
import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import googleMark from "./assets/google-g.png";
import loginMark from "./assets/login-mark.svg";
import "./demo-login.css";

export function DemoLogin({
  catalogHref,
  headingRef,
  onSignIn,
}: {
  catalogHref: string;
  headingRef: Ref<HTMLHeadingElement>;
  onSignIn: () => void;
}) {
  const [method, setMethod] = useState<"Google" | "email" | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  function openSignIn(
    event: MouseEvent<HTMLButtonElement>,
    next: typeof method,
  ) {
    trigger.current = event.currentTarget;
    setMethod(next);
  }

  return (
    <main className="demo-login">
      <div className="demo-login-stack">
        <div className="demo-login-mark">
          <img src={loginMark} width={27.4182} height={16.3455} alt="" />
        </div>
        <div className="demo-login-intro">
          <h1 ref={headingRef} tabIndex={-1}>
            Continue to twohands
          </h1>
          <p>
            1 connection to give your agent infinite hands. New accounts receive
            $5 in free credits.
          </p>
        </div>
        <Dialog
          open={method !== null}
          onOpenChange={(open) => {
            if (!open) setMethod(null);
          }}
        >
          <div className="demo-login-actions">
            <Button
              type="button"
              className="demo-login-action demo-login-google"
              aria-haspopup="dialog"
              onClick={(event) => openSignIn(event, "Google")}
            >
              Continue with Google
              <img src={googleMark} width={16} height={16} alt="" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="demo-login-action demo-login-email"
              aria-haspopup="dialog"
              onClick={(event) => openSignIn(event, "email")}
            >
              Continue with email
              <ArrowRight className="size-[16px]" />
            </Button>
          </div>
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle className="font-medium">
                Demo {method} sign-in
              </DialogTitle>
              <DialogDescription>
                {method === "Google"
                  ? "Simulate signing in with a sample Google account."
                  : "Simulate signing in with the sample address demo@example.com."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" onClick={onSignIn}>
                Open demo account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <a className="demo-login-browse" href={catalogHref}>
          Browse tools first
        </a>
      </div>
    </main>
  );
}
