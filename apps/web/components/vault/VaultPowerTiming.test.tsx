import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import {
  VaultRankedDayChip,
  VaultYesDecisionSlot,
} from './VaultPowerTiming';

afterEach(() => {
  cleanup();
});

describe('VaultRankedDayChip', () => {
  it('renders date, score, and band', () => {
    render(
      <VaultRankedDayChip
        dateLabel="1 Aug"
        score={81}
        band="strongest"
        bandLabel="Strongest"
        title="Strongest"
      />,
    );
    expect(screen.getByText('1 Aug')).toBeTruthy();
    expect(screen.getByText(/81/)).toBeTruthy();
    expect(screen.getByText(/Strongest/)).toBeTruthy();
  });

  it('shows a short rating in visible text', () => {
    const { container } = render(
      <VaultRankedDayChip
        dateLabel="14 Aug"
        score={66}
        band="supportive"
        bandLabel="Supportive"
        rating="Favorable"
        title="Supportive"
      />,
    );
    expect(container.textContent).toContain('Favorable');
  });

  it('keeps long ratings out of visible text and in title', () => {
    const long = 'Mixed / Proceed with Awareness';
    const { container } = render(
      <VaultRankedDayChip
        dateLabel="10 Aug"
        score={64}
        band="supportive"
        bandLabel="Supportive"
        title={long}
      />,
    );
    expect(container.textContent).not.toContain(long);
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.getAttribute('title')).toBe(long);
  });

  it('omits null or empty rating from visible text', () => {
    const { container, rerender } = render(
      <VaultRankedDayChip
        dateLabel="6 Aug"
        score={54}
        band="lighter"
        bandLabel="Lighter"
        rating={null}
      />,
    );
    expect(container.textContent).toBe('6 Aug54 · Lighter');
    rerender(
      <VaultRankedDayChip
        dateLabel="6 Aug"
        score={54}
        band="lighter"
        bandLabel="Lighter"
        rating=""
      />,
    );
    expect(container.textContent).toBe('6 Aug54 · Lighter');
  });

  it('is non-interactive', () => {
    const { container } = render(
      <VaultRankedDayChip
        dateLabel="1 Aug"
        score={80}
        band="strongest"
        bandLabel="Strongest"
      />,
    );
    const chip = container.firstElementChild as HTMLElement;
    expect(chip.tagName).toBe('DIV');
    expect(chip.getAttribute('role')).toBeNull();
    expect(chip.getAttribute('tabindex')).toBeNull();
    expect(chip.onclick).toBeNull();
  });
});

describe('VaultYesDecisionSlot', () => {
  it('renders label, date, score, and band', () => {
    render(
      <VaultYesDecisionSlot
        label="Ask"
        dateLabel="1 Aug"
        score={100}
        band="strongest"
        bandLabel="Strongest"
      />,
    );
    expect(screen.getByText('Ask')).toBeTruthy();
    expect(screen.getByText(/1 Aug/)).toBeTruthy();
    expect(screen.getByText(/100/)).toBeTruthy();
    expect(screen.getByText(/Strongest/)).toBeTruthy();
  });

  it('keeps confidence and rating optional', () => {
    const { container, rerender } = render(
      <VaultYesDecisionSlot
        label="Commit"
        dateLabel="1 Aug"
        score={89}
        band="strongest"
        bandLabel="Strongest"
      />,
    );
    expect(container.textContent).not.toContain('high');
    expect(container.textContent).not.toContain('Favorable');
    rerender(
      <VaultYesDecisionSlot
        label="Commit"
        dateLabel="1 Aug"
        score={89}
        band="strongest"
        bandLabel="Strongest"
        confidence="high"
        rating="Highly Favorable"
      />,
    );
    expect(container.textContent).toContain('high');
    expect(container.textContent).toContain('Highly Favorable');
  });

  it('keeps duplicate-date slots separate when rendered together', () => {
    const { container } = render(
      <>
        <VaultYesDecisionSlot
          label="Ask"
          dateLabel="1 Aug"
          score={100}
          band="strongest"
          bandLabel="Strongest"
        />
        <VaultYesDecisionSlot
          label="Commit"
          dateLabel="1 Aug"
          score={89}
          band="strongest"
          bandLabel="Strongest"
        />
        <VaultYesDecisionSlot
          label="Sign"
          dateLabel="1 Aug"
          score={78}
          band="supportive"
          bandLabel="Supportive"
        />
      </>,
    );
    expect(container.querySelectorAll(':scope > div')).toHaveLength(3);
    expect(screen.getByText('Ask')).toBeTruthy();
    expect(screen.getByText('Commit')).toBeTruthy();
    expect(screen.getByText('Sign')).toBeTruthy();
  });

  it('does not force LTR layout', () => {
    const { container } = render(
      <div dir="rtl">
        <VaultYesDecisionSlot
          label="پرسیدن"
          dateLabel="۱۰ مرداد"
          score={100}
          band="strongest"
          bandLabel="قوی‌ترین"
        />
      </div>,
    );
    const slot = container.querySelector(':scope > div > div') as HTMLElement;
    expect(slot.getAttribute('dir')).toBeNull();
    expect(slot.getAttribute('style') || '').not.toMatch(/direction\s*:\s*ltr/i);
    expect(container.firstElementChild?.getAttribute('dir')).toBe('rtl');
  });

  it('is non-interactive', () => {
    const { container } = render(
      <VaultYesDecisionSlot
        label="Sign"
        dateLabel="1 Aug"
        score={78}
        band="supportive"
        bandLabel="Supportive"
      />,
    );
    const slot = container.firstElementChild as HTMLElement;
    expect(slot.tagName).toBe('DIV');
    expect(slot.getAttribute('role')).toBeNull();
    expect(slot.getAttribute('tabindex')).toBeNull();
    expect(slot.onclick).toBeNull();
  });
});
