import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage, STUB_ENGINE_ID } from '@/lib/decision-case';

describe('DecisionPackageView runtime vs stub', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps stub banner for historical stub packages', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-10', role: 'PM' },
    });
    render(<DecisionPackageView package={pkg} />);
    expect(screen.getByTestId('demo-evaluation-notice')).toBeTruthy();
    expect(pkg.engine_id).toBe(STUB_ENGINE_ID);
  });

  it('renders consumer Evaluate result for real runtime packages without engine chrome', () => {
    const base = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    const pkg = {
      ...base,
      engine_id: 'decision-engine-car-interview-v1',
      confidence: {
        value: 55,
        precision_level: 'L3' as const,
        penalties: [
          {
            code: 'CONFIDENCE_UNAVAILABLE',
            message:
              'Upstream scoring did not supply a reasoning confidence value.',
          },
        ],
      },
      counter_recommendation: {
        stance: 'wait' as const,
        summary: '',
        reason: 'No alternative date was evaluated.',
      },
    };
    const { container } = render(<DecisionPackageView package={pkg} />);
    const view = within(container);
    expect(view.queryByTestId('demo-evaluation-notice')).toBeNull();
    expect(view.getByTestId('evaluate-product-result')).toBeTruthy();
    expect(view.queryByTestId('runtime-engine-id')).toBeNull();
    expect(container.textContent).not.toMatch(/decision-engine-/);
    expect(container.textContent).not.toMatch(/\bUnknown\b/);
  });
});
