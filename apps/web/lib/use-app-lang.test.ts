import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { saveAppLang, APP_LANG_CHANGED_EVENT } from '@/lib/calendar-preferences';
import {
  getAppLangServerSnapshot,
  useAppLang,
} from '@/lib/use-app-lang';

describe('useAppLang', () => {
  afterEach(() => {
    localStorage.removeItem('planet-life-lang');
  });

  it('reads stored language and updates when saveAppLang is called', async () => {
    saveAppLang('en');
    const { result } = renderHook(() => useAppLang());

    expect(result.current[0]).toBe('en');

    act(() => {
      result.current[1]('fa');
    });

    expect(result.current[0]).toBe('fa');
    expect(localStorage.getItem('planet-life-lang')).toBe('fa');
  });

  it('keeps the server/hydration snapshot on English so hydrate cannot mismatch', () => {
    saveAppLang('fa');
    expect(getAppLangServerSnapshot()).toBe('en');

    function Probe() {
      const [lang] = useAppLang();
      return createElement('span', null, lang);
    }
    expect(renderToString(createElement(Probe))).toBe('<span>en</span>');
  });

  it.each(['en', 'ru', 'fa', 'ar'] as const)(
    'restores stored %s on the client store snapshot and does not loop',
    async (stored) => {
      saveAppLang(stored);
      let renders = 0;
      const { result } = renderHook(() => {
        renders += 1;
        return useAppLang();
      });
      expect(result.current[0]).toBe(stored);
      const afterRestore = renders;
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(result.current[0]).toBe(stored);
      expect(renders).toBe(afterRestore);
    }
  );

  it('syncs the same-tab planet-life-lang-changed event', () => {
    saveAppLang('en');
    const { result } = renderHook(() => useAppLang());
    act(() => {
      saveAppLang('ru');
    });
    expect(result.current[0]).toBe('ru');
    act(() => {
      window.dispatchEvent(new Event(APP_LANG_CHANGED_EVENT));
    });
    expect(result.current[0]).toBe('ru');
  });

  it('syncs cross-tab storage events', () => {
    saveAppLang('en');
    const { result } = renderHook(() => useAppLang());
    act(() => {
      localStorage.setItem('planet-life-lang', 'ar');
      window.dispatchEvent(new StorageEvent('storage', { key: 'planet-life-lang' }));
    });
    expect(result.current[0]).toBe('ar');
  });
});
