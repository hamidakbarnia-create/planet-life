/**
 * Strict runtime validation for UnifiedDecisionContext.
 * Rejects unknown fields; does not silently repair structural errors.
 */

import {
  validateInputAnalysis,
  REQUIRED_CONTEXT_KEYS,
  type RequiredContextKey,
} from '../input-analysis';
import {
  CONTEXT_MESSAGE_ROLES,
  CONTEXT_SOURCE_PRIORITY,
  CONTEXT_SOURCES,
  UNIFIED_DECISION_CONTEXT_KEYS,
  UNIFIED_DECISION_CONTEXT_VERSION,
  type ContextFact,
  type ContextSource,
  type UnifiedDecisionContext,
} from './types';

const SUPPORTED_LOCALES = ['en', 'ru', 'fa', 'ar'] as const;

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export type UnifiedDecisionContextValidationResult =
  | { ok: true; value: UnifiedDecisionContext }
  | { ok: false; errors: string[] };

function validateFact(
  fact: unknown,
  path: string,
  errors: string[],
  seen: Set<string>
): void {
  if (fact == null || typeof fact !== 'object' || Array.isArray(fact)) {
    errors.push(`${path} must be an object`);
    return;
  }
  const f = fact as Record<string, unknown>;
  for (const key of Object.keys(f)) {
    if (!['key', 'value', 'source', 'confidence'].includes(key)) {
      errors.push(`${path}: unknown field ${key}`);
    }
  }
  if (typeof f.key !== 'string' || !f.key.trim()) {
    errors.push(`${path}.key must be a non-empty string`);
  }
  const vType = typeof f.value;
  if (vType !== 'string' && vType !== 'number' && vType !== 'boolean') {
    errors.push(`${path}.value must be string | number | boolean`);
  }
  if (vType === 'number' && !Number.isFinite(f.value as number)) {
    errors.push(`${path}.value number must be finite`);
  }
  if (!isIn(f.source, CONTEXT_SOURCES)) {
    errors.push(`${path}.source invalid: ${String(f.source)}`);
  }
  if (typeof f.confidence !== 'number' || !Number.isFinite(f.confidence)) {
    errors.push(`${path}.confidence must be a finite number`);
  } else if (f.confidence < 0 || f.confidence > 1) {
    errors.push(`${path}.confidence must be in range 0–1`);
  }
  if (typeof f.key === 'string' && isIn(f.source, CONTEXT_SOURCES)) {
    const id = `${f.source}::${f.key}`;
    if (seen.has(id)) {
      errors.push(`duplicate fact key/source: ${id}`);
    }
    seen.add(id);
  }
}

