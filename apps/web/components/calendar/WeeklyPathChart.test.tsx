import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { WeeklyPathChart, shortWeekAxisLabel } from './WeeklyPathChart';
import { StrategicInsightRail } from './StrategicInsightRail';
import { buildStrategicGps } from '@/lib/strategic-gps';
import type { StrategicGpsWeek } from '@/lib/strategic-gps';

afterEach(() => {
  cleanup();
});

const DAYS: StrategicGpsWeek[] = [
  {
    label: 'Sun',
    score: 46,
    tone: 'orange',
    action: 'review',
    date: '2026-08-02',
    dates: ['2026-08-02'],
  },
  {
    label: 'Mon',
    score: 65,
    tone: 'yellow',
    action: 'build',
    date: '2026-08-03',
    dates: ['2026-08-03'],
  },
  {
    label: 'Tue',
    score: 86,
    tone: 'green',
    action: 'advance',
    date: '2026-08-04',
    dates: ['2026-08-04'],
  },
  {
    label: 'Wed',
    score: 58,
    tone: 'orange',
    action: 'review',
    date: '2026-08-05',
    dates: ['2026-08-05'],
  },
  {
    label: 'Thu',
    score: 56,
    tone: 'orange',
    action: 'review',
    date: '2026-08-06',
    dates: ['2026-08-06'],
  },
  {
    label: 'Fri',
    score: 70,
    tone: 'yellow',
    action: 'build',
    date: '2026-08-07',
    dates: ['2026-08-07'],
  },
  {
    label: 'Sat',
    score: 62,
    tone: 'yellow',
    action: 'build',
    date: '2026-08-08',
    dates: ['2026-08-08'],
  },
];

describe('WeeklyPathChart', () => {
  it('renders one point per provided day with percentages and labels', () => {
    render(<WeeklyPathChart weeks={DAYS} />);
    expect(document.querySelector('[data-weekly-path-chart]')).toBeTruthy();
    const points = document.querySelectorAll('[data-week-point]');
    expect(points).toHaveLength(7);

    for (const day of DAYS) {
      expect(document.querySelector(`[data-week-point="${day.label}"]`)).toBeTruthy();
      expect(
        document.querySelector(`[data-week-axis-label="${day.label}"]`)
      ).toBeTruthy();
      expect(screen.getByText(`${day.score}%`)).toBeTruthy();
    }

    expect(shortWeekAxisLabel('Week 3')).toBe('3');
    expect(shortWeekAxisLabel('Mon')).toBe('Mon');
    expect(shortWeekAxisLabel('26 Jul')).toBe('26 Jul');
  });

  it('does not recalculate scores — renders provided values only', () => {
    const source = readFileSync(
      resolve(__dirname, './WeeklyPathChart.tsx'),
      'utf8'
    );
    expect(source).not.toMatch(/\baverage\b|\btoneFromScore\b/);
    expect(source).toContain('formatReadinessPercent(week.score)');
    expect(source).toContain('week.score');

    render(<WeeklyPathChart weeks={DAYS} />);
    expect(screen.getByText('86%')).toBeTruthy();
    expect(screen.queryByText('79%')).toBeNull();
  });

  it('highlights the path point whose date equals selectedDate', () => {
    render(<WeeklyPathChart weeks={DAYS} selectedDate="2026-08-04" />);
    const highlighted = document.querySelector(
      '[data-path-highlighted="true"]'
    );
    expect(highlighted?.getAttribute('data-path-date')).toBe('2026-08-04');
    expect(highlighted?.getAttribute('data-week-point')).toBe('Tue');
  });

  it('does not substitute week-maximum highlight when selectedDate is absent', () => {
    render(<WeeklyPathChart weeks={DAYS} />);
    expect(document.querySelector('[data-path-highlighted="true"]')).toBeNull();
  });

  it('B: calendar cell score 86% appears as 86% on Weekly Path for that week', () => {
    const monthOutlook = buildStrategicGps(
      {
        '2026-08-02': 46,
        '2026-08-03': 65,
        '2026-08-04': 86,
        '2026-08-05': 58,
        '2026-08-06': 56,
        '2026-08-07': 70,
        '2026-08-08': 62,
      },
      [],
      'en',
      { selectedDate: '2026-08-04' }
    );
    const tue = monthOutlook.weeks.find((p) => p.date === '2026-08-04');
    expect(tue?.score).toBe(86);
    render(
      <WeeklyPathChart
        weeks={monthOutlook.weeks}
        selectedDate="2026-08-04"
      />
    );
    expect(screen.getByText('86%')).toBeTruthy();
    expect(
      document
        .querySelector('[data-path-highlighted="true"]')
        ?.getAttribute('data-path-date')
    ).toBe('2026-08-04');
  });

  it('renders GPS selected-week scores matching calendar cells', () => {
    const monthOutlook = buildStrategicGps(
      {
        '2026-08-02': 46,
        '2026-08-03': 65,
        '2026-08-04': 86,
        '2026-08-05': 58,
        '2026-08-06': 56,
        '2026-08-07': 70,
        '2026-08-08': 62,
      },
      [],
      'en',
      { selectedDate: '2026-08-05' }
    );
    expect(monthOutlook.weeks).toHaveLength(7);
    render(
      <WeeklyPathChart
        weeks={monthOutlook.weeks}
        selectedDate="2026-08-05"
      />
    );
    expect(screen.getByText('86%')).toBeTruthy();
    expect(screen.queryByText('79%')).toBeNull();
    const highlighted = document.querySelector(
      '[data-path-highlighted="true"]'
    );
    expect(highlighted?.getAttribute('data-path-date')).toBe('2026-08-05');
  });

  it('exposes accessible aria-labels with day label, percentage, and action', () => {
    render(<WeeklyPathChart weeks={DAYS} />);
    expect(screen.getByLabelText('Tue, 86%, advance')).toBeTruthy();
    expect(screen.getByLabelText('Sat, 62%, build')).toBeTruthy();
  });
});

describe('Weekly Path chart desktop vs mobile rail', () => {
  it('shows chart on desktop and compact mobile rails', () => {
    const monthOutlook = buildStrategicGps(
      {
        '2026-08-02': 54,
        '2026-08-03': 70,
        '2026-08-04': 82,
        '2026-08-05': 40,
        '2026-08-06': 30,
        '2026-08-07': 50,
        '2026-08-08': 60,
      },
      [],
      'en',
      { selectedDate: '2026-08-05' }
    );

    const { rerender } = render(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
          date: '2026-08-05',
          dateLabel: null,
          bestHour: null,
          riskHour: null,
          bestHourLabel: null,
          riskHourLabel: null,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );
    expect(document.querySelector('[data-weekly-path-chart]')).toBeTruthy();
    expect(
      document.querySelectorAll('[data-rail-weekly-path] .flex.items-center')
        .length
    ).toBe(0);

    rerender(
      <StrategicInsightRail
        compact
        monthOutlook={monthOutlook}
        selectedDay={{
          date: '2026-08-05',
          dateLabel: null,
          bestHour: null,
          riskHour: null,
          bestHourLabel: null,
          riskHourLabel: null,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );
    expect(document.querySelector('[data-weekly-path-chart]')).toBeTruthy();
    expect(document.querySelector('[data-rail-weekly-path]')).toBeTruthy();
  });
});
