/**
 * car-interview FIND Result UX + visual acceptance (EN/FA/RU).
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { getAskProductCopy } from '@/lib/ask-product';

afterEach(() => cleanup());

const INTERVIEW_FIND_LIMIT =
  'Interview-date communication/visibility timing scan only — not hiring outcome, job offer, salary, interview performance certainty, employer decision, or career success.';

function interviewFindPackage(overrides?: {
  unique_dominant?: boolean;
  windows?: DecisionEvaluationPackage['find'];
}): DecisionEvaluationPackage {
  const unique = overrides?.unique_dominant ?? true;
  return {
    case_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    evaluation_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    evaluation_version: 1,
    case_version: 2,
    decision_type_id: 'car-interview',
    family_id: 'visibility',
    mode: 'find_dates',
    precision_level: 'L3',
    engine_id: 'decision-engine-car-interview-v1',
    created_at: '2026-08-08T08:00:00Z',
    schema_version: '1.0.0',
    recommendation: {
      stance: unique ? 'proceed_with_conditions' : 'no_unique_winner',
      conditions: [],
      summary: unique
        ? 'Stronger interview timing window 2026-09-08–2026-09-10 for this role.'
        : 'Comparable interview timing windows.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 78,
      candidates: [],
      notes: 'FIND windows ranked by interview-day timing.',
    },
    find: overrides?.windows ?? {
      range_start: '2026-09-01',
      range_end: '2026-09-30',
      timezone: 'UTC',
      unique_dominant: unique,
      windows: [
        {
          window_id: 'w1',
          start_date: '2026-09-08',
          end_date: '2026-09-10',
          peak_dates: ['2026-09-09'],
          peak_score: 78,
          band: 'high',
          rank: 1,
        },
        {
          window_id: 'w2',
          start_date: '2026-09-20',
          end_date: '2026-09-22',
          peak_dates: ['2026-09-21'],
          peak_score: unique ? 71 : 77,
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
      stance: 'wait',
      summary: '',
      reason: 'Logistics may still decide.',
    },
    explainability: {
      why: 'Windows ranked under identical natal evidence.',
      why_not: 'Other days weaker.',
      assumptions: [],
      limits: [
        INTERVIEW_FIND_LIMIT,
        'Role, company, and interview type did not affect the numeric scores.',
        'Hourly clock-time windows were not computed.',
      ],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

describe('DecisionPackageView car-interview FIND visual acceptance', () => {
  it.each(['en', 'fa', 'ru'] as const)(
    'localizes %s interview FIND without EN leakage or schema ids',
    (lang) => {
      const copy = getAskProductCopy(lang);
      render(
        <DecisionPackageView
          package={interviewFindPackage()}
          dqStatus="pass"
          lang={lang}
        />
      );
      const root = screen.getByTestId('find-result-view');
      expect(root.getAttribute('dir')).toBe(copy.dir);
      expect(screen.getByTestId('find-headline').textContent).toBe(
        copy.findInterviewHeadlineDominant
      );
      expect(screen.getByTestId('find-honesty').textContent).toBe(
        copy.findInterviewHonestyDominant
      );
      expect(screen.getAllByTestId('find-window')).toHaveLength(2);
      expect(screen.getByTestId('result-date-primary')).toBeTruthy();
      const text = root.textContent ?? '';
      expect(text).toContain(copy.resultWhy);
      expect(text).toContain(copy.limitsLabel);
      expect(text).toContain(copy.agencyLine);
      const claimSurface = [
        screen.getByTestId('find-headline').textContent ?? '',
        screen.getByTestId('find-honesty').textContent ?? '',
        ...screen.getAllByTestId('find-window').map((n) => n.textContent ?? ''),
      ].join(' ');
      expect(claimSurface).not.toMatch(
        /job offer|hiring probability|guaranteed interview|salary outcome|career success|most likely to get you hired/i
      );
      expect(text).not.toMatch(
        /launch_object|interview_type|job_interview|find_dates|natal_evidence|decision_frame/
      );
      if (lang === 'en') {
        expect(text).toContain(INTERVIEW_FIND_LIMIT);
        expect(screen.getByTestId('find-headline').textContent).toBe(
          'Strongest interview window'
        );
      } else {
        expect(text).not.toContain(INTERVIEW_FIND_LIMIT);
        expect(text).not.toContain('Strongest interview window');
        expect(text).not.toContain('Comparable windows');
        expect(text).not.toContain('Timing windows');
        expect(screen.getByTestId('find-headline').textContent).not.toMatch(
          /[A-Za-z]{4,}/
        );
        expect(screen.getByTestId('find-honesty').textContent).not.toMatch(
          /[A-Za-z]{4,}/
        );
        const limits = within(root).getByTestId('find-limits').textContent ?? '';
        expect(limits).not.toMatch(/\b[a-z]+(?:_[a-z0-9]+)+\b/);
      }
    }
  );

  it('renders tie and no-window states with prominent honest answers', () => {
    const copy = getAskProductCopy('en');
    const { rerender } = render(
      <DecisionPackageView
        package={interviewFindPackage({ unique_dominant: false })}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('find-headline').textContent).toBe(
      copy.findInterviewHeadlineComparable
    );

    rerender(
      <DecisionPackageView
        package={interviewFindPackage({
          windows: {
            range_start: '2026-09-01',
            range_end: '2026-09-30',
            timezone: 'UTC',
            unique_dominant: false,
            windows: [],
          },
        })}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('find-windows-empty').textContent).toBe(
      copy.findInterviewWindowsEmpty
    );
    expect(screen.getByTestId('find-headline').textContent).toBe(
      copy.findInterviewHeadlineNone
    );
  });

  it('FA RTL interview FIND keeps score below window range', () => {
    const copy = getAskProductCopy('fa');
    render(
      <DecisionPackageView
        package={interviewFindPackage()}
        dqStatus="pass"
        lang="fa"
      />
    );
    const root = screen.getByTestId('find-result-view');
    expect(root.getAttribute('dir')).toBe('rtl');
    const window = screen.getAllByTestId('find-window')[0];
    const range = within(window).getByTestId('find-window-range');
    const score = within(window).getByTestId('find-window-score');
    expect(
      range.compareDocumentPosition(score) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.getByTestId('find-headline').textContent).toBe(
      copy.findInterviewHeadlineDominant
    );
    // Localized Jalali-primary dates (not English month names).
    expect(range.textContent ?? '').not.toMatch(/Sep|September|2026-09/);
    expect(screen.getByTestId('find-range').textContent ?? '').not.toMatch(
      /Sep|September|2026-09/
    );
    expect(score.textContent ?? '').toContain(copy.timingScoreOf(78));
  });

  it('RU interview FIND hierarchy keeps recommendation before windows/why/limits', () => {
    const copy = getAskProductCopy('ru');
    render(
      <DecisionPackageView
        package={interviewFindPackage()}
        dqStatus="pass"
        lang="ru"
      />
    );
    const root = screen.getByTestId('find-result-view');
    const text = root.textContent ?? '';
    const headline = screen.getByTestId('find-headline');
    const windows = screen.getByTestId('find-windows');
    const why = screen.getByTestId('find-honesty');
    const limits = screen.getByTestId('find-limits');
    expect(
      headline.compareDocumentPosition(windows) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      windows.compareDocumentPosition(why) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      why.compareDocumentPosition(limits) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(text).toContain(copy.resultConfidence);
    expect(text).toContain(copy.findRangeLabel);
    expect(text).not.toContain('Strongest interview window');
    expect(text).not.toContain('Timing score:');
  });
});
