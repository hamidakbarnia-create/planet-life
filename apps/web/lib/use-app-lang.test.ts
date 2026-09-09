import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { saveAppLang } from '@/lib/calendar-preferences';
import { useAppLang } from '@/lib/use-app-lang';

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

  it('keeps the first render on the SSR English default so hydration cannot mismatch', async () => {
    saveAppLang('fa');
    let firstLang: string | null = null;
    const { result } = renderHook(() => {
      const hook = useAppLang();
      if (firstLang === null) firstLang = hook[0];
      return hook;
    });
    expect(firstLang).toBe('en');
    expect(result.current[0]).toBe('fa');
  });

  it.each(['en', 'ru', 'fa', 'ar'] as const)(
    'restores stored %s before paint and does not loop',
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
});
