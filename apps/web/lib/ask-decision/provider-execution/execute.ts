/**
 * Budgeted Ask provider call with timeout + usability classification (P2.2-03).
 */

import {
  postConversationExecute,
  type ConversationLocale,
  type ConversationMessage,
} from '@/lib/conversation-client';
import type { ProviderCallBudget } from '../safe-regeneration/budget';
import { ASK_MAX_PROVIDER_CALLS } from '../safe-regeneration/budget';
import { createBoundaryAbortSignal } from './abort';
import {
  classifyAskMessageUsability,
  classifyConversationClientFailure,
  classifyThrownProviderError,
} from './classify';
import {
  resolveAskProviderTimeoutMs,
  type AskProviderCallResult,
  type ProviderAttemptPurpose,
  type ProviderExecutionAttempt,
  type ProviderFailureReason,
} from './types';

export type ExecuteAskProviderCallArgs = {
  messages: ConversationMessage[];
  locale: ConversationLocale;
  purpose: ProviderAttemptPurpose;
  /** When provided, consumes one budget unit before invoking transport. */
  budget?: ProviderCallBudget;
  /**
   * When false, caller already consumed budget (e.g. Safe Regeneration execute).
   * Still must not invoke when budget.canCall is false if budget is passed with
   * consumeBudget=false — use skipBudgetCheck for transport-only after consume.
   */
  consumeBudget?: boolean;
  /** Transport-only after budget already consumed by caller. */
  skipBudgetGate?: boolean;
  signal?: AbortSignal;
  timeoutMs?: number;
  /** Ask decision path defaults to true. */
  requireStructuredJson?: boolean;
};

function attempt(
  purpose: ProviderAttemptPurpose,
  status: ProviderExecutionAttempt['status'],
  latencyMs: number,
  failureReason: ProviderFailureReason | null
): ProviderExecutionAttempt {
  return { purpose, status, latencyMs, failureReason };
}

/**
 * Invoke Conversation provider once with Ask hardening.
 * Never retries. Never exceeds budget when budget gate is enabled.
 */
export async function executeAskProviderCall(
  args: ExecuteAskProviderCallArgs
): Promise<AskProviderCallResult> {
  const purpose = args.purpose;
  const requireStructuredJson = args.requireStructuredJson !== false;
  const timeoutMs = args.timeoutMs ?? resolveAskProviderTimeoutMs();
  const t0 = performance.now();

  const fail = (
    failureReason: ProviderFailureReason,
    httpStatus: number | null = null
  ): AskProviderCallResult => {
    const latencyMs = Math.round(performance.now() - t0);
    return {
      ok: false,
      message: null,
      requestId: null,
      failureReason,
      latencyMs,
      httpStatus,
      attempt: attempt(purpose, failureReason, latencyMs, failureReason),
    };
  };

  if (!args.skipBudgetGate) {
    const budget = args.budget;
    if (!budget) {
      return fail('unknown_failure');
    }
    const shouldConsume = args.consumeBudget !== false;
    if (shouldConsume) {
      if (!budget.consume()) {
        return fail('budget_exhausted');
      }
    } else if (!budget.canCall && budget.used >= budget.max) {
      // Defensive: already exhausted
      return fail('budget_exhausted');
    }
  }

  const boundary = createBoundaryAbortSignal(timeoutMs, args.signal ?? null);
  try {
    const clientResult = await postConversationExecute(
      args.messages,
      args.locale,
      { signal: boundary.signal }
    );

    if (!clientResult.ok) {
      const classified = classifyConversationClientFailure(clientResult);
      const httpStatus = classified.httpStatus;
      let reason = classified.reason;
      if (clientResult.kind === 'aborted') {
        reason = boundary.didTimeout() ? 'timeout' : 'cancelled';
      }
      const latencyMs = Math.round(performance.now() - t0);
      return {
        ok: false,
        message: null,
        requestId: null,
        failureReason: reason,
        latencyMs,
        httpStatus,
        attempt: attempt(purpose, reason, latencyMs, reason),
      };
    }

    const usability = classifyAskMessageUsability(
      clientResult.body.message,
      requireStructuredJson
    );
    if (usability) {
      const latencyMs = Math.round(performance.now() - t0);
      return {
        ok: false,
        message: null,
        requestId: clientResult.body.request_id,
        failureReason: usability,
        latencyMs,
        httpStatus: null,
        attempt: attempt(purpose, usability, latencyMs, usability),
      };
    }

    const latencyMs = Math.round(performance.now() - t0);
    return {
      ok: true,
      message: clientResult.body.message,
      requestId: clientResult.body.request_id,
      failureReason: null,
      latencyMs,
      httpStatus: 200,
      attempt: attempt(purpose, 'success', latencyMs, null),
    };
  } catch (err) {
    const reason = classifyThrownProviderError(err, {
      timedOutByBoundary: boundary.didTimeout(),
    });
    const latencyMs = Math.round(performance.now() - t0);
    return {
      ok: false,
      message: null,
      requestId: null,
      failureReason: reason,
      latencyMs,
      httpStatus: null,
      attempt: attempt(purpose, reason, latencyMs, reason),
    };
  } finally {
    boundary.cleanup();
  }
}

export function emptyProviderExecutionMeta(
  callCount = 0
): import('./types').ProviderExecutionMeta {
  return {
    status: 'success',
    failureReason: null,
    callCount,
    maxCalls: ASK_MAX_PROVIDER_CALLS,
    latencyMs: 0,
    fallbackUsed: false,
    attempts: [],
  };
}

export function buildProviderExecutionMeta(args: {
  attempts: ProviderExecutionAttempt[];
  fallbackUsed: boolean;
}): import('./types').ProviderExecutionMeta {
  const attempts = args.attempts;
  const lastFailure =
    [...attempts].reverse().find((a) => a.failureReason != null)
      ?.failureReason ?? null;
  const anyFailure = attempts.some((a) => a.status !== 'success');
  return {
    status: anyFailure && args.fallbackUsed ? 'failed' : anyFailure ? 'failed' : 'success',
    failureReason: args.fallbackUsed || anyFailure ? lastFailure : null,
    callCount: attempts.length,
    maxCalls: ASK_MAX_PROVIDER_CALLS,
    latencyMs: attempts.reduce((sum, a) => sum + a.latencyMs, 0),
    fallbackUsed: args.fallbackUsed,
    attempts,
  };
}
