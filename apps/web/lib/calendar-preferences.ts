export type CalendarExportMode = 'all' | 'important' | 'notifications';

const EXPORT_KEY = 'planet-life-calendar-export';
const LANG_KEY = 'planet-life-lang';

export function loadExportMode(): CalendarExportMode {
  if (typeof window === 'undefined') return 'important';
  const v = localStorage.getItem(EXPORT_KEY);
  if (v === 'all' || v === 'important' || v === 'notifications') return v;
  return 'important';
}

export function saveExportMode(mode: CalendarExportMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXPORT_KEY, mode);
}

export function loadAppLang(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LANG_KEY);
}

export function saveAppLang(lang: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LANG_KEY, lang);
}
