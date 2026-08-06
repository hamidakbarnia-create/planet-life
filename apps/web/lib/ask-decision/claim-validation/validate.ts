/**
 * Strict runtime validation for ValidationReport.
 */

import {
  CLAIM_VALIDATION_RESULT_KEYS,
  CLAIM_VALIDATION_REASON_CODES,
  CLAIM_VALIDATION_REPORT_VERSION,
  CLAIM_VALIDATION_STATUSES,
  VALIDATION_REPORT_KEYS,
  VALIDATION_REPORT_STATUSES,
  type ValidationReport,
} from './types';

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export type ValidationReportValidationResult =
  | { ok: true; value: ValidationReport }
  | { ok: false; errors: string[] };

export function validateValidationReport(
  value: unknown
): ValidationReportValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['ValidationReport must be a plain object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set<string>(VALIDATION_REPORT_KEYS);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${key}`);
  }
  for (const key of VALIDATION_REPORT_KEYS) {
    if (!(key in obj)) errors.push(`Missing field: ${key}`);
  }

  if (obj.version !== CLAIM_VALIDATION_REPORT_VERSION) {
    errors.push(`version must be "${CLAIM_VALIDATION_REPORT_VERSION}"`);
  }
  if (!isIn(obj.status, VALIDATION_REPORT_STATUSES)) {
    errors.push(`status invalid: ${String(obj.status)}`);
  }

  if (obj.summary == null || typeof obj.summary !== 'object' || Array.isArray(obj.summary)) {
    errors.push('summary must be an object');
  } else {
    const s = obj.summary as Record<string, unknown>;
    for (const k of [
      'total',
      'supported',
      'partial',
      'unsupported',
      'unknown',
    ]) {
      if (typeof s[k] !== 'number' || !Number.isInteger(s[k])) {
        errors.push(`summary.${k} must be an integer`);
      }
    }
  }

  if (
    obj.statistics == null ||
    typeof obj.statistics !== 'object' ||
    Array.isArray(obj.statistics)
  ) {
    errors.push('statistics must be an object');
  } else {
    const st = obj.statistics as Record<string, unknown>;
    for (const k of [
      'evidenceCount',
      'claimCount',
      'brokenReferenceCount',
      'duplicateReferenceCount',
      'emptyClaimCount',
    ]) {
      if (typeof st[k] !== 'number' || !Number.isInteger(st[k])) {
        errors.push(`statistics.${k} must be an integer`);
      }
    }
  }

  if (!Array.isArray(obj.claimResults)) {
    errors.push('claimResults must be an array');
  } else {
    const ids = new Set<string>();
    obj.claimResults.forEach((row, i) => {
      if (row == null || typeof row !== 'object' || Array.isArray(row)) {
        errors.push(`claimResults[${i}] must be an object`);
        return;
      }
      const r = row as Record<string, unknown>;
      const claimAllowed = new Set<string>(CLAIM_VALIDATION_RESULT_KEYS);
      for (const key of Object.keys(r)) {
        if (!claimAllowed.has(key)) {
          errors.push(`claimResults[${i}]: unknown field ${key}`);
        }
      }
      if (typeof r.claimId !== 'string' || !r.claimId.trim()) {
        errors.push(`claimResults[${i}].claimId must be non-empty string`);
      } else if (ids.has(r.claimId)) {
        errors.push(`claimResults duplicate claimId: ${r.claimId}`);
      } else {
        ids.add(r.claimId);
      }
      if (typeof r.fieldPath !== 'string' || !r.fieldPath.trim()) {
        errors.push(`claimResults[${i}].fieldPath must be non-empty string`);
      }
      if (!isIn(r.status, CLAIM_VALIDATION_STATUSES)) {
        errors.push(`claimResults[${i}].status invalid: ${String(r.status)}`);
      }
      if (!isIn(r.reasonCode, CLAIM_VALIDATION_REASON_CODES)) {
        errors.push(
          `claimResults[${i}].reasonCode invalid: ${String(r.reasonCode)}`
        );
      }
      for (const listKey of ['matchedEvidence', 'missingEvidence', 'notes'] as const) {
        if (!Array.isArray(r[listKey])) {
          errors.push(`claimResults[${i}].${listKey} must be an array`);
        } else if (
          !(r[listKey] as unknown[]).every((x) => typeof x === 'string')
        ) {
          errors.push(`claimResults[${i}].${listKey} must be string[]`);
        }
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: obj as unknown as ValidationReport };
}
