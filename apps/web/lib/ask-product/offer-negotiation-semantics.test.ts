/**
 * Offer-negotiation EVALUATE semantic depth — dimension-grounded claims only.
 *
 * Planet-name lookup is not an authority. A factor key by itself must never
 * produce a negotiation category. Specific Supports/Watch lines require a
 * scored Decision Dimension, a support/caution evidence id on that dimension,
 * and a Package driver that shares that evidence id.
 */

import { describe, expect, it } from 'vitest';
import type { AppLang } from '@/lib/app-settings';
import type { DecisionEvaluationPackage } from '@/lib/decision-case';
import { bindDemoStubPackage } from '@/lib/decision-case';
import {
  buildOfferNegotiationResultView,
  categoryForDimensionRole,
  offerNegotiationBackToAsk,
  type CanonicalDimensionId,
} from './offer-negotiation-semantics';

const LANGS: readonly AppLang[] = ['en', 'fa', 'ar', 'ru'];

type DriverSeed = {
  factor_key?: string;
  polarity: 'supportive' | 'cautionary' | 'neutral';
  contribution: number;
};

type DimensionSeed = {
  value: number;
  status?: 'scored' | 'insufficient';
  evidence_strength?: number;
  supportive_evidence_ids?: readonly string[];
  caution_evidence_ids?: readonly string[];
  dominant_evidence_ids?: readonly string[];
  conflicted?: boolean;
};

function scoredDimension(
  value: number,
  evidenceId: string,
  role: 'support' | 'caution'
): DimensionSeed {
  const ids = [evidenceId];
  return {
    value,
    status: 'scored',
    evidence_strength: 0.6,
    supportive_evidence_ids: role === 'support' ? ids : [],
    caution_evidence_ids: role === 'caution' ? ids : [],
    dominant_evidence_ids: ids,
    conflicted: false,
  };
}

const INSUFFICIENT_DIM: DimensionSeed = {
  value: 50,
  status: 'insufficient',
  evidence_strength: undefined,
  supportive_evidence_ids: [],
  caution_evidence_ids: [],
  dominant_evidence_ids: [],
};

