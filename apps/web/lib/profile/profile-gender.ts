/**
 * First-class profile Gender attribute (PD-2026-010).
 * Presentation/personalization only — never used by scoring or astrology engines.
 */

export const PROFILE_GENDER_VALUES = [
  'female',
  'male',
  'prefer_not_to_say',
] as const;

export type ProfileGender = (typeof PROFILE_GENDER_VALUES)[number];

export function isProfileGender(value: unknown): value is ProfileGender {
  return (
    typeof value === 'string' &&
    (PROFILE_GENDER_VALUES as readonly string[]).includes(value)
  );
}

/** Normalize persisted/unknown values. Invalid → null (migration-safe). */
export function parseProfileGender(value: unknown): ProfileGender | null {
  if (!isProfileGender(value)) return null;
  return value;
}

/**
 * Presentation variant for gender-aware capabilities.
 * `prefer_not_to_say` and missing gender resolve to neutral copy.
 */
export type GenderPresentationVariant = 'female' | 'male' | 'neutral';

export function genderPresentationVariant(
  gender: ProfileGender | null | undefined
): GenderPresentationVariant {
  if (gender === 'female') return 'female';
  if (gender === 'male') return 'male';
  return 'neutral';
}
