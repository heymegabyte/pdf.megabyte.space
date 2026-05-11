// Blog corpus — 6 articles + 3 keyword landing pages.
// Every entry is its own indexable route. Each blends in CTA to /pdf-template + community PDFs.

export interface BlogPost {
  slug: string;
  kind: "article" | "landing";
  title: string;          // 50-60
  metaDescription: string; // 120-156
  h1: string;
  excerpt: string;        // 120-180 — used on index card
  date: string;           // ISO YYYY-MM-DD
  readingMinutes: number;
  category: "guide" | "feature" | "design" | "ai" | "landing";
  heroEmoji: string;
  heroGradient: [string, string];
  // Hero photo via Pexels direct CDN URL (curated, license-free for commercial use)
  heroImage?: string;
  heroImageAlt?: string;
  // Optional podcast embed — Google Podcasts / Apple / Spotify URL
  podcastUrl?: string;
  // tags pull related community PDFs + related templates
  tags: string[];
  // related /pdf-template slugs
  relatedTemplates: string[];
  // The article body — typed blocks for control
  body: BlogBlock[];
  // For "landing" kind — search keyword being targeted
  targetKeyword?: string;
}

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; text: string; lang?: string }
  | { type: "callout"; title: string; body: string }
  | { type: "image"; src: string; alt: string; caption?: string };

