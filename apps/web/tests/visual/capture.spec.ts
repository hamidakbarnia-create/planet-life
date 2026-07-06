import { test, expect } from '@playwright/test';
import {
  captureCases,
  screenshotName,
  DIFF_FAIL_RATIO,
} from './config';
import { prepareVisualPage, waitForVisualStable } from './helpers';

for (const { route, lang, viewport } of captureCases()) {
  test(`${route} | ${lang} | ${viewport.id}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepareVisualPage(page, lang);

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await waitForVisualStable(page);

    await expect(page).toHaveScreenshot(screenshotName(route, lang, viewport.id), {
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: DIFF_FAIL_RATIO,
      timeout: 30_000,
    });
  });
}
