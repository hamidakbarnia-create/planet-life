import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  loadMonthCache,
  saveMonthCache,
} from './calendar-cache';

describe('calendar cache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns null for a cache miss', () => {
    expect(loadMonthCache(2026, 7, 'business')).toBeNull();
  });

  it('stores and loads month scores', () => {
    const scores = {
      '2026-07-01': 72,
      '2026-07-02': 85,
    };

    saveMonthCache(2026, 7, 'business', scores);

    expect(loadMonthCache(2026, 7, 'business')).toEqual(scores);
  });

  it('preserves the existing default-location cache key', () => {
    saveMonthCache(2026, 7, 'business', {
      '2026-07-01': 72,
    });

    expect(
      localStorage.getItem(
        'planet-life-cal-2026-07-business-default'
      )
    ).not.toBeNull();
  });

  it('normalizes whitespace in the evaluation city key', () => {
    saveMonthCache(
      2026,
      7,
      'business',
      { '2026-07-01': 72 },
      'New York City'
    );

    expect(
      localStorage.getItem(
        'planet-life-cal-2026-07-business-New_York_City'
      )
    ).not.toBeNull();
  });

  it('keeps caches separate by action', () => {
    saveMonthCache(2026, 7, 'business', {
      '2026-07-01': 72,
    });

    expect(loadMonthCache(2026, 7, 'relationship')).toBeNull();
  });

  it('keeps caches separate by evaluation city', () => {
    saveMonthCache(
      2026,
      7,
      'business',
      { '2026-07-01': 72 },
      'London'
    );

    expect(
      loadMonthCache(2026, 7, 'business', 'Dubai')
    ).toBeNull();
  });

  it('returns cached scores at exactly twelve hours', () => {
    const scores = { '2026-07-01': 72 };

    saveMonthCache(2026, 7, 'business', scores);

    vi.advanceTimersByTime(1000 * 60 * 60 * 12);

    expect(loadMonthCache(2026, 7, 'business')).toEqual(scores);
  });

  it('returns null after twelve hours', () => {
    saveMonthCache(2026, 7, 'business', {
      '2026-07-01': 72,
    });

    vi.advanceTimersByTime(1000 * 60 * 60 * 12 + 1);

    expect(loadMonthCache(2026, 7, 'business')).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    localStorage.setItem(
      'planet-life-cal-2026-07-business-default',
      '{invalid-json'
    );

    expect(loadMonthCache(2026, 7, 'business')).toBeNull();
  });

  it('returns null when localStorage getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(loadMonthCache(2026, 7, 'business')).toBeNull();
  });

  it('preserves save errors instead of swallowing them', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(() =>
      saveMonthCache(2026, 7, 'business', {
        '2026-07-01': 72,
      })
    ).toThrow('storage unavailable');
  });
});
