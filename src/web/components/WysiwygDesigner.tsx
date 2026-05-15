import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Type,
  Heading,
  Image as ImageIcon,
  Square as SquareIcon,
  Circle,
  Minus,
  Table,
  QrCode,
  PenLine,
  Star,
  BadgeCheck,
  Wand2,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Group,
  Ungroup,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter,
  Bold,
  Italic,
  Underline,
  RotateCcw,
  RotateCw,
  Grid3x3,
  Magnet,
  ChevronDown,
  ChevronUp,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Plus,
  PaintBucket,
  Move,
  X,
} from "lucide-react";

interface WysiwygDesignerProps {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  active: boolean;
  onToggleActive: () => void;
  onAiPopulate: (prompt: string) => void;
  onDirty?: () => void;
}

type LibraryItem = {
  id: string;
  label: string;
  icon: typeof Type;
  html: (rect: { w: number; h: number }) => string;
};

const LIBRARY: LibraryItem[] = [
  { id: "text", label: "Text", icon: Type, html: ({ w, h }) => `<div class="wd-block wd-text" style="width:${w}px;height:${h}px;font-size:14px;color:#111;padding:6px;">Click to edit text</div>` },
  { id: "heading", label: "Heading", icon: Heading, html: ({ w, h }) => `<h2 class="wd-block wd-heading" style="width:${w}px;min-height:${h}px;font-size:28px;font-weight:700;color:#0a0a0a;line-height:1.15;padding:6px;">Heading</h2>` },
  { id: "image", label: "Image", icon: ImageIcon, html: ({ w, h }) => `<div class="wd-block wd-image" style="width:${w}px;height:${h}px;background:#e5e7eb url('https://images.unsplash.com/photo-1521133573892-e44906baee46?w=800') center/cover;border-radius:8px;"></div>` },
  { id: "rect", label: "Rectangle", icon: SquareIcon, html: ({ w, h }) => `<div class="wd-block wd-shape" style="width:${w}px;height:${h}px;background:linear-gradient(135deg,#00E5FF,#7C3AED);border-radius:8px;"></div>` },
  { id: "circle", label: "Circle", icon: Circle, html: ({ w, h }) => `<div class="wd-block wd-shape" style="width:${Math.min(w, h)}px;height:${Math.min(w, h)}px;background:#7C3AED;border-radius:50%;"></div>` },
  { id: "divider", label: "Divider", icon: Minus, html: ({ w }) => `<hr class="wd-block wd-divider" style="width:${w}px;border:0;border-top:2px solid #111;margin:0;" />` },
  { id: "table", label: "Table", icon: Table, html: ({ w, h }) => `<table class="wd-block wd-table" style="width:${w}px;min-height:${h}px;border-collapse:collapse;font-size:13px;"><thead><tr><th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:left;">Column A</th><th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:left;">Column B</th><th style="border:1px solid #d1d5db;padding:6px 10px;background:#f3f4f6;text-align:left;">Column C</th></tr></thead><tbody><tr><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 1A</td><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 1B</td><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 1C</td></tr><tr><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 2A</td><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 2B</td><td style="border:1px solid #d1d5db;padding:6px 10px;">Row 2C</td></tr></tbody></table>` },
  { id: "qr", label: "QR code", icon: QrCode, html: ({ w, h }) => { const sz = Math.min(w, h); const enc = encodeURIComponent("https://pdf.megabyte.space"); return `<div class="wd-block wd-qr" style="width:${sz}px;height:${sz}px;background:#fff url('https://api.qrserver.com/v1/create-qr-code/?size=${sz}x${sz}&data=${enc}') center/contain no-repeat;"></div>`; } },
  { id: "signature", label: "Signature", icon: PenLine, html: ({ w }) => `<div class="wd-block wd-signature" style="width:${w}px;border-bottom:1px solid #111;padding:30px 0 4px;font-size:11px;color:#6b7280;font-family:'JetBrains Mono',monospace;">Signature</div>` },
  { id: "badge", label: "Badge", icon: BadgeCheck, html: ({ w, h }) => `<span class="wd-block wd-badge" style="display:inline-flex;align-items:center;gap:6px;width:${w}px;height:${h}px;padding:6px 12px;background:#10b981;color:#fff;font-size:12px;font-weight:600;border-radius:999px;justify-content:center;">VERIFIED</span>` },
  { id: "star", label: "Star burst", icon: Star, html: ({ w, h }) => { const sz = Math.min(w, h); return `<svg class="wd-block wd-svg" width="${sz}" height="${sz}" viewBox="0 0 100 100"><polygon points="50,5 61,38 96,38 67,58 78,92 50,72 22,92 33,58 4,38 39,38" fill="#facc15" stroke="#92400e" stroke-width="2"/></svg>`; } },
  { id: "callout", label: "Callout", icon: BadgeCheck, html: ({ w, h }) => `<div class="wd-block wd-callout" style="width:${w}px;min-height:${h}px;padding:14px 18px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;font-size:14px;color:#78350f;">Important — replace this with your callout text.</div>` },
];

type LayerRow = { id: string; tag: string; preview: string; hidden: boolean; locked: boolean; page: number };

const SCRIPT_ID = "wd-designer-script";

