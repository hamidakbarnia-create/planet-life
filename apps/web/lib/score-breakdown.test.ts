import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  extractAnalyzeScoreBreakdown,
  extractHourlyScoreBreakdown,
  mapComponentBreakdown,
  type RawComponentBreakdown,
} from './score-breakdown';

const VALID_RAW: RawComponentBreakdown = {
  aspect_score: 7.61,
  natal_house_bonus: 0,
  transit_house_score: 6.05,
  transit_angular_score: -0.21,
  location_component_score: 5.84,
  retrograde_penalty: 0,
  final_score: 63,
  location_mode: 'currentLiving',
  calculated_for: 'London, United Kingdom',
  resolved_local_datetime: '2026-06-15T12:00:00+01:00',
  resolved_utc_datetime: '2026-06-15T11:00:00Z',
  timezone: 'Europe/London',
  target_time: '12:00',
};

describe('mapComponentBreakdown', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('maps snake_case API fields to camelCase ScoreBreakdown', () => {
    const result = mapComponentBreakdown(VALID_RAW);
    expect(result).toEqual({
      aspectScore: 7.61,
      natalHouseBonus: 0,
      transitHouseScore: 6.05,
      transitAngularScore: -0.21,
      locationComponentScore: 5.84,
      retrogradePenalty: 0,
      finalScore: 63,
      locationMode: 'currentLiving',
      calculatedFor: 'London, United Kingdom',
      resolvedLocalDatetime: '2026-06-15T12:00:00+01:00',
      resolvedUtcDatetime: '2026-06-15T11:00:00Z',
      timezone: 'Europe/London',
      targetTime: '12:00',
    });
  });

  it('returns null when component_breakdown is missing', () => {
    expect(mapComponentBreakdown(undefined)).toBeNull();
    expect(mapComponentBreakdown(null)).toBeNull();
    expect(extractAnalyzeScoreBreakdown({})).toBeNull();
    expect(extractHourlyScoreBreakdown({ score: 70 })).toBeNull();
  });

  it('returns null when location component sum is invalid', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const invalid = {
      ...VALID_RAW,
      location_component_score: 99,
    };
    expect(mapComponentBreakdown(invalid)).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('does not throw for malformed raw input', () => {
    expect(mapComponentBreakdown({ aspect_score: 'bad' })).toBeNull();
    expect(mapComponentBreakdown([])).toBeNull();
  });
});

describe('extractAnalyzeScoreBreakdown', () => {
  it('extracts ask/electional breakdown from strategic layer', () => {
    const data = {
      executive: { score: 63 },
      strategic: { component_breakdown: VALID_RAW },
    };
    const breakdown = extractAnalyzeScoreBreakdown(data);
    expect(breakdown?.locationMode).toBe('currentLiving');
    expect(breakdown?.finalScore).toBe(63);
  });

  it('extracts property breakdown with targetSubject mode', () => {
    const propertyRaw = {
      ...VALID_RAW,
      location_mode: 'targetSubject',
      calculated_for: 'New York, United States',
    };
    const breakdown = extractAnalyzeScoreBreakdown({
      strategic: { component_breakdown: propertyRaw },
    });
    expect(breakdown?.locationMode).toBe('targetSubject');
    expect(breakdown?.calculatedFor).toBe('New York, United States');
  });
});

describe('extractHourlyScoreBreakdown', () => {
  it('maps each hourly entry independently', () => {
    const noon = extractHourlyScoreBreakdown({
      score: 63,
      component_breakdown: VALID_RAW,
    });
    const other = extractHourlyScoreBreakdown({
      score: 58,
      component_breakdown: {
        ...VALID_RAW,
        target_time: '03:00',
        final_score: 58,
        transit_house_score: 1.0,
        transit_angular_score: 0.5,
        location_component_score: 1.5,
      },
    });

    expect(noon?.targetTime).toBe('12:00');
    expect(other?.targetTime).toBe('03:00');
    expect(other?.finalScore).toBe(58);
    expect(other?.locationComponentScore).toBe(1.5);
  });
});
