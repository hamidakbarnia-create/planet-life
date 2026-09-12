import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';

import { VAULT_POWER_TIMING_COPY } from '@/lib/vault-section-i18n';
import {
  powerRankedDaysPresentation,
  vaultScoreBand,
} from '@/lib/vault-power-windows';

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

  it('marks only the caller-selected dominant day for visual hierarchy', () => {
    const { container, rerender } = render(
      <VaultRankedDayChip
        dateLabel="1 Aug"
        score={81}
        band="strongest"
        bandLabel="Strongest"
        dominant
      />,
    );
    expect(
      (container.firstElementChild as HTMLElement).getAttribute(
        'data-vault-day-dominant'
      )
    ).toBe('true');

    rerender(
      <VaultRankedDayChip
        dateLabel="2 Aug"
        score={82}
        band="strongest"
        bandLabel="Strongest"
      />,
    );
    expect(
      (container.firstElementChild as HTMLElement).getAttribute(
        'data-vault-day-dominant'
      )
    ).toBeNull();
  });
});

function renderRankedDays(scores: number[]) {
  const days = scores.map((score, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    score,
  }));
  const ranked = powerRankedDaysPresentation(days);
  const copy = VAULT_POWER_TIMING_COPY.en;
  const bandLabel = (band: 'strongest' | 'supportive' | 'lighter') =>
    band === 'strongest' ? copy.strongest : band === 'supportive' ? copy.supportive : copy.lighter;
  render(
    <div data-testid="heat-fixture">
      {days.map((day, dayIdx) => (
        <VaultRankedDayChip
          key={day.date}
          dateLabel={day.date}
          score={day.score}
          band={vaultScoreBand(day.score)}
          bandLabel={bandLabel(vaultScoreBand(day.score))}
          dominant={ranked.dominantIndex === dayIdx}
        />
      ))}
      <p data-testid="vault-score-direction">
        {ranked.allScoresEqual ? copy.equalScoreDays : copy.scoreDirection}
      </p>
    </div>,
  );
  return { ranked, copy };
}

describe('Heat Days top-score ties', () => {
  it('does not mark a dominant day for a 100/100/90 partial tie', () => {
    const { copy } = renderRankedDays([100, 100, 90]);
    const root = screen.getByTestId('heat-fixture');
    const chips = within(root).getAllByText(/2026-09-/).map((node) => node.parentElement as HTMLElement);
    expect(chips).toHaveLength(3);
    expect(chips.every((chip) => chip.getAttribute('data-vault-day-dominant') == null)).toBe(true);
    expect(screen.getByTestId('vault-score-direction').textContent).toBe(copy.scoreDirection);
    expect(screen.getByTestId('vault-score-direction').textContent).not.toBe(copy.equalScoreDays);
  });

  it('uses all-equal wording for 100/100/100 and marks no dominant day', () => {
    const { copy } = renderRankedDays([100, 100, 100]);
    const root = screen.getByTestId('heat-fixture');
    const chips = within(root).getAllByText(/2026-09-/).map((node) => node.parentElement as HTMLElement);
    expect(chips.every((chip) => chip.getAttribute('data-vault-day-dominant') == null)).toBe(true);
    expect(screen.getByTestId('vault-score-direction').textContent).toBe(copy.equalScoreDays);
  });

  it('marks only the unique 100 as dominant for 100/90/80', () => {
    const { copy } = renderRankedDays([100, 90, 80]);
    const root = screen.getByTestId('heat-fixture');
    const chips = within(root).getAllByText(/2026-09-/).map((node) => node.parentElement as HTMLElement);
    expect(chips[0].getAttribute('data-vault-day-dominant')).toBe('true');
    expect(chips[1].getAttribute('data-vault-day-dominant')).toBeNull();
    expect(chips[2].getAttribute('data-vault-day-dominant')).toBeNull();
    expect(screen.getByTestId('vault-score-direction').textContent).toBe(copy.scoreDirection);
  });

  it('marks a single day as uniquely highest without all-equal wording', () => {
    const { copy } = renderRankedDays([80]);
    const root = screen.getByTestId('heat-fixture');
    const chips = within(root).getAllByText(/2026-09-/).map((node) => node.parentElement as HTMLElement);
    expect(chips).toHaveLength(1);
    expect(chips[0].getAttribute('data-vault-day-dominant')).toBe('true');
    expect(screen.getByTestId('vault-score-direction').textContent).toBe(copy.scoreDirection);
    expect(screen.getByTestId('vault-score-direction').textContent).not.toBe(copy.equalScoreDays);
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
