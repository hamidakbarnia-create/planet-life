import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { StrategicInsightRail } from './StrategicInsightRail';
import { buildStrategicGps } from '@/lib/strategic-gps';
import type { HourScore } from '@/lib/calendar-scores';

afterEach(() => {
  cleanup();
});

const MONTH_SCORES = {
  '2026-08-01': 54,
  '2026-08-02': 31,
  '2026-08-10': 80,
  '2026-08-20': 86,
};

const HOURLY_A: HourScore[] = [
  { hour: 13, time: '13:00', score: 64, band: 'yellow' },
  { hour: 23, time: '23:00', score: 37, band: 'red' },
  { hour: 9, time: '09:00', score: 50, band: 'orange' },
];

const HOURLY_B: HourScore[] = [
  { hour: 10, time: '10:00', score: 90, band: 'green' },
  { hour: 21, time: '21:00', score: 20, band: 'red' },
];

describe('StrategicInsightRail', () => {
  it('renders rail sections in Month → Week → Selected Day order', () => {
    const monthOutlook = buildStrategicGps(MONTH_SCORES, [], 'en');
    const dayGps = buildStrategicGps({}, HOURLY_A, 'en');
    render(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
          dateLabel: 'Aug 5, 2026',
          bestHour: dayGps.bestHour,
          riskHour: dayGps.riskHour,
          bestHourLabel: dayGps.bestHourLabel,
          riskHourLabel: dayGps.riskHourLabel,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );

    const sections = [
      ...document.querySelectorAll('[data-rail-section]'),
    ].map((el) => el.getAttribute('data-rail-section'));
    expect(sections).toEqual([
      'month-outlook',
      'weekly-path',
      'selected-day-timing',
    ]);
    expect(screen.getByText('Month Outlook')).toBeTruthy();
    expect(screen.getByText('Weekly Path')).toBeTruthy();
    expect(screen.getByText('Selected Day Timing')).toBeTruthy();
  });

  it('shows selected date label with Best/Risk as selected-day data', () => {
    const monthOutlook = buildStrategicGps(MONTH_SCORES, [], 'en');
    const dayGps = buildStrategicGps({}, HOURLY_A, 'en');
    render(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
          dateLabel: 'Aug 5, 2026',
          bestHour: dayGps.bestHour,
          riskHour: dayGps.riskHour,
          bestHourLabel: dayGps.bestHourLabel,
          riskHourLabel: dayGps.riskHourLabel,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );

    expect(
      document.querySelector('[data-rail-selected-date]')?.textContent
    ).toContain('Aug 5, 2026');
    expect(document.querySelector('[data-rail-best-hour]')?.textContent).toContain(
      '64%'
    );
    expect(document.querySelector('[data-rail-risk-hour]')?.textContent).toContain(
      '37%'
    );
  });

  it('does not change Month Outlook when only selected-day hourly data changes', () => {
    const monthOutlook = buildStrategicGps(MONTH_SCORES, [], 'en');
    const dayA = buildStrategicGps({}, HOURLY_A, 'en');
    const dayB = buildStrategicGps({}, HOURLY_B, 'en');

    const { rerender } = render(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
          dateLabel: 'Day A',
          bestHour: dayA.bestHour,
          riskHour: dayA.riskHour,
          bestHourLabel: dayA.bestHourLabel,
          riskHourLabel: dayA.riskHourLabel,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );

    const outlookBefore = document.querySelector(
      '[data-rail-section="month-outlook"]'
    )?.textContent;
    const monthScoreAttr = document
      .querySelector('[data-month-outlook-score]')
      ?.getAttribute('data-month-outlook-score');
    const weeklyBefore = document.querySelector(
      '[data-rail-weekly-path]'
    )?.textContent;

    rerender(
      <StrategicInsightRail
        monthOutlook={monthOutlook}
        selectedDay={{
          dateLabel: 'Day B',
          bestHour: dayB.bestHour,
          riskHour: dayB.riskHour,
          bestHourLabel: dayB.bestHourLabel,
          riskHourLabel: dayB.riskHourLabel,
        }}
        loadingHourly={false}
        loadingLabel="Loading"
      />
    );

    expect(
      document.querySelector('[data-rail-section="month-outlook"]')?.textContent
    ).toBe(outlookBefore);
    expect(
      document
        .querySelector('[data-month-outlook-score]')
        ?.getAttribute('data-month-outlook-score')
    ).toBe(monthScoreAttr);
    expect(document.querySelector('[data-rail-weekly-path]')?.textContent).toBe(
      weeklyBefore
    );
    expect(document.querySelector('[data-rail-best-hour]')?.textContent).toContain(
      '90%'
    );
    expect(document.querySelector('[data-rail-risk-hour]')?.textContent).toContain(
      '20%'
    );
  });
});

describe('Phase 2 page wiring', () => {
  it('wires desktop grid+rail and removes duplicate KPI/details', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('data-strategic-calendar-desktop');
    expect(pageSource).toContain('CalendarMonthPanel');
    expect(pageSource).toContain('data-calendar-desktop-rail');
    expect(pageSource).toContain('data-calendar-mobile-timing');
    expect(pageSource).toContain('buildStrategicGps(scores, [], lang)');
    expect(pageSource).toContain('buildStrategicGps({}, hourly, lang)');
    // Removed duplicated desktop KPI / verbose details
    expect(pageSource).not.toContain('Desktop: compact Decision Timing KPI');
    expect(pageSource).not.toContain(
      'Desktop: verbose Decision Timing detail kept available below the Calendar'
    );
    expect(pageSource).not.toContain('<details');
  });

  it('keeps CalendarMonthCell hierarchy with Phase 3 readability tweaks only', () => {
    const cellSource = readFileSync(
      resolve(__dirname, './CalendarMonthCell.tsx'),
      'utf8'
    );
    expect(cellSource).toContain('data-cell-primary');
    expect(cellSource).toContain('data-cell-secondary');
    expect(cellSource).toContain('data-cell-score');
    expect(cellSource).toContain('buildCalendarCellDateLabels');
    // Hierarchy unchanged: primary + two secondaries + score
    expect(cellSource.match(/data-cell-secondary/g)?.length).toBe(2);
    const hash = createHash('sha256')
      .update(cellSource)
      .digest('hex');
    expect(hash).toBe(
      'c75389546609cccd47988d1401045e540067c0d1a13332ab14bfb2315884f289'
    );
  });

  it('hides desktop rail on mobile via class and keeps mobile timing strip', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('lg:hidden mb-4" data-calendar-mobile-timing');
    expect(pageSource).toContain(
      'className="hidden lg:block min-w-0" data-calendar-desktop-rail'
    );
  });
});
