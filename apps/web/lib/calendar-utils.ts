import { formatDateYMD } from './calendar-scores';

export type CalendarGridCell = {
  /** Gregorian ISO YYYY-MM-DD */
  date: string;
  /** Gregorian day-of-month for this date */
  day: number;
  /** True when the date belongs to the viewed Gregorian month */
  inCurrentMonth: boolean;
};

/**
 * Builds a Sunday-start month grid for a Gregorian year/month.
 * Leading/trailing cells are real previous/next-month dates (muted in UI).
 */
export function calendarCells(year: number, month: number): CalendarGridCell[] {
  const firstDow = new Date(year, month - 1, 1).getDay();
  const total = new Date(year, month, 0).getDate();
  const cells: CalendarGridCell[] = [];

  // Previous-month trailing days
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevTotal = new Date(prevYear, prevMonth, 0).getDate();
  for (let i = firstDow - 1; i >= 0; i--) {
    const day = prevTotal - i;
    cells.push({
      date: formatDateYMD(prevYear, prevMonth, day),
      day,
      inCurrentMonth: false,
    });
  }

  for (let d = 1; d <= total; d++) {
    cells.push({
      date: formatDateYMD(year, month, d),
      day: d,
      inCurrentMonth: true,
    });
  }

  // Next-month leading days to complete the final week
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: formatDateYMD(nextYear, nextMonth, nextDay),
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function todayYMD(): string {
  const d = new Date();
  return formatDateYMD(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** Shift a Gregorian year/month by delta months. */
export function shiftYearMonth(
  year: number,
  month: number,
  delta: number
): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  return { year: y, month: m };
}

/** Parse YYYY-MM-DD into Gregorian year/month/day. */
export function parseIsoDate(
  isoDate: string
): { year: number; month: number; day: number } | null {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  return { year, month, day };
}

/**
 * Sunday-start week (7 ISO dates) containing `isoDate`.
 * Matches `calendarCells` week rows, including cross-month days.
 */
export function sundayWeekDatesContaining(isoDate: string): string[] {
  const parsed = parseIsoDate(isoDate);
  if (!parsed) return [];
  const dow = new Date(parsed.year, parsed.month - 1, parsed.day).getDay();
  const dates: string[] = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const d = new Date(
      parsed.year,
      parsed.month - 1,
      parsed.day - dow + offset
    );
    dates.push(formatDateYMD(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }
  return dates;
}

/** Keep a day-of-month when navigating months (clamped to month length). */
export function clampIsoDateToMonth(
  isoDate: string | null | undefined,
  year: number,
  month: number
): string {
  const parsed = isoDate ? parseIsoDate(isoDate) : null;
  const day = parsed?.day ?? 1;
  const dim = new Date(year, month, 0).getDate();
  return formatDateYMD(year, month, Math.min(Math.max(day, 1), dim));
}

/** True when ISO date falls in the Gregorian year/month. */
export function isoDateInMonth(
  isoDate: string | null | undefined,
  year: number,
  month: number
): boolean {
  const parsed = isoDate ? parseIsoDate(isoDate) : null;
  return parsed != null && parsed.year === year && parsed.month === month;
}
