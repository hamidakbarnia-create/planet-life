/**
 * People form draft rules. Do not invent birth date, time, or city.
 * Empty birth_time is the existing stored form of "time unknown".
 */

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function isGregorianLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInGregorianMonth(year: number, month: number): number {
  if (month === 2) return isGregorianLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

/** Calendar-true Gregorian check. Does not use Date, which normalizes 31 Feb. */
export function isValidGregorianDate(iso: string): boolean {
  if (!DATE_RE.test(iso)) return false;
  const [yearText, monthText, dayText] = iso.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= daysInGregorianMonth(year, month);
}

export function splitBirthTime(value: string): { hour: string; minute: string } {
  if (!value) return { hour: '', minute: '' };
  const [hour = '', minute = ''] = value.split(':');
  return { hour, minute };
}

/** Keep a missing hour or minute empty. Do not invent 00. */
export function joinBirthTime(hour: string, minute: string): string {
  if (hour === '' && minute === '') return '';
  return `${hour}:${minute}`;
}

export type PersonDraft = {
  name: string;
  birthDate: string;
  birthTime: string;
  timeUnknown: boolean;
  location: string;
};

export type PersonDraftErrors = {
  name?: string;
  birthDate?: string;
  birthTime?: string;
  location?: string;
};

export type PersonDraftCopy = {
  nameRequired: string;
  dateRequired: string;
  dateInvalid: string;
  cityRequired: string;
  timeRequired: string;
};

export function emptyPersonDraft(): PersonDraft {
  return {
    name: '',
    birthDate: '',
    birthTime: '',
    timeUnknown: true,
    location: '',
  };
}

export function draftFromPerson(person: {
  name: string;
  birth_date: string;
  birth_time: string;
  location: string;
}): PersonDraft {
  const birthTime = person.birth_time.trim();
  return {
    name: person.name,
    birthDate: person.birth_date.trim(),
    birthTime,
    timeUnknown: birthTime.length === 0,
    location: person.location.trim(),
  };
}

export function validatePersonDraft(
  draft: PersonDraft,
  copy: PersonDraftCopy,
): PersonDraftErrors {
  const errors: PersonDraftErrors = {};
  if (!draft.name.trim()) errors.name = copy.nameRequired;

  const date = draft.birthDate.trim();
  if (!date) {
    errors.birthDate = copy.dateRequired;
  } else if (!isValidGregorianDate(date)) {
    errors.birthDate = copy.dateInvalid;
  }

  if (!draft.location.trim()) errors.location = copy.cityRequired;

  if (!draft.timeUnknown) {
    const time = draft.birthTime.trim();
    if (!time || !TIME_RE.test(time)) errors.birthTime = copy.timeRequired;
  }

  return errors;
}

export function persistablePersonFields(draft: PersonDraft): {
  name: string;
  birth_date: string;
  birth_time: string;
  location: string;
} {
  return {
    name: draft.name.trim(),
    birth_date: draft.birthDate.trim(),
    birth_time: draft.timeUnknown ? '' : draft.birthTime.trim(),
    location: draft.location.trim(),
  };
}

/** Documented contract: empty birth_time means unknown. 12:00 is user-provided noon. */
export const UNKNOWN_BIRTH_TIME_CONTRACT =
  'Person.birth_time === "" means unknown. A stored 12:00 is treated as a user-provided time and is not reinterpreted as unknown. Calculation fallbacks must not be written back as user input.';
