const FTUE_COMPLETE_KEY = 'planet-life-ftue-complete';

export function isFtueComplete(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(FTUE_COMPLETE_KEY) === '1';
}

export function markFtueComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(FTUE_COMPLETE_KEY, '1');
}

export function clearFtueComplete(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(FTUE_COMPLETE_KEY);
}

/** Post-auth destination until /today ships (Sprint 1 priority 5). */
export function ftueTodayPath(): string {
  return '/home';
}
