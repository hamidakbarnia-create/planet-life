/**
 * Ask provider-execution boundary (P2.2-03).
 * Transport + usability only — not claim validation / grounding.
 */

export const ASK_PROVIDER_TIMEOUT_MS_DEFAULT = 25_000;

/** Env override: NEXT_PUBLIC_ASK_PROVIDER_TIMEOUT_MS (positive finite ms). */
export function resolveAskProviderTimeoutMs(
  env: Record<string, string | undefined> = process.env as Record<
    string,
    string | undefined
  >
): number {
  const raw = env.NEXT_PUBLIC_ASK_PROVIDER_TIMEOUT_MS;
  if (raw == null || String(raw).trim() === '') {
    return ASK_PROVIDER_TIMEOUT_MS_DEFAULT;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    return ASK_PROVIDER_TIMEOUT_MS_DEFAULT;
  }
  return Math.floor(n);
}

export const PROVIDER_FAILURE_REASONS = [
  'timeout',
  'network_error',
  'http_error',
  'provider_exception',
  'empty_response',
  'invalid_output',
  'cancelled',
  'budget_exhausted',
  'unknown_failure',
] as const;

export type ProviderFailureReason = (typeof PROVIDER_FAILURE_REASONS)[number];

export const PROVIDER_ATTEMPT_PURPOSES = [
  'initial',
  'language_retry',
  'safe_regeneration',
] as const;

export type ProviderAttemptPurpose = (typeof PROVIDER_ATTEMPT_PURPOSES)[number];

export type ProviderAttemptStatus = 'success' | ProviderFailureReason;

export type ProviderExecutionAttempt = {
  purpose: ProviderAttemptPurpose;
  status: ProviderAttemptStatus;
  latencyMs: number;
  failureReason: ProviderFailureReason | null;
};

export type ProviderExecutionMeta = {
  status: 'success' | 'failed';
  failureReason: ProviderFailureReason | null;
  callCount: number;
  maxCalls: number;
  /** Sum of attempt latencies (ms). */
  latencyMs: number;
  fallbackUsed: boolean;
  attempts: ProviderExecutionAttempt[];
};

export type AskProviderCallResult = {
  ok: boolean;
  message: string | null;
  requestId: string | null;
  failureReason: ProviderFailureReason | null;
  latencyMs: number;
  attempt: ProviderExecutionAttempt;
  /** HTTP status when classified as http_error; otherwise null. */
  httpStatus: number | null;
};
