/**
 * Strict runtime validation for ReasoningPlan.
 * Rejects unknown fields; does not silently repair structural errors.
 */

import {
  DECISION_INTENTS_V1,
  REQUIRED_CONTEXT_KEYS,
  type RequiredContextKey,
} from '../input-analysis';
import {
  ACTION_HORIZONS,
  DECISION_DIMENSIONS,
  RISK_DOMAINS,
} from '../intent-templates';
import {
  PLANNED_DIMENSION_STATUSES,
  REASONING_PLAN_KEYS,
  REASONING_PLAN_TEMPLATE_VERSION,
  REASONING_PLAN_VERSION,
  type ReasoningPlan,
} from './types';

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function validateKeyList(
  value: unknown,
  path: string,
  errors: string[]
): void {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return;
  }
  const seen = new Set<string>();
  for (const k of value) {
    if (!isIn(k, REQUIRED_CONTEXT_KEYS)) {
      errors.push(`${path} invalid key: ${String(k)}`);
    } else if (seen.has(k)) {
      errors.push(`${path} duplicate: ${k}`);
    } else {
      seen.add(k);
    }
  }
}

export type ReasoningPlanValidationResult =
  | { ok: true; value: ReasoningPlan }
  | { ok: false; errors: string[] };

export function validateReasoningPlan(
  value: unknown
): ReasoningPlanValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['ReasoningPlan must be a plain object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set<string>(REASONING_PLAN_KEYS);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${key}`);
  }
  for (const key of REASONING_PLAN_KEYS) {
    if (!(key in obj)) errors.push(`Missing field: ${key}`);
  }

  if (obj.version !== REASONING_PLAN_VERSION) {
    errors.push(`version must be "${REASONING_PLAN_VERSION}"`);
  }
  if (obj.templateVersion !== REASONING_PLAN_TEMPLATE_VERSION) {
    errors.push(
      `templateVersion must be "${REASONING_PLAN_TEMPLATE_VERSION}"`
    );
  }
  if (typeof obj.planId !== 'string' || !obj.planId.trim()) {
    errors.push('planId must be a non-empty string');
  }
  if (!isIn(obj.primaryIntent, DECISION_INTENTS_V1)) {
    errors.push(`primaryIntent invalid: ${String(obj.primaryIntent)}`);
  }
  if (!Array.isArray(obj.secondaryIntents)) {
    errors.push('secondaryIntents must be an array');
  } else {
    if (obj.secondaryIntents.length > 2) {
      errors.push('secondaryIntents max length is 2');
    }
    const seen = new Set<string>();
    for (const s of obj.secondaryIntents) {
      if (!isIn(s, DECISION_INTENTS_V1)) {
        errors.push(`secondaryIntents invalid: ${String(s)}`);
      } else if (s === obj.primaryIntent) {
        errors.push('secondaryIntents must not include primaryIntent');
      } else if (seen.has(s)) {
        errors.push(`secondaryIntents duplicate: ${s}`);
      } else {
        seen.add(s);
      }
    }
  }

  if (typeof obj.templateId !== 'string') {
    errors.push('templateId must be a string');
  } else if (
    typeof obj.primaryIntent === 'string' &&
    obj.templateId !== `intent.${obj.primaryIntent}.v1`
  ) {
    errors.push(
      `templateId must match selected intent template (intent.${String(obj.primaryIntent)}.v1)`
    );
  }

  if (!Array.isArray(obj.dimensions)) {
    errors.push('dimensions must be an array');
  } else {
    const dimSeen = new Set<string>();
    const priorities = new Set<number>();
    obj.dimensions.forEach((d, i) => {
      if (d == null || typeof d !== 'object' || Array.isArray(d)) {
        errors.push(`dimensions[${i}] must be an object`);
        return;
      }
      const row = d as Record<string, unknown>;
      for (const key of Object.keys(row)) {
        if (!['dimension', 'priority', 'status', 'requiredContext'].includes(key)) {
          errors.push(`dimensions[${i}]: unknown field ${key}`);
        }
      }
      if (!isIn(row.dimension, DECISION_DIMENSIONS)) {
        errors.push(`dimensions[${i}].dimension invalid: ${String(row.dimension)}`);
      } else if (dimSeen.has(row.dimension)) {
        errors.push(`duplicate dimension: ${row.dimension}`);
      } else {
        dimSeen.add(row.dimension);
      }
      if (typeof row.priority !== 'number' || !Number.isInteger(row.priority)) {
        errors.push(`dimensions[${i}].priority must be an integer`);
      } else if (row.priority !== i + 1) {
        errors.push(
          `dimensions[${i}].priority must be sequential unique starting at 1 (expected ${i + 1})`
        );
      } else if (priorities.has(row.priority)) {
        errors.push(`duplicate priority: ${row.priority}`);
      } else {
        priorities.add(row.priority);
      }
      if (!isIn(row.status, PLANNED_DIMENSION_STATUSES)) {
        errors.push(`dimensions[${i}].status invalid: ${String(row.status)}`);
      }
      validateKeyList(row.requiredContext, `dimensions[${i}].requiredContext`, errors);
    });
  }

  validateKeyList(obj.requiredContext, 'requiredContext', errors);
  validateKeyList(obj.availableContext, 'availableContext', errors);
  validateKeyList(obj.missingContext, 'missingContext', errors);

  if (Array.isArray(obj.availableContext) && Array.isArray(obj.missingContext)) {
    const miss = new Set(obj.missingContext as string[]);
    for (const k of obj.availableContext as RequiredContextKey[]) {
      if (miss.has(k)) {
        errors.push(`available and missing context overlap: ${k}`);
      }
    }
  }

  if (!Array.isArray(obj.riskDomains)) {
    errors.push('riskDomains must be an array');
  } else {
    const seen = new Set<string>();
    for (const r of obj.riskDomains) {
      if (!isIn(r, RISK_DOMAINS)) {
        errors.push(`riskDomains invalid: ${String(r)}`);
      } else if (seen.has(r)) {
        errors.push(`riskDomains duplicate: ${r}`);
      } else {
        seen.add(r);
      }
    }
  }

  if (!Array.isArray(obj.actionHorizons)) {
    errors.push('actionHorizons must be an array');
  } else {
    const seen = new Set<string>();
    for (const h of obj.actionHorizons) {
      if (!isIn(h, ACTION_HORIZONS)) {
        errors.push(`actionHorizons invalid: ${String(h)}`);
      } else if (seen.has(h)) {
        errors.push(`actionHorizons duplicate: ${h}`);
      } else {
        seen.add(h);
      }
    }
  }

  if (typeof obj.clarificationRecommended !== 'boolean') {
    errors.push('clarificationRecommended must be boolean');
  }

  if (typeof obj.confidence !== 'number' || !Number.isFinite(obj.confidence)) {
    errors.push('confidence must be a finite number');
  } else if (obj.confidence < 0 || obj.confidence > 1) {
    errors.push('confidence must be in range 0–1');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: obj as unknown as ReasoningPlan };
}
