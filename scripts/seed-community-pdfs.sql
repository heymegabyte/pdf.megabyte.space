-- Megabyte PDF — community seed data
-- Idempotent. Inserts 1 showcase user + 8 public PDFs across diverse categories.
-- Apply locally:  npm run db:seed:local
-- Apply to prod:  npm run db:seed:prod   (requires explicit confirmation)

INSERT OR IGNORE INTO users (id, email, name, plan, edit_credits, created_at, updated_at)
VALUES (
  'u_showcase01',
  'showcase@megabyte.space',
  'Megabyte Showcase',
  'pro',
  9999,
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- 1) Stripe-style invoice ----------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfinvoice01',
  'u_showcase01',
  'Stripe-style invoice — Megabyte Labs',
  '<header><div class="brand"><span class="dot"></span><span>Megabyte Labs</span></div><div class="meta"><div><strong>Invoice</strong> #MB-2026-0317</div><div>Issued May 11, 2026 · Due May 25, 2026</div></div></header><section class="grid"><div><h3>Billed to</h3><p>Acme Industries Inc.<br/>2200 Market Street, Suite 900<br/>Philadelphia, PA 19103<br/>billing@acme.example</p></div><div><h3>From</h3><p>Megabyte Labs LLC<br/>1 Penn Plaza, 36th Floor<br/>New York, NY 10001<br/>hey@megabyte.space</p></div></section><table><thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead><tbody><tr><td>Design system retainer — May 2026</td><td class="num">1</td><td class="num">$8,000</td><td class="num">$8,000</td></tr><tr><td>Component library v2 — implementation</td><td class="num">40 hrs</td><td class="num">$185</td><td class="num">$7,400</td></tr><tr><td>QA + launch support</td><td class="num">8 hrs</td><td class="num">$185</td><td class="num">$1,480</td></tr></tbody></table><section class="totals"><div><span>Subtotal</span><span>$16,880.00</span></div><div><span>Tax (NY 8.875%)</span><span>$1,498.10</span></div><div class="grand"><span>Total due</span><span>$18,378.10</span></div></section><footer><p>Pay by ACH to routing 021000089, account 9889-0421. Net-14 terms — thank you.</p></footer>',
  '@page { size: Letter; margin: 0.75in; } body { font-family: Inter, system-ui, sans-serif; color: #0b1220; font-size: 11pt; line-height: 1.5; } header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #635bff; padding-bottom: 18px; margin-bottom: 28px; } .brand { display: flex; align-items: center; gap: 8px; font-size: 14pt; font-weight: 700; letter-spacing: -0.01em; } .dot { width: 14px; height: 14px; border-radius: 4px; background: linear-gradient(135deg, #635bff, #00d4ff); } .meta { text-align: right; font-size: 9.5pt; color: #4b5563; } .meta strong { color: #0b1220; font-size: 12pt; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; } h3 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.12em; color: #6b7280; margin: 0 0 8px; } table { width: 100%; border-collapse: collapse; margin-bottom: 18px; } th { text-align: left; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; padding: 10px 0; border-bottom: 1px solid #e5e7eb; } td { padding: 12px 0; border-bottom: 1px solid #f1f5f9; } .num { text-align: right; font-variant-numeric: tabular-nums; } .totals { margin-left: auto; width: 320px; } .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-variant-numeric: tabular-nums; } .totals .grand { border-top: 2px solid #0b1220; margin-top: 6px; padding-top: 12px; font-weight: 700; font-size: 13pt; } footer { margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #6b7280; }',
  'Letter', '0.75in', 'inv-mb26', 1, 1247, 18, 1,
  'A clean Stripe-inspired invoice with tax breakdown, ACH details, and a violet-cyan brand mark. Pay-by-prompt in 30 seconds.',
  'invoice,business,billing,template,stripe',
  0,
  unixepoch() * 1000 - 86400000 * 9,
  unixepoch() * 1000 - 86400000 * 2
);

-- 2) Designer résumé ----------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfresume001',
  'u_showcase01',
  'Designer résumé — two-column, cinematic',
  '<header><h1>Marisol Quintero</h1><p class="role">Senior product designer · NYC</p><p class="meta">marisol@quintero.studio · marisol-design.co · +1 (212) 555-0117</p></header><main><aside><section><h3>Toolbox</h3><ul><li>Figma, Framer, FigJam</li><li>SwiftUI, Webflow, GSAP</li><li>Design systems, motion, prototyping</li><li>User research + lab studies</li></ul></section><section><h3>Education</h3><p><strong>RISD</strong><br/>BFA Graphic Design, 2017</p></section><section><h3>Selected awards</h3><ul><li>Awwwards SOTM · 2024</li><li>Apple Design Award shortlist · 2023</li><li>Fast Co. Innovation by Design · 2022</li></ul></section></aside><section class="main-col"><h2>About</h2><p>Designer with eight years shipping native iOS, web, and design systems for healthcare and finance products. I lead from the prototype — motion, prose, and pixels in one loop.</p><h2>Experience</h2><article><div class="row"><h3>Linear · Staff Product Designer</h3><span>2023 — Present</span></div><ul><li>Owned the iPad app from blank repo to 90k DAU in six months.</li><li>Shipped Linear''s motion language: 47 reusable timing tokens, used across 14 surfaces.</li><li>Mentored four mid-level designers; two promoted to senior.</li></ul></article><article><div class="row"><h3>Square · Senior Product Designer</h3><span>2019 — 2023</span></div><ul><li>Led Cash for Business identity refresh — +24% activation lift.</li><li>Built the Square Online checkout component set, 32 components, 11 tokens.</li></ul></article><article><div class="row"><h3>Apple · Visual Designer</h3><span>2017 — 2019</span></div><ul><li>iOS 12 system app contributions — Reminders, Notes, Files.</li></ul></article></section></main>',
  '@page { size: Letter; margin: 0.6in; } body { font-family: "EB Garamond", Georgia, serif; color: #0c0f14; font-size: 10.5pt; line-height: 1.45; } header { border-bottom: 1px solid #0c0f14; padding-bottom: 18px; margin-bottom: 22px; } h1 { font-size: 32pt; margin: 0; letter-spacing: -0.02em; font-weight: 600; } .role { margin: 4px 0 2px; font-size: 13pt; color: #635050; font-style: italic; } .meta { font-size: 9.5pt; color: #6b6b6b; margin: 0; } main { display: grid; grid-template-columns: 200px 1fr; gap: 32px; } aside h3, .main-col h2 { font-family: Inter, sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.16em; color: #8b6b3d; margin: 16px 0 8px; } aside ul, .main-col ul { padding: 0; list-style: none; } aside li, .main-col li { font-size: 10pt; margin-bottom: 4px; } .main-col article { margin-bottom: 16px; } .row { display: flex; justify-content: space-between; align-items: baseline; } .row h3 { font-family: Inter, sans-serif; font-size: 11pt; margin: 0; font-weight: 600; } .row span { font-size: 9.5pt; color: #8b6b3d; font-variant-numeric: tabular-nums; } .main-col li { line-height: 1.45; }',
  'Letter', '0.6in', 'res-mq01', 1, 2103, 31, 1,
  'A two-column résumé in Garamond + Inter — left rail for tools and awards, right side a narrative of impact with numbers, not noise.',
  'resume,design,career,template,creative',
  0,
  unixepoch() * 1000 - 86400000 * 14,
  unixepoch() * 1000 - 86400000 * 3
);

-- 3) Wedding invitation -------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfwedding01',
  'u_showcase01',
  'Wedding invitation — botanical, gilded',
  '<section class="card"><p class="kicker">Together with their families</p><h1>Camille Beauchamp<span>&amp;</span>Jonah Whitlock</h1><p class="invite">request the honour of your presence at the celebration of their marriage</p><div class="rule"></div><p class="when"><strong>Saturday, the twenty-third of August<br/>two thousand twenty-six</strong></p><p class="time">four o''clock in the afternoon</p><div class="rule"></div><p class="where"><strong>Hudson Valley Estate</strong><br/>2200 River Road, Garrison, New York</p><p class="footer">Reception to follow · Black-tie optional · rsvp@beauchampwhitlock.com</p></section>',
  '@page { size: A5; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #faf6ef; font-family: "Cormorant Garamond", "Cormorant", Georgia, serif; color: #2b231d; } .card { width: 100%; max-width: 540px; padding: 56px 48px; text-align: center; background: radial-gradient(800px 400px at 50% 0%, #ecdfb8 0%, transparent 60%), #faf6ef; border: 1px solid #d4af6a; } .kicker { font-family: "Cormorant", serif; font-style: italic; font-size: 11pt; letter-spacing: 0.1em; color: #7c613a; margin: 0 0 28px; } h1 { font-size: 38pt; line-height: 1.05; margin: 0 0 8px; font-weight: 500; letter-spacing: -0.01em; } h1 span { display: block; font-style: italic; font-size: 24pt; color: #c0913e; margin: 6px 0; font-weight: 400; } .invite { font-size: 12pt; line-height: 1.6; max-width: 36ch; margin: 18px auto 26px; font-style: italic; } .rule { width: 60px; height: 1px; background: #c0913e; margin: 18px auto; } .when { font-size: 13pt; margin: 8px 0 4px; } .time { font-style: italic; color: #7c613a; margin: 0 0 4px; } .where { font-size: 12pt; margin: 12px 0; line-height: 1.5; } .footer { font-size: 9.5pt; color: #7c613a; margin-top: 28px; letter-spacing: 0.04em; }',
  'A5', '0in', 'wed-cb26', 1, 3984, 12, 1,
  'A botanical-gilded wedding invite in Cormorant Garamond — A5, centered card, hairline gold rule, italic kicker line.',
  'wedding-invitation,event,personal,invitation,template',
  0,
  unixepoch() * 1000 - 86400000 * 21,
  unixepoch() * 1000 - 86400000 * 5
);

