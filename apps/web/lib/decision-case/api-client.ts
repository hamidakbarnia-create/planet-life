/**
 * Thin Decision Case API client for the car-interview PR-2 transport path.
 * Uses centralized API_BASE — never hardcodes API hosts.
 */

import { API_BASE } from '@/lib/api-config';
import type { DecisionEvaluationPackage } from './package-types';
import type { CarInterviewIntake } from './car-interview-form';

export type DecisionCaseIntake = CarInterviewIntake & {
  decision_frame?: Record<string, unknown>;
  [key: string]: unknown;
};

export type DecisionCaseResource = {
  case_id: string;
  owner_subject_id: string;
  decision_type_id: string;
  family_id: string;
  title: string;
  state: string;
  activation_phase: string | null;
  mode: string;
  precision_level: string;
  case_version: number;
  created_at: string;
  updated_at: string;
  intake?: DecisionCaseIntake;
};

export type IntakeMutationResult = {
  case: DecisionCaseResource;
  intake: DecisionCaseIntake;
  missing_required: string[];
  is_complete: boolean;
};

/** Canonical Case-persisted framing shapes by operation. */
export type PersistedDecisionFraming = {
  operation: 'evaluate' | 'compare' | 'find';
  time_scope: 'specific_date' | 'multiple_dates' | 'date_range' | 'none';
  /** EVALUATE + specific_date */
  date?: string;
  /** COMPARE + multiple_dates */
  dates?: string[];
  /** FIND + date_range */
  start?: string;
  end?: string;
  options?: Array<{ id: string; label: string; date?: string }>;
  objective?: string;
  raw_intent?: string;
};

export type FramingMutationResult = {
  case: DecisionCaseResource;
  intake: DecisionCaseIntake;
  framing: Record<string, unknown>;
};

export type DecisionHistoryEvent = {
  history_id: string;
  case_id: string;
  at: string;
  actor: string;
  event: string;
  from_state: string | null;
  to_state: string | null;
  case_version: number | null;
  payload: Record<string, unknown>;
};

export type DecisionEvaluationResource = {
  evaluation_id: string;
  case_id: string;
  case_version: number;
  evaluation_version: number;
  package_contract_version: string;
  engine_id: string;
  dq_status: string;
  created_at: string;
  package: DecisionEvaluationPackage;
};

export class DecisionCaseApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = 'DecisionCaseApiError';
    this.status = input.status;
    this.code = input.code;
    this.details = input.details ?? {};
  }
}

async function parseError(response: Response): Promise<DecisionCaseApiError> {
  let code = 'HTTP_ERROR';
  let message = `Decision Case API failed (${response.status})`;
  let details: Record<string, unknown> = {};
  try {
    const body = (await response.json()) as {
      error?: {
        code?: string;
        message?: string;
        details?: Record<string, unknown>;
      };
    };
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
    if (body.error?.details) details = body.error.details;
  } catch {
    // keep defaults
  }
  return new DecisionCaseApiError({
    status: response.status,
    code,
    message,
    details,
  });
}

async function requestJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return (await response.json()) as T;
}

export function createDecisionCase(input: {
  decisionTypeId: string;
  title: string;
  entryMode?: 'structured' | 'natural_language';
}): Promise<DecisionCaseResource> {
  return requestJson<DecisionCaseResource>('/api/v1/decision-cases', {
    method: 'POST',
    body: JSON.stringify({
      decision_type_id: input.decisionTypeId,
      title: input.title,
      entry_mode: input.entryMode ?? 'structured',
    }),
  });
}

export function createDecisionCaseFromFraming(input: {
  decisionTypeId: string;
  title: string;
  framing: PersistedDecisionFraming;
}): Promise<FramingMutationResult> {
  return requestJson<FramingMutationResult>(
    '/api/v1/decision-cases/from-framing',
    {
      method: 'POST',
      body: JSON.stringify({
        decision_type_id: input.decisionTypeId,
        title: input.title,
        framing: input.framing,
      }),
    }
  );
}

export function updateDecisionCaseFraming(input: {
  caseId: string;
  expectedCaseVersion: number;
  framing: PersistedDecisionFraming;
}): Promise<FramingMutationResult> {
  return requestJson<FramingMutationResult>(
    `/api/v1/decision-cases/${input.caseId}/framing`,
    {
      method: 'PUT',
      body: JSON.stringify({
        expected_case_version: input.expectedCaseVersion,
        framing: input.framing,
      }),
    }
  );
}

export function getDecisionCase(
  caseId: string
): Promise<DecisionCaseResource> {
  return requestJson<DecisionCaseResource>(
    `/api/v1/decision-cases/${caseId}`
  );
}

export type NatalEvidencePayload = {
  birth_date: string;
  birth_time: string;
  location: string;
  latitude?: number;
  longitude?: number;
  evaluation_location?: string;
  evaluation_latitude?: number;
  evaluation_longitude?: number;
};

export function saveIntakeAnswers(input: {
  caseId: string;
  expectedCaseVersion: number;
  answers: Partial<CarInterviewIntake> & {
    natal_evidence?: NatalEvidencePayload;
  };
}): Promise<IntakeMutationResult> {
  return requestJson<IntakeMutationResult>(
    `/api/v1/decision-cases/${input.caseId}/intake/answers`,
    {
      method: 'POST',
      body: JSON.stringify({
        expected_case_version: input.expectedCaseVersion,
        answers: input.answers,
      }),
    }
  );
}

export function completeIntake(input: {
  caseId: string;
  expectedCaseVersion: number;
}): Promise<IntakeMutationResult> {
  return requestJson<IntakeMutationResult>(
    `/api/v1/decision-cases/${input.caseId}/intake/complete`,
    {
      method: 'POST',
      body: JSON.stringify({
        expected_case_version: input.expectedCaseVersion,
      }),
    }
  );
}

export function evaluateDecisionCase(input: {
  caseId: string;
  expectedCaseVersion: number;
}): Promise<DecisionEvaluationResource> {
  return requestJson<DecisionEvaluationResource>(
    `/api/v1/decision-cases/${input.caseId}/evaluations`,
    {
      method: 'POST',
      body: JSON.stringify({
        expected_case_version: input.expectedCaseVersion,
      }),
    }
  );
}

export function listDecisionCaseEvaluations(
  caseId: string
): Promise<{ evaluations: Omit<DecisionEvaluationResource, 'package'>[] }> {
  return requestJson(`/api/v1/decision-cases/${caseId}/evaluations`);
}

export function getEvaluation(input: {
  caseId: string;
  evaluationId: string;
}): Promise<DecisionEvaluationResource> {
  return requestJson(
    `/api/v1/decision-cases/${input.caseId}/evaluations/${input.evaluationId}`
  );
}

export function getDecisionCaseHistory(
  caseId: string
): Promise<{ events: DecisionHistoryEvent[] }> {
  return requestJson(`/api/v1/decision-cases/${caseId}/history`);
}
