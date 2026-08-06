'use client';

import { localeFontFamily } from '@/lib/brand-theme';
import { AppShell } from '@/components/AppShell';
import { AskScreen } from '@/components/ftue/AskScreen';
import { getAskCopy } from '@/lib/ftue-i18n';
import { HOME_LANGS } from '@/lib/home-i18n';
import { useAppLang, useClientReady } from '@/lib/use-app-lang';

export default function AskPage() {
  const ready = useClientReady();
  const [lang, setLang] = useAppLang();
  const t = HOME_LANGS[lang];
  const copy = getAskCopy(lang);

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
      fontFamily={localeFontFamily(lang)}
    >
      <AskScreen copy={copy} lang={lang} />
    </AppShell>
  );
}
