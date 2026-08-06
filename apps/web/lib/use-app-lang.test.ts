import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { saveAppLang } from '@/lib/calendar-preferences';
import { useAppLang } from '@/lib/use-app-lang';

describe('useAppLang', () => {
  afterEach(() => {
    localStorage.removeItem('planet-life-lang');
  });

  it('reads stored language and updates when saveAppLang is called', () => {
    saveAppLang('en');
    const { result } = renderHook(() => useAppLang());

    expect(result.current[0]).toBe('en');

    act(() => {
      result.current[1]('fa');
    });

    expect(result.current[0]).toBe('fa');
    expect(localStorage.getItem('planet-life-lang')).toBe('fa');
  });
});
