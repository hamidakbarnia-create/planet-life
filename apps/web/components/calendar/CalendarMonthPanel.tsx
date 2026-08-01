'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import type { CalendarGridCell } from '@/lib/calendar-utils';
import { CalendarMonthCell } from '@/components/calendar/CalendarMonthCell';

export type CalendarMonthPanelProps = {
  lang: AppLang;
  dir: 'ltr' | 'rtl';
  calendar: CalendarSystem;
  year: number;
  month: number;
  monthLabel: string;
  weekdays: string[];
  cells: CalendarGridCell[];
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

export function CalendarMonthPanel({
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
}: CalendarMonthPanelProps) {
  return (
    <section
      data-calendar-month-panel
      className="rounded-2xl p-4 mb-0 min-w-0"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center justify-between mb-2 lg:mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
        >
          {prevLabel}
        </button>
        <div className="fc text-sm" style={{ color: '#fbbf24' }}>
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="fi text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
        >
          {nextLabel}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((wd) => (
          <div
            key={`${year}-${month}-${wd}`}
            className="fi text-[10px] text-center py-1"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {wd.trim()}
          </div>
        ))}
      </div>

      {loadingMonth ? (
        <div className="py-12 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
            <CalendarMonthCell
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
