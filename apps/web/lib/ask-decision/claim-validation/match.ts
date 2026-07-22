/**
 * Structured evidence↔claim matching rules.
 * Deterministic; no probabilistic scoring or text rewriting.
 */

import type { EvidenceKind } from '../grounding';
import type { EvidenceMatchKind, FieldEvidenceExpectation } from './types';

/**
 * Expected evidence kinds by claim field path.
 * Direct = primary structured support; partial = secondary/related.
 */
export function expectationForField(
  fieldPath: string
): FieldEvidenceExpectation {
  if (
    fieldPath === 'timing.timingRationale' ||
    fieldPath === 'scores.timing.rationale'
  ) {
    return { direct: ['timing'], partial: ['plan', 'fact'] };
  }
  if (
    fieldPath === 'scores.risk.rationale' ||
    fieldPath.startsWith('scenarios.downside')
  ) {
    return {
      direct: ['constraint', 'fact'],
      partial: ['plan', 'missing_context'],
    };
  }
  if (
    fieldPath === 'scores.readiness.rationale' ||
    fieldPath === 'scores.confidence.rationale' ||
    fieldPath === 'confidence.explanation'
  ) {
    return {
      direct: ['plan', 'fact', 'analysis'],
      partial: ['missing_context'],
    };
  }
  if (fieldPath === 'recommendation' || fieldPath === 'recommendationStatus') {
    return {
      direct: ['fact', 'question', 'analysis', 'plan'],
      partial: ['constraint'],
    };
  }
  if (fieldPath === 'assumptions' || fieldPath === 'limitations') {
    return {
      direct: ['missing_context', 'constraint'],
      partial: ['analysis'],
    };
  }
  if (fieldPath === 'executiveSummary') {
    return {
      direct: ['question', 'fact', 'analysis'],
      partial: ['plan'],
    };
  }
  if (fieldPath.startsWith('analysis.')) {
    return {
      direct: ['question', 'fact', 'analysis'],
      partial: ['plan', 'constraint'],
    };
  }
  return {
    direct: ['question', 'fact'],
    partial: ['plan', 'analysis'],
  };
}

export function classifyEvidenceKind(
  kind: EvidenceKind,
  fieldPath: string
): Exclude<EvidenceMatchKind, 'missing'> {
  const { direct, partial } = expectationForField(fieldPath);
  if (direct.includes(kind)) return 'directly_supporting';
  if (partial.includes(kind)) return 'partially_supporting';
  return 'unrelated';
}

export function missingDirectKindLabels(
  fieldPath: string,
  inventoryKinds: ReadonlySet<EvidenceKind>
): string[] {
  const { direct } = expectationForField(fieldPath);
  const missing: string[] = [];
  for (const kind of direct) {
    if (!inventoryKinds.has(kind)) {
      missing.push(`kind:${kind}`);
    }
  }
  return missing;
}
