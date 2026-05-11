import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./styles.css";
import Landing from "./pages/Landing";
import { ConfigProvider } from "./lib/config";
import { AuthProvider, useAuth } from "./lib/auth";
import { ErrorBoundary } from "./components/ErrorBoundary";

const SignInPage = lazy(() => import("./pages/SignIn"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Editor = lazy(() => import("./pages/Editor"));
const GuestPage = lazy(() => import("./pages/Guest"));
const PrivacyPage = lazy(() => import("./pages/Privacy"));
const TermsPage = lazy(() => import("./pages/Terms"));
const Explore = lazy(() => import("./pages/Explore"));
const Community = lazy(() => import("./pages/Community"));
const Tag = lazy(() => import("./pages/Tag"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateHub = lazy(() => import("./pages/TemplateHub"));
const TemplateHubDetail = lazy(() => import("./pages/TemplateHubDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

function RouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-bg text-fg">
      <div className="opacity-60 text-sm tracking-wide">Loading…</div>
    </div>
  );
}

function Gated({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <RouteFallback />;
  if (status === "unauthenticated") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/sign-in?next=${next}`} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/guest" element={<GuestPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<Navigate to="/sign-in" replace />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/c/:slug" element={<Community />} />
        <Route path="/t/:tag" element={<Tag />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/templates/:type" element={<Templates />} />
        <Route path="/pdf-template" element={<TemplateHub />} />
        <Route path="/pdf-template/:slug" element={<TemplateHubDetail />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/free-invoice-generator" element={<BlogPost fixedSlug="free-invoice-generator" />} />
        <Route path="/free-resume-pdf" element={<BlogPost fixedSlug="free-resume-pdf" />} />
        <Route path="/pdf-from-prompt" element={<BlogPost fixedSlug="pdf-from-prompt" />} />
        <Route
          path="/dashboard"
          element={
            <Gated>
              <Dashboard />
            </Gated>
          }
        />
        <Route
          path="/p/:id"
          element={
            <Gated>
              <Editor />
            </Gated>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

function SwUpdateToast() {
  const [show, setShow] = React.useState(false);
  const [reg, setReg] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((r) => {
      setReg(r);
      const check = (sw: ServiceWorker | null) => {
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            setShow(true);
          }
        });
      };
      if (r.waiting) {
        setShow(true);
        return;
      }
      r.addEventListener("updatefound", () => check(r.installing));
    });
  }, []);

  const refresh = () => {
    reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
  };

  if (!show) return null;
  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 card p-3 flex items-center gap-3 shadow-lg"
      style={{ maxWidth: 320 }}
    >
      <span className="text-sm flex-1 text-[var(--color-fg)]">New version available</span>
      <button
        onClick={refresh}
        className="btn btn-primary text-xs px-3"
        style={{ minHeight: 32, minWidth: 0 }}
      >
        Refresh
      </button>
      <button
        onClick={() => setShow(false)}
        aria-label="Dismiss update notification"
        className="btn btn-ghost text-xs px-2 text-[var(--color-muted)]"
        style={{ minHeight: 32, minWidth: 0 }}
      >
        ✕
      </button>
    </div>
  );
}

// Click ripple — desktop (pointer: fine) only
(function initRipple() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  document.addEventListener("pointerdown", (e) => {
    const target = (e.target as Element).closest<HTMLElement>(".btn, .card, button.card, a.card");
    if (!target) return;
    target.classList.add("ripple-host");
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const wave = document.createElement("span");
    wave.className = "ripple-wave";
    wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    target.appendChild(wave);
    wave.addEventListener("animationend", () => wave.remove(), { once: true });
  });
})();

// Scroll progress bar — single bar element, CSS var driven
(function initScrollProgress() {
  if (typeof document === "undefined") return;
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.documentElement.appendChild(bar);
  let raf = 0;
  function update() {
    raf = 0;
    const h = document.documentElement;
    const scrolled = h.scrollTop || document.body.scrollTop;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    const pct = Math.max(0, Math.min(100, (scrolled / max) * 100));
    bar.style.setProperty("--scroll-progress", pct.toFixed(2) + "%");
    bar.style.opacity = pct < 0.5 ? "0" : "1";
  }
  window.addEventListener("scroll", () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
  update();
})();

// Magnetic primary buttons — slight cursor pull on hover (pointer:fine only)
(function initMagneticButtons() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(pointer: fine)").matches) return;
  const STRENGTH = 0.18;
  const MAX = 6;
  document.addEventListener("pointermove", (e) => {
    const t = (e.target as Element | null)?.closest<HTMLElement>(".btn-primary");
    if (!t) return;
    const r = t.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = Math.max(-MAX, Math.min(MAX, (e.clientX - cx) * STRENGTH));
    const dy = Math.max(-MAX, Math.min(MAX, (e.clientY - cy) * STRENGTH));
    t.style.setProperty("--mag-x", `${dx}px`);
    t.style.setProperty("--mag-y", `${dy}px`);
  });
  document.addEventListener("pointerleave", (e) => {
    const t = (e.target as Element | null)?.closest?.<HTMLElement>(".btn-primary");
    if (!t) return;
    t.style.setProperty("--mag-x", "0px");
    t.style.setProperty("--mag-y", "0px");
  }, true);
  document.addEventListener("pointerout", (e) => {
    const t = (e.target as Element | null)?.closest<HTMLElement>(".btn-primary");
    if (!t) return;
    if (t.contains((e.relatedTarget as Node) || null)) return;
    t.style.setProperty("--mag-x", "0px");
    t.style.setProperty("--mag-y", "0px");
  });
})();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </ErrorBoundary>
    <SwUpdateToast />
  </React.StrictMode>
);
