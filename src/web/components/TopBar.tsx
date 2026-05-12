import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Volume2, VolumeX, Sparkles, Crown, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth";
import { useApi } from "../lib/api";
import { isSoundOn, setSoundOn } from "../lib/sound";
import { captureEvent } from "../lib/analytics";

export function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header
      data-vt="site-header"
      className="px-4 lg:px-6 py-3 border-b border-[var(--color-line)] flex items-center justify-between gap-3 bg-[var(--color-bg)]/80 backdrop-blur sticky top-0 z-30"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-cyan)] focus:text-[#060610] focus:rounded-md focus:font-semibold focus:text-sm"
      >
        Skip to content
      </a>
      <Link to="/dashboard" aria-label="Megabyte PDF dashboard" className="inline-flex shrink-0">
        <Logo size={28} />
      </Link>
      <div className="flex-1 min-w-0 flex items-center gap-2">{children}</div>
      <Link
        to="/templates"
        className="hidden md:inline-flex shrink-0 items-center text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-cyan)] px-3 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
      >
        Templates
      </Link>
      <ExploreNavLink />
      <SoundToggle />
      <UserMenu />
    </header>
  );
}

function ExploreNavLink() {
  const [hasFresh, setHasFresh] = useState(false);
  useEffect(() => {
    const last = Number(localStorage.getItem("trending_seen_at") ?? "0");
    const stale = !last || Date.now() - last > 24 * 60 * 60 * 1000;
    setHasFresh(stale);
  }, []);
  return (
    <Link
      to="/explore?sort=trending"
      onClick={() => {
        localStorage.setItem("trending_seen_at", String(Date.now()));
        setHasFresh(false);
      }}
      aria-label={hasFresh ? "Explore — new trending PDFs" : "Explore"}
      className="hidden sm:inline-flex shrink-0 items-center gap-1.5 relative text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-cyan)] px-3 py-1.5 rounded-md hover:bg-white/[0.04] transition-colors"
    >
      <span>Explore</span>
      {hasFresh && (
        <span
          aria-hidden="true"
          className="relative inline-flex w-2 h-2"
        >
          <span className="absolute inset-0 rounded-full bg-[var(--color-cyan)] opacity-70 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-[var(--color-cyan)]" />
        </span>
      )}
    </Link>
  );
}

function SoundToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isSoundOn());
  }, []);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !on;
        setSoundOn(next);
        setOn(next);
        captureEvent("sound_toggled", { on: next });
      }}
      aria-label={on ? "Disable sound cues" : "Enable sound cues"}
      title={on ? "Sound on" : "Sound off"}
      className="hidden sm:inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-md text-[var(--color-muted)] hover:text-[var(--color-cyan)] hover:bg-white/[0.04] transition-colors"
    >
      {on ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
    </button>
  );
}

