'use client';

import { CALENDAR_UI } from '@/lib/calendar-power-presentation';

export type CalendarToolbarProps = {
  monthLabel: string;
  prevLabel: string;
  nextLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

/**
 * Month navigation only.
 * Month/Week toggle and category filter removed until implemented (no fake controls).
 * Decision Power legend lives once in CalendarInsightStack.
 */
export function CalendarToolbar({
  monthLabel,
  prevLabel,
  nextLabel,
  onPrevMonth,
  onNextMonth,
}: CalendarToolbarProps) {
  return (
    <div data-calendar-toolbar className="flex flex-col gap-3 mb-3 min-w-0">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label={prevLabel}
            onClick={onPrevMonth}
            className="fi h-8 w-8 rounded-md border text-sm leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: CALENDAR_UI.panelBorder,
              color: CALENDAR_UI.textSoft,
              background: CALENDAR_UI.panel,
              outlineColor: CALENDAR_UI.gold,
            }}
          >
            ‹
          </button>
          <div
            className="fc text-sm px-2 min-w-[7.5rem] text-center"
            style={{ color: CALENDAR_UI.gold }}
            data-calendar-month-title
          >
            {monthLabel}
          </div>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={onNextMonth}
            className="fi h-8 w-8 rounded-md border text-sm leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              borderColor: CALENDAR_UI.panelBorder,
              color: CALENDAR_UI.textSoft,
              background: CALENDAR_UI.panel,
              outlineColor: CALENDAR_UI.gold,
            }}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
