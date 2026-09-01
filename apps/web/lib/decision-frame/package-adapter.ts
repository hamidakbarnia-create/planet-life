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
 * - FIND never fabricates a unique dominant window when unique_dominant=false.
 * - COMPARE insufficient_data / non-material timing is not a unique winner.
 */

import type { AppLang } from '@/lib/app-settings';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  formatAskDateLabel,
  formatAskDateRange,
} from '@/lib/ask-product/dates';
import {
  getAskProductCopy,
  localizeStrength,
} from '@/lib/ask-product/copy';
import {
  containsInternalIdentifier,
  localizePackageLimits,
} from '@/lib/ask-product/package-limits';
import {
  confidenceValueToBand,
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
 */
export function selectRendererOperation(
  pkg: DecisionEvaluationPackage
): 'evaluate' | 'compare' | 'find' {
  if (pkg.mode === 'compare_dates') return 'compare';
  if (pkg.mode === 'find_dates') return 'find';
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
  pkg: DecisionEvaluationPackage,
  lang: AppLang = 'en'
): EvaluateResultViewModel {
  const candidate = pkg.timing.candidates.find((c) => c.rank === 1);
  const subject = candidate
    ? formatAskDateLabel(lang, candidate.date)
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

function consumerSafeProse(text: string | undefined): string | undefined {
  const value = text?.trim();
  if (!value) return undefined;
  if (containsInternalIdentifier(value)) return undefined;
  return value;
}

function buildCompareRelativeExplanation(
  lang: AppLang,
  input: {
    uniqueWinner: boolean;
    options: CompareResultViewModel['options'];
    rawWhy: string | undefined;
  }
): string | undefined {
  const copy = getAskProductCopy(lang);
  const labels = input.options.map((o) => o.label).filter(Boolean);
  if (!input.uniqueWinner) {
    return copy.compareWhyTied(labels.join(' · ') || '—');
  }
  const winner = input.options[0];
  if (!winner) return undefined;
  const score =
    typeof winner.score === 'number' && !Number.isNaN(winner.score)
      ? winner.score
      : null;
  const strengthLabel =
    localizeStrength(lang, winner.strength) ?? winner.strength;
  if (score == null) {
    return copy.compareWhyTied(labels.join(' · ') || winner.label);
  }
  const structured = copy.compareWhyWinner(
    winner.label,
    score,
    strengthLabel
  );
  // EN may keep richer engine why when it is consumer-safe; FA/AR/RU always structured.
  if (lang === 'en') {
    return consumerSafeProse(input.rawWhy) ?? structured;
  }
  return structured;
}

export function packageToCompareView(
  pkg: DecisionEvaluationPackage,
  lang: AppLang = 'en'
): CompareResultViewModel {
  const copy = getAskProductCopy(lang);
  const ranked = [...pkg.timing.candidates].sort((a, b) => a.rank - b.rank);
  const insufficient =
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material;
  // Prefer stance no_unique_winner; keep summary regex for older packages.
  // Insufficient natal/material is not a completed comparison.
  const uniqueWinner =
    !insufficient &&
    pkg.recommendation.stance !== 'no_unique_winner' &&
    !/no unique winner/i.test(pkg.recommendation.summary || '');
  const options = ranked.map((c) => ({
    option_id: c.option_id,
    label: c.label?.trim() || formatAskDateLabel(lang, c.date),
    date: c.date,
    date_label: formatAskDateLabel(lang, c.date),
    rank: c.rank,
    score: insufficient ? undefined : c.score,
    strength: (insufficient
      ? 'unknown'
      : timingBandToStrength(c.band)) as StrengthBand,
    strengths: c.strengths ? [...c.strengths] : undefined,
    risks: c.risks ? [...c.risks] : undefined,
  }));
  const winner = ranked[0];
  const winnerLabel = insufficient
    ? ''
    : uniqueWinner
      ? winner?.label?.trim() ||
        (winner ? formatAskDateLabel(lang, winner.date) : copy.compareTiedLabel)
      : copy.compareTiedLabel;

  // FA/AR/RU never surface raw engine strengths; EN only when consumer-safe.
  const advantages =
    !insufficient && lang === 'en'
      ? ranked.flatMap((c) =>
          (c.strengths ?? [])
            .slice(0, 1)
            .map((advantage) => consumerSafeProse(advantage))
            .filter((advantage): advantage is string => Boolean(advantage))
            .map((advantage) => ({
              option_label: c.label?.trim() || formatAskDateLabel(lang, c.date),
              advantage,
            }))
        )
      : [];

  const relativeExplanation = insufficient
    ? undefined
    : buildCompareRelativeExplanation(lang, {
        uniqueWinner,
        options,
        rawWhy: pkg.explainability.why,
      });

  return {
    operation: 'compare',
    options,
    winner_label: winnerLabel,
    unique_winner: uniqueWinner,
    relative_explanation: relativeExplanation,
    deciding_factor: relativeExplanation,
    advantages,
    confidence: insufficient
      ? 'unknown'
      : confidenceValueToBand(pkg.confidence.value),
    limitations: localizePackageLimits(lang, pkg.explainability.limits, 3),
    known: undefined,
    inferred: undefined,
    unknown: undefined,
  };
}

function findHeadline(input: {
  uniqueDominant: boolean;
  windowCount: number;
  insufficient: boolean;
}): string {
  if (input.insufficient || input.windowCount === 0) {
    return 'No clearly dominant window';
  }
  if (input.uniqueDominant) {
    return 'Stronger timing window';
  }
  return 'Comparable windows';
}

/**
 * FIND presentation from Package.mode=find_dates + find.windows.
 * Never fabricates a unique winner when unique_dominant is false.
 */
export function packageToFindView(
  pkg: DecisionEvaluationPackage,
  lang: AppLang = 'en'
): FindResultViewModel {
  const find = pkg.find;
  const ranked = [...(find?.windows ?? [])].sort((a, b) => a.rank - b.rank);
  const uniqueDominant = Boolean(find?.unique_dominant) && ranked.length > 0;
  const insufficient =
    pkg.recommendation.stance === 'insufficient_data' || !pkg.timing.material;

  const windows = ranked.map((window) => {
    const startLabel = formatAskDateLabel(lang, window.start_date);
    const endLabel = formatAskDateLabel(lang, window.end_date);
    return {
      window_id: window.window_id,
      start_date: window.start_date,
      end_date: window.end_date,
      range_label: formatAskDateRange(
        lang,
        window.start_date,
        window.end_date
      ),
      start_label: startLabel,
      end_label: endLabel,
      peak_dates: [...window.peak_dates],
      peak_labels: window.peak_dates.map((d) => formatAskDateLabel(lang, d)),
      strength: timingBandToStrength(window.band),
      band: window.band,
      peak_score: window.peak_score,
    };
  });

  const rangeContext =
    find?.range_start && find?.range_end
      ? formatAskDateRange(lang, find.range_start, find.range_end)
      : pkg.timing.notes || undefined;

  const unknown: string[] = [];
  if (insufficient) {
    unknown.push(...pkg.recommendation.conditions.slice(0, 3));
  }

  return {
    operation: 'find',
    headline: findHeadline({
      uniqueDominant,
      windowCount: windows.length,
      insufficient,
    }),
    unique_dominant: uniqueDominant,
    windows,
    range_start: find?.range_start,
    range_end: find?.range_end,
    range_context: rangeContext,
    decision_type_id: pkg.decision_type_id,
    primary_window_label:
      uniqueDominant && windows[0] ? windows[0].range_label : undefined,
    confidence: insufficient
      ? 'unknown'
      : confidenceValueToBand(pkg.confidence.value),
    limitations: localizePackageLimits(lang, pkg.explainability.limits, 4),
    known: undefined,
    inferred: undefined,
    // Never surface raw English recommendation.conditions into localized UI.
    unknown: lang === 'en' && unknown.length ? unknown : undefined,
  };
}

export function packageToOperationResult(
  pkg: DecisionEvaluationPackage,
  preferred?: 'evaluate' | 'compare' | 'find',
  lang: AppLang = 'en'
): OperationResultViewModel {
  const op = preferred ?? selectRendererOperation(pkg);
  if (op === 'compare') return packageToCompareView(pkg, lang);
  if (op === 'find') return packageToFindView(pkg, lang);
  return packageToEvaluateView(pkg, lang);
}

/** Exact Package v1 gaps for product first-viewport fields. */
export const PACKAGE_V1_CONTRACT_GAPS = [
  'No contiguous best_window (start/end) on timing.candidates',
  'No avoid window / avoid candidate role',
  'No first-class comparison.winner (winner is rank===1 convention)',
  'No deciding_factor_id',
  'FIND has no avoid-window role (windows are Favorable+ eligibility only)',
  'No known/inferred/unknown evidence taxonomy (ACR eligibility only)',
] as const;
