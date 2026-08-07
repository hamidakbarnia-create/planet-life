'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
  isFramingPersistReady,
  loadDecisionFrame,
  loadFrameFromCase,
  persistFrameToCase,
  saveDecisionFrame,
  type DecisionFrameV1,
} from '@/lib/decision-frame';
import { DecisionCaseApiError } from '@/lib/decision-case';
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
  const searchParams = useSearchParams();
  const caseIdParam = searchParams.get('caseId');
  const [frame, setFrame] = useState<DecisionFrameV1 | null>(null);
  const [caseId, setCaseId] = useState<string | null>(caseIdParam);
  const [caseVersion, setCaseVersion] = useState<number | null>(null);
  const [persistError, setPersistError] = useState('');
  const [persisting, setPersisting] = useState(false);
  const [persistedNotice, setPersistedNotice] = useState('');

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
            // Convenience only — Case remains authority.
            saveDecisionFrame(loaded.frame);
            return;
          }
        } catch {
          if (cancelled) return;
          setPersistError('Unable to load Decision Case framing');
        }
      }

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
    })();
    return () => {
      cancelled = true;
    };
  }, [lang, router, caseIdParam]);

  if (!frame) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center" aria-busy="true" />
    );
  }

  const resultModel = canSelectOperationRenderer(frame)
    ? framingReadyResult(frame)
    : null;
  const canPersist = isFramingPersistReady(frame);

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
        {caseId ? (
          <p className="fi text-xs text-white/45" data-testid="frame-case-id">
            Case {caseId}
            {caseVersion != null ? ` · v${caseVersion}` : ''}
          </p>
        ) : null}
      </header>

      <DecisionFramePanel frame={frame} />

      <OperationClarifier
        frame={frame}
        onChooseOperation={(op) => {
          const next = applyOperationChoice(frame, op);
          saveDecisionFrame(next);
          setFrame(next);
          setPersistedNotice('');
        }}
        onChooseOpenEndedAxis={(axis) => {
          const next = applyOpenEndedAxis(frame, axis);
          saveDecisionFrame(next);
          setFrame(next);
          setPersistedNotice('');
        }}
      />

      {canPersist ? (
        <div className="space-y-2">
          <button
            type="button"
            data-testid="persist-frame-to-case"
            disabled={persisting}
            className="fc rounded-xl px-4 py-2.5 text-sm font-medium text-[#0a0f1c] disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #f2cf75, #d4af37)',
            }}
            onClick={() => {
              void (async () => {
                setPersisting(true);
                setPersistError('');
                try {
                  const result = await persistFrameToCase({
                    frame,
                    caseId,
                    caseVersion,
                  });
                  setCaseId(result.case.case_id);
                  setCaseVersion(result.case.case_version);
                  setPersistedNotice(
                    result.framing.find_runtime === 'not_implemented'
                      ? 'FIND framing saved to Decision Case. FIND runtime is not implemented.'
                      : 'Framing saved to Decision Case (authoritative).'
                  );
                  router.replace(
                    `/ask/frame?caseId=${result.case.case_id}`
                  );
                } catch (err) {
                  setPersistError(
                    err instanceof DecisionCaseApiError
                      ? err.message
                      : err instanceof Error
                        ? err.message
                        : 'Unable to persist framing'
                  );
                } finally {
                  setPersisting(false);
                }
              })();
            }}
          >
            {caseId ? 'Update Decision Case framing' : 'Save framing to Decision Case'}
          </button>
          {frame.operation === 'find' ? (
            <p className="fi text-xs text-amber-200/80" data-testid="find-framing-only-notice">
              FIND is framing-only in this slice — no runtime search is executed.
            </p>
          ) : null}
        </div>
      ) : null}

      {persistedNotice ? (
        <p className="fi text-sm text-emerald-300/90" data-testid="frame-persisted-notice">
          {persistedNotice}
        </p>
      ) : null}
      {persistError ? (
        <p className="fi text-sm text-red-300" role="alert">
          {persistError}
        </p>
      ) : null}

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
