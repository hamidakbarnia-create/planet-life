import type { Person, RelationshipType } from './people-storage';

/** Client persistence for Vault-scoped selected partner id (not a Person snapshot). */
export const VAULT_SELECTED_PARTNER_STORAGE_KEY =
  'planet-life-vault-selected-partner';

/** API `relationship_type` values accepted by Compatibility / Shadow. */
export type VaultRelationshipType =
  | 'romantic'
  | 'marriage'
  | 'business'
  | 'friendship';

/**
 * Partner Profile API `goal` values that align with a selected Person.relationship
 * without silent romantic fallback.
 */
export type VaultPartnerProfileGoal = 'romantic' | 'marriage' | 'business';

const COMPAT_RELATIONSHIP_MAP: Partial<
  Record<RelationshipType, VaultRelationshipType>
> = {
  romantic_partner: 'romantic',
  spouse: 'marriage',
  friend: 'friendship',
  business_partner: 'business',
};

/** Person.relationship → Partner Profile goal (null = fail closed). */
const PARTNER_PROFILE_GOAL_MAP: Partial<
  Record<RelationshipType, VaultPartnerProfileGoal>
> = {
  romantic_partner: 'romantic',
  spouse: 'marriage',
  business_partner: 'business',
};

export function loadSelectedVaultPartnerId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(VAULT_SELECTED_PARTNER_STORAGE_KEY);
    if (!raw) return null;
    const id = raw.trim();
    return id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function saveSelectedVaultPartnerId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id == null || id.trim() === '') {
      localStorage.removeItem(VAULT_SELECTED_PARTNER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(VAULT_SELECTED_PARTNER_STORAGE_KEY, id.trim());
  } catch {
    // quota / private mode — selection remains in React state only
  }
}

export function clearSelectedVaultPartnerId(): void {
  saveSelectedVaultPartnerId(null);
}

/**
 * Reconcile a candidate selected id against the current People list.
 * Session/persisted id is an input only — never falls back to first-of-many.
 */
export function reconcileVaultPartnerSelection(options: {
  people: Person[];
  candidateId: string | null | undefined;
}): string | null {
  const people = Array.isArray(options.people) ? options.people : [];
  if (people.length === 0) return null;
  if (people.length === 1) return people[0].id;
  const candidate =
    typeof options.candidateId === 'string' && options.candidateId.trim()
      ? options.candidateId.trim()
      : null;
  if (candidate && people.some((p) => p.id === candidate)) return candidate;
  return null;
}

/** Map Person.relationship → Compatibility/Shadow API token, or null (unsupported). */
export function toVaultRelationshipType(
  relationship: RelationshipType | string | null | undefined,
): VaultRelationshipType | null {
  if (relationship == null) return null;
  const key = String(relationship).trim() as RelationshipType;
  return COMPAT_RELATIONSHIP_MAP[key] ?? null;
}

/**
 * Map Person.relationship → Partner Profile `goal`, or null (unsupported).
 * Friend and other types have no non-romantic API goal — fail closed.
 */
export function toVaultPartnerProfileGoal(
  relationship: RelationshipType | string | null | undefined,
): VaultPartnerProfileGoal | null {
  if (relationship == null) return null;
  const key = String(relationship).trim() as RelationshipType;
  return PARTNER_PROFILE_GOAL_MAP[key] ?? null;
}

/**
 * `partner_relationship` for Partner Profile — only when a matching goal exists.
 * Never send aliases that would be dropped while goal stays romantic.
 */
export function partnerRelationshipForVaultApi(
  relationship: RelationshipType | string | null | undefined,
): string | undefined {
  if (toVaultPartnerProfileGoal(relationship) == null) return undefined;
  const raw = String(relationship).trim();
  return raw.length > 0 ? raw : undefined;
}

export function findPersonById(
  people: Person[],
  id: string | null | undefined,
): Person | null {
  if (!id) return null;
  return people.find((p) => p.id === id) ?? null;
}
