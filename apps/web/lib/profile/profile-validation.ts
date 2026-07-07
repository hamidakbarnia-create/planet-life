import type { ProfileBirthPlace, ProfileDraft, ProfileRecord } from './profile-types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type ProfileValidationField =
  | 'birth_date'
  | 'birth_time'
  | 'birth_place'
  | 'name';

export interface ProfileValidationResult {
  valid: boolean;
  errors: Partial<Record<ProfileValidationField, string>>;
}

export function validateProfileDraft(draft: ProfileDraft): ProfileValidationResult {
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
  return {
    birth_date: draft.birth_date.trim(),
    birth_time: draft.birth_time.trim(),
    birth_place: city,
    name: draft.name?.trim() || undefined,
    action_type: 'business_launch',
  };
}

export function isProfileRecordComplete(record: ProfileRecord | null): boolean {
  if (!record) return false;
  return validateProfileDraft({
    birth_date: record.birth_date,
    birth_time: record.birth_time,
    city_search: record.birth_place.short,
    selected_city: record.birth_place,
    name: record.name,
    updated_at: Date.now(),
  }).valid;
}
