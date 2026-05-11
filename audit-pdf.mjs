import { chromium } from 'playwright';

const urls = [
  'https://pdf.megabyte.space',
  'https://pdf.megabyte.space/guest'
];

async function runAudit(page, url) {
  try {
    console.log(`\n📋 **${url}** (1280px)\n`);
    
    // Inject axe
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.3/axe.min.js'
    });
    
    // Wait for axe to load
    await page.waitForFunction(() => typeof window.axe \!== 'undefined', { timeout: 5000 });
    
    // Run audit
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.axe.run(
          {
            runOnly: { type: 'tag', values: ['wcag2aa'] },
            resultTypes: ['violations', 'passes']
          },
          (err, results) => {
            if (err) throw err;
            resolve(results);
          }
        );
      });
    });
    
    const violations = results.violations || [];
    const passes = results.passes || [];
    
    console.log(`Violations: **${violations.length}** | Passes: **${passes.length}**\n`);
    
    if (violations.length === 0) {
      console.log('✅ **No violations found.**\n');
      return { url, violations: 0 };
    }
    
    violations.slice(0, 5).forEach(v => {
      console.log(`**${v.impact.toUpperCase()}** — ${v.id}`);
      console.log(`${v.description}\n`);
      
      v.nodes.slice(0, 1).forEach(node => {
        console.log(`  Selector: \`${node.target.join(' → ')}\``);
        if (node.failureSummary) {
          const summary = node.failureSummary
            .split('\n')[0]
            .substring(0, 90);
          console.log(`  Fix: ${summary}\n`);
        }
      });
    });
    
    if (violations.length > 5) {
      console.log(`...and ${violations.length - 5} more violations\n`);
    }
    
    return { url, violations: violations.length };
  } catch (e) {
    console.log(`⚠️ Error: ${e.message}\n`);
    return { url, error: true };
  }
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  
  for (const url of urls) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 1024 });
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      const result = await runAudit(page, url);
      results.push(result);
    } catch (e) {
      console.log(`🔴 Failed to load ${url}: ${e.message}\n`);
      results.push({ url, error: true });
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  
  // Summary
  console.log('\n---\n');
  console.log('**SUMMARY**\n');
  results.forEach(r => {
    if (r.error) {
      console.log(`${r.url} — ⚠️ Error\n`);
    } else {
      const status = r.violations === 0 ? '✅' : '🔴';
      console.log(`${status} ${r.url} — **${r.violations} violations**\n`);
    }
  });
})();
