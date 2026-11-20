import { Component, type ReactNode } from "react";
import { Button } from "./components/ui/button";

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="account-page">
        <section className="account-card" role="alert">
          <h1>Unable to load Two Hands</h1>
          <p>Reload the page to try again.</p>
          <Button onClick={() => location.reload()}>Reload page</Button>
        </section>
      </main>
    );
  }
}
