import { describe, expect, it } from 'vitest';
import {
  DEMO_STUB_NOTICE,
  STUB_ENGINE_ID,
  assertPackageRenderContract,
  bindDemoStubPackage,
} from './demo-stub-fixture';
import demoFixture from './fixtures/car-interview-stub-package.demo.json';

describe('demo stub fixture adapter', () => {
  it('binds a checked-in DecisionEvaluationPackage v1 fixture', () => {
    const pkg = bindDemoStubPackage({
      caseId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      caseVersion: 3,
      intake: {
        target_date: '2026-09-01',
        role: 'Analyst',
      },
    });

    assertPackageRenderContract(pkg);
    expect(pkg.schema_version).toBe('1.0.0');
    expect(pkg.engine_id).toBe(STUB_ENGINE_ID);
    expect(pkg.case_id).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(pkg.case_version).toBe(3);
    expect(pkg.timing.candidates).toHaveLength(1);
    expect(pkg.timing.candidates[0]?.date).toBe('2026-09-01');
    expect(pkg.confidence.penalties[0]?.code).toBe('STUB_ENGINE');
    expect(demoFixture.engine_id).toBe(STUB_ENGINE_ID);
    expect(DEMO_STUB_NOTICE).toMatch(/Decision Runtime is not connected/i);
  });
});