-- 4) 5th-grade lesson plan ----------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdflesson001',
  'u_showcase01',
  '5th-grade lesson plan — fractions through pizza',
  '<header><p class="kicker">Math · Grade 5 · 45 minutes</p><h1>Fractions through pizza</h1><p class="meta">Ms. Avery Park · May 13, 2026 · Room 207</p></header><section><h2>Learning objective</h2><p>Students will represent, compare, and add fractions with unlike denominators using pizza models, then transfer the strategy to a written equation.</p><h2>Common Core</h2><ul><li>5.NF.A.1 — Add and subtract fractions with unlike denominators.</li><li>5.NF.B.4 — Apply previous understanding of multiplication to multiply a fraction by a whole number.</li></ul></section><section><h2>Lesson flow</h2><table><tr><th>Time</th><th>What we do</th><th>Why</th></tr><tr><td>0–5 min</td><td>Hook: show a pizza cut into eighths. "If I eat 3 slices, what fraction is left?"</td><td>Activate prior knowledge, get hands raised.</td></tr><tr><td>5–15 min</td><td>I do: model 1/2 + 1/4 with paper pizzas on the doc-cam. Show the missing common-denominator step.</td><td>Explicit instruction with concrete representation.</td></tr><tr><td>15–28 min</td><td>We do: pairs solve 3 problems using printed pizza tiles. Circulate.</td><td>Guided practice, observe misconceptions.</td></tr><tr><td>28–40 min</td><td>You do: independent worksheet (8 problems, scaffolded difficulty).</td><td>Check for understanding.</td></tr><tr><td>40–45 min</td><td>Exit ticket: solve 2/3 + 1/6 and explain in one sentence.</td><td>Formative data for tomorrow.</td></tr></table></section><section><h2>Materials</h2><ul><li>Pre-cut paper pizzas (8 sets of 6 sizes)</li><li>Practice worksheet (24 copies)</li><li>Exit ticket (24 copies)</li></ul><h2>Differentiation</h2><p><strong>Below grade:</strong> Start with halves and quarters only. <strong>Above grade:</strong> Introduce mixed numbers and conversion challenges. <strong>EL:</strong> Visual word bank — denominator, numerator, equivalent.</p></section>',
  '@page { size: Letter; margin: 0.7in; } body { font-family: "Source Sans 3", system-ui, sans-serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.55; } header { border-left: 5px solid #ef4444; padding-left: 18px; margin-bottom: 24px; } .kicker { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.14em; color: #ef4444; margin: 0; font-weight: 600; } h1 { font-family: "Source Serif 4", Georgia, serif; font-size: 26pt; margin: 4px 0 6px; letter-spacing: -0.01em; line-height: 1.1; } .meta { font-size: 10pt; color: #6b7280; margin: 0; } h2 { font-family: "Source Serif 4", Georgia, serif; font-size: 14pt; margin: 22px 0 8px; color: #b91c1c; } table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; font-size: 10pt; } th { text-align: left; background: #fef2f2; padding: 10px 12px; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #b91c1c; } td { padding: 10px 12px; vertical-align: top; border-bottom: 1px solid #fee2e2; } td:first-child { font-weight: 600; white-space: nowrap; color: #b91c1c; font-variant-numeric: tabular-nums; } ul { margin: 8px 0 12px 18px; padding: 0; } li { margin-bottom: 4px; }',
  'Letter', '0.7in', 'lsn-ap26', 1, 612, 9, 1,
  'A one-page Grade 5 fractions lesson with Common Core mapping, a five-block timeline, materials list, and differentiation notes for EL and above-grade learners.',
  'lesson-plan,education,teacher,template,math',
  0,
  unixepoch() * 1000 - 86400000 * 7,
  unixepoch() * 1000 - 86400000 * 1
);

-- 5) Restaurant menu card -----------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfmenu00001',
  'u_showcase01',
  'Bistro Lune — supper menu, single page',
  '<header><h1>Bistro Lune</h1><p class="tag">A neighbourhood supper menu · Spring 2026</p></header><main><section><h2>Pour Commencer</h2><div class="dish"><div class="line"><span>Heirloom tomato &amp; burrata</span><span class="price">17</span></div><p>Basil oil, sea salt, charred sourdough.</p></div><div class="dish"><div class="line"><span>Soupe à l''oignon</span><span class="price">14</span></div><p>Slow-caramelised onions, Comté, sherry.</p></div><div class="dish"><div class="line"><span>Steak tartare</span><span class="price">22</span></div><p>Capers, shallot, brioche toast, quail egg.</p></div></section><section><h2>Plats Principaux</h2><div class="dish"><div class="line"><span>Coq au vin</span><span class="price">32</span></div><p>Pinot Noir reduction, lardons, pearl onions, pommes purée.</p></div><div class="dish"><div class="line"><span>Magret de canard</span><span class="price">38</span></div><p>Five-spice glaze, blood-orange jus, fennel.</p></div><div class="dish"><div class="line"><span>Risotto aux champignons</span><span class="price">26</span></div><p>Wild mushrooms, parmesan, brown butter, thyme.</p></div><div class="dish"><div class="line"><span>Loup de mer</span><span class="price">36</span></div><p>Whole roasted, fennel pollen, salsa verde.</p></div></section><section><h2>Pour Finir</h2><div class="dish"><div class="line"><span>Tarte au citron</span><span class="price">12</span></div><p>Brûléed Meyer lemon, almond crumble.</p></div><div class="dish"><div class="line"><span>Crème brûlée</span><span class="price">11</span></div><p>Madagascar vanilla, demerara crust.</p></div><div class="dish"><div class="line"><span>Selection of cheese</span><span class="price">18</span></div><p>Three cheeses, fig jam, walnut crackers.</p></div></section></main><footer><p>Service compris. Wine pairings available — ask Etienne.</p></footer>',
  '@page { size: A4; margin: 0.6in; } body { font-family: "Cormorant Garamond", Georgia, serif; color: #20191a; font-size: 11pt; line-height: 1.45; background: #fdfaf3; } header { text-align: center; border-bottom: 1px solid #20191a; padding-bottom: 14px; margin-bottom: 28px; } h1 { font-size: 38pt; margin: 0; font-style: italic; font-weight: 500; letter-spacing: -0.01em; } .tag { font-style: italic; color: #7c5e35; font-size: 11pt; margin: 4px 0 0; } main { columns: 1; column-gap: 28px; } h2 { font-size: 14pt; font-style: italic; text-align: center; color: #7c5e35; margin: 24px 0 12px; letter-spacing: 0.04em; } .dish { margin-bottom: 12px; break-inside: avoid; } .line { display: flex; justify-content: space-between; align-items: baseline; font-size: 12pt; font-weight: 600; } .line::after { display: none; } .price { font-variant-numeric: tabular-nums; color: #7c5e35; } .dish p { margin: 2px 0 0; font-size: 10pt; color: #4b3e2c; font-style: italic; } footer { margin-top: 32px; text-align: center; font-style: italic; font-size: 10pt; color: #7c5e35; }',
  'A4', '0.6in', 'men-bl26', 1, 1567, 22, 1,
  'A single-page French bistro supper menu in Cormorant Garamond — three sections, hairline rule, italic dish descriptions, no clutter.',
  'menu-card,restaurant,food,template,hospitality',
  0,
  unixepoch() * 1000 - 86400000 * 18,
  unixepoch() * 1000 - 86400000 * 4
);

-- 6) Press release ------------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfpress0001',
  'u_showcase01',
  'Press release — Series B announcement',
  '<header><p class="ff">FOR IMMEDIATE RELEASE</p><p class="date">May 11, 2026 · New York, NY</p></header><h1>Megabyte Labs Raises $24M Series B to Make Document Design as Fast as Typing</h1><p class="lede">Funding led by Index Ventures will expand Megabyte''s AI design pipeline and grow the team from 14 to 32 by year-end.</p><p>NEW YORK — Megabyte Labs, the AI-native document studio behind <em>Megabyte PDF</em> and <em>Megabyte Slides</em>, today announced a $24M Series B led by Index Ventures, with participation from existing investors Cowboy Ventures, Lightspeed, and Y Combinator. The round brings total funding to $38M.</p><p>"PDF is a $4.2B market that hasn''t had a real product cycle in 25 years," said founder Brian Zalewski. "Designers shouldn''t need eight tabs and a license to make a one-page document. You should type it."</p><h2>Product traction</h2><ul><li>180,000 weekly active users, up 4.6× since seed.</li><li>11M PDFs generated in the last 90 days.</li><li>Average user time-to-PDF: 32 seconds from blank prompt.</li></ul><h2>What''s next</h2><p>Series B funding will accelerate three pillars: a Mac-native renderer for offline-first export, a templates marketplace for designers, and an enterprise tier with SSO and audit logs. Megabyte plans to open offices in London and Berlin in Q4 2026.</p><h2>About Megabyte Labs</h2><p>Megabyte Labs builds AI-first creative tooling for everyone who has to look professional on a Tuesday. Founded in 2024 in New York. <strong>Press contact:</strong> press@megabyte.space.</p><p class="end">— ### —</p>',
  '@page { size: Letter; margin: 0.85in; } body { font-family: "Times New Roman", Times, serif; color: #0a0a0a; font-size: 11.5pt; line-height: 1.6; } header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0a0a0a; padding-bottom: 10px; margin-bottom: 18px; } .ff { font-family: Inter, sans-serif; font-weight: 700; letter-spacing: 0.18em; font-size: 9.5pt; margin: 0; } .date { font-size: 10pt; color: #4b5563; margin: 0; } h1 { font-size: 22pt; line-height: 1.18; letter-spacing: -0.012em; margin: 0 0 12px; } .lede { font-size: 13pt; line-height: 1.5; color: #1f2937; font-style: italic; margin: 0 0 22px; } h2 { font-family: Inter, sans-serif; font-size: 12pt; margin: 22px 0 8px; letter-spacing: -0.01em; } ul { margin: 8px 0 14px 22px; padding: 0; } li { margin-bottom: 4px; } p { margin: 0 0 12px; } .end { text-align: center; letter-spacing: 0.4em; color: #6b7280; margin-top: 24px; }',
  'Letter', '0.85in', 'prs-mb26', 1, 421, 7, 1,
  'A wire-ready Series B announcement — embargo line, dateline, lede, three traction bullets, a Q4 plan, and a boilerplate close.',
  'press-release,marketing,template,announcement,pr',
  0,
  unixepoch() * 1000 - 86400000 * 1,
  unixepoch() * 1000 - 3600000 * 8
);

