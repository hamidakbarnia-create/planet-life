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

function displayLocale(lang: AppLang, calendar: CalendarSystem): string {
  const baseLocale = DATE_LOCALES[lang] ?? DATE_LOCALES.en;
  return `${baseLocale}-u-ca-${CALENDAR_EXT[calendar] ?? CALENDAR_EXT.gregorian}`;
}

function utcDateFromIso(isoDate: string): Date | null {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function gregorianMonthEndDay(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatParts(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem,
  options: Intl.DateTimeFormatOptions
): string {
  const date = utcDateFromIso(isoDate);
  if (!date) return isoDate;
  return new Intl.DateTimeFormat(displayLocale(lang, calendar), {
    ...options,
    timeZone: 'UTC',
  }).format(date);
}

/** Format a Gregorian ISO `YYYY-MM-DD` for display in the chosen calendar system. */
export function formatDisplayDate(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return formatParts(lang, isoDate, calendar, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDisplayDateRange(
  lang: AppLang,
  start: string,
  end: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return `${formatDisplayDate(lang, start, calendar)} - ${formatDisplayDate(lang, end, calendar)}`;
}

/** Day-of-month numeral for a Gregorian ISO date in the chosen calendar system. */
export function formatDisplayDay(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return formatParts(lang, isoDate, calendar, { day: 'numeric' });
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
  return formatParts(lang, `${year}-${pad2(month)}-01`, calendar, {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Header label for a Gregorian month grid in the chosen calendar.
 * When the Gregorian month spans two cultural months, returns an honest range.
 */
export function formatDisplayMonthCoverage(
  lang: AppLang,
  year: number,
  month: number,
  calendar: CalendarSystem = 'gregorian'
): string {
  if (!year || month < 1 || month > 12) {
    return `${month}/${year}`;
  }
  if (calendar === 'gregorian') {
    return formatDisplayMonthYear(lang, year, month, 'gregorian');
  }
  const startIso = `${year}-${pad2(month)}-01`;
  const endIso = `${year}-${pad2(month)}-${pad2(gregorianMonthEndDay(year, month))}`;
  const startLabel = formatParts(lang, startIso, calendar, {
    month: 'long',
    year: 'numeric',
  });
  const endLabel = formatParts(lang, endIso, calendar, {
    month: 'long',
    year: 'numeric',
  });
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}
