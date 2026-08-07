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

export function packageToEvaluateView(
  pkg: DecisionEvaluationPackage
): EvaluateResultViewModel {
  const candidate = pkg.timing.candidates.find((c) => c.rank === 1);
  const subject = candidate
    ? formatDisplayDate(candidate.date)
    : 'Selected date';
  const strength = timingBandToStrength(candidate?.band ?? pkg.timing.band);
  const why = [
    ...pkg.drivers.items.slice(0, 3).map((d) => `${d.label}: ${d.support}`),
    pkg.explainability.why,
  ].filter(Boolean);

  return {
    operation: 'evaluate',
    subject_label: subject,
    strength,
    // Package gap — omit (UI: Unknown)
    best_window: undefined,
    // Package gap — omit (UI: Unknown). Never infer from candidates/notes.
    avoid: undefined,
    // Explicit Package field
    best_alternative: pkg.counter_recommendation.summary || undefined,
    confidence: confidenceValueToBand(pkg.confidence.value),
    why,
    conditions: [...pkg.recommendation.conditions],
    // Package has no known/inferred/unknown taxonomy — omit entirely.
    known: undefined,
    inferred: undefined,
    unknown: undefined,
  };
}

export function packageToCompareView(
  pkg: DecisionEvaluationPackage
): CompareResultViewModel {
  const ranked = [...pkg.timing.candidates].sort((a, b) => a.rank - b.rank);
  const options = ranked.map((c) => ({
    label: formatDisplayDate(c.date),
    strength: timingBandToStrength(c.band) as StrengthBand,
  }));
  const winner = ranked[0];

  return {
    operation: 'compare',
    options,
    // Winner is Package timing rank convention (rank === 1), not invented.
    winner_label: winner ? formatDisplayDate(winner.date) : 'Unknown',
    // Package gap — no deciding_factor_id. Omit (UI: Unknown).
    deciding_factor: undefined,
    // Do not invent per-option advantages from unrelated driver indices.
    advantages: [],
    confidence: confidenceValueToBand(pkg.confidence.value),
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
