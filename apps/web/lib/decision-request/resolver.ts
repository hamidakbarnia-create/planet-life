import type { ResolvedAskQuestion } from '../resolve-ask-question';
import type { DecisionExecution, DecisionRequest } from './types';

function mapExecution(resolved: ResolvedAskQuestion): DecisionExecution {
  if (resolved.source === 'typed') {
    return resolved.executionUnresolvedReason
      ? { unresolvedReason: resolved.executionUnresolvedReason }
      : {};
  }

  const execution: DecisionExecution = {};

  if (resolved.guidedQuestion) {
    execution.guidedQuestionId = resolved.guidedQuestion.id;
  }

  if (resolved.executionMetadata) {
    execution.actionType = resolved.executionMetadata.actionType;
    execution.categoryId = resolved.executionMetadata.categoryId;
    execution.needsTime = resolved.executionMetadata.needsTime;
  }

  if (resolved.executionUnresolvedReason) {
    execution.unresolvedReason = resolved.executionUnresolvedReason;
  }

  return execution;
}

export function resolveDecisionRequest(resolved: ResolvedAskQuestion): DecisionRequest {
  return {
    displayText: resolved.displayText,
    question: {
      source: resolved.source === 'typed' ? 'typed' : 'guided',
    },
    execution: mapExecution(resolved),
  };
}
