/**
 * One-shot Safe Regeneration execution (P2.2-02).
 * Never loops. Never language-retries the regenerated response.
 */

import type { ConversationClientResult } from '@/lib/conversation-client';
import type { ConversationMessage } from '@/lib/conversation-client';
import type { AskDecisionResult } from '../types';
import type { GroundingProvenance } from '../grounding';
import type { ValidationReport } from '../claim-validation';
import type { ProviderCallBudget } from './budget';
import { compareValidationReports } from './compare';
import { buildSafeRegenerationInstruction } from './instruction';
import {
  notRequestedExecution,
  toValidationSnapshot,
  withExecutionMeta,
} from './execution-meta';
import type { SafeRegenerationDecision } from './types';

export type SafeRegenerationExecuteArgs = {
  decision: SafeRegenerationDecision;
  originalResult: AskDecisionResult;
  originalGrounding: GroundingProvenance;
  originalValidation: ValidationReport;
  promptMessages: ConversationMessage[];
  budget: ProviderCallBudget;
  callProvider: (
    messages: ConversationMessage[]
  ) => Promise<ConversationClientResult>;
  parseResult: (conversationMessage: string) => AskDecisionResult;
  groundAndValidate: (result: AskDecisionResult) => {
    grounding: GroundingProvenance;
    validation: ValidationReport;
  };
};

export type SafeRegenerationExecuteResult = {
  result: AskDecisionResult;
  grounding: GroundingProvenance;
  validation: ValidationReport;
  safeRegeneration: SafeRegenerationDecision;
};

/**
 * Execute at most one regeneration when recommended and budget allows.
 * On any failure / tie / non-improvement: keep original.
 */
export async function executeSafeRegeneration(
  args: SafeRegenerationExecuteArgs
): Promise<SafeRegenerationExecuteResult> {
  const {
    decision,
    originalResult,
    originalGrounding,
    originalValidation,
    promptMessages,
    budget,
    callProvider,
    parseResult,
    groundAndValidate,
  } = args;

  if (!decision.shouldRegenerate) {
    return {
      result: originalResult,
      grounding: originalGrounding,
      validation: originalValidation,
      safeRegeneration: notRequestedExecution(decision, originalValidation),
    };
  }

  const originalSnap = toValidationSnapshot(originalValidation);

  if (!budget.canCall) {
    return {
      result: originalResult,
      grounding: originalGrounding,
      validation: originalValidation,
      safeRegeneration: withExecutionMeta(decision, {
        attempted: false,
        selected: 'original',
        outcome: 'original_retained',
        reason: 'provider_budget_exhausted',
        originalValidationSummary: originalSnap,
        regeneratedValidationSummary: null,
      }),
    };
  }

  if (!budget.consume()) {
    return {
      result: originalResult,
      grounding: originalGrounding,
      validation: originalValidation,
      safeRegeneration: withExecutionMeta(decision, {
        attempted: false,
        selected: 'original',
        outcome: 'original_retained',
        reason: 'provider_budget_exhausted',
        originalValidationSummary: originalSnap,
        regeneratedValidationSummary: null,
      }),
    };
  }

  try {
    const regenMessages: ConversationMessage[] = [
      ...promptMessages,
      {
        role: 'user',
        content: buildSafeRegenerationInstruction(decision),
      },
    ];
    const providerResult = await callProvider(regenMessages);

    if (!providerResult.ok) {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'regeneration_failed',
          reason: `provider_${providerResult.kind}`,
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: null,
        }),
      };
    }

    const message = providerResult.body.message?.trim() ?? '';
    if (!message) {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'regeneration_failed',
          reason: 'empty_response',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: null,
        }),
      };
    }

    let regeneratedResult: AskDecisionResult;
    try {
      regeneratedResult = parseResult(message);
    } catch {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'regeneration_failed',
          reason: 'invalid_output',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: null,
        }),
      };
    }

    let regeneratedGrounding: GroundingProvenance;
    let regeneratedValidation: ValidationReport;
    try {
      const gv = groundAndValidate(regeneratedResult);
      regeneratedGrounding = gv.grounding;
      regeneratedValidation = gv.validation;
    } catch {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'regeneration_failed',
          reason: 'grounding_or_validation_exception',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: null,
        }),
      };
    }

    if (
      regeneratedGrounding.status === 'unavailable' ||
      regeneratedValidation.status === 'unavailable'
    ) {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'regeneration_failed',
          reason:
            regeneratedValidation.status === 'unavailable'
              ? 'regenerated_validation_unavailable'
              : 'regenerated_grounding_unavailable',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: toValidationSnapshot(
            regeneratedValidation
          ),
        }),
      };
    }

    const winner = compareValidationReports(
      originalValidation,
      regeneratedValidation
    );
    const regenSnap = toValidationSnapshot(regeneratedValidation);

    if (winner === 'unavailable') {
      return {
        result: originalResult,
        grounding: originalGrounding,
        validation: originalValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'original',
          outcome: 'comparison_unavailable',
          reason: 'comparison_unavailable',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: regenSnap,
        }),
      };
    }

    if (winner === 'regenerated') {
      return {
        result: regeneratedResult,
        grounding: regeneratedGrounding,
        validation: regeneratedValidation,
        safeRegeneration: withExecutionMeta(decision, {
          attempted: true,
          selected: 'regenerated',
          outcome: 'regenerated_selected',
          reason: 'strict_validation_improvement',
          originalValidationSummary: originalSnap,
          regeneratedValidationSummary: regenSnap,
        }),
      };
    }

    return {
      result: originalResult,
      grounding: originalGrounding,
      validation: originalValidation,
      safeRegeneration: withExecutionMeta(decision, {
        attempted: true,
        selected: 'original',
        outcome: 'original_retained',
        reason: 'no_strict_improvement',
        originalValidationSummary: originalSnap,
        regeneratedValidationSummary: regenSnap,
      }),
    };
  } catch {
    return {
      result: originalResult,
      grounding: originalGrounding,
      validation: originalValidation,
      safeRegeneration: withExecutionMeta(decision, {
        attempted: true,
        selected: 'original',
        outcome: 'regeneration_failed',
        reason: 'execution_exception',
        originalValidationSummary: originalSnap,
        regeneratedValidationSummary: null,
      }),
    };
  }
}
