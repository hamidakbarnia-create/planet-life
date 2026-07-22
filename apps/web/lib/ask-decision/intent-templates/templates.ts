/**
 * Explicit IntentTemplate registry — one template per DecisionIntent.
 * Known intents never silently fall back to `other`.
 */

import type { DecisionIntent, RequiredContextKey } from '../input-analysis';
import {
  INTENT_TEMPLATE_VERSION,
  type ActionHorizon,
  type DecisionDimension,
  type IntentTemplate,
  type RiskDomain,
} from './types';

const TAIL: DecisionDimension[] = [
  'evidence_quality',
  'missing_information',
  'confidence',
  'next_actions',
  'decision_checkpoint',
];

const DEFAULT_HORIZONS: ActionHorizon[] = [
  'immediate',
  'short_term',
  'long_term',
  'checkpoint',
];

function tpl(
  intent: DecisionIntent,
  dimensions: DecisionDimension[],
  requiredContext: RequiredContextKey[],
  optionalContext: RequiredContextKey[],
  riskDomains: RiskDomain[],
  actionHorizons: ActionHorizon[] = DEFAULT_HORIZONS
): IntentTemplate {
  return {
    version: INTENT_TEMPLATE_VERSION,
    intent,
    templateId: `intent.${intent}.v1`,
    dimensions: [...dimensions],
    requiredContext: [...requiredContext],
    optionalContext: [...optionalContext],
    riskDomains: [...riskDomains],
    actionHorizons: [...actionHorizons],
  };
}

export const CAREER_TEMPLATE = tpl(
  'career',
  [
    'goal',
    'current_state',
    'options',
    'constraints',
    'career_growth',
    'financial_impact',
    'risks',
    'trade_offs',
    'timing',
    'reversibility',
    ...TAIL,
  ],
  [
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
    'primary_goal',
  ],
  ['primary_risk', 'known_constraints', 'reversibility'],
  ['career', 'financial']
);

export const BUSINESS_TEMPLATE = tpl(
  'business',
  [
    'goal',
    'current_state',
    'options',
    'business_viability',
    'financial_impact',
    'constraints',
    'risks',
    'trade_offs',
    'timing',
    'reversibility',
    ...TAIL,
  ],
  [
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
    'primary_risk',
    'known_constraints',
  ],
  ['primary_goal', 'reversibility'],
  ['business', 'financial']
);

export const FINANCE_TEMPLATE = tpl(
  'finance',
  [
    'goal',
    'current_state',
    'options',
    'financial_impact',
    'constraints',
    'risks',
    'trade_offs',
    'timing',
    'reversibility',
    ...TAIL,
  ],
  [
    'financial_impact',
    'primary_risk',
    'decision_deadline',
    'primary_goal',
    'known_constraints',
  ],
  ['current_option', 'alternative_option', 'reversibility'],
  ['financial']
);

export const RELATIONSHIP_TEMPLATE = tpl(
  'relationship',
  [
    'goal',
    'current_state',
    'options',
    'relationship_impact',
    'family_impact',
    'constraints',
    'risks',
    'trade_offs',
    'reversibility',
    'timing',
    ...TAIL,
  ],
  ['relationship_status', 'reversibility', 'primary_goal', 'primary_risk'],
  ['known_constraints', 'decision_deadline'],
  ['relationship', 'family']
);

export const FAMILY_TEMPLATE = tpl(
  'family',
  [
    'goal',
    'current_state',
    'options',
    'family_impact',
    'relationship_impact',
    'constraints',
    'risks',
    'trade_offs',
    'timing',
    'reversibility',
    ...TAIL,
  ],
  [
    'relationship_status',
    'primary_goal',
    'known_constraints',
    'decision_deadline',
  ],
  ['primary_risk', 'reversibility', 'financial_impact'],
  ['family', 'relationship']
);

export const RELOCATION_TEMPLATE = tpl(
  'relocation',
  [
    'goal',
    'current_state',
    'options',
    'location_impact',
    'financial_impact',
    'constraints',
    'risks',
    'trade_offs',
    'timing',
    'reversibility',
    ...TAIL,
  ],
  [
    'location',
    'current_option',
    'alternative_option',
    'financial_impact',
    'decision_deadline',
  ],
  ['known_constraints', 'primary_goal', 'primary_risk'],
  ['relocation', 'financial', 'career']
);

