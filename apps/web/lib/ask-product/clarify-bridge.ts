/**
 * Bridge clarification UX to Decision Frame internals without exposing jargon.
 */

import type { DecisionFrameV1 } from '@/lib/decision-frame/types';

export {
  applyEvaluateDate,
  applyOperationChoice,
  applyOpenEndedAxis,
  buildDecisionFrame,
} from '@/lib/decision-frame/frame';
export {
  isFramingPersistReady,
  loadDecisionFrame,
  loadFrameFromCase,
  persistFrameToCase,
  saveDecisionFrame,
} from '@/lib/decision-frame';
export type { DecisionFrameV1 } from '@/lib/decision-frame/types';
export { getAskProductCopy } from './copy';
export {
  deriveClarificationState,
  isUnsupportedOperationFrame,
} from './states';

/** Reset a compare/find frame to examine step without claiming those ops ran. */
export function resetToExamineStep(frame: DecisionFrameV1): DecisionFrameV1 {
  return {
    ...frame,
    operation: 'unresolved',
    pending_clarification: 'operation',
    time: { scope: 'none' },
    options: undefined,
    unknowns: ['Operation', 'Time'],
    open_ended: false,
  };
}