-- 7) Quarterly business report ------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfquart0001',
  'u_showcase01',
  'Q1 2026 quarterly report — executive summary',
  '<header><div class="badge">Q1 · FY2026</div><h1>Quarterly business review</h1><p class="meta">Megabyte Labs · April 1 – April 30, 2026 · Confidential</p></header><section class="hero"><div class="stat"><div class="num">$1.4M</div><div class="lbl">ARR</div><div class="delta up">+38% QoQ</div></div><div class="stat"><div class="num">182,000</div><div class="lbl">WAU</div><div class="delta up">+22% QoQ</div></div><div class="stat"><div class="num">94%</div><div class="lbl">Gross margin</div><div class="delta flat">+1 pt</div></div><div class="stat"><div class="num">11.4M</div><div class="lbl">PDFs generated</div><div class="delta up">+41% QoQ</div></div></section><section><h2>Highlights</h2><ul><li>Closed Series B led by Index Ventures — $24M at a $185M post.</li><li>Shipped v2 editor + 50-template library — adoption: 73% of WAU.</li><li>Enterprise pilot with three Fortune 500s; first contract signed at $96k ACV.</li></ul></section><section><h2>What slipped</h2><ul><li>iOS app delayed to Q3 — engineering hire didn''t convert; restarted recruiting.</li><li>SOC 2 Type I audit pushed to mid-Q2 — 18-day gap on policy docs.</li></ul></section><section><h2>Q2 priorities</h2><ol><li><strong>Enterprise GA.</strong> SSO, audit logs, custom domains. Target $300k new ACV.</li><li><strong>Templates marketplace.</strong> Onboard 50 designers; 80/20 rev share.</li><li><strong>Edge rendering.</strong> Cut PDF latency from 1.4s to under 600ms p95.</li></ol></section>',
  '@page { size: Letter; margin: 0.7in; } body { font-family: Inter, system-ui, sans-serif; color: #0b1220; font-size: 10.5pt; line-height: 1.55; } header { border-bottom: 1px solid #e5e7eb; padding-bottom: 18px; margin-bottom: 24px; } .badge { display: inline-block; background: #0b1220; color: #fff; font-size: 9pt; letter-spacing: 0.16em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; font-weight: 600; } h1 { font-family: "Space Grotesk", Inter, sans-serif; font-size: 30pt; margin: 12px 0 6px; letter-spacing: -0.025em; font-weight: 600; line-height: 1.05; } .meta { font-size: 10pt; color: #6b7280; margin: 0; } .hero { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 6px 0 26px; } .stat { background: linear-gradient(180deg, #f8fafc, #fff); border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; } .stat .num { font-family: "Space Grotesk", Inter, sans-serif; font-size: 22pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1; color: #0b1220; } .stat .lbl { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; margin-top: 6px; } .delta { font-size: 9.5pt; margin-top: 6px; font-weight: 600; } .delta.up { color: #15803d; } .delta.flat { color: #6b7280; } h2 { font-family: "Space Grotesk", Inter, sans-serif; font-size: 14pt; margin: 22px 0 8px; letter-spacing: -0.01em; } ul, ol { margin: 8px 0 12px 20px; padding: 0; } li { margin-bottom: 5px; }',
  'Letter', '0.7in', 'qrt-mb26', 1, 894, 14, 1,
  'A four-stat hero, three highlights, two slipped items, three Q2 priorities — the quarterly board read in one page.',
  'report,business,executive,template,quarterly',
  0,
  unixepoch() * 1000 - 86400000 * 4,
  unixepoch() * 1000 - 86400000 * 1
);

-- 8) Kids birthday party invite ----------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfbirth0001',
  'u_showcase01',
  'Kids birthday invite — dinosaur dig party',
  '<section class="invite"><p class="kicker">You are invited to a</p><h1>Dinosaur Dig Party!</h1><p class="age">to celebrate <span>Theo turning 6</span></p><div class="card"><div class="row"><div class="lbl">When</div><div class="val">Saturday, June 14, 2026<br/>2:00 — 4:00 pm</div></div><div class="row"><div class="lbl">Where</div><div class="val">123 Maple Avenue<br/>Brooklyn, NY 11215</div></div><div class="row"><div class="lbl">Wear</div><div class="val">Clothes you can get muddy in!</div></div></div><p class="rsvp">RSVP by June 7 → 718-555-0173 · maya@theofamily.com</p><p class="extra">There will be a fossil dig, a T-Rex piñata, and dinosaur-egg cake. Bring your inner paleontologist.</p></section>',
  '@page { size: 5in 7in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%); font-family: "Fredoka", "Comic Neue", "Comic Sans MS", system-ui, sans-serif; color: #1f2937; } .invite { width: 100%; max-width: 420px; padding: 36px 32px; text-align: center; } .kicker { font-size: 12pt; letter-spacing: 0.16em; text-transform: uppercase; color: #b45309; margin: 0 0 6px; font-weight: 700; } h1 { font-size: 32pt; line-height: 1.05; margin: 0 0 8px; color: #15803d; letter-spacing: -0.02em; transform: rotate(-2deg); text-shadow: 3px 3px 0 #fde68a; } .age { font-size: 14pt; margin: 6px 0 22px; color: #1f2937; } .age span { font-weight: 700; color: #b45309; } .card { background: #fff; border: 3px solid #15803d; border-radius: 18px; padding: 18px 20px; margin: 0 auto 18px; text-align: left; } .row { display: grid; grid-template-columns: 68px 1fr; gap: 12px; padding: 8px 0; align-items: center; } .row + .row { border-top: 1px dashed #d1d5db; } .lbl { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.1em; color: #b45309; font-weight: 700; } .val { font-size: 11.5pt; line-height: 1.35; } .rsvp { font-size: 11pt; color: #15803d; font-weight: 700; margin: 4px 0 12px; } .extra { font-size: 10pt; line-height: 1.5; color: #4b5563; margin: 0 auto; max-width: 32ch; }',
  '5in 7in', '0in', 'brt-th26', 1, 762, 11, 1,
  'A 5×7 kids birthday invite with a green-and-gold paleontology theme — RSVP card, dashed dividers, and a slightly tilted hero title.',
  'party-invitation,kids,event,birthday,template',
  0,
  unixepoch() * 1000 - 86400000 * 11,
  unixepoch() * 1000 - 86400000 * 6
);

-- 9) Consulting proposal ------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfprop00001',
  'u_showcase01',
  'Consulting proposal — brand sprint',
  '<header><div class="brand"><span class="dot"></span><span>Halcyon Studio</span></div><div class="num">Proposal · HS-2026-042</div></header><section class="hero"><p class="kicker">Prepared for Acme Industries</p><h1>Two-week brand sprint &amp; visual identity</h1><p class="meta">Submitted May 11, 2026 · Valid 14 days · Brian Zalewski, Principal</p></section><section><h2>The work</h2><p>Halcyon will run a focused two-week sprint to define Acme''s next-decade visual identity: positioning, logo system, type, color, and a 24-page brand book that the team can hand to any agency and ship.</p><ol><li><strong>Discovery (days 1–3).</strong> Stakeholder interviews, competitive audit, three positioning tracks.</li><li><strong>Design (days 4–9).</strong> Logo system, type, color, motion principles. Two rounds of revision.</li><li><strong>System (days 10–14).</strong> Brand book, asset library, launch handoff.</li></ol></section><section class="grid"><div><h3>Deliverables</h3><ul><li>24-page brand book (PDF)</li><li>Logo lockups (SVG, PNG, AI)</li><li>Type + color tokens (Figma + CSS)</li><li>Motion principles (12-page guide)</li></ul></div><div><h3>Timeline &amp; investment</h3><p class="big">$48,000</p><p class="sub">Two-week sprint · Net-15 terms</p><p>50% on kickoff, 50% on delivery. Includes one round of post-delivery polish.</p></div></section><section><h2>Why us</h2><p>Halcyon has built brand systems for Notion, Vercel, and Linear. Three of our last four sprints shipped under deadline. We work fast because we work focused — one client, one sprint at a time.</p></section><footer><p>Signed: ____________________________ Date: __________ · Reply YES to this email to begin.</p></footer>',
  '@page { size: Letter; margin: 0.85in; } body { font-family: "Inter", system-ui, sans-serif; color: #0b1220; font-size: 11pt; line-height: 1.55; } header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 26px; } .brand { display: flex; align-items: center; gap: 10px; font-size: 13pt; font-weight: 700; letter-spacing: -0.01em; } .dot { width: 14px; height: 14px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #60a5fa); } .num { font-family: ui-monospace, "SF Mono", monospace; font-size: 10pt; color: #6b7280; letter-spacing: 0.05em; } .hero { margin-bottom: 26px; } .kicker { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.16em; color: #2563eb; margin: 0 0 6px; font-weight: 600; } h1 { font-size: 30pt; margin: 0 0 8px; letter-spacing: -0.022em; font-weight: 700; line-height: 1.08; } .meta { color: #6b7280; font-size: 10pt; margin: 0; } h2 { font-size: 14pt; margin: 22px 0 10px; letter-spacing: -0.01em; } h3 { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; margin: 0 0 8px; } ol { margin: 8px 0 14px 22px; padding: 0; } ol li { margin-bottom: 6px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 14px 0 20px; padding: 18px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; } .big { font-size: 26pt; font-weight: 700; margin: 0; letter-spacing: -0.02em; color: #2563eb; line-height: 1; } .sub { font-size: 10pt; color: #6b7280; margin: 4px 0 8px; } ul { margin: 4px 0 0 18px; padding: 0; } li { margin-bottom: 4px; } footer { margin-top: 36px; padding-top: 18px; border-top: 1px dashed #cbd5e1; font-size: 10pt; color: #475569; font-style: italic; }',
  'Letter', '0.85in', 'pro-hs26', 1, 543, 9, 1,
  'A two-week brand sprint proposal — kickoff, scope, three-phase plan, deliverables block, investment $48k, hand-signature footer.',
  'proposal,consulting,business,template,sales',
  0,
  unixepoch() * 1000 - 86400000 * 6,
  unixepoch() * 1000 - 86400000 * 2
);

