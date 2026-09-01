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

type CalendarScoringInput = {
  dates: string[];
  action_type: string;
  [key: string]: unknown;
};

type LoadMonthCacheRecordArgs = [input: CalendarScoringInput];
type SaveMonthCacheArgs = [
  input: CalendarScoringInput,
  days: Record<string, { score: number; dayIntelligence?: unknown }>,
  options?: { backendVersion?: string | null },
];

const loadMonthCacheRecord = vi.fn<
  (...args: LoadMonthCacheRecordArgs) => {
    days: Record<string, { score: number; dayIntelligence?: unknown }>;
  } | null
>(() => null);
const saveMonthCache = vi.fn<(...args: SaveMonthCacheArgs) => void>(() => undefined);

vi.mock('./calendar-cache', async () => {
  const actual = await vi.importActual<typeof import('./calendar-cache')>(
    './calendar-cache'
  );
  return {
    ...actual,
    loadMonthCacheRecord: (...args: LoadMonthCacheRecordArgs) =>
      loadMonthCacheRecord(...args),
    saveMonthCache: (...args: SaveMonthCacheArgs) => saveMonthCache(...args),
  };
});

const profile = {
  birth_date: '1980-09-17',
  birth_time: '17:22',
  action_type: 'business_launch',
} as BirthProfile;

beforeEach(() => {
  loadMonthCacheRecord.mockReturnValue(null);
  saveMonthCache.mockClear();
  loadMonthCacheRecord.mockClear();
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
    loadMonthCacheRecord.mockReturnValue({ days: {} });
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

  it('short-circuits when a semantic month record is cached', async () => {
    loadMonthCacheRecord.mockReturnValue({
      days: {
        '2026-07-01': {
          score: 81,
          dayIntelligence: {
            finalScore: 81,
            dayClass: 'mixed',
            conflict: false,
            rating: 'Mixed',
            materialSupportiveCount: 0,
            materialCautionCount: 0,
            basis: 'score_bands+evidence_conflict',
            evidence: [],
            actionType: 'business_launch',
            dominantAspects: [],
            scoringContext: {},
            dimensions: { mapping_version: 'dimensions.v1-shadow' },
            dimensionClassification: {
              classifier_version: 'dimension_class.v3-shadow',
              semantic_status: 'experimental_shadow',
              day_class: 'review',
            },
          },
        },
      },
    });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.scores).toEqual({ '2026-07-01': 81 });
    expect(result.dayIntelligence['2026-07-01']?.dayClass).toBe('mixed');
    expect(
      result.dayIntelligence['2026-07-01']?.dimensionClassification
        ?.classifier_version
    ).toBe('dimension_class.v3-shadow');
    expect(saveMonthCache).not.toHaveBeenCalled();
  });

  it('legacy numeric cache mock (null semantic record) refetches live Day Intelligence', async () => {
    loadMonthCacheRecord.mockReturnValue(null);
    const cached: Record<string, number> = {};
    for (let day = 1; day <= 31; day += 1) {
      cached[`2026-07-${String(day).padStart(2, '0')}`] = 60 + (day % 10);
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scores: {
          '2026-07-01': {
            executive: { score: 61 },
            day_intelligence: {
              final_score: 61,
              day_class: 'mixed',
              conflict: false,
              rating: 'Mixed / Proceed with Awareness',
              material_supportive_count: 0,
              material_caution_count: 0,
              basis: 'score_bands+evidence_conflict',
              evidence: [],
              dimensions: { mapping_version: 'dimensions.v1-shadow' },
              dimension_classification: {
                classifier_version: 'dimension_class.v3-shadow',
                semantic_status: 'experimental_shadow',
                day_class: 'review',
              },
            },
          },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.scores['2026-07-01']).toBe(61);
    expect(
      result.dayIntelligence['2026-07-01']?.dimensionClassification
        ?.classifier_version
    ).toBe('dimension_class.v3-shadow');
  });

  it('live /api/batch miss populates breakdowns and reasoning from the payload', async () => {
    const dayPayloads: Record<
      string,
      {
        executive: { score: number };
        strategic?: {
          component_breakdown?: { final_score: number } &
            Record<string, unknown>;
        };
        reasoning?: { summary: string; confidence: number; reasons: unknown[] };
        day_intelligence?: {
          final_score: number;
          day_class: string;
          conflict: boolean;
          rating: string;
          material_supportive_count: number;
          material_caution_count: number;
          basis: string;
          evidence: Record<string, unknown>[];
        };
      }
    > = {};
    for (let day = 1; day <= 31; day += 1) {
      const date = `2026-07-${String(day).padStart(2, '0')}`;
      dayPayloads[date] = {
        executive: { score: 60 + (day % 10) },
        strategic: {
          component_breakdown: {
            aspect_score: 1,
            natal_house_bonus: 0,
            transit_house_score: 0,
            transit_angular_score: 0,
            location_component_score: 0,
            retrograde_penalty: 0,
            final_score: 60 + (day % 10),
            location_mode: 'currentLiving',
            calculated_for: 'London',
            resolved_local_datetime: `${date}T12:00:00+01:00`,
            resolved_utc_datetime: `${date}T11:00:00+00:00`,
            timezone: 'Europe/London',
            target_time: '12:00',
          },
        },
        reasoning: {
          summary: 'Deterministic reasoning',
          confidence: 0.6,
          reasons: [],
        },
        day_intelligence: {
          final_score: 60 + (day % 10),
          day_class: 'mixed',
          conflict: false,
          rating: 'Mixed / Proceed with Awareness',
          material_supportive_count: 0,
          material_caution_count: 0,
          basis: 'score_bands+evidence_conflict',
          evidence: [],
        },
      };
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: dayPayloads }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(result.breakdowns['2026-07-01']).not.toBeNull();
    expect(result.reasoning['2026-07-01']?.summary).toBe(
      'Deterministic reasoning'
    );
    expect(result.dayIntelligence['2026-07-01']?.dayClass).toBe('mixed');
    expect(result.dayIntelligence['2026-07-01']?.finalScore).toBe(61);
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

  it('does not cache an incomplete month from /api/batch', async () => {
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
    expect(saveMonthCache).not.toHaveBeenCalled();
  });

  it('caches a complete month from /api/batch', async () => {
    const dayPayloads: Record<string, { executive: { score: number } }> = {};
    for (let day = 1; day <= 31; day += 1) {
      const date = `2026-07-${String(day).padStart(2, '0')}`;
      dayPayloads[date] = { executive: { score: 60 + (day % 10) } };
    }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: dayPayloads }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);

    expect(Object.keys(result.scores)).toHaveLength(31);
    expect(saveMonthCache).toHaveBeenCalledTimes(1);
    const savedDays = saveMonthCache.mock.calls[0]?.[1] as Record<
      string,
      { score: number }
    >;
    expect(Object.keys(savedDays)).toHaveLength(31);
    expect(savedDays['2026-07-01']?.score).toBe(result.scores['2026-07-01']);
    expect(saveMonthCache.mock.calls[0]?.[0]?.dates).toHaveLength(31);
  });
});
