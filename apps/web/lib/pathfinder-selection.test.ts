import { describe, expect, it, vi } from 'vitest';
import type { BirthProfile } from './birth-profile';
import { classifyAnalyzeFailure, PathfinderApiError } from './pathfinder-api';
import {
  executePathfinderAnalyze,
  PATHFINDER_FREE_CITY_KEY,
  PATHFINDER_PAGE_COPY,
} from '@/app/pathfinder/page';
import { nextSelectionForFilterControl } from './pathfinder-geometry-demo';
import {
  canUseFreeTierAnalyze,
  isAnalyzeEligible,
  isAuthoritativeTimezoneName,
  isBestTimesEligible,
  isPolarCalculationRisk,
  normalizeLongitude,
  parseGeographicPoint,
  pathfinderAllowanceKey,
  acceptTimezoneEnrichment,
  enrichSelectedPointTimezone,
  selectedPointFromCitySearch,
  selectedPointFromGlobePick,
  selectedPointToApiTarget,
  withAuthoritativeTimezone,
  type TimezoneLookup,
} from './pathfinder-selection';
import {
  searchQueryAfterCommit,
  searchQueryAfterLocaleChange,
  searchQueryMatchesSelection,
  visibleSelectionLabel,
} from './pathfinder-globe-projection';

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
    expect(isAuthoritativeTimezoneName('Etc/Unknown')).toBe(false);
    expect(isAuthoritativeTimezoneName('UTC')).toBe(false);
    expect(isAuthoritativeTimezoneName('GMT')).toBe(false);
    expect(isAuthoritativeTimezoneName('UTC+03:30')).toBe(false);
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

