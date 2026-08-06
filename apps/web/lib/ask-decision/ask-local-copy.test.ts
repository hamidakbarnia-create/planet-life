import { describe, expect, it } from 'vitest';
import { askCopy } from '@/lib/ask-decision/ask-local-copy';
import { buildStructuredFallback } from '@/lib/ask-decision/fallback';
import {
  buildLocalActionPlan,
  buildLocalAnalysis,
  buildLocalScores,
  buildTimingIntelligence,
} from '@/lib/ask-decision/local-build';
import { detectIntent } from '@/lib/ask-decision/intent';
import { frameDecision } from '@/lib/ask-decision/framing';

const PERSIAN = /[\u0600-\u06FF]/;

describe('askCopy', () => {
  it('interpolates variables', () => {
    const text = askCopy('en', 'analysis.situation.body', {
      decision: 'accept offer',
      intent: 'career',
      horizon: 'weeks',
    });
    expect(text).toContain('accept offer');
    expect(text).toContain('career');
    expect(text).toContain('weeks');
  });

  it('never silently falls back to English for fa missing keys', () => {
    const text = askCopy('fa', 'this.key.does.not.exist');
    expect(text).toMatch(PERSIAN);
    expect(text.toLowerCase()).not.toContain('recommendation');
  });

  it('fa fallback strings contain Persian and exclude English scaffolds', () => {
    const keys = [
      'fallback.recommendation',
      'fallback.lowConfidence',
      'fallback.limit.structured',
      'fallback.limit.retry',
      'parse.gatherInput',
      'analysis.factors.title',
      'exec.recommendation',
    ] as const;

    for (const key of keys) {
      const text = askCopy('fa', key, { status: 'wait', reason: 'network' });
      expect(text, key).toMatch(PERSIAN);
      expect(text, key).not.toContain('Recommendation:');
      expect(text, key).not.toContain('Main Factors');
      expect(text, key).not.toContain('Gather one critical');
    }
  });

  it('ar and ru also avoid English scaffold phrases', () => {
    for (const locale of ['ar', 'ru'] as const) {
      const text = askCopy(locale, 'fallback.recommendation');
      expect(text).not.toContain('Recommendation:');
      expect(text).not.toContain('Gather one critical');
      expect(text).not.toContain('Main Factors');
    }
  });
});

describe('localized local-build / fallback', () => {
  it('fa local builders emit Persian without English scaffolds', () => {
    const intent = detectIntent('Should I accept this job offer?');
    const frame = frameDecision('Should I accept this job offer?', intent);
    const scores = buildLocalScores(frame, intent, null, false, 'fa');
    const analysis = buildLocalAnalysis(
      frame,
      intent,
      askCopy('fa', 'parse.advancePilot'),
      false,
      [],
      'fa'
    );
    const actions = buildLocalActionPlan(frame, 'fa');
    const timing = buildTimingIntelligence(null, true, false, 'fa');
    const fallback = buildStructuredFallback({
      intent,
      frame,
      timing,
      usedProfile: false,
      usedTiming: false,
      decisionStyles: [],
      generatedAt: '2026-07-20T12:00:00.000Z',
      requestId: null,
      clarificationAnswer: null,
      reason: 'network',
      locale: 'fa',
    });

    const blob = [
      scores.opportunity.rationale,
      analysis.map((a) => `${a.title} ${a.body}`).join(' '),
      actions.now.map((a) => a.action).join(' '),
      timing.timingRationale,
      fallback.recommendation,
      fallback.confidence.explanation,
      fallback.limitations.join(' '),
    ].join('\n');

    expect(blob).toMatch(PERSIAN);
    expect(blob).not.toContain('Recommendation:');
    expect(blob).not.toContain('Main Factors');
    expect(blob).not.toContain('Gather one critical');
  });
});
