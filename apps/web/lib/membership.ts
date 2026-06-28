// Lightweight client-side membership/entitlement state.
//
// Real checkout (Stripe + server-side entitlements) lands in Sprint R3. Until
// then this lets the upgrade flow actually change the user's tier and lets
// paywalled features (Pathfinder, Vault) unlock immediately for testing and
// demos. When R3 ships, replace the localStorage read with the server tier.

export type MembershipTier = 'free' | 'pro' | 'premium' | 'vip';

const STORAGE_KEY = 'planet-life-membership';
const TIER_RANK: Record<MembershipTier, number> = { free: 0, pro: 1, premium: 2, vip: 3 };

export function loadTier(): MembershipTier {
  if (typeof window === 'undefined') return 'free';
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === 'pro' || raw === 'premium' || raw === 'vip' || raw === 'free') return raw;
  return 'free';
}

export function saveTier(tier: MembershipTier): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, tier);
  // Let any open tab/component react to the change.
  window.dispatchEvent(new CustomEvent('planet-life-membership-changed', { detail: tier }));
}

export function clearTier(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('planet-life-membership-changed', { detail: 'free' }));
}

export function isPaid(): boolean {
  return loadTier() !== 'free';
}

/** True when the current tier is at least the required tier. */
export function hasTier(required: MembershipTier): boolean {
  return TIER_RANK[loadTier()] >= TIER_RANK[required];
}
