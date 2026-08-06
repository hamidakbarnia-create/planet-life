import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { CalendarDayCell } from './CalendarDayCell';

afterEach(() => {
  cleanup();
});

describe('CalendarDayCell', () => {
  it('shows canonical score and power band', () => {
    render(
      <CalendarDayCell
        date="2026-08-06"
        lang="en"
        calendar="gregorian"
        score={92}
        inCurrentMonth
        selected
        isToday={false}
        dir="ltr"
        onClick={() => undefined}
      />
    );
    expect(document.querySelector('[data-cell-score]')?.textContent).toBe(
      '92%'
    );
    expect(
      document
        .querySelector('[data-calendar-day-cell]')
        ?.getAttribute('data-power-band')
    ).toBe('excellent');
  });

  it('dims adjacent-month cells', () => {
    render(
      <CalendarDayCell
        date="2026-07-31"
        lang="en"
        calendar="gregorian"
        score={80}
        inCurrentMonth={false}
        selected={false}
        isToday={false}
        dir="ltr"
        onClick={() => undefined}
      />
    );
    const cell = document.querySelector(
      '[data-calendar-cell="2026-07-31"]'
    ) as HTMLElement;
    expect(cell.getAttribute('data-adjacent')).toBe('true');
    expect(cell.getAttribute('data-in-current-month')).toBe('false');
    expect(Number.parseFloat(getComputedStyle(cell).opacity)).toBeLessThan(1);
    expect(cell.querySelector('[data-cell-score]')).toBeNull();
  });

  it('supports RTL dir and keyboard focusability', () => {
    render(
      <CalendarDayCell
        date="2026-08-06"
        lang="fa"
        calendar="gregorian"
        score={70}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="rtl"
        onClick={() => undefined}
      />
    );
    const cell = document.querySelector(
      '[data-calendar-cell="2026-08-06"]'
    ) as HTMLButtonElement;
    expect(cell.getAttribute('dir')).toBe('rtl');
    expect(cell.tagName).toBe('BUTTON');
    expect(cell.type).toBe('button');
    cell.focus();
    expect(document.activeElement).toBe(cell);
  });
});