export function validateUnifiedDecisionContext(
  value: unknown
): UnifiedDecisionContextValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['UnifiedDecisionContext must be a plain object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set<string>(UNIFIED_DECISION_CONTEXT_KEYS);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${key}`);
  }
  for (const key of UNIFIED_DECISION_CONTEXT_KEYS) {
    if (!(key in obj)) errors.push(`Missing field: ${key}`);
  }

  if (obj.version !== UNIFIED_DECISION_CONTEXT_VERSION) {
    errors.push(
      `version must be "${UNIFIED_DECISION_CONTEXT_VERSION}" (got ${String(obj.version)})`
    );
  }
  if (typeof obj.builtAt !== 'string' || !obj.builtAt.trim()) {
    errors.push('builtAt must be a non-empty string');
  }

  // question
  if (obj.question == null || typeof obj.question !== 'object' || Array.isArray(obj.question)) {
    errors.push('question must be an object');
  } else {
    const q = obj.question as Record<string, unknown>;
    for (const key of Object.keys(q)) {
      if (!['original', 'normalized', 'locale'].includes(key)) {
        errors.push(`question: unknown field ${key}`);
      }
    }
    if (typeof q.original !== 'string') errors.push('question.original must be string');
    if (q.normalized !== undefined && typeof q.normalized !== 'string') {
      errors.push('question.normalized must be string when present');
    }
    if (!isIn(q.locale, SUPPORTED_LOCALES)) {
      errors.push(`question.locale invalid: ${String(q.locale)}`);
    }
  }

  const analysisResult = validateInputAnalysis(obj.analysis);
  if (!analysisResult.ok) {
    errors.push(...analysisResult.errors.map((e) => `analysis: ${e}`));
  }

  // user
  if (obj.user == null || typeof obj.user !== 'object' || Array.isArray(obj.user)) {
    errors.push('user must be an object');
  } else {
    const u = obj.user as Record<string, unknown>;
    for (const key of Object.keys(u)) {
      if (
        !['profileAvailable', 'country', 'timezone', 'preferredLanguage'].includes(
          key
        )
      ) {
        errors.push(`user: unknown field ${key}`);
      }
    }
    if (typeof u.profileAvailable !== 'boolean') {
      errors.push('user.profileAvailable must be boolean');
    }
    if (u.profileAvailable === false) {
      if (u.country !== undefined) {
        errors.push('user.country omitted when profileAvailable=false');
      }
      if (u.timezone !== undefined) {
        errors.push('user.timezone omitted when profileAvailable=false');
      }
    }
    if (u.country !== undefined && typeof u.country !== 'string') {
      errors.push('user.country must be string');
    }
    if (u.timezone !== undefined && typeof u.timezone !== 'string') {
      errors.push('user.timezone must be string');
    }
    if (
      u.preferredLanguage !== undefined &&
      !isIn(u.preferredLanguage, SUPPORTED_LOCALES)
    ) {
      errors.push(`user.preferredLanguage invalid: ${String(u.preferredLanguage)}`);
    }
  }

  // decision
  if (
    obj.decision == null ||
    typeof obj.decision !== 'object' ||
    Array.isArray(obj.decision)
  ) {
    errors.push('decision must be an object');
  } else if (analysisResult.ok) {
    const d = obj.decision as Record<string, unknown>;
    for (const key of Object.keys(d)) {
      if (
        ![
          'primaryIntent',
          'secondaryIntents',
          'stage',
          'urgency',
          'complexity',
        ].includes(key)
      ) {
        errors.push(`decision: unknown field ${key}`);
      }
    }
    const a = analysisResult.value;
    if (d.primaryIntent !== a.intent) {
      errors.push('decision.primaryIntent must match analysis.intent');
    }
    if (
      !Array.isArray(d.secondaryIntents) ||
      JSON.stringify(d.secondaryIntents) !== JSON.stringify(a.secondaryIntents)
    ) {
      errors.push('decision.secondaryIntents must match analysis.secondaryIntents');
    }
    if (d.stage !== a.decisionStage) {
      errors.push('decision.stage must match analysis.decisionStage');
    }
    if (d.urgency !== a.urgency) {
      errors.push('decision.urgency must match analysis.urgency');
    }
    if (d.complexity !== a.complexity) {
      errors.push('decision.complexity must match analysis.complexity');
    }
  }

  // timing
  if (obj.timing == null || typeof obj.timing !== 'object' || Array.isArray(obj.timing)) {
    errors.push('timing must be an object');
  } else {
    const t = obj.timing as Record<string, unknown>;
    for (const key of Object.keys(t)) {
      if (!['available', 'source', 'summary', 'score', 'confidence'].includes(key)) {
        errors.push(`timing: unknown field ${key}`);
      }
    }
    if (typeof t.available !== 'boolean') {
      errors.push('timing.available must be boolean');
    }
    if (t.available === false) {
      if (t.score !== undefined) errors.push('timing.score omitted when unavailable');
      if (t.confidence !== undefined) {
        errors.push('timing.confidence omitted when unavailable');
      }
    } else {
      if (t.source !== undefined && typeof t.source !== 'string') {
        errors.push('timing.source must be string');
      }
      if (t.summary !== undefined && typeof t.summary !== 'string') {
        errors.push('timing.summary must be string');
      }
      if (t.score !== undefined) {
        if (typeof t.score !== 'number' || !Number.isFinite(t.score)) {
          errors.push('timing.score must be finite number');
        } else if (t.score < 0 || t.score > 100) {
          errors.push('timing.score must be in range 0–100');
        }
      }
      if (t.confidence !== undefined) {
        if (typeof t.confidence !== 'number' || !Number.isFinite(t.confidence)) {
          errors.push('timing.confidence must be finite number');
        } else if (t.confidence < 0 || t.confidence > 1) {
          errors.push('timing.confidence must be in range 0–1');
        }
      }
    }
  }

  // conversation
  if (
    obj.conversation == null ||
    typeof obj.conversation !== 'object' ||
    Array.isArray(obj.conversation)
  ) {
    errors.push('conversation must be an object');
  } else {
    const c = obj.conversation as Record<string, unknown>;
    for (const key of Object.keys(c)) {
      if (!['available', 'messageCount', 'recentMessages'].includes(key)) {
        errors.push(`conversation: unknown field ${key}`);
      }
    }
    if (typeof c.available !== 'boolean') {
      errors.push('conversation.available must be boolean');
    }
    if (typeof c.messageCount !== 'number' || !Number.isInteger(c.messageCount)) {
      errors.push('conversation.messageCount must be an integer');
    }
    if (!Array.isArray(c.recentMessages)) {
      errors.push('conversation.recentMessages must be an array');
    } else {
      if (c.messageCount !== c.recentMessages.length) {
        errors.push('conversation.messageCount must equal recentMessages.length');
      }
      if (c.available === false && c.recentMessages.length !== 0) {
        errors.push('conversation.available=false requires empty recentMessages');
      }
      if (c.available === true && c.recentMessages.length === 0) {
        errors.push('conversation.available=true requires non-empty recentMessages');
      }
      c.recentMessages.forEach((m, i) => {
        if (m == null || typeof m !== 'object' || Array.isArray(m)) {
          errors.push(`conversation.recentMessages[${i}] must be object`);
          return;
        }
        const msg = m as Record<string, unknown>;
        for (const key of Object.keys(msg)) {
          if (!['role', 'content'].includes(key)) {
            errors.push(`conversation.recentMessages[${i}]: unknown field ${key}`);
          }
        }
        if (!isIn(msg.role, CONTEXT_MESSAGE_ROLES)) {
          errors.push(
            `conversation.recentMessages[${i}].role invalid: ${String(msg.role)}`
          );
        }
        if (typeof msg.content !== 'string' || !msg.content.trim()) {
          errors.push(`conversation.recentMessages[${i}].content must be non-empty string`);
        }
      });
    }
  }

  const factSeen = new Set<string>();
  if (!Array.isArray(obj.knownFacts)) {
    errors.push('knownFacts must be an array');
  } else {
    obj.knownFacts.forEach((f, i) => validateFact(f, `knownFacts[${i}]`, errors, factSeen));
  }
  if (!Array.isArray(obj.constraints)) {
    errors.push('constraints must be an array');
  } else {
    const constraintSeen = new Set<string>();
    obj.constraints.forEach((f, i) =>
      validateFact(f, `constraints[${i}]`, errors, constraintSeen)
    );
  }

  if (!Array.isArray(obj.missingContext)) {
    errors.push('missingContext must be an array');
  } else {
    const seen = new Set<string>();
    for (const key of obj.missingContext) {
      if (!isIn(key, REQUIRED_CONTEXT_KEYS)) {
        errors.push(`missingContext invalid key: ${String(key)}`);
      } else if (seen.has(key)) {
        errors.push(`missingContext duplicate: ${key}`);
      } else {
        seen.add(key);
      }
    }
  }

  if (!Array.isArray(obj.sourcePriority)) {
    errors.push('sourcePriority must be an array');
  } else if (
    JSON.stringify(obj.sourcePriority) !== JSON.stringify([...CONTEXT_SOURCE_PRIORITY])
  ) {
    errors.push('sourcePriority must exactly match CONTEXT_SOURCE_PRIORITY v1');
  } else {
    for (const s of obj.sourcePriority as ContextSource[]) {
      if (!isIn(s, CONTEXT_SOURCES)) {
        errors.push(`sourcePriority invalid source: ${s}`);
      }
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: obj as unknown as UnifiedDecisionContext };
}

/** Type guard helper for tests. */
export function isRequiredContextKey(value: string): value is RequiredContextKey {
  return (REQUIRED_CONTEXT_KEYS as readonly string[]).includes(value);
}

/** Re-export fact type for adapters/tests. */
export type { ContextFact };
