/**
 * Deterministic short digests for grounding provenance (FNV-1a-32).
 * Identical input ⇒ identical digest. No wall-clock component.
 */

export function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/** Digest of a structured value for Evidence.valueDigest / ClaimContainer.textDigest. */
export function digestValue(value: unknown): string {
  if (value == null) return fnv1aHex('');
  if (typeof value === 'string') return fnv1aHex(value);
  if (typeof value === 'number' || typeof value === 'boolean') {
    return fnv1aHex(String(value));
  }
  return fnv1aHex(JSON.stringify(value));
}

export function evidenceId(kind: string, key: string): string {
  return `ev.${kind}.${fnv1aHex(`${kind}:${key}`)}`;
}

export function claimId(fieldPath: string): string {
  return `cl.${fnv1aHex(fieldPath)}`;
}
