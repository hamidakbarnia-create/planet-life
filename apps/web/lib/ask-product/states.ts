/**
 * Consumer ASK states — map Frame/Case/runtime signals without exposing jargon.
 */

import type { DecisionFrameV1 } from '@/lib/decision-frame/types';
import { isFramingPersistReady } from '@/lib/decision-frame';

export type AskConsumerState =
  | 'ASKING'
  | 'UNDERSTANDING'
  | 'NEEDS_CLARIFICATION'
  | 'READY_TO_EVALUATE'
  | 'EVALUATING'
  | 'RESULT'
  | 'BLOCKED_MISSING_EVIDENCE'
  | 'UNSUPPORTED_OPERATION'
  | 'ERROR';

/** Persisted compare/find frames reached via history/direct load. */
export function isUnsupportedOperationFrame(frame: DecisionFrameV1): boolean {
  return frame.operation === 'compare' || frame.operation === 'find';
}

export function deriveClarificationState(
  frame: DecisionFrameV1
): AskConsumerState {
  if (isUnsupportedOperationFrame(frame)) {
    return 'UNSUPPORTED_OPERATION';
  }
  if (
    frame.operation === 'unresolved' ||
    frame.pending_clarification === 'operation' ||
    frame.pending_clarification === 'open_ended_axis' ||
    frame.pending_clarification === 'time' ||
    frame.time.scope === 'none' ||
    !frame.time.dates?.length
  ) {
    return 'NEEDS_CLARIFICATION';
  }
  if (
    frame.operation === 'evaluate' &&
    isFramingPersistReady(frame) &&
    frame.time.scope === 'specific_date' &&
    Boolean(frame.time.dates?.[0])
  ) {
    return 'READY_TO_EVALUATE';
  }
  return 'NEEDS_CLARIFICATION';
}
