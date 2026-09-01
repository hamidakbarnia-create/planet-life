import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CALENDAR_CACHE_STORES_DAY_INTELLIGENCE,
  CALENDAR_CACHE_VERSION,
  fingerprintCalendarScoringInput,
  fnv1a64Hex,
  legacyV1MonthCacheKey,
  loadMonthCache,
  monthCacheStorageKey,
  normalizeCalendarScoringInput,
  saveMonthCache,
  scoreMapChecksum,
  type CalendarScoringInput,
} from './calendar-cache';
import { buildStrategicGps, findMonthBest } from './strategic-gps';

/** Frozen goldens — must stay byte-identical across BigInt syntax refactors. */
const GOLDEN_FNV_EMPTY = 'cbf29ce484222325';
const GOLDEN_FNV_HELLO = 'a430d84680aabd0b';
const GOLDEN_BASE_INPUT_FINGERPRINT = '8e86cf9dab1fbb2d';

function baseInput(
  overrides: Partial<CalendarScoringInput> = {}
): CalendarScoringInput {
  return normalizeCalendarScoringInput({
    birth_date: '1980-09-17',
    birth_time: '17:22',
    birth_location: 'Tehran',
    birth_latitude: null,
    birth_longitude: null,
    evaluation_location: 'London',
    evaluation_latitude: 51.5074,
    evaluation_longitude: -0.1278,
    evaluation_timezone: 'Europe/London',
    house_system: 'placidus',
    zodiac: 'tropical',
    action_type: 'business_launch',
    year: 2026,
    month: 8,
    dates: Array.from({ length: 31 }, (_, i) =>
      `2026-08-${String(i + 1).padStart(2, '0')}`
    ),
    ...overrides,
  });
}

function fullMonthScores(seed = 60): Record<string, number> {
  const scores: Record<string, number> = {};
  for (let day = 1; day <= 31; day += 1) {
    const date = `2026-08-${String(day).padStart(2, '0')}`;
    scores[date] = seed + (day % 17);
  }
  return scores;
}

describe('calendar scoring-input fingerprint', () => {
  it('golden: FNV-1a and base scoring-input fingerprints stay byte-identical', () => {
    expect(fnv1a64Hex('')).toBe(GOLDEN_FNV_EMPTY);
    expect(fnv1a64Hex('hello')).toBe(GOLDEN_FNV_HELLO);
    expect(fingerprintCalendarScoringInput(baseInput())).toBe(
      GOLDEN_BASE_INPUT_FINGERPRINT
    );
  });

  it('A: same normalized scoring inputs produce the same fingerprint', () => {
    const a = baseInput({
      birth_date: ' 1980-09-17 ',
      evaluation_location: 'London  ',
      house_system: 'Placidus',
      zodiac: 'TROPICAL',
      action_type: 'Business_Launch',
      evaluation_latitude: 51.5074004,
      evaluation_longitude: -0.1278001,
    });
    const b = baseInput();
    expect(fingerprintCalendarScoringInput(a)).toBe(
      fingerprintCalendarScoringInput(b)
    );
    expect(fingerprintCalendarScoringInput(b)).toBe(
      GOLDEN_BASE_INPUT_FINGERPRINT
    );
  });

  it('B: changing score-affecting inputs changes the fingerprint', () => {
    const base = fingerprintCalendarScoringInput(baseInput());
    expect(
      fingerprintCalendarScoringInput(
        baseInput({ birth_date: '1980-09-18' })
      )
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(baseInput({ birth_time: '17:23' }))
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(
        baseInput({ evaluation_latitude: 51.51, evaluation_longitude: -0.13 })
      )
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(
        baseInput({ evaluation_timezone: 'Asia/Dubai' })
      )
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(
        baseInput({ house_system: 'whole_sign' })
      )
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(baseInput({ zodiac: 'sidereal' }))
    ).not.toBe(base);
    expect(
      fingerprintCalendarScoringInput(
        baseInput({ action_type: 'relationship' })
      )
    ).not.toBe(base);
  });

  it('C: locale or language fields are not part of the fingerprint', () => {
    const a = fingerprintCalendarScoringInput(baseInput());
    const withNoise = {
      ...baseInput(),
      locale: 'fa',
      language: 'fa',
      ui_theme: 'dark',
    } as CalendarScoringInput & {
      locale: string;
      language: string;
      ui_theme: string;
    };
    expect(fingerprintCalendarScoringInput(withNoise)).toBe(a);
  });
});

