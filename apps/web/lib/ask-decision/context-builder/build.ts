/**
 * Deterministic UnifiedDecisionContext builder.
 *
 * Source-level degradation: if a single adapter throws, that source is marked
 * unavailable / empty and the rest of the context is preserved.
 * Invalid InputAnalysis is replaced with the InputAnalysis safe fallback only
 * for the embedded `analysis` field — never a blank global context.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  buildSafeInputAnalysisFallback,
  validateInputAnalysis,
  type InputAnalysis,
  type RequiredContextKey,
} from '../input-analysis';
import type { TimingIntelligence } from '../types';
import {
  adaptAnalysisConstraints,
  adaptAnalysisFacts,
  adaptConversation,
  adaptProfile,
  adaptQuestionFacts,
  adaptTiming,
  type ConversationInputMessage,
} from './adapters';
import {
  CONTEXT_SOURCE_PRIORITY,
  UNIFIED_DECISION_CONTEXT_VERSION,
  type ContextFact,
  type SupportedLocale,
  type UnifiedDecisionContext,
} from './types';
import { validateUnifiedDecisionContext } from './validate';

const SUPPORTED_LOCALES = ['en', 'ru', 'fa', 'ar'] as const;

export type BuildUnifiedDecisionContextInput = {
  question: string;
  locale: string;
  analysis: InputAnalysis;
  profile?: BirthProfile | null;
  timing?: TimingIntelligence | null;
  /** Prior conversation turns only — not Ask system/prompt blobs. */
  conversationMessages?: ConversationInputMessage[] | null;
  /** Injected clock for deterministic tests (ISO string). */
  now?: () => string;
};

function resolveLocale(locale: string): SupportedLocale {
  if ((SUPPORTED_LOCALES as readonly string[]).includes(locale)) {
    return locale as SupportedLocale;
  }
  return 'en';
}

function resolveAnalysis(analysis: InputAnalysis): InputAnalysis {
  const validated = validateInputAnalysis(analysis);
  if (validated.ok) return validated.value;
  return buildSafeInputAnalysisFallback();
}

function dedupeMissing(keys: RequiredContextKey[]): RequiredContextKey[] {
  const out: RequiredContextKey[] = [];
  for (const k of keys) {
    if (!out.includes(k)) out.push(k);
  }
  return out;
}

function mergeFacts(groups: ContextFact[][]): ContextFact[] {
  const out: ContextFact[] = [];
  const seen = new Set<string>();
  for (const group of groups) {
    for (const fact of group) {
      const id = `${fact.source}::${fact.key}`;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(fact);
    }
  }
  return out;
}

/**
 * Build a validated UnifiedDecisionContext from currently available Ask inputs.
 */
export function buildUnifiedDecisionContext(
  input: BuildUnifiedDecisionContextInput
): UnifiedDecisionContext {
  const locale = resolveLocale(input.locale);
  const original = input.question ?? '';
  const normalized = original.trim().replace(/\s+/g, ' ');
  const analysis = resolveAnalysis(input.analysis);
  const builtAt = (input.now ?? (() => new Date().toISOString()))();

  const profileResult = adaptProfile(input.profile ?? null, locale);
  const timingResult = adaptTiming(input.timing ?? null);
  const conversationResult = adaptConversation(
    input.conversationMessages,
    original
  );

  const knownFacts = mergeFacts([
    adaptQuestionFacts(original, locale),
    adaptAnalysisFacts(analysis),
    profileResult.facts,
    timingResult.facts,
    conversationResult.facts,
  ]);

  const constraints = adaptAnalysisConstraints(analysis);
  const missingContext = dedupeMissing([...analysis.missingCriticalContext]);

  const user: UnifiedDecisionContext['user'] = {
    profileAvailable: profileResult.profileAvailable,
  };
  if (profileResult.profileAvailable) {
    if (profileResult.country) user.country = profileResult.country;
    if (profileResult.timezone) user.timezone = profileResult.timezone;
    if (profileResult.preferredLanguage) {
      user.preferredLanguage = profileResult.preferredLanguage;
    }
  }

  const candidate: UnifiedDecisionContext = {
    version: UNIFIED_DECISION_CONTEXT_VERSION,
    builtAt,
    question: {
      original,
      ...(normalized !== original ? { normalized } : {}),
      locale,
    },
    analysis,
    user,
    decision: {
      primaryIntent: analysis.intent,
      secondaryIntents: [...analysis.secondaryIntents],
      stage: analysis.decisionStage,
      urgency: analysis.urgency,
      complexity: analysis.complexity,
    },
    timing: timingResult.timing,
    conversation: conversationResult.conversation,
    knownFacts,
    constraints,
    missingContext,
    sourcePriority: [...CONTEXT_SOURCE_PRIORITY],
  };

  const validated = validateUnifiedDecisionContext(candidate);
  if (validated.ok) return validated.value;

  // Last-resort minimal context: question + locale + analysis fallback + unavailable markers.
  // Still validated; does not invent profile/timing/conversation content.
  const minimalAnalysis = buildSafeInputAnalysisFallback();
  const minimal: UnifiedDecisionContext = {
    version: UNIFIED_DECISION_CONTEXT_VERSION,
    builtAt,
    question: { original, locale },
    analysis: minimalAnalysis,
    user: { profileAvailable: false },
    decision: {
      primaryIntent: minimalAnalysis.intent,
      secondaryIntents: [],
      stage: minimalAnalysis.decisionStage,
      urgency: minimalAnalysis.urgency,
      complexity: minimalAnalysis.complexity,
    },
    timing: { available: false },
    conversation: {
      available: false,
      messageCount: 0,
      recentMessages: [],
    },
    knownFacts: adaptQuestionFacts(original, locale).concat(
      adaptAnalysisFacts(minimalAnalysis)
    ),
    constraints: [],
    missingContext: [],
    sourcePriority: [...CONTEXT_SOURCE_PRIORITY],
  };

  const minimalValidated = validateUnifiedDecisionContext(minimal);
  if (minimalValidated.ok) return minimalValidated.value;

  // Should be unreachable if contracts stay aligned; throw to avoid silent corruption.
  throw new Error(
    `UnifiedDecisionContext build failed: ${minimalValidated.ok === false ? minimalValidated.errors.join('; ') : 'unknown'}`
  );
}

/** Strip builtAt for deterministic equality checks in tests. */
export function stripBuiltAt(
  ctx: UnifiedDecisionContext
): Omit<UnifiedDecisionContext, 'builtAt'> {
  const rest = { ...ctx };
  delete (rest as { builtAt?: string }).builtAt;
  return rest;
}
