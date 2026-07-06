/**
 * Sprint A Phase 0 — visual baseline capture matrix.
 * Contract: routes × viewports × languages (EN LTR, FA RTL).
 */

export type VisualLang = 'en' | 'fa';

export type VisualViewportId = 'desktop' | 'tablet' | 'mobile' | 'mobile-landscape';

export interface VisualViewport {
  id: VisualViewportId;
  width: number;
  height: number;
}

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
] as const;

export type VisualRoute = (typeof VISUAL_ROUTES)[number];

/** Routes with charts or cinematic hero — landscape mobile capture required. */
export const LANDSCAPE_ROUTES = new Set<VisualRoute>(['/', '/profile', '/calendar']);

export const VISUAL_VIEWPORTS: VisualViewport[] = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'tablet', width: 834, height: 1112 },
  { id: 'mobile', width: 390, height: 844 },
  { id: 'mobile-landscape', width: 844, height: 390 },
];

export const VISUAL_LANGS: { code: VisualLang; label: string }[] = [
  { code: 'en', label: 'English (LTR)' },
  { code: 'fa', label: 'Persian (RTL)' },
];

export const DIFF_FAIL_RATIO = 0.005;
export const DIFF_WARN_RATIO = 0.001;

export function routeSlug(route: VisualRoute): string {
  return route === '/' ? 'root' : route.slice(1).replace(/\//g, '__');
}

export function screenshotName(
  route: VisualRoute,
  lang: VisualLang,
  viewport: VisualViewportId,
): string {
  return `${routeSlug(route)}__${lang}__${viewport}.png`;
}

export function captureCases(): {
  route: VisualRoute;
  lang: VisualLang;
  viewport: VisualViewport;
}[] {
  const cases: {
    route: VisualRoute;
    lang: VisualLang;
    viewport: VisualViewport;
  }[] = [];

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

/** Expected baseline screenshot count: 78 */
export const EXPECTED_BASELINE_COUNT = captureCases().length;
