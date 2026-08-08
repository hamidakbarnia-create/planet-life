/**
 * Web mirror of mar-wedding-date intake slots.
 * Completeness authority remains the backend intake evaluator.
 */

export const WEDDING_DATE_DECISION_TYPE_ID = 'mar-wedding-date' as const;
export const WEDDING_DATE_FAMILY_ID = 'timing_opt' as const;
export const WEDDING_DATE_LABEL = 'Choose wedding date' as const;

export const CANONICAL_WEDDING_DATE_FIELD_IDS = [
  'target_date',
  'ceremony_type',
  'partner_name',
  'venue',
] as const;

export const CANONICAL_WEDDING_DATE_REQUIRED_FIELD_IDS = [
  'target_date',
  'ceremony_type',
] as const;

/** COMPARE dates live on framing options — target_date is not required. */
export const COMPARE_WEDDING_DATE_REQUIRED_FIELD_IDS = [
  'ceremony_type',
] as const;

export type WeddingDateSlotId =
  (typeof CANONICAL_WEDDING_DATE_FIELD_IDS)[number];

export type WeddingDateIntake = {
  target_date?: string;
  ceremony_type?: string;
  partner_name?: string;
  venue?: string;
};

export function weddingRequiredFieldIdsForMode(
  mode?: string | null
): readonly WeddingDateSlotId[] {
  if (mode === 'compare_dates') {
    return COMPARE_WEDDING_DATE_REQUIRED_FIELD_IDS;
  }
  return CANONICAL_WEDDING_DATE_REQUIRED_FIELD_IDS;
}

export function normalizeWeddingAnswer(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function mergeWeddingDateFormAnswers(
  current: WeddingDateIntake | null | undefined,
  answers: Partial<WeddingDateIntake>
): WeddingDateIntake {
  const next: WeddingDateIntake = { ...(current ?? {}) };
  (Object.keys(answers) as WeddingDateSlotId[]).forEach((key) => {
    const normalized = normalizeWeddingAnswer(answers[key]);
    if (normalized === undefined) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  });
  return next;
}

export function weddingRequiredFieldsPresent(
  intake: WeddingDateIntake,
  mode?: string | null
): boolean {
  return weddingRequiredFieldIdsForMode(mode).every((id) =>
    Boolean(normalizeWeddingAnswer(intake[id]))
  );
}

export function weddingHasFirstRequiredAnswer(
  intake: WeddingDateIntake,
  mode?: string | null
): boolean {
  return weddingRequiredFieldIdsForMode(mode).some((id) =>
    Boolean(normalizeWeddingAnswer(intake[id]))
  );
}

export function weddingMissingRequiredFields(
  intake: WeddingDateIntake,
  mode?: string | null
): WeddingDateSlotId[] {
  return weddingRequiredFieldIdsForMode(mode).filter(
    (id) => !normalizeWeddingAnswer(intake[id])
  ) as WeddingDateSlotId[];
}
