/**
 * Per-claim support evaluation against structured evidence refs.
 */

import type { ClaimContainer, Evidence, EvidenceKind } from '../grounding';
import {
  classifyEvidenceKind,
  missingDirectKindLabels,
} from './match';
import type {
  ClaimValidationReasonCode,
  ClaimValidationResult,
  ClaimValidationStatus,
} from './types';

function uniqueSorted(items: readonly string[]): string[] {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}

export type EvaluateClaimContext = {
  evidenceById: ReadonlyMap<string, Evidence>;
  inventoryKinds: ReadonlySet<EvidenceKind>;
};

export type EvaluateClaimStatsDelta = {
  brokenReferenceCount: number;
  duplicateReferenceCount: number;
  emptyClaimCount: number;
};

/**
 * Primary reasonCode priority (deterministic):
 * BROKEN_REFERENCE > UNKNOWN_REFERENCE > STRUCTURAL_MISMATCH >
 * MISSING_EVIDENCE > SUPPORTED > UNKNOWN
 */
export function decideReasonCode(args: {
  status: ClaimValidationStatus;
  brokenReferenceCount: number;
  unknownReferenceCount: number;
  unrelatedCount: number;
  missingEvidenceCount: number;
  emptyClaimText: boolean;
}): ClaimValidationReasonCode {
  if (args.emptyClaimText) return 'UNKNOWN';
  if (args.brokenReferenceCount > 0) return 'BROKEN_REFERENCE';
  if (args.unknownReferenceCount > 0) return 'UNKNOWN_REFERENCE';
  if (args.status === 'supported') return 'SUPPORTED';
  if (args.unrelatedCount > 0 && args.status === 'unsupported') {
    return 'STRUCTURAL_MISMATCH';
  }
  if (args.missingEvidenceCount > 0) return 'MISSING_EVIDENCE';
  if (args.status === 'unsupported') return 'MISSING_EVIDENCE';
  if (args.status === 'partial') return 'MISSING_EVIDENCE';
  return 'UNKNOWN';
}

export function evaluateClaim(
  claim: Readonly<ClaimContainer>,
  ctx: EvaluateClaimContext
): { result: ClaimValidationResult; stats: EvaluateClaimStatsDelta } {
  const notes: string[] = [];
  let brokenReferenceCount = 0;
  let duplicateReferenceCount = 0;
  let emptyClaimCount = 0;
  let unknownReferenceCount = 0;

  if (claim.textDigest == null) {
    emptyClaimCount = 1;
    notes.push('empty_claim_text');
    const missingEvidence = uniqueSorted(
      missingDirectKindLabels(claim.fieldPath, ctx.inventoryKinds)
    );
    return {
      result: {
        claimId: claim.id,
        fieldPath: claim.fieldPath,
        status: 'unknown',
        reasonCode: decideReasonCode({
          status: 'unknown',
          brokenReferenceCount: 0,
          unknownReferenceCount: 0,
          unrelatedCount: 0,
          missingEvidenceCount: missingEvidence.length,
          emptyClaimText: true,
        }),
        matchedEvidence: [],
        missingEvidence,
        notes: uniqueSorted(notes),
      },
      stats: { brokenReferenceCount, duplicateReferenceCount, emptyClaimCount },
    };
  }

  const seenRefs = new Set<string>();
  const matchedEvidence: string[] = [];
  let directCount = 0;
  let partialCount = 0;
  let unrelatedCount = 0;

  for (const ref of claim.evidenceRefs) {
    const id = ref.evidenceId;
    if (typeof id !== 'string' || !id.trim()) {
      unknownReferenceCount += 1;
      notes.push('unknown_evidence_ref');
      continue;
    }
    if (seenRefs.has(id)) {
      duplicateReferenceCount += 1;
      notes.push('duplicate_evidence_ref');
      continue;
    }
    seenRefs.add(id);

    const evidence = ctx.evidenceById.get(id);
    if (!evidence) {
      brokenReferenceCount += 1;
      notes.push('broken_evidence_ref');
      continue;
    }

    const match = classifyEvidenceKind(evidence.kind, claim.fieldPath);
    if (match === 'directly_supporting') {
      directCount += 1;
      matchedEvidence.push(id);
    } else if (match === 'partially_supporting') {
      partialCount += 1;
      matchedEvidence.push(id);
      notes.push('partial_evidence_only');
    } else {
      unrelatedCount += 1;
      notes.push('unrelated_evidence_ref');
    }
  }

  const missingEvidence = uniqueSorted(
    missingDirectKindLabels(claim.fieldPath, ctx.inventoryKinds)
  );
  if (missingEvidence.length > 0) {
    notes.push('missing_direct_evidence_kind');
  }

  const status = decideStatus({
    directCount,
    partialCount,
    unrelatedCount,
    brokenReferenceCount,
    missingEvidenceCount: missingEvidence.length,
    resolvedSupporting: directCount + partialCount,
    refCount: claim.evidenceRefs.length,
  });

  const reasonCode = decideReasonCode({
    status,
    brokenReferenceCount,
    unknownReferenceCount,
    unrelatedCount,
    missingEvidenceCount: missingEvidence.length,
    emptyClaimText: false,
  });

  return {
    result: {
      claimId: claim.id,
      fieldPath: claim.fieldPath,
      status,
      reasonCode,
      matchedEvidence: uniqueSorted(matchedEvidence),
      missingEvidence,
      notes: uniqueSorted(notes),
    },
    stats: { brokenReferenceCount, duplicateReferenceCount, emptyClaimCount },
  };
}

function decideStatus(args: {
  directCount: number;
  partialCount: number;
  unrelatedCount: number;
  brokenReferenceCount: number;
  missingEvidenceCount: number;
  resolvedSupporting: number;
  refCount: number;
}): ClaimValidationStatus {
  const {
    directCount,
    partialCount,
    unrelatedCount,
    brokenReferenceCount,
    missingEvidenceCount,
    resolvedSupporting,
    refCount,
  } = args;

  // No usable structured support signal
  if (resolvedSupporting === 0) {
    if (refCount === 0 || unrelatedCount > 0 || brokenReferenceCount > 0) {
      return 'unsupported';
    }
    return 'unknown';
  }

  // Full direct cover, no gaps
  if (
    directCount > 0 &&
    missingEvidenceCount === 0 &&
    brokenReferenceCount === 0
  ) {
    return 'supported';
  }

  // Some support but incomplete / only partial / broken refs
  if (
    resolvedSupporting > 0 &&
    (missingEvidenceCount > 0 ||
      brokenReferenceCount > 0 ||
      (directCount === 0 && partialCount > 0))
  ) {
    return 'partial';
  }

  if (directCount > 0) {
    return 'supported';
  }

  return 'unknown';
}
