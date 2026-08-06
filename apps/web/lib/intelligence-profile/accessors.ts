/** Persist / load — delegates to Personal Intelligence Core + legacy adapter. */

import { loadBirthProfile, type BirthProfile } from '@/lib/birth-profile';
import {
  clearIntelligenceProfileStorage,
  ensurePersonalIntelligenceProfile,
  getPersonalIntelligenceProfile,
  regeneratePersonalIntelligenceProfile,
  toLegacyIntelligenceProfile,
} from '@/lib/intelligence';
import type { PersonalIntelligenceProfile } from './types';
import { fingerprintBirthProfile, generateIntelligenceProfile } from './generate';

export { fingerprintBirthProfile, generateIntelligenceProfile };

/**
 * Ensure a canonical intelligence profile exists for the current birth profile.
 * Uses Intelligence Core; returns legacy-shaped profile for existing UI.
 * Decision history is not read here — callers that need Pathfinder enrichment
 * MUST inject `decisionHistory` via Personal Intelligence Core options
 * (see `pathfinder-decision/decision-history-bridge.ts`).
 */
export function ensureIntelligenceProfile(
  birth?: BirthProfile | null
): PersonalIntelligenceProfile | null {
  const core = ensurePersonalIntelligenceProfile(
    birth === undefined ? undefined : birth
  );
  if (!core) return null;
  return toLegacyIntelligenceProfile(core);
}

export function getIntelligenceProfile(): PersonalIntelligenceProfile | null {
  const core = getPersonalIntelligenceProfile();
  if (!core) {
    // Fallback: try legacy generation path for incomplete migration edge cases
    const birth = loadBirthProfile();
    if (!birth?.birth_date || !birth?.birth_time || !birth?.location) return null;
    return ensureIntelligenceProfile(birth);
  }
  return toLegacyIntelligenceProfile(core);
}

export function clearIntelligenceProfileCache(): void {
  clearIntelligenceProfileStorage();
}

export function regenerateIntelligenceProfile(
  birth: BirthProfile
): PersonalIntelligenceProfile {
  const core = regeneratePersonalIntelligenceProfile(birth);
  if (core) return toLegacyIntelligenceProfile(core);
  // Safe fallback if core validation rejects — should be rare
  return generateIntelligenceProfile(birth);
}
