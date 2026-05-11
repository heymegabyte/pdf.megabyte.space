import { chromium } from 'playwright';

const urls = [
  'https://pdf.megabyte.space',
  'https://pdf.megabyte.space/guest'
];

async function runAudit(page, url) {
  try {
    console.log(`\n${url}\n`);
    
    await page.addScriptTag({
      url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.3/axe.min.js'
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.axe.run(
          { runOnly: { type: 'tag', values: ['wcag2aa'] }, resultTypes: ['violations'] },
          (err, res) => resolve(res)
        );
      });
    });
    
    const violations = results.violations || [];
    console.log(`Total violations: ${violations.length}\n`);
    
    violations.slice(0, 5).forEach(v => {
      console.log(`[${v.impact}] ${v.id}`);
      console.log(`${v.description}`);
      if (v.nodes[0]) {
        console.log(`Selector: ${v.nodes[0].target.join(' > ')}`);
      }
      console.log();
    });
    
    return violations.length;
  } catch (e) {
    console.log(`Error: ${e.message}\n`);
    return null;
  }
}

(async () => {
  const browser = await chromium.launch();
  
  for (const url of urls) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1280, height: 1024 });
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await runAudit(page, url);
    } catch (e) {
      console.log(`Load error: ${url} - ${e.message}\n`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
})();
