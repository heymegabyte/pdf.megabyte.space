import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { captureEvent } from "../lib/analytics";

export default function NotFound() {
  useDocumentTitle("404 — Lost in the binary");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const head = document.head;
    const desc = document.createElement("meta");
    desc.name = "description";
    desc.content =
      "This page didn't make it through the printer. Head back to Explore for fresh PDFs from the community.";
    head.appendChild(desc);
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex,follow";
    head.appendChild(robots);
    captureEvent("not_found", { path: window.location.pathname });
    return () => {
      desc.remove();
      robots.remove();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)] flex items-center justify-center px-6 py-16 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 800px 600px at 80% 10%, rgba(0,229,255,0.10), transparent 60%), radial-gradient(ellipse 600px 500px at 10% 90%, rgba(124,58,237,0.08), transparent 65%)",
        }}
      />
      <div className="relative z-10 max-w-xl w-full text-center">
        <Link
          to="/"
          aria-label="Megabyte PDF home"
          className="inline-flex mb-10 hover:opacity-90 transition-opacity"
        >
          <Logo size={36} />
        </Link>
        <div
          className="font-mono text-[clamp(96px,18vw,180px)] leading-none font-black select-none"
          style={{
            background:
              "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-violet) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 60px rgba(0,229,255,0.20)",
            letterSpacing: "-0.04em",
          }}
        >
          404
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
          Lost in the binary.
        </h1>
        <p className="mt-4 text-[var(--color-muted)] text-pretty max-w-md mx-auto">
          This page didn't make it through the printer. Try one of these instead — or hit
          Explore for fresh community PDFs.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/explore" className="btn btn-primary">
            Browse Explore
          </Link>
          <Link to="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
        <ul className="mt-10 grid grid-cols-2 gap-2 text-sm text-[var(--color-muted)]">
          <li>
            <Link
              to="/t/resume"
              className="underline-hover hover:text-[var(--color-cyan)]"
            >
              Resumes
            </Link>
          </li>
          <li>
            <Link
              to="/t/deck"
              className="underline-hover hover:text-[var(--color-cyan)]"
            >
              Decks
            </Link>
          </li>
          <li>
            <Link
              to="/t/proposal"
              className="underline-hover hover:text-[var(--color-cyan)]"
            >
              Proposals
            </Link>
          </li>
          <li>
            <Link
              to="/t/guide"
              className="underline-hover hover:text-[var(--color-cyan)]"
            >
              Guides
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
