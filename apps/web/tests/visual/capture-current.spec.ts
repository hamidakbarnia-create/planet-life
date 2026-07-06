import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { captureCases, screenshotName } from './config';
import { prepareVisualPage, waitForVisualStable } from './helpers';

const currentDir = path.join(__dirname, '.current');

for (const { route, lang, viewport } of captureCases()) {
  test(`${route} | ${lang} | ${viewport.id}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepareVisualPage(page, lang);

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await waitForVisualStable(page);

    const fileName = screenshotName(route, lang, viewport.id);
    fs.mkdirSync(currentDir, { recursive: true });
    await page.screenshot({
      path: path.join(currentDir, fileName),
      fullPage: false,
      animations: 'disabled',
      caret: 'hide',
    });
  });
}
