import type { ResolvedAskQuestion } from '../resolve-ask-question';
import type { TypedResolvableDecisionTypeId } from './typed-resolver';
import type { DecisionExecution, DecisionRequest } from './types';

/**
 * Fail-closed Guided actionType → shipped Decision Type.
 * Unmapped actionTypes stay unbound. Never infer nearest runtime.
 * Keyed by actionType only — never by guided question id.
 */
export const SHIPPED_ACTION_TYPE_TO_DECISION_TYPE = {
  job_interview: 'car-interview',
  investor_meeting: 'bus-investor-meeting',
  business_launch: 'bus-product-launch',
  offer_negotiation: 'car-offer-negotiation',
} as const satisfies Record<string, TypedResolvableDecisionTypeId>;

export function decisionTypeIdForActionType(
  actionType: string | undefined
): TypedResolvableDecisionTypeId | undefined {
  if (!actionType) return undefined;
  if (!(actionType in SHIPPED_ACTION_TYPE_TO_DECISION_TYPE)) return undefined;
  return SHIPPED_ACTION_TYPE_TO_DECISION_TYPE[
    actionType as keyof typeof SHIPPED_ACTION_TYPE_TO_DECISION_TYPE
  ];
}

function mapExecution(resolved: ResolvedAskQuestion): DecisionExecution {
  if (resolved.source === 'typed') {
    const execution: DecisionExecution = {};
    if (resolved.decisionTypeId) {
      execution.decisionTypeId = resolved.decisionTypeId;
    }
    if (resolved.executionUnresolvedReason) {
      execution.unresolvedReason = resolved.executionUnresolvedReason;
    }
    if (resolved.typedResolution) {
      execution.typedResolution = resolved.typedResolution;
    }
    return execution;
  }

  const execution: DecisionExecution = {};

  if (resolved.decisionTypeId) {
    execution.decisionTypeId = resolved.decisionTypeId;
  }

  if (resolved.guidedQuestion) {
    execution.guidedQuestionId = resolved.guidedQuestion.id;
  }

  if (resolved.executionMetadata) {
    if (!execution.decisionTypeId) {
      const mapped = decisionTypeIdForActionType(
        resolved.executionMetadata.actionType
      );
      if (mapped) {
        execution.decisionTypeId = mapped;
      }
    }
    execution.actionType = resolved.executionMetadata.actionType;
    execution.categoryId = resolved.executionMetadata.categoryId;
    execution.needsTime = resolved.executionMetadata.needsTime;
  }

  if (resolved.executionUnresolvedReason) {
    execution.unresolvedReason = resolved.executionUnresolvedReason;
  }

  return execution;
}

export function resolveDecisionRequest(resolved: ResolvedAskQuestion): DecisionRequest {
  return {
    displayText: resolved.displayText,
    question: {
      source: resolved.source === 'typed' ? 'typed' : 'guided',
    },
    execution: mapExecution(resolved),
  };
}
