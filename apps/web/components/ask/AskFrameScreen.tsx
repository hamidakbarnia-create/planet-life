'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DecisionFramePanel,
  OperationClarifier,
  OperationResultRouter,
} from '@/components/decision-frame';
import {
  applyOpenEndedAxis,
  applyOperationChoice,
  buildDecisionFrame,
  canSelectOperationRenderer,
  framingReadyResult,
  loadDecisionFrame,
  saveDecisionFrame,
  type DecisionFrameV1,
} from '@/lib/decision-frame';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { resolveAskQuestion } from '@/lib/resolve-ask-question';
import type { AppLang } from '@/lib/app-settings';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function resolveIntentText(lang: AppLang): string {
  const stored = getAskQuestionRepository().loadQuestion();
  if (!stored) return '';
  return resolveAskQuestion(stored, lang).displayText.trim();
}

export function AskFrameScreen({ lang }: { lang: AppLang }) {
  const router = useRouter();
  const [frame, setFrame] = useState<DecisionFrameV1 | null>(null);

  useQueuedEffect(() => {
    const existing = loadDecisionFrame();
    if (existing) {
      setFrame(existing);
      return;
    }
    const intent = resolveIntentText(lang);
    if (!intent) {
      router.replace('/ask');
      return;
    }
    const next = buildDecisionFrame(intent);
    saveDecisionFrame(next);
    setFrame(next);
  }, [lang, router]);

  if (!frame) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" aria-busy="true" />
    );
  }

  const resultModel = canSelectOperationRenderer(frame)
    ? framingReadyResult(frame)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6" data-testid="ask-frame-screen">
      <header className="space-y-2">
        <p className="fi text-xs uppercase tracking-[0.16em] text-amber-400/80">
          Decision Frame
        </p>
        <h1 className="fc text-2xl text-white">Structure before recommend</h1>
        <p className="fi text-sm text-white/60">
          METIORO frames the decision first. No implicit today. No generic coaching report.
        </p>
      </header>

      <DecisionFramePanel frame={frame} />

      <OperationClarifier
        frame={frame}
        onChooseOperation={(op) => {
          const next = applyOperationChoice(frame, op);
          saveDecisionFrame(next);
          setFrame(next);
        }}
        onChooseOpenEndedAxis={(axis) => {
          const next = applyOpenEndedAxis(frame, axis);
          saveDecisionFrame(next);
          setFrame(next);
        }}
      />

      {resultModel ? (
        <div data-testid="operation-result-region">
          <OperationResultRouter model={resultModel} />
        </div>
      ) : null}

      {!resultModel && !frame.pending_clarification ? (
        <p className="fi text-sm text-white/55" data-testid="frame-waiting">
          Frame is not ready for an operation renderer yet.
        </p>
      ) : null}
    </div>
  );
}
