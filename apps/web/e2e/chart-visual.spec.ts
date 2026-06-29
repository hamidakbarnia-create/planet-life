import { test, expect, type Page } from '@playwright/test';

const FIXTURES = ['rafsanjan', 'tehran', 'london', 'new-york', 'reykjavik'] as const;

const FIXTURE_BUTTON: Record<(typeof FIXTURES)[number], RegExp> = {
  rafsanjan: /Rafsanjan/i,
  tehran: /Tehran/i,
  london: /London/i,
  'new-york': /New York/i,
  reykjavik: /Reykjavik/i,
};

async function preparePage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('planet-life-disclaimer-accepted', 'true');
  });
}

for (const fixtureId of FIXTURES) {
  test(`chart wheel visual — ${fixtureId}`, async ({ page }) => {
    await preparePage(page);
    await page.goto('/dev/chart-test');
    if (fixtureId !== 'rafsanjan') {
      await page.getByRole('button', { name: FIXTURE_BUTTON[fixtureId] }).click();
    }

    const wheel = page.getByTestId('chart-wheel');
    await expect(wheel).toBeVisible();

    await expect(page.getByTestId('axis-ac')).toBeVisible();
    await expect(page.getByTestId('axis-dc')).toBeVisible();
    await expect(page.getByTestId('axis-mc')).toBeVisible();
    await expect(page.getByTestId('axis-ic')).toBeVisible();

    for (let i = 1; i <= 12; i++) {
      await expect(page.getByTestId(`house-cusp-${i}`)).toBeAttached();
    }

    await expect(wheel).toHaveScreenshot(`chart-${fixtureId}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
}

test('rafsanjan quadrant cardinal angles', async ({ page }) => {
  await preparePage(page);
  await page.goto('/dev/chart-test');
  await expect(page.getByTestId('asc-screen')).toContainText('270.00');
  await expect(page.getByTestId('dsc-screen')).toContainText('90.00');
  await expect(page.getByTestId('mc-screen')).toContainText('0.00');
  await expect(page.getByTestId('ic-screen')).toContainText('180.00');
});

test('uniform projection toggle changes MC screen', async ({ page }) => {
  await preparePage(page);
  await page.goto('/dev/chart-test');
  await expect(page.getByTestId('mc-screen')).toContainText('0.00');
  await page.getByTestId('projection-uniform').click();
  const mcText = await page.getByTestId('mc-screen').textContent();
  expect(mcText).not.toContain('0.00');
});
