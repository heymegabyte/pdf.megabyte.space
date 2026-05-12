import type { RichContent } from "../rich-content";

export const EDUCATION_CONTENT: Record<string, RichContent> = {
  syllabus: {
    richBody: [
      {
        type: "p",
        text: "A syllabus is the only document students keep open for 14 weeks. It sets pacing, signals tone, and decides whether office hours feel inviting or punitive. Most syllabi fail because they read like contracts written by lawyers — dense paragraphs, buried policies, no visual hierarchy. The good ones look like the course they describe.",
      },
      { type: "h2", text: "What a working syllabus carries" },
      {
        type: "p",
        text: "Carnegie Mellon's Eberly Center frames the syllabus as a contract, a permanent record, and a learning tool (Eberly Center, 2023). The contract role demands legibility. The learning role demands the document itself teach — outcomes phrased as student abilities, schedule chunks that mirror cognitive load, grading tables that map to Bloom's levels (Bloom, 1956).",
        cite: ["eberly-2023-syllabus", "bloom-1956-taxonomy"],
      },
      {
        type: "ul",
        items: [
          "Course outcomes written as 'students will be able to' verbs",
          "Week-by-week schedule with readings and deliverable dates",
          "Grading table — categories, weights, late-work policy",
          "Academic integrity language with concrete examples",
          "Office hours block with calendar link and response-time norms",
        ],
      },
      {
        type: "callout",
        title: "Outcomes do the heavy lifting",
        body: "Three to five measurable outcomes beat fifteen vague aspirations. Pin each assignment to one outcome. Students who can map their grade to a skill stop arguing about points and start asking better questions.",
      },
      { type: "h2", text: "Why typography matters here" },
      {
        type: "p",
        text: "Most students read the syllabus on a phone the night before the first assignment. One typeface in two weights, generous line height, and a clean week grid does more for retention than another policy paragraph. The Chronicle of Higher Education has documented for years that clear syllabi correlate with fewer mid-semester grade disputes (Chronicle, 2022).",
        cite: ["chronicle-2022-syllabus-design"],
      },
      {
        type: "p",
        text: "Type the course, the weeks, and one policy you actually enforce. The prompt builds the rest — outcomes, schedule, grading table, integrity language — in a layout your students will reopen all term.",
      },
    ],
    citations: [
      {
        id: "eberly-2023-syllabus",
        apa: "Carnegie Mellon University Eberly Center. (2023). Make the most of the first day of class. Eberly Center for Teaching Excellence. https://www.cmu.edu/teaching/designteach/teach/firstday.html",
        url: "https://www.cmu.edu/teaching/designteach/teach/firstday.html",
        type: "gov",
      },
      {
        id: "bloom-1956-taxonomy",
        apa: "Bloom, B. S. (1956). Taxonomy of educational objectives: The classification of educational goals. Handbook I: Cognitive domain. David McKay Company.",
        type: "book",
      },
      {
        id: "chronicle-2022-syllabus-design",
        apa: "Supiano, B. (2022, August 15). The syllabus as a teaching tool. The Chronicle of Higher Education. https://www.chronicle.com/article/the-syllabus-as-a-teaching-tool",
        url: "https://www.chronicle.com/article/the-syllabus-as-a-teaching-tool",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/1181534/pexels-photo-1181534.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Open notebook with a printed schedule on a wooden desk",
        caption: "Photo by Christina Morillo on Pexels",
        attribution: "Christina Morillo / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
        alt: "University lecture hall with rows of desks",
        caption: "Lecture hall — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=university%20course%20syllabus%20design%20layout",
        alt: "Browse syllabus design examples on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "lesson-plan": {
    richBody: [
      {
        type: "p",
        text: "The best lesson plan fits on one page and stays useful at minute 38, when the projector hiccups and the class is half a beat off. It is not a script — it is a map. Time blocks, one objective, materials, and a quick check that tells you whether to keep moving or back up. Everything else is decoration.",
      },
      { type: "h2", text: "The five-block spine" },
      {
        type: "p",
        text: "Most working lesson plans follow a variant of warm-up, mini-lesson, guided practice, check, exit ticket. Edutopia has tracked this structure across grade bands for fifteen years (Edutopia, 2023). The point is not the labels — it is that each block has a job: activate prior knowledge, introduce, rehearse, measure, exit.",
        cite: ["edutopia-2023-lesson-design"],
      },
      {
        type: "ol",
        items: [
          "Warm-up (5 min) — surface what students already know",
          "Mini-lesson (10 min) — introduce the new idea, one example",
          "Guided practice (20 min) — students attempt with scaffolding",
          "Check (5 min) — formative question, hand signal, or quick poll",
          "Exit ticket (5 min) — one question that proves the objective landed",
        ],
      },
      {
        type: "callout",
        title: "Write the objective first",
        body: "If the objective takes more than one sentence, the lesson is two lessons. Hattie's meta-analyses put teacher clarity at an effect size of 0.84 — bigger than most curricular interventions (Hattie, 2009). A foggy objective scales that fog through every block.",
      },
      { type: "h2", text: "Differentiation without doubling the work" },
      {
        type: "p",
        text: "A single sentence per block — 'above grade: extend with a second example; below grade: pair with a graphic organizer' — is usually enough. CAST's Universal Design for Learning framework recommends giving students multiple means of engagement, representation, and expression rather than building three separate lessons (CAST, 2018).",
        cite: ["cast-2018-udl"],
      },
      {
        type: "p",
        text: "Type the grade, the subject, and the time you actually have. The prompt produces the five-block plan, the objective, materials, and an exit ticket — laid out so you can teach off the page while making eye contact.",
      },
    ],
    citations: [
      {
        id: "edutopia-2023-lesson-design",
        apa: "Edutopia. (2023). 5 research-backed studying techniques for teachers to share with students. George Lucas Educational Foundation. https://www.edutopia.org/article/5-research-backed-studying-techniques",
        url: "https://www.edutopia.org/article/5-research-backed-studying-techniques",
        type: "article",
      },
      {
        id: "hattie-2009-visible-learning",
        apa: "Hattie, J. (2009). Visible learning: A synthesis of over 800 meta-analyses relating to achievement. Routledge.",
        type: "book",
      },
      {
        id: "cast-2018-udl",
        apa: "CAST. (2018). Universal Design for Learning Guidelines version 2.2. CAST. https://udlguidelines.cast.org",
        url: "https://udlguidelines.cast.org",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/8617954/pexels-photo-8617954.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Teacher with young students gathered around a small table",
        caption: "Photo by Mikhail Nilov on Pexels",
        attribution: "Mikhail Nilov / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
        alt: "Classroom whiteboard with handwritten lesson notes",
        caption: "Classroom whiteboard — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=k-12%20lesson%20plan%20template%20one%20page",
        alt: "Browse one-page lesson plan layouts on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "quiz-template": {
    richBody: [
      {
        type: "p",
        text: "A clean quiz reads like a small puzzle. Numbered questions, predictable point values, plenty of room to write, and an answer key the grader can scan in two minutes. The format is invisible when it works — students think about photosynthesis, not about whether question 7b belongs to question 7 or starts a new one.",
      },
      { type: "h2", text: "Why mixed formats beat all-multiple-choice" },
      {
        type: "p",
        text: "Retrieval practice — pulling information out of the brain rather than re-reading it — is one of the most replicated findings in cognitive science (APA, 2021). Short answer and diagram-labeling force retrieval; pure multiple choice often does not. A quiz that mixes five MCQ, three short answer, and two labels gets more learning per minute than ten MCQ alone.",
        cite: ["apa-2021-retrieval-practice"],
      },
      {
        type: "ul",
        items: [
          "Five multiple choice — fast checks for recall",
          "Three short answer — checks for application",
          "Two diagram-labeling or matching — checks for transfer",
          "Point values printed next to each question",
          "Name, date, and period block at the top",
        ],
      },
      {
        type: "callout",
        title: "Put the answer key on its own page",
        body: "Detach-friendly answer keys make grading faster and let you reuse the quiz across sections. Print one front-only copy for the gradebook and one front-and-back for the absent student who needs to take it next week.",
      },
      { type: "h2", text: "Whitespace is the secret feature" },
      {
        type: "p",
        text: "Vanderbilt's Center for Teaching has noted for years that handwriting space changes student answers — too little room produces shorter, less developed responses (Vanderbilt CFT, 2022). Give two full lines for a one-sentence answer and four lines for a paragraph. The quiz looks shorter to the student and reads more thoroughly to you.",
        cite: ["vanderbilt-2022-assessment-design"],
      },
      {
        type: "p",
        text: "Type the topic, the grade, and the question mix you want. The prompt returns ten numbered questions, a separate answer key, and enough whitespace that handwriting feels welcome rather than rationed.",
      },
    ],
    citations: [
      {
        id: "apa-2021-retrieval-practice",
        apa: "American Psychological Association. (2021). Improving students' learning with effective learning techniques. APA. https://www.apa.org/education-career/k12/learning-techniques",
        url: "https://www.apa.org/education-career/k12/learning-techniques",
        type: "research",
      },
      {
        id: "vanderbilt-2022-assessment-design",
        apa: "Vanderbilt University Center for Teaching. (2022). Classroom assessment techniques (CATs). Vanderbilt CFT. https://cft.vanderbilt.edu/guides-sub-pages/cats/",
        url: "https://cft.vanderbilt.edu/guides-sub-pages/cats/",
        type: "gov",
      },
      {
        id: "bloom-1956-taxonomy",
        apa: "Bloom, B. S. (1956). Taxonomy of educational objectives: The classification of educational goals. Handbook I: Cognitive domain. David McKay Company.",
        type: "book",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/256468/pexels-photo-256468.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Student writing answers on a printed test with a pencil",
        caption: "Photo by Pixabay on Pexels",
        attribution: "Pixabay / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
        alt: "Pencils on a wooden desk beside a printed worksheet",
        caption: "Pencils on a desk — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable%20classroom%20quiz%20template%20layout",
        alt: "Browse printable quiz layouts on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "study-guide": {
    richBody: [
      {
        type: "p",
        text: "The study guide that actually gets read at 11pm the night before the exam is short, scannable, and structured so a student can flip to any term without losing their place. Long prose loses. Two columns of terms, a few summary paragraphs, ten practice questions, and a flashcard strip that cuts cleanly with kitchen scissors — that wins.",
      },
      { type: "h2", text: "Why spaced retrieval beats highlighting" },
      {
        type: "p",
        text: "Decades of cognitive research place practice testing and distributed practice at the top of effective learning techniques, well above re-reading and highlighting (APA, 2021). A study guide that prompts retrieval — terms with hidden definitions, practice questions with answers on the next page — produces measurably better recall than a beautifully highlighted textbook chapter.",
        cite: ["apa-2021-retrieval-practice"],
      },
      {
        type: "ul",
        items: [
          "Twenty key terms with one-line definitions",
          "Five topic summaries, three to five sentences each",
          "Ten practice questions with answers behind a fold",
          "Cut-line flashcard list — term on one side, definition on the other",
          "Quick-reference sidebar — timeline, formulas, or map",
        ],
      },
      {
        type: "callout",
        title: "Two columns, not one",
        body: "A two-column body fits roughly twice the content per page and lets the eye chunk terms naturally. Color-code section headers and a student can find 'Reconstruction' in three seconds — which is exactly how long they will look before giving up.",
      },
      { type: "h2", text: "Make the flashcards print-ready" },
      {
        type: "p",
        text: "Edutopia and others have documented that students rarely build their own flashcards when given the choice — but they will use ones you cut for them (Edutopia, 2023). Print the flashcard list on the last page with crop marks. The five minutes a student spends cutting becomes spaced practice for the term itself.",
        cite: ["edutopia-2023-lesson-design"],
      },
      {
        type: "p",
        text: "Type the unit, the grade level, and the exam date. The prompt returns terms, summaries, practice questions, and a flashcard strip — laid out so the student who opens it at 11pm finds something useful before midnight.",
      },
    ],
    citations: [
      {
        id: "apa-2021-retrieval-practice",
        apa: "American Psychological Association. (2021). Improving students' learning with effective learning techniques. APA. https://www.apa.org/education-career/k12/learning-techniques",
        url: "https://www.apa.org/education-career/k12/learning-techniques",
        type: "research",
      },
      {
        id: "edutopia-2023-lesson-design",
        apa: "Edutopia. (2023). 5 research-backed studying techniques for teachers to share with students. George Lucas Educational Foundation. https://www.edutopia.org/article/5-research-backed-studying-techniques",
        url: "https://www.edutopia.org/article/5-research-backed-studying-techniques",
        type: "article",
      },
      {
        id: "hattie-2009-visible-learning",
        apa: "Hattie, J. (2009). Visible learning: A synthesis of over 800 meta-analyses relating to achievement. Routledge.",
        type: "book",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Student studying with notes and flashcards spread on a desk",
        caption: "Photo by Andrea Piacquadio on Pexels",
        attribution: "Andrea Piacquadio / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?auto=format&fit=crop&w=1200&q=80",
        alt: "Notebook with handwritten study notes and a coffee mug",
        caption: "Study notes — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=printable%20study%20guide%20layout%20flashcards",
        alt: "Browse study guide layouts on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "book-report": {
    richBody: [
      {
        type: "p",
        text: "A book report that reads like a real review beats the five-paragraph form every time. One page, smart structure, a pull quote that carries weight, and a personal take that proves the student finished the book. Teachers grade dozens of these in a sitting — the one with editorial layout and an actual opinion gets remembered.",
      },
      { type: "h2", text: "Structure that signals close reading" },
      {
        type: "p",
        text: "Bloom's taxonomy puts summary at the bottom of the cognitive ladder and analysis, evaluation, and creation at the top (Bloom, 1956). A book report that spends 80% of its space on plot summary scores low on every modern rubric. Three sentences of plot, two themes with quoted evidence, one character deep-dive, one personal reflection — that distribution reads like a Times review, not a homework assignment.",
        cite: ["bloom-1956-taxonomy"],
      },
      {
        type: "ol",
        items: [
          "Header — title, author, ISBN, publication year",
          "Three-sentence plot summary, no spoilers",
          "Two themes, each anchored by one quoted line",
          "One character analysis — choices and consequences",
          "Personal reflection — what the book did to the reader",
        ],
      },
      {
        type: "callout",
        title: "Pull quotes earn the grade",
        body: "An 18-point serif pull quote in the middle of the page does three jobs: it proves the student read past page ten, it breaks up the gray wall of text, and it gives the teacher a fast signal that this report has been thought about, not assembled.",
      },
      { type: "h2", text: "Personal take, not personal essay" },
      {
        type: "p",
        text: "The Vanderbilt Center for Teaching recommends reflection prompts that ask what changed in the reader rather than whether the book was liked (Vanderbilt CFT, 2022). 'I now think differently about X because of Y' is a stronger close than 'I really enjoyed the book.' Strong takes signal engagement; vague enjoyment signals skimming.",
        cite: ["vanderbilt-2022-assessment-design"],
      },
      {
        type: "p",
        text: "Type the book, the grade, and the angle you want to argue. The prompt returns a one-page report with header, summary, themes, character work, and reflection — laid out with a pull quote a teacher cannot miss.",
      },
    ],
    citations: [
      {
        id: "bloom-1956-taxonomy",
        apa: "Bloom, B. S. (1956). Taxonomy of educational objectives: The classification of educational goals. Handbook I: Cognitive domain. David McKay Company.",
        type: "book",
      },
      {
        id: "vanderbilt-2022-assessment-design",
        apa: "Vanderbilt University Center for Teaching. (2022). Classroom assessment techniques (CATs). Vanderbilt CFT. https://cft.vanderbilt.edu/guides-sub-pages/cats/",
        url: "https://cft.vanderbilt.edu/guides-sub-pages/cats/",
        type: "gov",
      },
      {
        id: "edutopia-2023-lesson-design",
        apa: "Edutopia. (2023). 5 research-backed studying techniques for teachers to share with students. George Lucas Educational Foundation. https://www.edutopia.org/article/5-research-backed-studying-techniques",
        url: "https://www.edutopia.org/article/5-research-backed-studying-techniques",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/4144222/pexels-photo-4144222.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Stack of hardcover books beside an open notebook with notes",
        caption: "Photo by Andrea Piacquadio on Pexels",
        attribution: "Andrea Piacquadio / Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80",
        alt: "Open book on a wooden table next to a coffee cup",
        caption: "Library books — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=one%20page%20book%20report%20layout%20editorial",
        alt: "Browse editorial book report layouts on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "thesis-proposal": {
    richBody: [
      {
        type: "p",
        text: "A thesis proposal that earns approval reads like a tight journal article. One sentence states the research question. A lit review threads ten to twenty citations into an argument. The methodology section makes a committee believe the experiment will run. The timeline closes the loop. Length is not the variable — discipline is.",
      },
      { type: "h2", text: "The research question carries the weight" },
      {
        type: "p",
        text: "Every published methodologist agrees the question matters more than the method. The American Educational Research Association's standards for reporting empirical research start with the research problem and only then move to methods (AERA, 2006). A vague question — 'I want to study how students learn online' — produces a vague proposal. A precise question — 'Does retrieval-practice spacing in async chemistry courses improve six-week retention?' — produces a defendable one.",
        cite: ["aera-2006-standards"],
      },
      {
        type: "ul",
        items: [
          "Single-sentence research question, with operationalized terms",
          "Literature review — ten to twenty APA 7 citations, grouped by argument",
          "Methodology — design, participants, instruments, analysis plan",
          "Timeline with monthly milestones and committee check-ins",
          "Reference list with hanging indents and DOIs where available",
        ],
      },
      {
        type: "callout",
        title: "Pre-register the analysis",
        body: "Naming your planned statistical tests before data collection eliminates the hardest objection a committee can raise: that the result was found, not predicted. A two-line preregistration paragraph in the methodology section signals research literacy at the modern bar.",
      },
      { type: "h2", text: "Format is half the persuasion" },
      {
        type: "p",
        text: "Section numbering, serif body type, and hanging-indent references signal that the author has read enough journal articles to mimic the form. Hattie's work on academic writing instruction puts structural feedback at higher effect sizes than content feedback — the document teaches the committee how to read it (Hattie, 2009). Treat layout as part of the argument.",
        cite: ["hattie-2009-visible-learning"],
      },
      {
        type: "p",
        text: "Type the field, the question, and the months you have. The prompt builds the question statement, lit review skeleton, methodology, timeline, and APA 7 references — formatted so the committee reads it like the journal article it should one day become.",
      },
    ],
    citations: [
      {
        id: "aera-2006-standards",
        apa: "American Educational Research Association. (2006). Standards for reporting on empirical social science research in AERA publications. Educational Researcher, 35(6), 33-40. https://doi.org/10.3102/0013189X035006033",
        url: "https://doi.org/10.3102/0013189X035006033",
        type: "research",
      },
      {
        id: "hattie-2009-visible-learning",
        apa: "Hattie, J. (2009). Visible learning: A synthesis of over 800 meta-analyses relating to achievement. Routledge.",
        type: "book",
      },
      {
        id: "apa-2021-retrieval-practice",
        apa: "American Psychological Association. (2021). Publication manual of the American Psychological Association (7th ed.). APA. https://apastyle.apa.org/products/publication-manual-7th-edition",
        url: "https://apastyle.apa.org/products/publication-manual-7th-edition",
        type: "spec",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Graduate student writing at a desk surrounded by research papers",
        caption: "Photo on Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1200&q=80",
        alt: "Bookshelves lining a research library aisle",
        caption: "Research library — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=thesis%20proposal%20cover%20page%20apa%207",
        alt: "Browse thesis proposal layouts on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "reading-list": {
    richBody: [
      {
        type: "p",
        text: "A reading list worth posting on the wall earns its place by being curated, not collected. Fifteen to thirty titles, one line each, grouped by theme, with a checkmark column on the far right. The reader scans the page, picks one, reads it, ticks the box. A year later the page has coffee rings on it. That is the target.",
      },
      { type: "h2", text: "Curation beats comprehensiveness" },
      {
        type: "p",
        text: "UNESCO's Institute for Statistics tracks reading habits across more than 150 countries and finds the median adult reads fewer than five books a year (UNESCO Institute for Statistics, 2022). A list of fifty titles becomes wallpaper. A list of twenty becomes a plan. Pick fewer, annotate harder, and the list earns the wall.",
        cite: ["unesco-2022-literacy"],
      },
      {
        type: "ul",
        items: [
          "Fifteen to thirty books, each with author, year, one-line note",
          "Grouped into three to five themes — never one long list",
          "Star or checkmark column on the far right for tracking",
          "Optional 'why I picked this' line under each title",
          "Footer with total count and estimated total pages",
        ],
      },
      {
        type: "callout",
        title: "Annotations do the selling",
        body: "A one-line annotation that explains why the book matters to the reader — not what it is about — is the difference between a list that gets photographed and one that gets recycled. Promise a specific change: 'rewires how you think about feedback loops.'",
      },
      { type: "h2", text: "Layout for a wall, not a feed" },
      {
        type: "p",
        text: "Two columns, theme dividers in small-caps section titles, generous leading. The Chronicle of Higher Education has noted that successful campus reading programs share one design feature: their lists print well on a single sheet (Chronicle, 2022). A scrollable list on a phone produces zero finished books; a printed list on a fridge produces three or four.",
        cite: ["chronicle-2022-syllabus-design"],
      },
      {
        type: "p",
        text: "Type the topic, the audience, and the number of books. The prompt builds the themes, annotations, and tracking column — laid out on one sheet a reader will actually pin to the wall.",
      },
    ],
    citations: [
      {
        id: "unesco-2022-literacy",
        apa: "UNESCO Institute for Statistics. (2022). Literacy and reading habits: International comparisons. UNESCO. https://uis.unesco.org/en/topic/literacy",
        url: "https://uis.unesco.org/en/topic/literacy",
        type: "gov",
      },
      {
        id: "chronicle-2022-syllabus-design",
        apa: "Supiano, B. (2022, August 15). The syllabus as a teaching tool. The Chronicle of Higher Education. https://www.chronicle.com/article/the-syllabus-as-a-teaching-tool",
        url: "https://www.chronicle.com/article/the-syllabus-as-a-teaching-tool",
        type: "article",
      },
      {
        id: "edutopia-2023-lesson-design",
        apa: "Edutopia. (2023). 5 research-backed studying techniques for teachers to share with students. George Lucas Educational Foundation. https://www.edutopia.org/article/5-research-backed-studying-techniques",
        url: "https://www.edutopia.org/article/5-research-backed-studying-techniques",
        type: "article",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Bookshelves filled with hardcover books in a university library",
        caption: "Photo on Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
        alt: "Library bookshelves stretching down a long aisle",
        caption: "Library aisle — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=annotated%20reading%20list%20poster%20design",
        alt: "Browse annotated reading list designs on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },

  "field-trip-permission": {
    richBody: [
      {
        type: "p",
        text: "The permission slip that comes back signed on the first day is the one a parent could fill out at the kitchen counter in 30 seconds. Destination, date, cost, transport, emergency contact, signature. Big fields, friendly tone, one piece of paper. Anything more becomes the slip that lives in a backpack for two weeks before being lost.",
      },
      { type: "h2", text: "What parents actually scan for" },
      {
        type: "p",
        text: "The US Department of Education's family engagement research consistently finds that short, clear school communications return at significantly higher rates than long, formal ones (US Department of Education, 2022). Parents read the destination, the date, and the cost. Everything else has to earn its place — and most of it does not.",
        cite: ["doe-2022-family-engagement"],
      },
      {
        type: "ul",
        items: [
          "Destination, date, and cost in the top inch of the page",
          "Departure and return times — the answer to the carpool question",
          "What to bring and what to leave at home",
          "Emergency contact field, daytime phone, allergy line",
          "Parent or guardian signature with date",
        ],
      },
      {
        type: "callout",
        title: "Tear-off return slip",
        body: "Print the form once at the top and a tear-off slip at the bottom with just the name, signature, and date. Parents keep the top half for the calendar; the school gets the bottom half back. Return rates climb and the office stops chasing signatures the morning of the trip.",
      },
      { type: "h2", text: "Tone changes return rates" },
      {
        type: "p",
        text: "Edutopia has documented that warm, plain-language school forms outperform legalistic ones on every measurable return metric (Edutopia, 2023). Skip the 'hereby authorizes' construction. 'I give permission for my child to attend' reads the same legally and lands better at the kitchen counter. A friendly accent color helps the slip stand out in a stack of math homework.",
        cite: ["edutopia-2023-lesson-design"],
      },
      {
        type: "p",
        text: "Type the destination, date, cost, and grade. The prompt builds the slip with all the fields, the tear-off return strip, and a tone parents will recognize as a school they trust — printed on one sheet that fits in a backpack.",
      },
    ],
    citations: [
      {
        id: "doe-2022-family-engagement",
        apa: "U.S. Department of Education. (2022). Partners in education: A dual capacity-building framework for family-school partnerships. U.S. Department of Education. https://www.ed.gov/parent-and-family-engagement",
        url: "https://www.ed.gov/parent-and-family-engagement",
        type: "gov",
      },
      {
        id: "edutopia-2023-lesson-design",
        apa: "Edutopia. (2023). 5 research-backed studying techniques for teachers to share with students. George Lucas Educational Foundation. https://www.edutopia.org/article/5-research-backed-studying-techniques",
        url: "https://www.edutopia.org/article/5-research-backed-studying-techniques",
        type: "article",
      },
      {
        id: "nces-2023-school-data",
        apa: "National Center for Education Statistics. (2023). Digest of education statistics, 2022. U.S. Department of Education. https://nces.ed.gov/programs/digest/",
        url: "https://nces.ed.gov/programs/digest/",
        type: "gov",
      },
    ],
    mediaGallery: [
      {
        source: "pexels",
        kind: "photo",
        src: "https://images.pexels.com/photos/8197497/pexels-photo-8197497.jpeg?auto=compress&cs=tinysrgb&w=1200",
        alt: "Yellow school bus parked outside a school building",
        caption: "Photo on Pexels",
        attribution: "Pexels License",
        width: 1200,
        height: 800,
      },
      {
        source: "unsplash",
        kind: "illustration",
        src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
        alt: "Students walking together on a school outing",
        caption: "Students on a school outing — Unsplash",
        attribution: "Unsplash License",
        width: 1200,
        height: 800,
      },
      {
        source: "google",
        kind: "search-deeplink",
        href: "https://www.google.com/search?tbm=isch&q=school%20field%20trip%20permission%20slip%20template",
        alt: "Browse permission slip templates on Google Images",
        caption: "Browse more inspiration on Google Images",
        attribution: "Google Images search",
      },
    ],
  },
};
