import { describe, expect, it } from 'vitest';
import type { BirthProfile } from './birth-profile';
import {
  buildScoringLocationPayload,
  locationLabel,
  requiresTargetLocation,
  resolveCalendarEvaluationLocation,
  resolveEvaluationLocation,
  currentLocationNeedsConfirm,
} from './user-locations';

const RAF_PROFILE: BirthProfile = {
  birth_date: '1982-02-25',
  birth_time: '05:47',
  location: 'Rafsanjan',
  action_type: 'contract_signing',
  current_location: {
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278,
    confirmed: true,
    coordinate_source: 'selected_city_coordinates',
  },
};

describe('user-locations', () => {
  it('keeps birth and current locations separate', () => {
    expect(RAF_PROFILE.location).toBe('Rafsanjan');
    expect(RAF_PROFILE.current_location?.city).toBe('London');
  });

  it('defaults evaluation to confirmed current living location', () => {
    const loc = resolveEvaluationLocation(RAF_PROFILE);
    expect(loc?.city).toBe('London');
    expect(locationLabel(loc!)).toBe('London, United Kingdom');
  });

  it('uses target location when provided for Ask', () => {
    const nyc = {
      city: 'New York',
      country: 'United States',
      latitude: 40.7128,
      longitude: -74.006,
      confirmed: true,
    };
    const loc = resolveEvaluationLocation(RAF_PROFILE, nyc);
    expect(loc?.city).toBe('New York');
  });

  it('builds scoring payload with birth + evaluation coords', () => {
    const payload = buildScoringLocationPayload(RAF_PROFILE);
    expect(payload?.location).toBe('Rafsanjan');
    expect(payload?.evaluation_location).toBe('London, United Kingdom');
    expect(payload?.evaluation_latitude).toBe(51.5074);
  });

  it('builds NYC property payload separately from birth city', () => {
    const nyc = {
      city: 'New York',
      country: 'United States',
      latitude: 40.7128,
      longitude: -74.006,
      confirmed: true,
    };
    const payload = buildScoringLocationPayload(RAF_PROFILE, nyc);
    expect(payload?.location).toBe('Rafsanjan');
    expect(payload?.evaluation_location).toBe('New York, United States');
    expect(payload?.evaluation_latitude).toBe(40.7128);
  });

  it('returns null when no current location and no override', () => {
    const bare: BirthProfile = {
      birth_date: '1982-02-25',
      birth_time: '05:47',
      location: 'Rafsanjan',
      action_type: 'contract_signing',
    };
    expect(buildScoringLocationPayload(bare)).toBeNull();
    expect(resolveCalendarEvaluationLocation(bare)).toBeNull();
  });

  it('flags travel module as target-location required', () => {
    expect(requiresTargetLocation('travel')).toBe(true);
    expect(requiresTargetLocation('business')).toBe(false);
  });

  it('requires re-confirm when changing from London to Sydney', () => {
    expect(
      currentLocationNeedsConfirm(
        { short: 'Sydney', lat: -33.8688, lon: 151.2093 },
        RAF_PROFILE.current_location!
      )
    ).toBe(true);
    expect(
      currentLocationNeedsConfirm(
        { short: 'London', lat: 51.5074, lon: -0.1278 },
        RAF_PROFILE.current_location!
      )
    ).toBe(false);
  });

  it('calendar prefers profile current_location over stale override', () => {
    const withOverride = {
      ...RAF_PROFILE,
      current_location: {
        city: 'Sydney',
        country: 'Australia',
        latitude: -33.8688,
        longitude: 151.2093,
        confirmed: true,
      },
    };
    localStorage.setItem(
      'planet-life-calendar-evaluation-location',
      JSON.stringify({
        city: 'Greater London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        confirmed: true,
      })
    );
    const evalLoc = resolveCalendarEvaluationLocation(withOverride);
    expect(evalLoc?.city).toBe('Sydney');
  });
});
