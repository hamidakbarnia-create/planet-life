/**
 * Web mirror of car-offer-negotiation intake slots.
 * Completeness authority remains the backend intake evaluator.
 *
 * EVALUATE is the only supported mode, so there is no mode-specific
 * required-field variant. Compensation amounts are never collected.
 *
 * Enum values below are canonical stored identifiers and must match
 * packages/decision_engine/intake/offer_negotiation.py. Visible labels are
 * localized separately in lib/ask-product/copy.ts.
 */

export const OFFER_NEGOTIATION_DECISION_TYPE_ID =
  'car-offer-negotiation' as const;
export const OFFER_NEGOTIATION_FAMILY_ID = 'visibility' as const;
export const OFFER_NEGOTIATION_LABEL = 'Negotiate a job offer' as const;

export const CANONICAL_OFFER_NEGOTIATION_FIELD_IDS = [
  'target_date',
  'negotiation_goal',
  'offer_stage',
  'counterparty_role',
] as const;

// Only the evaluated date is required. Negotiation goal, offer stage and
// counterparty role are stored context that never reaches the engine request
// and never changes the score, so none of them is mandatory.
export const CANONICAL_OFFER_NEGOTIATION_REQUIRED_FIELD_IDS = [
  'target_date',
] as const;

export type OfferNegotiationSlotId =
  (typeof CANONICAL_OFFER_NEGOTIATION_FIELD_IDS)[number];

export type OfferNegotiationIntake = {
  target_date?: string;
  negotiation_goal?: string;
  offer_stage?: string;
  counterparty_role?: string;
};

export const NEGOTIATION_GOAL_VALUES = [
  'salary',
  'benefits',
  'role_title',
  'start_date',
  'working_arrangement',
  'complete_package',
  'other',
] as const;

export const OFFER_STAGE_VALUES = [
  'verbal_offer',
  'written_offer',
  'revised_offer',
] as const;

export const COUNTERPARTY_ROLE_VALUES = [
  'recruiter',
  'hiring_manager',
  'founder_executive',
  'hr_representative',
] as const;

export type NegotiationGoalValue = (typeof NEGOTIATION_GOAL_VALUES)[number];
export type OfferStageValue = (typeof OFFER_STAGE_VALUES)[number];
export type CounterpartyRoleValue = (typeof COUNTERPARTY_ROLE_VALUES)[number];

const ENUM_SLOT_VALUES: Partial<
  Record<OfferNegotiationSlotId, readonly string[]>
> = {
  negotiation_goal: NEGOTIATION_GOAL_VALUES,
  offer_stage: OFFER_STAGE_VALUES,
  counterparty_role: COUNTERPARTY_ROLE_VALUES,
};

/** EVALUATE only — requirements never relax for another mode. */
export function offerNegotiationRequiredFieldIdsForMode(
  mode?: string | null
): readonly OfferNegotiationSlotId[] {
  void mode;
  return CANONICAL_OFFER_NEGOTIATION_REQUIRED_FIELD_IDS;
}

export function normalizeOfferNegotiationAnswer(
  value: unknown
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Unauthorized enum values are dropped rather than sent to the API. */
export function normalizeOfferNegotiationSlot(
  slotId: OfferNegotiationSlotId,
  value: unknown
): string | undefined {
  const normalized = normalizeOfferNegotiationAnswer(value);
  if (normalized === undefined) return undefined;
  const allowed = ENUM_SLOT_VALUES[slotId];
  if (allowed && !allowed.includes(normalized)) return undefined;
  return normalized;
}

export function mergeOfferNegotiationFormAnswers(
  current: OfferNegotiationIntake | null | undefined,
  answers: Partial<OfferNegotiationIntake>
): OfferNegotiationIntake {
  const next: OfferNegotiationIntake = { ...(current ?? {}) };
  (Object.keys(answers) as OfferNegotiationSlotId[]).forEach((key) => {
    const normalized = normalizeOfferNegotiationSlot(key, answers[key]);
    if (normalized === undefined) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  });
  return next;
}

export function offerNegotiationRequiredFieldsPresent(
  intake: OfferNegotiationIntake,
  mode?: string | null
): boolean {
  return offerNegotiationRequiredFieldIdsForMode(mode).every((id) =>
    Boolean(normalizeOfferNegotiationSlot(id, intake[id]))
  );
}

export function offerNegotiationHasFirstRequiredAnswer(
  intake: OfferNegotiationIntake,
  mode?: string | null
): boolean {
  return offerNegotiationRequiredFieldIdsForMode(mode).some((id) =>
    Boolean(normalizeOfferNegotiationSlot(id, intake[id]))
  );
}

export function offerNegotiationMissingRequiredFields(
  intake: OfferNegotiationIntake,
  mode?: string | null
): OfferNegotiationSlotId[] {
  return offerNegotiationRequiredFieldIdsForMode(mode).filter(
    (id) => !normalizeOfferNegotiationSlot(id, intake[id])
  ) as OfferNegotiationSlotId[];
}
