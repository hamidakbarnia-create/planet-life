'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import { formatReadinessPercent } from '@/lib/calendar-scores';
import {
  CALENDAR_UI,
  POWER_BAND_STYLES,
  scoreToDotCount,
  scoreToPowerBand,
} from '@/lib/calendar-power-presentation';
import { buildCalendarCellDateLabels } from '@/lib/date-format';

export type CalendarDayCellProps = {
  date: string;
  lang: AppLang;
  calendar: CalendarSystem;
  /** Canonical map score — never recomputed here. */
  score?: number;
  inCurrentMonth: boolean;
  selected: boolean;
  isToday: boolean;
  dir: 'ltr' | 'rtl';
  onClick: () => void;
};

export function CalendarDayCell({
  date,
  lang,
  calendar,
  score,
  inCurrentMonth,
  selected,
  isToday,
  dir,
  onClick,
}: CalendarDayCellProps) {
  const labels = buildCalendarCellDateLabels(lang, date, calendar);
  const band = scoreToPowerBand(inCurrentMonth ? score : undefined);
  const style = POWER_BAND_STYLES[band];
  const showScore = inCurrentMonth && score != null;
  const dots = showScore ? scoreToDotCount(score) : 0;
  const highlight = inCurrentMonth && (isToday || selected);

  return (
    <button
      type="button"
      data-calendar-cell={date}
      data-calendar-day-cell
      data-power-band={band}
      data-in-current-month={inCurrentMonth ? 'true' : 'false'}
      data-selected={inCurrentMonth && selected ? 'true' : 'false'}
      data-adjacent={!inCurrentMonth ? 'true' : undefined}
      dir={dir}
      onClick={onClick}
      className="rounded-md flex flex-col items-stretch justify-between min-h-[4.75rem] sm:min-h-[5.5rem] lg:min-h-[6rem] px-0.5 py-1 sm:px-1 transition-[box-shadow,border-color] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: inCurrentMonth ? style.bg : 'rgba(255,255,255,0.02)',
        border: `1.5px solid ${
          selected && inCurrentMonth
            ? style.color
            : highlight
              ? CALENDAR_UI.gold
              : inCurrentMonth
                ? style.border
                : 'rgba(255,255,255,0.06)'
        }`,
        boxShadow:
          selected && inCurrentMonth
            ? `inset 0 0 0 1px ${style.color}, 0 0 14px ${style.glow}`
            : isToday && inCurrentMonth
              ? `0 0 10px ${CALENDAR_UI.goldSoft}`
              : undefined,
        opacity: inCurrentMonth ? 1 : 0.38,
        outlineColor: CALENDAR_UI.gold,
      }}
    >
      <div className="flex flex-col items-center gap-px min-w-0 w-full">
        <span
          data-cell-primary
          className="fi text-[13px] sm:text-[14px] font-semibold leading-none text-white/92"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.primary}
        </span>
        <span
          data-cell-secondary
          className="fi text-[6.5px] sm:text-[7.5px] leading-tight text-center max-w-full break-words"
          style={{ color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.secondaries[0]}
        </span>
        <span
          data-cell-secondary
          className="fi text-[6.5px] sm:text-[7.5px] leading-tight text-center max-w-full break-words"
          style={{ color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}
        >
          {labels.secondaries[1]}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 mt-0.5">
        {showScore ? (
          <span
            data-cell-score
            className="fi text-[11px] sm:text-[12px] font-semibold leading-none"
            style={{ color: style.color, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatReadinessPercent(score)}
          </span>
        ) : (
          <span className="fi text-[11px] leading-none invisible" aria-hidden>
            0%
          </span>
        )}
        <div
          data-cell-dots
          className="flex items-center justify-center gap-[3px]"
          aria-hidden
        >
          {Array.from({ length: 5 }, (_, i) => (
            <span
              key={i}
              className="inline-block h-[3px] w-[3px] rounded-full"
              style={{
                background:
                  i < dots ? style.color : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
