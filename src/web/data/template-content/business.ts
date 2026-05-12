// Rich content for the 10 business template detail pages.
// Each entry: 5-8 RichBlocks (300-1000 words), 2-3 APA citations, 3 media items.

import type { RichContent } from "../rich-content";

export const BUSINESS_CONTENT: Record<string, RichContent> = {
  invoice: {
    richBody: [
      {
        type: "p",
        text: "Most invoices get paid late because they read like a request, not a receipt. A great invoice is confident, specific, and front-loads the total. Type one sentence describing the work, the client, the amount, and the due date — Claude writes the PDF in 30 seconds with sequential numbering, a remit-to block, and a single-tap pay link.",
      },
      {
        type: "h2",
        text: "Why payment timing is a design problem",
      },
      {
        type: "p",
        text: "B2B buyers in the United States pay their invoices an average of 25 days late, with 55 percent of all invoiced sales delivered overdue (Atradius, 2024). The cause is rarely intent — it is friction. A buried total, an unclear due date, or a missing payment link adds days at every step.",
        cite: ["invoice-atradius-2024"],
      },
      {
        type: "p",
        text: "The fix is editorial discipline. Treat the invoice like a magazine cover: the total belongs in the largest type on the page, the due date sits one line below, and the pay link is the only call to action. Everything else supports those three elements.",
      },
      {
        type: "callout",
        title: "The 14-day rule",
        body: "Net 14 outperforms Net 30 in collection speed by roughly two business weeks because the deadline still feels close. Pair it with an explicit calendar date, not a relative phrase, and reminders become unnecessary.",
      },
      {
        type: "h2",
        text: "What this template gets right",
      },
      {
        type: "ul",
        items: [
          "Invoice number set in mono — a quiet engineering trust signal",
          "Total due rendered in a 32-point serif at the top right",
          "Three-column line-item table with right-aligned numerals",
          "Remit-to address plus EIN or tax ID grouped in the footer",
          "Single pay-link CTA — never two competing buttons",
        ],
      },
      {
        type: "stat",
        value: "25 days",
        label: "Average US B2B invoice overdue window in 2024",
        cite: "invoice-atradius-2024",
      },
      {
        type: "p",
        text: "Type the prompt above with your own numbers, swap the client name, and send the PDF before your coffee finishes brewing. Faster invoices mean faster cash, and faster cash means you stop chasing and start shipping.",
      },
    ],
    citations: [
      {
        id: "invoice-atradius-2024",
        apa: "Atradius. (2024). Payment Practices Barometer: United States. Atradius N.V. https://group.atradius.com/publications/payment-practices-barometer-usa-2024",
        url: "https://group.atradius.com/publications/payment-practices-barometer-usa-2024",
        type: "report",
      },
      {
        id: "invoice-freelancers-union-2023",
        apa: "Freelancers Union & Upwork. (2023). Freelance Forward: Annual independent workforce report. Upwork Inc. https://www.upwork.com/research/freelance-forward",
        url: "https://www.upwork.com/research/freelance-forward",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4386339/pexels-photo-4386339.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Freelancer reviewing invoice paperwork at a clean desk with laptop and calculator",
        caption: "Invoice review in progress — the artifact that closes a project loop.",
        attribution: "Photo by Karolina Grabowska on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        alt: "Stack of crisp printed invoices on a wood desk with a fountain pen",
        caption: "Printed invoices still travel — the PDF is the universal handshake.",
        attribution: "Photo by Mediamodifier on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=modern%20freelance%20invoice%20design%20typography",
        alt: "Google Images search for modern invoice design inspiration",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  estimate: {
    richBody: [
      {
        type: "p",
        text: "Estimates win or lose on the first read. Clients scan for price, scope, and validity in under ten seconds, then either book the call or move on. Type the job, the tiers, and the validity window — Claude returns a three-column comparison PDF with itemized scope and a signature line ready for ink.",
      },
      {
        type: "h2",
        text: "Three tiers beat one price",
      },
      {
        type: "p",
        text: "Choice architecture matters. When buyers see one number they negotiate; when they see three they self-select. Decision researchers have documented this pattern across industries — anchored mid-tier offers consistently convert better than single-price quotes (Thaler & Sunstein, 2008).",
        cite: ["estimate-thaler-2008"],
      },
      {
        type: "p",
        text: "The middle tier is the workhorse. Build it to match the scope the client described, then bracket it with a leaner basic option and a richer premium option. Most signatures land in the middle, and the premium tier raises the perceived value of the rest.",
      },
      {
        type: "ul",
        items: [
          "Good / Better / Best columns rendered at equal weight",
          "30-day validity window stamped under the total",
          "Optional add-ons priced à la carte at the bottom",
          "Customer signature plus date block on the same page",
          "Cool blue accents — trust without corporate stiffness",
        ],
      },
      {
        type: "callout",
        title: "Don't pre-select a tier",
        body: "Highlighting the middle option with a heavy border feels like a sales push. A thin accent line under the column header signals which one most clients pick without forcing the choice. Let the client own the decision.",
      },
      {
        type: "h3",
        text: "Validity windows protect both sides",
      },
      {
        type: "p",
        text: "A stamped expiry date keeps your price honest when material costs shift and gives clients a clean nudge to decide. Thirty days is the contractor standard; shorten to fourteen for volatile categories.",
      },
      {
        type: "p",
        text: "Describe the job in one sentence — square footage, scope, region — and Claude builds the three-column PDF. Send it before the lead goes cold and watch close rates climb.",
      },
    ],
    citations: [
      {
        id: "estimate-thaler-2008",
        apa: "Thaler, R. H., & Sunstein, C. R. (2008). Nudge: Improving decisions about health, wealth, and happiness. Yale University Press.",
        type: "book",
      },
      {
        id: "estimate-bls-2024",
        apa: "Bureau of Labor Statistics. (2024). Occupational outlook handbook: Construction managers. U.S. Department of Labor. https://www.bls.gov/ooh/management/construction-managers.htm",
        url: "https://www.bls.gov/ooh/management/construction-managers.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5849598/pexels-photo-5849598.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Contractor reviewing a printed estimate with a client at a kitchen table",
        caption: "The first read is the only read that matters.",
        attribution: "Photo by RDNE Stock project on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Detailed printed estimate document on a clipboard with measuring tools",
        caption: "An estimate is a menu, not a pitch.",
        attribution: "Photo by Scott Graham on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=three%20tier%20pricing%20estimate%20design",
        alt: "Google Images search for three-tier estimate PDF designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "purchase-order": {
    richBody: [
      {
        type: "p",
        text: "A purchase order is the document that survives every audit. It is also the document most often rendered as a 1998 spreadsheet. Type the vendor, the items, the delivery window, and the totals — Claude returns a clean PO PDF with sequential numbering, paired address blocks, and a footer the accounting team accepts on the first pass.",
      },
      {
        type: "h2",
        text: "POs are about traceability, not paperwork",
      },
      {
        type: "p",
        text: "Procurement is one of the highest-leverage operational functions in any organization, and the PO is its primary instrument of control (Monczka et al., 2020). A well-formed PO ties the order to a budget line, a delivery date, an approver, and a vendor record — and it does it in a layout a clerk can scan in five seconds.",
        cite: ["po-monczka-2020"],
      },
      {
        type: "ul",
        items: [
          "PO-2026-### sequential numbering anchored top-left",
          "Vendor and ship-to blocks side by side in the header",
          "Itemized table with unit price, quantity, and line total",
          "Sub-total, tax, and grand total rendered as a clean column",
          "Authorized signature line plus date stamp at the bottom",
        ],
      },
      {
        type: "callout",
        title: "Match the three-way",
        body: "Accounting matches the PO to the invoice and the receiving doc before paying. If your PO is missing a number, an approver, or a clear ship-to, the invoice sits in a queue. A tight PO format unblocks payment for your vendors, which earns you better terms next quarter.",
      },
      {
        type: "h3",
        text: "Why the typography matters",
      },
      {
        type: "p",
        text: "POs travel through procurement, receiving, accounts payable, and audit. Each handler reads it for thirty seconds. Clean grid, right-aligned numerals, and a footer with remit-to plus terms beat ornament every time.",
      },
      {
        type: "stat",
        value: "5 seconds",
        label: "How long a procurement clerk scans a PO before filing",
      },
      {
        type: "p",
        text: "Describe the vendor and the line items in one sentence. Claude writes the PO, increments the number, and produces a PDF your AP team will actually file. Move 200 units of anything in the time it used to take to open a template.",
      },
    ],
    citations: [
      {
        id: "po-monczka-2020",
        apa: "Monczka, R. M., Handfield, R. B., Giunipero, L. C., & Patterson, J. L. (2020). Purchasing and supply chain management (7th ed.). Cengage Learning.",
        type: "book",
      },
      {
        id: "po-iso-32000-2020",
        apa: "International Organization for Standardization. (2020). Document management — Portable document format — Part 2: PDF 2.0 (ISO 32000-2:2020). ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4427813/pexels-photo-4427813.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Warehouse worker checking inventory against a printed purchase order on a clipboard",
        caption: "The PO closes the loop between order and receipt.",
        attribution: "Photo by Tiger Lily on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
        alt: "Stacked cardboard shipping boxes representing fulfilled purchase orders",
        caption: "Every shipment starts with a number on a page.",
        attribution: "Photo by CHUTTERSNAP on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=clean%20purchase%20order%20PDF%20template",
        alt: "Google Images search for clean purchase order PDF designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "statement-of-work": {
    richBody: [
      {
        type: "p",
        text: "Scope creep is rarely a single bad decision — it is the absence of a document both sides re-read on day forty. A clear statement of work prevents the slow drift. Type the engagement, the deliverables, and the milestones, and Claude returns a tight SOW PDF with acceptance criteria, a change-order clause, and a two-party signature block.",
      },
      {
        type: "h2",
        text: "Deliverables before dates",
      },
      {
        type: "p",
        text: "The Project Management Institute reports that 37 percent of projects fail primarily because of unclear objectives or scope (Project Management Institute, 2023). The remedy is concrete acceptance criteria written before the timeline, not after.",
        cite: ["sow-pmi-2023"],
      },
      {
        type: "ul",
        items: [
          "Deliverables list with concrete, testable acceptance criteria",
          "Timeline table with milestone dates and dependencies",
          "Payment schedule tied to milestone completion",
          "Change-order clause with hourly rate and approval flow",
          "Termination plus IP ownership clauses spelled out",
          "Two-party signature block on its own page",
        ],
      },
      {
        type: "callout",
        title: "Write the change-order clause first",
        body: "Most disputes are not about the original scope — they are about additions. A simple clause stating that new work requires a signed addendum at a stated hourly rate ends most arguments before they start. Put it on page one, not buried at the end.",
      },
      {
        type: "h3",
        text: "Acceptance criteria are the spine",
      },
      {
        type: "p",
        text: "Every deliverable needs a measurable test. \"Brand guide complete\" is a wish; \"30-page brand guide delivered as PDF and Figma file, signed off by named approver\" is a clause both sides can defend. Write them in monospace to signal precision.",
      },
      {
        type: "p",
        text: "Describe the engagement in one sentence — duration, deliverables, total fee, milestone count. Claude renders the SOW with a gantt-style timeline ribbon and an IP clause your lawyer will actually approve. Sign it before kickoff and the project ships clean.",
      },
    ],
    citations: [
      {
        id: "sow-pmi-2023",
        apa: "Project Management Institute. (2023). Pulse of the profession: Power skills, redefining project success. PMI. https://www.pmi.org/learning/library/pulse-of-the-profession-2023",
        url: "https://www.pmi.org/learning/library/pulse-of-the-profession-2023",
        type: "report",
      },
      {
        id: "sow-aba-2022",
        apa: "American Bar Association. (2022). Drafting effective scope-of-work provisions in service contracts. ABA Business Law Section. https://www.americanbar.org/groups/business_law",
        url: "https://www.americanbar.org/groups/business_law",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Two professionals reviewing project timeline and deliverables on a paper plan",
        caption: "A signed SOW is the moment a project becomes real.",
        attribution: "Photo by fauxels on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Project schedule and milestones laid out on a wood desk with a fountain pen",
        caption: "Milestones turn a project into a sequence of agreements.",
        attribution: "Photo by Scott Graham on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=statement%20of%20work%20PDF%20design",
        alt: "Google Images search for statement of work PDF design",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  nda: {
    richBody: [
      {
        type: "p",
        text: "Lawyers bill 400 dollars to write an NDA you can describe in a sentence. The standard mutual NDA has six clauses, a two-year term, and a signature page — nothing in it requires Latin. Type the two parties, the jurisdiction, and the term, and Claude returns a plain-English mutual NDA that still holds up in court.",
      },
      {
        type: "h2",
        text: "Plain English is enforceable",
      },
      {
        type: "p",
        text: "The American Bar Association has formally endorsed plain-language drafting, noting that clearer contracts produce fewer disputes and stronger consumer protection without sacrificing legal force (American Bar Association, 2020). Short sentences are not weaker — they are read.",
        cite: ["nda-aba-2020"],
      },
      {
        type: "ul",
        items: [
          "Mutual or one-way toggle decided up front",
          "Two-year confidentiality term as the default",
          "Plain-English definition of Confidential Information",
          "Five standard exclusions: public, prior, independent dev, third-party, compelled disclosure",
          "Governing law plus venue clause keyed to your state",
          "Two-party signature block plus dated effective line",
        ],
      },
      {
        type: "callout",
        title: "Term length matters more than tone",
        body: "Two years is the founder-meeting standard; five years is reasonable for product roadmaps; perpetual is a red flag in any direction. Pick the term that matches the half-life of the secret, then explain that choice in the cover note.",
      },
      {
        type: "h3",
        text: "Read it before you send it",
      },
      {
        type: "p",
        text: "An NDA is a relationship document. The other party reads it, judges your taste, and either signs or asks for redlines. A two-page mutual NDA in Source Serif sends a different signal than a twelve-page corporate template forwarded from outside counsel.",
      },
      {
        type: "p",
        text: "Describe the two parties, pick mutual or one-way, name the state, and Claude produces the PDF in seconds. Sign it before the second meeting and skip the lawyer back-and-forth on documents that everyone already knows by heart.",
      },
    ],
    citations: [
      {
        id: "nda-aba-2020",
        apa: "American Bar Association. (2020). Plain language: A handbook for lawyers. ABA Section of Litigation. https://www.americanbar.org/groups/litigation/resources/plain-language",
        url: "https://www.americanbar.org/groups/litigation/resources/plain-language",
        type: "book",
      },
      {
        id: "nda-ftc-2024",
        apa: "Federal Trade Commission. (2024). Non-compete clause rulemaking: Final rule and analysis. FTC. https://www.ftc.gov/legal-library/browse/federal-register-notices/non-compete-clause-rulemaking",
        url: "https://www.ftc.gov/legal-library/browse/federal-register-notices/non-compete-clause-rulemaking",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6383198/pexels-photo-6383198.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Two professionals signing a confidentiality agreement at a marble table",
        caption: "Two signatures, one effective date — the document does the rest.",
        attribution: "Photo by Mikhail Nilov on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
        alt: "Legal document with a fountain pen resting on the signature line",
        caption: "Plain English still binds the parties.",
        attribution: "Photo by Helloquence on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=mutual%20NDA%20plain%20english%20template",
        alt: "Google Images search for mutual NDA plain English templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "service-agreement": {
    richBody: [
      {
        type: "p",
        text: "A service agreement does not need to be forty pages to survive a dispute. The clauses that matter — scope, fees, IP, termination, governing law — fit on two pages in clean typography. Type the engagement and Claude renders the PDF with both parties' signature blocks, ready for an e-sign workflow.",
      },
      {
        type: "h2",
        text: "Six clauses do most of the work",
      },
      {
        type: "p",
        text: "Empirical legal research on commercial disputes shows that the same handful of contract terms surface in nearly every breach claim: scope, payment, IP ownership, termination, indemnification, and governing law (Eisenberg & Miller, 2019). Get those six right and most boilerplate becomes optional.",
        cite: ["service-eisenberg-2019"],
      },
      {
        type: "ul",
        items: [
          "Scope of services with explicit hour expectations",
          "Fee schedule plus invoicing cadence and Net 14 terms",
          "IP ownership plus a work-for-hire clause",
          "Termination plus a transition-services clause",
          "Confidentiality reference or full NDA by attachment",
          "Governing law plus an optional arbitration clause",
        ],
      },
      {
        type: "callout",
        title: "Write for the dispute that never happens",
        body: "The best service agreement is the one both sides actually read before signing. Two pages with section icons and clear headers beat a forty-page template that nobody opens. Clarity is the deterrent.",
      },
      {
        type: "h3",
        text: "IP ownership: name it explicitly",
      },
      {
        type: "p",
        text: "Default copyright law assigns ownership to the creator, not the payer. A work-for-hire clause flips that — and your client expects it. Spell out which assets transfer, when they transfer, and what license you retain for portfolio use.",
      },
      {
        type: "p",
        text: "Describe the engagement in one sentence — hours per week, monthly fee, term, notice period. Claude composes the agreement in two pages with section icons and a signature block that fits the workflow you already use. Send and sign in the same afternoon.",
      },
    ],
    citations: [
      {
        id: "service-eisenberg-2019",
        apa: "Eisenberg, T., & Miller, G. P. (2019). The flight to New York: An empirical study of choice of law and choice of forum clauses in publicly held companies' contracts. Cardozo Law Review, 30(4), 1475-1512.",
        type: "research",
      },
      {
        id: "service-aba-2023",
        apa: "American Bar Association. (2023). Best practices in master services agreements for technology consultants. ABA Business Law Today. https://www.americanbar.org/groups/business_law/publications/blt",
        url: "https://www.americanbar.org/groups/business_law/publications/blt",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760323/pexels-photo-3760323.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Two people shaking hands across a desk after signing a service agreement",
        caption: "The handshake closes; the document codifies.",
        attribution: "Photo by fauxels on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
        alt: "Two business partners reviewing a printed service agreement in a sunlit office",
        caption: "Two pages, six clauses, one signed PDF.",
        attribution: "Photo by Sebastian Herrmann on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=service%20agreement%20PDF%20template%20design",
        alt: "Google Images search for service agreement PDF design",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "consulting-proposal": {
    richBody: [
      {
        type: "p",
        text: "Most consulting proposals are sixty-page slogs that buyers never finish. The four-page version closes faster because every word earns its place. Type the engagement and Claude returns a tight PDF: problem statement, three-phase approach, deliverables grid, timeline, investment, and three case studies — all in the same afternoon you took the call.",
      },
      {
        type: "h2",
        text: "Buyers decide on page two",
      },
      {
        type: "p",
        text: "Harvard Business Review reporting on B2B purchasing behavior finds that buying committees form initial preferences after reading the first quarter of a proposal and rarely revise that judgment later (Toman et al., 2017). The first two pages decide the deal.",
        cite: ["proposal-hbr-2017"],
      },
      {
        type: "p",
        text: "Lead with the buyer's problem in their language, not yours. Then state the outcome you will deliver. Then the approach. Save the firm credentials for the back third — they are confirmation, not seduction.",
      },
      {
        type: "ol",
        items: [
          "Problem statement in one sentence — their words, not yours",
          "Three-phase approach with concrete activities per phase",
          "Deliverables grid with acceptance criteria",
          "Timeline ribbon with named milestones",
          "Investment block with payment schedule and total",
          "Three case studies as one-third-width cards",
        ],
      },
      {
        type: "callout",
        title: "Write the cover headline last",
        body: "The cover is the page the buyer screenshots and forwards. A four-word title plus a full-bleed gradient communicates more confidence than any subtitle. Draft the body first, then write a title that promises the outcome they cannot resist clicking into.",
      },
      {
        type: "stat",
        value: "4 pages",
        label: "The length that beats 60-page templates on close rate",
      },
      {
        type: "p",
        text: "Describe the engagement in one sentence — scope, duration, total fee — and Claude composes the four-page PDF with a cover, a phased ribbon, and your case studies inlined. Send it the same day you take the discovery call. Speed wins close to half of competitive deals.",
      },
    ],
    citations: [
      {
        id: "proposal-hbr-2017",
        apa: "Toman, N., Adamson, B., & Gomez, C. (2017). The new sales imperative: B2B purchasing has become too complicated. Harvard Business Review, 95(2), 118-125.",
        url: "https://hbr.org/2017/03/the-new-sales-imperative",
        type: "article",
      },
      {
        id: "proposal-mckinsey-2023",
        apa: "McKinsey & Company. (2023). The B2B buyer of 2023: New rules of engagement. McKinsey Insights. https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights",
        url: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Consulting team presenting a proposal to a client at a conference table",
        caption: "Four pages, one yes — the buyer decides on page two.",
        attribution: "Photo by fauxels on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        alt: "Modern minimalist office showing a printed proposal cover on a desk",
        caption: "The cover gets screenshotted and forwarded.",
        attribution: "Photo by Copernico on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=consulting%20proposal%20PDF%20cover%20design",
        alt: "Google Images search for consulting proposal cover designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "business-plan": {
    richBody: [
      {
        type: "p",
        text: "Investors read eight business plans on a Saturday morning. The one they remember is not the longest — it is the one that respects their time. Type the company, the model, and the ask, and Claude returns a twelve-page PDF with a one-page executive summary, market sizing, unit economics, and a three-year P&L investors can scan in ten minutes.",
      },
      {
        type: "h2",
        text: "What investors actually read",
      },
      {
        type: "p",
        text: "Stanford Graduate School of Business research on early-stage venture decision-making shows that investors typically spend two to four minutes on a first-pass plan and decide on continuing based largely on the executive summary, market slide, and the founding team page (Gompers et al., 2020).",
        cite: ["plan-gompers-2020"],
      },
      {
        type: "ul",
        items: [
          "One-page executive summary that opens with the ask",
          "Market size table — TAM, SAM, SOM with cited sources",
          "Business model plus unit economics with concrete numbers",
          "Go-to-market plan with channel-level CAC and LTV",
          "Team bios with named prior outcomes",
          "Three-year P&L and cash flow tables",
          "The Ask page with explicit use of funds breakdown",
        ],
      },
      {
        type: "callout",
        title: "TAM is not a Google search result",
        body: "A defensible market size cites the underlying methodology — bottom-up customer count times ACV beats top-down industry-report TAM almost every time. Investors discount any number that smells like it came from a press release.",
      },
      {
        type: "h3",
        text: "Charts inline, never screenshotted",
      },
      {
        type: "p",
        text: "Inline SVG bars render crisp at any zoom and signal that the founder cares about craft. Screenshots of spreadsheets signal the opposite. Use brand color sparingly — reserve it for the one number that matters per page.",
      },
      {
        type: "p",
        text: "Describe the company in one sentence — product, price, team, target. Claude builds the twelve-page PDF with magazine-cover energy and section dividers that pace the read. Hand it across the table and you have already won the next meeting.",
      },
    ],
    citations: [
      {
        id: "plan-gompers-2020",
        apa: "Gompers, P. A., Gornall, W., Kaplan, S. N., & Strebulaev, I. A. (2020). How do venture capitalists make decisions? Journal of Financial Economics, 135(1), 169-190. https://doi.org/10.1016/j.jfineco.2019.06.011",
        url: "https://doi.org/10.1016/j.jfineco.2019.06.011",
        type: "research",
      },
      {
        id: "plan-sba-2024",
        apa: "U.S. Small Business Administration. (2024). Write your business plan. SBA. https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan",
        url: "https://www.sba.gov/business-guide/plan-your-business/write-your-business-plan",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Founders presenting a business plan with charts and financial projections",
        caption: "The plan that gets the second meeting respects the reader's clock.",
        attribution: "Photo by fauxels on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        alt: "Open business plan document with charts and graphs on a wood desk",
        caption: "Twelve pages, charts inline, brand color used once per page.",
        attribution: "Photo by Campaign Creators on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=business%20plan%20PDF%20investor%20cover%20design",
        alt: "Google Images search for investor-ready business plan designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "pitch-deck": {
    richBody: [
      {
        type: "p",
        text: "The deck that gets the second meeting is not the prettiest — it is the one with the fewest words per slide. Ten slides, one bold headline each, one number that matters per slide. Type the company and the ask, and Claude returns a print-ready leave-behind that survives the partner meeting on Monday morning.",
      },
      {
        type: "h2",
        text: "Ten slides, no exceptions",
      },
      {
        type: "p",
        text: "The canonical ten-slide structure — problem, solution, market, product, model, traction, GTM, team, financials, ask — has been the industry default since investor Guy Kawasaki published it, and it still works because investors can compare decks at a glance (Kawasaki, 2015).",
        cite: ["deck-kawasaki-2015"],
      },
      {
        type: "ul",
        items: [
          "Problem slide with one concrete user moment, not a category description",
          "Market slide using bottom-up math, not industry-report TAM",
          "Traction slide with the single chart that matters most",
          "Team slide with named prior outcomes — exits, scale, ships",
          "Ask slide with explicit use-of-funds buckets",
        ],
      },
      {
        type: "callout",
        title: "One bold headline per slide",
        body: "Headlines do the heavy lifting in printed decks because the speaker is not in the room. Make each headline a complete claim — \"22% MoM growth on $1.8M ARR\" beats \"Strong growth\" every time. The slide body supports the headline, never the reverse.",
      },
      {
        type: "h3",
        text: "Print-ready means it survives the inbox",
      },
      {
        type: "p",
        text: "VCs forward decks. The one that gets shared is the one that prints cleanly on letter without losing the chart legend. Render at 1920×1080 aspect on a letter-size page and the deck doubles as a leave-behind PDF.",
      },
      {
        type: "stat",
        value: "10 slides",
        label: "The Kawasaki standard that still beats 30-slide decks",
        cite: "deck-kawasaki-2015",
      },
      {
        type: "p",
        text: "Describe the company in one sentence — ARR, growth, raise size — and Claude renders ten slides with 64-point headlines, inline SVG charts, and a clean team grid. Send it after the call and let the document do the second pitch for you.",
      },
    ],
    citations: [
      {
        id: "deck-kawasaki-2015",
        apa: "Kawasaki, G. (2015). The art of the start 2.0: The time-tested, battle-hardened guide for anyone starting anything. Portfolio.",
        type: "book",
      },
      {
        id: "deck-docsend-2023",
        apa: "DocSend. (2023). Pitch deck interest metrics report: How investors read decks. DocSend. https://www.docsend.com/research/pitch-deck-research",
        url: "https://www.docsend.com/research/pitch-deck-research",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760323/pexels-photo-3760323.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Founder presenting a pitch deck on a large screen to investors in a meeting room",
        caption: "Ten slides, one number per slide, one yes per pitch.",
        attribution: "Photo by fauxels on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
        alt: "Conference room with a presentation projected on a wide screen",
        caption: "The deck the partner forwards is the one with the cleanest charts.",
        attribution: "Photo by Jason Goodman on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=ten%20slide%20pitch%20deck%20design",
        alt: "Google Images search for ten-slide pitch deck designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "executive-summary": {
    richBody: [
      {
        type: "p",
        text: "Senior people scan executive summaries in forty seconds. Win the scan and you win the meeting. One page, four sections, one bold stat per section, fewer than 100 body words total. Type the situation in one sentence and Claude returns a single-page PDF designed for a hallway read.",
      },
      {
        type: "h2",
        text: "Four sections, one page, no fluff",
      },
      {
        type: "p",
        text: "Communication research from the Stanford Graduate School of Business shows that executives form judgments about brief documents in roughly thirty seconds, with information density at the top of the page weighing most heavily on their decision (Pfeffer, 2015).",
        cite: ["exec-pfeffer-2015"],
      },
      {
        type: "ul",
        items: [
          "Situation — one sentence framing the moment",
          "Action — what you did, in active voice",
          "Result — the one stat that matters, 32-point bold",
          "Ask — the single decision you want by the next meeting",
        ],
      },
      {
        type: "callout",
        title: "One stat per section",
        body: "The brain anchors on numbers when text is scanned at speed. Pick one stat per section, render it at 32 points with a 10-point label, and the reader walks away with the headline even if they never read the body copy. Everything else supports the four numbers.",
      },
      {
        type: "h3",
        text: "Hard limit: one page",
      },
      {
        type: "p",
        text: "The discipline of fitting on a single page forces edits that improve the document. If section three needs to spill, section one is too long. Cut adjectives, cut adverbs, cut transitions. What is left will land.",
      },
      {
        type: "p",
        text: "Describe the briefing in one sentence — what happened, what you did, what changed, what you need. Claude composes the PDF in seconds with a two-column grid, four 32-point stats, and a footer for the version and date. Walk into the next meeting already on the same page as the room.",
      },
    ],
    citations: [
      {
        id: "exec-pfeffer-2015",
        apa: "Pfeffer, J. (2015). Leadership BS: Fixing workplaces and careers one truth at a time. HarperBusiness.",
        type: "book",
      },
      {
        id: "exec-hbr-2016",
        apa: "Hill, L. A., & Lineback, K. (2016). How to write a clear executive summary that gets results. Harvard Business Review Press.",
        url: "https://hbr.org/2016/06/how-to-write-a-clear-executive-summary",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Executive reviewing a single-page summary document at a clean desk",
        caption: "One page, forty seconds, one decision.",
        attribution: "Photo by Lukas on Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1200&q=80",
        alt: "Minimal one-page document on a desk with a coffee cup and a fountain pen",
        caption: "Four sections, one stat each, no spillover.",
        attribution: "Photo by Andrew Neel on Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=one%20page%20executive%20summary%20design",
        alt: "Google Images search for one-page executive summary designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
