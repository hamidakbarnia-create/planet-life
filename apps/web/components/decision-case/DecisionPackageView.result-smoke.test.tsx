/**
 * Local Result UX smoke (jsdom). Mirrors browser A/B/C checks when Chromium
 * system libs are unavailable in the agent environment.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

function investorFaPackage(): DecisionEvaluationPackage {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Founder' },
  });
  return {
    ...base,
    decision_type_id: 'bus-investor-meeting',
    engine_id: 'decision-engine-investor-meeting-v1',
    timing: {
      ...base.timing,
      score: 100,
      candidates: base.timing.candidates.map((c, i) =>
        i === 0 ? { ...c, score: 100, date: '2026-08-18' } : c
      ),
    },
    confidence: { value: 68, precision_level: 'L3', penalties: [] },
    drivers: {
      items: [
        {
          id: 'a',
          label: 'Visibility',
          contribution: 3.2,
          polarity: 'supportive',
          importance: 'high',
          score: 3.2,
          band: 'high',
          support: 'Presentation timing is supportive.',
          friction: '',
        },
        {
          id: 'b',
          label: 'Pace',
          contribution: -1.4,
          polarity: 'cautionary',
          importance: 'medium',
          score: 1.4,
          band: 'low',
          support: '',
          friction: 'Pace may feel compressed.',
        },
        {
          id: 'c',
          label: 'Structure',
          contribution: -0.9,
          polarity: 'cautionary',
          importance: 'low',
          score: 0.9,
          band: 'low',
          support: '',
          friction: 'Extra structure helps.',
        },
        {
          id: 'd',
          label: 'Clarity',
          contribution: -1.1,
          polarity: 'cautionary',
          importance: 'medium',
          score: 1.1,
          band: 'low',
          support: '',
          friction: 'Clarify the ask early.',
        },
      ],
    },
    explainability: {
      ...base.explainability,
      limits: [
        'Meeting timing only — not fundraising probability or meeting success.',
      ],
    },
  };
}

describe('Result UX browser-equivalent smoke', () => {
  it('A: Investor EVALUATE in Persian — honest score, separate confidence, distinct caution', () => {
    const copy = getAskProductCopy('fa');
    render(
      <DecisionPackageView
        package={investorFaPackage()}
        dqStatus="pass"
        lang="fa"
      />
    );
    const root = screen.getByTestId('evaluate-product-result');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(screen.getByTestId('result-score').textContent).toContain(
      copy.timingScoreLabel
    );
    expect(screen.getByTestId('result-confidence')).toBeTruthy();
    expect(screen.getByTestId('result-recommendation')).toBeTruthy();
    expect(screen.getByTestId('result-limits')).toBeTruthy();
    const caution = screen.getAllByTestId('result-caution-item').map((el) => el.textContent);
    expect(caution.length).toBeGreaterThanOrEqual(2);
    expect(new Set(caution).size).toBe(caution.length);
    const claimSurface = [
      screen.getByTestId('result-recommendation').textContent,
      screen.getByTestId('result-meaning').textContent,
      screen.getByTestId('result-verdict').textContent,
    ].join(' ');
    expect(claimSurface).not.toMatch(/will invest|guaranteed investment|meeting success/i);
  });

  it('B: Wedding COMPARE localized with honest tie', () => {
    const copy = getAskProductCopy('fa');
    const pkg = investorFaPackage();
    const tied: DecisionEvaluationPackage = {
      ...pkg,
      decision_type_id: 'mar-wedding-date',
      family_id: 'timing_opt',
      mode: 'compare_dates',
      engine_id: 'decision-engine-wedding-date-v1',
      recommendation: {
        stance: 'no_unique_winner',
        conditions: [],
        summary: 'No uniquely preferred wedding date.',
      },
      timing: {
        material: true,
        band: 'high',
        score: 70,
        candidates: [
          {
            date: '2026-09-18',
            rank: 1,
            score: 70,
            band: 'high',
            option_id: 'late',
            label: 'Late weekend',
          },
          {
            date: '2026-09-10',
            rank: 1,
            score: 70,
            band: 'high',
            option_id: 'early',
            label: 'Early weekend',
          },
        ],
        notes: 'Tied',
      },
      drivers: { items: [] },
      explainability: {
        why: 'Tied',
        why_not: 'No unique winner',
        assumptions: [],
        limits: ['Ceremony timing only — not marriage success.'],
      },
    };
    render(<DecisionPackageView package={tied} dqStatus="pass" lang="fa" />);
    const root = screen.getByTestId('compare-result-view');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(screen.getByTestId('compare-winner').textContent).toBe(
      copy.compareTiedLabel
    );
    expect(screen.getAllByTestId('compare-option')).toHaveLength(2);
    expect(within(root).getByText(copy.compareOptionsLabel)).toBeTruthy();
  });

  it('C: Product Launch FIND localized without fake best-day language', () => {
    const copy = getAskProductCopy('fa');
    const pkg = investorFaPackage();
    const findPkg: DecisionEvaluationPackage = {
      ...pkg,
      decision_type_id: 'bus-product-launch',
      family_id: 'timing_opt',
      mode: 'find_dates',
      engine_id: 'decision-engine-product-launch-v1',
      timing: {
        material: true,
        band: 'high',
        score: 74,
        candidates: [],
        notes: 'FIND',
      },
      find: {
        range_start: '2026-09-01',
        range_end: '2026-09-30',
        timezone: 'UTC',
        unique_dominant: false,
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
        ],
      },
      drivers: { items: [] },
      explainability: {
        why: 'Comparable',
        why_not: 'No dominant',
        assumptions: [],
        limits: ['Launch timing only — not market demand or revenue.'],
      },
    };
    render(<DecisionPackageView package={findPkg} dqStatus="pass" lang="fa" />);
    const root = screen.getByTestId('find-result-view');
    expect(root.getAttribute('dir')).toBe('rtl');
    expect(screen.getByTestId('find-headline').textContent).toBe(
      copy.findHeadlineComparable
    );
    expect(root.textContent).not.toMatch(/perfect date|destined day|guaranteed best/i);
    expect(screen.getByTestId('find-range')).toBeTruthy();
  });
});
