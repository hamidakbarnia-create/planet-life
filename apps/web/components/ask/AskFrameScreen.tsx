'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AskClarificationFlow } from '@/components/ask/AskClarificationFlow';
import {
  buildDecisionFrame,
  clearDecisionFrame,
  getAskProductCopy,
  isUnsupportedOperationFrame,
  loadDecisionFrame,
  loadFrameFromCase,
  resetToExamineStep,
  saveDecisionFrame,
  sessionFrameBelongsToCurrentQuestion,
  type DecisionFrameV1,
} from '@/lib/ask-product';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { resolveAskQuestion } from '@/lib/resolve-ask-question';
import { resolveDecisionRequest } from '@/lib/decision-request/resolver';
import type { AppLang } from '@/lib/app-settings';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function resolveIntent(lang: AppLang): {
  text: string;
  decisionTypeId?: string;
} {
  const stored = getAskQuestionRepository().loadQuestion();
  if (!stored) return { text: '' };

  const resolved = resolveAskQuestion(stored, lang);
  const request = resolveDecisionRequest(resolved);

  return {
    text: request.displayText.trim(),
    decisionTypeId: request.execution.decisionTypeId,
  };
}

/**
 * ASK clarification entry. Decision Frame is internal state only —
 * no schema inspector, no pre-evaluation result shells.
 */
export function AskFrameScreen({ lang }: { lang: AppLang }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const copy = getAskProductCopy(lang);
  const [frame, setFrame] = useState<DecisionFrameV1 | null>(null);
  const [caseId, setCaseId] = useState<string | null>(caseIdParam);
  const [caseVersion, setCaseVersion] = useState<number | null>(null);
  const [loadError, setLoadError] = useState('');

  useQueuedEffect(() => {
    let cancelled = false;
    (async () => {
      if (caseIdParam) {
        try {
          const loaded = await loadFrameFromCase(caseIdParam);
          if (cancelled) return;
          if (loaded) {
            setFrame(loaded.frame);
            setCaseId(loaded.case.case_id);
            setCaseVersion(loaded.case.case_version);
            saveDecisionFrame(loaded.frame);
            return;
          }
        } catch {
          if (cancelled) return;
          setLoadError(copy.loadFrameError);
          return;
        }
      }

      const intent = resolveIntent(lang);
      if (!intent.text) {
        router.replace('/ask');
        return;
      }

      const existing = loadDecisionFrame();
      if (
        existing &&
        sessionFrameBelongsToCurrentQuestion(existing, intent)
      ) {
        // Same current draft (refresh / clarify). Keep session frame.
        setFrame(
          isUnsupportedOperationFrame(existing)
            ? resetToExamineStep(existing)
            : existing
        );
        return;
      }

      // Stale session frame for a different question — discard and rebuild.
      if (existing) {
        clearDecisionFrame();
      }

      // Preserve original text. Only structured extras the resolver already
      // put into the intent string are used — no fabricated objective/type.
      // Fresh ASK never offers compare/find as runnable.
      const next = buildDecisionFrame(intent.text, {
        decision_type_id: intent.decisionTypeId,
      });
      const safe = isUnsupportedOperationFrame(next)
        ? resetToExamineStep(next)
        : next;
      saveDecisionFrame(safe);
      setFrame(safe);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, router, caseIdParam, copy.loadFrameError]);

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8" dir={copy.dir}>
        <p className="fi text-sm text-red-300" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!frame) {
    return (
      <div
        className="min-h-[40vh] flex items-center justify-center"
        aria-busy="true"
        data-testid="ask-understanding"
      />
    );
  }

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-8"
      data-testid="ask-frame-screen"
      dir={copy.dir}
    >
      <AskClarificationFlow
        lang={lang}
        frame={frame}
        caseId={caseId}
        caseVersion={caseVersion}
        onFrameChange={setFrame}
        onCaseBound={(id, version) => {
          setCaseId(id);
          setCaseVersion(version);
        }}
      />
    </div>
  );
}
