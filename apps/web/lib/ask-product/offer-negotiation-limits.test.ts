/**
 * Claim boundary for car-offer-negotiation EVALUATE.
 *
 * Every limit body emitted by OfferNegotiationVisibilitySemantics must be a
 * canonical mapped limit, because unmapped bodies are dropped entirely for
 * FA/AR/RU and would leave non-EN readers without the boundary.
 */

import { describe, expect, it } from 'vitest';
import type { AppLang } from '@/lib/app-settings';
import {
  isCanonicalPackageLimit,
  localizePackageLimit,
} from './package-limits';

const LANGS: readonly AppLang[] = ['en', 'fa', 'ar', 'ru'];

/** Mirrors OfferNegotiationVisibilitySemantics.scored_limits(). */
const SCORED_LIMITS = [
  "This is negotiation/communication timing evidence, not a prediction of the employer's decision.",
  'No salary, benefit, or compensation outcome is predicted.',
  'Contract terms were not reviewed for legal validity.',
  'Alternative dates were not searched.',
] as const;

/** Mirrors OfferNegotiationVisibilitySemantics.insufficient_limits(). */
const INSUFFICIENT_LIMITS = [
  'No clock-time window was computed.',
  'No alternative dates were searched.',
  'Timing evidence never indicates whether the employer will agree to any term.',
] as const;

const ALL_LIMITS = [...SCORED_LIMITS, ...INSUFFICIENT_LIMITS] as const;

/**
 * Affirmative outcome claims. Employer-agreement wording is checked
 * separately because the boundary itself has to name what it refuses.
 */
const FORBIDDEN_TOKENS: Readonly<Record<AppLang, readonly string[]>> = {
  en: [
    'probab',
    'chance',
    'guarant',
    'will accept',
    'will decide',
    'expected salary',
    'salary increase of',
    'career success',
  ],
  fa: ['احتمال', 'تضمین', 'قطعاً', 'موفقیت شغلی', 'شانس'],
  ar: ['احتمال', 'يضمن', 'مضمون', 'فرصة', 'النجاح المهني'],
  ru: ['вероятн', 'гарант', 'шанс', 'карьерный успех'],
};

/** Only ever allowed inside an explicit refusal. */
const NEGATED_ONLY: Readonly<Record<AppLang, readonly [string, string]>> = {
  en: ['will agree', 'never indicates whether'],
  fa: ['موافقت می‌کند', 'هرگز نشان نمی‌دهد'],
  ar: ['سيوافق', 'لا تشير أدلة التوقيت أبدًا'],
  ru: ['согласится', 'никогда не показывают'],
};

describe('car-offer-negotiation limits are canonical and localized', () => {
  it.each(ALL_LIMITS)('%s is a canonical mapped limit', (limit) => {
    expect(isCanonicalPackageLimit(limit)).toBe(true);
  });

  it.each(LANGS)('%s localizes every emitted limit body', (lang) => {
    for (const limit of ALL_LIMITS) {
      const localized = localizePackageLimit(lang, limit);
      expect(localized, `${lang}: ${limit}`).toBeTruthy();
      expect(localized?.trim()).toBeTruthy();
      if (lang !== 'en') {
        // Localized, not an English passthrough.
        expect(localized).not.toBe(limit);
        expect(localized).not.toMatch(/[A-Za-z]{3,}/);
      }
    }
  });
});

describe('car-offer-negotiation claim boundary', () => {
  it.each(LANGS)('%s makes no outcome claim', (lang) => {
    const blob = ALL_LIMITS.map(
      (limit) => localizePackageLimit(lang, limit) ?? ''
    )
      .join(' ')
      .toLowerCase();

    for (const token of FORBIDDEN_TOKENS[lang]) {
      expect(blob, `${lang}: ${token}`).not.toContain(token.toLowerCase());
    }

    const [claim, negation] = NEGATED_ONLY[lang];
    if (blob.includes(claim.toLowerCase())) {
      expect(blob, `${lang}: ${claim} must be negated`).toContain(
        negation.toLowerCase()
      );
    }
  });

  it('states the compensation and legal-validity boundaries in every language', () => {
    for (const lang of LANGS) {
      const blob = ALL_LIMITS.map(
        (limit) => localizePackageLimit(lang, limit) ?? ''
      ).join(' ');
      expect(blob.length).toBeGreaterThan(0);
      // Four scored + three insufficient bodies all survive localization.
      const rendered = ALL_LIMITS.filter((limit) =>
        Boolean(localizePackageLimit(lang, limit))
      );
      expect(rendered.length).toBe(ALL_LIMITS.length);
    }
  });
});