const buildDesignerScript = (): string => `
(function(){
  if (window.__wdInstalled) return; window.__wdInstalled = true;
  var DOC = document, ROOT = DOC.documentElement;
  var state = { active:false, selection:[], marquee:null, snap:true, grid:false, outline:false, history:[], future:[], dragging:null, resizing:null, lockedIds:new Set(), hiddenIds:new Set() };

  function uid(){ return 'wd-' + Math.random().toString(36).slice(2,9); }
  function ensureId(el){ if(!el.dataset.wdId) el.dataset.wdId = uid(); return el.dataset.wdId; }
  function send(type,data){ try{ parent.postMessage(Object.assign({type:type,wd:true},data||{}),'*'); }catch(e){} }
  function fireInput(){ DOC.dispatchEvent(new Event('input',{bubbles:true})); }
  function pushHistory(){ state.history.push(serialize()); if(state.history.length>50) state.history.shift(); state.future.length=0; }
  function serialize(){
    var pages = DOC.querySelectorAll('.page');
    return Array.from(pages).map(function(p){ var c=p.cloneNode(true); c.querySelectorAll('[data-pn],.wd-overlay,.wd-handle,.wd-marquee,.wd-guide').forEach(function(n){n.remove();}); return c.innerHTML; }).join('\\n<div class="page-break"></div>\\n');
  }
  function restore(html){ var pages=DOC.querySelectorAll('.page'); if(!pages.length) return; pages.forEach(function(p,i){ if(i===0) p.innerHTML=html.split('<div class="page-break"></div>')[0]||''; else p.remove(); }); if(window.__repaginate) window.__repaginate(); fireInput(); redrawSelection(); emitLayers(); }
  function undo(){ if(!state.history.length) return; state.future.push(serialize()); restore(state.history.pop()); }
  function redo(){ if(!state.future.length) return; state.history.push(serialize()); restore(state.future.pop()); }

  function injectStyle(){
    if (DOC.getElementById('wd-style')) return;
    var s = DOC.createElement('style'); s.id='wd-style'; s.textContent = [
      '[data-wd-active] .page{cursor:crosshair !important;}',
      '[data-wd-active] .page *{cursor:default;}',
      '.wd-marquee{position:absolute;border:1.5px dashed #00E5FF;background:rgba(0,229,255,0.08);pointer-events:none;z-index:9998;border-radius:2px;}',
      '.wd-overlay{position:absolute;border:1.5px solid #00E5FF;pointer-events:none;z-index:9997;box-shadow:0 0 0 1px rgba(0,229,255,0.25);}',
      '.wd-overlay.wd-hover{border-style:dashed;border-color:#7C3AED;}',
      '.wd-handle{position:absolute;width:9px;height:9px;background:#fff;border:1.5px solid #00E5FF;border-radius:2px;z-index:9999;pointer-events:auto;}',
      '.wd-handle.tl{cursor:nwse-resize;}.wd-handle.tr{cursor:nesw-resize;}.wd-handle.bl{cursor:nesw-resize;}.wd-handle.br{cursor:nwse-resize;}',
      '.wd-handle.t{cursor:ns-resize;}.wd-handle.b{cursor:ns-resize;}.wd-handle.l{cursor:ew-resize;}.wd-handle.r{cursor:ew-resize;}',
      '.wd-guide{position:absolute;background:#ef4444;pointer-events:none;z-index:9996;}',
      '.wd-guide.v{width:1px;}.wd-guide.h{height:1px;}',
      '.wd-size-tip{position:absolute;background:#0a0a0a;color:#00E5FF;font:11px/1 \\'JetBrains Mono\\',monospace;padding:3px 6px;border-radius:3px;pointer-events:none;z-index:10000;}',
      '[data-wd-grid] .page{background-image:linear-gradient(to right,rgba(0,0,0,0.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(0,0,0,0.06) 1px,transparent 1px);background-size:8px 8px;}',
      '[data-wd-outline] .page *:not([data-pn]){outline:1px dashed rgba(124,58,237,0.4) !important;}',
      '[data-wd-id].wd-hidden{opacity:0.15;outline:1px dashed #ef4444;}',
      '[data-wd-id].wd-locked::after{content:"\\1F512";position:absolute;top:2px;right:2px;font-size:10px;opacity:0.5;}',
      '.wd-block{position:relative;}',
      '.page [contenteditable=true]:focus{outline:2px solid #00E5FF;outline-offset:2px;}',
    ].join('\\n');
    DOC.head.appendChild(s);
  }

  function rectOf(el){ var r=el.getBoundingClientRect(); var pr=el.closest('.page').getBoundingClientRect(); return {x:r.left-pr.left,y:r.top-pr.top,w:r.width,h:r.height}; }
  function pageOf(el){ return el.closest('.page'); }
  function pageAt(x,y){ var pages=DOC.querySelectorAll('.page'); for(var i=0;i<pages.length;i++){ var r=pages[i].getBoundingClientRect(); if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom) return {page:pages[i], idx:i+1, rect:r}; } return null; }

  var marqueeEl=null, sizeTipEl=null, overlaysEl=[], handlesEl=[], guidesEl=[];
  function clearVisuals(){ if(marqueeEl){marqueeEl.remove();marqueeEl=null;} if(sizeTipEl){sizeTipEl.remove();sizeTipEl=null;} overlaysEl.forEach(function(o){o.remove();}); overlaysEl=[]; handlesEl.forEach(function(o){o.remove();}); handlesEl=[]; guidesEl.forEach(function(o){o.remove();}); guidesEl=[]; }

  function redrawSelection(){
    overlaysEl.forEach(function(o){o.remove();}); overlaysEl=[];
    handlesEl.forEach(function(o){o.remove();}); handlesEl=[];
    state.selection.forEach(function(el, i){
      if(!el.isConnected) return;
      var page = pageOf(el); if(!page) return;
      var r = el.getBoundingClientRect(); var pr = page.getBoundingClientRect();
      var ov = DOC.createElement('div'); ov.className='wd-overlay';
      ov.style.left = (r.left - pr.left) + 'px'; ov.style.top = (r.top - pr.top) + 'px'; ov.style.width = r.width + 'px'; ov.style.height = r.height + 'px';
      page.appendChild(ov); overlaysEl.push(ov);
      if(state.selection.length === 1){
        ['tl','t','tr','l','r','bl','b','br'].forEach(function(pos){
          var h = DOC.createElement('div'); h.className='wd-handle '+pos; h.dataset.wdHandle=pos; h.dataset.wdTarget = ensureId(el);
          var L = r.left - pr.left, T = r.top - pr.top, W = r.width, H = r.height;
          var px = (pos==='tl'||pos==='l'||pos==='bl') ? L : (pos==='t'||pos==='b') ? L + W/2 : L + W;
          var py = (pos==='tl'||pos==='t'||pos==='tr') ? T : (pos==='l'||pos==='r') ? T + H/2 : T + H;
          h.style.left = (px - 5) + 'px'; h.style.top = (py - 5) + 'px';
          page.appendChild(h); handlesEl.push(h);
        });
      }
    });
  }

  function intersects(a,b){ return !(a.x+a.w<b.x||b.x+b.w<a.x||a.y+a.h<b.y||b.y+b.h<a.y); }

  function pickIntersecting(page, rect){
    var pr = page.getBoundingClientRect();
    var out=[];
    page.querySelectorAll(':scope > *').forEach(function(el){
      if(el.classList.contains('wd-overlay')||el.classList.contains('wd-handle')||el.classList.contains('wd-marquee')||el.classList.contains('wd-guide')||el.hasAttribute('data-pn')) return;
      var r = el.getBoundingClientRect();
      var lr = {x:r.left-pr.left,y:r.top-pr.top,w:r.width,h:r.height};
      if(intersects(lr,rect)) out.push(el);
    });
    return out;
  }

  function setSelection(els, opts){
    state.selection = els.filter(function(e){ return e && e.isConnected; });
    state.selection.forEach(function(el){ ensureId(el); });
    redrawSelection();
    emitSelection(opts && opts.menu ? opts.menu : null);
  }
  function emitSelection(menuAt){
    var infos = state.selection.map(function(el){
      var r = el.getBoundingClientRect();
      return { id: ensureId(el), tag: el.tagName.toLowerCase(), text: (el.textContent||'').slice(0,40), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, fontFamily: getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g,''), fontSize: getComputedStyle(el).fontSize, fontWeight: getComputedStyle(el).fontWeight };
    });
    send('wd:selection', { items: infos, menuAt: menuAt });
  }
  function emitLayers(){
    var pages = DOC.querySelectorAll('.page');
    var rows = [];
    pages.forEach(function(p, pi){
      p.querySelectorAll(':scope > *').forEach(function(el){
        if(el.hasAttribute('data-pn')||el.classList.contains('wd-overlay')||el.classList.contains('wd-handle')||el.classList.contains('wd-marquee')||el.classList.contains('wd-guide')) return;
        ensureId(el);
        rows.push({ id: el.dataset.wdId, page: pi+1, tag: el.tagName.toLowerCase(), preview:(el.textContent||el.getAttribute('alt')||el.tagName).toString().trim().slice(0,32), hidden: state.hiddenIds.has(el.dataset.wdId), locked: state.lockedIds.has(el.dataset.wdId) });
      });
    });
    send('wd:layers', { rows: rows });
  }
  function getById(id){ return DOC.querySelector('[data-wd-id="'+id+'"]'); }

  // Pointer handling — marquee + click-select + drag-move + resize
  var dragStart=null;
  ROOT.addEventListener('pointerdown', function(e){
    if(!state.active) return;
    var t = e.target;
    if(t && t.classList && t.classList.contains('wd-handle')){
      // Resize start
      var id = t.dataset.wdTarget; var pos = t.dataset.wdHandle; var el = getById(id); if(!el) return;
      e.preventDefault(); pushHistory();
      var r0 = el.getBoundingClientRect();
      var sx = e.clientX, sy = e.clientY;
      state.resizing = { el:el, pos:pos, sx:sx, sy:sy, w:r0.width, h:r0.height, l:r0.left, top:r0.top };
      ROOT.setPointerCapture(e.pointerId);
      return;
    }
    var hit = pageAt(e.clientX, e.clientY); if(!hit) return;
    var pr = hit.rect; var lx = e.clientX - pr.left, ly = e.clientY - pr.top;
    var inner = hit.page.querySelectorAll(':scope > *');
    var hitEl = null;
    for(var i=inner.length-1;i>=0;i--){ var el=inner[i]; if(el.hasAttribute('data-pn')||el.classList.contains('wd-overlay')||el.classList.contains('wd-handle')||el.classList.contains('wd-marquee')||el.classList.contains('wd-guide')) continue; var r=el.getBoundingClientRect(); if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){ hitEl=el; break; } }
    if(hitEl && !state.lockedIds.has(ensureId(hitEl))){
      e.preventDefault();
      if(!e.shiftKey){ state.selection = [hitEl]; } else { if(state.selection.indexOf(hitEl)===-1) state.selection.push(hitEl); }
      redrawSelection(); emitSelection(null);
      pushHistory();
      var r0 = hitEl.getBoundingClientRect();
      state.dragging = { els:state.selection.slice(), sx:e.clientX, sy:e.clientY, origs: state.selection.map(function(el){ var rr=el.getBoundingClientRect(); var s=getComputedStyle(el); return { el:el, left: parseFloat(el.style.left)||0, top: parseFloat(el.style.top)||0, hadPos: el.style.position||s.position }; }) };
      state.selection.forEach(function(el){ var s=getComputedStyle(el); if(s.position==='static'){ var r=el.getBoundingClientRect(); var p=pageOf(el).getBoundingClientRect(); el.style.position='relative'; } });
      ROOT.setPointerCapture(e.pointerId);
      return;
    }
    // Empty area → marquee
    e.preventDefault();
    state.marquee = { page: hit.page, sx:lx, sy:ly, x:lx, y:ly, w:0, h:0 };
    marqueeEl = DOC.createElement('div'); marqueeEl.className='wd-marquee'; hit.page.appendChild(marqueeEl);
    sizeTipEl = DOC.createElement('div'); sizeTipEl.className='wd-size-tip'; hit.page.appendChild(sizeTipEl);
    setSelection([]);
    ROOT.setPointerCapture(e.pointerId);
  });

  ROOT.addEventListener('pointermove', function(e){
    if(state.resizing){
      var r = state.resizing; var dx = e.clientX - r.sx, dy = e.clientY - r.sy;
      var nw = r.w, nh = r.h, dL = 0, dT = 0;
      if(r.pos.indexOf('r')>-1) nw = Math.max(8, r.w + dx);
      if(r.pos.indexOf('l')>-1){ nw = Math.max(8, r.w - dx); dL = dx; }
      if(r.pos.indexOf('b')>-1) nh = Math.max(8, r.h + dy);
      if(r.pos.indexOf('t')>-1){ nh = Math.max(8, r.h - dy); dT = dy; }
      if(state.snap){ nw=Math.round(nw/8)*8; nh=Math.round(nh/8)*8; }
      r.el.style.width = nw + 'px';
      r.el.style.height = nh + 'px';
      redrawSelection();
      return;
    }
    if(state.dragging){
      var d = state.dragging; var ddx = e.clientX - d.sx, ddy = e.clientY - d.sy;
      if(state.snap){ ddx = Math.round(ddx/8)*8; ddy = Math.round(ddy/8)*8; }
      d.origs.forEach(function(o){ o.el.style.left = (o.left + ddx) + 'px'; o.el.style.top = (o.top + ddy) + 'px'; });
      redrawSelection();
      // Alignment guides (page edges + center)
      guidesEl.forEach(function(g){g.remove();}); guidesEl=[];
      d.origs.forEach(function(o){
        var page = pageOf(o.el); if(!page) return;
        var pr = page.getBoundingClientRect(); var r = o.el.getBoundingClientRect();
        var cx = (r.left + r.width/2) - pr.left, cy = (r.top + r.height/2) - pr.top;
        var pcx = pr.width/2, pcy = pr.height/2;
        if(Math.abs(cx - pcx) < 5){ var g = DOC.createElement('div'); g.className='wd-guide v'; g.style.left=pcx+'px'; g.style.top='0'; g.style.height=pr.height+'px'; page.appendChild(g); guidesEl.push(g); o.el.style.left = (parseFloat(o.el.style.left)||0) + (pcx - cx) + 'px'; }
        if(Math.abs(cy - pcy) < 5){ var g2 = DOC.createElement('div'); g2.className='wd-guide h'; g2.style.top=pcy+'px'; g2.style.left='0'; g2.style.width=pr.width+'px'; page.appendChild(g2); guidesEl.push(g2); o.el.style.top = (parseFloat(o.el.style.top)||0) + (pcy - cy) + 'px'; }
      });
      return;
    }
    if(state.marquee){
      var m = state.marquee; var hit = pageAt(e.clientX, e.clientY); var pr = m.page.getBoundingClientRect();
      var lx = e.clientX - pr.left, ly = e.clientY - pr.top;
      m.x = Math.min(m.sx, lx); m.y = Math.min(m.sy, ly); m.w = Math.abs(lx - m.sx); m.h = Math.abs(ly - m.sy);
      marqueeEl.style.left = m.x + 'px'; marqueeEl.style.top = m.y + 'px'; marqueeEl.style.width = m.w + 'px'; marqueeEl.style.height = m.h + 'px';
      sizeTipEl.style.left = (m.x + m.w + 6) + 'px'; sizeTipEl.style.top = (m.y + m.h + 6) + 'px';
      sizeTipEl.textContent = Math.round(m.w) + ' × ' + Math.round(m.h);
    }
  });

  ROOT.addEventListener('pointerup', function(e){
    if(state.resizing){ state.resizing = null; fireInput(); emitSelection(null); emitLayers(); return; }
    if(state.dragging){ state.dragging = null; guidesEl.forEach(function(g){g.remove();}); guidesEl=[]; fireInput(); emitSelection(null); emitLayers(); return; }
    if(state.marquee){
      var m = state.marquee; var page = m.page;
      if(m.w > 4 && m.h > 4){
        var els = pickIntersecting(page, { x:m.x, y:m.y, w:m.w, h:m.h });
        // Compute menu position in iframe-viewport coords
        var pr = page.getBoundingClientRect();
        var menuX = m.x + m.w + pr.left;
        var menuY = m.y + pr.top;
        send('wd:marquee', { page: Array.from(DOC.querySelectorAll('.page')).indexOf(page)+1, rect: m, intersect: els.map(function(el){return ensureId(el);}), menu: { x: menuX, y: menuY } });
        setSelection(els, { menu: null });
      } else {
        setSelection([]);
        send('wd:menu-close', {});
      }
      if(marqueeEl){marqueeEl.remove();marqueeEl=null;}
      if(sizeTipEl){sizeTipEl.remove();sizeTipEl=null;}
      state.marquee = null;
    }
  });

  // Double-click → contentEditable on selected text element
  ROOT.addEventListener('dblclick', function(e){
    if(!state.active) return;
    var hit = pageAt(e.clientX, e.clientY); if(!hit) return;
    var el = DOC.elementFromPoint(e.clientX, e.clientY);
    if(!el || el.classList.contains('page') || el.classList.contains('wd-handle') || el.classList.contains('wd-overlay')) return;
    e.preventDefault(); e.stopPropagation();
    el.contentEditable = 'true'; el.focus();
    var range = DOC.createRange(); range.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
    el.addEventListener('blur', function once(){ el.contentEditable='false'; el.removeEventListener('blur', once); fireInput(); }, { once: true });
  });

  // Keyboard shortcuts inside iframe
  DOC.addEventListener('keydown', function(e){
    if(!state.active) return;
    if(DOC.activeElement && DOC.activeElement.isContentEditable) return;
    var meta = e.metaKey || e.ctrlKey;
    if(meta && e.key.toLowerCase() === 'z' && !e.shiftKey){ e.preventDefault(); undo(); return; }
    if(meta && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase()==='z'))){ e.preventDefault(); redo(); return; }
    if(meta && e.key.toLowerCase() === 'd'){ e.preventDefault(); cmd('duplicate'); return; }
    if(meta && e.key.toLowerCase() === 'g'){ e.preventDefault(); cmd(e.shiftKey?'ungroup':'group'); return; }
    if(e.key === 'Delete' || e.key === 'Backspace'){ if(state.selection.length){ e.preventDefault(); cmd('delete'); } return; }
    if(e.key === 'Escape'){ setSelection([]); send('wd:menu-close', {}); return; }
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.key)>-1 && state.selection.length){
      e.preventDefault();
      var step = e.shiftKey ? 10 : 1;
      var dx = e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0;
      var dy = e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
      state.selection.forEach(function(el){ var s=getComputedStyle(el); if(s.position==='static') el.style.position='relative'; el.style.left = ((parseFloat(el.style.left)||0)+dx)+'px'; el.style.top = ((parseFloat(el.style.top)||0)+dy)+'px'; });
      redrawSelection(); fireInput(); emitSelection(null);
    }
  });

  function insertAt(rect, html, pageEl){
    pushHistory();
    var tmp = DOC.createElement('div'); tmp.innerHTML = html.trim();
    var node = tmp.firstElementChild; if(!node) return null;
    ensureId(node);
    node.style.position = 'relative';
    node.style.left = rect.x + 'px';
    node.style.top = rect.y + 'px';
    pageEl.appendChild(node);
    fireInput(); emitLayers();
    return node;
  }

  function cmd(name, payload){
    var sel = state.selection.slice();
    if(name === 'insert'){
      var hit = pageAt(payload.menu.x, payload.menu.y) || { page: DOC.querySelector('.page') };
      var node = insertAt(payload.rect, payload.html, hit.page);
      if(node) setSelection([node], { menu: null });
      return;
    }
    if(name === 'delete'){ pushHistory(); sel.forEach(function(el){ el.remove(); }); setSelection([]); fireInput(); emitLayers(); return; }
    if(name === 'duplicate'){ pushHistory(); var dups = sel.map(function(el){ var c = el.cloneNode(true); c.dataset.wdId = uid(); c.style.position='relative'; c.style.left = ((parseFloat(el.style.left)||0)+20)+'px'; c.style.top = ((parseFloat(el.style.top)||0)+20)+'px'; el.parentNode.appendChild(c); return c; }); setSelection(dups); fireInput(); emitLayers(); return; }
    if(name === 'group'){ pushHistory(); if(sel.length<2) return; var g = DOC.createElement('div'); g.className='wd-block wd-group'; g.style.position='relative'; ensureId(g); var page = pageOf(sel[0]); var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity; sel.forEach(function(el){ var r=rectOf(el); minX=Math.min(minX,r.x); minY=Math.min(minY,r.y); maxX=Math.max(maxX,r.x+r.w); maxY=Math.max(maxY,r.y+r.h); }); g.style.left=minX+'px'; g.style.top=minY+'px'; g.style.width=(maxX-minX)+'px'; g.style.height=(maxY-minY)+'px'; sel.forEach(function(el){ var r=rectOf(el); el.style.position='absolute'; el.style.left=(r.x-minX)+'px'; el.style.top=(r.y-minY)+'px'; g.appendChild(el); }); page.appendChild(g); setSelection([g]); fireInput(); emitLayers(); return; }
    if(name === 'ungroup'){ pushHistory(); sel.forEach(function(g){ if(!g.classList.contains('wd-group')) return; var page = pageOf(g); var gl=parseFloat(g.style.left)||0, gt=parseFloat(g.style.top)||0; Array.from(g.children).forEach(function(c){ var cl=parseFloat(c.style.left)||0, ct=parseFloat(c.style.top)||0; c.style.position='relative'; c.style.left=(gl+cl)+'px'; c.style.top=(gt+ct)+'px'; page.appendChild(c); }); g.remove(); }); setSelection([]); fireInput(); emitLayers(); return; }
    if(name === 'bringFront'){ pushHistory(); sel.forEach(function(el){ el.parentNode.appendChild(el); }); fireInput(); emitLayers(); return; }
    if(name === 'sendBack'){ pushHistory(); sel.forEach(function(el){ el.parentNode.insertBefore(el, el.parentNode.firstChild); }); fireInput(); emitLayers(); return; }
    if(name === 'bringForward'){ pushHistory(); sel.forEach(function(el){ if(el.nextElementSibling) el.parentNode.insertBefore(el.nextElementSibling, el); }); fireInput(); emitLayers(); return; }
    if(name === 'sendBackward'){ pushHistory(); sel.forEach(function(el){ if(el.previousElementSibling) el.parentNode.insertBefore(el, el.previousElementSibling); }); fireInput(); emitLayers(); return; }
    if(name === 'align'){
      pushHistory();
      var dir = payload.dir;
      if(sel.length < 1) return;
      var page = pageOf(sel[0]); var pr = page.getBoundingClientRect();
      var pageW = pr.width, pageH = pr.height;
      var bounds = sel.map(function(el){ return { el:el, r:rectOf(el) }; });
      bounds.forEach(function(b){
        var s = getComputedStyle(b.el); if(s.position==='static') b.el.style.position='relative';
        var cur = b.r;
        if(dir==='left') b.el.style.left = '0px';
        if(dir==='center') b.el.style.left = ((pageW - cur.w)/2)+'px';
        if(dir==='right') b.el.style.left = (pageW - cur.w)+'px';
        if(dir==='top') b.el.style.top = '0px';
        if(dir==='middle') b.el.style.top = ((pageH - cur.h)/2)+'px';
        if(dir==='bottom') b.el.style.top = (pageH - cur.h)+'px';
      });
      redrawSelection(); fireInput(); emitSelection(null);
      return;
    }
    if(name === 'distribute'){
      pushHistory();
      var axis = payload.axis;
      if(sel.length < 3) return;
      var sorted = sel.slice().sort(function(a,b){ var ra=rectOf(a), rb=rectOf(b); return axis==='h' ? ra.x-rb.x : ra.y-rb.y; });
      var first = rectOf(sorted[0]), last = rectOf(sorted[sorted.length-1]);
      var totalSpan = axis==='h' ? (last.x+last.w) - first.x : (last.y+last.h) - first.y;
      var sumSize = sorted.reduce(function(acc,el){ var r=rectOf(el); return acc + (axis==='h'?r.w:r.h); }, 0);
      var gap = (totalSpan - sumSize) / (sorted.length - 1);
      var pos = axis==='h' ? first.x : first.y;
      sorted.forEach(function(el, i){
        var r = rectOf(el);
        var s=getComputedStyle(el); if(s.position==='static') el.style.position='relative';
        if(i>0){
          if(axis==='h') el.style.left = pos + 'px'; else el.style.top = pos + 'px';
        }
        pos += (axis==='h'?r.w:r.h) + gap;
      });
      redrawSelection(); fireInput();
      return;
    }
    if(name === 'style'){
      pushHistory();
      sel.forEach(function(el){ Object.keys(payload.style).forEach(function(k){ el.style[k] = payload.style[k]; }); });
      redrawSelection(); fireInput(); emitSelection(null);
      return;
    }
    if(name === 'exec'){ DOC.execCommand(payload.cmd, false, payload.value || null); fireInput(); emitSelection(null); return; }
    if(name === 'toggleHidden'){ pushHistory(); var el = getById(payload.id); if(!el) return; if(state.hiddenIds.has(payload.id)){ state.hiddenIds.delete(payload.id); el.classList.remove('wd-hidden'); el.style.visibility=''; } else { state.hiddenIds.add(payload.id); el.classList.add('wd-hidden'); el.style.visibility='hidden'; } fireInput(); emitLayers(); return; }
    if(name === 'toggleLocked'){ var el2 = getById(payload.id); if(!el2) return; if(state.lockedIds.has(payload.id)){ state.lockedIds.delete(payload.id); el2.classList.remove('wd-locked'); } else { state.lockedIds.add(payload.id); el2.classList.add('wd-locked'); } emitLayers(); return; }
    if(name === 'selectId'){ var el3 = getById(payload.id); if(el3){ setSelection([el3]); el3.scrollIntoView({behavior:'smooth', block:'center'}); } return; }
    if(name === 'undo'){ undo(); return; }
    if(name === 'redo'){ redo(); return; }
    if(name === 'replaceText'){ if(sel[0]){ pushHistory(); sel[0].textContent = payload.text; fireInput(); emitSelection(null); } return; }
    if(name === 'editText'){ var el4 = sel[0]; if(!el4) return; el4.contentEditable='true'; el4.focus(); var range = DOC.createRange(); range.selectNodeContents(el4); var s2 = getSelection(); s2.removeAllRanges(); s2.addRange(range); el4.addEventListener('blur', function once(){ el4.contentEditable='false'; el4.removeEventListener('blur', once); fireInput(); }, { once: true }); return; }
  }

  window.addEventListener('message', function(e){
    var d = e.data; if(!d || !d.wd) return;
    if(d.type === 'wd:activate'){ state.active = !!d.value; if(state.active){ DOC.body.setAttribute('data-wd-active',''); DOC.querySelectorAll('.page').forEach(function(p){ p.contentEditable='false'; }); } else { DOC.body.removeAttribute('data-wd-active'); DOC.querySelectorAll('.page').forEach(function(p){ p.contentEditable='true'; }); clearVisuals(); state.selection=[]; } emitLayers(); return; }
    if(d.type === 'wd:grid'){ state.grid = !!d.value; if(d.value) DOC.body.setAttribute('data-wd-grid',''); else DOC.body.removeAttribute('data-wd-grid'); return; }
    if(d.type === 'wd:outline'){ state.outline = !!d.value; if(d.value) DOC.body.setAttribute('data-wd-outline',''); else DOC.body.removeAttribute('data-wd-outline'); return; }
    if(d.type === 'wd:snap'){ state.snap = !!d.value; return; }
    if(d.type === 'wd:cmd'){ cmd(d.name, d.payload || {}); return; }
    if(d.type === 'wd:requestLayers'){ emitLayers(); return; }
    if(d.type === 'wd:setBg'){ DOC.querySelectorAll('.page').forEach(function(p){ if(typeof d.pageNum==='number'){ var pages = DOC.querySelectorAll('.page'); var t = pages[d.pageNum-1]; if(t) t.style.background = d.color; } else { p.style.background = d.color; } }); fireInput(); return; }
  });

  injectStyle();
  // Initial layers emit after pagination settles
  setTimeout(function(){ emitLayers(); }, 1200);
})();
`;

