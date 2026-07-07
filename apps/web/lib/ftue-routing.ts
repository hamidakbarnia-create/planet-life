import { loadBirthProfile } from './birth-profile';
import { ftueTodayPath, isFtueComplete } from './ftue-storage';

/** Interim until GET /api/v1/profile ships (Sprint 2). */
export function hasLocalBirthProfile(): boolean {
  const profile = loadBirthProfile();
  if (!profile) return false;
  return Boolean(
    profile.birth_date?.trim() &&
      profile.birth_time?.trim() &&
      profile.location?.trim()
  );
}

/** Post-auth destination per ONBOARDING_FLOW.md */
export function resolvePostAuthPath(): string {
  if (isFtueComplete()) return ftueTodayPath();
  if (hasLocalBirthProfile()) return '/onboarding/preparing';
  return '/profile?onboarding=1';
}
