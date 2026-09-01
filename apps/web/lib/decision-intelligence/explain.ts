/**
 * Client-side explanation builder for preview when a payload already has
 * score + v3 posture. Codes only — copy comes from renderSemanticExplanation.
 */

import type { SemanticExplanationInput } from './types';

const FAVORABLE_SCORE = 65;
const CHALLENGING_SCORE = 45;
const HIGH_THRESHOLD = 65;
const LOW_THRESHOLD = 45;
const INVERTED = new Set(['pressure']);
const DIMENSION_KEYS = [
  'opportunity',
  'momentum',
  'clarity',
  'stability',
  'cooperation',
  'pressure',
  'reversibility_safety',
] as const;

const POSTURE_CODES: Record<string, string> = {
  high_leverage: 'semantic.posture_high_leverage',
  action: 'semantic.posture_action',
  build: 'semantic.posture_build',
  selective: 'semantic.posture_selective',
  review: 'semantic.posture_review',
  defensive: 'semantic.posture_defensive',
  recovery: 'semantic.posture_recovery',
  mixed: 'semantic.posture_mixed',
  insufficient: 'semantic.posture_insufficient',
};

const DIMENSION_HIGH: Record<string, string> = {
  opportunity: 'semantic.high_opportunity',
  momentum: 'semantic.high_momentum',
  clarity: 'semantic.high_clarity',
  stability: 'semantic.high_stability',
  cooperation: 'semantic.high_cooperation',
  pressure: 'semantic.high_pressure',
  reversibility_safety: 'semantic.high_reversibility_safety',
};

