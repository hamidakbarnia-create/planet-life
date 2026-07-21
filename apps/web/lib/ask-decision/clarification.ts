/** Single optional clarification — never a wizard. */

import type { ClarificationState, DecisionFrame, IntentDetection } from './types';

export function evaluateClarification(
  frame: DecisionFrame,
  intent: IntentDetection
): ClarificationState {
  if (!frame.requiresClarification) {
    return {
      required: false,
      question: null,
      canContinueWithAssumptions: true,
    };
  }

  let question =
    'What specifically are you deciding about (the subject, options, or deadline)?';

  if (/^should i accept it/i.test(frame.originalQuestion)) {
    question = 'What are you considering accepting (role, offer, deal, or other)?';
  } else if (/is this the right time/i.test(frame.originalQuestion)) {
    question = 'What action are you timing, and by when do you need to decide?';
  } else if (/^what should i do/i.test(frame.originalQuestion)) {
    question = 'What decision are you facing, and what outcome matters most?';
  } else if (intent.timingRelevant && frame.timeHorizon === 'unknown') {
    question = 'What is the latest date by which this decision must be made?';
  }

  return {
    required: true,
    question,
    canContinueWithAssumptions: !intent.highStakesFlag,
  };
}
