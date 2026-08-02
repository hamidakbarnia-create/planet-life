import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ftueTodayPath, markFtueComplete } from './ftue-storage';
import { getProfileRepository, resetProfileRepositoryForTests } from './profile';
import {
  hasLocalBirthProfile,
  resolvePostAuthPath,
  resolvePreparingCompletePath,
} from './ftue-routing';

const sampleProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_place: {
    name: 'New York, New York, United States',
    short: 'New York',
    lat: 40.7128,
    lon: -74.006,
  },
  action_type: 'business_launch',
  gender: 'prefer_not_to_say' as const,
};

describe('ftue-routing', () => {
  beforeEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
  });

  afterEach(() => {
    localStorage.clear();
    resetProfileRepositoryForTests();
  });

  it('detects incomplete profile', () => {
    expect(hasLocalBirthProfile()).toBe(false);
  });

  it('detects complete local profile via repository', () => {
    getProfileRepository().saveProfile(sampleProfile);
    expect(hasLocalBirthProfile()).toBe(true);
    expect(getProfileRepository().loadProfile()?.birth_place.short).toBe('New York');
  });

  it('does not globally block legacy profiles missing gender', () => {
    localStorage.setItem(
      'planet-life-birth-profile',
      JSON.stringify({
        birth_date: '1990-06-15',
        birth_time: '14:30',
        location: 'New York',
        action_type: 'business_launch',
      })
    );
    expect(hasLocalBirthProfile()).toBe(true);
    expect(resolvePostAuthPath()).toBe('/onboarding/preparing');
  });

  it('routes new users to profile onboarding', () => {
    expect(resolvePostAuthPath()).toBe('/profile?onboarding=1');
  });

  it('routes profile holders to preparing', () => {
    getProfileRepository().saveProfile({
      ...sampleProfile,
      birth_place: {
        name: 'Paris, Île-de-France, France',
        short: 'Paris',
        lat: 48.8566,
        lon: 2.3522,
      },
    });
    expect(resolvePostAuthPath()).toBe('/onboarding/preparing');
  });

  it('routes ftue-complete users to today', () => {
    markFtueComplete();
    expect(resolvePostAuthPath()).toBe(ftueTodayPath());
  });

  it('resolves preparing complete path with optional score error', () => {
    expect(resolvePreparingCompletePath()).toBe('/home');
    expect(resolvePreparingCompletePath({ scoreError: true })).toBe('/home?score_error=1');
  });
});
