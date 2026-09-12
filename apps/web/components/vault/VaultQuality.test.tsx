import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { VaultConfidentialReading } from './VaultConfidentialReading';
import fixtures from './fixtures/quality-api.json';
import type { VaultReadingLayer } from '@/lib/vault-reading';
import { VAULT_READING_PRESENTATION_COPY } from '@/lib/vault-reading-presentation';
import { VAULT_AVAILABILITY } from '@/lib/vault-availability';
import { localizeFixedShortlistLabel } from '@/lib/vault-shortlist-labels';

afterEach(cleanup);

it('RU Heat Avoid names using a score to justify pressure, intimacy, or silence', () => {
  const heat = fixtures.ru['hot-attraction-days'] as VaultReadingLayer;
  expect(heat.avoid).toBe(
    'Использование оценки для оправдания давления, интимной близости или молчания',
  );
  expect(heat.avoid).not.toContain('ради оценки в календаре');
  expect(heat.executive).toContain(heat.avoid);
  expect(fixtures.en['hot-attraction-days'].avoid).toBe(
    'Using a score to justify pressure, intimacy or silence',
  );
});

for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  describe(`actual synthetic API rendering ${lang}`, () => {
    for (const [endpoint, fixture] of Object.entries(fixtures[lang])) {
      it(`${endpoint}: complete details, one limitation/action, no malformed or confidence prose`, () => {
        const reading = fixture as VaultReadingLayer;
        const { container } = render(<VaultConfidentialReading lang={lang} reading={reading} labels={VAULT_READING_PRESENTATION_COPY[lang]} confidenceLabel="high — clear enough to act on" />);
        expect(screen.getAllByText(reading.limitation!, { exact: true })).toHaveLength(1);
        expect(screen.getAllByText(reading.action!, { exact: true })).toHaveLength(1);
        const limitation = screen.getByTestId('vault-symbolic-limitation');
        expect(limitation.previousElementSibling).toBe(screen.getByTestId('vault-reading-hero-action'));
        expect(container.textContent).not.toMatch(/clear enough to act on|Advisory confidence|usable signal|if ignored|selective silence|peaks for reach|oriental overload/i);
        expect(container.textContent).not.toContain(reading.technical);
        expect(container.textContent).not.toContain('..');
        expect(container.textContent).not.toMatch(/will succeed|will attract|you are compatible|your partner is|avoid explaining the silence|pull back hardest/i);
        if (lang !== 'en') expect(container.textContent).not.toMatch(/\b(high|medium|low|moderate|excellent|good|harmony|mixed|tension|strong|subtle)\b/i);
        for (const leaf of container.querySelectorAll('p, dt, dd, h2, li')) {
          expect(leaf.textContent).toMatch(/[\p{L}\p{N}]/u);
        }
        for (const detail of reading.details ?? []) {
          const shownLabel = localizeFixedShortlistLabel(detail.label, lang);
          expect(screen.getAllByText(shownLabel, { exact: true })).toHaveLength(1);
          const row = screen.getByText(shownLabel, { exact: true }).parentElement!;
          const splitValue =
            (detail.label === 'Palette' ||
              detail.label === 'Палитра' ||
              detail.label === 'پالت' ||
              detail.label === 'الألوان' ||
              detail.label === 'Scent notes' ||
              detail.label === 'Ноты аромата' ||
              detail.label === 'نت‌های رایحه' ||
              detail.label === 'النغمات العطرية') &&
            detail.value.includes('·');
          if (splitValue) {
            for (const part of detail.value.split(/\s*·\s*/)) {
              expect(within(row).getAllByText(part, { exact: true }).length).toBeGreaterThan(0);
            }
          } else {
            expect(within(row).getAllByText(detail.value, { exact: true })).toHaveLength(1);
            if (detail.direction) expect(within(row).getByText(detail.value).getAttribute('dir')).toBe(detail.direction);
          }
          if (detail.reason) expect(screen.getAllByText(detail.reason, { exact: true })).toHaveLength(1);
        }
        expect(screen.getByTestId('vault-confidential-reading').dir).toBe(lang === 'fa' || lang === 'ar' ? 'rtl' : 'ltr');
      });
    }
    it('availability count distinguishes all available and mixed sections without entitlement promises', () => {
      const c = VAULT_AVAILABILITY[lang];
      expect(c.summary(4, 0)).toContain('4');
      expect(c.summary(3, 1)).toContain('3');
      expect(c.summary(3, 1)).toContain('1');
      expect(c.summary(1, 3)).not.toBe(c.summary(4, 0));
      if (lang === 'en') {
        expect(c.summary(1, 1)).toBe('1 reading is available. 1 planned tool is not yet available.');
        expect(c.summary(4, 0)).toBe('4 readings are available.');
      }
      expect(c.note).not.toMatch(/Premium|unlock|Coming soon/i);
      if (lang !== 'en') expect(c.live).not.toMatch(/LIVE|Available/);
    });
  });
}


for (const lang of ['en', 'ru', 'fa', 'ar'] as const) {
  it(`Date Outfit ${lang}: changing a returned window replaces exactly one visible row`, () => {
    const reading = fixtures[lang]['date-outfit'] as VaultReadingLayer;
    const row = reading.details!.find((detail) => detail.value.includes('–'))!;
    const props = { lang, reading, labels: VAULT_READING_PRESENTATION_COPY[lang] };
    const { rerender, container } = render(<VaultConfidentialReading {...props} />);
    expect(screen.getAllByText(row.value, { exact: true })).toHaveLength(1);
    const value = '09:00–10:00 · 31/100 · Asia/Tokyo';
    const changed = { ...reading, details: reading.details!.map((detail) => detail === row ? { ...detail, value } : detail) };
    rerender(<VaultConfidentialReading {...props} reading={changed} />);
    expect(screen.queryByText(row.value, { exact: true })).toBeNull();
    expect(screen.getAllByText(value, { exact: true })).toHaveLength(1);
    expect(container.textContent!.split('09:00–10:00')).toHaveLength(3);
    expect(screen.getAllByText(reading.limitation!, { exact: true })).toHaveLength(1);
  });
}
