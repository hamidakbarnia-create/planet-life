/**
 * Presentation adapter: DecisionEvaluationPackage → operation result view models.
 *
 * Does NOT create a competing output schema. Package remains canonical.
 * Gaps that Package v1 cannot express are left undefined (UI shows Unknown).
 *
 * Honesty rules:
 * - Do not invent avoid windows from unrelated timing data.
 * - Do not manufacture Known/Inferred/Unknown evidence categories.
 * - Do not invent deciding_factor without a Package field.
 * - insufficient_data / non-material timing → Unknown strength & confidence.
 * - Empty counter_recommendation.summary → Unknown alternative (EVALUATE-only).
 */

import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  confidenceValueToBand,
  formatDisplayDate,
  timingBandToStrength,
} from './resolve';
import type {
  CompareResultViewModel,
  EvaluateResultViewModel,
  FindResultViewModel,
  OperationResultViewModel,
  StrengthBand,
} from './types';

const UNKNOWN_CONFIDENCE_PENALTIES = new Set([
  'MISSING_NATAL_EVIDENCE',
  'CONFIDENCE_UNAVAILABLE',
  'STUB_ENGINE',
]);

/**
 * Renderer selection from explicit Package.mode only.
 * Does not inspect candidate count / ranking shape.
 * FIND is unavailable until Package/Case exposes an explicit find mode.
 */
export function selectRendererOperation(
  pkg: DecisionEvaluationPackage
): 'evaluate' | 'compare' {
  if (pkg.mode === 'compare_dates') return 'compare';
  return 'evaluate';
}

/**
 * Strength from Package timing using canonical scoring._rating thresholds
 * (80 / 65 / 45) only when a real material score is present.
 */
function scoreToStrength(score: number | null | undefined): StrengthBand {
  if (score == null || Number.isNaN(score)) return 'unknown';
  if (score >= 80) return 'strong';
  if (score >= 65) return 'favorable';
  if (score >= 45) return 'mixed';
  return 'unfavorable';
}

function evaluateStrength(pkg: DecisionEvaluationPackage): StrengthBand {
  if (
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material
  ) {
    return 'unknown';
  }
  const candidate = pkg.timing.candidates.find((c) => c.rank === 1);
  if (candidate && typeof candidate.score === 'number') {
    return scoreToStrength(candidate.score);
  }
  // Band-only fallback (high⊃Favorable+, moderate=Mixed, low=below Mixed).
  const band = candidate?.band ?? pkg.timing.band;
  if (band === 'high') return 'favorable';
  if (band === 'moderate') return 'mixed';
  if (band === 'low') return 'unfavorable';
  return timingBandToStrength(band);
}

function evaluateConfidence(
  pkg: DecisionEvaluationPackage
): import('./types').ConfidenceBand {
  if (
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material
  ) {
    return 'unknown';
  }
  const codes = new Set(pkg.confidence.penalties.map((p) => p.code));
  for (const code of UNKNOWN_CONFIDENCE_PENALTIES) {
    if (codes.has(code)) return 'unknown';
  }
  return confidenceValueToBand(pkg.confidence.value);
}

export function packageToEvaluateView(
  pkg: DecisionEvaluationPackage
): EvaluateResultViewModel {
  const candidate = pkg.timing.candidates.find((c) => c.rank === 1);
  const subject = candidate
    ? formatDisplayDate(candidate.date)
    : 'Selected date';
  const why = [
    ...pkg.drivers.items.slice(0, 3).map((d) => `${d.label}: ${d.support}`),
    pkg.explainability.why,
  ].filter(Boolean);

  return {
    operation: 'evaluate',
    subject_label: subject,
    strength: evaluateStrength(pkg),
    // Only date-level evidence today — never invent a clock window.
    best_window: undefined,
    // Never invent avoid windows.
    avoid: undefined,
    // EVALUATE does not search alternatives; empty summary → Unknown.
    best_alternative: pkg.counter_recommendation.summary || undefined,
    confidence: evaluateConfidence(pkg),
    why,
    conditions: [...pkg.recommendation.conditions],
    known: undefined,
    inferred: undefined,
    unknown: undefined,
  };
}

