import type { DecisionRequest } from '../decision-request';
import type {
  DecisionExecutionPreparation,
  ExecutableDecisionRequest,
} from './types';

function isCompleteGuidedExecution(
  execution: DecisionRequest['execution']
): execution is ExecutableDecisionRequest['execution'] {
  return (
    typeof execution.actionType === 'string' &&
    execution.actionType.length > 0 &&
    typeof execution.guidedQuestionId === 'string' &&
    execution.guidedQuestionId.length > 0 &&
    typeof execution.categoryId === 'string' &&
    execution.categoryId.length > 0 &&
    typeof execution.needsTime === 'boolean' &&
    execution.unresolvedReason === undefined
  );
}

export function prepareDecisionExecution(
  request: DecisionRequest
): DecisionExecutionPreparation {
  if (request.question.source === 'typed') {
    return {
      status: 'unresolved',
      request,
      reason:
        request.execution.unresolvedReason ?? 'typed_question_unresolved',
    };
  }

  if (request.execution.unresolvedReason) {
    return {
      status: 'unresolved',
      request,
      reason: request.execution.unresolvedReason,
    };
  }

  if (!isCompleteGuidedExecution(request.execution)) {
    return {
      status: 'unresolved',
      request,
      reason: 'incomplete_execution_metadata',
    };
  }

  return {
    status: 'ready',
    request: {
      displayText: request.displayText,
      question: { source: 'guided' },
      execution: {
        actionType: request.execution.actionType,
        guidedQuestionId: request.execution.guidedQuestionId,
        categoryId: request.execution.categoryId,
        needsTime: request.execution.needsTime,
      },
    },
  };
}
