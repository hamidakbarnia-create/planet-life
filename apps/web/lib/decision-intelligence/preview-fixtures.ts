import type { SemanticExplanationInput } from './types';

function assessmentExplanation(
  score: number,
  posture: string,
  headline: string,
  extra: Partial<SemanticExplanationInput> = {}
): SemanticExplanationInput {
  return {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: headline,
    summary_code: headline,
    opportunity_code:
      score >= 65
        ? 'semantic.opportunity_strong'
        : score < 45
          ? 'semantic.opportunity_weak'
          : 'semantic.opportunity_mixed',
    posture_code: `semantic.posture_${posture}`,
    tradeoff_code: null,
    caution_codes: [],
    support_codes: [],
    safety_codes: extra.safety_codes ?? [],
    localization_args: { score, posture, ...(extra.localization_args ?? {}) },
    ...extra,
  };
}

export const PREVIEW_MATRIX = {
  strongAction: assessmentExplanation(80, 'action', 'semantic.strong_clean'),
  strongSelective: assessmentExplanation(
    81,
    'selective',
    'semantic.strong_selective'
  ),
  weakDefensive: assessmentExplanation(40, 'defensive', 'semantic.weak_defensive'),
  review: assessmentExplanation(70, 'review', 'semantic.review_focus'),
  mixed: assessmentExplanation(70, 'mixed', 'semantic.mixed_conflict'),
  insufficient: assessmentExplanation(
    70,
    'insufficient',
    'semantic.insufficient'
  ),
  tradeoff: {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: 'semantic.material_tradeoff',
    summary_code: 'semantic.material_tradeoff',
    opportunity_code: 'semantic.higher_score_stronger_opportunity',
    posture_code: 'semantic.lower_score_cleaner_posture',
    tradeoff_code: 'semantic.no_definitive_better',
    caution_codes: [],
    support_codes: [],
    safety_codes: [],
    localization_args: {
      left_id: 'a',
      right_id: 'b',
      score_preference: 'a',
      posture_preference: 'b',
    },
  } satisfies SemanticExplanationInput,
  nearTie: {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: 'semantic.near_tie_cleaner_posture',
    summary_code: 'semantic.near_tie_cleaner_posture',
    opportunity_code: 'semantic.near_tie_opportunity',
    posture_code: 'semantic.cleaner_posture',
    tradeoff_code: null,
    localization_args: {
      left_id: 'a',
      right_id: 'b',
      score_preference: null,
      posture_preference: 'b',
    },
  } satisfies SemanticExplanationInput,
  cleanWindow: {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: 'semantic.window_clean_forward',
    summary_code: 'semantic.window_clean_forward',
    opportunity_code: 'semantic.opportunity_strong',
    posture_code: 'semantic.window_clean_forward',
    localization_args: { find_window_kind: 'clean_forward_window' },
  } satisfies SemanticExplanationInput,
  mixedWindow: {
    schema_version: 'semantic_explanation.v1-shadow',
    semantic_status: 'experimental_shadow',
    headline_code: 'semantic.window_mixed_posture',
    summary_code: 'semantic.window_contains_forward_and_restrictive',
    opportunity_code: 'semantic.opportunity_strong',
    posture_code: 'semantic.window_mixed_posture',
    tradeoff_code: 'semantic.window_contains_forward_and_restrictive',
    localization_args: {
      find_window_kind: 'mixed_posture_window',
      dimension_classes: ['action', 'selective'],
    },
  } satisfies SemanticExplanationInput,
  elevatedInterview: assessmentExplanation(80, 'action', 'semantic.strong_clean', {
    localization_args: { risk_level: 'elevated' },
  }),
  highStakes: assessmentExplanation(81, 'selective', 'semantic.strong_selective', {
    safety_codes: [
      'semantic.high_stakes_review_required',
      'semantic.no_outcome_prediction',
      'semantic.deadline_priority',
    ],
    localization_args: { risk_level: 'high_stakes' },
  }),
};

export const TRADEOFF_LABELS = {
  option_labels: { a: 'Option A', b: 'Option B' },
};
