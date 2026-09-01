'use client';

import type { AppLang, CalendarSystem } from '@/lib/app-settings';
import type { HourScore } from '@/lib/calendar-scores';
import type { StrategicGpsWeek } from '@/lib/strategic-gps';
import { DecisionPowerLegend } from '@/components/calendar/DecisionPowerLegend';
import { PowerDistributionChart } from '@/components/calendar/PowerDistributionChart';
import { WeeklyTrendChart } from '@/components/calendar/WeeklyTrendChart';
import { SelectedDayInsightPanel } from '@/components/calendar/SelectedDayInsightPanel';
import { CALENDAR_UI } from '@/lib/calendar-power-presentation';

export type CalendarInsightStackProps = {
  scores: Record<string, number>;
  weeks: StrategicGpsWeek[];
  selectedDate: string | null;
  selectedDateLabel: string | null;
  monthBestDate: string | null;
  monthBestScore?: number | null;
  monthBestDateLabel?: string | null;
  weekdayLabels: string[];
  lang: AppLang;
  calendar: CalendarSystem;
  bestHour: HourScore | null;
  riskHour: HourScore | null;
  loadingHourly: boolean;
  loadingLabel: string;
  onViewMonthBestWeek?: (date: string) => void;
};

/** Right-column / stacked insight panels matching the reference order. */
export function CalendarInsightStack({
  scores,
  weeks,
  selectedDate,
  selectedDateLabel,
  monthBestDate,
  monthBestScore = null,
  monthBestDateLabel = null,
  weekdayLabels,
  lang,
  calendar,
  bestHour,
  riskHour,
  loadingHourly,
  loadingLabel,
  onViewMonthBestWeek,
}: CalendarInsightStackProps) {
  return (
    <aside
      data-calendar-insight-stack
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3 min-w-0"
    >
      <div
        className="rounded-xl p-3 md:col-span-2 xl:col-span-1"
        style={{
          background: CALENDAR_UI.panel,
          border: `1px solid ${CALENDAR_UI.panelBorder}`,
        }}
        data-insight-legend-panel
      >
        <DecisionPowerLegend lang={lang} />
      </div>

      <PowerDistributionChart scores={scores} lang={lang} />

      <WeeklyTrendChart
        weeks={weeks}
        selectedDate={selectedDate}
        monthBestDate={monthBestDate}
        monthBestScore={monthBestScore}
        monthBestDateLabel={monthBestDateLabel}
        weekdayLabels={weekdayLabels}
        lang={lang}
        calendar={calendar}
        onViewMonthBestWeek={onViewMonthBestWeek}
      />

      <div className="md:col-span-2 xl:col-span-1">
        <SelectedDayInsightPanel
          lang={lang}
          dateLabel={selectedDateLabel}
          bestHour={bestHour}
          riskHour={riskHour}
          loading={loadingHourly}
          loadingLabel={loadingLabel}
        />
      </div>
    </aside>
  );
}
