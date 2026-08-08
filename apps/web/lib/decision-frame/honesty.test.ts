import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import {
  buildDecisionFrame,
  packageToCompareView,
  packageToEvaluateView,
  packageToOperationResult,
  selectRendererOperation,
} from '@/lib/decision-frame';

describe('multilingual operation resolution honesty', () => {
  const faSamples = [
    '۱۸ آگوست برای مصاحبه خوبه؟',
    '۱۴ یا ۱۸ آگوست؟',
    'بهترین تاریخ را در ۳۰ روز آینده پیدا کن',
    'با سرمایه‌گذار جلسه دارم',
  ];

  const arSamples = ['هل يوم 18 أغسطس مناسب لمقابلتي؟'];
  const ruSamples = [
    '14 или 18 августа?',
    'Найди лучшую дату в ближайшие 30 дней',
  ];

  it('leaves Persian/AR/RU unsupported natural language unresolved', () => {
    for (const text of [...faSamples, ...arSamples, ...ruSamples]) {
      const frame = buildDecisionFrame(text, { reference_year: 2026 });
      // Must not silently invent evaluate/compare/find from unsupported NL.
      expect(
        frame.operation === 'unresolved' ||
          frame.pending_clarification === 'operation' ||
          frame.pending_clarification === 'open_ended_axis'
      ).toBe(true);
      expect(frame.time.scope).toBe('none');
      expect(frame.time.dates ?? []).toEqual([]);
    }
  });

  it('resolves supported English explicitly', () => {
    expect(
      buildDecisionFrame('Is August 18 good for my interview?', {
        reference_year: 2026,
      }).operation
    ).toBe('evaluate');
    expect(
      buildDecisionFrame('14 or 18 August?', { reference_year: 2026 }).operation
    ).toBe('compare');
    expect(
      buildDecisionFrame('Find the best date in the next 30 days').operation
    ).toBe('find');
    expect(buildDecisionFrame("I'm meeting an investor.").operation).toBe(
      'unresolved'
    );
  });
});

describe('package adapter absent-data honesty', () => {
  it('does not fabricate avoid, deciding_factor, or K/I/U evidence', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });

    const evaluate = packageToEvaluateView(pkg);
    expect(evaluate.avoid).toBeUndefined();
    expect(evaluate.best_window).toBeUndefined();
    expect(evaluate.known).toBeUndefined();
    expect(evaluate.inferred).toBeUndefined();
    expect(evaluate.unknown).toBeUndefined();

    const comparePkg = {
      ...pkg,
      mode: 'compare_dates' as const,
      timing: {
        ...pkg.timing,
        candidates: [
          { date: '2026-08-14', rank: 2, score: 50, band: 'moderate' as const },
          { date: '2026-08-18', rank: 1, score: 70, band: 'high' as const },
        ],
      },
    };
    const compare = packageToCompareView(comparePkg);
    // Relative why may come from Package explainability; never invent Known buckets.
    expect(compare.deciding_factor).toBe(
      comparePkg.explainability.why || undefined
    );
    expect(compare.unique_winner).toBe(true);
    expect(compare.winner_label).toBeTruthy();
    expect(compare.known).toBeUndefined();
    expect(compare.inferred).toBeUndefined();
    expect(compare.unknown).toBeUndefined();
  });

  it('selects renderer from Package.mode only, not candidate count', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    // Even if multiple candidates were present, evaluate_date stays evaluate.
    const multi = {
      ...pkg,
      mode: 'evaluate_date' as const,
      timing: {
        ...pkg.timing,
        candidates: [
          { date: '2026-08-18', rank: 1, score: 70, band: 'high' as const },
          { date: '2026-08-20', rank: 2, score: 60, band: 'moderate' as const },
        ],
      },
    };
    expect(selectRendererOperation(multi)).toBe('evaluate');
    expect(packageToOperationResult(multi).operation).toBe('evaluate');

    const compareMode = { ...multi, mode: 'compare_dates' as const };
    expect(selectRendererOperation(compareMode)).toBe('compare');
    expect(packageToOperationResult(compareMode).operation).toBe('compare');
  });

  it('renders safely when optional Package presentation fields are empty', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    const sparse = {
      ...pkg,
      recommendation: { ...pkg.recommendation, conditions: [] },
      drivers: { items: [] },
      counter_recommendation: {
        ...pkg.counter_recommendation,
        summary: '',
      },
      explainability: { ...pkg.explainability, why: '', why_not: '' },
    };
    expect(() => packageToEvaluateView(sparse)).not.toThrow();
    const model = packageToEvaluateView(sparse);
    expect(model.best_alternative).toBeUndefined();
    expect(model.conditions).toEqual([]);
  });
});
