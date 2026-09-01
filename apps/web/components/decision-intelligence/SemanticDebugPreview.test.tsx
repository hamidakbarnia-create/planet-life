import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { CalendarDayCell } from '@/components/calendar/CalendarDayCell';
import { CalendarSelectedDayInsight } from '@/components/calendar/CalendarSelectedDayInsight';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { SemanticDebugPreview } from '@/components/decision-intelligence/SemanticDebugPreview';
import { PackageSemanticPreview } from '@/components/decision-intelligence/PackageSemanticPreview';
import { CALENDAR_PAGE_LANGS } from '@/lib/calendar-page-i18n';
import {
  PREVIEW_MATRIX,
  TRADEOFF_LABELS,
} from '@/lib/decision-intelligence/preview-fixtures';
import { renderSemanticExplanation } from '@/lib/decision-intelligence/semantic-render';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { ScoreReasoning } from '@/lib/score-reasoning';

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

function labels() {
  const t = CALENDAR_PAGE_LANGS.en;
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

const REASONING: ScoreReasoning = {
  summary: 'Producer summary for this day.',
  confidence: 0.5,
  reasons: [],
};

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
      summary: 'Prefer Late weekend.',
    },
    timing: {
      material: true,
      band: 'high',
      score: 81,
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
      notes: '',
    },
    confidence: { value: 60, precision_level: 'L3', penalties: [] },
    evidence: { items: [] },
    drivers: { items: [] },
    tradeoffs: { items: [] },
    risks: { items: [] },
    opportunities: { items: [] },
    action_plan: { steps: [] },
    counter_recommendation: {
      stance: 'proceed_with_conditions',
      summary: '',
      reason: '',
    },
    explainability: { why: '', why_not: '', assumptions: [], limits: [] },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [
        {
          option_id: 'a',
          score: 81,
          dimension_classification: { day_class: 'selective' },
        },
        {
          option_id: 'b',
          score: 70,
          dimension_classification: { day_class: 'action' },
        },
      ],
      explanations: [PREVIEW_MATRIX.tradeoff],
      policy_pairs: [{ relation: 'material_tradeoff' }],
    },
  };
}

function findPackage(): DecisionEvaluationPackage {
  const base = comparePackage();
  return {
    ...base,
    mode: 'find_dates',
    find: {
      range_start: '2026-09-01',
      range_end: '2026-09-30',
      timezone: 'UTC',
      unique_dominant: false,
      windows: [
        {
          window_id: 'w-mixed',
          start_date: '2026-09-01',
          end_date: '2026-09-02',
          peak_dates: ['2026-09-01'],
          peak_score: 72,
          band: 'high',
          rank: 1,
        },
        {
          window_id: 'w-clean',
          start_date: '2026-09-04',
          end_date: '2026-09-04',
          peak_dates: ['2026-09-04'],
          peak_score: 75,
          band: 'high',
          rank: 2,
        },
      ],
    },
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [],
      window_policies: [
        {
          window_id: 'w-mixed',
          find_window_kind: 'mixed_posture_window',
          dimension_classes: ['action', 'selective'],
        },
        {
          window_id: 'w-clean',
          find_window_kind: 'clean_forward_window',
          dimension_classes: ['action'],
        },
      ],
      window_explanations: [
        {
          ...PREVIEW_MATRIX.mixedWindow,
          localization_args: { window_id: 'w-mixed' },
        },
        {
          ...PREVIEW_MATRIX.cleanWindow,
          localization_args: { window_id: 'w-clean' },
        },
      ],
    },
  };
}

