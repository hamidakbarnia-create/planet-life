import type { UserLocation } from './user-locations';
import {
  parseProfileGender,
  type ProfileGender,
} from './profile/profile-gender';

export type { ProfileGender } from './profile/profile-gender';

export interface BirthProfile {
  birth_date: string;
  birth_time: string;
  /** Birth city — used only for natal chart identity */
  location: string;
  action_type: string;
  /**
   * First-class personalization trait (PD-2026-010).
   * Required for profile save/onboarding; never consumed by scoring/astrology engines.
   */
  gender?: ProfileGender;
  /** Where the user currently lives — used for calendar and default Ask timing */
  current_location?: UserLocation;
}

const STORAGE_KEY = 'planet-life-birth-profile';

const DEFAULT_PROFILE: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'New York',
  action_type: 'business_launch',
};

export function loadBirthProfile(): BirthProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BirthProfile;
    if (!parsed.birth_date || !parsed.birth_time || !parsed.location) return null;
    const gender = parseProfileGender(parsed.gender) ?? undefined;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      action_type: parsed.action_type || DEFAULT_PROFILE.action_type,
      gender,
      current_location: parsed.current_location,
    };
  } catch {
    return null;
  }
}

export function saveBirthProfile(profile: BirthProfile): void {
  if (typeof window === 'undefined') return;
  const gender = parseProfileGender(profile.gender) ?? undefined;
  const toStore: BirthProfile = {
    ...profile,
    ...(gender ? { gender } : {}),
  };
  if (!gender) {
    delete toStore.gender;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
}

export function getBirthProfile(): BirthProfile {
  return loadBirthProfile() ?? { ...DEFAULT_PROFILE };
}
