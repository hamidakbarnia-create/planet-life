/**
 * Date/frame behavior for car-offer-negotiation.
 *
 * The date pipeline itself is untouched by this Decision Type — these tests
 * pin that a resolved offer-negotiation type never widens Evaluate into
 * Compare or Find, whatever dates the question carries.
 */

import { describe, expect, it } from 'vitest';
import {
  canEvaluateInProduction,
  canExecuteInProduction,
} from '@/lib/ask-home/production-capability';
import { resolveTypedDecisionType } from '@/lib/decision-request/typed-resolver';
import { buildDecisionFrame } from './frame';
import { extractExplicitDates } from './resolve';

const TYPE = 'car-offer-negotiation';
const YEAR = 2026;

function frameFor(text: string) {
  return buildDecisionFrame(text, {
    reference_year: YEAR,
    decision_type_id: TYPE,
  });
}

describe('car-offer-negotiation date/frame behavior', () => {
  it('no date resolves the type and pends on the operation selector', () => {
    const text = 'مذاکره روی پیشنهاد شغلی';
    const resolution = resolveTypedDecisionType(text, 'fa');
    expect(resolution.status === 'exact' ? resolution.decisionTypeId : null).toBe(
      TYPE
    );

    const frame = frameFor(text);
    expect(frame.decision_type_id).toBe(TYPE);
    expect(frame.time.dates ?? []).toEqual([]);
    // Operation clarification is what renders the selector.
    expect(frame.pending_clarification).toBe('operation');
    expect(canEvaluateInProduction(frame.decision_type_id)).toBe(true);
  });

  it('one Gregorian date recommends Evaluate and preserves the ISO date', () => {
    const frame = frameFor(
      'Is September 15 a good date to negotiate my job offer?'
    );
    expect(frame.decision_type_id).toBe(TYPE);
    expect(frame.time.dates).toEqual(['2026-09-15']);
    expect(frame.operation).toBe('evaluate');
    expect(frame.time.scope).toBe('specific_date');
  });

  it('reuses the existing Jalali pipeline without special-casing the type', () => {
    const jalali = extractExplicitDates('۲۵ شهریور ۱۴۰۵', YEAR);
    const frame = frameFor('مذاکره روی پیشنهاد شغلی در ۲۵ شهریور ۱۴۰۵');
    expect(frame.time.dates).toEqual(jalali);
    expect(frame.time.dates?.length).toBe(1);
    expect(frame.operation).toBe('evaluate');
  });

  it('multiple dates never activate Compare for this type', () => {
    const frame = frameFor(
      'Should I negotiate my job offer on September 15 or September 18?'
    );
    expect(frame.decision_type_id).toBe(TYPE);
    expect((frame.time.dates ?? []).length).toBeGreaterThan(1);
    expect(canExecuteInProduction(frame.decision_type_id, 'compare')).toBe(false);
  });

  it('range language never activates Find for this type', () => {
    const frame = frameFor(
      'Find the best time between September and November to negotiate my job offer'
    );
    expect(frame.decision_type_id).toBe(TYPE);
    expect(canExecuteInProduction(frame.decision_type_id, 'find')).toBe(false);
  });

  it('preserves raw_intent byte-for-byte', () => {
    const text = 'آیا ۱۵ سپتامبر برای مذاکره پیشنهاد شغلی مناسب است؟';
    expect(frameFor(text).raw_intent).toBe(text);
  });

  it.each([
    ['en', 'Negotiate a job offer', 'Negotiate a job offer on September 15'],
    ['fa', 'مذاکره روی پیشنهاد شغلی', 'مذاکره روی پیشنهاد شغلی در ۱۵ سپتامبر'],
  ] as const)(
    '%s: a supplied date does not change Decision Type resolution',
    (lang, bare, dated) => {
      const bareResult = resolveTypedDecisionType(bare, lang);
      const datedResult = resolveTypedDecisionType(dated, lang);

      expect(bareResult.status).toBe('exact');
      expect(datedResult.status).toBe('exact');
      // The date changes the operation, never the Decision Type.
      expect(
        bareResult.status === 'exact' ? bareResult.decisionTypeId : null
      ).toBe(TYPE);
      expect(
        datedResult.status === 'exact' ? datedResult.decisionTypeId : null
      ).toBe(TYPE);
    }
  );

  it('treats past and malformed dates exactly like the shared contract', () => {
    // Compared against an existing visibility Evaluate type: this PR must not
    // introduce a private date rule for offer negotiation.
    const shapes = [
      ['past date', 'on January 5 2020', '2020-01-05'],
      ['malformed date', 'on September 45', null],
      ['impossible month', 'on 2026-13-01', null],
    ] as const;

    for (const [, fragment, expectedIso] of shapes) {
      const offer = buildDecisionFrame(
        `Negotiate my job offer ${fragment}`,
        { reference_year: YEAR, decision_type_id: TYPE }
      );
      const interview = buildDecisionFrame(
        `Attend my job interview ${fragment}`,
        { reference_year: YEAR, decision_type_id: 'car-interview' }
      );

      const offerDates = offer.time.dates ?? [];
      expect(offerDates).toEqual(interview.time.dates ?? []);
      expect(offer.time.scope).toBe(interview.time.scope);
      expect(offer.operation).toBe(interview.operation);

      if (expectedIso) {
        // A past date is still a normalized specific date, not a rejection.
        expect(offerDates).toEqual([expectedIso]);
        expect(offer.operation).toBe('evaluate');
      } else {
        // Unparseable dates fall back to the shared clarification path.
        expect(offerDates).toEqual([]);
        expect(offer.pending_clarification).toBe(
          interview.pending_clarification
        );
      }
    }
  });
});
