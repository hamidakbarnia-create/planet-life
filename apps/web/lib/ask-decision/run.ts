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
import { askCopy } from './ask-local-copy';
import { trackAskDecisionEvent } from './analytics';
import { evaluateClarification } from './clarification';
import { collectAskContext } from './context';
import { buildStructuredFallback } from './fallback';
import { frameDecision } from './framing';
import { detectIntent } from './intent';
import { buildUnifiedDecisionContext } from './context-builder';
import type { UnifiedDecisionContext } from './context-builder';
import { buildInputAnalysis } from './input-analysis';
import type { InputAnalysis } from './input-analysis';
import { buildReasoningPlan } from './reasoning-planner';
import type { ReasoningPlan } from './reasoning-planner';
import {
  buildPromptContextMeta,
  collectAskTiming,
  collectPromptContextInputs,
  isStructuredPromptContextEnabled,
  prepareAskPromptBundle,
  type PromptContextMeta,
} from './prompt-context';
import {
  buildGroundingProvenance,
  type GroundingProvenance,
} from './grounding';
import {
  buildValidationReport,
  type ValidationReport,
} from './claim-validation';
import { localizeAskDecisionPresentation } from './localize-presentation';
import { buildTimingIntelligence } from './local-build';
import { parseAskDecisionResponse } from './parse';
import { buildAskDecisionPrompt } from './prompt-builder';
import type {
  AskDecisionResult,
  ClarificationState,
  TimingIntelligence,
} from './types';
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

/** P2.1a InputAnalysis is attached only on `result.meta.inputAnalysis` (no top-level field yet). */
export type RunAskDecisionOutput = {
  result: AskDecisionResult;
  clarification: ClarificationState;
  /** True when analysis was blocked pending clarification. */
  pendingClarification: boolean;
};

function attachInternalDecisionMeta(
  result: AskDecisionResult,
  args: {
    inputAnalysis: InputAnalysis;
    decisionContext: UnifiedDecisionContext;
    reasoningPlan: ReasoningPlan;
    promptContext: PromptContextMeta;
    grounding: GroundingProvenance;
    validation: ValidationReport;
  }
): AskDecisionResult {
  const meta = result.meta;
  const sources = [
    ...new Set([
      ...(meta?.sources ?? []),
      'input-analysis-v1',
      'context-builder-v1',
      'reasoning-planner-v1',
      ...(args.promptContext.status === 'used'
        ? (['prompt-context-v1'] as const)
        : []),
      ...(args.grounding.status === 'used'
        ? (['grounding-v1'] as const)
        : []),
      ...(args.validation.status === 'used'
        ? (['claim-validation-v1'] as const)
        : []),
    ]),
  ];
  return {
    ...result,
    meta: {
      sources,
      requestId: meta?.requestId ?? null,
      clarificationAnswer: meta?.clarificationAnswer ?? null,
      usedProfile: meta?.usedProfile ?? false,
      usedTiming: meta?.usedTiming ?? false,
      fallback: meta?.fallback ?? false,
      loadingStage: meta?.loadingStage,
      inputAnalysis: args.inputAnalysis,
      decisionContext: args.decisionContext,
      reasoningPlan: args.reasoningPlan,
      promptContext: args.promptContext,
      grounding: args.grounding,
      validation: args.validation,
    },
  };
}

function buildRunDecisionContext(args: {
  question: string;
  locale: ConversationLocale;
  analysis: InputAnalysis;
  profile: BirthProfile | null;
  timing: TimingIntelligence | null;
  clarificationAnswer?: string | null;
  builtAt: string;
}): UnifiedDecisionContext {
  const conversationMessages = args.clarificationAnswer?.trim()
    ? [{ role: 'user' as const, content: args.clarificationAnswer.trim() }]
    : [];
  return buildUnifiedDecisionContext({
    question: args.question,
    locale: args.locale,
    analysis: args.analysis,
    profile: args.profile,
    timing: args.timing,
    conversationMessages,
    now: () => args.builtAt,
  });
}

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
 * Intent → Frame → Optional clarification → Context → Plan → Prompt →
 * Provider → Parse/Validate → Localization/WQ → Grounding (meta) →
 * Claim Validation (meta) → Presentation
 *
 * Note: Grounding (P2.1b-03) observes the final localized / WQ result only —
 * final-output provenance preparation, not raw-provider claim provenance.
 * See ask-decision/grounding/types.ts. Do not relocate in this phase.
 * Claim validation (P2.1b-04) consumes grounding only; never mutates output.
 */
