import { describe, expect, it } from 'vitest';
import {
  CANONICAL_CAR_INTERVIEW_FIELD_IDS,
  CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS,
  CAR_INTERVIEW_FORM_FIELDS,
  demoHasFirstRequiredAnswer,
  demoMissingRequiredFields,
  demoRequiredFieldsPresent,
} from './car-interview-form';

describe('car-interview form contract (web presentation)', () => {
  it('matches the canonical car-interview field IDs and required flags', () => {
    expect(CAR_INTERVIEW_FORM_FIELDS.map((field) => field.slotId)).toEqual([
      ...CANONICAL_CAR_INTERVIEW_FIELD_IDS,
    ]);
    expect(
      CAR_INTERVIEW_FORM_FIELDS.filter((field) => field.required).map(
        (field) => field.slotId
      )
    ).toEqual([...CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS]);

    // Canonical Python contract (packages/decision_engine/intake/car_interview.py)
    expect([...CANONICAL_CAR_INTERVIEW_FIELD_IDS]).toEqual([
      'target_date',
      'role',
      'company',
      'interview_type',
    ]);
    expect([...CANONICAL_CAR_INTERVIEW_REQUIRED_FIELD_IDS]).toEqual([
      'target_date',
      'role',
    ]);
  });

  it('uses UI-only demo gates rather than a domain evaluator', () => {
    expect(demoHasFirstRequiredAnswer({})).toBe(false);
    expect(demoHasFirstRequiredAnswer({ role: 'PM' })).toBe(true);
    expect(demoRequiredFieldsPresent({ role: 'PM' })).toBe(false);
    expect(
      demoRequiredFieldsPresent({
        target_date: '2026-08-10',
        role: 'PM',
      })
    ).toBe(true);
    expect(demoMissingRequiredFields({ role: 'PM' })).toEqual(['target_date']);
  });

  it('find_dates requires role only (no target_date)', () => {
    expect(demoMissingRequiredFields({}, 'find_dates')).toEqual(['role']);
    expect(demoRequiredFieldsPresent({ role: 'PM' }, 'find_dates')).toBe(true);
    expect(
      demoRequiredFieldsPresent(
        { target_date: '2026-08-10', role: 'PM' },
        'find_dates'
      )
    ).toBe(true);
  });
});
