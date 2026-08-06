/**
 * Parallel context-input acquisition seams for Ask prompt preparation.
 * Timing and conversation-message collection start concurrently.
 */

import type { BirthProfile } from '@/lib/birth-profile';
import { loadPathfinderTiming } from '@/lib/pathfinder-decision/timing';
import type { ConversationInputMessage } from '../context-builder';
import { buildTimingIntelligence } from '../local-build';
import type { TimingIntelligence } from '../types';
import type { ConversationLocale } from '@/lib/conversation-client';

export type CollectAskTimingInput = {
  profile: BirthProfile | null;
  timingRelevant: boolean;
  timingAvailable: boolean;
  locale: ConversationLocale;
  /** Test seam — defaults to pathfinder timing loader. */
  loadTiming?: typeof loadPathfinderTiming;
};

export type CollectAskConversationInput = {
  clarificationAnswer?: string | null;
  /** Optional extra history (already filtered upstream when provided). */
  priorMessages?: ConversationInputMessage[];
  /** Test seam — defaults to sync clarification mapping. */
  collectMessages?: () => Promise<ConversationInputMessage[]>;
};

export type CollectedPromptContextInputs = {
  timingBlock: TimingIntelligence;
  conversationMessages: ConversationInputMessage[];
};

export async function collectAskTiming(
  input: CollectAskTimingInput
): Promise<TimingIntelligence> {
  const load = input.loadTiming ?? loadPathfinderTiming;
  const needsTiming = input.timingRelevant || input.timingAvailable;
  if (!needsTiming) {
    return buildTimingIntelligence(null, input.timingRelevant, false, input.locale);
  }
  const timingResult = await load(input.profile).catch(() => null);
  if (!timingResult) {
    return buildTimingIntelligence(null, input.timingRelevant, false, input.locale);
  }
  return buildTimingIntelligence(
    timingResult.timing,
    input.timingRelevant,
    timingResult.signals.todayScore != null ||
      timingResult.signals.weekScore != null,
    input.locale
  );
}

export async function collectAskConversationMessages(
  input: CollectAskConversationInput
): Promise<ConversationInputMessage[]> {
  if (input.collectMessages) {
    return input.collectMessages();
  }
  const fromClarification = input.clarificationAnswer?.trim()
    ? [{ role: 'user' as const, content: input.clarificationAnswer.trim() }]
    : [];
  return [...(input.priorMessages ?? []), ...fromClarification];
}

/**
 * Start timing + conversation acquisition before awaiting either to completion.
 */
export async function collectPromptContextInputs(args: {
  timing: CollectAskTimingInput;
  conversation: CollectAskConversationInput;
}): Promise<CollectedPromptContextInputs> {
  const timingPromise = collectAskTiming(args.timing);
  const conversationPromise = collectAskConversationMessages(args.conversation);
  const [timingBlock, conversationMessages] = await Promise.all([
    timingPromise,
    conversationPromise,
  ]);
  return { timingBlock, conversationMessages };
}
