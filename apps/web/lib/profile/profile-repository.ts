import type { BirthProfile } from '../birth-profile';
import { parseProfileGender } from './profile-gender';
import type { ProfileDraft, ProfileRecord } from './profile-types';

export interface ProfileRepository {
  loadDraft(): ProfileDraft | null;
  saveDraft(draft: ProfileDraft): void;
  clearDraft(): void;
  loadProfile(): ProfileRecord | null;
  saveProfile(record: ProfileRecord): void;
}

/** Sprint 2 replaces this with an API-backed repository. */
export function createProfileRepository(): ProfileRepository {
  return new LocalProfileRepository();
}

const DRAFT_KEY = 'planet-life-profile-draft';
const PROFILE_KEY = 'planet-life-birth-profile';
const PLACE_KEY = 'planet-life-birth-place';
const NAME_KEY = 'planet-life-profile-name';

class LocalProfileRepository implements ProfileRepository {
  loadDraft(): ProfileDraft | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw) as ProfileDraft;
      const gender = parseProfileGender(draft.gender);
      return {
        ...draft,
        gender: gender ?? '',
      };
    } catch {
      return null;
    }
  }

  saveDraft(draft: ProfileDraft): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, updated_at: Date.now() })
    );
  }

  clearDraft(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DRAFT_KEY);
  }

  loadProfile(): ProfileRecord | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      const placeRaw = localStorage.getItem(PLACE_KEY);
      if (!raw) return null;
      const legacy = JSON.parse(raw) as BirthProfile;
      if (!legacy.birth_date || !legacy.birth_time || !legacy.location) return null;

      let birth_place = placeRaw
        ? (JSON.parse(placeRaw) as ProfileRecord['birth_place'])
        : null;

      if (!birth_place) {
        birth_place = {
          name: legacy.location,
          short: legacy.location,
          lat: 0,
          lon: 0,
        };
      }

      const name = localStorage.getItem(NAME_KEY) || undefined;
      const gender = parseProfileGender(legacy.gender) ?? undefined;
      return {
        birth_date: legacy.birth_date,
        birth_time: legacy.birth_time,
        birth_place,
        name: name || undefined,
        action_type: legacy.action_type || 'business_launch',
        ...(gender ? { gender } : {}),
      };
    } catch {
      return null;
    }
  }

  saveProfile(record: ProfileRecord): void {
    if (typeof window === 'undefined') return;

    let current_location: BirthProfile['current_location'];
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const existing = JSON.parse(raw) as BirthProfile;
        current_location = existing.current_location;
      }
    } catch {
      // ignore corrupt existing blob
    }

    const gender = parseProfileGender(record.gender) ?? undefined;
    const legacy: BirthProfile = {
      birth_date: record.birth_date,
      birth_time: record.birth_time,
      location: record.birth_place.short,
      action_type: record.action_type,
      ...(gender ? { gender } : {}),
      ...(current_location ? { current_location } : {}),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(legacy));
    localStorage.setItem(PLACE_KEY, JSON.stringify(record.birth_place));
    if (record.name) {
      localStorage.setItem(NAME_KEY, record.name);
    } else {
      localStorage.removeItem(NAME_KEY);
    }
  }
}

let singleton: ProfileRepository | null = null;

export function getProfileRepository(): ProfileRepository {
  if (!singleton) singleton = createProfileRepository();
  return singleton;
}

/** Test-only reset */
export function resetProfileRepositoryForTests(): void {
  singleton = null;
}
