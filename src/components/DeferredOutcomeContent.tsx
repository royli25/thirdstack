import { Component, lazy, Suspense, type ReactNode } from "react";

const Document = lazy(() =>
  import("./OutcomeContent").then(({ OutcomeContent }) => ({
    default: OutcomeContent,
  })),
);

class DocumentBoundary extends Component<
  { text: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <>
        <p className="field-hint" role="status">
          Formatted view is unavailable. Showing the original text.
        </p>
        <div className="output-text" tabIndex={0}>
          {this.props.text}
        </div>
      </>
    ) : (
      this.props.children
    );
  }
}

/** Keep document parsing out of session-list startup, and keep the surrounding panel visible. */
export function OutcomeContent({ text }: { text: string }) {
  return (
    <DocumentBoundary text={text}>
      <Suspense fallback={<p role="status">Loading document…</p>}>
        <Document text={text} />
      </Suspense>
    </DocumentBoundary>
  );
}
