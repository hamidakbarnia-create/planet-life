import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

describe('DecisionPackageView blocked evaluation', () => {
  it('does not render a normal recommendation for blocked insufficient packages', () => {
    const base = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 2,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    const pkg = {
      ...base,
      engine_id: 'decision-engine-car-interview-v1',
      recommendation: {
        stance: 'insufficient_data' as const,
        conditions: ['Add birth date, birth time, and birth location evidence'],
        summary:
          'Cannot evaluate the Engineer interview date without natal evidence.',
      },
      timing: {
        material: false,
        band: 'na' as const,
        score: null,
        candidates: [
          { date: '2026-08-18', rank: 1, score: 0, band: 'low' as const },
        ],
        notes: 'Timing not evaluated',
      },
      confidence: {
        value: 0,
        precision_level: 'L3' as const,
        penalties: [
          {
            code: 'MISSING_NATAL_EVIDENCE',
            message: 'Birth date/time/location evidence is required.',
          },
        ],
      },
    };

    render(
      <DecisionPackageView
        package={pkg}
        dqStatus="blocked"
        caseId="case-blocked-1"
      />
    );

    expect(screen.getByTestId('decision-package-blocked')).toBeTruthy();
    expect(screen.queryByTestId('evaluate-result-view')).toBeNull();
    expect(screen.queryByTestId('evaluate-strength')).toBeNull();
    expect(screen.getByText(/More information is needed/i)).toBeTruthy();
    expect(screen.getByText(/not a Favorable/i)).toBeTruthy();
    expect(screen.getByTestId('blocked-add-evidence-link')).toBeTruthy();
    expect(screen.queryByText(/^favorable$/i)).toBeNull();
    expect(screen.queryByText(/^mixed$/i)).toBeNull();
    expect(screen.queryByText(/^unfavorable$/i)).toBeNull();
  });

  it('blocks insufficient Compare packages without mounting CompareResultView', () => {
    const copy = getAskProductCopy('en');
    const base = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 2,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    const pkg = {
      ...base,
      mode: 'compare_dates' as const,
      engine_id: 'decision-engine-investor-meeting-v1',
      recommendation: {
        stance: 'insufficient_data' as const,
        conditions: ['Add birth date, birth time, and birth location evidence'],
        summary: 'Cannot compare these dates without natal evidence.',
      },
      timing: {
        material: false,
        band: 'na' as const,
        score: null,
        candidates: [
          {
            date: '2026-08-14',
            rank: 1,
            score: 0,
            band: 'low' as const,
            option_id: 'a',
            label: 'Thursday',
          },
          {
            date: '2026-08-18',
            rank: 2,
            score: 0,
            band: 'low' as const,
            option_id: 'b',
            label: 'Monday',
          },
        ],
        notes: 'Timing not evaluated',
      },
      confidence: {
        value: 0,
        precision_level: 'L3' as const,
        penalties: [
          {
            code: 'MISSING_NATAL_EVIDENCE',
            message: 'Birth date/time/location evidence is required.',
          },
        ],
      },
    };

    render(
      <DecisionPackageView
        package={pkg}
        dqStatus="blocked"
        caseId="case-blocked-compare-1"
        lang="en"
      />
    );

    expect(screen.getByTestId('decision-package-blocked')).toBeTruthy();
    expect(screen.queryByTestId('compare-result-view')).toBeNull();
    expect(screen.queryByTestId('decision-package-view')).toBeNull();
    expect(screen.getByText(copy.blockedTitleCompare)).toBeTruthy();
    expect(screen.getByText(copy.blockedBodyCompare)).toBeTruthy();
    expect(screen.getByTestId('blocked-add-evidence-link')).toBeTruthy();
    const surface = screen.getByTestId('decision-package-blocked').textContent ?? '';
    expect(surface).not.toMatch(/\/\s*100/);
    expect(surface).not.toContain(copy.compareWinnerLabel);
    expect(surface).not.toContain(copy.compareTiedLabel);
    expect(surface).not.toContain('Thursday');
  });
});
