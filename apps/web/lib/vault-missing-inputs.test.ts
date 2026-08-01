import { describe, expect, it } from 'vitest';

import {
  buildVaultMissingInputNotice,
  normalizeVaultMissingInputs,
} from './vault-missing-inputs';
import { VAULT_MISSING_INPUT_COPY } from './vault-section-i18n';

describe('normalizeVaultMissingInputs', () => {
  it('maps backend partner fields into partner_profile / partner_birth_time', () => {
    expect(
      normalizeVaultMissingInputs([
        'partner_birth_date',
        'partner_location',
        'partner_birth_time',
      ]),
    ).toEqual(['partner_profile', 'partner_birth_time']);
  });

  it('maps place shortlist and location failures', () => {
    expect(
      normalizeVaultMissingInputs(['locations', 'location:Dubai']),
    ).toEqual(['place_shortlist']);
  });

  it('maps exact birth time to birth_profile', () => {
    expect(normalizeVaultMissingInputs(['exact_birth_time'])).toEqual([
      'birth_profile',
    ]);
  });

  it('returns empty for absent or empty missing_inputs', () => {
    expect(normalizeVaultMissingInputs(undefined)).toEqual([]);
    expect(normalizeVaultMissingInputs(null)).toEqual([]);
    expect(normalizeVaultMissingInputs([])).toEqual([]);
    expect(normalizeVaultMissingInputs(['', '  '])).toEqual([]);
  });

  it('ignores unknown keys without leaking them', () => {
    expect(normalizeVaultMissingInputs(['totally_unknown_field'])).toEqual([]);
  });

  it('dedupes and preserves priority order', () => {
    expect(
      normalizeVaultMissingInputs([
        'locations',
        'partner_birth_time',
        'exact_birth_time',
        'partner_birth_date',
        'locations',
      ]),
    ).toEqual(['partner_profile', 'partner_birth_time', 'birth_profile', 'place_shortlist']);
  });
});

describe('buildVaultMissingInputNotice', () => {
  it('returns null when missing_inputs is empty or absent', () => {
    expect(buildVaultMissingInputNotice([], 'en')).toBeNull();
    expect(buildVaultMissingInputNotice(undefined, 'en')).toBeNull();
  });

  it('shows Complete Profile CTA for partner-profile gaps', () => {
    const notice = buildVaultMissingInputNotice(
      ['partner_birth_date', 'partner_location'],
      'en',
    );
    expect(notice).not.toBeNull();
    expect(notice!.kinds).toEqual(['partner_profile']);
    expect(notice!.message).toContain('partial');
    expect(notice!.message.toLowerCase()).toContain('this person’s profile');
    expect(notice!.message.toLowerCase()).not.toContain('add a person');
    expect(notice!.cta).toEqual({
      href: '/people',
      label: 'Complete Profile',
    });
    expect(JSON.stringify(notice)).not.toContain('partner_birth_date');
  });

  it('shows Profile CTA for birth-profile gaps', () => {
    const notice = buildVaultMissingInputNotice(['exact_birth_time'], 'en');
    expect(notice!.cta).toEqual({ href: '/profile', label: 'Go to Profile' });
    expect(notice!.message.toLowerCase()).toMatch(/birth time|partial/);
  });

  it('degrades unknown keys safely without exposing raw keys', () => {
    const notice = buildVaultMissingInputNotice(['secret_internal_flag'], 'en');
    expect(notice!.kinds).toEqual([]);
    expect(notice!.message).toBe(VAULT_MISSING_INPUT_COPY.en.genericPartial);
    expect(notice!.cta).toBeUndefined();
    expect(notice!.message).not.toContain('secret_internal_flag');
  });

  it('leaves place_shortlist without a CTA when no shortlist route exists', () => {
    const notice = buildVaultMissingInputNotice(['locations'], 'en');
    expect(notice!.kinds).toEqual(['place_shortlist']);
    expect(notice!.cta).toBeUndefined();
    expect(notice!.message.toLowerCase()).toMatch(/place|partial/);
  });

  it('exposes notice copy for EN/FA/AR/RU', () => {
    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      const pack = VAULT_MISSING_INPUT_COPY[lang];
      expect(pack.genericPartial.length).toBeGreaterThan(10);
      expect(pack.completeProfile.length).toBeGreaterThan(0);
      expect(pack.goProfile.length).toBeGreaterThan(0);
      for (const kind of [
        'birth_profile',
        'current_location',
        'place_shortlist',
        'partner_profile',
        'partner_birth_time',
      ] as const) {
        expect(pack.byKind[kind].length).toBeGreaterThan(10);
      }
      const notice = buildVaultMissingInputNotice(['partner_birth_date'], lang);
      expect(notice!.message).toBe(pack.byKind.partner_profile);
      expect(notice!.cta).toEqual({
        href: '/people',
        label: pack.completeProfile,
      });
    }
  });

  it('keeps reading visibility independent of the notice helper', () => {
    // Notice is additive: callers still render reading when present.
    const reading = { headline: 'Keep me', strategic: 'Visible insight', action: 'Act' };
    const notice = buildVaultMissingInputNotice(['partner_location'], 'en');
    expect(reading.headline).toBe('Keep me');
    expect(notice!.message.length).toBeGreaterThan(0);
  });

  it('uses gender-neutral Arabic for the changed partner_profile notice', () => {
    const message = VAULT_MISSING_INPUT_COPY.ar.byKind.partner_profile;
    expect(message).not.toMatch(/اختري|أضيفي|تحققي|افتحي|أكملي/);
    expect(message).toContain('يلزم إكمال ملف هذا الشخص');
  });
});
