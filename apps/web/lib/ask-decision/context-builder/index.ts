export {
  UNIFIED_DECISION_CONTEXT_VERSION,
  CONTEXT_RECENT_MESSAGE_LIMIT,
  CONTEXT_SOURCES,
  CONTEXT_SOURCE_PRIORITY,
  CONTEXT_MESSAGE_ROLES,
  UNIFIED_DECISION_CONTEXT_KEYS,
} from './types';
export type {
  UnifiedDecisionContext,
  ContextSource,
  ContextFact,
  ContextMessage,
  ContextMessageRole,
  SupportedLocale,
  Urgency,
  Complexity,
} from './types';

export {
  buildUnifiedDecisionContext,
  stripBuiltAt,
  type BuildUnifiedDecisionContextInput,
} from './build';
export type { ConversationInputMessage } from './adapters';
export {
  validateUnifiedDecisionContext,
  type UnifiedDecisionContextValidationResult,
} from './validate';
