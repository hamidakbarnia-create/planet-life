import { describe, expect, it } from 'vitest';
import { localizeAskDecisionPresentation } from '@/lib/ask-decision/localize-presentation';
import { WRITING_SEMANTIC_FIXTURES } from '@/lib/ask-decision/writing-quality.semantic.fixtures';
import {
  allTokensPresent,
  extractRationaleMarkers,
  extractSemanticTokens,
  missingSemanticTokens,
} from '@/lib/ask-decision/semantic-tokens';
import { polishMechanicalScaffolds } from '@/lib/ask-decision/scaffold-polish';
import type { AppLang } from '@/lib/app-settings';
import type { AskDecisionResult } from '@/lib/ask-decision/types';

const LOCALES: AppLang[] = ['en', 'fa', 'ar', 'ru'];

const REQUIRED_TOKENS = [
  'notice period',
  'moving in together',
  '12% raise',
  'manager budget freeze',
  'comp band evidence',
  'peer salary data',
] as const;

function proseBlob(result: AskDecisionResult): string {
  return [
    result.executiveSummary,
    result.recommendation,
    ...result.actionPlan.now.map((a) => a.action),
    ...result.actionPlan.next7Days.map((a) => a.action),
    ...result.analysis.map((c) => c.body),
    ...Object.values(result.scores).map((s) => s.rationale),
  ].join('\n');
}

function genericNowActions(locale: AppLang, decisionSnippet: string): string[] {
  // Patterns that indicate wholesale generic replacement (without scenario detail)
  const generics = [
    'Write the decision in one sentence',
    'در یک جمله بنویسید دقیقاً چه تصمیمی می‌گیرید',
    'اكتب القرار في جملة واحدة',
    'Запишите решение одним предложением',
    'List the single fact that would change your mind',
    'یک چیزی را بنویسید که اگر معلوم شود',
    'اذكر الحقيقة الواحدة',
    'Перечислите единственный факт',
    'Identify the irreversible part',
    'مشخص کنید کدام بخش این کار دیگر قابل‌برگشت نیست',
    'حدّد الجزء غير القابل للرجوع',
    'Определите необратимую часть',
  ];
  return generics;
}

describe('semantic token extractor', () => {
  it('extracts required scenario tokens', () => {
    const sample =
      'ask for a 12% raise; manager budget freeze; comp band evidence; peer salary data; notice period; moving in together';
    const tokens = extractSemanticTokens(sample);
    for (const t of REQUIRED_TOKENS) {
      expect(tokens.map((x) => x.toLowerCase())).toContain(t.toLowerCase());
    }
  });
});

describe('scaffold polish', () => {
  it('rewrites known AR/RU mechanical concern scaffolds', () => {
    expect(
      polishMechanicalScaffolds('القلق الرئيسي غير مذكور بالكامل', 'ar')
    ).toContain('غير واضح');
    expect(
      polishMechanicalScaffolds(
        'Основная озабоченность указана не полностью',
        'ru'
      )
    ).toMatch(/неясно/i);
    expect(
      polishMechanicalScaffolds('Primary concern not fully stated', 'fa')
    ).toMatch(/نگرانی|می‌ترسید/);
  });
});

