import { test, expect } from '@playwright/test';

async function runAxe(page: import('@playwright/test').Page) {
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.11.3/axe.min.js',
  });
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).axe !== 'undefined');

  return page.evaluate(() =>
    new Promise<Array<{ impact: string; id: string; description: string; nodes: Array<{ target: string[] }> }>>((resolve) => {
      (window as unknown as Record<string, { run: (opts: unknown, cb: (err: unknown, res: { violations: unknown[] }) => void) => void }>).axe.run(
        { runOnly: { type: 'tag', values: ['wcag2aa'] }, resultTypes: ['violations'] },
        (_err, res) => resolve((res?.violations ?? []) as Array<{ impact: string; id: string; description: string; nodes: Array<{ target: string[] }> }>),
      );
    })
  );
}

function reportViolations(label: string, violations: Array<{ impact: string; id: string; description: string; nodes: Array<{ target: string[] }> }>) {
  if (violations.length === 0) return;
  console.log(`\n=== ${label} — ${violations.length} violation(s) ===`);
  violations.forEach((v) => {
    console.log(`  [${v.impact}] ${v.id} — ${v.description}`);
    if (v.nodes[0]) console.log(`    Selector: ${v.nodes[0].target.join(' > ')}`);
  });
}

test.describe('pdf.megabyte.space — A11Y Audit (WCAG 2.2 AA)', () => {
  test('landing page 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto('https://pdf.megabyte.space');
    await page.waitForLoadState('networkidle');

    const violations = await runAxe(page);
    reportViolations('pdf.megabyte.space', violations);
    expect(violations, `${violations.length} WCAG 2.2 AA violation(s) on landing page`).toHaveLength(0);
  });

  test('guest editor 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto('https://pdf.megabyte.space/guest');
    await page.waitForLoadState('networkidle');

    const violations = await runAxe(page);
    reportViolations('pdf.megabyte.space/guest', violations);
    expect(violations, `${violations.length} WCAG 2.2 AA violation(s) on guest editor`).toHaveLength(0);
  });
});
