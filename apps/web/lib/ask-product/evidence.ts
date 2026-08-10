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
import {
  localizeEvidenceFactor,
  tryLocalizeFactorKey,
} from './evidence-factor-localize';
import { localizePackageLimits } from './package-limits';

const UNKNOWN_CONFIDENCE = new Set([
  'MISSING_NATAL_EVIDENCE',
  'CONFIDENCE_UNAVAILABLE',
  'STUB_ENGINE',
]);

export type DriverPolarity = 'supportive' | 'cautionary' | 'neutral';

export type AskEvidenceLine = {
  id: string;
  /** Localized restrained category from driver.polarity (not deprecated band). */
  title: string;
  /**
   * Package label/support/friction passthrough when useful for distinct identity.
   * Never machine-translated for FA/AR/RU.
   */
  detail?: string;
  source: 'drivers.factor_key' | 'drivers.polarity' | 'drivers.label_support';
  polarity: DriverPolarity;
  driverLabel?: string;
  driverSupport?: string;
  driverFriction?: string;
  /** @deprecated Trace only — not used for primary titles. */
  driverBand?: string;
  contribution?: number;
  importance?: string;
  factorKey?: string;
};

export type AskEvaluatePresentation = {
  topic: string;
  date: AskDateDisplay;
  verdict: string;
  score: number | null;
  scoreLabel: string | null;
  scoreHonestyNote: string;
  meaning: string;
  meaningSource: 'timing.score_band' | 'timing.band';
  recommendation: string;
  recommendationDetail?: string;
  evidence: AskEvidenceLine[];
  supportiveEvidence: AskEvidenceLine[];
  cautionaryEvidence: AskEvidenceLine[];
  contextEvidence: AskEvidenceLine[];
  scope: string;
  scopeSource: 'car-interview-contract' | 'generic-timing';
  packageLimits: string[];
  nextSteps: string[];
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

export function resolveDriverPolarity(driver: {
  polarity?: string;
  contribution?: number;
  band?: string;
}): DriverPolarity {
  if (
    driver.polarity === 'supportive' ||
    driver.polarity === 'cautionary' ||
    driver.polarity === 'neutral'
  ) {
    return driver.polarity;
  }
  if (typeof driver.contribution === 'number') {
    if (driver.contribution > 0) return 'supportive';
    if (driver.contribution < 0) return 'cautionary';
    return 'neutral';
  }
  // Deprecated band is polarity projection only (PR-A compat), not timing quality.
  if (driver.band === 'high') return 'supportive';
  if (driver.band === 'low') return 'cautionary';
  return 'neutral';
}

function evidenceTitle(
  driver: {
    polarity?: string;
    contribution?: number;
    band?: string;
    importance?: string;
    label?: string;
    factor_key?: string;
  },
  polarity: DriverPolarity,
  lang: AppLang
): { title: string; detail?: string; source: AskEvidenceLine['source'] } {
  const fromCatalog = tryLocalizeFactorKey(lang, driver.factor_key);
  if (fromCatalog) {
    return {
      title: fromCatalog.title,
      detail: fromCatalog.detail,
      source: 'drivers.factor_key',
    };
  }

  const localized = localizeEvidenceFactor(lang, driver.factor_key, {
    polarity,
    label: driver.label,
    importance: driver.importance,
  });

  // Unknown / missing key: EN may use Package label; FA/AR/RU honest fallback.
  if (lang === 'en' && driver.label?.trim()) {
    return {
      title: driver.label.trim(),
      source: 'drivers.label_support',
    };
  }

  return {
    title: localized.title,
    source: 'drivers.polarity',
  };
}

/**
 * Map Package drivers using polarity/contribution as primary semantics.
 * Preserves distinct evidence identity — does not dedupe similar titles.
 */
export function mapPackageEvidence(
  pkg: DecisionEvaluationPackage,
  lang: AppLang
): AskEvidenceLine[] {
  // Prefer 2–4 items; keep up to 4 to preserve distinct reasons.
  return pkg.drivers.items.slice(0, 4).map((driver, index) => {
    const polarity = resolveDriverPolarity(driver);
    const titled = evidenceTitle(driver, polarity, lang);

    // EN: passthrough Package support/friction (Package language).
    // FA/AR/RU: never machine-translate free-form English astro labels.
    let detail = titled.detail;
    if (lang === 'en') {
      const support = driver.support?.trim();
      const friction = driver.friction?.trim();
      const parts: string[] = [];
      if (polarity === 'cautionary') {
        if (friction) parts.push(friction);
        else if (support) parts.push(support);
      } else if (support) {
        parts.push(support);
      } else if (friction) {
        parts.push(friction);
      }
      const enDetail = parts.filter(Boolean).join(': ') || undefined;
      detail = titled.detail ?? enDetail;
    }

    return {
      id: driver.id || `driver-${index + 1}`,
      title: titled.title,
      detail,
      source: titled.source,
      polarity,
      driverLabel: driver.label,
      driverSupport: driver.support,
      driverFriction: driver.friction,
      driverBand: driver.band,
      contribution: driver.contribution,
      importance: driver.importance,
      factorKey: driver.factor_key,
    };
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

function stanceRecommendation(
  pkg: DecisionEvaluationPackage,
  copy: AskProductCopy
): string {
  const stance = pkg.recommendation.stance;
  if (stance === 'insufficient_data') return copy.blockedNoVerdict;
  if (stance in copy.stance) {
    return copy.stance[stance as keyof typeof copy.stance];
  }
  return copy.meaningByStrength.mixed;
}

/**
 * Build Evaluate first-viewport model from supported Package semantics only.
 * Omits best_window / alternative / avoid / Unknown filler rows.
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
  const evidence = mapPackageEvidence(pkg, lang);
  const supportiveEvidence = evidence.filter((e) => e.polarity === 'supportive');
  const cautionaryEvidence = evidence.filter((e) => e.polarity === 'cautionary');
  const contextEvidence = evidence.filter((e) => e.polarity === 'neutral');

  const packageLimits = localizePackageLimits(
    lang,
    pkg.explainability.limits,
    4
  );

  // Free-form English action steps only on EN — no MT for other locales.
  const nextSteps =
    lang === 'en'
      ? pkg.action_plan.steps
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((s) => s.action.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];

  const recommendation = stanceRecommendation(pkg, copy);
  const recommendationDetail =
    lang === 'en' && pkg.recommendation.summary.trim()
      ? pkg.recommendation.summary.trim()
      : undefined;

  return {
    topic: options?.topic?.trim() || topicFromPackage(pkg, copy),
    date: formatAskDatePair(lang, iso),
    verdict,
    score,
    scoreLabel: score != null ? copy.timingScoreOf(score) : null,
    scoreHonestyNote: copy.scoreHonestyNote,
    meaning: copy.meaningByStrength[strength],
    meaningSource,
    recommendation,
    recommendationDetail,
    evidence,
    supportiveEvidence,
    cautionaryEvidence,
    contextEvidence,
    scope,
    scopeSource,
    packageLimits,
    nextSteps,
    confidence: localizeConfidence(lang, confidence),
    agencyLine: copy.agencyLine,
  };
}
