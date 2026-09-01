'use client';

import type { AppLang } from '@/lib/app-settings';
import { formatReadinessPercent } from '@/lib/calendar-scores';
import {
  CALENDAR_PAGE_LANGS,
  formatBandDayCount,
} from '@/lib/calendar-page-i18n';
import {
  CALENDAR_UI,
  buildPowerDistribution,
  type CountedPowerBand,
  type PowerDistribution,
} from '@/lib/calendar-power-presentation';

export type PowerDistributionChartProps = {
  /** Canonical month scores — sole input. */
  scores: Record<string, number>;
  /** Optional precomputed distribution (tests / memoization). */
  distribution?: PowerDistribution;
  lang?: AppLang;
};

const SIZE = 148;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function PowerDistributionChart({
  scores,
  distribution,
  lang = 'en',
}: PowerDistributionChartProps) {
  const dist = distribution ?? buildPowerDistribution(scores);
  const copy = CALENDAR_PAGE_LANGS[lang].insight;
  let offset = 0;

  return (
    <section
      data-power-distribution
      className="rounded-xl p-3 min-w-0"
      style={{
        background: CALENDAR_UI.panel,
        border: `1px solid ${CALENDAR_UI.panelBorder}`,
      }}
    >
      <div
        className="fi text-[9px] uppercase tracking-[0.14em] mb-3"
        style={{ color: CALENDAR_UI.textMuted }}
      >
        {copy.powerDistribution}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg
            width={SIZE}
            height={SIZE}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            role="img"
            aria-label={
              dist.average == null
                ? copy.powerDistribution
                : `${copy.avg} ${formatReadinessPercent(dist.average)}`
            }
          >
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={STROKE}
            />
            {dist.total > 0 &&
              dist.bands.map((band) => {
                if (band.count === 0) return null;
                const frac = band.count / dist.total;
                const dash = frac * C;
                const gap = C - dash;
                const el = (
                  <circle
                    key={band.band}
                    data-donut-band={band.band}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={R}
                    fill="none"
                    stroke={band.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${dash} ${gap}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  />
                );
                offset += dash;
                return el;
              })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="fi text-[10px] uppercase tracking-wider"
              style={{ color: CALENDAR_UI.textMuted }}
            >
              {copy.avg}
            </span>
            <span
              data-power-average
              className="fc text-xl leading-none"
              style={{ color: CALENDAR_UI.gold }}
            >
              {dist.average == null
                ? '--'
                : formatReadinessPercent(dist.average)}
            </span>
          </div>
        </div>

        <ul className="space-y-1.5 min-w-0 flex-1 w-full" data-power-band-list>
          {dist.bands.map((band) => (
            <li
              key={band.band}
              data-power-band-row={band.band}
              className="flex items-center justify-between gap-2 fi text-[11px]"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: band.color }}
                  aria-hidden
                />
                <span style={{ color: CALENDAR_UI.textSoft }} className="truncate">
                  {copy[band.band as CountedPowerBand]}
                </span>
              </span>
              <span
                className="tabular-nums shrink-0"
                style={{ color: 'rgba(255,255,255,0.55)' }}
                data-band-count={band.count}
                data-band-percent={band.percent}
              >
                {formatBandDayCount(lang, band.count, band.percent)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
