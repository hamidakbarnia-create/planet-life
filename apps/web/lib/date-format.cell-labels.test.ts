import { describe, expect, it } from 'vitest';

import {
  buildCalendarCellDateLabels,
  formatCompactCalendarDate,
} from './date-format';

describe('buildCalendarCellDateLabels', () => {
  it('uses Gregorian primary and Jalali + Hijri secondaries when Gregorian is active', () => {
    const labels = buildCalendarCellDateLabels('en', '2026-08-05', 'gregorian');
    expect(labels.primary).toMatch(/5/);
    expect(labels.secondaries[0]).toMatch(/\d/); // shamsi compact
    expect(labels.secondaries[1]).toMatch(/\d/); // hijri compact
    expect(labels.secondaries[0]).not.toBe(labels.primary);
    expect(labels.secondaries[1]).not.toBe(labels.primary);
  });

  it('uses Shamsi primary without duplicating shamsi in secondaries', () => {
    const labels = buildCalendarCellDateLabels('fa', '2026-08-05', 'shamsi');
    expect(labels.primary.length).toBeGreaterThan(0);
    // First secondary is Gregorian compact (day + short month)
    expect(labels.secondaries[0]).toMatch(/5|۵/);
    expect(labels.secondaries[0].toLowerCase()).toMatch(/aug|اوت|آگست|8/);
  });

  it('uses Hijri primary with Gregorian then Jalali secondaries', () => {
    const labels = buildCalendarCellDateLabels('ar', '2026-08-05', 'hijri');
    expect(labels.primary.length).toBeGreaterThan(0);
    expect(labels.secondaries[0]).toMatch(/5|٥/);
    expect(labels.secondaries[1].length).toBeGreaterThan(0);
  });

  it('does not duplicate the active calendar system in secondaries', () => {
    for (const active of ['gregorian', 'shamsi', 'hijri'] as const) {
      const labels = buildCalendarCellDateLabels('en', '2026-08-05', active);
      expect(new Set([labels.primary, ...labels.secondaries]).size).toBe(3);
    }
  });
});

describe('formatCompactCalendarDate', () => {
  it('includes day and short month without year for shamsi', () => {
    const compact = formatCompactCalendarDate('fa', '2026-08-05', 'shamsi');
    expect(compact).not.toMatch(/1405|۱۴۰۵/);
    expect(compact.length).toBeGreaterThan(1);
  });

  it('formats day-first compact EN labels and shortens long month names', () => {
    const shamsi = formatCompactCalendarDate('en', '2026-08-05', 'shamsi');
    const hijri = formatCompactCalendarDate('en', '2026-08-05', 'hijri');
    const gregorian = formatCompactCalendarDate('en', '2026-08-05', 'gregorian');
    // Day-first
    expect(shamsi).toMatch(/^14\s/);
    expect(hijri).toMatch(/^22\s/);
    expect(gregorian).toMatch(/^5\s/);
    // Long "Mordad" compacted; no year
    expect(shamsi).not.toMatch(/Mordad/i);
    expect(shamsi.length).toBeLessThanOrEqual(8);
    expect(shamsi).not.toMatch(/1405/);
  });
});
