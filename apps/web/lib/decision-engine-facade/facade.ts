import {
  buildDecisionExecuteRequest,
  postDecisionExecute,
} from '../decision-api';
import type { DecisionExecutionPreparation } from '../decision-execution';
import type {
  DecisionEngineResponse,
  DecisionResult,
  ExecutePreparedDecisionOptions,
} from './types';

/** ADR-0006 client timeout budget — owned by Guided Ready execution wiring. */
export const GUIDED_DECISION_CLIENT_TIMEOUT_MS = 5000;

function buildLocalResult(
  preparation: Extract<DecisionExecutionPreparation, { status: 'ready' }>
): DecisionResult {
  const { displayText, execution } = preparation.request;
  return {
    requestId: `${execution.guidedQuestionId}:${execution.actionType}`,
    actionType: execution.actionType,
    guidedQuestionId: execution.guidedQuestionId,
    categoryId: execution.categoryId,
    needsTime: execution.needsTime,
    summary: displayText,
    source: 'placeholder',
  };
}

/**
 * Execute a prepared decision.
 * Guided Ready + options: one Decision API call with 5s internal timeout.
 * Optional external AbortSignal aborts the internal controller.
 * Unresolved: no network.
 */
export async function executePreparedDecision(
  preparation: DecisionExecutionPreparation,
  options?: ExecutePreparedDecisionOptions
): Promise<DecisionEngineResponse> {
  if (preparation.status === 'unresolved') {
    return {
      status: 'unresolved',
      reason: preparation.reason,
    };
  }

  const result = buildLocalResult(preparation);

  if (!options) {
    return {
      status: 'completed',
      result,
      execution: { executed: false, reason: 'no_execution_context' },
    };
  }

  const built = buildDecisionExecuteRequest({
    request: preparation.request,
    profile: options.profile,
    locale: options.locale,
  });

  if (!built.ok) {
    return {
      status: 'completed',
      result,
      execution: { executed: false, reason: 'build_failed' },
    };
  }

  const controller = new AbortController();
  const externalSignal = options.signal;
  let externalAbortListening = false;

  const onExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
      externalAbortListening = true;
    }
  }

  const timer = setTimeout(() => {
    controller.abort();
  }, GUIDED_DECISION_CLIENT_TIMEOUT_MS);

  try {
    const api = await postDecisionExecute(built.request, {
      signal: controller.signal,
    });
    return {
      status: 'completed',
      result,
      execution: { executed: true },
      api,
    };
  } finally {
    clearTimeout(timer);
    if (externalAbortListening && externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}
