import { describe, expect, it } from 'vitest';
import { getAskProductCopy } from '@/lib/ask-product';
import type { AppLang } from '@/lib/app-settings';
import {
  CANONICAL_OFFER_NEGOTIATION_FIELD_IDS,
  CANONICAL_OFFER_NEGOTIATION_REQUIRED_FIELD_IDS,
  COUNTERPARTY_ROLE_VALUES,
  NEGOTIATION_GOAL_VALUES,
  OFFER_NEGOTIATION_DECISION_TYPE_ID,
  OFFER_NEGOTIATION_FAMILY_ID,
  OFFER_STAGE_VALUES,
  mergeOfferNegotiationFormAnswers,
  offerNegotiationHasFirstRequiredAnswer,
  offerNegotiationMissingRequiredFields,
  offerNegotiationRequiredFieldIdsForMode,
  offerNegotiationRequiredFieldsPresent,
} from './offer-negotiation-form';
import {
  isSupportedIntakeDecisionType,
  prefillTargetDateFromFrame,
} from './intake-prefill';

const LANGS: readonly AppLang[] = ['en', 'fa', 'ar', 'ru'];

describe('car-offer-negotiation intake form contract', () => {
  it('mirrors the canonical Python slot contract', () => {
    expect(OFFER_NEGOTIATION_DECISION_TYPE_ID).toBe('car-offer-negotiation');
    expect(OFFER_NEGOTIATION_FAMILY_ID).toBe('visibility');
    expect(CANONICAL_OFFER_NEGOTIATION_FIELD_IDS).toEqual([
      'target_date',
      'negotiation_goal',
      'offer_stage',
      'counterparty_role',
    ]);
    // Context slots are stored but never reach the engine request, so the
    // evaluated date is the only thing the user must supply.
    expect(CANONICAL_OFFER_NEGOTIATION_REQUIRED_FIELD_IDS).toEqual([
      'target_date',
    ]);
  });

  it('keeps EVALUATE requirements regardless of requested mode', () => {
    for (const mode of [null, 'evaluate_date', 'compare_dates', 'find_dates']) {
      expect(offerNegotiationRequiredFieldIdsForMode(mode)).toEqual([
        'target_date',
      ]);
    }
  });

  it('requires only the evaluated date', () => {
    expect(offerNegotiationMissingRequiredFields({})).toEqual(['target_date']);
    expect(offerNegotiationHasFirstRequiredAnswer({})).toBe(false);

    const dateOnly = { target_date: '2026-09-15' };
    expect(offerNegotiationHasFirstRequiredAnswer(dateOnly)).toBe(true);
    expect(offerNegotiationRequiredFieldsPresent(dateOnly)).toBe(true);
    expect(offerNegotiationMissingRequiredFields(dateOnly)).toEqual([]);

    const contextOnly = { negotiation_goal: 'salary' };
    expect(offerNegotiationRequiredFieldsPresent(contextOnly)).toBe(false);
    expect(offerNegotiationMissingRequiredFields(contextOnly)).toEqual([
      'target_date',
    ]);
  });

  it('drops unauthorized enum values instead of sending them to the API', () => {
    const merged = mergeOfferNegotiationFormAnswers(
      {},
      {
        target_date: '2026-09-15',
        negotiation_goal: 'equity_refresh',
        offer_stage: 'exploding_offer',
        counterparty_role: 'ceo',
      }
    );
    expect(merged.negotiation_goal).toBeUndefined();
    expect(merged.offer_stage).toBeUndefined();
    expect(merged.counterparty_role).toBeUndefined();
    expect(merged.target_date).toBe('2026-09-15');
    // Unauthorized context is dropped, not persisted; the date still stands.
    expect(merged).toEqual({ target_date: '2026-09-15' });
    expect(offerNegotiationRequiredFieldsPresent(merged)).toBe(true);
  });

  it('accepts every authorized enum value', () => {
    for (const value of NEGOTIATION_GOAL_VALUES) {
      const merged = mergeOfferNegotiationFormAnswers(
        {},
        { negotiation_goal: value }
      );
      expect(merged.negotiation_goal).toBe(value);
    }
  });

  it('clears a slot when the answer is emptied', () => {
    const merged = mergeOfferNegotiationFormAnswers(
      { target_date: '2026-09-15', negotiation_goal: 'salary' },
      { negotiation_goal: '  ' }
    );
    expect(merged.negotiation_goal).toBeUndefined();
    expect(merged.target_date).toBe('2026-09-15');
  });

  it('is a supported intake type and prefills the evaluate date from the frame', () => {
    expect(isSupportedIntakeDecisionType('car-offer-negotiation')).toBe(true);
    const prefilled = prefillTargetDateFromFrame({
      decision_frame: {
        operation: 'evaluate',
        time_scope: 'specific_date',
        date: '2026-09-15',
      },
    });
    expect(prefilled.target_date).toBe('2026-09-15');
  });
});

