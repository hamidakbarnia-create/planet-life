/**
 * Hard provider-call budget for Ask (P2.2-02).
 *
 * Policy:
 * - Maximum 2 provider calls per Ask request.
 * - Language retry (locked localization behaviour) consumes the budget when used.
 * - Safe regeneration executes only when remaining budget >= 1.
 * - Regenerated responses never receive a language retry.
 * - Regenerated validation that would recommend regeneration never triggers another call.
 */

export const ASK_MAX_PROVIDER_CALLS = 2 as const;

export type ProviderCallBudget = {
  readonly max: typeof ASK_MAX_PROVIDER_CALLS;
  readonly used: number;
  readonly remaining: number;
  readonly canCall: boolean;
  /** Returns true and increments when a call is allowed; otherwise false. */
  consume: () => boolean;
};

export function createProviderCallBudget(
  max: typeof ASK_MAX_PROVIDER_CALLS = ASK_MAX_PROVIDER_CALLS
): ProviderCallBudget {
  let used = 0;
  return {
    max,
    get used() {
      return used;
    },
    get remaining() {
      return Math.max(0, max - used);
    },
    get canCall() {
      return used < max;
    },
    consume() {
      if (used >= max) return false;
      used += 1;
      return true;
    },
  };
}
