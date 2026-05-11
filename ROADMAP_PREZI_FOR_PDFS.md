# Prezi-for-PDFs Roadmap

A community-first PDF studio: type plain English → get a designed PDF. Every PDF a fork. Every fork a remix. Built on Cloudflare Workers + AI.

> Status legend: ✓ shipped · ◐ in progress · ◯ planned

## Phase 1 — Community Foundations

1. ✓ Public `slug` + `isPublic` columns on `projects`
2. ✓ `GET /api/explore` paginated feed (recent | popular)
3. ✓ `GET /api/explore/search?q=` full-text title + description + tags
4. ✓ `GET /api/explore/:slug` single-PDF metadata + content
5. ✓ `GET /api/public/:slug/render` CSP-locked iframe preview
6. ✓ `POST /api/explore/:slug/remix` 1-click duplicate into your workspace
7. ✓ Per-user 20/day rate limit on share-link creation
8. ✓ Per-user 30/day remix throttle
9. ✓ `viewCount` + `editCount` auto-increment with `c.executionCtx.waitUntil`
10. ✓ `/explore` community feed page with hero search + tag chips
11. ✓ `/c/:slug` public PDF viewer with Remix CTA
12. ◯ Cloudflare AI Search index over all public PDFs (vectorize)
13. ◯ Trending feed: `viewCount + remixCount` weighted by recency half-life
14. ◯ Per-author profile page `/u/:handle` with their public PDFs
15. ◯ Tag pages `/t/:tag` (resume, deck, invoice, …) with curated lead images
16. ◯ Featured collections: hand-picked editor highlights, weekly rotation

## Phase 2 — Creation & AI

17. ✓ AI auto-title from full chat transcript + HTML (Workers AI + Anthropic fallback)
18. ✓ Per-user 1/min rate limit on AI title generation
19. ◯ AI auto-description (140-char teaser for Explore card)
20. ◯ AI auto-tags from content (3–5 chips, validated against allow-list)
21. ◯ "Generate cover image" — DALL·E 3 thumbnail captured as `thumbnailKey`
22. ◯ AI section blocks: `/insert <section>` (cover, TOC, signature, references)
23. ◯ AI "Make this prettier" pass (layout, type pairing, color rebalance)
24. ◯ AI translation: same content, swap language preserving design
25. ◯ AI brand voice transfer: paste a brand guide → re-skin all text
26. ◯ AI image-to-PDF: drop a photo of a flyer, get an editable replica
27. ◯ Streaming chat responses (SSE) so users see thinking + redrafts
28. ◯ Multi-step agentic build: plan → outline → fill → polish → review
29. ◯ Style memory: project-level "house style" injected into every chat call
30. ◯ Inline /-commands inside the document: `/date`, `/qr`, `/chart`, `/signature`

## Phase 3 — Editor UX

31. ✓ HBO-cinematic PDF picker dropdown with live search
32. ✓ Inline rename with autofocus + select-all + Esc-to-cancel
33. ✓ Always-on contenteditable inline editing with debounced autosave
34. ✓ Click-to-edit text directly on the page
35. ✓ Code panel (CodeMirror 6) with HTML + CSS tabs
36. ✓ Snapshot history with one-click restore
37. ✓ Present Mode (Prezi-style fullscreen, ← → keyboard, ESC to exit)
38. ◯ Slide thumbnails strip down the side of Present Mode
39. ◯ Speaker notes per slide (markdown, presenter-only)
40. ◯ Laser pointer + drawing tools in Present Mode
41. ◯ Mini-map zoom-out: see all slides at once, click to jump
42. ◯ Smart guides + snap-to-baseline-grid while editing
43. ◯ Multi-cursor live collaboration (Cloudflare Durable Objects)
44. ◯ Comment threads anchored to elements (Figma-style)
45. ◯ Track changes / suggestions mode (accept/reject)
46. ◯ Block library: drag-in callouts, stat-rows, signature blocks, QR codes
47. ◯ Template gallery seeded with 50 community-built PDFs
48. ◯ Per-page background images + per-slide theme override
49. ◯ Custom fonts (woff2 upload, scoped to project)
50. ◯ Color palette extractor from a logo/image upload