describe('calendar cache v2 identity', () => {
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

  it('Phase 0/1 cache content is numeric scores only', () => {
    expect(CALENDAR_CACHE_STORES_DAY_INTELLIGENCE).toBe(false);
    const input = baseInput();
    const scores = fullMonthScores();
    saveMonthCache(input, scores);
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprintCalendarScoringInput(input)
    );
    const record = JSON.parse(String(localStorage.getItem(key))) as {
      scores: Record<string, number>;
      breakdowns?: unknown;
      reasoning?: unknown;
      evidence?: unknown;
    };
    expect(record.scores).toEqual(scores);
    expect(record.breakdowns).toBeUndefined();
    expect(record.reasoning).toBeUndefined();
    expect(record.evidence).toBeUndefined();
  });

  it('returns null for a cache miss', () => {
    expect(loadMonthCache(baseInput())).toBeNull();
  });

  it('stores and loads a complete month score map', () => {
    const input = baseInput();
    const scores = fullMonthScores();
    saveMonthCache(input, scores);
    expect(loadMonthCache(input)).toEqual(scores);
  });

  it('uses metioro-cal-v2 key with fingerprint, not city plaintext birth data', () => {
    const input = baseInput();
    const fingerprint = fingerprintCalendarScoringInput(input);
    saveMonthCache(input, fullMonthScores());
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprint
    );
    expect(key.startsWith(`metioro-cal-${CALENDAR_CACHE_VERSION}-`)).toBe(
      true
    );
    expect(localStorage.getItem(key)).not.toBeNull();
    expect(key).not.toContain('1980-09-17');
    expect(key).not.toContain('Tehran');
    expect(key).not.toContain('17:22');
  });

  it('D: old v1 city-only cache entries are ignored', () => {
    const scores = fullMonthScores(61);
    localStorage.setItem(
      legacyV1MonthCacheKey(2026, 8, 'business_launch', 'London'),
      JSON.stringify({ scores, savedAt: Date.now() })
    );
    expect(loadMonthCache(baseInput())).toBeNull();
  });

  it('E: fingerprint mismatch causes cache miss', () => {
    const scores = fullMonthScores();
    saveMonthCache(baseInput(), scores);
    expect(
      loadMonthCache(baseInput({ evaluation_timezone: 'America/New_York' }))
    ).toBeNull();
  });

  it('rejects incomplete month maps on save and load', () => {
    const input = baseInput();
    saveMonthCache(input, { '2026-08-01': 72 });
    expect(loadMonthCache(input)).toBeNull();

    const fingerprint = fingerprintCalendarScoringInput(input);
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprint
    );
    localStorage.setItem(
      key,
      JSON.stringify({
        version: CALENDAR_CACHE_VERSION,
        inputFingerprint: fingerprint,
        savedAt: Date.now(),
        dates: input.dates,
        scores: { '2026-08-01': 72 },
      })
    );
    expect(loadMonthCache(input)).toBeNull();
  });

  it('rejects version mismatch', () => {
    const input = baseInput();
    const fingerprint = fingerprintCalendarScoringInput(input);
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprint
    );
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 'v1',
        inputFingerprint: fingerprint,
        savedAt: Date.now(),
        dates: input.dates,
        scores: fullMonthScores(),
      })
    );
    expect(loadMonthCache(input)).toBeNull();
  });

  it('rejects expired cache', () => {
    const input = baseInput();
    const scores = fullMonthScores();
    saveMonthCache(input, scores);
    vi.advanceTimersByTime(1000 * 60 * 60 * 12 + 1);
    expect(loadMonthCache(input)).toBeNull();
  });

  it('rejects malformed score values', () => {
    const input = baseInput();
    const fingerprint = fingerprintCalendarScoringInput(input);
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprint
    );
    const scores = fullMonthScores() as Record<string, number | string>;
    scores['2026-08-15'] = 'bad';
    localStorage.setItem(
      key,
      JSON.stringify({
        version: CALENDAR_CACHE_VERSION,
        inputFingerprint: fingerprint,
        savedAt: Date.now(),
        dates: input.dates,
        scores,
      })
    );
    expect(loadMonthCache(input)).toBeNull();
  });

  it('returns null for malformed JSON', () => {
    const input = baseInput();
    const key = monthCacheStorageKey(
      2026,
      8,
      input.action_type,
      fingerprintCalendarScoringInput(input)
    );
    localStorage.setItem(key, '{invalid-json');
    expect(loadMonthCache(input)).toBeNull();
  });

  it('H: cached and freshly saved copies produce identical score-map checksum', () => {
    const input = baseInput();
    const scores = fullMonthScores(63);
    saveMonthCache(input, scores);
    const loaded = loadMonthCache(input);
    expect(loaded).not.toBeNull();
    expect(scoreMapChecksum(loaded!)).toBe(scoreMapChecksum(scores));
  });
});

describe('one source of truth from score map', () => {
  const scores = fullMonthScores(50);

  it('F: identical score map produces identical Outlook / Weekly Path / Month Best', () => {
    const selectedDate = '2026-08-14';
    const a = buildStrategicGps(scores, [], 'en', { selectedDate });
    const b = buildStrategicGps({ ...scores }, [], 'en', { selectedDate });
    expect(a.monthScore).toBe(b.monthScore);
    expect(a.weeks).toEqual(b.weeks);
    expect(a.monthBest).toEqual(b.monthBest);
    expect(a.weeks.every((w) => w.date && scores[w.date!] === w.score)).toBe(
      true
    );
  });

  it('G: Month Best presentation does not mutate the score map', () => {
    const before = structuredClone(scores);
    const best = findMonthBest(scores, 'en', 'gregorian');
    expect(best).not.toBeNull();
    expect(scores).toEqual(before);
    expect(scoreMapChecksum(scores)).toBe(scoreMapChecksum(before));
  });

  it('H: cached and fresh maps yield identical UI metrics', () => {
    const selectedDate = '2026-08-14';
    const fresh = buildStrategicGps(scores, [], 'en', { selectedDate });
    const cachedCopy = { ...scores };
    const fromCache = buildStrategicGps(cachedCopy, [], 'en', {
      selectedDate,
    });
    expect(fromCache.monthScore).toBe(fresh.monthScore);
    expect(fromCache.monthBest).toEqual(fresh.monthBest);
    expect(fromCache.weeks.map((w) => w.score)).toEqual(
      fresh.weeks.map((w) => w.score)
    );
    expect(scoreMapChecksum(cachedCopy)).toBe(scoreMapChecksum(scores));
  });
});
