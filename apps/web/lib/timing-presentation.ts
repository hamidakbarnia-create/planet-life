export type ScoreBand = 'green' | 'yellow' | 'orange' | 'red' | 'empty';

export function scoreToBand(
  score: number | null | undefined
): ScoreBand {
  if (score == null || Number.isNaN(score)) return 'empty';
  if (score >= 85) return 'green';
  if (score >= 60) return 'yellow';
  if (score >= 40) return 'orange';
  return 'red';
}

/**
 * Tier 3 domain presentation map (DS-01 registry).
 * ADR-DS-001 Principle 3: currently defines raw palette literals — does not consume
 * semantic tokens yet. Refactor deferred to a future design-system ADR.
 * @see docs/design/system/design-token-registry.md
 */
export const BAND_STYLES: Record<
  ScoreBand,
  { bg: string; border: string; text: string }
> = {
  green: {
    bg: 'rgba(74,222,128,0.32)',
    border: '#4ade80',
    text: '#4ade80',
  },
  yellow: {
    bg: 'rgba(251,191,36,0.28)',
    border: '#fbbf24',
    text: '#fbbf24',
  },
  orange: {
    bg: 'rgba(251,146,60,0.28)',
    border: '#fb923c',
    text: '#fb923c',
  },
  red: {
    bg: 'rgba(248,113,113,0.28)',
    border: '#f87171',
    text: '#f87171',
  },
  empty: {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    text: 'rgba(255,255,255,0.25)',
  },
};

// Format an hour (0-23) for display. English uses 12-hour with AM/PM
// (e.g. 18 -> "6:00 PM"), other locales keep 24-hour (e.g. "18:00") which
// is the native convention there.
export function formatHourLabel(
  hour: number,
  lang: string = 'en'
): string {
  const safe = ((hour % 24) + 24) % 24;

  if (lang === 'en') {
    const period = safe >= 12 ? 'PM' : 'AM';
    const h12 = safe % 12 === 0 ? 12 : safe % 12;
    return `${h12}:00 ${period}`;
  }

  return `${String(safe).padStart(2, '0')}:00`;
}

export function isGoldenHour(score: number): boolean {
  return score >= 85;
}

export function isDangerHour(score: number): boolean {
  return score <= 39;
}
