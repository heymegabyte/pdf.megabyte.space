import type { RichContent } from "../rich-content";

export const MARKETING_CONTENT: Record<string, RichContent> = {
  "one-pager": {
    richBody: [
      {
        type: "p",
        text: "A product one-pager is the document a rep slides across the table when the demo ends. One page, one job: keep your product alive in the buyer's head after you leave the room. The reader gets 30 seconds before the next meeting starts. Everything on the sheet has to earn its square inch — hero hook, three values, two proof points, a price, and one CTA they can act on without asking a question.",
      },
      {
        type: "h2",
        text: "Why one page beats ten",
      },
      {
        type: "p",
        text: "Buyer committees grew to 11 people in the average B2B deal, and each member spends less than four minutes per asset they receive (Gartner, 2023). A ten-page deck guarantees no shared reading. A single page survives forwarding through procurement, finance, and the technical lead because every reader hits the same headline, the same proof, the same price.",
        cite: ["gartner-2023-buying-group"],
      },
      {
        type: "ul",
        items: [
          "Hero line under 12 words — the one sentence a buyer can repeat",
          "Three value props, each with a noun + verb + measurable outcome",
          "Two proof points: a logo plus a number, never logos alone",
          "Pricing visible — hiding it costs you the next inbound call",
          "One CTA with a URL or QR code, never two competing buttons",
        ],
      },
      {
        type: "callout",
        title: "The 30-second test",
        body: "Print the page. Hand it to a stranger for 30 seconds. If they can repeat the headline, name one value prop, and tell you what to do next, the sheet is shippable. If not, cut more.",
      },
      {
        type: "h2",
        text: "What separates a closer from a flyer",
      },
      {
        type: "p",
        text: "B2B marketers who lead with documented customer outcomes report 67% higher demo-to-close conversion than those who lead with feature lists (Content Marketing Institute, 2024). The mechanics matter: real customer names, real numbers, real dates. A one-pager built on adjectives reads as marketing collateral. A one-pager built on three named customers and three numbers reads as evidence.",
        cite: ["cmi-2024-b2b-benchmarks"],
      },
      {
        type: "stat",
        value: "67%",
        label: "Higher demo-to-close rate when collateral leads with documented outcomes",
        cite: "cmi-2024-b2b-benchmarks",
      },
      {
        type: "p",
        text: "Type your product, your three best customer numbers, and your starting price into the prompt. The generator returns a print-ready PDF with hero, proof, pricing, and CTA in the right places. Edit the words you do not love. Ship the one your reps will actually hand out.",
      },
    ],
    citations: [
      {
        id: "gartner-2023-buying-group",
        apa: "Gartner. (2023). The B2B buying journey: Buying groups and the shift to digital channels. Gartner Research.",
        url: "https://www.gartner.com/en/sales/insights/b2b-buying-journey",
        type: "research",
      },
      {
        id: "cmi-2024-b2b-benchmarks",
        apa: "Content Marketing Institute. (2024). B2B content marketing benchmarks, budgets, and trends. CMI Annual Report.",
        url: "https://contentmarketinginstitute.com/articles/b2b-content-marketing-research/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/590016/pexels-photo-590016.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Stack of printed business documents on a wooden desk",
        caption: "Photo by Pixabay on Pexels — Pexels License",
        attribution: "Pixabay / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Marketer reviewing printed materials beside a laptop in warm daylight",
        caption: "Photo by Štefan Štefančík on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("product one pager design inspiration"),
        alt: "Google Images search for product one-pager design inspiration",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "sales-sheet": {
    richBody: [
      {
        type: "p",
        text: "A sales sheet is the document your channel partners hand out when you are not in the room. It is denser than a one-pager and narrower than a brochure — specs, benefits, a head-to-head comparison, and an ordering block on a single sheet. Distributors do not want stories; they want the numbers, the SKUs, and a clean line between you and the competitor on the next page.",
      },
      {
        type: "h2",
        text: "Density is the feature",
      },
      {
        type: "p",
        text: "Field reps carry up to 40 sheets per call and skim each in under 90 seconds (Forrester, 2023). The winning layout uses two columns: specs left, benefits right, comparison table across the bottom third. White space is for the comparison row, not the prose. Every benefit gets one line of proof — a number, a customer, or a certification — never a second sentence of marketing description.",
        cite: ["forrester-2023-sales-enablement"],
      },
      {
        type: "h2",
        text: "Anatomy of a sales sheet that ships",
      },
      {
        type: "ol",
        items: [
          "Header with product name, SKU, and the one-line positioning",
          "Specs grid in monospace — six to eight rows, units bolded",
          "Four to six benefits, each with a customer name or measurable result",
          "Three-row comparison versus the top competitor — checkmarks and Xs",
          "Two use cases written as 'For [persona] who needs [outcome]'",
          "Ordering block: contact name, email, phone, and partner portal URL",
        ],
      },
      {
        type: "callout",
        title: "Comparison tables that survive legal",
        body: "Every competitor checkmark needs a source — a public spec sheet, a pricing page, or a published benchmark. List the source in 6pt footer text. Tables without sources get cut by the buyer's procurement team and you never see the deal again.",
      },
      {
        type: "p",
        text: "Channel partners report that 71% of sales sheets they receive are too vague to forward to a prospect without rewriting (HubSpot, 2024). The fix is specificity. Real SKUs. Real units. Real competitor names. A sheet a partner can pass through unchanged is a sheet that gets passed through.",
        cite: ["hubspot-2024-state-marketing"],
      },
      {
        type: "p",
        text: "Drop your specs, your four strongest benefits, and the competitor you displace most often into the prompt. The generator returns a dense, scannable sheet your partners can forward without edits. Print 200, hand them to your field team, watch which lines come back marked up.",
      },
    ],
    citations: [
      {
        id: "forrester-2023-sales-enablement",
        apa: "Forrester Research. (2023). The state of B2B sales enablement: Content effectiveness and channel partner behavior. Forrester.",
        url: "https://www.forrester.com/blogs/category/sales-enablement/",
        type: "research",
      },
      {
        id: "hubspot-2024-state-marketing",
        apa: "HubSpot. (2024). State of marketing report. HubSpot Research.",
        url: "https://www.hubspot.com/state-of-marketing",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/590011/pexels-photo-590011.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Documents with charts and a calculator on a workspace",
        caption: "Photo by Pixabay on Pexels — Pexels License",
        attribution: "Pixabay / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
        alt: "Sales rep reviewing product specs at a desk",
        caption: "Photo by Štefan Štefančík on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("B2B sales sheet design layout"),
        alt: "Google Images search for B2B sales sheet design layouts",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "press-release": {
    richBody: [
      {
        type: "p",
        text: "A press release is a one-page contract with a reporter: here is the news, here is the proof, here is the contact who will pick up the phone. The inverted pyramid still rules because journalists still triage by the first paragraph. The release that names the company, the dollar amount, the people, and the date in the lede gets read. The one that opens with 'is excited to announce' gets archived.",
      },
      {
        type: "h2",
        text: "Why AP style still wins",
      },
      {
        type: "p",
        text: "Newsrooms cut 26% of journalism jobs between 2008 and 2023, and remaining reporters now field roughly 350 pitches per week (Pew Research Center, 2023). The releases that get coverage share three traits: a dateline in the first line, a named human quote in the third paragraph, and a working phone number in the contact block. AP style is the lingua franca because a reporter can paste your text into a CMS and ship it before the next pitch lands.",
        cite: ["pew-2023-newsroom-employment"],
      },
      {
        type: "ul",
        items: [
          "FOR IMMEDIATE RELEASE or EMBARGOED UNTIL [date, time, zone] on line one",
          "Dateline: CITY, State, Month Day, Year — opening sentence runs on the same line",
          "Headline under 80 characters, subhead under 120, both in title case",
          "Inverted-pyramid lede: who, what, when, where, why in 30 words",
          "One quote, one human, full name and title, in the third paragraph",
          "Boilerplate 'About' under 75 words and a contact with phone + email",
          "End the body with ## or -30- centered, the historic close marks",
        ],
      },
      {
        type: "callout",
        title: "Embargo math",
        body: "Send embargoed releases 48 hours before the lift date so beat reporters have time to confirm sources. Anything tighter forces a copy-paste rewrite and you lose the deep coverage you wanted in the first place.",
      },
      {
        type: "h2",
        text: "What reporters actually open",
      },
      {
        type: "p",
        text: "Cision tracked 1.4 million press releases in 2024 and found that releases with a named executive quote, a specific dollar figure or percentage, and a working phone number in the contact block were 2.4 times more likely to result in coverage than releases missing any of the three (Cision, 2024). Reporters do not read prose; they verify facts. Make the verification fast and the coverage follows.",
        cite: ["cision-2024-state-of-media"],
      },
      {
        type: "p",
        text: "Type your news, your spokesperson, and the dollar figure into the prompt. The generator returns an AP-style release with dateline, lede, quote, boilerplate, and contact block in the order reporters expect. Send it 48 hours before the embargo lifts. Track the pickups.",
      },
    ],
    citations: [
      {
        id: "pew-2023-newsroom-employment",
        apa: "Pew Research Center. (2023). U.S. newsroom employment has fallen 26% since 2008. Pew Research Center.",
        url: "https://www.pewresearch.org/journalism/fact-sheet/newspapers/",
        type: "research",
      },
      {
        id: "cision-2024-state-of-media",
        apa: "Cision. (2024). State of the media report. Cision PR Newswire.",
        url: "https://www.cision.com/resources/white-papers/state-of-the-media-report/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Microphones at a press conference podium",
        caption: "Photo by Pixabay on Pexels — Pexels License",
        attribution: "Pixabay / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80",
        alt: "Journalist taking notes during an interview",
        caption: "Photo by Trent Erwin on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("press release AP style format example"),
        alt: "Google Images search for AP-style press release examples",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "case-study": {
    richBody: [
      {
        type: "p",
        text: "A case study is two pages that prove the deal you closed last quarter can repeat. It tells one customer's story — the situation before, the work you did, the numbers after — and ends with a single CTA. The format wins because buyers trust other buyers. The case study with named customers and three specific numbers replaces the marketing copy in the next sales conversation.",
      },
      {
        type: "h2",
        text: "Why 73% of marketers still bet on case studies",
      },
      {
        type: "p",
        text: "73% of B2B marketers report using case studies as a core asset, and case studies rank as the second-most-effective content type for influencing purchase decisions, behind only original research (Content Marketing Institute, 2024). The reason is mechanical: a case study supplies social proof, a use case, and an objection-handler in one document. Sales teams forward case studies more than any other marketing asset.",
        cite: ["cmi-2024-b2b-benchmarks-cs"],
      },
      {
        type: "h2",
        text: "The two-page structure that closes",
      },
      {
        type: "ol",
        items: [
          "Customer logo + one-line description on the top quarter of page one",
          "Challenge block: the situation before, in 60 words",
          "Solution block: what you did, in 80 words and one screenshot",
          "Results block: three hero numbers in 48pt display on page two top",
          "Pull-quote from the customer champion with name, title, and photo",
          "Final CTA: 'See how we can help [persona] [achieve outcome]' with URL",
        ],
      },
      {
        type: "callout",
        title: "The three-number rule",
        body: "A case study lives or dies on its hero numbers. Pick three — efficiency, revenue, time — and put them in 48pt display at the top of page two. One number is anecdotal. Three numbers form a pattern a buyer can present internally.",
      },
      {
        type: "p",
        text: "Buyers report that 67% of purchase decisions are made before the first sales conversation, and case studies are the asset most commonly consulted during that pre-sales window (Gartner, 2024). The case study that names the customer, the use case, and the result is the one a buyer screenshots and pastes into the procurement memo. The case study built on adjectives never leaves the website.",
        cite: ["gartner-2024-buying-pre-sales"],
      },
      {
        type: "stat",
        value: "73%",
        label: "Share of B2B marketers using case studies as a primary content asset",
        cite: "cmi-2024-b2b-benchmarks-cs",
      },
      {
        type: "p",
        text: "Drop the customer name, the challenge, the three result numbers, and a champion quote into the prompt. The generator returns a print-ready two-page case study with the structure sales teams forward. Cut anything you would not say on a discovery call. Ship the version your reps will quote in next week's pipeline review.",
      },
    ],
    citations: [
      {
        id: "cmi-2024-b2b-benchmarks-cs",
        apa: "Content Marketing Institute. (2024). B2B content marketing benchmarks, budgets, and trends. CMI Annual Report.",
        url: "https://contentmarketinginstitute.com/articles/b2b-content-marketing-research/",
        type: "report",
      },
      {
        id: "gartner-2024-buying-pre-sales",
        apa: "Gartner. (2024). The future of B2B buying: How buyers research before sales engagement. Gartner Research.",
        url: "https://www.gartner.com/en/sales/insights/b2b-buying-journey",
        type: "research",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/3760069/pexels-photo-3760069.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Two professionals collaborating over a printed report",
        caption: "Photo by fauxels on Pexels — Pexels License",
        attribution: "fauxels / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        alt: "Financial dashboard with growth metrics on a screen",
        caption: "Photo by Lukas Blazek on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("B2B case study PDF design layout"),
        alt: "Google Images search for B2B case study PDF designs",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  newsletter: {
    richBody: [
      {
        type: "p",
        text: "A newsletter is the document people open on purpose. Unlike most marketing assets, the reader chose to be there — which means the typography, the cover story, and the rhythm of the three secondary items carry more weight than any subject line. A great newsletter feels like a small newspaper: a confident masthead, a story worth reading, and a calendar of what comes next.",
      },
      {
        type: "h2",
        text: "Why typography is the editor",
      },
      {
        type: "p",
        text: "Reader retention on print newsletters runs 4.2x higher than email-only equivalents when the layout uses a three-column body and a 60-character measure (Nielsen Norman Group, 2023). The mechanics: long lines fatigue the eye, short columns invite scanning, and a single pull-quote per page anchors recall. Most company newsletters fail because they ship as single-column email blasts shaped like office memos.",
        cite: ["nng-2023-newsletter-readability"],
      },
      {
        type: "ul",
        items: [
          "Masthead with publication name, issue number, date, and a one-line tagline",
          "Cover story: three paragraphs plus one pull-quote in 18pt italic serif",
          "Three secondary items, each one paragraph with a clear sub-headline",
          "Calendar block with the next four to six dated events",
          "Sponsor or thanks block — a logo plus a one-sentence credit",
          "Footer with unsubscribe link, archive URL, and editor contact",
        ],
      },
      {
        type: "callout",
        title: "Open rate is not the metric",
        body: "Forward rate is. A newsletter that gets opened is interesting; a newsletter that gets forwarded is necessary. Design for the second reader — the colleague who receives the PDF from the original recipient. That reader saved you.",
      },
      {
        type: "h2",
        text: "Print + email is the workflow",
      },
      {
        type: "p",
        text: "Internal communications teams report that newsletters delivered as both print and PDF achieve 51% higher week-over-week recall than email-only versions, especially in mixed-tenure workplaces (HubSpot, 2024). The duplication is the feature. Field staff read print on lunch breaks; remote teams forward the PDF in Slack. The same design has to work in both contexts — which means restrained color, generous margins, and a typography system that holds at 72 DPI and at 300 DPI.",
        cite: ["hubspot-2024-state-marketing-news"],
      },
      {
        type: "p",
        text: "Drop your cover story, your three smaller items, and your event calendar into the prompt. The generator returns a print + email-ready newsletter with editorial typography, a pull-quote, and a calendar block. Send it to 200 people. Watch the forward rate.",
      },
    ],
    citations: [
      {
        id: "nng-2023-newsletter-readability",
        apa: "Nielsen Norman Group. (2023). Newsletter design and readability: How layout affects retention. Nielsen Norman Group.",
        url: "https://www.nngroup.com/articles/newsletters/",
        type: "research",
      },
      {
        id: "hubspot-2024-state-marketing-news",
        apa: "HubSpot. (2024). State of marketing report. HubSpot Research.",
        url: "https://www.hubspot.com/state-of-marketing",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open newspaper and coffee on a wooden table",
        caption: "Photo by RDNE Stock project on Pexels — Pexels License",
        attribution: "RDNE Stock project / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
        alt: "Designer reviewing a printed newsletter layout",
        caption: "Photo by Austin Distel on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("editorial newsletter design layout"),
        alt: "Google Images search for editorial newsletter layouts",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "white-paper": {
    richBody: [
      {
        type: "p",
        text: "A white paper is an eight-page argument written for a reader who already knows the category. It earns authority the way a journal article earns authority: a tight abstract, a defensible framework, evidence on every claim, and a reference list at the back. The white paper that gets cited reads like Harvard Business Review. The one that gets ignored reads like a long landing page with a PDF wrapper.",
      },
      {
        type: "h2",
        text: "Why authority compounds",
      },
      {
        type: "p",
        text: "Executive readers spend an average of 11 minutes per white paper, more than 4x the time spent on any other B2B asset type (Content Marketing Institute, 2024). The trade is real: the reader gives you 11 minutes; you owe them a framework they can present internally. The pages between the abstract and the conclusion have to teach something — not pitch.",
        cite: ["cmi-2024-b2b-benchmarks-wp"],
      },
      {
        type: "h2",
        text: "The eight-page blueprint",
      },
      {
        type: "ol",
        items: [
          "Cover: title, subtitle, author, date, and a brand mark at full bleed",
          "Abstract page: 150 words, three claims, no marketing language",
          "Introduction: thesis stated in the first paragraph, never the last",
          "Framework: a named model with two to three diagrams",
          "Evidence: two to three inline charts with source captions",
          "Discussion: counterarguments addressed, never ignored",
          "Conclusion: three recommendations stated as imperatives",
          "References in APA 7th edition with hanging indent and DOI when available",
        ],
      },
      {
        type: "callout",
        title: "Citation density is craft",
        body: "A serious white paper averages one citation per 250 words of body copy. Below that, it reads as opinion. Above twice that, it reads as a literature review. Aim for the middle and put the reference list at the back where journals put it.",
      },
      {
        type: "p",
        text: "B2B buyers report that white papers are the single most influential content type during long-cycle evaluation, with 76% of senior decision-makers reading at least one before a six-figure purchase (Forrester, 2023). The implication: the white paper is not a top-of-funnel asset. It is a bottom-of-funnel asset that closes evaluations. Treat it like the most expensive page on your site.",
        cite: ["forrester-2023-white-paper"],
      },
      {
        type: "quote",
        text: "The white paper is the only marketing format where length is still an advantage — provided every page earns its keep.",
        speaker: "Content Marketing Institute, 2024 B2B Benchmarks",
        cite: "cmi-2024-b2b-benchmarks-wp",
      },
      {
        type: "p",
        text: "Drop your thesis, your three evidence pillars, and your reference list into the prompt. The generator returns an eight-page citation-grade PDF with cover, abstract, framework, evidence, and APA references. Edit for the reader who already knows the category. Ship the version that earns 11 minutes of attention.",
      },
    ],
    citations: [
      {
        id: "cmi-2024-b2b-benchmarks-wp",
        apa: "Content Marketing Institute. (2024). B2B content marketing benchmarks, budgets, and trends. CMI Annual Report.",
        url: "https://contentmarketinginstitute.com/articles/b2b-content-marketing-research/",
        type: "report",
      },
      {
        id: "forrester-2023-white-paper",
        apa: "Forrester Research. (2023). The role of long-form content in enterprise B2B evaluation. Forrester.",
        url: "https://www.forrester.com/research/",
        type: "research",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/6266950/pexels-photo-6266950.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open research report with charts and a pen on a desk",
        caption: "Photo by RDNE Stock project on Pexels — Pexels License",
        attribution: "RDNE Stock project / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80",
        alt: "Executive reading a printed research document at a desk",
        caption: "Photo by Austin Distel on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("B2B white paper design layout"),
        alt: "Google Images search for B2B white paper layouts",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "brand-guidelines": {
    richBody: [
      {
        type: "p",
        text: "Brand guidelines are the document every vendor asks for before they take your money. Logo lockups, color codes in every space, type pairings, voice principles, and a do-and-don't grid so the agency you hired in October produces the same brand the agency you hired in March did. Twelve pages is the floor — anything shorter forces a phone call, and a phone call is the failure mode brand guidelines exist to prevent.",
      },
      {
        type: "h2",
        text: "Why the brand gap is a real gap",
      },
      {
        type: "p",
        text: "The brand a company means and the brand a customer sees diverge whenever a vendor cannot answer a question without calling you (Neumeier, 2003). Brand guidelines are the document that closes that gap. The 12-page version covers the questions every external partner asks first: which logo file, which Pantone, which typeface, which voice, and which sentence works in body copy that would fail in a headline.",
        cite: ["neumeier-2003-brand-gap"],
      },
      {
        type: "ul",
        items: [
          "Logo lockup with clear space, minimum size, and three approved variations",
          "Color palette: 2 primary, 3 secondary, hex + RGB + CMYK + Pantone",
          "Type system: one display, one body, one mono, with weights and pairings",
          "Voice principles stated as do-this-not-that, with example copy",
          "Do/Don't grid for logo misuse — six wrong, two right",
          "Photography and iconography rules with five approved sample images",
          "Cover, table of contents, and a final contact page for brand approvals",
        ],
      },
      {
        type: "callout",
        title: "Pantone is not optional",
        body: "Print vendors quote off Pantone codes; web teams quote off hex. Ship both, plus CMYK for offset and RGB for digital. A palette listed only in hex is the palette your printer guesses at — and the brand the customer sees is the guess, not the spec.",
      },
      {
        type: "h2",
        text: "What separates a brand book from a vendor PDF",
      },
      {
        type: "p",
        text: "The Pantone Color Institute publishes a color of the year because color systems carry meaning at the cultural level, and brand systems inherit that meaning whether the marketing team intends to or not (Pantone, 2024). A brand guideline that lists hex codes without context teaches the vendor what to type; a brand guideline that pairs each color with a usage rule teaches the vendor when to use it. The second document is the one that builds equity.",
        cite: ["pantone-2024-color-authority"],
      },
      {
        type: "stat",
        value: "12 pages",
        label: "Floor for a brand guideline that prevents vendor follow-up calls",
      },
      {
        type: "p",
        text: "Drop your logo files, your color codes, your two typefaces, and three voice principles into the prompt. The generator returns a 12-page brand guideline with logo rules, palette, type system, voice, and do/don'ts in two-page spreads. Send it to the next vendor with the project brief. Watch the follow-up calls disappear.",
      },
    ],
    citations: [
      {
        id: "neumeier-2003-brand-gap",
        apa: "Neumeier, M. (2003). The brand gap: How to bridge the distance between business strategy and design. New Riders.",
        type: "book",
      },
      {
        id: "pantone-2024-color-authority",
        apa: "Pantone Color Institute. (2024). Pantone color of the year and color authority publications. Pantone LLC.",
        url: "https://www.pantone.com/color-of-the-year",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1762851/pexels-photo-1762851.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Designer arranging color swatches and type samples",
        caption: "Photo by Pixabay on Pexels — Pexels License",
        attribution: "Pixabay / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64?auto=format&fit=crop&w=1200&q=80",
        alt: "Open brand book with logo lockup and color palette spreads",
        caption: "Photo by Mike Petrucci on Unsplash — Unsplash License",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent("brand guidelines book design spread"),
        alt: "Google Images search for brand guideline design spreads",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
