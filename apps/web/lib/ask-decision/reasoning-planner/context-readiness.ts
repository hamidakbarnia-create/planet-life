/**
 * Positive-evidence context availability + dimension readiness.
 *
 * AvailableContext is NEVER inferred as requiredContext − missingContext.
 * Only positive evidence from UnifiedDecisionContext may create availability.
 *
 * Timing Intelligence never evidences decision_deadline.
 */

import type { InputAnalysis, RequiredContextKey } from '../input-analysis';
import type { UnifiedDecisionContext } from '../context-builder';
import { DIMENSION_READINESS_RULES } from '../intent-templates';
import type { DecisionDimension } from '../intent-templates';
import type { PlannedDimensionStatus } from './types';

/** knownFacts / constraint keys that positively evidence a context key. */
const FACT_KEY_TO_CONTEXT: Readonly<Record<string, RequiredContextKey>> = {
  'profile.country': 'location',
  'profile.timezone': 'location',
  'evidence.financial_impact': 'financial_impact',
  'evidence.decision_deadline': 'decision_deadline',
  'evidence.current_option': 'current_option',
  'evidence.alternative_option': 'alternative_option',
  'evidence.primary_goal': 'primary_goal',
  'evidence.primary_risk': 'primary_risk',
  'evidence.location': 'location',
  'evidence.relationship_status': 'relationship_status',
  'evidence.health_context': 'health_context',
  'evidence.known_constraints': 'known_constraints',
  'evidence.reversibility': 'reversibility',
};

function uniqueKeys(keys: RequiredContextKey[]): RequiredContextKey[] {
  const out: RequiredContextKey[] = [];
  for (const k of keys) {
    if (!out.includes(k)) out.push(k);
  }
  return out;
}

/**
 * Explicit bounded decision-window evidence only.
 * Generic when/timing/schedule words do NOT count.
 */
export function hasDeadlineEvidence(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    /\b(deadline|due(\s+date)?|expires?|expir(?:y|ation))\b/i.test(t) ||
    /\b(must\s+decide\s+by|decide\s+by|need\s+to\s+decide\s+by)\b/i.test(t) ||
    /\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|tonight)\b/i.test(
      t
    ) ||
    /\bby\s+next\s+(week|month)\b/i.test(t) ||
    /\bbefore\s+(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\d{4}-\d{2}-\d{2})\b/i.test(
      t
    ) ||
    /\bbefore\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+(week|month)|the\s+end\s+of)\b/i.test(
      t
    ) ||
    /\bwithin\s+(\d+|a|one|two|three|few)\s+(day|days|week|weeks|hour|hours)\b/i.test(
      t
    ) ||
    /\bin\s+(\d+|one|two|three)\s+days?\b/i.test(t)
  );
}

