/**
 * Rendered offer-negotiation EVALUATE result.
 *
 * Proves the negotiation-specific panel replaces the generic day-intelligence
 * panel for car-offer-negotiation only, and that other Decision Types keep the
 * generic panel untouched.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';

afterEach(() => cleanup());

const LANGS: readonly AppLang[] = ['en', 'fa', 'ar', 'ru'];

/** Real drivers from the shipped runtime for target 2026-01-01, score 100. */
const REAL_DRIVERS = [
  {
    factor_key: 'aspect.jupiter.trine.moon',
    polarity: 'supportive' as const,
    contribution: 13.22,
  },
  {
    factor_key: 'aspect.venus.sextile.jupiter',
    polarity: 'supportive' as const,
    contribution: 12.71,
  },
  {
    factor_key: 'aspect.jupiter.square.saturn',
    polarity: 'cautionary' as const,
    contribution: -11.72,
  },
  {
    factor_key: 'aspect.mercury.square.mercury',
    polarity: 'cautionary' as const,
    contribution: -9.4,
  },
];

const OFFER_NEGOTIATION_LIMITS = [
  "This is negotiation/communication timing evidence, not a prediction of the employer's decision.",
  'No salary, benefit, or compensation outcome is predicted.',
  'Contract terms were not reviewed for legal validity.',
  'No alternative dates were searched.',
] as const;

function dim(
  value: number,
  evidenceId: string,
  role: 'support' | 'caution'
) {
  const ids = [evidenceId];
  return {
    value,
    status: 'scored' as const,
    evidence_strength: 0.6,
    supportive_evidence_ids: role === 'support' ? ids : [],
    caution_evidence_ids: role === 'caution' ? ids : [],
    dominant_evidence_ids: ids,
    conflicted: false,
  };
}

const INSUFFICIENT_DIM = {
  value: 50,
  status: 'insufficient' as const,
  supportive_evidence_ids: [],
  caution_evidence_ids: [],
  dominant_evidence_ids: [],
};

function evaluatePackage(
  decisionTypeId: string,
  engineId: string
): DecisionEvaluationPackage {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 2,
    intake: { target_date: '2026-01-01' },
  });
  return {
    ...base,
    decision_type_id: decisionTypeId,
    engine_id: engineId,
    mode: 'evaluate_date',
    recommendation: { ...base.recommendation, stance: 'proceed' },
    timing: {
      ...base.timing,
      material: true,
      band: 'high',
      score: 100,
      candidates: base.timing.candidates.map((candidate, index) =>
        index === 0
          ? { ...candidate, score: 100, date: '2026-01-01' }
          : candidate
      ),
    },
    drivers: {
      items: REAL_DRIVERS.map((seed, index) => ({
        id: `driver-${index + 1}`,
        label: `Driver ${index + 1}`,
        contribution: seed.contribution,
        polarity: seed.polarity,
        importance: 'high' as const,
        factor_key: seed.factor_key,
        score: Math.abs(seed.contribution),
        band: seed.polarity === 'cautionary' ? 'low' : 'high',
        support: seed.polarity === 'cautionary' ? '' : 'Supports this activity.',
        friction:
          seed.polarity === 'cautionary' ? 'Challenges this activity.' : '',
      })),
    },
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [{}],
      explanation: {
        headline_code: 'semantic.mixed_conflict',
        support_codes: ['semantic.high_opportunity'],
        caution_codes: ['semantic.same_dimension_conflict'],
      },
    },
  };
}