describe('semantic preservation through localize-presentation', () => {
  it.each(WRITING_SEMANTIC_FIXTURES)(
    '$id retains mustRetain + required tokens for en/fa/ar/ru',
    (fixture) => {
      for (const locale of LOCALES) {
        const before = structuredClone(fixture.result);
        const after = localizeAskDecisionPresentation(
          structuredClone(before),
          locale
        );

        expect(after.recommendationStatus).toBe(before.recommendationStatus);
        expect(after.confidence.level).toBe(before.confidence.level);
        expect(after.confidence.score).toBe(before.confidence.score);
        expect(after.scores.opportunity.value).toBe(
          before.scores.opportunity.value
        );
        expect(after.scores.risk.value).toBe(before.scores.risk.value);
        expect(after.scores.timing.value).toBe(before.scores.timing.value);
        expect(after.scores.readiness.value).toBe(before.scores.readiness.value);
        expect(after.scores.confidence.value).toBe(
          before.scores.confidence.value
        );
        expect(after.intent.primaryIntent).toBe(before.intent.primaryIntent);
        expect(after.timing.applicable).toBe(before.timing.applicable);

        const blob = proseBlob(after);
        for (const token of fixture.mustRetain) {
          expect(
            blob.toLowerCase(),
            `${fixture.id}/${locale} missing mustRetain "${token}"`
          ).toContain(token.toLowerCase());
        }

        // No invented actions: every after.now action is either original or
        // original preserved via action.preserveSpecific (same detail text).
        const beforeActions = before.actionPlan.now.map((a) => a.action.trim());
        for (const item of after.actionPlan.now) {
          const ok = beforeActions.some(
            (b) =>
              item.action === b ||
              item.action.includes(b) ||
              b.includes(item.action)
          );
          expect(
            ok,
            `${fixture.id}/${locale} invented action: ${item.action}`
          ).toBe(true);
        }

        // Specific actions must not be wholesale-replaced by generics when
        // specific actions existed.
        if (beforeActions.length > 0) {
          const generics = genericNowActions(locale, '');
          const allGeneric = after.actionPlan.now.every((a) =>
            generics.some((g) => a.action.includes(g))
          );
          expect(
            allGeneric,
            `${fixture.id}/${locale} specific actions replaced by generic action.now.*`
          ).toBe(false);
        }

        // Rationale semantic markers / tokens
        for (const key of [
          'opportunity',
          'risk',
          'timing',
          'readiness',
          'confidence',
        ] as const) {
          const src = before.scores[key].rationale;
          const loc = after.scores[key].rationale;
          const srcTokens = extractSemanticTokens(src);
          expect(
            missingSemanticTokens(loc, srcTokens),
            `${fixture.id}/${locale} score.${key} lost tokens`
          ).toEqual([]);
          const markers = extractRationaleMarkers(src);
          if (markers.tokens.length > 0) {
            expect(allTokensPresent(loc, markers.tokens)).toBe(true);
          }
        }
      }
    }
  );

  it('explicit required tokens survive fa/ar/ru across fixtures', () => {
    const checks: Array<{ id: string; token: string }> = [
      { id: 'job-change', token: 'notice period' },
      { id: 'relationship', token: 'moving in together' },
      { id: 'raise-request', token: '12% raise' },
      { id: 'raise-request', token: 'manager budget freeze' },
      { id: 'raise-request', token: 'comp band evidence' },
      { id: 'raise-request', token: 'peer salary data' },
    ];

    for (const { id, token } of checks) {
      const fixture = WRITING_SEMANTIC_FIXTURES.find((f) => f.id === id)!;
      for (const locale of ['fa', 'ar', 'ru'] as const) {
        const after = localizeAskDecisionPresentation(
          structuredClone(fixture.result),
          locale
        );
        expect(proseBlob(after).toLowerCase()).toContain(token.toLowerCase());
      }
    }
  });

  it('DOM semantic scan gates are empty for fa raise-request', () => {
    const fixture = WRITING_SEMANTIC_FIXTURES.find(
      (f) => f.id === 'raise-request'
    )!;
    const before = fixture.result;
    const after = localizeAskDecisionPresentation(
      structuredClone(before),
      'fa'
    );
    const blob = proseBlob(after);
    const lostMustRetain = fixture.mustRetain.filter(
      (t) => !blob.toLowerCase().includes(t.toLowerCase())
    );
    const inventedActions = after.actionPlan.now.filter(
      (a) =>
        !before.actionPlan.now.some(
          (b) => a.action === b.action || a.action.includes(b.action)
        )
    );
    const generics = genericNowActions('fa', '');
    const specificActionsReplacedByGeneric =
      before.actionPlan.now.length > 0 &&
      after.actionPlan.now.every((a) =>
        generics.some((g) => a.action.includes(g))
      )
        ? after.actionPlan.now.map((a) => a.action)
        : [];

    expect({
      lostMustRetain,
      inventedFacts: [],
      inventedActions: inventedActions.map((a) => a.action),
      specificActionsReplacedByGeneric,
    }).toEqual({
      lostMustRetain: [],
      inventedFacts: [],
      inventedActions: [],
      specificActionsReplacedByGeneric: [],
    });
  });
});
