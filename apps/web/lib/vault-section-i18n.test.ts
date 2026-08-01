import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  READING_UI,
  SECTION_LANGS,
  VAULT_SECTION_ORDER,
  isValidVaultSection,
} from './vault-section-i18n';

describe('Vault section presentation copy', () => {
  it('preserves the seven sections in product order', () => {
    expect(VAULT_SECTION_ORDER).toEqual([
      'sensuality',
      'cycle',
      'provider',
      'shadow',
      'look',
      'power',
      'lounge',
    ]);
  });

  it('exposes product subtitles for every locale', () => {
    const expected: Record<(typeof VAULT_SECTION_ORDER)[number], RegExp> = {
      sensuality: /desire|fantasy|magnetism/i,
      cycle: /wellness|awareness/i,
      provider: /security|resources|partnership/i,
      shadow: /signals|verdicts/i,
      look: /colour|color|scent|presentation/i,
      power: /confidence|money|distance/i,
      lounge: /editorial|intimacy|confidence|reflection|ritual/i,
    };

    for (const lang of ['en', 'fa', 'ar', 'ru'] as const) {
      for (const key of VAULT_SECTION_ORDER) {
        expect(SECTION_LANGS[lang][key].sub.length).toBeGreaterThan(20);
        expect(SECTION_LANGS[lang][key].items.length).toBeGreaterThanOrEqual(3);
        expect(SECTION_LANGS[lang][key].items.length).toBeLessThanOrEqual(5);
      }
    }
    for (const key of VAULT_SECTION_ORDER) {
      expect(SECTION_LANGS.en[key].sub).toMatch(expected[key]);
    }
  });

  it('uses practical takeaway labels', () => {
    expect(READING_UI.en.tryThis).toBe('Your next move');
    expect(READING_UI.fa.tryThis.length).toBeGreaterThan(0);
    expect(READING_UI.ar.tryThis.length).toBeGreaterThan(0);
    expect(READING_UI.ru.tryThis.length).toBeGreaterThan(0);
  });

  it('keeps cycle copy free of medical or fertility claims', () => {
    const en = SECTION_LANGS.en.cycle;
    const blob = [en.sub, en.intro, en.coming, ...en.items.map((i) => `${i.label} ${i.hint}`)]
      .join(' ')
      .toLowerCase();
    expect(blob).not.toContain('fertil');
    expect(blob).not.toContain('ovulat');
    expect(blob).not.toContain('contracept');
    expect(blob).not.toContain('pms');
    expect(blob).not.toContain('period');
    expect(blob).not.toContain('hormone');
    expect(blob).toContain('wellness');
  });

  it('completes Pink Lounge editorial copy without inventing producers', () => {
    const lounge = SECTION_LANGS.en.lounge;
    expect(lounge.sub).toContain('editorial');
    expect(lounge.intro.toLowerCase()).toMatch(/intimacy|confidence|reflection|ritual/);
    expect(lounge.items.map((i) => i.label)).toEqual([
      'Secret Circles',
      'Ask Julia (anon)',
      'Verified Queens',
      'Leave No Trace',
    ]);
  });

  it('keeps FA Provider title free of romantic-default spouse framing', () => {
    expect(SECTION_LANGS.fa.provider.title).toBe('حامی');
    expect(SECTION_LANGS.fa.provider.title).not.toContain('همسر آینده');
  });

  it('aligns live-module labels with producer semantics', () => {
    const sensuality = SECTION_LANGS.en.sensuality.items[0];
    expect(sensuality.label).toBe('Mars Desire Signature');
    expect(sensuality.label.toLowerCase()).toContain('mars');
    expect(sensuality.hint.toLowerCase()).toMatch(/mars|desire|pursuit/);
    expect(sensuality.label.toLowerCase()).not.toContain('fantasy');

    const wealth = SECTION_LANGS.en.provider.items[0];
    expect(wealth.label).toBe('Prosperity Geography');
    expect(wealth.label.toLowerCase()).toMatch(/geography|prosperity|resource/);
    expect(wealth.label.toLowerCase()).not.toContain('partner');
    expect(wealth.hint.toLowerCase()).toMatch(/place|expansion|resource/);

    const shadowLocked = SECTION_LANGS.en.shadow.items[3];
    expect(shadowLocked.label).toBe('Private Conversation Timing');
    expect(shadowLocked.label.toLowerCase()).not.toContain('secret');
    expect(shadowLocked.hint.toLowerCase()).toMatch(/reflection|private|conversation/);

    expect(SECTION_LANGS.ru.sensuality.items[0].label).toMatch(/Марс|марс/i);
    expect(SECTION_LANGS.fa.sensuality.items[0].label).toMatch(/مریخ/);
    expect(SECTION_LANGS.ar.sensuality.items[0].label).toMatch(/المريخ/);

    expect(SECTION_LANGS.ru.provider.items[0].label).toMatch(/География|география/);
    expect(SECTION_LANGS.fa.provider.items[0].label).toMatch(/جغرافیا/);
    expect(SECTION_LANGS.ar.provider.items[0].label).toMatch(/جغرافيا/);

    expect(SECTION_LANGS.ru.shadow.items[3].label).toMatch(/частн|разговор/i);
    expect(SECTION_LANGS.fa.shadow.items[3].label).toMatch(/گفت|خصوصی/);
    expect(SECTION_LANGS.ar.shadow.items[3].label).toMatch(/محادثة|خاصة/);
  });

  it('keeps i18n free of producer routing', () => {
    const i18nSource = readFileSync(resolve(__dirname, './vault-section-i18n.ts'), 'utf8');
    expect(i18nSource).not.toContain('LIVE_ITEM_API');
    expect(i18nSource).not.toContain('LIVE_READING_KEYS');
    expect(i18nSource).not.toContain('fetchVault');
  });

  it('keeps the section page consumer-only with page-local producer maps', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../app/vault/[section]/page.tsx'),
      'utf8',
    );
    expect(pageSource).toContain("from '@/lib/vault-reading'");
    expect(pageSource).toContain("from '@/lib/vault-section-i18n'");
    expect(pageSource).toContain("sensuality: ['mars']");
    expect(pageSource).toContain("power: ['hot', 'money', 'ghost', 'yes']");
    expect(pageSource).toContain("look: ['color', 'perfume', 'reel', 'outfit']");
    expect(pageSource).toContain(
      "provider: ['jupiter', 'countries', 'partner', 'compatibility']",
    );
    expect(pageSource).toContain("shadow: ['radar', 'trust', 'communication', '']");
    expect(pageSource).not.toContain('fetchNatalChart');
    expect(pageSource).not.toContain('buildLoungeReading');
    expect(pageSource).not.toContain('chart-api');
    expect(pageSource).not.toMatch(/LIVE_ITEM_API\s*=\s*\{[^}]*cycle/);
    expect(pageSource).not.toMatch(/LIVE_ITEM_API\s*=\s*\{[^}]*lounge/);
  });

  it('validates section keys', () => {
    expect(isValidVaultSection('lounge')).toBe(true);
    expect(isValidVaultSection('nope')).toBe(false);
    expect(isValidVaultSection(undefined)).toBe(false);
  });
});
