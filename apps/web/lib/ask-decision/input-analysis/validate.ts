/**
 * Strict runtime validation for InputAnalysis.
 * Rejects unknown fields; does not silently repair structural violations.
 */

import {
  DECISION_INTENT_TAXONOMY_VERSION,
  isDecisionIntent,
} from './taxonomy';
import {
  CLARIFICATION_REASONS,
  DECISION_STAGES,
  INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD,
  INPUT_ANALYSIS_KEYS,
  INPUT_ANALYSIS_VERSION,
  INPUT_COMPLEXITY_LEVELS,
  INPUT_URGENCY_LEVELS,
  MAX_SECONDARY_INTENTS,
  REQUIRED_CONTEXT_KEYS,
  SAFETY_DOMAINS,
  type InputAnalysis,
  type RequiredContextKey,
} from './types';

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function isContextKey(value: unknown): value is RequiredContextKey {
  return isIn(value, REQUIRED_CONTEXT_KEYS);
}

export type InputAnalysisValidationResult =
  | { ok: true; value: InputAnalysis }
  | { ok: false; errors: string[] };

export function validateInputAnalysis(
  value: unknown
): InputAnalysisValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['InputAnalysis must be a plain object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set<string>(INPUT_ANALYSIS_KEYS);

  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) {
      errors.push(`Unknown field: ${key}`);
    }
  }

  for (const key of INPUT_ANALYSIS_KEYS) {
    if (!(key in obj)) {
      errors.push(`Missing field: ${key}`);
    }
  }

  if (obj.version !== INPUT_ANALYSIS_VERSION) {
    errors.push(
      `version must be "${INPUT_ANALYSIS_VERSION}" (got ${String(obj.version)})`
    );
  }
  if (obj.taxonomyVersion !== DECISION_INTENT_TAXONOMY_VERSION) {
    errors.push(
      `taxonomyVersion must be "${DECISION_INTENT_TAXONOMY_VERSION}" (got ${String(obj.taxonomyVersion)})`
    );
  }

  if (typeof obj.intent !== 'string' || !isDecisionIntent(obj.intent)) {
    errors.push(`intent must be a DecisionIntent v1 (got ${String(obj.intent)})`);
  }

  if (!Array.isArray(obj.secondaryIntents)) {
    errors.push('secondaryIntents must be an array');
  } else {
    if (obj.secondaryIntents.length > MAX_SECONDARY_INTENTS) {
      errors.push(
        `secondaryIntents max length is ${MAX_SECONDARY_INTENTS}`
      );
    }
    const seen = new Set<string>();
    for (const s of obj.secondaryIntents) {
      if (typeof s !== 'string' || !isDecisionIntent(s)) {
        errors.push(`secondaryIntents contains invalid intent: ${String(s)}`);
        continue;
      }
      if (s === obj.intent) {
        errors.push('secondaryIntents must not include primary intent');
      }
      if (seen.has(s)) {
        errors.push(`secondaryIntents duplicate: ${s}`);
      }
      seen.add(s);
    }
  }

  if (
    typeof obj.intentConfidence !== 'number' ||
    !Number.isFinite(obj.intentConfidence)
  ) {
    errors.push('intentConfidence must be a finite number');
  } else if (obj.intentConfidence < 0 || obj.intentConfidence > 1) {
    errors.push('intentConfidence must be in range 0–1');
  }

  if (!isIn(obj.urgency, INPUT_URGENCY_LEVELS)) {
    errors.push(`urgency invalid: ${String(obj.urgency)}`);
  }
  if (!isIn(obj.complexity, INPUT_COMPLEXITY_LEVELS)) {
    errors.push(`complexity invalid: ${String(obj.complexity)}`);
  }
  if (!isIn(obj.decisionStage, DECISION_STAGES)) {
    errors.push(`decisionStage invalid: ${String(obj.decisionStage)}`);
  }
  if (!isIn(obj.clarificationReason, CLARIFICATION_REASONS)) {
    errors.push(
      `clarificationReason invalid: ${String(obj.clarificationReason)}`
    );
  }
  if (!isIn(obj.safetyDomain, SAFETY_DOMAINS)) {
    errors.push(`safetyDomain invalid: ${String(obj.safetyDomain)}`);
  }

  if (typeof obj.clarificationRequired !== 'boolean') {
    errors.push('clarificationRequired must be boolean');
  }

  if (!Array.isArray(obj.requiredContext)) {
    errors.push('requiredContext must be an array');
  } else {
    const seen = new Set<string>();
    for (const c of obj.requiredContext) {
      if (!isContextKey(c)) {
        errors.push(`requiredContext invalid key: ${String(c)}`);
      } else if (seen.has(c)) {
        errors.push(`requiredContext duplicate: ${c}`);
      } else {
        seen.add(c);
      }
    }
  }

  if (!Array.isArray(obj.missingCriticalContext)) {
    errors.push('missingCriticalContext must be an array');
  } else {
    const seen = new Set<string>();
    for (const c of obj.missingCriticalContext) {
      if (!isContextKey(c)) {
        errors.push(`missingCriticalContext invalid key: ${String(c)}`);
      } else if (seen.has(c)) {
        errors.push(`missingCriticalContext duplicate: ${c}`);
      } else {
        seen.add(c);
      }
    }
    if (Array.isArray(obj.requiredContext)) {
      const req = new Set(obj.requiredContext as string[]);
      for (const c of obj.missingCriticalContext as string[]) {
        if (isContextKey(c) && !req.has(c)) {
          errors.push(
            `missingCriticalContext key not in requiredContext: ${c}`
          );
        }
      }
    }
  }

  // Semantic clarification invariants (same threshold as analyzer)
  const confidence =
    typeof obj.intentConfidence === 'number' &&
    Number.isFinite(obj.intentConfidence)
      ? obj.intentConfidence
      : null;
  const missingLen = Array.isArray(obj.missingCriticalContext)
    ? obj.missingCriticalContext.length
    : -1;
  const required = obj.clarificationRequired;
  const reason = obj.clarificationReason;
  const safety = obj.safetyDomain;
  const intent = obj.intent;

  if (required === false && reason !== 'none') {
    errors.push(
      'clarificationRequired=false requires clarificationReason=none'
    );
  }
  if (reason === 'none' && required !== false) {
    errors.push(
      'clarificationReason=none requires clarificationRequired=false'
    );
  }
  if (required === true && reason === 'none') {
    errors.push(
      'clarificationRequired=true requires clarificationReason ≠ none'
    );
  }

  if (missingLen > 0 && required !== true) {
    errors.push(
      'missingCriticalContext.length > 0 requires clarificationRequired=true'
    );
  }

  if (
    confidence != null &&
    confidence < INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD &&
    required !== true
  ) {
    errors.push(
      `intentConfidence below ${INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD} requires clarificationRequired=true`
    );
  }

  if (reason === 'missing_critical_context' && missingLen === 0) {
    errors.push(
      'clarificationReason=missing_critical_context requires non-empty missingCriticalContext'
    );
  }

  if (reason === 'ambiguous_intent') {
    const low =
      confidence != null &&
      confidence < INPUT_ANALYSIS_CLARIFICATION_CONFIDENCE_THRESHOLD;
    const isOther = intent === 'other';
    if (!low && !isOther) {
      errors.push(
        'clarificationReason=ambiguous_intent requires low confidence or intent=other'
      );
    }
  }

  if (reason === 'safety' && safety === 'none') {
    errors.push(
      'clarificationReason=safety requires safetyDomain !== none'
    );
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, value: obj as unknown as InputAnalysis };
}
