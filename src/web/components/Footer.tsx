import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { captureEvent } from "../lib/analytics";

interface Social {
  name: string;
  url: string;
  hex: string;
  // Inline SVG path so we don't need a 14-icon dependency. 24x24 viewBox.
  path: string;
}

// Brand hex colors per network. Hover/focus/active tint each anchor with its brand color.
// URLs harvested from https://megabyte.space footer.
const SOCIALS: Social[] = [
  {
    name: "GitHub",
    url: "https://github.com/heymegabyte",
    hex: "#FFFFFF",
    path:
      "M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.24 3.34.95.1-.74.4-1.24.73-1.53-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.94 10.94 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.08 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z",
  },
  {
    name: "X",
    url: "https://x.com/megabytelabs",
    hex: "#FFFFFF",
    path:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/megabyte-labs",
    hex: "#0A66C2",
    path:
      "M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45C23.21 24 24 23.23 24 22.27V1.73C24 .77 23.21 0 22.22 0z",
  },
  {
    name: "YouTube",
    url: "https://www.youtube.com/@megabytelabs",
    hex: "#FF0000",
    path:
      "M23.5 6.2a3.02 3.02 0 0 0-2.13-2.13C19.45 3.5 12 3.5 12 3.5s-7.45 0-9.37.57A3.02 3.02 0 0 0 .5 6.2C0 8.12 0 12 0 12s0 3.88.5 5.8a3.02 3.02 0 0 0 2.13 2.13C4.55 20.5 12 20.5 12 20.5s7.45 0 9.37-.57a3.02 3.02 0 0 0 2.13-2.13c.5-1.92.5-5.8.5-5.8s0-3.88-.5-5.8zM9.55 15.57V8.43L15.82 12z",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com/megabytelabs",
    hex: "#E4405F",
    path:
      "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.22.06 1.26.07 1.64.07 4.84s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.22a3.7 3.7 0 0 1-.9 1.38c-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.22.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.22-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.22C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.22.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.22-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.85 5.85 0 0 0-2.13 1.38A5.85 5.85 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91a5.85 5.85 0 0 0 1.38 2.13 5.85 5.85 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.85 5.85 0 0 0 2.13-1.38 5.85 5.85 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.85 5.85 0 0 0-1.38-2.13A5.85 5.85 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.15a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.84a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/megabytelabs",
    hex: "#1877F2",
    path:
      "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.03 4.39 11.03 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.23 2.69.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z",
  },
  {
    name: "Reddit",
    url: "https://www.reddit.com/r/megabytelabs",
    hex: "#FF4500",
    path:
      "M24 12c0-1.66-1.35-3-3-3a3 3 0 0 0-2.06.81C17.41 8.78 15.13 8.05 12.6 8L13.78 3l3.42.74a2.13 2.13 0 1 0 0-.86l-3.81-.83-1.42 6.03c-2.6.04-4.93.77-6.49 1.83A3 3 0 0 0 3 9c-1.66 0-3 1.34-3 3 0 1.25.77 2.32 1.86 2.78a4.5 4.5 0 0 0-.05.72c0 3.59 4.13 6.5 9.2 6.5s9.2-2.91 9.2-6.5c0-.24-.02-.48-.05-.72A3 3 0 0 0 24 12zM6.5 13.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm10.6 4.95c-.96.95-2.79 1.04-3.32 1.04s-2.36-.08-3.32-1.04a.4.4 0 1 1 .56-.55c.6.6 1.9.82 2.76.82s2.15-.22 2.76-.82a.4.4 0 1 1 .56.55zm-.32-3.45a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z",
  },
  {
    name: "Discord",
    url: "https://discord.gg/megabytelabs",
    hex: "#5865F2",
    path:
      "M20.32 4.37A19.79 19.79 0 0 0 16.5 3.2a.07.07 0 0 0-.08.04 13.78 13.78 0 0 0-.61 1.27 18.27 18.27 0 0 0-5.61 0 12.5 12.5 0 0 0-.62-1.27.07.07 0 0 0-.07-.04 19.74 19.74 0 0 0-3.83 1.17.07.07 0 0 0-.03.03C2.04 8.13 1.36 11.78 1.7 15.4a.08.08 0 0 0 .03.05 19.91 19.91 0 0 0 6.01 3.04.08.08 0 0 0 .08-.03 14.2 14.2 0 0 0 1.23-2 .07.07 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.89.08.08 0 0 1-.01-.13l.37-.29a.07.07 0 0 1 .07-.01 14.18 14.18 0 0 0 12.09 0 .07.07 0 0 1 .08.01l.37.29a.08.08 0 0 1-.01.13 12.3 12.3 0 0 1-1.87.89.07.07 0 0 0-.04.1c.36.7.77 1.36 1.23 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.02-3.04.08.08 0 0 0 .03-.05c.4-4.18-.69-7.8-2.92-11A.06.06 0 0 0 20.32 4.37zM8.02 13.22c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.96-2.41 2.16-2.41 1.21 0 2.18 1.09 2.16 2.41 0 1.33-.96 2.41-2.16 2.41zm7.98 0c-1.18 0-2.16-1.08-2.16-2.41 0-1.33.96-2.41 2.16-2.41 1.21 0 2.18 1.09 2.16 2.41 0 1.33-.95 2.41-2.16 2.41z",
  },
  {
    name: "Telegram",
    url: "https://t.me/megabytelabs",
    hex: "#26A5E4",
    path:
      "M21.96 4.2 18.74 19.42c-.24 1.07-.88 1.34-1.78.83l-4.91-3.62-2.37 2.28c-.26.26-.48.48-.99.48l.35-5 9.06-8.18c.4-.35-.08-.55-.61-.2L7.32 12.99 2.5 11.48c-1.05-.33-1.07-1.05.22-1.55l18.83-7.26c.87-.32 1.64.2 1.41 1.53z",
  },
  {
    name: "Threads",
    url: "https://www.threads.net/@megabytelabs",
    hex: "#FFFFFF",
    path:
      "M12.18 21.5h-.01c-3.24 0-5.74-1.07-7.43-3.18C3.23 16.43 2.5 13.83 2.5 12c0-1.83.73-4.43 2.24-6.32 1.69-2.11 4.19-3.18 7.43-3.18h.01c2.5 0 4.61.69 6.27 2.05 1.55 1.27 2.62 3.07 3.18 5.36l-1.92.45c-.95-3.93-3.36-5.92-7.54-5.92-2.65 0-4.66.84-5.95 2.49C5.06 8.42 4.5 10.36 4.5 12c0 1.64.56 3.58 1.72 5.08 1.29 1.65 3.3 2.49 5.95 2.49 2.41 0 4.05-.58 5.36-1.85.75-.73 1.27-1.65 1.54-2.7-1.02 1.04-2.59 1.59-4.55 1.59-1.18 0-2.27-.26-3.16-.76-1.18-.66-1.83-1.7-1.83-2.93 0-1.21.56-2.21 1.61-2.89.96-.62 2.3-.95 3.86-.95.96 0 1.85.13 2.65.37-.11-1.51-1.04-2.41-2.73-2.41-.59 0-1.46.13-2.07.69l-1.13-1.42c.78-.7 1.97-1.07 3.19-1.07 2.93 0 4.67 1.73 4.7 4.62 1.43 1.15 2.18 2.78 2.18 4.66 0 1.95-.74 3.77-2.07 5.13-1.6 1.62-3.85 2.46-6.85 2.46zm.61-9.36c-.97 0-1.86.22-2.51.62-.42.27-.91.74-.91 1.4 0 .54.33 1 .89 1.31.47.27 1.13.42 1.84.42 1.93 0 3.31-.89 3.41-2.62-.71-.49-1.66-.74-2.72-.74z",
  },
  {
    name: "GitLab",
    url: "https://gitlab.com/megabytelabs",
    hex: "#FC6D26",
    path:
      "M23.94 11.07 23.9 11l-3.36-8.77a.88.88 0 0 0-.87-.55.88.88 0 0 0-.51.19c-.15.13-.26.3-.32.49l-2.27 6.95H7.43L5.16 2.36a.88.88 0 0 0-.32-.49.88.88 0 0 0-.51-.19.88.88 0 0 0-.87.55L.1 11l-.03.07a6.24 6.24 0 0 0 2.07 7.21l.01.01.03.02 5.12 3.83 2.53 1.92 1.55 1.16a1.04 1.04 0 0 0 1.24 0l1.55-1.16 2.53-1.92 5.15-3.85.01-.01a6.24 6.24 0 0 0 2.07-7.21z",
  },
  {
    name: "npm",
    url: "https://www.npmjs.com/org/megabytelabs",
    hex: "#CB3837",
    path:
      "M0 0v24h24V0zm19.2 19.2h-2.4v-9.6h-4.8v9.6H4.8V4.8h14.4z",
  },
  {
    name: "Pinterest",
    url: "https://www.pinterest.com/megabytelabs",
    hex: "#BD081C",
    path:
      "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z",
  },
  {
    name: "RSS",
    url: "https://megabyte.space/rss.xml",
    hex: "#F26522",
    path:
      "M6.18 15.64a2.18 2.18 0 1 1 0 4.36 2.18 2.18 0 0 1 0-4.36zM4 4.44A19.56 19.56 0 0 1 23.56 24h-3.31A16.25 16.25 0 0 0 4 7.75zm0 5.55a13.83 13.83 0 0 1 14 14h-3.41A10.45 10.45 0 0 0 4 13.41z",
  },
];

