/**
 * Locale-aware date display for ASK product surfaces.
 * Uses the app calendar preference + language — never Frame-local English months.
 */

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { loadCalendarSystem } from '@/lib/app-settings';
import { formatDisplayDate } from '@/lib/date-format';

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
