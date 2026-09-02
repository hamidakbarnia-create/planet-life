import { describe, expect, it } from 'vitest';
import { formatAskDatePair } from '@/lib/ask-product/dates';
import { resolveTypedDecisionType } from '@/lib/decision-request/typed-resolver';
import {
  buildDecisionFrame,
  canSelectOperationRenderer,
  recommendedOperation,
} from './frame';
import { toPersistedFraming } from './persist';
import { detectOperation, detectTimeScope, extractExplicitDates } from './resolve';

/**
 * Phase 1B.1B — Jalali input → Gregorian ISO normalization.
 *
 * Every reference is explicit so nothing depends on the machine clock or
 * timezone. Reference year 2026 resolves yearless Jalali months to 1405
 * (the Jalali year covering 2026 from 21 March onward).
 */
const YEAR = 2026;
/** Gregorian ISO reference inside Jalali 1404 (before 21 March 2026). */
const REF_IN_1404 = '2026-01-15';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

describe('Phase 1B.1B Jalali input normalization', () => {
  it('A. converts Jalali month names with an inferred reference year', () => {
    expect(extractExplicitDates('۱۵ مهر', YEAR)).toEqual(['2026-10-07']);
    expect(extractExplicitDates('۲۵ شهریور', YEAR)).toEqual(['2026-09-16']);
    expect(extractExplicitDates('15 مهر', YEAR)).toEqual(['2026-10-07']);
    // All twelve month names are recognized.
    const months: Array<[string, string]> = [
      ['۱ فروردین', '2026-03-21'],
      ['۱ اردیبهشت', '2026-04-21'],
      ['۱ خرداد', '2026-05-22'],
      ['۱ تیر', '2026-06-22'],
      ['۱ مرداد', '2026-07-23'],
      ['۱ شهریور', '2026-08-23'],
      ['۱ مهر', '2026-09-23'],
      ['۱ آبان', '2026-10-23'],
      ['۱ آذر', '2026-11-22'],
      ['۱ دی', '2026-12-22'],
      ['۱ بهمن', '2027-01-21'],
      ['۱ اسفند', '2027-02-20'],
    ];
    for (const [text, iso] of months) {
      expect(extractExplicitDates(text, YEAR)).toEqual([iso]);
    }
  });

  it('B. converts Jalali month names with an explicit Jalali year', () => {
    expect(extractExplicitDates('۱۵ مهر ۱۴۰۵', YEAR)).toEqual(['2026-10-07']);
    expect(extractExplicitDates('۲۵ شهریور ۱۴۰۵', YEAR)).toEqual([
      '2026-09-16',
    ]);
    expect(extractExplicitDates('15 مهر 1405', YEAR)).toEqual(['2026-10-07']);
    // The stated year wins over the reference year.
    expect(extractExplicitDates('۲۵ شهریور ۱۴۰۴', YEAR)).toEqual([
      '2025-09-16',
    ]);
  });

  it('C. converts year-first numeric Jalali dates', () => {
    for (const text of [
      '۱۴۰۵/۰۶/۲۵',
      '1405/06/25',
      '۱۴۰۵-۰۶-۲۵',
      '1405-06-25',
      '1405/6/25',
    ]) {
      expect(extractExplicitDates(text, YEAR)).toEqual(['2026-09-16']);
    }
  });

  it('D. accepts Persian, Arabic-Indic, and Latin digits', () => {
    expect(extractExplicitDates('۲۵ شهریور ۱۴۰۵', YEAR)).toEqual([
      '2026-09-16',
    ]);
    expect(extractExplicitDates('٢٥ شهریور ١٤٠٥', YEAR)).toEqual([
      '2026-09-16',
    ]);
    expect(extractExplicitDates('25 شهریور 1405', YEAR)).toEqual([
      '2026-09-16',
    ]);
    expect(extractExplicitDates('١٤٠٥/٠٦/٢٥', YEAR)).toEqual(['2026-09-16']);
  });

  it('E. keeps Persian Gregorian months on the Gregorian parser', () => {
    expect(extractExplicitDates('۱۲ سپتامبر', YEAR)).toEqual(['2026-09-12']);
    expect(extractExplicitDates('۱۲ یا ۱۵ سپتامبر', YEAR)).toEqual([
      '2026-09-12',
      '2026-09-15',
    ]);
    expect(extractExplicitDates('۱۸ آگوست', YEAR)).toEqual(['2026-08-18']);
    // مه is Gregorian May; مهر is Jalali Mehr. Neither leaks into the other.
    expect(extractExplicitDates('۱۵ مه', YEAR)).toEqual(['2026-05-15']);
    expect(extractExplicitDates('۱۵ مهر', YEAR)).toEqual(['2026-10-07']);
  });

  it('F. recommends Evaluate for a single Jalali date + interview', () => {
    const text = 'آیا ۲۵ شهریور ۱۴۰۵ برای مصاحبه خوبه؟';
    const time = detectTimeScope(text, YEAR);
    expect(time.scope).toBe('specific_date');
    expect(time.dates).toEqual(['2026-09-16']);
    expect(detectOperation(text, time.scope, YEAR)).toBe('evaluate');
    expect(resolveTypedDecisionType(text, 'fa')).toEqual({
      status: 'exact',
      decisionTypeId: 'car-interview',
      domain: 'career',
    });

    const frame = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.decision_type_id).toBe('car-interview');
    expect(frame.operation).toBe('evaluate');
    expect(frame.time.scope).toBe('specific_date');
    expect(frame.time.dates).toEqual(['2026-09-16']);
    expect(frame.raw_intent).toBe(text);

    // Yearless variant infers the reference Jalali year deterministically.
    const yearless = 'برای مصاحبه ۱۵ مهر چطوره؟';
    expect(recommendedOperation(yearless, YEAR)).toBe('evaluate');
    expect(detectTimeScope(yearless, YEAR).dates).toEqual(['2026-10-07']);
    expect(resolveTypedDecisionType(yearless, 'fa').status).toBe('exact');
  });

  it('G. recommends Compare for two Jalali candidates', () => {
    const text = '۱۵ یا ۲۰ مهر ۱۴۰۵ کدوم برای مصاحبه بهتره؟';
    const time = detectTimeScope(text, YEAR);
    expect(time.scope).toBe('multiple_dates');
    expect(time.dates).toEqual(['2026-10-07', '2026-10-12']);
    expect(recommendedOperation(text, YEAR)).toBe('compare');

    const frame = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.decision_type_id).toBe('car-interview');
    expect(frame.operation).toBe('compare');
    expect(frame.time.dates).toEqual(['2026-10-07', '2026-10-12']);
    expect(frame.pending_clarification).toBeNull();

    // Shared Jalali month propagates like the Gregorian shared-month parser.
    expect(extractExplicitDates('بین ۱۵ و ۲۰ مهر ۱۴۰۵', YEAR)).toEqual([
      '2026-10-07',
      '2026-10-12',
    ]);
    expect(extractExplicitDates('۱۵ یا ۲۰ مهر', YEAR)).toEqual([
      '2026-10-07',
      '2026-10-12',
    ]);
  });

  it('H. parses three Jalali Compare candidates', () => {
    const text = '۱۵، ۲۰ و ۲۵ مهر ۱۴۰۵ را مقایسه کن';
    expect(extractExplicitDates(text, YEAR)).toEqual([
      '2026-10-07',
      '2026-10-12',
      '2026-10-17',
    ]);
    expect(recommendedOperation(text, YEAR)).toBe('compare');
  });

  it('I. preserves user-entered Jalali candidate order', () => {
    expect(extractExplicitDates('۲۰ یا ۱۵ مهر ۱۴۰۵', YEAR)).toEqual([
      '2026-10-12',
      '2026-10-07',
    ]);
    const frame = buildDecisionFrame('۲۰ یا ۱۵ مهر ۱۴۰۵', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.time.dates).toEqual(['2026-10-12', '2026-10-07']);
    expect(frame.options?.map((o) => o.date)).toEqual([
      '2026-10-12',
      '2026-10-07',
    ]);
  });

  it('J. deduplicates Jalali candidates by first occurrence', () => {
    expect(extractExplicitDates('۱۵، ۲۰، ۱۵ مهر ۱۴۰۵', YEAR)).toEqual([
      '2026-10-07',
      '2026-10-12',
    ]);
    // More than five candidates are not truncated.
    expect(
      extractExplicitDates('۱۰، ۱۱، ۱۲، ۱۳، ۱۴ و ۱۵ مهر ۱۴۰۵', YEAR)
    ).toHaveLength(6);
  });

  it('K. rejects invalid Jalali months and days without inventing ISO', () => {
    for (const text of [
      '۱۴۰۵/۱۳/۰۱',
      '۱۴۰۵/۰۰/۰۱',
      '۱۴۰۵/۰۶/۳۲',
      '۱۴۰۵/۰۶/۰۰',
      '۱۴۰۵/۰۷/۳۱',
      '۳۲ شهریور ۱۴۰۵',
      '۰ مهر ۱۴۰۵',
      '۳۱ مهر ۱۴۰۵',
    ]) {
      expect(extractExplicitDates(text, YEAR)).toEqual([]);
      const time = detectTimeScope(text, YEAR);
      expect(time.scope).not.toBe('specific_date');
      expect(time.dates).toEqual([]);
    }
  });

  it('L. applies Esfand leap-year boundaries', () => {
    // 1403 is a leap year: Esfand 30 exists.
    expect(extractExplicitDates('۱۴۰۳/۱۲/۳۰', YEAR)).toEqual(['2025-03-20']);
    expect(extractExplicitDates('۳۰ اسفند ۱۴۰۳', YEAR)).toEqual(['2025-03-20']);
    // 1404 and 1405 are not: Esfand 30 must not convert.
    expect(extractExplicitDates('۱۴۰۴/۱۲/۳۰', YEAR)).toEqual([]);
    expect(extractExplicitDates('۳۰ اسفند ۱۴۰۵', YEAR)).toEqual([]);
    expect(extractExplicitDates('۱۴۰۵/۱۲/۳۰', YEAR)).toEqual([]);
    // Esfand 29 stays valid in a non-leap year.
    expect(extractExplicitDates('۲۹ اسفند ۱۴۰۵', YEAR)).toEqual(['2027-03-20']);
  });

  it('M. never guesses ambiguous numeric input as Jalali', () => {
    for (const text of ['۰۶/۰۹', '6/9', '25/06', '۲۵/۰۶', '۶/۲۵', '06/25']) {
      expect(extractExplicitDates(text, YEAR)).toEqual([]);
      expect(detectTimeScope(text, YEAR).scope).toBe('none');
    }
    // Gregorian day/month/year keeps its Phase 1B.1A contract.
    expect(extractExplicitDates('06/09/2026', YEAR)).toEqual(['2026-09-06']);
    expect(extractExplicitDates('09/06/2026', YEAR)).toEqual(['2026-06-09']);
    // A Gregorian year is never read as a Jalali year.
    expect(extractExplicitDates('2026/09/16', YEAR)).toEqual([]);
    // A year outside the supported Jalali horizon is not strong evidence.
    expect(extractExplicitDates('۱۳۷۷/۰۶/۲۵', YEAR)).toEqual([]);
    expect(extractExplicitDates('۱۴۷۹/۰۶/۲۵', YEAR)).toEqual([]);
    // A stated Gregorian year contradicts a Jalali month name.
    expect(extractExplicitDates('۱۵ مهر 2026', YEAR)).toEqual([]);
  });

  it('N. leaves mixed-calendar input unresolved instead of combining it', () => {
    for (const text of [
      '۱۵ مهر یا ۱۲ September',
      '۱۵ مهر یا ۱۲ سپتامبر',
      '۱۴۰۵/۰۶/۲۵ یا 2026-09-20',
    ]) {
      expect(extractExplicitDates(text, YEAR)).toEqual([]);
      const time = detectTimeScope(text, YEAR);
      expect(time.scope).not.toBe('specific_date');
      expect(time.scope).not.toBe('multiple_dates');
      expect(time.dates).toEqual([]);
      const frame = buildDecisionFrame(text, {
        reference_year: YEAR,
        decision_type_id: 'car-interview',
      });
      expect(frame.time.dates).toBeUndefined();
      expect(frame.pending_clarification).not.toBeNull();
    }
    // Compare wording still asks for time rather than mixing calendars.
    const frame = buildDecisionFrame('۱۵ مهر یا ۱۲ September کدوم بهتره؟', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.time.dates).toBeUndefined();
    expect(frame.pending_clarification).toBe('time');
  });

  it('O. valid Jalali dates never create a Decision Type', () => {
    const unsupported = [
      '۲۵ شهریور ۱۴۰۵ برای مذاکره حقوق خوبه؟',
      '۱۵ مهر ۱۴۰۵ برای خرید بیت‌کوین خوبه؟',
      '۱۴۰۵/۰۶/۲۵ برای مهاجرت خوبه؟',
      '۲۰ مهر برای قبول پیشنهاد شغلی خوبه؟',
    ];
    for (const text of unsupported) {
      const result = resolveTypedDecisionType(text, 'fa');
      expect(result.status).not.toBe('exact');
      expect(
        result.status === 'exact' ? result.decisionTypeId : undefined
      ).toBeUndefined();
      const frame = buildDecisionFrame(text, { reference_year: YEAR });
      expect(frame.decision_type_id).toBeUndefined();
      expect(frame.unknowns).toContain('Decision type');
    }
  });

  it('P. keeps raw_intent byte-for-byte original', () => {
    const text = 'بین ۱۵ و ۲۰ مهر ۱۴۰۵ کدام برای مصاحبه بهتره؟';
    const frame = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.raw_intent).toBe(text);
    expect(frame.raw_intent).toContain('مهر');
    expect(frame.raw_intent).toContain('۱۵');
    expect(frame.raw_intent).not.toContain('15');
    expect(frame.raw_intent).not.toContain('2026');
    expect(frame.raw_intent).not.toContain('10');
    expect(frame.time.dates).toEqual(['2026-10-07', '2026-10-12']);
    // Only normalized execution fields carry ISO.
    const persisted = toPersistedFraming(frame);
    expect(persisted.raw_intent).toBe(text);
    expect(persisted.dates).toEqual(['2026-10-07', '2026-10-12']);
  });

  it('Q. recommendation stays a suggestion, never an auto-selection', () => {
    const text = 'آیا ۲۵ شهریور ۱۴۰۵ برای مصاحبه خوبه؟';
    expect(recommendedOperation(text, YEAR)).toBe('evaluate');
    const switched = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
      operation: 'find',
      time_scope: 'date_range',
    });
    expect(switched.operation).toBe('find');
    expect(recommendedOperation(switched.raw_intent, YEAR)).toBe('evaluate');
    // Jalali parsing does not skip the Decision Type step.
    const untyped = buildDecisionFrame(text, { reference_year: YEAR });
    expect(untyped.decision_type_id).toBeUndefined();
    expect(canSelectOperationRenderer(untyped)).toBe(true);
    expect(untyped.unknowns).toContain('Decision type');
  });

  it('R. keeps English Gregorian resolution unchanged', () => {
    expect(
      extractExplicitDates('Is August 18 good for my interview?', YEAR)
    ).toEqual(['2026-08-18']);
    expect(extractExplicitDates('14 or 18 August?', YEAR)).toEqual([
      '2026-08-14',
      '2026-08-18',
    ]);
    expect(extractExplicitDates('2026-09-12', YEAR)).toEqual(['2026-09-12']);
    expect(recommendedOperation('Find the best date in the next 30 days')).toBe(
      'find'
    );
  });

  it('S. keeps Phase 1B.1A Persian Gregorian resolution unchanged', () => {
    const evaluate = buildDecisionFrame('آیا ۱۲ سپتامبر برای مصاحبه خوبه؟', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(evaluate.operation).toBe('evaluate');
    expect(evaluate.time.dates).toEqual(['2026-09-12']);

    const compare = buildDecisionFrame('۱۲ یا ۱۵ سپتامبر کدوم بهتره؟', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(compare.operation).toBe('compare');
    expect(compare.time.dates).toEqual(['2026-09-12', '2026-09-15']);

    const find = buildDecisionFrame('بهترین روز را در ۳۰ روز آینده پیدا کن', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(find.operation).toBe('find');
    expect(find.time.scope).toBe('date_range');
    expect(find.time.range_start).toBeUndefined();
    expect(find.time.range_end).toBeUndefined();
  });

  it('T. round-trips Jalali input through the FA display formatter', () => {
    const cases: Array<[string, string, string]> = [
      ['۲۵ شهریور ۱۴۰۵', '2026-09-16', '۲۵ شهریور ۱۴۰۵'],
      ['۱۵ مهر ۱۴۰۵', '2026-10-07', '۱۵ مهر ۱۴۰۵'],
      ['۱۴۰۵/۰۶/۲۵', '2026-09-16', '۲۵ شهریور ۱۴۰۵'],
    ];
    for (const [input, iso, display] of cases) {
      expect(extractExplicitDates(input, YEAR)).toEqual([iso]);
      // ISO is what reaches the formatter — never the Jalali source string.
      expect(formatAskDatePair('fa', iso, 'shamsi').primary).toBe(display);
    }
  });

  it('infers the Jalali year from an explicit ISO reference date', () => {
    // 2026-01-15 sits in Jalali 1404, so yearless months resolve to 1404.
    expect(extractExplicitDates('۱۵ مهر', REF_IN_1404)).toEqual(['2025-10-07']);
    expect(extractExplicitDates('۲۵ شهریور', REF_IN_1404)).toEqual([
      '2025-09-16',
    ]);
    // An explicit Jalali year is unaffected by the reference.
    expect(extractExplicitDates('۱۵ مهر ۱۴۰۵', REF_IN_1404)).toEqual([
      '2026-10-07',
    ]);
    const frame = buildDecisionFrame('۱۵ مهر', {
      reference_date: REF_IN_1404,
      decision_type_id: 'car-interview',
    });
    expect(frame.time.dates).toEqual(['2025-10-07']);
    // Never the next future occurrence.
    expect(frame.time.dates?.[0]).not.toBe('2026-10-07');
  });

  it('does not materialize relative Jalali-era phrases', () => {
    for (const text of [
      'امروز',
      'فردا',
      'پس فردا',
      'هفته آینده',
      'ماه آینده',
      'از اول مهر تا آخر آبان',
    ]) {
      expect(extractExplicitDates(text, YEAR)).toEqual([]);
      const time = detectTimeScope(text, YEAR);
      expect(time.dates).toEqual([]);
      expect(time.range_start).toBeUndefined();
      expect(time.range_end).toBeUndefined();
    }
  });

  it('emits only Gregorian ISO into persisted framing', () => {
    const frames = [
      buildDecisionFrame('آیا ۲۵ شهریور ۱۴۰۵ برای مصاحبه خوبه؟', {
        reference_year: YEAR,
        decision_type_id: 'car-interview',
      }),
      buildDecisionFrame('۱۵ یا ۲۰ مهر ۱۴۰۵ کدوم برای مصاحبه بهتره؟', {
        reference_year: YEAR,
        decision_type_id: 'car-interview',
      }),
      buildDecisionFrame('۱۴۰۵/۰۶/۲۵', {
        reference_year: YEAR,
        decision_type_id: 'car-interview',
      }),
    ];
    for (const frame of frames) {
      const persisted = toPersistedFraming(frame);
      for (const value of [
        persisted.date,
        ...(persisted.dates ?? []),
        ...(persisted.options ?? []).map((o) => o.date),
      ]) {
        if (value == null) continue;
        expect(value).toMatch(ISO_RE);
      }
      for (const iso of frame.time.dates ?? []) {
        expect(iso).toMatch(ISO_RE);
      }
    }
  });
});
