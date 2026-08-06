export {
  DECISION_INTENT_TAXONOMY_VERSION,
  DECISION_INTENTS_V1,
  DECISION_INTENT_ALIASES,
  normalizeIntent,
  isDecisionIntent,
} from './taxonomy';
export type { DecisionIntent } from './taxonomy';

export {
  INPUT_ANALYSIS_VERSION,
  INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD,
  INPUT_ANALYSIS_KEYS,
  INPUT_URGENCY_LEVELS,
  INPUT_COMPLEXITY_LEVELS,
  DECISION_STAGES,
  CLARIFICATION_REASONS,
  SAFETY_DOMAINS,
  REQUIRED_CONTEXT_KEYS,
  MAX_SECONDARY_INTENTS,
} from './types';
export type {
  InputAnalysis,
  InputUrgency,
  InputComplexity,
  DecisionStage,
  ClarificationReason,
  SafetyDomain,
  RequiredContextKey,
} from './types';

export {
  validateInputAnalysis,
  type InputAnalysisValidationResult,
} from './validate';
export { buildSafeInputAnalysisFallback } from './fallback';
export { buildInputAnalysis, parseInputAnalysis } from './analyze';
export { decisionIntentToAskIntent } from './bridge';
