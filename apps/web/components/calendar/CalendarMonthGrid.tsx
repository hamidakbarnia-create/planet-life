'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import type { CalendarGridCell } from '@/lib/calendar-utils';
import { CALENDAR_UI } from '@/lib/calendar-power-presentation';
import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { CalendarToolbar } from '@/components/calendar/CalendarToolbar';

export type CalendarMonthGridProps = {
  lang: AppLang;
  dir: 'ltr' | 'rtl';
  calendar: CalendarSystem;
  year: number;
  month: number;
  monthLabel: string;
  weekdays: string[];
  cells: CalendarGridCell[];
  /** Canonical month score map — cells read scores[date] only. */
  scores: Record<string, number>;
  selectedDate: string | null;
  todayStr: string;
  loadingMonth: boolean;
  loadingLabel: string;
  progress: { done: number; total: number };
  prevLabel: string;
  nextLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onCellClick: (date: string, inCurrentMonth: boolean) => void;
};

export function CalendarMonthGrid({
  lang,
  dir,
  calendar,
  year,
  month,
  monthLabel,
  weekdays,
  cells,
  scores,
  selectedDate,
  todayStr,
  loadingMonth,
  loadingLabel,
  progress,
  prevLabel,
  nextLabel,
  onPrevMonth,
  onNextMonth,
  onCellClick,
}: CalendarMonthGridProps) {
  return (
    <section
      data-calendar-month-grid-panel
      data-calendar-month-panel
      className="rounded-xl p-3 sm:p-4 min-w-0"
      style={{
        background: CALENDAR_UI.panel,
        border: `1px solid ${CALENDAR_UI.panelBorder}`,
      }}
    >
      <CalendarToolbar
        monthLabel={monthLabel}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />

      <div className="grid grid-cols-7 gap-1 mb-1" role="row">
        {weekdays.map((wd) => (
          <div
            key={`${year}-${month}-${wd}`}
            className="fi text-[10px] text-center py-1"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            role="columnheader"
          >
            {wd.trim()}
          </div>
        ))}
      </div>

      {loadingMonth ? (
        <div
          className="py-12 text-center fi text-xs"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          {loadingLabel}
          {progress.total > 0 && (
            <span className="block mt-2">
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1" data-calendar-month-grid>
          {cells.map((cell) => (
            <CalendarDayCell
              key={cell.date}
              date={cell.date}
              lang={lang}
              calendar={calendar}
              score={scores[cell.date]}
              inCurrentMonth={cell.inCurrentMonth}
              selected={selectedDate === cell.date}
              isToday={cell.date === todayStr}
              dir={dir}
              onClick={() => onCellClick(cell.date, cell.inCurrentMonth)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
