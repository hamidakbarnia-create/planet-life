/**
 * Claim-level semantic validation v1 — internal only.
 *
 * Consumes a read-only GroundingBundle (P2.1b-03). Never mutates grounding.
 * Does not regenerate responses, change prompts, or expose UI/API fields.
 *
 * Matching is structured (evidence kind/key vs claim fieldPath + refs).
 * Digest-only inventories cannot compare claim/evidence free text; content
 * NLP similarity is intentionally out of scope.
 *
 * ---------------------------------------------------------------------------
 * Known Limitation
 * ---------------------------------------------------------------------------
 * Validation operates on final-output claim containers.
 * It cannot distinguish Provider-generated wording
 * from Localization or Writing Quality transformations.
 * Stage-aware claim provenance remains a prerequisite
 * for semantic grounding.
 *
 * ---------------------------------------------------------------------------
 * Future Contract
 * ---------------------------------------------------------------------------
 * Validation results are intentionally non-actionable.
 * They are produced only for observation.
 * Safe Regeneration (P2.1b-05)
 * will become the first consumer
 * of ValidationReport.
 */

import type {
  ClaimContainer,
  Evidence,
  EvidenceKind,
  GroundingProvenance,
  GroundingStatus,
} from '../grounding';

export const CLAIM_VALIDATION_REPORT_VERSION = '1.0.0';

export const VALIDATION_REPORT_STATUSES = [
  'used',
  'degraded',
  'unavailable',
] as const;
export type ValidationReportStatus =
  (typeof VALIDATION_REPORT_STATUSES)[number];

/** Support states — lowercase vocabulary aligned with ClaimSupportStatus. */
export const CLAIM_VALIDATION_STATUSES = [
  'supported',
  'partial',
  'unsupported',
  'unknown',
] as const;
export type ClaimValidationStatus =
  (typeof CLAIM_VALIDATION_STATUSES)[number];

/**
 * Primary machine reason for a claim verdict (in addition to notes[]).
 * Stable codes for P2.1b-05 Safe Regeneration observation.
 */
export const CLAIM_VALIDATION_REASON_CODES = [
  'SUPPORTED',
  'MISSING_EVIDENCE',
  'BROKEN_REFERENCE',
  'UNKNOWN_REFERENCE',
  'STRUCTURAL_MISMATCH',
  'UNKNOWN',
] as const;
export type ClaimValidationReasonCode =
  (typeof CLAIM_VALIDATION_REASON_CODES)[number];

export const EVIDENCE_MATCH_KINDS = [
  'directly_supporting',
  'partially_supporting',
  'unrelated',
  'missing',
] as const;
export type EvidenceMatchKind = (typeof EVIDENCE_MATCH_KINDS)[number];

/**
 * Read-only grounding input for the validator.
 * Structural alias of GroundingProvenance — never mutated by validation.
 */
export type GroundingBundle = Readonly<
  Omit<GroundingProvenance, 'evidence' | 'claims'> & {
    evidence: ReadonlyArray<Readonly<Evidence>>;
    claims: ReadonlyArray<Readonly<ClaimContainer>>;
    status: GroundingStatus;
  }
>;

export type ClaimValidationResult = {
  claimId: string;
  fieldPath: string;
  status: ClaimValidationStatus;
  /**
   * Primary reason code (stable). notes[] remain secondary detail signals.
   * Non-actionable in P2.1b-04 — observation only until P2.1b-05.
   */
  reasonCode: ClaimValidationReasonCode;
  /** Evidence ids classified as directly or partially supporting. */
  matchedEvidence: string[];
  /** Expected direct evidence kinds absent from the inventory (`kind:<name>`). */
  missingEvidence: string[];
  /** Deterministic machine notes (not user-facing prose). */
  notes: string[];
};

export type ValidationSummary = {
  total: number;
  supported: number;
  partial: number;
  unsupported: number;
  unknown: number;
};

export type ValidationStatistics = {
  evidenceCount: number;
  claimCount: number;
  brokenReferenceCount: number;
  duplicateReferenceCount: number;
  emptyClaimCount: number;
};

export type ValidationReport = {
  version: typeof CLAIM_VALIDATION_REPORT_VERSION;
  status: ValidationReportStatus;
  summary: ValidationSummary;
  claimResults: ClaimValidationResult[];
  statistics: ValidationStatistics;
};

export const CLAIM_VALIDATION_RESULT_KEYS = [
  'claimId',
  'fieldPath',
  'status',
  'reasonCode',
  'matchedEvidence',
  'missingEvidence',
  'notes',
] as const;

export const VALIDATION_REPORT_KEYS = [
  'version',
  'status',
  'summary',
  'claimResults',
  'statistics',
] as const satisfies ReadonlyArray<keyof ValidationReport>;

/** Direct + partial expected kinds for structured matching. */
export type FieldEvidenceExpectation = {
  direct: readonly EvidenceKind[];
  partial: readonly EvidenceKind[];
};
