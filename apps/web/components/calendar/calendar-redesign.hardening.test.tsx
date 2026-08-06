import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CalendarInsightStack } from './CalendarInsightStack';
import { CalendarMonthGrid } from './CalendarMonthGrid';
import { CalendarToolbar } from './CalendarToolbar';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { buildStrategicGps } from '@/lib/strategic-gps';
import {
  allocatePercents,
  buildPowerDistribution,
} from '@/lib/calendar-power-presentation';
import { calendarCells } from '@/lib/calendar-utils';

afterEach(() => {
  cleanup();
});

const WEEK_SCORES = {
  '2026-08-02': 41,
  '2026-08-03': 56,
  '2026-08-04': 72,
  '2026-08-05': 81,
  '2026-08-06': 92,
  '2026-08-07': 75,
  '2026-08-08': 63,
};

describe('Calendar redesign hardening', () => {
  it('production page does not mount legacy rail or fake controls', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('CalendarMonthGrid');
    expect(pageSource).toContain('CalendarInsightStack');
    expect(pageSource).not.toContain('StrategicInsightRail');
    expect(pageSource).not.toContain('CalendarMonthCell');
    expect(pageSource).not.toContain('WeeklyPathChart');
    expect(pageSource).not.toContain('viewMode');
    expect(pageSource).not.toContain('categoryLabel');
    expect(pageSource).not.toContain('data-calendar-view-toggle');
    expect(pageSource).not.toContain('data-calendar-category');
  });

  it('Decision Power legend appears exactly once in the insight stack', () => {
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', {
      selectedDate: '2026-08-06',
    });
    render(
      <CalendarInsightStack
        scores={WEEK_SCORES}
        weeks={gps.weeks}
        selectedDate="2026-08-06"
        selectedDateLabel="Aug 6, 2026"
        monthBestDate={gps.monthBest?.date ?? null}
        weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
        lang="en"
        calendar="gregorian"
        bestHour={null}
        riskHour={null}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );
    expect(
      document.querySelectorAll('[data-decision-power-legend]')
    ).toHaveLength(1);

    const toolbarSource = readFileSync(
      resolve(__dirname, './CalendarToolbar.tsx'),
      'utf8'
    );
    expect(toolbarSource).not.toContain('DecisionPowerLegend');
  });

  it('unavailable Month/Week and Category controls are removed', () => {
    render(
      <CalendarToolbar
        monthLabel="August 2026"
        prevLabel="Prev"
        nextLabel="Next"
        onPrevMonth={() => undefined}
        onNextMonth={() => undefined}
      />
    );
    expect(document.querySelector('[data-calendar-view-toggle]')).toBeNull();
    expect(document.querySelector('[data-calendar-category]')).toBeNull();
    expect(screen.getByLabelText('Prev').tagName).toBe('BUTTON');
    expect(screen.getByLabelText('Next').tagName).toBe('BUTTON');
  });

  it('Power Distribution counts, percents, empty maps, and rounding', () => {
    const empty = buildPowerDistribution({});
    expect(empty.total).toBe(0);
    expect(empty.average).toBeNull();
    expect(empty.bands.every((b) => b.count === 0 && b.percent === 0)).toBe(
      true
    );

    const incomplete = buildPowerDistribution({ '2026-08-01': 90 });
    expect(incomplete.total).toBe(1);
    expect(incomplete.average).toBe(90);
    expect(incomplete.bands.find((b) => b.band === 'excellent')?.percent).toBe(
      100
    );

    // Deterministic largest-remainder: sum always 100
    const percents = allocatePercents([1, 1, 1], 3);
    expect(percents.reduce((a, b) => a + b, 0)).toBe(100);

    const dist = buildPowerDistribution({
      a: 40,
      b: 55,
      c: 75,
      d: 90,
      e: 92,
      f: 60,
      g: 30,
      h: 80,
      i: 50,
      j: 86,
    });
    expect(dist.bands.reduce((s, b) => s + b.count, 0)).toBe(dist.total);
    expect(dist.bands.reduce((s, b) => s + b.percent, 0)).toBe(100);
  });

  it('selectedDate syncs cell, Weekly Trend, and insight; Week Best is week-only', () => {
    const monthScores = {
      ...WEEK_SCORES,
      '2026-08-20': 98, // month max outside selected week
    };
    const gps = buildStrategicGps(monthScores, [], 'en', {
      selectedDate: '2026-08-06',
    });
    expect(gps.weeks).toHaveLength(7);
    expect(gps.monthBest?.date).toBe('2026-08-20');

    render(
      <>
        <CalendarMonthGrid
          lang="en"
          dir="ltr"
          calendar="gregorian"
          year={2026}
          month={8}
          monthLabel="August 2026"
          weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          cells={calendarCells(2026, 8)}
          scores={monthScores}
          selectedDate="2026-08-06"
          todayStr="2026-08-04"
          loadingMonth={false}
          loadingLabel="Loading"
          progress={{ done: 0, total: 0 }}
          prevLabel="Prev"
          nextLabel="Next"
          onPrevMonth={() => undefined}
          onNextMonth={() => undefined}
          onCellClick={() => undefined}
        />
        <CalendarInsightStack
          scores={monthScores}
          weeks={gps.weeks}
          selectedDate="2026-08-06"
          selectedDateLabel="Aug 6, 2026"
          monthBestDate={gps.monthBest?.date ?? null}
          monthBestScore={gps.monthBest?.score ?? null}
          monthBestDateLabel={gps.monthBest?.dateLabel ?? null}
          weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          lang="en"
          calendar="gregorian"
          bestHour={{
            hour: 21,
            time: '21:00',
            score: 56,
            band: 'orange',
          }}
          riskHour={{
            hour: 2,
            time: '02:00',
            score: 27,
            band: 'red',
          }}
          loadingHourly={false}
          loadingLabel="Loading"
        />
      </>
    );

    expect(
      document
        .querySelector('[data-calendar-cell="2026-08-06"]')
        ?.getAttribute('data-selected')
    ).toBe('true');
    expect(
      document
        .querySelector('[data-path-highlighted="true"]')
        ?.getAttribute('data-path-date')
    ).toBe('2026-08-06');
    expect(
      document.querySelector('[data-insight-selected-date]')?.textContent
    ).toContain('Aug 6');
    // Week best is 92 (Thu), not month max 98
    expect(
      document.querySelector('[data-week-best]')?.getAttribute('data-week-best-score')
    ).toBe('92');
    expect(
      document.querySelector('[data-week-best]')?.getAttribute('data-week-best-date')
    ).toBe('2026-08-06');
  });

  it('Month best View week selects that date and shows its week', () => {
    const monthScores = {
      '2026-08-02': 31,
      '2026-08-03': 50,
      '2026-08-04': 52,
      '2026-08-05': 46,
      '2026-08-06': 42,
      '2026-08-07': 50,
      '2026-08-08': 46,
      '2026-08-16': 81,
      '2026-08-17': 76,
      '2026-08-18': 71,
      '2026-08-19': 79,
      '2026-08-20': 86,
      '2026-08-21': 80,
      '2026-08-22': 54,
    };

    function Harness() {
      const [date, setDate] = useState('2026-08-06');
      const gps = buildStrategicGps(monthScores, [], 'en', {
        selectedDate: date,
      });
      return (
        <CalendarInsightStack
          scores={monthScores}
          weeks={gps.weeks}
          selectedDate={date}
          selectedDateLabel={
            date === '2026-08-20' ? 'Aug 20, 2026' : 'Aug 6, 2026'
          }
          monthBestDate={gps.monthBest?.date ?? null}
          monthBestScore={gps.monthBest?.score ?? null}
          monthBestDateLabel={gps.monthBest?.dateLabel ?? null}
          weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
          lang="en"
          calendar="gregorian"
          bestHour={null}
          riskHour={null}
          loadingHourly={false}
          loadingLabel="Loading"
          onViewMonthBestWeek={setDate}
        />
      );
    }

    render(<Harness />);
    expect(document.querySelector('[data-week-range]')?.textContent).toMatch(
      /2 Aug/
    );
    const action = document.querySelector(
      '[data-month-best-view-week]'
    ) as HTMLButtonElement;
    expect(action).toBeTruthy();
    expect(action.textContent).toMatch(/Month best/);
    expect(action.textContent).toMatch(/View week/);
    fireEvent.click(action);

    expect(document.querySelector('[data-week-range]')?.textContent).toMatch(
      /16 Aug/
    );
    expect(
      document.querySelector('[data-week-best]')?.getAttribute('data-week-best-score')
    ).toBe('86');
    expect(
      document
        .querySelector('[data-path-highlighted="true"]')
        ?.getAttribute('data-path-date')
    ).toBe('2026-08-20');
  });

  it('adjacent-month cells stay dimmed; workspace forbids horizontal overflow', () => {
    render(
      <CalendarMonthGrid
        lang="en"
        dir="rtl"
        calendar="gregorian"
        year={2026}
        month={8}
        monthLabel="August 2026"
        weekdays={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
        cells={calendarCells(2026, 8)}
        scores={WEEK_SCORES}
        selectedDate="2026-08-06"
        todayStr="2026-08-04"
        loadingMonth={false}
        loadingLabel="Loading"
        progress={{ done: 0, total: 0 }}
        prevLabel="Prev"
        nextLabel="Next"
        onPrevMonth={() => undefined}
        onNextMonth={() => undefined}
        onCellClick={() => undefined}
      />
    );
    const adjacent = document.querySelector(
      '[data-adjacent="true"]'
    ) as HTMLElement;
    expect(adjacent).toBeTruthy();
    expect(Number.parseFloat(getComputedStyle(adjacent).opacity)).toBeLessThan(
      1
    );

    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('overflow-x-hidden');
    expect(pageSource).toContain('data-calendar-workspace');
  });

  it('Weekly Trend missing scores do not become 0 and path stays linear', () => {
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', {
      selectedDate: '2026-08-06',
    });
    const withGap = gps.weeks.map((w) =>
      w.date === '2026-08-04' ? { ...w, score: null } : w
    );
    render(
      <WeeklyTrendChart
        weeks={withGap}
        selectedDate="2026-08-06"
        weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
      />
    );
    expect(
      document
        .querySelector('[data-path-date="2026-08-04"]')
        ?.getAttribute('data-path-missing')
    ).toBe('true');
    const pathD =
      document.querySelector('[data-weekly-path-line]')?.getAttribute('d') ??
      '';
    expect(pathD).not.toMatch(/\bC\b/);
    expect((pathD.match(/\bM\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('dead legacy production files are removed', () => {
    const names = [
      'StrategicInsightRail.tsx',
      'CalendarMonthCell.tsx',
      'CalendarMonthPanel.tsx',
      'WeeklyPathChart.tsx',
    ];
    for (const name of names) {
      expect(() =>
        readFileSync(resolve(__dirname, `./${name}`), 'utf8')
      ).toThrow();
    }
  });
});
