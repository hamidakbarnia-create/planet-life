export type HomeViewMode = 'daily-brief' | 'calendar' | 'heatmap';
export type HouseSystem = 'placidus' | 'whole_sign';
export type ZodiacSystem = 'tropical' | 'sidereal';
export type AppLang = 'en' | 'ru' | 'fa' | 'ar';

const HOME_VIEW_KEY = 'planet-life-home-view';
const HOUSE_KEY = 'planet-life-house-system';
const ZODIAC_KEY = 'planet-life-zodiac-system';

export function loadHomeView(): HomeViewMode | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(HOME_VIEW_KEY);
  if (v === 'daily-brief' || v === 'calendar' || v === 'heatmap') return v;
  return null;
}

export function saveHomeView(mode: HomeViewMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HOME_VIEW_KEY, mode);
}

export function hasHomeViewChoice(): boolean {
  return loadHomeView() != null;
}

export function loadHouseSystem(): HouseSystem {
  if (typeof window === 'undefined') return 'placidus';
  const v = localStorage.getItem(HOUSE_KEY);
  if (v === 'whole_sign' || v === 'placidus') return v;
  return 'placidus';
}

export function saveHouseSystem(system: HouseSystem): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HOUSE_KEY, system);
}

export function loadZodiacSystem(): ZodiacSystem {
  if (typeof window === 'undefined') return 'tropical';
  const v = localStorage.getItem(ZODIAC_KEY);
  if (v === 'sidereal' || v === 'tropical') return v;
  return 'tropical';
}

export function saveZodiacSystem(system: ZodiacSystem): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ZODIAC_KEY, system);
}

/** Extra fields for chart/analyze API bodies */
export function chartPreferenceFields(): {
  house_system: HouseSystem;
  zodiac: ZodiacSystem;
} {
  return {
    house_system: loadHouseSystem(),
    zodiac: loadZodiacSystem(),
  };
}
