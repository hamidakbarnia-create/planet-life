import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CALENDAR_SYSTEM_CHANGED_EVENT,
  loadCalendarSystem,
  saveCalendarSystem,
} from './app-settings';

describe('saveCalendarSystem', () => {
  afterEach(() => {
    localStorage.removeItem('planet-life-calendar-system');
  });

  it('persists the preference and notifies same-document listeners', () => {
    const onChange = vi.fn();
    window.addEventListener(CALENDAR_SYSTEM_CHANGED_EVENT, onChange);

    saveCalendarSystem('shamsi');

    expect(loadCalendarSystem()).toBe('shamsi');
    expect(onChange).toHaveBeenCalledTimes(1);

    window.removeEventListener(CALENDAR_SYSTEM_CHANGED_EVENT, onChange);
  });
});
