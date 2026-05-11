// Shared page-layout source of truth.
// Preview iframe (web/lib/preview.ts), share view (worker/lib/templates.ts),
// and the puppeteer PDF export all build documents through buildPagedDocument()
// so the on-screen WYSIWYG surface maps 1:1 to the exported PDF.

export const PAGE_DIMS = {
  Letter: { wIn: 8.5, hIn: 11 },
  A4: { wIn: 8.27, hIn: 11.69 },
  Legal: { wIn: 8.5, hIn: 14 },
} as const;

export type PageSize = keyof typeof PAGE_DIMS;

const DPI = 96;

export const pageDimsPx = (size: PageSize) => {
  const d = PAGE_DIMS[size];
  return { w: Math.round(d.wIn * DPI), h: Math.round(d.hIn * DPI) };
};

export const parseMarginIn = (margin: string): number => {
  const m = margin.match(/^([\d.]+)(in|mm|cm|pt)$/);
  if (!m) return 0.75;
  const n = parseFloat(m[1] ?? "0.75");
  switch (m[2]) {
    case "mm": return n / 25.4;
    case "cm": return n / 2.54;
    case "pt": return n / 72;
    default: return n;
  }
};

const FONTS_LINK = `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" />`;

// Single pagination algorithm — used by every variant.
// Splits on explicit .page-break / [data-page-break] markers, then flows
// overflow children to new pages. Posts {type, pages} to parent when done.
// Auto-re-paginates on DOM changes (debounced) so contenteditable edits keep
// WYSIWYG fidelity with the eventual PDF. Cursor preserved across re-flow.
const PAGINATION_SCRIPT = (readyType: string, autoRepaginate: boolean) => `(function(){
  let paginating = false;
  function collapseToSingle() {
    const pages = document.querySelectorAll('.page');
    if (pages.length <= 1) {
      pages.forEach(function(p){ p.querySelectorAll('[data-pn]').forEach(function(n){ n.remove(); }); });
      return;
    }
    const first = pages[0];
    first.querySelectorAll('[data-pn]').forEach(function(n){ n.remove(); });
    for (let i = 1; i < pages.length; i++) {
      const p = pages[i];
      p.querySelectorAll('[data-pn]').forEach(function(n){ n.remove(); });
      while (p.firstChild) first.appendChild(p.firstChild);
      p.remove();
    }
  }
  function saveCursor() {
    const sel = document.getSelection(); if (!sel || sel.rangeCount === 0) return null;
    const r = sel.getRangeAt(0);
    if (!document.body.contains(r.startContainer)) return null;
    const marker = document.createElement('span');
    marker.setAttribute('data-cursor-marker', '');
    marker.style.cssText = 'display:inline;width:0;height:0;';
    try { r.insertNode(marker); } catch(e) { return null; }
    return true;
  }
  function restoreCursor() {
    const marker = document.querySelector('[data-cursor-marker]');
    if (!marker) return;
    try {
      const r = document.createRange();
      r.setStartBefore(marker); r.collapse(true);
      const sel = document.getSelection();
      sel.removeAllRanges(); sel.addRange(r);
    } catch(e) {}
    marker.remove();
  }
  function paginate() {
    paginating = true;
    saveCursor();
    collapseToSingle();
    const initial = document.querySelector('.page');
    if (!initial) { paginating = false; return 0; }
    let pages = [initial];
    function splitOnExplicit(page) {
      page.querySelectorAll('.page-break,[data-page-break]').forEach(function(brk){
        const np = document.createElement('div'); np.className = 'page';
        let node = brk.nextSibling;
        while (node) { const next = node.nextSibling; np.appendChild(node); node = next; }
        brk.remove();
        if (np.children.length > 0) { page.after(np); pages.push(np); }
      });
    }
    function flattenWrappers(page) {
      let safety = 20;
      while (safety-- > 0 && page.scrollHeight > page.clientHeight + 2) {
        const blocks = Array.from(page.children).filter(function(c){ return !c.hasAttribute('data-pn'); });
        if (blocks.length !== 1) break;
        const only = blocks[0];
        if (!only.children || only.children.length < 2) break;
        const parent = only.parentNode;
        while (only.firstChild) parent.insertBefore(only.firstChild, only);
        only.remove();
      }
    }
    function flowOverflow(page) {
      flattenWrappers(page);
      let s = 200;
      while (page.scrollHeight > page.clientHeight + 2 && s-- > 0) {
        const np = document.createElement('div'); np.className = 'page';
        while (page.scrollHeight > page.clientHeight + 2 && page.children.length > 1) {
          const last = page.lastElementChild;
          if (!last || last.hasAttribute('data-pn')) break;
          np.insertBefore(last, np.firstChild);
        }
        if (np.children.length === 0) break;
        page.after(np); pages.push(np); page = np;
      }
    }
    let i = 0; while (i < pages.length) { splitOnExplicit(pages[i]); i++; }
    let j = 0; while (j < pages.length) { flowOverflow(pages[j]); j++; }
    const all = document.querySelectorAll('.page');
    all.forEach(function(p, idx){
      const pn = document.createElement('div');
      pn.className = 'page-number';
      pn.setAttribute('data-pn','');
      pn.textContent = (idx + 1) + ' / ' + all.length;
      p.appendChild(pn);
      if (${autoRepaginate ? "true" : "false"}) p.contentEditable = 'true';
    });
    restoreCursor();
    requestAnimationFrame(function(){ paginating = false; });
    return all.length;
  }
  function emit(count) {
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        try { parent.postMessage({ type: '${readyType}', pages: count, height: document.documentElement.scrollHeight }, '*'); } catch(e) {}
        window.__pdfReady = true;
      });
    });
  }
  function run() { emit(paginate()); }
  let repaginateTimer = null;
  function schedule() {
    if (paginating) return;
    if (repaginateTimer) clearTimeout(repaginateTimer);
    repaginateTimer = setTimeout(function(){ emit(paginate()); }, 600);
  }
  if (${autoRepaginate ? "true" : "false"}) {
    window.__repaginate = function(){ emit(paginate()); };
    document.addEventListener('input', schedule);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run, run);
  } else if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }
})();`;

