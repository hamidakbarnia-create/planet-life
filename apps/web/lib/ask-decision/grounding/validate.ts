/**
 * Strict runtime validation for GroundingProvenance.
 * Rejects unknown fields; does not silently repair structural errors.
 */

import {
  CLAIM_CONTAINER_KEYS,
  CLAIM_SUPPORT_STATUSES,
  EVIDENCE_ITEM_VERSION,
  EVIDENCE_KEYS,
  EVIDENCE_KINDS,
  EVIDENCE_SOURCES,
  GROUNDING_PROVENANCE_KEYS,
  GROUNDING_PROVENANCE_VERSION,
  GROUNDING_STATUSES,
  type GroundingProvenance,
} from './types';

function isIn<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export type GroundingValidationResult =
  | { ok: true; value: GroundingProvenance }
  | { ok: false; errors: string[] };

export function validateGroundingProvenance(
  value: unknown
): GroundingValidationResult {
  const errors: string[] = [];

  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['GroundingProvenance must be a plain object'] };
  }

  const obj = value as Record<string, unknown>;
  const allowed = new Set<string>(GROUNDING_PROVENANCE_KEYS);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) errors.push(`Unknown field: ${key}`);
  }
  for (const key of GROUNDING_PROVENANCE_KEYS) {
    if (!(key in obj)) errors.push(`Missing field: ${key}`);
  }

  if (obj.version !== GROUNDING_PROVENANCE_VERSION) {
    errors.push(`version must be "${GROUNDING_PROVENANCE_VERSION}"`);
  }
  if (typeof obj.builtAt !== 'string' || !obj.builtAt.trim()) {
    errors.push('builtAt must be a non-empty string');
  }
  if (!isIn(obj.status, GROUNDING_STATUSES)) {
    errors.push(`status invalid: ${String(obj.status)}`);
  }

  const evidenceIds = new Set<string>();
  if (!Array.isArray(obj.evidence)) {
    errors.push('evidence must be an array');
  } else {
    obj.evidence.forEach((item, i) => {
      if (item == null || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`evidence[${i}] must be an object`);
        return;
      }
      const row = item as Record<string, unknown>;
      const evidenceAllowed = new Set<string>(EVIDENCE_KEYS);
      for (const key of Object.keys(row)) {
        if (!evidenceAllowed.has(key)) {
          errors.push(`evidence[${i}]: unknown field ${key}`);
        }
      }
      if (row.version !== EVIDENCE_ITEM_VERSION) {
        errors.push(`evidence[${i}].version must be "${EVIDENCE_ITEM_VERSION}"`);
      }
      if (typeof row.id !== 'string' || !row.id.trim()) {
        errors.push(`evidence[${i}].id must be a non-empty string`);
      } else if (evidenceIds.has(row.id)) {
        errors.push(`evidence duplicate id: ${row.id}`);
      } else {
        evidenceIds.add(row.id);
      }
      if (!isIn(row.kind, EVIDENCE_KINDS)) {
        errors.push(`evidence[${i}].kind invalid: ${String(row.kind)}`);
      }
      if (!isIn(row.source, EVIDENCE_SOURCES)) {
        errors.push(`evidence[${i}].source invalid: ${String(row.source)}`);
      }
      if (row.key !== undefined && typeof row.key !== 'string') {
        errors.push(`evidence[${i}].key must be string when present`);
      }
      if (row.valueDigest !== undefined && typeof row.valueDigest !== 'string') {
        errors.push(`evidence[${i}].valueDigest must be string when present`);
      }
      if (row.confidence !== undefined) {
        if (typeof row.confidence !== 'number' || !Number.isFinite(row.confidence)) {
          errors.push(`evidence[${i}].confidence must be a finite number`);
        } else if (row.confidence < 0 || row.confidence > 1) {
          errors.push(`evidence[${i}].confidence must be in range 0–1`);
        }
      }
    });
  }

  if (!Array.isArray(obj.claims)) {
    errors.push('claims must be an array');
  } else {
    const claimIds = new Set<string>();
    const claimPaths = new Set<string>();
    obj.claims.forEach((item, i) => {
      if (item == null || typeof item !== 'object' || Array.isArray(item)) {
        errors.push(`claims[${i}] must be an object`);
        return;
      }
      const row = item as Record<string, unknown>;
      const claimAllowed = new Set<string>(CLAIM_CONTAINER_KEYS);
      for (const key of Object.keys(row)) {
        if (!claimAllowed.has(key)) {
          errors.push(`claims[${i}]: unknown field ${key}`);
        }
      }
      if (typeof row.id !== 'string' || !row.id.trim()) {
        errors.push(`claims[${i}].id must be a non-empty string`);
      } else if (claimIds.has(row.id)) {
        errors.push(`claims duplicate id: ${row.id}`);
      } else {
        claimIds.add(row.id);
      }
      if (typeof row.fieldPath !== 'string' || !row.fieldPath.trim()) {
        errors.push(`claims[${i}].fieldPath must be a non-empty string`);
      } else if (claimPaths.has(row.fieldPath)) {
        errors.push(`claims duplicate fieldPath: ${row.fieldPath}`);
      } else {
        claimPaths.add(row.fieldPath);
      }
      if (row.textDigest !== null && typeof row.textDigest !== 'string') {
        errors.push(`claims[${i}].textDigest must be string or null`);
      }
      if (!isIn(row.status, CLAIM_SUPPORT_STATUSES)) {
        errors.push(`claims[${i}].status invalid: ${String(row.status)}`);
      }
      if (!Array.isArray(row.evidenceRefs)) {
        errors.push(`claims[${i}].evidenceRefs must be an array`);
      } else {
        const refSeen = new Set<string>();
        row.evidenceRefs.forEach((ref, j) => {
          if (ref == null || typeof ref !== 'object' || Array.isArray(ref)) {
            errors.push(`claims[${i}].evidenceRefs[${j}] must be an object`);
            return;
          }
          const r = ref as Record<string, unknown>;
          for (const key of Object.keys(r)) {
            if (key !== 'evidenceId') {
              errors.push(
                `claims[${i}].evidenceRefs[${j}]: unknown field ${key}`
              );
            }
          }
          if (typeof r.evidenceId !== 'string' || !r.evidenceId.trim()) {
            errors.push(
              `claims[${i}].evidenceRefs[${j}].evidenceId must be non-empty string`
            );
          } else if (refSeen.has(r.evidenceId)) {
            errors.push(
              `claims[${i}].evidenceRefs duplicate: ${r.evidenceId}`
            );
          } else {
            refSeen.add(r.evidenceId);
            if (
              Array.isArray(obj.evidence) &&
              evidenceIds.size > 0 &&
              !evidenceIds.has(r.evidenceId)
            ) {
              errors.push(
                `claims[${i}].evidenceRefs[${j}] unknown evidenceId: ${r.evidenceId}`
              );
            }
          }
        });
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: obj as unknown as GroundingProvenance };
}
