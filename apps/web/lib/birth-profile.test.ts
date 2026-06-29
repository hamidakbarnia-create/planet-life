import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadBirthProfile,
  saveBirthProfile,
  type BirthProfile,
} from './birth-profile';
import {
  clearCalendarScoreCaches,
  locationLabel,
  resolveCalendarEvaluationLocation,
  saveCalendarEvaluationOverride,
} from './user-locations';

const STORAGE_KEY = 'planet-life-birth-profile';

const LONDON: NonNullable<BirthProfile['current_location']> = {
  city: 'Greater London',
  country: 'United Kingdom',
  latitude: 51.5074,
  longitude: -0.1278,
  timezone: 'Europe/London',
  coordinate_source: 'selected_city_coordinates',
  confirmed: true,
};

const SYDNEY: NonNullable<BirthProfile['current_location']> = {
  city: 'Sydney',
  country: 'Australia',
  latitude: -33.8688,
  longitude: 151.2093,
  timezone: 'Australia/Sydney',
  coordinate_source: 'selected_city_coordinates',
  confirmed: true,
};

function baseProfile(
  current_location?: BirthProfile['current_location']
): BirthProfile {
  return {
    birth_date: '1982-02-25',
    birth_time: '05:47',
    location: 'Rafsanjan',
    action_type: 'business_launch',
    ...(current_location ? { current_location } : {}),
  };
}

describe('birth-profile current_location persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    saveCalendarEvaluationOverride(null);
    clearCalendarScoreCaches();
  });

  it('persists London then Sydney after reload', () => {
    saveBirthProfile(baseProfile(LONDON));
    expect(loadBirthProfile()?.current_location?.city).toBe('Greater London');

    saveBirthProfile(baseProfile(SYDNEY));
    const reloaded = loadBirthProfile();
    expect(reloaded?.current_location?.city).toBe('Sydney');
    expect(reloaded?.current_location?.country).toBe('Australia');
    expect(reloaded?.current_location?.latitude).toBe(-33.8688);
    expect(reloaded?.current_location?.timezone).toBe('Australia/Sydney');
    expect(reloaded?.current_location?.confirmed).toBe(true);
  });

  it('calendar reads Sydney from profile, not stale London override', () => {
    saveBirthProfile(baseProfile(SYDNEY));
    saveCalendarEvaluationOverride(LONDON);

    const profile = loadBirthProfile()!;
    const evalLoc = resolveCalendarEvaluationLocation(profile);
    expect(evalLoc?.city).toBe('Sydney');
    expect(locationLabel(evalLoc!)).toBe('Sydney, Australia');
  });

  it('stores raw localStorage object with current_location fields', () => {
    saveBirthProfile(baseProfile(SYDNEY));
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as BirthProfile;
    expect(raw.current_location).toMatchObject({
      city: 'Sydney',
      country: 'Australia',
      latitude: -33.8688,
      longitude: 151.2093,
      timezone: 'Australia/Sydney',
      confirmed: true,
    });
  });
});