function UserMenu() {
  const { me, signOut, refresh, status } = useAuth();
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [upgrading, setUpgrading] = useState<"pro" | "unlimited" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const startCheckout = async (tier: "pro" | "unlimited") => {
    if (upgrading) return;
    setUpgrading(tier);
    captureEvent("topbar_upgrade_click", { tier });
    try {
      const { url } = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ tier }),
      });
      window.location.href = url;
    } catch {
      setUpgrading(null);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (status !== "authenticated" || !me) return null;
  const { user } = me;
  const initial = (user.name?.trim()?.[0] ?? user.email[0] ?? "?").toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="w-9 h-9 rounded-full overflow-hidden border border-[var(--color-line)] bg-[var(--color-bg-elev)] grid place-items-center text-sm font-semibold hover:border-[var(--color-cyan)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-cyan)]"
      >
        {user.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{initial}</span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)] shadow-lg overflow-hidden z-40"
        >
          <div className="px-4 py-3 border-b border-[var(--color-line)]">
            <div className="text-sm font-semibold truncate">{user.name || user.email}</div>
            {user.name && (
              <div className="text-xs text-[var(--color-muted)] truncate">{user.email}</div>
            )}
            <div className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1.5">
              <span>Plan:</span>
              <span
                className="text-[var(--color-fg)] capitalize inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide"
                style={{
                  background:
                    user.plan === "unlimited"
                      ? "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(0,229,255,0.14))"
                      : user.plan === "pro"
                        ? "rgba(0,229,255,0.14)"
                        : "rgba(255,255,255,0.05)",
                  color:
                    user.plan === "unlimited"
                      ? "#C4B5FD"
                      : user.plan === "pro"
                        ? "var(--color-cyan)"
                        : "var(--color-muted)",
                  border:
                    user.plan === "unlimited"
                      ? "1px solid rgba(124,58,237,0.4)"
                      : user.plan === "pro"
                        ? "1px solid rgba(0,229,255,0.35)"
                        : "1px solid var(--color-line)",
                }}
              >
                {user.plan === "unlimited" && <Crown size={9} aria-hidden="true" />}
                {user.plan === "pro" && <Sparkles size={9} aria-hidden="true" />}
                {user.plan}
              </span>
            </div>
          </div>
          {user.plan === "free" && (
            <div className="px-3 pt-3 pb-2 border-b border-[var(--color-line)] bg-gradient-to-b from-[var(--color-cyan)]/[0.08] to-transparent">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void startCheckout("pro");
                }}
                disabled={!!upgrading}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-cyan), #50AAE3)",
                  color: "#060610",
                  boxShadow: "0 4px 16px -4px rgba(0,229,255,0.5)",
                }}
              >
                {upgrading === "pro" ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles size={12} aria-hidden="true" />
                )}
                <span>Go Pro — $9/mo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void startCheckout("unlimited");
                }}
                disabled={!!upgrading}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 mt-1.5 rounded-md text-[11px] font-medium transition-all"
                style={{
                  background: "transparent",
                  color: "#C4B5FD",
                  border: "1px solid rgba(124,58,237,0.4)",
                }}
              >
                {upgrading === "unlimited" ? (
                  <Loader2 size={10} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Crown size={10} aria-hidden="true" />
                )}
                <span>Go Unlimited — $50/mo</span>
              </button>
              <p className="text-[10px] text-[var(--color-muted)] text-center mt-2 leading-tight">
                10 PDFs/mo · Priority AI · Brand fonts
              </p>
            </div>
          )}
          {user.plan === "pro" && (
            <div className="px-3 pt-3 pb-2 border-b border-[var(--color-line)] bg-gradient-to-b from-purple-500/[0.08] to-transparent">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  void startCheckout("unlimited");
                }}
                disabled={!!upgrading}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, #7C3AED, #A855F7)",
                  color: "#fff",
                  boxShadow: "0 4px 16px -4px rgba(124,58,237,0.55)",
                }}
              >
                {upgrading === "unlimited" ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Crown size={12} aria-hidden="true" />
                )}
                <span>Go Unlimited — $50/mo</span>
              </button>
              <p className="text-[10px] text-[var(--color-muted)] text-center mt-2 leading-tight">
                Unlimited PDFs · Priority everything
              </p>
            </div>
          )}
          {user.isAdmin && (
            <div
              role="group"
              aria-label="Admin: simulate plan"
              className="px-4 py-3 border-b border-[var(--color-line)] bg-white/[0.02]"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-2">
                Admin · Simulate plan
              </div>
              <div
                role="radiogroup"
                aria-label="Plan tier"
                className={`relative inline-flex items-center w-full h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] select-none transition-colors ${
                  flipping ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {(["free", "pro", "unlimited"] as const).map((tier) => {
                  const active = user.plan === tier;
                  const tierColor = tier === "unlimited" ? "#7C3AED" : "var(--color-cyan)";
                  return (
                    <button
                      key={tier}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={async () => {
                        if (flipping || active) return;
                        setFlipping(true);
                        try {
                          await fetch("/api/admin/plan", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ plan: tier }),
                          });
                          await refresh();
                          captureEvent("admin_plan_toggled", { plan: tier });
                        } finally {
                          setFlipping(false);
                        }
                      }}
                      className="relative flex-1 h-full text-xs font-semibold capitalize rounded-full transition-colors"
                      style={{
                        background: active ? tierColor : "transparent",
                        color: active ? "#060610" : "var(--color-muted)",
                      }}
                    >
                      {tier}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Link
            to="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-white/5"
          >
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-white/5 border-t border-[var(--color-line)]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
