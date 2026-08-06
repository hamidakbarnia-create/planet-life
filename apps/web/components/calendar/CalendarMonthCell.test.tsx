import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { CalendarMonthCell } from './CalendarMonthCell';
import { buildCalendarCellDateLabels } from '@/lib/date-format';

afterEach(() => {
  cleanup();
});

function renderInNarrowGrid(ui: ReactElement) {
  // ~390px viewport / 7 columns ≈ 38–48px usable cell (padding + gap)
  return render(
    <div
      data-testid="narrow-grid"
      style={{
        width: 390,
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
        gap: 4,
      }}
    >
      {ui}
    </div>
  );
}

describe('CalendarMonthCell', () => {
  it('renders three date values and readiness percentage', () => {
    const labels = buildCalendarCellDateLabels('en', '2026-08-05', 'gregorian');
    render(
      <CalendarMonthCell
        date="2026-08-05"
        lang="en"
        calendar="gregorian"
        score={85}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="ltr"
        onClick={() => {}}
      />
    );

    const cell = screen.getByRole('button');
    expect(cell.querySelector('[data-cell-primary]')?.textContent).toBe(
      labels.primary
    );
    const secondaries = cell.querySelectorAll('[data-cell-secondary]');
    expect(secondaries).toHaveLength(2);
    expect(secondaries[0].textContent).toBe(labels.secondaries[0]);
    expect(secondaries[1].textContent).toBe(labels.secondaries[1]);
    expect(cell.querySelector('[data-cell-score]')?.textContent).toBe('85%');
  });

  it('keeps both secondary labels fully readable at narrow mobile width', () => {
    const labels = buildCalendarCellDateLabels('en', '2026-08-05', 'gregorian');
    renderInNarrowGrid(
      <CalendarMonthCell
        date="2026-08-05"
        lang="en"
        calendar="gregorian"
        score={85}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="ltr"
        onClick={() => {}}
      />
    );

    const cell = screen.getByRole('button');
    const secondaries = [...cell.querySelectorAll('[data-cell-secondary]')];
    expect(secondaries).toHaveLength(2);
    expect(secondaries[0].textContent).toBe(labels.secondaries[0]);
    expect(secondaries[1].textContent).toBe(labels.secondaries[1]);
    expect(secondaries[0].textContent).not.toContain('…');
    expect(secondaries[1].textContent).not.toContain('…');
    expect(secondaries[0].textContent).not.toContain('...');
    expect(secondaries[1].textContent).not.toContain('...');
    for (const el of secondaries) {
      expect(el.className).not.toMatch(/\btruncate\b/);
      expect(el.className).not.toMatch(/\bellipsis\b/);
      expect(getComputedStyle(el).textOverflow).not.toBe('ellipsis');
    }
    expect(cell.querySelector('[data-cell-score]')?.textContent).toBe('85%');
    // Active system is gregorian primary — secondaries must not repeat it as a bare day-only clone
    expect(labels.secondaries[0]).not.toBe(labels.primary);
    expect(labels.secondaries[1]).not.toBe(labels.primary);
  });

  it('marks selected current-month day', () => {
    render(
      <CalendarMonthCell
        date="2026-08-05"
        lang="en"
        calendar="gregorian"
        score={64}
        inCurrentMonth
        selected
        isToday={false}
        dir="ltr"
        onClick={() => {}}
      />
    );
    expect(screen.getByRole('button').getAttribute('data-selected')).toBe(
      'true'
    );
  });

  it('renders adjacent-month dates muted without selecting them', () => {
    const onClick = vi.fn();
    render(
      <CalendarMonthCell
        date="2026-07-31"
        lang="en"
        calendar="gregorian"
        score={37}
        inCurrentMonth={false}
        selected
        isToday={false}
        dir="ltr"
        onClick={onClick}
      />
    );
    const cell = screen.getByRole('button');
    expect(cell.getAttribute('data-adjacent')).toBe('true');
    expect(cell.getAttribute('data-in-current-month')).toBe('false');
    expect(cell.getAttribute('data-selected')).toBe('false');
    expect(cell.querySelector('[data-cell-score]')).toBeNull();
    expect(cell.style.opacity).toBe('0.42');
    fireEvent.click(cell);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps RTL dir on the cell for secondary date order', () => {
    render(
      <CalendarMonthCell
        date="2026-08-05"
        lang="fa"
        calendar="shamsi"
        score={71}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="rtl"
        onClick={() => {}}
      />
    );
    const cell = screen.getByRole('button');
    expect(cell.getAttribute('dir')).toBe('rtl');
    const secondaries = cell.querySelectorAll('[data-cell-secondary]');
    expect(secondaries).toHaveLength(2);
    const primary = cell.querySelector('[data-cell-primary]');
    const firstSecondary = secondaries.item(0);
    expect(primary).toBeDefined();
    expect(firstSecondary).toBeDefined();
    if (!primary || !firstSecondary) {
      throw new Error('expected primary and first secondary cell labels');
    }
    expect(
      primary.compareDocumentPosition(firstSecondary) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('renders full FA month names without ellipsis or Latin abbreviations', () => {
    renderInNarrowGrid(
      <CalendarMonthCell
        date="2026-08-14"
        lang="fa"
        calendar="gregorian"
        score={64}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="rtl"
        onClick={() => {}}
      />
    );
    const cell = screen.getByRole('button');
    const text = cell.textContent ?? '';
    expect(text).toContain('مرداد');
    expect(text).toMatch(/ربیع[\u200c\s]?الاول/);
    expect(text).not.toMatch(/Mor|Saf\.|…|\.\.\./);
    expect(cell.querySelector('[data-cell-score]')?.textContent).toBe('64%');
    for (const el of cell.querySelectorAll('[data-cell-secondary]')) {
      expect(el.className).not.toMatch(/\btruncate\b|\bellipsis\b/);
      expect(getComputedStyle(el).textOverflow).not.toBe('ellipsis');
      expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    }
  });

  it('renders full AR Hijri month names without clipping classes', () => {
    renderInNarrowGrid(
      <CalendarMonthCell
        date="2026-10-15"
        lang="ar"
        calendar="gregorian"
        score={55}
        inCurrentMonth
        selected={false}
        isToday={false}
        dir="rtl"
        onClick={() => {}}
      />
    );
    const cell = screen.getByRole('button');
    const text = cell.textContent ?? '';
    expect(text).toContain('جمادى الأولى');
    expect(text).not.toMatch(/\bMor\b|\bSaf\.|…|\.\.\./);
    expect(cell.querySelector('[data-cell-score]')?.textContent).toBe('55%');
    for (const el of cell.querySelectorAll('[data-cell-secondary]')) {
      expect(el.className).not.toMatch(/\btruncate\b|\bellipsis\b/);
      expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    }
  });
});
