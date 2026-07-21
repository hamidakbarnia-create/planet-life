import { describe, expect, it } from 'vitest';
import {
  applyWritingQualityLayer,
  buildSafeNowFallbacks,
  extractDecisionInvariants,
  writingQualityOutline,
  writingQualityProseBlob,
  writingVariant,
} from '@/lib/ask-decision/writing-quality';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import { WRITING_SEMANTIC_FIXTURES } from '@/lib/ask-decision/writing-quality.semantic.fixtures';
import { buildStructuredFallback } from '@/lib/ask-decision/fallback';
import { detectIntent } from '@/lib/ask-decision/intent';
import { frameDecision } from '@/lib/ask-decision/framing';
import { buildTimingIntelligence } from '@/lib/ask-decision/local-build';
import type { AskDecisionResult } from '@/lib/ask-decision/types';

function buildFaFallback(
  question: string,
  requestId: string
): AskDecisionResult {
  const intent = detectIntent(question);
  const frame = frameDecision(question, intent);
  return buildStructuredFallback({
    intent,
    frame,
    timing: buildTimingIntelligence(null, false, false, 'fa'),
    usedProfile: true,
    usedTiming: false,
    decisionStyles: ['analytical', 'cautious'],
    generatedAt: '2026-07-21T12:00:00.000Z',
    requestId,
    clarificationAnswer: null,
    reason: 'unknown',
    locale: 'fa',
  });
}

describe('writing quality layer', () => {
  it('preserves structured meaning invariants (fa fallback)', () => {
    const base = buildFaFallback(
      'Should I ask for a raise this month?',
      'wq-inv-fa'
    );
    const out = applyWritingQualityLayer(base, 'fa');
    expect(extractDecisionInvariants(out)).toEqual(
      extractDecisionInvariants(base)
    );
  });

  it('preserves structured meaning invariants (en provider fixture)', () => {
    const base = englishProviderResult;
    const out = applyWritingQualityLayer(base, 'en');
    expect(extractDecisionInvariants(out)).toEqual(
      extractDecisionInvariants(base)
    );
  });

  it('snapshot: invariants unchanged while wording outline is stable (fa)', () => {
    const base = buildFaFallback(
      'چه زمانی برای درخواست افزایش حقوق مناسب است؟',
      'wq-snap-fa'
    );
    const out = applyWritingQualityLayer(base, 'fa');

    expect(extractDecisionInvariants(out)).toEqual(
      extractDecisionInvariants(base)
    );
    expect(extractDecisionInvariants(out)).toMatchSnapshot(
      'fa-decision-invariants'
    );
    expect(writingQualityOutline(out)).toMatchSnapshot('fa-writing-outline');
  });

  it('snapshot: invariants unchanged while wording outline is stable (en)', () => {
    const out = applyWritingQualityLayer(englishProviderResult, 'en');

    expect(extractDecisionInvariants(out)).toEqual(
      extractDecisionInvariants(englishProviderResult)
    );
    expect(extractDecisionInvariants(out)).toMatchSnapshot(
      'en-decision-invariants'
    );
    expect(writingQualityOutline(out)).toMatchSnapshot('en-writing-outline');
  });

  it('does not remove risks or opportunities', () => {
    const out = applyWritingQualityLayer(englishProviderResult, 'en');
    expect(out.analysis.some((c) => c.id === 'risks')).toBe(true);
    expect(out.analysis.some((c) => c.id === 'opportunities')).toBe(true);
    expect(out.analysis.find((c) => c.id === 'risks')?.body).toBe(
      englishProviderResult.analysis.find((c) => c.id === 'risks')?.body
    );
    expect(out.analysis.find((c) => c.id === 'opportunities')?.body).toBe(
      englishProviderResult.analysis.find((c) => c.id === 'opportunities')
        ?.body
    );
  });

  it('does not change recommendationStatus, confidence, scores, timing, or intent', () => {
    const base = englishProviderResult;
    const out = applyWritingQualityLayer(base, 'en');
    expect(out.recommendationStatus).toBe(base.recommendationStatus);
    expect(out.confidence).toBe(base.confidence);
    expect(out.scores).toBe(base.scores);
    expect(out.timing).toBe(base.timing);
    expect(out.intent).toBe(base.intent);
  });

  it('builds fa summary / why / actions / missing-info outline', () => {
    const base = buildFaFallback('چه زمانی برای درخواست مناسب است؟', 'wq-fa');
    const out = applyWritingQualityLayer(base, 'fa');
    const outline = writingQualityOutline(out);

    expect(outline['خلاصه تصمیم']).toMatch(/[\u0600-\u06FF]/);
    expect(outline['خلاصه تصمیم']).not.toMatch(
      /نگرانی اصلی به‌طور کامل بیان نشده/
    );
    expect(outline['چرا؟']).toBeTruthy();
    expect(outline['قبل از اقدام چه کار کنید؟'].length).toBeGreaterThanOrEqual(
      1
    );
    expect(outline['چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟']).toBeTruthy();
    expect(out.meta?.sources).toContain('writing-quality');
  });

  it('does not invent astrology claims in rewritten prose', () => {
    const out = applyWritingQualityLayer(englishProviderResult, 'en');
    const blob = writingQualityProseBlob(out);
    expect(blob).not.toMatch(/mercury retrograde|horoscope|zodiac|طالع/i);
  });
});

