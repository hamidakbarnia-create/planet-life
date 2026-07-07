import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadBirthProfile, saveBirthProfile } from './birth-profile';
import {
  ftueTodayPath,
  markFtueComplete,
} from './ftue-storage';
import { hasLocalBirthProfile, resolvePostAuthPath } from './ftue-routing';

describe('ftue-routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('detects incomplete profile', () => {
    expect(hasLocalBirthProfile()).toBe(false);
  });

  it('detects complete local profile', () => {
    saveBirthProfile({
      birth_date: '1990-06-15',
      birth_time: '14:30',
      location: 'New York',
      action_type: 'business_launch',
    });
    expect(hasLocalBirthProfile()).toBe(true);
    expect(loadBirthProfile()?.location).toBe('New York');
  });

  it('routes new users to profile onboarding', () => {
    expect(resolvePostAuthPath()).toBe('/profile?onboarding=1');
  });

  it('routes profile holders to preparing', () => {
    saveBirthProfile({
      birth_date: '1990-06-15',
      birth_time: '14:30',
      location: 'Paris',
      action_type: 'business_launch',
    });
    expect(resolvePostAuthPath()).toBe('/onboarding/preparing');
  });

  it('routes ftue-complete users to today', () => {
    markFtueComplete();
    expect(resolvePostAuthPath()).toBe(ftueTodayPath());
  });
});
