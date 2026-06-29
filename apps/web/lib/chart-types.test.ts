import { describe, expect, it } from 'vitest';
import { RAFSANJAN_CHART } from './chart-fixtures';
import {
  assertNoNaNScreenAngles,
  computeScreenAngles,
  displayLongitude,
  normalizeDegrees,
  validateChartResponse,
  type ChartApiResponse,
  type ChartData,
} from './chart-types';
import { projectEclipticLongitude } from './natal-wheel';

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
    latitude: 30.402184,
    longitude: 55.994178,
    timezone: 'Asia/Tehran',
    utc_datetime: '1982-02-25 02:17:00',
    local_datetime: '1982-02-25T05:47:00+03:30',
    julian_day: 2445025.59513889,
    house_system: 'placidus',
    zodiac: 'tropical',
    node_type: 'mean',
    coordinate_source: 'selected_city_coordinates',
    ephemeris_engine: 'Swiss Ephemeris',
    timezone_source: 'IANA',
    ...overrides,
  };
}

describe('displayLongitude (legacy uniform — dev comparison only)', () => {
  it('places ASC at 270° under uniform rotation', () => {
    const asc = 324.6;
    expect(displayLongitude(asc, asc)).toBeCloseTo(270, 5);
  });

  it('places DSC at 90° under uniform rotation', () => {
    const asc = 324.6;
    expect(displayLongitude(asc + 180, asc)).toBeCloseTo(90, 5);
  });

  it('normalizes wrap-around', () => {
    expect(normalizeDegrees(370)).toBe(10);
    expect(normalizeDegrees(-10)).toBe(350);
  });
});

describe('computeScreenAngles (quadrant projection)', () => {
  const chart: ChartData = RAFSANJAN_CHART;

  it('fixes cardinal angles for Rafsanjan', () => {
    const angles = computeScreenAngles(chart);
    expect(angles.ascendant).toBeCloseTo(270, 5);
    expect(angles.midheaven).toBeCloseTo(0, 5);
    expect(angles.ic).toBeCloseTo(180, 5);
    expect(angles.descendant).toBeCloseTo(90, 5);
  });

  it('projects planets through quadrant model', () => {
    const angles = computeScreenAngles(chart);
    expect(angles.sun).toBeCloseTo(
      projectEclipticLongitude(chart.planets.sun.longitude, chart),
      5
    );
    expect(angles.moon).toBeCloseTo(
      projectEclipticLongitude(chart.planets.moon.longitude, chart),
      5
    );
    expect(angles.mercury).toBeCloseTo(
      projectEclipticLongitude(chart.planets.mercury.longitude, chart),
      5
    );
    expect(angles.venus).toBeCloseTo(
      projectEclipticLongitude(chart.planets.venus.longitude, chart),
      5
    );
  });

  it('uses quadrant projection for house cusps', () => {
    const angles = computeScreenAngles(chart);
    chart.houses.forEach((cusp, i) => {
      expect(angles[`house_${i + 1}`]).toBeCloseTo(
        projectEclipticLongitude(cusp, chart),
        5
      );
    });
  });

  it('produces no NaN screen angles', () => {
    expect(assertNoNaNScreenAngles(chart)).toBe(true);
    const angles = computeScreenAngles(chart);
    Object.values(angles).forEach((a) => {
      expect(Number.isNaN(a)).toBe(false);
      expect(Number.isFinite(a)).toBe(true);
    });
  });
});

describe('validateChartResponse', () => {
  it('accepts a complete API response', () => {
    const result = validateChartResponse(minimalValidResponse(), 'Rafsanjan');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.houses).toHaveLength(12);
      expect(result.data.timezone).toBe('Asia/Tehran');
    }
  });

  it('rejects missing ascendant', () => {
    const result = validateChartResponse(
      minimalValidResponse({ ascendant: undefined }),
      'Rafsanjan'
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('ascendant'))).toBe(true);
    }
  });

  it('rejects missing houses', () => {
    const result = validateChartResponse(
      minimalValidResponse({ houses: [1, 2, 3] }),
      'Rafsanjan'
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('houses'))).toBe(true);
    }
  });

  it('rejects missing timezone and UTC', () => {
    const result = validateChartResponse(
      minimalValidResponse({ timezone: '', utc_datetime: '' }),
      'Rafsanjan'
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });
});
