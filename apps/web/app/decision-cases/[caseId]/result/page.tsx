'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { getAskProductCopy, localizeCaseApiError } from '@/lib/ask-product';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  loadCaseResult,
  type DecisionCaseResource,
  type DecisionEvaluationResource,
} from '@/lib/decision-case';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export default function DecisionCaseResultPage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const copy = getAskProductCopy(lang);
  const params = useParams<{ caseId: string }>();
  const caseId = params?.caseId;
  const [caseRecord, setCaseRecord] = useState<DecisionCaseResource | null>(
    null
  );
  const [evaluation, setEvaluation] =
    useState<DecisionEvaluationResource | null>(null);
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
      } catch (err) {
        if (cancelled) return;
        setError(localizeCaseApiError(err, lang));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, caseId, lang]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-busy="true" />
    );
  }

  const topic =
    caseRecord?.decision_type_id === 'car-interview'
      ? copy.topicCarInterview
      : caseRecord?.title;

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6" dir={copy.dir}>
        {error ? (
          <p className="fi text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {evaluation?.package ? (
          <div className="mio-glass mio-glass--primary !p-5">
            <DecisionPackageView
              package={evaluation.package}
              dqStatus={evaluation.dq_status}
              caseId={caseId}
              topic={topic}
            />
          </div>
        ) : !error ? (
          <p className="fi text-sm text-white/55" data-testid="result-evaluating">
            {copy.evaluating}
          </p>
        ) : null}

        <Link
          href="/ask"
          className="fi text-sm text-[#93B4FF] hover:text-white"
        >
          {copy.backToAsk}
        </Link>
      </div>
    </AppShell>
  );
}
