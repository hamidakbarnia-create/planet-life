/**
 * Deterministic Safe Regeneration evaluation over ValidationReport.
 */

import type {
  ClaimValidationReasonCode,
  ClaimValidationResult,
  ValidationReport,
} from '../claim-validation';
import {
  SAFE_REGENERATION_THRESHOLDS,
  type SafeRegenerationDecision,
  type SafeRegenerationSummary,
} from './types';

function uniqueSorted(items: readonly string[]): string[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}

function roundConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const clamped = Math.max(0, Math.min(1, value));
  return Math.round(clamped * 10_000) / 10_000;
}

export function buildSummary(
  claimResults: readonly ClaimValidationResult[]
): SafeRegenerationSummary {
  const summary: SafeRegenerationSummary = {
    totalClaims: claimResults.length,
    supportedCount: 0,
    unsupportedCount: 0,
    partialCount: 0,
    unknownCount: 0,
    structuralMismatchCount: 0,
    brokenReferenceCount: 0,
    missingEvidenceCount: 0,
    unknownReferenceCount: 0,
  };

  for (const claim of claimResults) {
    if (claim.status === 'supported') summary.supportedCount += 1;
    else if (claim.status === 'unsupported') summary.unsupportedCount += 1;
    else if (claim.status === 'partial') summary.partialCount += 1;
    else summary.unknownCount += 1;

    if (claim.reasonCode === 'STRUCTURAL_MISMATCH') {
      summary.structuralMismatchCount += 1;
    } else if (claim.reasonCode === 'BROKEN_REFERENCE') {
      summary.brokenReferenceCount += 1;
    } else if (claim.reasonCode === 'MISSING_EVIDENCE') {
      summary.missingEvidenceCount += 1;
    } else if (claim.reasonCode === 'UNKNOWN_REFERENCE') {
      summary.unknownReferenceCount += 1;
    }
  }

  return summary;
}

/**
 * Evidence-quality confidence: higher when more claims are supported.
 * Decreases with unsupported / partial / unknown / broken / mismatch share.
 */
export function calculateConfidence(
  summary: SafeRegenerationSummary
): number {
  const total = summary.totalClaims;
  if (total === 0) return 0;

  const weighted =
    (summary.supportedCount * 1.0 +
      summary.partialCount * 0.5 +
      summary.unknownCount * 0.25 +
      summary.unsupportedCount * 0.0) /
    total;

  const penalty =
    (summary.brokenReferenceCount * 0.08 +
      summary.structuralMismatchCount * 0.06 +
      summary.missingEvidenceCount * 0.03) /
    total;

  return roundConfidence(weighted - penalty);
}

/**
 * Deterministic regenerate recommendation.
 *
 * False (safe defaults / isolated issues):
 * - empty or unavailable validation
 * - all supported
 * - single UNKNOWN / UNKNOWN_REFERENCE / MISSING_EVIDENCE / BROKEN_REFERENCE
 * - single STRUCTURAL_MISMATCH
 *
 * True:
 * - many unsupported (≥ manyUnsupportedMin)
 * - any structural mismatch (≥ largeStructuralMismatchMin, currently 1)
 * - broken references across multiple claims (≥ multiBrokenReferenceMin)
 */
export function decideShouldRegenerate(
  summary: SafeRegenerationSummary
): boolean {
  if (summary.totalClaims === 0) return false;

  if (
    summary.supportedCount === summary.totalClaims &&
    summary.unsupportedCount === 0 &&
    summary.partialCount === 0 &&
    summary.unknownCount === 0
  ) {
    return false;
  }

  if (
    summary.unsupportedCount >= SAFE_REGENERATION_THRESHOLDS.manyUnsupportedMin
  ) {
    return true;
  }

  if (
    summary.structuralMismatchCount >=
    SAFE_REGENERATION_THRESHOLDS.largeStructuralMismatchMin
  ) {
    return true;
  }

  if (
    summary.brokenReferenceCount >=
    SAFE_REGENERATION_THRESHOLDS.multiBrokenReferenceMin
  ) {
    return true;
  }

  return false;
}

/** Claims that drive regenerate=true (blocking). Empty when shouldRegenerate=false. */
export function collectBlockingClaims(
  claimResults: readonly ClaimValidationResult[],
  shouldRegenerate: boolean
): string[] {
  if (!shouldRegenerate) return [];

  const blocking: string[] = [];
  for (const claim of claimResults) {
    if (
      claim.status === 'unsupported' ||
      claim.reasonCode === 'STRUCTURAL_MISMATCH' ||
      claim.reasonCode === 'BROKEN_REFERENCE'
    ) {
      blocking.push(claim.claimId);
    }
  }
  return uniqueSorted(blocking);
}

export function collectSupportedClaims(
  claimResults: readonly ClaimValidationResult[]
): string[] {
  return uniqueSorted(
    claimResults
      .filter((c) => c.status === 'supported')
      .map((c) => c.claimId)
  );
}

export function collectReasonCodes(
  claimResults: readonly ClaimValidationResult[]
): ClaimValidationReasonCode[] {
  return uniqueSorted(
    claimResults.map((c) => c.reasonCode)
  ) as ClaimValidationReasonCode[];
}

export function evaluateSafeRegeneration(
  report: ValidationReport
): Omit<SafeRegenerationDecision, 'version' | 'source' | 'status'> {
  const claimResults = report.claimResults ?? [];
  const summary = buildSummary(claimResults);
  const shouldRegenerate = decideShouldRegenerate(summary);
  return {
    shouldRegenerate,
    confidence: calculateConfidence(summary),
    reasonCodes: collectReasonCodes(claimResults),
    blockingClaims: collectBlockingClaims(claimResults, shouldRegenerate),
    supportedClaims: collectSupportedClaims(claimResults),
    summary,
  };
}
