'use client';

import { useMemo, useState } from 'react';
import { AskDecisionView } from '@/components/ask/AskDecisionView';
import { englishProviderResult } from '@/lib/ask-decision/english-provider-result.fixture';
import { evaluateClarification } from '@/lib/ask-decision/clarification';
import { detectIntent } from '@/lib/ask-decision/intent';
import { frameDecision } from '@/lib/ask-decision/framing';
import { buildStructuredFallback } from '@/lib/ask-decision/fallback';
import { buildTimingIntelligence } from '@/lib/ask-decision/local-build';
import type { ConversationLocale } from '@/lib/conversation-client';
import type { AppLang } from '@/lib/app-settings';

const FORBIDDEN_CLARIFY = [
  'One clarification',
  'Your answer',
  'Continue analysis',
  'Continue with assumptions',
  'What specifically are you deciding',
  'What are you considering accepting',
  'What action are you timing',
  'What decision are you facing',
  'What is the latest date',
];

const FORBIDDEN_STYLES = [
  'analytical',
  'strategic',
  'collaborative',
  'exploratory',
  'execution-focused',
  'cautious',
  'adaptive',
  'intuitive',
  'decisive',
  'risk-aware',
];

export function LocaleDecisionProofClient({ lang }: { lang: AppLang }) {
  const [mode, setMode] = useState<'result' | 'clarify' | 'personal-fit'>('clarify');
  const locale = lang as ConversationLocale;

  const clarification = useMemo(() => {
    const question = 'Should I accept it?';
    const intent = detectIntent(question);
    const frame = frameDecision(question, intent);
    return evaluateClarification(frame, intent, locale);
  }, [locale]);

  const personalFitResult = useMemo(() => {
    const questionByLang: Record<AppLang, string> = {
      en: 'Should I launch this product in Q3 with the current team?',
      fa: 'آیا باید این محصول را در سه‌ماهه سوم با تیم فعلی راه‌اندازی کنم؟',
      ar: 'هل يجب أن أطلق هذا المنتج في الربع الثالث مع الفريق الحالي؟',
      ru: 'Стоит ли запускать этот продукт в Q3 с текущей командой?',
    };
    const question = questionByLang[lang];
    const intent = detectIntent(question);
    const frame = frameDecision(question, intent);
    const timing = buildTimingIntelligence(null, intent.timingRelevant, false, locale);
    return buildStructuredFallback({
      intent,
      frame,
      timing,
      usedProfile: true,
      usedTiming: false,
      decisionStyles: ['analytical', 'execution-focused', 'cautious'],
      generatedAt: new Date().toISOString(),
      requestId: `staging-proof-${locale}-personal-fit`,
      clarificationAnswer: null,
      reason: 'unknown',
      locale,
    });
  }, [lang, locale]);

  const forbidden = [...FORBIDDEN_CLARIFY, ...FORBIDDEN_STYLES];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4" data-testid="locale-decision-proof">
      <p className="fi text-xs text-white/50 mb-2" data-testid="proof-lang">
        locale={lang} · mode={mode}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['clarify', 'clarify'],
            ['personal-fit', 'personal-fit'],
            ['result', 'result'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            data-testid={`proof-mode-${id}`}
            className="fi text-xs px-3 py-1.5 rounded-lg border border-white/20"
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'clarify' ? (
        <AskDecisionView
          result={null}
          pendingClarification
          clarification={clarification}
          lang={lang}
          onClarify={() => undefined}
          onContinueWithAssumptions={() => undefined}
        />
      ) : null}

      {mode === 'personal-fit' ? (
        <AskDecisionView result={personalFitResult} lang={lang} />
      ) : null}

      {mode === 'result' ? (
        <AskDecisionView result={englishProviderResult} lang={lang} />
      ) : null}

      <script
        dangerouslySetInnerHTML={{
          __html: `window.__LOCALE_PROOF_FORBIDDEN__=${JSON.stringify(forbidden)};`,
        }}
      />
    </div>
  );
}
