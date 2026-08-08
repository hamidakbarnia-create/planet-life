import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  PACKAGE_V1_CONTRACT_GAPS,
  packageToFindView,
  packageToOperationResult,
  selectRendererOperation,
} from '@/lib/decision-frame';

describe('package → operation renderer adapter', () => {
  it('selects evaluate renderer for evaluate_date packages', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: {
        target_date: '2026-08-18',
        role: 'Engineer',
      },
    });
    expect(pkg.schema_version).toBe('1.0.0');
    expect(selectRendererOperation(pkg)).toBe('evaluate');
    const model = packageToOperationResult(pkg);
    expect(model.operation).toBe('evaluate');
    expect(JSON.stringify(model).toLowerCase()).not.toContain(
      'run a small experiment'
    );
  });

  it('selects find renderer and maps find.windows without fabricating a winner', () => {
    const base = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-11-05', role: 'Engineer' },
    });
    const pkg = {
      ...base,
      mode: 'find_dates' as const,
      decision_type_id: 'bus-product-launch',
      find: {
        range_start: '2026-11-01',
        range_end: '2026-11-30',
        timezone: 'UTC',
        unique_dominant: false,
        windows: [
          {
            window_id: 'w1',
            start_date: '2026-11-03',
            end_date: '2026-11-05',
            peak_dates: ['2026-11-04'],
            peak_score: 78,
            band: 'high' as const,
            rank: 1,
          },
          {
            window_id: 'w2',
            start_date: '2026-11-12',
            end_date: '2026-11-14',
            peak_dates: ['2026-11-13'],
            peak_score: 76,
            band: 'high' as const,
            rank: 2,
          },
        ],
      },
      recommendation: {
        ...base.recommendation,
        stance: 'no_unique_winner' as const,
        summary: 'Comparable launch timing windows. No clearly dominant window.',
      },
    } satisfies DecisionEvaluationPackage;

    expect(selectRendererOperation(pkg)).toBe('find');
    const model = packageToFindView(pkg);
    expect(model.operation).toBe('find');
    expect(model.headline).toBe('Comparable windows');
    expect(model.unique_dominant).toBe(false);
    expect(model.windows).toHaveLength(2);
    expect(model.windows[0]?.start_label).toContain('Nov');
    expect(JSON.stringify(model).toLowerCase()).not.toContain('best date');
  });

  it('documents Package v1 gaps without inventing a second schema', () => {
    expect(PACKAGE_V1_CONTRACT_GAPS.length).toBeGreaterThan(3);
    expect(
      PACKAGE_V1_CONTRACT_GAPS.some((g) => /avoid window/i.test(g))
    ).toBe(true);
    expect(
      PACKAGE_V1_CONTRACT_GAPS.some((g) => /FIND/i.test(g))
    ).toBe(true);
  });
});