-- 10) Web design proposal -----------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfprop00002',
  'u_showcase01',
  'Website redesign proposal — Maple &amp; Oak Bakery',
  '<header><h1>Website redesign</h1><p class="sub">A new home for Maple &amp; Oak Bakery</p></header><section class="meta"><div><h4>Prepared for</h4><p>Lena Park · Maple &amp; Oak Bakery</p></div><div><h4>Prepared by</h4><p>Cedar Studio · hello@cedarstudio.co</p></div><div><h4>Date</h4><p>May 11, 2026</p></div><div><h4>Valid through</h4><p>June 8, 2026</p></div></section><section><h2>The opportunity</h2><p>Maple &amp; Oak has built a beloved bakery — 18,000 Instagram followers, 4.9 stars across 600+ reviews, and a waitlist for the croissant subscription. The website is from 2019 and doesn''t match the brand. We''ll fix that.</p></section><section><h2>Scope</h2><div class="scope"><div class="row"><span>Brand-aligned design system</span><span>$3,800</span></div><div class="row"><span>10-page Webflow build (mobile-first)</span><span>$5,600</span></div><div class="row"><span>E-commerce + subscription checkout (Stripe + Shopify)</span><span>$3,200</span></div><div class="row"><span>SEO + analytics setup</span><span>$1,400</span></div><div class="row total"><span>Total</span><span>$14,000</span></div></div><p class="note">50% on signature, 50% on launch. Six weeks from kickoff to live.</p></section><section><h2>What''s next</h2><p>Reply to confirm and we''ll send a kickoff form + first invoice within 24 hours. Questions: hello@cedarstudio.co · (415) 555-0182.</p></section>',
  '@page { size: Letter; margin: 0.8in; } body { font-family: "EB Garamond", Georgia, serif; color: #1c1917; font-size: 11pt; line-height: 1.55; } header { border-bottom: 1px solid #1c1917; padding-bottom: 14px; margin-bottom: 20px; } h1 { font-size: 36pt; margin: 0; letter-spacing: -0.02em; font-weight: 600; line-height: 1; } .sub { font-style: italic; color: #78716c; margin: 6px 0 0; font-size: 13pt; } .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 14px 0; border-bottom: 1px solid #e7e5e4; margin-bottom: 18px; } .meta h4 { font-family: "Inter", sans-serif; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.14em; color: #a8a29e; margin: 0 0 4px; } .meta p { margin: 0; font-size: 10pt; line-height: 1.4; } h2 { font-size: 15pt; margin: 22px 0 8px; font-family: "EB Garamond", Georgia, serif; font-weight: 600; letter-spacing: -0.01em; color: #c2410c; } .scope { border: 1px solid #e7e5e4; border-radius: 8px; padding: 4px 16px; margin: 8px 0 8px; } .row { display: flex; justify-content: space-between; align-items: baseline; padding: 12px 0; border-bottom: 1px solid #f5f5f4; font-variant-numeric: tabular-nums; } .row:last-child { border-bottom: 0; } .row.total { font-weight: 700; font-size: 13pt; padding: 14px 0; border-top: 1px solid #1c1917; margin-top: 6px; } .note { font-style: italic; font-size: 10pt; color: #78716c; margin: 4px 0 0; }',
  'Letter', '0.8in', 'pro-co26', 1, 372, 6, 1,
  'A warm, type-led web redesign proposal — opportunity, scoped line items totaling $14k, signature-ready close — built for boutique studios.',
  'proposal,web-design,client,template,sales',
  0,
  unixepoch() * 1000 - 86400000 * 13,
  unixepoch() * 1000 - 86400000 * 4
);

-- 11) Certificate of completion -----------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfcert00001',
  'u_showcase01',
  'Certificate of completion — UX bootcamp',
  '<div class="card"><div class="border"><div class="seal">★</div><p class="presents">This is to certify that</p><h1>Adaobi Okonkwo</h1><p class="middle">has successfully completed the twelve-week</p><h2>Foundations of User Experience Design</h2><p class="program">a 144-hour intensive in user research, interaction design, prototyping, and inclusive design practice.</p><div class="rule"></div><div class="signs"><div><p class="name">Dr. Priya Mehta</p><p class="role">Program Director</p></div><div><p class="name">Marcus Yi</p><p class="role">Head of Curriculum</p></div></div><p class="footer">Issued May 11, 2026 · Cohort 2026.01 · Certificate ID UX-26-0117</p></div></div>',
  '@page { size: Letter landscape; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fbfaf6; font-family: "Cormorant Garamond", Georgia, serif; color: #1a2540; } .card { width: 100%; max-width: 1000px; padding: 28px; } .border { border: 6px double #b48a3a; padding: 36px 64px; text-align: center; position: relative; background: radial-gradient(900px 360px at 50% 0%, #f5ecd1 0%, transparent 60%), #fbfaf6; } .seal { position: absolute; top: 36px; right: 64px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #d4a64a, #f5cf76); color: #fff; display: grid; place-items: center; font-size: 28pt; box-shadow: 0 6px 16px rgba(180, 138, 58, 0.35); } .presents { font-size: 12pt; font-style: italic; color: #6b6657; margin: 0 0 12px; letter-spacing: 0.08em; text-transform: uppercase; } h1 { font-size: 44pt; margin: 0; font-weight: 500; letter-spacing: -0.02em; color: #1a2540; line-height: 1; } .middle { font-size: 13pt; font-style: italic; color: #4b4234; margin: 18px 0 6px; } h2 { font-size: 26pt; margin: 0; font-weight: 600; font-style: italic; color: #b48a3a; line-height: 1.1; letter-spacing: -0.01em; } .program { font-size: 11.5pt; color: #4b4234; max-width: 60ch; margin: 14px auto 4px; line-height: 1.55; } .rule { width: 80px; height: 1px; background: #b48a3a; margin: 22px auto; } .signs { display: flex; justify-content: space-around; margin-top: 12px; } .signs > div { flex: 0 0 220px; border-top: 1px solid #1a2540; padding-top: 8px; } .name { font-size: 12pt; font-weight: 600; margin: 0; font-family: "Cormorant Garamond", Georgia, serif; } .role { font-size: 9.5pt; color: #6b6657; margin: 2px 0 0; font-style: italic; } .footer { font-family: "Inter", sans-serif; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.16em; color: #8b7e5f; margin: 24px 0 0; }',
  'Letter', '0in', 'cer-ao26', 1, 1834, 17, 1,
  'A landscape certificate of completion — double gold border, calligraphic name, dual signature line, program ID — print-and-frame ready.',
  'certificate,education,achievement,template,formal',
  0,
  unixepoch() * 1000 - 86400000 * 19,
  unixepoch() * 1000 - 86400000 * 3
);

-- 12) Certificate of achievement ----------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfcert00002',
  'u_showcase01',
  'Certificate of achievement — youth soccer champion',
  '<div class="card"><div class="ribbon"></div><p class="kicker">Lakeside Youth Soccer League</p><h1>Champion</h1><div class="rule"></div><p class="presents">This certificate is awarded to</p><h2>Mateo Reyes</h2><p class="role"># 11 · Forward · Thunderhawks U-12</p><p class="for">for outstanding play, sportsmanship, and team spirit during the<br/><strong>2026 Spring Season</strong></p><div class="stats"><div><span class="num">14</span><span class="lbl">Goals</span></div><div><span class="num">9</span><span class="lbl">Assists</span></div><div><span class="num">12</span><span class="lbl">Wins</span></div></div><div class="signs"><div><p class="name">Coach Renee Whitmore</p><p class="role">Head Coach</p></div><div><p class="name">Marlon Ferrari</p><p class="role">League Commissioner</p></div></div></div>',
  '@page { size: Letter; margin: 0.5in; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(180deg, #fff7ed, #fef3c7); font-family: "Inter", system-ui, sans-serif; color: #1a1a1a; } .card { width: 100%; max-width: 760px; padding: 48px 56px; background: #fff; border-radius: 16px; border: 3px solid #f97316; text-align: center; position: relative; overflow: hidden; box-shadow: 0 24px 48px rgba(249, 115, 22, 0.18); } .ribbon { position: absolute; top: -36px; left: -36px; width: 120px; height: 120px; background: #f97316; transform: rotate(-45deg); } .kicker { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.18em; color: #c2410c; margin: 0 0 6px; font-weight: 700; } h1 { font-family: "Space Grotesk", "Inter", sans-serif; font-size: 56pt; margin: 0; letter-spacing: -0.03em; font-weight: 800; color: #1a1a1a; line-height: 1; } .rule { width: 60px; height: 4px; background: #f97316; margin: 14px auto 18px; border-radius: 2px; } .presents { font-size: 11pt; color: #6b7280; margin: 0 0 6px; } h2 { font-family: "Space Grotesk", "Inter", sans-serif; font-size: 32pt; margin: 0; font-weight: 700; letter-spacing: -0.02em; color: #c2410c; line-height: 1.1; } .role { font-size: 10pt; color: #6b7280; margin: 4px 0 0; letter-spacing: 0.05em; } .for { font-size: 12pt; margin: 18px auto 0; max-width: 36ch; line-height: 1.5; color: #374151; } .stats { display: flex; justify-content: center; gap: 32px; margin: 22px 0 18px; padding: 18px 0; border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; } .stats > div { display: flex; flex-direction: column; align-items: center; } .num { font-family: "Space Grotesk", sans-serif; font-size: 22pt; font-weight: 700; color: #f97316; line-height: 1; } .lbl { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; margin-top: 4px; } .signs { display: flex; justify-content: space-around; margin-top: 8px; } .signs > div { flex: 0 0 200px; border-top: 1px solid #d1d5db; padding-top: 6px; } .name { font-size: 11pt; font-weight: 700; margin: 0; }',
  'Letter', '0.5in', 'cer-mr26', 1, 612, 8, 1,
  'A youth-soccer achievement certificate — orange ribbon corner, big "Champion" headline, three season stats, dual coach signatures.',
  'certificate,sports,kids,achievement,template',
  0,
  unixepoch() * 1000 - 86400000 * 5,
  unixepoch() * 1000 - 86400000 * 1
);

