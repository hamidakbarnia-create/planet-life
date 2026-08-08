import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';

afterEach(() => cleanup());

function comparePackage(): DecisionEvaluationPackage {
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
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Prefer Late weekend for this civil based on relative ceremony-day timing scores.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 79,
      candidates: [
        {
          date: '2026-09-18',
          rank: 1,
          score: 79,
          band: 'high',
          option_id: 'late',
          label: 'Late weekend',
          strengths: ['Ceremony-day timing favorable (score 79.0).'],
          risks: ['Logistics or availability may still override timing preference.'],
        },
        {
          date: '2026-09-10',
          rank: 2,
          score: 61,
          band: 'moderate',
          option_id: 'early',
          label: 'Early weekend',
          strengths: ['Ceremony-day timing mixed (score 61.0).'],
          risks: ['Mixed ceremony-day signals — confirm non-timing constraints.'],
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
    action_plan: {
      steps: [{ order: 1, action: 'Confirm logistics for Late weekend.', condition: null }],
    },
    counter_recommendation: {
      stance: 'proceed_with_conditions',
      summary: '',
      reason: 'A lower-ranked date may still be preferable.',
    },
    explainability: {
      why: 'Late weekend ranks first with score 79.0 versus Early weekend (61.0).',
      why_not: 'Lower-ranked dates have weaker combined wedding_date timing scores.',
      assumptions: [],
      limits: [
        'Ceremony timing comparison only — not relationship quality, wedding success, legal advice, venue quality, budget success, or guaranteed outcome.',
      ],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

describe('DecisionPackageView compare rendering', () => {
  it('renders compare result instead of evaluate-only view', () => {
    render(
      <DecisionPackageView
        package={comparePackage()}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('decision-package-view').getAttribute('data-mode')).toBe(
      'compare_dates'
    );
    expect(screen.getByTestId('compare-result-view')).toBeTruthy();
    expect(screen.getByTestId('compare-winner').textContent).toContain('Late weekend');
    expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
    expect(screen.queryByTestId('evaluate-product-result')).toBeNull();
  });
});
