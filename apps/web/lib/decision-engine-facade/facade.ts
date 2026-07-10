import type { DecisionExecutionPreparation } from '../decision-execution';
import type { DecisionEngineResponse } from './types';

function buildRequestId(
  guidedQuestionId: string,
  actionType: string
): string {
  return `${guidedQuestionId}:${actionType}`;
}

export function executePreparedDecision(
  preparation: DecisionExecutionPreparation
): DecisionEngineResponse {
  if (preparation.status === 'unresolved') {
    return {
      status: 'unresolved',
      reason: preparation.reason,
    };
  }

  const { displayText, execution } = preparation.request;

  return {
    status: 'completed',
    result: {
      requestId: buildRequestId(
        execution.guidedQuestionId,
        execution.actionType
      ),
      actionType: execution.actionType,
      guidedQuestionId: execution.guidedQuestionId,
      categoryId: execution.categoryId,
      needsTime: execution.needsTime,
      summary: displayText,
      source: 'placeholder',
    },
  };
}
