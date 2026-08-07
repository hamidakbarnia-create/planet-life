import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { DEMO_STUB_NOTICE, bindDemoStubPackage } from '@/lib/decision-case';

describe('DecisionPackageView', () => {
  it('shows the non-production demo notice before package content', () => {
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
    expect(screen.getByTestId('demo-engine-id').textContent).toMatch(
      /decision-engine-stub-v1/
    );
    expect(screen.getByTestId('demo-stub-penalty').textContent).toMatch(
      /STUB_ENGINE/
    );
    expect(screen.getByTestId('demo-stub-penalty').textContent).toMatch(
      /not a production evaluation/i
    );
    expect(screen.queryByText(/81/)).toBeNull();
    expect(screen.queryByText(/72/)).toBeNull();
    expect(screen.getByRole('heading', { name: /Timing \(demo\)/i })).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: /Confidence \(demo\)/i })
    ).toBeTruthy();
  });
});
