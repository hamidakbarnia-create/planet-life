import { describe, expect, it } from 'vitest';
import {
  applyOperationChoice,
  buildDecisionFrame,
  recommendedOperation,
} from './frame';

describe('applyOperationChoice field isolation', () => {
  it('clears Find range when switching to Evaluate', () => {
    const find = buildDecisionFrame('Find the best date in the next 30 days', {
      decision_type_id: 'bus-product-launch',
      operation: 'find',
      time_scope: 'date_range',
      range_start: '2026-09-15',
      range_end: '2026-09-17',
    });
    const next = applyOperationChoice(find, 'evaluate');
    expect(next.operation).toBe('evaluate');
    expect(next.time.scope).toBe('none');
    expect(next.time.range_start).toBeUndefined();
    expect(next.time.range_end).toBeUndefined();
    expect(next.time.dates).toBeUndefined();
    expect(next.options).toBeUndefined();
  });

  it('does not convert a Find range into Compare candidates', () => {
    const find = buildDecisionFrame('Find the best date in the next 30 days', {
      decision_type_id: 'bus-product-launch',
      operation: 'find',
      time_scope: 'date_range',
      range_start: '2026-09-15',
      range_end: '2026-09-17',
    });
    const next = applyOperationChoice(find, 'compare');
    expect(next.operation).toBe('compare');
    expect(next.time.scope).toBe('multiple_dates');
    expect(next.time.range_start).toBeUndefined();
    expect(next.time.range_end).toBeUndefined();
    expect(next.time.dates).toBeUndefined();
    expect(next.options).toBeUndefined();
  });

  it('clears Compare candidates when switching to Find', () => {
    const compare = buildDecisionFrame('14 or 18 August wedding?', {
      decision_type_id: 'mar-wedding-date',
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    const next = applyOperationChoice(compare, 'find');
    expect(next.operation).toBe('find');
    expect(next.time.scope).toBe('date_range');
    expect(next.time.dates).toBeUndefined();
    expect(next.options).toBeUndefined();
    expect(next.time.range_start).toBeUndefined();
    expect(next.time.range_end).toBeUndefined();
  });

  it('preserves Compare candidates when re-selecting Compare', () => {
    const compare = buildDecisionFrame('14 or 18 August wedding?', {
      decision_type_id: 'mar-wedding-date',
      reference_year: 2026,
      operation: 'compare',
      time_scope: 'multiple_dates',
      dates: ['2026-08-14', '2026-08-18'],
    });
    const next = applyOperationChoice(compare, 'compare');
    expect(next.time.dates).toEqual(['2026-08-14', '2026-08-18']);
    expect(next.options?.length).toBe(2);
  });

  it('keeps a single Evaluate date when staying on Evaluate', () => {
    const evaluate = buildDecisionFrame('Is August 18 good for my interview?', {
      decision_type_id: 'car-interview',
      reference_year: 2026,
      operation: 'evaluate',
      time_scope: 'specific_date',
      dates: ['2026-08-18'],
    });
    const next = applyOperationChoice(evaluate, 'evaluate');
    expect(next.time.dates).toEqual(['2026-08-18']);
    expect(next.time.range_start).toBeUndefined();
  });
});

describe('recommendedOperation', () => {
  it('recommends Find for English best-date questions without committing persist', () => {
    expect(
      recommendedOperation('Find the best date in the next 30 days')
    ).toBe('find');
  });

  it('does not invent an operation for Persian launch timing', () => {
    expect(
      recommendedOperation('بهترین زمان برای لانچ پروژه یا محصول جدید')
    ).toBe('unresolved');
  });
});
