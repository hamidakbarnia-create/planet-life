'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { formatReadinessPercent } from '@/lib/calendar-scores';
import { formatCompactCalendarDate } from '@/lib/date-format';
import { GPS_TONE_STYLES, type StrategicGpsWeek } from '@/lib/strategic-gps';

export type WeeklyPathChartProps = {
  weeks: StrategicGpsWeek[];
  /** Highlight the point whose `date` equals this canonical selected ISO date. */
  selectedDate?: string | null;
  /**
   * Canonical month-max date. When present in this week, that point gets a
   * stronger glow — never invented when the max is outside the week.
   */
  monthBestDate?: string | null;
  lang?: AppLang;
  calendar?: CalendarSystem;
};

/** ~25% taller than the previous 132px chart. */
export const WEEKLY_PATH_HEIGHT = 165;
export const WEEKLY_PATH_WIDTH = 280;

/**
 * ~10% top / bottom padding of chart height.
 * Weekday labels sit inside the bottom pad (no extra band stolen from 0–100).
 */
export const WEEKLY_PATH_PAD_TOP = Math.round(WEEKLY_PATH_HEIGHT * 0.1);
export const WEEKLY_PATH_PAD_BOTTOM = Math.round(WEEKLY_PATH_HEIGHT * 0.1);
export const WEEKLY_PATH_PAD_X = 22;

/**
 * Fixed 0–100 vertical scale (never week min/max normalized).
 * score 0 → bottom of plot band; score 100 → top of plot band.
 * y = padTop + plotHeight * (1 - score / 100)
 */
export function scoreToPlotY(
  score: number | null,
  height: number = WEEKLY_PATH_HEIGHT,
  padTop: number = WEEKLY_PATH_PAD_TOP,
  padBottom: number = WEEKLY_PATH_PAD_BOTTOM
): number {
  const plotHeight = height - padTop - padBottom;
  const value = score == null ? 0 : Math.max(0, Math.min(100, score));
  return padTop + plotHeight * (1 - value / 100);
}

/** Smooth cubic path through points (Catmull-Rom → Bezier). Endpoints stay exact. */
export function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Axis label as provided (weekday / compact date) — no score math. */
export function shortWeekAxisLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  // Legacy "Week N" → digit only (tests / older callers).
  const weekMatch = trimmed.match(/^(?:Week|Неделя|هفته|أسبوع)\s+(\d+)$/i);
  if (weekMatch) return weekMatch[1];
  return trimmed;
}

/** Compact week span from first/last path dates, e.g. "3 Aug – 9 Aug". */
export function formatWeekRangeLabel(
  weeks: StrategicGpsWeek[],
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

export function WeeklyPathChart({
  weeks,
  selectedDate = null,
  monthBestDate = null,
  lang = 'en',
  calendar = 'gregorian',
}: WeeklyPathChartProps) {
  const WIDTH = WEEKLY_PATH_WIDTH;
  const HEIGHT = WEEKLY_PATH_HEIGHT;
  const PAD_X = WEEKLY_PATH_PAD_X;
  const PAD_TOP = WEEKLY_PATH_PAD_TOP;
  const PAD_BOTTOM = WEEKLY_PATH_PAD_BOTTOM;
  const plotWidth = WIDTH - PAD_X * 2;
  const count = Math.max(weeks.length, 1);
  const weekRange = formatWeekRangeLabel(weeks, lang, calendar);

  const points = weeks.map((week, index) => {
    const x =
      weeks.length === 1
        ? WIDTH / 2
        : PAD_X + (plotWidth * index) / (count - 1);
    const y = scoreToPlotY(week.score, HEIGHT, PAD_TOP, PAD_BOTTOM);
    return { week, x, y, index };
  });

  // Highlight only the canonical selectedDate — never substitute week-max.
  let highlightIndex = -1;
  if (selectedDate) {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i].week.date === selectedDate) {
        highlightIndex = i;
        break;
      }
    }
  }

  const pathD = smoothPath(points.map(({ x, y }) => ({ x, y })));

  return (
    <div
      data-rail-weekly-path
      data-weekly-path-chart
      data-weekly-path-height={String(HEIGHT)}
      className="w-full min-w-0"
      style={{ animation: 'weeklyPathIn 280ms ease-out' }}
    >
      <style>{`
        @keyframes weeklyPathIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes monthBestGlow {
          from { opacity: 0.2; }
          to { opacity: 0.42; }
        }
      `}</style>
      {weekRange ? (
        <div
          data-week-range
          className="fi text-[10px] mb-1.5 truncate"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          {weekRange}
        </div>
      ) : null}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Weekly Path"
        className="block overflow-visible"
      >
        {/* No grid / no axes / no left scale — fixed 0–100 is implicit in plotY. */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(({ week, x, y, index }) => {
          const style = GPS_TONE_STYLES[week.tone];
          const percent =
            week.score == null ? '--' : formatReadinessPercent(week.score);
          const isHighlighted = index === highlightIndex;
          const isMonthBestInWeek = !!(
            monthBestDate &&
            week.date &&
            week.date === monthBestDate
          );
          const aria = `${week.label}, ${percent}, ${week.action}`;
          const glowR = isMonthBestInWeek ? 14 : isHighlighted ? 9 : 0;
          return (
            <g
              key={week.date ?? week.label}
              data-week-point={week.label}
              data-path-date={week.date ?? ''}
              data-path-score={
                week.score == null ? '' : String(week.score)
              }
              data-path-y={String(y)}
              data-path-highlighted={isHighlighted ? 'true' : 'false'}
              data-path-month-best={isMonthBestInWeek ? 'true' : 'false'}
            >
              {glowR > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={glowR}
                  fill={style.color}
                  opacity={isMonthBestInWeek ? 0.34 : 0.22}
                  aria-hidden
                  style={
                    isMonthBestInWeek
                      ? { animation: 'monthBestGlow 1.6s ease-in-out infinite alternate' }
                      : undefined
                  }
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isHighlighted || isMonthBestInWeek ? 5.25 : 3.75}
                fill={style.color}
                stroke="rgba(8,12,24,0.85)"
                strokeWidth={1.25}
                role="img"
                aria-label={aria}
              >
                <title>{aria}</title>
              </circle>
              <text
                x={x}
                y={y - (isHighlighted || isMonthBestInWeek ? 14 : 11)}
                textAnchor="middle"
                className="fi"
                style={{
                  fill: 'rgba(255,255,255,0.82)',
                  fontSize: 9,
                  fontVariantNumeric: 'tabular-nums',
                }}
                aria-hidden
              >
                {percent}
              </text>
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fi"
                data-week-axis-label={week.label}
                style={{
                  fill: 'rgba(255,255,255,0.45)',
                  fontSize: 9,
                }}
                aria-hidden
              >
                {shortWeekAxisLabel(week.label)}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Screen-reader list mirrors existing week fields without color-only meaning */}
      <ul className="sr-only">
        {weeks.map((week) => (
          <li key={`sr-${week.date ?? week.label}`}>
            {week.label},{' '}
            {week.score == null ? '--' : formatReadinessPercent(week.score)},{' '}
            {week.action}
          </li>
        ))}
      </ul>
    </div>
  );
}