const DIMENSION_LOW: Record<string, string> = {
  opportunity: 'semantic.low_opportunity',
  momentum: 'semantic.low_momentum',
  clarity: 'semantic.low_clarity',
  stability: 'semantic.low_stability',
  cooperation: 'semantic.low_cooperation',
  pressure: 'semantic.low_pressure',
  reversibility_safety: 'semantic.low_reversibility_safety',
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function scoreOf(assessment: Record<string, unknown>): number {
  if (typeof assessment.score === 'number') return assessment.score;
  const di = asRecord(assessment.day_intelligence);
  if (typeof di?.final_score === 'number') return di.final_score;
  return 0;
}

export function postureOf(assessment: Record<string, unknown> | null): string {
  if (!assessment) return 'insufficient';
  const blob = asRecord(assessment.dimension_classification);
  if (typeof blob?.day_class === 'string' && blob.day_class) return blob.day_class;
  if (typeof assessment.dimension_class === 'string' && assessment.dimension_class) {
    return assessment.dimension_class;
  }
  return 'insufficient';
}

function opportunityCode(score: number): string {
  if (score >= FAVORABLE_SCORE) return 'semantic.opportunity_strong';
  if (score < CHALLENGING_SCORE) return 'semantic.opportunity_weak';
  return 'semantic.opportunity_mixed';
}

function headlineFor(score: number, posture: string, interpretation?: string): string {
  if (posture === 'insufficient' || interpretation === 'insufficient_semantics') {
    return 'semantic.insufficient';
  }
  if (posture === 'review') return 'semantic.review_focus';
  if (posture === 'mixed') return 'semantic.mixed_conflict';
  if (interpretation === 'strong_and_clean') return 'semantic.strong_clean';
  if (interpretation === 'strong_but_selective') return 'semantic.strong_selective';
  if (interpretation === 'strong_but_restrained') return 'semantic.strong_restrained';
  if (interpretation === 'weak_and_defensive') return 'semantic.weak_defensive';
  if (score >= FAVORABLE_SCORE && posture === 'selective') {
    return 'semantic.strong_selective';
  }
  if (score < CHALLENGING_SCORE) return 'semantic.weak_defensive';
  if (score >= FAVORABLE_SCORE && (posture === 'action' || posture === 'high_leverage' || posture === 'build')) {
    return 'semantic.strong_clean';
  }
  return 'semantic.uncertain';
}

function safetyCodes(context: Record<string, unknown> | null): string[] {
  if (!context) return [];
  const level = context.risk_level;
  const high = level === 'high_stakes' || context.high_stakes === true;
  const prohibited = Boolean(context.outcome_prediction_prohibited);
  const deadline = Boolean(context.factual_deadline_priority);
  const codes: string[] = [];
  if (high) {
    codes.push('semantic.high_stakes_review_required');
    codes.push('semantic.no_outcome_prediction');
  } else if (prohibited) {
    codes.push('semantic.no_outcome_prediction');
  }
  if (deadline) codes.push('semantic.deadline_priority');
  return codes;
}

function dimensionCodes(assessment: Record<string, unknown>): {
  support: string[];
  caution: string[];
  evidence: SemanticExplanationInput['evidence_refs'];
} {
  const dims = asRecord(assessment.dimensions);
  const support: { rank: number; key: string; code: string; ids: string[] }[] = [];
  const caution: { rank: number; key: string; code: string; ids: string[] }[] = [];
  if (!dims) return { support: [], caution: [], evidence: [] };
  for (const key of DIMENSION_KEYS) {
    const blob = asRecord(dims[key]);
    if (!blob || blob.status !== 'scored') continue;
    const value = Number(blob.value ?? 0);
    const strength = Number(blob.evidence_strength ?? 0);
    const ids = Array.isArray(blob.dominant_evidence_ids)
      ? blob.dominant_evidence_ids.map(String)
      : [];
    const inverted = INVERTED.has(key);
    const high = value >= HIGH_THRESHOLD;
    const low = value <= LOW_THRESHOLD;
    if (inverted) {
      if (high) caution.push({ rank: value + strength, key, code: DIMENSION_HIGH[key], ids });
      else if (low) {
        support.push({ rank: 100 - value + strength, key, code: DIMENSION_LOW[key], ids });
      }
    } else if (high) {
      support.push({ rank: value + strength, key, code: DIMENSION_HIGH[key], ids });
    } else if (low) {
      caution.push({ rank: 100 - value + strength, key, code: DIMENSION_LOW[key], ids });
    }
  }
  support.sort((a, b) => b.rank - a.rank || a.key.localeCompare(b.key));
  caution.sort((a, b) => b.rank - a.rank || a.key.localeCompare(b.key));
  const topS = support.slice(0, 2);
  const topC = caution.slice(0, 2);
  return {
    support: topS.map((item) => item.code),
    caution: topC.map((item) => item.code),
    evidence: [
      ...topS.map((item) => ({
        code: item.code,
        role: 'support',
        dimension_id: item.key,
        evidence_ids: item.ids,
      })),
      ...topC.map((item) => ({
        code: item.code,
        role: 'caution',
        dimension_id: item.key,
        evidence_ids: item.ids,
      })),
    ],
  };
}

export function explainFromAssessment(
  assessment: Record<string, unknown> | null | undefined,
  policy?: Record<string, unknown> | null
): SemanticExplanationInput | null {
  if (!assessment) return null;
  const score = scoreOf(assessment);
  const posture = postureOf(assessment);
  const interpretation =
    typeof policy?.evaluate_interpretation === 'string'
      ? policy.evaluate_interpretation
      : undefined;
  const headline = headlineFor(score, posture, interpretation);
  const dims = dimensionCodes(assessment);
  const context = asRecord(assessment.context);
  const conflicted = asRecord(assessment.dimension_classification);
  const caution = [...dims.caution];
  if (
    conflicted?.same_dimension_conflict ||
    (Array.isArray(conflicted?.conflicted_dimension_ids) &&
      (conflicted.conflicted_dimension_ids as unknown[]).length > 0)
  ) {
    caution.push('semantic.same_dimension_conflict');
  }
  if (Array.isArray(conflicted?.veto_dimension_ids) && conflicted.veto_dimension_ids.length) {
    caution.push('semantic.veto_present');
  }
  return {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: headline,
    summary_code: headline,
    opportunity_code: opportunityCode(score),
    posture_code: POSTURE_CODES[posture] ?? 'semantic.posture_insufficient',
    tradeoff_code: null,
    caution_codes: caution,
    support_codes: dims.support,
    safety_codes: safetyCodes(context),
    evidence_refs: dims.evidence,
    localization_args: {
      score,
      posture,
      risk_level: context?.risk_level ?? policy?.risk_level ?? null,
    },
  };
}

export function asExplanation(
  value: unknown
): SemanticExplanationInput | null {
  const rec = asRecord(value);
  if (!rec || typeof rec.headline_code !== 'string') return null;
  return rec as SemanticExplanationInput;
}
