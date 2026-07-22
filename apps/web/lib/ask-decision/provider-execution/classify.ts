/**
 * Deterministic provider outcome classification (P2.2-03).
 */

import { extractJsonObject } from '../util';
import type { ConversationClientResult } from '@/lib/conversation-client';
import type { ProviderFailureReason } from './types';

export function isUsableProviderMessage(message: unknown): boolean {
  return typeof message === 'string' && message.trim().length > 0;
}

/** Ask decision path requires parseable JSON object in message. */
export function isStructuredAskMessage(message: string): boolean {
  const parsed = extractJsonObject(message);
  return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed);
}

export function classifyConversationClientFailure(
  result: Extract<ConversationClientResult, { ok: false }>
): { reason: ProviderFailureReason; httpStatus: number | null } {
  if (result.kind === 'network_error') {
    return { reason: 'network_error', httpStatus: null };
  }
  if (result.kind === 'aborted') {
    // Caller may refine aborted → timeout vs cancelled via local signal ownership.
    return { reason: 'cancelled', httpStatus: null };
  }
  if (result.kind === 'malformed_response') {
    return { reason: 'invalid_output', httpStatus: null };
  }
  // contract_error — prefer http_error when status present
  const status =
    'httpStatus' in result && typeof result.httpStatus === 'number'
      ? result.httpStatus
      : null;
  if (status != null && status !== 200) {
    return { reason: 'http_error', httpStatus: status };
  }
  return { reason: 'provider_exception', httpStatus: status };
}

export function classifyThrownProviderError(
  err: unknown,
  opts?: { timedOutByBoundary?: boolean }
): ProviderFailureReason {
  if (opts?.timedOutByBoundary) return 'timeout';
  if (err instanceof Error) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return opts?.timedOutByBoundary ? 'timeout' : 'cancelled';
    }
    const msg = err.message.toLowerCase();
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'network_error';
    }
  }
  return 'unknown_failure';
}

/**
 * Post-success usability checks for Ask structured path.
 * Returns null when usable.
 */
export function classifyAskMessageUsability(
  message: string | null | undefined,
  requireStructuredJson: boolean
): ProviderFailureReason | null {
  if (message == null || !isUsableProviderMessage(message)) {
    return 'empty_response';
  }
  if (requireStructuredJson && !isStructuredAskMessage(message)) {
    return 'invalid_output';
  }
  return null;
}

/** Map provider failure → existing structured-fallback reason vocabulary. */
export function toFallbackReason(
  failure: ProviderFailureReason | null
): 'network' | 'timeout' | 'parse' | 'provider' | 'unknown' {
  switch (failure) {
    case 'timeout':
    case 'cancelled':
      return 'timeout';
    case 'network_error':
      return 'network';
    case 'empty_response':
    case 'invalid_output':
      return 'parse';
    case 'http_error':
    case 'provider_exception':
    case 'budget_exhausted':
      return 'provider';
    case 'unknown_failure':
    case null:
      return 'unknown';
    default:
      return 'unknown';
  }
}
