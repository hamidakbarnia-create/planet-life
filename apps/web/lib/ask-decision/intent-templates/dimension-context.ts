/**
 * Explicit DecisionDimension readiness rules.
 * Single source of truth — not scattered through conditionals.
 */

import type { RequiredContextKey } from '../input-analysis';
import type { DecisionDimension } from './types';

export type DimensionReadinessMode = 'context_required' | 'procedural';

export type DimensionReadinessRule = {
  requiredContext: readonly RequiredContextKey[];
  mode: DimensionReadinessMode;
};

/**
 * context_required: readiness from positive evidence of required keys.
 * procedural: readiness from explicit procedural rules in context-readiness.ts
 *   (never via empty-array every() → ready).
 */
export const DIMENSION_READINESS_RULES: Record<
  DecisionDimension,
  DimensionReadinessRule
> = {
  goal: { requiredContext: ['primary_goal'], mode: 'context_required' },
  current_state: {
    requiredContext: ['current_option'],
    mode: 'context_required',
  },
  options: {
    requiredContext: ['current_option', 'alternative_option'],
    mode: 'context_required',
  },
  constraints: {
    requiredContext: ['known_constraints'],
    mode: 'context_required',
  },
  benefits: { requiredContext: ['primary_goal'], mode: 'context_required' },
  risks: { requiredContext: ['primary_risk'], mode: 'context_required' },
  trade_offs: {
    requiredContext: ['current_option', 'alternative_option'],
    mode: 'context_required',
  },
  financial_impact: {
    requiredContext: ['financial_impact'],
    mode: 'context_required',
  },
  relationship_impact: {
    requiredContext: ['relationship_status'],
    mode: 'context_required',
  },
  family_impact: {
    requiredContext: ['relationship_status'],
    mode: 'context_required',
  },
  health_impact: {
    requiredContext: ['health_context'],
    mode: 'context_required',
  },
  career_growth: {
    requiredContext: ['primary_goal', 'current_option'],
    mode: 'context_required',
  },
  business_viability: {
    requiredContext: ['primary_goal', 'financial_impact'],
    mode: 'context_required',
  },
  location_impact: {
    requiredContext: ['location'],
    mode: 'context_required',
  },
  /**
   * Timing Intelligence readiness is procedural — not via decision_deadline.
   * Timing payload is never treated as RequiredContextKey evidence.
   */
  timing: {
    requiredContext: [],
    mode: 'procedural',
  },
  reversibility: {
    requiredContext: ['reversibility'],
    mode: 'context_required',
  },
  // Procedural dimensions — requiredContext documents related keys only.
  evidence_quality: { requiredContext: [], mode: 'procedural' },
  missing_information: { requiredContext: [], mode: 'procedural' },
  confidence: { requiredContext: [], mode: 'procedural' },
  next_actions: {
    requiredContext: ['primary_goal'],
    mode: 'procedural',
  },
  decision_checkpoint: {
    requiredContext: ['decision_deadline'],
    mode: 'procedural',
  },
};

/** @deprecated use DIMENSION_READINESS_RULES — kept as key list helper */
export const DIMENSION_REQUIRED_CONTEXT: Record<
  DecisionDimension,
  readonly RequiredContextKey[]
> = Object.fromEntries(
  (
    Object.entries(DIMENSION_READINESS_RULES) as [
      DecisionDimension,
      DimensionReadinessRule,
    ][]
  ).map(([dim, rule]) => [dim, rule.requiredContext])
) as Record<DecisionDimension, readonly RequiredContextKey[]>;
