// Rich content extensions for the 9 blog posts + landing pages.
// Supplies APA citations + a 4-item media gallery per slug. The blog body itself
// already lives in blog.ts — these blocks add a short "Sources" close + sources.

import type { RichContent } from "./rich-content";

export const BLOG_CONTENT: Record<string, RichContent> = {
  // ───────────────────────── ARTICLES ─────────────────────────
  "claude-code-pdf-design-system": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The line-length default, the typographic register, and the column math draw from primary research and two classic books on type — citations below.",
        cite: ["baymard-2024-line-length", "bringhurst-2012-elements", "tufte-2001-visual"],
      },
    ],
    citations: [
      {
        id: "baymard-2024-line-length",
        apa:
          "Baymard Institute. (2024). Readability: The optimal line length. Baymard Institute Research. https://baymard.com/blog/line-length-readability",
        url: "https://baymard.com/blog/line-length-readability",
        type: "research",
      },
      {
        id: "bringhurst-2012-elements",
        apa:
          "Bringhurst, R. (2012). The elements of typographic style (4th ed.). Hartley & Marks.",
        type: "book",
      },
      {
        id: "tufte-2001-visual",
        apa:
          "Tufte, E. R. (2001). The visual display of quantitative information (2nd ed.). Graphics Press.",
        type: "book",
      },
      {
        id: "iso-32000-2-2020",
        apa:
          "International Organization for Standardization. (2020). ISO 32000-2:2020 Document management — Portable document format — Part 2: PDF 2.0. ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
      {
        id: "anthropic-2025-claude-models",
        apa:
          "Anthropic. (2025). Claude model overview. Anthropic Documentation. https://docs.anthropic.com/en/docs/about-claude/models",
        url: "https://docs.anthropic.com/en/docs/about-claude/models",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Glowing storyboard pinned to a wall, evoking cinematic design composition.",
        caption: "Storyboard wall — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Designer at a laptop sketching layout grids over code.",
        caption: "Laying out columns over real markup — Pexels.",
        attribution: "Christina Morillo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
        alt: "Editor on a dark screen showing crisp typography and grid guides.",
        caption: "Typography on a dark editor — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("editorial pdf typography grid design system"),
        alt: "Google Images search for editorial PDF typography grid design.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "prompt-to-pdf-in-30-seconds": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The 30-second envelope assumes Claude's streaming throughput and headless Chromium render times — both documented below.",
        cite: ["anthropic-2025-claude-models", "cloudflare-2024-browser-rendering"],
      },
    ],
    citations: [
      {
        id: "anthropic-2025-claude-models",
        apa:
          "Anthropic. (2025). Claude model overview. Anthropic Documentation. https://docs.anthropic.com/en/docs/about-claude/models",
        url: "https://docs.anthropic.com/en/docs/about-claude/models",
        type: "article",
      },
      {
        id: "cloudflare-2024-browser-rendering",
        apa:
          "Cloudflare. (2024). Browser Rendering API. Cloudflare Developer Documentation. https://developers.cloudflare.com/browser-rendering/",
        url: "https://developers.cloudflare.com/browser-rendering/",
        type: "article",
      },
      {
        id: "iso-32000-1-2008",
        apa:
          "International Organization for Standardization. (2008). ISO 32000-1:2008 Document management — Portable document format — Part 1: PDF 1.7. ISO. https://www.iso.org/standard/51502.html",
        url: "https://www.iso.org/standard/51502.html",
        type: "spec",
      },
      {
        id: "nielsen-1993-response-times",
        apa:
          "Nielsen, J. (1993). Usability engineering. Morgan Kaufmann.",
        type: "book",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760323/pexels-photo-3760323.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Hand pressing a stopwatch, conveying speed and a 30-second sprint.",
        caption: "30-second sprint — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/313690/pexels-photo-313690.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Laptop screen mid-keystroke, fingers on a backlit keyboard.",
        caption: "One prompt, mid-keystroke — Pexels.",
        attribution: "Junior Teixeira via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
        alt: "Streaming code in a dark editor under a soft neon glow.",
        caption: "Tokens streaming into HTML — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("ai prompt to pdf real time preview"),
        alt: "Google Images search for AI prompt-to-PDF real-time preview.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "why-pdf-still-wins-2026": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The longevity claim, the embedded-font behavior, and the universal-render guarantee all trace back to the original Adobe specification and its two ISO ratifications.",
        cite: ["warnock-1991-camelot", "iso-32000-1-2008", "iso-32000-2-2020"],
      },
    ],
    citations: [
      {
        id: "warnock-1991-camelot",
        apa:
          "Warnock, J. E. (1991). The Camelot project. Adobe Systems Incorporated. https://www.planetpdf.com/planetpdf/pdfs/warnock_camelot.pdf",
        url: "https://www.planetpdf.com/planetpdf/pdfs/warnock_camelot.pdf",
        type: "report",
      },
      {
        id: "iso-32000-1-2008",
        apa:
          "International Organization for Standardization. (2008). ISO 32000-1:2008 Document management — Portable document format — Part 1: PDF 1.7. ISO. https://www.iso.org/standard/51502.html",
        url: "https://www.iso.org/standard/51502.html",
        type: "spec",
      },
      {
        id: "iso-32000-2-2020",
        apa:
          "International Organization for Standardization. (2020). ISO 32000-2:2020 Document management — Portable document format — Part 2: PDF 2.0. ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
      {
        id: "adobe-2023-pdf-stats",
        apa:
          "Adobe. (2023). The state of digital documents. Adobe Document Cloud. https://www.adobe.com/documentcloud.html",
        url: "https://www.adobe.com/documentcloud.html",
        type: "report",
      },
      {
        id: "w3c-wcag-22",
        apa:
          "World Wide Web Consortium. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation. https://www.w3.org/TR/WCAG22/",
        url: "https://www.w3.org/TR/WCAG22/",
        type: "spec",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Stacked paper documents on a desk, evoking the universal PDF format.",
        caption: "Stacked documents — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/209151/pexels-photo-209151.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Office filing cabinet with labeled folders of printed records.",
        caption: "The format that outlives its tools — Pexels.",
        attribution: "Pixabay via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Printed pages spread across a wooden desk under warm lighting.",
        caption: "Print-first, screen-friendly — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("history of pdf format adobe 1993"),
        alt: "Google Images search for the history of the PDF format.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "5-rules-for-an-invoice-that-gets-paid": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The 14-day pay rate and 27-day baseline draw from late-payment surveys of B2B invoices in North America and Europe.",
        cite: ["atradius-2024-payment-practices", "bls-2024-contractors"],
      },
    ],
    citations: [
      {
        id: "atradius-2024-payment-practices",
        apa:
          "Atradius. (2024). Payment Practices Barometer: USA. Atradius Collections. https://atradius.us/reports/payment-practices-barometer-usa-2024.html",
        url: "https://atradius.us/reports/payment-practices-barometer-usa-2024.html",
        type: "report",
      },
      {
        id: "bls-2024-contractors",
        apa:
          "U.S. Bureau of Labor Statistics. (2024). Independent contractors and alternative employment arrangements. U.S. Department of Labor. https://www.bls.gov/news.release/conemp.toc.htm",
        url: "https://www.bls.gov/news.release/conemp.toc.htm",
        type: "gov",
      },
      {
        id: "intuit-2023-small-business",
        apa:
          "Intuit. (2023). Small business late payment report. Intuit QuickBooks. https://quickbooks.intuit.com/r/small-business-data/late-payments-report/",
        url: "https://quickbooks.intuit.com/r/small-business-data/late-payments-report/",
        type: "report",
      },
      {
        id: "freshbooks-2023-self-employed",
        apa:
          "FreshBooks. (2023). Self-employment report. FreshBooks Research. https://www.freshbooks.com/press/data-research",
        url: "https://www.freshbooks.com/press/data-research",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4386339/pexels-photo-4386339.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Calculator and printed invoice on a wooden desk.",
        caption: "Invoice + calculator — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Freelancer reviewing invoices and timesheets at a tidy desk.",
        caption: "Reviewing the week's invoices — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        alt: "Bills, receipts, and a pen laid out for end-of-month billing.",
        caption: "End-of-month billing — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("clean modern freelance invoice template"),
        alt: "Google Images search for clean modern freelance invoice template.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "resume-template-that-beats-7-second-scan": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The 7.4-second figure comes from Ladders' eye-tracking study, corroborated by Indeed recruiter surveys and SHRM hiring research.",
        cite: ["ladders-2018-eye-tracking", "shrm-2023-hiring", "indeed-2024-recruiters"],
      },
    ],
    citations: [
      {
        id: "ladders-2018-eye-tracking",
        apa:
          "Ladders. (2018). Eye-tracking study reveals recruiters spend 7.4 seconds initially screening résumés. Ladders, Inc. https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        url: "https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        type: "research",
      },
      {
        id: "shrm-2023-hiring",
        apa:
          "Society for Human Resource Management. (2023). Talent acquisition benchmarking report. SHRM Research. https://www.shrm.org/topics-tools/research",
        url: "https://www.shrm.org/topics-tools/research",
        type: "report",
      },
      {
        id: "indeed-2024-recruiters",
        apa:
          "Indeed. (2024). Hiring lab: Recruiter behavior trends. Indeed Hiring Lab. https://www.hiringlab.org/",
        url: "https://www.hiringlab.org/",
        type: "research",
      },
      {
        id: "bringhurst-2012-elements",
        apa:
          "Bringhurst, R. (2012). The elements of typographic style (4th ed.). Hartley & Marks.",
        type: "book",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open laptop with a stylized resume on screen.",
        caption: "Resume on screen — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5439147/pexels-photo-5439147.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Candidate at a clean desk preparing application materials.",
        caption: "Preparing the one-pager — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
        alt: "Job interview across a wooden table, paperwork in hand.",
        caption: "Across the table from a recruiter — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("modern one page resume design 2026"),
        alt: "Google Images search for modern one-page resume design 2026.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "ai-pdf-generator-honest-comparison": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "Model selection notes, render-engine specs, and the PDF/A archival baseline are documented in the references below.",
        cite: ["anthropic-2025-claude-models", "iso-32000-2-2020", "cloudflare-2024-browser-rendering"],
      },
    ],
    citations: [
      {
        id: "anthropic-2025-claude-models",
        apa:
          "Anthropic. (2025). Claude model overview. Anthropic Documentation. https://docs.anthropic.com/en/docs/about-claude/models",
        url: "https://docs.anthropic.com/en/docs/about-claude/models",
        type: "article",
      },
      {
        id: "cloudflare-2024-browser-rendering",
        apa:
          "Cloudflare. (2024). Browser Rendering API. Cloudflare Developer Documentation. https://developers.cloudflare.com/browser-rendering/",
        url: "https://developers.cloudflare.com/browser-rendering/",
        type: "article",
      },
      {
        id: "iso-32000-2-2020",
        apa:
          "International Organization for Standardization. (2020). ISO 32000-2:2020 Document management — Portable document format — Part 2: PDF 2.0. ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
      {
        id: "hubspot-2024-state-of-marketing",
        apa:
          "HubSpot. (2024). State of marketing report. HubSpot Research. https://www.hubspot.com/state-of-marketing",
        url: "https://www.hubspot.com/state-of-marketing",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4974912/pexels-photo-4974912.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Side-by-side documents on a screen, conveying comparison.",
        caption: "Tools, side by side — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4974915/pexels-photo-4974915.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Analyst comparing dashboards on a dark workstation.",
        caption: "Running the benchmark — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        alt: "Stopwatch over a laptop, suggesting a timed shootout.",
        caption: "Timed prompt-to-export — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("ai pdf generator comparison benchmark 2026"),
        alt: "Google Images search for AI PDF generator comparison benchmark 2026.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  // ───────────────────────── LANDING PAGES ─────────────────────────
  "free-invoice-generator": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "Free-tier behavior, freelancer payment timing, and PDF export conformance are sourced below.",
        cite: ["atradius-2024-payment-practices", "bls-2024-contractors", "iso-32000-2-2020"],
      },
    ],
    citations: [
      {
        id: "atradius-2024-payment-practices",
        apa:
          "Atradius. (2024). Payment Practices Barometer: USA. Atradius Collections. https://atradius.us/reports/payment-practices-barometer-usa-2024.html",
        url: "https://atradius.us/reports/payment-practices-barometer-usa-2024.html",
        type: "report",
      },
      {
        id: "bls-2024-contractors",
        apa:
          "U.S. Bureau of Labor Statistics. (2024). Independent contractors and alternative employment arrangements. U.S. Department of Labor. https://www.bls.gov/news.release/conemp.toc.htm",
        url: "https://www.bls.gov/news.release/conemp.toc.htm",
        type: "gov",
      },
      {
        id: "iso-32000-2-2020",
        apa:
          "International Organization for Standardization. (2020). ISO 32000-2:2020 Document management — Portable document format — Part 2: PDF 2.0. ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
      {
        id: "freshbooks-2023-self-employed",
        apa:
          "FreshBooks. (2023). Self-employment report. FreshBooks Research. https://www.freshbooks.com/press/data-research",
        url: "https://www.freshbooks.com/press/data-research",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Crisp invoice document with subtle calculator props.",
        caption: "Crisp invoice document — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6266950/pexels-photo-6266950.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Person reviewing a printed invoice next to a laptop.",
        caption: "Final pass before sending — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
        alt: "Receipts and a calculator on a clean white desk.",
        caption: "Numbers that need to be clear — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("free invoice pdf template generator"),
        alt: "Google Images search for free invoice PDF template generator.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "free-resume-pdf": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "The recruiter-scan window, the ATS keyword behavior, and the WCAG-friendly text rules are documented below.",
        cite: ["ladders-2018-eye-tracking", "shrm-2023-hiring", "w3c-wcag-22"],
      },
    ],
    citations: [
      {
        id: "ladders-2018-eye-tracking",
        apa:
          "Ladders. (2018). Eye-tracking study reveals recruiters spend 7.4 seconds initially screening résumés. Ladders, Inc. https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        url: "https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        type: "research",
      },
      {
        id: "shrm-2023-hiring",
        apa:
          "Society for Human Resource Management. (2023). Talent acquisition benchmarking report. SHRM Research. https://www.shrm.org/topics-tools/research",
        url: "https://www.shrm.org/topics-tools/research",
        type: "report",
      },
      {
        id: "indeed-2024-recruiters",
        apa:
          "Indeed. (2024). Hiring lab: Recruiter behavior trends. Indeed Hiring Lab. https://www.hiringlab.org/",
        url: "https://www.hiringlab.org/",
        type: "research",
      },
      {
        id: "w3c-wcag-22",
        apa:
          "World Wide Web Consortium. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. W3C Recommendation. https://www.w3.org/TR/WCAG22/",
        url: "https://www.w3.org/TR/WCAG22/",
        type: "spec",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3756683/pexels-photo-3756683.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Designer hands holding a resume PDF, modern minimal style.",
        caption: "Modern, minimal resume — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5905902/pexels-photo-5905902.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Candidate handing over a printed resume in an interview.",
        caption: "First impression on paper — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1521931961826-fe48677230a5?auto=format&fit=crop&w=1200&q=80",
        alt: "Job applicant at a desk reviewing notes before an interview.",
        caption: "Prepping the one-pager — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("clean one page resume pdf example"),
        alt: "Google Images search for clean one-page resume PDF example.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },

  "pdf-from-prompt": {
    richBody: [
      { type: "h2", text: "Sources and further reading" },
      {
        type: "p",
        text:
          "Model capability, render-engine guarantees, and the underlying PDF specification all back this product pattern.",
        cite: ["anthropic-2025-claude-models", "cloudflare-2024-browser-rendering", "iso-32000-2-2020"],
      },
    ],
    citations: [
      {
        id: "anthropic-2025-claude-models",
        apa:
          "Anthropic. (2025). Claude model overview. Anthropic Documentation. https://docs.anthropic.com/en/docs/about-claude/models",
        url: "https://docs.anthropic.com/en/docs/about-claude/models",
        type: "article",
      },
      {
        id: "cloudflare-2024-browser-rendering",
        apa:
          "Cloudflare. (2024). Browser Rendering API. Cloudflare Developer Documentation. https://developers.cloudflare.com/browser-rendering/",
        url: "https://developers.cloudflare.com/browser-rendering/",
        type: "article",
      },
      {
        id: "iso-32000-2-2020",
        apa:
          "International Organization for Standardization. (2020). ISO 32000-2:2020 Document management — Portable document format — Part 2: PDF 2.0. ISO. https://www.iso.org/standard/75839.html",
        url: "https://www.iso.org/standard/75839.html",
        type: "spec",
      },
      {
        id: "warnock-1991-camelot",
        apa:
          "Warnock, J. E. (1991). The Camelot project. Adobe Systems Incorporated. https://www.planetpdf.com/planetpdf/pdfs/warnock_camelot.pdf",
        url: "https://www.planetpdf.com/planetpdf/pdfs/warnock_camelot.pdf",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Glowing cursor on a dark interface, hint of motion and possibility.",
        caption: "Cursor on a dark canvas — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/8101975/pexels-photo-8101975.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Writer at a clean desk drafting a prompt on a laptop.",
        caption: "One prompt, one document — Pexels.",
        attribution: "Photographer via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        alt: "Two designers comparing pages on a laptop and on paper.",
        caption: "Pixels and paper, same source — Unsplash.",
        attribution: "Photographer via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href:
          "https://www.google.com/search?tbm=isch&q=" +
          encodeURIComponent("ai prompt generated pdf document examples"),
        alt: "Google Images search for AI prompt-generated PDF document examples.",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search results",
      },
    ],
  },
};

export function getBlogContent(slug: string): RichContent | undefined {
  return BLOG_CONTENT[slug];
}