function offerNegotiationPackage(options: {
  score: number;
  drivers: readonly DriverSeed[];
  targetDate?: string;
  decisionTypeId?: string;
  dimensions?: Partial<Record<CanonicalDimensionId, DimensionSeed>>;
  classification?: Record<string, unknown>;
  explanation?: Record<string, unknown>;
  limits?: readonly string[];
}): DecisionEvaluationPackage {
  const date = options.targetDate ?? '2026-09-15';
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 2,
    intake: { target_date: date },
  });

  const dims = options.dimensions
    ? {
        mapping_version: 'dimensions.v1-shadow',
        semantic_status: 'experimental_shadow',
        baseline: 50,
        opportunity: INSUFFICIENT_DIM,
        momentum: INSUFFICIENT_DIM,
        clarity: INSUFFICIENT_DIM,
        stability: INSUFFICIENT_DIM,
        cooperation: INSUFFICIENT_DIM,
        pressure: INSUFFICIENT_DIM,
        reversibility_safety: INSUFFICIENT_DIM,
        ...options.dimensions,
      }
    : undefined;

  const scoredCount = dims
    ? (
        [
          'opportunity',
          'momentum',
          'clarity',
          'stability',
          'cooperation',
          'pressure',
          'reversibility_safety',
        ] as const
      ).filter((key) => dims[key]?.status === 'scored').length
    : 0;

  return {
    ...base,
    decision_type_id: options.decisionTypeId ?? 'car-offer-negotiation',
    family_id: 'visibility',
    engine_id: 'decision-engine-offer-negotiation-v1',
    mode: 'evaluate_date',
    recommendation: { ...base.recommendation, stance: 'proceed' },
    timing: {
      ...base.timing,
      material: true,
      band: 'high',
      score: options.score,
      candidates: base.timing.candidates.map((candidate, index) =>
        index === 0 ? { ...candidate, score: options.score, date } : candidate
      ),
    },
    explainability: {
      ...base.explainability,
      limits: options.limits ?? base.explainability.limits,
    },
    drivers: {
      items: options.drivers.map((seed, index) => ({
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
    semantic_shadow: dims
      ? {
          schema_version: 'decision_assessment.v1-shadow',
          semantic_status: 'experimental_shadow',
          assessments: [
            {
              dimensions: dims,
              dimension_classification: {
                scored_dimension_count: scoredCount,
                day_class: 'action',
                same_dimension_conflict: false,
                conflicted_dimension_ids: [],
                veto_dimension_ids: [],
                ...(options.classification ?? {}),
              },
            },
          ],
          explanation: options.explanation ?? {},
        }
      : {
          schema_version: 'decision_assessment.v1-shadow',
          semantic_status: 'experimental_shadow',
          assessments: [{}],
          explanation: options.explanation ?? {},
        },
  };
}

const GROUNDED_DRIVERS: readonly DriverSeed[] = [
  {
    factor_key: 'aspect.mercury.trine.mercury',
    polarity: 'supportive',
    contribution: 13.15,
  },
  {
    factor_key: 'aspect.venus.trine.sun',
    polarity: 'supportive',
    contribution: 5.21,
  },
  {
    factor_key: 'aspect.mars.square.saturn',
    polarity: 'cautionary',
    contribution: -5.44,
  },
];

function groundedPackage(
  extras: Partial<Parameters<typeof offerNegotiationPackage>[0]> = {}
) {
  return offerNegotiationPackage({
    score: extras.score ?? 74,
    drivers: extras.drivers ?? GROUNDED_DRIVERS,
    dimensions: extras.dimensions ?? {
      clarity: scoredDimension(78, 'ev.aspect.mercury.trine.mercury', 'support'),
      cooperation: scoredDimension(72, 'ev.aspect.venus.trine.sun', 'support'),
      pressure: scoredDimension(70, 'ev.aspect.mars.square.saturn', 'caution'),
    },
    classification: extras.classification ?? {
      scored_dimension_count: 3,
      day_class: 'mixed',
      same_dimension_conflict: true,
      conflicted_dimension_ids: ['cooperation'],
    },
    explanation: extras.explanation ?? {
      headline_code: 'semantic.mixed_conflict',
      support_codes: ['semantic.high_clarity', 'semantic.high_cooperation'],
      caution_codes: [
        'semantic.high_pressure',
        'semantic.same_dimension_conflict',
      ],
      evidence_refs: [
        {
          code: 'semantic.high_clarity',
          role: 'support',
          dimension_id: 'clarity',
          evidence_ids: ['ev.aspect.mercury.trine.mercury'],
        },
        {
          code: 'semantic.high_cooperation',
          role: 'support',
          dimension_id: 'cooperation',
          evidence_ids: ['ev.aspect.venus.trine.sun'],
        },
        {
          code: 'semantic.high_pressure',
          role: 'caution',
          dimension_id: 'pressure',
          evidence_ids: ['ev.aspect.mars.square.saturn'],
        },
      ],
    },
    ...extras,
  });
}

function hundredMixedPackage() {
  return groundedPackage({
    score: 100,
    targetDate: '2026-01-01',
    classification: {
      scored_dimension_count: 3,
      day_class: 'mixed',
      same_dimension_conflict: true,
      conflicted_dimension_ids: ['cooperation'],
    },
    explanation: {
      headline_code: 'semantic.mixed_conflict',
      support_codes: ['semantic.high_clarity', 'semantic.high_cooperation'],
      caution_codes: [
        'semantic.high_pressure',
        'semantic.same_dimension_conflict',
      ],
      evidence_refs: [
        {
          code: 'semantic.high_clarity',
          role: 'support',
          dimension_id: 'clarity',
          evidence_ids: ['ev.aspect.mercury.trine.mercury'],
        },
        {
          code: 'semantic.high_cooperation',
          role: 'support',
          dimension_id: 'cooperation',
          evidence_ids: ['ev.aspect.venus.trine.sun'],
        },
        {
          code: 'semantic.high_pressure',
          role: 'caution',
          dimension_id: 'pressure',
          evidence_ids: ['ev.aspect.mars.square.saturn'],
        },
      ],
    },
  });
}

describe('dimension role mapping — no planet folklore', () => {
  it('maps only authorized dimension + role pairs', () => {
    expect(categoryForDimensionRole('clarity', 'support')).toBe('clarity');
    expect(categoryForDimensionRole('clarity', 'caution')).toBe('clarity');
    expect(categoryForDimensionRole('cooperation', 'support')).toBe(
      'cooperation'
    );
    expect(categoryForDimensionRole('cooperation', 'caution')).toBe(
      'cooperation'
    );
    expect(categoryForDimensionRole('momentum', 'support')).toBe('momentum');
    expect(categoryForDimensionRole('pressure', 'caution')).toBe('pressure');
    expect(categoryForDimensionRole('stability', 'caution')).toBe('verification');
    expect(categoryForDimensionRole('reversibility_safety', 'caution')).toBe(
      'verification'
    );
  });

  it('does not invent categories the engine did not authorize', () => {
    expect(categoryForDimensionRole('opportunity', 'support')).toBeNull();
    expect(categoryForDimensionRole('opportunity', 'caution')).toBeNull();
    expect(categoryForDimensionRole('momentum', 'caution')).toBeNull();
    expect(categoryForDimensionRole('pressure', 'support')).toBeNull();
    expect(categoryForDimensionRole('stability', 'support')).toBeNull();
    expect(categoryForDimensionRole('saturn', 'caution')).toBeNull();
    expect(categoryForDimensionRole('neptune', 'caution')).toBeNull();
  });
});

describe('factor keys alone cannot invent claims', () => {
  it('aspect.jupiter.square.saturn cannot produce authority_tension from natal Saturn', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 100,
        drivers: [
          {
            factor_key: 'aspect.jupiter.square.saturn',
            polarity: 'cautionary',
            contribution: -11.72,
          },
        ],
      }),
      'en'
    );

    expect(view?.semanticInsufficient).toBe(true);
    expect(view?.evidenceGrounded).toBe(false);
    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    const blob = [view?.headline, view?.summary, view?.nextStep].join(' ');
    expect(blob).not.toMatch(/authority|firmness|demand|employer/i);
    expect(blob).toContain('general timing guidance only');
  });

  it('aspect.saturn.sextile.mercury cannot produce communication clarity from natal Mercury', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 74,
        drivers: [
          {
            factor_key: 'aspect.saturn.sextile.mercury',
            polarity: 'supportive',
            contribution: 6.1,
          },
        ],
      }),
      'en'
    );

    expect(view?.evidenceGrounded).toBe(false);
    expect(view?.supports.join(' ')).not.toMatch(/priorit|structured|clear/i);
  });

  it('even with a cooperation dimension, natal Mercury does not become clarity', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 74,
        drivers: [
          {
            factor_key: 'aspect.saturn.sextile.mercury',
            polarity: 'supportive',
            contribution: 6.1,
          },
        ],
        dimensions: {
          cooperation: scoredDimension(
            72,
            'ev.aspect.saturn.sextile.mercury',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
        },
        explanation: {
          support_codes: ['semantic.high_cooperation'],
          evidence_refs: [
            {
              code: 'semantic.high_cooperation',
              role: 'support',
              dimension_id: 'cooperation',
              evidence_ids: ['ev.aspect.saturn.sextile.mercury'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.supports.join(' ')).toMatch(/cooperative/i);
    expect(view?.supports.join(' ')).not.toMatch(/priorit|structured/i);
    expect(view?.evidence.map((item) => item.dimensionId)).toEqual([
      'cooperation',
    ]);
  });
});

describe('condition quality authority', () => {
  it('marks mixed from semantic.same_dimension_conflict, not from a cautionary driver', () => {
    const view = buildOfferNegotiationResultView(hundredMixedPackage(), 'en');
    expect(view?.conditionQuality).toBe('mixed');
    expect(view?.semanticInsufficient).toBe(false);
  });

  it('marks strained from veto / restrictive day_class', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        classification: {
          scored_dimension_count: 3,
          day_class: 'defensive',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: ['pressure'],
        },
        explanation: {
          headline_code: 'semantic.veto_present',
          support_codes: ['semantic.high_clarity'],
          caution_codes: ['semantic.veto_present', 'semantic.high_pressure'],
        },
      }),
      'en'
    );
    expect(view?.conditionQuality).toBe('strained');
    expect(view?.semanticInsufficient).toBe(false);
    expect(view?.headline).toBe(
      'Workable timing — but the conditions are strained'
    );
    expect(view?.headline).not.toMatch(/Highly favorable|opening the negotiation/i);
    expect(view?.summary).not.toMatch(/point in one direction|Highly favorable/i);
  });

  it('qualifies a 100 score when conditions are strained', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        score: 100,
        classification: {
          scored_dimension_count: 3,
          day_class: 'defensive',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: ['pressure'],
        },
        explanation: {
          headline_code: 'semantic.veto_present',
          support_codes: ['semantic.high_clarity'],
          caution_codes: ['semantic.veto_present', 'semantic.high_pressure'],
        },
      }),
      'en'
    );
    expect(view?.strength).toBe('strong');
    expect(view?.conditionQuality).toBe('strained');
    expect(view?.headline).toBe(
      'Strong timing — but the conditions call for caution'
    );
    expect(view?.headline).not.toMatch(/Highly favorable/i);
  });

  it('marks insufficient semantic data as mixed with restrained copy', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 88,
        drivers: GROUNDED_DRIVERS,
      }),
      'en'
    );
    expect(view?.semanticInsufficient).toBe(true);
    expect(view?.conditionQuality).toBe('mixed');
    expect(view?.headline).toBe('General timing for this date is strong');
    expect(view?.headline).not.toMatch(/opening the negotiation|Highly favorable/i);
    expect(view?.summary).toBe(
      'The available evidence supports general timing guidance only, so no specific negotiation reading is offered for this date.'
    );
    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    expect(view?.watchNotice).toBeNull();
  });
});

