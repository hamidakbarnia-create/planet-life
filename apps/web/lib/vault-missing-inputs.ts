import type { AppLang } from './app-settings';
import { VAULT_MISSING_INPUT_COPY } from './vault-section-i18n';

/** Frontend-safe missing-input kinds (never show raw backend keys in UI). */
export type VaultMissingInputKind =
  | 'birth_profile'
  | 'current_location'
  | 'place_shortlist'
  | 'partner_profile'
  | 'partner_birth_time';

export type VaultMissingInputNotice = {
  kinds: VaultMissingInputKind[];
  message: string;
  cta?: { href: string; label: string };
};

const KIND_PRIORITY: VaultMissingInputKind[] = [
  'partner_profile',
  'partner_birth_time',
  'birth_profile',
  'current_location',
  'place_shortlist',
];

function mapRawToken(raw: string): VaultMissingInputKind | null {
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  if (key === 'partner_birth_date' || key === 'partner_location') {
    return 'partner_profile';
  }
  if (key === 'partner_birth_time') return 'partner_birth_time';
  if (key === 'exact_birth_time' || key === 'birth_time') {
    return 'birth_profile';
  }
  if (key === 'current_location') return 'current_location';
  if (key === 'locations' || key.startsWith('location:')) return 'place_shortlist';
  return null;
}

/** Normalize backend `missing_inputs` into a deduped, prioritized FE contract. */
export function normalizeVaultMissingInputs(
  raw: unknown,
): VaultMissingInputKind[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const found = new Set<VaultMissingInputKind>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const kind = mapRawToken(item);
    if (kind) found.add(kind);
  }
  return KIND_PRIORITY.filter((k) => found.has(k));
}

function ctaForKind(
  kind: VaultMissingInputKind,
  lang: AppLang,
): { href: string; label: string } | undefined {
  const copy = VAULT_MISSING_INPUT_COPY[lang];
  if (kind === 'partner_profile' || kind === 'partner_birth_time') {
    return { href: '/people', label: copy.completeProfile };
  }
  if (kind === 'birth_profile' || kind === 'current_location') {
    return { href: '/profile', label: copy.goProfile };
  }
  // place_shortlist: no dedicated shortlist editor route
  return undefined;
}

/**
 * Build a single calm notice for non-empty missing inputs.
 * Returns null when there is nothing to show.
 */
export function buildVaultMissingInputNotice(
  raw: unknown,
  lang: AppLang,
): VaultMissingInputNotice | null {
  const hasRaw =
    Array.isArray(raw) &&
    raw.some((item) => typeof item === 'string' && item.trim().length > 0);
  if (!hasRaw) return null;

  const kinds = normalizeVaultMissingInputs(raw);
  const copy = VAULT_MISSING_INPUT_COPY[lang];

  if (kinds.length === 0) {
    return { kinds: [], message: copy.genericPartial };
  }

  const primary = kinds[0];
  const message = copy.byKind[primary];
  const cta = ctaForKind(primary, lang);
  return cta ? { kinds, message, cta } : { kinds, message };
}
