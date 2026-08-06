/** Strict validation for AskDecisionResult. */

import {
  ASK_DECISION_SCHEMA_VERSION,
  ACTION_PRIORITIES,
  CONFIDENCE_LEVELS,
  MODULE_IDS,
  RECOMMENDATION_STATUSES,
  type AskDecisionResult,
} from './types';

export type AskValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

function bounded(n: unknown): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;
}

export function validateAskDecisionResult(
  result: AskDecisionResult
): AskValidationResult {
  const errors: string[] = [];

  if (result.schemaVersion !== ASK_DECISION_SCHEMA_VERSION) {
    errors.push('schemaVersion mismatch');
  }
  if (!result.recommendation?.trim()) errors.push('recommendation empty');
  if (
    !(RECOMMENDATION_STATUSES as readonly string[]).includes(
      result.recommendationStatus
    )
  ) {
    errors.push('recommendationStatus invalid');
  }

  for (const key of [
    'opportunity',
    'risk',
    'timing',
    'readiness',
    'confidence',
  ] as const) {
    const s = result.scores?.[key];
    if (!s || !bounded(s.value) || !s.rationale?.trim()) {
      errors.push(`score.${key} invalid`);
    }
  }

  if (!Array.isArray(result.analysis) || result.analysis.length < 6) {
    errors.push('analysis incomplete');
  }

  for (const bucket of ['now', 'next7Days', 'next30Days'] as const) {
    const list = result.actionPlan?.[bucket];
    if (!Array.isArray(list) || list.length === 0) {
      errors.push(`actionPlan.${bucket} empty`);
    } else {
      for (const a of list.slice(0, 3)) {
        if (!a.action?.trim()) errors.push(`actionPlan.${bucket} action empty`);
        if (!(ACTION_PRIORITIES as readonly string[]).includes(a.priority)) {
          errors.push(`actionPlan.${bucket} priority invalid`);
        }
      }
    }
  }

  if (!result.confidence || !(CONFIDENCE_LEVELS as readonly string[]).includes(result.confidence.level)) {
    errors.push('confidence.level invalid');
  }
  if (!bounded(result.confidence?.score)) errors.push('confidence.score invalid');

  if (!Array.isArray(result.followUpQuestions) || result.followUpQuestions.length !== 3) {
    errors.push('followUpQuestions must be 3');
  }

  if ((result.relatedModules?.length ?? 0) > 3) {
    errors.push('relatedModules exceed max 3');
  }
  for (const m of result.relatedModules ?? []) {
    if (!(MODULE_IDS as readonly string[]).includes(m.module)) {
      errors.push(`relatedModule invalid: ${m.module}`);
    }
  }

  const words = result.executiveSummary?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) errors.push('executiveSummary empty');
  if (words.length > 100) errors.push('executiveSummary too long');

  if (!result.timing || typeof result.timing.applicable !== 'boolean') {
    errors.push('timing invalid');
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