describe('evidence-grounded result view', () => {
  it('is built only for scored car-offer-negotiation evaluations', () => {
    expect(
      buildOfferNegotiationResultView(
        groundedPackage({ decisionTypeId: 'car-interview' }),
        'en'
      )
    ).toBeNull();
    expect(buildOfferNegotiationResultView(groundedPackage(), 'en')).not.toBeNull();
  });

  it('replaces generic momentum/opportunity copy with negotiation wording', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');
    const blob = [
      view?.headline,
      view?.summary,
      ...(view?.supports ?? []),
      ...(view?.watch ?? []),
      view?.nextStep,
    ]
      .join(' ')
      .toLowerCase();

    expect(blob).not.toContain('momentum is stronger');
    expect(blob).not.toContain('opportunity conditions are stronger');
    expect(blob).not.toContain('both opportunity and risk');
    expect(blob).not.toContain('signals conflict');
    expect(blob).toMatch(/conversation|priorit|cooperative/);
    expect(view?.supports.join(' ')).toMatch(/priorit|cooperative/i);
  });

  it('traces every Supports/Watch line to a dimension and evidence reference', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');

    expect(view?.evidenceGrounded).toBe(true);
    expect(view?.evidence.length).toBeGreaterThan(0);
    expect(view?.evidence.length).toBe(
      (view?.supports.length ?? 0) + (view?.watch.length ?? 0)
    );

    for (const trace of view?.evidence ?? []) {
      expect(['clarity', 'cooperation', 'pressure']).toContain(trace.dimensionId);
      expect(trace.evidenceId).toMatch(/^ev\./);
      expect(trace.driverId).toBeTruthy();
      expect(typeof trace.contribution).toBe('number');
      expect(['supportive', 'cautionary']).toContain(trace.polarity);
    }

    expect(view?.evidence.map((item) => item.dimensionId)).toEqual([
      'clarity',
      'cooperation',
      'pressure',
    ]);
    expect(view?.evidence.map((item) => item.evidenceId)).toEqual([
      'ev.aspect.mercury.trine.mercury',
      'ev.aspect.venus.trine.sun',
      'ev.aspect.mars.square.saturn',
    ]);
  });

  it('emits at most two supports and two watch items', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');
    expect(view?.supports.length).toBeLessThanOrEqual(2);
    expect(view?.watch.length).toBeLessThanOrEqual(2);
    expect(new Set(view?.supports).size).toBe(view?.supports.length);
    expect(new Set(view?.watch).size).toBe(view?.watch.length);
  });

  it('falls back to restrained copy when dimension linkage is missing', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 74,
        drivers: GROUNDED_DRIVERS,
      }),
      'en'
    );

    expect(view?.semanticInsufficient).toBe(true);
    expect(view?.evidenceGrounded).toBe(false);
    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    expect(view?.summary).toContain('general timing guidance only');
    expect(view?.nextStep).toMatch(/Practical preparation/i);
  });

  it('qualifies a 100/100 score when semantic.same_dimension_conflict is present', () => {
    const view = buildOfferNegotiationResultView(hundredMixedPackage(), 'en');

    expect(view?.strength).toBe('strong');
    expect(view?.conditionQuality).toBe('mixed');
    expect(view?.semanticInsufficient).toBe(false);
    expect(view?.headline).toBe(
      'Strong timing — but handle the conversation deliberately'
    );
    expect(view?.summary).toBe(
      'The conditions are mixed, so the conversation should not be rushed.'
    );
    expect(view?.headline).not.toBe(view?.summary);
    expect(view?.headline.toLowerCase()).not.toMatch(
      /perfect|guarantee|ideal day/
    );
  });

  it('does not qualify a clean high-scoring date', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        score: 100,
        classification: {
          scored_dimension_count: 2,
          day_class: 'action',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: [],
        },
        explanation: {
          headline_code: 'semantic.strong_clean',
          support_codes: ['semantic.high_clarity', 'semantic.high_cooperation'],
          caution_codes: [],
          evidence_refs: [
            {
              code: 'semantic.high_clarity',
              role: 'support',
              dimension_id: 'clarity',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
            {
              code: 'semantic.high_cooperation',
              role: 'support',
              dimension_id: 'cooperation',
              evidence_ids: ['ev.aspect.venus.trine.sun'],
            },
          ],
        },
        dimensions: {
          clarity: scoredDimension(
            78,
            'ev.aspect.mercury.trine.mercury',
            'support'
          ),
          cooperation: scoredDimension(72, 'ev.aspect.venus.trine.sun', 'support'),
        },
        drivers: GROUNDED_DRIVERS.slice(0, 2),
      }),
      'en'
    );

    expect(view?.conditionQuality).toBe('clean');
    expect(view?.headline).toBe('Strong timing for opening the negotiation');
    expect(view?.watch).toEqual([]);
  });
});

