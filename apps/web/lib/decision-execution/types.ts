import type { AskUnresolvedReason } from '../resolve-ask-question';
import type { DecisionRequest } from '../decision-request';
import type { QuestionCategoryId } from '../question-library';

export type DecisionExecutionUnresolvedReason =
  | AskUnresolvedReason
  | 'incomplete_execution_metadata';

export interface ExecutableDecisionRequest {
  displayText: string;
  question: {
    source: 'guided';
  };
  execution: {
    actionType: string;
    guidedQuestionId: string;
    categoryId: QuestionCategoryId;
    needsTime: boolean;
  };
}

export type DecisionExecutionPreparation =
  | {
      status: 'ready';
      request: ExecutableDecisionRequest;
    }
  | {
      status: 'unresolved';
      request: DecisionRequest;
      reason: DecisionExecutionUnresolvedReason;
    };
