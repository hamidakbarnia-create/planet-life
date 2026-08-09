import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function findPackage(overrides?: {
  unique_dominant?: boolean;
  windows?: DecisionEvaluationPackage['find'];
}): DecisionEvaluationPackage {
  return {
    case_id: '77777777-7777-4777-8777-777777777777',
    evaluation_id: '88888888-8888-4888-8888-888888888888',
    evaluation_version: 1,
    case_version: 2,
    decision_type_id: 'bus-product-launch',
    family_id: 'timing_opt',
    mode: 'find_dates',
    precision_level: 'L3',
    engine_id: 'decision-engine-product-launch-v1',
    created_at: '2026-08-08T08:00:00Z',
    schema_version: '1.0.0',
    recommendation: {
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Comparable launch windows were found in range.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 74,
      candidates: [],
      notes: 'FIND windows ranked by launch-day timing.',
    },
    find: overrides?.windows ?? {
      range_start: '2026-09-01',
      range_end: '2026-09-30',
      timezone: 'UTC',
      unique_dominant: overrides?.unique_dominant ?? false,
      windows: [
        {
          window_id: 'w1',
          start_date: '2026-09-08',
          end_date: '2026-09-10',
          peak_dates: ['2026-09-09'],
          peak_score: 74,
          band: 'high',
          rank: 1,
        },
        {
          window_id: 'w2',
          start_date: '2026-09-20',
          end_date: '2026-09-22',
          peak_dates: ['2026-09-21'],
          peak_score: 71,
          band: 'high',
          rank: 2,
        },
      ],
    },
    confidence: { value: 58, precision_level: 'L3', penalties: [] },
    evidence: { items: [] },
    drivers: { items: [] },
    tradeoffs: { items: [] },
    risks: { items: [] },
    opportunities: { items: [] },
    action_plan: { steps: [] },
    counter_recommendation: {
      stance: 'proceed_with_conditions',
      summary: '',
      reason: 'No forced unique best day.',
    },
    explainability: {
      why: 'Two comparable windows exceed the eligibility threshold.',
      why_not: 'No uniquely dominant window.',
      assumptions: [],
      limits: [
        'Relative symbolic launch-day timing only — not business or market intelligence.',
        'Does not predict launch success, revenue, adoption, Product Hunt rank, market demand, PR performance, or team readiness.',
        'Hourly clock-time windows were not computed.',
      ],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

describe('DecisionPackageView FIND rendering', () => {
  it.each(['en', 'fa', 'ar', 'ru'] as const)(
    'localizes FIND chrome for %s without fake best-day language',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <DecisionPackageView package={findPackage()} dqStatus="pass" lang={lang} />
      );
      const root = screen.getByTestId('find-result-view');
      expect(root.getAttribute('dir')).toBe(copy.dir);
      expect(screen.getByTestId('find-headline').textContent).toBe(
        copy.findHeadlineComparable
      );
      expect(screen.getByTestId('find-honesty').textContent).toBe(
        copy.findHonestyComparable
      );
      expect(screen.getByTestId('find-range').textContent?.length).toBeGreaterThan(3);
      expect(screen.getAllByTestId('find-window')).toHaveLength(2);
      const text = root.textContent ?? '';
      expect(text).not.toMatch(/perfect date|destined day|guaranteed best/i);
      expect(text).toContain(copy.findRangeLabel);
      expect(text).toContain(copy.findWindowsLabel);
      const rangeText = screen.getAllByTestId('find-window-range')
        .map((el) => el.textContent ?? '')
        .join(' | ');
      expect(rangeText).not.toMatch(/Sep\s*[–-]\s*\d+\s*Sep/i);
      if (lang === 'en') {
        expect(screen.getByTestId('find-headline').textContent).toBe(
          'Comparable windows'
        );
        expect(text).toContain(
          'Relative symbolic launch-day timing only — not business or market intelligence.'
        );
      } else {
        expect(screen.getByTestId('find-headline').textContent).not.toBe(
          'Comparable windows'
        );
        expect(screen.getByTestId('find-headline').textContent).not.toMatch(
          /[A-Za-z]{4,}/
        );
        expect(text).not.toContain(
          'Relative symbolic launch-day timing only — not business or market intelligence.'
        );
        expect(text).not.toContain('Hourly clock-time windows were not computed.');
      }
    }
  );

  it('preserves no-strong-window outcome without inventing a winner', () => {
    render(
      <DecisionPackageView
        lang="en"
        dqStatus="pass"
        package={findPackage({
          windows: {
            range_start: '2026-09-01',
            range_end: '2026-09-30',
            timezone: 'UTC',
            unique_dominant: false,
            windows: [],
          },
        })}
      />
    );
    expect(screen.getByTestId('find-windows-empty')).toBeTruthy();
    expect(screen.getByTestId('find-headline').textContent).toBe(
      getAskProductCopy('en').findHeadlineNone
    );
  });
});
