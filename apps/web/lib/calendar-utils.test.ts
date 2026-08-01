import { describe, expect, it } from 'vitest';

import {
  calendarCells,
  parseIsoDate,
  shiftYearMonth,
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
