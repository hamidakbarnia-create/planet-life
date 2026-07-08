'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AskScreen } from '@/components/ftue/AskScreen';
import type { AppLang } from '@/lib/app-settings';
import { loadAppLang, saveAppLang } from '@/lib/calendar-preferences';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useQueuedEffect } from '@/lib/use-queued-effect';

export default function AskPage() {
  const [lang, setLangState] = useState<AppLang>('en');
  const [ready, setReady] = useState(false);

  const t = HOME_LANGS[lang];

  const setLang = (l: AppLang) => {
    setLangState(l);
    saveAppLang(l);
  };

  useQueuedEffect(() => {
    const stored = loadAppLang();
    if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') {
      setLangState(stored);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#070B14' }}
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
      fontFamily={lang === 'fa' || lang === 'ar' ? 'Vazirmatn, sans-serif' : 'Inter, sans-serif'}
    >
      <AskScreen />
    </AppShell>
  );
}
