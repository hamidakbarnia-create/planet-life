/**
 * Controllable ValidationReport fixtures for Safe Regeneration tests.
 */

import {
  CLAIM_VALIDATION_REPORT_VERSION,
  type ClaimValidationReasonCode,
  type ClaimValidationResult,
  type ClaimValidationStatus,
  type ValidationReport,
} from '../claim-validation';

export function makeClaimResult(args: {
  claimId: string;
  fieldPath?: string;
  status: ClaimValidationStatus;
  reasonCode: ClaimValidationReasonCode;
}): ClaimValidationResult {
  return {
    claimId: args.claimId,
    fieldPath: args.fieldPath ?? args.claimId,
    status: args.status,
    reasonCode: args.reasonCode,
    matchedEvidence: [],
    missingEvidence: [],
    notes: [],
  };
}

export function makeValidationReport(
  claimResults: ClaimValidationResult[],
  status: ValidationReport['status'] = 'used'
): ValidationReport {
  const summary = {
    total: claimResults.length,
    supported: 0,
    partial: 0,
    unsupported: 0,
    unknown: 0,
  };
  for (const c of claimResults) {
    summary[c.status] += 1;
  }
  return {
    version: CLAIM_VALIDATION_REPORT_VERSION,
    status,
    summary,
    claimResults: [...claimResults].sort((a, b) =>
      a.claimId.localeCompare(b.claimId)
    ),
    statistics: {
      evidenceCount: 0,
      claimCount: claimResults.length,
      brokenReferenceCount: 0,
      duplicateReferenceCount: 0,
      emptyClaimCount: 0,
    },
  };
}

export function fullySupportedReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.a',
      status: 'supported',
      reasonCode: 'SUPPORTED',
    }),
    makeClaimResult({
      claimId: 'cl.b',
      status: 'supported',
      reasonCode: 'SUPPORTED',
    }),
  ]);
}

export function singleUnsupportedReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.ok',
      status: 'supported',
      reasonCode: 'SUPPORTED',
    }),
    makeClaimResult({
      claimId: 'cl.bad',
      status: 'unsupported',
      reasonCode: 'MISSING_EVIDENCE',
    }),
  ]);
}

export function manyUnsupportedReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.1',
      status: 'unsupported',
      reasonCode: 'MISSING_EVIDENCE',
    }),
    makeClaimResult({
      claimId: 'cl.2',
      status: 'unsupported',
      reasonCode: 'MISSING_EVIDENCE',
    }),
    makeClaimResult({
      claimId: 'cl.3',
      status: 'unsupported',
      reasonCode: 'MISSING_EVIDENCE',
    }),
  ]);
}

export function largeStructuralMismatchReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.s1',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
    makeClaimResult({
      claimId: 'cl.s2',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
    makeClaimResult({
      claimId: 'cl.s3',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
  ]);
}

/** Single structural mismatch — blocking integrity failure. */
export function singleStructuralMismatchReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.ok',
      status: 'supported',
      reasonCode: 'SUPPORTED',
    }),
    makeClaimResult({
      claimId: 'cl.sm',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
  ]);
}

/** Two structural mismatch claims. */
export function twoStructuralMismatchReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.s1',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
    makeClaimResult({
      claimId: 'cl.s2',
      status: 'unsupported',
      reasonCode: 'STRUCTURAL_MISMATCH',
    }),
  ]);
}

/** Single MISSING_EVIDENCE only. */
export function singleMissingEvidenceReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.me',
      status: 'unsupported',
      reasonCode: 'MISSING_EVIDENCE',
    }),
  ]);
}

export function multiBrokenReferenceReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.b1',
      status: 'partial',
      reasonCode: 'BROKEN_REFERENCE',
    }),
    makeClaimResult({
      claimId: 'cl.b2',
      status: 'partial',
      reasonCode: 'BROKEN_REFERENCE',
    }),
  ]);
}

export function singleUnknownReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.u',
      status: 'unknown',
      reasonCode: 'UNKNOWN',
    }),
  ]);
}

export function singleUnknownReferenceReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.ur',
      status: 'unknown',
      reasonCode: 'UNKNOWN_REFERENCE',
    }),
  ]);
}

export function mixedValidationReport(): ValidationReport {
  return makeValidationReport([
    makeClaimResult({
      claimId: 'cl.ok',
      status: 'supported',
      reasonCode: 'SUPPORTED',
    }),
    makeClaimResult({
      claimId: 'cl.p',
      status: 'partial',
      reasonCode: 'MISSING_EVIDENCE',
    }),
    makeClaimResult({
      claimId: 'cl.u',
      status: 'unknown',
      reasonCode: 'UNKNOWN',
    }),
  ]);
}

export function emptyValidationReport(): ValidationReport {
  return makeValidationReport([], 'unavailable');
}
