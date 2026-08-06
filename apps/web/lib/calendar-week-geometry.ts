import type { AppLang, CalendarSystem } from './app-settings';
import { formatCompactCalendarDate } from './date-format';

/** Shared Weekly Trend plot geometry (presentation only). */
export const WEEKLY_PATH_HEIGHT = 165;
export const WEEKLY_PATH_WIDTH = 280;
export const WEEKLY_PATH_PAD_TOP = Math.round(WEEKLY_PATH_HEIGHT * 0.1);
export const WEEKLY_PATH_PAD_BOTTOM = Math.round(WEEKLY_PATH_HEIGHT * 0.1);
export const WEEKLY_PATH_PAD_X = 22;

/**
 * Fixed 0–100 vertical scale.
 * Null / NaN → null (never plotted as 0%).
 */
export function scoreToPlotY(
  score: number | null,
  height: number = WEEKLY_PATH_HEIGHT,
  padTop: number = WEEKLY_PATH_PAD_TOP,
  padBottom: number = WEEKLY_PATH_PAD_BOTTOM
): number | null {
  if (score == null || Number.isNaN(score)) return null;
  const plotHeight = height - padTop - padBottom;
  const value = Math.max(0, Math.min(100, score));
  return padTop + plotHeight * (1 - value / 100);
}

/**
 * Straight M/L segments between consecutive finite points.
 * Gaps break the path — no overshoot above/below adjacent scores.
 */
export function buildLinearPathD(
  points: Array<{ x: number; y: number | null }>
): string {
  const parts: string[] = [];
  let drawing = false;
  for (const point of points) {
    if (point.y == null || !Number.isFinite(point.y)) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      parts.push(`M ${point.x} ${point.y}`);
      drawing = true;
    } else {
      parts.push(`L ${point.x} ${point.y}`);
    }
  }
  return parts.join(' ');
}

export function shortWeekAxisLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  const weekMatch = trimmed.match(/^(?:Week|Неделя|هفته|أسبوع)\s+(\d+)$/i);
  if (weekMatch) return weekMatch[1];
  return trimmed;
}

export function formatWeekRangeLabel(
  weeks: Array<{ date?: string | null }>,
  lang: AppLang = 'en',
  calendar: CalendarSystem = 'gregorian'
): string | null {
  const dates = weeks
    .map((w) => w.date)
    .filter((d): d is string => typeof d === 'string' && d.length > 0);
  if (!dates.length) return null;
  const start = dates[0];
  const end = dates[dates.length - 1];
  if (start === end) {
    return formatCompactCalendarDate(lang, start, calendar);
  }
  return `${formatCompactCalendarDate(lang, start, calendar)} – ${formatCompactCalendarDate(lang, end, calendar)}`;
}
