/**
 * Deterministic Package → consumer presentation mappings.
 * Does not invent astrology interpretations beyond Package semantics.
 */

import type { AppLang } from '@/lib/app-settings';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  confidenceValueToBand,
  timingBandToStrength,
} from '@/lib/decision-frame/resolve';
import type { ConfidenceBand, StrengthBand } from '@/lib/decision-frame/types';
import { formatAskDatePair, type AskDateDisplay } from './dates';
import {
  getAskProductCopy,
  localizeConfidence,
  localizeStrength,
  type AskProductCopy,
} from './copy';

const UNKNOWN_CONFIDENCE = new Set([
  'MISSING_NATAL_EVIDENCE',
  'CONFIDENCE_UNAVAILABLE',
  'STUB_ENGINE',
]);

export type AskEvidenceLine = {
  /** Localized restrained category from Package driver.band */
  title: string;
  /**
   * EN-only Package label/support passthrough.
   * Never machine-translated for FA/AR/RU (would fabricate meaning).
   */
  detail?: string;
  source: 'drivers.band' | 'drivers.label_support';
  /** Trace fields for tests / honesty audits */
  driverLabel?: string;
  driverBand?: string;
  driverSupport?: string;
};

export type AskEvaluatePresentation = {
  topic: string;
  date: AskDateDisplay;
  verdict: string;
  score: number | null;
  scoreLabel: string | null;
  meaning: string;
  meaningSource: 'timing.score_band' | 'timing.band';
  evidence: AskEvidenceLine[];
  scope: string;
  scopeSource: 'car-interview-contract' | 'generic-timing';
  confidence: string | null;
  agencyLine: string;
};

function scoreToStrength(score: number | null | undefined): StrengthBand {
  if (score == null || Number.isNaN(score)) return 'unknown';
  if (score >= 80) return 'strong';
  if (score >= 65) return 'favorable';
  if (score >= 45) return 'mixed';
  return 'unfavorable';
}

export function packageStrength(pkg: DecisionEvaluationPackage): StrengthBand {
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
  const band = candidate?.band ?? pkg.timing.band;
  if (band === 'high') return 'favorable';
  if (band === 'moderate') return 'mixed';
  if (band === 'low') return 'unfavorable';
  return timingBandToStrength(band);
}

export function packageConfidence(
  pkg: DecisionEvaluationPackage
): ConfidenceBand {
  if (
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material
  ) {
    return 'unknown';
  }
  const codes = new Set(pkg.confidence.penalties.map((p) => p.code));
  for (const code of UNKNOWN_CONFIDENCE) {
    if (codes.has(code)) return 'unknown';
  }
  return confidenceValueToBand(pkg.confidence.value);
}

function bandEvidenceTitle(
  band: string | undefined,
  copy: AskProductCopy
): string {
  if (band === 'high') return copy.evidenceSupportive;
  if (band === 'low') return copy.evidenceCaution;
  return copy.evidenceNeutral;
}

/**
 * Map up to 3 Package drivers.
 * Band → restrained localized category (presentation label only).
 * Free-form English label/support only on EN (Package language).
 * FA/AR/RU intentionally omit English prose rather than inventing translations.
 */
export function mapPackageEvidence(
  pkg: DecisionEvaluationPackage,
  lang: AppLang
): AskEvidenceLine[] {
  const copy = getAskProductCopy(lang);
  return pkg.drivers.items.slice(0, 3).map((driver) => {
    const title = bandEvidenceTitle(driver.band, copy);
    const base = {
      title,
      driverLabel: driver.label,
      driverBand: driver.band,
      driverSupport: driver.support,
    };
    if (lang === 'en' && (driver.label || driver.support)) {
      const detail = [driver.label, driver.support].filter(Boolean).join(': ');
      return {
        ...base,
        detail: detail || undefined,
        source: 'drivers.label_support' as const,
      };
    }
    return { ...base, source: 'drivers.band' as const };
  });
}

function topicFromPackage(
  pkg: DecisionEvaluationPackage,
  copy: AskProductCopy
): string {
  if (pkg.decision_type_id === 'car-interview') return copy.topicCarInterview;
  if (pkg.decision_type_id === 'bus-investor-meeting') {
    return copy.topicInvestorMeeting;
  }
  if (pkg.decision_type_id === 'mar-wedding-date') return copy.topicWeddingDate;
  if (pkg.decision_type_id === 'bus-product-launch') {
    return copy.topicProductLaunch;
  }
  return copy.topicGeneric;
}

function scopeForPackage(
  pkg: DecisionEvaluationPackage,
  copy: AskProductCopy
): { scope: string; scopeSource: AskEvaluatePresentation['scopeSource'] } {
  // Interview scope mirrors Runtime-1 evidence.limits (negotiation profile).
  // Never apply interview negotiation claims to other decision types.
  if (pkg.decision_type_id === 'car-interview') {
    return {
      scope: copy.scopeInterviewTiming,
      scopeSource: 'car-interview-contract',
    };
  }
  return {
    scope: copy.scopeTimingGeneric,
    scopeSource: 'generic-timing',
  };
}

/**
 * Build Evaluate first-viewport model from supported Package semantics only.
 * Omits best_window / alternative / avoid / Unknown filler rows.
 *
 * Meaning is a restrained presentation of timing strength band only —
 * never invents negotiation/communication/employer claims from the band,
 * and never surfaces English recommendation.summary on FA/AR/RU.
 */
export function buildEvaluatePresentation(
  pkg: DecisionEvaluationPackage,
  lang: AppLang,
  options?: { topic?: string }
): AskEvaluatePresentation | null {
  if (
    pkg.recommendation.stance === 'insufficient_data' ||
    !pkg.timing.material
  ) {
    return null;
  }

  const copy = getAskProductCopy(lang);
  const strength = packageStrength(pkg);
  const confidence = packageConfidence(pkg);
  if (strength === 'unknown') return null;

  const verdict = localizeStrength(lang, strength);
  if (!verdict) return null;

  const candidate = pkg.timing.candidates.find((c) => c.rank === 1);
  const iso = candidate?.date;
  if (!iso) return null;

  const score =
    typeof candidate?.score === 'number'
      ? candidate.score
      : typeof pkg.timing.score === 'number'
        ? pkg.timing.score
        : null;

  const meaningSource: AskEvaluatePresentation['meaningSource'] =
    candidate && typeof candidate.score === 'number'
      ? 'timing.score_band'
      : 'timing.band';

  const { scope, scopeSource } = scopeForPackage(pkg, copy);

  return {
    topic: options?.topic?.trim() || topicFromPackage(pkg, copy),
    date: formatAskDatePair(lang, iso),
    verdict,
    score,
    scoreLabel: score != null ? copy.resultScoreOf(score) : null,
    meaning: copy.meaningByStrength[strength],
    meaningSource,
    evidence: mapPackageEvidence(pkg, lang),
    scope,
    scopeSource,
    confidence: localizeConfidence(lang, confidence),
    agencyLine: copy.agencyLine,
  };
}
