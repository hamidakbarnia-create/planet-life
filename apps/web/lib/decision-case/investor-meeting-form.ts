/**
 * Web mirror of bus-investor-meeting intake slots.
 * Completeness authority remains the backend intake evaluator.
 */

export const INVESTOR_MEETING_DECISION_TYPE_ID = 'bus-investor-meeting' as const;
export const INVESTOR_MEETING_FAMILY_ID = 'visibility' as const;
export const INVESTOR_MEETING_LABEL =
  'Meet an investor or pitch for funding' as const;

export const CANONICAL_INVESTOR_MEETING_FIELD_IDS = [
  'target_date',
  'meeting_goal',
  'investor_name',
  'meeting_type',
] as const;

export const CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS = [
  'target_date',
  'meeting_goal',
] as const;

/** COMPARE dates live on framing options — target_date is not required. */
export const COMPARE_INVESTOR_MEETING_REQUIRED_FIELD_IDS = [
  'meeting_goal',
] as const;

export type InvestorMeetingSlotId =
  (typeof CANONICAL_INVESTOR_MEETING_FIELD_IDS)[number];

export type InvestorMeetingIntake = {
  target_date?: string;
  meeting_goal?: string;
  investor_name?: string;
  meeting_type?: string;
};

export function investorRequiredFieldIdsForMode(
  mode?: string | null
): readonly InvestorMeetingSlotId[] {
  if (mode === 'compare_dates') {
    return COMPARE_INVESTOR_MEETING_REQUIRED_FIELD_IDS;
  }
  return CANONICAL_INVESTOR_MEETING_REQUIRED_FIELD_IDS;
}

export function normalizeInvestorAnswer(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function mergeInvestorMeetingFormAnswers(
  current: InvestorMeetingIntake | null | undefined,
  answers: Partial<InvestorMeetingIntake>
): InvestorMeetingIntake {
  const next: InvestorMeetingIntake = { ...(current ?? {}) };
  (Object.keys(answers) as InvestorMeetingSlotId[]).forEach((key) => {
    const normalized = normalizeInvestorAnswer(answers[key]);
    if (normalized === undefined) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  });
  return next;
}

export function investorRequiredFieldsPresent(
  intake: InvestorMeetingIntake,
  mode?: string | null
): boolean {
  return investorRequiredFieldIdsForMode(mode).every((id) =>
    Boolean(normalizeInvestorAnswer(intake[id]))
  );
}

export function investorHasFirstRequiredAnswer(
  intake: InvestorMeetingIntake,
  mode?: string | null
): boolean {
  return investorRequiredFieldIdsForMode(mode).some((id) =>
    Boolean(normalizeInvestorAnswer(intake[id]))
  );
}

export function investorMissingRequiredFields(
  intake: InvestorMeetingIntake,
  mode?: string | null
): InvestorMeetingSlotId[] {
  return investorRequiredFieldIdsForMode(mode).filter(
    (id) => !normalizeInvestorAnswer(intake[id])
  ) as InvestorMeetingSlotId[];
}