describe('optional intake context', () => {
  it('produces a complete result when no optional context is supplied', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');
    expect(view?.contextNote).toBeNull();
    expect(view?.headline).toBeTruthy();
    expect(view?.summary).toBeTruthy();
    expect(view?.nextStep).toMatch(/Practical preparation/i);
    expect(
      [view?.headline, view?.summary, view?.nextStep].join(' ')
    ).not.toMatch(/missing|not provided|incomplete/i);
  });

  it('scopes wording to the goal without touching score or evidence', () => {
    const pkg = groundedPackage();
    const plain = buildOfferNegotiationResultView(pkg, 'en');
    const scoped = buildOfferNegotiationResultView(pkg, 'en', {
      negotiation_goal: 'salary',
    });

    expect(scoped?.contextNote).toContain('discussing salary');
    expect(scoped?.contextNote).toContain('does not affect the timing score');
    expect(scoped?.strength).toBe(plain?.strength);
    expect(scoped?.conditionQuality).toBe(plain?.conditionQuality);
    expect(scoped?.evidence).toEqual(plain?.evidence);
    expect(scoped?.supports).toEqual(plain?.supports);
    expect(scoped?.watch).toEqual(plain?.watch);
    expect(scoped?.headline).toBe(plain?.headline);
    expect(scoped?.summary).toBe(plain?.summary);
    expect(pkg.timing.score).toBe(74);
  });

  it.each(LANGS)('%s never leaks canonical enum values', (lang) => {
    const view = buildOfferNegotiationResultView(groundedPackage(), lang, {
      negotiation_goal: 'role_title',
      offer_stage: 'written_offer',
      counterparty_role: 'hiring_manager',
    });

    const blob = [
      view?.headline,
      view?.summary,
      ...(view?.supports ?? []),
      ...(view?.watch ?? []),
      view?.nextStep,
      view?.contextNote,
    ].join(' ');

    for (const raw of [
      'role_title',
      'written_offer',
      'hiring_manager',
      'hr_representative',
      'founder_executive',
      'working_arrangement',
      'complete_package',
      'verbal_offer',
      'revised_offer',
      'start_date',
    ]) {
      expect(blob, `${lang}: ${raw}`).not.toContain(raw);
    }
    expect(blob).not.toMatch(/aspect\.|house\.|angular\.|semantic\./);
  });
});

