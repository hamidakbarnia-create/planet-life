import { describe, expect, it } from 'vitest';
import { deriveDecisionScores } from './scores';
import type { ClarificationAnswer } from './types';

describe('deriveDecisionScores', () => {
  const answers: ClarificationAnswer[] = [
    { questionId: 'why', question: 'Why?', answer: 'Growth opportunity' },
    { questionId: 'deadline', question: 'Deadline?', answer: 'This month' },
    { questionId: 'concern', question: 'Concern?', answer: 'Career risk' },
  ];

  it('always returns filled 0–100 scores', () => {
    const scores = deriveDecisionScores(
      { todayScore: 72, weekScore: 68, monthScore: 64, avoidScore: 31 },
      answers,
      'Should I accept the offer?',
      'Career',
      null
    );
    for (const key of ['go', 'wait', 'risk', 'timing', 'confidence'] as const) {
      expect(scores[key]).toBeGreaterThanOrEqual(0);
      expect(scores[key]).toBeLessThanOrEqual(100);
      expect(Number.isFinite(scores[key])).toBe(true);
    }
  });

  it('never leaves scores empty when timing APIs return null', () => {
    const scores = deriveDecisionScores(
      { todayScore: null, weekScore: null, monthScore: null, avoidScore: null },
      answers,
      'Should I relocate?',
      'Relocation'
    );
    expect(scores.timing).toBeGreaterThanOrEqual(0);
    expect(scores.go).toBeGreaterThanOrEqual(0);
    expect(scores.wait).toBeGreaterThanOrEqual(0);
    expect(scores.risk).toBeGreaterThanOrEqual(0);
    expect(scores.confidence).toBeGreaterThanOrEqual(0);
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      timing: {
        todayScore: 70,
        weekScore: 65,
        monthScore: 60,
        avoidScore: 30,
      } as const,
      answers,
      text: 'Should I accept the offer?',
      category: 'Career' as const,
    };
    const a = deriveDecisionScores(
      input.timing,
      input.answers,
      input.text,
      input.category,
      null
    );
    const b = deriveDecisionScores(
      input.timing,
      input.answers,
      input.text,
      input.category,
      null
    );
    expect(a).toEqual(b);
  });

  it('increases risk for irreversible language', () => {
    const low = deriveDecisionScores(
      { todayScore: 60, weekScore: 60, monthScore: 60, avoidScore: 40 },
      [{ questionId: 'reversible', question: 'Reversible?', answer: 'Easily reversible' }],
      'Small experiment',
      'Other'
    );
    const high = deriveDecisionScores(
      { todayScore: 60, weekScore: 60, monthScore: 60, avoidScore: 40 },
      [{ questionId: 'reversible', question: 'Reversible?', answer: 'Nearly permanent' }],
      'Permanent move',
      'Relocation'
    );
    expect(high.risk).toBeGreaterThan(low.risk);
  });
});
