'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionCaseResultBackLink } from '@/components/decision-case/DecisionCaseResultBackLink';
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

function loadingCopyForCase(
  caseRecord: DecisionCaseResource | null,
  copy: ReturnType<typeof getAskProductCopy>
): string {
  if (!caseRecord) return copy.evaluating;
  if (caseRecord.mode === 'compare_dates' || caseRecord.state === 'compared') {
    return copy.comparing;
  }
  if (caseRecord.mode === 'find_dates' || caseRecord.state === 'found') {
    return copy.finding;
  }
  return copy.evaluating;
}

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
      : caseRecord?.decision_type_id === 'bus-investor-meeting'
        ? copy.topicInvestorMeeting
        : caseRecord?.decision_type_id === 'mar-wedding-date'
          ? copy.topicWeddingDate
          : caseRecord?.decision_type_id === 'bus-product-launch'
            ? copy.topicProductLaunch
            : caseRecord?.decision_type_id === 'car-offer-negotiation'
              ? copy.topicOfferNegotiation
              : caseRecord?.title;

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={localeFontFamily(lang)}
    >
      <div
        className="mx-auto w-full max-w-5xl px-4 py-8 space-y-6 sm:px-6 lg:max-w-6xl"
        dir={copy.dir}
      >
        {error ? (
          <p className="fi text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {evaluation?.package ? (
          <div className="mio-glass mio-glass--primary !p-5 sm:!p-7">
            <DecisionPackageView
              package={evaluation.package}
              dqStatus={evaluation.dq_status}
              caseId={caseId}
              topic={topic}
              lang={lang}
              intake={caseRecord?.intake}
            />
          </div>
        ) : !error ? (
          <p className="fi text-sm text-white/55" data-testid="result-evaluating">
            {loadingCopyForCase(caseRecord, copy)}
          </p>
        ) : null}

        <DecisionCaseResultBackLink
          lang={lang}
          decisionTypeId={caseRecord?.decision_type_id}
        />
      </div>
    </AppShell>
  );
}
