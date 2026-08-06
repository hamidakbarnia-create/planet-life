/**
 * Calendar Decision Power presentation bands (reference mockup).
 * Presentation-only — does not alter scoring/API thresholds used elsewhere.
 */

export type PowerBand = 'excellent' | 'good' | 'moderate' | 'low' | 'empty';

/** Bands that participate in counts, percentages, and distribution. */
export type CountedPowerBand = Exclude<PowerBand, 'empty'>;

export const POWER_BAND_ORDER: CountedPowerBand[] = [
  'excellent',
  'good',
  'moderate',
  'low',
];

export const POWER_BAND_RANGES: Record<
  CountedPowerBand,
  { min: number; max: number; label: string }
> = {
  excellent: { min: 85, max: 100, label: 'Excellent (85–100)' },
  good: { min: 70, max: 84, label: 'Good (70–84)' },
  moderate: { min: 50, max: 69, label: 'Moderate (50–69)' },
  low: { min: 0, max: 49, label: 'Low (0–49)' },
};

/** Reference palette — violet / green / gold / red-orange. */
export const POWER_BAND_STYLES: Record<
  PowerBand,
  { color: string; bg: string; border: string; glow: string }
> = {
  excellent: {
    color: '#9c88ff',
    bg: 'rgba(156,136,255,0.18)',
    border: 'rgba(156,136,255,0.65)',
    glow: 'rgba(156,136,255,0.35)',
  },
  good: {
    color: '#44bd32',
    bg: 'rgba(68,189,50,0.16)',
    border: 'rgba(68,189,50,0.6)',
    glow: 'rgba(68,189,50,0.3)',
  },
  moderate: {
    color: '#e1b12c',
    bg: 'rgba(225,177,44,0.14)',
    border: 'rgba(225,177,44,0.55)',
    glow: 'rgba(225,177,44,0.28)',
  },
  low: {
    color: '#ff5a5a',
    bg: 'rgba(255,90,90,0.14)',
    border: 'rgba(255,90,90,0.55)',
    glow: 'rgba(255,90,90,0.28)',
  },
  empty: {
    color: 'rgba(255,255,255,0.35)',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    glow: 'transparent',
  },
};

export const CALENDAR_UI = {
  navy: '#0b0d17',
  panel: 'rgba(255,255,255,0.03)',
  panelBorder: 'rgba(197,160,89,0.22)',
  gold: '#c5a059',
  goldSoft: 'rgba(197,160,89,0.55)',
  textMuted: 'rgba(255,255,255,0.45)',
  textSoft: 'rgba(255,255,255,0.7)',
} as const;

export function scoreToPowerBand(
  score: number | null | undefined
): PowerBand {
  if (score == null || Number.isNaN(score)) return 'empty';
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'moderate';
  return 'low';
}

/** Filled dots (1–5) for compact cell indicators from absolute score. */
export function scoreToDotCount(score: number | null | undefined): number {
  if (score == null || Number.isNaN(score)) return 0;
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 25) return 2;
  return 1;
}

export type PowerDistributionBand = {
  band: CountedPowerBand;
  label: string;
  count: number;
  percent: number;
  color: string;
};

export type PowerDistribution = {
  average: number | null;
  total: number;
  bands: PowerDistributionBand[];
};

/**
 * Largest-remainder percentages so band percents sum to exactly 100
 * when total > 0 (deterministic; no floating display drift).
 */
export function allocatePercents(counts: number[], total: number): number[] {
  if (total <= 0) return counts.map(() => 0);
  const exact = counts.map((c) => (c / total) * 100);
  const floors = exact.map((v) => Math.floor(v));
  let remain = 100 - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((v, i) => ({ i, frac: v - floors[i] }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = [...floors];
  for (let k = 0; k < order.length && remain > 0; k += 1) {
    out[order[k].i] += 1;
    remain -= 1;
  }
  return out;
}

/** Derive Power Distribution from the canonical month score map only. */
export function buildPowerDistribution(
  scores: Record<string, number>
): PowerDistribution {
  const values = Object.values(scores).filter(
    (s): s is number => typeof s === 'number' && Number.isFinite(s)
  );
  const total = values.length;
  const counts: Record<CountedPowerBand, number> = {
    excellent: 0,
    good: 0,
    moderate: 0,
    low: 0,
  };
  for (const score of values) {
    const band = scoreToPowerBand(score);
    if (band === 'empty') continue;
    counts[band] += 1;
  }
  const average =
    total === 0
      ? null
      : Math.round(values.reduce((sum, s) => sum + s, 0) / total);

  const countList = POWER_BAND_ORDER.map((band) => counts[band]);
  const percents = allocatePercents(countList, total);

  return {
    average,
    total,
    bands: POWER_BAND_ORDER.map((band, i) => ({
      band,
      label: POWER_BAND_RANGES[band].label,
      count: counts[band],
      percent: percents[i],
      color: POWER_BAND_STYLES[band].color,
    })),
  };
}

export type WeekBestSummary = {
  date: string;
  score: number;
  weekdayLabel: string;
};

/** Max of the seven selected-week scores (canonical map lookup only). */
export function findWeekBest(
  weekPoints: Array<{ date: string | null; score: number | null }>,
  weekdayLabels: string[]
): WeekBestSummary | null {
  let bestDate: string | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestIndex = -1;
  weekPoints.forEach((point, index) => {
    if (
      !point.date ||
      point.score == null ||
      !Number.isFinite(point.score)
    ) {
      return;
    }
    if (bestDate == null || point.score > bestScore) {
      bestDate = point.date;
      bestScore = point.score;
      bestIndex = index;
    }
  });
  if (bestDate == null || bestIndex < 0) return null;
  return {
    date: bestDate,
    score: bestScore,
    weekdayLabel: weekdayLabels[bestIndex] ?? '',
  };
}
