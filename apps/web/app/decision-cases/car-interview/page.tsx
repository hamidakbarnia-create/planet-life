'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CarInterviewIntakeForm } from '@/components/decision-case/CarInterviewIntakeForm';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  CAR_INTERVIEW_DECISION_TYPE_ID,
  CAR_INTERVIEW_LABEL,
  DecisionCaseApiError,
  completeCaseIntake,
  ensureCaseAndSaveAnswers,
  getDecisionCase,
  type CarInterviewIntake,
} from '@/lib/decision-case';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';
import { useQueuedEffect } from '@/lib/use-queued-effect';

function readCaseIdFromQuery(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('caseId');
}

export default function CarInterviewIntakePage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const router = useRouter();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseVersion, setCaseVersion] = useState<number | null>(null);
  const [intake, setIntake] = useState<CarInterviewIntake>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useQueuedEffect(() => {
    if (!ready) return;
    const fromQuery = readCaseIdFromQuery();
    if (fromQuery && fromQuery !== caseId) {
      setCaseId(fromQuery);
      return;
    }
    if (!caseId) return;
    let cancelled = false;
    (async () => {
      try {
        const current = await getDecisionCase(caseId);
        if (cancelled) return;
        setCaseVersion(current.case_version);
        setIntake(current.intake ?? {});
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof DecisionCaseApiError
            ? err.message
            : 'Unable to load Decision Case'
        );
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
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <header className="space-y-2">
          <p className="fi text-xs uppercase tracking-[0.16em] text-amber-400/80">
            Decision Case · {CAR_INTERVIEW_DECISION_TYPE_ID}
          </p>
          <h1 className="fc text-2xl text-white">{CAR_INTERVIEW_LABEL}</h1>
          <p className="fi text-sm text-white/60">
            Answer required intake fields. A Decision Case is created only after
            your first meaningful required answer, via the backend Case API.
          </p>
          {caseId ? (
            <p className="fi text-xs text-white/45" data-testid="active-case-id">
              Case {caseId}
              {caseVersion != null ? ` · v${caseVersion}` : ''}
            </p>
          ) : null}
        </header>

        {error ? (
          <p className="fi text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mio-glass mio-glass--primary !p-5">
          <CarInterviewIntakeForm
            initialIntake={intake}
            submitting={busy}
            onSubmitAnswers={async (answers) => {
              setBusy(true);
              setError('');
              try {
                const result = await ensureCaseAndSaveAnswers({
                  caseId,
                  caseVersion,
                  answers,
                });
                setCaseId(result.case.case_id);
                setCaseVersion(result.case.case_version);
                setIntake(result.intake);
                router.replace(
                  `/decision-cases/car-interview?caseId=${result.case.case_id}`
                );
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : 'Save failed'
                );
              } finally {
                setBusy(false);
              }
            }}
            onComplete={async (answers) => {
              setBusy(true);
              setError('');
              try {
                const saved = await ensureCaseAndSaveAnswers({
                  caseId,
                  caseVersion,
                  answers,
                });
                setCaseId(saved.case.case_id);
                setCaseVersion(saved.case.case_version);
                setIntake(saved.intake);
                if (!saved.is_complete) {
                  setError(
                    `Complete required fields: ${saved.missing_required.join(', ')}`
                  );
                  return;
                }
                const completed = await completeCaseIntake({
                  caseId: saved.case.case_id,
                  caseVersion: saved.case.case_version,
                });
                router.push(
                  `/decision-cases/${completed.case.case_id}/result`
                );
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : 'Unable to continue'
                );
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