interface BuildOpts {
  /** "preview" = gray-bg editor surface with contenteditable hint
   *  "share"   = read-only public preview (gray-bg, no edit affordance)
   *  "pdf"     = white-bg, zero chrome — handed to puppeteer.pdf() */
  mode: "preview" | "share" | "pdf";
}

export const buildPagedDocument = (
  html: string,
  css: string,
  pageSize: PageSize,
  margin: string,
  opts: BuildOpts
): string => {
  const dims = PAGE_DIMS[pageSize];
  const marginIn = parseMarginIn(margin);
  const isPdf = opts.mode === "pdf";
  const isPreview = opts.mode === "preview";
  const readyType = isPdf ? "pdf:rendered" : isPreview ? "preview:rendered" : "share:rendered";
  const pageBg = isPdf ? "white" : "#d4d4d8";
  const cursor = isPreview ? "text" : "default";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${isPdf ? "Document" : "Preview"}</title>
${FONTS_LINK}
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  html { background: ${pageBg}; }
  body {
    background: ${pageBg};
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${isPdf ? "0" : "24px 16px 64px"};
    gap: ${isPdf ? "0" : "24px"};
    min-height: 100vh;
  }
  .page {
    width: ${dims.wIn}in;
    height: ${dims.hIn}in;
    background: white;
    padding: ${marginIn}in;
    overflow: hidden;
    position: relative;
    flex: none;
    cursor: ${cursor};
    ${isPdf ? "" : "box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.08);"}
    page-break-after: always;
    break-after: page;
  }
  .page:last-of-type { page-break-after: auto; break-after: auto; }
  .page-number {
    position: absolute;
    bottom: 8px;
    right: 16px;
    font-size: 9px;
    color: #9ca3af;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
    pointer-events: none;
    user-select: none;
  }
  ${css}
  /* Render-parity overrides (must come after user css):
     .page padding IS the page margin; nested .doc/body padding would double up. */
  .page > .doc, .page > body { padding: 0 !important; margin: 0 !important; }
  ${isPdf ? `.page-number { display: none; }` : ""}
  @page { size: ${dims.wIn}in ${dims.hIn}in; margin: 0; }
  @media print {
    html, body { background: white !important; padding: 0 !important; gap: 0 !important; display: block !important; }
    .page { box-shadow: none !important; cursor: default !important; }
    .page-number { display: none; }
  }
</style>
</head>
<body>
<div class="page">
${html}
<div class="page-number" data-pn>1</div>
</div>
<script>${PAGINATION_SCRIPT(readyType, isPreview)}</script>
</body>
</html>`;
};
