import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  formatDisplayDateRange,
  formatDisplayMonthYear,
} from './date-format';

describe('formatDisplayDate', () => {
  it('formats gregorian ISO dates for English', () => {
    expect(formatDisplayDate('en', '2026-07-28', 'gregorian')).toMatch(
      /Jul.*28.*2026|7\/28\/2026/
    );
  });

  it('formats the same ISO instant in shamsi (persian) calendar', () => {
    const shamsi = formatDisplayDate('fa', '2026-07-28', 'shamsi');
    expect(shamsi).not.toEqual(formatDisplayDate('fa', '2026-07-28', 'gregorian'));
    // 2026-07-28 Gregorian ≈ 1405 Mordad 6 in Solar Hijri (Persian digits in fa locale)
    expect(shamsi).toMatch(/1405|۱۴۰۵/);
  });

  it('formats the same ISO instant in hijri calendar', () => {
    const hijri = formatDisplayDate('ar', '2026-07-28', 'hijri');
    expect(hijri).not.toEqual(formatDisplayDate('ar', '2026-07-28', 'gregorian'));
    expect(hijri.length).toBeGreaterThan(0);
  });

  it('returns the raw string when ISO is invalid', () => {
    expect(formatDisplayDate('en', 'not-a-date', 'gregorian')).toBe('not-a-date');
  });
});

describe('formatDisplayDateRange', () => {
  it('joins start and end with the shared formatter', () => {
    const range = formatDisplayDateRange('en', '2026-07-01', '2026-07-28', 'gregorian');
    expect(range).toContain(' - ');
    expect(range.startsWith(formatDisplayDate('en', '2026-07-01', 'gregorian'))).toBe(true);
    expect(range.endsWith(formatDisplayDate('en', '2026-07-28', 'gregorian'))).toBe(true);
  });
});

describe('formatDisplayMonthYear', () => {
  it('formats gregorian month/year for English without a day', () => {
    expect(formatDisplayMonthYear('en', 2026, 7, 'gregorian')).toMatch(/July.*2026/);
  });

  it('formats the same Gregorian month in shamsi', () => {
    const shamsi = formatDisplayMonthYear('fa', 2026, 7, 'shamsi');
    expect(shamsi).not.toEqual(formatDisplayMonthYear('fa', 2026, 7, 'gregorian'));
    expect(shamsi).toMatch(/1405|۱۴۰۵/);
  });
});

