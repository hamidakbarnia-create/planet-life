/**
 * Deterministic safe fallback for InputAnalysis when parse/validation fails.
 *
 * Informational clarification flags describe analysis truth.
 * Legacy evaluateClarification remains authoritative for UI clarification.
 */

import { DECISION_INTENT_TAXONOMY_VERSION } from './taxonomy';
import { INPUT_ANALYSIS_VERSION, type InputAnalysis } from './types';

/**
 * Safe, always-valid, deterministic InputAnalysis.
 */
export function buildSafeInputAnalysisFallback(): InputAnalysis {
  return {
    version: INPUT_ANALYSIS_VERSION,
    taxonomyVersion: DECISION_INTENT_TAXONOMY_VERSION,
    intent: 'other',
    secondaryIntents: [],
    intentConfidence: 0,
    urgency: 'medium',
    complexity: 'medium',
    decisionStage: 'unknown',
    requiredContext: [],
    missingCriticalContext: [],
    clarificationRequired: true,
    clarificationReason: 'ambiguous_intent',
    safetyDomain: 'none',
  };
}
