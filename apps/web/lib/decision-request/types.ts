import type { AskUnresolvedReason } from '../resolve-ask-question';
import type { QuestionCategoryId } from '../question-library';

export type DecisionQuestionSource = 'guided' | 'typed';

export interface DecisionExecution {
  decisionTypeId?: string;
  actionType?: string;
  categoryId?: QuestionCategoryId;
  needsTime?: boolean;
  guidedQuestionId?: string;
  unresolvedReason?: AskUnresolvedReason;
}

export interface DecisionRequest {
  displayText: string;
  question: {
    source: DecisionQuestionSource;
  };
  execution: DecisionExecution;
}
