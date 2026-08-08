import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import {
  buildEvaluatePresentation,
  mapPackageEvidence,
  packageStrength,
} from './evidence';
import { getAskProductCopy } from './copy';

function runtimePackage(overrides?: {
  decision_type_id?: string;
  score?: number;
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

  it('maps drivers with full traceability', () => {
    const pkg = runtimePackage();
    const en = mapPackageEvidence(pkg, 'en');
    expect(en[0]).toMatchObject({
      driverLabel: 'Visibility',
      driverBand: 'high',
      driverSupport: 'The selected date supports clear presentation.',
      source: 'drivers.label_support',
      title: getAskProductCopy('en').evidenceSupportive,
      detail: 'Visibility: The selected date supports clear presentation.',
    });

    const fa = mapPackageEvidence(pkg, 'fa');
    expect(fa[0]?.source).toBe('drivers.band');
    expect(fa[0]?.title).toBe(getAskProductCopy('fa').evidenceSupportive);
    expect(fa[0]?.detail).toBeUndefined();
    expect(fa[0]?.driverLabel).toBe('Visibility');
  });

  it.each(['fa', 'ar', 'ru'] as const)(
    'does not fall back to English Package prose for %s meaning/evidence',
    (lang) => {
      const model = buildEvaluatePresentation(runtimePackage(), lang);
      expect(model?.meaning).toBe(
        getAskProductCopy(lang).meaningByStrength.strong
      );
      expect(model?.meaning).not.toMatch(/[A-Za-z]{4,}/);
      expect(model?.evidence.every((e) => !e.detail)).toBe(true);
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

  it('first-viewport field order is topic→date→verdict→score→meaning→evidence→scope→confidence', () => {
    const model = buildEvaluatePresentation(runtimePackage(), 'en');
    expect(model).not.toBeNull();
    const keys = Object.keys(model!);
    expect(keys.indexOf('topic')).toBeLessThan(keys.indexOf('date'));
    expect(keys.indexOf('date')).toBeLessThan(keys.indexOf('verdict'));
    expect(keys.indexOf('verdict')).toBeLessThan(keys.indexOf('meaning'));
    expect(keys.indexOf('meaning')).toBeLessThan(keys.indexOf('evidence'));
    expect(keys.indexOf('evidence')).toBeLessThan(keys.indexOf('scope'));
    expect(keys.indexOf('scope')).toBeLessThan(keys.indexOf('confidence'));
    expect(JSON.stringify(model)).not.toMatch(/\bUnknown\b/);
    expect(JSON.stringify(model)).not.toMatch(/best_window|avoid|deciding_factor/);
  });
});
