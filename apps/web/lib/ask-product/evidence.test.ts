import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import {
  buildEvaluatePresentation,
  mapPackageEvidence,
  packageStrength,
  resolveDriverPolarity,
} from './evidence';
import { getAskProductCopy } from './copy';

function runtimePackage(overrides?: {
  decision_type_id?: string;
  score?: number;
  drivers?: ReturnType<typeof bindDemoStubPackage>['drivers'];
}) {
  const base = bindDemoStubPackage({
    caseId: '11111111-1111-4111-8111-111111111111',
    caseVersion: 1,
    intake: { target_date: '2026-08-18', role: 'Engineer' },
  });
  const score = overrides?.score ?? 81;
  return {
    ...base,
    decision_type_id: overrides?.decision_type_id ?? 'car-interview',
    engine_id: 'decision-engine-car-interview-v1',
    timing: {
      ...base.timing,
      score,
      candidates: base.timing.candidates.map((c, i) =>
        i === 0 ? { ...c, score, date: '2026-08-18' } : c
      ),
    },
    confidence: {
      value: 70,
      precision_level: 'L3' as const,
      penalties: [],
    },
    drivers: overrides?.drivers ?? base.drivers,
  };
}

describe('ask-product evidence mapping honesty', () => {
  it('derives strength from Package timing candidate score', () => {
    expect(packageStrength(runtimePackage())).toBe('strong');
  });

  it('meaning is restrained presentation of score band — not domain invention', () => {
    const pkg = runtimePackage();
    const model = buildEvaluatePresentation(pkg, 'en');
    expect(model?.meaningSource).toBe('timing.score_band');
    expect(model?.meaning).toBe('Timing signal is strongly supportive.');
    expect(model?.meaning).not.toMatch(/negotiation|communication|interaction/i);
    expect(model?.meaning).not.toMatch(/Proceed with|Frontend Engineer|Metioro/i);
  });

  it('same band does not invent interview meaning for non-interview types', () => {
    const pkg = runtimePackage({ decision_type_id: 'mar-wedding-date' });
    const model = buildEvaluatePresentation(pkg, 'en', { topic: 'Wedding' });
    expect(model?.meaning).toBe('Timing signal is strongly supportive.');
    expect(model?.scopeSource).toBe('generic-timing');
    expect(model?.scope).not.toMatch(/interview|employer|salary/i);
  });

  it('uses generic timing scope for product launch packages', () => {
    const pkg = runtimePackage({ decision_type_id: 'bus-product-launch' });
    const model = buildEvaluatePresentation(pkg, 'en', { topic: 'Launch' });
    expect(model?.scopeSource).toBe('generic-timing');
    expect(model?.scope).not.toMatch(/interview|employer|salary|market fit/i);
  });

  it('car-interview scope uses Runtime-1 negotiation contract only for that type', () => {
    const model = buildEvaluatePresentation(runtimePackage(), 'en');
    expect(model?.scopeSource).toBe('car-interview-contract');
    expect(model?.scope).toMatch(/interview negotiation/i);
  });

  it('maps drivers by polarity with full traceability', () => {
    const pkg = runtimePackage();
    const en = mapPackageEvidence(pkg, 'en');
    expect(en[0]).toMatchObject({
      driverLabel: 'Visibility',
      polarity: 'supportive',
      driverSupport: 'The selected date supports clear presentation.',
      source: 'drivers.label_support',
      title: 'Visibility',
      detail: 'The selected date supports clear presentation.',
    });
    expect(en.some((e) => e.polarity === 'cautionary')).toBe(true);

    const fa = mapPackageEvidence(pkg, 'fa');
    expect(fa[0]?.source).toBe('drivers.polarity');
    expect(fa[0]?.polarity).toBe('supportive');
    expect(fa[0]?.title).toBe(getAskProductCopy('fa').evidenceDetailUnavailable);
    expect(fa[0]?.detail).toContain(getAskProductCopy('fa').evidenceSupportive);
    expect(fa[0]?.detail).not.toMatch(/Visibility|presentation|selected date/i);
    expect(fa[0]?.driverLabel).toBe('Visibility');
    expect(fa[0]?.title).not.toMatch(/Visibility|Supporting factor/i);
  });

  it('localizes known factor_key for EN/FA/AR/RU without ordinal placeholders', () => {
    const pkg = runtimePackage({
      drivers: {
        items: [
          {
            id: 'aspect-1',
            label: 'Transit Mercury square natal Saturn',
            contribution: -3.5,
            polarity: 'cautionary',
            importance: 'high',
            factor_key: 'aspect.mercury.square.saturn',
            score: 3.5,
            band: 'low',
            support: '',
            friction: 'Communication friction rises.',
          },
          {
            id: 'house-1',
            label: 'Natal Mercury in 10th house',
            contribution: 1.5,
            polarity: 'supportive',
            importance: 'medium',
            factor_key: 'house.natal.mercury.10',
            score: 1.5,
            band: 'high',
            support: 'Career house support.',
            friction: '',
          },
        ],
      },
    });

    const en = mapPackageEvidence(pkg, 'en');
    expect(en[0]).toMatchObject({
      source: 'drivers.factor_key',
      polarity: 'cautionary',
      title: 'Transit Mercury square natal Saturn',
      factorKey: 'aspect.mercury.square.saturn',
    });
    expect(en[1]?.title).toBe('Natal Mercury in 10th house');

    const fa = mapPackageEvidence(pkg, 'fa');
    expect(fa[0]?.source).toBe('drivers.factor_key');
    expect(fa[0]?.title).toContain('عطارد');
    expect(fa[0]?.title).toContain('زحل');
    expect(fa[0]?.title).not.toMatch(/Supporting factor|higher weight|\d/);
    expect(fa[0]?.detail).toBeUndefined();

    const ar = mapPackageEvidence(pkg, 'ar');
    expect(ar[0]?.title).toContain('عطارد');
    expect(ar[0]?.title).toContain('زحل');

    const ru = mapPackageEvidence(pkg, 'ru');
    expect(ru[0]?.title).toMatch(/Меркурия|Меркурий/);
    expect(ru[0]?.title).toContain('Сатурн');
  });

  it('old packages without factor_key keep polarity grouping and honest FA/AR/RU fallback', () => {
    const pkg = runtimePackage({
      drivers: {
        items: [
          {
            id: 'a',
            label: 'Mercury square',
            contribution: -1.2,
            polarity: 'cautionary',
            importance: 'medium',
            score: 1.2,
            band: 'low',
            support: '',
            friction: 'Communication friction rises.',
          },
          {
            id: 'b',
            label: 'Mars hard aspect',
            contribution: 2.4,
            polarity: 'supportive',
            importance: 'high',
            score: 2.4,
            band: 'high',
            support: 'Momentum available.',
            friction: '',
          },
        ],
      },
    });
    const fa = mapPackageEvidence(pkg, 'fa');
    expect(fa).toHaveLength(2);
    expect(fa[0]?.polarity).toBe('cautionary');
    expect(fa[1]?.polarity).toBe('supportive');
    expect(fa.every((e) => e.title === getAskProductCopy('fa').evidenceDetailUnavailable)).toBe(
      true
    );
    expect(fa[0]?.detail).toContain(getAskProductCopy('fa').evidenceCaution);
    expect(fa[0]?.detail).toContain(getAskProductCopy('fa').importance.medium);
    expect(fa[1]?.detail).toContain(getAskProductCopy('fa').evidenceSupportive);
    expect(new Set(fa.map((e) => `${e.title}|${e.detail}`)).size).toBe(2);
    // Consumer-facing title/detail must not dump English Package prose.
    expect(fa.map((e) => `${e.title}\n${e.detail ?? ''}`).join('\n')).not.toMatch(
      /Mercury|Mars|Communication|Momentum/
    );

    const en = mapPackageEvidence(pkg, 'en');
    expect(en[0]?.title).toBe('Mercury square');
    expect(en[1]?.title).toBe('Mars hard aspect');
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'unknown factor_key caution rows stay distinct via localized metadata in %s',
    (lang) => {
      const copy = getAskProductCopy(lang);
      const pkg = runtimePackage({
        drivers: {
          items: [
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
      });
      const caution = mapPackageEvidence(pkg, lang);
      expect(caution).toHaveLength(3);
      expect(caution.every((e) => e.title === copy.evidenceDetailUnavailable)).toBe(true);
      expect(caution.every((e) => e.polarity === 'cautionary')).toBe(true);
      expect(caution.every((e) => Boolean(e.detail))).toBe(true);
      const rowText = caution.map((e) => `${e.title}\n${e.detail}`);
      expect(new Set(rowText).size).toBe(3);
      expect(rowText.join('\n')).not.toMatch(/Pace|Structure|Clarity|compressed|structure helps|Clarify/i);
      expect(rowText.join('\n')).not.toMatch(/factor\s*[123]|عامل\s*[۱۲۳]|عامل\s*[123]/i);
    }
  );

  it('does not invent factors beyond package drivers', () => {
    const pkg = runtimePackage({
      drivers: {
        items: [
          {
            id: 'only',
            label: 'Visibility',
            contribution: 2,
            polarity: 'supportive',
            factor_key: 'aspect.mercury.trine.jupiter',
            score: 2,
            band: 'high',
            support: 'ok',
            friction: '',
          },
        ],
      },
    });
    const evidence = mapPackageEvidence(pkg, 'fa');
    expect(evidence).toHaveLength(1);
    expect(evidence[0]?.factorKey).toBe('aspect.mercury.trine.jupiter');
  });

  it('maps contribution polarity invariants for displayed evidence', () => {
    const pkg = runtimePackage({
      drivers: {
        items: [
          {
            id: 'pos',
            label: 'A',
            contribution: 2,
            polarity: 'supportive',
            factor_key: 'retrograde.mercury',
            score: 2,
            band: 'high',
            support: '',
            friction: '',
          },
          {
            id: 'neg',
            label: 'B',
            contribution: -2,
            polarity: 'cautionary',
            factor_key: 'angular.mars.mc',
            score: 2,
            band: 'low',
            support: '',
            friction: '',
          },
          {
            id: 'zero',
            label: 'C',
            contribution: 0,
            polarity: 'neutral',
            score: 0,
            band: 'moderate',
            support: '',
            friction: '',
          },
        ],
      },
    });
    const lines = mapPackageEvidence(pkg, 'en');
    expect(lines.find((e) => e.contribution! > 0)?.polarity).toBe('supportive');
    expect(lines.find((e) => e.contribution! < 0)?.polarity).toBe('cautionary');
    expect(lines.find((e) => e.contribution === 0)?.polarity).toBe('neutral');
  });

  it('resolves polarity from contribution when polarity omitted', () => {
    expect(resolveDriverPolarity({ contribution: 2 })).toBe('supportive');
    expect(resolveDriverPolarity({ contribution: -1 })).toBe('cautionary');
    expect(resolveDriverPolarity({ contribution: 0 })).toBe('neutral');
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'does not fall back to English Package prose for %s meaning/evidence',
    (lang) => {
      const model = buildEvaluatePresentation(runtimePackage(), lang);
      expect(model?.meaning).toBe(
        getAskProductCopy(lang).meaningByStrength.strong
      );
      expect(model?.meaning).not.toMatch(/[A-Za-z]{4,}/);
      const evidenceSurface = model?.evidence
        .map((e) => `${e.title}\n${e.detail ?? ''}`)
        .join('\n');
      expect(evidenceSurface).not.toMatch(
        /Visibility|Preparation|presentation|friction|selected date/i
      );
      expect(model?.recommendationDetail).toBeUndefined();
    }
  );

  it('returns null for blocked insufficient packages', () => {
    const base = runtimePackage();
    const blocked = {
      ...base,
      recommendation: {
        ...base.recommendation,
        stance: 'insufficient_data' as const,
      },
      timing: { ...base.timing, material: false },
    };
    expect(buildEvaluatePresentation(blocked, 'en')).toBeNull();
  });

  it('shows 100 timing score honestly with separate confidence', () => {
    const model = buildEvaluatePresentation(runtimePackage({ score: 100 }), 'en');
    expect(model?.score).toBe(100);
    expect(model?.scoreLabel).toBe('Timing score: 100 / 100');
    expect(model?.scoreHonestyNote).toMatch(/not probability|certainty/i);
    expect(model?.confidence).toBeTruthy();
    expect(model?.scoreLabel).not.toEqual(model?.confidence);
  });

  it('investor evaluate presentation avoids probability/success claims', () => {
    const model = buildEvaluatePresentation(
      runtimePackage({ decision_type_id: 'bus-investor-meeting', score: 100 }),
      'en',
      { topic: 'Meet an investor' }
    );
    const blob = [
      model?.recommendation,
      model?.recommendationDetail,
      model?.meaning,
      model?.scope,
    ].join(' ');
    expect(blob).not.toMatch(
      /will invest|fundraising probability|meeting success|guaranteed investment/i
    );
    expect(model?.scoreLabel).toMatch(/Timing score/);
    expect(model?.packageLimits.length).toBeGreaterThanOrEqual(0);
    expect(model?.recommendation).toBeTruthy();
  });

  it('separates supportive and cautionary evidence by polarity', () => {
    const model = buildEvaluatePresentation(runtimePackage(), 'en');
    expect(model?.supportiveEvidence.length).toBeGreaterThan(0);
    expect(model?.cautionaryEvidence.length).toBeGreaterThan(0);
    expect(
      model?.supportiveEvidence.every((e) => e.polarity === 'supportive')
    ).toBe(true);
    expect(
      model?.cautionaryEvidence.every((e) => e.polarity === 'cautionary')
    ).toBe(true);
  });

  it('surfaces limits and recommendation from package data', () => {
    const model = buildEvaluatePresentation(runtimePackage(), 'en');
    expect(model?.recommendation).toBeTruthy();
    expect(model?.packageLimits.length).toBeGreaterThan(0);
    expect(model?.scope).toBeTruthy();
  });

  it('first-viewport field order keeps topic→date→verdict before evidence/confidence', () => {
    const model = buildEvaluatePresentation(runtimePackage(), 'en');
    expect(model).not.toBeNull();
    const keys = Object.keys(model!);
    expect(keys.indexOf('topic')).toBeLessThan(keys.indexOf('date'));
    expect(keys.indexOf('date')).toBeLessThan(keys.indexOf('verdict'));
    expect(keys.indexOf('verdict')).toBeLessThan(keys.indexOf('scoreLabel'));
    expect(keys.indexOf('recommendation')).toBeLessThan(
      keys.indexOf('supportiveEvidence')
    );
    expect(keys.indexOf('supportiveEvidence')).toBeLessThan(keys.indexOf('scope'));
    expect(JSON.stringify(model)).not.toMatch(/\bUnknown\b/);
    expect(JSON.stringify(model)).not.toMatch(/best_window|avoid|deciding_factor/);
  });
});
