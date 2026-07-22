/**
 * Strict validation for SerializedDecisionPromptContext.
 */

import {
  DECISION_INTENTS_V1,
  DECISION_STAGES,
  INPUT_COMPLEXITY_LEVELS,
  INPUT_URGENCY_LEVELS,
  REQUIRED_CONTEXT_KEYS,
} from '../input-analysis';
import { CONTEXT_SOURCES } from '../context-builder';
import {
  ACTION_HORIZONS,
  DECISION_DIMENSIONS,
  RISK_DOMAINS,
} from '../intent-templates';
import { PLANNED_DIMENSION_STATUSES } from '../reasoning-planner';
import {
  PROMPT_CONTEXT_LIMITS,
  SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION,
  type SerializedDecisionPromptContext,
} from './types';

const LOCALES = ['en', 'ru', 'fa', 'ar'] as const;

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export type SerializedPromptContextValidationResult =
  | { ok: true; value: SerializedDecisionPromptContext }
  | { ok: false; errors: string[] };

export function validateSerializedDecisionPromptContext(
  value: unknown
): SerializedPromptContextValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['SerializedDecisionPromptContext must be object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set([
    'version',
    'intent',
    'question',
    'locale',
    'facts',
    'constraints',
    'timing',
    'conversation',
    'evaluationPlan',
    'missingContext',
    'riskDomains',
    'actionHorizons',
    'clarificationRecommended',
  ]);

  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${key}`);
  }

  if (obj.version !== SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION) {
    errors.push(`version must be "${SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION}"`);
  }
  if (typeof obj.question !== 'string') errors.push('question must be string');
  else if (obj.question.length > PROMPT_CONTEXT_LIMITS.questionChars) {
    errors.push('question exceeds limit');
  }
  if (!isIn(obj.locale, LOCALES)) errors.push(`locale invalid: ${String(obj.locale)}`);

  if (obj.intent == null || typeof obj.intent !== 'object' || Array.isArray(obj.intent)) {
    errors.push('intent must be object');
  } else {
    const intent = obj.intent as Record<string, unknown>;
    for (const k of Object.keys(intent)) {
      if (
        !['primary', 'secondary', 'confidence', 'urgency', 'complexity', 'stage'].includes(
          k
        )
      ) {
        errors.push(`intent: unknown field ${k}`);
      }
    }
    if (!isIn(intent.primary, DECISION_INTENTS_V1)) {
      errors.push('intent.primary invalid');
    }
    if (!Array.isArray(intent.secondary)) errors.push('intent.secondary must be array');
    else if (intent.secondary.length > 2) {
      errors.push('intent.secondary max 2');
    }
    if (
      typeof intent.confidence !== 'number' ||
      !Number.isFinite(intent.confidence) ||
      intent.confidence < 0 ||
      intent.confidence > 1
    ) {
      errors.push('intent.confidence must be finite 0–1');
    }
    if (!isIn(intent.urgency, INPUT_URGENCY_LEVELS)) {
      errors.push('intent.urgency invalid');
    }
    if (!isIn(intent.complexity, INPUT_COMPLEXITY_LEVELS)) {
      errors.push('intent.complexity invalid');
    }
    if (!isIn(intent.stage, DECISION_STAGES)) {
      errors.push('intent.stage invalid');
    }
  }

  const checkFacts = (arr: unknown, path: string, max: number) => {
    if (!Array.isArray(arr)) {
      errors.push(`${path} must be array`);
      return;
    }
    if (arr.length > max) errors.push(`${path} exceeds max ${max}`);
    arr.forEach((f, i) => {
      if (f == null || typeof f !== 'object' || Array.isArray(f)) {
        errors.push(`${path}[${i}] must be object`);
        return;
      }
      const fact = f as Record<string, unknown>;
      for (const k of Object.keys(fact)) {
        if (!['key', 'value', 'source'].includes(k)) {
          errors.push(`${path}[${i}]: unknown field ${k}`);
        }
      }
      if (typeof fact.key !== 'string' || !fact.key.trim()) {
        errors.push(`${path}[${i}].key invalid`);
      }
      const vt = typeof fact.value;
      if (vt !== 'string' && vt !== 'number' && vt !== 'boolean') {
        errors.push(`${path}[${i}].value type invalid`);
      }
      if (!isIn(fact.source, CONTEXT_SOURCES)) {
        errors.push(`${path}[${i}].source invalid`);
      }
    });
  };

  checkFacts(obj.facts, 'facts', PROMPT_CONTEXT_LIMITS.maxFacts);
  checkFacts(obj.constraints, 'constraints', PROMPT_CONTEXT_LIMITS.maxConstraints);

  if (obj.timing !== undefined) {
    if (obj.timing == null || typeof obj.timing !== 'object' || Array.isArray(obj.timing)) {
      errors.push('timing must be object when present');
    } else {
      const t = obj.timing as Record<string, unknown>;
      for (const k of Object.keys(t)) {
        if (!['summary', 'score', 'confidence'].includes(k)) {
          errors.push(`timing: unknown field ${k}`);
        }
      }
    }
  }

  if (!Array.isArray(obj.conversation)) {
    errors.push('conversation must be array');
  } else {
    if (obj.conversation.length > PROMPT_CONTEXT_LIMITS.maxConversationMessages) {
      errors.push('conversation exceeds max messages');
    }
    obj.conversation.forEach((m, i) => {
      if (m == null || typeof m !== 'object') {
        errors.push(`conversation[${i}] invalid`);
        return;
      }
      const msg = m as Record<string, unknown>;
      if (msg.role !== 'user' && msg.role !== 'assistant') {
        errors.push(`conversation[${i}].role invalid`);
      }
      if (typeof msg.content !== 'string') {
        errors.push(`conversation[${i}].content invalid`);
      }
    });
  }

  if (!Array.isArray(obj.evaluationPlan)) {
    errors.push('evaluationPlan must be array');
  } else {
    obj.evaluationPlan.forEach((d, i) => {
      if (d == null || typeof d !== 'object') {
        errors.push(`evaluationPlan[${i}] invalid`);
        return;
      }
      const dim = d as Record<string, unknown>;
      if (!isIn(dim.name, DECISION_DIMENSIONS)) {
        errors.push(`evaluationPlan[${i}].name invalid`);
      }
      if (!isIn(dim.status, PLANNED_DIMENSION_STATUSES)) {
        errors.push(`evaluationPlan[${i}].status invalid`);
      }
    });
  }

  if (!Array.isArray(obj.missingContext)) {
    errors.push('missingContext must be array');
  } else {
    for (const k of obj.missingContext) {
      if (!isIn(k, REQUIRED_CONTEXT_KEYS)) {
        errors.push(`missingContext invalid: ${String(k)}`);
      }
    }
  }

  if (!Array.isArray(obj.riskDomains)) errors.push('riskDomains must be array');
  else {
    for (const r of obj.riskDomains) {
      if (!isIn(r, RISK_DOMAINS) || r === 'none') {
        errors.push(`riskDomains invalid: ${String(r)}`);
      }
    }
  }

  if (!Array.isArray(obj.actionHorizons)) {
    errors.push('actionHorizons must be array');
  } else {
    for (const h of obj.actionHorizons) {
      if (!isIn(h, ACTION_HORIZONS)) {
        errors.push(`actionHorizons invalid: ${String(h)}`);
      }
    }
  }

  if (typeof obj.clarificationRecommended !== 'boolean') {
    errors.push('clarificationRecommended must be boolean');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: obj as unknown as SerializedDecisionPromptContext };
}
