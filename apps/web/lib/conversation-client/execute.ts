/**
 * Canonical ADR-0007 frontend Conversation API client.
 * Shared by Ask and Pathfinder. No Ask/Pathfinder business logic.
 */

import { API_BASE } from '@/lib/api-config';
import type {
  ConversationClientResult,
  ConversationExecuteOptions,
  ConversationLocale,
  ConversationMessage,
  ConversationSuccess,
} from './types';

export const CONVERSATION_EXECUTE_PATH = '/api/v1/conversation/execute';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSuccess(value: unknown): value is ConversationSuccess {
  if (!isRecord(value)) return false;
  return (
    (value.type === 'decision' || value.type === 'conversational') &&
    typeof value.message === 'string' &&
    typeof value.request_id === 'string' &&
    Array.isArray(value.sources)
  );
}

export async function postConversationExecute(
  messages: ConversationMessage[],
  locale: ConversationLocale,
  options?: ConversationExecuteOptions
): Promise<ConversationClientResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${CONVERSATION_EXECUTE_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        locale,
        ...(options?.conversationId
          ? { conversation_id: options.conversationId }
          : {}),
      }),
      signal: options?.signal,
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === 'AbortError' || err.name === 'TimeoutError')
    ) {
      return { ok: false, kind: 'aborted' };
    }
    return { ok: false, kind: 'network_error' };
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return {
      ok: false,
      kind: 'malformed_response',
      httpStatus: response.status,
    };
  }

  if (response.status === 200 && isSuccess(parsed)) {
    return { ok: true, body: parsed };
  }
  return {
    ok: false,
    kind: 'contract_error',
    httpStatus: response.status,
  };
}
