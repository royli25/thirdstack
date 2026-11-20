import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { getReferenceComponents } from "./orthogonal/local-adapters";
import { landingCopy } from "./orthogonal/content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import "./orthogonal/reference.css";
import "./orthogonal/prototype.css";
const Toolbar = import.meta.env.DEV
  ? lazy(() =>
      import("agentation").then(({ Agentation }) => ({ default: Agentation })),
    )
  : null;
const { D1Root, D1Landing } = getReferenceComponents();
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <pre
        style={{
          color: "#fff",
          background: "#24201d",
          padding: 40,
          whiteSpace: "pre-wrap",
        }}
      >
        The preview couldn’t load. Reload the page to try again.
      </pre>
    ) : (
      this.props.children
    );
  }
}
function Prototype() {
  const [dialog, setDialog] = useState("");
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      returnFocus.current = document.activeElement as HTMLElement;
      setDialog((e as CustomEvent).detail);
    };
    window.addEventListener("orthogonal-prototype-dialog", handler);
    return () =>
      window.removeEventListener("orthogonal-prototype-dialog", handler);
  }, []);
  return (
    <ErrorBoundary>
      <D1Root>
        <D1Landing
          copy={landingCopy}
          signedIn={false}
          categorySlugs={[
            "company-search",
            "people-search",
            "ai-search",
            "web-search",
          ]}
        />
      </D1Root>
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog("");
        }}
      >
        <DialogContent
          className="ortho-local-dialog"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocus.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>{dialog}</DialogTitle>
            <DialogDescription>
              This local prototype reproduces the public landing page. Account
              actions are not connected to Orthogonal.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {Toolbar && (
        <Suspense fallback={null}>
          <Toolbar endpoint="http://localhost:4747" />
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
createRoot(document.getElementById("root")!).render(<Prototype />);
