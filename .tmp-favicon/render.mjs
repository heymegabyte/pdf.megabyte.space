import { chromium } from "@playwright/test";
import fs from "node:fs";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

const ogHtml = `<!doctype html><html><head><meta charset="utf-8"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"/>
<style>html,body{margin:0;padding:0;background:#060610;font-family:'Space Grotesk',-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;-webkit-font-smoothing:antialiased}
.card{position:relative;width:1200px;height:630px;overflow:hidden;background:linear-gradient(135deg,#060610,#0b0b1c)}
.glow1{position:absolute;left:-120px;top:-200px;width:900px;height:900px;background:radial-gradient(closest-side,rgba(0,229,255,.30),transparent 70%)}
.glow2{position:absolute;right:-150px;bottom:-200px;width:1000px;height:1000px;background:radial-gradient(closest-side,rgba(124,58,237,.40),transparent 70%)}
.row{position:relative;display:flex;align-items:center;height:100%;padding:0 90px;gap:60px}
.mark{flex:none;width:200px;height:280px;border-radius:24px;background:linear-gradient(135deg,#00E5FF,#7C3AED);position:relative;box-shadow:0 30px 80px -20px rgba(124,58,237,.6)}
.mark::after{content:"";position:absolute;top:0;right:0;width:60px;height:60px;background:#060610;opacity:.25;clip-path:polygon(0 0,100% 0,100% 100%)}
.lines{position:absolute;left:30px;top:90px;display:flex;flex-direction:column;gap:22px}
.lines i{display:block;height:14px;border-radius:7px;background:#060610;opacity:.55}
.lines i:nth-child(1){width:130px}.lines i:nth-child(2){width:150px}.lines i:nth-child(3){width:90px}
.copy{display:flex;flex-direction:column;gap:14px}
h1{margin:0;font-size:78px;font-weight:800;letter-spacing:-2.5px;color:#fff;line-height:1.05}
h1 span{background:linear-gradient(90deg,#00E5FF,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
p{margin:0;font-size:32px;font-weight:500;color:#bcbcd6;letter-spacing:-.5px;line-height:1.25;max-width:640px}
.sub{font-size:20px;color:#7d7da0;font-weight:500}
.cta{margin-top:18px;display:inline-flex;align-items:center;justify-content:center;width:220px;height:60px;border-radius:30px;background:#00E5FF;color:#060610;font-weight:700;font-size:21px;letter-spacing:-.2px}
.url{position:absolute;right:32px;bottom:24px;font-family:'JetBrains Mono',monospace;font-size:16px;color:#4a4a6a}
</style></head><body><div class="card">
<div class="glow1"></div><div class="glow2"></div>
<div class="row">
  <div class="mark"><div class="lines"><i></i><i></i><i></i></div></div>
  <div class="copy">
    <h1>Megabyte<span>PDF</span></h1>
    <p>Chat your way to a printable PDF.</p>
    <div class="sub">Real PDFs. Real pages. No templates.</div>
    <div class="cta">Try it free →</div>
  </div>
</div>
<div class="url">pdf.megabyte.space</div>
</div></body></html>`;

await page.setContent(ogHtml, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.locator(".card").screenshot({ path: "public/og.png", omitBackground: false });

const maskHtml = `<!doctype html><html><head><meta charset="utf-8"/>
<style>html,body{margin:0;padding:0}.m{width:512px;height:512px;background:#060610;display:flex;align-items:center;justify-content:center}
.b{width:232px;height:324px;border-radius:36px;background:linear-gradient(135deg,#00E5FF,#7C3AED);position:relative}
.b::after{content:"";position:absolute;top:0;right:0;width:70px;height:70px;background:#060610;opacity:.25;clip-path:polygon(0 0,100% 0,100% 100%)}
.l{position:absolute;left:36px;top:108px;display:flex;flex-direction:column;gap:30px}
.l i{display:block;height:20px;border-radius:10px;background:#060610;opacity:.55}
.l i:nth-child(1){width:140px}.l i:nth-child(2){width:160px}.l i:nth-child(3){width:96px}
</style></head><body><div class="m"><div class="b"><div class="l"><i></i><i></i><i></i></div></div></div></body></html>`;

await ctx.close();
const ctx2 = await browser.newContext({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
const p2 = await ctx2.newPage();
await p2.setContent(maskHtml, { waitUntil: "networkidle" });
await p2.locator(".m").screenshot({ path: "public/maskable-512x512.png" });

const ctx3 = await browser.newContext({ viewport: { width: 192, height: 192 }, deviceScaleFactor: 1 });
const p3 = await ctx3.newPage();
await p3.setContent(maskHtml.replace(/512px/g, "192px").replace(/232px/, "88px").replace(/324px/, "124px").replace(/36px/, "14px").replace(/70px/g, "26px").replace(/108px/, "42px").replace(/30px/g, "12px").replace(/20px/g, "8px").replace(/10px/g, "5px").replace(/140px/, "54px").replace(/160px/, "62px").replace(/96px/, "36px").replace(/36px/g, "14px"), { waitUntil: "networkidle" });
await p3.locator(".m").screenshot({ path: "public/maskable-192x192.png" });

await browser.close();
console.log("OK");
