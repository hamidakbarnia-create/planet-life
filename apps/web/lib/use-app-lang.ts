'use client';

import { useCallback, useState } from 'react';
import type { AppLang } from './app-settings';
import { loadAppLang, saveAppLang as persistAppLang, APP_LANG_CHANGED_EVENT } from './calendar-preferences';
import { useQueuedEffect } from './use-queued-effect';

export { APP_LANG_CHANGED_EVENT };

function parseAppLang(stored: string | null): AppLang {
  if (stored === 'en' || stored === 'ru' || stored === 'fa' || stored === 'ar') return stored;
  return 'en';
}

/** True after the first client commit — avoids SSR/hydration showing the wrong locale. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useQueuedEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

/** Reactive app language synced with `planet-life-lang` localStorage. */
export function useAppLang(): [AppLang, (lang: AppLang) => void] {
  const [lang, setLangState] = useState<AppLang>(() =>
    typeof window === 'undefined' ? 'en' : parseAppLang(loadAppLang())
  );

  useQueuedEffect(() => {
    setLangState(parseAppLang(loadAppLang()));
    const sync = () => setLangState(parseAppLang(loadAppLang()));
    window.addEventListener(APP_LANG_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(APP_LANG_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setLang = useCallback((next: AppLang) => {
    persistAppLang(next);
    setLangState(next);
  }, []);

  return [lang, setLang];
}
