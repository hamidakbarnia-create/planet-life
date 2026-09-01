'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { formatReadinessPercent } from '@/lib/calendar-scores';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import {
  CALENDAR_UI,
  POWER_BAND_STYLES,
  findWeekBest,
  scoreToPowerBand,
} from '@/lib/calendar-power-presentation';
import {
  buildLinearPathD,
  formatWeekRangeLabel,
  scoreToPlotY,
} from '@/lib/calendar-week-geometry';
import type { StrategicGpsWeek } from '@/lib/strategic-gps';

export type WeeklyTrendChartProps = {
  weeks: StrategicGpsWeek[];
  selectedDate?: string | null;
  monthBestDate?: string | null;
  monthBestScore?: number | null;
  monthBestDateLabel?: string | null;
  weekdayLabels: string[];
  lang?: AppLang;
  calendar?: CalendarSystem;
  /** Jump selectedDate to month peak so Weekly Trend shows that week. */
  onViewMonthBestWeek?: (date: string) => void;
};

const WIDTH = 320;
const HEIGHT = 200;
const PAD_X = 28;
const PAD_TOP = Math.round(HEIGHT * 0.12);
const PAD_BOTTOM = Math.round(HEIGHT * 0.18);

function yTicks(): number[] {
  return [0, 25, 50, 75, 100];
}

