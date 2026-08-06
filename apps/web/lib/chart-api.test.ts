import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchValidatedResultChart } from './chart-api';
import type { ProfileRecord } from './profile/profile-types';
import type { ChartApiResponse } from './chart-types';

const sampleProfile: ProfileRecord = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'New York, New York, United States',
    short: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
  name: 'Alex',
  action_type: 'business_launch',
};

function minimalValidResponse(overrides: Partial<ChartApiResponse> = {}): ChartApiResponse {
  const planets: ChartApiResponse['planets'] = {};
  for (const name of [
    'sun', 'moon', 'mercury', 'venus', 'mars',
    'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'north_node',
  ]) {
    planets![name] = {
      longitude: 120,
      sign: 5,
      degree: 0,
      house: 1,
      retrograde: false,
    };
  }
  return {
    planets,
    ascendant: 324.58,
    midheaven: 246.71,
    houses: [
      324.58, 6.38, 40.28, 66.71, 89.96, 114.16,
      144.58, 186.38, 220.28, 246.71, 269.96, 294.16,
    ],
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    utc_datetime: '1990-06-15 18:30:00',
    local_datetime: '1990-06-15T14:30:00-04:00',
    julian_day: 2448058.270833,
    house_system: 'placidus',
    zodiac: 'tropical',
    node_type: 'mean',
    coordinate_source: 'selected_city_coordinates',
    ephemeris_engine: 'Swiss Ephemeris',
    timezone_source: 'IANA',
    ...overrides,
  };
}

describe('fetchValidatedResultChart', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when profile birth fields are missing', async () => {
    const result = await fetchValidatedResultChart({
      ...sampleProfile,
      birth_date: '',
    });
    expect(result).toBeNull();
  });

  it('returns null when the API responds with an error detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ detail: 'Chart unavailable' }),
      })
    );

    const result = await fetchValidatedResultChart(sampleProfile);
    expect(result).toBeNull();
  });

  it('returns null when chart data is incomplete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ planets: { sun: { longitude: 1 } } }),
      })
    );

    const result = await fetchValidatedResultChart(sampleProfile);
    expect(result).toBeNull();
  });

  it('returns validated chart data when the API response is complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => minimalValidResponse(),
      })
    );

    const result = await fetchValidatedResultChart(sampleProfile);
    expect(result).not.toBeNull();
    expect(Object.keys(result!.planets)).toHaveLength(11);
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const result = await fetchValidatedResultChart(sampleProfile);
    expect(result).toBeNull();
  });
});
