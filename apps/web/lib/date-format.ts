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

/**
 * Single atomic range label for a Gregorian ISO start/end pair.
 * Prefers Intl.formatRange so locale + calendar tokens are not separately
 * bidi-reordered when concatenated in RTL.
 */
export function formatDisplayDateRange(
  lang: AppLang,
  start: string,
  end: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  const startDate = utcDateFromIso(start);
  const endDate = utcDateFromIso(end);
  if (!startDate || !endDate) {
    return `${start} – ${end}`;
  }
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  };
  const fmt = new Intl.DateTimeFormat(displayLocale(lang, calendar), options);
  if (typeof fmt.formatRange === 'function') {
    return fmt.formatRange(startDate, endDate);
  }
  return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
}

/** Day-of-month numeral for a Gregorian ISO date in the chosen calendar system. */
export function formatDisplayDay(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem = 'gregorian'
): string {
  return formatParts(lang, isoDate, calendar, { day: 'numeric' });
}

/** Shorten Latin/Cyrillic month tokens for narrow EN/RU cells only. */
function compactMonthToken(month: string): string {
  const trimmed = month.trim();
  if (!trimmed) return trimmed;
  // Already abbreviated forms like "Saf." stay as-is when ≤4 visible chars.
  const chars = [...trimmed];
  if (chars.length <= 4) return trimmed;
  return chars.slice(0, 3).join('');
}

function usesFullMonthNames(lang: AppLang): boolean {
  return lang === 'fa' || lang === 'ar';
}

/** Canonical Shamsi month names (ICU `ar` + persian calendar corrupts several). */
const SHAMSI_MONTHS_FA = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

/** Arabic UI still uses Persian Shamsi month names (full, not transliterated). */
const SHAMSI_MONTHS_AR = SHAMSI_MONTHS_FA;

const HIJRI_MONTHS_FA = [
  'محرم',
  'صفر',
  'ربیع‌الاول',
  'ربیع‌الثانی',
  'جمادی‌الاول',
  'جمادی‌الثانی',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذی‌القعده',
  'ذی‌الحجه',
] as const;

const HIJRI_MONTHS_AR = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
] as const;

function calendarMonthIndex(
  isoDate: string,
  calendar: CalendarSystem
): number | null {
  const date = utcDateFromIso(isoDate);
  if (!date) return null;
  // Prefer en-US numeric month so ICU name corruption cannot affect the index.
  const parts = new Intl.DateTimeFormat(`en-US-u-ca-${CALENDAR_EXT[calendar]}`, {
    month: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(date);
  const raw = parts.find((p) => p.type === 'month')?.value;
  const month = raw ? Number(raw) : NaN;
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  return month - 1;
}

function localizedFullMonthName(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem
): string | null {
  if (!usesFullMonthNames(lang)) return null;
  const index = calendarMonthIndex(isoDate, calendar);
  if (index == null) return null;
  if (calendar === 'shamsi') {
    return (lang === 'ar' ? SHAMSI_MONTHS_AR : SHAMSI_MONTHS_FA)[index] ?? null;
  }
  if (calendar === 'hijri') {
    return (lang === 'ar' ? HIJRI_MONTHS_AR : HIJRI_MONTHS_FA)[index] ?? null;
  }
  // Gregorian: ICU long names are reliable for fa/ar.
  const date = utcDateFromIso(isoDate);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat(displayLocale(lang, 'gregorian'), {
    month: 'long',
    timeZone: 'UTC',
  }).formatToParts(date);
  return parts.find((p) => p.type === 'month')?.value?.trim() ?? null;
}

/**
 * Compact secondary label: day + localized month (no year).
 * Always day-first for consistent cell density across locales.
 * FA/AR keep full month names (no truncation / Latin abbreviations).
 */
export function formatCompactCalendarDate(
  lang: AppLang,
  isoDate: string,
  calendar: CalendarSystem
): string {
  const date = utcDateFromIso(isoDate);
  if (!date) return isoDate;
  const fullMonth = usesFullMonthNames(lang);
  const dayParts = new Intl.DateTimeFormat(displayLocale(lang, calendar), {
    day: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(date);
  const day = dayParts.find((p) => p.type === 'day')?.value ?? '';
  const mappedMonth = fullMonth
    ? localizedFullMonthName(lang, isoDate, calendar)
    : null;
  if (fullMonth && day && mappedMonth) {
    return `${day} ${mappedMonth}`;
  }
  const parts = new Intl.DateTimeFormat(displayLocale(lang, calendar), {
    day: 'numeric',
    month: fullMonth ? 'long' : 'short',
    timeZone: 'UTC',
  }).formatToParts(date);
  const monthRaw = parts.find((p) => p.type === 'month')?.value ?? '';
  const month = fullMonth ? monthRaw.trim() : compactMonthToken(monthRaw);
  if (!day || !month) {
    return formatParts(lang, isoDate, calendar, {
      day: 'numeric',
      month: fullMonth ? 'long' : 'short',
    });
  }
  return `${day} ${month}`;
}

const SECONDARY_ORDER: Record<CalendarSystem, CalendarSystem[]> = {
  gregorian: ['shamsi', 'hijri'],
  shamsi: ['gregorian', 'hijri'],
  hijri: ['gregorian', 'shamsi'],
};

export type CalendarCellDateLabels = {
  primary: string;
  secondaries: [string, string];
};

/**
 * Month-cell date labels: large primary from the active calendar,
 * two compact secondaries from the other systems (no duplicate of active).
 */
export function buildCalendarCellDateLabels(
  lang: AppLang,
  isoDate: string,
  active: CalendarSystem
): CalendarCellDateLabels {
  const primary = formatDisplayDay(lang, isoDate, active);
  const secondarySystems = SECONDARY_ORDER[active];
  return {
    primary,
    secondaries: [
      formatCompactCalendarDate(lang, isoDate, secondarySystems[0]),
      formatCompactCalendarDate(lang, isoDate, secondarySystems[1]),
    ],
  };
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
