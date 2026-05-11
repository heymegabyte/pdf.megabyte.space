import { Link } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ArrowLeft } from "lucide-react";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Privacy() {
  useDocumentTitle("Privacy Policy — How we protect your data");
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
      <header className="px-6 lg:px-10 py-5 flex items-center gap-4 border-b border-[var(--color-line)]">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--color-cyan)] focus:text-[#060610] focus:rounded-md focus:font-semibold focus:text-sm">Skip to content</a>
        <Link to="/" aria-label="Back to home" className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] underline-hover">
          <ArrowLeft size={16} /> Home
        </Link>
        <Logo size={28} className="ml-auto" />
      </header>

      <main id="main-content" className="flex-1 max-w-3xl mx-auto w-full px-6 lg:px-10 py-16">
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-12">Last updated May 4, 2025</p>

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
      </main>

      <footer className="border-t border-[var(--color-line)] px-6 lg:px-10 py-8 text-center text-sm text-[var(--color-muted)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-6xl mx-auto">
          <span>© {new Date().getFullYear()} Megabyte Labs</span>
          <nav aria-label="Legal and contact" className="flex items-center gap-4">
            <Link to="/privacy" className="underline-hover" aria-current="page">Privacy</Link>
            <Link to="/terms" className="underline-hover">Terms</Link>
            <a href="mailto:hey@megabyte.space" className="underline-hover">hey@megabyte.space</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-display)" }}>{title}</h2>
      <div className="text-[var(--color-muted)] leading-relaxed text-sm space-y-3">{children}</div>
    </section>
  );
}
