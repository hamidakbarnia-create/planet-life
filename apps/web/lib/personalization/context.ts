/**
 * Capability personalization context (PD-2026-010).
 *
 * Architecture:
 *   User profile traits → Capability (decides relevance) → Presentation
 *
 * The Decision / timing / scoring engines never branch on these traits.
 * Gender-aware capabilities may adapt presentation/examples only.
 *
 * Extensibility: add future traits (e.g. relationship preference) as separate
 * profile fields and optional context properties when a consumer exists —
 * do not reserve unused public fields ahead of time.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  genderPresentationVariant,
  parseProfileGender,
  type GenderPresentationVariant,
  type ProfileGender,
} from '@/lib/profile/profile-gender';

export type GenderIndependentCapability =
  | 'today'
  | 'calendar'
  | 'decision_timing'
  | 'world'
  | 'transit'
  | 'core_reasoning'
  | 'power_timing';

export type GenderAwareCapability =
  | 'look'
  | 'heat'
  | 'provider'
  | 'compatibility'
  | 'shadow';

export type PersonalizationCapability =
  | GenderIndependentCapability
  | GenderAwareCapability;

const GENDER_AWARE: ReadonlySet<PersonalizationCapability> = new Set([
  'look',
  'heat',
  'provider',
  'compatibility',
  'shadow',
]);

export type PersonalizationContext = {
  /** Stored profile gender, or null when unset / invalid. */
  gender: ProfileGender | null;
  /** Presentation variant for gender-aware copy selection. */
  genderVariant: GenderPresentationVariant;
};

export function buildPersonalizationContext(
  profile: BirthProfile | null | undefined
): PersonalizationContext {
  const gender = parseProfileGender(profile?.gender);
  return {
    gender,
    genderVariant: genderPresentationVariant(gender),
  };
}

export function capabilityUsesGender(
  capability: PersonalizationCapability
): boolean {
  return GENDER_AWARE.has(capability);
}

/**
 * Guard for gender-aware presentation layers.
 * Gender-independent capabilities should not call this for branching logic.
 */
export function personalizationForCapability(
  profile: BirthProfile | null | undefined,
  capability: PersonalizationCapability
): PersonalizationContext | null {
  if (!capabilityUsesGender(capability)) return null;
  return buildPersonalizationContext(profile);
}
