import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import {
  PACKAGE_V1_CONTRACT_GAPS,
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
