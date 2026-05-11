import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "../lib/auth";

export function TopBar({ children }: { children?: React.ReactNode }) {
  return (
    <header className="px-4 lg:px-6 py-3 border-b border-[var(--color-line)] flex items-center justify-between gap-3 bg-[var(--color-bg)]/80 backdrop-blur sticky top-0 z-30">
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

function UserMenu() {
  const { me, signOut, status } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
            <div className="text-xs text-[var(--color-muted)] mt-1">
              Plan: <span className="text-[var(--color-fg)] capitalize">{user.plan}</span>
            </div>
          </div>
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
