import type { AppLang, CalendarSystem } from './app-settings';

/** BCP-47 base locales used for display formatting across the app. */
export const DATE_LOCALES: Record<AppLang, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  fa: 'fa-IR',
  ar: 'ar',
};

// Maps calendar preference to a BCP-47 calendar extension. Gregorian is the
// shared default; Shamsi = Persian (Solar Hijri); Ghamari = Umm al-Qura Hijri.
const CALENDAR_EXT: Record<CalendarSystem, string> = {
  gregorian: 'gregory',
  shamsi: 'persian',
  hijri: 'islamic-umalqura',
};

/** Format a Gregorian ISO `YYYY-MM-DD` for display in the chosen calendar system. */
export function formatDisplayDate(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  const baseLocale = DATE_LOCALES[lang] ?? DATE_LOCALES.en;
  const locale = `${baseLocale}-u-ca-${CALENDAR_EXT[calendar] ?? CALENDAR_EXT.gregorian}`;
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatDisplayDateRange(
  lang: AppLang,
  start: string,
  end: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return `${formatDisplayDate(lang, start, calendar)} - ${formatDisplayDate(lang, end, calendar)}`;
}

/** Format a Gregorian year/month (1–12) as a month+year label in the chosen calendar. */
export function formatDisplayMonthYear(
  lang: AppLang,
  year: number,
  month: number,
  calendar: CalendarSystem = 'gregorian'
): string {
  if (!year || month < 1 || month > 12) {
    return `${month}/${year}`;
  }
  const date = new Date(Date.UTC(year, month - 1, 1));
  const baseLocale = DATE_LOCALES[lang] ?? DATE_LOCALES.en;
  const locale = `${baseLocale}-u-ca-${CALENDAR_EXT[calendar] ?? CALENDAR_EXT.gregorian}`;
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
