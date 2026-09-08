import { describe, expect, it, vi } from 'vitest';
import type { BirthProfile } from './birth-profile';
import { classifyAnalyzeFailure, PathfinderApiError } from './pathfinder-api';
import {
  executePathfinderAnalyze,
  PATHFINDER_FREE_CITY_KEY,
  PATHFINDER_PAGE_COPY,
} from '@/app/pathfinder/page';
import {
  canUseFreeTierAnalyze,
  isAnalyzeEligible,
  isAuthoritativeTimezoneName,
  isBestTimesEligible,
  isPolarCalculationRisk,
  normalizeLongitude,
  parseGeographicPoint,
  pathfinderAllowanceKey,
  selectedPointFromCitySearch,
  selectedPointFromGlobePick,
  selectedPointToApiTarget,
  withAuthoritativeTimezone,
} from './pathfinder-selection';

const profile = {
  birth_date: '1990-01-01',
  birth_time: '12:00',
  location: '51.5,-0.12',
} as BirthProfile;

const fallbackName = PATHFINDER_PAGE_COPY.en.selectedLocation;

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: (key: string) => data[key] ?? null,
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
    snapshot: () => ({ ...data }),
  };
}

describe('pathfinder selected-point contract', () => {
  it('keeps city search and raw globe points distinct', () => {
    const city = selectedPointFromCitySearch({
      short: 'London',
      name: 'London, United Kingdom',
      lat: 51.5074,
      lon: -0.1278,
      country: 'United Kingdom',
    });
    const globe = selectedPointFromGlobePick(51.5074, -0.1278, fallbackName);
    expect(city.source).toBe('city_search');
    expect(city.placeResolutionStatus).toBe('resolved');
    expect(city.displayName).toBe('London');
    expect(city.country).toBe('United Kingdom');
    expect(globe.source).toBe('globe_point');
    expect(globe.placeResolutionStatus).toBe('unresolved');
    expect(globe.displayName).toBe(fallbackName);
    expect(globe.country).toBeUndefined();
  });

  it('keeps ocean and polar picks without snapping or fabricating place data', () => {
    const ocean = selectedPointFromGlobePick(40, -30, fallbackName);
    const polar = selectedPointFromGlobePick(82.5, 15, fallbackName);
    expect(ocean).toMatchObject({
      source: 'globe_point',
      latitude: 40,
      longitude: -30,
      placeResolutionStatus: 'unresolved',
    });
    expect(ocean.country).toBeUndefined();
    expect(ocean.timezone).toBeUndefined();
    expect(ocean.displayName).toBe(fallbackName);
    expect(polar.latitude).toBe(82.5);
    expect(isPolarCalculationRisk(polar.latitude)).toBe(true);
  });

  it('normalizes longitude and rejects out-of-range latitude', () => {
    expect(normalizeLongitude(181)).toBe(-179);
    expect(normalizeLongitude(-0.1278)).toBe(-0.1278);
    expect(parseGeographicPoint(91, 0).ok).toBe(false);
    expect(() => selectedPointFromGlobePick(91, 0, fallbackName)).toThrow(/invalid_latitude/);
  });

  it('does not start Analyze when a selection is constructed', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    selectedPointFromCitySearch({ short: 'Dubai', name: 'Dubai', lat: 25.2, lon: 55.27 });
    selectedPointFromGlobePick(40, -30, fallbackName);
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('enables Analyze for unresolved ocean points only when a birth profile exists', () => {
    const ocean = selectedPointFromGlobePick(40, -30, fallbackName);
    expect(isAnalyzeEligible(ocean, true)).toBe(true);
    expect(isAnalyzeEligible(ocean, false)).toBe(false);
  });

  it('enables Best Times only for an authoritative civil timezone', () => {
    const ocean = selectedPointFromGlobePick(40, -30, fallbackName);
    expect(isAuthoritativeTimezoneName('Etc/GMT+2')).toBe(false);
    expect(isAuthoritativeTimezoneName('Europe/London')).toBe(true);
    expect(isBestTimesEligible(withAuthoritativeTimezone(ocean, 'Etc/GMT+2'), true)).toBe(false);
    expect(isBestTimesEligible(withAuthoritativeTimezone(ocean, 'Europe/London'), true)).toBe(true);
  });

  it('uses one selected-point as the API target', () => {
    const point = selectedPointFromGlobePick(40, -30, fallbackName);
    expect(selectedPointToApiTarget(point)).toEqual({
      short: fallbackName,
      name: fallbackName,
      lat: 40,
      lon: -30,
    });
  });
});

describe('pathfinder Analyze allowance', () => {
  it('does not write free-tier storage on failed Analyze', async () => {
    const storage = memoryStorage();
    const result = await executePathfinderAnalyze({
      point: selectedPointFromGlobePick(82, 10, fallbackName),
      profile,
      isPaidMember: false,
      storage,
      lang: 'en',
      unsupportedCalculation: PATHFINDER_PAGE_COPY.en.unsupportedCalculation,
      fallbackError: PATHFINDER_PAGE_COPY.en.error,
      fetchRelocation: async () => {
        throw new PathfinderApiError(500, 'swisseph.houses: error', 'failed');
      },
    });
    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.allowanceConsumed).toBe(false);
      expect(result.message).toBe(PATHFINDER_PAGE_COPY.en.unsupportedCalculation);
    }
    expect(storage.getItem(PATHFINDER_FREE_CITY_KEY)).toBeNull();
  });

  it('writes free-tier storage only after successful Analyze', async () => {
    const storage = memoryStorage();
    const ocean = selectedPointFromGlobePick(40, -30, fallbackName);
    expect(canUseFreeTierAnalyze(ocean, false, null)).toBe(true);
    const result = await executePathfinderAnalyze({
      point: ocean,
      profile,
      isPaidMember: false,
      storage,
      lang: 'en',
      unsupportedCalculation: PATHFINDER_PAGE_COPY.en.unsupportedCalculation,
      fallbackError: PATHFINDER_PAGE_COPY.en.error,
      fetchRelocation: async () => ({
        target: { label: ocean.displayName, location: '40,-30', latitude: 40, longitude: -30 },
        angles: { AC: 1, DC: 1, MC: 1, IC: 1 },
        active_lines: [],
        effects: [],
      }),
    });
    expect(result.status).toBe('success');
    expect(storage.getItem(PATHFINDER_FREE_CITY_KEY)).toBe(pathfinderAllowanceKey(ocean));
  });

  it('does not invent Whole Sign copy for unsupported-calculation errors', () => {
    const polar500 = classifyAnalyzeFailure(500, 'swisseph.houses: error');
    const placidus = classifyAnalyzeFailure(
      422,
      'Placidus houses cannot be calculated reliably for this latitude. Please switch to Whole Sign.'
    );
    expect(polar500.kind).toBe('unsupported_calculation');
    expect(placidus.kind).toBe('unsupported_calculation');
    expect(PATHFINDER_PAGE_COPY.en.unsupportedCalculation).not.toMatch(/Whole Sign|swisseph/i);
    expect(PATHFINDER_PAGE_COPY.en.polarShippingBlocker).not.toMatch(/Whole Sign/i);
  });
});
