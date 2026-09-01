import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CALENDAR_CACHE_CONTENT_VERSION,
  CALENDAR_CACHE_STORES_DAY_INTELLIGENCE,
  CALENDAR_CACHE_VERSION,
  fingerprintCalendarScoringInput,
  loadMonthCache,
  loadMonthCacheRecord,
  monthCacheStorageKey,
  normalizeCalendarScoringInput,
  saveMonthCache,
  scoresFromCachedDays,
  type CalendarCachedDay,
  type CalendarScoringInput,
} from './calendar-cache';
import { extractBatchDayIntelligence } from './calendar-day-intelligence';
import { fetchMonthScores } from './calendar-scores';
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

const profile = {
  birth_date: '1980-09-17',
  birth_time: '17:22',
  action_type: 'business_launch',
  location: 'Tehran',
} as BirthProfile;

function julyDates(): string[] {
  return Array.from(
    { length: 31 },
    (_, i) => `2026-07-${String(i + 1).padStart(2, '0')}`
  );
}

function dayPayload(date: string, score: number) {
  return {
    executive: { score },
    strategic: {
      component_breakdown: {
        aspect_score: 1,
        natal_house_bonus: 0,
        transit_house_score: 0,
        transit_angular_score: 0,
        location_component_score: 0,
        retrograde_penalty: 0,
        final_score: score,
        location_mode: 'currentLiving',
        calculated_for: 'London',
        resolved_local_datetime: `${date}T12:00:00+01:00`,
        resolved_utc_datetime: `${date}T11:00:00+00:00`,
        timezone: 'Europe/London',
        target_time: '12:00',
      },
    },
    reasoning: {
      summary: `Reason ${date}`,
      confidence: 0.6,
      reasons: [],
    },
    day_intelligence: {
      final_score: score,
      action_type: 'business_launch',
      day_class: 'mixed',
      conflict: false,
      rating: 'Mixed / Proceed with Awareness',
      material_supportive_count: 0,
      material_caution_count: 0,
      basis: 'score_bands+evidence_conflict',
      evidence: [{ evidence_id: `ev.${date}`, kind: 'aspect' }],
      dimensions: {
        mapping_version: 'dimensions.v1-shadow',
        semantic_status: 'experimental_shadow',
        opportunity: { value: 55, status: 'scored' },
      },
      dimension_classification: {
        day_class: 'review',
        semantic_status: 'experimental_shadow',
        classifier_version: 'dimension_class.v3-shadow',
        classification_coverage: 0.2571,
      },
    },
  };
}

function monthBatchScores() {
  const scores: Record<string, ReturnType<typeof dayPayload>> = {};
  for (const date of julyDates()) {
    const day = Number(date.slice(-2));
    scores[date] = dayPayload(date, 60 + (day % 10));
  }
  return scores;
}

