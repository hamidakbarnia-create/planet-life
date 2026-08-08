import type { ResolvedAskQuestion } from '../resolve-ask-question';
import type { DecisionExecution, DecisionRequest } from './types';

function mapExecution(resolved: ResolvedAskQuestion): DecisionExecution {
  if (resolved.source === 'typed') {
    if (resolved.executionUnresolvedReason) {
      return { unresolvedReason: resolved.executionUnresolvedReason };
    }
    const execution: DecisionExecution = {};
    if (resolved.decisionTypeId) {
      execution.decisionTypeId = resolved.decisionTypeId;
    }
    return execution;
  }

  const execution: DecisionExecution = {};

  if (resolved.decisionTypeId) {
    execution.decisionTypeId = resolved.decisionTypeId;
  }

  if (resolved.guidedQuestion) {
    execution.guidedQuestionId = resolved.guidedQuestion.id;
  }

  if (resolved.executionMetadata) {
    if (resolved.executionMetadata.actionType === 'investor_meeting') {
      execution.decisionTypeId = 'bus-investor-meeting';
    }
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
