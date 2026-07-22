/**
 * Narrow corrective instruction for one-shot Safe Regeneration (P2.2-02).
 * Does not rebuild Prompt Context — appends to the existing prompt messages.
 */

import type { SafeRegenerationDecision } from './types';

/**
 * Deterministic regeneration instruction from the decision metadata only.
 * Omits user question text and provider prose — callers keep the original prompt.
 */
export function buildSafeRegenerationInstruction(
  decision: SafeRegenerationDecision
): string {
  const claimLines =
    decision.blockingClaims.length > 0
      ? decision.blockingClaims.map((id) => `- claim:${id}`).join('\n')
      : '- claim:(unspecified)';
  const reasonLines =
    decision.reasonCodes.length > 0
      ? decision.reasonCodes.map((c) => `- reason:${c}`).join('\n')
      : '- reason:UNSUPPORTED';

  return [
    'SAFE REGENERATION (one attempt): Correct only the validation failures listed below.',
    'Preserve the user question authority, decision context, reasoning plan, known facts, numbers, entities, constraints, risk framing, specific actions, recommendation intent, and required output language.',
    'Do not invent new facts or actions. Do not change unrelated fields.',
    'Blocking claims:',
    claimLines,
    'Reason codes:',
    reasonLines,
    `Counts: unsupported=${decision.summary.unsupportedCount}, brokenReference=${decision.summary.brokenReferenceCount}, structuralMismatch=${decision.summary.structuralMismatchCount}.`,
  ].join('\n');
}