export const EDUCATION_TEMPLATE = tpl(
  'education',
  [
    'goal',
    'current_state',
    'options',
    'career_growth',
    'financial_impact',
    'constraints',
    'risks',
    'trade_offs',
    'timing',
    ...TAIL,
  ],
  ['current_option', 'alternative_option', 'financial_impact', 'primary_goal'],
  ['decision_deadline', 'known_constraints'],
  ['career', 'financial']
);

/** Policy-safe: evaluation dimensions only — no diagnosis/treatment encoding. */
export const HEALTH_TEMPLATE = tpl(
  'health',
  [
    'goal',
    'current_state',
    'options',
    'health_impact',
    'constraints',
    'risks',
    ...TAIL,
  ],
  ['health_context', 'primary_goal', 'known_constraints', 'primary_risk'],
  ['decision_deadline', 'reversibility'],
  ['health', 'safety'],
  ['immediate', 'short_term', 'checkpoint']
);

export const PERSONAL_GROWTH_TEMPLATE = tpl(
  'personal_growth',
  [
    'goal',
    'current_state',
    'options',
    'constraints',
    'benefits',
    'risks',
    'trade_offs',
    'timing',
    ...TAIL,
  ],
  ['primary_goal', 'known_constraints', 'decision_deadline'],
  ['primary_risk', 'reversibility'],
  ['none']
);

export const TIMING_TEMPLATE = tpl(
  'timing',
  [
    'goal',
    'current_state',
    'options',
    'timing',
    'constraints',
    'risks',
    'trade_offs',
    ...TAIL,
  ],
  [
    'decision_deadline',
    'current_option',
    'alternative_option',
    'primary_goal',
  ],
  ['known_constraints', 'primary_risk'],
  ['none'],
  ['immediate', 'short_term', 'checkpoint']
);

export const OTHER_TEMPLATE = tpl(
  'other',
  [
    'goal',
    'current_state',
    'options',
    'constraints',
    'risks',
    'trade_offs',
    'missing_information',
    'confidence',
    'next_actions',
    'decision_checkpoint',
  ],
  ['primary_goal', 'known_constraints', 'decision_deadline'],
  ['primary_risk', 'current_option', 'alternative_option'],
  ['none']
);

/** Complete registry — every DecisionIntent exactly once. */
export const INTENT_TEMPLATE_REGISTRY: Record<DecisionIntent, IntentTemplate> = {
  career: CAREER_TEMPLATE,
  business: BUSINESS_TEMPLATE,
  finance: FINANCE_TEMPLATE,
  relationship: RELATIONSHIP_TEMPLATE,
  family: FAMILY_TEMPLATE,
  relocation: RELOCATION_TEMPLATE,
  education: EDUCATION_TEMPLATE,
  health: HEALTH_TEMPLATE,
  personal_growth: PERSONAL_GROWTH_TEMPLATE,
  timing: TIMING_TEMPLATE,
  other: OTHER_TEMPLATE,
};

export function getIntentTemplate(intent: DecisionIntent): IntentTemplate {
  const template = INTENT_TEMPLATE_REGISTRY[intent];
  if (!template) {
    throw new Error(`Missing IntentTemplate for intent: ${intent}`);
  }
  if (template.intent !== intent) {
    throw new Error(
      `IntentTemplate intent mismatch: registry[${intent}] has intent=${template.intent}`
    );
  }
  return template;
}

/**
 * Restricted supplemental dimensions a secondary intent may append.
 * `other` contributes nothing.
 */
export const SECONDARY_SUPPLEMENTAL_DIMENSIONS: Record<
  DecisionIntent,
  readonly DecisionDimension[]
> = {
  career: ['career_growth'],
  business: ['business_viability'],
  finance: ['financial_impact'],
  relationship: ['relationship_impact'],
  family: ['family_impact'],
  relocation: ['location_impact'],
  education: ['career_growth'],
  health: ['health_impact'],
  personal_growth: ['benefits'],
  timing: ['timing'],
  other: [],
};

export const SECONDARY_SUPPLEMENTAL_RISKS: Record<
  DecisionIntent,
  readonly RiskDomain[]
> = {
  career: ['career'],
  business: ['business'],
  finance: ['financial'],
  relationship: ['relationship'],
  family: ['family'],
  relocation: ['relocation'],
  education: ['career'],
  health: ['health', 'safety'],
  personal_growth: [],
  timing: [],
  other: [],
};
