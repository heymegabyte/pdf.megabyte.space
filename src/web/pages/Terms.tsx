import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight } from "lucide-react";
import { TopBar } from "../components/TopBar";
import { Footer } from "../components/Footer";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { captureEvent } from "../lib/analytics";

const TITLE = "Terms of Service — Using Megabyte PDF responsibly";
const META_DESC =
  "Account rules, acceptable use, billing, AI output disclaimers, and liability terms for Megabyte PDF — the chat-to-PDF service from Megabyte Labs.";
const UPDATED = "May 11, 2026";

export default function Terms() {
  useDocumentTitle(TITLE);

  useEffect(() => {
    captureEvent("terms_view", {});
    const origin = window.location.origin;
    const url = `${origin}/terms`;
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
            { "@type": "ListItem", position: 2, name: "Terms", item: url },
          ],
        },
      ],
    };
    let ld = document.querySelector<HTMLScriptElement>(
      'script[type="application/ld+json"]#terms-jsonld'
    );
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.id = "terms-jsonld";
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
                "radial-gradient(700px 360px at 22% 0%, rgba(124,58,237,0.16), transparent 60%), radial-gradient(640px 320px at 78% 8%, rgba(0,229,255,0.14), transparent 60%)",
            }}
          />
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-muted)] mb-5 flex items-center gap-1.5">
              <Link to="/" className="hover:text-[var(--color-cyan)] transition-colors">Home</Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span aria-current="page" className="text-[var(--color-fg)]/80">Terms</span>
            </nav>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Terms of Service
            </h1>
            <p className="text-sm text-[var(--color-muted)]">Last updated {UPDATED}</p>
            <p className="mt-5 text-base text-[var(--color-fg)]/90 leading-relaxed max-w-[60ch]">
              Short version: be 13 or older, don't break the law with the tool, you keep your
              documents, AI output isn't legal advice, and you can cancel any time.
            </p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
          <Section title="Agreement">
            <p>By accessing or using Megabyte PDF ("Service") you agree to these Terms. If you do not agree, do not use the Service. These Terms form a binding contract between you and Megabyte Labs ("we", "us", "our").</p>
          </Section>

          <Section title="Service description">
            <p>Megabyte PDF is an AI-assisted document editor that generates HTML/CSS from natural-language prompts and renders print-quality PDFs. The Service includes a browser-based editor, saved projects, AI chat history, and PDF export.</p>
          </Section>

          <Section title="Accounts">
            <p>You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your login credentials. Notify us immediately if you suspect unauthorised access. We may suspend or terminate accounts that violate these Terms.</p>
          </Section>

          <Section title="Acceptable use">
            <p>You may use the Service for any lawful personal or commercial document creation. You may not:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Use the Service to generate illegal, harmful, or deceptive content</li>
              <li>Attempt to reverse-engineer, scrape, or stress-test the Service</li>
              <li>Resell access to the Service without prior written permission</li>
              <li>Use the Service to infringe third-party intellectual property</li>
            </ul>
          </Section>

          <Section title="Your content">
            <p>You retain all rights to the documents you create. By using the Service you grant us a limited licence to process, render, and store your content solely to provide the Service. We claim no ownership of your documents.</p>
          </Section>

          <Section title="AI output">
            <p>Content generated by the AI is provided as-is. You are responsible for reviewing AI output before relying on it professionally or legally. We make no guarantees that AI-generated documents are accurate, complete, or suitable for any specific purpose.</p>
          </Section>

          <Section title="Free tier">
            <p>Guest users receive 10 AI prompts per day. Free-tier signed-in users receive 1 saved project. We reserve the right to adjust these limits with 14 days' notice posted on the Service.</p>
          </Section>

          <Section title="Billing">
            <p>Pro ($9/month) and Unlimited ($50/month) plans are billed monthly via Stripe. You may cancel at any time from your account settings; access continues until the end of your billing period. We do not offer refunds for partial months except where required by law. Prices may change with 30 days' notice.</p>
          </Section>

          <Section title="Availability">
            <p>We aim for high availability but do not guarantee uninterrupted service. Planned maintenance will be announced where practical. We are not liable for losses arising from downtime.</p>
          </Section>

          <Section title="Disclaimers">
            <p>The Service is provided "as is" without warranty of any kind. To the maximum extent permitted by law, we disclaim all implied warranties, including fitness for a particular purpose and non-infringement.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>Our total liability to you for any claim arising from or related to the Service shall not exceed the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
          </Section>

          <Section title="Indemnification">
            <p>You agree to indemnify and hold Megabyte Labs harmless from claims, losses, or damages arising from your use of the Service or your violation of these Terms.</p>
          </Section>

          <Section title="Governing law">
            <p>These Terms are governed by the laws of the State of Delaware, USA. Disputes shall be resolved by binding arbitration under AAA rules, except either party may seek injunctive relief in any court of competent jurisdiction.</p>
          </Section>

          <Section title="Changes">
            <p>We may modify these Terms at any time. Material changes will be communicated by updating the date above and emailing registered users where practical. Continued use after the effective date constitutes acceptance.</p>
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