describe('claim boundary', () => {
  const FORBIDDEN: Readonly<Record<AppLang, readonly string[]>> = {
    en: [
      'will accept',
      'guarantee',
      'probability',
      'chance of',
      'employer will',
      'salary increase',
      'legally',
      'career success',
      'a.m.',
      'p.m.',
    ],
    fa: ['تضمین', 'احتمال', 'قطعاً', 'موفقیت شغلی', 'افزایش حقوق'],
    ar: ['يضمن', 'مضمون', 'احتمال', 'النجاح المهني', 'زيادة الراتب'],
    ru: ['гарант', 'вероятн', 'шанс', 'карьерный успех', 'повышение зарплаты'],
  };

  it.each(LANGS)('%s makes no employer, money or legal claim', (lang) => {
    const view = buildOfferNegotiationResultView(hundredMixedPackage(), lang, {
      negotiation_goal: 'salary',
    });
    const blob = [
      view?.headline,
      view?.summary,
      ...(view?.supports ?? []),
      ...(view?.watch ?? []),
      view?.nextStep,
      view?.contextNote,
    ]
      .join(' ')
      .toLowerCase();

    for (const token of FORBIDDEN[lang]) {
      expect(blob, `${lang}: ${token}`).not.toContain(token.toLowerCase());
    }
    expect(blob).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('keeps next-step as practical preparation, not an evidence conclusion', () => {
    const grounded = buildOfferNegotiationResultView(groundedPackage(), 'en');
    const restrained = buildOfferNegotiationResultView(
      offerNegotiationPackage({ score: 74, drivers: GROUNDED_DRIVERS }),
      'en'
    );
    expect(grounded?.nextStep).toBe(restrained?.nextStep);
    expect(grounded?.nextStep).toMatch(/^Practical preparation:/);
  });
});

describe('localization', () => {
  it.each(LANGS)('%s renders every slot in its own language', (lang) => {
    const view = buildOfferNegotiationResultView(hundredMixedPackage(), lang, {
      negotiation_goal: 'salary',
    });

    expect(view).not.toBeNull();
    for (const slot of [
      view?.headline,
      view?.summary,
      view?.nextStep,
      view?.contextNote,
      view?.supportHeading,
      view?.watchHeading,
      view?.nextStepHeading,
      ...(view?.supports ?? []),
      ...(view?.watch ?? []),
    ]) {
      expect(slot?.trim()).toBeTruthy();
      if (lang !== 'en') {
        expect(slot).not.toMatch(/[A-Za-z]{4,}/);
      }
    }
  });

  it('produces distinct copy per language', () => {
    const headlines = LANGS.map(
      (lang) =>
        buildOfferNegotiationResultView(hundredMixedPackage(), lang)?.headline
    );
    expect(new Set(headlines).size).toBe(LANGS.length);
  });

  it('localizes the Offer Negotiation back-to-Ask label', () => {
    expect(offerNegotiationBackToAsk('en')).toBe('Back to Ask');
    expect(offerNegotiationBackToAsk('fa')).toBe('بازگشت به طرح پرسش');
    expect(offerNegotiationBackToAsk('ar')).not.toMatch(/ASK|Ask/);
    expect(offerNegotiationBackToAsk('ru')).not.toMatch(/ASK|Ask/);
    expect(offerNegotiationBackToAsk('ar')).toMatch(/سؤال/);
  });
});

describe('grounded category wording', () => {
  it('uses communication wording for grounded clarity support', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        dimensions: {
          clarity: scoredDimension(
            78,
            'ev.aspect.mercury.trine.mercury',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: [],
        },
        explanation: {
          headline_code: 'semantic.strong_clean',
          support_codes: ['semantic.high_clarity'],
          caution_codes: [],
          evidence_refs: [
            {
              code: 'semantic.high_clarity',
              role: 'support',
              dimension_id: 'clarity',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
          ],
        },
        drivers: GROUNDED_DRIVERS.slice(0, 1),
      }),
      'en'
    );

    expect(view?.supports).toEqual([
      'Communication conditions support presenting your priorities clearly.',
    ]);
    expect(view?.supports.join(' ')).not.toContain(
      'Conditions support opening or advancing the conversation.'
    );
    expect(view?.evidence).toHaveLength(1);
    expect(view?.evidence[0]).toMatchObject({
      dimensionId: 'clarity',
      polarity: 'supportive',
      category: 'clarity',
    });
  });

  it('uses constructive-exchange wording for grounded cooperation support', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        dimensions: {
          cooperation: scoredDimension(
            72,
            'ev.aspect.venus.trine.sun',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: [],
        },
        explanation: {
          support_codes: ['semantic.high_cooperation'],
          caution_codes: [],
          evidence_refs: [
            {
              code: 'semantic.high_cooperation',
              role: 'support',
              dimension_id: 'cooperation',
              evidence_ids: ['ev.aspect.venus.trine.sun'],
            },
          ],
        },
        drivers: [GROUNDED_DRIVERS[1]],
      }),
      'en'
    );

    expect(view?.supports).toEqual([
      'Cooperative conditions support a constructive exchange.',
    ]);
  });

  it('uses restrained timing wording for grounded momentum support', () => {
    const view = buildOfferNegotiationResultView(
      groundedPackage({
        dimensions: {
          momentum: scoredDimension(
            80,
            'ev.aspect.mercury.trine.mercury',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
          same_dimension_conflict: false,
          conflicted_dimension_ids: [],
          veto_dimension_ids: [],
        },
        explanation: {
          support_codes: ['semantic.high_momentum'],
          caution_codes: [],
          evidence_refs: [
            {
              code: 'semantic.high_momentum',
              role: 'support',
              dimension_id: 'momentum',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
          ],
        },
        drivers: GROUNDED_DRIVERS.slice(0, 1),
      }),
      'en'
    );

    expect(view?.supports).toEqual([
      'The timing supports opening or advancing the negotiation.',
    ]);
    expect(view?.supports.join(' ')).not.toBe(
      'Conditions support opening or advancing the conversation.'
    );
  });

  it('uses non-rushed wording for grounded pressure caution', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');
    expect(view?.watch.join(' ')).toContain(
      'Do not rush a response or escalate the conversation.'
    );
    expect(view?.watch.join(' ')).not.toMatch(
      /aggression|rejection|employer|will/i
    );
    expect(
      view?.evidence.find((item) => item.category === 'pressure')
    ).toMatchObject({
      dimensionId: 'pressure',
      polarity: 'cautionary',
    });
  });

  it('does not invent a claim from an unmapped dimension', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 80,
        drivers: GROUNDED_DRIVERS.slice(0, 1),
        dimensions: {
          opportunity: scoredDimension(
            80,
            'ev.aspect.mercury.trine.mercury',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
        },
        explanation: {
          support_codes: ['semantic.high_opportunity'],
          evidence_refs: [
            {
              code: 'semantic.high_opportunity',
              role: 'support',
              dimension_id: 'opportunity',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    expect(view?.evidence).toEqual([]);
    expect(view?.evidenceGrounded).toBe(false);
  });

  it('does not invent a claim when polarity is mismatched', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 80,
        drivers: [
          {
            factor_key: 'aspect.mercury.trine.mercury',
            polarity: 'cautionary',
            contribution: -6,
          },
        ],
        dimensions: {
          clarity: scoredDimension(
            78,
            'ev.aspect.mercury.trine.mercury',
            'support'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
        },
        explanation: {
          support_codes: ['semantic.high_clarity'],
          evidence_refs: [
            {
              code: 'semantic.high_clarity',
              role: 'support',
              dimension_id: 'clarity',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    expect(view?.evidence).toEqual([]);
  });

  it('does not invent a claim when the evidence id is not on the claimed dimension', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 80,
        drivers: GROUNDED_DRIVERS.slice(0, 1),
        dimensions: {
          clarity: scoredDimension(78, 'ev.aspect.venus.trine.sun', 'support'),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'action',
        },
        explanation: {
          support_codes: ['semantic.high_clarity'],
          evidence_refs: [
            {
              code: 'semantic.high_clarity',
              role: 'support',
              dimension_id: 'clarity',
              evidence_ids: ['ev.aspect.mercury.trine.mercury'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.supports).toEqual([]);
    expect(view?.watch).toEqual([]);
    expect(view?.evidence).toEqual([]);
    expect(view?.evidenceGrounded).toBe(false);
  });

  it('uses mutual-understanding wording for grounded clarity caution', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 70,
        drivers: [GROUNDED_DRIVERS[2]],
        dimensions: {
          clarity: scoredDimension(
            30,
            'ev.aspect.mars.square.saturn',
            'caution'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'review',
        },
        explanation: {
          caution_codes: ['semantic.low_clarity'],
          evidence_refs: [
            {
              code: 'semantic.low_clarity',
              role: 'caution',
              dimension_id: 'clarity',
              evidence_ids: ['ev.aspect.mars.square.saturn'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.watch).toEqual([
      'Verify mutual understanding and avoid unclear wording.',
    ]);
    expect(view?.evidence).toHaveLength(1);
    expect(view?.evidence[0]).toMatchObject({
      dimensionId: 'clarity',
      polarity: 'cautionary',
      category: 'clarity',
    });
  });

  it('uses constructive-tone wording for grounded cooperation caution', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 70,
        drivers: [GROUNDED_DRIVERS[2]],
        dimensions: {
          cooperation: scoredDimension(
            30,
            'ev.aspect.mars.square.saturn',
            'caution'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'review',
        },
        explanation: {
          caution_codes: ['semantic.low_cooperation'],
          evidence_refs: [
            {
              code: 'semantic.low_cooperation',
              role: 'caution',
              dimension_id: 'cooperation',
              evidence_ids: ['ev.aspect.mars.square.saturn'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.watch).toEqual([
      'Keep a constructive tone throughout the conversation.',
    ]);
    expect(view?.evidence[0]).toMatchObject({
      dimensionId: 'cooperation',
      polarity: 'cautionary',
      category: 'cooperation',
    });
  });

  it('uses practical-detail wording for grounded stability verification caution', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 70,
        drivers: [GROUNDED_DRIVERS[2]],
        dimensions: {
          stability: scoredDimension(
            30,
            'ev.aspect.mars.square.saturn',
            'caution'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'review',
        },
        explanation: {
          caution_codes: ['semantic.low_stability'],
          evidence_refs: [
            {
              code: 'semantic.low_stability',
              role: 'caution',
              dimension_id: 'stability',
              evidence_ids: ['ev.aspect.mars.square.saturn'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.watch).toEqual([
      'Check the practical details before relying on them.',
    ]);
    expect(view?.evidence[0]).toMatchObject({
      dimensionId: 'stability',
      polarity: 'cautionary',
      category: 'verification',
    });
  });

  it('uses the same verification wording for grounded reversibility_safety caution', () => {
    const view = buildOfferNegotiationResultView(
      offerNegotiationPackage({
        score: 70,
        drivers: [GROUNDED_DRIVERS[2]],
        dimensions: {
          reversibility_safety: scoredDimension(
            30,
            'ev.aspect.mars.square.saturn',
            'caution'
          ),
        },
        classification: {
          scored_dimension_count: 1,
          day_class: 'review',
        },
        explanation: {
          caution_codes: ['semantic.low_reversibility_safety'],
          evidence_refs: [
            {
              code: 'semantic.low_reversibility_safety',
              role: 'caution',
              dimension_id: 'reversibility_safety',
              evidence_ids: ['ev.aspect.mars.square.saturn'],
            },
          ],
        },
      }),
      'en'
    );

    expect(view?.watch).toEqual([
      'Check the practical details before relying on them.',
    ]);
    expect(view?.evidence[0]?.dimensionId).toBe('reversibility_safety');
    expect(view?.evidence[0]?.category).toBe('verification');
  });
});

describe('mixed without a joined caution trace', () => {
  function mixedWithoutCautionTrace() {
    return offerNegotiationPackage({
      score: 100,
      drivers: GROUNDED_DRIVERS.slice(0, 1),
      dimensions: {
        momentum: scoredDimension(
          80,
          'ev.aspect.mercury.trine.mercury',
          'support'
        ),
      },
      classification: {
        scored_dimension_count: 1,
        day_class: 'mixed',
        same_dimension_conflict: true,
        conflicted_dimension_ids: ['momentum'],
        veto_dimension_ids: [],
      },
      explanation: {
        headline_code: 'semantic.mixed_conflict',
        support_codes: ['semantic.high_momentum'],
        caution_codes: ['semantic.same_dimension_conflict'],
        evidence_refs: [
          {
            code: 'semantic.high_momentum',
            role: 'support',
            dimension_id: 'momentum',
            evidence_ids: ['ev.aspect.mercury.trine.mercury'],
          },
        ],
      },
    });
  }

  it('explains mixed conditions without fabricating a Watch bullet', () => {
    const view = buildOfferNegotiationResultView(
      mixedWithoutCautionTrace(),
      'en'
    );

    expect(view?.conditionQuality).toBe('mixed');
    expect(view?.semanticInsufficient).toBe(false);
    expect(view?.watch).toEqual([]);
    expect(view?.watchNotice).toBe(
      'Mixed conditions were detected, but there is not enough grounded evidence to explain the caution precisely.'
    );
    expect(view?.supports).toEqual([
      'The timing supports opening or advancing the negotiation.',
    ]);
  });

  it('uses the required Persian insufficient-caution meaning', () => {
    const view = buildOfferNegotiationResultView(
      mixedWithoutCautionTrace(),
      'fa'
    );
    expect(view?.watchNotice).toBe(
      'شرایط ترکیبی تشخیص داده شده، اما شواهد کافی برای توضیح دقیق عامل احتیاط وجود ندارد.'
    );
    expect(view?.watch).toEqual([]);
  });

  it('does not show the notice when a grounded caution trace exists', () => {
    const view = buildOfferNegotiationResultView(groundedPackage(), 'en');
    expect(view?.watch.length).toBeGreaterThan(0);
    expect(view?.watchNotice).toBeNull();
  });
});
