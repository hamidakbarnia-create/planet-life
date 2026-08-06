import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CalendarInsightStack } from './CalendarInsightStack';
import { CalendarDayCell } from './CalendarDayCell';
import { PowerDistributionChart } from './PowerDistributionChart';
import { WeeklyTrendChart } from './WeeklyTrendChart';
import { buildStrategicGps } from '@/lib/strategic-gps';
import { buildPowerDistribution } from '@/lib/calendar-power-presentation';

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

describe('Calendar redesign integrity', () => {
  it('daily cell score equals canonical map score', () => {
    render(
      <CalendarDayCell
        date="2026-08-06"
        lang="en"
        calendar="gregorian"
        score={WEEK_SCORES['2026-08-06']}
        inCurrentMonth
        selected
        isToday={false}
        dir="ltr"
        onClick={() => undefined}
      />
    );
    expect(
      document.querySelector('[data-cell-score]')?.textContent
    ).toBe('92%');
    expect(
      document
        .querySelector('[data-calendar-day-cell]')
        ?.getAttribute('data-power-band')
    ).toBe('excellent');
  });

  it('Power Distribution average matches canonical map mean', () => {
    const dist = buildPowerDistribution(WEEK_SCORES);
    render(<PowerDistributionChart scores={WEEK_SCORES} />);
    expect(
      document.querySelector('[data-power-average]')?.textContent
    ).toBe(`${dist.average}%`);
    expect(dist.average).toBe(
      Math.round(
        Object.values(WEEK_SCORES).reduce((a, b) => a + b, 0) /
          Object.keys(WEEK_SCORES).length
      )
    );
  });

  it('Weekly Trend renders exactly 7 actual day scores; missing ≠ 0', () => {
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', {
      selectedDate: '2026-08-06',
    });
    expect(gps.weeks).toHaveLength(7);
    render(
      <WeeklyTrendChart
        weeks={gps.weeks}
        selectedDate="2026-08-06"
        monthBestDate={gps.monthBest?.date ?? null}
        weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
      />
    );
    expect(document.querySelectorAll('[data-week-point]')).toHaveLength(7);
    expect(
      document
        .querySelector('[data-path-date="2026-08-06"]')
        ?.getAttribute('data-path-highlighted')
    ).toBe('true');
    expect(
      document.querySelector('[data-week-best]')?.getAttribute('data-week-best-score')
    ).toBe('92');
    expect(screen.getByText(/Week best/)).toBeTruthy();

    cleanup();
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
    expect(
      document
        .querySelector('[data-path-date="2026-08-04"]')
        ?.querySelector('[data-path-score-circle]')
    ).toBeNull();
    const pathD =
      document.querySelector('[data-weekly-path-line]')?.getAttribute('d') ??
      '';
    expect(pathD).not.toMatch(/\bC\b/);
    expect((pathD.match(/\bM\b/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('selectedDate synchronizes grid highlight, chart, and insight', () => {
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
    );
    expect(
      document
        .querySelector('[data-path-highlighted="true"]')
        ?.getAttribute('data-path-date')
    ).toBe('2026-08-06');
    expect(
      document.querySelector('[data-insight-selected-date]')?.textContent
    ).toContain('Aug 6');
    expect(
      document.querySelector('[data-insight-best-score]')?.textContent
    ).toBe('56%');
    expect(
      document.querySelector('[data-insight-agency-footer]')?.textContent
    ).toMatch(/final decision/i);
  });

  it('page uses CalendarMonthGrid + insight stack; no duplicate score fetch paths', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('CalendarMonthGrid');
    expect(pageSource).toContain('CalendarInsightStack');
    expect(pageSource).toContain('buildStrategicGps(scores, [], lang, {');
    expect(pageSource).toContain('fetchMonthScores');
    expect(pageSource).toContain('data-calendar-workspace');
    // Single month-load call site — presentation reads `scores` only
    expect(pageSource).toMatch(/await fetchMonthScores\(/);
    expect(pageSource.match(/await fetchMonthScores\(/g)?.length).toBe(1);
  });

  it('mobile workspace declares overflow-x-hidden', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('overflow-x-hidden');
  });
});
