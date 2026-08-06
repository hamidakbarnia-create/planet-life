/**
 * Deterministic serializer: UnifiedDecisionContext + ReasoningPlan
 * → SerializedDecisionPromptContext.
 */

import { REQUIRED_CONTEXT_KEYS } from '../input-analysis';
import {
  CONTEXT_SOURCE_PRIORITY,
  type ContextFact,
  type ContextSource,
  type UnifiedDecisionContext,
} from '../context-builder';
import {
  ACTION_HORIZONS,
  RISK_DOMAINS,
  type ActionHorizon,
  type RiskDomain,
} from '../intent-templates';
import type { ReasoningPlan } from '../reasoning-planner';
import {
  PROMPT_CONTEXT_LIMITS,
  SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION,
  type SerializedDecisionPromptContext,
  type SerializedFact,
} from './types';
import { validateSerializedDecisionPromptContext } from './validate';

const SOURCE_RANK = new Map<ContextSource, number>(
  CONTEXT_SOURCE_PRIORITY.map((s, i) => [s, i])
);

function sourceRank(source: ContextSource): number {
  return SOURCE_RANK.get(source) ?? 999;
}

function truncateString(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

function normalizeFactValue(
  value: string | number | boolean
): string | number | boolean {
  if (typeof value === 'string') {
    return truncateString(value, PROMPT_CONTEXT_LIMITS.factValueChars);
  }
  if (typeof value === 'number' && !Number.isFinite(value)) {
    return 0;
  }
  return value;
}

/** Exclude analysis meta / locale / question duplicates from prompt facts. */
function isPromptFactAllowed(fact: ContextFact): boolean {
  if (fact.source === 'input_analysis') return false;
  if (fact.source === 'locale') return false;
  if (fact.key === 'question.original' || fact.key === 'question.normalized') {
    return false;
  }
  if (fact.key === 'question.char_count') return false;
  if (fact.key.startsWith('missing.')) return false;
  // Sensitive / internal
  if (/token|password|authorization|api[_-]?key|secret/i.test(fact.key)) {
    return false;
  }
  return true;
}

function sortFacts(facts: ContextFact[], max: number): SerializedFact[] {
  const filtered = facts.filter(isPromptFactAllowed);
  filtered.sort((a, b) => {
    const sr = sourceRank(a.source) - sourceRank(b.source);
    if (sr !== 0) return sr;
    return a.key.localeCompare(b.key);
  });
  return filtered.slice(0, max).map((f) => ({
    key: f.key,
    value: normalizeFactValue(f.value),
    source: f.source,
  }));
}

function sortByVocabOrder<T extends string>(
  items: readonly T[],
  vocab: readonly T[]
): T[] {
  const rank = new Map(vocab.map((v, i) => [v, i]));
  return [...new Set(items)].sort(
    (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999)
  );
}

export type SerializePromptContextInput = {
  decisionContext: UnifiedDecisionContext;
  reasoningPlan: ReasoningPlan;
};

export type SerializePromptContextResult =
  | { ok: true; value: SerializedDecisionPromptContext; json: string }
  | { ok: false; errors: string[] };

/**
 * Build compact, deterministic serialized prompt context.
 * Omits empty optional timing when unavailable.
 */
export function serializeDecisionPromptContext(
  input: SerializePromptContextInput
): SerializePromptContextResult {
  try {
    const { decisionContext: ctx, reasoningPlan: plan } = input;
    const question = truncateString(
      ctx.question.original.trim(),
      PROMPT_CONTEXT_LIMITS.questionChars
    );

    const facts = sortFacts(ctx.knownFacts, PROMPT_CONTEXT_LIMITS.maxFacts);
    const constraints = sortFacts(
      ctx.constraints,
      PROMPT_CONTEXT_LIMITS.maxConstraints
    );

    const questionNormalized = question.trim();
    const conversation = ctx.conversation.recentMessages
      .filter((m) => m.content.trim() !== questionNormalized)
      .slice(0, PROMPT_CONTEXT_LIMITS.maxConversationMessages)
      .map((m) => ({
        role: m.role,
        content: truncateString(
          m.content,
          PROMPT_CONTEXT_LIMITS.messageContentChars
        ),
      }));

    const evaluationPlan = plan.dimensions.map((d) => ({
      name: d.dimension,
      status: d.status,
    }));

    const missingContext = sortByVocabOrder(
      plan.missingContext,
      REQUIRED_CONTEXT_KEYS
    );
    const riskDomains = sortByVocabOrder(
      plan.riskDomains.filter((r) => r !== 'none') as RiskDomain[],
      RISK_DOMAINS
    );
    // If only none, keep empty (omit noise) — clarification/safety still in instructions
    const actionHorizons = sortByVocabOrder(
      plan.actionHorizons as ActionHorizon[],
      ACTION_HORIZONS
    );

    const serialized: SerializedDecisionPromptContext = {
      version: SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION,
      intent: {
        primary: plan.primaryIntent,
        secondary: plan.secondaryIntents.slice(0, 2),
        confidence: plan.confidence,
        urgency: ctx.decision.urgency,
        complexity: ctx.decision.complexity,
        stage: ctx.decision.stage,
      },
      question,
      locale: ctx.question.locale,
      facts,
      constraints,
      conversation,
      evaluationPlan,
      missingContext,
      riskDomains,
      actionHorizons,
      clarificationRecommended: plan.clarificationRecommended,
    };

    if (ctx.timing.available) {
      const timing: NonNullable<SerializedDecisionPromptContext['timing']> = {};
      if (ctx.timing.summary?.trim()) {
        timing.summary = truncateString(
          ctx.timing.summary.trim(),
          PROMPT_CONTEXT_LIMITS.timingSummaryChars
        );
      }
      if (typeof ctx.timing.score === 'number') {
        timing.score = ctx.timing.score;
      }
      if (typeof ctx.timing.confidence === 'number') {
        timing.confidence = ctx.timing.confidence;
      }
      if (Object.keys(timing).length > 0) {
        serialized.timing = timing;
      }
    }

    const validated = validateSerializedDecisionPromptContext(serialized);
    if (!validated.ok) {
      return { ok: false, errors: validated.errors };
    }

    const json = JSON.stringify(validated.value);
    if (json.length > PROMPT_CONTEXT_LIMITS.maxJsonChars) {
      return {
        ok: false,
        errors: [
          `Serialized prompt context exceeds ${PROMPT_CONTEXT_LIMITS.maxJsonChars} chars (${json.length})`,
        ],
      };
    }

    return { ok: true, value: validated.value, json };
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : 'serialize failed'],
    };
  }
}

/** Stable JSON for tests / prompt embedding. */
export function serializeDecisionPromptContextJson(
  input: SerializePromptContextInput
): string | null {
  const result = serializeDecisionPromptContext(input);
  return result.ok ? result.json : null;
}
