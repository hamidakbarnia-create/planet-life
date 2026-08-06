/**
 * ReasoningPlan contract v1 — declarative evaluation plan only.
 * No prose, recommendations, chain-of-thought, or prompt text.
 */

import type { DecisionIntent, RequiredContextKey } from '../input-analysis';
import type {
  ActionHorizon,
  DecisionDimension,
  RiskDomain,
} from '../intent-templates';

export const REASONING_PLAN_VERSION = '1.0.0';
export const REASONING_PLAN_TEMPLATE_VERSION = '1.0.0';

export const PLANNED_DIMENSION_STATUSES = [
  'ready',
  'partial',
  'blocked',
] as const;
export type PlannedDimensionStatus =
  (typeof PLANNED_DIMENSION_STATUSES)[number];

export type PlannedDimension = {
  dimension: DecisionDimension;
  priority: number;
  status: PlannedDimensionStatus;
  requiredContext: RequiredContextKey[];
};

export type ReasoningPlan = {
  version: typeof REASONING_PLAN_VERSION;
  templateVersion: typeof REASONING_PLAN_TEMPLATE_VERSION;
  planId: string;
  primaryIntent: DecisionIntent;
  secondaryIntents: DecisionIntent[];
  templateId: string;
  dimensions: PlannedDimension[];
  requiredContext: RequiredContextKey[];
  availableContext: RequiredContextKey[];
  missingContext: RequiredContextKey[];
  riskDomains: RiskDomain[];
  actionHorizons: ActionHorizon[];
  clarificationRecommended: boolean;
  confidence: number;
};

export const REASONING_PLAN_KEYS = [
  'version',
  'templateVersion',
  'planId',
  'primaryIntent',
  'secondaryIntents',
  'templateId',
  'dimensions',
  'requiredContext',
  'availableContext',
  'missingContext',
  'riskDomains',
  'actionHorizons',
  'clarificationRecommended',
  'confidence',
] as const satisfies ReadonlyArray<keyof ReasoningPlan>;
