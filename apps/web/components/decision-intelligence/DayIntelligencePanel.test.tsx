import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { CalendarSelectedDayInsight } from '@/components/calendar/CalendarSelectedDayInsight';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { DayIntelligencePanel } from '@/components/decision-intelligence/DayIntelligencePanel';
import { SemanticDebugPreview } from '@/components/decision-intelligence/SemanticDebugPreview';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { CalendarDayIntelligence } from '@/lib/calendar-scores';
import {
  buildDayIntelligenceView,
} from '@/lib/decision-intelligence/day-intelligence-view';
import { PREVIEW_MATRIX } from '@/lib/decision-intelligence/preview-fixtures';
import { DAY_INTELLIGENCE_CHROME } from '@/lib/decision-intelligence/product-copy';
import type { SemanticExplanationInput } from '@/lib/decision-intelligence/types';
import type { SemanticPreviewLocale } from '@/lib/decision-intelligence/types';

afterEach(() => {
  cleanup();
});

const SUPPORT_CODES = [
  'semantic.high_momentum',
  'semantic.high_opportunity',
  'semantic.high_stability',
] as const;
const CAUTION_CODES = [
  'semantic.low_clarity',
  'semantic.high_pressure',
  'semantic.low_cooperation',
] as const;

const INTERNAL_LEAK = /experimental_shadow|semantic\.\w+|classifier_version|dimension_class\.v3|classification_coverage|policy_version|evidence_id|material_tradeoff|% chance|% success|% good|81% chance/i;

function withSignals(
  base: SemanticExplanationInput,
  extra: Partial<SemanticExplanationInput> = {}
): SemanticExplanationInput {
  return {
    ...base,
    support_codes: extra.support_codes ?? SUPPORT_CODES.slice(0, 2),
    caution_codes: extra.caution_codes ?? CAUTION_CODES.slice(0, 2),
    ...extra,
  };
}

function labelsFor(lang: 'en' | 'fa' | 'ar' | 'ru') {
  const t = CALENDAR_PAGE_LANGS[lang];
  return {
    dir: t.dir,
    loading: t.loading,
    whyTiming: t.whyTiming,
    whyTimingFallback: t.whyTimingFallback,
    supportingReasons: t.supportingReasons,
    seeDetails: t.seeDetails,
    hideDetails: t.hideDetails,
    advancedDetails: t.advancedDetails,
    transit: t.transit,
    signs: t.signs,
    planets: t.planets,
  };
}

function dayIntelligence(
  explanation: SemanticExplanationInput,
  posture: string,
  score: number
): CalendarDayIntelligence {
  return {
    finalScore: score,
    dayClass: 'supportive',
    conflict: false,
    rating: 'Favorable',
    materialSupportiveCount: 1,
    materialCautionCount: 0,
    basis: 'test',
    evidence: [{ id: 'ev_hidden_1' }],
    actionType: 'business_launch',
    dominantAspects: [],
    scoringContext: {},
    dimensions: null,
    dimensionClassification: {
      day_class: posture,
      classifier_version: 'dimension_class.v3-shadow',
      semantic_status: 'experimental_shadow',
    },
    explanation: {
      ...explanation,
      evidence_refs: [
        {
          code: 'semantic.high_momentum',
          role: 'support',
          dimension_id: 'momentum',
          evidence_ids: ['ev_hidden_1'],
        },
      ],
    },
    policy: { policy_version: 'semantic_policy.v1-shadow' },
  };
}

function evaluatePackage(input: {
  explanation: SemanticExplanationInput;
  posture: string;
  score: number;
  stance?: DecisionEvaluationPackage['recommendation']['stance'];
}): DecisionEvaluationPackage {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Engineer' },
  });
  return {
    ...base,
    engine_id: 'decision-engine-car-interview-v1',
    recommendation: {
      ...base.recommendation,
      stance: input.stance ?? 'proceed',
    },
    timing: {
      ...base.timing,
      score: input.score,
      candidates: base.timing.candidates.map((candidate, index) =>
        index === 0 ? { ...candidate, score: input.score } : candidate
      ),
    },
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [
        {
          score: input.score,
          dimension_classification: { day_class: input.posture },
        },
      ],
      explanation: input.explanation,
    },
  };
}