describe('pathfinder timezone enrichment', () => {
  const tehranHit = {
    short: 'Tehran',
    name: 'Tehran, Iran',
    lat: 35.6893,
    lon: 51.3896,
    country: 'Iran',
    timezone: 'Asia/Tehran',
  };
  const londonHit = {
    short: 'London',
    name: 'London, United Kingdom',
    lat: 51.5074,
    lon: -0.1278,
    country: 'United Kingdom',
  };
  const dubaiHit = {
    short: 'Dubai',
    name: 'Dubai, United Arab Emirates',
    lat: 25.2048,
    lon: 55.2708,
    country: 'United Arab Emirates',
  };

  function authoritativePreviewLookup(expected: Record<string, string>): TimezoneLookup {
    return async (point) => {
      const key = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
      return expected[key];
    };
  }

  it('preserves Tehran city-search coordinates and resolves Asia/Tehran from the preview lookup', async () => {
    const point = selectedPointFromCitySearch(tehranHit);
    expect(point.timezone).toBeUndefined();
    expect(point.latitude).toBe(35.6893);
    expect(point.longitude).toBe(51.3896);
    expect(point.displayName).toBe('Tehran');
    const enriched = await enrichSelectedPointTimezone(
      point,
      authoritativePreviewLookup({ '35.6893,51.3896': 'Asia/Tehran' })
    );
    expect(enriched.latitude).toBe(35.6893);
    expect(enriched.longitude).toBe(51.3896);
    expect(enriched.timezone).toBe('Asia/Tehran');
    expect(isBestTimesEligible(enriched, true)).toBe(true);
  });

  it('resolves a verified London city-search result to Europe/London', async () => {
    const point = selectedPointFromCitySearch(londonHit);
    expect(point.timezone).toBeUndefined();
    const enriched = await enrichSelectedPointTimezone(
      point,
      authoritativePreviewLookup({ '51.5074,-0.1278': 'Europe/London' })
    );
    expect(enriched.latitude).toBe(51.5074);
    expect(enriched.longitude).toBe(-0.1278);
    expect(enriched.timezone).toBe('Europe/London');
  });

  it('resolves a verified Dubai city-search result to Asia/Dubai', async () => {
    const point = selectedPointFromCitySearch(dubaiHit);
    expect(point.timezone).toBeUndefined();
    const enriched = await enrichSelectedPointTimezone(
      point,
      authoritativePreviewLookup({ '25.2048,55.2708': 'Asia/Dubai' })
    );
    expect(enriched.latitude).toBe(25.2048);
    expect(enriched.longitude).toBe(55.2708);
    expect(enriched.timezone).toBe('Asia/Dubai');
  });

  it('keeps an arbitrary ocean point ineligible for Best Times without a civil timezone', async () => {
    const ocean = selectedPointFromGlobePick(40, -30, fallbackName);
    const unresolved = await enrichSelectedPointTimezone(ocean, async () => undefined);
    const offsetOnly = await enrichSelectedPointTimezone(ocean, async () => 'Etc/GMT+2');
    expect(unresolved.timezone).toBeUndefined();
    expect(offsetOnly.timezone).toBeUndefined();
    expect(isBestTimesEligible(unresolved, true)).toBe(false);
    expect(isBestTimesEligible(offsetOnly, true)).toBe(false);
    expect(ocean.latitude).toBe(40);
    expect(ocean.longitude).toBe(-30);
  });

  it('does not let a stale enrichment overwrite a newer selection', async () => {
    let currentSeq = 0;
    const tehran = selectedPointFromCitySearch(tehranHit);
    const london = selectedPointFromCitySearch(londonHit);
    currentSeq = 1;
    const stale = enrichSelectedPointTimezone(tehran, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'Asia/Tehran';
    });
    currentSeq = 2;
    const latest = await enrichSelectedPointTimezone(
      london,
      authoritativePreviewLookup({ '51.5074,-0.1278': 'Europe/London' })
    );
    const staleResult = await stale;
    expect(acceptTimezoneEnrichment(currentSeq, 1)).toBe(false);
    expect(acceptTimezoneEnrichment(currentSeq, 2)).toBe(true);
    expect(latest.timezone).toBe('Europe/London');
    expect(staleResult.timezone).toBe('Asia/Tehran');
  });

  it('keeps failed enrichment explicit and does not fabricate a timezone', async () => {
    const point = selectedPointFromCitySearch(tehranHit);
    const failed = await enrichSelectedPointTimezone(point, async () => {
      throw new Error('Location preview backend unreachable');
    });
    expect(failed.timezone).toBeUndefined();
    expect(failed.latitude).toBe(35.6893);
    expect(failed.longitude).toBe(51.3896);
    expect(isBestTimesEligible(failed, true)).toBe(false);
  });

  it('does not rerun or clear timezone when line selection or filtering changes', async () => {
    const lookup = vi.fn(async () => 'Asia/Tehran');
    const point = await enrichSelectedPointTimezone(selectedPointFromCitySearch(tehranHit), lookup);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(nextSelectionForFilterControl(null, 'MC')).toBe('MC');
    expect(nextSelectionForFilterControl('MC', 'all')).toBeNull();
    expect(point.timezone).toBe('Asia/Tehran');
    expect(point.latitude).toBe(35.6893);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(isBestTimesEligible(point, true)).toBe(true);
  });

  it('clears leftover city search text after an arbitrary globe pick', () => {
    expect(searchQueryAfterCommit('city_search', 'Dubai')).toBe('Dubai');
    expect(searchQueryAfterCommit('globe_point')).toBe('');
    expect(
      searchQueryMatchesSelection('Dubai', selectedPointFromGlobePick(7.03, -63.38, fallbackName))
    ).toBe(false);
  });

  it('keeps Dubai search, marker contract and timezone aligned after a city commit', async () => {
    const dubai = selectedPointFromCitySearch({
      short: 'Dubai',
      name: 'Dubai, United Arab Emirates',
      lat: 25.0743,
      lon: 55.1886,
      country: 'United Arab Emirates',
    });
    const query = searchQueryAfterCommit('city_search', dubai.displayName);
    const enriched = await enrichSelectedPointTimezone(
      dubai,
      authoritativePreviewLookup({ '25.0743,55.1886': 'Asia/Dubai' })
    );
    expect(query).toBe('Dubai');
    expect(searchQueryMatchesSelection(query, enriched)).toBe(true);
    expect(enriched.latitude).toBe(25.0743);
    expect(enriched.longitude).toBe(55.1886);
    expect(enriched.timezone).toBe('Asia/Dubai');
  });

  it('does not change coordinates or timezone when the interface locale changes', () => {
    const point = withAuthoritativeTimezone(
      selectedPointFromGlobePick(7.0311, -63.3812, PATHFINDER_PAGE_COPY.en.selectedLocation),
      'America/Caracas'
    );
    expect(visibleSelectionLabel(point, PATHFINDER_PAGE_COPY.fa.selectedLocation)).toBe(
      PATHFINDER_PAGE_COPY.fa.selectedLocation
    );
    expect(visibleSelectionLabel(point, PATHFINDER_PAGE_COPY.ar.selectedLocation)).toBe(
      PATHFINDER_PAGE_COPY.ar.selectedLocation
    );
    expect(searchQueryAfterLocaleChange('Dubai', point)).toBe('');
    expect(point.latitude).toBe(7.0311);
    expect(point.longitude).toBe(-63.3812);
    expect(point.timezone).toBe('America/Caracas');
  });
});
