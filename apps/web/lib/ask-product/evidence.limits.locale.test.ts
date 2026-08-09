import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { buildEvaluatePresentation } from './evidence';

describe('EVALUATE package limit localization', () => {
  it('localizes known investor-style limits for FA/AR/RU', () => {
    const base = bindDemoStubPackage({
      caseId: '11111111-1111-4111-8111-111111111111',
      caseVersion: 1,
      intake: { target_date: '2026-08-18', role: 'Engineer' },
    });
    const limits = [
      'This is negotiation/communication timing evidence, not investment-outcome prediction.',
      'No best clock-time window was computed.',
      'Alternative dates were not searched.',
    ];
    const pkg = {
      ...base,
      decision_type_id: 'bus-investor-meeting',
      explainability: {
        ...base.explainability,
        limits,
      },
    };

    const en = buildEvaluatePresentation(pkg, 'en');
    expect(en?.packageLimits).toEqual(limits.slice(0, 4));

    for (const lang of ['fa', 'ar', 'ru'] as const) {
      const model = buildEvaluatePresentation(pkg, lang);
      expect(model?.packageLimits.length).toBe(3);
      for (const english of limits) {
        expect(model?.packageLimits.join('\n')).not.toContain(english);
      }
    }
  });
});