function offerNegotiationPackage(): DecisionEvaluationPackage {
  const base = evaluatePackage(
    'car-offer-negotiation',
    'decision-engine-offer-negotiation-v1'
  );
  return {
    ...base,
    explainability: {
      ...base.explainability,
      limits: [...OFFER_NEGOTIATION_LIMITS],
    },
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [
        {
          dimensions: {
            mapping_version: 'dimensions.v1-shadow',
            semantic_status: 'experimental_shadow',
            baseline: 50,
            opportunity: INSUFFICIENT_DIM,
            // Jupiter transit may score momentum. Natal Moon is not used.
            momentum: dim(80, 'ev.aspect.jupiter.trine.moon', 'support'),
            clarity: dim(30, 'ev.aspect.mercury.square.mercury', 'caution'),
            stability: INSUFFICIENT_DIM,
            cooperation: dim(74, 'ev.aspect.venus.sextile.jupiter', 'support'),
            pressure: INSUFFICIENT_DIM,
            reversibility_safety: INSUFFICIENT_DIM,
          },
          dimension_classification: {
            scored_dimension_count: 3,
            day_class: 'mixed',
            same_dimension_conflict: true,
            conflicted_dimension_ids: ['cooperation'],
            veto_dimension_ids: [],
          },
        },
      ],
      explanation: {
        headline_code: 'semantic.mixed_conflict',
        support_codes: ['semantic.high_momentum', 'semantic.high_cooperation'],
        caution_codes: [
          'semantic.low_clarity',
          'semantic.same_dimension_conflict',
        ],
        evidence_refs: [
          {
            code: 'semantic.high_momentum',
            role: 'support',
            dimension_id: 'momentum',
            evidence_ids: ['ev.aspect.jupiter.trine.moon'],
          },
          {
            code: 'semantic.high_cooperation',
            role: 'support',
            dimension_id: 'cooperation',
            evidence_ids: ['ev.aspect.venus.sextile.jupiter'],
          },
          {
            code: 'semantic.low_clarity',
            role: 'caution',
            dimension_id: 'clarity',
            evidence_ids: ['ev.aspect.mercury.square.mercury'],
          },
        ],
      },
    },
  };
}

describe('car-offer-negotiation EVALUATE result', () => {
  it('renders the negotiation panel instead of the generic day panel', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );

    expect(screen.getByTestId('offer-negotiation-result-panel')).toBeTruthy();
    expect(screen.queryByTestId('day-intelligence-panel')).toBeNull();
    expect(screen.queryByTestId('evaluate-day-intelligence')).toBeNull();

    // Shared Evaluate chrome (date, score, limits) stays. The generic
    // recommendation / meaning / evidence / next-step copy does not.
    expect(screen.getByTestId('evaluate-product-result')).toBeTruthy();
    expect(screen.getByTestId('result-score')).toBeTruthy();
    expect(screen.getByTestId('result-limits')).toBeTruthy();
    expect(screen.queryByTestId('result-recommendation')).toBeNull();
    expect(screen.queryByTestId('result-meaning')).toBeNull();
    expect(screen.queryByTestId('result-evidence-support')).toBeNull();
    expect(screen.queryByTestId('result-next-steps')).toBeNull();

    const page = screen.getByTestId('decision-package-view').textContent ?? '';
    expect(page).not.toMatch(/Momentum is stronger/i);
    expect(page).not.toMatch(/Opportunity conditions are stronger/i);
    expect(page).not.toMatch(/both opportunity and risk/i);
    expect(page).not.toMatch(/The signals do not fully agree/i);
    expect(page).not.toMatch(/Timing signal is strongly supportive/i);
  });

  it('shows a qualified headline for 100/100 with conflicted conditions', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );

    const panel = screen.getByTestId('offer-negotiation-result-panel');
    expect(panel.getAttribute('data-strength')).toBe('strong');
    expect(panel.getAttribute('data-condition-quality')).toBe('mixed');
    expect(
      screen.getByTestId('offer-negotiation-headline').textContent
    ).toBe('Strong timing — but handle the conversation deliberately');
    expect(
      screen.getByTestId('offer-negotiation-summary').textContent
    ).toContain('The conditions are mixed');
  });

  it('renders supports, watch, and ordinary-preparation next step', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );

    const supports = screen.getByTestId('offer-negotiation-supports');
    const watch = screen.getByTestId('offer-negotiation-watch');
    expect(supports.querySelectorAll('li').length).toBeLessThanOrEqual(2);
    expect(watch.querySelectorAll('li').length).toBeLessThanOrEqual(2);
    expect(supports.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(watch.querySelectorAll('li').length).toBeGreaterThan(0);

    expect(screen.getByTestId('offer-negotiation-next-step').textContent).toMatch(
      /Ordinary preparation/i
    );
    expect(screen.queryByTestId('offer-negotiation-boundary')).toBeNull();
  });

  it('renders each claim-boundary concept once, in Package limits only', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );

    const page = screen.getByTestId('decision-package-view').textContent ?? '';
    const limits = screen.getByTestId('result-limits').textContent ?? '';
    const panel =
      screen.getByTestId('offer-negotiation-result-panel').textContent ?? '';

    const count = (haystack: string, needle: string) =>
      haystack.split(needle).length - 1;

    for (const limit of OFFER_NEGOTIATION_LIMITS) {
      expect(count(limits, limit), limit).toBe(1);
      expect(count(page, limit), limit).toBe(1);
      expect(panel).not.toContain(limit);
    }

    expect(panel).not.toMatch(/employer will accept/i);
    expect(panel).not.toMatch(/compensation outcome/i);
    expect(panel).not.toMatch(/legal validity/i);
    expect(panel).not.toMatch(/alternative dates/i);
  });

  it('omits the context note when no optional intake was supplied', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );
    expect(screen.queryByTestId('offer-negotiation-context-note')).toBeNull();
    expect(screen.getByTestId('offer-negotiation-headline')).toBeTruthy();
    expect(screen.getByTestId('result-limits')).toBeTruthy();
  });

  it('scopes wording from optional intake without leaking raw enums', () => {
    render(
      <DecisionPackageView
        package={offerNegotiationPackage()}
        lang="en"
        intake={{
          target_date: '2026-01-01',
          negotiation_goal: 'salary',
          offer_stage: 'written_offer',
          counterparty_role: 'hiring_manager',
        }}
      />
    );

    const note = screen.getByTestId('offer-negotiation-context-note');
    expect(note.textContent).toContain('discussing salary');
    expect(note.textContent).toContain('at the written-offer stage');
    expect(note.textContent).toContain('with the hiring manager');
    expect(note.textContent).toMatch(/does not affect the timing score/i);

    const panel = screen.getByTestId('offer-negotiation-result-panel');
    expect(panel.textContent).not.toContain('written_offer');
    expect(panel.textContent).not.toContain('hiring_manager');
    // Optional context does not change the condition read.
    expect(panel.getAttribute('data-condition-quality')).toBe('mixed');
  });

  it.each(LANGS)('%s renders localized negotiation copy', (lang) => {
    render(
      <DecisionPackageView
        package={offerNegotiationPackage()}
        lang={lang}
        intake={{ negotiation_goal: 'benefits' }}
      />
    );

    const panel = screen.getByTestId('offer-negotiation-result-panel');
    expect(panel.getAttribute('dir')).toBe(lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr');
    const headline = screen.getByTestId('offer-negotiation-headline')
      .textContent as string;
    const nextStep = screen.getByTestId('offer-negotiation-next-step')
      .textContent as string;

    expect(headline.trim()).toBeTruthy();
    expect(nextStep.trim()).toBeTruthy();
    if (lang !== 'en') {
      expect(headline).not.toMatch(/[A-Za-z]{4,}/);
      expect(nextStep).not.toMatch(/[A-Za-z]{4,}/);
    }
  });

  it.each(['fa', 'ar'] as const)('%s keeps RTL direction on the panel', (lang) => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang={lang} />
    );
    expect(
      screen.getByTestId('offer-negotiation-result-panel').getAttribute('dir')
    ).toBe('rtl');
  });
});

