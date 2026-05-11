import { execSync } from 'child_process';

const urls = {
  landing: 'https://pdf.megabyte.space',
  guest: 'https://pdf.megabyte.space/guest'
};

const script = `
const page = this;
const axeScript = \`https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.3/axe.min.js\`;

await page.addScriptTag({ url: axeScript });
await page.waitForTimeout(1000);

const results = await page.evaluate(() => {
  return new Promise(resolve => {
    window.axe.run(
      { runOnly: { type: 'tag', values: ['wcag2aa'] }, resultTypes: ['violations'] },
      (err, res) => resolve(res?.violations || [])
    );
  });
});

console.log(JSON.stringify(results, null, 2));
`;

console.log('A11Y AUDIT: pdf.megabyte.space');
console.log('Status: RUNNING');
console.log('\n');

for (const [label, url] of Object.entries(urls)) {
  console.log(`📋 ${label.toUpperCase()} (${url})`);
  console.log('Viewport: 1280px\n');
}
