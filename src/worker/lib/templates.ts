import {
  buildPagedDocument,
  PAGE_DIMS,
  parseMarginIn,
  type PageSize,
} from "../../shared/pageLayout";

export const PAGE_DIMENSIONS = {
  Letter: { width: "8.5in", height: "11in", widthPx: 816, heightPx: 1056 },
  A4: { width: "210mm", height: "297mm", widthPx: 794, heightPx: 1123 },
  Legal: { width: "8.5in", height: "14in", widthPx: 816, heightPx: 1344 },
} as const;

export const STARTER_HTML = `<div class="doc">
  <article>
    <header>
      <h1>Untitled Document</h1>
      <p class="subtitle">A blank canvas. Click any text to edit, or ask the chat to make it yours.</p>
    </header>
    <section>
      <p>Type a prompt — "build me a one-page resume for a senior engineer named Alex Rivera" or "create a quarterly business report template" — and watch this preview update in real time.</p>
      <p>Each printed page wraps automatically at the size you choose. Add <code>&lt;div class="page-break"&gt;&lt;/div&gt;</code> anywhere to force a new page.</p>
    </section>
  </article>
</div>`;

export const STARTER_CSS = `.doc {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
  line-height: 1.6;
  font-size: 11pt;
}
h1 {
  font-size: 28pt;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 0.25em;
  color: #060610;
}
.subtitle {
  color: #6b7280;
  font-size: 12pt;
  margin: 0 0 2em;
}
section p {
  margin: 0 0 1em;
}
code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10pt;
}
.page-break {
  page-break-after: always;
  break-after: page;
}`;

const coercePageSize = (s: string): PageSize =>
  s === "A4" || s === "Legal" || s === "Letter" ? s : "Letter";

const MADE_WITH_BADGE = `<a href="https://pdf.megabyte.space/?ref=made-with" target="_blank" rel="noopener" style="position:fixed;bottom:14px;right:14px;z-index:9999;display:inline-flex;align-items:center;gap:6px;padding:6px 11px;background:rgba(6,6,16,0.92);color:#00E5FF;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.02em;text-decoration:none;border:1px solid rgba(0,229,255,0.35);border-radius:999px;backdrop-filter:blur(8px);box-shadow:0 4px 14px rgba(0,0,0,0.25);transition:all .15s ease" onmouseover="this.style.background='rgba(0,229,255,0.12)';this.style.borderColor='rgba(0,229,255,0.7)'" onmouseout="this.style.background='rgba(6,6,16,0.92)';this.style.borderColor='rgba(0,229,255,0.35)'"><span style="display:inline-block;width:6px;height:6px;background:#00E5FF;border-radius:50%;box-shadow:0 0 6px #00E5FF"></span>Made with Megabyte PDF</a>`;

export const buildSharePreviewDoc = (
  html: string,
  css: string,
  pageSize: string = "Letter",
  margin: string = "0.75in",
  options: { badge?: boolean } = { badge: true }
): string => {
  const doc = buildPagedDocument(html, css, coercePageSize(pageSize), margin, { mode: "share" });
  if (options.badge === false) return doc;
  return doc.includes("</body>") ? doc.replace("</body>", `${MADE_WITH_BADGE}</body>`) : doc + MADE_WITH_BADGE;
};

export const wrapDocument = (
  html: string,
  css: string,
  pageSize: string = "Letter",
  margin: string = "0.75in"
): string =>
  buildPagedDocument(html, css, coercePageSize(pageSize), margin, { mode: "pdf" });

export const pageDimensionsIn = (pageSize: string) => {
  const k = coercePageSize(pageSize);
  return PAGE_DIMS[k];
};

export const marginIn = parseMarginIn;
