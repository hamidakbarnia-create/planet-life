/**
 * IntentTemplate contract v1 — declarative decision-dimension blueprints.
 */

import type { DecisionIntent, RequiredContextKey } from '../input-analysis';

export const INTENT_TEMPLATE_VERSION = '1.0.0';

export const DECISION_DIMENSIONS = [
  'goal',
  'current_state',
  'options',
  'constraints',
  'benefits',
  'risks',
  'trade_offs',
  'financial_impact',
  'relationship_impact',
  'family_impact',
  'health_impact',
  'career_growth',
  'business_viability',
  'location_impact',
  'timing',
  'reversibility',
  'evidence_quality',
  'missing_information',
  'confidence',
  'next_actions',
  'decision_checkpoint',
] as const;
export type DecisionDimension = (typeof DECISION_DIMENSIONS)[number];

export const RISK_DOMAINS = [
  'none',
  'financial',
  'career',
  'business',
  'relationship',
  'family',
  'health',
  'legal',
  'relocation',
  'safety',
] as const;
export type RiskDomain = (typeof RISK_DOMAINS)[number];

export const ACTION_HORIZONS = [
  'immediate',
  'short_term',
  'long_term',
  'checkpoint',
] as const;
export type ActionHorizon = (typeof ACTION_HORIZONS)[number];

export type IntentTemplate = {
  version: typeof INTENT_TEMPLATE_VERSION;
  intent: DecisionIntent;
  templateId: string;
  dimensions: DecisionDimension[];
  requiredContext: RequiredContextKey[];
  optionalContext: RequiredContextKey[];
  riskDomains: RiskDomain[];
  actionHorizons: ActionHorizon[];
};

export const INTENT_TEMPLATE_KEYS = [
  'version',
  'intent',
  'templateId',
  'dimensions',
  'requiredContext',
  'optionalContext',
  'riskDomains',
  'actionHorizons',
] as const satisfies ReadonlyArray<keyof IntentTemplate>;