## Phase 4 — Monetization & Limits

51. ✓ Free tier: 10 edits per PDF, then paywall
52. ✓ `PROJECT_LIMIT_REACHED` 402 with upgrade modal
53. ◯ Pay-per-edit credits ($1 = 50 edits, top up never expires)
54. ◯ Stripe Checkout flow for credit packs
55. ◯ Pro plan: unlimited edits, unlimited public PDFs, premium templates
56. ◯ Team plan: shared workspace, comment access, billing per seat
57. ◯ Remix credit-sharing: original author gets 10% of remixer's spend
58. ◯ Tip jar on community PDFs (Stripe Connect → author payouts)
59. ◯ Pro-only templates marked with crown badge
60. ◯ Featured author program (verified badge, payouts, marketing)

## Phase 5 — Sharing & Export

61. ✓ Public share links with revocable slugs
62. ◯ Watermark-free PDF download for Pro / paid credits
63. ◯ Branded watermark on free-tier PDF exports
64. ◯ Export to PNG (per-page) + animated SVG sequence
65. ◯ Export to PowerPoint (PPTX) for the boardroom crowd
66. ◯ Export to Markdown for the developer crowd
67. ◯ Embed code: `<iframe src=".../api/public/:slug/render">`
68. ◯ OG image generator: 1200×630 card of slide 1 with branded chrome
69. ◯ Save to Google Drive (already scaffolded — finish OAuth)
70. ◯ Save to Dropbox + OneDrive
71. ◯ Email a PDF: "Send to me" magic link
72. ◯ Print-to-mail integration (Lob API): order physical prints

## Phase 6 — Discovery & SEO

73. ◯ Per-PDF SEO: `<title>` + meta description from AI summary
74. ◯ Sitemap auto-updates as PDFs go public
75. ◯ JSON-LD `CreativeWork` per public PDF
76. ◯ pSEO landing pages: `/templates/resume`, `/templates/invoice`, …
77. ◯ Trending in the navbar with live count
78. ◯ "Made with Megabyte PDF" badge on free PDFs (referral attribution)
79. ◯ Newsletter: weekly digest of best new community PDFs
80. ◯ RSS feed of public PDFs per tag

## Phase 7 — Trust, Safety, Performance

81. ◯ Content moderation: auto-flag NSFW / hate via Workers AI moderation
82. ◯ DMCA takedown form + transparency log
83. ◯ Per-PDF report button → moderation queue
84. ◯ Author block list (hide remixes from blocked users)
85. ◯ Sentry breadcrumbs on every Hono route
86. ◯ PostHog session replays for editor sessions (opt-in)
87. ◯ Lighthouse CI gate: perf >= 90, a11y >= 95 on `/`, `/explore`, `/c/:slug`
88. ◯ Image CDN: R2 + Cloudflare Images for thumbnails
89. ◯ Worker streaming responses for `render` endpoint
90. ◯ Edge cache for `/api/explore` feed with `stale-while-revalidate`

## Phase 8 — Delight Moments

91. ◯ Konami code on `/explore`: confetti + Easter-egg PDF
92. ◯ Loading skeletons that show the page outline being painted in
93. ◯ "Make me feel lucky" button: random Pro template, one click to fork
94. ◯ Sound design: subtle click on Remix, swoosh on Present Mode entry
95. ◯ Branded 404 + 500 pages with a "remix this page" CTA
96. ◯ Empty state: "No PDFs yet. Try `make me a 1-page resume for a founder.`"
97. ◯ Author birthday confetti on profile page (opt-in)
98. ◯ "Time-travel" replay: scrub through every edit as a video
99. ◯ Print queue animation in Present Mode: pages fly past like Prezi
100. ◯ "Share to X / LinkedIn" with auto-generated quote-card OG image
