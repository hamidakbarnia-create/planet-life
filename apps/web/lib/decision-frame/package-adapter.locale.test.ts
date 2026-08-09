import { describe, expect, it } from 'vitest';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import {
  packageToCompareView,
  packageToFindView,
} from './package-adapter';

const FIND_LIMITS = [
  'Relative symbolic launch-day timing only — not business or market intelligence.',
  'Does not predict launch success, revenue, adoption, Product Hunt rank, market demand, PR performance, or team readiness.',
  'launch_object, launch_channel, and brand_or_company did not affect scores.',
  'Hourly clock-time windows were not computed.',
  'Avoid windows were not computed as a primary product.',
] as const;

function findPkg(
  limits: readonly string[] = FIND_LIMITS
): DecisionEvaluationPackage {
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
    find: {
      range_start: '2026-09-01',
      range_end: '2026-09-04',
      timezone: 'UTC',
      unique_dominant: false,
      windows: [
        {
          window_id: 'w1',
          start_date: '2026-09-01',
          end_date: '2026-09-04',
          peak_dates: ['2026-09-02'],
          peak_score: 74,
          band: 'high',
          rank: 1,
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
      why: 'Windows exceed the eligibility threshold.',
      why_not: 'No uniquely dominant window.',
      assumptions: [],
      limits: [...limits],
    },
    improve_accuracy: { items: [] },
    next_decisions: { items: [] },
    related_decisions: { items: [] },
  };
}

function comparePkg(): DecisionEvaluationPackage {
  return {
    ...findPkg([
      'Ceremony timing comparison only — not relationship quality or wedding success.',
    ]),
    decision_type_id: 'mar-wedding-date',
    mode: 'compare_dates',
    find: undefined,
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
        },
        {
          date: '2026-09-10',
          rank: 2,
          score: 61,
          band: 'moderate',
          option_id: 'early',
          label: 'Early weekend',
        },
      ],
      notes: 'Candidates ranked by wedding_date ceremony timing score.',
    },
    explainability: {
      why: 'Late weekend ranks first.',
      why_not: 'Lower-ranked dates are weaker.',
      assumptions: [],
      limits: [
        'Ceremony timing comparison only — not relationship quality or wedding success.',
      ],
    },
  };
}

describe('package adapter Result localization', () => {
  it('EN FIND keeps English known limits and localized Gregorian dates', () => {
    const model = packageToFindView(findPkg(), 'en');
    expect(model.limitations?.[0]).toBe(FIND_LIMITS[0]);
    expect(model.range_context).toMatch(/Sep|9/);
    expect(model.windows[0]?.range_label).toMatch(/Sep|9/);
    expect(model.windows[0]?.start_date).toBe('2026-09-01');
    expect(model.windows[0]?.end_date).toBe('2026-09-04');
    expect(model.range_start).toBe('2026-09-01');
    expect(model.range_end).toBe('2026-09-04');
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    '%s FIND omits English canonical limit bodies and keeps ISO order',
    (lang) => {
      const model = packageToFindView(findPkg(), lang);
      const text = JSON.stringify(model.limitations ?? []);
      for (const english of FIND_LIMITS.slice(0, 4)) {
        expect(text).not.toContain(english);
      }
      expect(model.limitations?.length).toBeGreaterThan(0);
      expect(model.windows[0]?.start_date < model.windows[0]!.end_date).toBe(
        true
      );
      expect(model.range_start! < model.range_end!).toBe(true);
      // Atomic range — not the fragmented RTL English month pattern.
      expect(model.windows[0]?.range_label).not.toMatch(
        /Sep\s*[–-]\s*\d+\s*Sep/i
      );
      expect(model.range_context).not.toMatch(/Sep\s*[–-]\s*\d+\s*Sep/i);
    }
  );

  it('unknown limits are honest (EN passthrough, non-EN omit)', () => {
    const unknown = 'Completely unrecognized engine prose for limits.';
    const en = packageToFindView(findPkg([unknown, FIND_LIMITS[0]]), 'en');
    expect(en.limitations).toContain(unknown);
    const fa = packageToFindView(findPkg([unknown, FIND_LIMITS[0]]), 'fa');
    expect(fa.limitations).not.toContain(unknown);
    expect(fa.limitations?.some((l) => l.includes('زمان'))).toBe(true);
  });

  it('COMPARE uses the same semantic limit localization path', () => {
    const fa = packageToCompareView(comparePkg(), 'fa');
    expect(fa.limitations?.[0]).toBeTruthy();
    expect(fa.limitations?.[0]).not.toBe(
      'Ceremony timing comparison only — not relationship quality or wedding success.'
    );
    expect(fa.options[0]?.date).toBe('2026-09-18');
    expect(fa.options[1]?.date).toBe('2026-09-10');
  });

  it('COMPARE keeps canonical ISO dates and separate locale display labels', () => {
    const en = packageToCompareView(comparePkg(), 'en');
    expect(en.options[0]?.date).toBe('2026-09-18');
    expect(en.options[1]?.date).toBe('2026-09-10');
    expect(en.options[0]?.date_label).toBeTruthy();
    expect(en.options[0]?.date_label).not.toBe(en.options[0]?.date);
    expect(en.options[0]?.date_label).toMatch(/Sep|9|2026/);

    for (const lang of ['fa', 'ar', 'ru'] as const) {
      const model = packageToCompareView(comparePkg(), lang);
      expect(model.options[0]?.date).toBe('2026-09-18');
      expect(model.options[1]?.date).toBe('2026-09-10');
      expect(model.options[0]?.date_label).toBeTruthy();
      expect(model.options[0]?.date_label).not.toBe('2026-09-18');
      expect(model.options[0]?.date_label).not.toMatch(
        /Sep\s*[–-]\s*\d+\s*Sep/i
      );
      // Localized display must differ from English for non-EN locales.
      expect(model.options[0]?.date_label).not.toBe(en.options[0]?.date_label);
    }
  });
});
