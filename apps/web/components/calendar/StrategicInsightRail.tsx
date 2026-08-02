'use client';

import type { HourScore } from '@/lib/calendar-scores';
import { formatReadinessPercent } from '@/lib/calendar-scores';
import {
  GPS_TONE_STYLES,
  type StrategicGps,
  type StrategicGpsWeek,
} from '@/lib/strategic-gps';
import { WeeklyPathChart } from '@/components/calendar/WeeklyPathChart';

export type StrategicInsightRailProps = {
  /** Month + week summaries derived from monthly scores only (ignore hourly). */
  monthOutlook: Pick<
    StrategicGps,
    'text' | 'monthScore' | 'monthTone' | 'monthBody' | 'goldenCount' | 'cautionCount' | 'weeks'
  >;
  /** Selected-day hourly extrema only. */
  selectedDay: {
    dateLabel: string | null;
    bestHour: HourScore | null;
    riskHour: HourScore | null;
    bestHourLabel: string | null;
    riskHourLabel: string | null;
  };
  loadingHourly: boolean;
  loadingLabel: string;
  /** Tighter padding for the compact mobile strip. */
  compact?: boolean;
};

function WeekRows({ weeks }: { weeks: StrategicGpsWeek[] }) {
  return (
    <div className="space-y-1.5" data-rail-weekly-path>
      {weeks.map((week) => {
        const style = GPS_TONE_STYLES[week.tone];
        return (
          <div key={week.label} className="flex items-center gap-2 min-w-0">
            <span className="fi text-[10px] w-12 shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {week.label}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${week.score ?? 8}%`,
                  background: style.color,
                  opacity: week.score == null ? 0.25 : 0.9,
                }}
              />
            </div>
            <span className="fi text-[10px] w-14 text-end shrink-0" style={{ color: style.color }}>
              {week.score == null ? '--' : formatReadinessPercent(week.score)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StrategicInsightRail({
  monthOutlook,
  selectedDay,
  loadingHourly,
  loadingLabel,
  compact = false,
}: StrategicInsightRailProps) {
  const { text } = monthOutlook;
  const pad = compact ? 'p-3' : 'p-3.5';
  const sectionGap = compact ? 'space-y-3' : 'space-y-3.5';

  return (
    <aside
      data-strategic-insight-rail
      data-rail-compact={compact ? 'true' : 'false'}
      className={`rounded-2xl ${pad} min-w-0 ${sectionGap}`}
      style={{
        background: 'linear-gradient(145deg, rgba(251,191,36,0.06), rgba(59,130,246,0.05))',
        border: '1px solid rgba(251,191,36,0.18)',
      }}
    >
      {/* 1. Month Outlook — monthly scores only */}
      <section
        data-rail-section="month-outlook"
        data-month-outlook-score={
          monthOutlook.monthScore == null ? '' : String(monthOutlook.monthScore)
        }
        className="rounded-xl px-3 py-2.5"
        style={{
          background: GPS_TONE_STYLES[monthOutlook.monthTone].bg,
          border: `1px solid ${GPS_TONE_STYLES[monthOutlook.monthTone].border}`,
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div
            className="fi text-[10px] uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            {text.monthOutlook}
          </div>
          <div
            className="fc text-2xl leading-none shrink-0"
            style={{ color: GPS_TONE_STYLES[monthOutlook.monthTone].color }}
          >
            {monthOutlook.monthScore == null
              ? '--'
              : formatReadinessPercent(monthOutlook.monthScore)}
          </div>
        </div>
        <p className="fi text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {monthOutlook.monthBody}
        </p>
        <div className="fi text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
          {monthOutlook.goldenCount} {text.goldenDays} · {monthOutlook.cautionCount}{' '}
          {text.cautionDays}
        </div>
      </section>

      {/* 2. Weekly Path — monthly scores only */}
      <section
        data-rail-section="weekly-path"
        className="rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="fi text-[10px] uppercase tracking-widest mb-2"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {text.weeklyPath}
        </div>
        {/* Desktop: SVG weekly path chart. Mobile compact: retain list summary. */}
        {compact ? (
          <WeekRows weeks={monthOutlook.weeks} />
        ) : (
          <WeeklyPathChart weeks={monthOutlook.weeks} />
        )}
      </section>

      {/* 3. Selected Day Timing — selected-day hourly only */}
      <section
        data-rail-section="selected-day-timing"
        className="rounded-xl px-3 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <div
          className="fi text-[10px] uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          {text.selectedDayTiming}
        </div>
        <div
          data-rail-selected-date
          className="fi text-xs mb-2"
          style={{ color: 'rgba(251,191,36,0.85)' }}
        >
          {text.selectedDayScope}
          {selectedDay.dateLabel ? `: ${selectedDay.dateLabel}` : ''}
        </div>

        {loadingHourly ? (
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {loadingLabel}
          </div>
        ) : selectedDay.bestHour && selectedDay.riskHour ? (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {text.bestHour}
              </span>
              <span
                data-rail-best-hour
                className="fc text-sm"
                style={{ color: '#4ade80' }}
              >
                {selectedDay.bestHourLabel} ·{' '}
                {formatReadinessPercent(selectedDay.bestHour.score)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="fi text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {text.riskHour}
              </span>
              <span
                data-rail-risk-hour
                className="fc text-sm"
                style={{ color: '#f87171' }}
              >
                {selectedDay.riskHourLabel} ·{' '}
                {formatReadinessPercent(selectedDay.riskHour.score)}
              </span>
            </div>
          </div>
        ) : (
          <div className="fi text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {text.noHourly}
          </div>
        )}
      </section>
    </aside>
  );
}