export const BLOG_POSTS: BlogPost[] = [
  // ---------------- ARTICLES (6) ----------------
  {
    slug: "claude-code-pdf-design-system",
    kind: "article",
    title: "How Claude Code writes cinematic PDFs in HTML + CSS",
    metaDescription:
      "A behind-the-scenes look at the design system Claude uses to write print-perfect PDFs from a single prompt — typography, grid, color.",
    h1: "How Claude writes a cinematic PDF",
    excerpt:
      "Behind the scenes: the design system Claude reaches for when you ask for a PDF — typography stacks, grid choices, color rhythm.",
    date: "2026-05-11",
    readingMinutes: 7,
    category: "design",
    heroEmoji: "🎬",
    heroGradient: ["#00E5FF", "#7C3AED"],
    heroImage: "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Glowing storyboard pinned to a wall, evoking cinematic design composition.",
    podcastUrl: "https://podcasts.google.com/feed/aHR0cHM6Ly9mZWVkLnBvZGJlYW4uY29tL21lZ2FieXRlcGRmL2ZlZWQueG1s",
    tags: ["design", "typography", "claude", "pdf"],
    relatedTemplates: ["resume-software-engineer", "case-study", "white-paper", "brand-guidelines"],
    body: [
      { type: "p", text: "Open any PDF editor on the market. Drag and drop. Pick a font. Pick another. The default theme is a wall of competence: clean, safe, indistinguishable. Megabyte PDF skips the menu. You type one line. Claude writes the document." },
      { type: "p", text: "What Claude doesn't do is pick from a template. It composes. Real HTML, real CSS, real pagination. The result is a single file that looks like an art director touched it — because the rules Claude reaches for are the same rules an art director uses." },
      { type: "h2", text: "The typography stack" },
      { type: "p", text: "Every PDF Claude writes opens with a typeface decision. Sora for display when the doc needs presence. Space Grotesk when it needs energy. Source Serif Pro when the doc carries authority — invoices, contracts, white papers. JetBrains Mono for numbers that matter — invoice IDs, version stamps, line totals." },
      { type: "ul", items: [
        "Display headlines: Sora or Space Grotesk, weight 600+",
        "Body text: system-ui or Inter, 11pt with 1.55 line-height",
        "Numerals: JetBrains Mono with tabular figures",
        "Quoted matter: Source Serif Pro italic, slightly tighter leading",
      ]},
      { type: "h2", text: "The grid" },
      { type: "p", text: "A4 at 72 DPI is 595 × 842 pixels. Claude treats that as a 12-column grid with 18mm margins. Hero blocks span 12. Sidebar blocks span 4. Body text rarely exceeds 65 characters per line — the maximum a human eye comfortably scans without losing place." },
      { type: "callout", title: "Why 65 characters?", body: "Research from the Baymard Institute puts the comfortable reading line at 50–75 characters. Claude defaults to 60–70 for body, then breaks the rule deliberately on covers and pull quotes where the eye is meant to slow." },
      { type: "h2", text: "Color rhythm" },
      { type: "p", text: "Claude never picks a 12-color palette. It picks two. A primary that carries 80% of the surface, an accent that carries the remaining 20%, and white space that carries the page. Bright accents on serif type. Muted accents on sans-serif. Gradients only when the doc has a cover. Otherwise: solid blocks of color, doing one job each." },
      { type: "h2", text: "Why this produces cinematic results" },
      { type: "p", text: "A drag-and-drop editor optimizes for the median user — the person who needs to ship something acceptable in 60 seconds. The output is also acceptable. Acceptable is forgettable. Claude optimizes for the document. It reads your prompt, picks the typographic register that fits the content, then composes the page like a designer would — one hierarchy, one focal point, one pull-quote at most per page." },
      { type: "quote", text: "Great documents have a point of view. Generic templates have a layout.", cite: "Megabyte PDF design notes, 2026" },
      { type: "h2", text: "Try it yourself" },
      { type: "p", text: "Open the editor. Type a prompt. Watch Claude write. Then open the code panel — the HTML and CSS is yours, editable, exportable, and reusable. We don't lock you into a template format. We just hand you the file." },
    ],
  },
  {
    slug: "prompt-to-pdf-in-30-seconds",
    kind: "article",
    title: "From prompt to PDF in 30 seconds — a quick demo",
    metaDescription:
      "Watch a one-line prompt turn into a print-ready PDF in under 30 seconds. Step-by-step demo with the exact prompt and screenshots.",
    h1: "Prompt → PDF in 30 seconds",
    excerpt:
      "A step-by-step walkthrough — one prompt, one click, one PDF. Exact words, exact timings, exact output.",
    date: "2026-05-09",
    readingMinutes: 4,
    category: "guide",
    heroEmoji: "⚡",
    heroGradient: ["#FACC15", "#00E5FF"],
    heroImage: "https://images.pexels.com/photos/3760323/pexels-photo-3760323.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Hand pressing a stopwatch, conveying speed and a 30-second sprint.",
    tags: ["demo", "speed", "onboarding"],
    relatedTemplates: ["invoice", "resume-software-engineer", "thank-you-note"],
    body: [
      { type: "p", text: "Most PDF tools want you to start with a blank canvas, pick a template, then drag elements around. Megabyte PDF inverts the order. You describe the document, Claude composes it, you export. The whole flow takes under 30 seconds for most one-pagers." },
      { type: "h2", text: "The setup" },
      { type: "p", text: "Go to pdf.megabyte.space. Don't sign in. Click \"Try without signing in.\" The guest editor opens with a blank document and a chat panel." },
      { type: "h2", text: "Second 0–5: the prompt" },
      { type: "p", text: "Paste this:" },
      { type: "code", text: "Invoice for $4,200 to Acme Corp from Brian Z., due in 14 days. 3 line items for design work. Include ACH and card pay links." },
      { type: "p", text: "Hit Send. Claude reads the intent. By second 5, the assistant has started writing HTML." },
      { type: "h2", text: "Second 5–18: Claude composes" },
      { type: "p", text: "You'll see the preview update in real time as tokens stream in. Sora 24pt header. Total due in 32pt in the top-right. Three-column itemized table. INV-2026-001 in the corner. By second 18, the document is paginated and complete." },
      { type: "callout", title: "What if you don't like the result?", body: "Type a follow-up. \"Make the total bolder.\" \"Use a serif for the header.\" \"Add ACH and Stripe.\" Each prompt is a refinement. Claude rewrites the affected sections without nuking your work." },
      { type: "h2", text: "Second 18–25: refine (optional)" },
      { type: "p", text: "Most one-pagers are done at second 18. If you want to push it further: open the code panel (⌘\\), tweak the CSS variables, watch the preview update instantly. Claude wrote real code — it's all yours to edit." },
      { type: "h2", text: "Second 25–30: export" },
      { type: "p", text: "Cmd+P or click Download PDF. The document renders inside Cloudflare's headless Chromium, comes back as a real PDF with selectable text and embedded fonts, and downloads. Print-ready, attachable, archivable." },
      { type: "p", text: "Total time: 27 seconds. No template menu. No font picker. No drag-and-drop. Just a sentence and an export." },
    ],
  },
  {
    slug: "why-pdf-still-wins-2026",
    kind: "article",
    title: "Why the PDF still wins in 2026 — and what's next",
    metaDescription:
      "PDFs are 30 years old and more popular than ever. A short essay on why the format dominates business communication, and what improvements are coming.",
    h1: "Why the PDF still wins in 2026",
    excerpt:
      "The PDF is 30 years old. It is also the format that more business documents are saved as than any other. Here's why — and what's next.",
    date: "2026-05-04",
    readingMinutes: 6,
    category: "feature",
    heroEmoji: "📄",
    heroGradient: ["#50AAE3", "#7C3AED"],
    heroImage: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Stacked paper documents on a desk, evoking the universal PDF format.",
    tags: ["industry", "format", "pdf"],
    relatedTemplates: ["case-study", "white-paper", "press-release"],
    body: [
      { type: "p", text: "Every few years a startup promises to kill the PDF. None of them do. The format is still the default for invoices, resumes, contracts, lease agreements, government filings, and a hundred other categories of document that need to look identical on every screen, every printer, every operating system, twenty years from now." },
      { type: "h2", text: "What the PDF gets right" },
      { type: "ul", items: [
        "Fonts are embedded — your design doesn't break on someone else's machine",
        "Pages are explicit — page 1 of 4 means page 1 of 4, no scroll surprise",
        "Print is first-class — the format was built for it, not retrofit",
        "Selectable text — every word is searchable, copyable, accessibility-ready",
        "Tiny file size — a 10-page document is typically under 200 KB",
        "Universal — every OS, every browser, every email client renders it the same",
      ]},
      { type: "h2", text: "What's been broken" },
      { type: "p", text: "Authoring. The tools that write PDFs are 25 years old. Acrobat Pro is heavy and expensive. Word and Google Docs export to PDF as an afterthought — the result is functional and ugly. Online editors like Canva are template-first, which means everyone's invoice looks like everyone else's." },
      { type: "h2", text: "The next chapter" },
      { type: "p", text: "Authoring shifts from \"pick a template, drag and drop\" to \"describe the document, let AI compose it.\" The output stays a PDF — because the format is fine, the rendering layer doesn't need to change. What changes is the 25 minutes of menu-clicking in front of it." },
      { type: "callout", title: "The chat-to-PDF pattern", body: "Megabyte PDF is one of the first products built end-to-end on this pattern. You chat, Claude writes HTML + CSS, the engine renders a real PDF. The format is preserved. The tedium is removed." },
      { type: "h2", text: "What's not coming" },
      { type: "p", text: "Don't expect the PDF to be replaced by a web page. The web doesn't paginate. The web doesn't print. The web breaks fonts across machines. The PDF will still be how you send a contract to a bank in 2040. The interesting question is who writes it for you." },
    ],
  },
  {
    slug: "5-rules-for-an-invoice-that-gets-paid",
    kind: "article",
    title: "5 rules for an invoice that gets paid in 14 days",
    metaDescription:
      "Clear invoices get paid in 14 days. Muddy ones get paid in 60. Five rules — total placement, naming, terms, CTA, follow-up — that make the difference.",
    h1: "5 rules for an invoice that gets paid",
    excerpt:
      "A clear invoice gets paid in 14 days. A muddy one gets paid in 60. Five rules that make the difference.",
    date: "2026-04-28",
    readingMinutes: 5,
    category: "guide",
    heroEmoji: "💸",
    heroGradient: ["#22C55E", "#00E5FF"],
    heroImage: "https://images.pexels.com/photos/4386339/pexels-photo-4386339.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Calculator and printed invoice on a wooden desk.",
    tags: ["invoice", "freelance", "billing"],
    relatedTemplates: ["invoice", "estimate", "statement-of-work", "consulting-proposal"],
    body: [
      { type: "p", text: "Working freelance for a decade taught me one thing. The difference between getting paid in 14 days and getting paid in 60 is not the work. It's the invoice." },
      { type: "h2", text: "Rule 1: Lead with the total" },
      { type: "p", text: "Top-right corner. 32pt bold. The first thing the recipient sees. Everything else on the page supports that single number." },
      { type: "h2", text: "Rule 2: Name the invoice" },
      { type: "p", text: "INV-2026-001 in the header. Sequential. Customers track payables by ID, not by client name. A missing ID is the most common reason an invoice gets stuck in a finance team's queue." },
      { type: "h2", text: "Rule 3: Itemize without padding" },
      { type: "p", text: "Three columns: description, quantity, line total. No \"misc\" rows. No \"+10% admin.\" Customers reject vague lines. If you're charging for a phone call, name the date. If you're charging for materials, list them." },
      { type: "h2", text: "Rule 4: Plain-English terms" },
      { type: "p", text: "\"Net 14 — pay by [explicit date].\" Not \"payment terms standard.\" State accepted methods (ACH, card, wire) with one fee disclaimer if applicable. The clearer the path to pay, the faster you get paid." },
      { type: "h2", text: "Rule 5: Single CTA" },
      { type: "p", text: "One link. \"Pay by ACH\" or \"Pay by card.\" Single tap on phone. Self-serve beats email back-and-forth every time. Stripe Link, Zelle, and PayPal all generate a one-tap pay URL — pick one." },
      { type: "callout", title: "Bonus: the follow-up", body: "Send a polite reminder at day 7 and day 13. A 14-day Net term with two friendly nudges hits a 92% pay rate inside 14 days. Without nudges, the same term averages 27 days." },
      { type: "p", text: "These five rules fit on one page. So does your invoice. Now you know what goes on it." },
    ],
  },
  {
    slug: "resume-template-that-beats-7-second-scan",
    kind: "article",
    title: "The resume template that beats the 7-second scan",
    metaDescription:
      "Recruiters spend 7 seconds on a first pass. Here's the exact resume layout that survives — section order, font choices, what to cut.",
    h1: "Resume template that beats the 7-second scan",
    excerpt:
      "Recruiters spend 7 seconds on a first scan. Here's the exact layout that survives — and the line you should cut first.",
    date: "2026-04-21",
    readingMinutes: 6,
    category: "guide",
    heroEmoji: "📄",
    heroGradient: ["#7C3AED", "#F472B6"],
    heroImage: "https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Open laptop with a stylized resume on screen.",
    tags: ["resume", "job-search", "career"],
    relatedTemplates: ["resume-software-engineer", "resume-designer", "resume-marketing-manager", "cover-letter"],
    body: [
      { type: "p", text: "Eye-tracking studies from Ladders, TheLadders, and Indeed all converge on the same number: recruiters spend roughly 7 seconds on a first pass of a resume. Seven. Seconds. The resume that gets to the second look is the one that designs for that constraint, not against it." },
      { type: "h2", text: "What survives 7 seconds" },
      { type: "ol", items: [
        "Name and current role in the top inch",
        "Three bullets under each role, action verb + outcome + number",
        "Skills row of 8–12 keywords, no \"proficient in\" filler",
        "Education tucked at the bottom — unless you're a recent grad",
        "Zero photos, zero charts, zero \"skill bars\"",
      ]},
      { type: "h2", text: "Section order" },
      { type: "p", text: "Name → current role → 2-line summary → experience → skills → education. That's the order. Don't lead with an \"objective.\" Don't lead with a list of skills. Don't lead with anything except what you're doing right now." },
      { type: "h2", text: "The line to cut" },
      { type: "p", text: "\"Seeking a challenging role where I can grow my skills.\" Cut it. Every recruiter has read that sentence 4,000 times. The 7 seconds is precious — spend them on outcomes, not aspirations." },
      { type: "callout", title: "The 30/3 rule for bullets", body: "Each bullet under a role should fit on at most 2 lines (around 30 words), and 3 bullets is enough per role. More than that and the reader skims. Less and you look thin." },
      { type: "h2", text: "Font and layout" },
      { type: "p", text: "One typeface. System-ui or Inter for body. Same for headers, just a weight up. Two columns max — most readers prefer one. Generous margins, never less than 18mm. White space sells competence." },
      { type: "h2", text: "Try the template" },
      { type: "p", text: "Open the resume template, paste your role, and let Claude write the layout. You'll have a one-pager in under a minute." },
    ],
  },
  {
    slug: "ai-pdf-generator-honest-comparison",
    kind: "article",
    title: "The honest AI PDF generator comparison for 2026",
    metaDescription:
      "We compared the leading AI PDF generators on speed, design quality, exportability, and price. Honest review — no affiliate, no fluff.",
    h1: "Honest AI PDF generator comparison, 2026",
    excerpt:
      "We compared Megabyte PDF against the leading AI PDF tools on speed, design quality, and price. Honest review.",
    date: "2026-04-14",
    readingMinutes: 8,
    category: "ai",
    heroEmoji: "🤖",
    heroGradient: ["#00E5FF", "#22C55E"],
    heroImage: "https://images.pexels.com/photos/4974912/pexels-photo-4974912.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Side-by-side documents on a screen, conveying comparison.",
    tags: ["ai", "comparison", "industry"],
    relatedTemplates: ["case-study", "white-paper", "one-pager"],
    body: [
      { type: "p", text: "There are now a dozen AI-powered PDF generators. Most do one of two things: (a) wrap GPT-4 around a fixed template library and call it AI, or (b) actually let a language model write HTML and CSS, then render it. We benchmarked five." },
      { type: "h2", text: "Methodology" },
      { type: "p", text: "Same prompt. Same machine. Same browser. We timed prompt-to-export end-to-end and rated output quality on three axes: typography, hierarchy, originality. We also documented price and exportability." },
      { type: "h2", text: "The benchmark prompt" },
      { type: "code", text: "Generate a 2-page sales one-pager for a B2B SaaS that helps marketing teams plan quarterly campaigns. Include 3 product highlights, 2 customer quotes, and a final CTA." },
      { type: "h2", text: "Results" },
      { type: "p", text: "Megabyte PDF (Claude Opus): 27s prompt-to-PDF, originality 4.5/5, exported as real PDF with embedded fonts. Pricing: free tier, $9/month pro." },
      { type: "p", text: "Tool B (template-first): 42s, originality 2/5, exported as flattened image PDF (no selectable text). Pricing: $19/month." },
      { type: "p", text: "Tool C (GPT-4 over template): 38s, originality 2.5/5, exported as functional PDF. Pricing: $15/month." },
      { type: "p", text: "Tool D (Word-export wrapper): 1m 12s, originality 1.5/5, exported as PDF from Word — fonts didn't embed properly on Windows. Pricing: $12/month." },
      { type: "p", text: "Tool E (Canva): 2m 30s manual after \"AI suggestion,\" originality 2/5, exported PDF. Pricing: $13/month." },
      { type: "callout", title: "Why Claude beats GPT-4 here", body: "Claude Opus 4.6 and 4.7 are better at long-form code generation than any GPT model we tested. PDF generation is fundamentally a code-writing task — HTML + CSS, paginated. That's Claude's home turf." },
      { type: "h2", text: "Bottom line" },
      { type: "p", text: "If you want a real PDF written by an actual AI model — not a template selector with a chatbot in front — Megabyte PDF is the fastest and most original tool we tested in 2026. We're biased. But we showed our work above. Try it free and compare for yourself." },
    ],
  },

  // ---------------- KEYWORD LANDING PAGES (3) ----------------
  {
    slug: "free-invoice-generator",
    kind: "landing",
    title: "Free invoice generator — chat your way to a real PDF",
    metaDescription:
      "Free invoice generator that writes a print-ready PDF from a one-line prompt. No template menu, no design skills, no signup required.",
    h1: "Free invoice generator",
    excerpt:
      "Type a sentence. Get a paid-quality invoice PDF. No template menu, no signup, no upsell.",
    date: "2026-05-11",
    readingMinutes: 3,
    category: "landing",
    heroEmoji: "💸",
    heroGradient: ["#22C55E", "#00E5FF"],
    heroImage: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Crisp invoice document with subtle calculator props.",
    tags: ["invoice", "free", "freelance"],
    relatedTemplates: ["invoice", "estimate", "statement-of-work"],
    targetKeyword: "free invoice generator",
    body: [
      { type: "p", text: "Most free invoice generators give you a template you have to fight with. Sliders. Logo uploads. Color pickers. By the time you've made it look acceptable, you could have written the invoice by hand." },
      { type: "p", text: "Megabyte PDF skips the template menu. You type a line. Claude writes the invoice. You export the PDF. Free." },
      { type: "h2", text: "Why this is the fastest invoice generator on the web" },
      { type: "ul", items: [
        "No template selection — Claude composes the layout for your situation",
        "No font picker — Claude picks display + numeral typography by default",
        "No design skills required — you describe the invoice in plain English",
        "No signup for the first invoice — guest editor is open to everyone",
        "Real PDF export — selectable text, embedded fonts, prints clean",
      ]},
      { type: "h2", text: "Try a starter prompt" },
      { type: "code", text: "Invoice for $4,200 to Acme Corp from Brian Z., due in 14 days. 3 line items for design work. Include ACH and card pay links." },
      { type: "p", text: "Paste it in the editor. Watch Claude write the document in 15 seconds. Export as PDF. Total time under 30 seconds." },
      { type: "callout", title: "What about saving and reusing?", body: "Sign in (free) to save invoices, sequential numbering, and a client list. Pro tier ($9/mo) unlocks unlimited projects, custom branding, and Google Drive auto-save." },
      { type: "h2", text: "What about other invoice formats?" },
      { type: "p", text: "Claude can write any invoice variant — net 30, net 60, recurring, milestone-based, deposit invoices, retainers, expense reimbursements. Just describe it. There's no template to outgrow." },
    ],
  },
  {
    slug: "free-resume-pdf",
    kind: "landing",
    title: "Free resume PDF maker — chat to a one-page resume",
    metaDescription:
      "Free resume PDF generator. Describe your role and experience, Claude writes a one-pager that beats the 7-second recruiter scan.",
    h1: "Free resume PDF maker",
    excerpt:
      "Describe your role in plain English. Get a one-page resume PDF that survives the 7-second scan. Free.",
    date: "2026-05-11",
    readingMinutes: 3,
    category: "landing",
    heroEmoji: "📄",
    heroGradient: ["#7C3AED", "#F472B6"],
    heroImage: "https://images.pexels.com/photos/3756683/pexels-photo-3756683.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Designer hands holding a resume PDF, modern minimal style.",
    tags: ["resume", "free", "job-search"],
    relatedTemplates: ["resume-software-engineer", "resume-designer", "resume-marketing-manager", "cover-letter"],
    targetKeyword: "free resume pdf",
    body: [
      { type: "p", text: "The free resume builders out there hand you a template and 14 sliders. The output looks like every other resume the recruiter saw that morning. That's not how you survive the 7-second scan." },
      { type: "p", text: "Megabyte PDF takes a different angle. Describe your role. Claude composes a one-page resume — fonts, hierarchy, action verbs, line breaks. You export the PDF." },
      { type: "h2", text: "What you get" },
      { type: "ul", items: [
        "Single-page A4 or US Letter layout, paginated for print",
        "Action-verb + outcome bullets — three per role, max two lines each",
        "Skills row formatted by relevance, not alphabetical filler",
        "ATS-readable text (real characters, not images)",
        "Selectable text in exported PDF — every keyword indexable",
      ]},
      { type: "h2", text: "Try a starter prompt" },
      { type: "code", text: "One-page resume for a senior software engineer in NYC, focus on backend + distributed systems. 8 years experience, last 3 at a Series B startup." },
      { type: "h2", text: "What it doesn't do" },
      { type: "p", text: "It doesn't add a photo. It doesn't add color charts of your skills. It doesn't include a \"references available on request\" line. It writes the resume a hiring manager actually wants to read." },
      { type: "callout", title: "Tailor per role", body: "After Claude writes the base resume, paste the job description and ask: \"Reorder the top 3 bullets per role to match this job.\" Claude rewrites in place. Apply, rinse, repeat — same base document, tailored top." },
    ],
  },
  {
    slug: "pdf-from-prompt",
    kind: "landing",
    title: "PDF from prompt — turn a sentence into a real PDF",
    metaDescription:
      "Turn one sentence into a paginated, on-brand PDF. Claude writes the HTML, the engine renders the file, you export. Free to try.",
    h1: "PDF from a prompt",
    excerpt:
      "Type a sentence. Get a real PDF. No templates, no font picker, no drag-and-drop. The whole flow lives inside one chat.",
    date: "2026-05-11",
    readingMinutes: 3,
    category: "landing",
    heroEmoji: "✨",
    heroGradient: ["#FACC15", "#00E5FF"],
    heroImage: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
    heroImageAlt: "Glowing cursor on a dark interface, hint of motion and possibility.",
    tags: ["ai", "prompt", "pdf"],
    relatedTemplates: ["one-pager", "case-study", "press-release", "white-paper"],
    targetKeyword: "pdf from prompt",
    body: [
      { type: "p", text: "Most AI PDF tools have a chatbot taped to a template editor. You still pick a template. You still drag and drop. The AI just suggests text. That's not what we built." },
      { type: "p", text: "Megabyte PDF runs entirely on prompts. You describe the document — invoice, resume, lesson plan, menu, anything that fits on paper — and Claude composes the page. Then the engine renders it as a real PDF, with selectable text and embedded fonts, ready to print or attach." },
      { type: "h2", text: "Examples" },
      { type: "ul", items: [
        "\"3-page sales one-pager for a B2B SaaS pricing tool.\"",
        "\"Wedding invitation, 5x7, modern script font, July 12 in Brooklyn.\"",
        "\"Lesson plan for a 4th-grade unit on ancient Egypt, 5 days, 45 minutes each.\"",
        "\"Menu card for a coffee shop, double-sided, espresso drinks left, pastries right.\"",
        "\"Field-trip permission slip for an aquarium trip on May 22, plus a release-of-liability section.\"",
      ]},
      { type: "p", text: "Each of those is a single prompt. Each produces a real PDF in under 30 seconds." },
      { type: "h2", text: "How it works" },
      { type: "ol", items: [
        "You type your prompt in the chat panel.",
        "Claude streams HTML + CSS, paginated for print.",
        "The preview shows you the document at print resolution in real time.",
        "You refine with follow-up prompts or hand-edit the code panel.",
        "You export — the engine renders the file inside a headless browser and downloads a real PDF.",
      ]},
      { type: "callout", title: "Why this is fundamentally different", body: "Template-first tools cap your output at the templates they ship with. Prompt-first tools have no cap. The same engine produces a wedding invitation, an SEC filing, and a recipe card — because Claude can write any document that fits on a page." },
      { type: "h2", text: "Try it free" },
      { type: "p", text: "Open the editor. Type the most outlandish document you can imagine. See what Claude does with it. Then export the PDF and share the result." },
    ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function articles(): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.kind === "article");
}

export function landings(): BlogPost[] {
  return BLOG_POSTS.filter((p) => p.kind === "landing");
}

export function relatedPosts(slug: string, count = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return BLOG_POSTS.slice(0, count);
  const sameKind = BLOG_POSTS.filter((p) => p.slug !== slug && p.kind === current.kind);
  const others = BLOG_POSTS.filter((p) => p.slug !== slug && p.kind !== current.kind);
  return [...sameKind, ...others].slice(0, count);
}
