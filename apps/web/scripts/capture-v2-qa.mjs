import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'qa-screenshots', 'v2');
const BASE = process.env.QA_BASE_URL ?? 'http://localhost:3001';

const GENERATE = {
  en: /Create Chart/i,
  fa: /ساخت نمودار/,
  ar: /إنشاء الخريطة/,
};

async function seedLang(page, lang) {
  await page.addInitScript((l) => {
    localStorage.setItem('planet-life-disclaimer-accepted', 'true');
    localStorage.setItem('planet-life-lang', l);
    localStorage.setItem('planet-life-home-view', 'daily-brief');
    localStorage.setItem(
      'planet-life-birth-profile',
      JSON.stringify({
        birth_date: '1990-06-15',
        birth_time: '14:30',
        location: 'Greater London',
        action_type: 'business_launch',
        current_location: {
          city: 'Greater London',
          country: 'United Kingdom',
          latitude: 51.5074,
          longitude: -0.1278,
          timezone: 'Europe/London',
          coordinate_source: 'selected_city_coordinates',
          confirmed: true,
        },
      })
    );
    localStorage.setItem('planet-life-profile-name', 'Alex Morgan');
  }, lang);
}

async function ensureChart(page, lang) {
  await page.goto(`${BASE}/profile`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('domcontentloaded');
  await page.getByRole('button', { name: GENERATE[lang] ?? GENERATE.en }).waitFor({
    timeout: 60000,
  });
  const birthCity = page.locator('.mio-birth-compact input.metioro-input').nth(1);
  await birthCity.scrollIntoViewIfNeeded();
  await birthCity.fill('London');
  await page.waitForTimeout(1500);
  const row = page.locator('.city-row').first();
  await row.waitFor({ timeout: 15000 });
  await row.click();
  const btn = page.getByRole('button', { name: GENERATE[lang] ?? GENERATE.en });
  await btn.click();
  if (lang === 'fa') {
    const modal = page.getByTestId('fa-chart-confirm-modal');
    if (await modal.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /تأیید و ساخت نمودار/ }).click();
    }
  }
  await page
    .locator('.mio-chart-stage__wheel svg, .natal-chart svg')
    .first()
    .waitFor({ timeout: 90000 });
  await page.waitForTimeout(1000);
}

async function capture(name, width, height, lang, route) {
  const browser = await chromium.launch({
    channel: process.platform === 'win32' ? 'chrome' : undefined,
  });
  const page = await browser.newPage({ viewport: { width, height } });
  await seedLang(page, lang);
  if (route === '/profile') {
    await ensureChart(page, lang);
  } else {
    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 60000 });
    await page.getByText(/Daily Brief|DAILY BRIEF/i).first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(800);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  await browser.close();
  console.log(`saved ${file}`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const shots = [
  ['desktop-1440-profile-en.png', 1440, 900, 'en', '/profile'],
  ['desktop-1440-profile-fa.png', 1440, 900, 'fa', '/profile'],
  ['desktop-1440-profile-ar.png', 1440, 900, 'ar', '/profile'],
  ['desktop-1440-home-en.png', 1440, 900, 'en', '/home'],
  ['mobile-390-profile-en.png', 390, 844, 'en', '/profile'],
  ['mobile-390-profile-fa.png', 390, 844, 'fa', '/profile'],
  ['mobile-390-home-en.png', 390, 844, 'en', '/home'],
];

for (const args of shots) {
  await capture(...args);
}

console.log('done');
