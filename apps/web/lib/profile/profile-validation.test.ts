import { describe, expect, it } from 'vitest';
import {
  draftToProfileRecord,
  EMPTY_PROFILE_DRAFT,
  isProfileRecordComplete,
  validateProfileDraft,
} from '@/lib/profile';

const validCity = {
  name: 'New York, New York, United States',
  short: 'New York',
  lat: 40.7128,
  lon: -74.006,
};

describe('profile-validation', () => {
  it('rejects empty draft', () => {
    const result = validateProfileDraft(EMPTY_PROFILE_DRAFT());
    expect(result.valid).toBe(false);
    expect(result.errors.birth_date).toBeTruthy();
    expect(result.errors.birth_time).toBeTruthy();
    expect(result.errors.birth_place).toBeTruthy();
  });

  it('rejects invalid date format', () => {
    const result = validateProfileDraft({
      ...EMPTY_PROFILE_DRAFT(),
      birth_date: '06/15/1990',
      birth_time: '14:30',
      selected_city: validCity,
      city_search: 'New York',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.birth_date).toMatch(/YYYY-MM-DD/i);
  });

  it('rejects future birth date', () => {
    const result = validateProfileDraft({
      ...EMPTY_PROFILE_DRAFT(),
      birth_date: '2099-01-01',
      birth_time: '12:00',
      selected_city: validCity,
      city_search: 'New York',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.birth_date).toMatch(/future/i);
  });

  it('rejects city without list selection', () => {
    const result = validateProfileDraft({
      ...EMPTY_PROFILE_DRAFT(),
      birth_date: '1990-06-15',
      birth_time: '14:30',
      city_search: 'New York',
      selected_city: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.birth_place).toBeTruthy();
  });

  it('accepts complete draft and maps to profile record', () => {
    const draft = {
      ...EMPTY_PROFILE_DRAFT(),
      birth_date: '1990-06-15',
      birth_time: '14:30',
      city_search: 'New York',
      selected_city: validCity,
      name: 'Alex',
    };
    const result = validateProfileDraft(draft);
    expect(result.valid).toBe(true);
    const record = draftToProfileRecord(draft);
    expect(record.birth_place.short).toBe('New York');
    expect(record.name).toBe('Alex');
    expect(isProfileRecordComplete(record)).toBe(true);
  });
});
