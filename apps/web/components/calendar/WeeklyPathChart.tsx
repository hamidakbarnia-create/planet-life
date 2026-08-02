'use client';

import { formatReadinessPercent } from '@/lib/calendar-scores';
import { GPS_TONE_STYLES, type StrategicGpsWeek } from '@/lib/strategic-gps';

export type WeeklyPathChartProps = {
  weeks: StrategicGpsWeek[];
};

const WIDTH = 280;
const HEIGHT = 132;
const PAD_X = 22;
const PAD_TOP = 28;
const PAD_BOTTOM = 28;

function plotY(score: number | null, plotHeight: number): number {
  const value = score == null ? 8 : Math.max(0, Math.min(100, score));
  return PAD_TOP + plotHeight * (1 - value / 100);
}

/** Smooth cubic path through points (Catmull-Rom → Bezier). */
function smoothPath(points: Array<{ x: number; y: number }>): string {
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

/** Short axis label derived from existing week.label (no new score math). */
export function shortWeekAxisLabel(label: string): string {
  const trimmed = label.trim();
  const match = trimmed.match(/(\d+)\s*$/);
  if (match) return match[1];
  return trimmed.length > 4 ? trimmed.slice(0, 4) : trimmed;
}

export function WeeklyPathChart({ weeks }: WeeklyPathChartProps) {
  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const count = Math.max(weeks.length, 1);

  const points = weeks.map((week, index) => {
    const x =
      weeks.length === 1
        ? WIDTH / 2
        : PAD_X + (plotWidth * index) / (count - 1);
    const y = plotY(week.score, plotHeight);
    return { week, x, y, index };
  });

  let peakIndex = -1;
  let peakScore = -Infinity;
  for (let i = 0; i < points.length; i += 1) {
    const score = points[i].week.score;
    if (score != null && score > peakScore) {
      peakScore = score;
      peakIndex = i;
    }
  }

  const pathD = smoothPath(points.map(({ x, y }) => ({ x, y })));

  return (
    <div
      data-rail-weekly-path
      data-weekly-path-chart
      className="w-full min-w-0"
      style={{ animation: 'weeklyPathIn 280ms ease-out' }}
    >
      <style>{`
        @keyframes weeklyPathIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Weekly Path"
        className="block overflow-visible"
      >
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
          const isPeak = index === peakIndex;
          const aria = `${week.label}, ${percent}, ${week.action}`;
          return (
            <g key={week.label} data-week-point={week.label}>
              {isPeak && (
                <circle
                  cx={x}
                  cy={y}
                  r={9}
                  fill={style.color}
                  opacity={0.22}
                  aria-hidden
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={isPeak ? 5 : 3.75}
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
                y={y - (isPeak ? 14 : 11)}
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
          <li key={`sr-${week.label}`}>
            {week.label},{' '}
            {week.score == null ? '--' : formatReadinessPercent(week.score)},{' '}
            {week.action}
          </li>
        ))}
      </ul>
    </div>
  );
}
