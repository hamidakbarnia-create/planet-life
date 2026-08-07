'use client';

import { Suspense } from 'react';
import { AskFrameScreen } from '@/components/ask/AskFrameScreen';
import { AppShell } from '@/components/AppShell';
import { localeFontFamily } from '@/lib/brand-theme';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

function AskFrameBody() {
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  return (
    <AppShell
      lang={lang}
      setLang={setLang}
      dir={t.dir}
      navLabels={t.nav}
      fontFamily={localeFontFamily(lang)}
    >
      <AskFrameScreen lang={lang} />
    </AppShell>
  );
}

export default function AskFramePage() {
  const ready = useClientReady();

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
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: '#070B14' }}
          aria-busy="true"
        />
      }
    >
      <AskFrameBody />
    </Suspense>
  );
}
