import { describe, expect, it } from 'vitest';
import {
  isCanonicalPackageLimit,
  localizePackageLimit,
  localizePackageLimits,
} from './package-limits';

const FIND_CANONICAL = [
  'Relative symbolic launch-day timing only — not business or market intelligence.',
  'Does not predict launch success, revenue, adoption, Product Hunt rank, market demand, PR performance, or team readiness.',
  'launch_object, launch_channel, and brand_or_company did not affect scores.',
  'Hourly clock-time windows were not computed.',
] as const;

const INVESTOR_CANONICAL = [
  'This is negotiation/communication timing evidence, not investment-outcome prediction.',
  'No best clock-time window was computed.',
  'Alternative dates were not searched.',
] as const;

const COMPARE_CANONICAL =
  'Ceremony timing comparison only — not relationship quality or wedding success.';

const INTERVIEW_COMPARE_CANONICAL =
  'Interview-date communication/visibility timing comparison only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.';

describe('package limit semantic localization', () => {
  it('maps exact FIND canonical limits for EN/FA/AR/RU', () => {
    for (const limit of FIND_CANONICAL) {
      expect(isCanonicalPackageLimit(limit)).toBe(true);
      expect(localizePackageLimit('en', limit)).toBe(limit);
      const fa = localizePackageLimit('fa', limit);
      const ar = localizePackageLimit('ar', limit);
      const ru = localizePackageLimit('ru', limit);
      expect(fa).toBeTruthy();
      expect(ar).toBeTruthy();
      expect(ru).toBeTruthy();
      expect(fa).not.toBe(limit);
      expect(ar).not.toBe(limit);
      expect(ru).not.toBe(limit);
    }
  });

  it('maps investor EVALUATE and wedding/interview COMPARE limits', () => {
    for (const limit of INVESTOR_CANONICAL) {
      expect(localizePackageLimit('fa', limit)).toBeTruthy();
      expect(localizePackageLimit('fa', limit)).not.toBe(limit);
    }
    expect(localizePackageLimit('ar', COMPARE_CANONICAL)).toBeTruthy();
    expect(localizePackageLimit('ru', COMPARE_CANONICAL)).not.toBe(
      COMPARE_CANONICAL
    );
    expect(localizePackageLimit('fa', INTERVIEW_COMPARE_CANONICAL)).toBeTruthy();
    expect(localizePackageLimit('fa', INTERVIEW_COMPARE_CANONICAL)).not.toBe(
      INTERVIEW_COMPARE_CANONICAL
    );
    expect(localizePackageLimit('ar', INTERVIEW_COMPARE_CANONICAL)).toBeTruthy();
    expect(localizePackageLimit('ru', INTERVIEW_COMPARE_CANONICAL)).not.toBe(
      INTERVIEW_COMPARE_CANONICAL
    );
  });

  it('fails honestly for unknown prose outside EN', () => {
    const unknown = 'Some free-form engine sentence that is not canonical.';
    expect(localizePackageLimit('en', unknown)).toBe(unknown);
    expect(localizePackageLimit('fa', unknown)).toBeNull();
    expect(localizePackageLimit('ar', unknown)).toBeNull();
    expect(localizePackageLimit('ru', unknown)).toBeNull();
    expect(
      localizePackageLimits('fa', [FIND_CANONICAL[0], unknown], 4)
    ).toEqual([localizePackageLimit('fa', FIND_CANONICAL[0])]);
  });

  it('matches trim-only and rejects internal whitespace collapse', () => {
    const padded = `  ${FIND_CANONICAL[0]}  `;
    expect(localizePackageLimit('en', padded)).toBe(FIND_CANONICAL[0]);
    const collapsedInternal = FIND_CANONICAL[0].replace(' — ', '  —  ');
    expect(collapsedInternal).not.toBe(FIND_CANONICAL[0]);
    expect(isCanonicalPackageLimit(collapsedInternal)).toBe(false);
    expect(localizePackageLimit('fa', collapsedInternal)).toBeNull();
  });

  const SCHEMA_FIELD_LEAKS = [
    'launch_object',
    'launch_channel',
    'brand_or_company',
    'ceremony_type',
    'partner_name',
    'interview_type',
  ] as const;

  const SCHEMA_FIELD_CANONICALS = [
    'launch_object, launch_channel, and brand_or_company did not affect scores.',
    'launch_object, launch_channel, and brand_or_company did not affect the numeric score.',
    'ceremony_type, partner_name, and venue did not affect the numeric score.',
    'ceremony_type, partner_name, and venue did not affect the numeric scores.',
    'role, company, and interview_type did not affect the numeric score.',
  ] as const;

  it('keeps EN canonical passthrough with schema identifiers', () => {
    for (const limit of SCHEMA_FIELD_CANONICALS) {
      expect(localizePackageLimit('en', limit)).toBe(limit);
    }
  });

  it('FA/AR/RU consumer copy never exposes schema field identifiers', () => {
    const snakeCase = /\b[a-z]+(?:_[a-z0-9]+)+\b/;
    for (const limit of SCHEMA_FIELD_CANONICALS) {
      for (const lang of ['fa', 'ar', 'ru'] as const) {
        const localized = localizePackageLimit(lang, limit);
        expect(localized).toBeTruthy();
        expect(localized).not.toBe(limit);
        for (const token of SCHEMA_FIELD_LEAKS) {
          expect(localized).not.toContain(token);
        }
        // No raw snake_case schema identifiers in consumer display copy.
        expect(localized).not.toMatch(snakeCase);
      }
    }
  });
});

