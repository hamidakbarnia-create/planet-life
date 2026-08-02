import { describe, expect, it } from 'vitest';

import {
  buildPersonalizationContext,
  capabilityUsesGender,
  personalizationForCapability,
} from './context';
import type { BirthProfile } from '@/lib/birth-profile';

const base: BirthProfile = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  location: 'New York',
  action_type: 'business_launch',
};

describe('personalization context (PD-2026-010)', () => {
  it('builds gender variant for female/male/prefer_not_to_say', () => {
    expect(buildPersonalizationContext({ ...base, gender: 'female' }).genderVariant).toBe(
      'female'
    );
    expect(buildPersonalizationContext({ ...base, gender: 'male' }).genderVariant).toBe(
      'male'
    );
    expect(
      buildPersonalizationContext({ ...base, gender: 'prefer_not_to_say' }).genderVariant
    ).toBe('neutral');
    expect(buildPersonalizationContext(base).genderVariant).toBe('neutral');
  });

  it('marks Look/Heat as gender-aware and Calendar/Power as independent', () => {
    expect(capabilityUsesGender('look')).toBe(true);
    expect(capabilityUsesGender('heat')).toBe(true);
    expect(capabilityUsesGender('calendar')).toBe(false);
    expect(capabilityUsesGender('power_timing')).toBe(false);
    expect(capabilityUsesGender('core_reasoning')).toBe(false);
  });

  it('returns null context for gender-independent capabilities', () => {
    expect(
      personalizationForCapability({ ...base, gender: 'female' }, 'calendar')
    ).toBeNull();
    expect(
      personalizationForCapability({ ...base, gender: 'female' }, 'look')?.gender
    ).toBe('female');
  });
});
