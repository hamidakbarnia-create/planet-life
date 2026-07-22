/**
 * UnifiedDecisionContext v1 — observation-only foundation for Decision OS.
 * Controlled vocabularies; no fabricated unavailable sources.
 */

import type { AppLang } from '@/lib/app-settings';
import type {
  DecisionIntent,
  DecisionStage,
  InputAnalysis,
  InputComplexity,
  InputUrgency,
  RequiredContextKey,
} from '../input-analysis';

export const UNIFIED_DECISION_CONTEXT_VERSION = '1.0.0';

/** Matches AppLang / ConversationLocale. */
export type SupportedLocale = AppLang;

export type Urgency = InputUrgency;
export type Complexity = InputComplexity;

/**
 * Max recent conversation messages retained (newest-preserving trim from the front).
 * Truncation: keep the last N eligible messages after filtering; order preserved.
 */
export const CONTEXT_RECENT_MESSAGE_LIMIT = 8;

export const CONTEXT_SOURCES = [
  'current_question',
  'input_analysis',
  'conversation',
  'user_profile',
  'timing',
  'decision_history',
  'stored_memory',
  'birth_data',
  'birth_chart',
  'calendar',
  'locale',
] as const;
export type ContextSource = (typeof CONTEXT_SOURCES)[number];

/**
 * Fixed v1 priority order — never reordered per request.
 * Future sources appear only as vocabulary / empty availability.
 */
export const CONTEXT_SOURCE_PRIORITY = [
  'current_question',
  'input_analysis',
  'conversation',
  'user_profile',
  'timing',
  'locale',
  'calendar',
  'decision_history',
  'stored_memory',
  'birth_data',
  'birth_chart',
] as const satisfies ReadonlyArray<ContextSource>;

export type ContextSourcePriority = typeof CONTEXT_SOURCE_PRIORITY;

export const CONTEXT_MESSAGE_ROLES = ['user', 'assistant'] as const;
export type ContextMessageRole = (typeof CONTEXT_MESSAGE_ROLES)[number];

export type ContextMessage = {
  role: ContextMessageRole;
  content: string;
};

export type ContextFact = {
  key: string;
  value: string | number | boolean;
  source: ContextSource;
  /** Finite, 0–1 inclusive. */
  confidence: number;
};

export type UnifiedDecisionContext = {
  version: typeof UNIFIED_DECISION_CONTEXT_VERSION;
  builtAt: string;
  question: {
    original: string;
    normalized?: string;
    locale: SupportedLocale;
  };
  analysis: InputAnalysis;
  user: {
    profileAvailable: boolean;
    country?: string;
    timezone?: string;
    preferredLanguage?: SupportedLocale;
  };
  decision: {
    primaryIntent: DecisionIntent;
    secondaryIntents: DecisionIntent[];
    stage: DecisionStage;
    urgency: Urgency;
    complexity: Complexity;
  };
  timing: {
    available: boolean;
    source?: string;
    summary?: string;
    /** Ask timing scores use 0–100 when present. */
    score?: number;
    /** Mapped confidence 0–1 when present. */
    confidence?: number;
  };
  conversation: {
    available: boolean;
    messageCount: number;
    recentMessages: ContextMessage[];
  };
  knownFacts: ContextFact[];
  constraints: ContextFact[];
  missingContext: RequiredContextKey[];
  sourcePriority: ContextSource[];
};

export const UNIFIED_DECISION_CONTEXT_KEYS = [
  'version',
  'builtAt',
  'question',
  'analysis',
  'user',
  'decision',
  'timing',
  'conversation',
  'knownFacts',
  'constraints',
  'missingContext',
  'sourcePriority',
] as const satisfies ReadonlyArray<keyof UnifiedDecisionContext>;
