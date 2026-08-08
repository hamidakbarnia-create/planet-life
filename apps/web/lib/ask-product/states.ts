/**
 * Consumer ASK states — map Frame/Case/runtime signals without exposing jargon.
 */

import {
  canEvaluateInProduction,
  canExecuteInProduction,
} from '@/lib/ask-home';
import type { DecisionFrameV1 } from '@/lib/decision-frame/types';
import { isFramingPersistReady } from '@/lib/decision-frame';

export type AskConsumerState =
  | 'ASKING'
  | 'UNDERSTANDING'
  | 'NEEDS_CLARIFICATION'
  | 'READY_TO_EVALUATE'
  | 'READY_TO_COMPARE'
  | 'EVALUATING'
  | 'RESULT'
  | 'BLOCKED_MISSING_EVIDENCE'
  | 'UNSUPPORTED_OPERATION'
  | 'CAPABILITY_UNAVAILABLE'
  | 'ERROR';

/** FIND remains unsupported. COMPARE is unsupported unless production hint ships it. */
export function isUnsupportedOperationFrame(frame: DecisionFrameV1): boolean {
  if (frame.operation === 'find') return true;
  if (frame.operation === 'compare') {
    return !canExecuteInProduction(frame.decision_type_id, 'compare');
  }
  return false;
}

/** Web UX hint: evaluate is not offered for this Decision Type. */
export function isEvaluateCapabilityUnavailable(
  frame: DecisionFrameV1
): boolean {
  return !canEvaluateInProduction(frame.decision_type_id);
}

/**
 * True when evaluate is selected/ready but the Web UX hint does not offer it.
 * Prevents READY_TO_EVALUATE / client Case create for free-text defaults.
 * Backend validation remains the final authority.
 */
export function isCapabilityUnavailableEvaluateFrame(
  frame: DecisionFrameV1
): boolean {
  if (isUnsupportedOperationFrame(frame)) return false;
  if (frame.operation !== 'evaluate') return false;
  return isEvaluateCapabilityUnavailable(frame);
}

export function deriveClarificationState(
  frame: DecisionFrameV1
): AskConsumerState {
  if (isUnsupportedOperationFrame(frame)) {
    return 'UNSUPPORTED_OPERATION';
  }

  // Evaluate selected with date but no production runtime/type → capability gate.
  if (
    frame.operation === 'evaluate' &&
    isFramingPersistReady(frame) &&
    frame.time.scope === 'specific_date' &&
    Boolean(frame.time.dates?.[0]) &&
    isEvaluateCapabilityUnavailable(frame)
  ) {
    return 'CAPABILITY_UNAVAILABLE';
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
    Boolean(frame.time.dates?.[0]) &&
    canEvaluateInProduction(frame.decision_type_id)
  ) {
    return 'READY_TO_EVALUATE';
  }

  if (
    frame.operation === 'compare' &&
    isFramingPersistReady(frame) &&
    frame.time.scope === 'multiple_dates' &&
    (frame.time.dates?.length ?? 0) >= 2 &&
    (frame.time.dates?.length ?? 0) <= 3 &&
    canExecuteInProduction(frame.decision_type_id, 'compare')
  ) {
    return 'READY_TO_COMPARE';
  }

  return 'NEEDS_CLARIFICATION';
}
