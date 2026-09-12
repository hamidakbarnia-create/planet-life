import { describe, expect, it } from 'vitest';
import {
  describeWindowWhen,
  isValidIanaTimeZone,
  nextRelationChangeAt,
  parseTimedWindowValue,
  windowBoundaryTimes,
  zonedCivilInstant,
} from './vault-window-when';

describe('describeWindowWhen', () => {
  it('labels yesterday / today / tomorrow in the stated zone', () => {
    const now = new Date('2026-09-10T12:00:00Z');
    const yesterday = describeWindowWhen({
      date: '2026-09-09',
      start: '10:00',
      end: '11:00',
      timezone: 'Europe/London',
      now,
    });
    const laterToday = describeWindowWhen({
      date: '2026-09-10',
      start: '15:00',
      end: '16:00',
      timezone: 'Europe/London',
      now,
    });
    const current = describeWindowWhen({
      date: '2026-09-10',
      start: '12:00',
      end: '14:00',
      timezone: 'Europe/London',
      now,
    });
    const tomorrow = describeWindowWhen({
      date: '2026-09-11',
      start: '10:00',
      end: '11:00',
      timezone: 'Europe/London',
      now,
    });
    expect(yesterday.relation).toBe('past');
    expect(yesterday.facts).toBe('2026-09-09 10:00–11:00 Europe/London');
    expect(laterToday.relation).toBe('upcoming');
    expect(current.relation).toBe('current');
    expect(tomorrow.relation).toBe('upcoming');
  });

  it('exposes unique start/end instants and the next relation change', () => {
    const start = zonedCivilInstant('2026-09-10', '10:00', 'Europe/London');
    const end = zonedCivilInstant('2026-09-10', '11:00', 'Europe/London');
    expect(start && end).toBeTruthy();
    const bounds = windowBoundaryTimes({
      date: '2026-09-10',
      start: '10:00',
      end: '11:00',
      timezone: 'Europe/London',
    });
    expect(bounds).toEqual({ start: start!.getTime(), end: end!.getTime() });
    expect(nextRelationChangeAt(start!.getTime() - 1, [bounds!])).toBe(start!.getTime());
    expect(nextRelationChangeAt(start!.getTime(), [bounds!])).toBe(end!.getTime());
    expect(nextRelationChangeAt(end!.getTime(), [bounds!])).toBeNull();
    expect(
      windowBoundaryTimes({
        date: '2026-10-04',
        start: '02:15',
        end: '03:15',
        timezone: 'Australia/Lord_Howe',
      }),
    ).toBeNull();
  });

  it('treats the exact end as past', () => {
    const now = zonedCivilInstant('2026-09-10', '11:00', 'Europe/London');
    expect(now).toBeTruthy();
    const result = describeWindowWhen({
      date: '2026-09-10',
      start: '10:00',
      end: '11:00',
      timezone: 'Europe/London',
      now: now!,
    });
    expect(result.relation).toBe('past');
  });

  it('keeps a midnight-crossing window on the stated calendar date', () => {
    const during = describeWindowWhen({
      date: '2026-09-10',
      start: '23:00',
      end: '00:00',
      timezone: 'Europe/London',
      now: zonedCivilInstant('2026-09-10', '23:30', 'Europe/London')!,
    });
    const after = describeWindowWhen({
      date: '2026-09-10',
      start: '23:00',
      end: '00:00',
      timezone: 'Europe/London',
      now: zonedCivilInstant('2026-09-11', '00:00', 'Europe/London')!,
    });
    expect(during.relation).toBe('current');
    expect(during.date).toBe('2026-09-10');
    expect(after.relation).toBe('past');
  });

  it('does not invent today when the date is missing', () => {
    const result = describeWindowWhen({
      start: '10:00',
      end: '11:00',
      timezone: 'Europe/London',
      now: new Date('2026-09-10T12:00:00Z'),
    });
    expect(result.relation).toBe('unknown');
    expect(result.date).toBeNull();
    expect(result.facts).not.toContain('2026-09-10');
  });

  it('stays unknown for a missing or invalid timezone', () => {
    const missing = describeWindowWhen({
      date: '2026-09-10',
      start: '10:00',
      end: '11:00',
      now: new Date('2026-09-10T12:00:00Z'),
    });
    const invalid = describeWindowWhen({
      date: '2026-09-10',
      start: '10:00',
      end: '11:00',
      timezone: 'Not/AZone',
      now: new Date('2026-09-10T12:00:00Z'),
    });
    expect(missing.relation).toBe('unknown');
    expect(invalid.relation).toBe('unknown');
    expect(isValidIanaTimeZone('Not/AZone')).toBe(false);
    expect(isValidIanaTimeZone('Europe/London')).toBe(true);
  });

  it('does not label a DST spring gap or fall overlap', () => {
    const gap = describeWindowWhen({
      date: '2026-03-08',
      start: '02:30',
      end: '03:30',
      timezone: 'America/New_York',
      now: new Date('2026-03-08T12:00:00Z'),
    });
    const overlap = describeWindowWhen({
      date: '2026-11-01',
      start: '01:30',
      end: '02:30',
      timezone: 'America/New_York',
      now: new Date('2026-11-01T12:00:00Z'),
    });
    expect(gap.relation).toBe('unknown');
    expect(overlap.relation).toBe('unknown');
  });

  it('stays unknown for Australia/Lord_Howe half-hour overlap and gap', () => {
    expect(zonedCivilInstant('2026-04-05', '01:30', 'Australia/Lord_Howe')).toBeNull();
    expect(zonedCivilInstant('2026-10-04', '02:15', 'Australia/Lord_Howe')).toBeNull();
    const overlap = describeWindowWhen({
      date: '2026-04-05',
      start: '01:30',
      end: '02:30',
      timezone: 'Australia/Lord_Howe',
      now: new Date('2026-04-05T12:00:00Z'),
    });
    const gap = describeWindowWhen({
      date: '2026-10-04',
      start: '02:15',
      end: '03:15',
      timezone: 'Australia/Lord_Howe',
      now: new Date('2026-10-04T12:00:00Z'),
    });
    expect(overlap.relation).toBe('unknown');
    expect(gap.relation).toBe('unknown');
  });
});

describe('parseTimedWindowValue', () => {
  it('reads start, end and IANA zone from a Date Outfit value', () => {
    expect(parseTimedWindowValue('23:00–00:00 · 78/100 · Europe/London')).toEqual({
      start: '23:00',
      end: '00:00',
      timezone: 'Europe/London',
    });
  });
});
