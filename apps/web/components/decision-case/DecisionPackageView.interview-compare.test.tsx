/**
 * Interview COMPARE Result UX (jsdom).
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function basePackage(): DecisionEvaluationPackage {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Founder' },
  });
  return {
    ...base,
    decision_type_id: 'car-interview',
    family_id: 'visibility',
    mode: 'compare_dates',
    engine_id: 'decision-engine-car-interview-v1',
    recommendation: {
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Prefer Thursday for relative communication timing.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 78,
      candidates: [
        {
          date: '2026-09-18',
          rank: 1,
          score: 78,
          band: 'high',
          option_id: 'thu',
          label: 'Thursday',
        },
        {
          date: '2026-09-10',
          rank: 2,
          score: 61,
          band: 'moderate',
          option_id: 'mon',
          label: 'Monday',
        },
      ],
      notes: 'Ranked',
    },
    drivers: { items: [] },
    explainability: {
      why: 'Thursday ranks first',
      why_not: 'Monday weaker',
      assumptions: [],
      limits: [
        'Interview-date communication/visibility timing comparison only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.',
      ],
    },
  };
}

describe('DecisionPackageView interview COMPARE', () => {
  it('localizes AR Result without hiring claims and without raw ISO as primary label', () => {
    const copy = getAskProductCopy('ar');
    render(
      <DecisionPackageView package={basePackage()} dqStatus="pass" lang="ar" />
    );
    const root = screen.getByTestId('compare-result-view');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(screen.getByTestId('compare-winner').textContent).toBeTruthy();
    expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
    const surface = root.textContent ?? '';
    expect(surface).not.toMatch(
      /hiring outcome|job offer|salary|career success/i
    );
    expect(within(root).getByText(copy.compareOptionsLabel)).toBeTruthy();
    const optionText = screen
      .getAllByTestId('compare-option')
      .map((node) => node.textContent ?? '')
      .join(' ');
    expect(optionText).not.toMatch(/^2026-09-18$/m);
  });

  it('shows honest tie for FA locale', () => {
    const copy = getAskProductCopy('fa');
    const base = basePackage();
    const tied: DecisionEvaluationPackage = {
      ...base,
      recommendation: {
        stance: 'no_unique_winner',
        conditions: [],
        summary: 'No unique winner for this interview.',
      },
      timing: {
        ...base.timing,
        candidates: [
          {
            date: '2026-09-18',
            rank: 1,
            score: 70,
            band: 'high',
            option_id: 'thu',
            label: 'Thursday',
          },
          {
            date: '2026-09-10',
            rank: 1,
            score: 70,
            band: 'high',
            option_id: 'mon',
            label: 'Monday',
          },
        ],
      },
    };
    render(<DecisionPackageView package={tied} dqStatus="pass" lang="fa" />);
    expect(screen.getByTestId('compare-winner').textContent).toBe(
      copy.compareTiedLabel
    );
  });
});
