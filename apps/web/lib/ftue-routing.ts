import { getProfileRepository, isProfileRecordComplete } from '@/lib/profile';
import { ftueTodayPath, isFtueComplete } from './ftue-storage';

/** True when a complete birth profile exists locally (repository-backed). */
export function hasLocalBirthProfile(): boolean {
  const repo = getProfileRepository();
  return isProfileRecordComplete(repo.loadProfile());
}

export function resolvePostAuthPath(): string {
  if (isFtueComplete()) return ftueTodayPath();
  if (hasLocalBirthProfile()) return '/onboarding/preparing';
  return '/profile?onboarding=1';
}

/** Destination after preparing completes (Today ships as /home interim). */
export function resolvePreparingCompletePath(options?: { scoreError?: boolean }): string {
  const base = ftueTodayPath();
  return options?.scoreError ? `${base}?score_error=1` : base;
}
