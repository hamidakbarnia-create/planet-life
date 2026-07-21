/** Ask Decision Intelligence V3 orchestration. */

import type { BirthProfile } from '@/lib/birth-profile';
import {
  postConversationExecute,
  type ConversationLocale,
} from '@/lib/conversation-client';
import { loadPathfinderTiming } from '@/lib/pathfinder-decision/timing';
import { trackAskDecisionEvent } from './analytics';
import { evaluateClarification } from './clarification';
import { collectAskContext } from './context';
import { buildStructuredFallback } from './fallback';
import { frameDecision } from './framing';
import { detectIntent } from './intent';
import { buildTimingIntelligence } from './local-build';
import { parseAskDecisionResponse } from './parse';
import { buildAskDecisionPrompt } from './prompt-builder';
import type { AskDecisionResult, ClarificationState } from './types';

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

/**
 * Full Ask V3 pipeline:
 * Intent → Frame → Optional clarification gate → Context → Conversation + Timing → Parse/Validate/Fallback
 */
export async function runAskDecision(
  input: RunAskDecisionInput
): Promise<RunAskDecisionOutput> {
  const question = input.question.trim() || 'Untitled decision';
  const generatedAt = new Date().toISOString();
  const locale = input.locale ?? 'en';

  const intent = detectIntent(question);
  const frameBase = frameDecision(question, intent);
  const clarification = evaluateClarification(frameBase, intent);

  if (
    clarification.required &&
    !input.clarificationAnswer?.trim() &&
    !input.continueWithAssumptions
  ) {
    const timingEmpty = buildTimingIntelligence(null, intent.timingRelevant, false);
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
    });
    pending.recommendation = 'One clarification will improve this briefing.';
    pending.recommendationStatus = 'gather-more-information';
    pending.executiveSummary =
      'This question needs one clarification before a responsible recommendation. Answer the prompt or continue with stated assumptions.';
    trackAskDecisionEvent('ask_clarification_shown', {
      intent: intent.primaryIntent,
      high_stakes: intent.highStakesFlag,
    });
    return {
      result: pending,
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
            ? ['User continued with stated assumptions']
            : []),
        ],
  };

  if (input.clarificationAnswer?.trim()) {
    frame.unknowns = frame.unknowns.filter((u) => !/subject|options|deadline/i.test(u));
    frame.decisionStatement = `${frame.decisionStatement} — Clarification: ${input.clarificationAnswer.trim().slice(0, 120)}`;
  }

  const context = collectAskContext(input.profile, { locale, intent });

  let timingBlock = buildTimingIntelligence(null, intent.timingRelevant, false);
  let conversationOk = false;
  let conversationMessage: string | null = null;
  let requestId: string | null = null;
  let failReason: 'network' | 'timeout' | 'parse' | 'provider' | 'unknown' = 'unknown';

  try {
    const [timingResult, conversation] = await Promise.all([
      intent.timingRelevant || context.timingAvailable
        ? loadPathfinderTiming(input.profile).catch(() => null)
        : Promise.resolve(null),
      postConversationExecute(
        buildAskDecisionPrompt({
          question,
          intent,
          frame,
          context,
          clarificationAnswer: input.clarificationAnswer,
        }),
        locale,
        { signal: input.signal }
      ),
    ]);

    if (timingResult) {
      timingBlock = buildTimingIntelligence(
        timingResult.timing,
        intent.timingRelevant,
        timingResult.signals.todayScore != null ||
          timingResult.signals.weekScore != null
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
    });
    trackAskDecisionEvent('ask_result_failed', {
      reason: failReason,
      intent: intent.primaryIntent,
      has_request_id: Boolean(requestId),
    });
  } else {
    result = parseAskDecisionResponse({
      conversationMessage,
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
    });
    trackAskDecisionEvent('ask_result_rendered', {
      intent: intent.primaryIntent,
      status: result.recommendationStatus,
      fallback: Boolean(result.meta?.fallback),
      used_profile: context.usedProfile,
      used_timing: timingBlock.available,
    });
  }

  return { result, clarification, pendingClarification: false };
}

/** Convenience: returns result only (legacy callers). */
export async function runAskDecisionResult(
  input: RunAskDecisionInput
): Promise<AskDecisionResult> {
  const out = await runAskDecision(input);
  return out.result;
}