function comparePackage(): DecisionEvaluationPackage {
  const base = evaluatePackage({
    explanation: PREVIEW_MATRIX.tradeoff,
    posture: 'selective',
    score: 81,
  });
  return {
    ...base,
    mode: 'compare_dates',
    decision_type_id: 'mar-wedding-date',
    engine_id: 'decision-engine-wedding-date-v1',
    recommendation: {
      stance: 'proceed_with_conditions',
      conditions: [],
      summary: 'Prefer Option A.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 81,
      notes: '',
      candidates: [
        {
          date: '2026-09-10',
          rank: 1,
          score: 81,
          band: 'high',
          option_id: 'a',
          label: 'Option A',
        },
        {
          date: '2026-09-12',
          rank: 2,
          score: 70,
          band: 'high',
          option_id: 'b',
          label: 'Option B',
        },
      ],
    },
  };
}

function findPackage(): DecisionEvaluationPackage {
  const base = comparePackage();
  return {
    ...base,
    mode: 'find_dates',
    decision_type_id: 'bus-product-launch',
    engine_id: 'decision-engine-product-launch-v1',
    find: {
      range_start: '2026-09-01',
      range_end: '2026-09-30',
      timezone: 'UTC',
      unique_dominant: false,
      windows: [
        {
          window_id: 'w-clean',
          start_date: '2026-09-04',
          end_date: '2026-09-04',
          peak_dates: ['2026-09-04'],
          peak_score: 75,
          band: 'high',
          rank: 1,
        },
      ],
    },
  };
}

function assertProductContract(root: HTMLElement) {
  const text = root.textContent ?? '';
  expect(text).not.toMatch(INTERNAL_LEAK);
  expect(text).not.toContain('EXPERIMENTAL');
  expect(text).not.toContain('debug');
  expect(screen.queryByTestId('semantic-debug-preview')).toBeNull();
  expect(screen.queryByTestId('semantic-debug-banner')).toBeNull();
  expect(screen.queryByTestId('day-intelligence-why')).toBeNull();
}

