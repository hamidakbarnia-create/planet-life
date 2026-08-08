/**
 * Web mirror of bus-product-launch intake slots.
 * Completeness authority remains the backend intake evaluator.
 */

export const PRODUCT_LAUNCH_DECISION_TYPE_ID = 'bus-product-launch' as const;
export const PRODUCT_LAUNCH_FAMILY_ID = 'timing_opt' as const;
export const PRODUCT_LAUNCH_LABEL =
  'Best time to launch a new project or product' as const;

export const CANONICAL_PRODUCT_LAUNCH_FIELD_IDS = [
  'target_date',
  'launch_object',
  'launch_channel',
  'brand_or_company',
] as const;

export const CANONICAL_PRODUCT_LAUNCH_REQUIRED_FIELD_IDS = [
  'target_date',
  'launch_object',
] as const;

export type ProductLaunchSlotId =
  (typeof CANONICAL_PRODUCT_LAUNCH_FIELD_IDS)[number];

export type ProductLaunchIntake = {
  target_date?: string;
  launch_object?: string;
  launch_channel?: string;
  brand_or_company?: string;
};

export function normalizeProductLaunchAnswer(
  value: unknown
): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function mergeProductLaunchFormAnswers(
  current: ProductLaunchIntake | null | undefined,
  answers: Partial<ProductLaunchIntake>
): ProductLaunchIntake {
  const next: ProductLaunchIntake = { ...(current ?? {}) };
  (Object.keys(answers) as ProductLaunchSlotId[]).forEach((key) => {
    const normalized = normalizeProductLaunchAnswer(answers[key]);
    if (normalized === undefined) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  });
  return next;
}

export function productLaunchRequiredFieldsPresent(
  intake: ProductLaunchIntake
): boolean {
  return CANONICAL_PRODUCT_LAUNCH_REQUIRED_FIELD_IDS.every((id) =>
    Boolean(normalizeProductLaunchAnswer(intake[id]))
  );
}

export function productLaunchHasFirstRequiredAnswer(
  intake: ProductLaunchIntake
): boolean {
  return CANONICAL_PRODUCT_LAUNCH_REQUIRED_FIELD_IDS.some((id) =>
    Boolean(normalizeProductLaunchAnswer(intake[id]))
  );
}

export function productLaunchMissingRequiredFields(
  intake: ProductLaunchIntake
): ProductLaunchSlotId[] {
  return CANONICAL_PRODUCT_LAUNCH_REQUIRED_FIELD_IDS.filter(
    (id) => !normalizeProductLaunchAnswer(intake[id])
  );
}
