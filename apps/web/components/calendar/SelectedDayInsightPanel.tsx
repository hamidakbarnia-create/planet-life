'use client';

import type { HourScore } from '@/lib/calendar-scores';
import { formatHourLabel, formatReadinessPercent } from '@/lib/calendar-scores';
import {
  CALENDAR_UI,
  POWER_BAND_STYLES,
} from '@/lib/calendar-power-presentation';

export type SelectedDayInsightPanelProps = {
  lang: string;
  dateLabel: string | null;
  bestHour: HourScore | null;
  riskHour: HourScore | null;
  loading: boolean;
  loadingLabel: string;
};

/** Single-hour window label from existing hourly extrema (no invented ranges). */
export function formatHourWindow(
  hour: number,
  lang: string
): string {
  const start = formatHourLabel(hour, lang);
  const end = formatHourLabel((hour + 1) % 24, lang);
  return `${start} – ${end}`;
}

export function SelectedDayInsightPanel({
  lang,
  dateLabel,
  bestHour,
  riskHour,
  loading,
  loadingLabel,
}: SelectedDayInsightPanelProps) {
  return (
    <section
      data-selected-day-insight-panel
      className="rounded-xl p-3 min-w-0"
      style={{
        background: CALENDAR_UI.panel,
        border: `1px solid ${CALENDAR_UI.panelBorder}`,
      }}
    >
      <div
        className="fi text-[9px] uppercase tracking-[0.14em] mb-1"
        style={{ color: CALENDAR_UI.textMuted }}
      >
        Selected Day Insight
      </div>
      <div
        data-insight-selected-date
        className="fi text-xs mb-3"
        style={{ color: POWER_BAND_STYLES.good.color }}
      >
        {dateLabel ?? '—'}
      </div>

      {loading ? (
        <div className="fi text-xs py-2" style={{ color: CALENDAR_UI.textMuted }}>
          {loadingLabel}
        </div>
      ) : bestHour && riskHour ? (
        <div className="space-y-2">
          <div
            data-insight-best-window
            className="rounded-lg px-2.5 py-2 flex items-center justify-between gap-2"
            style={{
              background: 'rgba(68,189,50,0.08)',
              border: '1px solid rgba(68,189,50,0.28)',
            }}
          >
            <div>
              <div
                className="fi text-[9px] uppercase tracking-wider mb-0.5"
                style={{ color: CALENDAR_UI.textMuted }}
              >
                Best window
              </div>
              <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {formatHourWindow(bestHour.hour, lang)}
              </div>
            </div>
            <div
              className="fc text-sm shrink-0"
              style={{ color: POWER_BAND_STYLES.good.color }}
              data-insight-best-score
            >
              {formatReadinessPercent(bestHour.score)}
            </div>
          </div>
          <div
            data-insight-risk-window
            className="rounded-lg px-2.5 py-2 flex items-center justify-between gap-2"
            style={{
              background: 'rgba(255,90,90,0.08)',
              border: '1px solid rgba(255,90,90,0.28)',
            }}
          >
            <div>
              <div
                className="fi text-[9px] uppercase tracking-wider mb-0.5"
                style={{ color: CALENDAR_UI.textMuted }}
              >
                Risk window
              </div>
              <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {formatHourWindow(riskHour.hour, lang)}
              </div>
            </div>
            <div
              className="fc text-sm shrink-0"
              style={{ color: POWER_BAND_STYLES.low.color }}
              data-insight-risk-score
            >
              {formatReadinessPercent(riskHour.score)}
            </div>
          </div>
        </div>
      ) : (
        <div className="fi text-xs" style={{ color: CALENDAR_UI.textMuted }}>
          Select a day to load hourly guidance.
        </div>
      )}

      <p
        data-insight-agency-footer
        className="fi text-[10px] leading-snug mt-3"
        style={{ color: 'rgba(255,255,255,0.38)' }}
      >
        Scores are calculated from celestial &amp; behavioral factors. You
        always make the final decision.
      </p>
    </section>
  );
}