describe('writing quality semantic fixtures', () => {
  it.each(WRITING_SEMANTIC_FIXTURES)(
    '$id retains must-have information in wording',
    (fixture) => {
      const out = applyWritingQualityLayer(fixture.result, fixture.locale);
      expect(extractDecisionInvariants(out)).toEqual(
        extractDecisionInvariants(fixture.result)
      );

      const blob = writingQualityProseBlob(out).toLowerCase();
      for (const token of fixture.mustRetain) {
        expect(blob).toContain(token.toLowerCase());
      }

      // Risks / opportunities bodies preserved verbatim
      expect(out.analysis.find((c) => c.id === 'risks')?.body).toBe(
        fixture.result.analysis.find((c) => c.id === 'risks')?.body
      );
      expect(out.analysis.find((c) => c.id === 'opportunities')?.body).toBe(
        fixture.result.analysis.find((c) => c.id === 'opportunities')?.body
      );
    }
  );

  it('does not invent actions beyond existing or safe fallbacks', () => {
    for (const fixture of WRITING_SEMANTIC_FIXTURES) {
      const out = applyWritingQualityLayer(fixture.result, fixture.locale);
      const safe = buildSafeNowFallbacks(fixture.result, fixture.locale).map(
        (a) => a.action
      );
      const before = fixture.result.actionPlan.now.map((a) => a.action.trim());

      expect(out.actionPlan.now.length).toBe(before.length);
      for (const item of out.actionPlan.now) {
        const ok =
          before.includes(item.action) ||
          safe.includes(item.action) ||
          // polished non-mechanical keep exact text
          before.some((b) => b === item.action);
        expect(ok).toBe(true);
      }
    }
  });

  it('does not pad a short action list up to three invented bullets', () => {
    const base = structuredClone(englishProviderResult);
    base.actionPlan.now = [
      {
        action: 'Call the hiring manager about scope',
        purpose: 'Clarify',
        priority: 'high',
        completionSignal: 'Call done',
      },
    ];
    const out = applyWritingQualityLayer(base, 'en');
    expect(out.actionPlan.now).toHaveLength(1);
    expect(out.actionPlan.now[0]?.action).toBe(
      'Call the hiring manager about scope'
    );
  });

  it('uses only predefined safe fallbacks when now-plan is empty', () => {
    const base = structuredClone(englishProviderResult);
    base.actionPlan.now = [];
    const out = applyWritingQualityLayer(base, 'en');
    const safe = buildSafeNowFallbacks(base, 'en').map((a) => a.action);
    expect(out.actionPlan.now).toHaveLength(3);
    expect(out.actionPlan.now.map((a) => a.action)).toEqual(safe);
  });

  it('varies summary openings across semantic scenarios', () => {
    const openings = WRITING_SEMANTIC_FIXTURES.map((fixture) => {
      const out = applyWritingQualityLayer(fixture.result, fixture.locale);
      // Force mechanical path so variant templates are used
      const forced = applyWritingQualityLayer(
        {
          ...fixture.result,
          executiveSummary: 'Decision: placeholder mechanical',
        },
        fixture.locale
      );
      return {
        id: fixture.id,
        variant: writingVariant(fixture.result),
        opening: forced.executiveSummary.slice(0, 48),
        keptNatural: out.executiveSummary,
      };
    });

    const variants = new Set(openings.map((o) => o.variant));
    expect(variants.size).toBeGreaterThanOrEqual(2);

    const forcedOpenings = openings.map((o) => o.opening);
    expect(new Set(forcedOpenings).size).toBeGreaterThanOrEqual(2);

    // Natural non-mechanical summaries keep scenario-specific openings
    const naturalStarts = openings.map((o) => o.keptNatural.slice(0, 24));
    expect(new Set(naturalStarts).size).toBeGreaterThanOrEqual(3);
  });
});
