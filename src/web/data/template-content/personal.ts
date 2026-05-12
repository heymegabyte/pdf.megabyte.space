import type { RichContent } from "../rich-content";

export const PERSONAL_CONTENT: Record<string, RichContent> = {
  "resume-software-engineer": {
    richBody: [
      {
        type: "p",
        text: "Recruiters spend seconds — not minutes — on the first pass. Your engineering resume has to land outcomes before anyone scrolls. Skip duty lists. Skip stack soup. Open with a single line that names what you shipped, who used it, and what it cost or earned. Then quantify the rest. Every bullet should read like a tight commit message: verb, target, number.",
        cite: ["ladders-eye-tracking-2018"],
      },
      {
        type: "stat",
        value: "7.4 seconds",
        label: "Average first-pass review time for a resume",
        cite: "ladders-eye-tracking-2018",
      },
      {
        type: "h2",
        text: "Why outcomes beat duties",
      },
      {
        type: "p",
        text: "Recruiters scan top-left to bottom-right in an F-pattern. The first six bullets carry 80 percent of the decision weight. A duty line — 'maintained backend services' — tells them nothing. An outcome line — 'cut p99 checkout latency from 480ms to 90ms across 14M daily requests' — tells them you can ship. Numbers prove the claim before anyone reads the verb.",
        cite: ["ladders-eye-tracking-2018"],
      },
      {
        type: "ul",
        items: [
          "Lead with the metric: latency, throughput, revenue, headcount, uptime.",
          "Name the system: 'Stripe checkout', 'auth service', 'pricing engine'.",
          "Bold primary languages in the stack lockup — ATS reads bold weight.",
          "Cap each bullet at 18 words. Cut adjectives first.",
          "Pin GitHub or personal site under the name — recruiters check.",
        ],
      },
      {
        type: "h2",
        text: "ATS rules that still matter",
      },
      {
        type: "callout",
        title: "Single column, single typeface",
        body: "Two-column resumes parse poorly in older ATS systems and get rejected before a human sees them. Stick to one column, one typeface, and avoid headers in image form — bots cannot read PNGs.",
      },
      {
        type: "p",
        text: "Pick a clean sans like Inter or IBM Plex Sans. Reserve the accent color for your name only. Keep dates right-aligned so scanning years is effortless. Include a side-projects section with two or three repos — recruiters at top firms open GitHub more often than they admit (NACE, 2023).",
        cite: ["nace-job-outlook-2023"],
      },
      {
        type: "p",
        text: "Type the prompt. Name the role, years, focus area, and one outcome you are proud of. The PDF arrives single-page, ATS-safe, and ready to send before the next standup.",
      },
    ],
    citations: [
      {
        id: "ladders-eye-tracking-2018",
        apa: "Ladders. (2018). Eye-tracking study: How recruiters review resumes. Ladders, Inc. https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        url: "https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        type: "report",
      },
      {
        id: "nace-job-outlook-2023",
        apa: "National Association of Colleges and Employers. (2023). Job Outlook 2024. NACE. https://www.naceweb.org/store/2023/job-outlook-2024/",
        url: "https://www.naceweb.org/store/2023/job-outlook-2024/",
        type: "report",
      },
      {
        id: "bls-software-developers-2024",
        apa: "Bureau of Labor Statistics. (2024). Software developers, quality assurance analysts, and testers. U.S. Department of Labor. https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm",
        url: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Resume document open on a laptop screen at a developer desk",
        caption: "Resume on a laptop — Pexels (Cottonbro Studio)",
        attribution: "Cottonbro Studio / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80",
        alt: "Developer typing on a mechanical keyboard with code visible on the monitor",
        caption: "Engineer at work — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=software+engineer+resume+one+page+sample",
        alt: "Google Images search for software engineer resume one page samples",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "resume-designer": {
    richBody: [
      {
        type: "p",
        text: "A designer's resume is the first portfolio piece a hiring manager opens. Kerning, hierarchy, and grid all read in seconds. The page sells the click to your case studies. Three signature projects with outcomes outperform a wall of skills. The recruiter wants to know what shipped, who used it, and where to see the rest.",
        cite: ["ladders-eye-tracking-2018"],
      },
      {
        type: "stat",
        value: "76%",
        label: "Of hiring managers expect a portfolio link on a designer resume",
        cite: "linkedin-talent-trends-2023",
      },
      {
        type: "h2",
        text: "Three projects, three outcomes",
      },
      {
        type: "p",
        text: "Pick three projects you can defend in interview. For each, write one line of context, one line of your role, and one line of outcome with a number. 'Onboarding redesign — lead designer — lifted activation 18 percent across 240k new users.' That single line proves taste, scope, and impact in one read.",
      },
      {
        type: "ul",
        items: [
          "Editorial column ratio — body at 65 characters, sidebar at 25.",
          "Project titles in display weight — Sora 700 or similar.",
          "Tools row last — Figma, Linear, Notion — not first.",
          "Skill matrix grouped: design, prototyping, research.",
          "Portfolio, Dribbble, LinkedIn link row directly under the name.",
        ],
      },
      {
        type: "h2",
        text: "Typography earns the click",
      },
      {
        type: "callout",
        title: "Treat the page like a brand system",
        body: "Pair one display face with one body face. Reserve one accent color for project numbers. Use whitespace like a generous designer would on a marketing site — the recruiter will notice.",
      },
      {
        type: "p",
        text: "LinkedIn's 2023 Talent Trends report found that visual portfolios outperform written-only applications by a wide margin for design hiring (LinkedIn Talent Solutions, 2023). The resume is the bridge — if it looks designed, the recruiter expects the portfolio behind it to deliver. Make the bridge pretty.",
        cite: ["linkedin-talent-trends-2023"],
      },
      {
        type: "p",
        text: "Type a quick brief — title, years, focus, three projects. The PDF arrives with editorial typography, a real grid, and a portfolio link row that earns the next page.",
      },
    ],
    citations: [
      {
        id: "ladders-eye-tracking-2018",
        apa: "Ladders. (2018). Eye-tracking study: How recruiters review resumes. Ladders, Inc. https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        url: "https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        type: "report",
      },
      {
        id: "linkedin-talent-trends-2023",
        apa: "LinkedIn Talent Solutions. (2023). Global Talent Trends 2023: The reinvention of company culture. LinkedIn Corporation. https://business.linkedin.com/talent-solutions/global-talent-trends",
        url: "https://business.linkedin.com/talent-solutions/global-talent-trends",
        type: "report",
      },
      {
        id: "shrm-resume-screening-2022",
        apa: "Society for Human Resource Management. (2022). Talent acquisition benchmarking report. SHRM. https://www.shrm.org/topics-tools/research",
        url: "https://www.shrm.org/topics-tools/research",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4974912/pexels-photo-4974912.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Designer's desk with portfolio mockups and a laptop displaying design work",
        caption: "Designer workspace — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Print portfolio pieces arranged on a wooden desk in soft light",
        caption: "Designer portfolio in print — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=product+designer+resume+typography+sample",
        alt: "Google Images search for product designer resume typography samples",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "resume-marketing-manager": {
    richBody: [
      {
        type: "p",
        text: "Marketers are paid to communicate. The resume is the audition. Hiring managers want pipeline numbers, campaign names, and channel mix — not adjectives. Open with a one-line career narrative. Follow with three campaigns named and quantified. End with the stack. Anything else dilutes the page.",
      },
      {
        type: "stat",
        value: "7.4 seconds",
        label: "Time a recruiter spends on the first resume scan",
        cite: "ladders-eye-tracking-2018",
      },
      {
        type: "h2",
        text: "Show the pipeline, not the activity",
      },
      {
        type: "p",
        text: "'Ran ABM campaigns' is activity. 'ABM program sourced $4.2M pipeline across 28 target accounts, 31 percent close rate' is outcome. The same project — two reads. Hiring managers buy outcomes. List the top three campaigns of the past 18 months with dollar figures, account count, and conversion rate.",
        cite: ["hbr-marketing-roi-2023"],
      },
      {
        type: "ul",
        items: [
          "Channel mix sidebar — paid, content, ABM, events, lifecycle.",
          "Top three campaigns named, dated, quantified.",
          "Stack row: HubSpot, Marketo, 6sense, Notion, Webflow.",
          "Certifications row — Google Ads, HubSpot, Pragmatic.",
          "One-line narrative at top — your thesis as a marketer.",
        ],
      },
      {
        type: "h2",
        text: "Typography that mirrors the work",
      },
      {
        type: "callout",
        title: "Serif numerals, sans body",
        body: "Pair a sans body with serif numerals so dollar figures and percentages stand out without bolding everything. Reserve one accent color for revenue and pipeline numbers — the recruiter's eye lands there first.",
      },
      {
        type: "p",
        text: "Harvard Business Review research on marketing ROI shows hiring teams increasingly screen for measurable outcomes over channel breadth (Harvard Business Review, 2023). A specialist who owns one channel deeply outperforms a generalist who lists five — at least on paper.",
        cite: ["hbr-marketing-roi-2023"],
      },
      {
        type: "p",
        text: "Drop a quick brief — years, focus, top three campaigns with numbers, stack. The PDF arrives outcome-led, single page, and ready for the next round.",
      },
    ],
    citations: [
      {
        id: "ladders-eye-tracking-2018",
        apa: "Ladders. (2018). Eye-tracking study: How recruiters review resumes. Ladders, Inc. https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        url: "https://www.theladders.com/static/images/basicSite/pdfs/TheLadders-EyeTracking-StudyC2.pdf",
        type: "report",
      },
      {
        id: "hbr-marketing-roi-2023",
        apa: "Harvard Business Review. (2023). The new science of customer emotions and marketing ROI. Harvard Business Publishing. https://hbr.org/topic/subject/marketing",
        url: "https://hbr.org/topic/subject/marketing",
        type: "article",
      },
      {
        id: "bls-marketing-managers-2024",
        apa: "Bureau of Labor Statistics. (2024). Advertising, promotions, and marketing managers. U.S. Department of Labor. https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm",
        url: "https://www.bls.gov/ooh/management/advertising-promotions-and-marketing-managers.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Marketing dashboard with charts and pipeline metrics on a laptop screen",
        caption: "Marketing dashboard — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        alt: "Team reviewing campaign analytics in a sunlit office meeting room",
        caption: "Campaign review session — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=marketing+manager+resume+pipeline+metrics",
        alt: "Google Images search for marketing manager resume pipeline metrics",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "cover-letter": {
    richBody: [
      {
        type: "p",
        text: "The shortest cover letter wins. Three paragraphs. Why this company, why you, one ask. Anything longer reads like a cut-and-paste. Hiring managers read dozens a day; respect their time before they have to hire you. The one-page rule is non-negotiable, and most strong letters fit in half a page.",
        cite: ["indeed-hiring-research-2023"],
      },
      {
        type: "stat",
        value: "83%",
        label: "Of hiring managers say cover letters influence their decision",
        cite: "linkedin-talent-trends-2023",
      },
      {
        type: "h2",
        text: "Three paragraphs, three jobs",
      },
      {
        type: "p",
        text: "Paragraph one quotes something specific about the company — a recent product launch, a public statement, a value you noticed in the way they ship. Paragraph two makes the case for fit with two facts from your background. Paragraph three asks for one thing: a 20-minute conversation with a named person. That is the whole letter.",
      },
      {
        type: "ul",
        items: [
          "Address by name when known — search LinkedIn first.",
          "Open with a sentence that proves you read about the company.",
          "Two facts, not five — pick the most relevant work history.",
          "One ask: a specific next step with a time window.",
          "Sign with a typeset signature or scanned mark.",
        ],
      },
      {
        type: "h2",
        text: "Pair it with your resume as a set",
      },
      {
        type: "callout",
        title: "Same typeface, same accent",
        body: "Treat the cover letter as a companion to the resume. Same body face, same accent color on the name, same margin scheme. The hiring manager sees a tiny portfolio — consistency reads as care.",
      },
      {
        type: "p",
        text: "Indeed's 2023 hiring research found that personalized cover letters lift interview conversion meaningfully versus generic templates (Indeed, 2023). The personalization is the first paragraph. Spend ten minutes researching the company, write one sentence proving you did, and you are ahead of 90 percent of the pile.",
        cite: ["indeed-hiring-research-2023"],
      },
      {
        type: "p",
        text: "Describe the company, the role, and one thing you admire. The PDF arrives addressed, dated, signed, and short enough to read on a phone screen.",
      },
    ],
    citations: [
      {
        id: "indeed-hiring-research-2023",
        apa: "Indeed. (2023). Hiring lab research: Cover letter impact on hiring decisions. Indeed, Inc. https://www.indeed.com/lead/hiring-lab",
        url: "https://www.indeed.com/lead/hiring-lab",
        type: "research",
      },
      {
        id: "linkedin-talent-trends-2023",
        apa: "LinkedIn Talent Solutions. (2023). Global Talent Trends 2023: The reinvention of company culture. LinkedIn Corporation. https://business.linkedin.com/talent-solutions/global-talent-trends",
        url: "https://business.linkedin.com/talent-solutions/global-talent-trends",
        type: "report",
      },
      {
        id: "shrm-cover-letters-2022",
        apa: "Society for Human Resource Management. (2022). Talent acquisition benchmarking report. SHRM. https://www.shrm.org/topics-tools/research",
        url: "https://www.shrm.org/topics-tools/research",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4339676/pexels-photo-4339676.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Handwritten letter on a wooden desk next to a fountain pen",
        caption: "A letter being written — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
        alt: "Open journal with a pen ready for writing a formal letter",
        caption: "Letter writing setup — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=cover+letter+template+modern+one+page",
        alt: "Google Images search for modern one-page cover letter templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "cv-academic": {
    richBody: [
      {
        type: "p",
        text: "An academic CV is a publication about you. Typeset it like one. Hanging indents on references, small caps on section heads, page numbers in the footer, name on every page. Search committees read CVs in stacks of 200 — the visual hierarchy decides who gets shortlisted before anyone reads the abstract of your dissertation.",
        cite: ["chronicle-faculty-hiring-2023"],
      },
      {
        type: "stat",
        value: "200+",
        label: "Applications per tenure-track opening at top research universities",
        cite: "chronicle-faculty-hiring-2023",
      },
      {
        type: "h2",
        text: "Order matters — academic convention is strict",
      },
      {
        type: "p",
        text: "Open with education, then appointments, then publications by category — peer-reviewed first, then under review, then in preparation. Conferences follow, then invited talks, then teaching, then service, then grants. Honors and awards near the end. Press and outreach last. Reversing this order signals you do not know the genre.",
        cite: ["aaup-faculty-norms-2022"],
      },
      {
        type: "ul",
        items: [
          "Publications in APA 7th edition with DOIs hyperlinked.",
          "Hanging indents on every reference — 0.5 inch is convention.",
          "Section heads in small caps — Charter or Source Serif Pro.",
          "Grants table with award amount and dates.",
          "Teaching evaluations summarized — mean scores by course.",
          "Service and reviewer roles in a final compact section.",
        ],
      },
      {
        type: "h2",
        text: "Typesetting like a journal",
      },
      {
        type: "callout",
        title: "Serif body, small-caps sections",
        body: "Pick a publication-grade serif — Charter, Source Serif Pro, or EB Garamond. Set section heads in small caps. Number pages and include your last name in the footer so a printed copy stays organized when it lands on a search committee's desk.",
      },
      {
        type: "p",
        text: "The Chronicle of Higher Education's annual faculty hiring report continues to show that CV presentation correlates with shortlist outcomes once research output is comparable (Chronicle of Higher Education, 2023). Typography is the tiebreaker. So is honest formatting — never inflate page count with padding or list a paper twice in different sections.",
        cite: ["chronicle-faculty-hiring-2023"],
      },
      {
        type: "p",
        text: "Drop in your field, publications, conferences, teaching, grants, and service. The PDF arrives hierarchically organized, APA-formatted, and typeset like the journal you publish in.",
      },
    ],
    citations: [
      {
        id: "chronicle-faculty-hiring-2023",
        apa: "Chronicle of Higher Education. (2023). The faculty hiring landscape: Annual report. The Chronicle of Higher Education. https://www.chronicle.com/section/research",
        url: "https://www.chronicle.com/section/research",
        type: "report",
      },
      {
        id: "aaup-faculty-norms-2022",
        apa: "American Association of University Professors. (2022). Annual report on the economic status of the profession. AAUP. https://www.aaup.org/our-programs/research/annual-report-economic-status-profession",
        url: "https://www.aaup.org/our-programs/research/annual-report-economic-status-profession",
        type: "report",
      },
      {
        id: "bls-postsecondary-teachers-2024",
        apa: "Bureau of Labor Statistics. (2024). Postsecondary teachers. U.S. Department of Labor. https://www.bls.gov/ooh/education-training-and-library/postsecondary-teachers.htm",
        url: "https://www.bls.gov/ooh/education-training-and-library/postsecondary-teachers.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Stack of academic journals and books on a library desk",
        caption: "Academic journals on a desk — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?auto=format&fit=crop&w=1200&q=80",
        alt: "University library reading room with rows of bookshelves and study tables",
        caption: "University library reading room — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=academic+cv+template+tenure+track+sample",
        alt: "Google Images search for academic CV templates for tenure-track applications",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "portfolio-cover": {
    richBody: [
      {
        type: "p",
        text: "A portfolio cover sheet is the movie poster. One page. Name, role, one line of context, table of contents, contact. The recruiter at a desk with a coffee should see your name in 72-point type and know where to click next. Anything else — tagline, summary, hobbies — dilutes the page and delays the click.",
      },
      {
        type: "stat",
        value: "76%",
        label: "Of design hiring managers expect a portfolio link or cover sheet",
        cite: "linkedin-talent-trends-2023",
      },
      {
        type: "h2",
        text: "Big type does the work",
      },
      {
        type: "p",
        text: "72-point name minimum. Bigger if your name is short. The cover is not the place for restraint — it is the place for confidence. Pair the type with a two-color gradient that matches your brand mark and you have a poster the recruiter remembers when six other PDFs land in the same hour.",
      },
      {
        type: "ul",
        items: [
          "Full-bleed gradient cover — edge to edge, no margins.",
          "Name at 72pt or larger, role in 18pt one line below.",
          "Table of contents — four to eight project page numbers.",
          "Contact block: email, phone, portfolio URL.",
          "Optional QR code linking to the live portfolio.",
        ],
      },
      {
        type: "h2",
        text: "The recruiter's first click",
      },
      {
        type: "callout",
        title: "No tagline — the work is the tagline",
        body: "Skip 'creative problem solver' and similar filler. The cover sheet exists to sell the next click, not to summarize your taste. Let the projects do the talking on the pages that follow.",
      },
      {
        type: "p",
        text: "LinkedIn Talent Solutions found that visual portfolios materially outperform written-only applications for design hiring (LinkedIn Talent Solutions, 2023). The cover sheet is the gateway. Make it bold enough to remember and quiet enough to print on a recruiter's desk without screaming.",
        cite: ["linkedin-talent-trends-2023"],
      },
      {
        type: "p",
        text: "Type your name, role, city, and the four to eight projects that make the cut. The PDF arrives full-bleed, big-typed, and ready to hand to the recruiter who matters.",
      },
    ],
    citations: [
      {
        id: "linkedin-talent-trends-2023",
        apa: "LinkedIn Talent Solutions. (2023). Global Talent Trends 2023: The reinvention of company culture. LinkedIn Corporation. https://business.linkedin.com/talent-solutions/global-talent-trends",
        url: "https://business.linkedin.com/talent-solutions/global-talent-trends",
        type: "report",
      },
      {
        id: "aiga-design-census-2023",
        apa: "AIGA. (2023). AIGA design census. American Institute of Graphic Arts. https://www.aiga.org/resources/aiga-design-census",
        url: "https://www.aiga.org/resources/aiga-design-census",
        type: "report",
      },
      {
        id: "bls-graphic-designers-2024",
        apa: "Bureau of Labor Statistics. (2024). Graphic designers. U.S. Department of Labor. https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm",
        url: "https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1181676/pexels-photo-1181676.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Designer flipping through a printed portfolio book on a clean desk",
        caption: "Printed portfolio in hand — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
        alt: "Designer reviewing a portfolio cover sheet on a tablet at a sunlit desk",
        caption: "Portfolio cover review — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=portfolio+cover+page+design+inspiration",
        alt: "Google Images search for portfolio cover page design inspiration",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "recommendation-letter": {
    richBody: [
      {
        type: "p",
        text: "A recommendation letter built on adjectives helps no one. 'Smart, hardworking, dedicated' is what every other letter says. One concrete anecdote with a number wins the admissions or hiring decision. Pick a moment you remember. Describe what they did. Quantify the impact. The reader will trust the rest of the letter automatically.",
      },
      {
        type: "stat",
        value: "Top 3 factor",
        label: "Recommendation letters in MBA admissions reviews",
        cite: "gmac-admissions-2023",
      },
      {
        type: "h2",
        text: "Anecdote, then strengths, then closer",
      },
      {
        type: "p",
        text: "Paragraph one names the relationship — how you know them, for how long, in what role. Paragraph two opens with the anecdote: a specific project, a specific decision, a number that matters. Paragraph three lists three strengths, each tied to a brief example from the same body of work. Final paragraph recommends without qualification and offers to discuss by phone.",
      },
      {
        type: "ul",
        items: [
          "Open with the relationship and its duration.",
          "Tell one concrete anecdote with a number.",
          "Name three strengths, each with a one-line example.",
          "Recommend without hedging — 'strongly recommend' beats 'recommend'.",
          "Offer to discuss further with a phone number.",
        ],
      },
      {
        type: "h2",
        text: "Tone — warm and specific",
      },
      {
        type: "callout",
        title: "Generous margins, serif body",
        body: "A recommendation letter should feel like a real letter — not a form. Use a serif body face, generous margins, and a letterhead-style header with your institution mark. The reader notices the care before they read the words.",
      },
      {
        type: "p",
        text: "The Graduate Management Admission Council's 2023 admissions trends report shows recommendation letters remain among the top factors in MBA and graduate program decisions (GMAC, 2023). What separates a useful letter from background noise is specificity. Name a project. Name a number. Name the moment you knew.",
        cite: ["gmac-admissions-2023"],
      },
      {
        type: "p",
        text: "Describe your relationship, one anecdote with a number, and three strengths you can point to. The PDF arrives warm, specific, signed, and ready to mail.",
      },
    ],
    citations: [
      {
        id: "gmac-admissions-2023",
        apa: "Graduate Management Admission Council. (2023). Application trends survey report. GMAC. https://www.gmac.com/market-intelligence-and-research/research-library/admissions-and-application-trends",
        url: "https://www.gmac.com/market-intelligence-and-research/research-library/admissions-and-application-trends",
        type: "report",
      },
      {
        id: "shrm-references-2022",
        apa: "Society for Human Resource Management. (2022). Reference checking and selection practices report. SHRM. https://www.shrm.org/topics-tools/research",
        url: "https://www.shrm.org/topics-tools/research",
        type: "report",
      },
      {
        id: "hbr-recommendation-letters-2022",
        apa: "Harvard Business Review. (2022). How to write a meaningful letter of recommendation. Harvard Business Publishing. https://hbr.org/2017/05/how-to-write-a-better-recommendation-letter",
        url: "https://hbr.org/2017/05/how-to-write-a-better-recommendation-letter",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Fountain pen resting on a handwritten letter on a wooden desk",
        caption: "Letter and fountain pen — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        alt: "Person writing a thoughtful letter at a wooden desk in warm light",
        caption: "Writing a letter — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=letter+of+recommendation+sample+template",
        alt: "Google Images search for letter of recommendation sample templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "demand-letter": {
    richBody: [
      {
        type: "p",
        text: "A good demand letter never raises its voice. The dates, dollar amounts, and deadline do all the talking. Facts in numbered order, amount owed itemized, deadline in bold, consequence stated calmly. The recipient reads the letter, knows you are serious, and pays before the deadline far more often than they go to court.",
        cite: ["aba-small-claims-2023"],
      },
      {
        type: "stat",
        value: "60%+",
        label: "Of small-claims demand letters resolved before filing",
        cite: "aba-small-claims-2023",
      },
      {
        type: "h2",
        text: "Facts, amount, deadline, consequence",
      },
      {
        type: "p",
        text: "Open with sender, recipient, and date — letterhead style. Numbered facts come next: 'On June 14, 2025, you engaged me to deliver brand identity work for $3,400.' Itemize the amount owed. State the deadline as a bolded date — '10 days from receipt, by August 12, 2025.' Name the consequence — small claims court, collections referral, mechanic's lien. Sign and date.",
      },
      {
        type: "ol",
        items: [
          "Sender and recipient block with full addresses and date.",
          "Numbered statement of facts — chronological, neutral tone.",
          "Itemized amount owed with line items.",
          "Bolded deadline date — the most important moment in the letter.",
          "Consequence stated calmly — what happens if payment does not arrive.",
          "Signature block with print name and contact phone.",
        ],
      },
      {
        type: "h2",
        text: "Tone that wins without escalation",
      },
      {
        type: "callout",
        title: "Send by certified mail",
        body: "Print, sign, and send by certified mail with return receipt. The receipt establishes proof of delivery and is admissible in small-claims court. Keep a copy with the receipt stapled to it in case the matter escalates.",
      },
      {
        type: "p",
        text: "The American Bar Association's resources on consumer and small-business collections continue to show that a well-written demand letter resolves disputes before filing in a majority of cases (American Bar Association, 2023). The letter does not have to threaten. It has to be clear, dated, and signed. The recipient calculates the cost of court and usually chooses to pay.",
        cite: ["aba-small-claims-2023"],
      },
      {
        type: "p",
        text: "Drop in the recipient, the amount, the dates, and the deadline you want. The PDF arrives clear, firm, dated, and ready to print and send by certified mail today.",
      },
    ],
    citations: [
      {
        id: "aba-small-claims-2023",
        apa: "American Bar Association. (2023). Small claims and consumer disputes: A practical guide. American Bar Association. https://www.americanbar.org/groups/public_education/resources/",
        url: "https://www.americanbar.org/groups/public_education/resources/",
        type: "article",
      },
      {
        id: "nolo-demand-letters-2023",
        apa: "Nolo. (2023). How to write a demand letter that gets results. Nolo Press. https://www.nolo.com/legal-encyclopedia/free-books/small-claims-book/chapter6-1.html",
        url: "https://www.nolo.com/legal-encyclopedia/free-books/small-claims-book/chapter6-1.html",
        type: "article",
      },
      {
        id: "ftc-debt-collection-2023",
        apa: "Federal Trade Commission. (2023). Debt collection FAQs. U.S. Federal Trade Commission. https://consumer.ftc.gov/articles/debt-collection-faqs",
        url: "https://consumer.ftc.gov/articles/debt-collection-faqs",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5849598/pexels-photo-5849598.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Legal documents and a pen arranged neatly on a desk",
        caption: "Legal documents on a desk — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
        alt: "Attorney reviewing a printed letter at a formal office desk",
        caption: "Reviewing a demand letter — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=small+claims+demand+letter+template+sample",
        alt: "Google Images search for small-claims demand letter templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "employment-verification": {
    richBody: [
      {
        type: "p",
        text: "Employment verification letters are the most-requested HR document in any company. Visa officers, mortgage underwriters, and leasing agents all need the same five facts: employee name, role, start date, status, and salary. Automate the template and HR wins hours back every week — without sacrificing the formal tone the recipient expects.",
        cite: ["shrm-verification-2023"],
      },
      {
        type: "stat",
        value: "Top 3",
        label: "Most-requested HR letter types reported by SHRM members",
        cite: "shrm-verification-2023",
      },
      {
        type: "h2",
        text: "Five facts, one signature",
      },
      {
        type: "p",
        text: "Open with company letterhead — name, address, phone. State the purpose in one line: 'This letter confirms employment of Jane Doe at Acme Corp.' List the role, start date, employment status, and annual compensation. Name the reason for the letter — visa, mortgage, or lease — and offer to verify by phone. Sign with title, date, and direct phone number.",
      },
      {
        type: "ul",
        items: [
          "Company letterhead with full address and phone.",
          "Employee name, title, and department.",
          "Start date — month and year minimum.",
          "Employment status — full-time, part-time, contract.",
          "Annual salary or hourly compensation.",
          "Signature with HR or manager title and phone.",
        ],
      },
      {
        type: "h2",
        text: "Comply with disclosure rules",
      },
      {
        type: "callout",
        title: "Get written consent first",
        body: "Most jurisdictions require written employee consent before disclosing salary to a third party. Keep a signed authorization form on file and reference it in the letter when appropriate. SHRM resources cover state-by-state variations in detail.",
      },
      {
        type: "p",
        text: "SHRM data continues to identify employment verification as one of the highest-volume HR requests across organizations of every size (SHRM, 2023). A consistent template — one that captures the five facts cleanly — reduces back-and-forth and keeps employees moving on the visa, mortgage, or apartment timeline that prompted the request.",
        cite: ["shrm-verification-2023"],
      },
      {
        type: "p",
        text: "Type the employee name, role, start date, status, salary, and the reason. The PDF arrives on letterhead, formally typeset, and ready for HR to sign and send the same day.",
      },
    ],
    citations: [
      {
        id: "shrm-verification-2023",
        apa: "Society for Human Resource Management. (2023). Employment verification practices and benchmarks. SHRM. https://www.shrm.org/topics-tools/tools/hr-answers/employment-verifications",
        url: "https://www.shrm.org/topics-tools/tools/hr-answers/employment-verifications",
        type: "report",
      },
      {
        id: "dol-employment-records-2023",
        apa: "U.S. Department of Labor. (2023). Recordkeeping and reporting requirements. Wage and Hour Division. https://www.dol.gov/agencies/whd/recordkeeping",
        url: "https://www.dol.gov/agencies/whd/recordkeeping",
        type: "gov",
      },
      {
        id: "uscis-evidence-2023",
        apa: "U.S. Citizenship and Immigration Services. (2023). Evidence of employment for nonimmigrant petitions. USCIS. https://www.uscis.gov/working-in-the-united-states",
        url: "https://www.uscis.gov/working-in-the-united-states",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6266950/pexels-photo-6266950.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "HR professional reviewing employee paperwork at a corporate desk",
        caption: "HR document review — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=1200&q=80",
        alt: "Signed document on a desk next to a corporate pen and folder",
        caption: "Signed verification document — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=employment+verification+letter+template+sample",
        alt: "Google Images search for employment verification letter templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "thank-you-note": {
    richBody: [
      {
        type: "p",
        text: "Send a thank-you note within 24 hours of every interview. Five sentences. One specific reference to the conversation. One line restating fit. One offer to answer follow-up questions. Sign with your phone number. The note arrives before the hiring decision is made — and tips it in your favor more often than a smarter resume would.",
        cite: ["accountemps-thank-you-2023"],
      },
      {
        type: "stat",
        value: "68%",
        label: "Of hiring managers say a thank-you note influences their decision",
        cite: "accountemps-thank-you-2023",
      },
      {
        type: "h2",
        text: "Five sentences, hard limit",
      },
      {
        type: "p",
        text: "Sentence one greets the interviewer by first name and thanks them for the time. Sentence two references something specific they said — a project, a challenge, an opinion. Sentence three connects that reference to your background in one line. Sentence four offers to answer any follow-up. Sentence five signs off with your phone number and best regards.",
      },
      {
        type: "ul",
        items: [
          "Greet by first name — no 'Dear Mr./Ms.'",
          "Reference one specific moment in the conversation.",
          "Restate fit in a single line tied to their problem.",
          "Offer to answer follow-up questions or send work samples.",
          "Sign with phone number — make follow-up frictionless.",
        ],
      },
      {
        type: "h2",
        text: "The specific reference does the work",
      },
      {
        type: "callout",
        title: "Send within 24 hours",
        body: "The hiring decision often gets made within 48 hours of the final interview. A thank-you note that lands the same day signals you respect the team's timeline. Print and hand-deliver for senior roles when possible — email otherwise.",
      },
      {
        type: "p",
        text: "Robert Half / Accountemps surveys of hiring managers continue to find that thank-you notes meaningfully influence final hiring decisions (Robert Half, 2023). The reason: a generic 'thank you for your time' reads as a template, but a specific reference to a real moment proves you listened and cared. Three minutes of writing routinely beats a smarter portfolio.",
        cite: ["accountemps-thank-you-2023"],
      },
      {
        type: "p",
        text: "Type the interviewer's name, the role, and one specific thing you discussed. The PDF arrives in five sentences, signed, and ready to print or attach to an email within the hour.",
      },
    ],
    citations: [
      {
        id: "accountemps-thank-you-2023",
        apa: "Robert Half. (2023). The thank-you note revisited: Hiring manager survey results. Robert Half International. https://www.roberthalf.com/us/en/insights",
        url: "https://www.roberthalf.com/us/en/insights",
        type: "report",
      },
      {
        id: "linkedin-talent-trends-2023",
        apa: "LinkedIn Talent Solutions. (2023). Global Talent Trends 2023: The reinvention of company culture. LinkedIn Corporation. https://business.linkedin.com/talent-solutions/global-talent-trends",
        url: "https://business.linkedin.com/talent-solutions/global-talent-trends",
        type: "report",
      },
      {
        id: "indeed-interview-followup-2023",
        apa: "Indeed. (2023). How to write a thank-you email after an interview. Indeed Career Guide. https://www.indeed.com/career-advice/interviewing/thank-you-email-after-interview",
        url: "https://www.indeed.com/career-advice/interviewing/thank-you-email-after-interview",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Handwritten thank-you note on a wooden desk with a coffee cup nearby",
        caption: "Handwritten thank-you note — Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        alt: "Person writing a short note at a clean wooden desk in soft window light",
        caption: "Writing a thank-you note — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=interview+thank+you+note+template+handwritten",
        alt: "Google Images search for interview thank-you note templates",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
