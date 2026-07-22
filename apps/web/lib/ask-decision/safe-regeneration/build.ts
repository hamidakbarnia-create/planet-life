/**
 * Build SafeRegenerationDecision from ValidationReport only.
 * Never throws; never mutates validation; never regenerates text.
 */

import type { ValidationReport } from '../claim-validation';
import { evaluateSafeRegeneration } from './evaluate';
import {
  SAFE_REGENERATION_SOURCE,
  SAFE_REGENERATION_VERSION,
  type SafeRegenerationDecision,
  type SafeRegenerationSummary,
} from './types';

function emptySummary(): SafeRegenerationSummary {
  return {
    totalClaims: 0,
    supportedCount: 0,
    unsupportedCount: 0,
    partialCount: 0,
    unknownCount: 0,
    structuralMismatchCount: 0,
    brokenReferenceCount: 0,
    missingEvidenceCount: 0,
    unknownReferenceCount: 0,
  };
}

export function buildUnavailableSafeRegenerationDecision(): SafeRegenerationDecision {
  return {
    version: SAFE_REGENERATION_VERSION,
    source: SAFE_REGENERATION_SOURCE,
    status: 'unavailable',
    shouldRegenerate: false,
    confidence: 0,
    reasonCodes: [],
    blockingClaims: [],
    supportedClaims: [],
    summary: emptySummary(),
  };
}

/**
 * First consumer of ValidationReport (P2.1b-04).
 * Produces a regeneration *recommendation* only — does not execute it.
 */
export function buildSafeRegenerationDecision(
  validation: ValidationReport | null | undefined
): SafeRegenerationDecision {
  try {
    if (
      validation == null ||
      typeof validation !== 'object' ||
      validation.status === 'unavailable' ||
      !Array.isArray(validation.claimResults)
    ) {
      return buildUnavailableSafeRegenerationDecision();
    }

    const evaluated = evaluateSafeRegeneration(validation);
    return {
      version: SAFE_REGENERATION_VERSION,
      source: SAFE_REGENERATION_SOURCE,
      status: 'used',
      ...evaluated,
    };
  } catch {
    return buildUnavailableSafeRegenerationDecision();
  }
}