export async function runAskDecision(
  input: RunAskDecisionInput
): Promise<RunAskDecisionOutput> {
  const locale = input.locale ?? 'en';
  const question = input.question.trim() || askCopy(locale, 'run.untitled');
  const generatedAt = new Date().toISOString();

  // P2.1a — InputAnalysis foundation (does not replace legacy detectIntent yet)
  const inputAnalysis = buildInputAnalysis(question);

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
    const decisionContext = buildRunDecisionContext({
      question,
      locale,
      analysis: inputAnalysis,
      profile: input.profile,
      timing: timingEmpty,
      clarificationAnswer: input.clarificationAnswer,
      builtAt: generatedAt,
    });
    const reasoningPlan = buildReasoningPlan({
      analysis: inputAnalysis,
      context: decisionContext,
    });
    const pendingLocalized = localizeAskDecisionPresentation(
      pending,
      locale as AppLang
    );
    const grounding = buildGroundingProvenance({
      context: decisionContext,
      plan: reasoningPlan,
      result: pendingLocalized,
      builtAt: generatedAt,
    });
    const validation = buildValidationReport(grounding);
    return {
      result: attachInternalDecisionMeta(pendingLocalized, {
        inputAnalysis,
        decisionContext,
        reasoningPlan,
        promptContext: buildPromptContextMeta('unavailable'),
        grounding,
        validation,
      }),
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
  let promptContextMeta: PromptContextMeta =
    buildPromptContextMeta('unavailable');
  let earlyDecisionContext: UnifiedDecisionContext | null = null;
  let earlyReasoningPlan: ReasoningPlan | null = null;

  try {
    const structuredEnabled = isStructuredPromptContextEnabled();
    const needsTiming = intent.timingRelevant || context.timingAvailable;

    if (structuredEnabled) {
      // Parallel context-input acquisition (timing ∥ conversation messages),
      // then serialize/prepare prompt, then provider — not serial awaits.
      const collected = await collectPromptContextInputs({
        timing: {
          profile: input.profile,
          timingRelevant: intent.timingRelevant,
          timingAvailable: context.timingAvailable,
          locale,
        },
        conversation: {
          clarificationAnswer: input.clarificationAnswer,
        },
      });
      timingBlock = collected.timingBlock;

      const bundle = prepareAskPromptBundle({
        question,
        locale,
        analysis: inputAnalysis,
        profile: input.profile,
        timing: timingBlock,
        conversationMessages: collected.conversationMessages,
        intent,
        frame,
        askContext: context,
        clarificationAnswer: input.clarificationAnswer,
        builtAt: generatedAt,
        enabled: true,
      });
      earlyDecisionContext = bundle.decisionContext;
      earlyReasoningPlan = bundle.reasoningPlan;
      promptContextMeta = bundle.promptContext;
      promptMessages = bundle.promptMessages;

      const conversation = await postConversationExecute(promptMessages, locale, {
        signal: input.signal,
      });
      if (conversation.ok) {
        conversationOk = true;
        conversationMessage = conversation.body.message;
        requestId = conversation.body.request_id;
      } else {
        failReason =
          conversation.kind === 'network_error' ? 'network' : 'provider';
      }
    } else {
      // Legacy: timing ∥ provider (prompt does not depend on timing payload).
      promptContextMeta = buildPromptContextMeta('unavailable');
      promptMessages = buildAskDecisionPrompt({
        question,
        intent,
        frame,
        context,
        clarificationAnswer: input.clarificationAnswer,
      });
      const [timingSettled, conversation] = await Promise.all([
        needsTiming
          ? collectAskTiming({
              profile: input.profile,
              timingRelevant: intent.timingRelevant,
              timingAvailable: context.timingAvailable,
              locale,
            })
          : Promise.resolve(
              buildTimingIntelligence(
                null,
                intent.timingRelevant,
                false,
                locale
              )
            ),
        postConversationExecute(promptMessages, locale, { signal: input.signal }),
      ]);
      timingBlock = timingSettled;

      if (conversation.ok) {
        conversationOk = true;
        conversationMessage = conversation.body.message;
        requestId = conversation.body.request_id;
      } else {
        failReason =
          conversation.kind === 'network_error' ? 'network' : 'provider';
      }
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
  const decisionContext =
    earlyDecisionContext ??
    buildRunDecisionContext({
      question,
      locale,
      analysis: inputAnalysis,
      profile: input.profile,
      timing: timingBlock,
      clarificationAnswer: input.clarificationAnswer,
      builtAt: generatedAt,
    });
  const reasoningPlan =
    earlyReasoningPlan ??
    buildReasoningPlan({
      analysis: inputAnalysis,
      context: decisionContext,
    });
  // P2.1b-03: final-output provenance only (post Localization/WQ).
  // Not raw-provider claim provenance — see grounding/types.ts.
  const grounding = buildGroundingProvenance({
    context: decisionContext,
    plan: reasoningPlan,
    result,
    builtAt: generatedAt,
  });
  // P2.1b-04: claim-level validation over grounding only — meta.validation.
  const validation = buildValidationReport(grounding);
  result = attachInternalDecisionMeta(result, {
    inputAnalysis,
    decisionContext,
    reasoningPlan,
    promptContext: promptContextMeta,
    grounding,
    validation,
  });

  return {
    result,
    clarification,
    pendingClarification: false,
  };
}

/** Convenience: returns result only (legacy callers). */
export async function runAskDecisionResult(
  input: RunAskDecisionInput
): Promise<AskDecisionResult> {
  const out = await runAskDecision(input);
  return out.result;
}
