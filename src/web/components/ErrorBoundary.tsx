import { Component, type ErrorInfo, type ReactNode } from "react";
import { Logo } from "./Logo";

interface Props { children: ReactNode }
interface State { hasError: boolean; eventId: string | null }

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, eventId: null };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Dynamic import keeps @sentry/react out of the critical-path main bundle
    import("@sentry/react").then((Sentry) => {
      const eventId = Sentry.captureException(error, {
        extra: { componentStack: info.componentStack },
        tags: { error_boundary: true },
      });
      this.setState({ eventId: eventId ?? null });
    }).catch(() => console.error("[ErrorBoundary]", error, info));
  }

  override render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div role="alert" aria-live="assertive" className="min-h-screen grid place-items-center bg-[var(--color-bg)] text-[var(--color-fg)] p-8 text-center">
        <div className="max-w-md">
          <Logo size={40} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-[var(--color-muted)] mb-6 text-sm">
            An unexpected error occurred. Reload to try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary"
            >
              Reload
            </button>
            <button
              onClick={() => this.setState({ hasError: false, eventId: null })}
              className="btn btn-ghost"
            >
              Try again
            </button>
          </div>
          {this.state.eventId && (
            <p className="text-xs text-[var(--color-muted)] mt-4">
              Error ID: <code>{this.state.eventId}</code>
            </p>
          )}
        </div>
      </div>
    );
  }
}
