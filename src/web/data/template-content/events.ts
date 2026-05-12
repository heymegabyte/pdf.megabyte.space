import type { RichContent } from "../rich-content";

export const EVENTS_CONTENT: Record<string, RichContent> = {
  "wedding-invitation": {
    richBody: [
      {
        type: "p",
        text:
          "A wedding invitation is the first piece of evidence guests hold that the day is real. Paper, weight, ink, and typography arrive before the venue, the vows, or the cake. Done well, it reads like a museum announcement — quiet, confident, every word load-bearing. Done badly, it reads like a coupon. The bar is high because the recipient saves it.",
        cite: ["knot-2024-real-weddings"],
      },
      {
        type: "stat",
        value: "$33,000",
        label: "Average US wedding spend in 2024 — stationery commands a notable share of the budget",
        cite: "knot-2024-real-weddings",
      },
      { type: "h2", text: "What goes on the card" },
      {
        type: "p",
        text:
          "Six elements carry the entire announcement: hosts (often the couple themselves now), names, date, venue, dress code, and RSVP path. Anything else competes with those six and dilutes them. Couples who insist on cramming in a poem or a registry line on the front almost always regret it once they see the proof.",
      },
      {
        type: "ul",
        items: [
          "Hosts line — couple, parents, or both",
          "Names in display weight, generously letter-spaced",
          "Date written out — 'Saturday, the twenty-second of July'",
          "Venue with city + state",
          "Dress code — three words maximum",
          "RSVP URL, QR code, or phone",
        ],
      },
      { type: "h2", text: "Typography is the dress code" },
      {
        type: "p",
        text:
          "One typeface, two weights. Restraint reads as confidence. A display serif for names with a clean sans for body details outperforms five flourished scripts every time. Pantone's Color of the Year often nudges palette trends, but neutral cream paper with a single accent color ages better than any seasonal pick.",
        cite: ["pantone-2024-coty"],
      },
      {
        type: "callout",
        title: "Print-shop checklist",
        body:
          "PDF/X-1a, 3mm bleed, 5×7 trim, CMYK with one Pantone spot if you want a foil pull. Embed all fonts. Outline anything that has to survive a careless RIP. Bring a hard proof to the venue tasting — paper looks different under tungsten than on a laptop.",
      },
      { type: "h2", text: "Digital companion, not replacement" },
      {
        type: "p",
        text:
          "Paste the print PDF into the email body and you lose the texture entirely. Generate a second 1080×1350 portrait export with the same typography for the save-the-date text thread. Couples report higher RSVP completion when the digital twin links to a single, beautifully-typeset wedding website.",
        cite: ["weddingwire-2024-report"],
      },
      {
        type: "p",
        text:
          "Type your couple, date, venue, and dress code into the prompt box. Thirty seconds later you have a 5×7 print-ready PDF — museum typography, three-millimeter bleed, RSVP block, ready for the press. Send the proof to the print shop tonight.",
      },
    ],
    citations: [
      {
        id: "knot-2024-real-weddings",
        apa: "The Knot. (2024). Real weddings study 2024. The Knot Worldwide. https://www.theknot.com/content/wedding-data-insights/real-weddings-study",
        url: "https://www.theknot.com/content/wedding-data-insights/real-weddings-study",
        type: "report",
      },
      {
        id: "weddingwire-2024-report",
        apa: "WeddingWire. (2024). WeddingReport 2024: Trends in wedding planning. The Knot Worldwide. https://www.weddingwire.com/wedding-ideas/wedding-report",
        url: "https://www.weddingwire.com/wedding-ideas/wedding-report",
        type: "report",
      },
      {
        id: "pantone-2024-coty",
        apa: "Pantone Color Institute. (2024). Color of the year 2024: Peach Fuzz. Pantone LLC. https://www.pantone.com/color-of-the-year",
        url: "https://www.pantone.com/color-of-the-year",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Wedding ceremony arch with florals at golden hour",
        caption: "Wedding ceremony arch — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
        alt: "Wedding rings resting on linen with editorial light",
        caption: "Editorial wedding still life — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=elegant+wedding+invitation+design+inspiration",
        alt: "Browse wedding invitation inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "baby-shower-invite": {
    richBody: [
      {
        type: "p",
        text:
          "A baby shower invitation is the first piece of paper a kid's name appears on. That fact carries weight. The card sets the tone for an afternoon of strangers becoming family, and parents-to-be keep the proof in a drawer for decades. Warmth without cutesy is the line — pastel can be sophisticated when the typography does the work.",
        cite: ["cdc-2023-births"],
      },
      { type: "h2", text: "The six lines that matter" },
      {
        type: "p",
        text:
          "Hosts, parents-to-be, date, time, venue, registry. Optional: a theme word like 'Twilight' or 'Garden' that hints at color story without demanding costumes. Most hosts overstuff the front; the second draft is always shorter than the first.",
      },
      {
        type: "ol",
        items: [
          "Hosts line — 'Hosted by Anna and Lee'",
          "Honored guests — parents-to-be names in display weight",
          "Date and time in clean sans",
          "Venue address with city",
          "Registry URL or QR code",
          "RSVP method with deadline",
        ],
      },
      { type: "h2", text: "Why warm beats cute" },
      {
        type: "p",
        text:
          "Cartoon storks and pacifier clip-art age out the moment the kid can read. Soft pastels with a single hand-illustrated ornament — a moon, a pear, a bear — hold up. The US Census reports roughly 3.6 million births annually, which means roughly 3.6 million chances to do better than clip-art each year.",
        cite: ["census-2023-fertility"],
      },
      {
        type: "callout",
        title: "Registry etiquette",
        body:
          "Place the registry URL on the back or in a discreet block, never the centerpiece. Guests want to feel invited to a party first and a transaction second. A QR code is faster than a typed URL and keeps the front of the card clean.",
      },
      { type: "h2", text: "Practical print notes" },
      {
        type: "p",
        text:
          "5×7 portrait with 3mm bleed prints at any local shop. Uncoated stock reads warmer than glossy. If you mail flat, a 70lb cover survives the postal system; a 100lb cover feels like a thank-you note before it is opened. Order ten extra for keepsakes — the parents-to-be will want one for the baby book.",
      },
      {
        type: "p",
        text:
          "Drop the parents, the date, the venue, and the registry into the prompt. The PDF comes out with hand-warmed typography, the right amount of pastel, and a registry block that nobody will roll their eyes at. Mail it Friday.",
      },
    ],
    citations: [
      {
        id: "cdc-2023-births",
        apa: "Centers for Disease Control and Prevention. (2023). Births: Final data for 2022. National Vital Statistics Reports, 73(2). https://www.cdc.gov/nchs/products/nvsr.htm",
        url: "https://www.cdc.gov/nchs/products/nvsr.htm",
        type: "gov",
      },
      {
        id: "census-2023-fertility",
        apa: "US Census Bureau. (2023). Fertility of women in the United States: 2022. United States Census Bureau. https://www.census.gov/topics/families/fertility.html",
        url: "https://www.census.gov/topics/families/fertility.html",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1556761/pexels-photo-1556761.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Soft pastel baby shower table setting with florals",
        caption: "Pastel shower setting — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80",
        alt: "Editorial baby shower still life with pastel ribbon",
        caption: "Baby shower styling — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=modern+baby+shower+invitation+design",
        alt: "Browse baby shower invitation inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "birthday-flyer": {
    richBody: [
      {
        type: "p",
        text:
          "A birthday flyer is the first thing the birthday kid shows off at school. That single fact rewrites the brief. Polish the typography, commit to the theme, and the flyer becomes a poster on a bedroom wall instead of a sticky note on a fridge. Playful and disciplined are not enemies — they are partners.",
        cite: ["eventbrite-2024-trends"],
      },
      { type: "h2", text: "Theme, hierarchy, restraint" },
      {
        type: "p",
        text:
          "Pick one theme — dinosaurs, space, princess, pirate — and let it own the hero. The lower half of the flyer is unsentimental: date, time, venue, RSVP. Two-column layouts down there fit the details without crowding the illustration above.",
      },
      {
        type: "ul",
        items: [
          "Hero illustration drawn from the kid's request",
          "Name + age in display weight",
          "Day and time on one line",
          "Venue with parking note",
          "RSVP phone or text number",
          "Optional 'bring a swimsuit' line",
        ],
      },
      { type: "h2", text: "Why event-poster scale wins" },
      {
        type: "p",
        text:
          "Eventbrite tracks more than 280,000 active event creators globally, and the highest-engagement listings share one trait: scale type that reads from across a room. Treat the birthday flyer like a tiny concert poster and the kid takes it to show-and-tell. Treat it like a Word doc and it ends up in a drawer.",
        cite: ["eventbrite-2024-trends", "ibis-2024-events"],
      },
      {
        type: "callout",
        title: "Two trim sizes, one decision",
        body:
          "5×7 is the easy mail size — fits a standard envelope, prints anywhere. 8.5×11 lets the hero illustration breathe and doubles as a fridge poster. Pick by distribution channel: mail = 5×7, hand-out at school pickup = 8.5×11.",
      },
      { type: "h2", text: "Color drawn from the kid" },
      {
        type: "p",
        text:
          "Ask the birthday kid for their favorite color and build the palette out from that. Most parents over-design and lose the child's voice; the best flyers feel like they were made FOR a six-year-old, not BY one. Three colors, one display typeface, and a single ornament is plenty.",
      },
      {
        type: "p",
        text:
          "Type the kid's name, age, theme, date, and venue. The prompt returns a print-ready flyer with a hero illustration matched to the theme, dialed-in typography, and an RSVP block that parents actually read. Print twenty and hand them out at school pickup.",
      },
    ],
    citations: [
      {
        id: "eventbrite-2024-trends",
        apa: "Eventbrite. (2024). 2024 event trends report. Eventbrite Inc. https://www.eventbrite.com/blog/event-industry-trends/",
        url: "https://www.eventbrite.com/blog/event-industry-trends/",
        type: "report",
      },
      {
        id: "ibis-2024-events",
        apa: "IBISWorld. (2024). Event planning industry in the US (IBISWorld industry report 71321). IBISWorld. https://www.ibisworld.com/united-states/market-research-reports/event-planning-industry/",
        url: "https://www.ibisworld.com/united-states/market-research-reports/event-planning-industry/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Colorful birthday party setup with balloons and cake",
        caption: "Birthday party scene — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1200&q=80",
        alt: "Editorial birthday cake with candles and confetti",
        caption: "Birthday cake styling — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=kids+birthday+party+flyer+design",
        alt: "Browse birthday flyer inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "event-program": {
    richBody: [
      {
        type: "p",
        text:
          "An event program is the first souvenir of the event. Guests fold it, photograph it, mail it to a grandparent. A great program does three jobs at once: it directs traffic, it credits the people who built the night, and it survives the recycling bin because the typography is worth keeping.",
        cite: ["pcma-2024-convene"],
      },
      { type: "h2", text: "Anatomy of a program guests keep" },
      {
        type: "p",
        text:
          "Cover does emotional work. Inside spread does logistics. Back cover does gratitude — sponsors, credits, and a discreet QR to the post-event survey. Tri-fold fits the day; single-page works for a two-hour ceremony. Anything longer than four panels is a brochure pretending to be a program.",
      },
      {
        type: "ol",
        items: [
          "Cover: event title, date, venue at full bleed",
          "Inside left: time-blocked agenda in two columns",
          "Inside center: speaker grid with photos and one-line bios",
          "Inside right: venue floor plan or map",
          "Back cover: sponsor logos in tiered rows",
          "Spine fold: post-event survey QR",
        ],
      },
      { type: "h2", text: "Sponsor tiers without shouting" },
      {
        type: "p",
        text:
          "PCMA's Convene benchmarks show sponsor visibility ranks among the top three retention drivers for corporate partners. Render the logos in greyscale for bronze and silver, full color for platinum. The hierarchy reads instantly without a key, and platinum partners feel the bump they paid for.",
        cite: ["pcma-2024-convene", "cvent-2024-meetings"],
      },
      {
        type: "callout",
        title: "Two-column agenda math",
        body:
          "A full day fits one letter page when the agenda runs two columns at 10pt body with 14pt leading. Anything tighter and guests squint; anything looser and the day spills onto two pages. Test it on the venue lighting before printing five hundred.",
      },
      { type: "h2", text: "Floor plans earn their square inch" },
      {
        type: "p",
        text:
          "Skip the architectural exactness — a stylized map with named rooms and arrow-marked routes outperforms a vector lift from the hotel's PDF every time. Mark restrooms, the green room, and the photo spot. Guests will find the bar themselves.",
      },
      {
        type: "p",
        text:
          "Drop the agenda, the speakers, the sponsors, and a sentence describing the venue. The prompt returns a tri-fold program with the cover at full bleed, the agenda in two columns, and sponsors in clean tiers. Send it to the print shop with two days of slack.",
      },
    ],
    citations: [
      {
        id: "pcma-2024-convene",
        apa: "Professional Convention Management Association. (2024). Convene Salary Survey & Industry Benchmarks 2024. PCMA. https://www.pcma.org/convene/",
        url: "https://www.pcma.org/convene/",
        type: "report",
      },
      {
        id: "cvent-2024-meetings",
        apa: "Cvent. (2024). 2024 global meetings and events forecast. Cvent Inc. https://www.cvent.com/en/blog/events",
        url: "https://www.cvent.com/en/blog/events",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Event program booklet on table with stage in background",
        caption: "Event program in venue — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
        alt: "Editorial conference stage with audience in attendance",
        caption: "Conference setup — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=event+program+design+booklet",
        alt: "Browse event program inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "concert-poster": {
    richBody: [
      {
        type: "p",
        text:
          "A concert poster gets ripped off a lamppost on Thursday and pinned to a bedroom wall by Friday. That is the test. The typography has to be loud enough to carry the band name across a venue, restrained enough to look intentional on a brick wall, and honest enough that fans take it home as a memento.",
        cite: ["smithsonian-poster-history"],
      },
      { type: "h2", text: "Editorial or punk — pick one" },
      {
        type: "p",
        text:
          "The fastest way to make a bad concert poster is to mix the two. Editorial means generous letter-spacing, one or two muted colors, and a single bold image. Punk means high contrast, distressed type, photocopier-grainy textures. Commit on minute one and the design writes itself.",
      },
      {
        type: "ul",
        items: [
          "Band name in 96pt or larger display",
          "Date and venue in second hierarchy",
          "Opening acts at one-third the band size",
          "Ticket price + URL or phone",
          "Sponsor row at the bottom — small, even-weighted",
          "Texture overlay for vintage feel (optional)",
        ],
      },
      { type: "h2", text: "11×17 is the size that travels" },
      {
        type: "p",
        text:
          "Tabloid-size posters slide into venue street teams' tubes, fit standard wheatpaste sites, and photograph well for the band's Instagram. Eventbrite reports concert listings draw the highest social-share rates among ticketed event categories — design for the camera, not just the lamppost.",
        cite: ["eventbrite-2024-trends"],
      },
      {
        type: "callout",
        title: "Print-shop sanity checks",
        body:
          "PDF/X-1a at 300dpi, 3mm bleed, CMYK with rich-black (60/40/40/100) for the band name. Outline all type before submission. Run a single proof on uncoated stock before ordering 200 — coated paper kills the warm, postered-up vintage feel.",
      },
      { type: "h2", text: "Sponsor row, done right" },
      {
        type: "p",
        text:
          "Sponsor logos at the bottom of a poster should read as a single neat row, not a logo soup. Convert each sponsor mark to a single ink color and align them on a baseline. The sponsors pay for the show; the band wants the visual hierarchy. Both can win.",
      },
      {
        type: "p",
        text:
          "Type the band, date, venue, openers, and ticket price. The prompt returns an 11×17 print-shop-ready PDF with display-scale type, restrained hierarchy, and a clean sponsor row. Print fifty and walk the neighborhood with a roll of tape on a Sunday afternoon.",
      },
    ],
    citations: [
      {
        id: "smithsonian-poster-history",
        apa: "Smithsonian National Museum of American History. (2023). Music posters and concert culture in 20th-century America. Smithsonian Institution. https://americanhistory.si.edu/collections",
        url: "https://americanhistory.si.edu/collections",
        type: "article",
      },
      {
        id: "eventbrite-2024-trends",
        apa: "Eventbrite. (2024). 2024 music industry trends report. Eventbrite Inc. https://www.eventbrite.com/blog/event-industry-trends/",
        url: "https://www.eventbrite.com/blog/event-industry-trends/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Concert crowd lit by stage lights and confetti",
        caption: "Concert crowd — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80",
        alt: "Live concert performance with dramatic stage lighting",
        caption: "Live performance — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=concert+poster+design+11x17+typography",
        alt: "Browse concert poster inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "conference-agenda": {
    richBody: [
      {
        type: "p",
        text:
          "The agenda is the most-photographed document of a conference. Attendees screenshot it, mark it up, send it to a colleague at lunch. A good agenda is the conference's user interface. Color-code the tracks, fix the spacing, and the document earns its place in the conference Slack channel before the keynote ends.",
        cite: ["pcma-2024-convene"],
      },
      { type: "h2", text: "Grid math for a multi-track day" },
      {
        type: "p",
        text:
          "Letter-landscape is the right canvas. Three tracks fit comfortably as three columns; four tracks need a smaller body type or a portrait flip. Cvent's 2024 industry forecast notes hybrid attendance lengthens session scan time — make the room and format tags large enough to read at arm's length.",
        cite: ["cvent-2024-meetings", "eventbrite-2024-trends"],
      },
      {
        type: "ul",
        items: [
          "Day header bar in primary brand color",
          "Track columns at consistent width",
          "Time gutter on the left edge",
          "Session card: title, speaker, room, format tag",
          "Breaks rendered as soft horizontal bands",
          "QR code in the corner to live schedule",
        ],
      },
      { type: "h2", text: "Color coding, restrained" },
      {
        type: "p",
        text:
          "Three colors maximum. One per track. The instinct is to give every session a unique hue; the result is a rainbow with no information value. A single accent color per track plus white space carries the load. Save the bright accents for the keynote and the closing party.",
      },
      {
        type: "callout",
        title: "Hybrid signal",
        body:
          "Mark which sessions are streamed, recorded, or in-person-only with a single glyph in the corner of each card. Attendees plan their day around what they can rewatch and what they cannot. The glyph is the smallest design choice with the biggest schedule impact.",
      },
      { type: "h2", text: "Live schedule QR" },
      {
        type: "p",
        text:
          "Print is a snapshot; the QR points to the live truth. When a speaker drops out at 9am, the printed program is wrong by 9:05. The QR sits in the corner of every page and routes to the conference app or a public spreadsheet. Update the spreadsheet, the room knows.",
      },
      {
        type: "p",
        text:
          "Tell the prompt the conference name, days, tracks, and a list of sessions with rooms and speakers. The PDF comes back with a color-coded three-track grid, room tags, and a QR to the live schedule. Print, fold, hand out at registration.",
      },
    ],
    citations: [
      {
        id: "pcma-2024-convene",
        apa: "Professional Convention Management Association. (2024). 2024 PCMA Convene Salary Survey & Industry Benchmarks. PCMA. https://www.pcma.org/convene/",
        url: "https://www.pcma.org/convene/",
        type: "report",
      },
      {
        id: "cvent-2024-meetings",
        apa: "Cvent. (2024). 2024 global meetings and events forecast. Cvent Inc. https://www.cvent.com/en/blog/events",
        url: "https://www.cvent.com/en/blog/events",
        type: "report",
      },
      {
        id: "eventbrite-2024-trends",
        apa: "Eventbrite. (2024). 2024 event trends report. Eventbrite Inc. https://www.eventbrite.com/blog/event-industry-trends/",
        url: "https://www.eventbrite.com/blog/event-industry-trends/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Conference attendees taking notes during a session",
        caption: "Conference session — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
        alt: "Modern conference auditorium with engaged attendees",
        caption: "Conference auditorium — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=conference+agenda+layout+design",
        alt: "Browse conference agenda inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "workshop-handout": {
    richBody: [
      {
        type: "p",
        text:
          "The handout that survives a workshop in someone's backpack and reopens on Monday morning is the one that earns the next gig. Workshop participants make their decision to recommend the trainer in the first ten minutes, but the handout is the artifact that keeps the lesson alive for weeks. Design for the second read, not the first.",
        cite: ["pcma-2024-convene"],
      },
      { type: "h2", text: "Single column, real checkboxes" },
      {
        type: "p",
        text:
          "Letter portrait, single column. The handout has to fit a binder, a backpack pocket, and a kitchen counter. Multi-column layouts look elegant on screen and collapse on print at standard photocopier reductions. Real 5mm checkboxes — actual squares, not bullet glyphs — get checked and signal intent.",
      },
      {
        type: "ol",
        items: [
          "Session agenda with time blocks",
          "Three to five key concepts with one-line definitions",
          "Two to three exercises with writing space",
          "'Monday morning' takeaway checklist",
          "Further reading list with two columns",
          "Trainer contact + booking URL",
        ],
      },
      { type: "h2", text: "Exercises that earn their square inch" },
      {
        type: "p",
        text:
          "Each exercise needs a one-sentence prompt, a worked example, and white space for the participant to write. Dotted borders signal 'this is yours to fill' more clearly than gray boxes. PCMA benchmarks consistently rank tangible takeaways as a top driver of repeat-attendance for paid training.",
        cite: ["pcma-2024-convene", "cvent-2024-meetings"],
      },
      {
        type: "callout",
        title: "The Monday-morning test",
        body:
          "Every page should answer one question: 'What does the participant do differently at 9am Monday because of this page?' If a page does not answer it, cut the page. The handout is shorter and the workshop is sharper.",
      },
      { type: "h2", text: "Further reading, scoped tight" },
      {
        type: "p",
        text:
          "Six books is performative. Three articles is useful. Pick one foundational book, one recent article, and one podcast episode. Two columns keep the reading list visually compact and signal 'this is curated, not a brain dump'. Participants notice.",
      },
      {
        type: "p",
        text:
          "Tell the prompt the workshop name, duration, three to five concepts, and two exercises. The PDF comes back single-column, with real checkboxes, dotted-border exercise blocks, and a Monday-morning checklist. Hand out at the start and the room takes notes.",
      },
    ],
    citations: [
      {
        id: "pcma-2024-convene",
        apa: "Professional Convention Management Association. (2024). 2024 PCMA Convene Salary Survey & Industry Benchmarks. PCMA. https://www.pcma.org/convene/",
        url: "https://www.pcma.org/convene/",
        type: "report",
      },
      {
        id: "cvent-2024-meetings",
        apa: "Cvent. (2024). 2024 global meetings and events forecast. Cvent Inc. https://www.cvent.com/en/blog/events",
        url: "https://www.cvent.com/en/blog/events",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4974912/pexels-photo-4974912.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Workshop participants reviewing handouts at a table",
        caption: "Workshop in session — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
        alt: "Editorial workshop with notebooks and collaborative discussion",
        caption: "Workshop collaboration — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=workshop+handout+worksheet+design",
        alt: "Browse workshop handout inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "menu-card": {
    richBody: [
      {
        type: "p",
        text:
          "A great menu sells the meal before the first bite. The description does as much work as the chef. James Beard Foundation research consistently underscores that menu language influences perception of value, freshness, and skill — sometimes more than the food itself. Three-word dish descriptions land harder than three-line ones.",
        cite: ["jbf-2024-menu-trends"],
      },
      { type: "h2", text: "Canonical course order" },
      {
        type: "p",
        text:
          "Snacks, starters, mains, sides, desserts, drinks. Skipping the canonical order disorients diners and slows the kitchen. A tri-fold menu lets each course breathe; a single-page A5 forces tight editing — usually a good thing. Decide the format first, then write to the constraint.",
      },
      {
        type: "ul",
        items: [
          "Dish name in 18pt serif italic",
          "One-line poetic description per dish",
          "Allergen icons (gf, df, vg, nf) as text glyphs",
          "Price column right-aligned",
          "Optional wine pairing column",
          "Footer with chef + sourcing credits",
        ],
      },
      { type: "h2", text: "Description as quiet salesmanship" },
      {
        type: "p",
        text:
          "Name the farm, name the technique, skip the adjectives. 'Roasted Cosmic Crisp apple, brown butter, sage' outperforms 'Delicious seasonal apple dish with aromatic herbs'. James Beard Foundation analysis of contemporary American menus shows specific sourcing language increases perceived value without raising the price point.",
        cite: ["jbf-2024-menu-trends", "ibis-2024-events"],
      },
      {
        type: "callout",
        title: "Allergen icons, not asterisks",
        body:
          "Compact text glyphs — gf, df, vg, nf — read faster than asterisk footnotes and accommodate dietary-restricted diners without singling them out. The icons sit immediately to the right of the dish name in a muted weight. Servers field fewer questions; diners feel seen.",
      },
      { type: "h2", text: "Wine pairing as discreet upsell" },
      {
        type: "p",
        text:
          "A right-aligned narrow column for pairing recommendations lifts beverage attach rates without feeling pushy. The wine column should never crowd the dish description — three to five words, the varietal and producer, nothing more. The sommelier handles the rest tableside.",
      },
      {
        type: "p",
        text:
          "Tell the prompt the courses, the dishes, the prices, and one line about the room's vibe. The PDF returns with serif-italic dish names, allergen glyphs, right-aligned prices, and an optional wine column. Print on uncoated stock with a kraft band — guests photograph it, the chef notices.",
      },
    ],
    citations: [
      {
        id: "jbf-2024-menu-trends",
        apa: "James Beard Foundation. (2024). Annual menu trends and culinary insights report. James Beard Foundation. https://www.jamesbeard.org/blog",
        url: "https://www.jamesbeard.org/blog",
        type: "report",
      },
      {
        id: "ibis-2024-events",
        apa: "IBISWorld. (2024). Restaurant industry in the US (IBISWorld industry report 72211). IBISWorld. https://www.ibisworld.com/united-states/market-research-reports/full-service-restaurants-industry/",
        url: "https://www.ibisworld.com/united-states/market-research-reports/full-service-restaurants-industry/",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Restaurant menu card on a wooden table with candlelight",
        caption: "Restaurant menu — courtesy Pexels",
        attribution: "Pexels / Free to use",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80",
        alt: "Editorial restaurant table setting with menu card and wine",
        caption: "Editorial menu setting — courtesy Unsplash",
        attribution: "Unsplash / Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=restaurant+menu+card+design+typography",
        alt: "Browse menu card inspiration on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
