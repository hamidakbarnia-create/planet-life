/**
 * Locale-aware date display for ASK product surfaces.
 * Uses the app calendar preference + language — never Frame-local English months.
 *
 * Source dates remain canonical Gregorian ISO (`YYYY-MM-DD`) internally.
 * FA Result presentation follows the existing ask-product calendar policy
 * (Jalali primary + Gregorian secondary when calendars differ).
 */

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { loadCalendarSystem } from '@/lib/app-settings';
import {
  formatDisplayDate,
  formatDisplayDateRange,
} from '@/lib/date-format';

export type AskDateDisplay = {
  primary: string;
  secondary?: string;
  iso: string;
};

/** Default calendar for ASK when preference is gregorian but lang is FA → shamsi primary. */
export function askPrimaryCalendar(
  lang: AppLang,
  preferred: CalendarSystem = loadCalendarSystem()
): CalendarSystem {
  if (lang === 'fa' && preferred === 'gregorian') return 'shamsi';
  if (lang === 'ar' && preferred === 'gregorian') return preferred;
  return preferred;
}

/**
 * FA: primary Jalali (or user shamsi), secondary Gregorian when calendars differ.
 * EN/RU: localized Gregorian (or user preference).
 * AR: follows configured calendar policy via date-format.
 */
export function formatAskDatePair(
  lang: AppLang,
  iso: string,
  preferred: CalendarSystem = loadCalendarSystem()
): AskDateDisplay {
  const primaryCal = askPrimaryCalendar(lang, preferred);
  const primary = formatDisplayDate(lang, iso, primaryCal);

  if (lang === 'fa' && primaryCal !== 'gregorian') {
    return {
      iso,
      primary,
      secondary: formatDisplayDate(lang, iso, 'gregorian'),
    };
  }

  if (lang === 'ar' && primaryCal !== 'gregorian') {
    return {
      iso,
      primary,
      secondary: formatDisplayDate(lang, iso, 'gregorian'),
    };
  }

  return { iso, primary };
}

/** Single localized date label for Result presentation (primary calendar). */
export function formatAskDateLabel(
  lang: AppLang,
  iso: string,
  preferred: CalendarSystem = loadCalendarSystem()
): string {
  return formatAskDatePair(lang, iso, preferred).primary;
}

/**
 * Atomic FIND/COMPARE range label. One formatter call — not separately
 * rendered RTL fragments. ISO start/end ordering is unchanged.
 */
export function formatAskDateRange(
  lang: AppLang,
  startIso: string,
  endIso: string,
  preferred: CalendarSystem = loadCalendarSystem()
): string {
  const primaryCal = askPrimaryCalendar(lang, preferred);
  return formatDisplayDateRange(lang, startIso, endIso, primaryCal);
}
