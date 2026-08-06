export {
  INTENT_TEMPLATE_VERSION,
  DECISION_DIMENSIONS,
  RISK_DOMAINS,
  ACTION_HORIZONS,
  INTENT_TEMPLATE_KEYS,
} from './types';
export type {
  IntentTemplate,
  DecisionDimension,
  RiskDomain,
  ActionHorizon,
} from './types';

export {
  INTENT_TEMPLATE_REGISTRY,
  getIntentTemplate,
  SECONDARY_SUPPLEMENTAL_DIMENSIONS,
  SECONDARY_SUPPLEMENTAL_RISKS,
  CAREER_TEMPLATE,
  BUSINESS_TEMPLATE,
  FINANCE_TEMPLATE,
  RELATIONSHIP_TEMPLATE,
  FAMILY_TEMPLATE,
  RELOCATION_TEMPLATE,
  EDUCATION_TEMPLATE,
  HEALTH_TEMPLATE,
  PERSONAL_GROWTH_TEMPLATE,
  TIMING_TEMPLATE,
  OTHER_TEMPLATE,
} from './templates';

export {
  DIMENSION_READINESS_RULES,
  DIMENSION_REQUIRED_CONTEXT,
} from './dimension-context';
export type {
  DimensionReadinessRule,
  DimensionReadinessMode,
} from './dimension-context';
