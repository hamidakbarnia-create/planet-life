import { describe, expect, it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { WRITING_SEMANTIC_FIXTURES } from '@/lib/ask-decision/writing-quality.semantic.fixtures';
import {
  applyWritingQualityLayer,
  extractDecisionInvariants,
  writingQualityOutline,
  buildSafeNowFallbacks,
} from '@/lib/ask-decision/writing-quality';
import { localizeAskDecisionPresentation } from '@/lib/ask-decision/localize-presentation';
import type { AppLang } from '@/lib/app-settings';
import type { AskDecisionResult } from '@/lib/ask-decision/types';

const LOCALES: AppLang[] = ['fa', 'ar', 'ru'];
const OUT_DIR = join(process.cwd(), 'locale-evidence', 'writing-quality-staging');

function locateTokens(
  outline: ReturnType<typeof writingQualityOutline>,
  result: AskDecisionResult,
  tokens: string[]
) {
  return tokens.map((token) => {
    const t = token.toLowerCase();
    const places: string[] = [];
    if (outline['خلاصه تصمیم'].toLowerCase().includes(t)) places.push('خلاصه تصمیم');
    if (outline['چرا؟'].toLowerCase().includes(t)) places.push('چرا؟');
    if (
      outline['قبل از اقدام چه کار کنید؟'].some((a) => a.toLowerCase().includes(t))
    ) {
      places.push('قبل از اقدام');
    }
    if (
      outline['چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟'].toLowerCase().includes(t)
    ) {
      places.push('چه اطلاعاتی');
    }
    if (result.recommendation.toLowerCase().includes(t)) places.push('recommendation');
    for (const card of result.analysis) {
      if (card.body.toLowerCase().includes(t)) places.push(card.id);
    }
    for (const a of result.actionPlan.now) {
      if (a.action.toLowerCase().includes(t)) places.push('action.now');
    }
    for (const key of Object.keys(result.scores) as Array<keyof typeof result.scores>) {
      if (result.scores[key].rationale.toLowerCase().includes(t)) {
        places.push(`score.${key}`);
      }
    }
    return {
      token,
      retained: places.length > 0,
      where: places.length ? [...new Set(places)].join(', ') : 'LOST',
    };
  });
}

describe('writing quality staging semantic matrix', () => {
  it('runs fa/ar/ru matrix and writes evidence report', () => {
    const scenarios: unknown[] = [];

    for (const fixture of WRITING_SEMANTIC_FIXTURES) {
      for (const locale of LOCALES) {
        const before = structuredClone(fixture.result);
        const beforeInv = extractDecisionInvariants(before);

        // WQ-only path (presentation polish)
        const wqOnly = applyWritingQualityLayer(structuredClone(before), locale);
        // Full Ask presentation path
        const after = localizeAskDecisionPresentation(
          structuredClone(before),
          locale
        );
        const afterInv = extractDecisionInvariants(after);
        const outline = writingQualityOutline(after);
        const safe = buildSafeNowFallbacks(before, locale).map((a) => a.action);
        const beforeActions = before.actionPlan.now.map((a) => a.action.trim());
        const wqActions = wqOnly.actionPlan.now.map((a) => a.action.trim());

        // Invented = after WQ actions that are neither original nor safe fallbacks
        const invented = wqActions.filter(
          (a) => !beforeActions.includes(a) && !safe.includes(a)
        );
        // Lost from WQ path: non-mechanical originals dropped (mechanical may map to safe)
        const lost = beforeActions.filter(
          (a) => !wqActions.includes(a) && !/Decision:|Primary concern/i.test(a)
        );

        const retain = locateTokens(outline, after, fixture.mustRetain);

        scenarios.push({
          id: fixture.id,
          locale,
          request_id: after.meta?.requestId ?? fixture.id,
          recommendationStatus: {
            before: before.recommendationStatus,
            after: after.recommendationStatus,
            unchanged:
              before.recommendationStatus === after.recommendationStatus,
          },
          confidence: {
            before: {
              level: before.confidence.level,
              score: before.confidence.score,
            },
            after: {
              level: after.confidence.level,
              score: after.confidence.score,
            },
            unchanged:
              before.confidence.level === after.confidence.level &&
              before.confidence.score === after.confidence.score,
          },
          scores: {
            before: {
              opportunity: before.scores.opportunity.value,
              risk: before.scores.risk.value,
              timing: before.scores.timing.value,
              readiness: before.scores.readiness.value,
              confidence: before.scores.confidence.value,
            },
            after: {
              opportunity: after.scores.opportunity.value,
              risk: after.scores.risk.value,
              timing: after.scores.timing.value,
              readiness: after.scores.readiness.value,
              confidence: after.scores.confidence.value,
            },
            unchanged:
              JSON.stringify(beforeInv.scores) ===
              JSON.stringify(afterInv.scores),
          },
          mustRetain: retain,
          renderedActions: after.actionPlan.now.map((a) => a.action),
          inventedActions: invented,
          lostActions: lost,
          outline,
          invariantsEqual:
            JSON.stringify(beforeInv) === JSON.stringify(afterInv),
          sources: after.meta?.sources ?? [],
        });

        expect(after.recommendationStatus).toBe(before.recommendationStatus);
        expect(after.scores.confidence.value).toBe(
          before.scores.confidence.value
        );
        expect(invented).toEqual([]);
      }
    }

    mkdirSync(OUT_DIR, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      stagingWorker:
        'https://planet-life-web-staging.planet-life.workers.dev',
      versionId: '6b20dd21-791c-4404-a545-133b47163ef2',
      commit: '03fa533e',
      scenarios,
    };
    writeFileSync(
      join(OUT_DIR, 'semantic-report.json'),
      JSON.stringify(report, null, 2)
    );

    const lostTokens = scenarios.flatMap((s) =>
      (s as { id: string; locale: string; mustRetain: Array<{ token: string; retained: boolean }> })
        .mustRetain.filter((m) => !m.retained)
        .map(
          (m) =>
            `${(s as { id: string; locale: string }).id}/${(s as { locale: string }).locale}:${m.token}`
        )
    );

    expect(lostTokens).toEqual([]);

    // Semantic retention on presentation path — English tokens must survive
    // for Category A/B rewrites when they are scenario facts.
    for (const fixture of WRITING_SEMANTIC_FIXTURES) {
      for (const locale of ['en', 'fa', 'ar', 'ru'] as const) {
        const out = localizeAskDecisionPresentation(
          structuredClone(fixture.result),
          locale
        );
        const outline = writingQualityOutline(out);
        const blob = [
          outline['خلاصه تصمیم'],
          outline['چرا؟'],
          ...outline['قبل از اقدام چه کار کنید؟'],
          outline['چه اطلاعاتی پاسخ را دقیق‌تر می‌کند؟'],
          out.recommendation,
          out.analysis.find((c) => c.id === 'risks')?.body ?? '',
          out.analysis.find((c) => c.id === 'opportunities')?.body ?? '',
          ...out.actionPlan.now.map((a) => a.action),
        ]
          .join('\n')
          .toLowerCase();
        for (const token of fixture.mustRetain) {
          expect(blob).toContain(token.toLowerCase());
        }
      }
    }

    expect(scenarios).toHaveLength(15);
    writeFileSync(
      join(OUT_DIR, 'token-losses.json'),
      JSON.stringify({ lostTokens }, null, 2)
    );
  });
});
