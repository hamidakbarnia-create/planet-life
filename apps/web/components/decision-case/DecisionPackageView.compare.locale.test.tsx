import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy, localizeStrength } from '@/lib/ask-product';

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
          strengths: ['Ceremony-day timing favorable (score 69.0).'],
          risks: ['Logistics or availability may still override timing preference.'],
        },
        {
          date: '2026-09-10',
          rank: tied ? 1 : 2,
          score: tied ? 70 : 61,
          band: tied ? 'high' : 'moderate',
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
      why_not:
        'Lower-ranked dates have weaker combined wedding_date timing scores.',
      assumptions: [],
      limits: [
        'Ceremony timing comparison only — not relationship quality or wedding success.',
        'ceremony_type, partner_name, and venue did not affect the numeric scores.',
      ],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

const RAW_ENGINE_PROSE = [
  'Ceremony-day timing favorable (score 69.0)',
  'Ceremony-day timing mixed (score 61.0)',
  'ranks first with score 79.0',
  'wedding_date',
  'ceremony_type',
  'partner_name',
] as const;

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
      const surface = root.textContent ?? '';
      expect(surface).not.toContain('ceremony_type');
      expect(surface).not.toContain('partner_name');
      expect(surface).not.toMatch(/\b[a-z]+(?:_[a-z0-9]+)+\b/);
      if (lang === 'en') {
        expect(surface).toContain(
          'Ceremony timing comparison only — not relationship quality or wedding success.'
        );
        expect(surface).toContain(
          'Ceremony details such as ceremony type, partner name, and venue did not affect the numeric timing scores.'
        );
      } else {
        expect(root.textContent).not.toMatch(
          /Compared dates|Preferred date|Timing score:/i
        );
        expect(root.textContent).not.toContain(
          'Ceremony timing comparison only — not relationship quality or wedding success.'
        );
        expect(root.textContent).not.toContain(
          'No clock-time window, avoid window, or FIND search was performed.'
        );
      }
      const dateEls = screen.getAllByTestId('compare-option-date');
      expect(dateEls).toHaveLength(2);
      for (const el of dateEls) {
        const iso = el.getAttribute('data-date-iso');
        expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(el.textContent).not.toBe(iso);
        expect(el.textContent).not.toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      expect(dateEls[0]?.getAttribute('data-date-iso')).toBe('2026-09-18');
      expect(dateEls[1]?.getAttribute('data-date-iso')).toBe('2026-09-10');
    }
  );

  it.each(['fa', 'ar', 'ru'] as const)(
    '%s COMPARE never renders raw engine strengths/why and uses structured explanation',
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
      const surface = root.textContent ?? '';
      for (const phrase of RAW_ENGINE_PROSE) {
        expect(surface).not.toContain(phrase);
      }
      expect(surface).not.toMatch(/Ceremony-day timing|timing favorable/i);
      expect(surface).not.toMatch(/ranks first with score/i);
      const why = screen.getByTestId('compare-relative-why').textContent ?? '';
      expect(why).toContain(copy.compareRelativeWhy);
      expect(why).toContain('Late weekend');
      expect(why).toMatch(/79/);
      const strength = localizeStrength(lang, 'strong') ?? 'strong';
      expect(why).toContain(
        copy.compareWhyWinner('Late weekend', 79, strength)
      );
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
    const surface = screen.getByTestId('compare-result-view').textContent ?? '';
    expect(surface).toContain(copy.compareWhyTied('Late weekend · Early weekend'));
    expect(surface).not.toContain('Ceremony-day timing favorable');
  });

  it('COMPARE hierarchy places winner and candidates before confidence', () => {
    const { container } = render(
      <DecisionPackageView
        package={comparePackage(false)}
        dqStatus="pass"
        lang="fa"
      />
    );
    const html = container.innerHTML;
    const winnerAt = html.indexOf('data-testid="compare-winner"');
    const optionsAt = html.indexOf('data-testid="compare-options"');
    const whyAt = html.indexOf('data-testid="compare-relative-why"');
    const confidenceAt = html.indexOf('data-testid="result-confidence-card"');
    expect(winnerAt).toBeGreaterThanOrEqual(0);
    expect(optionsAt).toBeGreaterThan(winnerAt);
    expect(whyAt).toBeGreaterThan(optionsAt);
    expect(confidenceAt).toBeGreaterThan(whyAt);
  });

  it('keeps the Compare ResultShell non-compact and date markup unisolated', () => {
    render(
      <DecisionPackageView
        package={comparePackage()}
        dqStatus="pass"
        lang="en"
      />
    );
    const shell = screen.getByTestId('compare-result-view');
    expect(shell.getAttribute('data-density')).toBeNull();
    expect(screen.queryByTestId('result-date-primary-token')).toBeNull();
    expect(screen.queryByTestId('result-date-secondary-token')).toBeNull();
  });
});
