/**
 * Deterministic validation comparison for Safe Regeneration selection (P2.2-02).
 * Ties and unsafe comparisons keep the original result.
 */

import type { ValidationReport } from '../claim-validation';
import { buildSummary } from './evaluate';

export type ValidationComparisonWinner = 'original' | 'regenerated' | 'unavailable';

function failureTuple(report: ValidationReport): readonly [
  number,
  number,
  number,
  number,
] | null {
  if (
    report == null ||
    typeof report !== 'object' ||
    report.status === 'unavailable' ||
    !Array.isArray(report.claimResults)
  ) {
    return null;
  }
  const summary = buildSummary(report.claimResults);
  return [
    summary.structuralMismatchCount,
    summary.brokenReferenceCount,
    summary.unsupportedCount,
    summary.unsupportedCount + summary.partialCount + summary.unknownCount,
  ] as const;
}

/**
 * Prefer regenerated only when it strictly improves the ordered failure tuple:
 * 1) STRUCTURAL_MISMATCH count
 * 2) BROKEN_REFERENCE count
 * 3) unsupported count
 * 4) total non-supported (unsupported + partial + unknown)
 *
 * Tie → original. Unavailable/invalid → unavailable (caller keeps original).
 */
export function compareValidationReports(
  original: ValidationReport,
  regenerated: ValidationReport
): ValidationComparisonWinner {
  try {
    const a = failureTuple(original);
    const b = failureTuple(regenerated);
    if (a == null || b == null) return 'unavailable';
    for (let i = 0; i < a.length; i += 1) {
      if (b[i]! < a[i]!) return 'regenerated';
      if (b[i]! > a[i]!) return 'original';
    }
    return 'original';
  } catch {
    return 'unavailable';
  }
}
