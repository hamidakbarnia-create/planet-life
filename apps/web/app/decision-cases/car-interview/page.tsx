'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { CarInterviewIntakeForm } from '@/components/decision-case/CarInterviewIntakeForm';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  CAR_INTERVIEW_DECISION_TYPE_ID,
  CAR_INTERVIEW_LABEL,
  saveDemoCarInterviewAnswers,
  type CarInterviewIntake,
} from '@/lib/decision-case';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

export default function CarInterviewIntakePage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const router = useRouter();
  const [demoCaseId, setDemoCaseId] = useState<string | null>(null);
  const [intake, setIntake] = useState<CarInterviewIntake>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
            Walking skeleton · {CAR_INTERVIEW_DECISION_TYPE_ID}
          </p>
          <h1 className="fc text-2xl text-white">{CAR_INTERVIEW_LABEL}</h1>
          <p className="fi text-sm text-white/60">
            Demo intake only. Answers stay in a temporary client adapter until
            the Decision Case intake API is wired.
          </p>
          {demoCaseId ? (
            <p className="fi text-xs text-white/45" data-testid="active-demo-case-id">
              Demo case {demoCaseId}
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
            onSubmitAnswers={(answers) => {
              setBusy(true);
              setError('');
              try {
                const result = saveDemoCarInterviewAnswers({
                  demoCaseId,
                  answers,
                });
                setDemoCaseId(result.demoCase.demoCaseId);
                setIntake(result.demoCase.intake);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Save failed');
              } finally {
                setBusy(false);
              }
            }}
            onComplete={(answers) => {
              setBusy(true);
              setError('');
              try {
                const result = saveDemoCarInterviewAnswers({
                  demoCaseId,
                  answers,
                });
                setDemoCaseId(result.demoCase.demoCaseId);
                setIntake(result.demoCase.intake);
                if (!result.requiredPresent) {
                  setError(
                    `Complete required fields: ${result.missingRequired.join(', ')}`
                  );
                  return;
                }
                router.push(
                  `/decision-cases/${result.demoCase.demoCaseId}/result`
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
