import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  WeeklyPathChart,
  formatWeekRangeLabel,
  scoreToPlotY,
  shortWeekAxisLabel,
  WEEKLY_PATH_HEIGHT,
  WEEKLY_PATH_PAD_BOTTOM,
  WEEKLY_PATH_PAD_TOP,
} from './WeeklyPathChart';
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

  it('uses fixed 0–100 scale so low scores sit far below high scores', () => {
    const y31 = scoreToPlotY(31);
    const y46 = scoreToPlotY(46);
    const y79 = scoreToPlotY(79);
    const y86 = scoreToPlotY(86);
    const y100 = scoreToPlotY(100);
    const y0 = scoreToPlotY(0);
    const plotHeight =
      WEEKLY_PATH_HEIGHT - WEEKLY_PATH_PAD_TOP - WEEKLY_PATH_PAD_BOTTOM;

    expect(y0).toBeCloseTo(WEEKLY_PATH_PAD_TOP + plotHeight, 5);
    expect(y100).toBeCloseTo(WEEKLY_PATH_PAD_TOP, 5);
    // 31 must be dramatically lower (larger y) than mid/high scores
    expect(y31 - y86).toBeGreaterThan(plotHeight * 0.45);
    expect(y31).toBeGreaterThan(y46);
    expect(y46).toBeGreaterThan(y79);
    expect(y79).toBeGreaterThan(y86);
    // No week min/max normalization — absolute score math only
    expect(y86).toBeCloseTo(
      WEEKLY_PATH_PAD_TOP + plotHeight * (1 - 86 / 100),
      5
    );
  });

  it('renders week range label and glows month-best only when in the week', () => {
    const withBest = DAYS.map((d) =>
      d.date === '2026-08-04' ? { ...d, score: 86 } : d
    );
    render(
      <WeeklyPathChart
        weeks={withBest}
        selectedDate="2026-08-05"
        monthBestDate="2026-08-04"
        lang="en"
        calendar="gregorian"
      />
    );
    expect(document.querySelector('[data-week-range]')?.textContent).toMatch(
      /2 Aug|Aug 2/
    );
    expect(
      document
        .querySelector('[data-path-date="2026-08-04"]')
        ?.getAttribute('data-path-month-best')
    ).toBe('true');
    expect(
      document
        .querySelector('[data-path-date="2026-08-05"]')
        ?.getAttribute('data-path-month-best')
    ).toBe('false');

    cleanup();
    render(
      <WeeklyPathChart
        weeks={DAYS}
        selectedDate="2026-08-05"
        monthBestDate="2026-08-20"
      />
    );
    expect(
      document.querySelector('[data-path-month-best="true"]')
    ).toBeNull();
    expect(formatWeekRangeLabel(DAYS, 'en', 'gregorian')).toMatch(/–/);
  });

  it('maps acceptance fixtures with absolute vertical separation', () => {
    const scores = [31, 46, 52, 74, 86, 80, 54];
    const ys = scores.map((s) => scoreToPlotY(s));
    const maxIdx = scores.indexOf(86);
    for (let i = 0; i < ys.length; i += 1) {
      if (i === maxIdx) continue;
      expect(ys[maxIdx]).toBeLessThan(ys[i]);
    }
    // First point (31) much lower than the rest
    expect(ys[0]).toBeGreaterThan(ys[1] + 10);
  });

  it('is taller than the previous flat chart and exposes plot y on points', () => {
    expect(WEEKLY_PATH_HEIGHT).toBeGreaterThanOrEqual(Math.round(132 * 1.25));
    render(<WeeklyPathChart weeks={DAYS} selectedDate="2026-08-04" />);
    expect(
      document
        .querySelector('[data-weekly-path-chart]')
        ?.getAttribute('data-weekly-path-height')
    ).toBe(String(WEEKLY_PATH_HEIGHT));
    const tue = document.querySelector('[data-path-date="2026-08-04"]');
    expect(Number(tue?.getAttribute('data-path-y'))).toBeCloseTo(
      scoreToPlotY(86),
      5
    );
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
