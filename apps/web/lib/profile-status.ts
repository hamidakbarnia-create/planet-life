/**
 * Birth-data completeness and chart build status for the Profile page.
 *
 * Kept free of React so the honesty rules (never present absent birth data as
 * real, never report "awaiting chart" when the chart simply cannot be built)
 * are unit-testable in isolation.
 */

export type ProfileBirthInput = {
  birthDate: string;
  birthTime: string;
  location: string;
};

export type ChartStatus =
  | 'loading'
  | 'ready'
  | 'pending'
  | 'missing-data'
  | 'needs-location'
  | 'error';

/** Every field the chart API requires must be present and non-blank. */
export function hasCompleteBirthData(birth: ProfileBirthInput): boolean {
  return (
    birth.birthDate.trim() !== '' &&
    birth.birthTime.trim() !== '' &&
    birth.location.trim() !== ''
  );
}

/**
 * Identity of the birth inputs a chart was requested with.
 *
 * A retained `geocoded_fallback` chart is only safe to confirm while the birth
 * inputs still match the ones it was built from.
 */
export function birthSignature(birth: ProfileBirthInput): string {
  return [
    birth.birthDate.trim(),
    birth.birthTime.trim(),
    birth.location.trim(),
  ].join('|');
}

/**
 * Status shown in the profile hero.
 *
 * `pending` is reserved for "we can build this, it just has not happened yet".
 * Incomplete birth data reports `missing-data` instead, so the UI never implies
 * a chart is on its way when no chart is possible.
 */
export function resolveChartStatus(input: {
  profileLoaded: boolean;
  loading: boolean;
  hasChart: boolean;
  hasError: boolean;
  awaitingLocationConfirm: boolean;
  birth: ProfileBirthInput;
}): ChartStatus {
  if (input.loading) return 'loading';
  if (input.hasChart) return 'ready';
  if (!input.profileLoaded) return 'pending';
  if (!hasCompleteBirthData(input.birth)) return 'missing-data';
  if (input.awaitingLocationConfirm) return 'needs-location';
  if (input.hasError) return 'error';
  return 'pending';
}

/**
 * Resume a chart for an already-persisted profile exactly once per mount.
 *
 * `alreadyAttempted` prevents a failed request from retrying in a loop.
 */
export function shouldAutoBuildChart(input: {
  profileLoaded: boolean;
  loading: boolean;
  hasChart: boolean;
  alreadyAttempted: boolean;
  birth: ProfileBirthInput;
}): boolean {
  if (!input.profileLoaded) return false;
  if (input.loading || input.hasChart || input.alreadyAttempted) return false;
  return hasCompleteBirthData(input.birth);
}

/**
 * What an explicit "Create Chart" press should do.
 *
 * An auto-resume can retain an unverified `geocoded_fallback` chart without
 * opening its confirmation dialog. When the user then asks for a chart and the
 * birth inputs are unchanged, that retained result is exactly what they would
 * get back, so it is confirmed instead of re-requested. Edited birth inputs
 * invalidate it and a fresh request is made.
 */
export function resolveChartRequestIntent(input: {
  pendingBirthSignature: string | null;
  birth: ProfileBirthInput;
}): 'confirm-retained' | 'request' {
  if (input.pendingBirthSignature === null) return 'request';
  return input.pendingBirthSignature === birthSignature(input.birth)
    ? 'confirm-retained'
    : 'request';
}
