'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { DecisionPackageView } from '@/components/decision-case/DecisionPackageView';
import { localeFontFamily } from '@/lib/brand-theme';
import {
  bindDemoCarInterviewPackage,
  getDemoCase,
  listLocalDemoEvents,
  type DemoCaseRecord,
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
  const [demoCase, setDemoCase] = useState<DemoCaseRecord | null>(null);
  const [error, setError] = useState('');
  const [localEventCount, setLocalEventCount] = useState(0);

  useQueuedEffect(() => {
    if (!ready || !caseId) return;
    try {
      let current = getDemoCase(caseId);
      if (!current) {
        setError('Demo case not found in local session adapter.');
        return;
      }
      if (!current.package) {
        current = bindDemoCarInterviewPackage(caseId);
      }
      setDemoCase(current);
      setLocalEventCount(listLocalDemoEvents(caseId).length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bind demo package');
    }
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
            Walking skeleton result
          </p>
          <h1 className="fc text-2xl text-white">
            {demoCase?.title ?? 'Demo decision package'}
          </h1>
          {demoCase ? (
            <p className="fi text-xs text-white/45" data-testid="result-demo-meta">
              {demoCase.decisionTypeId} · {demoCase.uiState} · local demo events{' '}
              {localEventCount}
            </p>
          ) : null}
        </header>

        {error ? (
          <p className="fi text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        {demoCase?.package ? (
          <div className="mio-glass mio-glass--primary !p-5">
            <DecisionPackageView package={demoCase.package} />
          </div>
        ) : !error ? (
          <p className="fi text-sm text-white/55">Binding demo package…</p>
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