describe('Phase 4A product day intelligence', () => {
  it('A: Calendar cells stay percent-scored and do not consume semantics', () => {
    render(
      <CalendarDayCell
        date="2026-08-06"
        lang="en"
        calendar="gregorian"
        score={92}
        inCurrentMonth
        selected
        isToday={false}
        dir="ltr"
        onClick={() => undefined}
      />
    );
    expect(document.querySelector('[data-cell-score]')?.textContent).toBe('92%');
    expect(screen.queryByTestId('day-intelligence-panel')).toBeNull();
    const cellSource = readFileSync(
      resolve(__dirname, '../calendar/CalendarDayCell.tsx'),
      'utf8'
    );
    expect(cellSource).not.toContain('DayIntelligencePanel');
    expect(cellSource).not.toContain('dayIntelligence');
    expect(cellSource).toContain('formatReadinessPercent(score)');
  });

  it('B: selected day renders product intelligence without debug chrome', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={80}
        dayIntelligence={dayIntelligence(
          withSignals(PREVIEW_MATRIX.strongAction),
          'action',
          80
        )}
      />
    );
    const panel = screen.getByTestId('day-intelligence-panel');
    expect(screen.getByTestId('calendar-day-intelligence')).toBeTruthy();
    expect(screen.getByTestId('day-intelligence-beta').textContent).toBe(
      'Decision Intelligence — Beta'
    );
    expect(screen.getByTestId('day-intelligence-headline').textContent).toBe(
      'Strong timing with supportive execution conditions.'
    );
    expect(screen.getByTestId('day-intelligence-interpretation').textContent).toBe(
      'Conditions support moving forward.'
    );
    expect(screen.getByTestId('day-intelligence-score').textContent).toContain(
      '80 / 100'
    );
    expect(screen.getByTestId('day-intelligence-supports').querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByTestId('day-intelligence-watch').querySelectorAll('li')).toHaveLength(2);
    expect(screen.queryByTestId('calendar-semantic-compare')).toBeNull();
    assertProductContract(panel);
  });

  it('C: Evaluate renders the same contract under the existing package result', () => {
    render(
      <DecisionPackageView
        package={evaluatePackage({
          explanation: withSignals(PREVIEW_MATRIX.strongSelective),
          posture: 'selective',
          score: 81,
          stance: 'proceed',
        })}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('evaluate-product-result')).toBeTruthy();
    expect(screen.getByTestId('evaluate-day-intelligence')).toBeTruthy();
    expect(screen.getByTestId('day-intelligence-headline').textContent).toBe(
      'Opportunity is strong, but act selectively.'
    );
    expect(screen.getByTestId('day-intelligence-score').textContent).toContain(
      '81 / 100'
    );
    expect(screen.getByTestId('day-intelligence-beta').textContent).toBe(
      'Decision Intelligence — Beta'
    );
    expect(screen.getByTestId('result-recommendation')).toBeTruthy();
    assertProductContract(screen.getByTestId('day-intelligence-panel'));
  });

  it('D: max 2 supports and 2 cautions even when more codes exist', () => {
    const view = buildDayIntelligenceView({
      explanation: withSignals(PREVIEW_MATRIX.strongAction, {
        support_codes: [...SUPPORT_CODES],
        caution_codes: [...CAUTION_CODES],
      }),
      locale: 'en',
      score: 80,
      posture: 'action',
    });
    render(<DayIntelligencePanel view={view!} />);
    expect(screen.getByTestId('day-intelligence-supports').querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByTestId('day-intelligence-watch').querySelectorAll('li')).toHaveLength(2);
    expect(screen.getByTestId('day-intelligence-supports').textContent).toContain(
      'Momentum is stronger.'
    );
    expect(screen.getByTestId('day-intelligence-supports').textContent).not.toContain(
      'Conditions are more stable.'
    );
  });

  it('E: product panel does not leak raw enums, codes, or versions', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={81}
        dayIntelligence={dayIntelligence(
          withSignals(PREVIEW_MATRIX.strongSelective),
          'selective',
          81
        )}
      />
    );
    const text = screen.getByTestId('day-intelligence-panel').textContent ?? '';
    expect(text).not.toMatch(INTERNAL_LEAK);
    expect(text).not.toContain('ev_hidden_1');
    expect(text).not.toContain('v3-shadow');
    expect(text).not.toContain('high_leverage');
    expect(text).not.toMatch(/\bday_class\b/);
    const panelSource = readFileSync(
      resolve(__dirname, './DayIntelligencePanel.tsx'),
      'utf8'
    );
    expect(panelSource).not.toContain('semantic.strong');
    expect(panelSource).not.toContain('experimental_shadow');
  });

  it('F: score is timing strength, not probability', () => {
    const selectedSource = readFileSync(
      resolve(__dirname, '../calendar/CalendarSelectedDayInsight.tsx'),
      'utf8'
    );
    expect(selectedSource).toContain('formatTimingStrength(score)');
    expect(selectedSource).not.toContain('formatReadinessPercent(score)');
    render(
      <DayIntelligencePanel
        view={
          buildDayIntelligenceView({
            explanation: PREVIEW_MATRIX.strongSelective,
            locale: 'en',
            score: 81,
            posture: 'selective',
          })!
        }
      />
    );
    const score = screen.getByTestId('day-intelligence-score').textContent ?? '';
    expect(score).toContain('Timing strength');
    expect(score).toContain('81 / 100');
    expect(score).not.toContain('%');
    expect(score.toLowerCase()).not.toContain('chance');
    expect(score.toLowerCase()).not.toContain('success');
  });

  it('G: insufficient shows only the catalog sentence', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={70}
        dayIntelligence={dayIntelligence(
          withSignals(PREVIEW_MATRIX.insufficient),
          'insufficient',
          70
        )}
      />
    );
    const panel = screen.getByTestId('day-intelligence-panel');
    expect(panel.getAttribute('data-insufficient')).toBe('true');
    expect(screen.getByTestId('day-intelligence-headline').textContent).toBe(
      'Not enough evidence for a reliable decision posture.'
    );
    expect(screen.queryByTestId('day-intelligence-supports')).toBeNull();
    expect(screen.queryByTestId('day-intelligence-watch')).toBeNull();
    expect(screen.getByTestId('day-intelligence-score').textContent).toContain(
      '70 / 100'
    );
  });

  it('H: mixed is not styled or worded as uniformly bad', () => {
    render(
      <DayIntelligencePanel
        view={
          buildDayIntelligenceView({
            explanation: PREVIEW_MATRIX.mixed,
            locale: 'en',
            score: 70,
            posture: 'mixed',
          })!
        }
      />
    );
    const panel = screen.getByTestId('day-intelligence-panel');
    expect(panel.getAttribute('data-mixed')).toBe('true');
    expect(screen.getByTestId('day-intelligence-headline').textContent).toBe(
      'Signals conflict. This day is not uniformly favorable or unfavorable.'
    );
    expect(screen.getByTestId('day-intelligence-conditions').textContent).toContain(
      'Mixed'
    );
    expect(screen.getByTestId('day-intelligence-bridge').textContent).toMatch(
      /timing strength/i
    );
    expect(panel.className).not.toMatch(/red|danger|amber-300|warning/i);
    expect(panel.textContent?.toLowerCase()).not.toMatch(
      /bad day|danger|avoid this day/
    );
  });

  it('I: safety comes only from renderer output', () => {
    render(
      <DayIntelligencePanel
        view={
          buildDayIntelligenceView({
            explanation: PREVIEW_MATRIX.elevatedInterview,
            locale: 'en',
            score: 80,
            posture: 'action',
          })!
        }
      />
    );
    expect(screen.queryByTestId('day-intelligence-safety')).toBeNull();
    cleanup();
    render(
      <DayIntelligencePanel
        view={
          buildDayIntelligenceView({
            explanation: PREVIEW_MATRIX.highStakes,
            locale: 'en',
            score: 81,
            posture: 'selective',
          })!
        }
      />
    );
    expect(screen.getByTestId('day-intelligence-safety').textContent).toContain(
      'Use timing as a planning aid'
    );
    expect(screen.getByTestId('day-intelligence-safety').textContent).toContain(
      'Timing signals cannot determine the factual outcome'
    );
  });

  it('J/K: EN/FA/AR/RU catalogs and RTL direction', () => {
    const cases: Array<{
      locale: SemanticPreviewLocale;
      dir: 'ltr' | 'rtl';
      headline: string;
    }> = [
      {
        locale: 'en',
        dir: 'ltr',
        headline: 'Opportunity is strong, but act selectively.',
      },
      {
        locale: 'fa',
        dir: 'rtl',
        headline: 'فرصت قوی است، اما گزینشی عمل کنید.',
      },
      {
        locale: 'ar',
        dir: 'rtl',
        headline: 'الفرصة قوية، لكن تصرّف بانتقائية.',
      },
      {
        locale: 'ru',
        dir: 'ltr',
        headline: 'Возможность сильная, но действуйте избирательно.',
      },
    ];
    for (const item of cases) {
      cleanup();
      const view = buildDayIntelligenceView({
        explanation: PREVIEW_MATRIX.strongSelective,
        locale: item.locale,
        score: 81,
        posture: 'selective',
      });
      render(<DayIntelligencePanel view={view!} />);
      const panel = screen.getByTestId('day-intelligence-panel');
      expect(panel.getAttribute('dir')).toBe(item.dir);
      expect(screen.getByTestId('day-intelligence-headline').textContent).toBe(
        item.headline
      );
      expect(screen.getByTestId('day-intelligence-beta').textContent).toBe(
        DAY_INTELLIGENCE_CHROME[item.locale].beta
      );
    }
  });

  it('L: Compare stays on the current ranking surface', () => {
    render(
      <DecisionPackageView
        package={comparePackage()}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('compare-result-view')).toBeTruthy();
    expect(screen.getByTestId('compare-winner').textContent).toContain('Option A');
    expect(screen.queryByTestId('evaluate-day-intelligence')).toBeNull();
    expect(screen.queryByTestId('day-intelligence-panel')).toBeNull();
    expect(screen.queryByTestId('package-semantic-preview')).toBeNull();
  });

  it('M: Find stays on the current window surface', () => {
    render(
      <DecisionPackageView package={findPackage()} dqStatus="pass" lang="en" />
    );
    expect(screen.getByTestId('find-result-view')).toBeTruthy();
    expect(screen.queryByTestId('evaluate-day-intelligence')).toBeNull();
    expect(screen.queryByTestId('day-intelligence-panel')).toBeNull();
    expect(screen.queryByTestId('package-semantic-preview')).toBeNull();
  });

  it('N: debug preview still works independently of the product panel', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={80}
        dayIntelligence={dayIntelligence(PREVIEW_MATRIX.strongAction, 'action', 80)}
      />
    );
    expect(screen.getByTestId('day-intelligence-panel')).toBeTruthy();
    expect(screen.queryByTestId('semantic-debug-preview')).toBeNull();
    cleanup();
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        reasoning={null}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={80}
        forcePreview
        dayIntelligence={dayIntelligence(PREVIEW_MATRIX.strongAction, 'action', 80)}
      />
    );
    expect(screen.getByTestId('day-intelligence-panel')).toBeTruthy();
    expect(screen.getByTestId('calendar-semantic-compare')).toBeTruthy();
    expect(screen.getByTestId('semantic-debug-preview')).toBeTruthy();
    expect(screen.getByTestId('semantic-debug-banner').textContent).toMatch(
      /EXPERIMENTAL/
    );
    cleanup();
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.strongAction}
        score={80}
        posture="action"
      />
    );
    expect(screen.getByTestId('semantic-debug-preview')).toBeTruthy();
  });

  it('retitles Evaluate to Decision conditions when stance and posture disagree', () => {
    render(
      <DecisionPackageView
        package={evaluatePackage({
          explanation: PREVIEW_MATRIX.review,
          posture: 'review',
          score: 70,
          stance: 'proceed',
        })}
        dqStatus="pass"
        lang="en"
      />
    );
    expect(screen.getByTestId('day-intelligence-panel').getAttribute('data-title-kind')).toBe(
      'conditions'
    );
    expect(screen.getByTestId('day-intelligence-beta').textContent).toBe(
      'Decision conditions'
    );
    expect(screen.getByTestId('result-recommendation')).toBeTruthy();
  });

  it('does not show Favorable beside mixed conditions in the default view', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labelsFor('en')}
        dateLabel="Sep 1, 2026"
        selectedEyebrow="Selected day"
        reasoning={{
          summary:
            'Business Launch scores 66/100 (Favorable). 17 supporting factor(s) and 12 caution factor(s) identified from scored chart evidence.',
          confidence: 0.5,
          reasons: [],
        }}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={66}
        dayIntelligence={dayIntelligence(PREVIEW_MATRIX.mixed, 'mixed', 66)}
      />
    );
    expect(screen.getByTestId('calendar-selected-timing-strength').textContent).toContain(
      '66 / 100'
    );
    expect(screen.getByTestId('calendar-selected-conditions').textContent).toContain(
      'Mixed'
    );
    expect(screen.getByTestId('day-intelligence-bridge').textContent).toMatch(
      /not that the number is wrong/i
    );
    expect(screen.queryByTestId('calendar-why-timing-summary')).toBeNull();
    expect(screen.getByTestId('day-intelligence-panel').textContent).not.toContain(
      'Favorable'
    );
    expect(screen.getByTestId('calendar-why-timing-details').textContent).toContain(
      'Favorable'
    );
    expect(screen.queryByTestId('day-intelligence-score')).toBeNull();
  });

  it('selected-day block sits with the month grid, not duplicated below', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../../app/calendar/page.tsx'),
      'utf8'
    );
    expect(pageSource).toContain('data-testid="calendar-selected-day"');
    expect(pageSource.match(/data-calendar-advanced-day/g)?.length).toBe(1);
    expect(pageSource.indexOf('CalendarMonthGrid')).toBeLessThan(
      pageSource.indexOf('calendar-selected-day')
    );
  });
});
