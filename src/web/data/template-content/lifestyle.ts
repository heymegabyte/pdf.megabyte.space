import type { RichContent } from "../rich-content";

export const LIFESTYLE_CONTENT: Record<string, RichContent> = {
  "recipe-card": {
    richBody: [
      {
        type: "p",
        text: "A recipe card lives or dies on the kitchen counter. Splash of olive oil, dusting of flour, thumb-print of tomato — the card has to survive all three and still get handed to a friend two years later. Good recipe cards put the title, yield, and times at the top, the ingredients in a clean two-column block, and the steps in numbered prose with enough room for a wet finger.",
      },
      {
        type: "h2",
        text: "Why the format matters more than the font",
      },
      {
        type: "p",
        text: "Cooks read recipes in glances, not paragraphs. The eye jumps from the ingredient list to step three and back to the oven temperature. The USDA recommends home cooks measure flour by weight rather than volume to reduce error by up to 20 percent, which is why mono numerals matter — they line up cleanly when you scan a column of grams (U.S. Department of Agriculture, 2020).",
        cite: ["usda-dietary-2020"],
      },
      {
        type: "ul",
        items: [
          "Yield first — readers decide whether to scale before they read",
          "Prep and cook times beside the yield, never buried in prose",
          "Ingredients in order of appearance in the steps",
          "Steps numbered, with one action per line",
          "Notes section for substitutions and variations",
        ],
      },
      {
        type: "callout",
        title: "Test-kitchen tip",
        body: "Cooks Illustrated tests every recipe a minimum of 30 times before publishing. You do not need 30 passes, but cook your recipe twice before printing the card — once for the steps, once for the timing.",
      },
      {
        type: "h2",
        text: "Print or phone — design for both",
      },
      {
        type: "p",
        text: "A 5×7 portrait fits a recipe binder; a 4×6 landscape slides into a stand on the counter. Both formats render legibly on a phone if the type stays above 14pt and the line length sits under 60 characters. Modernist Cuisine demonstrates that recipe legibility correlates more strongly with line-height than font choice (Myhrvold, 2011).",
        cite: ["myhrvold-2011-modernist"],
      },
      {
        type: "p",
        text: "Type the prompt above with your dish, your yield, and any notes you want preserved — the PDF prints clean and saves to your phone as a backup. The card outlives the meal.",
      },
    ],
    citations: [
      {
        id: "usda-dietary-2020",
        apa: "U.S. Department of Agriculture, & U.S. Department of Health and Human Services. (2020). Dietary guidelines for Americans, 2020-2025 (9th ed.). https://www.dietaryguidelines.gov",
        url: "https://www.dietaryguidelines.gov",
        type: "gov",
      },
      {
        id: "myhrvold-2011-modernist",
        apa: "Myhrvold, N., Young, C., & Bilet, M. (2011). Modernist cuisine: The art and science of cooking. The Cooking Lab.",
        type: "book",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Hands plating a finished dish on a wooden kitchen counter",
        caption: "Recipe cards belong on the counter, not in a drawer.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic close-up of a plated dish on a rustic wooden table",
        caption: "Print-ready recipe cards survive the splash of olive oil.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+recipe+card+template+design",
        alt: "Browse printable recipe card designs on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "workout-plan": {
    richBody: [
      {
        type: "p",
        text: "A workout plan that survives the gym bag is a designed object. It gets folded in half, tucked beside a water bottle, pulled out between sets with chalky hands. The plan has to read at arm's length under fluorescent light. That means tight tables, bold numerals for sets and reps, and a phase header you can find without reading the page twice.",
      },
      {
        type: "h2",
        text: "Phases beat random workouts",
      },
      {
        type: "p",
        text: "The American College of Sports Medicine recommends adults perform muscle-strengthening activities at moderate or greater intensity on two or more days per week, paired with at least 150 minutes of moderate aerobic activity (Liguori et al., 2021). A four-week structured plan splits those hours into phases — base, build, peak — so the body adapts instead of plateaus.",
        cite: ["acsm-2021-guidelines"],
      },
      {
        type: "h2",
        text: "What belongs on every page",
      },
      {
        type: "ol",
        items: [
          "Phase header in 24pt — base, build, peak, deload",
          "Day-by-day grid with exercise, sets, reps, rest, RPE",
          "Warm-up routine at the top of every session",
          "Cooldown and mobility at the bottom",
          "Notes column for weights used and how the lift felt",
        ],
      },
      {
        type: "callout",
        title: "Track the lift, not just the day",
        body: "A plan without a tracking column is a wish. Print a notes line beside every exercise so you can log the load — that single column turns a printout into a training journal that compounds.",
      },
      {
        type: "stat",
        value: "150 min",
        label: "Weekly moderate aerobic activity recommended by WHO for adults aged 18-64",
        cite: "who-2020-activity",
      },
      {
        type: "p",
        text: "Type the prompt above with your training split, days per week, and the lifts you care about. The PDF folds into a gym bag and lasts a week of sweat — long enough to mark up, short enough to print again next month.",
      },
    ],
    citations: [
      {
        id: "acsm-2021-guidelines",
        apa: "Liguori, G., Feito, Y., Fountaine, C., & Roy, B. (Eds.). (2021). ACSM's guidelines for exercise testing and prescription (11th ed.). Wolters Kluwer.",
        type: "book",
      },
      {
        id: "who-2020-activity",
        apa: "World Health Organization. (2020). WHO guidelines on physical activity and sedentary behaviour. World Health Organization. https://www.who.int/publications/i/item/9789240015128",
        url: "https://www.who.int/publications/i/item/9789240015128",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Athlete mid-workout in a sunlit gym",
        caption: "Plans that survive the gym bag are designed for the gym bag.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic gym interior with weight rack and morning light",
        caption: "A printed plan beats a phone screen between sets.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+4+week+workout+plan+template",
        alt: "Browse printable 4-week workout plan templates on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "meal-plan": {
    richBody: [
      {
        type: "p",
        text: "The meal plan you stick to is the one that already wrote the shopping list. Sunday afternoon, coffee in hand, you should be able to glance at one page, fold the second page in your pocket, and walk into the store knowing exactly which aisle to hit first. Anything more complicated than that and the plan dies by Tuesday.",
      },
      {
        type: "h2",
        text: "What a real weekly plan includes",
      },
      {
        type: "p",
        text: "The USDA's MyPlate framework suggests filling half your plate with fruits and vegetables, a quarter with whole grains, and a quarter with lean protein (U.S. Department of Agriculture, 2020). A weekly plan that honors that ratio across 21 meals beats any single perfect dinner. The grid format makes the ratio visible at a glance — and visibility is the whole game.",
        cite: ["usda-dietary-2020"],
      },
      {
        type: "ul",
        items: [
          "Seven-day grid: breakfast, lunch, dinner, one snack",
          "One-line description per meal — no prose, no paragraphs",
          "Shopping list grouped by aisle, not by recipe",
          "Prep-day notes for what to batch on Sunday",
          "Optional calorie or macro column for tracking goals",
          "Leftover-mapping arrows from Sunday roast to Tuesday salad",
        ],
      },
      {
        type: "callout",
        title: "Group the list by aisle, not by recipe",
        body: "The single biggest predictor of whether a meal plan gets executed is whether the shopping list maps to the store's physical layout. Produce, dairy, dry goods, frozen. One pass, no backtracking.",
      },
      {
        type: "h2",
        text: "Sunday prep, weekday wins",
      },
      {
        type: "p",
        text: "Research from the Harvard T.H. Chan School of Public Health found that meal planning is associated with healthier eating patterns and lower obesity rates among adults (Ducrot et al., 2017). The mechanism is friction reduction — when the next decision is already made, willpower has less work to do at 6:47 p.m. on a Wednesday.",
        cite: ["ducrot-2017-meal-planning"],
      },
      {
        type: "p",
        text: "Type your dietary preferences, household size, and meals per day into the prompt above. The PDF prints the week and tears off the shopping list — Sunday-night ready, refrigerator-magnet sized.",
      },
    ],
    citations: [
      {
        id: "usda-dietary-2020",
        apa: "U.S. Department of Agriculture, & U.S. Department of Health and Human Services. (2020). Dietary guidelines for Americans, 2020-2025 (9th ed.). https://www.dietaryguidelines.gov",
        url: "https://www.dietaryguidelines.gov",
        type: "gov",
      },
      {
        id: "ducrot-2017-meal-planning",
        apa: "Ducrot, P., Méjean, C., Aroumougame, V., Ibanez, G., Allès, B., Kesse-Guyot, E., Hercberg, S., & Péneau, S. (2017). Meal planning is associated with food variety, diet quality and body weight status in a large sample of French adults. International Journal of Behavioral Nutrition and Physical Activity, 14(1), 12. https://doi.org/10.1186/s12966-017-0461-7",
        url: "https://doi.org/10.1186/s12966-017-0461-7",
        type: "research",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Weekly meal prep containers arranged on a counter",
        caption: "Sunday prep, weekday wins — print the plan, fold the list.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic overhead shot of a balanced plate with grains, greens, and protein",
        caption: "Half the plate vegetables — the ratio you can see at a glance.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+weekly+meal+plan+template+shopping+list",
        alt: "Browse printable weekly meal plan templates on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "travel-itinerary": {
    richBody: [
      {
        type: "p",
        text: "An itinerary that folds into a passport is the one you actually open at the airport. Day-by-day, flight numbers in mono, hotel addresses spelled out for the cab driver, restaurant picks with neighborhood tags so you can pivot when the line is too long. The good ones read like a screenplay — short scenes, clear locations, a single bold heading per day.",
      },
      {
        type: "h2",
        text: "What every leg needs",
      },
      {
        type: "p",
        text: "U.S. travelers took 461 million domestic business trips and over 2.0 billion domestic leisure person-trips in a recent year, and the share who plan multi-day itineraries before departure has climbed steadily since 2019 (U.S. Travel Association, 2023). The planning premium shows up in two places: fewer missed reservations and faster decisions when something goes sideways.",
        cite: ["us-travel-2023"],
      },
      {
        type: "ul",
        items: [
          "Cover with trip title, dates, and traveler names",
          "Flight block per leg — confirmation, gate guidance, seat",
          "Hotel block with address, check-in time, phone",
          "Day-by-day plan split morning / afternoon / evening",
          "Restaurant picks tagged by neighborhood with backups",
          "Emergency contacts and travel-insurance policy number",
        ],
      },
      {
        type: "callout",
        title: "Print two — leave one with family",
        body: "The itinerary is also a safety document. Print a second copy and leave it with someone at home. Confirmation numbers, hotel phones, embassy address. Five minutes of effort, weeks of peace of mind.",
      },
      {
        type: "h2",
        text: "Format follows the suitcase",
      },
      {
        type: "p",
        text: "A 5×8 trim folds once and slides into a passport sleeve. Mono numerals for flight times and confirmation codes — they line up under any light, including the seat-back tray at row 32. Skift research has documented that travelers who carry a printed backup of their digital itinerary recover faster from app outages and missed connections (Skift Research, 2022).",
        cite: ["skift-2022-travel"],
      },
      {
        type: "p",
        text: "Type your trip into the prompt above — dates, cities, the kind of hotel, the food you actually want. The PDF folds into a passport, prints clean on hotel paper, and survives the airport.",
      },
    ],
    citations: [
      {
        id: "us-travel-2023",
        apa: "U.S. Travel Association. (2023). U.S. travel and tourism overview. U.S. Travel Association. https://www.ustravel.org/research",
        url: "https://www.ustravel.org/research",
        type: "report",
      },
      {
        id: "skift-2022-travel",
        apa: "Skift Research. (2022). The state of travel 2022: A reset for the industry. Skift. https://research.skift.com",
        url: "https://research.skift.com",
        type: "report",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/60616/pexels-photo-60616.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open passport, plane ticket, and itinerary on a wooden desk",
        caption: "Folds into a passport — opens at the airport.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic travel scene with map and camera on a wooden surface",
        caption: "A printed backup beats a dead phone battery.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+travel+itinerary+template+day+by+day",
        alt: "Browse printable travel itinerary templates on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "budget-tracker": {
    richBody: [
      {
        type: "p",
        text: "A budget you actually fill in looks more like a journal than a spreadsheet. Wide cells. Generous margins. A row for every category that matters, and a quiet column on the right for the net. Print it on Sunday, fill it with a pen on weekday mornings, total it at month-end, file the page. The act of writing is the budget — the form is just a guide.",
      },
      {
        type: "h2",
        text: "What honest numbers require",
      },
      {
        type: "p",
        text: "The Bureau of Labor Statistics' Consumer Expenditure Survey reports that average annual household expenditures reached $77,280 in 2023, with housing, transportation, and food consuming the largest shares (U.S. Bureau of Labor Statistics, 2024). A monthly budget tracker that mirrors those categories — and then forces you to write the actual numbers — closes the gap between the household you think you run and the one you actually do.",
        cite: ["bls-cex-2024"],
      },
      {
        type: "ul",
        items: [
          "Income block — every source, every paycheck",
          "Fixed expenses — rent, insurance, subscriptions, utilities",
          "Variable expenses — groceries, gas, dining, kids' activities",
          "Savings goals — emergency fund, retirement, sinking funds",
          "Debt paydown — principal, interest, balance remaining",
          "Net row at the bottom, summed by hand, totaled in pen",
        ],
      },
      {
        type: "callout",
        title: "Write the number you do not want to write",
        body: "Honest budgets work because the act of writing $487 in the dining-out row is uncomfortable. Spreadsheets dilute that discomfort. Paper makes it stick. Embrace the friction — that is where the behavior change lives.",
      },
      {
        type: "stat",
        value: "$77,280",
        label: "Average U.S. household annual expenditures (BLS Consumer Expenditure Survey, 2023)",
        cite: "bls-cex-2024",
      },
      {
        type: "p",
        text: "Research from the Federal Reserve's Survey of Consumer Finances has consistently shown that households with explicit written budgets report higher confidence in their financial decisions than those without (Board of Governors of the Federal Reserve System, 2023). Confidence is not the goal — clarity is — but confidence is the byproduct of clarity, and clarity is what a printed budget enforces.",
        cite: ["fed-scf-2023"],
      },
      {
        type: "p",
        text: "Type the prompt above with your income, your categories, and whether you want fillable form fields. The PDF prints clean and honest — twelve pages a year, one finished household.",
      },
    ],
    citations: [
      {
        id: "bls-cex-2024",
        apa: "U.S. Bureau of Labor Statistics. (2024). Consumer expenditure survey, 2023. U.S. Department of Labor. https://www.bls.gov/cex/",
        url: "https://www.bls.gov/cex/",
        type: "gov",
      },
      {
        id: "fed-scf-2023",
        apa: "Board of Governors of the Federal Reserve System. (2023). Survey of consumer finances, 2022. Federal Reserve. https://www.federalreserve.gov/econres/scfindex.htm",
        url: "https://www.federalreserve.gov/econres/scfindex.htm",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/261735/pexels-photo-261735.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open notebook with handwritten budget figures beside a calculator",
        caption: "Pen, paper, real numbers — the budget that actually gets filled.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic shot of a budget worksheet with coffee and pen",
        caption: "A printed budget is a behavior-change tool, not a record.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+monthly+budget+template+fillable+pdf",
        alt: "Browse printable monthly budget templates on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "gift-certificate": {
    richBody: [
      {
        type: "p",
        text: "A gift certificate that feels like a gift starts with treating the amount as the photograph on the page. 48 points of display serif, centered, bordered by enough white space that the eye lands on the number and lingers. The recipient name, the giver, the redemption details — all secondary. The dollar figure is the hero, the rest is supporting cast.",
      },
      {
        type: "h2",
        text: "Why design separates a gift from a transaction",
      },
      {
        type: "p",
        text: "U.S. consumers spend over $171 billion on gift cards annually, and the format consistently ranks as the most-requested gift across demographics (J.D. Power, 2023). The problem is most gift certificates look like coupons — drab borders, default fonts, perforation hints. A designed certificate signals intent: somebody chose this, somebody printed this, somebody handed this over with two hands.",
        cite: ["jd-power-2023-gift"],
      },
      {
        type: "ul",
        items: [
          "Amount in 48pt display serif or hand-lettered script",
          "To and From lines, clearly labeled, generously spaced",
          "Redemption details — business name, code, expiry date",
          "Terms in 8pt mono at the bottom, never the focus",
          "Decorative border or single ornamental flourish",
          "5×7 portrait or letter half-fold trim",
        ],
      },
      {
        type: "callout",
        title: "Treat the amount like a typographic crown",
        body: "The number is the story. Center it. Give it breathing room. Use a display weight you would never use for body copy. A gift certificate with a timid amount reads as a coupon. A bold one reads as a gift.",
      },
      {
        type: "h2",
        text: "What the legal terms actually need",
      },
      {
        type: "p",
        text: "The Credit CARD Act of 2009 governs federal gift card terms in the United States — funds cannot expire for at least five years, and inactivity fees are restricted (Consumer Financial Protection Bureau, 2022). A well-built certificate names the expiry plainly, lists any redemption restrictions, and prints a unique code so the issuer can track it. None of that needs to crowd the front of the card; reserve the back or a footer for it.",
        cite: ["cfpb-2022-gift-cards"],
      },
      {
        type: "p",
        text: "Type the amount, the recipient, the business, and the expiry into the prompt above. The PDF prints on cardstock, folds clean, and arrives looking like a gift instead of a receipt.",
      },
    ],
    citations: [
      {
        id: "jd-power-2023-gift",
        apa: "J.D. Power. (2023). U.S. gift card satisfaction study. J.D. Power. https://www.jdpower.com",
        url: "https://www.jdpower.com",
        type: "report",
      },
      {
        id: "cfpb-2022-gift-cards",
        apa: "Consumer Financial Protection Bureau. (2022). Gift cards. CFPB. https://www.consumerfinance.gov/consumer-tools/prepaid-cards/answers/key-terms/",
        url: "https://www.consumerfinance.gov",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5039647/pexels-photo-5039647.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Elegant gift envelope with ribbon and handwritten name",
        caption: "A gift certificate is a designed object, not a receipt.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic close-up of a wrapped gift with twine and tag",
        caption: "Treat the amount like the photograph on the page.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=elegant+gift+certificate+template+design+printable",
        alt: "Browse elegant gift certificate designs on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "thank-you-card": {
    richBody: [
      {
        type: "p",
        text: "A handwritten thank-you note in 2026 beats a Venmo emoji and an instant DM combined. The paper signals time, the ink signals choice, the envelope signals a stamp. The card itself does not need to be long — three sentences, a name, a signature line — but it has to look like someone meant it. That is a design problem, not a sentiment problem.",
      },
      {
        type: "h2",
        text: "The math of a memorable note",
      },
      {
        type: "p",
        text: "Research on gratitude expression has found that handwritten notes consistently surprise recipients with how much they are appreciated — and senders consistently underestimate that impact (Kumar & Epley, 2018). The gap between expected and actual response is large enough that the researchers titled the work around the systematic miscalculation of gratitude's reach.",
        cite: ["kumar-epley-2018-gratitude"],
      },
      {
        type: "ul",
        items: [
          "5×7 portrait folded card — fits a standard A7 envelope",
          "Front cover: single ornament and the words Thank You",
          "Inside-left blank for the handwritten message",
          "Inside-right with a 3-sentence printed message",
          "Back panel with return address and sender's name",
          "Soft pastel palette — never neon, never corporate",
        ],
      },
      {
        type: "callout",
        title: "Three sentences are plenty",
        body: "Thank specifically. Reference a detail only the giver would catch. Close warmly. Skip the filler. A short, specific note feels more personal than a paragraph of generalities — and it actually gets written instead of postponed.",
      },
      {
        type: "h2",
        text: "Format the paper for the gesture",
      },
      {
        type: "p",
        text: "Generous margins, display script on the cover, sans-serif on the inside body — the card should never feel crowded. The American Heart Association and similar institutions have noted that practicing gratitude is associated with measurable psychological benefits for both senders and recipients (Emmons & McCullough, 2003). The card is the artifact that makes the practice tangible.",
        cite: ["emmons-2003-gratitude"],
      },
      {
        type: "p",
        text: "Type your message, the occasion, and the recipients into the prompt above. The PDF prints two to a sheet on cardstock, folds clean down the center, and slips into an A7 envelope. Stamp it, mail it, mean it.",
      },
    ],
    citations: [
      {
        id: "kumar-epley-2018-gratitude",
        apa: "Kumar, A., & Epley, N. (2018). Undervaluing gratitude: Expressers misunderstand the consequences of showing appreciation. Psychological Science, 29(9), 1423-1435. https://doi.org/10.1177/0956797618772506",
        url: "https://doi.org/10.1177/0956797618772506",
        type: "research",
      },
      {
        id: "emmons-2003-gratitude",
        apa: "Emmons, R. A., & McCullough, M. E. (2003). Counting blessings versus burdens: An experimental investigation of gratitude and subjective well-being in daily life. Journal of Personality and Social Psychology, 84(2), 377-389. https://doi.org/10.1037/0022-3514.84.2.377",
        url: "https://doi.org/10.1037/0022-3514.84.2.377",
        type: "research",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Handwritten note card with pen on a soft pastel background",
        caption: "A handwritten thank-you note beats a Venmo emoji every time.",
        attribution: "Photo via Pexels (Pexels License)",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=80",
        alt: "Cinematic flat-lay of stationery, envelopes, and a fountain pen",
        caption: "Paper signals time. Ink signals choice.",
        attribution: "Photo via Unsplash (Unsplash License)",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable+thank+you+card+template+5x7+folded",
        alt: "Browse printable thank-you card designs on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
