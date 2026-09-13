#!/usr/bin/env node
/**
 * Compact-header verification. overflow:hidden/auto alone is insufficient:
 * measure bounding boxes, scrollIntoView, keyboard focus, and nav clearance.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.VAULT_HEADER_OUT
  || join(ROOT, '../../../review-artifacts/vault-compact-header');
const BASE = process.env.VAULT_HEADER_BASE || 'http://localhost:3000';
const LONG_EMAIL = 'very.long.signed.in.account.label@example.com';

const VIEWPORTS = [
  { id: '390x844', width: 390, height: 844 },
  { id: '390x498', width: 390, height: 498 },
  { id: 'desktop', width: 1440, height: 900 },
];
const LANGS = ['en', 'fa', 'ru', 'ar'];

mkdirSync(OUT, { recursive: true });

function rect(box) {
  if (!box) return null;
  return {
    x: Number(box.x.toFixed(2)),
    y: Number(box.y.toFixed(2)),
    w: Number(box.width.toFixed(2)),
    h: Number(box.height.toFixed(2)),
    r: Number((box.x + box.width).toFixed(2)),
    b: Number((box.y + box.height).toFixed(2)),
  };
}

function boxSize(box) {
  return {
    width: box.width ?? box.w,
    height: box.height ?? box.h,
  };
}

function inViewport(box, vp, pad = 0) {
  if (!box) return false;
  const { width, height } = boxSize(box);
  return (
    box.x + pad >= 0 &&
    box.y + pad >= 0 &&
    box.x + width - pad <= vp.width &&
    box.y + height - pad <= vp.height
  );
}

function focusRingVisible(focused) {
  if (!focused) return false;
  const outline = String(focused.outline || '');
  const shadow = String(focused.boxShadow || '');
  const styleIsNone = /none/.test(outline) && !/solid/.test(outline);
  return (!styleIsNone && /solid|auto/.test(outline)) || /rgb|rgba|#/.test(shadow);
}

async function measure(page, vp) {
  return page.evaluate((viewport) => {
    const header = document.querySelector('.metioro-header');
    const actions = document.querySelector('.metioro-header__actions');
    const langs = document.querySelector('[data-header-langs]');
    const account = document.querySelector('[data-header-account]');
    const back = document.querySelector('.vault-back-link');
    const cards = [...document.querySelectorAll('.vault-item-card')];
    const lastCard = cards[cards.length - 1];
    const navEl = document.querySelector('.metioro-mobile-nav');
    const navStyle = navEl ? getComputedStyle(navEl) : null;
    const navHidden = !navEl || navStyle?.display === 'none' || navEl.getBoundingClientRect().height < 8;
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    };
    const langButtons = ['en', 'ru', 'fa', 'ar'].map((key) => {
      const el = document.querySelector(`[data-header-lang="${key}"]`);
      return { key, box: box(el), text: el?.textContent ?? null };
    });
    const actionsStyle = cs(actions);
    return {
      htmlDir: document.documentElement.dir,
      htmlLang: document.documentElement.lang,
      auditLayout: document.documentElement.classList.contains('vault-audit-layout'),
      header: box(header),
      actions: {
        box: box(actions),
        overflowX: actionsStyle?.overflowX ?? null,
        overflowY: actionsStyle?.overflowY ?? null,
        scrollWidth: actions?.scrollWidth ?? null,
        clientWidth: actions?.clientWidth ?? null,
        canScroll: actions ? actions.scrollWidth - actions.clientWidth > 1 : false,
      },
      langs: {
        box: box(langs),
        overflowX: cs(langs)?.overflowX ?? null,
      },
      account: {
        box: box(account),
        overflow: cs(account)?.overflow ?? null,
        text: account?.textContent ?? null,
        title: account?.getAttribute('title') ?? null,
      },
      langButtons,
      back: box(back),
      lastCard: box(lastCard),
      nav: navHidden ? null : box(navEl),
      viewport: viewport,
    };
  }, vp);
}

const report = {
  note:
    'overflow=false (or overflow:hidden/auto on an ancestor) is insufficient. A clipped chip can still leave language buttons off-screen, and a visible overflow value can still hide focus rings. Reachability is decided by bounding boxes, scrollLeft, and focused client rects.',
  longEmail: LONG_EMAIL,
  cases: [],
};

const browser = await chromium.launch({ headless: true });

for (const vp of VIEWPORTS) {
  for (const lang of LANGS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: lang === 'fa' ? 'fa-IR' : lang === 'ar' ? 'ar' : lang === 'ru' ? 'ru-RU' : 'en-US',
    });
    await context.addInitScript(
      ({ email, nextLang }) => {
        localStorage.setItem(
          'planet-life-auth',
          JSON.stringify({
            method: 'email',
            identifier: email,
            verifiedAt: Date.now(),
          }),
        );
        localStorage.setItem('planet-life-lang', nextLang);
        localStorage.setItem('planet-life-disclaimer-accepted', 'true');
      },
      { email: LONG_EMAIL, nextLang: lang },
    );
    const page = await context.newPage();
    await page.goto(`${BASE}/vault/shadow`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForSelector('.metioro-header', { timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.classList.contains('vault-audit-layout'));
    await page.waitForSelector('[data-header-account]', { timeout: 30000 });
    await page.waitForSelector('.vault-item-card', { timeout: 30000 });

    const cards = page.locator('.vault-item-card button');
    const count = await cards.count();
    if (count > 0) await cards.nth(count - 1).click();
    await page.waitForTimeout(250);

    await page.evaluate(() => window.scrollTo(0, 0));

    const langReach = {};
    for (const key of ['en', 'ru', 'fa', 'ar']) {
      const btn = page.locator(`[data-header-lang="${key}"]`);
      const beforeBox = rect(await btn.boundingBox());
      await page.evaluate((langKey) => {
        const actions = document.querySelector('.metioro-header__actions');
        const el = document.querySelector(`[data-header-lang="${langKey}"]`);
        if (!(actions instanceof HTMLElement) || !(el instanceof HTMLElement)) return;
        const left = el.offsetLeft - 8;
        actions.scrollLeft = Math.max(0, left);
      }, key);
      await page.waitForTimeout(50);
      const afterScroll = rect(await btn.boundingBox());
      await btn.focus();
      await page.waitForTimeout(50);
      const focused = await btn.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          focused: document.activeElement === el,
          outline: style.outline,
          outlineOffset: style.outlineOffset,
          boxShadow: style.boxShadow,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        };
      });
      langReach[key] = {
        beforeScroll: beforeBox,
        afterScroll,
        focused,
        afterScrollInViewport: inViewport(afterScroll, vp, 1),
        focusedInViewport: inViewport(focused, vp, 1),
        focusRingVisible: focusRingVisible(focused),
        overflowStyleAloneWouldMiss: !inViewport(beforeBox, vp, 1),
      };
    }

    const keyboardReach = {};
    await page.locator('[data-header-account]').focus();
    for (let i = 0; i < 16; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!(el instanceof HTMLElement)) return null;
        const key = el.getAttribute('data-header-lang');
        const r = el.getBoundingClientRect();
        return {
          key,
          tag: el.tagName,
          text: el.textContent,
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
        };
      });
      if (info?.key && !keyboardReach[info.key]) {
        keyboardReach[info.key] = {
          ...info,
          inViewport: inViewport(info, vp, 1),
        };
      }
      if (Object.keys(keyboardReach).length === 4) break;
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(50);
    const rest = await measure(page, vp);
    const lastCard = page.locator('.vault-item-card').last();
    await lastCard.evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
    await page.waitForTimeout(80);
    const after = await measure(page, vp);
    const back = rest.back;
    const last = after.lastCard;
    const nav = after.nav;
    const header = rest.header;
    const clearance = {
      backTop: back ? Number(back.y.toFixed(2)) : null,
      headerBottom: header ? Number((header.y + header.height).toFixed(2)) : null,
      backClearOfHeader: back && header ? back.y >= header.y + header.height - 1 : false,
      lastAboveNav: !nav || !last ? true : last.y + last.height <= nav.y + 1,
      lastBottom: last ? Number((last.y + last.height).toFixed(2)) : null,
      navTop: nav ? Number(nav.y.toFixed(2)) : null,
      gapToNav:
        nav && last ? Number((nav.y - (last.y + last.height)).toFixed(2)) : null,
    };

    const shot = join(OUT, `${vp.id}-${lang}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    const caseRow = {
      viewport: vp.id,
      lang,
      dir: after.htmlDir,
      account: after.account,
      actions: after.actions,
      langReach,
      keyboardReach,
      allLangsTouchScrollable: Object.values(langReach).every((x) => x.afterScrollInViewport),
      allLangsKeyboardReachable: ['en', 'ru', 'fa', 'ar'].every(
        (key) => keyboardReach[key]?.inViewport,
      ),
      focusedVisibleInRtl:
        after.htmlDir !== 'rtl'
          ? null
          : Object.values(langReach).every(
              (x) => x.focused.focused && x.focusedInViewport && x.focusRingVisible,
            ),
      clearance,
      screenshot: shot,
      overflowFalseInsufficient:
        'A hidden/auto overflow style on the account chip or actions row does not prove language buttons are in the visual viewport. Use after-scroll and focused client rects.',
    };
    report.cases.push(caseRow);
    await context.close();
  }
}

await browser.close();
writeFileSync(join(OUT, 'measurements.json'), JSON.stringify(report, null, 2));
const failed = report.cases.filter(
  (c) =>
    !c.allLangsTouchScrollable ||
    !c.allLangsKeyboardReachable ||
    (c.focusedVisibleInRtl === false) ||
    c.clearance.lastAboveNav === false || c.clearance.backClearOfHeader === false,
);
writeFileSync(
  join(OUT, 'summary.json'),
  JSON.stringify(
    {
      cases: report.cases.length,
      failed: failed.map((c) => `${c.viewport}/${c.lang}`),
      note: report.note,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ out: OUT, failed: failed.map((c) => `${c.viewport}/${c.lang}`) }, null, 2));
process.exit(failed.length ? 1 : 0);
