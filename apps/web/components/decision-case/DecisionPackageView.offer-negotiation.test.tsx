/**
 * Rendered offer-negotiation EVALUATE result.
 *
 * Proves the negotiation-specific panel replaces the generic day-intelligence
 * panel for car-offer-negotiation only, and that other Decision Types keep the
 * generic panel untouched.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DecisionCaseResultBackLink } from './DecisionCaseResultBackLink';
import { DecisionPackageView } from './DecisionPackageView';
import { bindDemoStubPackage } from '@/lib/decision-case';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import type { AppLang } from '@/lib/app-settings';
import {
  getAskProductCopy,
  localizePackageLimits,
  offerNegotiationBackToAsk,
} from '@/lib/ask-product';

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

function renderCompletePage(
  pkg: DecisionEvaluationPackage,
  lang: AppLang,
  intake?: Record<string, unknown>
) {
  return render(
    <div data-testid="offer-negotiation-complete-page">
      <DecisionPackageView package={pkg} lang={lang} intake={intake} />
      <DecisionCaseResultBackLink
        lang={lang}
        decisionTypeId={pkg.decision_type_id}
      />
    </div>
  );
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

function cleanOfferNegotiationPackage(): DecisionEvaluationPackage {
  const base = offerNegotiationPackage();
  const assessment = base.semantic_shadow?.assessments?.[0] as Record<
    string,
    unknown
  >;
  const dimensions = {
    ...(assessment.dimensions as Record<string, unknown>),
    clarity: INSUFFICIENT_DIM,
  };
  return {
    ...base,
    semantic_shadow: {
      ...base.semantic_shadow!,
      assessments: [
        {
          ...assessment,
          dimensions,
          dimension_classification: {
            scored_dimension_count: 2,
            day_class: 'action',
            same_dimension_conflict: false,
            conflicted_dimension_ids: [],
            veto_dimension_ids: [],
          },
        },
      ],
      explanation: {
        headline_code: 'semantic.strong_clean',
        support_codes: ['semantic.high_momentum', 'semantic.high_cooperation'],
        caution_codes: [],
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
        ],
      },
    },
  };
}

function mixedWithoutCautionPackage(): DecisionEvaluationPackage {
  const base = offerNegotiationPackage();
  const assessment = base.semantic_shadow?.assessments?.[0] as Record<
    string,
    unknown
  >;
  return {
    ...base,
    semantic_shadow: {
      ...base.semantic_shadow!,
      assessments: [
        {
          ...assessment,
          dimensions: {
            ...(assessment.dimensions as Record<string, unknown>),
            clarity: INSUFFICIENT_DIM,
            cooperation: INSUFFICIENT_DIM,
          },
          dimension_classification: {
            scored_dimension_count: 1,
            day_class: 'mixed',
            same_dimension_conflict: true,
            conflicted_dimension_ids: ['momentum'],
            veto_dimension_ids: [],
          },
        },
      ],
      explanation: {
        headline_code: 'semantic.mixed_conflict',
        support_codes: ['semantic.high_momentum'],
        caution_codes: ['semantic.same_dimension_conflict'],
        evidence_refs: [
          {
            code: 'semantic.high_momentum',
            role: 'support',
            dimension_id: 'momentum',
            evidence_ids: ['ev.aspect.jupiter.trine.moon'],
          },
        ],
      },
    },
  };
}

function strainedOfferNegotiationPackage(): DecisionEvaluationPackage {
  const base = offerNegotiationPackage();
  const assessment = base.semantic_shadow?.assessments?.[0] as Record<
    string,
    unknown
  >;
  return {
    ...base,
    semantic_shadow: {
      ...base.semantic_shadow!,
      assessments: [
        {
          ...assessment,
          dimension_classification: {
            scored_dimension_count: 3,
            day_class: 'defensive',
            same_dimension_conflict: false,
            conflicted_dimension_ids: [],
            veto_dimension_ids: ['clarity'],
          },
        },
      ],
      explanation: {
        headline_code: 'semantic.veto_present',
        support_codes: ['semantic.high_momentum'],
        caution_codes: ['semantic.veto_present', 'semantic.low_clarity'],
        evidence_refs: (
          base.semantic_shadow?.explanation as { evidence_refs?: unknown }
        )?.evidence_refs,
      },
    },
  };
}

function insufficientOfferNegotiationPackage(): DecisionEvaluationPackage {
  const base = offerNegotiationPackage();
  return {
    ...base,
    semantic_shadow: {
      schema_version: 'decision_assessment.v1-shadow',
      semantic_status: 'experimental_shadow',
      assessments: [{}],
      explanation: {},
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
    expect(screen.getByTestId('result-verdict').textContent).toBe(
      'Strong timing — but handle the conversation deliberately'
    );
    expect(screen.getByTestId('result-verdict').textContent).not.toMatch(
      /Highly favorable/i
    );
    expect(
      screen.getByTestId('offer-negotiation-summary').textContent
    ).toContain('The conditions are mixed');
    expect(screen.getByTestId('offer-negotiation-summary').textContent).not.toBe(
      screen.getByTestId('offer-negotiation-headline').textContent
    );
  });

  it('renders supports, watch, and practical next step', () => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );

    const supports = screen.getByTestId('offer-negotiation-supports');
    const watch = screen.getByTestId('offer-negotiation-watch');
    expect(supports.textContent).toContain('What supports this timing');
    expect(watch.textContent).toContain('What to watch');
    expect(supports.querySelectorAll('li').length).toBeLessThanOrEqual(2);
    expect(watch.querySelectorAll('li').length).toBeLessThanOrEqual(2);
    expect(supports.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(watch.querySelectorAll('li').length).toBeGreaterThan(0);
    expect(supports.textContent).not.toContain(
      'Conditions support opening or advancing the conversation.'
    );

    const nextStep = screen.getByTestId('offer-negotiation-next-step');
    expect(nextStep.textContent).toContain('Practical next step');
    expect(nextStep.textContent).toMatch(/Practical preparation/i);
    expect(screen.queryByTestId('offer-negotiation-boundary')).toBeNull();
    expect(screen.getByTestId('decision-package-view').textContent).not.toMatch(
      /Supporting evidence|Watch-outs|Suggested next steps/i
    );
  });

  it('renders each claim-boundary concept once, in Package limits only', () => {
    renderCompletePage(offerNegotiationPackage(), 'en');

    const page =
      screen.getByTestId('offer-negotiation-complete-page').textContent ?? '';
    const limits = screen.getByTestId('result-limits').textContent ?? '';
    const panel =
      screen.getByTestId('offer-negotiation-result-panel').textContent ?? '';
    const scopeIntro = getAskProductCopy('en').scopeOfferNegotiationTiming;

    const count = (haystack: string, needle: string) =>
      haystack.split(needle).length - 1;

    expect(page).not.toContain(scopeIntro);
    expect(limits).not.toContain(scopeIntro);
    expect(page).not.toMatch(
      /This analysis covers timing for conducting the offer negotiation/
    );

    for (const limit of OFFER_NEGOTIATION_LIMITS) {
      expect(count(limits, limit), limit).toBe(1);
      expect(count(page, limit), limit).toBe(1);
      expect(panel).not.toContain(limit);
    }

    expect(count(page, 'employer')).toBeLessThanOrEqual(1);
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

  it('renders an unqualified strong headline for 100 + clean conditions', () => {
    render(
      <DecisionPackageView package={cleanOfferNegotiationPackage()} lang="en" />
    );
    expect(screen.getByTestId('result-verdict').textContent).toBe(
      'Strong timing for opening the negotiation'
    );
    expect(
      screen.getByTestId('offer-negotiation-result-panel').getAttribute(
        'data-condition-quality'
      )
    ).toBe('clean');
    expect(screen.queryByTestId('offer-negotiation-watch-notice')).toBeNull();
  });

  it('does not describe 100 + strained as clean or Highly favorable', () => {
    render(
      <DecisionPackageView
        package={strainedOfferNegotiationPackage()}
        lang="en"
      />
    );
    const verdict = screen.getByTestId('result-verdict').textContent ?? '';
    expect(verdict).toBe('Strong timing — but the conditions call for caution');
    expect(verdict).not.toMatch(/Highly favorable/i);
    expect(verdict).not.toMatch(/opening the negotiation$/i);
    expect(
      screen.getByTestId('offer-negotiation-result-panel').getAttribute(
        'data-condition-quality'
      )
    ).toBe('strained');
  });

  it('renders the insufficient-caution notice when mixed has no joined caution', () => {
    render(
      <DecisionPackageView package={mixedWithoutCautionPackage()} lang="en" />
    );
    expect(screen.getByTestId('offer-negotiation-watch-notice').textContent).toBe(
      'Mixed conditions were detected, but there is not enough grounded evidence to explain the caution precisely.'
    );
    expect(
      screen.getByTestId('offer-negotiation-watch').querySelectorAll('li').length
    ).toBe(0);
  });

  it('renders restrained copy when semantic data is insufficient', () => {
    render(
      <DecisionPackageView
        package={insufficientOfferNegotiationPackage()}
        lang="en"
      />
    );
    expect(screen.getByTestId('result-verdict').textContent).toBe(
      'General timing for this date is strong'
    );
    expect(screen.queryByTestId('offer-negotiation-supports')).toBeNull();
    expect(screen.queryByTestId('offer-negotiation-watch')).toBeNull();
    expect(screen.queryByTestId('offer-negotiation-watch-notice')).toBeNull();
    expect(screen.getByTestId('offer-negotiation-summary').textContent).toContain(
      'general timing guidance only'
    );
  });

  it('places the insight panel before Limits in DOM order', () => {
    const { container } = render(
      <DecisionPackageView package={offerNegotiationPackage()} lang="en" />
    );
    const html = container.innerHTML;
    const topicAt = html.indexOf('Negotiate a job offer');
    const verdictAt = html.indexOf('data-testid="result-verdict"');
    const insightAt = html.indexOf('data-testid="evaluate-offer-negotiation"');
    const confidenceAt = html.indexOf('data-testid="result-confidence-card"');
    const limitsAt = html.indexOf('data-testid="result-limits"');
    expect(topicAt).toBeGreaterThanOrEqual(0);
    expect(verdictAt).toBeGreaterThan(topicAt);
    expect(insightAt).toBeGreaterThan(verdictAt);
    expect(limitsAt).toBeGreaterThan(insightAt);
    if (confidenceAt >= 0) {
      expect(confidenceAt).toBeGreaterThan(insightAt);
      expect(limitsAt).toBeGreaterThan(confidenceAt);
    }
    expect(screen.getByTestId('result-limits').hasAttribute('hidden')).toBe(
      false
    );
    expect(screen.getByTestId('result-limits').querySelector('details')).toBeNull();
    expect(
      screen.getByTestId('evaluate-product-result').getAttribute('data-density')
    ).toBe('compact');
  });

  it('places insight before confidence before Limits when confidence is present', () => {
    const pkg = {
      ...offerNegotiationPackage(),
      confidence: { value: 70, precision_level: 'L3' as const, penalties: [] },
    };
    const { container } = render(
      <DecisionPackageView package={pkg} lang="en" />
    );
    const html = container.innerHTML;
    const insightAt = html.indexOf('data-testid="evaluate-offer-negotiation"');
    const confidenceAt = html.indexOf('data-testid="result-confidence-card"');
    const limitsAt = html.indexOf('data-testid="result-limits"');
    expect(insightAt).toBeGreaterThanOrEqual(0);
    expect(confidenceAt).toBeGreaterThan(insightAt);
    expect(limitsAt).toBeGreaterThan(confidenceAt);
    expect(screen.getByTestId('result-confidence').textContent).toBeTruthy();
  });

  it('places Limits immediately before Back with no AgencyLine between them', () => {
    const { container } = renderCompletePage(offerNegotiationPackage(), 'en');
    const html = container.innerHTML;
    const limitsAt = html.indexOf('data-testid="result-limits"');
    const backAt = html.indexOf('data-testid="result-back-to-ask"');
    expect(limitsAt).toBeGreaterThanOrEqual(0);
    expect(backAt).toBeGreaterThan(limitsAt);
    const between = html.slice(limitsAt, backAt);
    expect(between).not.toMatch(/never decides|AgencyLine|result-agency/i);
    expect(container.textContent).not.toContain(
      getAskProductCopy('en').agencyLine
    );
  });

  it('keeps optional context wording-only and visually secondary', () => {
    render(
      <DecisionPackageView
        package={offerNegotiationPackage()}
        lang="en"
        intake={{
          negotiation_goal: 'salary',
          offer_stage: 'written_offer',
        }}
      />
    );
    const note = screen.getByTestId('offer-negotiation-context-note');
    expect(note.getAttribute('data-visual-priority')).toBe('secondary');
    expect(note.className).toMatch(/text-xs|text-white\/45/);
    expect(
      screen.getByTestId('offer-negotiation-result-panel').getAttribute(
        'data-condition-quality'
      )
    ).toBe('mixed');
  });

  it.each(['fa', 'ar'] as const)(
    '%s isolates date and score tokens for bidi',
    (lang) => {
      render(
        <DecisionPackageView package={offerNegotiationPackage()} lang={lang} />
      );
      const date = screen.getByTestId('result-date-primary-token');
      expect(date.tagName.toLowerCase()).toBe('bdi');
      expect(date.getAttribute('data-bidi-isolate')).toBe('date');
      expect(date.style.unicodeBidi).toBe('isolate');
      expect(date.textContent?.trim()).toBeTruthy();

      const score = screen.getByTestId('result-score');
      const fraction = score.querySelector('bdi[data-ltr-numeric="fraction"]');
      expect(fraction).toBeTruthy();
      expect(fraction?.getAttribute('dir')).toBe('ltr');
      expect(score.textContent).not.toMatch(/100 \/ 66|۱۰۰ \/ ۶۶|١٠٠ \/ ٦٦/);
    }
  );

  it.each(['en', 'ru'] as const)('%s remains LTR-correct', (lang) => {
    render(
      <DecisionPackageView package={offerNegotiationPackage()} lang={lang} />
    );
    expect(
      screen.getByTestId('evaluate-product-result').getAttribute('dir')
    ).toBe('ltr');
    expect(screen.getByTestId('result-score').textContent).toMatch(
      /100 \/ 100/
    );
    expect(screen.getByTestId('result-score').textContent).not.toMatch(
      /100 \/ 100/.source.split('').reverse().join('')
    );
  });

  it.each(LANGS)('%s exposes no raw identifiers or enum values', (lang) => {
    renderCompletePage(offerNegotiationPackage(), lang, {
      negotiation_goal: 'role_title',
      offer_stage: 'written_offer',
      counterparty_role: 'hiring_manager',
    });
    const page =
      screen.getByTestId('offer-negotiation-complete-page').textContent ?? '';
    for (const raw of [
      'role_title',
      'written_offer',
      'hiring_manager',
      'semantic.mixed_conflict',
      'clarity',
      'momentum',
      'ev.aspect',
      'contribution',
      'polarity',
    ]) {
      expect(page, `${lang}: ${raw}`).not.toContain(raw);
    }
  });

  it('uses localized Offer Negotiation navigation on the complete page', () => {
    renderCompletePage(offerNegotiationPackage(), 'fa');
    expect(screen.getByTestId('result-back-to-ask').textContent).toBe(
      'بازگشت به طرح پرسش'
    );
    expect(screen.getByTestId('result-back-to-ask').getAttribute('href')).toBe(
      '/ask'
    );
    expect(screen.getByTestId('result-back-to-ask').textContent).not.toMatch(
      /ASK/
    );
  });

  it.each(LANGS)('%s localizes the complete-page back link', (lang) => {
    renderCompletePage(offerNegotiationPackage(), lang);
    expect(screen.getByTestId('result-back-to-ask').textContent).toBe(
      offerNegotiationBackToAsk(lang)
    );
  });

  it.each(LANGS)(
    '%s renders each localized limit meaning once on the complete page',
    (lang) => {
      renderCompletePage(offerNegotiationPackage(), lang);
      const page =
        screen.getByTestId('offer-negotiation-complete-page').textContent ?? '';
      const localized = localizePackageLimits(
        lang,
        [...OFFER_NEGOTIATION_LIMITS],
        4
      );
      expect(localized.length).toBe(4);
      const scope = getAskProductCopy(lang).scopeOfferNegotiationTiming;
      expect(page).not.toContain(scope);
      for (const limit of localized) {
        expect(page.split(limit).length - 1, `${lang}: ${limit}`).toBe(1);
      }
    }
  );
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
    expect(screen.getByTestId('result-verdict').textContent).toBe(
      'Highly favorable'
    );
    expect(screen.queryByTestId('offer-negotiation-result-panel')).toBeNull();
    expect(screen.queryByTestId('result-date-primary-token')).toBeNull();
    expect(screen.queryByTestId('evaluate-offer-negotiation')).toBeNull();
    expect(
      screen.getByTestId('evaluate-product-result').getAttribute('data-density')
    ).toBeNull();
    expect(screen.getByTestId('evaluate-product-result').textContent).toContain(
      getAskProductCopy('en').agencyLine
    );
    expect(
      screen.getByTestId('result-limits').querySelector('p.limitsBody, p')
    ).toBeTruthy();
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