export function packageToCompareView(
  pkg: DecisionEvaluationPackage
): CompareResultViewModel {
  const ranked = [...pkg.timing.candidates].sort((a, b) => a.rank - b.rank);
  const uniqueWinner =
    pkg.recommendation.stance !== 'prefer_alternate' &&
    !/no unique winner/i.test(pkg.recommendation.summary || '');
  const options = ranked.map((c) => ({
    option_id: c.option_id,
    label: c.label?.trim() || formatDisplayDate(c.date),
    date: c.date,
    rank: c.rank,
    score: c.score,
    strength: timingBandToStrength(c.band) as StrengthBand,
    strengths: c.strengths ? [...c.strengths] : undefined,
    risks: c.risks ? [...c.risks] : undefined,
  }));
  const winner = ranked[0];
  const winnerLabel = uniqueWinner
    ? winner?.label?.trim() ||
      (winner ? formatDisplayDate(winner.date) : 'Unknown')
    : 'No unique winner';

  const advantages = ranked.flatMap((c) =>
    (c.strengths ?? []).slice(0, 1).map((advantage) => ({
      option_label: c.label?.trim() || formatDisplayDate(c.date),
      advantage,
    }))
  );

  return {
    operation: 'compare',
    options,
    winner_label: winnerLabel,
    unique_winner: uniqueWinner,
    relative_explanation: pkg.explainability.why || undefined,
    deciding_factor: pkg.explainability.why || undefined,
    advantages,
    confidence: confidenceValueToBand(pkg.confidence.value),
    limitations: [...pkg.explainability.limits].slice(0, 3),
    known: undefined,
    inferred: undefined,
    unknown: undefined,
  };
}

/**
 * FIND presentation only when caller passes preferred='find'.
 * Package v1 has no find mode — never auto-selected from Package.mode.
 */
export function packageToFindView(
  pkg: DecisionEvaluationPackage
): FindResultViewModel {
  const ranked = [...pkg.timing.candidates].sort((a, b) => a.rank - b.rank);
  const best = ranked[0];
  const alt = ranked[1];

  return {
    operation: 'find',
    best_date_label: best ? formatDisplayDate(best.date) : 'Unknown',
    strength: timingBandToStrength(best?.band ?? pkg.timing.band),
    best_window: undefined,
    alternative: alt
      ? formatDisplayDate(alt.date)
      : pkg.counter_recommendation.summary || undefined,
    avoid: undefined,
    range_context: pkg.timing.notes || undefined,
    timeline: ranked.map((c) => ({
      label: formatDisplayDate(c.date),
      strength: timingBandToStrength(c.band),
    })),
    confidence: confidenceValueToBand(pkg.confidence.value),
    known: undefined,
    inferred: undefined,
    unknown: undefined,
  };
}

export function packageToOperationResult(
  pkg: DecisionEvaluationPackage,
  preferred?: 'evaluate' | 'compare' | 'find'
): OperationResultViewModel {
  const op = preferred ?? selectRendererOperation(pkg);
  if (op === 'compare') return packageToCompareView(pkg);
  if (op === 'find') return packageToFindView(pkg);
  return packageToEvaluateView(pkg);
}

/** Exact Package v1 gaps for product first-viewport fields. */
export const PACKAGE_V1_CONTRACT_GAPS = [
  'No contiguous best_window (start/end) on timing.candidates',
  'No avoid window / avoid candidate role',
  'No first-class comparison.winner (winner is rank===1 convention)',
  'No deciding_factor_id',
  'No FIND / date_range mode (only evaluate_date | compare_dates)',
  'No known/inferred/unknown evidence taxonomy (ACR eligibility only)',
] as const;
