import { useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const ERROR_LABELS: Record<string, string> = {
  missing_code: "Sign-in was cancelled. Try again.",
  expired_state: "Sign-in took too long. Try again.",
  token_exchange: "Google sign-in failed. Try again in a moment.",
  missing_claims: "Google did not return your email. Try again.",
  email_unverified: "Verify your Google email, then try again.",
  access_denied: "You declined the Google permissions.",
};

export default function SignInPage() {
  useDocumentTitle("Sign in — Save your AI-built PDFs");
  const config = useConfig();
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const errCode = params.get("error");
  const next = params.get("next") || "/dashboard";

  useEffect(() => {
    if (status === "authenticated") navigate(next, { replace: true });
  }, [status, navigate, next]);

  const googleEnabled = config?.googleSignInEnabled ?? false;
  const googleHref = `/api/auth/google?next=${encodeURIComponent(next)}`;
  const errMessage = errCode ? ERROR_LABELS[errCode] ?? "Sign-in failed. Try again." : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 lg:px-10 py-5 border-b border-[var(--color-line)]">
        <Link to="/" aria-label="Megabyte PDF home" className="inline-flex">
          <Logo size={32} />
        </Link>
      </header>
      <main className="flex-1 grid place-items-center px-6 py-10">
        <div className="w-full max-w-md animate-fade-in-up">
          <h1
            className="text-3xl font-bold text-center mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome back
          </h1>
          <p className="text-[var(--color-muted)] text-center mb-8 text-sm">
            Sign in with Google to keep your projects in sync.
          </p>

          {errMessage && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {errMessage}
            </div>
          )}

          <div className="card p-6 flex flex-col gap-4">
            {config === undefined ? (
              <div className="text-center text-sm text-[var(--color-muted)]">Loading…</div>
            ) : googleEnabled ? (
              <a
                href={googleHref}
                className="btn btn-primary w-full inline-flex items-center justify-center gap-3"
                style={{ minHeight: 48 }}
              >
                <GoogleMark />
                <span>Continue with Google</span>
              </a>
            ) : (
              <div className="text-center text-sm text-[var(--color-muted)]">
                Google sign-in isn't configured yet. Try as a guest.
              </div>
            )}

            <Link to="/guest" className="btn btn-ghost w-full text-center">
              Continue as guest
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline hover:text-fg">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-fg">
              Privacy Policy
            </Link>
            .
          </p>

          {/* Consume location to avoid lint warnings */}
          <span className="hidden">{location.pathname}</span>
        </div>
      </main>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
