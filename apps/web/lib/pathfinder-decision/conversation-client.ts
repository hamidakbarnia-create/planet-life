/**
 * Compatibility surface for Pathfinder.
 * Canonical ADR-0007 client lives in `@/lib/conversation-client`.
 * Pathfinder-only synthesis prompt builder remains here.
 */

export {
  CONVERSATION_EXECUTE_PATH,
  postConversationExecute,
} from '@/lib/conversation-client';

export type {
  ConversationClientResult,
  ConversationLocale,
  ConversationMessage,
  ConversationSuccess,
} from '@/lib/conversation-client';

import type { ConversationMessage } from '@/lib/conversation-client';
import type { ClarificationAnswer, DecisionCategory } from './types';

/** Build a single synthesis prompt for structured decision support (not a chat UI). */
export function buildSynthesisMessages(
  decisionText: string,
  category: DecisionCategory | null,
  answers: ClarificationAnswer[]
): ConversationMessage[] {
  const qa = answers
    .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`)
    .join('\n\n');
  const content = [
    'You are METIORO Decision Intelligence. Produce a concise decision briefing (not a chat reply).',
    `Decision: ${decisionText}`,
    category ? `Category: ${category}` : null,
    'Clarification:',
    qa || '(none)',
    'Cover: summary, urgency, main risk, recommended posture (go / wait / stage), and one concrete next step.',
  ]
    .filter(Boolean)
    .join('\n');

  return [{ role: 'user', content }];
}
