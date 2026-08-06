import type { Page } from '@playwright/test';
import type { VisualLang } from './config';

/** Seed localStorage before navigation — contract requires addInitScript, never post-nav. */
export function seedVisualSession(lang: VisualLang) {
  return `
    (() => {
      localStorage.setItem('planet-life-disclaimer-accepted', 'true');
      localStorage.setItem('planet-life-lang', ${JSON.stringify(lang)});
      localStorage.setItem('planet-life-home-view', 'daily-brief');
    })();
  `;
}

export async function prepareVisualPage(page: Page, lang: VisualLang): Promise<void> {
  await page.addInitScript(seedVisualSession(lang));

  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.id = 'metioro-visual-freeze';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-delay: 0s !important;
        transition-duration: 0.01ms !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `;
    document.documentElement.appendChild(style);
  });
}

export async function waitForVisualStable(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  try {
    await page.waitForLoadState('networkidle', { timeout: 15_000 });
  } catch {
    // Some app routes keep long-polling connections open; continue after DOM settle.
  }
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(350);
}
