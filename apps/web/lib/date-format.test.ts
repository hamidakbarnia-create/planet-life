import { describe, expect, it } from 'vitest';
import {
  formatDisplayDate,
  formatDisplayDateRange,
  formatDisplayDay,
  formatDisplayMonthCoverage,
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

describe('formatDisplayDay', () => {
  it('keeps gregorian day numerals', () => {
    expect(formatDisplayDay('en', '2026-07-28', 'gregorian')).toMatch(/28/);
  });

  it('derives shamsi day from the Gregorian ISO date', () => {
    // 2026-07-28 ≈ Mordad 6, 1405
    expect(formatDisplayDay('fa', '2026-07-28', 'shamsi')).toMatch(/6|۶/);
  });

  it('derives hijri day from the Gregorian ISO date', () => {
    expect(formatDisplayDay('ar', '2026-07-28', 'hijri')).toMatch(/14|١٤/);
  });
});

describe('formatDisplayMonthCoverage', () => {
  it('matches single-month gregorian headers', () => {
    expect(formatDisplayMonthCoverage('en', 2026, 7, 'gregorian')).toMatch(/July.*2026/);
  });

  it('characterizes July 2026 as a shamsi span across two months', () => {
    const coverage = formatDisplayMonthCoverage('en', 2026, 7, 'shamsi');
    expect(coverage).toContain('–');
    expect(coverage).toMatch(/Tir/i);
    expect(coverage).toMatch(/Mordad/i);
    expect(coverage).toMatch(/1405/);
  });

  it('characterizes July 2026 as a hijri span across two months', () => {
    const coverage = formatDisplayMonthCoverage('en', 2026, 7, 'hijri');
    expect(coverage).toContain('–');
    expect(coverage).toMatch(/Muharram/i);
    expect(coverage).toMatch(/Safar/i);
    expect(coverage).toMatch(/1448/);
  });

  it('keeps gregorian coverage as a single month label', () => {
    const coverage = formatDisplayMonthCoverage('en', 2026, 7, 'gregorian');
    expect(coverage).not.toContain('–');
    expect(coverage).toMatch(/July.*2026/);
  });
});
