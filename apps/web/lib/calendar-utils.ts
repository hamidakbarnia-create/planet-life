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
