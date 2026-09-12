import { describe, expect, it } from 'vitest';

import {
  UNKNOWN_BIRTH_TIME_CONTRACT,
  draftFromPerson,
  emptyPersonDraft,
  isValidGregorianDate,
  joinBirthTime,
  persistablePersonFields,
  splitBirthTime,
  validatePersonDraft,
} from './people-draft';

const COPY = {
  nameRequired: 'Name is required.',
  dateRequired: 'Birth date is required.',
  dateInvalid: 'Enter a valid date.',
  cityRequired: 'Birth city is required.',
  timeRequired: 'Enter a birth time, or mark it unknown.',
};

describe('People draft integrity', () => {
  it('starts empty and does not invent 1990-01-15 or 12:00', () => {
    const draft = emptyPersonDraft();
    expect(draft.birthDate).toBe('');
    expect(draft.birthTime).toBe('');
    expect(draft.location).toBe('');
    expect(draft.timeUnknown).toBe(true);
    expect(persistablePersonFields(draft)).toEqual({
      name: '',
      birth_date: '',
      birth_time: '',
      location: '',
    });
  });

  it('rejects a cleared date instead of restoring 1990-01-15', () => {
    const draft = {
      name: 'Ada',
      birthDate: '',
      birthTime: '09:15',
      timeUnknown: false,
      location: 'London',
    };
    const errors = validatePersonDraft(draft, COPY);
    expect(errors.birthDate).toBe(COPY.dateRequired);
    expect(persistablePersonFields(draft).birth_date).toBe('');
    expect(persistablePersonFields(draft).birth_date).not.toBe('1990-01-15');
  });

  it('rejects a new person with a cleared date instead of writing 1990-01-15', () => {
    const draft = {
      ...emptyPersonDraft(),
      name: 'New person',
      birthDate: '',
      location: 'Tehran',
    };
    expect(validatePersonDraft(draft, COPY).birthDate).toBe(COPY.dateRequired);
    expect(persistablePersonFields(draft).birth_date).toBe('');
  });

  it('rejects a cleared city instead of restoring the previous city', () => {
    const previous = draftFromPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '08:30',
      location: 'London',
    });
    const cleared = { ...previous, location: '' };
    expect(validatePersonDraft(cleared, COPY).location).toBe(COPY.cityRequired);
    expect(persistablePersonFields(cleared).location).toBe('');
    expect(persistablePersonFields(cleared).location).not.toBe('London');
  });

  it('stores unknown time as empty and keeps a typed 12:00 as user-provided', () => {
    const unknown = {
      name: 'Ada',
      birthDate: '1988-04-02',
      birthTime: '12:00',
      timeUnknown: true,
      location: 'London',
    };
    expect(validatePersonDraft(unknown, COPY)).toEqual({});
    expect(persistablePersonFields(unknown).birth_time).toBe('');

    const noon = { ...unknown, timeUnknown: false };
    expect(persistablePersonFields(noon).birth_time).toBe('12:00');
    expect(draftFromPerson({
      name: 'Ada',
      birth_date: '1988-04-02',
      birth_time: '',
      location: 'London',
    }).timeUnknown).toBe(true);
    expect(UNKNOWN_BIRTH_TIME_CONTRACT).toContain('Person.birth_time === "" means unknown');
  });

  it('rejects impossible Gregorian dates without Date-normalization', () => {
    expect(isValidGregorianDate('2026-02-31')).toBe(false);
    expect(isValidGregorianDate('2026-02-29')).toBe(false);
    expect(isValidGregorianDate('2024-02-29')).toBe(true);
    expect(isValidGregorianDate('2026-04-31')).toBe(false);
    expect(isValidGregorianDate('2026-04-02')).toBe(true);
    expect(new Date('2026-02-31T12:00:00').getTime()).not.toBeNaN();
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '2026-02-31',
      birthTime: '',
      timeUnknown: true,
      location: 'London',
    }, COPY).birthDate).toBe(COPY.dateInvalid);
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '2026-02-29',
      birthTime: '',
      timeUnknown: true,
      location: 'London',
    }, COPY).birthDate).toBe(COPY.dateInvalid);
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '2024-02-29',
      birthTime: '',
      timeUnknown: true,
      location: 'London',
    }, COPY).birthDate).toBeUndefined();
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '2026-04-31',
      birthTime: '',
      timeUnknown: true,
      location: 'London',
    }, COPY).birthDate).toBe(COPY.dateInvalid);
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '1988-04-02',
      birthTime: '',
      timeUnknown: true,
      location: 'London',
    }, COPY).birthDate).toBeUndefined();
  });

  it('keeps unselected hour or minute empty and rejects a partial known time', () => {
    expect(joinBirthTime('', '30')).toBe(':30');
    expect(joinBirthTime('12', '')).toBe('12:');
    expect(splitBirthTime(':30')).toEqual({ hour: '', minute: '30' });
    expect(splitBirthTime('12:')).toEqual({ hour: '12', minute: '' });
    expect(joinBirthTime('00', '00')).toBe('00:00');
    expect(joinBirthTime('12', '00')).toBe('12:00');
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '1988-04-02',
      birthTime: ':30',
      timeUnknown: false,
      location: 'London',
    }, COPY).birthTime).toBe(COPY.timeRequired);
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '1988-04-02',
      birthTime: '12:',
      timeUnknown: false,
      location: 'London',
    }, COPY).birthTime).toBe(COPY.timeRequired);
    expect(validatePersonDraft({
      name: 'Ada',
      birthDate: '1988-04-02',
      birthTime: '12:00',
      timeUnknown: false,
      location: 'London',
    }, COPY).birthTime).toBeUndefined();
  });

  it('keeps the draft values when validation fails', () => {
    const draft = {
      name: 'Ada',
      birthDate: '',
      birthTime: '',
      timeUnknown: true,
      location: '',
    };
    const errors = validatePersonDraft(draft, COPY);
    expect(errors.birthDate).toBeTruthy();
    expect(errors.location).toBeTruthy();
    expect(draft.birthDate).toBe('');
    expect(draft.location).toBe('');
    expect(draft.name).toBe('Ada');
  });
});