-- 13) Recipe card -------------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfrcpe00001',
  'u_showcase01',
  'Recipe card — brown butter chocolate chip cookies',
  '<div class="card"><header><p class="kicker">From the kitchen of</p><h2>Nora &amp; Jules</h2></header><section class="hero"><h1>Brown butter chocolate chip cookies</h1><p class="sub">Makes 16 cookies · 45 minutes total · Serves 8 happy people</p></section><div class="grid"><aside><h3>Ingredients</h3><ul><li>1 cup unsalted butter</li><li>1 cup brown sugar (packed)</li><li>½ cup granulated sugar</li><li>2 large eggs (room temp)</li><li>1 tbsp vanilla extract</li><li>2¼ cups all-purpose flour</li><li>1 tsp baking soda</li><li>1 tsp flaky sea salt</li><li>2 cups dark chocolate chunks</li></ul><div class="tip"><strong>Tip.</strong> Chill the dough 30 min for chewy centers, 90 min for crisp edges.</div></aside><section class="steps"><h3>Method</h3><ol><li>Melt butter in a pot over medium heat, swirling until amber and nutty (6–8 min). Pour into a bowl and cool 10 minutes.</li><li>Whisk both sugars into the cooled butter until glossy. Beat in eggs and vanilla.</li><li>Fold in flour, baking soda, and salt. Stir in chocolate chunks.</li><li>Scoop 2-tbsp balls onto a parchment sheet. Chill at least 30 minutes.</li><li>Bake at 375°F (190°C) for 11–12 minutes, until edges are set but centers look underdone.</li><li>Tap the pan once on the counter as they leave the oven. Cool 8 minutes. Demolish.</li></ol></section></div><footer><p>Adapted from Smitten Kitchen, 2014 · Tested in our Brooklyn oven, 36 times</p></footer></div>',
  '@page { size: 5in 7in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fff8eb; font-family: "Lora", Georgia, serif; color: #2b2419; } .card { width: 100%; max-width: 540px; padding: 28px 30px; background: #fffdf6; border: 2px solid #92400e; border-radius: 4px; position: relative; box-shadow: inset 0 0 0 8px #fff8eb, inset 0 0 0 9px #c2912d; } header { text-align: center; } .kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.2em; color: #92400e; margin: 0; font-family: "Inter", sans-serif; font-weight: 600; } h2 { font-family: "Caveat", "Lora", cursive, serif; font-size: 24pt; margin: 0; font-weight: 600; color: #6b3410; line-height: 1.1; } .hero { text-align: center; margin: 16px 0 16px; padding-bottom: 14px; border-bottom: 1px dashed #c2912d; } h1 { font-size: 19pt; margin: 0; line-height: 1.15; letter-spacing: -0.01em; font-weight: 700; } .sub { font-size: 9.5pt; font-style: italic; color: #92400e; margin: 6px 0 0; } .grid { display: grid; grid-template-columns: 1fr 1.6fr; gap: 18px; } h3 { font-family: "Inter", sans-serif; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.16em; color: #92400e; margin: 0 0 8px; font-weight: 700; } aside ul, .steps ol { margin: 0; padding-left: 18px; font-size: 9pt; line-height: 1.5; } aside li { margin-bottom: 4px; } .tip { margin-top: 12px; padding: 10px; background: #fef3c7; border-left: 3px solid #c2912d; font-size: 8.5pt; line-height: 1.4; font-style: italic; } .steps ol { padding-left: 22px; font-size: 9.5pt; line-height: 1.55; } .steps li { margin-bottom: 6px; } footer { margin-top: 16px; text-align: center; font-size: 8pt; color: #92400e; font-style: italic; }',
  '5in 7in', '0in', 'rec-nb26', 1, 2451, 24, 1,
  'A 5×7 recipe card in Lora — handwritten kitchen header, ingredients sidebar with chef-tip, 6-step method, brown-butter tested.',
  'recipe-card,food,personal,kitchen,template',
  0,
  unixepoch() * 1000 - 86400000 * 23,
  unixepoch() * 1000 - 86400000 * 6
);

-- 14) Recipe card — savory ---------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfrcpe00002',
  'u_showcase01',
  'Recipe card — sheet-pan harissa salmon',
  '<div class="card"><header><p class="cat">Weeknight · 30 min · Serves 4</p><h1>Sheet-pan harissa salmon</h1><p class="sub">With charred chickpeas, lemon yogurt, and herb salad</p></header><div class="grid"><section><h3>Ingredients</h3><div class="cols"><ul><li>4 × 6-oz salmon fillets</li><li>1 (15-oz) can chickpeas, drained</li><li>2 tbsp harissa paste</li><li>2 tbsp olive oil</li><li>1 tsp ground cumin</li><li>1 lemon (zest + juice)</li></ul><ul><li>½ cup full-fat Greek yogurt</li><li>1 garlic clove (microplaned)</li><li>1 cup mixed herbs (dill, mint, parsley)</li><li>2 cups baby greens</li><li>Flaky salt, black pepper</li></ul></div></section><section><h3>Method</h3><ol><li>Preheat oven to 425°F (220°C). Line a sheet pan with parchment.</li><li>Toss chickpeas with 1 tbsp oil, cumin, salt. Roast 10 min.</li><li>Whisk harissa, remaining oil, and lemon juice. Brush over salmon. Slide salmon onto pan beside chickpeas. Roast 10 min more, until salmon is just opaque.</li><li>Stir yogurt with garlic, lemon zest, salt. Toss herbs and greens with a squeeze of lemon.</li><li>Plate yogurt, top with salmon and chickpeas, finish with herb salad and flaky salt.</li></ol></section></div><footer><p>Pair with: a chilled Picpoul or a tart kombucha · Leftovers keep 2 days, gently rewarmed</p></footer></div>',
  '@page { size: A5 landscape; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #fdf2e9; font-family: "Inter", system-ui, sans-serif; color: #1c1917; } .card { width: 100%; max-width: 640px; padding: 24px 28px; background: #fff; border: 1px solid #e7e5e4; border-left: 6px solid #ea580c; } header { margin-bottom: 14px; } .cat { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.14em; color: #ea580c; margin: 0 0 4px; font-weight: 700; } h1 { font-family: "Lora", Georgia, serif; font-size: 22pt; margin: 0; line-height: 1.1; letter-spacing: -0.015em; } .sub { font-style: italic; color: #78716c; margin: 4px 0 0; font-size: 10.5pt; } .grid { display: grid; grid-template-columns: 1.1fr 1.4fr; gap: 18px; } h3 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.14em; color: #ea580c; margin: 0 0 6px; font-weight: 700; } .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } ul, ol { margin: 0; padding-left: 18px; } ul li { font-size: 9pt; line-height: 1.5; margin-bottom: 3px; } ol li { font-size: 9.5pt; line-height: 1.55; margin-bottom: 5px; } footer { margin-top: 14px; padding-top: 10px; border-top: 1px dashed #e7e5e4; font-size: 9pt; color: #78716c; font-style: italic; text-align: center; }',
  'A5', '0in', 'rec-ha26', 1, 1043, 12, 1,
  'A landscape A5 recipe card — sheet-pan harissa salmon with chickpeas, dual-column ingredients, five-step method, drink pairing.',
  'recipe-card,food,cooking,template,dinner',
  0,
  unixepoch() * 1000 - 86400000 * 10,
  unixepoch() * 1000 - 86400000 * 2
);

-- 15) Study guide — AP US History --------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfstgd00001',
  'u_showcase01',
  'Study guide — APUSH Reconstruction (1865–1877)',
  '<header><p class="kicker">AP US History · Unit 5 · Period 6</p><h1>Reconstruction, 1865–1877</h1><p class="meta">Compiled by Ms. Beaumont · Updated May 11, 2026 · 1 of 1</p></header><section><h2>Big ideas</h2><ul><li>Reconstruction sought to rebuild the South and redefine citizenship after the Civil War.</li><li>Federal power expanded — and then receded — within twelve years.</li><li>The 13th, 14th, and 15th Amendments rewrote the Constitution and remain in force today.</li></ul></section><section class="grid"><div><h3>Key amendments</h3><ul><li><strong>13th (1865)</strong> — abolished slavery.</li><li><strong>14th (1868)</strong> — citizenship, equal protection, due process.</li><li><strong>15th (1870)</strong> — voting rights regardless of race.</li></ul><h3>Key acts</h3><ul><li>Civil Rights Act of 1866</li><li>Reconstruction Acts of 1867</li><li>Enforcement Acts (1870–71)</li><li>Civil Rights Act of 1875</li></ul></div><div><h3>Key people</h3><ul><li><strong>Andrew Johnson</strong> — lenient Presidential Reconstruction; impeached 1868.</li><li><strong>Thaddeus Stevens</strong> — Radical Republican; pushed congressional Reconstruction.</li><li><strong>Hiram Revels</strong> — first Black senator (Mississippi, 1870).</li><li><strong>Frederick Douglass</strong> — abolitionist and key civil-rights voice.</li><li><strong>Rutherford B. Hayes</strong> — 1876 election ended Reconstruction.</li></ul></div></section><section><h2>Cause &amp; effect chain</h2><ol><li>Civil War ends → 4 million freed people, 700k war dead → need for federal Reconstruction policy.</li><li>Black Codes in the South → Radical Republican backlash → 14th Amendment.</li><li>KKK violence → Enforcement Acts → temporary federal suppression, then withdrawal.</li><li>Panic of 1873 → Northern fatigue → Compromise of 1877 → Jim Crow era begins.</li></ol></section><section><h2>Likely DBQ prompts</h2><ul><li>Evaluate the extent to which the 14th Amendment transformed federalism by 1877.</li><li>To what extent did Reconstruction succeed in achieving its goals?</li></ul></section>',
  '@page { size: Letter; margin: 0.7in; } body { font-family: "Source Sans 3", "Inter", system-ui, sans-serif; color: #0c0f14; font-size: 10pt; line-height: 1.55; } header { border-left: 5px solid #1e40af; padding: 4px 0 6px 16px; margin-bottom: 20px; } .kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.16em; color: #1e40af; margin: 0; font-weight: 700; } h1 { font-family: "Source Serif 4", Georgia, serif; font-size: 24pt; margin: 2px 0 4px; letter-spacing: -0.015em; line-height: 1.1; } .meta { font-size: 9pt; color: #6b7280; margin: 0; } h2 { font-family: "Source Serif 4", Georgia, serif; font-size: 14pt; margin: 18px 0 6px; color: #1e3a8a; } h3 { font-family: "Source Serif 4", Georgia, serif; font-size: 11pt; margin: 12px 0 4px; color: #1e3a8a; } ul, ol { margin: 6px 0 8px 18px; padding: 0; } li { margin-bottom: 3px; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }',
  'Letter', '0.7in', 'stg-rc26', 1, 3214, 41, 1,
  'A one-page APUSH study guide for Reconstruction — big ideas, key amendments, key people, cause-effect chain, two DBQ prompts.',
  'study-guide,education,history,template,student',
  0,
  unixepoch() * 1000 - 86400000 * 26,
  unixepoch() * 1000 - 86400000 * 4
);