/** Deterministic question/conversation text → context key evidence. */
export function evidenceFromText(text: string): RequiredContextKey[] {
  const found: RequiredContextKey[] = [];
  if (
    /\b(salary|pay|compensation|budget|cost|afford|invest|debt|money|cash)\b/i.test(
      text
    )
  ) {
    found.push('financial_impact');
  }
  if (hasDeadlineEvidence(text)) {
    found.push('decision_deadline');
  }
  if (/\b(current (job|role|option)|stay (in|put|here)|now i )\b/i.test(text)) {
    found.push('current_option');
  }
  if (/\b(option|vs|versus|or |either)\b/i.test(text)) {
    found.push('alternative_option');
  }
  if (/\b(goal|want to|hoping)\b/i.test(text)) {
    found.push('primary_goal');
  }
  if (/\b(risk|afraid|worried)\b/i.test(text)) {
    found.push('primary_risk');
  }
  if (/\b(city|country|berlin|london|relocat|move to)\b/i.test(text)) {
    found.push('location');
  }
  if (/\b(married|dating|partner|spouse)\b/i.test(text)) {
    found.push('relationship_status');
  }
  if (/\b(health|medical|doctor|burnout|fitness)\b/i.test(text)) {
    found.push('health_context');
  }
  if (/\b(constraint|can't|cannot|visa|limited by)\b/i.test(text)) {
    found.push('known_constraints');
  }
  if (/\b(reversib|undo|permanent|irreversible)\b/i.test(text)) {
    found.push('reversibility');
  }
  return found;
}

/**
 * Collect positive evidence keys from UnifiedDecisionContext only.
 * Timing Intelligence never adds decision_deadline.
 */
export function gatherPositiveEvidence(
  context: UnifiedDecisionContext
): Set<RequiredContextKey> {
  const evidenced = new Set<RequiredContextKey>();

  for (const fact of context.knownFacts) {
    if (fact.source === 'input_analysis') continue;
    if (fact.key.startsWith('missing.')) continue;
    // timing.* facts must not map to decision_deadline
    if (fact.key.startsWith('timing.')) continue;
    const mapped = FACT_KEY_TO_CONTEXT[fact.key];
    if (mapped) evidenced.add(mapped);
  }

  for (const c of context.constraints) {
    if (c.key.startsWith('missing.')) continue;
    const mapped = FACT_KEY_TO_CONTEXT[c.key];
    if (mapped) evidenced.add(mapped);
  }

  if (context.user.country || context.user.timezone) {
    evidenced.add('location');
  }

  // Intentionally NO timing → decision_deadline mapping.

  for (const key of evidenceFromText(context.question.original)) {
    evidenced.add(key);
  }
  if (context.question.normalized) {
    for (const key of evidenceFromText(context.question.normalized)) {
      evidenced.add(key);
    }
  }

  for (const msg of context.conversation.recentMessages) {
    for (const key of evidenceFromText(msg.content)) {
      evidenced.add(key);
    }
  }

  return evidenced;
}

export function deriveContextSets(args: {
  analysis: InputAnalysis;
  context: UnifiedDecisionContext;
  finalRequiredContext: readonly RequiredContextKey[];
}): {
  availableContext: RequiredContextKey[];
  missingContext: RequiredContextKey[];
} {
  const evidenced = gatherPositiveEvidence(args.context);
  const statedMissing = uniqueKeys([
    ...args.analysis.missingCriticalContext,
    ...args.context.missingContext,
  ]);
  const statedMissingSet = new Set(statedMissing);

  const availableContext = [...evidenced].filter((k) => !statedMissingSet.has(k));
  const availableSet = new Set(availableContext);

  const gapMissing = args.finalRequiredContext.filter((k) => !availableSet.has(k));
  const missingContext = uniqueKeys([...statedMissing, ...gapMissing]);

  return { availableContext: uniqueKeys(availableContext), missingContext };
}

export type ProceduralReadinessInput = {
  available: ReadonlySet<RequiredContextKey>;
  missingContext: readonly RequiredContextKey[];
  question: string;
  knownFactCount: number;
  timing: UnifiedDecisionContext['timing'];
  intentConfidence: number;
  /** True only for Level-B total fallback plans. */
  isTotalFallback: boolean;
};

function timingPayloadUsable(
  timing: UnifiedDecisionContext['timing']
): boolean {
  return (
    typeof timing.score === 'number' ||
    (typeof timing.summary === 'string' && timing.summary.trim().length > 0)
  );
}

export function dimensionStatus(
  dimension: DecisionDimension,
  input: ProceduralReadinessInput
): {
  status: PlannedDimensionStatus;
  requiredContext: RequiredContextKey[];
} {
  const rule = DIMENSION_READINESS_RULES[dimension];
  const requiredContext = [...rule.requiredContext];

  if (rule.mode === 'context_required') {
    if (requiredContext.length === 0) {
      return { status: 'blocked', requiredContext };
    }
    const present = requiredContext.filter((k) => input.available.has(k));
    if (present.length === requiredContext.length) {
      return { status: 'ready', requiredContext };
    }
    if (present.length === 0) {
      return { status: 'blocked', requiredContext };
    }
    return { status: 'partial', requiredContext };
  }

  switch (dimension) {
    case 'timing': {
      // Direct Timing Intelligence readiness — not via RequiredContextKey
      if (input.timing.available && timingPayloadUsable(input.timing)) {
        return { status: 'ready', requiredContext };
      }
      if (
        input.timing.available ||
        (typeof input.timing.source === 'string' && input.timing.source.trim())
      ) {
        return { status: 'partial', requiredContext };
      }
      return { status: 'blocked', requiredContext };
    }
    case 'evidence_quality': {
      if (input.available.size > 0) {
        return { status: 'ready', requiredContext };
      }
      if (input.question.trim().length > 0 || input.knownFactCount > 0) {
        return { status: 'partial', requiredContext };
      }
      return { status: 'blocked', requiredContext };
    }
    case 'missing_information': {
      if (input.missingContext.length === 0) {
        return { status: 'ready', requiredContext };
      }
      return { status: 'partial', requiredContext };
    }
    case 'confidence': {
      if (
        input.isTotalFallback ||
        !Number.isFinite(input.intentConfidence)
      ) {
        return { status: 'blocked', requiredContext };
      }
      if (input.intentConfidence > 0 && input.available.size > 0) {
        return { status: 'ready', requiredContext };
      }
      if (input.question.trim().length > 0 || input.knownFactCount > 0) {
        return { status: 'partial', requiredContext };
      }
      return { status: 'blocked', requiredContext };
    }
    case 'next_actions': {
      if (input.available.has('primary_goal')) {
        return { status: 'ready', requiredContext };
      }
      if (input.available.size > 0) {
        return { status: 'partial', requiredContext };
      }
      return { status: 'blocked', requiredContext };
    }
    case 'decision_checkpoint': {
      // Requires explicit deadline evidence — timing payload alone is insufficient
      if (input.available.has('decision_deadline')) {
        return { status: 'ready', requiredContext };
      }
      if (input.available.size > 0) {
        return { status: 'partial', requiredContext };
      }
      return { status: 'blocked', requiredContext };
    }
    default:
      return { status: 'blocked', requiredContext };
  }
}
