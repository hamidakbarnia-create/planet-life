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

export type WeddingDateSlotId =
  (typeof CANONICAL_WEDDING_DATE_FIELD_IDS)[number];

export type WeddingDateIntake = {
  target_date?: string;
  ceremony_type?: string;
  partner_name?: string;
  venue?: string;
};

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
  intake: WeddingDateIntake
): boolean {
  return CANONICAL_WEDDING_DATE_REQUIRED_FIELD_IDS.every((id) =>
    Boolean(normalizeWeddingAnswer(intake[id]))
  );
}

export function weddingHasFirstRequiredAnswer(
  intake: WeddingDateIntake
): boolean {
  return CANONICAL_WEDDING_DATE_REQUIRED_FIELD_IDS.some((id) =>
    Boolean(normalizeWeddingAnswer(intake[id]))
  );
}

export function weddingMissingRequiredFields(
  intake: WeddingDateIntake
): WeddingDateSlotId[] {
  return CANONICAL_WEDDING_DATE_REQUIRED_FIELD_IDS.filter(
    (id) => !normalizeWeddingAnswer(intake[id])
  );
}
