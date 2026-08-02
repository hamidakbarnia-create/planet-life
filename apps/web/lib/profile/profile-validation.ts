import { isProfileGender } from './profile-gender';
import type { ProfileBirthPlace, ProfileDraft, ProfileRecord } from './profile-types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ProfileValidationField =
  | 'birth_date'
  | 'birth_time'
  | 'birth_place'
  | 'name'
  | 'gender';

export interface ProfileValidationResult {
  valid: boolean;
  errors: Partial<Record<ProfileValidationField, string>>;
}

function validateBirthIdentityFields(
  draft: ProfileDraft
): Partial<Record<ProfileValidationField, string>> {
  const errors: Partial<Record<ProfileValidationField, string>> = {};

  if (!draft.birth_date.trim()) {
    errors.birth_date = 'Birth date is required.';
  } else if (!DATE_RE.test(draft.birth_date.trim())) {
    errors.birth_date = 'Use YYYY-MM-DD format.';
  } else {
    const parsed = new Date(`${draft.birth_date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors.birth_date = 'Enter a valid date.';
    } else if (parsed > new Date()) {
      errors.birth_date = 'Birth date cannot be in the future.';
    }
  }

  if (!draft.birth_time.trim()) {
    errors.birth_time = 'Birth time is required.';
  } else if (!TIME_RE.test(draft.birth_time.trim())) {
    errors.birth_time = 'Use 24-hour HH:MM format.';
  }

  if (
    !draft.selected_city ||
    !Number.isFinite(draft.selected_city.lat) ||
    !Number.isFinite(draft.selected_city.lon)
  ) {
    errors.birth_place = 'Select a city from the list.';
  } else if (!isValidBirthPlace(draft.selected_city)) {
    errors.birth_place = 'Selected city is incomplete.';
  }

  return errors;
}

/**
 * Full draft validation for onboarding / profile save forms.
 * Gender is required here — not for global product access.
 */
export function validateProfileDraft(draft: ProfileDraft): ProfileValidationResult {
  const errors = validateBirthIdentityFields(draft);

  if (!isProfileGender(draft.gender)) {
    errors.gender = 'Gender is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function isValidBirthPlace(place: ProfileBirthPlace): boolean {
  return Boolean(
    place.short?.trim() &&
      place.name?.trim() &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lon)
  );
}

export function draftToProfileRecord(draft: ProfileDraft): ProfileRecord {
  const city = draft.selected_city!;
  if (!isProfileGender(draft.gender)) {
    throw new Error('draftToProfileRecord requires a valid gender');
  }
  return {
    birth_date: draft.birth_date.trim(),
    birth_time: draft.birth_time.trim(),
    birth_place: city,
    name: draft.name?.trim() || undefined,
    action_type: 'business_launch',
    gender: draft.gender,
  };
}

/**
 * Birth-identity completeness for routing / Calendar / Today / Ask / Preparing.
 * Gender is intentionally excluded so legacy users are not globally blocked (PD-2026-010).
 */
export function isProfileRecordComplete(record: ProfileRecord | null): boolean {
  if (!record) return false;
  const errors = validateBirthIdentityFields({
    birth_date: record.birth_date,
    birth_time: record.birth_time,
    city_search: record.birth_place.short,
    selected_city: record.birth_place,
    name: record.name,
    gender: record.gender ?? '',
    updated_at: Date.now(),
  });
  return Object.keys(errors).length === 0;
}

/** True when gender is set — for gender-aware capability presentation only. */
export function hasProfileGender(record: ProfileRecord | null | undefined): boolean {
  return isProfileGender(record?.gender);
}
