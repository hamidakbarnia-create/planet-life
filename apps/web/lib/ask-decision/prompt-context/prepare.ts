/**
 * Structured prompt preparation — serialization, degradation, meta, prompt bundle.
 * Kept out of run.ts orchestration.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import type { ConversationLocale, ConversationMessage } from '@/lib/conversation-client';
import {
  buildUnifiedDecisionContext,
  type ConversationInputMessage,
  type UnifiedDecisionContext,
} from '../context-builder';
import type { InputAnalysis } from '../input-analysis';
import { buildReasoningPlan, type ReasoningPlan } from '../reasoning-planner';
import { buildAskDecisionPrompt } from '../prompt-builder';
import type {
  AskContextSnapshot,
  DecisionFrame,
  IntentDetection,
  TimingIntelligence,
} from '../types';
import type { RiskDomain } from '../intent-templates';
import { serializeDecisionPromptContext } from './serialize';
import {
  PROMPT_CONTEXT_META_VERSION,
  isStructuredPromptContextEnabled,
  type PromptContextMeta,
  type PromptContextMetaStatus,
} from './types';

export type PreparedStructuredPromptContext = {
  meta: PromptContextMeta;
  /** Validated compact JSON when status is `used`; otherwise null. */
  structuredPromptContextJson: string | null;
  structuredRiskDomains: readonly RiskDomain[];
};

export type PreparedAskPromptBundle = {
  decisionContext: UnifiedDecisionContext;
  reasoningPlan: ReasoningPlan;
  promptContext: PromptContextMeta;
  promptMessages: ConversationMessage[];
};

export function buildPromptContextMeta(
  status: PromptContextMetaStatus
): PromptContextMeta {
  return { version: PROMPT_CONTEXT_META_VERSION, status };
}

/**
 * Prepare structured prompt section from context + plan.
 * When disabled or serialization fails, returns null JSON and legacy-safe meta.
 */
export function prepareStructuredPromptContext(input: {
  decisionContext: UnifiedDecisionContext;
  reasoningPlan: ReasoningPlan;
  /** Override flag for tests; defaults to env rollout helper. */
  enabled?: boolean;
}): PreparedStructuredPromptContext {
  const enabled = input.enabled ?? isStructuredPromptContextEnabled();

  if (!enabled) {
    return {
      meta: buildPromptContextMeta('unavailable'),
      structuredPromptContextJson: null,
      structuredRiskDomains: [],
    };
  }

  try {
    const serialized = serializeDecisionPromptContext({
      decisionContext: input.decisionContext,
      reasoningPlan: input.reasoningPlan,
    });

    if (!serialized.ok) {
      console.info({
        event: 'ask_prompt_context_degraded',
        errors: serialized.errors,
      });
      return {
        meta: buildPromptContextMeta('degraded'),
        structuredPromptContextJson: null,
        structuredRiskDomains: [],
      };
    }

    return {
      meta: buildPromptContextMeta('used'),
      structuredPromptContextJson: serialized.json,
      structuredRiskDomains: input.reasoningPlan.riskDomains,
    };
  } catch (err) {
    console.info({
      event: 'ask_prompt_context_degraded',
      errors: [err instanceof Error ? err.message : 'serialize threw'],
    });
    return {
      meta: buildPromptContextMeta('degraded'),
      structuredPromptContextJson: null,
      structuredRiskDomains: [],
    };
  }
}

/**
 * One-shot helper: context + plan + structured prepare + final prompt messages.
 * run.ts should call this instead of owning serialization / section policy.
 */
export function prepareAskPromptBundle(input: {
  question: string;
  locale: ConversationLocale;
  analysis: InputAnalysis;
  profile: BirthProfile | null;
  timing: TimingIntelligence;
  conversationMessages: ConversationInputMessage[];
  intent: IntentDetection;
  frame: DecisionFrame;
  askContext: AskContextSnapshot;
  clarificationAnswer?: string | null;
  builtAt: string;
  /** Override flag for tests; defaults to env rollout helper. */
  enabled?: boolean;
}): PreparedAskPromptBundle {
  const decisionContext = buildUnifiedDecisionContext({
    question: input.question,
    locale: input.locale,
    analysis: input.analysis,
    profile: input.profile,
    timing: input.timing,
    conversationMessages: input.conversationMessages,
    now: () => input.builtAt,
  });
  const reasoningPlan = buildReasoningPlan({
    analysis: input.analysis,
    context: decisionContext,
  });
  const prepared = prepareStructuredPromptContext({
    decisionContext,
    reasoningPlan,
    enabled: input.enabled,
  });
  const promptMessages = buildAskDecisionPrompt({
    question: input.question,
    intent: input.intent,
    frame: input.frame,
    context: input.askContext,
    clarificationAnswer: input.clarificationAnswer,
    structuredPromptContextJson: prepared.structuredPromptContextJson,
    structuredRiskDomains: prepared.structuredRiskDomains,
  });
  return {
    decisionContext,
    reasoningPlan,
    promptContext: prepared.meta,
    promptMessages,
  };
}
