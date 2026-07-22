/** ADR-0007 Conversation API transport types (frontend client). */

export type ConversationLocale = 'en' | 'ru' | 'fa' | 'ar';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ConversationSuccess = {
  type: 'decision' | 'conversational';
  message: string;
  sources: unknown[];
  request_id: string;
  reasoning: string | null;
  uncertainty: string | null;
};

export type ConversationClientResult =
  | { ok: true; body: ConversationSuccess }
  | {
      ok: false;
      kind:
        | 'network_error'
        | 'contract_error'
        | 'malformed_response'
        | 'aborted';
      /** Present for non-OK HTTP responses when known. */
      httpStatus?: number;
    };

export type ConversationExecuteOptions = {
  signal?: AbortSignal;
  conversationId?: string;
};
