/**
 * SerializedDecisionPromptContext v1 — compact provider-neutral prompt payload.
 */

import type {
  DecisionStage,
  DecisionIntent,
  RequiredContextKey,
} from '../input-analysis';
import type {
  Complexity,
  ContextSource,
  SupportedLocale,
  Urgency,
} from '../context-builder';
import type {
  ActionHorizon,
  DecisionDimension,
  RiskDomain,
} from '../intent-templates';
import type { PlannedDimensionStatus } from '../reasoning-planner';

export const SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION = '1.0.0';

export const PROMPT_CONTEXT_META_VERSION = '1.0.0';

/**
 * Server-side rollout switch (explicit opt-in).
 * unset / empty / 0 / false / off / unknown → disabled (legacy prompt)
 * 1 / true / on → enabled (structured prompt)
 */
export function isStructuredPromptContextEnabled(): boolean {
  const v = process.env.ASK_STRUCTURED_PROMPT_CONTEXT_ENABLED;
  if (v == null || v === '') return false;
  const normalized = v.trim().toLowerCase();
  return (
    normalized === '1' || normalized === 'true' || normalized === 'on'
  );
}

export const PROMPT_CONTEXT_LIMITS = {
  questionChars: 2000,
  maxFacts: 12,
  maxConstraints: 8,
  maxConversationMessages: 8,
  timingSummaryChars: 500,
  factValueChars: 300,
  messageContentChars: 500,
  /** Deterministic upper bound for JSON.stringify(serialized). */
  maxJsonChars: 12_000,
} as const;

export type SerializedFact = {
  key: string;
  value: string | number | boolean;
  source: ContextSource;
};

export type SerializedMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type SerializedDimension = {
  name: DecisionDimension;
  status: PlannedDimensionStatus;
};

export type SerializedDecisionPromptContext = {
  version: typeof SERIALIZED_DECISION_PROMPT_CONTEXT_VERSION;
  intent: {
    primary: DecisionIntent;
    secondary: DecisionIntent[];
    confidence: number;
    urgency: Urgency;
    complexity: Complexity;
    stage: DecisionStage;
  };
  question: string;
  locale: SupportedLocale;
  facts: SerializedFact[];
  constraints: SerializedFact[];
  timing?: {
    summary?: string;
    score?: number;
    confidence?: number;
  };
  conversation: SerializedMessage[];
  evaluationPlan: SerializedDimension[];
  missingContext: RequiredContextKey[];
  riskDomains: RiskDomain[];
  actionHorizons: ActionHorizon[];
  clarificationRecommended: boolean;
};

export type PromptContextMetaStatus = 'used' | 'degraded' | 'unavailable';

export type PromptContextMeta = {
  version: typeof PROMPT_CONTEXT_META_VERSION;
  status: PromptContextMetaStatus;
};

export const SERIALIZED_DECISION_PROMPT_CONTEXT_KEYS = [
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
] as const;
