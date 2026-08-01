import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  VAULT_HOME_CARD_ROLE,
  VAULT_HOME_HIDDEN_SECTIONS,
  VAULT_HOME_LANGS,
  VAULT_HOME_VISIBLE_ORDER,
} from './vault-home-i18n';
import { VAULT_SECTION_ORDER, isValidVaultSection } from './vault-section-i18n';

const LANGS = ['en', 'fa', 'ar', 'ru'] as const;

function homeBlob(lang: (typeof LANGS)[number]): string {
  const pack = VAULT_HOME_LANGS[lang];
  const cardText = VAULT_HOME_VISIBLE_ORDER.flatMap((key) => {
    const c = pack.cards[key];
    return [c.title, c.sub, c.preview, c.cta, c.badge];
  });
  return [
    pack.eyebrow,
    pack.title,
    pack.subtitle,
    pack.promise,
    pack.cta,
    pack.ctaInside,
    pack.ctaHint,
    pack.inside,
    pack.tapHint,
    ...cardText,
  ]
    .join(' ')
    .toLowerCase();
}

describe('Vault Home repositioning data', () => {
  it('keeps visible order Power → Provider → Shadow → Look → Sensuality', () => {
    expect([...VAULT_HOME_VISIBLE_ORDER]).toEqual([
      'power',
      'provider',
      'shadow',
      'look',
      'sensuality',
    ]);
  });

  it('hides Cycle and Lounge from home visibility lists', () => {
    expect(VAULT_HOME_VISIBLE_ORDER).not.toContain('cycle');
    expect(VAULT_HOME_VISIBLE_ORDER).not.toContain('lounge');
    expect([...VAULT_HOME_HIDDEN_SECTIONS]).toEqual(['cycle', 'lounge']);
  });

  it('marks Power as primary flagship and Sensuality as experimental', () => {
    expect(VAULT_HOME_CARD_ROLE.power).toBe('primary');
    expect(VAULT_HOME_CARD_ROLE.provider).toBe('secondary');
    expect(VAULT_HOME_CARD_ROLE.shadow).toBe('secondary');
    expect(VAULT_HOME_CARD_ROLE.look).toBe('secondary');
    expect(VAULT_HOME_CARD_ROLE.sensuality).toBe('experimental');
    for (const lang of LANGS) {
      expect(VAULT_HOME_LANGS[lang].cards.power.badge.length).toBeGreaterThan(0);
      expect(VAULT_HOME_LANGS[lang].cards.sensuality.badge.length).toBeGreaterThan(0);
    }
    expect(VAULT_HOME_LANGS.en.cards.power.badge).toMatch(/recommend/i);
    expect(VAULT_HOME_LANGS.en.cards.sensuality.badge).toMatch(/experimental/i);
  });

  it('matches card count and order across EN / FA / AR / RU', () => {
    for (const lang of LANGS) {
      const keys = VAULT_HOME_VISIBLE_ORDER;
      expect(Object.keys(VAULT_HOME_LANGS[lang].cards).sort()).toEqual(
        [...keys].sort(),
      );
      expect(keys.map((k) => VAULT_HOME_LANGS[lang].cards[k].title.length)).toEqual(
        keys.map(() => expect.any(Number)),
      );
      for (const key of keys) {
        expect(VAULT_HOME_LANGS[lang].cards[key].title.length).toBeGreaterThan(0);
        expect(VAULT_HOME_LANGS[lang].cards[key].preview.length).toBeGreaterThan(20);
        expect(VAULT_HOME_LANGS[lang].cards[key].cta.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps Sensuality home copy free of peak-hours / attraction-timing claims', () => {
    for (const lang of LANGS) {
      const s = VAULT_HOME_LANGS[lang].cards.sensuality;
      const blob = `${s.title} ${s.sub} ${s.preview} ${s.cta}`.toLowerCase();
      expect(blob).not.toMatch(/peak/);
      expect(blob).not.toMatch(/hour/);
      expect(blob).not.toMatch(/attraction today|ساعات اوج|ساعات الذروة|часы пика/);
      expect(blob).not.toMatch(/fantasy|фантаз|فانتزی|خيال/);
      expect(blob).not.toMatch(/magnetism|магнетизм|مگنتیسم/);
      expect(blob).toMatch(/mars|марс|مریخ|المريخ/);
    }
  });

  it('keeps home copy free of fertility / ovulation / period / hormone claims', () => {
    for (const lang of LANGS) {
      const blob = homeBlob(lang);
      expect(blob).not.toMatch(/fertil/);
      expect(blob).not.toMatch(/ovulat/);
      expect(blob).not.toMatch(/period/);
      expect(blob).not.toMatch(/hormone/);
      expect(blob).not.toMatch(/پریود|تخمک|هورمون|باروری/);
      expect(blob).not.toMatch(/الإباضة|الهرمون|الخصوبة/);
      expect(blob).not.toMatch(/овуляц|гормон|фертил|цикл с небом/);
    }
  });

  it('keeps home copy free of E2E / chat / verified-community claims', () => {
    for (const lang of LANGS) {
      const blob = homeBlob(lang);
      expect(blob).not.toMatch(/end-to-end|e2e|encrypted|encryption/);
      expect(blob).not.toMatch(/chat room|chatrooms|verified members/);
      expect(blob).not.toMatch(/pink lounge|لانژ صورتی|صالون الوردي/);
      expect(blob).not.toMatch(/шифр|зашифр|сквозн/);
      expect(blob).not.toMatch(/رمزنگاری|چت/);
      expect(blob).not.toMatch(/تشفير|محادث/);
    }
  });

  it('keeps home copy free of false Premium unlock claims', () => {
    for (const lang of LANGS) {
      const blob = homeBlob(lang);
      expect(blob).not.toMatch(/premium/);
      expect(blob).not.toMatch(/پریمیوم|премиум|بريميوم|البريميوم/);
      expect(blob).not.toMatch(/full features unlock|полный доступ откроется/);
      expect(VAULT_HOME_LANGS[lang].ctaHint.toLowerCase()).not.toMatch(
        /unlock|premium|премиум|پریمیوم|بريميوم/,
      );
    }
  });

  it('keeps Provider home copy free of future-spouse framing', () => {
    for (const lang of LANGS) {
      const p = VAULT_HOME_LANGS[lang].cards.provider;
      const blob = `${p.title} ${p.sub} ${p.preview} ${p.cta}`;
      expect(blob).not.toMatch(/husband|wife|spouse|fiancé|fiancée/i);
      expect(blob).not.toMatch(/شوهر|همسر آینده|زوج المستقبل/);
      expect(blob).not.toMatch(/chart calls|зовёт ваша карта|چارتت/i);
    }
  });

  it('positions home as Decision Intelligence, not an astrology chamber', () => {
    const en = homeBlob('en');
    expect(en).toMatch(/decision intelligence|next move|timing|signals|windows/);
    expect(en).not.toMatch(/private chamber|deepest.*astrology|sanctum|members only/);
    expect(en).not.toMatch(/astrology — desire|feature menu/);
    for (const lang of LANGS) {
      const blob = homeBlob(lang);
      expect(blob).not.toMatch(/members only|только для участников|فقط برای اعضا|للأعضاء فقط/);
    }
  });

  it('gives Power the clearest outcome CTA among home cards', () => {
    const en = VAULT_HOME_LANGS.en.cards;
    expect(en.power.cta.toLowerCase()).toMatch(/timing|window/);
    expect(en.sensuality.cta.toLowerCase()).toMatch(/limited/);
    expect(en.power.cta.length).toBeGreaterThan(en.look.cta.length - 5);
  });
});

describe('Vault Home page wiring', () => {
  it('renders only the home-visible order and marks roles', () => {
    const pageSource = readFileSync(
      resolve(__dirname, '../app/vault/page.tsx'),
      'utf8',
    );
    expect(pageSource).toContain('VAULT_HOME_VISIBLE_ORDER');
    expect(pageSource).toContain('VAULT_HOME_CARD_ROLE');
    expect(pageSource).toContain("from '@/lib/vault-home-i18n'");
    expect(pageSource).toContain('data-vault-home-card');
    expect(pageSource).toContain('data-vault-home-role');
    expect(pageSource).toContain('data-vault-home-badge');
    expect(pageSource).toContain('md:col-span-2');
    expect(pageSource).not.toContain("'cycle'");
    expect(pageSource).not.toContain("'lounge'");
    expect(pageSource).not.toContain('Full features unlock with Premium');
    expect(pageSource).not.toContain('Members only');
    expect(pageSource).not.toContain('fertile');
    expect(pageSource).not.toContain('End-to-end');
  });

  it('leaves Cycle and Lounge section routes valid and untouched in section order', () => {
    expect(isValidVaultSection('cycle')).toBe(true);
    expect(isValidVaultSection('lounge')).toBe(true);
    expect(VAULT_SECTION_ORDER).toContain('cycle');
    expect(VAULT_SECTION_ORDER).toContain('lounge');

    const sectionPage = readFileSync(
      resolve(__dirname, '../app/vault/[section]/page.tsx'),
      'utf8',
    );
    expect(sectionPage).toContain('isValidVaultSection');
    // Home-only order must not rewrite global section order consumed by destinations.
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
});
