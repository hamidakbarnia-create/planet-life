import { describe, expect, it } from 'vitest';
import { askPrimaryCalendar, formatAskDatePair } from './dates';

describe('ask-product dates', () => {
  it('FA prefers Jalali primary with Gregorian secondary', () => {
    expect(askPrimaryCalendar('fa', 'gregorian')).toBe('shamsi');
    const pair = formatAskDatePair('fa', '2026-08-18', 'gregorian');
    expect(pair.primary).toBeTruthy();
    expect(pair.secondary).toBeTruthy();
    expect(pair.iso).toBe('2026-08-18');
  });

  it('EN/RU use localized Gregorian without secondary by default', () => {
    const en = formatAskDatePair('en', '2026-08-18', 'gregorian');
    const ru = formatAskDatePair('ru', '2026-08-18', 'gregorian');
    expect(en.primary).toMatch(/2026|August|Aug/i);
    expect(en.secondary).toBeUndefined();
    expect(ru.secondary).toBeUndefined();
    expect(ru.primary.length).toBeGreaterThan(0);
  });

  it('AR follows configured calendar preference', () => {
    expect(askPrimaryCalendar('ar', 'gregorian')).toBe('gregorian');
    const ar = formatAskDatePair('ar', '2026-08-18', 'gregorian');
    expect(ar.primary).toBeTruthy();
  });
});
