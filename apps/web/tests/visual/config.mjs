/** ESM mirror of config.ts for diff-report.mjs */

export const VISUAL_ROUTES = [
  '/',
  '/home',
  '/ask',
  '/profile',
  '/calendar',
  '/people',
  '/pathfinder',
  '/world',
  '/settings',
  '/upgrade',
  '/vault',
  '/login',
];

export const LANDSCAPE_ROUTES = new Set(['/', '/profile', '/calendar']);

export const VISUAL_VIEWPORTS = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'tablet', width: 834, height: 1112 },
  { id: 'mobile', width: 390, height: 844 },
  { id: 'mobile-landscape', width: 844, height: 390 },
];

export const VISUAL_LANGS = [{ code: 'en' }, { code: 'fa' }];

export const DIFF_FAIL_RATIO = 0.005;
export const DIFF_WARN_RATIO = 0.001;
export const EXPECTED_BASELINE_COUNT = 78;

export function routeSlug(route) {
  return route === '/' ? 'root' : route.slice(1).replace(/\//g, '__');
}

export function screenshotName(route, lang, viewport) {
  return `${routeSlug(route)}__${lang}__${viewport}.png`;
}

export function captureCases() {
  const cases = [];
  for (const route of VISUAL_ROUTES) {
    for (const { code: lang } of VISUAL_LANGS) {
      for (const viewport of VISUAL_VIEWPORTS) {
        if (viewport.id === 'mobile-landscape' && !LANDSCAPE_ROUTES.has(route)) {
          continue;
        }
        cases.push({ route, lang, viewport });
      }
    }
  }
  return cases;
}
