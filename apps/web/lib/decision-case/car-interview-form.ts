/**
 * PR-1 form presentation metadata for decision type `car-interview`.
 *
 * Field IDs / required flags must match the canonical Python contract in
 * packages/decision_engine/intake/car_interview.py.
 *
 * This module is NOT a domain intake evaluator. Completeness authority stays
 * in Python (`evaluate_car_interview_intake`). Production completeness will move
 * behind the Decision Case intake API boundary (PR-2+); this file only helps
 * render the walking-skeleton form.
 */

export const CAR_INTERVIEW_DECISION_TYPE_ID = 'car-interview' as const;
export const CAR_INTERVIEW_FAMILY_ID = 'visibility' as const;
export const CAR_INTERVIEW_LABEL = 'Attend job interview' as const;

/** Canonical field IDs — must stay aligned with Python CAR_INTERVIEW_SLOTS. */
export const CANONICAL_CAR_INTERVIEW_FIELD_IDS = [
  'target_date',
  'role',
  'company',
  'interview_type',
] as const;

export const CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS = [
  'target_date',
  'role',
] as const;

/** COMPARE dates live on framing options — target_date is not required. */
export const COMPARE_CAR_INTERVIEW_REQUIRED_FIELD_IDS = ['role'] as const;

/** FIND range lives on framing start/end — target_date is not required. */
export const FIND_CAR_INTERVIEW_REQUIRED_FIELD_IDS = ['role'] as const;

export type CarInterviewSlotId =
  (typeof CANONICAL_CAR_INTERVIEW_FIELD_IDS)[number];

export type CarInterviewIntake = {
  target_date?: string;
  role?: string;
  company?: string;
  interview_type?: string;
};

export type CarInterviewFormField = {
  slotId: CarInterviewSlotId;
  required: boolean;
  label: string;
  inputType: 'date' | 'text' | 'select';
  options?: readonly string[];
};

/** Presentation-only form fields for the demo intake UI. */
export const CAR_INTERVIEW_FORM_FIELDS: readonly CarInterviewFormField[] = [
  {
    slotId: 'target_date',
    required: true,
    label: 'Interview date',
    inputType: 'date',
  },
  {
    slotId: 'role',
    required: true,
    label: 'Role',
    inputType: 'text',
  },
  {
    slotId: 'company',
    required: false,
    label: 'Company',
    inputType: 'text',
  },
  {
    slotId: 'interview_type',
    required: false,
    label: 'Interview type',
    inputType: 'select',
    options: ['phone', 'video', 'onsite', 'panel'],
  },
] as const;

export function carInterviewRequiredFieldIdsForMode(
  mode?: string | null
): readonly CarInterviewSlotId[] {
  if (mode === 'compare_dates') {
    return COMPARE_CAR_INTERVIEW_REQUIRED_FIELD_IDS;
  }
  if (mode === 'find_dates') {
    return FIND_CAR_INTERVIEW_REQUIRED_FIELD_IDS;
  }
  return CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS;
}

export function normalizeFormAnswer(value: unknown): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

export function mergeCarInterviewFormAnswers(
  current: CarInterviewIntake | null | undefined,
  answers: Partial<CarInterviewIntake>
): CarInterviewIntake {
  const next: CarInterviewIntake = { ...(current ?? {}) };
  (Object.keys(answers) as CarInterviewSlotId[]).forEach((key) => {
    if (!(key in answers)) return;
    const normalized = normalizeFormAnswer(answers[key]);
    if (normalized === undefined) {
      delete next[key];
    } else {
      next[key] = normalized;
    }
  });
  return next;
}

/**
 * UI-only gate for the walking-skeleton form controls.
 * Not the domain completeness evaluator — do not treat as Case intake SoT.
 */
export function demoRequiredFieldsPresent(
  intake: CarInterviewIntake,
  mode?: string | null
): boolean {
  return carInterviewRequiredFieldIdsForMode(mode).every((slotId) =>
    Boolean(normalizeFormAnswer(intake[slotId]))
  );
}

/** UI-only: enable "save draft answers" after any required field is filled. */
export function demoHasFirstRequiredAnswer(
  intake: CarInterviewIntake,
  mode?: string | null
): boolean {
  return carInterviewRequiredFieldIdsForMode(mode).some((slotId) =>
    Boolean(normalizeFormAnswer(intake[slotId]))
  );
}

export function demoMissingRequiredFields(
  intake: CarInterviewIntake,
  mode?: string | null
): CarInterviewSlotId[] {
  return carInterviewRequiredFieldIdsForMode(mode).filter(
    (slotId) => !normalizeFormAnswer(intake[slotId])
  ) as CarInterviewSlotId[];
}
