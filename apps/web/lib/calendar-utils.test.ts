import { describe, expect, it } from 'vitest';

import {
  calendarCells,
  clampIsoDateToMonth,
  parseIsoDate,
  shiftYearMonth,
  sundayWeekDatesContaining,
} from './calendar-utils';

describe('calendarCells', () => {
  it('fills leading and trailing adjacent-month dates', () => {
    // August 2026 starts on Saturday → 6 leading days from July
    const cells = calendarCells(2026, 8);
    expect(cells.length % 7).toBe(0);
    expect(cells[0]).toMatchObject({
      date: '2026-07-26',
      inCurrentMonth: false,
    });
    expect(cells.find((c) => c.date === '2026-08-01')).toMatchObject({
      inCurrentMonth: true,
      day: 1,
    });
    const last = cells[cells.length - 1];
    expect(last.inCurrentMonth).toBe(false);
    expect(last.date.startsWith('2026-09-')).toBe(true);
  });

  it('marks only viewed-month dates as inCurrentMonth', () => {
    const cells = calendarCells(2026, 8);
    const inMonth = cells.filter((c) => c.inCurrentMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth.every((c) => c.date.startsWith('2026-08-'))).toBe(true);
  });
});

describe('parseIsoDate / shiftYearMonth', () => {
  it('parses ISO dates', () => {
    expect(parseIsoDate('2026-08-05')).toEqual({
      year: 2026,
      month: 8,
      day: 5,
    });
  });

  it('shifts across year boundaries', () => {
    expect(shiftYearMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftYearMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
  });
});

describe('sundayWeekDatesContaining / clampIsoDateToMonth', () => {
  it('returns the Sunday-start week matching calendarCells rows', () => {
    const week = sundayWeekDatesContaining('2026-08-05');
    expect(week).toEqual([
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);
    const cells = calendarCells(2026, 8);
    const idx = cells.findIndex((c) => c.date === '2026-08-05');
    const row = cells.slice(Math.floor(idx / 7) * 7, Math.floor(idx / 7) * 7 + 7);
    expect(week).toEqual(row.map((c) => c.date));
  });

  it('includes prior-month dates when the week crosses the boundary', () => {
    expect(sundayWeekDatesContaining('2026-08-01')).toEqual([
      '2026-07-26',
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ]);
  });

  it('clamps selectedDate into the viewed month', () => {
    expect(clampIsoDateToMonth('2026-08-06', 2026, 3)).toBe('2026-03-06');
    expect(clampIsoDateToMonth('2026-08-31', 2026, 2)).toBe('2026-02-28');
  });
});
