import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { formatPathfinderDate } from '@/lib/pathfinder-i18n';

export type ProfileCalendarType = 'gregorian' | 'persian' | 'hijri';

export function toCalendarSystem(type: ProfileCalendarType): CalendarSystem {
  if (type === 'persian') return 'shamsi';
  return type;
}

/** Display birth date in the selected calendar (Gregorian storage unchanged). */
export function formatProfileBirthDate(
  lang: AppLang,
  isoDate: string,
  calendarType: ProfileCalendarType
): string {
  return formatPathfinderDate(lang, isoDate, toCalendarSystem(calendarType));
}
