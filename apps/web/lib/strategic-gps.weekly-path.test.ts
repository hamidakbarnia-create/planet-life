import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  clampIsoDateToMonth,
  sundayWeekDatesContaining,
} from '@/lib/calendar-utils';
import {
  buildStrategicGps,
  buildWeeklyPathPoints,
  findMonthBest,
  weeklyPathAxisLabel,
} from '@/lib/strategic-gps';

/**
 * Deterministic fixture for the Sunday-start week containing 2026-08-05 (Wed).
 * Week: Sun Aug 2 … Sat Aug 8.
 */
const WEEK_SCORES: Record<string, number> = {
  '2026-08-02': 46,
  '2026-08-03': 65,
  '2026-08-04': 86,
  '2026-08-05': 58,
  '2026-08-06': 56,
  '2026-08-07': 70,
  '2026-08-08': 62,
};

describe('Weekly Path = selected week daily scores', () => {
  it('renders seven points equal to scores[date] for the selected week', () => {
    const selectedDate = '2026-08-05';
    const weekDates = sundayWeekDatesContaining(selectedDate);
    expect(weekDates).toEqual([
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);

    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', { selectedDate });
    expect(gps.weeks).toHaveLength(7);
    expect(gps.weeks.map((p) => p.date)).toEqual(weekDates);
    expect(gps.weeks.map((p) => p.score)).toEqual([46, 65, 86, 58, 56, 70, 62]);
    expect(gps.weeks.map((p) => p.score)).not.toEqual([46, 65, 79, 58, 56]);

    for (const point of gps.weeks) {
      expect(point.date).toBeTruthy();
      expect(point.score).toBe(WEEK_SCORES[point.date!]);
    }
  });

  it('highest score in the selected week is the highest path point', () => {
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', {
      selectedDate: '2026-08-05',
    });
    const pathScores = gps.weeks
      .map((p) => p.score)
      .filter((s): s is number => s != null);
    expect(Math.max(...pathScores)).toBe(86);
  });

  it('handles weeks crossing month boundaries without averaging or max-picking', () => {
    // 2026-08-01 is Saturday → week Sun Jul 26 … Sat Aug 1
    const selectedDate = '2026-08-01';
    const weekDates = sundayWeekDatesContaining(selectedDate);
    expect(weekDates[0]).toBe('2026-07-26');
    expect(weekDates[6]).toBe('2026-08-01');

    const scores: Record<string, number> = {
      '2026-07-26': 40,
      '2026-07-30': 55,
      '2026-08-01': 86,
    };
    const points = buildWeeklyPathPoints(scores, selectedDate, 'en', 'gregorian');
    expect(points).toHaveLength(7);
    expect(points.map((p) => p.date)).toEqual(weekDates);
    expect(points[0].score).toBe(40);
    expect(points[4].score).toBe(55);
    expect(points[6].score).toBe(86);
    // Days without scores stay null — not invented
    expect(points[1].score).toBeNull();
    expect(points.every((p) => p.score == null || p.score === scores[p.date!])).toBe(
      true
    );
  });

  it('uses localized weekday labels and compact dates across month boundaries', () => {
    const selectedDate = '2026-08-01';
    const points = buildWeeklyPathPoints(
      { '2026-08-01': 86, '2026-07-26': 40 },
      selectedDate,
      'en',
      'gregorian'
    );
    // In-month Saturday → weekday
    expect(weeklyPathAxisLabel('2026-08-01', selectedDate, 'en', 'gregorian')).toMatch(
      /Sat|Saturday/i
    );
    // Prior-month Sunday → compact Gregorian date
    expect(
      weeklyPathAxisLabel('2026-07-26', selectedDate, 'en', 'gregorian')
    ).toMatch(/26/);
    expect(points[0].label).toMatch(/26/);
    expect(points[6].label).toMatch(/Sat|Saturday/i);

    // Localized short weekdays for in-month dates (not numeric 1–5 buckets).
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const label = weeklyPathAxisLabel(
        '2026-08-05',
        '2026-08-05',
        lang,
        'gregorian'
      );
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(/^(Week|Неделя|هفته|أسبوع)\s+\d+$/i);
      expect(label).not.toMatch(/^[1-5]$/);
    }
  });

  it('selectedDate maps to the path point with the same date (sync)', () => {
    const selectedDate = '2026-08-04';
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', { selectedDate });
    const hit = gps.weeks.find((p) => p.date === selectedDate);
    expect(hit).toBeTruthy();
    expect(hit?.score).toBe(86);
    expect(gps.weeks.filter((p) => p.date === selectedDate)).toHaveLength(1);
  });

  it('does not average or take weekly maxima in the builder', () => {
    const source = readFileSync(resolve(__dirname, './strategic-gps.ts'), 'utf8');
    expect(source).toContain('buildWeeklyPathPoints');
    expect(source).toContain('sundayWeekDatesContaining');
    expect(source).not.toMatch(/weekBuckets/);
    expect(source).not.toMatch(/Math\.floor\(\(day - 1\) \/ 7\)/);
    expect(source).not.toMatch(/const score = average\(weekBuckets/);
  });

  it('clampIsoDateToMonth keeps Selected Day Timing inside the viewed month', () => {
    expect(clampIsoDateToMonth('2026-08-06', 2026, 3)).toBe('2026-03-06');
    expect(clampIsoDateToMonth('2026-08-31', 2026, 2)).toBe('2026-02-28');
    expect(clampIsoDateToMonth(null, 2026, 8)).toBe('2026-08-01');
  });

  it('C/D: month best is true max; selectedDate may differ from monthBest', () => {
    const monthScores = {
      ...WEEK_SCORES,
      '2026-08-04': 75, // week still has a high day, but not the month peak
      '2026-08-20': 86, // month peak outside the selected week
      '2026-08-21': 80,
    };
    const selectedDate = '2026-08-05';
    const gps = buildStrategicGps(monthScores, [], 'en', { selectedDate });

    expect(gps.weeks).toHaveLength(7);
    expect(gps.weeks.map((p) => p.score)).toEqual([46, 65, 75, 58, 56, 70, 62]);
    expect(gps.monthBest?.score).toBe(86);
    expect(gps.monthBest?.date).toBe('2026-08-20');
    // Selected day (Wed Aug 5, score 58) differs from month best date
    expect(selectedDate).not.toBe(gps.monthBest?.date);
    expect(gps.weeks.find((p) => p.date === selectedDate)?.score).toBe(58);

    const again = findMonthBest(monthScores, 'en', 'gregorian');
    expect(again).toEqual(gps.monthBest);
  });

  it('G: Month Best calculation does not mutate canonicalMonthScores', () => {
    const canonical = { ...WEEK_SCORES, '2026-08-20': 86 };
    const before = structuredClone(canonical);
    findMonthBest(canonical, 'en', 'gregorian');
    buildStrategicGps(canonical, [], 'en', { selectedDate: '2026-08-05' });
    expect(canonical).toEqual(before);
  });

  it('H: house-system-driven score map changes still display exactly on graph/Month Best', () => {
    // Presentation layer: different canonical maps (as if house system changed).
    const placidusMap: Record<string, number> = {
      ...WEEK_SCORES,
      '2026-08-20': 86,
    };
    const wholeSignMap: Record<string, number> = {
      ...WEEK_SCORES,
      '2026-08-04': 70,
      '2026-08-20': 91,
    };
    const a = buildStrategicGps(placidusMap, [], 'en', {
      selectedDate: '2026-08-20',
    });
    const b = buildStrategicGps(wholeSignMap, [], 'en', {
      selectedDate: '2026-08-20',
    });
    expect(a.monthBest?.score).toBe(86);
    expect(b.monthBest?.score).toBe(91);
    expect(a.weeks.find((p) => p.date === '2026-08-20')?.score).toBe(86);
    expect(b.weeks.find((p) => p.date === '2026-08-20')?.score).toBe(91);
    for (const point of a.weeks) {
      expect(point.score).toBe(
        point.date ? placidusMap[point.date] ?? null : null
      );
    }
    for (const point of b.weeks) {
      expect(point.score).toBe(
        point.date ? wholeSignMap[point.date] ?? null : null
      );
    }
  });

  it('I: Weekly Path never emits five generic 1–5 week buckets', () => {
    const gps = buildStrategicGps(WEEK_SCORES, [], 'en', {
      selectedDate: '2026-08-05',
    });
    expect(gps.weeks).toHaveLength(7);
    expect(gps.weeks).not.toHaveLength(5);
    expect(gps.weeks.map((p) => p.label)).not.toEqual(['1', '2', '3', '4', '5']);
    expect(
      gps.weeks.every(
        (p) => p.date != null && !/^(Week|Неделя|هفته|أسبوع)\s+\d+$/i.test(p.label)
      )
    ).toBe(true);
  });
});
