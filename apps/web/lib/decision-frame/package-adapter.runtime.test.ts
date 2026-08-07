import { describe, expect, it } from 'vitest';
import { bindDemoStubPackage } from '@/lib/decision-case';
import { packageToEvaluateView } from '@/lib/decision-frame';

describe('package adapter honesty for real runtime packages', () => {
  it('maps insufficient natal evidence to Unknown strength/confidence/alternative', () => {
    const pkg = {
      ...bindDemoStubPackage({
        caseId: '11111111-1111-4111-8111-111111111111',
        caseVersion: 1,
        intake: { target_date: '2026-08-18', role: 'Engineer' },
      }),
      engine_id: 'decision-engine-car-interview-v1',
      recommendation: {
        stance: 'insufficient_data' as const,
        conditions: ['Add birth evidence'],
        summary: 'Cannot evaluate without natal evidence.',
      },
      timing: {
        material: false,
        band: 'na' as const,
        score: null,
        candidates: [
          {
            date: '2026-08-18',
            rank: 1,
            score: 0,
            band: 'low' as const,
          },
        ],
        notes: 'Timing not evaluated',
      },
      confidence: {
        value: 0,
        precision_level: 'L3' as const,
        penalties: [
          {
            code: 'MISSING_NATAL_EVIDENCE',
            message: 'Birth evidence required',
          },
        ],
      },
      counter_recommendation: {
        stance: 'insufficient_data' as const,
        summary: '',
        reason: 'No alternative date was evaluated.',
      },
    };

    const view = packageToEvaluateView(pkg);
    expect(view.strength).toBe('unknown');
    expect(view.confidence).toBe('unknown');
    expect(view.best_window).toBeUndefined();
    expect(view.avoid).toBeUndefined();
    expect(view.best_alternative).toBeUndefined();
  });

  it('maps real score bands without inventing windows', () => {
    const pkg = {
      ...bindDemoStubPackage({
        caseId: '11111111-1111-4111-8111-111111111111',
        caseVersion: 1,
        intake: { target_date: '2026-08-18', role: 'Engineer' },
      }),
      engine_id: 'decision-engine-car-interview-v1',
      timing: {
        material: true,
        band: 'high' as const,
        score: 70,
        candidates: [
          {
            date: '2026-08-18',
            rank: 1,
            score: 70,
            band: 'high' as const,
          },
        ],
        notes: 'Date-level score only. No clock-time window was computed.',
      },
      confidence: {
        value: 61,
        precision_level: 'L3' as const,
        penalties: [],
      },
      counter_recommendation: {
        stance: 'wait' as const,
        summary: '',
        reason: 'No alternative date was evaluated.',
      },
    };
    const view = packageToEvaluateView(pkg);
    expect(view.strength).toBe('favorable');
    expect(view.best_window).toBeUndefined();
    expect(view.best_alternative).toBeUndefined();
    expect(view.confidence).toBe('medium');
  });

  it('treats confidence.value=0 + CONFIDENCE_UNAVAILABLE as Unknown, not low', () => {
    const pkg = {
      ...bindDemoStubPackage({
        caseId: '11111111-1111-4111-8111-111111111111',
        caseVersion: 1,
        intake: { target_date: '2026-08-18', role: 'Engineer' },
      }),
      engine_id: 'decision-engine-car-interview-v1',
      timing: {
        material: true,
        band: 'high' as const,
        score: 70,
        candidates: [
          { date: '2026-08-18', rank: 1, score: 70, band: 'high' as const },
        ],
        notes: 'Date-level',
      },
      confidence: {
        value: 0,
        precision_level: 'L3' as const,
        penalties: [
          {
            code: 'CONFIDENCE_UNAVAILABLE',
            message: 'Package confidence.value=0 is a schema placeholder',
          },
        ],
      },
      counter_recommendation: {
        stance: 'wait' as const,
        summary: '',
        reason: 'No alternative',
      },
    };
    const view = packageToEvaluateView(pkg);
    expect(view.confidence).toBe('unknown');
    expect(view.confidence).not.toBe('low');
  });
});
