'use client';

import { useParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DecisionCaseIntakeScreen } from '@/components/decision-case/DecisionCaseIntakeScreen';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

export default function DecisionCaseIntakePage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const params = useParams<{ caseId: string }>();
  const caseId = params?.caseId ?? '';

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        aria-busy="true"
      />
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
      {caseId ? (
        <DecisionCaseIntakeScreen lang={lang} caseId={caseId} ready={ready} />
      ) : null}
    </AppShell>
  );
}