export function WeeklyTrendChart({
  weeks,
  selectedDate = null,
  monthBestDate = null,
  monthBestScore = null,
  monthBestDateLabel = null,
  weekdayLabels,
  lang = 'en',
  calendar = 'gregorian',
  onViewMonthBestWeek,
}: WeeklyTrendChartProps) {
  const copy = CALENDAR_PAGE_LANGS[lang].insight;
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

  let highlightIndex = -1;
  if (selectedDate) {
    for (let i = 0; i < points.length; i += 1) {
      if (points[i].week.date === selectedDate) {
        highlightIndex = i;
        break;
      }
    }
  }

  const pathD = buildLinearPathD(points.map(({ x, y }) => ({ x, y })));
  const areaD = (() => {
    const finite = points.filter((p) => p.y != null);
    if (finite.length < 2 || !pathD) return '';
    const baseline = scoreToPlotY(0, HEIGHT, PAD_TOP, PAD_BOTTOM)!;
    const first = finite[0];
    const last = finite[finite.length - 1];
    return `${pathD} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  })();

  const weekBest = findWeekBest(
    weeks.map((w) => ({ date: w.date, score: w.score })),
    weekdayLabels
  );

  const monthBestOutsideSelectedWeek = !!(
    monthBestDate &&
    monthBestScore != null &&
    !weeks.some((w) => w.date === monthBestDate)
  );
  const showMonthBestAction =
    !!monthBestDate &&
    monthBestScore != null &&
    !!onViewMonthBestWeek &&
    monthBestDate !== selectedDate;

  return (
    <section
      data-weekly-trend
      className="rounded-xl p-3 min-w-0"
      style={{
        background: CALENDAR_UI.panel,
        border: `1px solid ${CALENDAR_UI.panelBorder}`,
      }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <div
          className="fi text-[9px] uppercase tracking-[0.14em]"
          style={{ color: CALENDAR_UI.textMuted }}
        >
          {copy.weeklyTrend}
        </div>
        {weekRange ? (
          <div
            data-week-range
            className="fi text-[10px]"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {weekRange}
          </div>
        ) : null}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label={copy.weeklyTrend}
        className="block overflow-visible"
        data-weekly-trend-chart
        data-weekly-path-strategy="linear-segments"
      >
        {yTicks().map((tick) => {
          const y = scoreToPlotY(tick, HEIGHT, PAD_TOP, PAD_BOTTOM)!;
          return (
            <g key={tick}>
              <text
                x={PAD_X - 6}
                y={y + 3}
                textAnchor="end"
                className="fi"
                style={{ fill: 'rgba(255,255,255,0.28)', fontSize: 8 }}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {areaD ? (
          <path
            d={areaD}
            fill="url(#weeklyTrendFill)"
            opacity={0.55}
            data-weekly-trend-fill
          />
        ) : null}
        <defs>
          <linearGradient id="weeklyTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(197,160,89,0.35)" />
            <stop offset="100%" stopColor="rgba(197,160,89,0)" />
          </linearGradient>
        </defs>

        {pathD ? (
          <path
            data-weekly-path-line
            d={pathD}
            fill="none"
            stroke="rgba(225,177,44,0.85)"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map(({ week, x, y, index }) => {
          const hasScore = y != null;
          const band = scoreToPowerBand(week.score);
          const color = POWER_BAND_STYLES[band].color;
          const percent =
            week.score == null || !hasScore
              ? '--'
              : formatReadinessPercent(week.score);
          const isHighlighted = index === highlightIndex;
          const isMonthBestInWeek = !!(
            hasScore &&
            monthBestDate &&
            week.date &&
            week.date === monthBestDate
          );
          const axis =
            weekdayLabels[index] ?? week.label;
          return (
            <g
              key={week.date ?? week.label}
              data-week-point={axis}
              data-path-date={week.date ?? ''}
              data-path-score={
                week.score == null || !hasScore ? '' : String(week.score)
              }
              data-path-y={hasScore ? String(y) : ''}
              data-path-missing={hasScore ? 'false' : 'true'}
              data-path-highlighted={isHighlighted ? 'true' : 'false'}
              data-path-month-best={isMonthBestInWeek ? 'true' : 'false'}
            >
              {hasScore && (isHighlighted || isMonthBestInWeek) && (
                <circle
                  cx={x}
                  cy={y}
                  r={isMonthBestInWeek ? 12 : 9}
                  fill={color}
                  opacity={isMonthBestInWeek ? 0.32 : 0.2}
                  aria-hidden
                />
              )}
              {hasScore ? (
                <circle
                  data-path-score-circle
                  cx={x}
                  cy={y}
                  r={isHighlighted || isMonthBestInWeek ? 5 : 3.75}
                  fill={color}
                  stroke="rgba(8,12,24,0.9)"
                  strokeWidth={1.2}
                />
              ) : null}
              <text
                x={x}
                y={hasScore ? y! - 12 : PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) / 2}
                textAnchor="middle"
                className="fi"
                data-path-score-label={percent}
                style={{
                  fill: 'rgba(255,255,255,0.85)',
                  fontSize: 9,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {percent}
              </text>
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                className="fi"
                data-week-axis-label={axis}
                style={{ fill: 'rgba(255,255,255,0.45)', fontSize: 9 }}
              >
                {axis}
              </text>
            </g>
          );
        })}
      </svg>

      {weekBest ? (
        <div
          data-week-best
          data-week-best-date={weekBest.date}
          data-week-best-score={String(weekBest.score)}
          className="fi text-[11px] mt-2"
          style={{ color: POWER_BAND_STYLES.good.color }}
        >
          {copy.weekBest}: {weekBest.weekdayLabel} ·{' '}
          {formatReadinessPercent(weekBest.score)}
        </div>
      ) : null}

      {showMonthBestAction ? (
        <button
          type="button"
          data-month-best-view-week
          data-month-best-outside-week={
            monthBestOutsideSelectedWeek ? 'true' : 'false'
          }
          onClick={() => onViewMonthBestWeek?.(monthBestDate!)}
          className="fi text-[11px] mt-1.5 text-left w-full rounded-md px-0 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{
            color: POWER_BAND_STYLES.excellent.color,
            outlineColor: CALENDAR_UI.gold,
          }}
        >
          {copy.monthBest}: {monthBestDateLabel ?? monthBestDate} ·{' '}
          {formatReadinessPercent(monthBestScore)} → {copy.viewWeek}
        </button>
      ) : null}
    </section>
  );
}
