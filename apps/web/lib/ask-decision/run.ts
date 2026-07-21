/** Ask Decision Intelligence V3 orchestration. */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  postConversationExecute,
  type ConversationLocale,
  type ConversationMessage,
} from '@/lib/conversation-client';
import {
  checkResponseLanguage,
  extractUserFacingAskProse,
  LANGUAGE_RETRY_INSTRUCTION,
} from '@/lib/locale-language-guard';
import { loadPathfinderTiming } from '@/lib/pathfinder-decision/timing';
import { askCopy } from './ask-local-copy';
import { trackAskDecisionEvent } from './analytics';
import { evaluateClarification } from './clarification';
import { collectAskContext } from './context';
import { buildStructuredFallback } from './fallback';
import { frameDecision } from './framing';
import { detectIntent } from './intent';
import { localizeAskDecisionPresentation } from './localize-presentation';
import { buildTimingIntelligence } from './local-build';
import { parseAskDecisionResponse } from './parse';
import { buildAskDecisionPrompt } from './prompt-builder';
import type { AskDecisionResult, ClarificationState } from './types';
import type { AppLang } from '@/lib/app-settings';

export type RunAskDecisionInput = {
  question: string;
  profile: BirthProfile | null;
  locale?: ConversationLocale;
  signal?: AbortSignal;
  clarificationAnswer?: string | null;
  /** Skip clarification gate (Continue with assumptions). */
  continueWithAssumptions?: boolean;
};

export type RunAskDecisionOutput = {
  result: AskDecisionResult;
  clarification: ClarificationState;
  /** True when analysis was blocked pending clarification. */
  pendingClarification: boolean;
};

function parseInputBase(args: {
  conversationMessage: string | null;
  intent: ReturnType<typeof detectIntent>;
  frame: ReturnType<typeof frameDecision>;
  timing: ReturnType<typeof buildTimingIntelligence>;
  usedProfile: boolean;
  usedTiming: boolean;
  decisionStyles: string[];
  generatedAt: string;
  requestId: string | null;
  clarificationAnswer: string | null;
  sources: string[];
  locale: ConversationLocale;
}) {
  return {
    conversationMessage: args.conversationMessage,
    intent: args.intent,
    frame: args.frame,
    timing: args.timing,
    usedProfile: args.usedProfile,
    usedTiming: args.usedTiming,
    decisionStyles: args.decisionStyles,
    generatedAt: args.generatedAt,
    requestId: args.requestId,
    clarificationAnswer: args.clarificationAnswer,
    sources: args.sources,
    locale: args.locale,
  };
}

/**
 * Full Ask V3 pipeline:
 * Intent → Frame → Optional clarification gate → Context → Conversation + Timing → Parse/Validate/Fallback
 */
