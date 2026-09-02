import { describe, expect, it } from 'vitest';
import { resolveTypedDecisionType } from '@/lib/decision-request/typed-resolver';
import {
  applyFindDateRange,
  buildDecisionFrame,
  recommendedOperation,
} from './frame';
import {
  FIND_MAX_RANGE_DAYS,
  FIND_MIN_RANGE_DAYS,
  detectOperation,
  detectTimeScope,
  extractExplicitDates,
  foldLocaleDigits,
  inclusiveFindDayCount,
  isValidFindInclusiveRange,
} from './resolve';

const YEAR = 2026;

describe('Phase 1B.1A localized resolution matrix', () => {
  it('A. folds Persian digits for parsing only', () => {
    expect(foldLocaleDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(extractExplicitDates('۱۲ سپتامبر', YEAR)).toEqual(['2026-09-12']);
  });

  it('B. folds Arabic-Indic digits for parsing only', () => {
    expect(foldLocaleDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
    expect(extractExplicitDates('١٢ سپتامبر', YEAR)).toEqual(['2026-09-12']);
  });

  it('C. parses FA Gregorian month names, not Jalali months', () => {
    expect(extractExplicitDates('۱۸ آگوست', YEAR)).toEqual(['2026-08-18']);
    expect(extractExplicitDates('۱۸ اوت', YEAR)).toEqual(['2026-08-18']);
    expect(extractExplicitDates('۱۲ سپتامبر', YEAR)).toEqual(['2026-09-12']);
    expect(extractExplicitDates('۱ ژانویه', YEAR)).toEqual(['2026-01-01']);
    // مهر is Jalali month 7, converted as Jalali (Phase 1B.1B) — never read
    // as Gregorian September/October by approximation.
    expect(extractExplicitDates('۱۵ مهر', YEAR)).toEqual(['2026-10-07']);
  });

  it('D. recommends Evaluate for one FA Gregorian date + suitability', () => {
    const text = 'آیا ۱۲ سپتامبر برای مصاحبه خوبه؟';
    const time = detectTimeScope(text, YEAR);
    expect(time.scope).toBe('specific_date');
    expect(time.dates).toEqual(['2026-09-12']);
    expect(detectOperation(text, time.scope, YEAR)).toBe('evaluate');
    expect(recommendedOperation(text, YEAR)).toBe('evaluate');
    expect(resolveTypedDecisionType(text, 'fa')).toEqual({
      status: 'exact',
      decisionTypeId: 'car-interview',
      domain: 'career',
    });
  });

  it('E. recommends Compare for two FA dates', () => {
    const text = '۱۲ یا ۱۵ سپتامبر کدوم برای مصاحبه بهتره؟';
    const time = detectTimeScope(text, YEAR);
    expect(time.dates).toEqual(['2026-09-12', '2026-09-15']);
    expect(recommendedOperation(text, YEAR)).toBe('compare');
  });

  it('F. parses three Compare dates with Persian comma', () => {
    const text = '۱۲، ۱۵ و ۱۸ سپتامبر را مقایسه کن';
    expect(extractExplicitDates(text, YEAR)).toEqual([
      '2026-09-12',
      '2026-09-15',
      '2026-09-18',
    ]);
    expect(recommendedOperation(text, YEAR)).toBe('compare');
  });

  it('G. propagates a shared month across compared days', () => {
    expect(extractExplicitDates('بین ۱۲ و ۱۵ سپتامبر', YEAR)).toEqual([
      '2026-09-12',
      '2026-09-15',
    ]);
    expect(extractExplicitDates('12 یا 15 سپتامبر', YEAR)).toEqual([
      '2026-09-12',
      '2026-09-15',
    ]);
  });

  it('H. preserves user-entered Compare candidate order', () => {
    expect(extractExplicitDates('۱۸ یا ۱۲ سپتامبر', YEAR)).toEqual([
      '2026-09-18',
      '2026-09-12',
    ]);
  });

  it('I. deduplicates Compare candidates by first occurrence', () => {
    expect(extractExplicitDates('۱۲، ۱۵، ۱۲ سپتامبر', YEAR)).toEqual([
      '2026-09-12',
      '2026-09-15',
    ]);
  });

  it('J. does not silently truncate more than 5 Compare candidates', () => {
    const text = '۱۰، ۱۱، ۱۲، ۱۳، ۱۴ و ۱۵ سپتامبر را مقایسه کن';
    const dates = extractExplicitDates(text, YEAR);
    expect(dates).toEqual([
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
      '2026-09-15',
    ]);
    const frame = buildDecisionFrame(text, { reference_year: YEAR });
    expect(frame.operation).toBe('compare');
    expect(frame.time.dates).toEqual(dates);
    expect(frame.pending_clarification).toBe('time');
  });

  it('K. recommends Find from FA search/range hints without ISO bounds', () => {
    const samples = [
      'بهترین روز را در ۳۰ روز آینده پیدا کن',
      'بهترین تاریخ را پیدا کن',
      'چه روزی برای مصاحبه بهتره؟',
      'بهترین روز مصاحبه را در ۳۰ روز آینده پیدا کن',
    ];
    for (const text of samples) {
      const time = detectTimeScope(text, YEAR);
      expect(time.scope).toBe('date_range');
      expect(time.range_start).toBeUndefined();
      expect(time.range_end).toBeUndefined();
      expect(recommendedOperation(text, YEAR)).toBe('find');
    }
  });

  it('does not treat every بهتر/بهترین as Find', () => {
    expect(recommendedOperation('بهترین زمان ۱۲ سپتامبره؟', YEAR)).toBe(
      'evaluate'
    );
    expect(
      recommendedOperation('بهترین زمان برای لانچ پروژه یا محصول جدید')
    ).toBe('unresolved');
  });

  it('L/M. Find inclusive 7 and 90 day bounds are valid', () => {
    expect(FIND_MIN_RANGE_DAYS).toBe(7);
    expect(FIND_MAX_RANGE_DAYS).toBe(90);
    expect(inclusiveFindDayCount('2026-09-01', '2026-09-07')).toBe(7);
    expect(inclusiveFindDayCount('2026-09-01', '2026-11-29')).toBe(90);
    expect(isValidFindInclusiveRange('2026-09-01', '2026-09-07')).toBe(true);
    expect(isValidFindInclusiveRange('2026-09-01', '2026-11-29')).toBe(true);
    const frame = buildDecisionFrame('Find the best date', {
      operation: 'find',
      time_scope: 'date_range',
    });
    expect(applyFindDateRange(frame, '2026-09-01', '2026-09-07').pending_clarification).toBeNull();
    expect(applyFindDateRange(frame, '2026-09-01', '2026-11-29').pending_clarification).toBeNull();
  });

  it('N/O/P/Q. Find rejects <7, >90, same-day, and reversed ranges', () => {
    const frame = buildDecisionFrame('Find the best date', {
      operation: 'find',
      time_scope: 'date_range',
    });
    expect(isValidFindInclusiveRange('2026-09-01', '2026-09-06')).toBe(false);
    expect(isValidFindInclusiveRange('2026-09-01', '2026-11-30')).toBe(false);
    expect(isValidFindInclusiveRange('2026-09-01', '2026-09-01')).toBe(false);
    expect(isValidFindInclusiveRange('2026-09-07', '2026-09-01')).toBe(false);
    expect(
      applyFindDateRange(frame, '2026-09-01', '2026-09-06').pending_clarification
    ).toBe('time');
    expect(
      applyFindDateRange(frame, '2026-09-01', '2026-11-30').pending_clarification
    ).toBe('time');
    expect(
      applyFindDateRange(frame, '2026-09-01', '2026-09-01').pending_clarification
    ).toBe('time');
    expect(
      applyFindDateRange(frame, '2026-09-07', '2026-09-01').pending_clarification
    ).toBe('time');
  });

  it('R/W. valid Persian dates do not create Decision Types for unsupported topics', () => {
    const unsupported = [
      '۱۲ سپتامبر برای مذاکره پیشنهاد شغلی خوبه؟',
      '۱۲ سپتامبر برای مذاکره حقوق خوبه؟',
      '۱۵ سپتامبر برای خرید بیت‌کوین خوبه؟',
      'فردا برای مهاجرت خوبه؟',
      'Should I negotiate my job offer tomorrow?',
    ];
    for (const text of unsupported) {
      const result = resolveTypedDecisionType(text, 'fa');
      expect(result.status).not.toBe('exact');
      expect(
        result.status === 'exact' ? result.decisionTypeId : undefined
      ).toBeUndefined();
    }
  });

  it('S. keeps raw_intent byte-for-byte original', () => {
    const text = 'بین ۱۲ و ۱۵ سپتامبر کدام برای مصاحبه بهتره؟';
    const frame = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(frame.raw_intent).toBe(text);
    expect(frame.time.dates).toEqual(['2026-09-12', '2026-09-15']);
    expect(foldLocaleDigits(text)).toContain('12');
    expect(frame.raw_intent).toContain('۱۲');
    expect(frame.raw_intent).not.toContain('12');
  });

  it('T. Jalali input normalizes to Gregorian ISO (Phase 1B.1B)', () => {
    const normalized: Array<[string, string]> = [
      ['۱۵ مهر', '2026-10-07'],
      ['۲۵ شهریور', '2026-09-16'],
      ['۱۴۰۵/۰۶/۲۵', '2026-09-16'],
      ['۱۴۰۵-۰۶-۲۵', '2026-09-16'],
    ];
    for (const [text, iso] of normalized) {
      expect(extractExplicitDates(text, YEAR)).toEqual([iso]);
      const time = detectTimeScope(text, YEAR);
      expect(time.scope).toBe('specific_date');
      expect(time.dates).toEqual([iso]);
    }
  });

  it('U. keeps English Gregorian resolution', () => {
    expect(
      extractExplicitDates('Is August 18 good for my interview?', YEAR)
    ).toEqual(['2026-08-18']);
    expect(extractExplicitDates('14 or 18 August?', YEAR)).toEqual([
      '2026-08-14',
      '2026-08-18',
    ]);
    expect(
      recommendedOperation('Find the best date in the next 30 days')
    ).toBe('find');
    const find = detectTimeScope('Find the best date in the next 30 days');
    expect(find.scope).toBe('date_range');
    expect(find.range_start).toBeUndefined();
    expect(find.range_end).toBeUndefined();
  });

  it('V. recommendation stays independent of selector (PR #35)', () => {
    const text = 'آیا ۱۲ سپتامبر برای مصاحبه خوبه؟';
    const frame = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(recommendedOperation(text, YEAR)).toBe('evaluate');
    expect(recommendedOperation(text, YEAR)).toBe(frame.operation);
    const switched = buildDecisionFrame(text, {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
      operation: 'find',
      time_scope: 'date_range',
    });
    expect(switched.operation).toBe('find');
    expect(recommendedOperation(switched.raw_intent, YEAR)).toBe('evaluate');
  });

  it('definition of done examples', () => {
    const evaluate = buildDecisionFrame('آیا ۱۲ سپتامبر برای مصاحبه خوبه؟', {
      reference_year: YEAR,
      decision_type_id: 'car-interview',
    });
    expect(evaluate.decision_type_id).toBe('car-interview');
    expect(evaluate.operation).toBe('evaluate');
    expect(evaluate.time.dates).toEqual(['2026-09-12']);

    const compare = buildDecisionFrame(
      '۱۲ یا ۱۵ سپتامبر کدوم برای مصاحبه بهتره؟',
      { reference_year: YEAR, decision_type_id: 'car-interview' }
    );
    expect(compare.decision_type_id).toBe('car-interview');
    expect(compare.operation).toBe('compare');
    expect(compare.time.dates).toEqual(['2026-09-12', '2026-09-15']);

    const find = buildDecisionFrame(
      'بهترین روز مصاحبه را در ۳۰ روز آینده پیدا کن',
      { reference_year: YEAR, decision_type_id: 'car-interview' }
    );
    expect(find.decision_type_id).toBe('car-interview');
    expect(find.operation).toBe('find');
    expect(find.time.scope).toBe('date_range');
    expect(find.time.range_start).toBeUndefined();
    expect(find.time.range_end).toBeUndefined();
    expect(find.pending_clarification).toBe('time');
  });
});
