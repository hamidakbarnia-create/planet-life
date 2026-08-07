'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  DecisionCaseApiError,
  loadCaseResult,
  type DecisionCaseResource,
  type DecisionEvaluationResource,
  type DecisionHistoryEvent,
} from '@/lib/decision-case';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export default function DecisionCaseResultPage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const params = useParams<{ caseId: string }>();
  const caseId = params?.caseId;
  const [caseRecord, setCaseRecord] = useState<DecisionCaseResource | null>(
    null
  );
  const [evaluation, setEvaluation] =
    useState<DecisionEvaluationResource | null>(null);
  const [history, setHistory] = useState<DecisionHistoryEvent[]>([]);
  const [error, setError] = useState('');

  useQueuedEffect(() => {
    if (!ready || !caseId) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadCaseResult(caseId);
        if (cancelled) return;
        setCaseRecord(loaded.caseRecord);
        setEvaluation(loaded.evaluation);
        setHistory(loaded.history);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DecisionCaseApiError) {
          setError(`${err.code}: ${err.message}`);
        } else {
          setError(
            err instanceof Error ? err.message : 'Failed to load case result'
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, caseId]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true" />
    );
  }

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="fi text-xs uppercase tracking-[0.16em] text-amber-400/80">
            Decision Case Result
          </p>
          <h1 className="fc text-2xl text-white">
            {caseRecord?.title ?? 'Decision package'}
          </h1>
          {caseRecord ? (
            <p className="fi text-xs text-white/45" data-testid="result-case-meta">
              {caseRecord.decision_type_id} · {caseRecord.state} · v
              {caseRecord.case_version} · Case history events {history.length}
            </p>
          ) : null}
        </header>

        {error ? (
          <p className="fi text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {evaluation?.package ? (
          <div className="mio-glass mio-glass--primary !p-5">
            <DecisionPackageView package={evaluation.package} />
          </div>
        ) : !error ? (
          <p className="fi text-sm text-white/55">Loading evaluation…</p>
        ) : null}

        {history.length > 0 ? (
          <section
            className="space-y-2"
            aria-labelledby="case-history-heading"
            data-testid="case-history"
          >
            <h2 id="case-history-heading" className="fc text-sm text-amber-300/90">
              Case history
            </h2>
            <ul className="fi text-xs text-white/55 space-y-1">
              {history.map((event) => (
                <li key={event.history_id}>
                  {event.at} · {event.event}
                  {event.from_state && event.to_state
                    ? ` (${event.from_state} → ${event.to_state})`
                    : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          href="/ask"
          className="fi text-sm text-[#93B4FF] hover:text-white"
        >
          Back to Ask
        </Link>
      </div>
    </AppShell>
  );
}