-- 16) Study guide — biology ---------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfstgd00002',
  'u_showcase01',
  'Study guide — cellular respiration cheatsheet',
  '<header><p class="kicker">AP Biology · Unit 3 · Final review</p><h1>Cellular respiration cheatsheet</h1><p class="meta">Mr. Daniels · BIO 201 · 1 sheet, both sides</p></header><section class="stack"><div class="step"><div class="badge">1</div><h3>Glycolysis</h3><p><strong>Where:</strong> cytoplasm · <strong>Input:</strong> glucose (6C) · <strong>Output:</strong> 2 pyruvate, 2 ATP (net), 2 NADH</p><p>Splits glucose. Anaerobic. Universal across life.</p></div><div class="step"><div class="badge">2</div><h3>Pyruvate oxidation</h3><p><strong>Where:</strong> mitochondrial matrix · <strong>Input:</strong> 2 pyruvate · <strong>Output:</strong> 2 acetyl-CoA, 2 NADH, 2 CO₂</p><p>Decarboxylation. Bridge to Krebs.</p></div><div class="step"><div class="badge">3</div><h3>Krebs cycle</h3><p><strong>Where:</strong> matrix · <strong>Input:</strong> 2 acetyl-CoA · <strong>Output:</strong> 6 NADH, 2 FADH₂, 2 ATP, 4 CO₂ (per glucose)</p><p>Two turns per glucose. Citric acid cycle.</p></div><div class="step"><div class="badge">4</div><h3>Oxidative phosphorylation</h3><p><strong>Where:</strong> inner mitochondrial membrane · <strong>Input:</strong> NADH, FADH₂, O₂ · <strong>Output:</strong> ~26–28 ATP, water</p><p>Electron transport chain + chemiosmosis. Powered by the proton gradient.</p></div></section><section><h2>Net yield per glucose</h2><p class="big"><strong>~30–32 ATP</strong> · 6 CO₂ · 6 H₂O</p></section><section><h2>Common misconceptions</h2><ul><li>O₂ is the <em>final</em> electron acceptor — not the source of ATP energy.</li><li>Fermentation regenerates NAD⁺, not ATP.</li><li>The proton gradient — not direct electron flow — drives ATP synthase.</li></ul></section>',
  '@page { size: Letter; margin: 0.65in; } body { font-family: "Inter", system-ui, sans-serif; color: #0c0f14; font-size: 10pt; line-height: 1.5; } header { border-bottom: 2px solid #15803d; padding-bottom: 12px; margin-bottom: 18px; } .kicker { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.14em; color: #15803d; margin: 0; font-weight: 700; } h1 { font-size: 22pt; margin: 2px 0 4px; letter-spacing: -0.015em; line-height: 1.1; } .meta { font-size: 9pt; color: #6b7280; margin: 0; } .stack { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; } .step { position: relative; padding: 12px 14px 12px 44px; border: 1px solid #d1d5db; border-radius: 8px; background: #f0fdf4; min-height: 100px; } .badge { position: absolute; top: 12px; left: 12px; width: 22px; height: 22px; border-radius: 50%; background: #15803d; color: #fff; display: grid; place-items: center; font-size: 11pt; font-weight: 700; } h3 { font-size: 12pt; margin: 0 0 4px; color: #15803d; } .step p { margin: 0 0 4px; font-size: 9.5pt; line-height: 1.5; } h2 { font-size: 13pt; margin: 18px 0 4px; color: #14532d; } .big { font-size: 16pt; margin: 0; color: #14532d; } ul { margin: 6px 0 0 18px; padding: 0; } li { margin-bottom: 4px; font-size: 9.5pt; }',
  'Letter', '0.65in', 'stg-cr26', 1, 1976, 28, 1,
  'A numbered four-step cellular respiration cheatsheet — glycolysis through oxidative phosphorylation, net-yield callout, misconceptions panel.',
  'study-guide,education,biology,template,student',
  0,
  unixepoch() * 1000 - 86400000 * 30,
  unixepoch() * 1000 - 86400000 * 5
);

-- 17) Real estate listing -----------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfreal00001',
  'u_showcase01',
  'Real estate listing — 17 Birch Lane, Hudson NY',
  '<header><div class="brand">Coastal &amp; Cove · Hudson Valley</div><div class="agent">Listed by Greta Aaltonen · (518) 555-0143</div></header><section class="hero"><p class="kicker">For Sale · Move-in Ready</p><h1>17 Birch Lane</h1><p class="addr">Hudson, NY 12534 · MLS HV-2026-0418</p><p class="price">$1,295,000</p></section><section class="stats"><div><span class="num">4</span><span class="lbl">Bedrooms</span></div><div><span class="num">3.5</span><span class="lbl">Bathrooms</span></div><div><span class="num">2,840</span><span class="lbl">Sq ft</span></div><div><span class="num">0.62</span><span class="lbl">Acres</span></div><div><span class="num">1928</span><span class="lbl">Built</span></div></section><section><h2>The home</h2><p>A handsomely-restored 1928 Dutch Colonial five blocks from Warren Street. Original quartersawn oak floors, double-hung windows, and a south-facing porch wrap a chef''s kitchen, a wood-paneled study, and four sun-filled bedrooms upstairs. The detached barn is wired and insulated — studio, gym, or guest house.</p></section><section class="grid"><div><h3>Inside</h3><ul><li>Open chef''s kitchen with marble island</li><li>Wood-burning fireplace in living room</li><li>Primary suite with clawfoot bath</li><li>Finished basement (rec room + laundry)</li></ul></div><div><h3>Outside</h3><ul><li>South-facing wraparound porch</li><li>Heated detached barn (480 sq ft)</li><li>Mature beech and birch on 0.62 acres</li><li>Bluestone walkway, fenced rear garden</li></ul></div></section><section><h2>Logistics</h2><p>Taxes 2025: $9,847. School district: Hudson Central. Open house: Sunday, May 17, 1–3 pm. Showings by appointment — text Greta directly.</p></section><footer><p>Coastal &amp; Cove Realty · 423 Warren St, Hudson NY · greta@coastalcove.co</p></footer>',
  '@page { size: Letter; margin: 0.55in; } body { font-family: "Inter", system-ui, sans-serif; color: #0c0f14; font-size: 10.5pt; line-height: 1.55; } header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #0c0f14; padding-bottom: 10px; margin-bottom: 18px; } .brand { font-family: "Lora", Georgia, serif; font-size: 14pt; font-weight: 700; letter-spacing: -0.01em; } .agent { font-size: 9pt; color: #6b7280; } .hero { padding: 18px 0; border-bottom: 1px solid #e5e7eb; margin-bottom: 16px; } .kicker { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.16em; color: #14532d; margin: 0 0 6px; font-weight: 700; } h1 { font-family: "Lora", Georgia, serif; font-size: 36pt; margin: 0; letter-spacing: -0.02em; line-height: 1; font-weight: 700; } .addr { font-size: 11pt; color: #6b7280; margin: 4px 0 8px; } .price { font-family: "Lora", Georgia, serif; font-size: 26pt; margin: 0; color: #14532d; font-weight: 700; letter-spacing: -0.02em; } .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; padding: 14px 0 18px; border-bottom: 1px solid #e5e7eb; margin-bottom: 14px; } .stats > div { display: flex; flex-direction: column; align-items: center; padding: 6px; } .num { font-family: "Lora", Georgia, serif; font-size: 18pt; font-weight: 700; line-height: 1; color: #14532d; } .lbl { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.14em; color: #6b7280; margin-top: 4px; } h2 { font-family: "Lora", Georgia, serif; font-size: 14pt; margin: 18px 0 6px; color: #14532d; } h3 { font-family: "Lora", Georgia, serif; font-size: 11pt; margin: 0 0 6px; color: #14532d; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 6px; } ul { margin: 0; padding-left: 18px; } li { margin-bottom: 3px; font-size: 10pt; } footer { margin-top: 22px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #6b7280; font-style: italic; }',
  'Letter', '0.55in', 'rea-bh26', 1, 1428, 16, 1,
  'A boutique real-estate one-sheet — Hudson NY Dutch Colonial, 5-stat hero, inside/outside columns, taxes + open-house line, signature footer.',
  'real-estate,listing,property,template,sales',
  0,
  unixepoch() * 1000 - 86400000 * 12,
  unixepoch() * 1000 - 86400000 * 2
);

-- 18) Baby announcement -------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfbaby00001',
  'u_showcase01',
  'Baby announcement — pastel arch',
  '<section class="card"><div class="arch"></div><p class="kicker">Hello, world.</p><h1>Wren Margaux<span>Donaldson</span></h1><div class="rule"></div><p class="meta">Born Tuesday, April 14, 2026<br/>at 6:32 in the morning</p><p class="stats"><span><strong>7</strong> lb <strong>9</strong> oz</span><span class="dot">·</span><span><strong>20</strong> inches</span></p><p class="family">Joining her parents Theo &amp; Maren and big brother Felix (with mixed reviews from the cat).</p></section>',
  '@page { size: 5in 7in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(180deg, #fdf2f8 0%, #fef3c7 100%); font-family: "Cormorant Garamond", Georgia, serif; color: #4a2e2a; } .card { width: 100%; max-width: 420px; padding: 40px 36px; text-align: center; position: relative; } .arch { position: absolute; top: 8%; left: 50%; transform: translateX(-50%); width: 220px; height: 280px; background: linear-gradient(180deg, #fbcfe8 0%, #fde68a 100%); border-radius: 110px 110px 0 0; opacity: 0.35; z-index: 0; } .kicker, h1, .rule, .meta, .stats, .family { position: relative; z-index: 1; } .kicker { font-family: "Cormorant Garamond", Georgia, serif; font-style: italic; font-size: 11pt; letter-spacing: 0.18em; text-transform: uppercase; color: #ad4d77; margin: 0 0 18px; } h1 { font-size: 38pt; margin: 0; font-weight: 500; letter-spacing: -0.015em; line-height: 1; } h1 span { display: block; font-size: 22pt; font-style: italic; color: #ad4d77; margin-top: 6px; font-weight: 400; } .rule { width: 60px; height: 1px; background: #ad4d77; margin: 22px auto; } .meta { font-size: 11.5pt; line-height: 1.5; margin: 0 0 12px; } .stats { font-size: 11pt; margin: 0 0 18px; letter-spacing: 0.03em; } .stats strong { font-size: 13pt; color: #ad4d77; } .stats .dot { margin: 0 8px; opacity: 0.4; } .family { font-style: italic; font-size: 10.5pt; color: #6b4842; max-width: 32ch; margin: 0 auto; line-height: 1.5; }',
  '5in 7in', '0in', 'bab-wd26', 1, 2890, 19, 1,
  'A 5×7 birth announcement in Cormorant — soft pink-to-yellow gradient arch backdrop, name + stats + a charming family line.',
  'baby-announcement,personal,birth,template,celebration',
  0,
  unixepoch() * 1000 - 86400000 * 25,
  unixepoch() * 1000 - 86400000 * 7
);

