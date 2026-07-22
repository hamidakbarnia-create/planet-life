/**
 * Safe Regeneration Decision v1 — first consumer of ValidationReport.
 *
 * CRITICAL CONTRACT:
 * This phase NEVER performs regeneration.
 * It ONLY decides whether regeneration is recommended (`shouldRegenerate`).
 * Future roadmap phases may execute regeneration; P2.1b-05 does not.
 *
 * Input: ValidationReport only (meta.validation).
 * Never inspects provider output, localization, or Writing Quality directly.
 * No provider retry, prompt rebuild, or response mutation.
 */

import type { ClaimValidationReasonCode } from '../claim-validation';

export const SAFE_REGENERATION_VERSION = '1.0.0';
export const SAFE_REGENERATION_SOURCE = 'safe-regeneration-v1';

export const SAFE_REGENERATION_STATUSES = [
  'used',
  'unavailable',
] as const;
export type SafeRegenerationStatus =
  (typeof SAFE_REGENERATION_STATUSES)[number];

/**
 * Deterministic thresholds for regeneration recommendation.
 * Not probabilistic; not ML scoring.
 */
export const SAFE_REGENERATION_THRESHOLDS = {
  /** Minimum unsupported claims to recommend regeneration. */
  manyUnsupportedMin: 3,
  /**
   * Structural mismatch is a blocking integrity failure.
   * A single STRUCTURAL_MISMATCH recommends regeneration (independent of claim-set size).
   */
  largeStructuralMismatchMin: 1,
  /** Minimum claims with BROKEN_REFERENCE to recommend regeneration. */
  multiBrokenReferenceMin: 2,
} as const;

export type SafeRegenerationSummary = {
  totalClaims: number;
  supportedCount: number;
  unsupportedCount: number;
  partialCount: number;
  unknownCount: number;
  structuralMismatchCount: number;
  brokenReferenceCount: number;
  missingEvidenceCount: number;
  unknownReferenceCount: number;
};

/**
 * Decision whether regeneration SHOULD happen later.
 * Does not execute regeneration.
 */
export type SafeRegenerationDecision = {
  version: typeof SAFE_REGENERATION_VERSION;
  /** Stable source tag — also used in meta.sources when status is used. */
  source: typeof SAFE_REGENERATION_SOURCE;
  status: SafeRegenerationStatus;
  /** Recommendation only — never triggers a provider call in P2.1b-05. */
  shouldRegenerate: boolean;
  /**
   * Evidence-quality score in [0, 1].
   * Decreases as unsupported / mismatch / broken-reference share rises.
   */
  confidence: number;
  /** Unique sorted reason codes observed on claim results. */
  reasonCodes: ClaimValidationReasonCode[];
  /** Claim ids that contribute to a regenerate=true decision (sorted). */
  blockingClaims: string[];
  /** Claim ids with status supported (sorted). */
  supportedClaims: string[];
  summary: SafeRegenerationSummary;
};

export const SAFE_REGENERATION_DECISION_KEYS = [
  'version',
  'source',
  'status',
  'shouldRegenerate',
  'confidence',
  'reasonCodes',
  'blockingClaims',
  'supportedClaims',
  'summary',
] as const satisfies ReadonlyArray<keyof SafeRegenerationDecision>;