describe('Phase 3F2 semantic preview', () => {
  it('A: flag OFF => no preview on Calendar or Package', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labels()}
        reasoning={REASONING}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={80}
      />
    );
    expect(screen.queryByTestId('semantic-debug-preview')).toBeNull();
    expect(screen.queryByTestId('calendar-semantic-compare')).toBeNull();
    cleanup();
    render(
      <DecisionPackageView package={comparePackage()} dqStatus="pass" lang="en" />
    );
    expect(screen.queryByTestId('semantic-debug-preview')).toBeNull();
    expect(screen.queryByTestId('package-semantic-preview')).toBeNull();
    expect(screen.getByTestId('compare-winner').textContent).toContain('Option A');
  });

  it('B: preview ON renders semantic output on Calendar detail', () => {
    render(
      <CalendarSelectedDayInsight
        lang="en"
        labels={labels()}
        reasoning={REASONING}
        transit={[]}
        transitMeta={{}}
        loadingTransit={false}
        score={80}
        forcePreview
        dayIntelligence={{
          finalScore: 80,
          dayClass: 'supportive',
          conflict: false,
          rating: 'Favorable',
          materialSupportiveCount: 1,
          materialCautionCount: 0,
          basis: 'test',
          evidence: [],
          actionType: 'business_launch',
          dominantAspects: [],
          scoringContext: {},
          dimensions: null,
          dimensionClassification: { day_class: 'action' },
          explanation: PREVIEW_MATRIX.strongAction,
          policy: { evaluate_interpretation: 'strong_and_clean' },
        }}
      />
    );
    expect(screen.getByTestId('calendar-semantic-compare')).toBeTruthy();
    expect(screen.getByTestId('calendar-current-score').textContent).toContain('80');
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'Strong timing'
    );
  });

  it('B2: preview component ON renders semantic output', () => {
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.strongAction}
        score={80}
        posture="action"
      />
    );
    expect(screen.getByTestId('semantic-debug-preview')).toBeTruthy();
    expect(screen.getByTestId('semantic-debug-headline').textContent).toBe(
      'Strong timing with supportive execution conditions.'
    );
    expect(screen.getByTestId('semantic-debug-banner').textContent).toMatch(
      /EXPERIMENTAL/
    );
  });

  it('C: Calendar cell unchanged even when preview is forced', () => {
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
    expect(screen.queryByTestId('semantic-debug-preview')).toBeNull();
    const cellSource = readFileSync(
      resolve(__dirname, '../calendar/CalendarDayCell.tsx'),
      'utf8'
    );
    expect(cellSource).not.toContain('SemanticDebugPreview');
    expect(cellSource).not.toContain('dayIntelligence');
  });

  it('D: Compare ordering unchanged when preview is shown', () => {
    render(
      <DecisionPackageView package={comparePackage()} dqStatus="pass" lang="en" />
    );
    const options = screen.getAllByTestId('compare-option');
    expect(options[0].getAttribute('data-rank')).toBe('1');
    expect(options[0].getAttribute('data-option-id')).toBe('a');
    expect(options[1].getAttribute('data-rank')).toBe('2');
    cleanup();
    render(
      <PackageSemanticPreview package={comparePackage()} lang="en" forceEnabled />
    );
    const previewOptions = screen.getAllByTestId('semantic-compare-option');
    expect(previewOptions[0].getAttribute('data-rank')).toBe('1');
    expect(previewOptions[1].getAttribute('data-rank')).toBe('2');
    expect(previewOptions[0].textContent).toContain('81');
    expect(screen.getByText(/Legacy ranking unchanged/)).toBeTruthy();
  });

  it('E: Find window membership/order unchanged', () => {
    render(<PackageSemanticPreview package={findPackage()} lang="en" forceEnabled />);
    const windows = screen.getAllByTestId('semantic-find-window');
    expect(windows).toHaveLength(2);
    expect(windows[0].getAttribute('data-window-id')).toBe('w-mixed');
    expect(windows[1].getAttribute('data-window-id')).toBe('w-clean');
    expect(screen.getByText(/mixed_posture_window/)).toBeTruthy();
    expect(screen.getByText(/ACTION → SELECTIVE/i)).toBeTruthy();
  });

  it('F: renderer catalogs used; no duplicate semantic strings in preview chrome', () => {
    const component = readFileSync(
      resolve(__dirname, './SemanticDebugPreview.tsx'),
      'utf8'
    );
    const chrome = readFileSync(
      resolve(__dirname, '../../lib/decision-intelligence/preview-copy.ts'),
      'utf8'
    );
    expect(component).toContain('renderSemanticExplanation');
    expect(component).not.toContain('Strong timing with supportive');
    expect(chrome).not.toContain('semantic.strong_clean');
    expect(chrome).not.toContain('Option A has stronger timing');
  });

  it('G/H: EN/FA/AR/RU render and FA/AR are RTL', () => {
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.tradeoff}
        displayContext={TRADEOFF_LABELS}
      />
    );
    expect(screen.getByTestId('semantic-debug-preview').getAttribute('dir')).toBe(
      'ltr'
    );
    fireEvent.click(screen.getByTestId('semantic-locale-fa'));
    expect(screen.getByTestId('semantic-debug-preview').getAttribute('dir')).toBe(
      'rtl'
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'بده‌بستان'
    );
    fireEvent.click(screen.getByTestId('semantic-locale-ar'));
    expect(screen.getByTestId('semantic-debug-preview').getAttribute('dir')).toBe(
      'rtl'
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'مقايضة'
    );
    fireEvent.click(screen.getByTestId('semantic-locale-ru'));
    expect(screen.getByTestId('semantic-debug-preview').getAttribute('dir')).toBe(
      'ltr'
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'компромисс'
    );
  });

  it('I: tradeoff does not present a new winner', () => {
    const rendered = renderSemanticExplanation(
      PREVIEW_MATRIX.tradeoff,
      'en',
      TRADEOFF_LABELS
    );
    expect(rendered.headline).toContain('trade-off rather than a clear winner');
    expect(rendered.headline?.toLowerCase()).not.toContain('definitely better');
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.tradeoff}
        displayContext={TRADEOFF_LABELS}
      />
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'Option A has stronger timing'
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toContain(
      'Option B offers cleaner execution'
    );
  });

  it('J: insufficient renders as insufficient', () => {
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.insufficient}
        posture="insufficient"
      />
    );
    expect(screen.getByTestId('semantic-debug-headline').textContent).toMatch(
      /Not enough evidence/
    );
    expect(screen.getByTestId('semantic-debug-copy-scan').textContent).not.toContain(
      'neutral'
    );
  });

  it('K: safety shown only when safety codes exist', () => {
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.elevatedInterview}
        riskLevel="elevated"
      />
    );
    expect(screen.queryByTestId('semantic-debug-safety')).toBeNull();
    cleanup();
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.highStakes}
        riskLevel="high_stakes"
      />
    );
    expect(screen.getByTestId('semantic-debug-safety').textContent).toContain(
      'Timing signals cannot determine the factual outcome'
    );
  });

  it('L: debug unavailable state works', () => {
    render(<SemanticDebugPreview forceEnabled locale="en" />);
    expect(screen.getByTestId('semantic-debug-unavailable')).toBeTruthy();
    cleanup();
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={{
          headline_code: 'semantic.material_tradeoff',
          summary_code: 'semantic.material_tradeoff',
          opportunity_code: 'semantic.higher_score_stronger_opportunity',
          posture_code: 'semantic.lower_score_cleaner_posture',
          localization_args: {},
        }}
        locale="en"
      />
    );
    expect(screen.getByTestId('semantic-debug-unavailable').textContent).toContain(
      'unavailable'
    );
  });

  it('M: no command / ACT / VERIFY / WAIT', () => {
    render(
      <SemanticDebugPreview
        forceEnabled
        explanation={PREVIEW_MATRIX.strongAction}
      />
    );
    const text = screen.getByTestId('semantic-debug-preview').textContent ?? '';
    expect(text).not.toMatch(/\bACT\b/);
    expect(text).not.toMatch(/\bVERIFY\b/);
    expect(text).not.toMatch(/\bWAIT\b/);
    expect(text.toLowerCase()).not.toContain('command');
    expect(JSON.stringify(PREVIEW_MATRIX.strongAction)).not.toContain('command');
  });
});
