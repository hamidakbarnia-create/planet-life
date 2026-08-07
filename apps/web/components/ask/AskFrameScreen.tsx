'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { AskClarificationFlow } from '@/components/ask/AskClarificationFlow';
import {
  buildDecisionFrame,
  getAskProductCopy,
  isUnsupportedOperationFrame,
  loadDecisionFrame,
  loadFrameFromCase,
  resetToExamineStep,
  saveDecisionFrame,
  type DecisionFrameV1,
} from '@/lib/ask-product';
import { getAskQuestionRepository } from '@/lib/ask-question-repository';
import { resolveAskQuestion } from '@/lib/resolve-ask-question';
import type { AppLang } from '@/lib/app-settings';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function resolveIntentText(lang: AppLang): string {
  const stored = getAskQuestionRepository().loadQuestion();
  if (!stored) return '';
  return resolveAskQuestion(stored, lang).displayText.trim();
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

      const existing = loadDecisionFrame();
      if (existing) {
        // Session frames that promised compare/find must not look runnable.
        setFrame(
          isUnsupportedOperationFrame(existing)
            ? resetToExamineStep(existing)
            : existing
        );
        return;
      }
      const intent = resolveIntentText(lang);
      if (!intent) {
        router.replace('/ask');
        return;
      }
      // Preserve original text. Only structured extras the resolver already
      // put into the intent string are used — no fabricated objective/type.
      // Fresh ASK never offers compare/find as runnable.
      const next = buildDecisionFrame(intent);
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