export async function runAskDecision(
  input: RunAskDecisionInput
): Promise<RunAskDecisionOutput> {
  const locale = input.locale ?? 'en';
  const question = input.question.trim() || askCopy(locale, 'run.untitled');
  const generatedAt = new Date().toISOString();

  const intent = detectIntent(question);
  const frameBase = frameDecision(question, intent);
  const clarification = evaluateClarification(frameBase, intent, locale);

  if (
    clarification.required &&
    !input.clarificationAnswer?.trim() &&
    !input.continueWithAssumptions
  ) {
    const timingEmpty = buildTimingIntelligence(
      null,
      intent.timingRelevant,
      false,
      locale
    );
    const pending = buildStructuredFallback({
      intent,
      frame: frameBase,
      timing: timingEmpty,
      usedProfile: false,
      usedTiming: false,
      decisionStyles: [],
      generatedAt,
      requestId: null,
      clarificationAnswer: null,
      reason: 'unknown',
      locale,
    });
    pending.recommendation = askCopy(locale, 'run.clarification.recommendation');
    pending.recommendationStatus = 'gather-more-information';
    pending.executiveSummary = askCopy(
      locale,
      'run.clarification.executiveSummary'
    );
    trackAskDecisionEvent('ask_clarification_shown', {
      intent: intent.primaryIntent,
      high_stakes: intent.highStakesFlag,
    });
    return {
      result: localizeAskDecisionPresentation(pending, locale as AppLang),
      clarification,
      pendingClarification: true,
    };
  }

  const frame = {
    ...frameBase,
    requiresClarification: false,
    assumptions: input.clarificationAnswer?.trim()
      ? frameBase.assumptions
      : [
          ...frameBase.assumptions,
          ...(input.continueWithAssumptions
            ? [askCopy(locale, 'run.continuedAssumptions')]
            : []),
        ],
  };

  if (input.clarificationAnswer?.trim()) {
    frame.unknowns = frame.unknowns.filter((u) => !/subject|options|deadline/i.test(u));
    frame.decisionStatement = askCopy(locale, 'run.clarification.frameSuffix', {
      decision: frame.decisionStatement,
      answer: input.clarificationAnswer.trim().slice(0, 120),
    });
  }

  const context = collectAskContext(input.profile, { locale, intent });

  let timingBlock = buildTimingIntelligence(
    null,
    intent.timingRelevant,
    false,
    locale
  );
  let conversationOk = false;
  let conversationMessage: string | null = null;
  let requestId: string | null = null;
  let failReason: 'network' | 'timeout' | 'parse' | 'provider' | 'unknown' = 'unknown';
  let promptMessages: ConversationMessage[] = [];

  try {
    promptMessages = buildAskDecisionPrompt({
      question,
      intent,
      frame,
      context,
      clarificationAnswer: input.clarificationAnswer,
    });
    const [timingResult, conversation] = await Promise.all([
      intent.timingRelevant || context.timingAvailable
        ? loadPathfinderTiming(input.profile).catch(() => null)
        : Promise.resolve(null),
      postConversationExecute(promptMessages, locale, { signal: input.signal }),
    ]);

    if (timingResult) {
      timingBlock = buildTimingIntelligence(
        timingResult.timing,
        intent.timingRelevant,
        timingResult.signals.todayScore != null ||
          timingResult.signals.weekScore != null,
        locale
      );
    }

    if (conversation.ok) {
      conversationOk = true;
      conversationMessage = conversation.body.message;
      requestId = conversation.body.request_id;
    } else {
      failReason =
        conversation.kind === 'network_error' ? 'network' : 'provider';
    }
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    failReason = name === 'AbortError' ? 'timeout' : 'network';
  }

  const sources: string[] = ['ask-decision-engine-v3'];
  if (context.usedProfile) sources.push('intelligence-core');
  if (timingBlock.available) sources.push('timing-engine');
  if (conversationOk) sources.push('conversation-api');

  const sharedParse = {
    intent,
    frame,
    timing: timingBlock,
    usedProfile: context.usedProfile,
    usedTiming: timingBlock.available,
    decisionStyles: context.decisionStyles,
    generatedAt,
    requestId,
    clarificationAnswer: input.clarificationAnswer ?? null,
    sources,
    locale,
  };

  let result: AskDecisionResult;
  if (!conversationOk || !conversationMessage) {
    result = buildStructuredFallback({
      intent,
      frame,
      timing: timingBlock,
      usedProfile: context.usedProfile,
      usedTiming: timingBlock.available,
      decisionStyles: context.decisionStyles,
      generatedAt,
      requestId,
      clarificationAnswer: input.clarificationAnswer ?? null,
      reason: failReason,
      locale,
    });
    trackAskDecisionEvent('ask_result_failed', {
      reason: failReason,
      intent: intent.primaryIntent,
      has_request_id: Boolean(requestId),
    });
  } else {
    result = parseAskDecisionResponse(
      parseInputBase({
        ...sharedParse,
        conversationMessage,
      })
    );

    // Language guard: one retry for fa/ar/ru when prose is English-dominant.
    if (locale === 'fa' || locale === 'ar' || locale === 'ru') {
      const prose = extractUserFacingAskProse(result);
      const langCheck = checkResponseLanguage(prose, locale);
      if (!langCheck.ok) {
        console.info({
          event: 'ask_language_mismatch',
          locale,
          dominant: langCheck.dominant,
          requestId,
          attempt: 1,
        });

        let didLanguageRetry = false;
        if (!didLanguageRetry) {
          didLanguageRetry = true;
          try {
            const retryMessages: ConversationMessage[] = [
              ...promptMessages,
              {
                role: 'user',
                content: LANGUAGE_RETRY_INSTRUCTION[locale],
              },
            ];
            const retry = await postConversationExecute(retryMessages, locale, {
              signal: input.signal,
            });
            if (retry.ok) {
              requestId = retry.body.request_id;
              result = parseAskDecisionResponse(
                parseInputBase({
                  ...sharedParse,
                  conversationMessage: retry.body.message,
                  requestId,
                  sources: [...new Set([...sources, 'conversation-api'])],
                })
              );
              const retryProse = extractUserFacingAskProse(result);
              const retryCheck = checkResponseLanguage(retryProse, locale);
              if (!retryCheck.ok) {
                result = buildStructuredFallback({
                  intent,
                  frame,
                  timing: timingBlock,
                  usedProfile: context.usedProfile,
                  usedTiming: timingBlock.available,
                  decisionStyles: context.decisionStyles,
                  generatedAt,
                  requestId,
                  clarificationAnswer: input.clarificationAnswer ?? null,
                  reason: 'parse',
                  locale,
                });
                result.recommendation = askCopy(locale, 'safe.languageFailure');
                result.executiveSummary = askCopy(locale, 'safe.languageFailure');
              }
            } else {
              result = buildStructuredFallback({
                intent,
                frame,
                timing: timingBlock,
                usedProfile: context.usedProfile,
                usedTiming: timingBlock.available,
                decisionStyles: context.decisionStyles,
                generatedAt,
                requestId,
                clarificationAnswer: input.clarificationAnswer ?? null,
                reason: 'provider',
                locale,
              });
            }
          } catch (err) {
            const name = err instanceof Error ? err.name : '';
            result = buildStructuredFallback({
              intent,
              frame,
              timing: timingBlock,
              usedProfile: context.usedProfile,
              usedTiming: timingBlock.available,
              decisionStyles: context.decisionStyles,
              generatedAt,
              requestId,
              clarificationAnswer: input.clarificationAnswer ?? null,
              reason: name === 'AbortError' ? 'timeout' : 'network',
              locale,
            });
          }
        }
      }
    }

    trackAskDecisionEvent('ask_result_rendered', {
      intent: intent.primaryIntent,
      status: result.recommendationStatus,
      fallback: Boolean(result.meta?.fallback),
      used_profile: context.usedProfile,
      used_timing: timingBlock.available,
    });
  }

  // Presentation gate: never ship English/wrong-script Decision UI for fa/ar/ru.
  result = localizeAskDecisionPresentation(result, locale as AppLang);

  return { result, clarification, pendingClarification: false };
}

/** Convenience: returns result only (legacy callers). */
export async function runAskDecisionResult(
  input: RunAskDecisionInput
): Promise<AskDecisionResult> {
  const out = await runAskDecision(input);
  return out.result;
}
