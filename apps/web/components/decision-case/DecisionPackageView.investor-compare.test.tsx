/**
 * Investor Meeting COMPARE Result UX (jsdom).
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
    caseId: '22222222-2222-4222-8222-222222222222',
    caseVersion: 1,
    // bindDemoStubPackage intake is typed as CarInterviewIntake; meeting_goal
    // is not accepted without weakening types. Omit Interview-only `role`.
    intake: { target_date: '2026-08-18' },
  });
  return {
    ...base,
    decision_type_id: 'bus-investor-meeting',
    family_id: 'visibility',
    mode: 'compare_dates',
    engine_id: 'decision-engine-investor-meeting-v1',
    recommendation: {
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Prefer Thursday for relative negotiation timing.',
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
        'Investor-meeting communication/negotiation timing comparison only — not investment outcome or funding success.',
      ],
    },
  };
}

describe('DecisionPackageView investor COMPARE', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'localizes %s Result without funding claims and without raw ISO primary label',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <DecisionPackageView
          package={basePackage()}
          dqStatus="pass"
          lang={lang}
        />
      );
      const root = screen.getByTestId('compare-result-view');
      expect(root.getAttribute('dir')).toBe(copy.dir);
      expect(screen.getByTestId('compare-winner').textContent).toBeTruthy();
      expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
      const claimSurface = [
        screen.getByTestId('compare-winner').textContent ?? '',
        ...screen
          .getAllByTestId('compare-option')
          .map((node) => node.textContent ?? ''),
      ].join(' ');
      // Positive claim surface must not predict investment/funding outcomes.
      expect(claimSurface).not.toMatch(
        /will raise|guaranteed funding|funding success|fundraising success|investor commitment|term sheet|amount raised|valuation|guaranteed investor interest|investor interest certainty|guaranteed pitch performance|pitch performance certainty|business success|market demand|financial return/i
      );
      expect(within(root).getByText(copy.compareOptionsLabel)).toBeTruthy();
      const optionText = screen
        .getAllByTestId('compare-option')
        .map((node) => node.textContent ?? '')
        .join(' ');
      expect(optionText).not.toMatch(/^2026-09-18$/m);
      if (lang !== 'en') {
        const surface = root.textContent ?? '';
        expect(surface).not.toMatch(/meeting_goal|investor_name/);
      }
    }
  );

  it('shows honest tie for FA locale', () => {
    const copy = getAskProductCopy('fa');
    const base = basePackage();
    const tied: DecisionEvaluationPackage = {
      ...base,
      recommendation: {
        stance: 'no_unique_winner',
        conditions: [],
        summary: 'No unique winner for this investor meeting.',
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
