import { PEOPLE_STORAGE_KEY } from './people-storage';

/** Vault live API keys that resolve a partner from People storage. */
export const PARTNER_DEPENDENT_VAULT_KEYS = [
  'partner',
  'compatibility',
  'radar',
  'trust',
  'communication',
] as const;

export type PartnerDependentVaultKey = (typeof PARTNER_DEPENDENT_VAULT_KEYS)[number];

export function isPartnerDependentVaultKey(
  key: string | null | undefined,
): key is PartnerDependentVaultKey {
  return (
    key === 'partner' ||
    key === 'compatibility' ||
    key === 'radar' ||
    key === 'trust' ||
    key === 'communication'
  );
}

/** Same-tab CustomEvent or cross-tab/native storage signal for People. */
export type PeopleVaultRefreshSignal =
  | { type: 'people-changed' }
  | { type: 'storage'; key: string | null };

/**
 * Whether a People persistence signal should bump Vault `peopleRevision`
 * for the currently open live module. Does not fetch; callers only revise.
 */
export function shouldBumpPeopleRevisionForOpenVault(options: {
  openApiKey: string | null | undefined;
  signal: PeopleVaultRefreshSignal;
}): boolean {
  if (!isPartnerDependentVaultKey(options.openApiKey)) return false;
  if (options.signal.type === 'people-changed') return true;
  return (
    options.signal.key === PEOPLE_STORAGE_KEY || options.signal.key === null
  );
}
