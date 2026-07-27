import { API_BASE } from '../api-config';
import type {
  DecisionApiClientResult,
  DecisionApiErrorResponse,
  DecisionExecuteSuccessResponse,
  DecisionExecuteTransportRequest,
} from './types';

export const DECISION_EXECUTE_PATH = '/api/v1/decision/execute';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSuccessResponse(value: unknown): value is DecisionExecuteSuccessResponse {
  if (!isRecord(value) || value.status !== 'completed' || !isRecord(value.result)) {
    return false;
  }
  const result = value.result;
  return (
    typeof result.requestId === 'string' &&
    typeof result.actionType === 'string' &&
    typeof result.guidedQuestionId === 'string' &&
    typeof result.categoryId === 'string' &&
    typeof result.needsTime === 'boolean' &&
    typeof result.summary === 'string' &&
    typeof result.source === 'string'
  );
}

function isErrorResponse(value: unknown): value is DecisionApiErrorResponse {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }
  const error = value.error;
  return (
    typeof error.code === 'string' &&
    typeof error.message === 'string' &&
    typeof error.requestId === 'string'
  );
}

/**
 * POST Decision API execute — transport only.
 * No retries, no Idempotency-Key, no timeout policy (optional AbortSignal only).
 */
export async function postDecisionExecute(
  request: DecisionExecuteTransportRequest,
  options?: { signal?: AbortSignal }
): Promise<DecisionApiClientResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${DECISION_EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: options?.signal,
    });
  } catch {
    return { ok: false, kind: 'network_error' };
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return { ok: false, kind: 'malformed_response', httpStatus: response.status };
  }

  if (response.status === 200 && isSuccessResponse(parsed)) {
    return { ok: true, httpStatus: 200, body: parsed };
  }

  if (isErrorResponse(parsed)) {
    return {
      ok: false,
      kind: 'contract_error',
      httpStatus: response.status,
      body: parsed,
    };
  }

  return { ok: false, kind: 'malformed_response', httpStatus: response.status };
}