describe('car-offer-negotiation select labels are localized', () => {
  it.each(LANGS)('%s has a label for every canonical enum value', (lang) => {
    const copy = getAskProductCopy(lang);
    for (const value of NEGOTIATION_GOAL_VALUES) {
      expect(copy.negotiationGoalOptions[value]?.trim()).toBeTruthy();
    }
    for (const value of OFFER_STAGE_VALUES) {
      expect(copy.offerStageOptions[value]?.trim()).toBeTruthy();
    }
    for (const value of COUNTERPARTY_ROLE_VALUES) {
      expect(copy.counterpartyRoleOptions[value]?.trim()).toBeTruthy();
    }
  });

  it.each(LANGS)('%s never renders a raw enum token as a label', (lang) => {
    const copy = getAskProductCopy(lang);
    const labels = [
      ...Object.values(copy.negotiationGoalOptions),
      ...Object.values(copy.offerStageOptions),
      ...Object.values(copy.counterpartyRoleOptions),
      copy.intakeFieldNegotiationDate,
      copy.intakeFieldNegotiationGoal,
      copy.intakeFieldOfferStage,
      copy.intakeFieldCounterpartyRole,
      copy.intakeTitleOfferNegotiation,
      copy.intakeBodyOfferNegotiation,
      copy.topicOfferNegotiation,
    ];
    for (const label of labels) {
      expect(label).not.toMatch(/[a-z0-9]+(?:_[a-z0-9]+)+/);
      expect(label).not.toMatch(/complete_package|counter_offer|offer_negotiation/);
    }
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    '%s intake copy contains no English prose',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const localized = [
        copy.intakeTitleOfferNegotiation,
        copy.intakeBodyOfferNegotiation,
        copy.topicOfferNegotiation,
        copy.scopeOfferNegotiationTiming,
        copy.compareUnavailableForOfferNegotiation,
        copy.findUnavailableForOfferNegotiation,
        copy.intakeFieldNegotiationDate,
        copy.intakeFieldNegotiationGoal,
        ...Object.values(copy.negotiationGoalOptions),
      ];
      for (const text of localized) {
        expect(text).not.toMatch(/[A-Za-z]{3,}/);
      }
    }
  );

  it('uses the required Persian concept for the decision type', () => {
    const fa = getAskProductCopy('fa');
    expect(fa.topicOfferNegotiation).toBe('مذاکره روی پیشنهاد شغلی');
    expect(fa.intakeTitleOfferNegotiation).toBe('مذاکره روی پیشنهاد شغلی');
  });

  it('unsupported-mode copy promises no delivery date', () => {
    for (const lang of LANGS) {
      const copy = getAskProductCopy(lang);
      expect(copy.compareUnavailableForOfferNegotiation).not.toBe(
        copy.comingSoon
      );
      expect(copy.findUnavailableForOfferNegotiation).not.toBe(copy.comingSoon);
      expect(copy.compareUnavailableForOfferNegotiation).not.toMatch(
        /soon|زودی|قريبا|قريباً|Скоро/i
      );
      expect(copy.findUnavailableForOfferNegotiation).not.toMatch(
        /soon|زودی|قريبا|قريباً|Скоро/i
      );
    }
  });
});
