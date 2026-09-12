import { describe, expect, it } from 'vitest';
import type { BirthProfile } from './birth-profile';
import {
  SYNTHETIC_PROFILE_KIND_KEY,
  pathfinderAnalysisProvenance,
} from './pathfinder-profile-provenance';

/** Documented synthetic natal used only by tests — not a personal chart. */
const SYNTHETIC_TEST_PROFILE: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'Tehran',
  action_type: 'business_launch',
};

function memoryStorage(entries: Record<string, string>): Pick<Storage, 'getItem'> {
  return {
    getItem(key: string) {
      return entries[key] ?? null;
    },
  };
}

describe('pathfinder analysis provenance', () => {
  it('reports none when no birth profile is loaded', () => {
    expect(pathfinderAnalysisProvenance(null, memoryStorage({}))).toBe('none');
  });

  it('reports saved-profile for a stored natal without the synthetic marker', () => {
    expect(pathfinderAnalysisProvenance(SYNTHETIC_TEST_PROFILE, memoryStorage({}))).toBe(
      'saved-profile'
    );
  });

  it('reports synthetic when the documented test-kind marker is set', () => {
    expect(
      pathfinderAnalysisProvenance(
        SYNTHETIC_TEST_PROFILE,
        memoryStorage({ [SYNTHETIC_PROFILE_KIND_KEY]: 'synthetic' })
      )
    ).toBe('synthetic');
  });
});
