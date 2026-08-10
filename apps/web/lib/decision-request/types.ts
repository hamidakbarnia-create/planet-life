import type { AskUnresolvedReason } from '../resolve-ask-question';
import type { QuestionCategoryId } from '../question-library';
import type { TypedDecisionResolution } from './typed-resolver';

export type DecisionQuestionSource = 'guided' | 'typed';

export interface DecisionExecution {
  decisionTypeId?: string;
  actionType?: string;
  categoryId?: QuestionCategoryId;
  needsTime?: boolean;
  guidedQuestionId?: string;
  unresolvedReason?: AskUnresolvedReason;
  /** Structured typed free-text resolution metadata (exact/ambiguous/unsupported). */
  typedResolution?: TypedDecisionResolution;
}

export interface DecisionRequest {
  displayText: string;
  question: {
    source: DecisionQuestionSource;
  };
  execution: DecisionExecution;
}
