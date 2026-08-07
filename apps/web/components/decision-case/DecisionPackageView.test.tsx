import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { DEMO_STUB_NOTICE, bindDemoStubPackage } from '@/lib/decision-case';

describe('DecisionPackageView', () => {
  it('shows the non-production demo notice for stub packages', () => {
    const pkg = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: {
        target_date: '2026-08-10',
        role: 'Product Manager',
        company: 'Metioro',
      },
    });

    render(<DecisionPackageView package={pkg} />);

    expect(screen.getByTestId('demo-evaluation-notice').textContent).toContain(
      DEMO_STUB_NOTICE
    );
    expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
    expect(screen.queryByText(/81/)).toBeNull();
    expect(screen.queryByText(/72/)).toBeNull();
    expect(screen.queryByText(/run a small experiment/i)).toBeNull();
    expect(screen.queryByText(/best case/i)).toBeNull();
  });
});
