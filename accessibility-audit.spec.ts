import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('pdf.megabyte.space accessibility audit', () => {
  test('landing page (1280px) - WCAG 2.2 AA', async ({ page }) => {
    // Set viewport to 1280px
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto('https://pdf.megabyte.space');
    
    // Inject axe
    await injectAxe(page);
    
    // Run accessibility check
    await expect(async () => {
      try {
        await checkA11y(page, null, {
          detailedReport: true,
          detailedReportOptions: {
            html: true
          }
        });
      } catch (e) {
        console.log('VIOLATIONS FOUND:', e.message);
        throw e;
      }
    }).toPass();
  });

  test('guest editor (1280px) - WCAG 2.2 AA', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1024 });
    await page.goto('https://pdf.megabyte.space/guest');
    await injectAxe(page);
    
    await expect(async () => {
      try {
        await checkA11y(page, null, {
          detailedReport: true
        });
      } catch (e) {
        console.log('VIOLATIONS FOUND:', e.message);
        throw e;
      }
    }).toPass();
  });
});
