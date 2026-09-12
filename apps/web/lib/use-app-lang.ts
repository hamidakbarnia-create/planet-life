'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import type { AppLang } from './app-settings';
import {
  saveAppLang as persistAppLang,
  APP_LANG_CHANGED_EVENT,
  readAppLang,
} from './calendar-preferences';
import { useQueuedEffect } from './use-queued-effect';

export { APP_LANG_CHANGED_EVENT };

/** True after the first client commit — avoids SSR/hydration showing the wrong locale. */
export function useClientReady(): boolean {
  const [ready, setReady] = useState(false);
  useQueuedEffect(() => {
    setReady(true);
  }, []);
  return ready;
}

function subscribeAppLang(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(APP_LANG_CHANGED_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(APP_LANG_CHANGED_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function getAppLangClientSnapshot(): AppLang {
  return readAppLang();
}

/** SSR/hydration snapshot. Must stay English so the first client hydrate matches the server. */
export function getAppLangServerSnapshot(): AppLang {
  return 'en';
}

/** Reactive app language synced with `planet-life-lang` localStorage. */
export function useAppLang(): [AppLang, (lang: AppLang) => void] {
  const lang = useSyncExternalStore(
    subscribeAppLang,
    getAppLangClientSnapshot,
    getAppLangServerSnapshot
  );

  const setLang = useCallback((next: AppLang) => {
    persistAppLang(next);
  }, []);

  return [lang, setLang];
}
