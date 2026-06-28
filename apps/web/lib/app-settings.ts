export type HomeViewMode = 'daily-brief' | 'calendar' | 'heatmap';
export type HouseSystem = 'placidus' | 'whole_sign';
export type ZodiacSystem = 'tropical' | 'sidereal';
export type CalendarSystem = 'gregorian' | 'shamsi' | 'hijri';
export type AppLang = 'en' | 'ru' | 'fa' | 'ar';

const HOME_VIEW_KEY = 'planet-life-home-view';
const HOUSE_KEY = 'planet-life-house-system';
const ZODIAC_KEY = 'planet-life-zodiac-system';
const CALENDAR_KEY = 'planet-life-calendar-system';

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

// Display calendar for dates across the app. Gregorian (Miladi) is the shared
// default for every language; Persian users can pick Shamsi (Solar Hijri) and
// Arabic users Ghamari (Lunar Hijri). This only affects how dates are shown,
// not the underlying astronomical calculations.
export function loadCalendarSystem(): CalendarSystem {
  if (typeof window === 'undefined') return 'gregorian';
  const v = localStorage.getItem(CALENDAR_KEY);
  if (v === 'shamsi' || v === 'hijri' || v === 'gregorian') return v;
  return 'gregorian';
}

export function saveCalendarSystem(system: CalendarSystem): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CALENDAR_KEY, system);
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