type SelectionInfo = {
  id: string;
  tag: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  bg: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
};

type MenuState = {
  x: number;
  y: number;
  rect: { x: number; y: number; w: number; h: number };
  pageNum: number;
  intersect: string[];
};

export function WysiwygDesigner({ iframeRef, active, onToggleActive, onAiPopulate, onDirty }: WysiwygDesignerProps) {
  const [selection, setSelection] = useState<SelectionInfo[]>([]);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [layers, setLayers] = useState<LayerRow[]>([]);
  const [layersOpen, setLayersOpen] = useState(true);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const [snap, setSnap] = useState(true);
  const [grid, setGrid] = useState(false);
  const [outline, setOutline] = useState(false);
  const [aiPromptDraft, setAiPromptDraft] = useState("");
  const installedRef = useRef(false);

  const post = useCallback((data: Record<string, unknown>) => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    w.postMessage({ wd: true, ...data }, "*");
  }, [iframeRef]);

  const installScript = useCallback(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    if (doc.getElementById(SCRIPT_ID)) return;
    const s = doc.createElement("script");
    s.id = SCRIPT_ID;
    s.textContent = buildDesignerScript();
    doc.body.appendChild(s);
  }, [iframeRef]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    function onLoad() {
      installedRef.current = false;
      installScript();
      installedRef.current = true;
      post({ type: "wd:activate", value: active });
      post({ type: "wd:snap", value: snap });
      post({ type: "wd:grid", value: grid });
      post({ type: "wd:outline", value: outline });
    }
    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => iframe.removeEventListener("load", onLoad);
  }, [iframeRef, installScript, post, active, snap, grid, outline]);

  useEffect(() => { post({ type: "wd:activate", value: active }); if (!active) { setMenu(null); setSelection([]); } }, [active, post]);
  useEffect(() => { post({ type: "wd:snap", value: snap }); }, [snap, post]);
  useEffect(() => { post({ type: "wd:grid", value: grid }); }, [grid, post]);
  useEffect(() => { post({ type: "wd:outline", value: outline }); }, [outline, post]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data as { type?: string; items?: SelectionInfo[]; rows?: LayerRow[]; menuAt?: { x: number; y: number } | null; rect?: { x: number; y: number; w: number; h: number }; menu?: { x: number; y: number }; page?: number; intersect?: string[] };
      if (!d || typeof d.type !== "string") return;
      if (d.type === "wd:selection") {
        setSelection(d.items || []);
        if (d.items && d.items.length > 0) onDirty?.();
      } else if (d.type === "wd:layers") {
        setLayers(d.rows || []);
      } else if (d.type === "wd:marquee") {
        if (d.menu && d.rect && typeof d.page === "number") {
          setMenu({ x: d.menu.x, y: d.menu.y, rect: d.rect, pageNum: d.page, intersect: d.intersect || [] });
        }
      } else if (d.type === "wd:menu-close") {
        setMenu(null);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [onDirty]);

  const cmd = useCallback((name: string, payload: Record<string, unknown> = {}) => {
    post({ type: "wd:cmd", name, payload });
  }, [post]);

  const insertFromLibrary = useCallback((item: LibraryItem, rectOverride?: { x: number; y: number; w: number; h: number; pageX?: number; pageY?: number; pageNum?: number }) => {
    const rect = rectOverride ?? menu?.rect ?? { x: 40, y: 40, w: 200, h: 80 };
    const menuPt = rectOverride && rectOverride.pageX != null && rectOverride.pageY != null
      ? { x: rectOverride.pageX, y: rectOverride.pageY }
      : menu
        ? { x: menu.x, y: menu.y }
        : { x: 200, y: 200 };
    cmd("insert", { rect, html: item.html({ w: rect.w, h: rect.h }), menu: menuPt });
    setMenu(null);
  }, [cmd, menu]);

  const aiPopulateAtRect = useCallback(() => {
    if (!menu) return;
    const r = menu.rect;
    const prompt = aiPromptDraft.trim() || "Fill this region with thoughtful, on-brand content";
    const fullPrompt = `Inside the existing PDF, populate a ${Math.round(r.w)}×${Math.round(r.h)}px region at coordinates (${Math.round(r.x)}, ${Math.round(r.y)}) on page ${menu.pageNum}. ${prompt}. Use HTML/CSS only. Keep it within the region by setting position:absolute, left:${Math.round(r.x)}px, top:${Math.round(r.y)}px, width:${Math.round(r.w)}px, max-height:${Math.round(r.h)}px on the wrapper. Add it inside the existing .page element for page ${menu.pageNum}.`;
    onAiPopulate(fullPrompt);
    setAiPromptDraft("");
    setMenu(null);
  }, [aiPromptDraft, menu, onAiPopulate]);

  const aiRestyleSelection = useCallback(() => {
    if (!selection.length) return;
    const ids = selection.map((s) => s.id).join(", ");
    onAiPopulate(`Restyle the selected ${selection.length} element(s) (data-wd-id: ${ids}) with a more modern, premium aesthetic. Keep their positions and dimensions. Improve typography, color, spacing, and visual hierarchy.`);
  }, [onAiPopulate, selection]);

  const aiRewriteSelection = useCallback(() => {
    if (!selection.length) return;
    const currentText = selection.map((s) => s.text).filter(Boolean).join(" / ");
    onAiPopulate(`Rewrite the text content of the selected element(s) (data-wd-id: ${selection.map((s) => s.id).join(", ")}). Current: "${currentText}". Make it sharper, punchier, more concrete. Preserve length within ±20%.`);
  }, [onAiPopulate, selection]);

  const sel = selection[0];

  const fonts = useMemo(() => ["Inter", "Space Grotesk", "JetBrains Mono", "Georgia", "Helvetica", "Arial"], []);
  const sizes = useMemo(() => ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "36px", "48px", "64px"], []);

  if (!active) return null;

  return (
    <>
      {libraryOpen && (
        <aside className="absolute left-2 top-12 z-30 w-44 max-h-[calc(100%-6rem)] overflow-y-auto rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)]/95 backdrop-blur shadow-2xl">
          <header className="px-3 py-2 border-b border-[var(--color-line)] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">Elements</span>
            <button onClick={() => setLibraryOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-fg)]" aria-label="Hide library">
              <X size={12} />
            </button>
          </header>
          <ul className="p-2 grid grid-cols-2 gap-1.5">
            {LIBRARY.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => insertFromLibrary(item, { x: 40, y: 40, w: 200, h: 80, pageX: 200, pageY: 200, pageNum: 1 })}
                    className="w-full flex flex-col items-center gap-1 p-2 rounded border border-[var(--color-line)] hover:border-[var(--color-cyan)] hover:bg-white/[0.04] transition"
                    title={`Insert ${item.label}`}
                  >
                    <Icon size={16} className="text-[var(--color-cyan)]" />
                    <span className="text-[10px] text-[var(--color-fg)]/80">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      )}

      {layersOpen && (
        <aside className="absolute right-2 top-12 z-30 w-56 max-h-[calc(100%-6rem)] flex flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)]/95 backdrop-blur shadow-2xl">
          <header className="px-3 py-2 border-b border-[var(--color-line)] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold inline-flex items-center gap-1.5">
              <Layers size={11} /> Layers · {layers.length}
            </span>
            <button onClick={() => setLayersOpen(false)} className="text-[var(--color-muted)] hover:text-[var(--color-fg)]" aria-label="Hide layers">
              <X size={12} />
            </button>
          </header>
          <ul className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {layers.length === 0 && <li className="text-[11px] text-[var(--color-muted)] px-2 py-3 text-center">No layers yet. Drag on the page to start.</li>}
            {layers.map((l) => {
              const isSelected = selection.some((s) => s.id === l.id);
              return (
                <li key={l.id} className={`group flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] cursor-pointer ${isSelected ? "bg-[var(--color-cyan)]/15 text-[var(--color-cyan)]" : "hover:bg-white/[0.04] text-[var(--color-fg)]/85"}`} onClick={() => cmd("selectId", { id: l.id })}>
                  <span className="text-[9px] text-[var(--color-muted)] tabular-nums w-3 shrink-0">{l.page}</span>
                  <span className="font-mono text-[9px] text-[var(--color-muted)] w-6 shrink-0">{l.tag}</span>
                  <span className="flex-1 truncate">{l.preview || "—"}</span>
                  <button className="opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); cmd("toggleHidden", { id: l.id }); }} aria-label={l.hidden ? "Show layer" : "Hide layer"}>
                    {l.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                  </button>
                  <button className="opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); cmd("toggleLocked", { id: l.id }); }} aria-label={l.locked ? "Unlock layer" : "Lock layer"}>
                    {l.locked ? <Lock size={11} /> : <Unlock size={11} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      )}

      <div className="absolute left-1/2 -translate-x-1/2 top-2 z-30 flex items-center gap-1 px-2 py-1 rounded-full border border-[var(--color-line)] bg-[var(--color-bg-elev)]/95 backdrop-blur shadow-xl">
        <button onClick={onToggleActive} className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--color-cyan)] text-black font-semibold inline-flex items-center gap-1" title="Exit design mode (Esc)">
          <Move size={11} /> Design
        </button>
        <span className="h-4 w-px bg-[var(--color-line)] mx-0.5" />
        <button onClick={() => setLibraryOpen((v) => !v)} className={`p-1.5 rounded ${libraryOpen ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]"}`} title="Toggle element library">
          <LibraryIcon />
        </button>
        <button onClick={() => setLayersOpen((v) => !v)} className={`p-1.5 rounded ${layersOpen ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]"}`} title="Toggle layers panel">
          <Layers size={13} />
        </button>
        <span className="h-4 w-px bg-[var(--color-line)] mx-0.5" />
        <button onClick={() => setGrid((v) => !v)} className={`p-1.5 rounded ${grid ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]"}`} title="Toggle 8px grid">
          <Grid3x3 size={13} />
        </button>
        <button onClick={() => setSnap((v) => !v)} className={`p-1.5 rounded ${snap ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]"}`} title="Toggle snap-to-grid">
          <Magnet size={13} />
        </button>
        <button onClick={() => setOutline((v) => !v)} className={`p-1.5 rounded ${outline ? "text-[var(--color-cyan)]" : "text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]"}`} title="Toggle outline mode">
          <SquareIcon size={13} />
        </button>
        <span className="h-4 w-px bg-[var(--color-line)] mx-0.5" />
        <button onClick={() => cmd("undo")} className="p-1.5 rounded text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]" title="Undo (⌘Z)">
          <RotateCcw size={13} />
        </button>
        <button onClick={() => cmd("redo")} className="p-1.5 rounded text-[var(--color-fg)]/70 hover:text-[var(--color-fg)]" title="Redo (⌘⇧Z)">
          <RotateCw size={13} />
        </button>
      </div>

      {sel && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-2 z-30 flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)]/95 backdrop-blur shadow-xl text-[11px] max-w-[95%]" role="toolbar" aria-label="Selection toolbar">
          <span className="text-[10px] text-[var(--color-muted)] font-mono px-1">{sel.tag} · {sel.w}×{sel.h}</span>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <select onChange={(e) => cmd("style", { style: { fontFamily: e.target.value } })} className="bg-transparent border-0 text-[var(--color-fg)] focus:outline-none text-[11px]" defaultValue={sel.fontFamily} aria-label="Font family">
            {fonts.map((f) => <option key={f} value={f} className="bg-[var(--color-bg)]">{f}</option>)}
          </select>
          <select onChange={(e) => cmd("style", { style: { fontSize: e.target.value } })} className="bg-transparent border-0 text-[var(--color-fg)] focus:outline-none text-[11px]" defaultValue={sel.fontSize} aria-label="Font size">
            {sizes.map((s) => <option key={s} value={s} className="bg-[var(--color-bg)]">{s}</option>)}
          </select>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button onClick={() => cmd("exec", { cmd: "bold" })} className="p-1 rounded hover:bg-white/[0.06]" title="Bold (⌘B)"><Bold size={12} /></button>
          <button onClick={() => cmd("exec", { cmd: "italic" })} className="p-1 rounded hover:bg-white/[0.06]" title="Italic (⌘I)"><Italic size={12} /></button>
          <button onClick={() => cmd("exec", { cmd: "underline" })} className="p-1 rounded hover:bg-white/[0.06]" title="Underline (⌘U)"><Underline size={12} /></button>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button onClick={() => cmd("style", { style: { textAlign: "left" } })} className="p-1 rounded hover:bg-white/[0.06]" title="Align left"><AlignLeft size={12} /></button>
          <button onClick={() => cmd("style", { style: { textAlign: "center" } })} className="p-1 rounded hover:bg-white/[0.06]" title="Align center"><AlignCenter size={12} /></button>
          <button onClick={() => cmd("style", { style: { textAlign: "right" } })} className="p-1 rounded hover:bg-white/[0.06]" title="Align right"><AlignRight size={12} /></button>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <label className="inline-flex items-center gap-0.5" title="Text color">
            <span className="text-[10px] text-[var(--color-muted)]">A</span>
            <input type="color" defaultValue="#111111" onChange={(e) => cmd("style", { style: { color: e.target.value } })} className="w-5 h-5 rounded bg-transparent border-0 cursor-pointer" aria-label="Text color" />
          </label>
          <label className="inline-flex items-center gap-0.5" title="Background color">
            <PaintBucket size={11} className="text-[var(--color-muted)]" />
            <input type="color" defaultValue="#ffffff" onChange={(e) => cmd("style", { style: { background: e.target.value } })} className="w-5 h-5 rounded bg-transparent border-0 cursor-pointer" aria-label="Background color" />
          </label>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button onClick={() => cmd("align", { dir: "left" })} className="p-1 rounded hover:bg-white/[0.06]" title="Align left edge"><AlignLeft size={12} /></button>
          <button onClick={() => cmd("align", { dir: "center" })} className="p-1 rounded hover:bg-white/[0.06]" title="Center horizontally"><AlignHorizontalJustifyCenter size={12} /></button>
          <button onClick={() => cmd("align", { dir: "middle" })} className="p-1 rounded hover:bg-white/[0.06]" title="Center vertically"><AlignVerticalJustifyCenter size={12} /></button>
          {selection.length >= 3 && (
            <>
              <button onClick={() => cmd("distribute", { axis: "h" })} className="p-1 rounded hover:bg-white/[0.06]" title="Distribute horizontally"><ChevronRightLeftMini /></button>
              <button onClick={() => cmd("distribute", { axis: "v" })} className="p-1 rounded hover:bg-white/[0.06]" title="Distribute vertically"><ChevronUpDownMini /></button>
            </>
          )}
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button onClick={() => cmd("bringFront")} className="p-1 rounded hover:bg-white/[0.06]" title="Bring to front"><ArrowUpToLine size={12} /></button>
          <button onClick={() => cmd("bringForward")} className="p-1 rounded hover:bg-white/[0.06]" title="Bring forward"><ArrowUp size={12} /></button>
          <button onClick={() => cmd("sendBackward")} className="p-1 rounded hover:bg-white/[0.06]" title="Send backward"><ArrowDown size={12} /></button>
          <button onClick={() => cmd("sendBack")} className="p-1 rounded hover:bg-white/[0.06]" title="Send to back"><ArrowDownToLine size={12} /></button>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          {selection.length >= 2 && <button onClick={() => cmd("group")} className="p-1 rounded hover:bg-white/[0.06]" title="Group (⌘G)"><Group size={12} /></button>}
          {selection.length === 1 && sel.tag === "div" && <button onClick={() => cmd("ungroup")} className="p-1 rounded hover:bg-white/[0.06]" title="Ungroup (⌘⇧G)"><Ungroup size={12} /></button>}
          <button onClick={() => cmd("duplicate")} className="p-1 rounded hover:bg-white/[0.06]" title="Duplicate (⌘D)"><Copy size={12} /></button>
          <button onClick={() => cmd("editText")} className="p-1 rounded hover:bg-white/[0.06]" title="Edit text"><Type size={12} /></button>
          <button onClick={() => cmd("delete")} className="p-1 rounded hover:bg-red-500/15 text-red-400 hover:text-red-300" title="Delete (Delete)"><Trash2 size={12} /></button>
          <span className="h-4 w-px bg-[var(--color-line)]" />
          <button onClick={aiRestyleSelection} className="px-2 py-1 rounded text-[11px] bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/25 inline-flex items-center gap-1" title="AI restyle selection"><Wand2 size={11} /> Restyle</button>
          <button onClick={aiRewriteSelection} className="px-2 py-1 rounded text-[11px] bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/25 inline-flex items-center gap-1" title="AI rewrite text"><Wand2 size={11} /> Rewrite</button>
        </div>
      )}

      {menu && (
        <div
          className="absolute z-40 w-72 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)]/98 backdrop-blur shadow-2xl"
          style={{ left: Math.min(menu.x + 8, (iframeRef.current?.clientWidth ?? 800) - 296), top: Math.max(menu.y + 8, 8) }}
          role="menu"
          aria-label="Drag selection actions"
        >
          <header className="px-3 py-2 border-b border-[var(--color-line)] flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold">
              {Math.round(menu.rect.w)}×{Math.round(menu.rect.h)} · pg{menu.pageNum}
            </span>
            <button onClick={() => setMenu(null)} className="text-[var(--color-muted)] hover:text-[var(--color-fg)]" aria-label="Close menu">
              <X size={12} />
            </button>
          </header>
          <div className="p-2 space-y-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold block mb-1.5">Create layer</span>
              <div className="grid grid-cols-4 gap-1">
                {LIBRARY.slice(0, 8).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => insertFromLibrary(item)}
                      className="flex flex-col items-center gap-0.5 p-1.5 rounded border border-[var(--color-line)] hover:border-[var(--color-cyan)] hover:bg-white/[0.04] transition"
                      title={`Insert ${item.label}`}
                    >
                      <Icon size={14} className="text-[var(--color-cyan)]" />
                      <span className="text-[9px] text-[var(--color-fg)]/80 leading-none">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {menu.intersect.length > 0 && (
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold block mb-1.5">Select elements ({menu.intersect.length})</span>
                <button
                  onClick={() => { menu.intersect.forEach((id, i) => { post({ type: "wd:cmd", name: "selectId", payload: { id, multi: i > 0 } }); }); setMenu(null); }}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)] hover:bg-white/[0.04] transition"
                >
                  Select all {menu.intersect.length} intersecting element{menu.intersect.length === 1 ? "" : "s"}
                </button>
              </div>
            )}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-semibold block mb-1.5">AI populated options</span>
              <input
                type="text"
                value={aiPromptDraft}
                onChange={(e) => setAiPromptDraft(e.target.value)}
                placeholder="e.g. 'Quarterly revenue chart' or 'team photo'"
                className="w-full px-2 py-1.5 rounded border border-[var(--color-line)] bg-[var(--color-bg)] text-[11px] focus:outline-none focus:border-[var(--color-cyan)] mb-1.5"
                onKeyDown={(e) => { if (e.key === "Enter") aiPopulateAtRect(); }}
              />
              <div className="grid grid-cols-2 gap-1">
                <button onClick={aiPopulateAtRect} className="px-2 py-1.5 rounded text-[11px] bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/25 inline-flex items-center justify-center gap-1">
                  <Wand2 size={11} /> Generate
                </button>
                <button onClick={() => { setAiPromptDraft("Stat callout with a striking number and one-line context"); }} className="px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)]/50">Stat callout</button>
                <button onClick={() => { setAiPromptDraft("3-column feature comparison table"); }} className="px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)]/50">Comparison</button>
                <button onClick={() => { setAiPromptDraft("Pull quote in oversized serif with author credit"); }} className="px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)]/50">Pull quote</button>
                <button onClick={() => { setAiPromptDraft("Branded section heading with kicker, title, subtitle"); }} className="px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)]/50">Hero block</button>
                <button onClick={() => { setAiPromptDraft("Photo card with caption and credit line"); }} className="px-2 py-1.5 rounded text-[11px] border border-[var(--color-line)] hover:border-[var(--color-cyan)]/50">Photo card</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LibraryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ChevronRightLeftMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 6 3 12 9 18" />
      <polyline points="15 6 21 12 15 18" />
    </svg>
  );
}

function ChevronUpDownMini() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 3 18 9" />
      <polyline points="6 15 12 21 18 15" />
    </svg>
  );
}
