/**
 * Claim validation engine — GroundingBundle → ValidationReport.
 * Never mutates the input bundle. Never throws to callers.
 */

import type { Evidence, EvidenceKind } from '../grounding';
import { evaluateClaim } from './evaluate';
import type {
  ClaimValidationResult,
  ClaimValidationStatus,
  GroundingBundle,
  ValidationReport,
  ValidationStatistics,
  ValidationSummary,
} from './types';
import { CLAIM_VALIDATION_REPORT_VERSION } from './types';
import { validateValidationReport } from './validate';

function emptySummary(): ValidationSummary {
  return {
    total: 0,
    supported: 0,
    partial: 0,
    unsupported: 0,
    unknown: 0,
  };
}

function emptyStatistics(): ValidationStatistics {
  return {
    evidenceCount: 0,
    claimCount: 0,
    brokenReferenceCount: 0,
    duplicateReferenceCount: 0,
    emptyClaimCount: 0,
  };
}

function summarize(
  results: readonly ClaimValidationResult[]
): ValidationSummary {
  const summary = emptySummary();
  summary.total = results.length;
  for (const r of results) {
    summary[r.status] += 1;
  }
  return summary;
}

export function buildUnavailableValidationReport(): ValidationReport {
  return {
    version: CLAIM_VALIDATION_REPORT_VERSION,
    status: 'unavailable',
    summary: emptySummary(),
    claimResults: [],
    statistics: emptyStatistics(),
  };
}

export function buildDegradedValidationReport(
  partial?: {
    claimResults?: ClaimValidationResult[];
    statistics?: ValidationStatistics;
  }
): ValidationReport {
  const claimResults = [...(partial?.claimResults ?? [])].sort((a, b) =>
    a.claimId.localeCompare(b.claimId)
  );
  return {
    version: CLAIM_VALIDATION_REPORT_VERSION,
    status: 'degraded',
    summary: summarize(claimResults),
    claimResults,
    statistics: partial?.statistics ?? emptyStatistics(),
  };
}

function assembleReport(bundle: GroundingBundle): ValidationReport {
  const evidenceById = new Map<string, Evidence>();
  const inventoryKinds = new Set<EvidenceKind>();
  for (const e of bundle.evidence) {
    evidenceById.set(e.id, e as Evidence);
    inventoryKinds.add(e.kind);
  }

  const claimResults: ClaimValidationResult[] = [];
  const statistics: ValidationStatistics = {
    evidenceCount: bundle.evidence.length,
    claimCount: bundle.claims.length,
    brokenReferenceCount: 0,
    duplicateReferenceCount: 0,
    emptyClaimCount: 0,
  };

  for (const claim of bundle.claims) {
    const { result, stats } = evaluateClaim(claim, {
      evidenceById,
      inventoryKinds,
    });
    claimResults.push(result);
    statistics.brokenReferenceCount += stats.brokenReferenceCount;
    statistics.duplicateReferenceCount += stats.duplicateReferenceCount;
    statistics.emptyClaimCount += stats.emptyClaimCount;
  }

  claimResults.sort((a, b) => a.claimId.localeCompare(b.claimId));

  const reportStatus =
    bundle.status === 'degraded'
      ? ('degraded' as const)
      : ('used' as const);

  return {
    version: CLAIM_VALIDATION_REPORT_VERSION,
    status: reportStatus,
    summary: summarize(claimResults),
    claimResults,
    statistics,
  };
}

/**
 * Validate every claim in the grounding bundle.
 * Identical inputs ⇒ identical report. Never mutates `bundle`.
 */
export function buildValidationReport(
  bundle: GroundingBundle
): ValidationReport {
  try {
    if (bundle == null || typeof bundle !== 'object') {
      return buildUnavailableValidationReport();
    }
    if (bundle.status === 'unavailable') {
      return buildUnavailableValidationReport();
    }
    if (!Array.isArray(bundle.claims) || !Array.isArray(bundle.evidence)) {
      return buildUnavailableValidationReport();
    }

    const report = assembleReport(bundle);
    const validated = validateValidationReport(report);
    if (validated.ok) return validated.value;

    return buildDegradedValidationReport({
      claimResults: report.claimResults,
      statistics: report.statistics,
    });
  } catch {
    return buildUnavailableValidationReport();
  }
}

/** Test helper: count claims by status. */
export function countByStatus(
  report: ValidationReport,
  status: ClaimValidationStatus
): number {
  return report.summary[status];
}
