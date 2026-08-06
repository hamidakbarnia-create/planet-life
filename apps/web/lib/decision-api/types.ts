/** Transport types for Decision API Contract v1 (ADR-0006). */

export type DecisionApiLocale = 'en' | 'ru' | 'fa' | 'ar';

export interface DecisionExecuteTransportProfile {
  birth_date: string;
  birth_time: string;
  location: string;
  latitude: number;
  longitude: number;
  action_type: string;
}

export interface DecisionExecuteTransportRequest {
  request_id: string;
  display_text: string;
  action_type: string;
  guided_question_id: string;
  category_id: string;
  needs_time: boolean;
  locale: DecisionApiLocale;
  profile: DecisionExecuteTransportProfile;
}

export interface DecisionExecuteTransportResult {
  requestId: string;
  actionType: string;
  guidedQuestionId: string;
  categoryId: string;
  needsTime: boolean;
  summary: string;
  source: string;
}

export interface DecisionExecuteSuccessResponse {
  status: 'completed';
  result: DecisionExecuteTransportResult;
}

export interface DecisionApiErrorBody {
  code: string;
  message: string;
  requestId: string;
}

export interface DecisionApiErrorResponse {
  error: DecisionApiErrorBody;
}

export type BuildDecisionExecuteRequestResult =
  | { ok: true; request: DecisionExecuteTransportRequest }
  | {
      ok: false;
      reason: 'incomplete_profile' | 'missing_location' | 'invalid_coordinates';
    };

export type DecisionApiClientResult =
  | {
      ok: true;
      httpStatus: 200;
      body: DecisionExecuteSuccessResponse;
    }
  | {
      ok: false;
      kind: 'contract_error';
      httpStatus: number;
      body: DecisionApiErrorResponse;
    }
  | {
      ok: false;
      kind: 'malformed_response';
      httpStatus: number;
    }
  | {
      ok: false;
      kind: 'network_error';
    };