-- 19) Mutual NDA --------------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfnda000001',
  'u_showcase01',
  'Mutual NDA — short-form, founder-friendly',
  '<header><p class="kicker">Mutual non-disclosure agreement</p><p class="date">Effective May 11, 2026</p></header><section><h2>Parties</h2><p>This Mutual Non-Disclosure Agreement (the "<strong>Agreement</strong>") is between <strong>[Party A Name]</strong>, a [Delaware corporation], with offices at [address], and <strong>[Party B Name]</strong>, a [Delaware corporation], with offices at [address] (each a "<strong>Party</strong>", and together the "<strong>Parties</strong>").</p></section><section><h2>1. Confidential information</h2><p>"Confidential Information" means any non-public information disclosed by one Party (the "<strong>Disclosing Party</strong>") to the other (the "<strong>Receiving Party</strong>"), including business plans, financials, source code, customer lists, product roadmaps, and any information marked or reasonably understood to be confidential.</p></section><section><h2>2. Obligations</h2><p>The Receiving Party will (a) use Confidential Information solely to evaluate a potential business relationship, (b) protect it with at least the same care it uses for its own confidential information, and (c) limit access to employees, contractors, and advisors who need it and are bound by similar confidentiality obligations.</p></section><section><h2>3. Exclusions</h2><p>Confidential Information does not include information that is (i) already known by the Receiving Party without restriction, (ii) publicly available through no fault of the Receiving Party, (iii) independently developed without reference to the Disclosing Party''s information, or (iv) lawfully obtained from a third party.</p></section><section><h2>4. Term</h2><p>This Agreement is effective from the Effective Date and continues for two (2) years. Obligations regarding trade secrets continue for as long as the information remains a trade secret.</p></section><section><h2>5. Governing law</h2><p>This Agreement is governed by the laws of the State of Delaware, without regard to its conflicts-of-law principles.</p></section><section class="signs"><div><p class="name">[Party A Name]</p><p class="line">Signature: ____________________________</p><p class="line">Name: ____________________________</p><p class="line">Title: ____________________________</p><p class="line">Date: ____________________________</p></div><div><p class="name">[Party B Name]</p><p class="line">Signature: ____________________________</p><p class="line">Name: ____________________________</p><p class="line">Title: ____________________________</p><p class="line">Date: ____________________________</p></div></section>',
  '@page { size: Letter; margin: 0.85in; } body { font-family: "Times New Roman", Times, serif; color: #0c0f14; font-size: 11pt; line-height: 1.65; } header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0c0f14; padding-bottom: 10px; margin-bottom: 22px; } .kicker { font-family: "Inter", sans-serif; font-size: 11pt; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; margin: 0; } .date { font-size: 10pt; color: #4b5563; margin: 0; } h2 { font-family: "Inter", sans-serif; font-size: 11.5pt; margin: 20px 0 4px; letter-spacing: 0; } p { margin: 0 0 10px; } .signs { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 36px; padding-top: 20px; border-top: 1px solid #0c0f14; } .name { font-weight: 700; margin-bottom: 14px; } .line { font-size: 10.5pt; margin: 0 0 14px; }',
  'Letter', '0.85in', 'nda-ml26', 1, 1106, 14, 1,
  'A short-form mutual NDA in Times — five numbered sections, founder-friendly two-year term, side-by-side signature block.',
  'nda,legal,contract,template,business',
  0,
  unixepoch() * 1000 - 86400000 * 8,
  unixepoch() * 1000 - 86400000 * 1
);

-- 20) Save-the-date -----------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfsavd00001',
  'u_showcase01',
  'Save the date — modern type couple',
  '<section class="card"><p class="kicker">Save the date</p><h1>Quincy<span>+</span>Romi</h1><p class="middle">are getting married</p><div class="dates"><div class="d"><span class="big">10</span><span class="lbl">Oct</span></div><div class="d"><span class="big">2026</span><span class="lbl">Year</span></div></div><p class="city">Mexico City</p><p class="footer">Formal invitation to follow · No need to RSVP yet</p></section>',
  '@page { size: 5in 7in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0a0a0f; color: #fde68a; font-family: "Space Grotesk", "Inter", sans-serif; } .card { text-align: center; padding: 38px 32px; width: 100%; max-width: 420px; } .kicker { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.32em; color: #fbbf24; margin: 0 0 24px; font-weight: 600; } h1 { font-size: 60pt; margin: 0; line-height: 0.95; letter-spacing: -0.05em; font-weight: 800; color: #f5f5f4; } h1 span { display: block; font-size: 36pt; color: #fbbf24; margin: 8px 0; font-weight: 400; font-style: normal; } .middle { font-size: 12pt; font-style: italic; color: #d6d3d1; margin: 18px 0 28px; letter-spacing: 0.04em; } .dates { display: flex; justify-content: center; gap: 32px; padding: 18px 0; border-top: 1px solid rgba(251, 191, 36, 0.3); border-bottom: 1px solid rgba(251, 191, 36, 0.3); margin-bottom: 18px; } .d { display: flex; flex-direction: column; align-items: center; } .big { font-size: 26pt; font-weight: 700; line-height: 1; color: #f5f5f4; letter-spacing: -0.02em; } .lbl { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.18em; color: #fbbf24; margin-top: 4px; } .city { font-size: 16pt; font-weight: 600; color: #f5f5f4; margin: 0 0 18px; letter-spacing: -0.01em; } .footer { font-size: 9pt; color: #a8a29e; letter-spacing: 0.14em; text-transform: uppercase; margin: 0; }',
  '5in 7in', '0in', 'std-qr26', 1, 2147, 22, 1,
  'A dark, gold-on-black save-the-date in Space Grotesk — chunky 60pt names, hairline gold divider, Mexico City headline.',
  'save-the-date,wedding,event,template,modern',
  0,
  unixepoch() * 1000 - 86400000 * 17,
  unixepoch() * 1000 - 86400000 * 3
);

-- 21) Travel itinerary --------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfitin00001',
  'u_showcase01',
  'Travel itinerary — 5 days in Lisbon',
  '<header><p class="kicker">For Jamie &amp; Tom · May 18–22, 2026</p><h1>Lisbon, five days</h1><p class="meta">Compiled by Eva · last updated May 11, 2026</p></header><section class="day"><div class="d"><span>Mon</span><span class="num">18</span></div><div class="c"><h3>Arrive · Alfama wander</h3><ul><li><strong>10:30</strong> TAP TP9 lands LIS. Bolt to apartment (Rua dos Bacalhoeiros).</li><li><strong>13:00</strong> Lunch — Pastéis de Bacalhau na Praça da Figueira.</li><li><strong>15:00</strong> Walk Alfama: Sé Cathedral → Castelo de São Jorge → miradouro of Santa Luzia.</li><li><strong>19:30</strong> Dinner at Taberna da Rua das Flores. No reservations — line up by 19:15.</li></ul></div></section><section class="day"><div class="d"><span>Tue</span><span class="num">19</span></div><div class="c"><h3>Belém · pastéis &amp; Berardo</h3><ul><li><strong>09:00</strong> Tram 15E to Belém. Pastéis de Belém — eat the first one standing.</li><li><strong>11:00</strong> Mosteiro dos Jerónimos (pre-booked, slot 11:15).</li><li><strong>14:30</strong> Museu Coleção Berardo — modern art, breezy galleries.</li><li><strong>20:00</strong> Fado dinner at Tasca do Chico (Bairro Alto). Cash.</li></ul></div></section><section class="day"><div class="d"><span>Wed</span><span class="num">20</span></div><div class="c"><h3>Sintra day trip</h3><ul><li><strong>08:30</strong> Comboio CP from Rossio (R$5 each, buy at machine).</li><li><strong>10:00</strong> Quinta da Regaleira (pre-booked).</li><li><strong>13:00</strong> Lunch — Tascantiga.</li><li><strong>15:30</strong> Pena Palace — second bus from station.</li></ul></div></section><section class="day"><div class="d"><span>Thu</span><span class="num">21</span></div><div class="c"><h3>LX Factory · Time Out Market</h3><ul><li>Morning: LX Factory shops, bookstore Ler Devagar.</li><li><strong>13:00</strong> Lunch — Time Out Market (try Henrique Sá Pessoa''s stall).</li><li>Afternoon free — sunset at Miradouro da Senhora do Monte.</li></ul></div></section><section class="day"><div class="d"><span>Fri</span><span class="num">22</span></div><div class="c"><h3>Slow morning · fly home</h3><ul><li><strong>09:00</strong> Café A Brasileira — espresso, Pessoa statue photo op.</li><li><strong>12:00</strong> Bolt to LIS.</li><li><strong>14:30</strong> TAP TP8 to JFK.</li></ul></div></section><footer><p>Logistics: SIM cards at Vodafone in arrivals · Metro Viva Viagem card · Tip 10% in restaurants. Emergency: Eva +1-415-555-0177.</p></footer>',
  '@page { size: Letter; margin: 0.6in; } body { font-family: "Inter", system-ui, sans-serif; color: #0c0f14; font-size: 10pt; line-height: 1.5; } header { border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 16px; } .kicker { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.14em; color: #0891b2; margin: 0; font-weight: 700; } h1 { font-family: "Lora", Georgia, serif; font-size: 30pt; margin: 4px 0 4px; letter-spacing: -0.02em; line-height: 1.05; } .meta { font-size: 9pt; color: #6b7280; margin: 0; } .day { display: grid; grid-template-columns: 80px 1fr; gap: 14px; padding: 12px 0; border-bottom: 1px dashed #e5e7eb; } .d { display: flex; flex-direction: column; align-items: center; padding-top: 4px; } .d span:first-child { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.16em; color: #0891b2; font-weight: 700; } .d .num { font-family: "Lora", Georgia, serif; font-size: 30pt; font-weight: 700; line-height: 1; color: #0c0f14; } h3 { font-size: 12pt; margin: 0 0 6px; color: #0891b2; } ul { margin: 0; padding-left: 18px; } li { margin-bottom: 3px; font-size: 9.5pt; } footer { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #6b7280; font-style: italic; }',
  'Letter', '0.6in', 'itn-ls26', 1, 854, 13, 1,
  'A five-day Lisbon itinerary — day-by-day timed blocks for Alfama, Belém, Sintra, LX Factory, and a slow Friday — printable, foldable.',
  'itinerary,travel,vacation,template,trip',
  0,
  unixepoch() * 1000 - 86400000 * 3,
  unixepoch() * 1000 - 3600000 * 14
);