describe('Phase 3A calendar semantic cache parity', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-28T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('A/B: live miss then cache hit return equivalent scores, breakdowns, reasoning, and Day Intelligence', async () => {
    expect(CALENDAR_CACHE_STORES_DAY_INTELLIGENCE).toBe(true);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: monthBatchScores() }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const live = await fetchMonthScores(profile, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.keys(live.scores)).toHaveLength(31);
    expect(live.breakdowns['2026-07-01']).not.toBeNull();
    expect(live.reasoning['2026-07-01']?.summary).toBe('Reason 2026-07-01');
    expect(live.dayIntelligence['2026-07-01']?.dayClass).toBe('mixed');
    expect(
      live.dayIntelligence['2026-07-01']?.dimensionClassification
        ?.classifier_version
    ).toBe('dimension_class.v3-shadow');

    const cached = await fetchMonthScores(profile, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cached.scores).toEqual(live.scores);
    expect(cached.breakdowns).toEqual(live.breakdowns);
    expect(cached.reasoning).toEqual(live.reasoning);
    expect(cached.dayIntelligence).toEqual(live.dayIntelligence);
  });

  it('C/D/E/F: v3 classifier_version, experimental_shadow, dimensions, and Phase 2A class survive cache', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ scores: monthBatchScores() }),
      })
    );

    await fetchMonthScores(profile, 2026, 7);
    const hit = await fetchMonthScores(profile, 2026, 7);
    const di = hit.dayIntelligence['2026-07-15'];
    expect(di?.dimensionClassification?.classifier_version).toBe(
      'dimension_class.v3-shadow'
    );
    expect(di?.dimensionClassification?.semantic_status).toBe(
      'experimental_shadow'
    );
    expect(di?.dimensions?.mapping_version).toBe('dimensions.v1-shadow');
    expect(di?.dimensions?.semantic_status).toBe('experimental_shadow');
    expect(di?.dayClass).toBe('mixed');
    expect(di?.dimensionClassification?.day_class).toBe('review');
    expect(di?.evidence[0]?.evidence_id).toBe('ev.2026-07-15');
  });

  it('G/H: legacy numeric cache does not crash and refreshes from API', async () => {
    const dates = julyDates();
    const scores: Record<string, number> = {};
    for (const date of dates) scores[date] = 81;
    const input = normalizeCalendarScoringInput({
      birth_date: profile.birth_date,
      birth_time: profile.birth_time,
      birth_location: 'Tehran',
      birth_latitude: null,
      birth_longitude: null,
      evaluation_location: 'London',
      evaluation_latitude: 51.5074,
      evaluation_longitude: -0.1278,
      evaluation_timezone: 'Europe/London',
      house_system: 'placidus',
      zodiac: 'tropical',
      action_type: profile.action_type,
      year: 2026,
      month: 7,
      dates,
    });
    const fingerprint = fingerprintCalendarScoringInput(input);
    const key = monthCacheStorageKey(2026, 7, input.action_type, fingerprint);
    localStorage.setItem(
      key,
      JSON.stringify({
        version: CALENDAR_CACHE_VERSION,
        inputFingerprint: fingerprint,
        savedAt: Date.now(),
        dates,
        scores,
      })
    );
    expect(loadMonthCache(input)).toEqual(scores);
    expect(loadMonthCacheRecord(input)).toBeNull();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: monthBatchScores() }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchMonthScores(profile, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.dayIntelligence['2026-07-01']?.dimensionClassification
      ?.classifier_version).toBe('dimension_class.v3-shadow');
    const stored = JSON.parse(String(localStorage.getItem(key))) as {
      version: string;
      days: Record<string, CalendarCachedDay>;
    };
    expect(stored.version).toBe(CALENDAR_CACHE_CONTENT_VERSION);
    expect(stored.days['2026-07-01']?.dayIntelligence?.dayClass).toBe('mixed');
  });

  it('I: expired v3 content is not served', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: monthBatchScores() }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await fetchMonthScores(profile, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000 * 60 * 60 * 12 + 1);
    await fetchMonthScores(profile, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('J: action_type isolation does not reuse another activity’s Day Intelligence', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ scores: monthBatchScores() }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await fetchMonthScores(profile, 2026, 7);
    const other = { ...profile, action_type: 'rest_recovery' };
    await fetchMonthScores(other, 2026, 7);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('extractor output matches cached dayIntelligence for the same batch row', () => {
    const payload = dayPayload('2026-07-01', 61);
    const extracted = extractBatchDayIntelligence(payload);
    const days: Record<string, CalendarCachedDay> = {
      '2026-07-01': {
        score: 61,
        dayIntelligence: extracted,
      },
    };
    const input = {
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
      month: 7,
      dates: ['2026-07-01'],
    } as CalendarScoringInput;
    saveMonthCache(input, days);
    const loaded = loadMonthCacheRecord(input);
    expect(loaded?.days['2026-07-01']?.dayIntelligence).toEqual(extracted);
    expect(scoresFromCachedDays(loaded!.days)).toEqual({ '2026-07-01': 61 });
  });
});
