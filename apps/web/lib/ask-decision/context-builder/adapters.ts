/**
 * Source adapters for UnifiedDecisionContext.
 * Each adapter is isolated: failures degrade that source only.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import type { InputAnalysis } from '../input-analysis';
import type { TimingIntelligence } from '../types';
import {
  CONTEXT_RECENT_MESSAGE_LIMIT,
  type ContextFact,
  type ContextMessage,
  type SupportedLocale,
} from './types';

const INTERNAL_PROMPT_MARKERS = [
  'You are METIORO Decision Intelligence',
  'Return ONE JSON object only',
  '"schemaVersion":',
  'USER QUESTION:',
  'DECISION FRAME:',
  'LANGUAGE RETRY',
];

export type ConversationInputMessage = {
  role: string;
  content: string;
};

export function adaptQuestionFacts(
  question: string,
  locale: SupportedLocale
): ContextFact[] {
  const normalized = question.trim().replace(/\s+/g, ' ');
  const facts: ContextFact[] = [
    {
      key: 'question.original',
      value: question,
      source: 'current_question',
      confidence: 1,
    },
    {
      key: 'question.char_count',
      value: question.length,
      source: 'current_question',
      confidence: 1,
    },
  ];
  if (normalized !== question) {
    facts.push({
      key: 'question.normalized',
      value: normalized,
      source: 'current_question',
      confidence: 1,
    });
  }
  facts.push({
    key: 'locale',
    value: locale,
    source: 'locale',
    confidence: 1,
  });
  return facts;
}

export function adaptAnalysisFacts(analysis: InputAnalysis): ContextFact[] {
  return [
    {
      key: 'analysis.intent',
      value: analysis.intent,
      source: 'input_analysis',
      confidence: analysis.intentConfidence,
    },
    {
      key: 'analysis.urgency',
      value: analysis.urgency,
      source: 'input_analysis',
      confidence: analysis.intentConfidence,
    },
    {
      key: 'analysis.complexity',
      value: analysis.complexity,
      source: 'input_analysis',
      confidence: analysis.intentConfidence,
    },
    {
      key: 'analysis.decision_stage',
      value: analysis.decisionStage,
      source: 'input_analysis',
      confidence: analysis.intentConfidence,
    },
    {
      key: 'analysis.safety_domain',
      value: analysis.safetyDomain,
      source: 'input_analysis',
      confidence: 1,
    },
    {
      key: 'analysis.clarification_required',
      value: analysis.clarificationRequired,
      source: 'input_analysis',
      confidence: 1,
    },
  ];
}

export function adaptAnalysisConstraints(
  analysis: InputAnalysis
): ContextFact[] {
  return analysis.missingCriticalContext.map((key) => ({
    key: `missing.${key}`,
    value: true,
    source: 'input_analysis' as const,
    confidence: 1,
  }));
}

export type ProfileAdapterResult = {
  profileAvailable: boolean;
  country?: string;
  timezone?: string;
  preferredLanguage?: SupportedLocale;
  facts: ContextFact[];
  degraded: boolean;
};

/** Minimal profile projection — never includes birth date/time/coords. */
export function adaptProfile(
  profile: BirthProfile | null | undefined,
  locale: SupportedLocale
): ProfileAdapterResult {
  try {
    if (!profile) {
      return { profileAvailable: false, facts: [], degraded: false };
    }
    const country = profile.current_location?.country?.trim() || undefined;
    const timezone = profile.current_location?.timezone?.trim() || undefined;
    const facts: ContextFact[] = [
      {
        key: 'profile.available',
        value: true,
        source: 'user_profile',
        confidence: 1,
      },
    ];
    if (country) {
      facts.push({
        key: 'profile.country',
        value: country,
        source: 'user_profile',
        confidence: 0.9,
      });
    }
    if (timezone) {
      facts.push({
        key: 'profile.timezone',
        value: timezone,
        source: 'user_profile',
        confidence: 0.9,
      });
    }
    return {
      profileAvailable: true,
      country,
      timezone,
      preferredLanguage: locale,
      facts,
      degraded: false,
    };
  } catch {
    return { profileAvailable: false, facts: [], degraded: true };
  }
}

export type TimingAdapterResult = {
  timing: {
    available: boolean;
    source?: string;
    summary?: string;
    score?: number;
    confidence?: number;
  };
  facts: ContextFact[];
  degraded: boolean;
};

function mapTimingConfidence(
  level: TimingIntelligence['timingConfidence']
): number {
  if (level === 'high') return 0.85;
  if (level === 'medium') return 0.6;
  return 0.35;
}

export function adaptTiming(
  timing: TimingIntelligence | null | undefined
): TimingAdapterResult {
  try {
    if (!timing || !timing.available) {
      return {
        timing: { available: false },
        facts: [],
        degraded: false,
      };
    }
    const rawScore =
      timing.bestWindow?.score ??
      timing.today?.score ??
      timing.next7Days?.score;
    const score = typeof rawScore === 'number' ? rawScore : undefined;
    const confidence = mapTimingConfidence(timing.timingConfidence);
    const summary = timing.timingRationale?.trim() || undefined;
    const facts: ContextFact[] = [
      {
        key: 'timing.available',
        value: true,
        source: 'timing',
        confidence: 1,
      },
    ];
    if (typeof score === 'number') {
      facts.push({
        key: 'timing.score',
        value: score,
        source: 'timing',
        confidence,
      });
    }
    return {
      timing: {
        available: true,
        source: 'timing-engine',
        summary,
        score,
        confidence,
      },
      facts,
      degraded: false,
    };
  } catch {
    return {
      timing: { available: false },
      facts: [],
      degraded: true,
    };
  }
}

function isInternalImplementationMessage(content: string): boolean {
  return INTERNAL_PROMPT_MARKERS.some((m) => content.includes(m));
}

export type ConversationAdapterResult = {
  conversation: {
    available: boolean;
    messageCount: number;
    recentMessages: ContextMessage[];
  };
  facts: ContextFact[];
  degraded: boolean;
};

/**
 * Conversation adapter:
 * - keeps user/assistant only
 * - drops internal Ask prompt / system-like blobs
 * - drops messages whose content equals the current question (passed separately)
 * - preserves order; keeps last CONTEXT_RECENT_MESSAGE_LIMIT messages
 */
export function adaptConversation(
  messages: ConversationInputMessage[] | null | undefined,
  currentQuestion: string
): ConversationAdapterResult {
  try {
    const q = currentQuestion.trim();
    const eligible: ContextMessage[] = [];
    for (const m of messages ?? []) {
      if (m.role !== 'user' && m.role !== 'assistant') continue;
      const content = typeof m.content === 'string' ? m.content.trim() : '';
      if (!content) continue;
      if (isInternalImplementationMessage(content)) continue;
      if (content === q) continue;
      eligible.push({ role: m.role, content });
    }
    const recentMessages =
      eligible.length > CONTEXT_RECENT_MESSAGE_LIMIT
        ? eligible.slice(-CONTEXT_RECENT_MESSAGE_LIMIT)
        : eligible;
    const available = recentMessages.length > 0;
    const facts: ContextFact[] = available
      ? [
          {
            key: 'conversation.message_count',
            value: recentMessages.length,
            source: 'conversation',
            confidence: 1,
          },
        ]
      : [];
    return {
      conversation: {
        available,
        messageCount: recentMessages.length,
        recentMessages,
      },
      facts,
      degraded: false,
    };
  } catch {
    return {
      conversation: {
        available: false,
        messageCount: 0,
        recentMessages: [],
      },
      facts: [],
      degraded: true,
    };
  }
}
