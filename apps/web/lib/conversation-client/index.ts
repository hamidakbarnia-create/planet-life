/** Neutral shared Conversation API client (ADR-0007). */

export {
  CONVERSATION_EXECUTE_PATH,
  postConversationExecute,
} from './execute';

export type {
  ConversationClientResult,
  ConversationExecuteOptions,
  ConversationLocale,
  ConversationMessage,
  ConversationSuccess,
} from './types';
