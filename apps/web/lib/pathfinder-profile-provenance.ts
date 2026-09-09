import type { BirthProfile } from './birth-profile';

/**
 * Marks localStorage profiles created only by documented synthetic tests.
 * Set to `synthetic` in test/evidence harnesses. Never treat that value as a
 * real saved birth profile, and never describe it merely as personal.
 */
export const SYNTHETIC_PROFILE_KIND_KEY = 'planet-life-birth-profile-kind';

export type PathfinderAnalysisProvenance = 'none' | 'saved-profile' | 'synthetic';

export function pathfinderAnalysisProvenance(
  profile: BirthProfile | null,
  storage: Pick<Storage, 'getItem'> | null = typeof window === 'undefined' ? null : window.localStorage
): PathfinderAnalysisProvenance {
  if (!profile) return 'none';
  if (storage?.getItem(SYNTHETIC_PROFILE_KIND_KEY) === 'synthetic') return 'synthetic';
  return 'saved-profile';
}
