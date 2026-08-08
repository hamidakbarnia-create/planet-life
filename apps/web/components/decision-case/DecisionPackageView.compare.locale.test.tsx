import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function comparePackage(tied = false): DecisionEvaluationPackage {
  return {
    case_id: '55555555-5555-4555-8555-555555555555',
    evaluation_id: '66666666-6666-4666-8666-666666666666',
    evaluation_version: 1,
    case_version: 2,
    decision_type_id: 'mar-wedding-date',
    family_id: 'timing_opt',
    mode: 'compare_dates',
    precision_level: 'L3',
    engine_id: 'decision-engine-wedding-date-v1',
    created_at: '2026-08-08T08:00:00Z',
    schema_version: '1.0.0',
    recommendation: {
      stance: tied ? 'no_unique_winner' : 'proceed_with_conditions',
      conditions: [],
      summary: tied
        ? 'No uniquely preferred wedding date.'
        : 'Prefer Late weekend based on relative ceremony-day timing scores.',
    },
    timing: {
      material: true,
      band: 'high',
      score: tied ? 70 : 79,
      candidates: [
        {
          date: '2026-09-18',
          rank: 1,
          score: tied ? 70 : 79,
          band: 'high',
          option_id: 'late',
          label: 'Late weekend',
        },
        {
          date: '2026-09-10',
          rank: tied ? 1 : 2,
          score: tied ? 70 : 61,
          band: tied ? 'high' : 'moderate',
          option_id: 'early',
          label: 'Early weekend',
        },
      ],
      notes: 'Candidates ranked by wedding_date ceremony timing score.',
    },
    confidence: { value: 60, precision_level: 'L3', penalties: [] },
    evidence: { items: [] },
    drivers: { items: [] },
    tradeoffs: { items: [] },
    risks: { items: [] },
    opportunities: { items: [] },
    action_plan: { steps: [] },
    counter_recommendation: {
      stance: tied ? 'no_unique_winner' : 'proceed_with_conditions',
      summary: '',
      reason: 'A lower-ranked date may still be preferable.',
    },
    explainability: {
      why: tied
        ? 'Candidates are tied on ceremony-day timing.'
        : 'Late weekend ranks first with score 79.0 versus Early weekend (61.0).',
      why_not: 'Lower-ranked dates have weaker combined wedding_date timing scores.',
      assumptions: [],
      limits: [
        'Ceremony timing comparison only — not relationship quality or wedding success.',
      ],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

describe('DecisionPackageView COMPARE localization', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'localizes compare chrome for %s',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <DecisionPackageView
          package={comparePackage(false)}
          dqStatus="pass"
          lang={lang}
        />
      );
      const root = screen.getByTestId('compare-result-view');
      expect(root.getAttribute('dir')).toBe(copy.dir);
      expect(screen.getByTestId('compare-winner').textContent).toContain(
        'Late weekend'
      );
      expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
      expect(root.textContent).toContain(copy.compareOptionsLabel);
      expect(root.textContent).toContain(copy.resultConfidence);
      expect(root.textContent).toContain(copy.timingScoreLabel);
      if (lang !== 'en') {
        expect(root.textContent).not.toMatch(
          /Compared dates|Preferred date|Timing score:/i
        );
      }
    }
  );

  it('preserves tie / no unique winner without inventing a winner', () => {
    const copy = getAskProductCopy('fa');
    render(
      <DecisionPackageView
        package={comparePackage(true)}
        dqStatus="pass"
        lang="fa"
      />
    );
    expect(screen.getByTestId('compare-winner').textContent).toBe(
      copy.compareTiedLabel
    );
    expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
    expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
  });
});
