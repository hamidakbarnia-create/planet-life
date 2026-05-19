'use client';

import { calendarCells } from '@/lib/calendar-utils';
import { BAND_STYLES, scoreToBand } from '@/lib/calendar-scores';

export function MonthHeatmapGrid({
  year,
  month,
  scores,
  loading,
  progress,
  highlightDate,
  selectedDate,
  onSelectDate,
  weekdays,
  months,
  loadingLabel,
  fullWidth,
}: {
  year: number;
  month: number;
  scores: Record<string, number>;
  loading: boolean;
  progress?: { done: number; total: number };
  highlightDate: string;
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
  weekdays: string[];
  months: string[];
  loadingLabel: string;
  fullWidth?: boolean;
}) {
  const cells = calendarCells(year, month);

  return (
    <div
      className={fullWidth ? 'w-full' : ''}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '1rem',
        padding: fullWidth ? '1rem' : '1rem',
      }}
    >
      <div className="fc text-sm text-center mb-4" style={{ color: '#fbbf24' }}>
        {months[month - 1]} {year}
      </div>

      <div className={`grid grid-cols-7 gap-1 mb-1 ${fullWidth ? 'gap-1.5' : ''}`}>
        {weekdays.map((wd) => (
          <div
            key={wd}
            className="fi text-[10px] text-center py-1"
            style={{ color: 'rgba(255,255,255,0.3)' }}
          >
            {wd.trim()}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center fi text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {loadingLabel}
          {progress && progress.total > 0 && (
            <span className="block mt-2">
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-7 ${fullWidth ? 'gap-1.5' : 'gap-1'}`}>
          {cells.map((cell, i) => {
            if (!cell.day || !cell.date) {
              return <div key={`e-${i}`} className={fullWidth ? 'aspect-[1.1]' : 'aspect-square'} />;
            }
            const score = scores[cell.date];
            const band = scoreToBand(score);
            const style = BAND_STYLES[band];
            const isToday = cell.date === highlightDate;
            const selected = selectedDate === cell.date;
            const inner = (
              <>
                <span className={`fi font-medium text-white/90 ${fullWidth ? 'text-xs' : 'text-[11px]'}`}>
                  {cell.day}
                </span>
                {score != null && (
                  <span
                    className={`fi mt-0.5 font-semibold ${fullWidth ? 'text-[10px]' : 'text-[9px]'}`}
                    style={{ color: style.text }}
                  >
                    {score}
                  </span>
                )}
              </>
            );
            const boxStyle = {
              background: style.bg,
              border: `2px solid ${isToday ? '#fbbf24' : selected ? '#fbbf24' : style.border}`,
              boxShadow: isToday ? '0 0 12px rgba(251,191,36,0.35)' : undefined,
            };
            const cls = `rounded-lg flex flex-col items-center justify-center transition-transform ${
              fullWidth ? 'aspect-[1.1] min-h-[52px]' : 'aspect-square hover:scale-105'
            }`;

            if (onSelectDate) {
              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelectDate(cell.date!)}
                  className={cls}
                  style={boxStyle}
                >
                  {inner}
                </button>
              );
            }
            return (
              <div key={cell.date} className={cls} style={boxStyle}>
                {inner}
              </div>
            );
          })}
        </div>
      )}
              </div>
  );
}
