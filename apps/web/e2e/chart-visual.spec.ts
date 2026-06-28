import { test, expect, type Page } from '@playwright/test';

const FIXTURES = ['rafsanjan', 'london', 'new-york'] as const;

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
      await page.getByRole('button', {
        name: fixtureId === 'london' ? /London/i : /New York/i,
      }).click();
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

test('rafsanjan ASC at left (270°)', async ({ page }) => {
  await preparePage(page);
  await page.goto('/dev/chart-test');
  await expect(page.getByText(/ASC screen: 270\.00°/)).toBeVisible();
  await expect(page.getByText(/DSC screen: 90\.00°/)).toBeVisible();
});
