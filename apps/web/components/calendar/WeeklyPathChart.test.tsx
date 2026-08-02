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

const WEEKS: StrategicGpsWeek[] = [
  { label: 'Week 1', score: 59, tone: 'orange', action: 'review' },
  { label: 'Week 2', score: 64, tone: 'yellow', action: 'build' },
  { label: 'Week 3', score: 82, tone: 'yellow', action: 'build' },
  { label: 'Week 4', score: 48, tone: 'orange', action: 'review' },
  { label: 'Week 5', score: 37, tone: 'red', action: 'pause' },
];

describe('WeeklyPathChart', () => {
  it('renders one point per week with existing percentages and labels', () => {
    render(<WeeklyPathChart weeks={WEEKS} />);
    expect(document.querySelector('[data-weekly-path-chart]')).toBeTruthy();
    const points = document.querySelectorAll('[data-week-point]');
    expect(points).toHaveLength(5);

    for (const week of WEEKS) {
      expect(document.querySelector(`[data-week-point="${week.label}"]`)).toBeTruthy();
      expect(
        document.querySelector(`[data-week-axis-label="${week.label}"]`)
      ).toBeTruthy();
      expect(screen.getByText(`${week.score}%`)).toBeTruthy();
    }

    // Axis short form derives from existing label — no score recalculation
    expect(shortWeekAxisLabel('Week 3')).toBe('3');
    expect(shortWeekAxisLabel('هفته 2')).toBe('2');
  });

  it('does not recalculate week scores — renders provided values only', () => {
    const source = readFileSync(
      resolve(__dirname, './WeeklyPathChart.tsx'),
      'utf8'
    );
    expect(source).not.toMatch(/\baverage\b|\btoneFromScore\b/);
    expect(source).toContain('formatReadinessPercent(week.score)');
    // Chart only plots provided week.score values
    expect(source).toContain('week.score');

    render(<WeeklyPathChart weeks={WEEKS} />);
    expect(screen.getByText('82%')).toBeTruthy();
    expect(screen.getByText('37%')).toBeTruthy();
    expect(screen.queryByText('58%')).toBeNull(); // not an average of inputs
  });

  it('exposes accessible aria-labels with week label, percentage, and action', () => {
    render(<WeeklyPathChart weeks={WEEKS} />);
    const labeled = screen.getByLabelText('Week 3, 82%, build');
    expect(labeled).toBeTruthy();
    expect(screen.getByLabelText('Week 5, 37%, pause')).toBeTruthy();
  });
});

describe('Weekly Path chart desktop vs mobile rail', () => {
  it('shows chart on desktop rail and list on compact mobile rail', () => {
    const monthOutlook = buildStrategicGps(
      {
        '2026-08-01': 54,
        '2026-08-08': 70,
        '2026-08-15': 82,
        '2026-08-22': 40,
        '2026-08-29': 30,
      },
      [],
      'en'
    );

    const { rerender } = render(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
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
    expect(document.querySelector('[data-weekly-path-chart]')).toBeNull();
    expect(document.querySelector('[data-rail-weekly-path]')).toBeTruthy();
  });
});