export function Footer() {
  return (
    <footer data-vt="site-footer" className="border-t border-[var(--color-line)] bg-[var(--color-bg)] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">
          <div>
            <Link to="/" aria-label="Megabyte PDF home" className="inline-flex items-center gap-2 mb-3">
              <Logo size={28} />
            </Link>
            <p className="text-xs text-[var(--color-muted)] max-w-[28ch] leading-relaxed">
              Describe a PDF in plain English. Megabyte writes the HTML and renders it. No
              templates, no design software.
            </p>
            <div className="mt-4 flex items-center gap-1.5 flex-wrap" aria-label="Social links">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Megabyte Labs on ${s.name}`}
                  title={s.name}
                  onClick={() => captureEvent("footer_social_click", { network: s.name })}
                  className="social-icon group inline-flex items-center justify-center w-9 h-9 rounded-md text-[var(--color-muted)] hover:text-[var(--brand)] focus-visible:text-[var(--brand)] active:text-[var(--brand)] hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] transition-colors"
                  style={{ ["--brand" as never]: s.hex }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    aria-hidden="true"
                    className="transition-transform group-hover:scale-110 group-active:scale-95"
                  >
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/explore?sort=trending", label: "Explore" },
              { to: "/templates", label: "Templates" },
              { to: "/guest", label: "Try without signup" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: "https://megabyte.space", label: "Megabyte Labs", external: true },
              { href: "mailto:hey@megabyte.space", label: "Contact" },
              { href: "https://github.com/heymegabyte", label: "Open source", external: true },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { to: "/privacy", label: "Privacy" },
              { to: "/terms", label: "Terms" },
              { href: "/.well-known/security.txt", label: "Security" },
            ]}
          />
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-[var(--color-muted)]">
          <div>© {new Date().getFullYear()} Megabyte Labs · Built in one prompt.</div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />
            <span>pdf.megabyte.space — live</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterLink {
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)] font-semibold mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            {l.to ? (
              <Link
                to={l.to}
                className="text-xs text-[var(--color-fg)]/90 hover:text-[var(--color-cyan)] transition-colors"
              >
                {l.label}
              </Link>
            ) : (
              <a
                href={l.href}
                target={l.external ? "_blank" : undefined}
                rel={l.external ? "noopener noreferrer" : undefined}
                className="text-xs text-[var(--color-fg)]/90 hover:text-[var(--color-cyan)] transition-colors"
              >
                {l.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
