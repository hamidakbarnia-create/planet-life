/** Single persistence adapter for Personal Intelligence Core. */

import { loadBirthProfile, type BirthProfile } from '@/lib/birth-profile';
import { buildPersonalIntelligenceProfile } from './profile-builder';
import {
  fingerprintSourceProfile,
  normalizeSourceProfile,
} from './source-profile';
import {
  INTELLIGENCE_STORAGE_KEY,
  type DecisionHistorySummary,
  type PersonalIntelligenceProfile,
  type TimingContextInput,
} from './types';
import { isProfileStale, validatePersonalIntelligenceProfile } from './validation';

export type EnsureIntelligenceOptions = {
  timingContext?: TimingContextInput | null;
  decisionHistory?: DecisionHistorySummary | null;
};

const LEGACY_STORAGE_KEY = 'planet-life-intelligence-profile';

function readRaw(key: string): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeProfile(profile: PersonalIntelligenceProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTELLIGENCE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Quota / private mode — fail soft; caller still receives in-memory profile.
  }
}

function isCoreProfile(value: unknown): value is PersonalIntelligenceProfile {
  if (!value || typeof value !== 'object') return false;
  const p = value as PersonalIntelligenceProfile;
  return (
    typeof p.profileId === 'string' &&
    typeof p.profileVersion === 'string' &&
    typeof p.sourceProfileFingerprint === 'string' &&
    p.decisionStyle != null &&
    Array.isArray(p.strengths)
  );
}

export function loadStoredIntelligenceProfile(): PersonalIntelligenceProfile | null {
  const parsed = readRaw(INTELLIGENCE_STORAGE_KEY);
  if (!isCoreProfile(parsed)) return null;
  const validation = validatePersonalIntelligenceProfile(parsed);
  if (!validation.ok) return null;
  return parsed;
}

export function clearIntelligenceProfileStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTELLIGENCE_STORAGE_KEY);
  } catch {
    // fail soft
  }
}

/**
 * Ensure a validated core profile exists for the current birth profile.
 * Regenerates when fingerprint or version is stale.
 */
export function ensurePersonalIntelligenceProfile(
  birth?: BirthProfile | null,
  timingContextOrOptions?: TimingContextInput | null | EnsureIntelligenceOptions
): PersonalIntelligenceProfile | null {
  const options: EnsureIntelligenceOptions =
    timingContextOrOptions != null &&
    typeof timingContextOrOptions === 'object' &&
    ('timingContext' in timingContextOrOptions ||
      'decisionHistory' in timingContextOrOptions)
      ? (timingContextOrOptions as EnsureIntelligenceOptions)
      : { timingContext: timingContextOrOptions as TimingContextInput | null | undefined };

  const profile = birth === undefined ? loadBirthProfile() : birth;
  const source = normalizeSourceProfile(profile, {
    decisionHistory: options.decisionHistory,
  });
  const fp = fingerprintSourceProfile(source);
  const stored = loadStoredIntelligenceProfile();

  if (stored && !isProfileStale(stored, fp)) {
    return stored;
  }

  const generated = buildPersonalIntelligenceProfile(profile, {
    timingContext: options.timingContext,
    decisionHistory: options.decisionHistory,
    source,
  });
  if (!generated) return null;

  if (stored && stored.sourceProfileFingerprint === fp) {
    generated.generatedAt = stored.generatedAt;
  }

  writeProfile(generated);

  return generated;
}

export function getPersonalIntelligenceProfile(): PersonalIntelligenceProfile | null {
  const birth = loadBirthProfile();
  if (birth) return ensurePersonalIntelligenceProfile(birth);
  return loadStoredIntelligenceProfile();
}

export function regeneratePersonalIntelligenceProfile(
  birth: BirthProfile,
  timingContextOrOptions?: TimingContextInput | null | EnsureIntelligenceOptions
): PersonalIntelligenceProfile | null {
  const options: EnsureIntelligenceOptions =
    timingContextOrOptions != null &&
    typeof timingContextOrOptions === 'object' &&
    ('timingContext' in timingContextOrOptions ||
      'decisionHistory' in timingContextOrOptions)
      ? (timingContextOrOptions as EnsureIntelligenceOptions)
      : { timingContext: timingContextOrOptions as TimingContextInput | null | undefined };

  const generated = buildPersonalIntelligenceProfile(birth, {
    timingContext: options.timingContext,
    decisionHistory: options.decisionHistory,
  });
  if (!generated) return null;
  writeProfile(generated);
  return generated;
}

/** Drop legacy v1 blob after successful core write (migration hygiene). */
export function migrateLegacyIntelligenceStorage(): void {
  if (typeof window === 'undefined') return;
  const core = loadStoredIntelligenceProfile();
  if (core) {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // fail soft
    }
  }
}

export { INTELLIGENCE_STORAGE_KEY, LEGACY_STORAGE_KEY };