describe('other Decision Types are unaffected', () => {
  it.each([
    ['car-interview', 'decision-engine-car-interview-v1'],
    ['bus-investor-meeting', 'decision-engine-investor-meeting-v1'],
    ['mar-wedding-date', 'decision-engine-wedding-date-v1'],
    ['bus-product-launch', 'decision-engine-product-launch-v1'],
  ])('%s keeps the generic day-intelligence panel', (typeId, engineId) => {
    render(
      <DecisionPackageView package={evaluatePackage(typeId, engineId)} lang="en" />
    );

    expect(screen.getByTestId('evaluate-day-intelligence')).toBeTruthy();
    expect(screen.getByTestId('result-recommendation')).toBeTruthy();
    expect(screen.getByTestId('result-meaning')).toBeTruthy();
    expect(screen.queryByTestId('offer-negotiation-result-panel')).toBeNull();
  });

  it('ignores offer-negotiation intake keys for another Decision Type', () => {
    const withIntake = render(
      <DecisionPackageView
        package={evaluatePackage(
          'car-interview',
          'decision-engine-car-interview-v1'
        )}
        lang="en"
        intake={{ negotiation_goal: 'salary' }}
      />
    ).container.innerHTML;
    cleanup();

    const withoutIntake = render(
      <DecisionPackageView
        package={evaluatePackage(
          'car-interview',
          'decision-engine-car-interview-v1'
        )}
        lang="en"
      />
    ).container.innerHTML;

    expect(withIntake).toBe(withoutIntake);
  });
});
