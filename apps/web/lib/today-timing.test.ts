import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { BirthProfile } from './birth-profile';

vi.mock('./calendar-scores', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./calendar-scores')>();
  return {
    ...actual,
    fetchDayScoreDetail: vi.fn(),
    fetchHourlyScores: vi.fn(),
  };
});

import { fetchDayScoreDetail, fetchHourlyScores } from './calendar-scores';
import { loadTodayTiming } from './today-timing';

const profile: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'Tehran',
  action_type: 'business_launch',
  current_location: {
    city: 'Tehran',
    latitude: 35.6892,
    longitude: 51.389,
    timezone: 'Asia/Tehran',
    coordinate_source: 'selected_city_coordinates',
    confirmed: true,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loadTodayTiming', () => {
  it('surfaces producer ScoreReasoning.summary when present on day detail', async () => {
    vi.mocked(fetchDayScoreDetail).mockResolvedValue({
      score: 72,
      breakdown: null,
      reasoning: {
        summary: 'Producer day summary.',
        confidence: 0.6,
        reasons: [],
      },
    // Runtime analyze payload includes reasoning; public fetch type omits it.
    } as unknown as Awaited<ReturnType<typeof fetchDayScoreDetail>>);

    vi.mocked(fetchHourlyScores).mockResolvedValue([
      { hour: 9, time: '9:00', score: 88, band: 'green' },
      { hour: 15, time: '15:00', score: 22, band: 'red' },
    ]);

    const result = await loadTodayTiming(profile, '2026-07-29', 'en');

    expect(result.score).toBe(72);
    expect(result.reasoning?.summary).toBe('Producer day summary.');
    expect(result.bestHour?.hour).toBe(9);
    expect(result.riskHour?.hour).toBe(15);
  });

  it('returns null reasoning when producer did not include it', async () => {
    vi.mocked(fetchDayScoreDetail).mockResolvedValue({
      score: 55,
      breakdown: null,
    });
    vi.mocked(fetchHourlyScores).mockResolvedValue([]);

    const result = await loadTodayTiming(profile, '2026-07-29', 'en');
    expect(result.reasoning).toBeNull();
    expect(result.bestHour).toBeNull();
    expect(result.riskHour).toBeNull();
  });
});
