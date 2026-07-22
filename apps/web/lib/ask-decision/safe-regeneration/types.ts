/**
 * Safe Regeneration Decision + bounded execution (P2.1b-05 decision / P2.2-02 execution).
 *
 * Decision contract (unchanged authority):
 * - Consumes ValidationReport only for `shouldRegenerate`.
 * - Never inspects provider output, localization, or Writing Quality for the decision.
 *
 * Execution contract (P2.2-02):
 * - At most one regeneration provider call when `shouldRegenerate` and budget allows.
 * - Same provider; no recursive regeneration; ties / failures keep original.
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

/** Compact validation snapshot for execution metadata (no claim text). */
export type SafeRegenerationValidationSnapshot = {
  unsupported: number;
  brokenReference: number;
  structuralMismatch: number;
  partial: number;
  unknown: number;
  total: number;
};

export const SAFE_REGENERATION_SELECTED = [
  'original',
  'regenerated',
  'not_applicable',
] as const;
export type SafeRegenerationSelected =
  (typeof SAFE_REGENERATION_SELECTED)[number];

export const SAFE_REGENERATION_OUTCOMES = [
  'not_requested',
  'regenerated_selected',
  'original_retained',
  'regeneration_failed',
  'comparison_unavailable',
] as const;
export type SafeRegenerationOutcome =
  (typeof SAFE_REGENERATION_OUTCOMES)[number];

/**
 * Decision whether regeneration SHOULD happen, plus optional execution fields.
 * Decision fields remain the authority; execution never loops.
 */
export type SafeRegenerationDecision = {
  version: typeof SAFE_REGENERATION_VERSION;
  /** Stable source tag — also used in meta.sources when status is used. */
  source: typeof SAFE_REGENERATION_SOURCE;
  status: SafeRegenerationStatus;
  /** Decision authority — whether regeneration was recommended. */
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
  /** P2.2-02: whether a regeneration provider call was attempted. */
  attempted?: boolean;
  /** P2.2-02: which semantic candidate was selected. */
  selected?: SafeRegenerationSelected;
  /** P2.2-02: execution outcome code. */
  outcome?: SafeRegenerationOutcome;
  /** P2.2-02: short machine reason (never user prose / prompts). */
  reason?: string | null;
  /** P2.2-02: original validation snapshot used for decision/compare. */
  originalValidationSummary?: SafeRegenerationValidationSnapshot | null;
  /** P2.2-02: regenerated validation snapshot when attempted. */
  regeneratedValidationSummary?: SafeRegenerationValidationSnapshot | null;
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
  'attempted',
  'selected',
  'outcome',
  'reason',
  'originalValidationSummary',
  'regeneratedValidationSummary',
] as const satisfies ReadonlyArray<keyof SafeRegenerationDecision>;
