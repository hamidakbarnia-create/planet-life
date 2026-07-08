'use client';

import { AppShell } from '@/components/AppShell';
import { ResultScreen } from '@/components/ftue/ResultScreen';
import { getResultCopy } from '@/lib/ftue-i18n';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

export default function ResultPage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const loadingLabel = getResultCopy(lang).loadingLabel;

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center fi text-sm text-white/50"
        style={{ background: '#070B14' }}
        aria-busy="true"
        aria-live="polite"
      >
        {loadingLabel}
      </div>
    );
  }

  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      <ResultScreen lang={lang} />
    </AppShell>
  );
}
