import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { API_BASE } from './api-config';
import {
  fetchDayScoreDetail,
  fetchHourlyScores,
  fetchMonthScores,
  fetchTransitSnapshot,
} from './calendar-scores';
import type { BirthProfile } from './birth-profile';

vi.mock('./app-settings', () => ({
  chartPreferenceFields: () => ({
    house_system: 'placidus',
    zodiac: 'tropical',
  }),
}));

vi.mock('./user-locations', () => ({
  buildScoringLocationPayload: () => ({
    location: 'Tehran',
    evaluation_location: 'London',
    evaluation_latitude: 51.5074,
    evaluation_longitude: -0.1278,
    evaluation_timezone: 'Europe/London',
  }),
  resolveCalendarEvaluationLocation: () => ({
    city: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
  }),
}));

type LoadMonthCacheArgs = [year: number, month: number, action: string, evalCity?: string];
type SaveMonthCacheArgs = [
  year: number,
  month: number,
  action: string,
  scores: Record<string, number>,
  evalCity?: string,
];

const loadMonthCache = vi.fn<
  (...args: LoadMonthCacheArgs) => Record<string, number> | null
>(() => null);
const saveMonthCache = vi.fn<(...args: SaveMonthCacheArgs) => void>(() => undefined);

vi.mock('./calendar-cache', () => ({
  loadMonthCache: (...args: LoadMonthCacheArgs) => loadMonthCache(...args),
  saveMonthCache: (...args: SaveMonthCacheArgs) => saveMonthCache(...args),
}));

const profile = {
  birth_date: '1980-09-17',
  birth_time: '17:22',
  action_type: 'business_launch',
} as BirthProfile;

beforeEach(() => {
  loadMonthCache.mockReturnValue(null);
  saveMonthCache.mockClear();
  loadMonthCache.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('calendar score transport behaviour', () => {
  it('posts day analysis request to the analyze endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchDayScoreDetail(profile, '2026-07-28', '12:00');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe(`${API_BASE}/api/business/analyze`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual(
      expect.objectContaining({
        birth_date: '1980-09-17',
        birth_time: '17:22',
        action_type: 'business_launch',
        target_date: '2026-07-28',
        target_time: '12:00',
        house_system: 'placidus',
        zodiac: 'tropical',
        evaluation_location: 'London',
      })
    );
  });

  it('posts all month dates to the batch endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchMonthScores(profile, 2026, 7);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe(`${API_BASE}/api/batch`);
    expect(init.method).toBe('POST');
    expect(body.dates).toHaveLength(31);
    expect(body.dates[0]).toBe('2026-07-01');
    expect(body.dates[30]).toBe('2026-07-31');
  });

  it('posts hourly request to the batch-hourly endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hours: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchHourlyScores(profile, '2026-07-28');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe(`${API_BASE}/api/batch-hourly`);
    expect(body.target_date).toBe('2026-07-28');
    expect(result).toHaveLength(24);
  });

  it('posts transit request to the transit endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ transit: {}, location_context: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchTransitSnapshot(
      profile,
      '2026-07-28',
      '12:00'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));

    expect(url).toBe(`${API_BASE}/api/transit`);
    expect(body.target_date).toBe('2026-07-28');
    expect(body.target_time).toBe('12:00');
    expect(result.planets).toEqual([]);
  });

  it('preserves the current null result on day network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('network down'))
    );

    await expect(
      fetchDayScoreDetail(profile, '2026-07-28')
    ).resolves.toEqual({
      score: null,
      breakdown: null,
    });
  });
});

describe('fetchMonthScores empty-cache regression', () => {
  it('does not short-circuit when cached month scores are an empty object', async () => {
    loadMonthCache.mockReturnValue({});
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scores: {
          '2026-07-01': { executive: { score: 72 } },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.scores['2026-07-01']).toBe(72);
  });

  it('short-circuits when non-empty month scores are cached', async () => {
    loadMonthCache.mockReturnValue({ '2026-07-01': 81 });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.scores).toEqual({ '2026-07-01': 81 });
    expect(saveMonthCache).not.toHaveBeenCalled();
  });

  it('does not cache a non-2xx /api/batch response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'error' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(result.scores).toEqual({});
    expect(saveMonthCache).not.toHaveBeenCalled();
  });

  it('does not cache an empty successful /api/batch response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(result.scores).toEqual({});
    expect(saveMonthCache).not.toHaveBeenCalled();
  });

  it('caches and returns valid daily scores from /api/batch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scores: {
          '2026-07-01': { executive: { score: 72 } },
          '2026-07-02': { executive: { score: 88 } },
          '2026-07-03': { error: 'failed' },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(result.scores).toEqual({
      '2026-07-01': 72,
      '2026-07-02': 88,
    });
    expect(saveMonthCache).toHaveBeenCalledTimes(1);
    expect(saveMonthCache.mock.calls[0]?.[3]).toEqual({
      '2026-07-01': 72,
      '2026-07-02': 88,
    });
  });
});
