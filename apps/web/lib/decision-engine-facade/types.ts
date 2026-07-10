import type { DecisionExecutionUnresolvedReason } from '../decision-execution';

export interface DecisionResult {
  requestId: string;
  actionType: string;
  guidedQuestionId: string;
  categoryId: string;
  needsTime: boolean;
  summary: string;
  source: 'placeholder';
}

export type DecisionEngineResponse =
  | {
      status: 'completed';
      result: DecisionResult;
    }
  | {
      status: 'unresolved';
      reason: DecisionExecutionUnresolvedReason;
    };
