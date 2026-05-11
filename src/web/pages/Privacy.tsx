import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { captureEvent } from "../lib/analytics";

const TITLE = "Privacy Policy — How Megabyte PDF protects your data";
const META_DESC =
  "How Megabyte PDF handles your account, documents, AI prompts, analytics, and exports — plain English, no dark patterns, no data sales.";
const UPDATED = "May 11, 2026";

export default function Privacy() {
  useDocumentTitle(TITLE);

  useEffect(() => {
    captureEvent("privacy_view", {});
    const origin = window.location.origin;
    const url = `${origin}/privacy`;
    const setMeta = (selector: string, attr: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        const m = selector.match(/^meta\[(name|property)="([^"]+)"\]$/);
        if (m && m[1] && m[2]) el.setAttribute(m[1], m[2]);
        document.head.appendChild(el);
      }
      el.setAttribute(attr, content);
    };
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };
    setMeta('meta[name="description"]', "content", META_DESC);
    setMeta('meta[name="robots"]', "content", "index,follow,max-image-preview:large");
    setMeta('meta[property="og:title"]', "content", TITLE);
    setMeta('meta[property="og:description"]', "content", META_DESC);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", "Megabyte PDF");
    setMeta('meta[property="og:locale"]', "content", "en_US");
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", TITLE);
    setMeta('meta[name="twitter:description"]', "content", META_DESC);
    setLink("canonical", url);

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": url,
          name: TITLE,
          description: META_DESC,
          inLanguage: "en-US",
          dateModified: "2026-05-11",
          isPartOf: { "@type": "WebSite", name: "Megabyte PDF", url: origin },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: origin },
            { "@type": "ListItem", position: 2, name: "Privacy", item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#privacy-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "privacy-jsonld";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(jsonLd);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden border-b border-[var(--color-line)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 opacity-50"
            style={{
              background:
                "radial-gradient(700px 360px at 18% 0%, rgba(0,229,255,0.14), transparent 60%), radial-gradient(640px 320px at 82% 8%, rgba(124,58,237,0.18), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-5 flex items-center gap-1.5">
              <Link to="/" className="hover:text-[var(--color-cyan)] transition-colors">Home</Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span aria-current="page" className="text-[var(--color-fg)]/80">Privacy</span>
            </nav>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Privacy Policy
            </h1>
            <p className="text-sm text-[var(--color-muted)]">Last updated {UPDATED}</p>
            <p className="mt-5 text-base text-[var(--color-fg)]/90 leading-relaxed max-w-[60ch]">
              Plain-English summary: we store your account, your documents, and your AI chats so the
              product works. We do not sell your data. We do not train on your prompts. You can
              export or delete everything at any time.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
          <Section title="What we collect">
            <p>When you create an account we store your email address and display name from your OAuth provider. When you use the editor we store your document content (HTML/CSS you generate with the AI), chat history, and any PDF exports you request. We also collect standard server logs (IP address, browser user-agent, request path, timestamp) and error traces via Sentry.</p>
          </Section>

          <Section title="How we use it">
            <p>Your document data is used exclusively to render previews and generate PDFs on your behalf. Your email is used for transactional messages (billing receipts, account alerts). We do not sell your data. We do not use your documents to train AI models.</p>
          </Section>

          <Section title="Analytics">
            <p>We use Google Analytics 4 (via Google Tag Manager) and PostHog to understand how people use the product. Both tools receive anonymised usage events (page views, feature interactions). PostHog is configured with <code>persistence:'memory'</code> — no cross-site cookies are set. You can opt out by enabling your browser's "Do Not Track" signal or by blocking <code>googletagmanager.com</code> and <code>us.i.posthog.com</code> in your ad-blocker.</p>
          </Section>

          <Section title="AI processing">
            <p>Your prompts are sent to Anthropic's Claude API to generate document HTML and CSS. Anthropic's <a href="https://www.anthropic.com/privacy" className="text-[var(--color-cyan)] underline-hover" target="_blank" rel="noopener noreferrer">privacy policy</a> governs how they handle API inputs. We do not share your prompts with any other third party.</p>
          </Section>

          <Section title="PDF generation">
            <p>PDF export runs inside Cloudflare's Browser Rendering service. Your rendered HTML is processed ephemerally in an isolated browser instance and never stored by Cloudflare beyond the duration of the request.</p>
          </Section>

          <Section title="Cookies and storage">
            <p>We use <code>localStorage</code> and session cookies only for authentication (via Clerk) and to preserve your editor state between sessions. No third-party advertising cookies are set by this service.</p>
          </Section>

          <Section title="Data retention">
            <p>Your account and documents are retained until you delete them. You can delete individual projects from the dashboard at any time. To permanently delete your account and all associated data, email <a href="mailto:hey@megabyte.space" className="text-[var(--color-cyan)] underline-hover">hey@megabyte.space</a>. We will complete deletion within 30 days.</p>
          </Section>

          <Section title="Third-party services">
            <ul className="list-disc list-inside space-y-1 text-[var(--color-muted)] text-sm">
              <li>Clerk — authentication</li>
              <li>Stripe — payment processing (we never see raw card numbers)</li>
              <li>Anthropic — AI completion</li>
              <li>Cloudflare — hosting, CDN, Browser Rendering</li>
              <li>Sentry — error monitoring</li>
              <li>PostHog — product analytics</li>
              <li>Google Analytics / GTM — usage analytics</li>
            </ul>
          </Section>

          <Section title="Your rights">
            <p>You may request a copy of your data, correct inaccuracies, or request deletion at any time. Email <a href="mailto:hey@megabyte.space" className="text-[var(--color-cyan)] underline-hover">hey@megabyte.space</a>. We will respond within 30 days. If you are in the EEA or UK you may also lodge a complaint with your supervisory authority.</p>
          </Section>

          <Section title="Children">
            <p>This service is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has created an account, contact us immediately and we will remove it.</p>
          </Section>

          <Section title="Changes">
            <p>We may update this policy. Material changes will be communicated by updating the date at the top of this page and, where appropriate, by email. Continued use after changes constitutes acceptance.</p>
          </Section>

          <Section title="Contact">
            <p>Megabyte Labs · <a href="mailto:hey@megabyte.space" className="text-[var(--color-cyan)] underline-hover">hey@megabyte.space</a></p>
          </Section>

          <aside
            className="mt-12 card p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
            aria-labelledby="legal-community-cta"
          >
            <div className="flex-1">
              <h2
                id="legal-community-cta"
                className="text-lg font-semibold mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                See what people are making
              </h2>
              <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                Browse public PDFs from the community — résumés, invoices, lesson plans, wedding
                invitations, all generated from a single prompt.
              </p>
            </div>
            <Link
              to="/explore?sort=trending"
              className="btn btn-primary shrink-0 inline-flex items-center gap-2 self-start sm:self-auto"
            >
              Explore community PDFs
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-xl font-semibold mb-3"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <div className="text-[var(--color-muted)] leading-relaxed text-sm space-y-3">{children}</div>
    </section>
  );
}
