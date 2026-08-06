/**
 * Bounded Safe Regeneration execution helpers (P2.2-02).
 */

import type { ValidationReport } from '../claim-validation';
import { buildSummary } from './evaluate';
import type {
  SafeRegenerationDecision,
  SafeRegenerationOutcome,
  SafeRegenerationSelected,
  SafeRegenerationValidationSnapshot,
} from './types';

export function toValidationSnapshot(
  report: ValidationReport | null | undefined
): SafeRegenerationValidationSnapshot | null {
  if (
    report == null ||
    typeof report !== 'object' ||
    report.status === 'unavailable' ||
    !Array.isArray(report.claimResults)
  ) {
    return null;
  }
  const summary = buildSummary(report.claimResults);
  return {
    unsupported: summary.unsupportedCount,
    brokenReference: summary.brokenReferenceCount,
    structuralMismatch: summary.structuralMismatchCount,
    partial: summary.partialCount,
    unknown: summary.unknownCount,
    total: summary.totalClaims,
  };
}

export function withExecutionMeta(
  decision: SafeRegenerationDecision,
  args: {
    attempted: boolean;
    selected: SafeRegenerationSelected;
    outcome: SafeRegenerationOutcome;
    reason?: string | null;
    originalValidationSummary?: SafeRegenerationValidationSnapshot | null;
    regeneratedValidationSummary?: SafeRegenerationValidationSnapshot | null;
  }
): SafeRegenerationDecision {
  return {
    ...decision,
    attempted: args.attempted,
    selected: args.selected,
    outcome: args.outcome,
    reason: args.reason ?? null,
    originalValidationSummary: args.originalValidationSummary ?? null,
    regeneratedValidationSummary: args.regeneratedValidationSummary ?? null,
  };
}

export function notRequestedExecution(
  decision: SafeRegenerationDecision,
  originalValidation: ValidationReport
): SafeRegenerationDecision {
  return withExecutionMeta(decision, {
    attempted: false,
    selected: 'not_applicable',
    outcome: 'not_requested',
    reason: null,
    originalValidationSummary: toValidationSnapshot(originalValidation),
    regeneratedValidationSummary: null,
  });
}