-- 22) Conference badge --------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfbadg00001',
  'u_showcase01',
  'Conference badge — DevWorld 2026',
  '<div class="badge"><div class="top"><div class="brand">DevWorld<span>26</span></div><div class="role">Speaker</div></div><div class="middle"><p class="hello">Hi, I''m</p><h1>Sasha Hwang</h1><p class="company">Staff Engineer · Linear</p></div><div class="bottom"><div class="tag">@sashah</div><div class="tag">she/her</div><div class="tag">Track 2 · 14:00</div></div></div>',
  '@page { size: 4in 6in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(135deg, #6d28d9 0%, #0891b2 100%); font-family: "Inter", system-ui, sans-serif; color: #0a0a0f; } .badge { width: 100%; max-width: 320px; background: #fff; border-radius: 14px; padding: 20px 22px; box-shadow: 0 18px 36px rgba(0, 0, 0, 0.18); display: grid; grid-template-rows: auto 1fr auto; min-height: 460px; } .top { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; } .brand { font-family: "Space Grotesk", "Inter", sans-serif; font-size: 16pt; font-weight: 800; letter-spacing: -0.02em; } .brand span { color: #6d28d9; } .role { background: linear-gradient(135deg, #6d28d9, #0891b2); color: #fff; padding: 4px 10px; border-radius: 999px; font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; } .middle { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 18px 6px; } .hello { font-size: 11pt; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; margin: 0 0 8px; font-weight: 600; } h1 { font-family: "Space Grotesk", "Inter", sans-serif; font-size: 28pt; margin: 0 0 6px; letter-spacing: -0.025em; line-height: 1; font-weight: 800; } .company { font-size: 11pt; color: #6d28d9; font-weight: 600; margin: 0; } .bottom { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; padding-top: 12px; border-top: 1px solid #f1f5f9; } .tag { background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 8.5pt; font-family: ui-monospace, monospace; color: #475569; }',
  '4in 6in', '0in', 'bdg-sh26', 1, 421, 6, 1,
  'A 4×6 portrait conference badge — gradient backdrop, role pill, big name, company, three meta tags — print, punch, hand out.',
  'conference-badge,event,corporate,template,name-tag',
  0,
  unixepoch() * 1000 - 86400000 * 4,
  unixepoch() * 1000 - 3600000 * 6
);

-- 23) Course syllabus ---------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfsylb00001',
  'u_showcase01',
  'Course syllabus — CS 142 Web Systems',
  '<header><p class="kicker">Stanford · Spring 2026</p><h1>CS 142 · Web Applications</h1><p class="meta">Lecture: T/Th 10:30–11:50 · Skilling Auditorium · Office hrs: Wed 14:00–16:00 (Gates 478)</p></header><section class="grid"><div><h3>Instructors</h3><ul><li><strong>Dr. Hannah Cho</strong> · hcho@stanford.edu</li><li>TA · Renji Patel · rpatel@stanford.edu</li><li>TA · Lupita Vasquez · lvasquez@stanford.edu</li></ul></div><div><h3>Prerequisites</h3><ul><li>CS 106B (or equivalent)</li><li>Comfortable with JavaScript</li><li>Familiarity with HTTP basics</li></ul></div><div><h3>Grading</h3><ul><li>5 problem sets · 40%</li><li>Midterm project · 20%</li><li>Final project · 30%</li><li>Participation · 10%</li></ul></div><div><h3>Required texts</h3><ul><li>Web Performance in Action — Wagner (2017)</li><li>High Performance Browser Networking — Grigorik (2013) — free online</li></ul></div></section><section><h2>Weekly schedule</h2><table><tr><th>Wk</th><th>Topic</th><th>Reading</th><th>Due</th></tr><tr><td>1</td><td>HTTP, the platform</td><td>HPBN ch 1–2</td><td>—</td></tr><tr><td>2</td><td>HTML, ARIA, the semantic baseline</td><td>WPiA ch 1</td><td>PS1</td></tr><tr><td>3</td><td>CSS architecture &amp; layout</td><td>WPiA ch 2</td><td>—</td></tr><tr><td>4</td><td>Client-side data and state</td><td>HPBN ch 5</td><td>PS2</td></tr><tr><td>5</td><td>Async, fetch, streaming</td><td>HPBN ch 11–12</td><td>—</td></tr><tr><td>6</td><td>Performance: Core Web Vitals</td><td>WPiA ch 6</td><td>PS3</td></tr><tr><td>7</td><td>Service Workers &amp; offline</td><td>WPiA ch 9</td><td>Midterm</td></tr><tr><td>8</td><td>Security: CSP, CORS, auth</td><td>HPBN ch 7</td><td>—</td></tr><tr><td>9</td><td>Edge compute &amp; CDNs</td><td>HPBN ch 10</td><td>PS4</td></tr><tr><td>10</td><td>Final presentations</td><td>—</td><td>Final</td></tr></table></section><section><h2>Policies</h2><p><strong>Late work.</strong> Three free late days, ≤24h each. After that, 10%/day. <strong>Collaboration.</strong> Discuss ideas freely; write code alone unless paired. <strong>Honor code.</strong> Run all AI-assisted submissions through the disclosure form. <strong>Accommodations.</strong> Contact OAE within the first two weeks.</p></section>',
  '@page { size: Letter; margin: 0.7in; } body { font-family: "Inter", system-ui, sans-serif; color: #0c0f14; font-size: 10pt; line-height: 1.55; } header { border-bottom: 2px solid #8c1515; padding-bottom: 12px; margin-bottom: 18px; } .kicker { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.16em; color: #8c1515; margin: 0; font-weight: 700; } h1 { font-family: "Source Serif 4", Georgia, serif; font-size: 24pt; margin: 4px 0 4px; letter-spacing: -0.015em; line-height: 1.05; } .meta { font-size: 10pt; color: #6b7280; margin: 0; } .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 28px; margin-bottom: 8px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; } h3 { font-family: "Source Serif 4", Georgia, serif; font-size: 11.5pt; margin: 8px 0 4px; color: #8c1515; } ul { margin: 0; padding-left: 18px; } li { margin-bottom: 3px; font-size: 9.5pt; } h2 { font-family: "Source Serif 4", Georgia, serif; font-size: 14pt; margin: 18px 0 8px; color: #8c1515; } table { width: 100%; border-collapse: collapse; font-size: 9.5pt; } th { text-align: left; background: #fef2f2; padding: 8px 10px; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.1em; color: #8c1515; } td { padding: 8px 10px; vertical-align: top; border-bottom: 1px solid #fee2e2; } td:first-child { font-weight: 700; color: #8c1515; font-variant-numeric: tabular-nums; }',
  'Letter', '0.7in', 'syl-cs26', 1, 1283, 19, 1,
  'A clean Stanford CS 142 syllabus — instructors, prereqs, grading, ten-week schedule with readings + due dates, late-work policy.',
  'syllabus,education,teacher,template,course',
  0,
  unixepoch() * 1000 - 86400000 * 16,
  unixepoch() * 1000 - 86400000 * 4
);

-- 24) Event poster ------------------------------------------------------------
INSERT OR IGNORE INTO projects (
  id, user_id, title, html, css, page_size, margin, slug, is_public, view_count, edit_count,
  ai_title_generated, description, tags, present_mode, created_at, updated_at
) VALUES (
  'pdfpost00001',
  'u_showcase01',
  'Event poster — neighborhood jazz night',
  '<section class="poster"><p class="kicker">Brooklyn Heights Library presents</p><h1>Jazz<span>Night</span></h1><p class="sub">A free evening with the <em>Reginald Quartet</em></p><div class="meta"><div><span class="lbl">Date</span><span class="val">Saturday June 6</span></div><div><span class="lbl">Time</span><span class="val">19:30 — 21:30</span></div><div><span class="lbl">Where</span><span class="val">280 Cadman Plaza W · Mezzanine</span></div><div><span class="lbl">Cost</span><span class="val">Free · BYOB</span></div></div><p class="lineup">Featuring · Reginald Mathis (sax) · Lila Park (piano) · Theo Voss (bass) · Maya Bell (drums)</p><p class="bottom">Doors at 19:00 · Seating limited · brooklynlibrary.org/jazz</p></section>',
  '@page { size: 11in 17in; margin: 0; } body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%); color: #fef3c7; font-family: "Space Grotesk", "Inter", sans-serif; } .poster { width: 100%; max-width: 760px; padding: 56px 60px; text-align: center; } .kicker { font-size: 13pt; text-transform: uppercase; letter-spacing: 0.32em; color: #fbbf24; margin: 0 0 18px; font-weight: 600; } h1 { font-family: "Space Grotesk", sans-serif; font-size: 120pt; margin: 0; line-height: 0.88; letter-spacing: -0.06em; font-weight: 800; color: #fde68a; } h1 span { display: block; font-size: 100pt; color: #fbbf24; font-style: italic; font-weight: 600; margin-top: -8px; } .sub { font-family: "Lora", Georgia, serif; font-size: 22pt; font-style: italic; color: #fde68a; margin: 24px 0 36px; letter-spacing: 0; } .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; padding: 22px 0; border-top: 1px solid rgba(251, 191, 36, 0.4); border-bottom: 1px solid rgba(251, 191, 36, 0.4); margin-bottom: 24px; } .meta > div { display: flex; flex-direction: column; align-items: center; } .lbl { font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.18em; color: #fbbf24; margin-bottom: 6px; } .val { font-size: 14pt; color: #fef3c7; font-weight: 600; line-height: 1.2; text-align: center; } .lineup { font-size: 14pt; color: #fde68a; margin: 0 0 18px; line-height: 1.4; max-width: 50ch; margin-left: auto; margin-right: auto; } .lineup em { font-family: "Lora", Georgia, serif; font-style: italic; color: #fbbf24; } .bottom { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.2em; color: #a78bfa; margin: 0; }',
  '11in 17in', '0in', 'pos-jz26', 1, 887, 11, 1,
  'A tabloid-size jazz poster — purple-to-navy gradient, Space Grotesk 120pt headline, Lora italic subtitle, four-column event meta block.',
  'poster,event,music,template,community',
  0,
  unixepoch() * 1000 - 86400000 * 22,
  unixepoch() * 1000 - 86400000 * 8
);
