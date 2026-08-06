/**
 * InputAnalysis contract v1 — structured first stage of Decision OS.
 * Strict controlled vocabularies; no arbitrary strings for enum-like fields.
 */

import { DECISION_INTENT_TAXONOMY_VERSION, type DecisionIntent } from './taxonomy';

/** InputAnalysis contract schema version (independent of AskDecisionResult). */
export const INPUT_ANALYSIS_VERSION = '1.0.0';

/**
 * Shared clarification confidence threshold.
 * Analyzer and validator must use this same constant.
 */
export const INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD = 0.65;

export type { DecisionIntent };
export { DECISION_INTENT_TAXONOMY_VERSION };

export const INPUT_URGENCY_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;
export type InputUrgency = (typeof INPUT_URGENCY_LEVELS)[number];

export const INPUT_COMPLEXITY_LEVELS = ['low', 'medium', 'high'] as const;
export type InputComplexity = (typeof INPUT_COMPLEXITY_LEVELS)[number];

export const DECISION_STAGES = [
  'exploring',
  'comparing',
  'ready_to_act',
  'post_decision',
  'unknown',
] as const;
export type DecisionStage = (typeof DECISION_STAGES)[number];

export const CLARIFICATION_REASONS = [
  'missing_critical_context',
  'ambiguous_intent',
  'safety',
  'none',
] as const;
export type ClarificationReason = (typeof CLARIFICATION_REASONS)[number];

export const SAFETY_DOMAINS = [
  'none',
  'health',
  'financial',
  'legal',
  'self_harm',
  'other_high_risk',
] as const;
export type SafetyDomain = (typeof SAFETY_DOMAINS)[number];

/** Controlled vocabulary for required / missing context keys (v1). */
export const REQUIRED_CONTEXT_KEYS = [
  'decision_deadline',
  'current_option',
  'alternative_option',
  'financial_impact',
  'reversibility',
  'primary_goal',
  'primary_risk',
  'location',
  'relationship_status',
  'health_context',
  'known_constraints',
] as const;
export type RequiredContextKey = (typeof REQUIRED_CONTEXT_KEYS)[number];

export const MAX_SECONDARY_INTENTS = 2;

export type InputAnalysis = {
  version: typeof INPUT_ANALYSIS_VERSION;
  taxonomyVersion: typeof DECISION_INTENT_TAXONOMY_VERSION;
  /** Singular primary intent. */
  intent: DecisionIntent;
  /** 0–2 unique secondary intents; never includes primary. */
  secondaryIntents: DecisionIntent[];
  /** Finite number in range 0–1 inclusive. */
  intentConfidence: number;
  urgency: InputUrgency;
  complexity: InputComplexity;
  decisionStage: DecisionStage;
  requiredContext: RequiredContextKey[];
  missingCriticalContext: RequiredContextKey[];
  clarificationRequired: boolean;
  clarificationReason: ClarificationReason;
  safetyDomain: SafetyDomain;
};

export const INPUT_ANALYSIS_KEYS = [
  'version',
  'taxonomyVersion',
  'intent',
  'secondaryIntents',
  'intentConfidence',
  'urgency',
  'complexity',
  'decisionStage',
  'requiredContext',
  'missingCriticalContext',
  'clarificationRequired',
  'clarificationReason',
  'safetyDomain',
] as const satisfies ReadonlyArray<keyof InputAnalysis>;
