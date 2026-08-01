'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import {
  BAND_STYLES,
  formatReadinessPercent,
  scoreToBand,
} from '@/lib/calendar-scores';
import { buildCalendarCellDateLabels } from '@/lib/date-format';

export type CalendarMonthCellProps = {
  date: string;
  lang: AppLang;
  calendar: CalendarSystem;
  score?: number;
  inCurrentMonth: boolean;
  selected: boolean;
  isToday: boolean;
  dir: 'ltr' | 'rtl';
  onClick: () => void;
};

export function CalendarMonthCell({
  date,
  lang,
  calendar,
  score,
  inCurrentMonth,
  selected,
  isToday,
  dir,
  onClick,
}: CalendarMonthCellProps) {
  const labels = buildCalendarCellDateLabels(lang, date, calendar);
  const band = scoreToBand(inCurrentMonth ? score : undefined);
  const style = BAND_STYLES[band];
  const showScore = inCurrentMonth && score != null;
  const highlight = inCurrentMonth && (isToday || selected);

  return (
    <button
      type="button"
      data-calendar-cell={date}
      data-in-current-month={inCurrentMonth ? 'true' : 'false'}
      data-selected={inCurrentMonth && selected ? 'true' : 'false'}
      data-adjacent={!inCurrentMonth ? 'true' : undefined}
      dir={dir}
      onClick={onClick}
      className="rounded-lg flex flex-col items-stretch justify-between min-h-[4.25rem] sm:min-h-[4.75rem] px-0.5 py-0.5 sm:px-1 sm:py-1 transition-transform hover:scale-[1.02]"
      style={{
        background: inCurrentMonth ? style.bg : 'rgba(255,255,255,0.015)',
        border: `2px solid ${
          highlight ? '#fbbf24' : inCurrentMonth ? style.border : 'rgba(255,255,255,0.04)'
        }`,
        boxShadow: isToday && inCurrentMonth
          ? '0 0 12px rgba(251,191,36,0.35)'
          : selected && inCurrentMonth
            ? '0 0 0 1px #fbbf24'
            : undefined,
        opacity: inCurrentMonth ? 1 : 0.42,
      }}
    >
      <div className="flex flex-col items-center gap-px sm:gap-0.5 min-w-0 w-full">
        <span
          data-cell-primary
          className="fi text-[12px] sm:text-[13px] font-semibold leading-none text-white/92 max-w-full text-center"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.primary}
        </span>
        <span
          data-cell-secondary
          className="fi text-[7px] sm:text-[9px] leading-[1.05] sm:leading-tight max-w-full text-center whitespace-normal break-words"
          style={{ color: 'rgba(255,255,255,0.38)', fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.secondaries[0]}
        </span>
        <span
          data-cell-secondary
          className="fi text-[7px] sm:text-[9px] leading-[1.05] sm:leading-tight max-w-full text-center whitespace-normal break-words"
          style={{ color: 'rgba(255,255,255,0.38)', fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.secondaries[1]}
        </span>
      </div>
      {showScore ? (
        <span
          data-cell-score
          className="fi text-[9px] sm:text-[10px] mt-0.5 font-semibold text-center leading-none"
          style={{ color: style.text, fontVariantNumeric: 'tabular-nums' }}
        >
          {formatReadinessPercent(score)}
        </span>
      ) : (
        <span className="fi text-[9px] mt-0.5 leading-none invisible" aria-hidden>
          0%
        </span>
      )}
    </button>
  );
}
