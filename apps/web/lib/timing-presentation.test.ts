import { describe, expect, it } from 'vitest';

import {
  BAND_STYLES,
  formatHourLabel,
  formatReadinessPercent,
  isDangerHour,
  isGoldenHour,
  scoreToBand,
} from './timing-presentation';

describe('scoreToBand', () => {
  it.each([
    [undefined, 'empty'],
    [null, 'empty'],
    [Number.NaN, 'empty'],
    [0, 'red'],
    [39, 'red'],
    [40, 'orange'],
    [59, 'orange'],
    [60, 'yellow'],
    [84, 'yellow'],
    [85, 'green'],
    [100, 'green'],
  ])('maps %s to %s', (score, expected) => {
    expect(scoreToBand(score)).toBe(expected);
  });

  it('provides presentation styles for every band', () => {
    expect(Object.keys(BAND_STYLES).sort()).toEqual(
      ['empty', 'green', 'orange', 'red', 'yellow'].sort()
    );
  });
});

describe('formatHourLabel', () => {
  it.each([
    [0, 'en', '12:00 AM'],
    [12, 'en', '12:00 PM'],
    [18, 'en', '6:00 PM'],
    [23, 'en', '11:00 PM'],
    [18, 'fa', '18:00'],
    [18, 'ar', '18:00'],
    [18, 'ru', '18:00'],
    [24, 'en', '12:00 AM'],
    [-1, 'en', '11:00 PM'],
  ])('formats hour %s for %s', (hour, lang, expected) => {
    expect(formatHourLabel(hour, lang)).toBe(expected);
  });
});

describe('formatReadinessPercent', () => {
  it.each([
    [85, '85%'],
    [64, '64%'],
    [37, '37%'],
    [0, '0%'],
    [100, '100%'],
  ])('formats score %s as %s', (score, expected) => {
    expect(formatReadinessPercent(score)).toBe(expected);
  });

  it('never produces a double percent sign', () => {
    expect(formatReadinessPercent(85)).not.toContain('%%');
    expect(formatReadinessPercent(64)).not.toMatch(/%{2,}/);
  });
});

describe('hour classifications', () => {
  it('preserves the golden-hour threshold', () => {
    expect(isGoldenHour(84)).toBe(false);
    expect(isGoldenHour(85)).toBe(true);
  });

  it('preserves the danger-hour threshold', () => {
    expect(isDangerHour(39)).toBe(true);
    expect(isDangerHour(40)).toBe(false);
  });
});
