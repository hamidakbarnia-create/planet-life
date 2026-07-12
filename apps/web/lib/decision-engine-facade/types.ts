import type { DecisionExecutionUnresolvedReason } from '../decision-execution';
import type { DecisionApiClientResult } from '../decision-api';
import type { AppLang } from '../app-settings';
import type { ProfileRecord } from '../profile/profile-types';

export interface DecisionResult {
  requestId: string;
  actionType: string;
  guidedQuestionId: string;
  categoryId: string;
  needsTime: boolean;
  summary: string;
  source: 'placeholder';
}

export type DecisionExecutionObservation =
  | { executed: false; reason: 'no_execution_context' | 'build_failed' }
  | { executed: true };

export type DecisionEngineResponse =
  | {
      status: 'completed';
      result: DecisionResult;
      execution: DecisionExecutionObservation;
      /** Transport observation only — not for UI consumption. */
      api?: DecisionApiClientResult;
    }
  | {
      status: 'unresolved';
      reason: DecisionExecutionUnresolvedReason;
    };

export type ExecutePreparedDecisionOptions = {
  profile: ProfileRecord;
  locale: AppLang;
  signal?: AbortSignal;
};
